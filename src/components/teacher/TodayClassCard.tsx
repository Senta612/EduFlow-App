import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Batch, AttendanceRecord } from '@/types/teacher';
import { theme } from '@/theme';

interface ScheduledBatchItem extends Batch {
  attendanceTakenForDate: boolean;
  attendanceRecord?: AttendanceRecord;
}

interface TodayClassCardProps {
  cls: ScheduledBatchItem;
  onTakeAttendance: (batchId: string) => void;
  onOpenBatchWorkspace: (batchId: string) => void;
}

export const TodayClassCard: React.FC<TodayClassCardProps> = ({
  cls,
  onTakeAttendance,
  onOpenBatchWorkspace,
}) => {
  const isAttendancePending = !cls.attendanceTakenForDate;
  const rec = cls.attendanceRecord;

  return (
    <Card
      variant="elevated"
      padding="md"
      style={[styles.classCard, isAttendancePending && styles.classCardPending]}
    >
      {/* Class Meta Header */}
      <View style={styles.classCardHeader}>
        <View style={styles.classTitleGroup}>
          <Text variant="heading" style={styles.classSubject}>
            {cls.name}
          </Text>
          <Text variant="body" style={styles.classGrade}>
            {cls.grade} • {cls.subject}
          </Text>
        </View>

        {isAttendancePending ? (
          <Badge
            label="Attendance Pending"
            variant="warning"
            size="sm"
            icon="alert-circle"
          />
        ) : (
          <Badge
            label={rec ? `${rec.presentCount} Present` : 'Attendance Done'}
            variant="success"
            size="sm"
            icon="check"
          />
        )}
      </View>

      {/* Schedule & Room info */}
      <View style={styles.classMetaRow}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={14} color={theme.colors.text.secondary} />
          <Text variant="caption" style={styles.metaText}>
            {cls.timing}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="users" size={14} color={theme.colors.text.secondary} />
          <Text variant="caption" style={styles.metaText}>
            {cls.studentCount} Students
          </Text>
        </View>
        {cls.room && (
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={14} color={theme.colors.text.secondary} />
            <Text variant="caption" style={styles.metaText}>
              {cls.room}
            </Text>
          </View>
        )}
      </View>

      {/* Action Row */}
      <View style={styles.classActionRow}>
        {isAttendancePending ? (
          <Button
            title="Take Attendance"
            variant="primary"
            fullWidth
            onPress={() => onTakeAttendance(cls.id)}
          />
        ) : (
          <View style={styles.completedActions}>
            <Button
              title="Batch Workspace"
              variant="secondary"
              style={styles.actionBtnFlex}
              onPress={() => onOpenBatchWorkspace(cls.id)}
            />
            <Button
              title="Update Attendance"
              variant="outline"
              style={styles.actionBtnFlex}
              onPress={() => onTakeAttendance(cls.id)}
            />
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  classCard: {
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
  },
  classCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.semantic.warning.main,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  classTitleGroup: {
    flex: 1,
  },
  classSubject: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
  },
  classGrade: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: theme.typography.sizes.xs,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: theme.colors.text.secondary,
  },
  classActionRow: {
    marginTop: 2,
  },
  completedActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtnFlex: {
    flex: 1,
  },
});
