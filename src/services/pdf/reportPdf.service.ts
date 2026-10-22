import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { StudentProfileData } from '@/types/teacher';
import { FeePayment } from '@/types/fee';

export class ReportPdfService {
  /**
   * Generates a high-quality, printable HTML document for a Student Progress Report
   */
  generateStudentReportHtml(params: {
    data: StudentProfileData;
    instituteName?: string;
    teacherName?: string;
    periodName?: string;
    remarks?: string;
    nextMonthFocus?: string;
  }): string {
    const { data } = params;
    const institute = params.instituteName?.trim() || 'EduFlow Tuition Academy';
    const teacher = params.teacherName?.trim() || 'Class Instructor';
    const period = params.periodName?.trim() || 'Monthly Progress Evaluation';
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Test rows
    const testRows =
      data.tests.items.length > 0
        ? data.tests.items
            .map(
              (t, idx) => `
          <tr style="border-bottom: 1px solid #E2E8F0; ${idx % 2 === 1 ? 'background-color: #F8FAFC;' : ''}">
            <td style="padding: 10px 14px; font-weight: 500; color: #1E293B;">${t.title}</td>
            <td style="padding: 10px 14px; color: #64748B;">${t.date}</td>
            <td style="padding: 10px 14px; text-align: center; font-weight: 600; color: #0F172A;">
              ${t.marksObtained !== null ? `${t.marksObtained} / ${t.maxMarks}` : 'Absent'}
            </td>
            <td style="padding: 10px 14px; text-align: center; color: #2563EB; font-weight: 700;">
              ${t.percentage !== null ? `${t.percentage}%` : '-'}
            </td>
            <td style="padding: 10px 14px; text-align: center;">
              <span style="background: #EFF6FF; color: #1D4ED8; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;">
                ${t.gradeBadge}
              </span>
            </td>
          </tr>
        `,
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #94A3B8;">No formal tests conducted during this period.</td></tr>`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Student Progress Report - ${data.student.name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 16mm 14mm 16mm 14mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              margin: 0;
              padding: 0;
              background-color: #FFFFFF;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-card {
              border-bottom: 3px solid #2563EB;
              padding-bottom: 14px;
              margin-bottom: 18px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .badge-grade {
              background: #2563EB;
              color: #FFFFFF;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 18px;
              font-weight: 800;
              text-align: center;
              letter-spacing: 0.5px;
            }
            .student-info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 14px 18px;
              margin-bottom: 20px;
            }
            .metric-box {
              background: #FFFFFF;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 12px 14px;
              text-align: center;
            }
            .metric-val {
              font-size: 20px;
              font-weight: 800;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              margin-bottom: 20px;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              overflow: hidden;
            }
            th {
              background-color: #F1F5F9;
              color: #475569;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 14px;
              text-align: left;
            }
            .box-card {
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 14px;
            }
            .signature-area {
              margin-top: 36px;
              display: flex;
              justify-content: space-between;
              padding: 0 20px;
            }
            .sig-line {
              border-top: 1.5px dashed #94A3B8;
              width: 180px;
              text-align: center;
              padding-top: 6px;
              font-size: 11px;
              color: #64748B;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header-card">
            <div>
              <div style="font-size: 22px; font-weight: 900; color: #1E3A8A; letter-spacing: -0.5px;">
                ${institute.toUpperCase()}
              </div>
              <div style="font-size: 13px; color: #64748B; margin-top: 2px;">
                ${period} &bull; Generated on ${dateFormatted}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="badge-grade">Grade: ${data.tests.gradeLetter || 'A'}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Overall Evaluation</div>
            </div>
          </div>

          <!-- Student Meta Grid -->
          <div class="student-info-grid">
            <div>
              <div style="font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 600;">Student Name</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">${data.student.name}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 600;">Roll Number</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">#${data.student.rollNumber}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 600;">Batch & Grade</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">${data.batch.name} (${data.batch.grade})</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 600;">Subject & Room</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">${data.batch.subject} ${data.batch.room ? `(${data.batch.room})` : ''}</div>
            </div>
          </div>

          <!-- Key Metrics -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px;">
            <div class="metric-box">
              <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Classroom Attendance</div>
              <div class="metric-val" style="color: ${data.attendance.percentage >= 75 ? '#16A34A' : '#DC2626'};">
                ${data.attendance.percentage}%
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                ${data.attendance.presentCount} of ${data.attendance.totalClasses} classes attended
              </div>
            </div>

            <div class="metric-box">
              <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Homework Completion</div>
              <div class="metric-val" style="color: ${data.homework.completionPercentage >= 70 ? '#2563EB' : '#D97706'};">
                ${data.homework.completionPercentage}%
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                ${data.homework.doneCount} done &bull; ${data.homework.notDoneCount} missed
              </div>
            </div>

            <div class="metric-box">
              <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Test Performance Avg</div>
              <div class="metric-val" style="color: #7C3AED;">
                ${data.tests.averagePercentage}%
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                ${data.tests.testsAttempted} of ${data.tests.totalTests} tests attempted
              </div>
            </div>
          </div>

          <!-- Test Marks Section -->
          <div style="font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
            📝 Chapter Tests & Assessments Breakdown
          </div>
          <table>
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Date Conducted</th>
                <th style="text-align: center;">Score</th>
                <th style="text-align: center;">Percentage</th>
                <th style="text-align: center;">Evaluation</th>
              </tr>
            </thead>
            <tbody>
              ${testRows}
            </tbody>
          </table>

          <!-- Teacher Remarks & Focus Areas -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 10px;">
            <div class="box-card">
              <div style="font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 4px;">
                👨‍🏫 Teacher's Evaluation & Remarks
              </div>
              <div style="font-size: 12px; color: #334155; line-height: 1.6;">
                ${params.remarks || 'Student is regular, maintains discipline in class, and participates well in classroom discussions.'}
              </div>
            </div>

            <div class="box-card">
              <div style="font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 4px;">
                🎯 Target Focus for Next Month
              </div>
              <div style="font-size: 12px; color: #334155; line-height: 1.6;">
                ${params.nextMonthFocus || 'Focus on regular daily revisions, formula sheets, and chapter test problem solving.'}
              </div>
            </div>
          </div>

          <!-- Signature Footer -->
          <div class="signature-area">
            <div class="sig-line">Parent / Guardian Signature</div>
            <div class="sig-line">${teacher}<br />Instructor Signature</div>
          </div>

          <!-- App Watermark -->
          <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #94A3B8;">
            Report generated securely via EduFlow Tuition Management &bull; ${institute}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generates a Fee Receipt HTML document
   */
  generateFeeReceiptHtml(params: {
    payment: FeePayment;
    instituteName?: string;
    teacherName?: string;
  }): string {
    const { payment } = params;
    const institute = params.instituteName?.trim() || 'EduFlow Tuition Academy';
    const teacher = params.teacherName?.trim() || 'Authorised Signatory';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Fee Receipt - ${payment.receiptNumber}</title>
          <style>
            @page { size: A5 landscape; margin: 12mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              margin: 0;
              padding: 0;
              background-color: #FFFFFF;
              font-size: 13px;
            }
            .receipt-box {
              border: 2px solid #2563EB;
              border-radius: 12px;
              padding: 24px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1.5px solid #E2E8F0;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 16px;
            }
            .amount-banner {
              background: #EFF6FF;
              border: 1.5px solid #BFDBFE;
              border-radius: 8px;
              padding: 14px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div>
                <div style="font-size: 20px; font-weight: 900; color: #1E3A8A;">${institute.toUpperCase()}</div>
                <div style="font-size: 12px; color: #64748B;">Official Tuition Fee Receipt</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: #2563EB;">#${payment.receiptNumber}</div>
                <div style="font-size: 12px; color: #64748B;">Date: ${payment.date}</div>
              </div>
            </div>

            <div class="details-grid">
              <div><strong>Student Name:</strong> ${payment.studentName}</div>
              <div><strong>Roll Number:</strong> #${payment.rollNumber}</div>
              <div><strong>Batch:</strong> ${payment.batchName}</div>
              <div><strong>For Period:</strong> ${payment.forMonth}</div>
              <div><strong>Payment Mode:</strong> ${payment.mode.toUpperCase()}</div>
              <div><strong>Remarks:</strong> ${payment.remarks || 'Tuition fees'}</div>
            </div>

            <div class="amount-banner">
              <span style="font-size: 14px; font-weight: 700; color: #1E3A8A;">Total Amount Received</span>
              <span style="font-size: 24px; font-weight: 900; color: #16A34A;">₹${payment.amount.toLocaleString()}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px;">
              <div style="font-size: 11px; color: #64748B;">
                Status: <strong style="color: #16A34A;">PAID & VERIFIED</strong>
              </div>
              <div style="text-align: center; border-top: 1px dashed #94A3B8; width: 160px; padding-top: 4px; font-size: 11px; color: #64748B;">
                ${teacher}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generates a PDF file and launches system sharing (WhatsApp, Save to Files, Print)
   */
  async generateAndShareReport(params: {
    data: StudentProfileData;
    instituteName?: string;
    teacherName?: string;
    periodName?: string;
    remarks?: string;
    nextMonthFocus?: string;
  }): Promise<string> {
    const html = this.generateStudentReportHtml(params);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return 'web_printed';
    }

    const { uri } = await Print.printToFileAsync({
      html,
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share Progress Report - ${params.data.student.name}`,
      });
    }

    return uri;
  }

  /**
   * Generates and shares a fee receipt PDF
   */
  async generateAndShareReceipt(params: {
    payment: FeePayment;
    instituteName?: string;
    teacherName?: string;
  }): Promise<string> {
    const html = this.generateFeeReceiptHtml(params);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return 'web_printed';
    }

    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Fee Receipt - ${params.payment.receiptNumber}`,
      });
    }

    return uri;
  }
}

export const reportPdfService = new ReportPdfService();
