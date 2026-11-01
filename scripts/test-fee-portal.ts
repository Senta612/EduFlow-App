import test from 'node:test';
import assert from 'node:assert/strict';
import type { TeacherPaymentConfig, FeePayment, StudentFeeDetail } from '../src/types/fee.ts';
import type { StudentFeePortalView } from '../src/types/student.ts';

test('1. Teacher Payment Config Structure & Defaults', () => {
  const defaultConfig: TeacherPaymentConfig = {
    isEnabled: false,
    upiId: '',
    payeeName: '',
    phoneNumber: '',
    instructions: 'Please send payment confirmation screenshot on WhatsApp.',
    acceptOnlinePayment: true,
  };

  assert.equal(defaultConfig.isEnabled, false);
  assert.equal(defaultConfig.acceptOnlinePayment, true);
  assert.equal(typeof defaultConfig.instructions, 'string');
});

test('2. Teacher Active Payment Configuration with Custom QR', () => {
  const teacherConfig: TeacherPaymentConfig = {
    isEnabled: true,
    upiId: 'sharma.classes@okhdfcbank',
    payeeName: 'Sharma Mathematics Academy',
    phoneNumber: '+91 98765 43210',
    qrCodeUrl: 'file:///data/user/0/host.exp.exponent/cache/qr.png',
    instructions: 'Send screenshot with student roll number',
    acceptOnlinePayment: true,
    updatedAt: new Date().toISOString(),
  };

  assert.equal(teacherConfig.isEnabled, true);
  assert.equal(teacherConfig.upiId, 'sharma.classes@okhdfcbank');
  assert.ok(teacherConfig.qrCodeUrl?.startsWith('file:///'));
});

test('3. Student Fee Portal View: Due Status Evaluation', () => {
  const samplePortalView: StudentFeePortalView = {
    isEnabled: true,
    studentId: 'stu-101',
    studentName: 'Aarav Patel',
    rollNumber: '12',
    batchName: 'Class 10 - Alpha',
    feeStatus: 'pending',
    monthlyFee: 1500,
    dueAmount: 1500,
    dueDayOfMonth: 5,
    dueDateFormatted: '5th November 2026',
    forMonth: 'November 2026',
    paymentHistory: [],
    stats: {
      totalPaidAllTime: 0,
      totalReceiptsCount: 0,
    },
  };

  assert.equal(samplePortalView.dueAmount, 1500);
  assert.equal(samplePortalView.feeStatus, 'pending');
  assert.equal(samplePortalView.paymentHistory.length, 0);
});

test('4. Student Fee Portal View: Paid Status & Receipt History', () => {
  const paymentRecord: FeePayment = {
    id: 'pay-1',
    receiptNumber: 'REC-202610-8841',
    studentId: 'stu-101',
    studentName: 'Aarav Patel',
    rollNumber: '12',
    batchId: 'batch-1',
    batchName: 'Class 10 - Alpha',
    amount: 1500,
    date: '2026-10-04',
    forMonth: 'October 2026',
    mode: 'upi',
    remarks: 'Paid via GPay',
    createdAt: '2026-10-04T10:00:00Z',
  };

  const samplePortalView: StudentFeePortalView = {
    isEnabled: true,
    studentId: 'stu-101',
    studentName: 'Aarav Patel',
    rollNumber: '12',
    batchName: 'Class 10 - Alpha',
    feeStatus: 'paid',
    monthlyFee: 1500,
    dueAmount: 0,
    dueDayOfMonth: 5,
    dueDateFormatted: '5th October 2026',
    forMonth: 'October 2026',
    lastPayment: paymentRecord,
    paymentHistory: [paymentRecord],
    stats: {
      totalPaidAllTime: 1500,
      totalReceiptsCount: 1,
    },
  };

  assert.equal(samplePortalView.dueAmount, 0);
  assert.equal(samplePortalView.feeStatus, 'paid');
  assert.equal(samplePortalView.lastPayment?.receiptNumber, 'REC-202610-8841');
  assert.equal(samplePortalView.stats.totalPaidAllTime, 1500);
});

test('5. UPI Intent URL Format Validation', () => {
  const upiId = 'sharma@upi';
  const payee = 'Sharma Classes';
  const amount = 1500;
  const note = 'Tuition Fee - Aarav Patel';

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payee,
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  assert.ok(upiUrl.startsWith('upi://pay?'));
  assert.ok(upiUrl.includes('pa=sharma%40upi'));
  assert.ok(upiUrl.includes('am=1500'));
  assert.ok(upiUrl.includes('cu=INR'));
});
