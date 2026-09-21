import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  route: string;
  badge?: string;
}

export default function TeacherMoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const { t } = useTranslation();

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Teaching & Insights',
      items: [
        {
          icon: 'bar-chart-2',
          title: t('reports.title'),
          subtitle: t('reports.subtitle'),
          route: '/(teacher)/more/reports',
        },
        {
          icon: 'bell',
          title: 'Notifications',
          subtitle: 'Announcements & system updates',
          route: '/(teacher)/more/notifications',
        },
      ],
    },
    {
      title: 'Account & Preferences',
      items: [
        {
          icon: 'user',
          title: t('profile.title'),
          subtitle: t('profile.subtitle'),
          route: '/(teacher)/more/profile',
        },
        {
          icon: 'settings',
          title: t('settings.title'),
          subtitle: t('settings.subtitle'),
          route: '/(teacher)/more/settings',
        },
      ],
    },
  ];

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="More" subtitle="Account, reports & preferences" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Profile Card Header */}
        <Card
          variant="elevated"
          padding="md"
          style={styles.profileCard}
          onPress={() => router.push('/(teacher)/more/profile')}
        >
          <View style={styles.avatarBox}>
            <Text variant="heading" style={styles.avatarText}>
              {(profile?.full_name ?? 'Teacher').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text variant="heading" style={styles.profileName}>
                {profile?.full_name ?? 'Teacher'}
              </Text>
              <Badge label="Teacher" variant="primary" size="sm" />
            </View>
            <Text variant="caption" style={styles.profileEmail}>
              {user?.email ?? 'teacher@eduflow.app'}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={theme.colors.text.secondary}
          />
        </Card>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="caption" style={styles.sectionHeaderTitle}>
              {section.title}
            </Text>
            <Card variant="outlined" padding="none" style={styles.menuCard}>
              {section.items.map((item, idx) => {
                const isLast = idx === section.items.length - 1;
                return (
                  <Pressable
                    key={item.title}
                    style={[
                      styles.menuItem,
                      !isLast && styles.menuItemBorder,
                    ]}
                    onPress={() => router.push(item.route as unknown as Href)}
                  >
                    <View style={styles.menuIconBox}>
                      <Feather
                        name={item.icon}
                        size={18}
                        color={theme.colors.primary.main}
                      />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text variant="label" style={styles.menuTitle}>
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text variant="caption" style={styles.menuSubtitle}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}

        {/* Sign Out Card */}
        <View style={styles.section}>
          <Card variant="outlined" padding="none" style={styles.menuCard}>
            <Pressable
              style={styles.signOutItem}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <View style={styles.signOutIconBox}>
                <Feather
                  name="log-out"
                  size={18}
                  color={theme.colors.semantic.danger.main}
                />
              </View>
              <View style={styles.menuMeta}>
                <Text
                  variant="label"
                  style={[
                    styles.menuTitle,
                    { color: theme.colors.semantic.danger.main },
                  ]}
                >
                  Sign Out
                </Text>
                <Text variant="caption" style={styles.menuSubtitle}>
                  Log out of this account
                </Text>
              </View>
            </Pressable>
          </Card>
        </View>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text variant="caption" style={styles.versionText}>
            EduFlow Teacher v1.0.0
          </Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.lg,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  profileName: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
  },
  profileEmail: {
    color: theme.colors.text.secondary,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionHeaderTitle: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuMeta: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    color: theme.colors.text.primary,
  },
  menuSubtitle: {
    color: theme.colors.text.secondary,
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  signOutIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.semantic.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  versionText: {
    color: theme.colors.text.disabled,
  },
});
