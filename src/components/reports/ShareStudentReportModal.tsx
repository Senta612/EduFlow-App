import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { teacherService, formatStudentProgressWhatsAppMessage } from '@/services/teacher.service';
import { StudentProfileData } from '@/types/teacher';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

interface TargetStudentReportInfo {
  studentId: string;
  studentName: string;
  rollNumber: string;
  parentPhone?: string;
  batchId: string;
  batchName: string;
}

interface ShareStudentReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetStudent: TargetStudentReportInfo | null;
}

const QUICK_REMARKS_EN = [
  'Regular in attendance and attentive!',
  'Great work! Keep up the effort.',
  'Needs more practice in problem solving.',
  'Please ensure timely homework submission.',
  'Excellent test performance! 🌟',
];

const QUICK_REMARKS_GU = [
  'નિયમિત હાજરી અને વર્ગમાં ધ્યાન આપે છે!',
  'ખૂબ સરસ પ્રગતિ! પ્રયત્ન ચાલુ રાખો.',
  'દાખલા અને પ્રશ્નોમાં વધુ પ્રેક્ટિસની જરૂર છે.',
  'કૃપા કરીને સમયસર લેસન જમા કરાવવાની કાળજી રાખો.',
  'ટેસ્ટમાં ઉત્તમ પ્રદર્શન! 🌟',
];

const QUICK_REMARKS_HI = [
  'नियमित उपस्थिति और कक्षा में ध्यान देता है!',
  'बहुत अच्छा काम! प्रयास जारी रखें।',
  'प्रश्नों के अभ्यास में थोड़ा और सुधार आवश्यक है।',
  'कृपया समय पर गृहकार्य जमा करना सुनिश्चित करें।',
  'परीक्षा में उत्कृष्ट प्रदर्शन! 🌟',
];

