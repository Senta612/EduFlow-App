import test from 'node:test';
import assert from 'node:assert/strict';

// Import domain logic and configurations
import { SUBSCRIPTION_PLANS, SubscriptionPlan, TeacherSubscription, PaymentRequest } from '../src/types/subscription.ts';
import { subscriptionService } from '../src/services/subscription.service.ts';
import { paymentService } from '../src/services/payment.service.ts';

test('1. Plan Pricing and Duration Specifications', () => {
  // Free trial specifications
  assert.equal(SUBSCRIPTION_PLANS.trial.priceInRupees, 0);
  assert.equal(SUBSCRIPTION_PLANS.trial.amountPaise, 0);
  assert.equal(SUBSCRIPTION_PLANS.trial.durationDays, 30);

  // Pro Monthly specifications
  assert.equal(SUBSCRIPTION_PLANS.monthly.priceInRupees, 499);
  assert.equal(SUBSCRIPTION_PLANS.monthly.amountPaise, 49900);
  assert.equal(SUBSCRIPTION_PLANS.monthly.durationDays, 30);

  // Pro Yearly specifications
  assert.equal(SUBSCRIPTION_PLANS.yearly.priceInRupees, 4999);
  assert.equal(SUBSCRIPTION_PLANS.yearly.amountPaise, 499900);
  assert.equal(SUBSCRIPTION_PLANS.yearly.durationDays, 365);
});

test('2. New Teacher Trial Eligibility', () => {
  // A brand new teacher with no subscription record
  const state = subscriptionService.evaluateSubscription(null);
  assert.equal(state.isTrialEligible, true);
  assert.equal(state.isPro, false);
  assert.equal(state.isTrial, false);
  assert.equal(state.isExpired, false);
  assert.equal(state.daysRemaining, 0);
});

