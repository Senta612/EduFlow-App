import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TestLeaderboardItem, TestRankStudent } from '@/types/teacher';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

interface TestToppersSectionProps {
  leaderboards: TestLeaderboardItem[];
  onTopperWhatsApp: (topper: TestRankStudent, testTitle: string, batchName: string) => void;
  onOpenMarksheet: (testId: string) => void;
}

export function TestToppersSection({
  leaderboards,
  onTopperWhatsApp,
  onOpenMarksheet,
}: TestToppersSectionProps) {
  const { t } = useTranslation();

  if (leaderboards.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerIconBox}>
            <Feather name="award" size={16} color={theme.colors.primary.main} />
          </View>
          <Text variant="heading" style={styles.title}>
            {t('reports.testToppersTitle')}
          </Text>
        </View>
        <Text variant="caption" style={styles.subtitle}>
          {t('reports.testToppersSubtitle')}
        </Text>
      </View>

      <View style={styles.list}>
        {leaderboards.map((item) => {
          const { test, highestMarks, lowestMarks, averageMarks, topStudents } = item;
          const avgPercent =
            test.maxMarks > 0 ? Math.round((averageMarks / test.maxMarks) * 100) : 0;

          return (
            <Card key={test.id} variant="elevated" padding="md" style={styles.testCard}>
              {/* Test Header */}
              <View style={styles.testHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="label" style={styles.testTitle}>
                    {test.title}
                  </Text>
                  <Text variant="caption" style={styles.testSubtitle}>
                    {test.batchName} • {t('common.date')}: {test.date}
                  </Text>
                </View>
                <Badge
                  label={t('reports.maxMarksBadge').replace('{max}', String(test.maxMarks))}
                  variant="neutral"
                  size="sm"
                />
              </View>

              {/* Class Score Benchmarks Bar */}
              <View style={styles.benchmarkBar}>
                <View style={styles.benchmarkItem}>
                  <Text variant="caption" style={styles.benchmarkLabel}>
                    {t('reports.highest')}
                  </Text>
                  <Text variant="label" style={[styles.benchmarkValue, { color: '#16A34A' }]}>
                    {highestMarks}/{test.maxMarks}
                  </Text>
                </View>
                <View style={styles.benchmarkDivider} />
                <View style={styles.benchmarkItem}>
                  <Text variant="caption" style={styles.benchmarkLabel}>
                    {t('reports.classAverage')}
                  </Text>
                  <Text
                    variant="label"
                    style={[styles.benchmarkValue, { color: theme.colors.primary.main }]}
                  >
                    {averageMarks} ({avgPercent}%)
                  </Text>
                </View>
                <View style={styles.benchmarkDivider} />
                <View style={styles.benchmarkItem}>
                  <Text variant="caption" style={styles.benchmarkLabel}>
                    {t('reports.lowest')}
                  </Text>
                  <Text variant="label" style={[styles.benchmarkValue, { color: '#DC2626' }]}>
                    {lowestMarks}/{test.maxMarks}
                  </Text>
                </View>
              </View>

              {/* Top Performers Row */}
              <View style={styles.toppersContainer}>
                <Text variant="caption" style={styles.toppersHeading}>
                  {t('reports.topPerformersHeading')}
                </Text>

                <View style={styles.toppersList}>
                  {topStudents.map((topper) => {
                    const isFirst = topper.rank === 1;
                    const rankEmoji =
                      topper.rank === 1 ? '🥇' : topper.rank === 2 ? '🥈' : '🥉';
                    const badgeBg = isFirst ? '#FEF9C3' : '#F1F5F9';
                    const badgeBorder = isFirst ? '#FDE047' : '#E2E8F0';

                    return (
                      <View
                        key={topper.studentId}
                        style={[
                          styles.topperRow,
                          { backgroundColor: badgeBg, borderColor: badgeBorder },
                        ]}
                      >
                        <View style={styles.topperLeft}>
                          <Text style={styles.rankEmoji}>{rankEmoji}</Text>
                          <View>
                            <View style={styles.topperNameRow}>
                              <Text variant="label" style={styles.topperName}>
                                {topper.studentName}
                              </Text>
                              <Text variant="caption" style={styles.topperRoll}>
                                #{topper.rollNumber}
                              </Text>
                            </View>
                            <Text variant="caption" style={styles.topperScore}>
                              {t('reports.scored')} {topper.marksObtained}/{topper.maxMarks} ({topper.percentage}%)
                            </Text>
                          </View>
                        </View>

                        {/* WhatsApp Congratulate Button */}
                        <Pressable
                          style={({ pressed }) => [
                            styles.topperWhatsAppBtn,
                            pressed && { opacity: 0.8 },
                          ]}
                          onPress={() =>
                            onTopperWhatsApp(topper, test.title, test.batchName)
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Congratulate ${topper.studentName} on WhatsApp`}
                        >
                          <FontAwesome name="whatsapp" size={13} color="#FFFFFF" />
                          <Text variant="caption" style={styles.topperWhatsAppText}>
                            {t('common.share')}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Full Marksheet Link */}
              <Button
                title={t('reports.viewMarksheet')}
                variant="outline"
                size="sm"
                onPress={() => onOpenMarksheet(test.id)}
              />
            </Card>
          );
        })}
      </View>
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
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  list: {
    gap: theme.spacing.md,
  },
  testCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  testSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  benchmarkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background.screen,
    borderRadius: theme.radii.md,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  benchmarkItem: {
    alignItems: 'center',
    gap: 2,
  },
  benchmarkLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  benchmarkValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  benchmarkDivider: {
    width: 1,
    height: 22,
    backgroundColor: theme.colors.border.main,
  },
  toppersContainer: {
    gap: 6,
    marginTop: 2,
  },
  toppersHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.disabled,
    letterSpacing: 0.5,
  },
  toppersList: {
    gap: 6,
  },
  topperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.md,
    borderWidth: 1,
  },
  topperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rankEmoji: {
    fontSize: 18,
  },
  topperNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topperName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  topperRoll: {
    fontSize: 10,
    color: theme.colors.text.disabled,
  },
  topperScore: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  topperWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: theme.radii.full,
  },
  topperWhatsAppText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
});
