import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LanguageSelectorModal } from '@/components/common/LanguageSelectorModal';
import { AttendanceMonthlyCalendar } from '@/components/student-portal';
import { StudentService } from '@/services/student.service';
import { StudentDashboardSummary, StudentAttendanceOverview } from '@/types/student';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const { t, language } = useTranslation();

  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sum, att] = await Promise.all([
        StudentService.getDashboardSummary(profile?.id),
        StudentService.getAttendanceOverview(profile?.id),
      ]);
      setSummary(sum);
      setAttendance(att);
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCallTeacher = () => {
    const phone = summary?.enrolledBatch?.teacherPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Contact Unavailable', 'Teacher phone number is not listed.');
    }
  };

  const handleEmailTeacher = () => {
    const email = summary?.enrolledBatch?.teacherEmail;
    if (email) {
      Linking.openURL(`mailto:${email}?subject=EduFlow Student Query - ${summary?.studentName || 'Student'}`);
    } else {
      Alert.alert('Contact Unavailable', 'Teacher email address is not listed.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (err) {
              console.error('Failed to sign out:', err);
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const studentName = profile?.full_name || summary?.studentName || user?.email?.split('@')[0] || 'Student';
  const rollNumber = summary?.rollNumber || '-';
  const batch = summary?.enrolledBatch;

  const initials = studentName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Student Profile"
        subtitle="Identity, attendance record & faculty contacts"
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading profile details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText}>{studentName}</Text>
                  {batch ? <Badge label="Enrolled" variant="success" size="sm" /> : <Badge label="Student" variant="neutral" size="sm" />}
                </View>

                {rollNumber !== '-' && <Text style={styles.rollText}>Roll Number: #{rollNumber}</Text>}
                <Text style={styles.emailText}>{profile?.phone || profile?.email || user?.email || 'Student Account'}</Text>
              </View>
            </View>

            {batch ? (
              <View style={styles.batchSection}>
                <View style={styles.batchRow}>
                  <Feather name="layers" size={14} color={theme.colors.primary.main} />
                  <Text style={styles.batchTitle}>{batch.name}</Text>
                </View>

                <View style={styles.batchDetailsRow}>
                  <Text style={styles.batchDetailText}>{batch.subject}</Text>
                  <Text style={styles.batchDetailDot}>•</Text>
                  <Text style={styles.batchDetailText}>{batch.schedule}</Text>
                  <Text style={styles.batchDetailDot}>•</Text>
                  <Text style={styles.batchDetailText}>{batch.timing}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Attendance Breakdown */}
          {attendance ? (
            <AttendanceMonthlyCalendar data={attendance} />
          ) : null}

          {/* Teacher & Institute Contact Card */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.teacherIconBox}>
                <Feather name="user-check" size={20} color={theme.colors.primary.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactTitle}>{batch?.teacherName || 'Faculty In-Charge'}</Text>
                <Text style={styles.contactSubtitle}>{batch?.instituteName || 'Zenith Academy'}</Text>
              </View>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={handleCallTeacher}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={16} color={theme.colors.primary.main} />
                <Text style={styles.contactBtnText}>Call Faculty</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactBtn}
                onPress={handleEmailTeacher}
                activeOpacity={0.8}
              >
                <Feather name="mail" size={16} color={theme.colors.primary.main} />
                <Text style={styles.contactBtnText}>Email Query</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Preferences & Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsHeading}>App Preferences</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setIsLangModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Feather name="globe" size={18} color={theme.colors.primary.main} />
                <View>
                  <Text style={styles.settingTitle}>{t('settings.language')}</Text>
                  <Text style={styles.settingDesc}>
                    {language === 'gu' ? 'ગુજરાતી' : language === 'hi' ? 'हिंदी' : 'English'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={theme.colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Feather name="shield" size={18} color={theme.colors.state.info} />
                <View>
                  <Text style={styles.settingTitle}>Role Session</Text>
                  <Text style={styles.settingDesc}>Student Portal (Read & Submit Access)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <View style={styles.signOutSection}>
            <Button
              title={isSigningOut ? 'Signing out...' : t('auth.signOut')}
              variant="danger"
              fullWidth
              onPress={handleSignOut}
              disabled={isSigningOut}
            />
          </View>
        </ScrollView>
      )}

      <LanguageSelectorModal
        visible={isLangModalVisible}
        onClose={() => setIsLangModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  profileCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  rollText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  emailText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  batchSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  batchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  batchDetailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  batchDetailDot: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginHorizontal: 6,
  },
  contactCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  teacherIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  contactSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  contactActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.main + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary.main + '25',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  settingsCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.sm,
  },
  settingsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  settingDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  signOutSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});
