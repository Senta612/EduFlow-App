import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Batch, StudyMaterial, StudyMaterialCategory } from '@/types/teacher';
import { teacherService } from '@/services/teacher.service';
import { theme } from '@/theme';

interface BatchMaterialsSectionProps {
  batch: Batch;
  materials: StudyMaterial[];
  onUploadPress: () => void;
  onRefreshMaterials: () => void;
}

type FilterCategory = 'all' | StudyMaterialCategory;

const FILTER_PILLS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'notes', label: 'Notes' },
  { key: 'formula_sheet', label: 'Formulas' },
  { key: 'question_bank', label: 'PYQ / Tests' },
  { key: 'assignment', label: 'Worksheets' },
  { key: 'syllabus', label: 'Syllabus' },
];

export const BatchMaterialsSection: React.FC<BatchMaterialsSectionProps> = ({
  batch,
  materials,
  onUploadPress,
  onRefreshMaterials,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesCategory =
        selectedFilter === 'all' || m.category === selectedFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [materials, selectedFilter, searchQuery]);

  const handleOpenMaterial = async (material: StudyMaterial) => {
    try {
      if (material.fileUrl.startsWith('http://') || material.fileUrl.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(material.fileUrl);
      } else {
        const canOpen = await Linking.canOpenURL(material.fileUrl);
        if (canOpen) {
          await Linking.openURL(material.fileUrl);
        } else {
          // If local file and sharing is available
          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            await Sharing.shareAsync(material.fileUrl);
          } else {
            Alert.alert('Unable to Open', 'This file format cannot be opened directly.');
          }
        }
      }
    } catch (e: any) {
      console.warn('Error opening file:', e);
      Alert.alert('Notice', 'Opening file externally...');
      try {
        await Linking.openURL(material.fileUrl);
      } catch {
        // fallback
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
      'Delete Study Material',
      `Are you sure you want to remove "${material.title}"? Students in this batch will no longer be able to access it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(material.id);
              await teacherService.deleteMaterial(material.id);
              onRefreshMaterials();
            } catch {
              Alert.alert('Error', 'Failed to delete study material.');
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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return { icon: 'file-text' as const, color: theme.colors.semantic.danger.main, bg: theme.colors.semantic.danger.bg };
      case 'image':
        return { icon: 'image' as const, color: '#8B5CF6', bg: '#F3E8FF' };
      case 'doc':
        return { icon: 'file' as const, color: theme.colors.primary.main, bg: theme.colors.primary.bg };
      default:
        return { icon: 'folder' as const, color: theme.colors.semantic.info.main, bg: theme.colors.semantic.info.bg };
    }
  };

  return (
    <View style={styles.sectionStack}>
      {/* Header */}
      <View style={styles.blockHeader}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.titleWithBadge}>
            <Text variant="heading" style={styles.blockTitle}>
              Study Materials
            </Text>
            {materials.length > 0 && (
              <Badge label={`${materials.length}`} variant="primary" size="sm" />
            )}
          </View>
          <Text variant="caption" style={styles.headerSubtitle}>
            Notes, revision sheets, and questions for {batch.name}
          </Text>
        </View>
        <Button
          title="Add Material"
          icon="plus"
          size="sm"
          variant="primary"
          onPress={onUploadPress}
        />
      </View>

      {/* Filter and Search Bar when there are materials */}
      {materials.length > 0 && (
        <View style={styles.filterControls}>
          {/* Search Box */}
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

          {/* Category Filter Pills */}
          <View style={styles.filterPillsRow}>
            {FILTER_PILLS.map((pill) => {
              const isSelected = selectedFilter === pill.key;
              return (
                <TouchableOpacity
                  key={pill.key}
                  style={[styles.filterPill, isSelected && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(pill.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="caption"
                    style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Empty State */}
      {materials.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No study materials uploaded yet"
          description="Upload notes, formula sheets, or questions for students to view in their app."
          actionLabel="Add Study Material"
          onAction={onUploadPress}
        />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matching materials"
          description="Try adjusting your filter or search keywords."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedFilter('all');
            setSearchQuery('');
          }}
        />
      ) : (
        /* List of Material Cards */
        filteredMaterials.map((item) => {
          const fileStyle = getFileIcon(item.fileType);
          const isDeleting = deletingId === item.id;
          const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <Card key={item.id} variant="elevated" padding="md" style={styles.materialCard}>
              <View style={styles.cardTopRow}>
                {/* File Icon */}
                <View style={[styles.fileIconBox, { backgroundColor: fileStyle.bg }]}>
                  <Feather name={fileStyle.icon} size={20} color={fileStyle.color} />
                </View>

                {/* Title & Badges */}
                <View style={styles.cardHeaderInfo}>
                  <View style={styles.cardBadgeRow}>
                    <Badge
                      label={item.category.replace('_', ' ').toUpperCase()}
                      variant={getCategoryBadgeVariant(item.category)}
                      size="sm"
                    />
                    <Text variant="caption" style={styles.cardSubject}>
                      {item.subject}
                    </Text>
                  </View>
                  <Text variant="heading" numberOfLines={2} style={styles.materialTitle}>
                    {item.title}
                  </Text>
                </View>
              </View>

              {/* Description snippet if any */}
              {item.description ? (
                <Text variant="body" numberOfLines={2} style={styles.materialDesc}>
                  {item.description}
                </Text>
              ) : null}

              {/* File Meta Info */}
              <View style={styles.fileMetaBar}>
                <View style={styles.fileMetaLeft}>
                  <Feather name="paperclip" size={13} color={theme.colors.text.secondary} />
                  <Text variant="caption" numberOfLines={1} style={styles.fileNameText}>
                    {item.fileName}
                  </Text>
                </View>
                {item.fileSize && (
                  <Text variant="caption" style={styles.fileSizeBadge}>
                    {item.fileSize}
                  </Text>
                )}
                <Text variant="caption" style={styles.dateText}>
                  {formattedDate}
                </Text>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.openButton}
                  onPress={() => handleOpenMaterial(item)}
                  activeOpacity={0.7}
                >
                  <Feather name="external-link" size={14} color={theme.colors.primary.main} />
                  <Text variant="caption" style={styles.openButtonText}>
                    Open / Preview
                  </Text>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                  <TouchableOpacity
                    style={styles.whatsappIconBtn}
                    onPress={() => handleShareWhatsApp(item)}
                    activeOpacity={0.7}
                    accessibilityLabel="Share on WhatsApp"
                  >
                    <Feather name="share-2" size={15} color={theme.colors.semantic.success.main} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handleDelete(item)}
                    disabled={isDeleting}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete material"
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
    </View>
  );
};

const styles = StyleSheet.create({
  sectionStack: {
    gap: 14,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  filterControls: {
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.lg,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  materialCard: {
    gap: 10,
    borderRadius: theme.radii.lg,
  },
  cardTopRow: {
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
  cardHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSubject: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  materialDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  fileMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
    gap: 8,
  },
  fileMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fileNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  fileSizeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  cardActionsRow: {
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
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMaterialHeroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.main,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  addMaterialHeroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addMaterialHeroIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  addMaterialHeroTexts: {
    flex: 1,
    gap: 2,
  },
  addMaterialHeroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary.dark,
  },
  addMaterialHeroSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  addMaterialHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
  },
  addMaterialHeroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
