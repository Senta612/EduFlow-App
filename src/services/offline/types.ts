export type SyncEntity =
  | 'attendance'
  | 'batch'
  | 'homework'
  | 'test'
  | 'marks'
  | 'fee'
  | 'material';

export type SyncAction = 'create' | 'update' | 'delete';

export type SyncMutationStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncMutation<T = any> {
  id: string; // e.g. "mut-1700000000-xyz"
  entity: SyncEntity;
  action: SyncAction;
  payload: T;
  clientTimestamp: string;
  retryCount: number;
  status: SyncMutationStatus;
  error?: string;
  idReplacements?: Record<string, string>;
}

export type SyncStatusState = 'synced' | 'pending' | 'syncing' | 'offline' | 'error';

export interface SyncQueueSnapshot {
  status: SyncStatusState;
  pendingCount: number;
  lastSyncedAt: string | null;
  isOnline: boolean;
}
