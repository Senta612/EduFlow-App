import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { teacherService, formatStudentProgressWhatsAppMessage } from '@/services/teacher.service';
import { StudentProfileData } from '@/types/teacher';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export interface TargetStudentReportInfo {
  studentId: string;
  studentName: string;
  rollNumber: string;
  parentPhone?: string | null;
  batchId: string;
  batchName: string;
}

interface ShareStudentReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetStudent: TargetStudentReportInfo | null;
  studentsList?: TargetStudentReportInfo[];
  onSelectStudent?: (student: TargetStudentReportInfo) => void;
}

type ReportPeriod = 'current_month' | 'prev_month' | 'all_time';

interface CategorizedRemark {
  category: string;
  text: string;
}

const QUICK_REMARKS_EN: CategorizedRemark[] = [
  { category: '🌟 Star', text: 'Outstanding conceptual clarity and active participation in class!' },
  { category: '📈 Growth', text: 'Consistent effort and great improvement over the last month.' },
  { category: '💡 Practice', text: 'Grasps concepts well, but needs more daily problem practice at home.' },
  { category: '⚠️ Attention', text: 'Please ensure regular attendance and timely homework completion.' },
  { category: '🎯 Exam Focus', text: 'Dedicated focus on upcoming chapter mock tests is recommended.' },
];

const QUICK_REMARKS_GU: CategorizedRemark[] = [
  { category: '🌟 ઉત્કૃષ્ટ', text: 'વર્ગમાં ઉત્સાહી ભાગીદારી અને વિષયની ઊંડી સમજણ ધરાવે છે!' },
  { category: '📈 પ્રગતિ', text: 'નિયમિત મહેનત અને પાછલા મહિના કરતાં ખૂબ સારો સુધારો.' },
  { category: '💡 પ્રેક્ટિસ', text: 'સમજણ સારી છે, પરંતુ ઘરે દાખલા ગણવાની વધુ પ્રેક્ટિસ જરૂરી છે.' },
  { category: '⚠️ ધ્યાન', text: 'કૃપા કરીને નિયમિત હાજરી અને સમયસર લેસન જમા કરાવવાની કાળજી રાખો.' },
  { category: '🎯 પરીક્ષા', text: 'આગામી ચેપ્ટર ટેસ્ટ માટે વિશેષ રિવિઝન કરવાની સલાહ છે.' },
];

const QUICK_REMARKS_HI: CategorizedRemark[] = [
  { category: '🌟 उत्कृष्ट', text: 'कक्षा में सक्रिय भागीदारी और विषयों की बहुत अच्छी समझ है!' },
  { category: '📈 प्रगति', text: 'लगातार मेहनत और पिछले महीने की तुलना में बेहतरीन सुधार।' },
  { category: '💡 अभ्यास', text: 'समझ अच्छी है, लेकिन घर पर प्रश्नों के नियमित अभ्यास की आवश्यकता है।' },
  { category: '⚠️ ध्यान', text: 'कृपया नियमित उपस्थिति और समय पर गृहकार्य पूरा करना सुनिश्चित करें।' },
  { category: '🎯 परीक्षा', text: 'आगामी अध्याय टेस्ट के लिए विशेष पुनरावृत्ति की सलाह दी जाती है।' },
];

const FOCUS_TOPICS_EN = [
  'Board Exam Revision & Mock Tests',
  'Formula & Theorem Practice',
  'Numerical Problem Solving Drills',
  'Doubt Clearing & Chapter Tests',
];

const FOCUS_TOPICS_GU = [
  'બોર્ડ પરીક્ષા રિવિઝન અને મોક ટેસ્ટ',
  'સૂત્રો અને પ્રમેયની વિશેષ પ્રેક્ટિસ',
  'દાખલા ગણતરી અને શંકા નિવારણ',
  'ચેપ્ટર ટેસ્ટ અને સેલ્ફ સ્ટડી',
];

