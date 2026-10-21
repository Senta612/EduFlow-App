import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { UploadMaterialModal } from '@/components/batch/UploadMaterialModal';
import { teacherService } from '@/services/teacher.service';
import { Batch, StudyMaterial, StudyMaterialCategory } from '@/types/teacher';
import { theme } from '@/theme';

type FilterCategory = 'all' | StudyMaterialCategory;

const FILTER_PILLS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All Categories' },
  { key: 'notes', label: 'Notes' },
  { key: 'formula_sheet', label: 'Formulas' },
  { key: 'question_bank', label: 'PYQ / Tests' },
  { key: 'assignment', label: 'Worksheets' },
  { key: 'syllabus', label: 'Syllabus' },
];

export default function AllStudyMaterialsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [batchesData, materialsData] = await Promise.all([
        teacherService.getBatches(),
        teacherService.getAllMaterials(),
      ]);
      setBatches(batchesData);
      setMaterials(materialsData);
    } catch (e) {
      console.error('Failed to load study materials:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesBatch = selectedBatchId === 'all' || item.batchId === selectedBatchId;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.batchName.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q);

      return matchesBatch && matchesCategory && matchesSearch;
    });
  }, [materials, selectedBatchId, selectedCategory, searchQuery]);

  const handleOpenMaterial = async (item: StudyMaterial) => {
    try {
      if (item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(item.fileUrl);
      } else {
        const canOpen = await Linking.canOpenURL(item.fileUrl);
        if (canOpen) {
          await Linking.openURL(item.fileUrl);
        } else {
          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            await Sharing.shareAsync(item.fileUrl);
          } else {
            Alert.alert('Notice', 'Cannot open this file directly.');
          }
        }
      }
    } catch {
      try {
        await Linking.openURL(item.fileUrl);
      } catch {
        Alert.alert('Error', 'Unable to preview this file.');
      }
    }
  };

  const handleShareWhatsApp = (material: StudyMaterial) => {
    const message = teacherService.formatMaterialWhatsAppMessage(material);
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
      }
    });
  };

  const handleDelete = (material: StudyMaterial) => {
    Alert.alert(
      'Delete Material',
      `Delete "${material.title}"? Students in this batch will no longer see it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(material.id);
              await teacherService.deleteMaterial(material.id);
              loadData();
            } catch {
              Alert.alert('Error', 'Failed to delete material.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const getCategoryBadgeVariant = (cat: StudyMaterialCategory): 'primary' | 'success' | 'warning' | 'info' => {
    switch (cat) {
      case 'notes':
        return 'primary';
      case 'formula_sheet':
        return 'warning';
      case 'question_bank':
        return 'success';
      case 'assignment':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getFileTypeStyle = (type: string) => {
    switch (type) {
      case 'pdf':
        return {
          icon: 'file-text' as const,
          color: theme.colors.semantic.danger.main,
          bg: theme.colors.semantic.danger.bg,
        };
      case 'image':
        return { icon: 'image' as const, color: '#8B5CF6', bg: '#F3E8FF' };
      case 'doc':
        return { icon: 'file' as const, color: theme.colors.primary.main, bg: theme.colors.primary.bg };
      default:
        return { icon: 'folder' as const, color: theme.colors.semantic.info.main, bg: theme.colors.semantic.info.bg };
    }
  };

  const activeBatchForUpload = selectedBatchId !== 'all' ? selectedBatchId : batches[0]?.id || '';
  const activeBatchObj = batches.find((b) => b.id === activeBatchForUpload);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Study Materials"
        subtitle="Manage notes, formulas & question banks"
        showBack
        rightAction={
          <Button
            title="Upload"
            icon="plus"
            size="sm"
            variant="primary"
            onPress={() => {
              if (batches.length === 0) {
                Alert.alert('No Batches', 'Please create a batch first before uploading study material.');
                return;
              }
              setIsUploadModalVisible(true);
            }}
          />
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={theme.colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by topic, subject, or filename..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={16} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Batch Filter Chips */}
        {batches.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedBatchId === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedBatchId('all')}
              activeOpacity={0.7}
            >
              <Text
                variant="caption"
                style={[styles.filterChipText, selectedBatchId === 'all' && styles.filterChipTextActive]}
              >
                All Batches ({materials.length})
              </Text>
            </TouchableOpacity>

            {batches.map((b) => {
              const isSelected = selectedBatchId === b.id;
              const count = materials.filter((m) => m.batchId === b.id).length;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedBatchId(b.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="caption"
                    style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                  >
                    {b.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedCategory === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(pill.key)}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content list */}
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="caption" style={styles.loadingText}>
              Loading study materials...
            </Text>
          </View>
        ) : filteredMaterials.length === 0 ? (
          <EmptyState
            icon="file-text"
            title={searchQuery ? 'No documents match search' : 'No study materials found'}
            description={
              searchQuery
                ? 'Try searching with a different word or changing batch filter.'
                : 'Upload materials for your batches so students can study from anywhere.'
            }
            actionLabel="Upload Material"
            onAction={() => {
              if (batches.length === 0) {
                router.push('/(teacher)/batch/create');
              } else {
                setIsUploadModalVisible(true);
              }
            }}
          />
        ) : (
          filteredMaterials.map((item) => {
            const fileStyle = getFileTypeStyle(item.fileType);
            const isDeleting = deletingId === item.id;
            const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <Card key={item.id} variant="elevated" padding="md" style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.fileIconBox, { backgroundColor: fileStyle.bg }]}>
                    <Feather name={fileStyle.icon} size={22} color={fileStyle.color} />
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.badgeRow}>
                      <Badge
                        label={item.category.replace('_', ' ').toUpperCase()}
                        variant={getCategoryBadgeVariant(item.category)}
                        size="sm"
                      />
                      <Badge label={item.batchName} variant="neutral" size="sm" />
                      <Text variant="caption" style={styles.subjectText}>
                        {item.subject}
                      </Text>
                    </View>

                    <Text variant="heading" numberOfLines={2} style={styles.itemTitle}>
                      {item.title}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text variant="body" numberOfLines={2} style={styles.itemDesc}>
                    {item.description}
                  </Text>
                ) : null}

                {/* File Strip */}
                <View style={styles.fileStrip}>
                  <View style={styles.fileStripLeft}>
                    <Feather name="paperclip" size={13} color={theme.colors.text.secondary} />
                    <Text variant="caption" numberOfLines={1} style={styles.fileName}>
                      {item.fileName}
                    </Text>
                  </View>
                  <View style={styles.fileStripRight}>
                    {item.fileSize && (
                      <Text variant="caption" style={styles.fileSize}>
                        {item.fileSize}
                      </Text>
                    )}
                    <Text variant="caption" style={styles.fileDate}>
                      {dateStr}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => handleOpenMaterial(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="external-link" size={14} color={theme.colors.primary.main} />
                    <Text style={styles.openButtonText}>Open / Preview</Text>
                  </TouchableOpacity>

                  <View style={styles.rightActions}>
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => handleShareWhatsApp(item)}
                      activeOpacity={0.7}
                    >
                      <Feather name="share-2" size={15} color={theme.colors.semantic.success.main} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item)}
                      disabled={isDeleting}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name="trash-2"
                        size={15}
                        color={isDeleting ? theme.colors.text.disabled : theme.colors.semantic.danger.main}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Upload Material Modal */}
      {activeBatchForUpload ? (
        <UploadMaterialModal
          visible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          batchId={activeBatchForUpload}
          defaultSubject={activeBatchObj?.subject || ''}
          onUploadSuccess={loadData}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  categoryPillActive: {
    borderColor: theme.colors.primary.light,
    backgroundColor: theme.colors.primary.bg,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  categoryPillTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  card: {
    gap: 10,
    borderRadius: theme.radii.lg,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  itemDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  fileStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
    gap: 8,
  },
  fileStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fileName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  fileStripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileSize: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  fileDate: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary.bg,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
