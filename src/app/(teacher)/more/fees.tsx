import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { teacherService } from '@/services/teacher.service';
import { feesService } from '@/services/teacher/fees.service';
import { reportPdfService } from '@/services/pdf/reportPdf.service';
import { StudentFeeDetail, TuitionFeeOverview, FeePayment, FeePaymentMode } from '@/types/fee';
import { Batch, FeeStatus } from '@/types/teacher';
import { theme } from '@/theme';

export default function TeacherFeesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { language } = useTranslation();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'students' | 'history'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data
  const [studentDetails, setStudentDetails] = useState<StudentFeeDetail[]>([]);
  const [overview, setOverview] = useState<TuitionFeeOverview | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);

  // Payment Recording Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [targetStudent, setTargetStudent] = useState<StudentFeeDetail | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<FeePaymentMode>('upi');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Configure Batch Fee Modal
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [configBatchId, setConfigBatchId] = useState<string>('');
  const [configMonthlyFee, setConfigMonthlyFee] = useState('1500');
  const [configDueDay, setConfigDueDay] = useState('5');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [bList, sDetails, ovData, pList] = await Promise.all([
        teacherService.getBatches(),
        feesService.getStudentFeeDetails(selectedBatchId),
        feesService.getTuitionFeeOverview(selectedBatchId),
        feesService.getFeePayments(selectedBatchId),
      ]);
      setBatches(bList);
      setStudentDetails(sDetails);
      setOverview(ovData);
      setPayments(pList);
      if (bList.length > 0 && !configBatchId) {
        setConfigBatchId(bList[0].id);
      }
    } catch (e) {
      console.error('Failed to load fees data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBatchId, configBatchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentDetails.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.batchName.toLowerCase().includes(q)
      );
    });
  }, [studentDetails, searchQuery]);

  // Open Payment Modal
  const handleOpenPaymentModal = (student: StudentFeeDetail) => {
    setTargetStudent(student);
    setPaymentAmount(String(student.dueAmount > 0 ? student.dueAmount : student.monthlyFee));
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    setPaymentMonth(currentMonth);
    setPaymentMode('upi');
    setPaymentRemarks('');
    setIsPaymentModalVisible(true);
  };

  // Submit Payment
  const handleSavePayment = async (shareReceipt = false) => {
    if (!targetStudent) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const newPayment = await feesService.recordPayment({
        studentId: targetStudent.studentId,
        studentName: targetStudent.studentName,
        rollNumber: targetStudent.rollNumber,
        batchId: targetStudent.batchId,
        batchName: targetStudent.batchName,
        amount: amountNum,
        date: todayStr,
        forMonth: paymentMonth.trim() || undefined,
        mode: paymentMode,
        remarks: paymentRemarks.trim() || undefined,
      });

      setIsPaymentModalVisible(false);
      await loadData(true);

      if (shareReceipt) {
        // Generate and share PDF receipt
        await reportPdfService.generateAndShareReceipt({
          payment: newPayment,
          instituteName: profile?.institute_name || undefined,
          teacherName: profile?.full_name || undefined,
        });
      } else {
        Alert.alert('Payment Recorded', `Payment of ₹${amountNum} recorded successfully. Receipt #${newPayment.receiptNumber}`);
      }
    } catch (e) {
      console.error('Failed to record payment:', e);
      Alert.alert('Error', 'Could not record payment. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // WhatsApp Fee Reminder
  const handleSendWhatsAppReminder = (student: StudentFeeDetail) => {
    const rawPhone = student.parentPhone || '';
    const cleanPhone = rawPhone.replace(/[^\d]/g, '');

    const message = feesService.formatFeeReminderWhatsAppMessage({
      studentName: student.studentName,
      rollNumber: student.rollNumber,
      batchName: student.batchName,
      dueAmount: student.dueAmount > 0 ? student.dueAmount : student.monthlyFee,
      instituteName: profile?.institute_name || undefined,
      teacherName: profile?.full_name || undefined,
      language: language as 'en' | 'hi' | 'gu',
    });

    const encoded = encodeURIComponent(message);
    let url = `whatsapp://send?text=${encoded}`;
    if (cleanPhone) {
      const withCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `whatsapp://send?phone=${withCountry}&text=${encoded}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('WhatsApp Not Installed', 'Could not find WhatsApp on this device.');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to open WhatsApp.');
      });
  };

  // Save Batch Fee Config
  const handleSaveBatchConfig = async () => {
    if (!configBatchId) return;
    const feeNum = parseFloat(configMonthlyFee);
    const dayNum = parseInt(configDueDay, 10);
    if (isNaN(feeNum) || feeNum < 0) {
      Alert.alert('Invalid Fee', 'Please enter a valid monthly fee.');
      return;
    }

    setIsSavingConfig(true);
    try {
      await feesService.saveBatchFeeConfig(configBatchId, feeNum, isNaN(dayNum) ? 5 : dayNum);
      setIsConfigModalVisible(false);
      await loadData(true);
      Alert.alert('Success', 'Batch tuition fee configuration updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update fee configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Share Existing Payment Receipt PDF
  const handleShareReceiptPdf = async (payment: FeePayment) => {
    try {
      await reportPdfService.generateAndShareReceipt({
        payment,
        instituteName: profile?.institute_name || undefined,
        teacherName: profile?.full_name || undefined,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to generate receipt PDF.');
    }
  };

  // Share Receipt via WhatsApp Text
  const handleShareReceiptWhatsApp = (payment: FeePayment) => {
    const message = feesService.formatFeeReceiptWhatsAppMessage({
      studentName: payment.studentName,
      rollNumber: payment.rollNumber,
      batchName: payment.batchName,
      amount: payment.amount,
      receiptNumber: payment.receiptNumber,
      date: payment.date,
      forMonth: payment.forMonth,
      mode: payment.mode,
      instituteName: profile?.institute_name || undefined,
      teacherName: profile?.full_name || undefined,
      language: language as 'en' | 'hi' | 'gu',
    });

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to launch WhatsApp.');
    });
  };

  const getStatusBadgeVariant = (status: FeeStatus) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'free':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Fees & Payments"
        subtitle="Tuition dues, ledger & WhatsApp receipts"
        showBack
        rightAction={
          <Pressable
            style={styles.configBtn}
            onPress={() => setIsConfigModalVisible(true)}
            hitSlop={8}
          >
            <Feather name="sliders" size={18} color={theme.colors.primary.main} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Overview Financial Cards */}
        {overview && (
          <Card variant="elevated" padding="md" style={styles.overviewCard}>
            <View style={styles.overviewTopRow}>
              <View>
                <Text variant="caption" style={styles.overviewSubtitle}>
                  Monthly Collection
                </Text>
                <Text style={styles.collectedAmount}>
                  ₹{overview.totalCollectedMonth.toLocaleString()}
                </Text>
              </View>
              <View style={styles.collectionRateBadge}>
                <Text style={styles.collectionRateText}>{overview.collectionRate}% Collected</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(0, overview.collectionRate))}%` },
                ]}
              />
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text variant="caption" style={styles.statLabel}>
                  Pending Dues
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.semantic.warning.main }]}>
                  ₹{overview.totalPendingMonth.toLocaleString()}
                </Text>
                <Text variant="caption" style={styles.statSub}>
                  {overview.pendingStudentsCount} students
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text variant="caption" style={styles.statLabel}>
                  Overdue
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.semantic.danger.main }]}>
                  {overview.overdueStudentsCount}
                </Text>
                <Text variant="caption" style={styles.statSub}>
                  Requires follow-up
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text variant="caption" style={styles.statLabel}>
                  Paid Full
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.semantic.success.main }]}>
                  {overview.paidStudentsCount}
                </Text>
                <Text variant="caption" style={styles.statSub}>
                  Up to date
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* 2. Batch Selector Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.batchFilterList}
        >
          <Pressable
            style={[
              styles.batchPill,
              selectedBatchId === 'all' && styles.batchPillActive,
            ]}
            onPress={() => setSelectedBatchId('all')}
          >
            <Text
              variant="caption"
              style={[
                styles.batchPillText,
                selectedBatchId === 'all' && styles.batchPillTextActive,
              ]}
            >
              All Batches
            </Text>
          </Pressable>

          {batches.map((b) => (
            <Pressable
              key={b.id}
              style={[
                styles.batchPill,
                selectedBatchId === b.id && styles.batchPillActive,
              ]}
              onPress={() => setSelectedBatchId(b.id)}
            >
              <Text
                variant="caption"
                style={[
                  styles.batchPillText,
                  selectedBatchId === b.id && styles.batchPillTextActive,
                ]}
              >
                {b.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 3. Segmented Tab Control */}
        <View style={styles.segmentContainer}>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'students' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('students')}
          >
            <Feather
              name="users"
              size={14}
              color={activeTab === 'students' ? theme.colors.primary.main : theme.colors.text.secondary}
            />
            <Text
              variant="label"
              style={[
                styles.segmentText,
                activeTab === 'students' && styles.segmentTextActive,
              ]}
            >
              Student Dues ({studentDetails.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('history')}
          >
            <Feather
              name="file-text"
              size={14}
              color={activeTab === 'history' ? theme.colors.primary.main : theme.colors.text.secondary}
            />
            <Text
              variant="label"
              style={[
                styles.segmentText,
                activeTab === 'history' && styles.segmentTextActive,
              ]}
            >
              Payment Ledger ({payments.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Students Dues List */}
        {activeTab === 'students' && (
          <View style={styles.tabContent}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color={theme.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search student by name or roll number..."
                placeholderTextColor={theme.colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={16} color={theme.colors.text.secondary} />
                </Pressable>
              )}
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ marginVertical: 40 }} />
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon="check-circle"
                title="No students found"
                description={
                  searchQuery
                    ? 'No students match your search criteria.'
                    : 'No enrolled students in this batch.'
                }
              />
            ) : (
              <View style={styles.studentsList}>
                {filteredStudents.map((item) => (
                  <Card key={item.studentId} variant="elevated" padding="md" style={styles.studentCard}>
                    <View style={styles.studentCardHeader}>
                      <View style={styles.studentMeta}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {item.studentName.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text variant="heading" style={styles.studentNameText} numberOfLines={1}>
                              {item.studentName}
                            </Text>
                            <Badge
                              variant={getStatusBadgeVariant(item.feeStatus)}
                              size="sm"
                              label={item.feeStatus.toUpperCase()}
                            />
                          </View>
                          <Text variant="caption" style={styles.studentSubText}>
                            #{item.rollNumber} &bull; {item.batchName} &bull; ₹{item.monthlyFee}/mo
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Due details & actions */}
                    <View style={styles.studentCardFooter}>
                      <View>
                        <Text variant="caption" style={styles.dueCaption}>
                          {item.feeStatus === 'paid' ? 'Paid for this month' : 'Pending Due'}
                        </Text>
                        <Text
                          style={[
                            styles.dueAmountText,
                            {
                              color:
                                item.feeStatus === 'paid'
                                  ? theme.colors.semantic.success.main
                                  : item.feeStatus === 'overdue'
                                  ? theme.colors.semantic.danger.main
                                  : theme.colors.semantic.warning.main,
                            },
                          ]}
                        >
                          {item.feeStatus === 'paid' ? 'Clear' : `₹${item.dueAmount || item.monthlyFee}`}
                        </Text>
                      </View>

                      <View style={styles.actionButtonsRow}>
                        {/* WhatsApp Reminder Button */}
                        {item.feeStatus !== 'paid' && item.feeStatus !== 'free' && (
                          <Pressable
                            style={styles.reminderBtn}
                            onPress={() => handleSendWhatsAppReminder(item)}
                          >
                            <MaterialCommunityIcons name="whatsapp" size={16} color="#16A34A" />
                            <Text variant="caption" style={styles.reminderBtnText}>
                              Reminder
                            </Text>
                          </Pressable>
                        )}

                        {/* Record Payment Button */}
                        <Pressable
                          style={styles.recordBtn}
                          onPress={() => handleOpenPaymentModal(item)}
                        >
                          <Feather name="credit-card" size={14} color="#FFFFFF" />
                          <Text variant="caption" style={styles.recordBtnText}>
                            Record
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Payment History Ledger */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ marginVertical: 40 }} />
            ) : payments.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No payments recorded"
                description="Payments received from students will appear in this ledger."
              />
            ) : (
              <View style={styles.paymentsList}>
                {payments.map((p) => (
                  <Card key={p.id} variant="elevated" padding="md" style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <View>
                        <Text variant="heading" style={styles.paymentStudentName}>
                          {p.studentName}
                        </Text>
                        <Text variant="caption" style={styles.paymentMeta}>
                          #{p.rollNumber} &bull; {p.batchName} &bull; {p.forMonth}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.paymentAmount}>+₹{p.amount.toLocaleString()}</Text>
                        <Badge
                          variant="success"
                          size="sm"
                          label={p.mode.toUpperCase()}
                        />
                      </View>
                    </View>

                    <View style={styles.paymentFooter}>
                      <View>
                        <Text variant="caption" style={styles.receiptNo}>
                          Receipt: {p.receiptNumber}
                        </Text>
                        <Text variant="caption" style={styles.receiptDate}>
                          Date: {p.date} {p.remarks ? `\u2022 ${p.remarks}` : ''}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {/* 1-Tap PDF Receipt */}
                        <Pressable
                          style={styles.pdfReceiptBtn}
                          onPress={() => handleShareReceiptPdf(p)}
                        >
                          <Feather name="download" size={13} color={theme.colors.primary.main} />
                          <Text variant="caption" style={styles.pdfReceiptBtnText}>
                            PDF
                          </Text>
                        </Pressable>

                        {/* WhatsApp Receipt */}
                        <Pressable
                          style={styles.waReceiptBtn}
                          onPress={() => handleShareReceiptWhatsApp(p)}
                        >
                          <MaterialCommunityIcons name="whatsapp" size={14} color="#16A34A" />
                          <Text variant="caption" style={styles.waReceiptBtnText}>
                            WhatsApp
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text variant="heading" style={styles.modalTitle}>
                  Record Fee Payment
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  {targetStudent?.studentName} (#{targetStudent?.rollNumber})
                </Text>
              </View>
              <Pressable
                onPress={() => setIsPaymentModalVisible(false)}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Amount */}
              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  Amount Received (₹)
                </Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                />
              </View>

              {/* Month */}
              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  For Month / Period
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. October 2026"
                  value={paymentMonth}
                  onChangeText={setPaymentMonth}
                />
              </View>

              {/* Payment Mode Selector */}
              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  Payment Mode
                </Text>
                <View style={styles.modeRow}>
                  {(['upi', 'cash', 'bank_transfer', 'cheque'] as FeePaymentMode[]).map((mode) => (
                    <Pressable
                      key={mode}
                      style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                      onPress={() => setPaymentMode(mode)}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.modeChipText,
                          paymentMode === mode && styles.modeChipTextActive,
                        ]}
                      >
                        {mode.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Remarks */}
              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  Remarks / Transaction ID (Optional)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. GooglePay ref #123456"
                  value={paymentRemarks}
                  onChangeText={setPaymentRemarks}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <Button
                title="Save & Share PDF"
                variant="outline"
                icon="download"
                onPress={() => handleSavePayment(true)}
                loading={isSubmittingPayment}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Payment"
                variant="primary"
                onPress={() => handleSavePayment(false)}
                loading={isSubmittingPayment}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Configure Batch Fee Modal */}
      <Modal
        visible={isConfigModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text variant="heading" style={styles.modalTitle}>
                  Batch Tuition Fee Rates
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  Set monthly fee & due day per batch
                </Text>
              </View>
              <Pressable
                onPress={() => setIsConfigModalVisible(false)}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  Select Batch
                </Text>
                <View style={styles.batchSelectRow}>
                  {batches.map((b) => (
                    <Pressable
                      key={b.id}
                      style={[
                        styles.batchSelectChip,
                        configBatchId === b.id && styles.batchSelectChipActive,
                      ]}
                      onPress={async () => {
                        setConfigBatchId(b.id);
                        const cfg = await feesService.getBatchFeeConfig(b.id);
                        setConfigMonthlyFee(String(cfg.monthlyFee));
                        setConfigDueDay(String(cfg.dueDayOfMonth));
                      }}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.batchSelectChipText,
                          configBatchId === b.id && styles.batchSelectChipTextActive,
                        ]}
                      >
                        {b.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  Monthly Fee Amount (₹)
                </Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                  value={configMonthlyFee}
                  onChangeText={setConfigMonthlyFee}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="label" style={styles.formLabel}>
                  Monthly Due Day of Month (1 - 31)
                </Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                  value={configDueDay}
                  onChangeText={setConfigDueDay}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setIsConfigModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Rate"
                variant="primary"
                onPress={handleSaveBatchConfig}
                loading={isSavingConfig}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  configBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 14,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewSubtitle: {
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  collectedAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  collectionRateBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  collectionRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },
  batchFilterList: {
    gap: 8,
    paddingVertical: 2,
  },
  batchPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  batchPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  batchPillText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  batchPillTextActive: {
    color: '#FFFFFF',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  segmentText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  segmentTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  tabContent: {
    gap: theme.spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
    padding: 0,
  },
  studentsList: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 13,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentSubText: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: 11,
  },
  studentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dueCaption: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  dueAmountText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reminderBtnText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 11,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  paymentsList: {
    gap: 10,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentStudentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentMeta: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiptNo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  receiptDate: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  pdfReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pdfReceiptBtnText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 11,
  },
  waReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  waReceiptBtnText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  formInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: '#F8FAFC',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    backgroundColor: '#FFFFFF',
  },
  modeChipActive: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  modeChipTextActive: {
    color: theme.colors.primary.main,
  },
  batchSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  batchSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    backgroundColor: '#FFFFFF',
  },
  batchSelectChipActive: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },
  batchSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  batchSelectChipTextActive: {
    color: theme.colors.primary.main,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
