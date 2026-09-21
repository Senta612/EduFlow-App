import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { DefaulterStudent } from '@/types/teacher';
import { theme } from '@/theme';

interface DefaultersAlertSectionProps {
  defaulters: DefaulterStudent[];
  onWhatsApp: (student: DefaulterStudent) => void;
  onCall: (phone?: string) => void;
  onOpenReport: (student: DefaulterStudent) => void;
}

export function DefaultersAlertSection({
  defaulters,
  onWhatsApp,
  onCall,
  onOpenReport,
}: DefaultersAlertSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerIconBox}>
            <Feather name="alert-triangle" size={16} color={theme.colors.semantic.danger.main} />
          </View>
          <Text variant="heading" style={styles.title}>
            Students Needing Attention
          </Text>
          {defaulters.length > 0 && (
            <View style={styles.countBadge}>
              <Text variant="caption" style={styles.countBadgeText}>
                {defaulters.length}
              </Text>
            </View>
          )}
        </View>
        <Text variant="caption" style={styles.subtitle}>
          Irregular attendance, pending homeworks, or low test scores
        </Text>
      </View>

      {defaulters.length === 0 ? (
        <Card variant="outlined" padding="md" style={styles.allGoodCard}>
          <View style={styles.allGoodIconBox}>
            <Feather name="check" size={20} color={theme.colors.semantic.success.main} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" style={styles.allGoodTitle}>
              All Students on Track! 🌟
            </Text>
            <Text variant="caption" style={styles.allGoodSubtitle}>
              No critical attendance drops or recurring homework defaults detected.
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {defaulters.map((item) => (
            <Card key={item.studentId} variant="elevated" padding="md" style={styles.studentCard}>
              {/* Card Header */}
              <View style={styles.studentHeader}>
                <Pressable
                  style={styles.studentInfoPressable}
                  onPress={() => onOpenReport(item)}
                >
                  <View style={styles.avatarBox}>
                    <Text variant="label" style={styles.avatarText}>
                      {item.studentName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text variant="label" style={styles.studentName}>
                        {item.studentName}
                      </Text>
                      <Text variant="caption" style={styles.rollNumber}>
                        #{item.rollNumber}
                      </Text>
                    </View>
                    <Text variant="caption" style={styles.batchName}>
                      {item.batchName}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.profilePill,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => onOpenReport(item)}
                >
                  <Text variant="caption" style={styles.profilePillText}>
                    Report
                  </Text>
                  <Feather name="chevron-right" size={12} color={theme.colors.primary.main} />
                </Pressable>
              </View>

              {/* Issues Chips */}
              <View style={styles.issuesContainer}>
                {item.issues.map((issue, idx) => {
                  const isHigh = issue.severity === 'high';
                  const bg = isHigh
                    ? theme.colors.semantic.danger.bg
                    : theme.colors.semantic.warning.bg;
                  const textCol = isHigh
                    ? theme.colors.semantic.danger.main
                    : theme.colors.semantic.warning.main;

                  return (
                    <View key={idx} style={[styles.issueChip, { backgroundColor: bg }]}>
                      <Feather
                        name={
                          issue.type === 'attendance'
                            ? 'calendar'
                            : issue.type === 'homework'
                            ? 'book-open'
                            : 'award'
                        }
                        size={11}
                        color={textCol}
                      />
                      <Text
                        variant="caption"
                        style={[styles.issueChipText, { color: textCol }]}
                      >
                        {issue.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Quick Actions Row */}
              <View style={styles.actionsRow}>
                {/* 1-Tap WhatsApp Nudge */}
                <Pressable
                  style={({ pressed }) => [
                    styles.whatsappButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => onWhatsApp(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`WhatsApp message parent of ${item.studentName}`}
                >
                  <FontAwesome name="whatsapp" size={15} color="#FFFFFF" />
                  <Text variant="caption" style={styles.whatsappButtonText}>
                    WhatsApp Parent
                  </Text>
                </Pressable>

                {/* Call Parent */}
                {item.parentPhone ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.callButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => onCall(item.parentPhone)}
                    accessibilityRole="button"
                    accessibilityLabel={`Call parent of ${item.studentName}`}
                  >
                    <Feather name="phone" size={14} color={theme.colors.text.primary} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.semantic.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  countBadge: {
    backgroundColor: theme.colors.semantic.danger.main,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: theme.radii.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  allGoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.semantic.success.bg,
    borderColor: '#86EFAC',
    borderRadius: theme.radii.lg,
  },
  allGoodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allGoodTitle: {
    color: theme.colors.semantic.success.main,
    fontWeight: '700',
    fontSize: 14,
  },
  allGoodSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  list: {
    gap: theme.spacing.sm,
  },
  studentCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 3.5,
    borderLeftColor: theme.colors.semantic.danger.main,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfoPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.primary.main,
    fontSize: 12,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  rollNumber: {
    fontSize: 11,
    color: theme.colors.text.disabled,
  },
  batchName: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  profilePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  issuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  issueChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: theme.radii.md,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
