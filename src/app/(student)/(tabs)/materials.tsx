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
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudentService } from '@/services/student.service';
import { StudentMaterialItemView } from '@/types/student';
import { StudyMaterialCategory } from '@/types/teacher';
import { theme } from '@/theme';

type FilterCategory = 'all' | StudyMaterialCategory;

const FILTER_PILLS: { key: FilterCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'layers' },
  { key: 'notes', label: 'Notes', icon: 'book' },
  { key: 'formula_sheet', label: 'Formulas', icon: 'code' },
  { key: 'question_bank', label: 'PYQ / Tests', icon: 'help-circle' },
  { key: 'assignment', label: 'Worksheets', icon: 'file-text' },
  { key: 'syllabus', label: 'Syllabus', icon: 'list' },
];

export default function StudentMaterialsScreen() {
  const insets = useSafeAreaInsets();

  const [materials, setMaterials] = useState<StudentMaterialItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchName, setBatchName] = useState<string>('');

  const loadMaterials = useCallback(async () => {
    try {
      const session = await StudentService.getActiveSession();
      if (session?.batchName) {
        setBatchName(session.batchName);
      }
      const data = await StudentService.getStudyMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load student study materials:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMaterials();
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesFilter = selectedFilter === 'all' || item.category === selectedFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [materials, selectedFilter, searchQuery]);

  const handleOpenMaterial = async (item: StudentMaterialItemView) => {
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
            Alert.alert('Notice', 'Cannot open file on this device directly.');
          }
        }
      }
    } catch (e) {
      console.warn('Error opening material:', e);
      try {
        await Linking.openURL(item.fileUrl);
      } catch {
        Alert.alert('Preview Error', 'Could not open the selected document.');
      }
    }
  };

  const handleShareOrSave = async (item: StudentMaterialItemView) => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable && !item.fileUrl.startsWith('http')) {
        await Sharing.shareAsync(item.fileUrl);
      } else {
        // Share public web link or open in browser
        await WebBrowser.openBrowserAsync(item.fileUrl);
      }
    } catch {
      Alert.alert('Notice', 'Opening document...');
      try {
        await Linking.openURL(item.fileUrl);
      } catch {
        // ignore
      }
    }
  };

  const getCategoryBadgeVariant = (cat: string): 'primary' | 'success' | 'warning' | 'info' => {
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
        return {
          icon: 'image' as const,
          color: '#8B5CF6',
          bg: '#F3E8FF',
        };
      case 'doc':
        return {
          icon: 'file' as const,
          color: theme.colors.primary.main,
          bg: theme.colors.primary.bg,
        };
      default:
        return {
          icon: 'folder' as const,
          color: theme.colors.semantic.info.main,
          bg: theme.colors.semantic.info.bg,
        };
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text variant="title" style={styles.headerTitle}>
            Study Materials
          </Text>
          <Text variant="caption" style={styles.headerSubtitle}>
            {batchName ? `${batchName} • Resources & Notes` : 'Class Notes & Reference Sheets'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={18} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

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
          <Feather name="search" size={18} color={theme.colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, formulas, topics..."
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

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedFilter === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedFilter(pill.key)}
                activeOpacity={0.7}
              >
                <Feather
                  name={pill.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : theme.colors.text.secondary}
                />
                <Text
                  variant="caption"
                  style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content Area */}
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
            title={searchQuery ? 'No documents found' : 'No study materials yet'}
            description={
              searchQuery
                ? 'Try different keywords or switch category filter.'
                : 'Your teacher has not uploaded any study material for this batch yet.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Refresh'}
            onAction={() => {
              if (searchQuery) setSearchQuery('');
              else handleRefresh();
            }}
          />
        ) : (
          filteredMaterials.map((item) => {
            const fileStyle = getFileTypeStyle(item.fileType);
            const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <Card key={item.id} variant="elevated" padding="md" style={styles.materialCard}>
                <View style={styles.cardHeaderRow}>
                  {/* Icon */}
                  <View style={[styles.fileIconBox, { backgroundColor: fileStyle.bg }]}>
                    <Feather name={fileStyle.icon} size={22} color={fileStyle.color} />
                  </View>

                  {/* Title & Metadata */}
                  <View style={styles.cardDetails}>
                    <View style={styles.badgesRow}>
                      <Badge
                        label={item.category.replace('_', ' ').toUpperCase()}
                        variant={getCategoryBadgeVariant(item.category)}
                        size="sm"
                      />
                      {item.isNew && (
                        <Badge label="NEW" variant="success" size="sm" />
                      )}
                      <Text variant="caption" style={styles.subjectText}>
                        {item.subject}
                      </Text>
                    </View>

                    <Text variant="heading" numberOfLines={2} style={styles.itemTitle}>
                      {item.title}
                    </Text>
                  </View>
                </View>

                {/* Description if present */}
                {item.description ? (
                  <Text variant="body" numberOfLines={3} style={styles.itemDesc}>
                    {item.description}
                  </Text>
                ) : null}

                {/* File Details Strip */}
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

                {/* Action Row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => handleOpenMaterial(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="eye" size={16} color="#FFFFFF" />
                    <Text style={styles.openButtonText}>View Document</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShareOrSave(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="share-2" size={16} color={theme.colors.primary.main} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    padding: 0,
  },
  filterPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  materialCard: {
    gap: 12,
    borderRadius: theme.radii.xl,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    gap: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    lineHeight: 18,
  },
  fileStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  openButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 10,
    borderRadius: theme.radii.lg,
  },
  openButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
