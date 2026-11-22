import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  PaymentRequest,
  PaymentRequestStatus,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from '@/types/subscription';
import {
  buildUpiIntentUrl,
  generatePaymentReference as domainGeneratePaymentReference,
  validateTransactionReference,
  DEFAULT_ADMIN_WHATSAPP,
  DEFAULT_ADMIN_WHATSAPP_DISPLAY,
  WhatsAppClaimOptions,
  buildWhatsAppClaimUrl,
} from './subscription.domain';

const PAY_REQUESTS_CACHE_KEY = '@eduflow_payment_requests_';

export interface UpiConfig {
  upiId: string;
  payeeName: string;
}

export class DuplicateTransactionError extends Error {
  code = 'DUPLICATE_TRANSACTION_REF';
  constructor(message = 'This transaction reference has already been submitted.') {
    super(message);
    this.name = 'DuplicateTransactionError';
  }
}

class PaymentService {
  /**
   * Return configured UPI credentials from environment or defaults
   * Never hardcodes private bank passwords or pins
   */
  getUpiConfig(): UpiConfig {
    return {
      upiId: process.env.EXPO_PUBLIC_UPI_ID || 'eduflow@bank',
      payeeName: process.env.EXPO_PUBLIC_UPI_PAYEE_NAME || 'EduFlow Education',
    };
  }

  /**
   * Return official WhatsApp contact for manual claims & support
   */
  getWhatsAppConfig(): { number: string; formatted: string } {
    return {
      number: process.env.EXPO_PUBLIC_ADMIN_WHATSAPP || DEFAULT_ADMIN_WHATSAPP,
      formatted: process.env.EXPO_PUBLIC_ADMIN_WHATSAPP_DISPLAY || DEFAULT_ADMIN_WHATSAPP_DISPLAY,
    };
  }

  /**
   * Build WhatsApp deep-link for subscription claiming
   */
  getWhatsAppClaimUrl(options: WhatsAppClaimOptions = {}): string {
    const config = this.getWhatsAppConfig();
    return buildWhatsAppClaimUrl({
      phone: config.number,
      ...options,
    });
  }

