import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function TeacherSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const [classReminders, setClassReminders] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [homeworkNotifs, setHomeworkNotifs] = useState(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Settings"
        subtitle="Preferences & account controls"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Push Notifications
          </Text>
          <Card variant="outlined" padding="none" style={styles.card}>
            <View style={[styles.settingRow, styles.rowBorder]}>
              <View style={styles.iconBox}>
                <Feather name="clock" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.settingMeta}>
                <Text variant="label" style={styles.settingTitle}>
                  Class Schedule Reminders
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
                  Pending Attendance Alerts
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

        {/* Security & Session */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Account & Security
          </Text>
          <Card variant="outlined" padding="none" style={styles.card}>
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

        {/* Sign Out Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Sign Out"
            variant="danger"
            fullWidth
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </View>
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
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingMeta: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    color: theme.colors.text.primary,
  },
  settingSubtitle: {
    color: theme.colors.text.secondary,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
});
