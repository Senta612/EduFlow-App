import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/theme';

interface StudentHeaderProps {
  studentName: string;
  rollNumber?: string;
  batchName?: string;
  onProfilePress?: () => void;
  onRefreshPress?: () => void;
  isRefreshing?: boolean;
}

export function StudentHeader({
  studentName,
  rollNumber,
  batchName,
  onProfilePress,
  onRefreshPress,
  isRefreshing,
}: StudentHeaderProps) {
  // Extract initials for avatar
  const initials = studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'ST'}</Text>
          </View>
          <View>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.studentName} numberOfLines={1}>
                {studentName}
              </Text>
            </View>
            <View style={styles.metaRow}>
              {rollNumber ? (
                <Text style={styles.rollNumber}>Roll #{rollNumber}</Text>
              ) : null}
              {rollNumber && batchName ? (
                <Text style={styles.metaDot}>•</Text>
              ) : null}
              {batchName ? (
                <Text style={styles.batchName} numberOfLines={1}>
                  {batchName}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {onRefreshPress ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onRefreshPress}
              disabled={isRefreshing}
              activeOpacity={0.7}
            >
              <Feather
                name="refresh-cw"
                size={18}
                color={isRefreshing ? theme.colors.primary.main : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.badgeBtn}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Badge label="Student" variant="primary" size="sm" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  greetingRow: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rollNumber: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginHorizontal: 4,
  },
  batchName: {
    fontSize: 12,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  badgeBtn: {
    marginLeft: 4,
  },
});
