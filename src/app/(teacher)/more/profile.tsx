import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();

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
      <ScreenHeader title="Teacher Profile" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Profile Avatar Card */}
        <Card variant="elevated" padding="lg" style={styles.profileHeaderCard}>
          <View style={styles.avatarBox}>
            <Text variant="title" style={styles.avatarText}>
              {(profile?.full_name ?? 'Teacher').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="heading" style={styles.nameText}>
            {profile?.full_name ?? 'Teacher'}
          </Text>
          <Badge label="Teacher Account" variant="primary" icon="user" />
        </Card>

        {/* Profile Details Card */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionTitle}>
            Account Information
          </Text>
          <Card variant="outlined" padding="none" style={styles.infoCard}>
            <View style={[styles.infoRow, styles.rowBorder]}>
              <View style={styles.iconBox}>
                <Feather name="mail" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.infoMeta}>
                <Text variant="caption" style={styles.infoLabel}>
                  Email Address
                </Text>
                <Text variant="body" style={styles.infoValue}>
                  {user?.email ?? 'teacher@eduflow.app'}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, styles.rowBorder]}>
              <View style={styles.iconBox}>
                <Feather name="shield" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.infoMeta}>
                <Text variant="caption" style={styles.infoLabel}>
                  Assigned Role
                </Text>
                <Text variant="body" style={styles.infoValue}>
                  Faculty / Instructor
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Feather name="home" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.infoMeta}>
                <Text variant="caption" style={styles.infoLabel}>
                  Institute
                </Text>
                <Text variant="body" style={styles.infoValue}>
                  EduFlow Coaching Institute
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
  profileHeaderCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  nameText: {
    color: theme.colors.text.primary,
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
  infoCard: {
    overflow: 'hidden',
  },
  infoRow: {
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
  infoMeta: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: theme.colors.text.secondary,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
});