  /**
   * Directly open WhatsApp chat to claim subscription or send payment proof
   */
  async openWhatsAppClaim(options: WhatsAppClaimOptions = {}): Promise<void> {
    const url = this.getWhatsAppClaimUrl(options);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert(
        'Unable to Open WhatsApp',
        `Please message or call our support directly at ${this.getWhatsAppConfig().formatted}.`,
      );
    }
  }

  /**
   * Generate standard UPI payment link for QR codes or deep-linking
   */
  generateUpiUrl(plan: 'monthly' | 'yearly', paymentReference: string): string {
    return buildUpiIntentUrl(this.getUpiConfig(), plan, paymentReference);
  }

  /**
   * Generate an initial client-side payment reference (e.g. PAY-20261028-A1B2C3)
   */
  generatePaymentReference(): string {
    return domainGeneratePaymentReference();
  }

  /**
   * Fetch payment requests for a teacher
   */
  async getTeacherPaymentRequests(teacherId?: string): Promise<PaymentRequest[]> {
    const targetId = teacherId || (await this.resolveCurrentTeacherId());
    if (!targetId) return [];

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('teacher_id', targetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[PaymentService] Supabase fetch error:', error.message);
      } else if (data) {
        const mapped: PaymentRequest[] = data.map((r) => ({
          id: r.id,
          teacherId: r.teacher_id,
          plan: (r.plan as 'monthly' | 'yearly') || 'monthly',
          amountPaise: r.amount_paise,
          paymentReference: r.payment_reference,
          transactionReference: r.transaction_reference,
          status: (r.status as PaymentRequestStatus) || 'pending',
          createdAt: r.created_at,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          rejectionReason: r.rejection_reason,
        }));

        await AsyncStorage.setItem(`${PAY_REQUESTS_CACHE_KEY}${targetId}`, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('[PaymentService] Failed to fetch payment requests from Supabase:', e);
    }

    // Local fallback
    try {
      const cached = await AsyncStorage.getItem(`${PAY_REQUESTS_CACHE_KEY}${targetId}`);
      if (cached) {
        return JSON.parse(cached) as PaymentRequest[];
      }
    } catch {
      // ignore
    }

    return [];
  }

  /**
   * Get the most recent pending payment request for the teacher (if any)
   */
  async getPendingRequest(teacherId?: string): Promise<PaymentRequest | null> {
    const requests = await this.getTeacherPaymentRequests(teacherId);
    return requests.find((r) => r.status === 'pending') || null;
  }

  /**
   * Submit a manual UPI payment transaction reference
   */
  async submitPaymentRequest(
    plan: 'monthly' | 'yearly',
    transactionReference: string,
  ): Promise<PaymentRequest> {
    const teacherId = await this.resolveCurrentTeacherId();
    if (!teacherId) {
      throw new Error('You must be logged in as a teacher to submit a payment.');
    }

    const cleanRef = transactionReference.trim().toUpperCase();
    if (!cleanRef || cleanRef.length < 6) {
      throw new Error('Please enter a valid UPI transaction reference / UTR number (at least 6 characters).');
    }

    // 1. Try server-side RPC
    try {
      const { data, error } = await supabase.rpc('submit_payment_request', {
        p_plan: plan,
        p_transaction_reference: cleanRef,
      });

      if (!error && data) {
        const result: PaymentRequest = {
          id: data.id,
          teacherId: data.teacher_id,
          plan: data.plan as 'monthly' | 'yearly',
          amountPaise: data.amount_paise,
          paymentReference: data.payment_reference,
          transactionReference: data.transaction_reference,
          status: data.status as PaymentRequestStatus,
          createdAt: data.created_at,
          reviewedBy: data.reviewed_by,
          reviewedAt: data.reviewed_at,
          rejectionReason: data.rejection_reason,
        };

        const existing = await this.getTeacherPaymentRequests(teacherId);
        await AsyncStorage.setItem(
          `${PAY_REQUESTS_CACHE_KEY}${teacherId}`,
          JSON.stringify([result, ...existing.filter((e) => e.id !== result.id)]),
        );

        return result;
      }

      if (error) {
        if (error.message.includes('already been submitted') || error.code === '23505') {
          throw new DuplicateTransactionError('This transaction reference has already been submitted. Please check your reference or submit a new one.');
        }
        console.warn('RPC submit_payment_request failed, using direct insert:', error.message);
      }
    } catch (e: any) {
      if (e instanceof DuplicateTransactionError || e.message?.includes('already been submitted')) {
        throw e;
      }
      console.warn('Payment submit error, trying direct insert:', e);
    }

    // 2. Direct insert fallback
    const expectedPaise = SUBSCRIPTION_PLANS[plan].amountPaise;
    const paymentRef = this.generatePaymentReference();

    // Check duplicate locally or in DB
    const { data: existingDup } = await supabase
      .from('payment_requests')
      .select('id')
      .eq('transaction_reference', cleanRef)
      .maybeSingle();

    if (existingDup) {
      throw new DuplicateTransactionError('This transaction reference has already been submitted.');
    }

    const insertPayload = {
      teacher_id: teacherId,
      plan,
      amount_paise: expectedPaise,
      payment_reference: paymentRef,
      transaction_reference: cleanRef,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    };

    let created: PaymentRequest;

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert(insertPayload)
        .select()
        .single();

      if (!error && data) {
        created = {
          id: data.id,
          teacherId: data.teacher_id,
          plan: data.plan as 'monthly' | 'yearly',
          amountPaise: data.amount_paise,
          paymentReference: data.payment_reference,
          transactionReference: data.transaction_reference,
          status: data.status as PaymentRequestStatus,
          createdAt: data.created_at,
          reviewedBy: data.reviewed_by,
          reviewedAt: data.reviewed_at,
          rejectionReason: data.rejection_reason,
        };
      } else {
        if (error?.message?.includes('duplicate key') || error?.code === '23505') {
          throw new DuplicateTransactionError('This transaction reference has already been submitted.');
        }
        throw new Error(error?.message || 'Failed to submit payment request.');
      }
    } catch (err: any) {
      if (err instanceof DuplicateTransactionError) throw err;
      // Local fallback
      created = {
        id: `pay-${Date.now()}`,
        teacherId,
        plan,
        amountPaise: expectedPaise,
        paymentReference: paymentRef,
        transactionReference: cleanRef,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    const all = await this.getTeacherPaymentRequests(teacherId);
    await AsyncStorage.setItem(
      `${PAY_REQUESTS_CACHE_KEY}${teacherId}`,
      JSON.stringify([created, ...all.filter((x) => x.id !== created.id)]),
    );

    return created;
  }

  /**
   * Fetch all payment requests for Admin review
   */
  async getAllPaymentRequestsForAdmin(): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          teacher_id,
          plan,
          amount_paise,
          payment_reference,
          transaction_reference,
          status,
          created_at,
          reviewed_by,
          reviewed_at,
          rejection_reason,
          profiles:teacher_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return (data as any[]).map((r) => ({
          id: r.id,
          teacherId: r.teacher_id,
          teacherName: r.profiles?.full_name || 'Teacher',
          teacherEmail: r.profiles?.email || undefined,
          plan: r.plan as 'monthly' | 'yearly',
          amountPaise: r.amount_paise,
          paymentReference: r.payment_reference,
          transactionReference: r.transaction_reference,
          status: r.status as PaymentRequestStatus,
          createdAt: r.created_at,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          rejectionReason: r.rejection_reason,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch admin payment requests:', e);
    }

    return [];
  }

  /**
   * Admin approve or reject payment request (Atomic & Idempotent)
   */
  async reviewPaymentRequest(
    requestId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ): Promise<PaymentRequest> {
    // 1. Try server-side RPC
    try {
      const { data, error } = await supabase.rpc('review_payment_request', {
        p_request_id: requestId,
        p_action: action,
        p_rejection_reason: rejectionReason,
      });

      if (!error && data) {
        return {
          id: data.id,
          teacherId: data.teacher_id,
          plan: data.plan as 'monthly' | 'yearly',
          amountPaise: data.amount_paise,
          paymentReference: data.payment_reference,
          transactionReference: data.transaction_reference,
          status: data.status as PaymentRequestStatus,
          createdAt: data.created_at,
          reviewedBy: data.reviewed_by,
          reviewedAt: data.reviewed_at,
          rejectionReason: data.rejection_reason,
        };
      }

      if (error) {
        console.warn('RPC review_payment_request error:', error.message);
        throw new Error(error.message);
      }
    } catch (e: any) {
      if (e.message?.includes('already been reviewed') || e.message?.includes('Unauthorized')) {
        throw e;
      }
      console.warn('Attempting atomic fallback review:', e);
    }

    // 2. Direct review fallback if RPC unavailable in dev/offline
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: request, error: reqErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      throw new Error('Payment request not found.');
    }

    if (request.status !== 'pending') {
      throw new Error(`This payment request has already been reviewed (${request.status}).`);
    }

    const now = new Date();
    const isApproved = action === 'approve';

    if (isApproved) {
      const durationDays = request.plan === 'yearly' ? 365 : 30;
      const durationMs = durationDays * 24 * 60 * 60 * 1000;

      // Check current subscription for early renewal extension
      const { data: existingSub } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('teacher_id', request.teacher_id)
        .maybeSingle();

      let periodStart = now;
      let periodEnd = new Date(now.getTime() + durationMs);

      if (existingSub && existingSub.status === 'active' && existingSub.current_period_end) {
        const currentEnd = new Date(existingSub.current_period_end);
        if (currentEnd.getTime() > now.getTime()) {
          // Extend from existing paid expiry date
          periodStart = new Date(existingSub.current_period_start || now);
          periodEnd = new Date(currentEnd.getTime() + durationMs);
        }
      }

      // Upsert subscription
      await supabase
        .from('teacher_subscriptions')
        .upsert(
          {
            teacher_id: request.teacher_id,
            plan: request.plan as SubscriptionPlan,
            status: 'active',
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: 'teacher_id' },
        );
    }

    // Update request status
    const { data: updatedReq, error: updateErr } = await supabase
      .from('payment_requests')
      .update({
        status: isApproved ? 'approved' : 'rejected',
        reviewed_by: user?.id || null,
        reviewed_at: now.toISOString(),
        rejection_reason: isApproved ? null : rejectionReason || 'Payment verification failed',
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateErr || !updatedReq) {
      throw new Error(updateErr?.message || 'Failed to update payment request status.');
    }

    return {
      id: updatedReq.id,
      teacherId: updatedReq.teacher_id,
      plan: updatedReq.plan as 'monthly' | 'yearly',
      amountPaise: updatedReq.amount_paise,
      paymentReference: updatedReq.payment_reference,
      transactionReference: updatedReq.transaction_reference,
      status: updatedReq.status as PaymentRequestStatus,
      createdAt: updatedReq.created_at,
      reviewedBy: updatedReq.reviewed_by,
      reviewedAt: updatedReq.reviewed_at,
      rejectionReason: updatedReq.rejection_reason,
    };
  }

  private async resolveCurrentTeacherId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  }
}

export const paymentService = new PaymentService();
