import {
  BatchFeeConfig,
  FeePayment,
  StudentFeeDetail,
  TuitionFeeOverview,
  FeePaymentMode,
} from '@/types/fee';
import { FeeStatus, Batch } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';
import { studentsService } from './students.service';

const DEFAULT_MONTHLY_FEE = 1500;
const DEFAULT_DUE_DAY = 5;

function getCurrentMonthString(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}${month}-${randomSuffix}`;
}

export class FeesService {
  // 1. Batch Fee Configuration
  async getBatchFeeConfig(batchId: string): Promise<BatchFeeConfig> {
    const configs = await getStored<Record<string, BatchFeeConfig>>(STORAGE_KEYS.FEE_CONFIGS, {});
    return (
      configs[batchId] || {
        batchId,
        monthlyFee: DEFAULT_MONTHLY_FEE,
        dueDayOfMonth: DEFAULT_DUE_DAY,
      }
    );
  }

  async getAllBatchFeeConfigs(): Promise<Record<string, BatchFeeConfig>> {
    return getStored<Record<string, BatchFeeConfig>>(STORAGE_KEYS.FEE_CONFIGS, {});
  }

  async saveBatchFeeConfig(
    batchId: string,
    monthlyFee: number,
    dueDayOfMonth: number = DEFAULT_DUE_DAY,
  ): Promise<BatchFeeConfig> {
    const configs = await getStored<Record<string, BatchFeeConfig>>(STORAGE_KEYS.FEE_CONFIGS, {});
    const updated: BatchFeeConfig = {
      batchId,
      monthlyFee,
      dueDayOfMonth,
      updatedAt: new Date().toISOString(),
    };
    configs[batchId] = updated;
    await setStored(STORAGE_KEYS.FEE_CONFIGS, configs);
    return updated;
  }

  // 2. Fee Payments Ledger
  async getFeePayments(batchId?: string, studentId?: string): Promise<FeePayment[]> {
    const payments = await getStored<FeePayment[]>(STORAGE_KEYS.FEES, []);
    let filtered = payments;
    if (batchId && batchId !== 'all') {
      filtered = filtered.filter((p) => p.batchId === batchId);
    }
    if (studentId) {
      filtered = filtered.filter((p) => p.studentId === studentId);
    }
    // Sort descending by date
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async recordPayment(data: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    batchId: string;
    batchName: string;
    amount: number;
    date: string;
    forMonth?: string;
    mode: FeePaymentMode;
    remarks?: string;
  }): Promise<FeePayment> {
    const payments = await getStored<FeePayment[]>(STORAGE_KEYS.FEES, []);
    const newPayment: FeePayment = {
      id: `fee_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber: generateReceiptNumber(),
      studentId: data.studentId,
      studentName: data.studentName,
      rollNumber: data.rollNumber,
      batchId: data.batchId,
      batchName: data.batchName,
      amount: data.amount,
      date: data.date,
      forMonth: data.forMonth || getCurrentMonthString(),
      mode: data.mode,
      remarks: data.remarks?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPayment, ...payments];
    await setStored(STORAGE_KEYS.FEES, updated);

    // Update student's fee status to 'paid'
    try {
      await studentsService.updateStudentFeeStatus(data.batchId, data.studentId, 'paid');
    } catch (e) {
      console.warn('Failed to auto-update student fee status:', e);
    }

    return newPayment;
  }

  async deletePayment(paymentId: string): Promise<void> {
    const payments = await getStored<FeePayment[]>(STORAGE_KEYS.FEES, []);
    const filtered = payments.filter((p) => p.id !== paymentId);
    await setStored(STORAGE_KEYS.FEES, filtered);
  }

  // 3. Aggregate Student Fee Details
  async getStudentFeeDetails(batchId?: string): Promise<StudentFeeDetail[]> {
    const [batches, allStudentsMap, feeConfigs, payments] = await Promise.all([
      batchesService.getBatches(),
      studentsService.getAllStudents(),
      this.getAllBatchFeeConfigs(),
      this.getFeePayments(),
    ]);

    const batchMap = new Map<string, Batch>();
    batches.forEach((b) => batchMap.set(b.id, b));

    const result: StudentFeeDetail[] = [];

    const targetBatchIds = batchId && batchId !== 'all' ? [batchId] : Object.keys(allStudentsMap);

    for (const bId of targetBatchIds) {
      const batch = batchMap.get(bId);
      const students = allStudentsMap[bId] || [];
      const config = feeConfigs[bId] || {
        batchId: bId,
        monthlyFee: DEFAULT_MONTHLY_FEE,
        dueDayOfMonth: DEFAULT_DUE_DAY,
      };

      for (const student of students) {
        const studentPayments = payments.filter((p) => p.studentId === student.id);
        const lastPayment = studentPayments[0];
        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);

        const feeStatus: FeeStatus = student.feeStatus || 'pending';
        let dueAmount = 0;
        if (feeStatus === 'pending' || feeStatus === 'overdue') {
          dueAmount = config.monthlyFee;
        }

        result.push({
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          parentPhone: student.parentPhone,
          batchId: bId,
          batchName: batch?.name || 'Class',
          feeStatus,
          monthlyFee: config.monthlyFee,
          lastPayment,
          totalPaid,
          dueAmount,
        });
      }
    }

    return result.sort((a, b) => {
      // Prioritize overdue, then pending, then paid, then free
      const order: Record<FeeStatus, number> = { overdue: 0, pending: 1, paid: 2, free: 3 };
      return (order[a.feeStatus] ?? 4) - (order[b.feeStatus] ?? 4);
    });
  }

  // 4. Tuition Fee Overview
  async getTuitionFeeOverview(batchId?: string): Promise<TuitionFeeOverview> {
    const studentDetails = await this.getStudentFeeDetails(batchId);
    const payments = await this.getFeePayments(batchId);

    const currentMonth = getCurrentMonthString();
    const currentMonthPayments = payments.filter(
      (p) => p.forMonth === currentMonth || p.date.startsWith(new Date().toISOString().slice(0, 7)),
    );

    const totalCollectedMonth = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let freeCount = 0;
    let totalExpectedMonth = 0;
    let totalPendingMonth = 0;

    for (const s of studentDetails) {
      if (s.feeStatus === 'free') {
        freeCount++;
        continue;
      }
      totalExpectedMonth += s.monthlyFee;

      if (s.feeStatus === 'paid') {
        paidCount++;
      } else if (s.feeStatus === 'overdue') {
        overdueCount++;
        totalPendingMonth += s.monthlyFee;
      } else {
        pendingCount++;
        totalPendingMonth += s.monthlyFee;
      }
    }

    const collectionRate =
      totalExpectedMonth > 0 ? Math.round((totalCollectedMonth / totalExpectedMonth) * 100) : 100;

    return {
      totalCollectedMonth,
      totalExpectedMonth,
      totalPendingMonth,
      paidStudentsCount: paidCount,
      pendingStudentsCount: pendingCount,
      overdueStudentsCount: overdueCount,
      freeStudentsCount: freeCount,
      collectionRate: Math.min(100, collectionRate),
    };
  }

  // 5. WhatsApp Templates
  formatFeeReminderWhatsAppMessage(params: {
    studentName: string;
    rollNumber: string;
    batchName: string;
    dueAmount: number;
    forMonth?: string;
    instituteName?: string;
    teacherName?: string;
    upiId?: string;
    language?: 'en' | 'hi' | 'gu';
  }): string {
    const lang = params.language || 'en';
    const month = params.forMonth || getCurrentMonthString();
    const institute = params.instituteName?.trim() || 'EduFlow Tuition Academy';

    if (lang === 'gu') {
      const lines = [
        `🏫 *${institute.toUpperCase()}*`,
        `📢 *ટ્યુશન ફી યાદી પત્રક* (${month})`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `નમસ્તે વાલીશ્રી,`,
        `આપના પાલ્ય *${params.studentName}* (રોલ નં: #${params.rollNumber}, બેચ: ${params.batchName}) ની માસિક ટ્યુશન ફી ની વિગત નીચે મુજબ છે:`,
        ``,
        `💰 *બાકી ફી રકમ:* ₹${params.dueAmount}`,
        `📅 *મહિનો:* ${month}`,
      ];

      if (params.upiId) {
        lines.push(`📲 *UPI પેમેન્ટ:* \`${params.upiId}\``);
      }

      lines.push(
        ``,
        `કૃપા કરીને સમયસર ફી જમા કરાવી સહકાર આપવા વિનંતી. જો ફી જમા કરાવી દીધી હોય તો આ સંદેશની અવગણના કરશો.`,
        `આભાર,`,
        `*${institute}*`,
      );
      return lines.join('\n');
    }

    if (lang === 'hi') {
      const lines = [
        `🏫 *${institute.toUpperCase()}*`,
        `📢 *ट्यूशन फीस स्मरण पत्र* (${month})`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `नमस्ते अभिभावक,`,
        `आपके बच्चे *${params.studentName}* (रोल नं: #${params.rollNumber}, बैच: ${params.batchName}) की मासिक ट्यूशन फीस की जानकारी:`,
        ``,
        `💰 *बकाया फीस राशि:* ₹${params.dueAmount}`,
        `📅 *माह:* ${month}`,
      ];

      if (params.upiId) {
        lines.push(`📲 *UPI भुगतान आईडी:* \`${params.upiId}\``);
      }

      lines.push(
        ``,
        `कृपया नियत समय में फीस जमा कराएं। यदि आप पहले ही भुगतान कर चुके हैं, तो कृपया इसे अनदेखा करें।`,
        `धन्यवाद,`,
        `*${institute}*`,
      );
      return lines.join('\n');
    }

    // Default English
    const lines = [
      `🏫 *${institute.toUpperCase()}*`,
      `📢 *TUITION FEE REMINDER* (${month})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Dear Parent,`,
      `This is a gentle reminder regarding the monthly tuition fee for your child:`,
      ``,
      `👤 *Student:* ${params.studentName}`,
      `🔢 *Roll No:* #${params.rollNumber} | 🏷️ *Batch:* ${params.batchName}`,
      `💰 *Pending Amount:* ₹${params.dueAmount}`,
      `📅 *Month:* ${month}`,
    ];

    if (params.upiId) {
      lines.push(`📲 *UPI Payment ID:* \`${params.upiId}\``);
    }

    lines.push(
      ``,
      `Kindly clear the pending dues at your earliest convenience. If already paid, please ignore this message.`,
      `Thank you,`,
      `*${institute}*`,
    );

    return lines.join('\n');
  }

  formatFeeReceiptWhatsAppMessage(params: {
    studentName: string;
    rollNumber: string;
    batchName: string;
    amount: number;
    receiptNumber: string;
    date: string;
    forMonth: string;
    mode: FeePaymentMode;
    instituteName?: string;
    teacherName?: string;
    language?: 'en' | 'hi' | 'gu';
  }): string {
    const lang = params.language || 'en';
    const institute = params.instituteName?.trim() || 'EduFlow Tuition Academy';
    const modeLabel = params.mode.toUpperCase();

    if (lang === 'gu') {
      return [
        `🏫 *${institute.toUpperCase()}*`,
        `🧾 *સત્તાવાર ફી પહોંચ (Fee Receipt)*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🧾 *પહોંચ નં:* ${params.receiptNumber}`,
        `📅 *તારીખ:* ${params.date}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 *વિદ્યાર્થી:* ${params.studentName}`,
        `🔢 *રોલ નં:* #${params.rollNumber} | 🏷️ *બેચ:* ${params.batchName}`,
        `💰 *પ્રાપ્ત રકમ:* ₹${params.amount}`,
        `🗓️ *મહિનો:* ${params.forMonth}`,
        `💳 *પેમેન્ટ મોડ:* ${modeLabel}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `✅ *સ્થિતિ:* ફી સફળતાપૂર્વક જમા થઈ ગઈ છે.`,
        `આભાર!`,
        `*${institute}*`,
      ].join('\n');
    }

    if (lang === 'hi') {
      return [
        `🏫 *${institute.toUpperCase()}*`,
        `🧾 *आधिकारिक फीस रसीद (Fee Receipt)*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🧾 *रसीद क्र.:* ${params.receiptNumber}`,
        `📅 *दिनांक:* ${params.date}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 *विद्यार्थी:* ${params.studentName}`,
        `🔢 *रोल नं:* #${params.rollNumber} | 🏷️ *बैच:* ${params.batchName}`,
        `💰 *प्राप्त राशि:* ₹${params.amount}`,
        `🗓️ *माह:* ${params.forMonth}`,
        `💳 *भुगतान प्रकार:* ${modeLabel}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `✅ *स्थिति:* फीस सफलतापूर्वक जमा की गई।`,
        `धन्यवाद!`,
        `*${institute}*`,
      ].join('\n');
    }

    return [
      `🏫 *${institute.toUpperCase()}*`,
      `🧾 *OFFICIAL FEE RECEIPT*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🧾 *Receipt No:* ${params.receiptNumber}`,
      `📅 *Date:* ${params.date}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Student:* ${params.studentName}`,
      `🔢 *Roll No:* #${params.rollNumber} | 🏷️ *Batch:* ${params.batchName}`,
      `💰 *Amount Received:* ₹${params.amount}`,
      `🗓️ *For Month:* ${params.forMonth}`,
      `💳 *Payment Mode:* ${modeLabel}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ *Status:* Payment Received & Recorded`,
      `Thank you for your timely payment!`,
      `*${institute}*`,
    ].join('\n');
  }
}

export const feesService = new FeesService();