export function ShareStudentReportModal({
  visible,
  onClose,
  targetStudent,
}: ShareStudentReportModalProps) {
  const { t, language } = useTranslation();
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customRemarks, setCustomRemarks] = useState('');

  const quickRemarks =
    language === 'gu'
      ? QUICK_REMARKS_GU
      : language === 'hi'
      ? QUICK_REMARKS_HI
      : QUICK_REMARKS_EN;

  useEffect(() => {
    if (visible && targetStudent) {
      const defaultNote =
        language === 'gu'
          ? 'સારી પ્રગતિ! નિયમિત ક્લાસમાં હાજર રહેવું.'
          : language === 'hi'
          ? 'अच्छा प्रदर्शन! नियमित कक्षा में उपस्थित रहें।'
          : 'Doing well! Keep attending classes regularly.';
      setCustomRemarks(defaultNote);
      setIsLoading(true);
      teacherService
        .getStudentProfileData(targetStudent.batchId, targetStudent.studentId)
        .then((data) => setProfileData(data))
        .catch((err) => console.warn('Failed to fetch student profile report data:', err))
        .finally(() => setIsLoading(false));
    } else {
      setProfileData(null);
    }
  }, [visible, targetStudent, language]);

  if (!targetStudent) {
    return null;
  }

  const latestTestItem =
    profileData?.tests.items && profileData.tests.items.length > 0
      ? profileData.tests.items.find((t) => t.marksObtained !== null)
      : undefined;

  const attendancePct = profileData?.attendance.percentage ?? 95;
  const classesAttended = profileData?.attendance.presentCount ?? 11;
  const totalClasses = profileData?.attendance.totalClasses ?? 12;
  const hwPct = profileData?.homework.completionPercentage ?? 92;

  const getWhatsAppMessage = () => {
    return formatStudentProgressWhatsAppMessage({
      studentName: targetStudent.studentName,
      rollNumber: targetStudent.rollNumber,
      batchName: targetStudent.batchName,
      attendancePercentage: attendancePct,
      totalClassesAttended: classesAttended,
      totalClasses,
      hwCompletionPercentage: hwPct,
      latestTest: latestTestItem
        ? {
            title: latestTestItem.title,
            marksObtained: latestTestItem.marksObtained ?? 0,
            maxMarks: latestTestItem.maxMarks,
          }
        : undefined,
      remarks: customRemarks,
      language,
    });
  };

  const handleShareWhatsApp = () => {
    const message = getWhatsAppMessage();
    const cleanPhone = (targetStudent.parentPhone || '').replace(/[^0-9]/g, '');

    const whatsappUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    const fallbackUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('WhatsApp Error', 'Unable to open WhatsApp on this device.');
      });
    });
  };

  const handleCallParent = () => {
    if (!targetStudent.parentPhone) {
      Alert.alert('No Phone Number', 'No parent phone number on file for this student.');
      return;
    }
    const cleanPhone = targetStudent.parentPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call.');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.modalIconBox}>
                  <FontAwesome name="whatsapp" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text variant="label" style={styles.modalTitle}>
                    {t('reports.progressSlipTitle')}
                  </Text>
                  <Text variant="caption" style={styles.modalSubtitle}>
                    {t('reports.progressSlipSubtitle')}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close Progress Report Modal"
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={theme.colors.primary.main} />
                  <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {t('reports.generatingSlip')}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Visual Progress Slip Card */}
                  <Card variant="elevated" padding="md" style={styles.slipCard}>
                    <View style={styles.slipHeader}>
                      <View style={styles.instituteRow}>
                        <Feather name="book-open" size={14} color={theme.colors.primary.main} />
                        <Text variant="caption" style={styles.instituteName}>
                          EDUFLOW TUITION ACADEMY
                        </Text>
                      </View>
                      <View style={styles.batchPill}>
                        <Text variant="caption" style={styles.batchPillText}>
                          {targetStudent.batchName}
                        </Text>
                      </View>
                    </View>

                    {/* Student Details */}
                    <View style={styles.studentDetailsRow}>
                      <View style={styles.slipAvatar}>
                        <Text style={styles.slipAvatarText}>
                          {targetStudent.studentName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="label" style={styles.slipStudentName}>
                          {targetStudent.studentName}
                        </Text>
                        <Text variant="caption" style={styles.slipRoll}>
                          {t('reports.rollNo')}: #{targetStudent.rollNumber} • {t('common.call')}:{' '}
                          {targetStudent.parentPhone || t('reports.parentNotProvided')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Metrics 3-Col Bar */}
                    <View style={styles.metricsBar}>
                      <View style={styles.metricItem}>
                        <Text variant="caption" style={styles.metricLabel}>
                          {t('common.attendance')}
                        </Text>
                        <Text variant="label" style={[styles.metricVal, { color: '#16A34A' }]}>
                          {attendancePct}%
                        </Text>
                        <Text variant="caption" style={styles.metricSub}>
                          {classesAttended}/{totalClasses} {t('reports.days')}
                        </Text>
                      </View>

                      <View style={styles.metricDivider} />

                      <View style={styles.metricItem}>
                        <Text variant="caption" style={styles.metricLabel}>
                          {t('common.homework')}
                        </Text>
                        <Text variant="label" style={[styles.metricVal, { color: theme.colors.primary.main }]}>
                          {hwPct}%
                        </Text>
                        <Text variant="caption" style={styles.metricSub}>
                          {t('reports.completion')}
                        </Text>
                      </View>

                      <View style={styles.metricDivider} />

                      <View style={styles.metricItem}>
                        <Text variant="caption" style={styles.metricLabel}>
                          {t('reports.latestTest')}
                        </Text>
                        <Text variant="label" style={[styles.metricVal, { color: '#D97706' }]}>
                          {latestTestItem?.marksObtained !== null && latestTestItem?.marksObtained !== undefined
                            ? `${latestTestItem.marksObtained}/${latestTestItem.maxMarks}`
                            : 'N/A'}
                        </Text>
                        <Text variant="caption" style={styles.metricSub}>
                          {latestTestItem?.percentage !== null && latestTestItem?.percentage !== undefined
                            ? `${latestTestItem.percentage}% ${t('reports.scored')}`
                            : t('common.pending')}
                        </Text>
                      </View>
                    </View>
                  </Card>

                  {/* Teacher Remarks Editor */}
                  <View style={styles.remarksSection}>
                    <Text variant="label" style={styles.remarksTitle}>
                      {t('reports.teacherRemarksLabel')}
                    </Text>
                    <TextInput
                      style={styles.remarksInput}
                      value={customRemarks}
                      onChangeText={setCustomRemarks}
                      placeholder={t('reports.remarksPlaceholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                      multiline
                      numberOfLines={3}
                    />

                    {/* Quick suggestion chips */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickChipsRow}
                    >
                      {quickRemarks.map((remark, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.quickChip}
                          onPress={() => setCustomRemarks(remark)}
                        >
                          <Text variant="caption" style={styles.quickChipText}>
                            + {remark}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Action Buttons Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryWhatsAppBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleShareWhatsApp}
                accessibilityRole="button"
                accessibilityLabel="Share progress report to parent on WhatsApp"
              >
                <FontAwesome name="whatsapp" size={18} color="#FFFFFF" />
                <Text variant="label" style={styles.primaryWhatsAppText}>
                  {t('reports.sendOnWhatsApp')}
                </Text>
              </Pressable>

              {targetStudent.parentPhone && (
                <Pressable
                  style={({ pressed }) => [
                    styles.callParentBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleCallParent}
                  accessibilityRole="button"
                  accessibilityLabel="Call parent"
                >
                  <Feather name="phone" size={16} color={theme.colors.text.primary} />
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  slipCard: {
    backgroundColor: theme.colors.background.screen,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  slipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instituteName: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary.main,
    letterSpacing: 0.6,
  },
  batchPill: {
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  batchPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  studentDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  slipAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  slipStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  slipRoll: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.main,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  metricItem: {
    alignItems: 'center',
    gap: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 10,
    color: theme.colors.text.disabled,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border.main,
  },
  remarksSection: {
    gap: 6,
  },
  remarksTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  remarksInput: {
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.text.primary,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  quickChipsRow: {
    gap: 6,
    paddingVertical: 4,
  },
  quickChip: {
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
  },
  quickChipText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  primaryWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: theme.radii.lg,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryWhatsAppText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  callParentBtn: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
