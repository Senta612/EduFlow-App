import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type {
  PaymentRequest,
  SubscriptionPlan,
  SubscriptionState,
  TeacherSubscription,
} from '../types/subscription';

export interface UpiConfig {
  upiId: string;
  payeeName: string;
}

/**
 * Pure domain logic: Evaluate subscription object and compute real-time access status
 */
export function evaluateSubscription(
  subscription: TeacherSubscription | null,
  pendingRequest: PaymentRequest | null = null,
  referenceDate: Date = new Date(),
): SubscriptionState {
  if (!subscription) {
    return {
      subscription: null,
      isPro: false,
      isTrial: false,
      isExpired: false,
      isTrialEligible: true,
      daysRemaining: 0,
      expiryDateFormatted: null,
      pendingRequest,
      isLoading: false,
    };
  }

  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const isPastPeriod = periodEnd ? periodEnd.getTime() <= referenceDate.getTime() : false;

  // Status is active or trialing, and period end has not passed
  const isPro =
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    !isPastPeriod;

  const isTrial = subscription.plan === 'trial' && subscription.status === 'trialing' && !isPastPeriod;
  const isExpired = subscription.status === 'expired' || isPastPeriod;
  const isTrialEligible = !subscription.hasUsedTrial && !subscription.trialStart;

  let daysRemaining = 0;
  if (periodEnd && !isPastPeriod) {
    const diffMs = periodEnd.getTime() - referenceDate.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  let expiryDateFormatted: string | null = null;
  if (periodEnd) {
    expiryDateFormatted = periodEnd.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return {
    subscription,
    isPro,
    isTrial,
    isExpired,
    isTrialEligible,
    daysRemaining,
    expiryDateFormatted,
    pendingRequest,
    isLoading: false,
  };
}

/**
 * Pure domain logic: Calculate new billing period on approval (early renewal vs fresh start)
 */
export function calculateActivationPeriod(
  plan: 'monthly' | 'yearly',
  currentSubscription: TeacherSubscription | null,
  activationTime: Date = new Date(),
): { periodStart: Date; periodEnd: Date } {
  const durationDays = plan === 'yearly' ? 365 : 30;
  const durationMs = durationDays * 24 * 60 * 60 * 1000;

  // If subscription is currently active (and paid), extend from current_period_end
  if (
    currentSubscription &&
    currentSubscription.status === 'active' &&
    currentSubscription.currentPeriodEnd
  ) {
    const existingEnd = new Date(currentSubscription.currentPeriodEnd);
    if (existingEnd.getTime() > activationTime.getTime()) {
      return {
        periodStart: currentSubscription.currentPeriodStart
          ? new Date(currentSubscription.currentPeriodStart)
          : activationTime,
        periodEnd: new Date(existingEnd.getTime() + durationMs),
      };
    }
  }

  // Otherwise, starts fresh at activation time
  return {
    periodStart: activationTime,
    periodEnd: new Date(activationTime.getTime() + durationMs),
  };
}

/**
 * Pure domain logic: Generate unique payment reference ID
 */
export function generatePaymentReference(seedDate: Date = new Date(), randomHex = ''): string {
  const dateStr = seedDate.toISOString().slice(0, 10).replace(/-/g, '');
  const hex = randomHex || Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${dateStr}-${hex}`;
}

/**
 * Pure domain logic: Validate UPI transaction reference / UTR
 */
export function validateTransactionReference(rawRef: string): { valid: boolean; normalized: string; error?: string } {
  if (!rawRef) {
    return { valid: false, normalized: '', error: 'Transaction reference is required.' };
  }
  const normalized = rawRef.trim().toUpperCase();
  if (normalized.length < 6) {
    return { valid: false, normalized, error: 'Transaction reference must be at least 6 characters.' };
  }
  return { valid: true, normalized };
}

/**
 * Pure domain logic: Generate standard UPI intent URL
 */
export function buildUpiIntentUrl(
  config: UpiConfig,
  plan: 'monthly' | 'yearly',
  paymentReference: string,
): string {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: config.payeeName,
    am: planConfig.priceInRupees.toString(),
    cu: 'INR',
    tn: paymentReference,
  });
  return `upi://pay?${params.toString()}`;
}
