import { FeeStatus } from './teacher';

export type FeePaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface BatchFeeConfig {
  batchId: string;
  monthlyFee: number;
  dueDayOfMonth: number; // e.g. 5th of each month
  updatedAt?: string;
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  batchId: string;
  batchName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  forMonth: string; // e.g. "October 2026"
  mode: FeePaymentMode;
  remarks?: string;
  createdAt: string;
}

export interface StudentFeeDetail {
  studentId: string;
  studentName: string;
  rollNumber: string;
  parentPhone?: string;
  batchId: string;
  batchName: string;
  feeStatus: FeeStatus;
  monthlyFee: number;
  lastPayment?: FeePayment;
  totalPaid: number;
  dueAmount: number;
}

export interface TuitionFeeOverview {
  totalCollectedMonth: number;
  totalExpectedMonth: number;
  totalPendingMonth: number;
  paidStudentsCount: number;
  pendingStudentsCount: number;
  overdueStudentsCount: number;
  freeStudentsCount: number;
  collectionRate: number; // 0 - 100 percentage
}
