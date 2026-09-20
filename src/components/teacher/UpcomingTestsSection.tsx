import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Test } from '@/types/teacher';
import { theme } from '@/theme';

interface UpcomingTestsSectionProps {
  upcomingTests: Test[];
  onCreateTest: () => void;
  onEnterMarks: (testId: string) => void;
}

export const UpcomingTestsSection: React.FC<UpcomingTestsSectionProps> = ({
  upcomingTests,
  onCreateTest,
  onEnterMarks,
}) => {
  if (upcomingTests.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="heading" style={styles.sectionTitle}>
          Upcoming Tests & Assessments
        </Text>
        <Pressable onPress={onCreateTest}>
          <Text variant="label" style={styles.seeAllLink}>
            + New Test
          </Text>
        </Pressable>
      </View>

      <View style={styles.upcomingList}>
        {upcomingTests.slice(0, 2).map((test) => (
          <Card
            key={test.id}
            variant="outlined"
            padding="md"
            style={styles.testCard}
          >
            <View style={styles.testHeader}>
              <View style={styles.testTitleCol}>
                <Text variant="heading" style={styles.testTitle}>
                  {test.title}
                </Text>
                <Text variant="caption" style={styles.testSubtitle}>
                  {test.batchName} • Date: {test.date}
                </Text>
              </View>
              <Badge
                label={`Max ${test.maxMarks}m`}
                variant="neutral"
                size="sm"
              />
            </View>

            <View style={styles.testActionRow}>
              <Button
                title="Enter / Review Marks →"
                variant="outline"
                fullWidth
                onPress={() => onEnterMarks(test.id)}
              />
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  seeAllLink: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.sm,
  },
  upcomingList: {
    gap: theme.spacing.sm,
  },
  testCard: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  testTitleCol: {
    flex: 1,
  },
  testTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm + 1,
    fontWeight: theme.typography.weights.bold,
  },
  testSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: 11,
  },
  testActionRow: {
    marginTop: 2,
  },
});
