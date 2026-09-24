import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StudentTodayClass } from '@/types/student';
import { theme } from '@/theme';

interface NextClassHeroCardProps {
  nextClass?: StudentTodayClass;
  onPress?: () => void;
}

export function NextClassHeroCard({ nextClass, onPress }: NextClassHeroCardProps) {
  if (!nextClass) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Feather name="coffee" size={24} color={theme.colors.state.success} />
        </View>
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>No More Classes Today</Text>
          <Text style={styles.emptySubtitle}>You're all done with today's scheduled lectures!</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <View style={styles.pillContainer}>
          <View style={styles.liveDot} />
          <Text style={styles.pillText}>NEXT CLASS</Text>
        </View>
        <Badge
          label={nextClass.status === 'ongoing' ? 'In Progress' : 'Upcoming'}
          variant={nextClass.status === 'ongoing' ? 'warning' : 'primary'}
          size="sm"
        />
      </View>

      <View style={styles.bodySection}>
        <Text style={styles.subjectText}>{nextClass.subject}</Text>
        <Text style={styles.batchText}>{nextClass.batchName}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="clock" size={14} color={theme.colors.text.secondary} />
          <Text style={styles.detailText}>{nextClass.timing}</Text>
        </View>

        {nextClass.room ? (
          <View style={styles.detailItem}>
            <Feather name="map-pin" size={14} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{nextClass.room}</Text>
          </View>
        ) : null}

        {nextClass.teacherName ? (
          <View style={styles.detailItem}>
            <Feather name="user" size={14} color={theme.colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {nextClass.teacherName}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.main + '25',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.main + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.main,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary.main,
    letterSpacing: 0.5,
  },
  bodySection: {
    marginBottom: theme.spacing.sm,
  },
  subjectText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  batchText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.state.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextContainer: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
