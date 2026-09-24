import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StudentHomeworkItemView } from '@/types/student';
import { theme } from '@/theme';

interface StudentHomeworkCardProps {
  item: StudentHomeworkItemView;
  onToggleStatus: (item: StudentHomeworkItemView) => void;
}

export function StudentHomeworkCard({ item, onToggleStatus }: StudentHomeworkCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = item.status === 'done';

  return (
    <View
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
      ]}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Badge
              label={item.subject}
              variant="neutral"
              size="sm"
            />
            {item.isUrgent && !isCompleted ? (
              <Badge
                label="Due Soon"
                variant="danger"
                size="sm"
              />
            ) : null}
          </View>

          <View style={styles.statusPill}>
            <Feather
              name={isCompleted ? 'check-circle' : 'clock'}
              size={14}
              color={isCompleted ? theme.colors.state.success : theme.colors.state.warning}
            />
            <Text
              style={[
                styles.statusText,
                { color: isCompleted ? theme.colors.state.success : theme.colors.state.warning },
              ]}
            >
              {isCompleted ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.titleText,
            isCompleted && styles.titleCompleted,
          ]}
        >
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={13} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>Due: {item.dueDate}</Text>
          </View>

          {item.totalQuestions ? (
            <View style={styles.metaItem}>
              <Feather name="list" size={13} color={theme.colors.text.secondary} />
              <Text style={styles.metaText}>{item.totalQuestions} Questions</Text>
            </View>
          ) : null}

          <View style={styles.expandChevron}>
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.text.tertiary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded description & actions */}
      {expanded ? (
        <View style={styles.expandedSection}>
          {item.description ? (
            <View style={styles.descBox}>
              <Text style={styles.descLabel}>Instructions:</Text>
              <Text style={styles.descText}>{item.description}</Text>
            </View>
          ) : null}

          {item.remarks ? (
            <View style={styles.remarksBox}>
              <Feather name="message-square" size={14} color={theme.colors.state.info} />
              <View style={{ flex: 1 }}>
                <Text style={styles.remarksLabel}>Teacher Note:</Text>
                <Text style={styles.remarksText}>{item.remarks}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                isCompleted ? styles.toggleBtnPending : styles.toggleBtnComplete,
              ]}
              onPress={() => onToggleStatus(item)}
              activeOpacity={0.8}
            >
              <Feather
                name={isCompleted ? 'rotate-ccw' : 'check'}
                size={16}
                color={isCompleted ? theme.colors.text.secondary : '#ffffff'}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  isCompleted ? styles.toggleBtnTextPending : styles.toggleBtnTextComplete,
                ]}
              >
                {isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    marginBottom: theme.spacing.sm,
  },
  cardCompleted: {
    backgroundColor: theme.colors.background.paper,
    borderColor: theme.colors.state.success + '40',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  titleCompleted: {
    color: theme.colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  expandChevron: {
    marginLeft: 'auto',
  },
  expandedSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  descBox: {
    backgroundColor: theme.colors.background.screen,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xs,
  },
  descLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  descText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  remarksBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.state.info + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.state.info,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.state.info,
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radii.md,
  },
  toggleBtnComplete: {
    backgroundColor: theme.colors.state.success,
  },
  toggleBtnPending: {
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleBtnTextComplete: {
    color: '#ffffff',
  },
  toggleBtnTextPending: {
    color: theme.colors.text.secondary,
  },
});
