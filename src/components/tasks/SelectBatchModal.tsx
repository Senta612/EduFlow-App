import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Batch, TaskType } from '@/types/teacher';
import { theme } from '@/theme';

interface SelectBatchModalProps {
  visible: boolean;
  onClose: () => void;
  taskType: TaskType | null;
  batches: Batch[];
  onSelectBatch: (batch: Batch, taskType: TaskType) => void;
  onCreateNewBatch: () => void;
}

export const SelectBatchModal: React.FC<SelectBatchModalProps> = ({
  visible,
  onClose,
  taskType,
  batches,
  onSelectBatch,
  onCreateNewBatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const typeConfig = useMemo(() => {
    switch (taskType) {
      case 'attendance':
        return {
          title: 'Select Batch for Attendance',
          subtitle: 'Choose which batch to mark attendance for today',
          icon: 'check-square' as keyof typeof Feather.glyphMap,
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          badgeText: 'Attendance',
        };
      case 'homework':
        return {
          title: 'Select Batch for Homework',
          subtitle: 'Choose which batch will receive this homework',
          icon: 'book-open' as keyof typeof Feather.glyphMap,
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          badgeText: 'Homework',
        };
      case 'marks':
        return {
          title: 'Select Batch for Test Marks',
          subtitle: 'Choose which batch to record test scores for',
          icon: 'award' as keyof typeof Feather.glyphMap,
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          badgeText: 'Test Marks',
        };
      default:
        return {
          title: 'Select Batch',
          subtitle: 'Choose a batch to continue',
          icon: 'layers' as keyof typeof Feather.glyphMap,
          iconBg: theme.colors.primary.bg,
          iconColor: theme.colors.primary.main,
          badgeText: 'Batch',
        };
    }
  }, [taskType]);

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase().trim();
    return batches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.grade.toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.modalBackdropTouch}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close select batch modal"
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: typeConfig.iconBg }]}>
                <Feather name={typeConfig.icon} size={20} color={typeConfig.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="heading" style={styles.modalTitle}>
                  {typeConfig.title}
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  {typeConfig.subtitle}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input if batches > 3 */}
          {batches.length > 3 && (
            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={16}
                color={theme.colors.text.secondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by batch name, subject, or grade..."
                placeholderTextColor={theme.colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Feather name="x" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Batches List Scrollable */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {filteredBatches.length === 0 ? (
              <EmptyState
                icon="layers"
                title={searchQuery ? 'No matching batches found' : 'No batches created yet'}
                description={
                  searchQuery
                    ? 'Try searching with a different keyword.'
                    : 'You need at least one batch to perform this task.'
                }
                actionLabel={searchQuery ? 'Clear Search' : '+ Create New Batch'}
                onAction={
                  searchQuery
                    ? () => setSearchQuery('')
                    : () => {
                        onClose();
                        onCreateNewBatch();
                      }
                }
              />
            ) : (
              filteredBatches.map((batch) => (
                <Card
                  key={batch.id}
                  variant="outlined"
                  padding="none"
                  style={styles.batchCard}
                >
                  <Pressable
                    style={styles.batchCardInner}
                    onPress={() => {
                      if (taskType) {
                        onClose();
                        onSelectBatch(batch, taskType);
                      }
                    }}
                    android_ripple={{ color: '#F1F5F9' }}
                  >
                    <View style={styles.batchLeftInfo}>
                      <View style={styles.batchTitleRow}>
                        <Text variant="label" style={styles.batchName}>
                          {batch.name}
                        </Text>
                        <Badge
                          label={`${batch.studentCount ?? 0} Students`}
                          variant="neutral"
                          size="sm"
                        />
                      </View>

                      <View style={styles.batchMetaRow}>
                        <Badge label={batch.subject} variant="primary" size="sm" />
                        <Text variant="caption" style={styles.batchMetaText}>
                          {batch.grade}
                        </Text>
                        {batch.timing ? (
                          <>
                            <Text variant="caption" style={styles.dotSeparator}>
                              •
                            </Text>
                            <Text variant="caption" style={styles.batchMetaText}>
                              {batch.timing}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <Feather name="chevron-right" size={18} color={theme.colors.text.secondary} />
                  </Pressable>
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    maxHeight: '85%',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  scrollList: {
    gap: 10,
    paddingBottom: 16,
  },
  batchCard: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderColor: theme.colors.border.light,
  },
  batchCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  batchLeftInfo: {
    flex: 1,
    gap: 6,
    marginRight: 12,
  },
  batchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  batchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  batchMetaText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  dotSeparator: {
    color: theme.colors.text.disabled,
  },
});
