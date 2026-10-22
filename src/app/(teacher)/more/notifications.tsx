import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  notificationService,
  AppNotificationItem,
  NotificationType,
} from '@/services/notifications/notification.service';
import { theme } from '@/theme';

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TeacherNotificationsScreen() {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      let list = await notificationService.getNotifications();
      // If empty on first launch, seed a welcome reminder
      if (list.length === 0) {
        await notificationService.addNotificationToHistory({
          title: '👋 Welcome to EduFlow Smart Alerts',
          body: 'Get notified for upcoming batches, daily attendance reminders, homework due dates and fee dues.',
          type: 'system',
        });
        await notificationService.addNotificationToHistory({
          title: '📋 Daily Attendance Checklist',
          body: 'Remember to submit attendance for evening coaching batches before 8:00 PM.',
          type: 'attendance',
        });
        list = await notificationService.getNotifications();
      }
      setNotifications(list);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    notificationService.init();
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(true);
  };

  const handleTestNotification = async () => {
    const granted = await notificationService.requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permission Needed',
        'Please enable notifications in device settings to receive instant push alerts.',
      );
    }

    await notificationService.triggerLocalNotification({
      title: '🔔 Class in 15 Minutes: Batch 10th Math',
      body: 'Batch starts at 04:00 PM in Room 102. Tap to review attendance roster.',
      type: 'class',
    });
    await loadNotifications(true);
    Alert.alert('Alert Triggered', 'A test push notification has been sent.');
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    Alert.alert('Clear All Notifications', 'Are you sure you want to clear your notification history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await notificationService.clearAll();
          setNotifications([]);
        },
      },
    ]);
  };

  const filteredList = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'class':
        return { name: 'clock', color: '#2563EB', bg: '#EFF6FF' };
      case 'attendance':
        return { name: 'check-square', color: '#16A34A', bg: '#DCFCE7' };
      case 'homework':
        return { name: 'book-open', color: '#0284C7', bg: '#E0F2FE' };
      case 'fee':
        return { name: 'credit-card', color: '#7C3AED', bg: '#EDE9FE' };
      default:
        return { name: 'bell', color: '#D97706', bg: '#FEF3C7' };
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        showBack
        rightAction={
          <Pressable style={styles.testBtn} onPress={handleTestNotification} hitSlop={8}>
            <Feather name="bell" size={16} color={theme.colors.primary.main} />
            <Text variant="caption" style={styles.testBtnText}>
              Test Push
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Filter Pills & Actions Bar */}
        <View style={styles.topActionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
            {[
              { id: 'all', label: 'All' },
              { id: 'class', label: 'Classes' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'homework', label: 'Homework' },
              { id: 'fee', label: 'Fees' },
            ].map((f) => (
              <Pressable
                key={f.id}
                style={[styles.filterPill, filterType === f.id && styles.filterPillActive]}
                onPress={() => setFilterType(f.id)}
              >
                <Text
                  variant="caption"
                  style={[styles.filterPillText, filterType === f.id && styles.filterPillTextActive]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {notifications.length > 0 && (
            <View style={styles.batchActionsRow}>
              {unreadCount > 0 && (
                <Pressable onPress={handleMarkAllRead}>
                  <Text variant="caption" style={styles.actionLink}>
                    Mark all read
                  </Text>
                </Pressable>
              )}
              <Pressable onPress={handleClearAll}>
                <Text variant="caption" style={[styles.actionLink, { color: theme.colors.semantic.danger.main }]}>
                  Clear all
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Notifications List */}
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ marginVertical: 40 }} />
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications"
            description="You are all caught up! Class reminders, attendance alerts and fee notices will appear here."
          />
        ) : (
          <View style={styles.list}>
            {filteredList.map((item) => {
              const iconCfg = getTypeIcon(item.type);

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.itemWrapper, pressed && { opacity: 0.85 }]}
                  onPress={() => handleMarkAsRead(item.id)}
                >
                  <Card
                    variant="elevated"
                    padding="md"
                    style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconBox, { backgroundColor: iconCfg.bg }]}>
                        <Feather name={iconCfg.name as any} size={16} color={iconCfg.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text
                            variant="label"
                            style={[styles.titleText, !item.read && styles.titleTextUnread]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          {!item.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text variant="caption" style={styles.timeText}>
                          {formatTimeAgo(item.timestamp)} &bull; {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text variant="body" style={styles.bodyText}>
                      {item.body}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testBtnText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 11,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  topActionsBar: {
    gap: 8,
  },
  filterPills: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterPillText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  batchActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    paddingHorizontal: 4,
  },
  actionLink: {
    color: theme.colors.primary.main,
    fontWeight: '600',
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  itemWrapper: {
    borderRadius: 12,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 8,
  },
  notifCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  titleTextUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.main,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },
  bodyText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
