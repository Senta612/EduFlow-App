import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  PaymentRequest,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  SubscriptionState,
  SubscriptionStatus,
  TeacherSubscription,
} from '@/types/subscription';
import { paymentService } from './payment.service';
import { evaluateSubscription } from './subscription.domain';

const SUB_STORAGE_PREFIX = '@eduflow_teacher_sub_';

export class SubscriptionRequiredError extends Error {
  code = 'SUBSCRIPTION_EXPIRED';
  constructor(message = 'An active EduFlow Pro subscription is required to perform this action.') {
    super(message);
    this.name = 'SubscriptionRequiredError';
  }
}

type SubscriptionListener = (state: SubscriptionState) => void;

class SubscriptionService {
  private listeners = new Set<SubscriptionListener>();

  public subscribe(listener: SubscriptionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: SubscriptionState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.warn('Subscription listener error:', e);
      }
    });
  }

  /**
   * Fetch current subscription for teacher from Supabase with AsyncStorage cache fallback
   */
  async getSubscription(teacherId?: string): Promise<TeacherSubscription | null> {
    const targetId = teacherId || (await this.resolveCurrentTeacherId());
    if (!targetId) return null;

    // 1. Try remote fetch
    try {
      const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('teacher_id', targetId)
        .maybeSingle();

      if (!error && data) {
        const sub: TeacherSubscription = {
          id: data.id,
          teacherId: data.teacher_id,
          plan: data.plan as SubscriptionPlan,
          status: data.status as SubscriptionStatus,
          trialStart: data.trial_start,
          trialEnd: data.trial_end,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          hasUsedTrial: Boolean(data.has_used_trial),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Cache locally
        await AsyncStorage.setItem(`${SUB_STORAGE_PREFIX}${targetId}`, JSON.stringify(sub));
        return sub;
      }
    } catch (e) {
      console.warn('Remote subscription fetch warning:', e);
    }

    // 2. Fallback to cached subscription
    try {
      const cached = await AsyncStorage.getItem(`${SUB_STORAGE_PREFIX}${targetId}`);
      if (cached) {
        return JSON.parse(cached) as TeacherSubscription;
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Compute rich state (isPro, daysRemaining, trial eligibility, etc.)
   */
  async getSubscriptionState(teacherId?: string): Promise<SubscriptionState> {
    const targetId = teacherId || (await this.resolveCurrentTeacherId());
    if (!targetId) {
      return {
        subscription: null,
        isPro: false,
        isTrial: false,
        isExpired: false,
        isTrialEligible: false,
        daysRemaining: 0,
        expiryDateFormatted: null,
        pendingRequest: null,
        isLoading: false,
      };
    }

    const [subscription, pendingRequest] = await Promise.all([
      this.getSubscription(targetId),
      paymentService.getPendingRequest(targetId),
    ]);

    const state = this.evaluateSubscription(subscription, pendingRequest);
    return state;
  }

  /**
   * Pure evaluation of subscription object
   */
  public evaluateSubscription(
    subscription: TeacherSubscription | null,
    pendingRequest: PaymentRequest | null = null,
  ): SubscriptionState {
    return evaluateSubscription(subscription, pendingRequest);
  }

  /**
   * Start 30-Day Free Trial
   * Enforces server-side execution via RPC with local fallback for testing/offline
   */
  async startTrial(): Promise<TeacherSubscription> {
    const teacherId = await this.resolveCurrentTeacherId();
    if (!teacherId) {
      throw new Error('You must be signed in as a teacher to start a trial.');
    }

    // 1. Attempt server-side RPC (Single source of truth)
    try {
      const { data, error } = await supabase.rpc('start_teacher_trial');
      if (!error && data) {
        const sub: TeacherSubscription = {
          id: data.id,
          teacherId: data.teacher_id,
          plan: data.plan as SubscriptionPlan,
          status: data.status as SubscriptionStatus,
          trialStart: data.trial_start,
          trialEnd: data.trial_end,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          hasUsedTrial: Boolean(data.has_used_trial),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        await AsyncStorage.setItem(`${SUB_STORAGE_PREFIX}${teacherId}`, JSON.stringify(sub));
        const state = await this.getSubscriptionState(teacherId);
        this.notify(state);
        return sub;
      }

      if (error) {
        if (error.message.includes('already been used') || error.message.includes('Only teachers')) {
          throw new Error(error.message);
        }
        console.warn('RPC start_teacher_trial failed, falling back:', error.message);
      }
    } catch (e: any) {
      if (e.message?.includes('already been used') || e.message?.includes('Only teachers')) {
        throw e;
      }
      console.warn('RPC invocation error:', e);
    }

    // 2. Direct table fallback if RPC is not loaded in current database instance
    const existing = await this.getSubscription(teacherId);
    if (existing?.hasUsedTrial || existing?.trialStart) {
      throw new Error('Trial has already been activated for this account.');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newSubData = {
      teacher_id: teacherId,
      plan: 'trial' as const,
      status: 'trialing' as const,
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      has_used_trial: true,
      updated_at: now.toISOString(),
    };

    let savedSub: TeacherSubscription;

    try {
      const { data, error } = await supabase
        .from('teacher_subscriptions')
        .upsert(newSubData, { onConflict: 'teacher_id' })
        .select()
        .single();

      if (!error && data) {
        savedSub = {
          id: data.id,
          teacherId: data.teacher_id,
          plan: data.plan as SubscriptionPlan,
          status: data.status as SubscriptionStatus,
          trialStart: data.trial_start,
          trialEnd: data.trial_end,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          hasUsedTrial: Boolean(data.has_used_trial),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } else {
        throw new Error(error?.message || 'Failed to save trial to database');
      }
    } catch {
      // Local fallback for offline mode
      savedSub = {
        id: existing?.id || `sub-trial-${Date.now()}`,
        teacherId,
        plan: 'trial',
        status: 'trialing',
        trialStart: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: trialEnd.toISOString(),
        hasUsedTrial: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    }

    await AsyncStorage.setItem(`${SUB_STORAGE_PREFIX}${teacherId}`, JSON.stringify(savedSub));
    const state = await this.getSubscriptionState(teacherId);
    this.notify(state);
    return savedSub;
  }

  /**
   * Check entitlement for a teacher operation (batch creation, materials upload, etc.)
   */
  async checkEntitlement(): Promise<{ allowed: boolean; reason?: string }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If no user is logged in, or user is student, we allow student access without individual subscription
    if (!user) {
      return { allowed: true };
    }

    const state = await this.getSubscriptionState(user.id);
    if (!state.isPro) {
      return {
        allowed: false,
        reason: state.isExpired
          ? 'Your EduFlow Pro subscription or trial has expired. Please renew to continue creating batches and uploading materials.'
          : 'Please activate your 30-day free trial or subscribe to EduFlow Pro to unlock this feature.',
      };
    }

    return { allowed: true };
  }

  /**
   * Assert Pro entitlement; throws SubscriptionRequiredError if expired/not subscribed
   */
  async assertProEntitlement(actionName = 'perform this action'): Promise<void> {
    const check = await this.checkEntitlement();
    if (!check.allowed) {
      throw new SubscriptionRequiredError(
        check.reason || `An active EduFlow Pro subscription is required to ${actionName}.`,
      );
    }
  }

  private async resolveCurrentTeacherId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  }
}

export const subscriptionService = new SubscriptionService();
