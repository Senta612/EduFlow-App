import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LanguageSelectorModal } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export default function TeacherSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { t, currentLanguageOption } = useTranslation();

  const [classReminders, setClassReminders] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [homeworkNotifs, setHomeworkNotifs] = useState(true);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
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
                onValueChange={setClassReminders}
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
                onValueChange={setAttendanceAlerts}
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
                onValueChange={setHomeworkNotifs}
                trackColor={{
                  false: '#CBD5E1',
                  true: theme.colors.primary.main,
                }}
              />
            </View>
          </Card>
        </View>

        {/* 3. Security & App Info */}
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
