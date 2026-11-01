import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudentFeePortalView } from '@/types/student';
import { FeePayment } from '@/types/fee';
import { reportPdfService } from '@/services/pdf/reportPdf.service';
import { theme } from '@/theme';

interface StudentFeeModalProps {
  visible: boolean;
  onClose: () => void;
  feeData: StudentFeePortalView | null;
  teacherName?: string;
  instituteName?: string;
}

export const StudentFeeModal: React.FC<StudentFeeModalProps> = ({
  visible,
  onClose,
  feeData,
  teacherName,
  instituteName,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'receipts'>('status');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);

  if (!feeData) return null;

  const {
    feeStatus,
    dueAmount,
    monthlyFee,
    dueDateFormatted,
    forMonth,
    studentName,
    rollNumber,
    batchName,
    teacherPaymentConfig,
    paymentHistory,
    lastPayment,
  } = feeData;

  const isPaid = feeStatus === 'paid';
  const isFree = feeStatus === 'free';
  const teacherUpi = teacherPaymentConfig?.upiId || '';
  const teacherPayee = teacherPaymentConfig?.payeeName || instituteName || 'Tuition Academy';
  const teacherPhone = teacherPaymentConfig?.phoneNumber || '';

  // Standard UPI Intent URL
  const paymentNote = `Tuition Fee - ${studentName} (${rollNumber}) ${forMonth}`;
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(teacherUpi)}&pn=${encodeURIComponent(
    teacherPayee,
  )}&am=${dueAmount > 0 ? dueAmount : monthlyFee}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;

  // Dynamic QR Code generation fallback if no custom QR image uploaded
  const qrImageUri =
    teacherPaymentConfig?.qrCodeUrl ||
    (teacherUpi
      ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
          upiIntentUrl,
        )}`
      : undefined);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      Alert.alert('Copied', text);
    }
  };

  const handleOpenUpiApp = async () => {
    if (!teacherUpi) {
      Alert.alert(
        'UPI ID Missing',
        'Teacher has not configured a UPI ID yet. Please contact your teacher directly.',
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(upiIntentUrl);
      if (canOpen) {
        await Linking.openURL(upiIntentUrl);
      } else {
        // Fallback: try opening directly anyway
        await Linking.openURL(upiIntentUrl);
      }
    } catch {
      Alert.alert(
        'UPI Apps',
        'Could not auto-launch UPI app. Please scan the QR code or copy the UPI ID below to pay through Google Pay, PhonePe, or Paytm.',
      );
    }
  };

  const handleSendWhatsAppProof = () => {
    const rawPhone = teacherPhone.replace(/[^0-9]/g, '');
    const message = `Hello Sir/Ma'am,\n\nI have completed the tuition fee payment of ₹${dueAmount > 0 ? dueAmount : monthlyFee} for student *${studentName}* (Roll #${rollNumber}, Batch: ${batchName}) for *${forMonth}*.\n\nPlease find attached the payment screenshot for your records and issue the official receipt.\n\nThank you!`;

    const encoded = encodeURIComponent(message);
    const url = rawPhone
      ? `whatsapp://send?phone=${rawPhone}&text=${encoded}`
      : `whatsapp://send?text=${encoded}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Could not open WhatsApp on this device.');
    });
  };

  const handleDownloadReceipt = async (payment: FeePayment) => {
    setGeneratingReceiptId(payment.id);
    try {
      await reportPdfService.generateAndShareReceipt({
        payment,
        instituteName: instituteName || 'EduFlow Tuition Academy',
        teacherName: teacherName || 'Authorised Signatory',
      });
    } catch (e) {
      console.error('Failed to generate fee receipt PDF:', e);
      Alert.alert('Error', 'Could not generate receipt PDF. Please try again.');
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdropTouch} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.modalIconWrap}>
                <Feather name="credit-card" size={20} color={theme.colors.primary.main} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Tuition Fee & Receipts</Text>
                <Text style={styles.modalSubtitle}>{batchName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'status' && styles.tabItemActive]}
              onPress={() => setActiveTab('status')}
              activeOpacity={0.8}
            >
              <Feather
                name="credit-card"
                size={14}
                color={activeTab === 'status' ? theme.colors.primary.main : theme.colors.text.tertiary}
              />
              <Text style={[styles.tabText, activeTab === 'status' && styles.tabTextActive]}>
                Payment & Dues
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'receipts' && styles.tabItemActive]}
              onPress={() => setActiveTab('receipts')}
              activeOpacity={0.8}
            >
              <Feather
                name="file-text"
                size={14}
                color={activeTab === 'receipts' ? theme.colors.primary.main : theme.colors.text.tertiary}
              />
              <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>
                Digital Receipts ({paymentHistory.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'status' ? (
              <>
                {/* 1. Status Hero Banner */}
                <Card
                  variant="elevated"
                  padding="md"
                  style={[
                    styles.statusHeroCard,
                    isPaid
                      ? styles.statusHeroCardPaid
                      : feeStatus === 'overdue'
                      ? styles.statusHeroCardOverdue
                      : styles.statusHeroCardPending,
                  ]}
                >
                  <View style={styles.heroTopRow}>
                    <View>
                      <Text style={styles.heroPeriodCaption}>{forMonth}</Text>
                      <Text style={styles.heroStudentName}>
                        {studentName} (#{rollNumber})
                      </Text>
                    </View>
                    <Badge
                      label={
                        isPaid
                          ? 'PAID & VERIFIED'
                          : feeStatus === 'overdue'
                          ? 'OVERDUE'
                          : isFree
                          ? 'SCHOLARSHIP'
                          : 'PAYMENT DUE'
                      }
                      variant={
                        isPaid
                          ? 'success'
                          : feeStatus === 'overdue'
                          ? 'danger'
                          : isFree
                          ? 'primary'
                          : 'warning'
                      }
                      size="sm"
                    />
                  </View>

                  <View style={styles.heroAmountRow}>
                    <View>
                      <Text style={styles.heroAmountCaption}>
                        {isPaid ? 'Amount Paid' : 'Pending Tuition Fee'}
                      </Text>
                      <Text
                        style={[
                          styles.heroAmountMain,
                          {
                            color: isPaid
                              ? '#16A34A'
                              : feeStatus === 'overdue'
                              ? theme.colors.semantic.danger.main
                              : theme.colors.text.primary,
                          },
                        ]}
                      >
                        ₹{(isPaid ? lastPayment?.amount || monthlyFee : dueAmount).toLocaleString()}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.heroDueCaption}>
                        {isPaid ? 'Recorded Date' : 'Due Date'}
                      </Text>
                      <Text style={styles.heroDueValue}>
                        {isPaid ? lastPayment?.date || 'This Month' : dueDateFormatted}
                      </Text>
                    </View>
                  </View>

                  {isPaid ? (
                    <View style={styles.paidNoticeBox}>
                      <Feather name="check-circle" size={16} color="#16A34A" />
                      <Text style={styles.paidNoticeText}>
                        Your tuition fee for {forMonth} has been recorded by faculty.
                      </Text>
                    </View>
                  ) : null}
                </Card>

                {/* If Paid, quick button to download latest receipt */}
                {isPaid && lastPayment ? (
                  <TouchableOpacity
                    style={styles.downloadLatestReceiptBtn}
                    onPress={() => handleDownloadReceipt(lastPayment)}
                    disabled={generatingReceiptId === lastPayment.id}
                    activeOpacity={0.8}
                  >
                    {generatingReceiptId === lastPayment.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="download" size={16} color="#FFFFFF" />
                        <Text style={styles.downloadLatestReceiptText}>
                          Download Official Receipt #{lastPayment.receiptNumber} (PDF)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}

                {/* If Due / Pending / Overdue, show payment options */}
                {!isPaid && !isFree ? (
                  <>
                    {/* Pay with UPI App Direct Button */}
                    <TouchableOpacity
                      style={styles.payUpiButton}
                      onPress={handleOpenUpiApp}
                      activeOpacity={0.85}
                    >
                      <Feather name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.payUpiButtonText}>
                        Pay ₹{dueAmount.toLocaleString()} via UPI App (GPay / PhonePe / Paytm)
                      </Text>
                    </TouchableOpacity>

                    {/* QR Code Presentation */}
                    {qrImageUri ? (
                      <Card variant="outlined" padding="lg" style={styles.qrCard}>
                        <Text style={styles.qrCardTitle}>Scan UPI QR Code</Text>
                        <Text style={styles.qrCardSubtitle}>
                          Scan with any UPI scanner app on your phone
                        </Text>

                        <View style={styles.qrBoxWrapper}>
                          <Image
                            source={{ uri: qrImageUri }}
                            style={styles.qrImage}
                            resizeMode="contain"
                          />
                        </View>

                        <Text style={styles.qrReceiverName}>Payee: {teacherPayee}</Text>
                      </Card>
                    ) : null}

                    {/* Account & UPI Credentials with 1-Tap Copy */}
                    <View style={styles.credentialsCard}>
                      <Text style={styles.credentialsHeading}>Faculty Payment Details</Text>

                      {teacherUpi ? (
                        <View style={styles.credentialRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.credLabel}>UPI ID / VPA</Text>
                            <Text style={styles.credValue}>{teacherUpi}</Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.copyBtn,
                              copiedField === 'upi' && styles.copyBtnSuccess,
                            ]}
                            onPress={() => handleCopy(teacherUpi, 'upi')}
                          >
                            <Feather
                              name={copiedField === 'upi' ? 'check' : 'copy'}
                              size={14}
                              color={copiedField === 'upi' ? '#16A34A' : theme.colors.primary.main}
                            />
                            <Text
                              style={[
                                styles.copyBtnText,
                                copiedField === 'upi' && { color: '#16A34A' },
                              ]}
                            >
                              {copiedField === 'upi' ? 'Copied' : 'Copy'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {teacherPhone ? (
                        <View style={styles.credentialRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.credLabel}>Phone / GPay Number</Text>
                            <Text style={styles.credValue}>{teacherPhone}</Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.copyBtn,
                              copiedField === 'phone' && styles.copyBtnSuccess,
                            ]}
                            onPress={() => handleCopy(teacherPhone, 'phone')}
                          >
                            <Feather
                              name={copiedField === 'phone' ? 'check' : 'copy'}
                              size={14}
                              color={copiedField === 'phone' ? '#16A34A' : theme.colors.primary.main}
                            />
                            <Text
                              style={[
                                styles.copyBtnText,
                                copiedField === 'phone' && { color: '#16A34A' },
                              ]}
                            >
                              {copiedField === 'phone' ? 'Copied' : 'Copy'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {teacherPaymentConfig?.instructions ? (
                        <View style={styles.instructionsBox}>
                          <Feather name="info" size={14} color={theme.colors.text.secondary} />
                          <Text style={styles.instructionsText}>
                            {teacherPaymentConfig.instructions}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Share Screenshot on WhatsApp */}
                    <TouchableOpacity
                      style={styles.whatsappProofBtn}
                      onPress={handleSendWhatsAppProof}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={18} color="#16A34A" />
                      <Text style={styles.whatsappProofText}>
                        Send Payment Screenshot on WhatsApp
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </>
            ) : (
              /* Tab 2: Receipts History */
              <View style={styles.receiptsContainer}>
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => {
                    const isGeneratingThis = generatingReceiptId === payment.id;
                    return (
                      <Card key={payment.id} variant="outlined" padding="md" style={styles.receiptCard}>
                        <View style={styles.receiptTop}>
                          <View style={styles.receiptIconCircle}>
                            <Feather name="file-text" size={18} color={theme.colors.primary.main} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.receiptNum}>#{payment.receiptNumber}</Text>
                            <Text style={styles.receiptPeriod}>{payment.forMonth}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.receiptAmount}>
                              ₹{payment.amount.toLocaleString()}
                            </Text>
                            <Badge
                              label={payment.mode.toUpperCase()}
                              variant="success"
                              size="sm"
                            />
                          </View>
                        </View>

                        <View style={styles.receiptMetaRow}>
                          <Text style={styles.receiptDate}>Paid on {payment.date}</Text>
                          {payment.remarks ? (
                            <Text style={styles.receiptRemarks}>• {payment.remarks}</Text>
                          ) : null}
                        </View>

                        <View style={styles.receiptActionRow}>
                          <TouchableOpacity
                            style={styles.receiptDownloadBtn}
                            onPress={() => handleDownloadReceipt(payment)}
                            disabled={isGeneratingThis}
                            activeOpacity={0.8}
                          >
                            {isGeneratingThis ? (
                              <ActivityIndicator size="small" color={theme.colors.primary.main} />
                            ) : (
                              <>
                                <Feather
                                  name="download"
                                  size={14}
                                  color={theme.colors.primary.main}
                                />
                                <Text style={styles.receiptDownloadText}>
                                  Download PDF Receipt
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </Card>
                    );
                  })
                ) : (
                  <EmptyState
                    icon="file-text"
                    title="No Receipts Available Yet"
                    description="When your teacher records your tuition fee payment, verified digital receipts with official stamps will appear here."
                  />
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Close */}
          <View style={styles.modalFooter}>
            <Button title="Close" variant="outline" fullWidth onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  statusHeroCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  statusHeroCardPaid: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusHeroCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  statusHeroCardOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroPeriodCaption: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  heroStudentName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  heroAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  heroAmountCaption: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  heroAmountMain: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  heroDueCaption: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  heroDueValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  paidNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paidNoticeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  downloadLatestReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadLatestReceiptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  payUpiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payUpiButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  qrCardSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  qrBoxWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  qrReceiverName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  credentialsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  credentialsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  credLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  credValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnSuccess: {
    backgroundColor: '#DCFCE7',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 16,
    flex: 1,
  },
  whatsappProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  whatsappProofText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  receiptsContainer: {
    gap: 12,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  receiptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptNum: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  receiptPeriod: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  receiptDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  receiptRemarks: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  receiptActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  receiptDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  receiptDownloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