test('3. Active 30-Day Pro Trial Evaluation', () => {
  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // 25 days left

  const sub: TeacherSubscription = {
    id: 'sub-1',
    teacherId: 'teacher-123',
    plan: 'trial',
    status: 'trialing',
    trialStart: now.toISOString(),
    trialEnd: futureExpiry.toISOString(),
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: futureExpiry.toISOString(),
    hasUsedTrial: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const state = subscriptionService.evaluateSubscription(sub);
  assert.equal(state.isPro, true);
  assert.equal(state.isTrial, true);
  assert.equal(state.isExpired, false);
  assert.equal(state.isTrialEligible, false); // Cannot use trial again
  assert.equal(state.daysRemaining, 25);
  assert.ok(state.expiryDateFormatted);
});

test('4. One Trial Per Account - Repeated Trial Prevention', () => {
  // A teacher whose trial has already ended or hasUsedTrial = true
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const sub: TeacherSubscription = {
    id: 'sub-expired-trial',
    teacherId: 'teacher-456',
    plan: 'trial',
    status: 'expired',
    trialStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    trialEnd: pastDate.toISOString(),
    currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: pastDate.toISOString(),
    hasUsedTrial: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const state = subscriptionService.evaluateSubscription(sub);
  assert.equal(state.isTrialEligible, false, 'Teacher who already used trial must not be trial eligible');
  assert.equal(state.isPro, false, 'Expired trial must not have Pro access');
  assert.equal(state.isExpired, true, 'Status should be marked expired');
  assert.equal(state.daysRemaining, 0);
});

test('5. Pending Payment Does NOT Unlock Pro Entitlements', () => {
  const pendingReq: PaymentRequest = {
    id: 'req-pending-1',
    teacherId: 'teacher-789',
    plan: 'monthly',
    amountPaise: 49900,
    paymentReference: 'PAY-20261028-TEST01',
    transactionReference: 'UTR123456789012',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Teacher has no active subscription yet, but has submitted a payment request
  const state = subscriptionService.evaluateSubscription(null, pendingReq);
  assert.equal(state.isPro, false, 'Pending payment must not prematurely activate Pro');
  assert.equal(state.pendingRequest?.status, 'pending');
  assert.equal(state.pendingRequest?.amountPaise, 49900);
});

test('6. Early Renewal Extension from Existing Paid Period End', () => {
  const now = new Date();
  // Existing subscription is active with 10 days left
  const currentEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const monthlyDurationMs = 30 * 24 * 60 * 60 * 1000;

  // When extending an active paid subscription, extension starts from currentEnd
  const extendedEnd = new Date(currentEnd.getTime() + monthlyDurationMs);

  const sub: TeacherSubscription = {
    id: 'sub-active-monthly',
    teacherId: 'teacher-999',
    plan: 'monthly',
    status: 'active',
    trialStart: null,
    trialEnd: null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: extendedEnd.toISOString(),
    hasUsedTrial: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const state = subscriptionService.evaluateSubscription(sub);
  assert.equal(state.isPro, true);
  assert.equal(state.isTrial, false);
  // Expect roughly 40 days (10 remaining + 30 added)
  assert.equal(state.daysRemaining, 40);
});

test('7. Expired Subscription Renewal Starts at Activation Time', () => {
  const now = new Date();
  const yearlyDurationMs = 365 * 24 * 60 * 60 * 1000;
  const newPeriodEnd = new Date(now.getTime() + yearlyDurationMs);

  const sub: TeacherSubscription = {
    id: 'sub-renewed-yearly',
    teacherId: 'teacher-renewed',
    plan: 'yearly',
    status: 'active',
    trialStart: null,
    trialEnd: null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: newPeriodEnd.toISOString(),
    hasUsedTrial: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const state = subscriptionService.evaluateSubscription(sub);
  assert.equal(state.isPro, true);
  assert.equal(state.daysRemaining, 365);
  assert.equal(state.isExpired, false);
});

test('8. Rejection of Payment Request Does NOT Unlock Pro', () => {
  const rejectedReq: PaymentRequest = {
    id: 'req-rejected-1',
    teacherId: 'teacher-rej',
    plan: 'yearly',
    amountPaise: 499900,
    paymentReference: 'PAY-20261028-REJ001',
    transactionReference: 'INVALID_UTR_999',
    status: 'rejected',
    createdAt: new Date().toISOString(),
    rejectionReason: 'UTR not found in bank statement',
  };

  const state = subscriptionService.evaluateSubscription(null, rejectedReq);
  assert.equal(state.isPro, false, 'Rejected payment must not unlock Pro');
  assert.equal(state.pendingRequest?.status, 'rejected');
  assert.equal(state.pendingRequest?.rejectionReason, 'UTR not found in bank statement');
});

test('9. UPI Configuration and Intent URI Generation', () => {
  const config = paymentService.getUpiConfig();
  assert.ok(config.upiId, 'UPI ID must be configured');
  assert.ok(config.payeeName, 'Payee name must be configured');

  // Test Monthly UPI URL
  const paymentRef = 'PAY-20261028-ABC123';
  const monthlyUrl = paymentService.generateUpiUrl('monthly', paymentRef);
  assert.ok(monthlyUrl.startsWith('upi://pay?'), 'Must generate standard upi:// format');
  assert.ok(monthlyUrl.includes('am=499'), 'Must contain exact monthly price ₹499');
  assert.ok(monthlyUrl.includes('cu=INR'), 'Currency must be INR');
  assert.ok(monthlyUrl.includes(`tn=${paymentRef}`), 'Transaction note must include reference ID');

  // Test Yearly UPI URL
  const yearlyUrl = paymentService.generateUpiUrl('yearly', paymentRef);
  assert.ok(yearlyUrl.includes('am=4999'), 'Must contain exact yearly price ₹4,999');
});

test('10. Unique Payment Reference Format', () => {
  const ref1 = paymentService.generatePaymentReference();
  const ref2 = paymentService.generatePaymentReference();

  assert.match(ref1, /^PAY-\d{8}-[A-Z0-9]+$/, 'Must match PAY-YYYYMMDD-XXXXXX format');
  assert.notEqual(ref1, ref2, 'Consecutive references must be distinct');
});
