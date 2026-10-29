export type SubscriptionPlan = 'trial' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'pending' | 'cancelled';
export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface TeacherSubscription {
  id: string;
  teacherId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  hasUsedTrial: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  id: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  plan: 'monthly' | 'yearly';
  amountPaise: number;
  paymentReference: string;
  transactionReference: string;
  status: PaymentRequestStatus;
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  priceInRupees: number;
  amountPaise: number;
  durationDays: number;
  badge?: string;
  description: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  trial: {
    id: 'trial',
    name: '30-Day Pro Trial',
    priceInRupees: 0,
    amountPaise: 0,
    durationDays: 30,
    badge: 'Free',
    description: 'Experience all EduFlow Pro teaching features with zero commitment.',
    features: [
      'Unlimited batches & student enrollment',
      'Instant attendance tracking & PDF exports',
      'Homework assignments & submission grading',
      'Study material & document uploads',
      'Fee ledger & automated WhatsApp receipts',
      'Class timetable & student performance reports',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Pro Monthly',
    priceInRupees: 499,
    amountPaise: 49900,
    durationDays: 30,
    badge: 'Popular',
    description: 'Flexible monthly billing for active teachers and tutors.',
    features: [
      'Everything in Pro Trial',
      '30 days of uninterrupted teaching access',
      'Full tuition fee collection & receipts',
      'Student test performance analytics',
      'Cloud backup & multi-device sync',
      'Priority support for manual payment verification',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Pro Yearly',
    priceInRupees: 4999,
    amountPaise: 499900,
    durationDays: 365,
    badge: 'Best Value (Save ~17%)',
    description: 'Best value for dedicated educators — a complete 365 days of Pro.',
    features: [
      'Everything in Pro Monthly',
      '365 full days of access (2 months free)',
      'No monthly renewal hassle',
      'Guaranteed rate lock for 1 full academic year',
      'VIP payment review priority',
      'Unlimited batch & document storage',
    ],
  },
};

export interface SubscriptionState {
  subscription: TeacherSubscription | null;
  isPro: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isTrialEligible: boolean;
  daysRemaining: number;
  expiryDateFormatted: string | null;
  pendingRequest: PaymentRequest | null;
  isLoading: boolean;
}