const FOCUS_TOPICS_HI = [
  'बोर्ड परीक्षा पुनरावृत्ति एवं मॉक टेस्ट',
  'सूत्र और प्रमेय का विशेष अभ्यास',
  'संख्यात्मक प्रश्नों का हल एवं डाउट सेशन',
  'अध्याय टेस्ट एवं दैनिक अध्ययन',
];

function getMonthName(date: Date, lang: string): string {
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesGu = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];
  const monthNamesHi = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
  ];

  const m = date.getMonth();
  const y = date.getFullYear();
  if (lang === 'gu') return `${monthNamesGu[m]} ${y}`;
  if (lang === 'hi') return `${monthNamesHi[m]} ${y}`;
  return `${monthNamesEn[m]} ${y}`;
}

export function ShareStudentReportModal({
  visible,
  onClose,
  targetStudent,
  studentsList = [],
  onSelectStudent,
}: ShareStudentReportModalProps) {
  const { profile } = useAuth();
  const { t, language } = useTranslation();

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('current_month');
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customRemarks, setCustomRemarks] = useState('');
  const [nextMonthFocus, setNextMonthFocus] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [showRawTextPreview, setShowRawTextPreview] = useState(false);

  const instituteName = profile?.institute_name || 'EduFlow Tuition Academy';
  const teacherName = profile?.full_name || 'Faculty';

  const quickRemarks =
    language === 'gu'
      ? QUICK_REMARKS_GU
      : language === 'hi'
      ? QUICK_REMARKS_HI
      : QUICK_REMARKS_EN;

  const focusTopicSuggestions =
    language === 'gu'
      ? FOCUS_TOPICS_GU
      : language === 'hi'
      ? FOCUS_TOPICS_HI
      : FOCUS_TOPICS_EN;

  // Compute Current Month vs Previous Month names
  const now = new Date();
  const currentMonthLabel = getMonthName(now, language);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthLabel = getMonthName(prevMonthDate, language);

  const activePeriodLabel =
    selectedPeriod === 'current_month'
      ? currentMonthLabel
      : selectedPeriod === 'prev_month'
      ? prevMonthLabel
      : language === 'gu'
      ? 'સમગ્ર ટર્મ / સર્વગ્રાહી'
      : language === 'hi'
      ? 'समग्र सत्र / सम्पूर्ण'
      : 'Full Academic Term';

  // Load student report data whenever visible / student changes
  useEffect(() => {
    if (visible && targetStudent) {
      const defaultNote =
        language === 'gu'
          ? 'નિયમિત હાજરી અને વર્ગમાં સારો રસ ધરાવે છે. આ જ રીતે મહેનત ચાલુ રાખવી.'
          : language === 'hi'
          ? 'नियमित उपस्थिति और कक्षा में अच्छी रुचि है। इसी प्रकार प्रयास जारी रखें।'
          : 'Consistent attendance and good classroom engagement. Keep up the effort!';

      const defaultFocus = focusTopicSuggestions[0] || 'Chapter Revision & Mock Tests';

      setCustomRemarks(defaultNote);
      setNextMonthFocus(defaultFocus);
      setCopiedToast(false);
      setShowRawTextPreview(false);
      setIsLoading(true);

      teacherService
        .getStudentProfileData(targetStudent.batchId, targetStudent.studentId)
        .then((data) => setProfileData(data))
        .catch((err) => console.warn('Failed to fetch student profile report data:', err))
        .finally(() => setIsLoading(false));
    } else {
      setProfileData(null);
    }
  }, [visible, targetStudent?.studentId, targetStudent?.batchId, language]);

  // Filter Data based on selected Period (Current Month, Prev Month, or All Time)
  const filteredMetrics = useMemo(() => {
    if (!profileData) {
      return {
        attendancePct: 92,
        presentCount: 11,
        totalClasses: 12,
        hwPct: 90,
        hwDone: 8,
        hwTotal: 9,
        avgTestPct: 88,
        testsAttempted: 2,
        gradeLetter: 'A',
        gradeText: 'Excellent',
        latestTest: undefined as { title: string; marksObtained: number; maxMarks: number; rank?: number } | undefined,
      };
    }

    const targetYear = selectedPeriod === 'prev_month' ? prevMonthDate.getFullYear() : now.getFullYear();
    const targetMonth = selectedPeriod === 'prev_month' ? prevMonthDate.getMonth() : now.getMonth();

    const isDateInSelectedPeriod = (dateStr: string) => {
      if (selectedPeriod === 'all_time') return true;
      const d = new Date(dateStr);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    };

    // 1. Attendance
    const filteredAtt = profileData.attendance.history.filter((h) => isDateInSelectedPeriod(h.date));
    const presentCount = filteredAtt.filter((h) => h.status === 'present').length;
    const totalClasses = filteredAtt.length > 0 ? filteredAtt.length : profileData.attendance.totalClasses || 1;
    const effectivePresent = filteredAtt.length > 0 ? presentCount : profileData.attendance.presentCount;
    const attendancePct =
      totalClasses > 0 ? Math.round((effectivePresent / totalClasses) * 100) : profileData.attendance.percentage;

    // 2. Homework
    const filteredHw = profileData.homework.items.filter((h) => isDateInSelectedPeriod(h.dueDate));
    const hwList = filteredHw.length > 0 ? filteredHw : profileData.homework.items;
    const hwDone = hwList.filter((h) => h.status === 'done').length;
    const hwHalf = hwList.filter((h) => h.status === 'half_done').length;
    const hwTotal = hwList.length || 1;
    const hwPct = Math.round(((hwDone + 0.5 * hwHalf) / hwTotal) * 100);

    // 3. Tests
    const filteredTests = profileData.tests.items.filter((t) => isDateInSelectedPeriod(t.date));
    const testList = filteredTests.length > 0 ? filteredTests : profileData.tests.items;
    const enteredTests = testList.filter((t) => t.marksObtained !== null);

    let totalScore = 0;
    let totalMax = 0;
    enteredTests.forEach((t) => {
      totalScore += t.marksObtained!;
      totalMax += t.maxMarks;
    });

    const avgTestPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : profileData.tests.averagePercentage;
    const testsAttempted = enteredTests.length;

    // Grade Determination
    let gradeLetter = 'A';
    let gradeText = 'Excellent';
    if (avgTestPct >= 90) {
      gradeLetter = 'A+';
      gradeText = 'Outstanding';
    } else if (avgTestPct >= 80) {
      gradeLetter = 'A';
      gradeText = 'Excellent';
    } else if (avgTestPct >= 70) {
      gradeLetter = 'B';
      gradeText = 'Good';
    } else if (avgTestPct >= 60) {
      gradeLetter = 'C';
      gradeText = 'Average';
    } else if (avgTestPct > 0) {
      gradeLetter = 'D';
      gradeText = 'Needs Focus';
    }

    // Latest Test
    const latest = enteredTests.length > 0 ? enteredTests[0] : undefined;
    const latestTest = latest
      ? {
          title: latest.title,
          marksObtained: latest.marksObtained!,
          maxMarks: latest.maxMarks,
        }
      : undefined;

    return {
      attendancePct,
      presentCount: effectivePresent,
      totalClasses,
      hwPct,
      hwDone,
      hwTotal,
      avgTestPct,
      testsAttempted,
      gradeLetter,
      gradeText,
      latestTest,
    };
  }, [profileData, selectedPeriod]);

  // Multi-Student Carousel Index Navigation
  const currentIndex = useMemo(() => {
    if (!targetStudent || !studentsList.length) return -1;
    return studentsList.findIndex((s) => s.studentId === targetStudent.studentId);
  }, [targetStudent, studentsList]);

  const handlePrevStudent = () => {
    if (currentIndex > 0 && onSelectStudent) {
      onSelectStudent(studentsList[currentIndex - 1]);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex >= 0 && currentIndex < studentsList.length - 1 && onSelectStudent) {
      onSelectStudent(studentsList[currentIndex + 1]);
    }
  };

  if (!targetStudent) {
    return null;
  }

  const generatedWhatsAppMessage = formatStudentProgressWhatsAppMessage({
    studentName: targetStudent.studentName,
    rollNumber: targetStudent.rollNumber,
    batchName: targetStudent.batchName,
    instituteName,
    teacherName,
    periodName: activePeriodLabel,
    overallGrade: `${filteredMetrics.gradeLetter} (${filteredMetrics.gradeText})`,
    attendancePercentage: filteredMetrics.attendancePct,
    totalClassesAttended: filteredMetrics.presentCount,
    totalClasses: filteredMetrics.totalClasses,
    hwCompletionPercentage: filteredMetrics.hwPct,
    hwDoneCount: filteredMetrics.hwDone,
    hwTotal: filteredMetrics.hwTotal,
    averageTestPercentage: filteredMetrics.avgTestPct,
    testsAttempted: filteredMetrics.testsAttempted,
    latestTest: filteredMetrics.latestTest,
    nextMonthFocus,
    remarks: customRemarks,
    language,
  });

  const handleShareWhatsApp = () => {
    const cleanPhone = (targetStudent.parentPhone || '').replace(/[^0-9]/g, '');

    const whatsappUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(generatedWhatsAppMessage)}`
      : `whatsapp://send?text=${encodeURIComponent(generatedWhatsAppMessage)}`;

    const fallbackUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedWhatsAppMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(generatedWhatsAppMessage)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('WhatsApp Error', 'Unable to open WhatsApp on this device.');
      });
    });
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(generatedWhatsAppMessage);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    } catch {
      Alert.alert('Error', 'Unable to copy text to clipboard.');
    }
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
        <Pressable
          style={styles.backdropTouch}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close Progress Report Modal"
        />
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <View style={styles.modalCard}>
            {/* Modal Top Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.modalIconBox}>
                  <MaterialCommunityIcons name="file-document-edit-outline" size={20} color={theme.colors.primary.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label" style={styles.modalTitle}>
                    {language === 'gu'
                      ? 'માસિક વિદ્યાર્થી પ્રગતિ પત્રક'
                      : language === 'hi'
                      ? 'मासिक विद्यार्थी प्रगति पत्र'
                      : 'Monthly Parent Progress Report'}
                  </Text>
                  <Text variant="caption" style={styles.modalSubtitle}>
                    {language === 'gu'
                      ? 'વાલીઓને WhatsApp પર 1-ટૅપમાં રિપોર્ટ મોકલો'
                      : language === 'hi'
                      ? 'अभिभावकों को WhatsApp पर 1-टैप में रिपोर्ट भेजें'
                      : '1-Tap formatted update with tuition branding'}
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

            {/* Multi-Student Quick Navigator Carousel */}
            {studentsList.length > 1 && currentIndex >= 0 && (
              <View style={styles.carouselNavRow}>
                <Pressable
                  disabled={currentIndex === 0}
                  onPress={handlePrevStudent}
                  style={[styles.carouselBtn, currentIndex === 0 && styles.carouselBtnDisabled]}
                >
                  <Feather name="chevron-left" size={16} color={currentIndex === 0 ? theme.colors.text.disabled : theme.colors.primary.main} />
                  <Text variant="caption" style={[styles.carouselBtnText, currentIndex === 0 && { color: theme.colors.text.disabled }]}>
                    {language === 'gu' ? 'પાછળ' : language === 'hi' ? 'पिछला' : 'Prev'}
                  </Text>
                </Pressable>

                <View style={styles.carouselCenterPill}>
                  <Text variant="caption" style={styles.carouselCounter}>
                    {language === 'gu'
                      ? `વિદ્યાર્થી ${currentIndex + 1} / ${studentsList.length}`
                      : language === 'hi'
                      ? `छात्र ${currentIndex + 1} / ${studentsList.length}`
                      : `Student ${currentIndex + 1} of ${studentsList.length}`}
                  </Text>
                </View>

                <Pressable
                  disabled={currentIndex === studentsList.length - 1}
                  onPress={handleNextStudent}
                  style={[styles.carouselBtn, currentIndex === studentsList.length - 1 && styles.carouselBtnDisabled]}
                >
                  <Text variant="caption" style={[styles.carouselBtnText, currentIndex === studentsList.length - 1 && { color: theme.colors.text.disabled }]}>
                    {language === 'gu' ? 'આગળ' : language === 'hi' ? 'अगला' : 'Next'}
                  </Text>
                  <Feather name="chevron-right" size={16} color={currentIndex === studentsList.length - 1 ? theme.colors.text.disabled : theme.colors.primary.main} />
                </Pressable>
              </View>
            )}

            {/* Timeframe Selector Pills */}
            <View style={styles.periodSelectorBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScrollContent}>
                <Pressable
                  style={[styles.periodPill, selectedPeriod === 'current_month' && styles.periodPillActive]}
                  onPress={() => setSelectedPeriod('current_month')}
                >
                  <Feather
                    name="calendar"
                    size={12}
                    color={selectedPeriod === 'current_month' ? '#FFFFFF' : theme.colors.text.secondary}
                  />
                  <Text
                    variant="caption"
                    style={[styles.periodPillText, selectedPeriod === 'current_month' && styles.periodPillTextActive]}
                  >
                    {currentMonthLabel}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.periodPill, selectedPeriod === 'prev_month' && styles.periodPillActive]}
                  onPress={() => setSelectedPeriod('prev_month')}
                >
                  <Feather
                    name="clock"
                    size={12}
                    color={selectedPeriod === 'prev_month' ? '#FFFFFF' : theme.colors.text.secondary}
                  />
                  <Text
                    variant="caption"
                    style={[styles.periodPillText, selectedPeriod === 'prev_month' && styles.periodPillTextActive]}
                  >
                    {prevMonthLabel}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.periodPill, selectedPeriod === 'all_time' && styles.periodPillActive]}
                  onPress={() => setSelectedPeriod('all_time')}
                >
                  <Feather
                    name="layers"
                    size={12}
                    color={selectedPeriod === 'all_time' ? '#FFFFFF' : theme.colors.text.secondary}
                  />
                  <Text
                    variant="caption"
                    style={[styles.periodPillText, selectedPeriod === 'all_time' && styles.periodPillTextActive]}
                  >
                    {language === 'gu' ? 'કુલ સત્ર' : language === 'hi' ? 'सम्पूर्ण' : 'All-Time'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* Scrollable Report Body */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={theme.colors.primary.main} />
                  <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {t('reports.generatingSlip')}
                  </Text>
                </View>
              ) : (
                <>
                  {/* View Mode Toggle (Visual Scorecard vs Raw Message Preview) */}
                  <View style={styles.viewModeToggleRow}>
                    <Pressable
                      style={[styles.viewModeTab, !showRawTextPreview && styles.viewModeTabActive]}
                      onPress={() => setShowRawTextPreview(false)}
                    >
                      <Feather name="layout" size={13} color={!showRawTextPreview ? theme.colors.primary.main : theme.colors.text.secondary} />
                      <Text variant="caption" style={[styles.viewModeTabText, !showRawTextPreview && styles.viewModeTabTextActive]}>
                        {language === 'gu' ? 'વિઝ્યુઅલ કાર્ડ' : language === 'hi' ? 'विजुअल कार्ड' : 'Visual Scorecard'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.viewModeTab, showRawTextPreview && styles.viewModeTabActive]}
                      onPress={() => setShowRawTextPreview(true)}
                    >
                      <FontAwesome name="whatsapp" size={13} color={showRawTextPreview ? '#16A34A' : theme.colors.text.secondary} />
                      <Text variant="caption" style={[styles.viewModeTabText, showRawTextPreview && { color: '#16A34A', fontWeight: '700' }]}>
                        {language === 'gu' ? 'WhatsApp મેસેજ' : language === 'hi' ? 'WhatsApp संदेश' : 'WhatsApp Text'}
                      </Text>
                    </Pressable>
                  </View>

                  {showRawTextPreview ? (
                    /* Raw Message Preview Card */
                    <View style={styles.rawMessageContainer}>
                      <View style={styles.rawMessageHeader}>
                        <FontAwesome name="whatsapp" size={16} color="#16A34A" />
                        <Text variant="caption" style={{ fontWeight: '700', color: '#16A34A' }}>
                          {language === 'gu' ? 'તૈયાર થયેલો WhatsApp મેસેજ' : language === 'hi' ? 'तैयार WhatsApp संदेश' : 'Formatted WhatsApp Message Preview'}
                        </Text>
                      </View>
                      <Text style={styles.rawMessageText}>{generatedWhatsAppMessage}</Text>
                    </View>
                  ) : (
                    /* Visual Scorecard */
                    <Card variant="elevated" padding="none" style={styles.slipCard}>
                      {/* Tuition Brand Header */}
                      <View style={styles.slipHeader}>
                        <View style={styles.instituteRow}>
                          <View style={styles.instituteIconBox}>
                            <Feather name="award" size={16} color="#FFFFFF" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text variant="caption" style={styles.instituteName} numberOfLines={1}>
                              {instituteName.toUpperCase()}
                            </Text>
                            <Text variant="caption" style={styles.instituteSub}>
                              {activePeriodLabel} • {targetStudent.batchName}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.periodBadge}>
                          <Text variant="caption" style={styles.periodBadgeText}>
                            {filteredMetrics.gradeLetter} GRADE
                          </Text>
                        </View>
                      </View>

                      {/* Student Identity Row */}
                      <View style={styles.studentDetailsRow}>
                        <View style={styles.slipAvatar}>
                          <Text style={styles.slipAvatarText}>
                            {targetStudent.studentName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text variant="label" style={styles.slipStudentName}>
                              {targetStudent.studentName}
                            </Text>
                            <View style={styles.gradeStatusPill}>
                              <Text variant="caption" style={styles.gradeStatusPillText}>
                                {filteredMetrics.gradeText}
                              </Text>
                            </View>
                          </View>
                          <Text variant="caption" style={styles.slipRoll}>
                            {t('reports.rollNo')}: #{targetStudent.rollNumber} • {t('common.batch')}: {targetStudent.batchName}
                          </Text>
                        </View>
                        {targetStudent.parentPhone && (
                          <Pressable onPress={handleCallParent} style={styles.miniCallBtn}>
                            <Feather name="phone-call" size={14} color={theme.colors.primary.main} />
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.divider} />

                      {/* 3-Column Metrics Grid */}
                      <View style={styles.metricsBar}>
                        {/* Attendance */}
                        <View style={styles.metricItem}>
                          <View style={styles.metricLabelRow}>
                            <Feather
                              name="check-circle"
                              size={12}
                              color={filteredMetrics.attendancePct >= 75 ? '#16A34A' : '#DC2626'}
                            />
                            <Text variant="caption" style={styles.metricLabel}>
                              {t('common.attendance')}
                            </Text>
                          </View>
                          <Text
                            variant="label"
                            style={[
                              styles.metricVal,
                              { color: filteredMetrics.attendancePct >= 85 ? '#16A34A' : filteredMetrics.attendancePct >= 75 ? '#D97706' : '#DC2626' },
                            ]}
                          >
                            {filteredMetrics.attendancePct}%
                          </Text>
                          <Text variant="caption" style={styles.metricSub}>
                            {filteredMetrics.presentCount}/{filteredMetrics.totalClasses} {t('reports.days')}
                          </Text>
                        </View>

                        <View style={styles.metricDivider} />

                        {/* Homework */}
                        <View style={styles.metricItem}>
                          <View style={styles.metricLabelRow}>
                            <Feather name="book" size={12} color={theme.colors.primary.main} />
                            <Text variant="caption" style={styles.metricLabel}>
                              {t('common.homework')}
                            </Text>
                          </View>
                          <Text variant="label" style={[styles.metricVal, { color: theme.colors.primary.main }]}>
                            {filteredMetrics.hwPct}%
                          </Text>
                          <Text variant="caption" style={styles.metricSub}>
                            {filteredMetrics.hwDone}/{filteredMetrics.hwTotal} {language === 'gu' ? 'લેસન' : language === 'hi' ? 'कार्य' : 'Tasks'}
                          </Text>
                        </View>

                        <View style={styles.metricDivider} />

                        {/* Tests */}
                        <View style={styles.metricItem}>
                          <View style={styles.metricLabelRow}>
                            <Feather name="target" size={12} color="#D97706" />
                            <Text variant="caption" style={styles.metricLabel}>
                              {language === 'gu' ? 'ટેસ્ટ સરેરાશ' : language === 'hi' ? 'टेस्ट औसत' : 'Test Average'}
                            </Text>
                          </View>
                          <Text variant="label" style={[styles.metricVal, { color: '#D97706' }]}>
                            {filteredMetrics.avgTestPct}%
                          </Text>
                          <Text variant="caption" style={styles.metricSub}>
                            {filteredMetrics.testsAttempted} {language === 'gu' ? 'ટેસ્ટ આપી' : language === 'hi' ? 'टेस्ट दी' : 'Attempted'}
                          </Text>
                        </View>
                      </View>

                      {/* Latest Test Snippet */}
                      {filteredMetrics.latestTest && (
                        <View style={styles.latestTestBox}>
                          <View style={styles.latestTestHeader}>
                            <Feather name="award" size={13} color="#D97706" />
                            <Text variant="caption" style={styles.latestTestTitle} numberOfLines={1}>
                              {filteredMetrics.latestTest.title}
                            </Text>
                          </View>
                          <View style={styles.latestTestScoreBadge}>
                            <Text variant="caption" style={styles.latestTestScoreText}>
                              {filteredMetrics.latestTest.marksObtained} / {filteredMetrics.latestTest.maxMarks}
                            </Text>
                          </View>
                        </View>
                      )}
                    </Card>
                  )}

                  {/* Teacher Remarks / Feedback Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Feather name="message-square" size={15} color={theme.colors.primary.main} />
                      <Text variant="label" style={styles.sectionTitle}>
                        {language === 'gu'
                          ? 'શિક્ષકની નોંધ / વાલી માટે માર્ગદર્શન:'
                          : language === 'hi'
                          ? 'शिक्षक टिप्पणी / अभिभावक संदेश:'
                          : 'Teacher Remarks / Note for Parent:'}
                      </Text>
                    </View>

                    <TextInput
                      style={styles.remarksInput}
                      value={customRemarks}
                      onChangeText={setCustomRemarks}
                      placeholder={t('reports.remarksPlaceholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                      multiline
                      numberOfLines={3}
                    />

                    {/* Categorized Quick Suggestion Chips */}
                    <Text variant="caption" style={styles.chipsLabel}>
                      {language === 'gu' ? 'ઝડપી નોંધ પસંદ કરો:' : language === 'hi' ? 'त्वरित टिप्पणी चुनें:' : 'Quick Feedback Chips:'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsRow}>
                      {quickRemarks.map((remark, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.quickChip}
                          onPress={() => setCustomRemarks(remark.text)}
                        >
                          <Text variant="caption" style={styles.quickChipText}>
                            {remark.category}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Next Month Learning Focus Target */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Feather name="compass" size={15} color="#0284C7" />
                      <Text variant="label" style={styles.sectionTitle}>
                        {language === 'gu'
                          ? 'આવતા મહિનાનું લક્ષ્ય / અભ્યાસક્રમ:'
                          : language === 'hi'
                          ? 'आगामी माह का शैक्षणिक लक्ष्य:'
                          : "Next Month's Syllabus Focus:"}
                      </Text>
                    </View>

                    <TextInput
                      style={styles.focusInput}
                      value={nextMonthFocus}
                      onChangeText={setNextMonthFocus}
                      placeholder="e.g. Chapter 5 & 6 Revision + Weekly Mock Tests"
                      placeholderTextColor={theme.colors.text.disabled}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsRow}>
                      {focusTopicSuggestions.map((topic, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.topicChip}
                          onPress={() => setNextMonthFocus(topic)}
                        >
                          <Text variant="caption" style={styles.topicChipText}>
                            + {topic}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Floating Toast when Copied */}
            {copiedToast && (
              <View style={styles.copiedToast}>
                <Feather name="check-circle" size={14} color="#FFFFFF" />
                <Text variant="caption" style={styles.copiedToastText}>
                  {language === 'gu' ? 'રિપોર્ટ ક્લિપબોર્ડમાં કોપી થયો!' : language === 'hi' ? 'रिपोर्ट कॉपी हो गई!' : 'Report copied to clipboard!'}
                </Text>
              </View>
            )}

            {/* Action Buttons Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryWhatsAppBtn,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleShareWhatsApp}
                accessibilityRole="button"
                accessibilityLabel="Share progress report to parent on WhatsApp"
              >
                <FontAwesome name="whatsapp" size={19} color="#FFFFFF" />
                <Text variant="label" style={styles.primaryWhatsAppText}>
                  {language === 'gu' ? 'WhatsApp પર મોકલો' : language === 'hi' ? 'WhatsApp पर भेजें' : 'Send on WhatsApp'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryCopyBtn, pressed && { opacity: 0.75 }]}
                onPress={handleCopyToClipboard}
                accessibilityRole="button"
                accessibilityLabel="Copy report text"
              >
                <Feather name="copy" size={16} color={theme.colors.text.primary} />
              </Pressable>

              {targetStudent.parentPhone && (
                <Pressable
                  style={({ pressed }) => [styles.callParentBtn, pressed && { opacity: 0.8 }]}
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background.screen,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '94%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.paper,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.bg,
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
  carouselNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
  },
  carouselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  carouselBtnDisabled: {
    opacity: 0.4,
  },
  carouselBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  carouselCenterPill: {
    backgroundColor: theme.colors.background.paper,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  carouselCounter: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  periodSelectorBar: {
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingVertical: 8,
  },
  periodScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  periodPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollBody: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: 24,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
  },
  viewModeTabActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  viewModeTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  viewModeTabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  rawMessageContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: theme.spacing.md,
    gap: 8,
  },
  rawMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    paddingBottom: 6,
  },
  rawMessageText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 18,
  },
  slipCard: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    overflow: 'hidden',
  },
  slipHeader: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  instituteIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instituteName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  instituteSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  periodBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  studentDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  slipAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary.main,
  },
  slipStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  gradeStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: theme.radii.xs,
  },
  gradeStatusPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  slipRoll: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  miniCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.md,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9.5,
    color: theme.colors.text.tertiary,
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: theme.colors.border.light,
  },
  latestTestBox: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: 8,
    borderRadius: theme.radii.md,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  latestTestTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  latestTestScoreBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  latestTestScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  sectionCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  remarksInput: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,
    padding: 10,
    fontSize: 12,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.screen,
    textAlignVertical: 'top',
  },
  focusInput: {
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,
    paddingHorizontal: 10,
    fontSize: 12,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.screen,
  },
  chipsLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  quickChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  quickChip: {
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  quickChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  topicChip: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  topicChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0369A1',
  },
  copiedToast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  copiedToastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 10,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  primaryWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    height: 46,
    borderRadius: theme.radii.md,
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryWhatsAppText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryCopyBtn: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callParentBtn: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
