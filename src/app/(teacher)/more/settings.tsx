import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SignOutModal } from '@/components/ui/SignOutModal';
import { LanguageSelectorModal, SyncStatusBadge } from '@/components/common';
import { TeacherPaymentConfigModal } from '@/components/teacher';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherPreferences } from '@/providers';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

import { notificationService } from '@/services/notifications/notification.service';
import { syncQueueService } from '@/services/offline';
import { SyncQueueSnapshot } from '@/services/offline/types';

export default function TeacherSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const {
    isFeeStatusEnabled,
    setFeeStatusEnabled,
    paymentConfig,
    updatePaymentConfig,
  } = useTeacherPreferences();
  const { t, currentLanguageOption } = useTranslation();

  const [classReminders, setClassReminders] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [homeworkNotifs, setHomeworkNotifs] = useState(true);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [syncSnapshot, setSyncSnapshot] = useState<SyncQueueSnapshot>({
    status: 'synced',
    pendingCount: 0,
    lastSyncedAt: null,
    isOnline: true,
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    return syncQueueService.subscribe((snap) => {
      setSyncSnapshot(snap);
    });
  }, []);

  const handleManualSyncNow = async () => {
    setIsManualSyncing(true);
    try {
      const res = await syncQueueService.drainQueue();
      if (res.processed > 0) {
        Alert.alert('Sync Complete! 🟢', `Successfully synced ${res.processed} offline changes to cloud.`);
      } else if (res.remaining === 0) {
        Alert.alert('All Synced! 🟢', 'All your classroom records are up to date in the cloud.');
      } else {
        Alert.alert('Offline Mode 🟡', 'Unable to reach cloud servers right now. Changes remain safely stored on this device.');
      }
    } finally {
      setIsManualSyncing(false);
    }
  };

  useEffect(() => {
    notificationService.getSettings().then((s) => {
      setClassReminders(s.classReminders);
      setAttendanceAlerts(s.attendanceAlerts);
      setHomeworkNotifs(s.homeworkNotifs);
    });
  }, []);

  const handleToggleClassReminders = async (val: boolean) => {
    if (val) {
      const granted = await notificationService.requestPermissions();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert(
          'Permission Required',
          'Please grant notification permission in your device settings to receive class reminders.',
        );
        return;
      }
    }
    setClassReminders(val);
    await notificationService.saveSettings({ classReminders: val });
  };

  const handleToggleAttendanceAlerts = async (val: boolean) => {
    if (val) {
      const granted = await notificationService.requestPermissions();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert(
          'Permission Required',
          'Please grant notification permission in your device settings to receive attendance alerts.',
        );
        return;
      }
      await notificationService.scheduleDailyAttendanceAlert();
    }
    setAttendanceAlerts(val);
    await notificationService.saveSettings({ attendanceAlerts: val });
  };

  const handleToggleHomeworkNotifs = async (val: boolean) => {
    setHomeworkNotifs(val);
    await notificationService.saveSettings({ homeworkNotifs: val });
  };

  const handleSignOut = () => {
    setIsSignOutModalVisible(true);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* 1. Language & Localization Settings */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Language & Region
          </Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <Pressable
              style={({ pressed }) => [
                styles.settingRow,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setIsLanguageModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Change app language"
            >
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primary.bg }]}>
                <Feather name="globe" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  {t('settings.language')}
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  {t('settings.selectLanguage')}
                </Text>
              </View>

              {/* Current Language Pill */}
              <View style={styles.currentLangPill}>
                <Text style={styles.flagEmoji}>{currentLanguageOption.flag}</Text>
                <Text variant="caption" style={styles.currentLangText}>
                  {currentLanguageOption.nativeLabel}
                </Text>
                <Feather name="chevron-right" size={14} color={theme.colors.primary.main} />
              </View>
            </Pressable>
          </Card>
        </View>

        {/* 2. Notification Settings */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            {t('settings.notifications')}
          </Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <View style={[styles.settingRow, styles.rowBorder]}>
              <View style={styles.iconBox}>
                <Feather name="clock" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  {t('settings.classReminders')}
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  Get reminded 15 minutes before class begins
                </Text>
              </View>
              <Switch
                value={classReminders}
                onValueChange={handleToggleClassReminders}
                trackColor={{
                  false: '#CBD5E1',
                  true: theme.colors.primary.main,
                }}
              />
            </View>

            <View style={[styles.settingRow, styles.rowBorder]}>
              <View style={styles.iconBox}>
                <Feather
                  name="check-square"
                  size={16}
                  color={theme.colors.primary.main}
                />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  {t('settings.attendanceAlerts')}
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  Daily reminder if attendance is unsubmitted
                </Text>
              </View>
              <Switch
                value={attendanceAlerts}
                onValueChange={handleToggleAttendanceAlerts}
                trackColor={{
                  false: '#CBD5E1',
                  true: theme.colors.primary.main,
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.iconBox}>
                <Feather
                  name="book-open"
                  size={16}
                  color={theme.colors.primary.main}
                />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Homework Submissions
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  Notifications when students submit homework
                </Text>
              </View>
              <Switch
                value={homeworkNotifs}
                onValueChange={handleToggleHomeworkNotifs}
                trackColor={{
                  false: '#CBD5E1',
                  true: theme.colors.primary.main,
                }}
              />
            </View>
          </Card>
        </View>

        {/* 3. Classroom Preferences */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Classroom Preferences
          </Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <View style={styles.settingRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isFeeStatusEnabled
                      ? '#EDE9FE'
                      : theme.colors.background.screen,
                  },
                ]}
              >
                <Feather
                  name="credit-card"
                  size={16}
                  color={
                    isFeeStatusEnabled
                      ? '#7C3AED'
                      : theme.colors.primary.main
                  }
                />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Student Fee Status Tracking
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  Track fee payments (Paid, Pending, Overdue) & free seats
                </Text>
              </View>
              <Switch
                value={isFeeStatusEnabled}
                onValueChange={setFeeStatusEnabled}
                trackColor={{
                  false: '#CBD5E1',
                  true: theme.colors.primary.main,
                }}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.settingRow,
                { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setIsPaymentModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Setup UPI & Online Fee Portal"
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: paymentConfig?.isEnabled
                      ? '#DCFCE7'
                      : theme.colors.primary.bg,
                  },
                ]}
              >
                <Feather
                  name="credit-card"
                  size={16}
                  color={
                    paymentConfig?.isEnabled
                      ? '#16A34A'
                      : theme.colors.primary.main
                  }
                />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Student Payment QR & UPI Setup
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  {paymentConfig?.upiId
                    ? `UPI: ${paymentConfig.upiId}`
                    : 'Add UPI ID, custom QR & payment instructions'}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={theme.colors.text.tertiary} />
            </Pressable>
          </Card>
        </View>

        {/* 4. Offline Data & Cloud Sync */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Offline Data & Cloud Sync
          </Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <View style={styles.settingRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      syncSnapshot.pendingCount > 0 ? '#FEF3C7' : '#DCFCE7',
                  },
                ]}
              >
                <Feather
                  name={syncSnapshot.pendingCount > 0 ? 'cloud-off' : 'cloud'}
                  size={16}
                  color={
                    syncSnapshot.pendingCount > 0 ? '#D97706' : '#16A34A'
                  }
                />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Cloud Data Status
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  {syncSnapshot.pendingCount > 0
                    ? `${syncSnapshot.pendingCount} offline changes queued`
                    : 'All attendance & records backed up'}
                </Text>
              </View>
              <SyncStatusBadge showWhenSynced />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.settingRow,
                { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleManualSyncNow}
              accessibilityRole="button"
              accessibilityLabel="Sync offline changes now"
            >
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primary.bg }]}>
                <Feather name="refresh-cw" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Sync Offline Changes Now
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  {syncSnapshot.lastSyncedAt
                    ? `Last synced: ${new Date(syncSnapshot.lastSyncedAt).toLocaleTimeString()}`
                    : 'Reconcile local queue with Supabase'}
                </Text>
              </View>
              {isManualSyncing ? (
                <ActivityIndicator size="small" color={theme.colors.primary.main} />
              ) : (
                <Feather name="chevron-right" size={16} color={theme.colors.text.tertiary} />
              )}
            </Pressable>
          </Card>
        </View>

        {/* 5. Security & App Info */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Account & Security
          </Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.iconBox}>
                <Feather name="shield" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Data Isolation & Security
                </Text>
                <Text variant="caption" style={styles.settingSubtitle}>
                  Session is end-to-end encrypted and scoped
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* 4. Sign Out Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('auth.signOut')}
            variant="danger"
            icon="log-out"
            fullWidth
            onPress={handleSignOut}
          />
          <Text variant="caption" style={styles.versionText}>
            {t('settings.appVersion')} • 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        visible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
      />

      {/* Teacher Payment & UPI Setup Modal */}
      <TeacherPaymentConfigModal
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
        initialConfig={paymentConfig}
        onSave={updatePaymentConfig}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingMeta: {
    flex: 1,
    gap: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  settingSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  currentLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
  },
  flagEmoji: {
    fontSize: 14,
  },
  currentLangText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  buttonContainer: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  versionText: {
    color: theme.colors.text.disabled,
    fontSize: 11,
  },
});
