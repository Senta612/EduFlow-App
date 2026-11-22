import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { syncQueueService } from '@/services/offline';
import { SyncQueueSnapshot } from '@/services/offline/types';
import { theme } from '@/theme';

export interface SyncStatusBadgeProps {
  showWhenSynced?: boolean;
}

export function SyncStatusBadge({ showWhenSynced = false }: SyncStatusBadgeProps) {
  const [snapshot, setSnapshot] = useState<SyncQueueSnapshot>({
    status: 'synced',
    pendingCount: 0,
    lastSyncedAt: null,
    isOnline: true,
  });

  useEffect(() => {
    const unsubscribe = syncQueueService.subscribe((snap) => {
      setSnapshot(snap);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = () => {
    syncQueueService.drainQueue();
  };

  if (snapshot.status === 'synced' && !showWhenSynced) {
    return null;
  }

  const getBadgeConfig = () => {
    switch (snapshot.status) {
      case 'syncing':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          color: '#2563EB',
          text: 'Syncing...',
          showSpinner: true,
        };
      case 'offline':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          color: '#D97706',
          text: `Offline (${snapshot.pendingCount})`,
          icon: 'wifi-off' as const,
        };
      case 'pending':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          color: '#D97706',
          text: `${snapshot.pendingCount} pending`,
          icon: 'cloud-off' as const,
        };
      case 'error':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          color: '#DC2626',
          text: 'Retry Sync',
          icon: 'alert-circle' as const,
        };
      case 'synced':
      default:
        return {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          color: '#16A34A',
          text: 'All Synced',
          icon: 'check-circle' as const,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Pressable
      onPress={handleManualSync}
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${config.text}. Tap to sync.`}
    >
      {config.showSpinner ? (
        <ActivityIndicator size="small" color={config.color} style={styles.spinner} />
      ) : (
        <Feather name={config.icon} size={12} color={config.color} />
      )}
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  spinner: {
    transform: [{ scale: 0.7 }],
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
