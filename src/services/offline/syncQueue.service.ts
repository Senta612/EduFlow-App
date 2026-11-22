import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { networkMonitor } from './networkMonitor';
import {
  SyncEntity,
  SyncAction,
  SyncMutation,
  SyncQueueSnapshot,
  SyncStatusState,
} from './types';

const SYNC_QUEUE_KEY = '@eduflow_sync_queue';
const LAST_SYNCED_KEY = '@eduflow_last_synced_at';

export type SyncQueueListener = (snapshot: SyncQueueSnapshot) => void;

class SyncQueueService {
  private _isProcessing = false;
  private _listeners: Set<SyncQueueListener> = new Set();
  private _lastSyncedAt: string | null = null;
  private _idMapping: Map<string, string> = new Map(); // tempId -> realServerId

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this._lastSyncedAt = await AsyncStorage.getItem(LAST_SYNCED_KEY);
    } catch {
      this._lastSyncedAt = null;
    }

    // Auto-drain when network comes online
    networkMonitor.subscribe((isOnline) => {
      if (isOnline) {
        this.drainQueue();
      } else {
        this.emitSnapshot();
      }
    });
  }

  /**
   * Get all queued mutations from persistent storage
   */
  async getQueue(): Promise<SyncMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as SyncMutation[];
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: SyncMutation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('[SyncQueue] Failed to save queue:', e);
    }
    this.emitSnapshot();
  }

  /**
   * Enqueue a new mutation for background synchronization
   */
  async enqueue<T = any>(
    entity: SyncEntity,
    action: SyncAction,
    payload: T,
  ): Promise<SyncMutation<T>> {
    const queue = await this.getQueue();

    const mutation: SyncMutation<T> = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entity,
      action,
      payload,
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    queue.push(mutation);
    await this.saveQueue(queue);

    // Try processing immediately if online
    if (networkMonitor.isOnline) {
      this.drainQueue();
    }

    return mutation;
  }

  /**
   * Sequential FIFO processing of the offline mutation queue
   */
  async drainQueue(): Promise<{ processed: number; remaining: number }> {
    if (this._isProcessing) {
      return { processed: 0, remaining: (await this.getQueue()).length };
    }

    const isConnected = await networkMonitor.checkConnectionAsync();
    if (!isConnected) {
      this.emitSnapshot();
      return { processed: 0, remaining: (await this.getQueue()).length };
    }

    this._isProcessing = true;
    this.emitSnapshot();

    let processedCount = 0;
    const queue = await this.getQueue();

    try {
      while (queue.length > 0) {
        const current = queue[0];
        current.status = 'syncing';

        try {
          const result = await this.executeMutation(current);
          if (result && result.realId && (current.payload as any)?.id) {
            this._idMapping.set((current.payload as any).id, result.realId);
          }

          // Successfully processed: dequeue head
          queue.shift();
          processedCount++;
          await this.saveQueue(queue);

          // Update last synced timestamp
          this._lastSyncedAt = new Date().toISOString();
          await AsyncStorage.setItem(LAST_SYNCED_KEY, this._lastSyncedAt);
        } catch (err: any) {
          console.warn(`[SyncQueue] Mutation failed for ${current.entity}:`, err?.message || err);
          current.retryCount += 1;
          current.error = err?.message || 'Sync failed';

          if (current.retryCount >= 5) {
            // Move failed mutation to dead letter or mark failed and skip to prevent blocking
            current.status = 'failed';
            queue.shift(); // Move past it
            await this.saveQueue(queue);
          } else {
            current.status = 'pending';
            await this.saveQueue(queue);
            // Break loop on network or server error to avoid spamming
            break;
          }
        }
      }
    } finally {
      this._isProcessing = false;
      this.emitSnapshot();
    }

    return { processed: processedCount, remaining: queue.length };
  }

  /**
   * Execute an individual mutation against Supabase
   */
  private async executeMutation(mutation: SyncMutation): Promise<{ realId?: string } | void> {
    const { entity, action, payload } = mutation;

    // Resolve any parent temp IDs if present in payload
    this.resolveIdReferences(payload);

    switch (entity) {
      case 'attendance': {
        const { batchId, date, records, submittedAt } = payload;
        const presentCount = records.filter((r: any) => r.status === 'present').length;
        const absentCount = records.filter((r: any) => r.status === 'absent').length;

        const { data: rec, error: recErr } = await supabase
          .from('attendance_records')
          .upsert(
            {
              batch_id: batchId,
              date: date,
              present_count: presentCount,
              absent_count: absentCount,
              total_students: records.length,
              submitted_at: submittedAt || new Date().toISOString(),
            },
            { onConflict: 'batch_id,date' },
          )
          .select()
          .single();

        if (recErr) throw recErr;

        if (rec && records.length > 0) {
          const items = records.map((r: any) => ({
            attendance_record_id: rec.id,
            student_id: r.studentId,
            status: r.status,
          }));
          const { error: itemsErr } = await supabase
            .from('attendance_items')
            .upsert(items, { onConflict: 'attendance_record_id,student_id' });
          if (itemsErr) throw itemsErr;
        }

        return { realId: rec?.id };
      }

      case 'batch': {
        if (action === 'create') {
          const { name, grade, subject, schedule, timing, room } = payload;
          const { data, error } = await supabase
            .from('batches')
            .insert({ name, grade, subject, schedule, timing, room: room || null })
            .select()
            .single();
          if (error) throw error;
          return { realId: data.id };
        } else if (action === 'update') {
          const { id, name, grade, subject, schedule, timing, room } = payload;
          const { error } = await supabase
            .from('batches')
            .update({ name, grade, subject, schedule, timing, room: room || null })
            .eq('id', id);
          if (error) throw error;
        } else if (action === 'delete') {
          const { error } = await supabase.from('batches').delete().eq('id', payload.id);
          if (error) throw error;
        }
        break;
      }

      case 'homework': {
        if (action === 'create') {
          const { batchId, title, description, dueDate } = payload;
          const { data, error } = await supabase
            .from('homework_assignments')
            .insert({
              batch_id: batchId,
              title,
              description: description || null,
              due_date: dueDate,
            })
            .select()
            .single();
          if (error) throw error;
          return { realId: data.id };
        } else if (action === 'delete') {
          const { error } = await supabase.from('homework_assignments').delete().eq('id', payload.id);
          if (error) throw error;
        }
        break;
      }

      case 'test': {
        if (action === 'create') {
          const { batchId, title, date, maxMarks } = payload;
          const { data, error } = await supabase
            .from('tests')
            .insert({
              batch_id: batchId,
              title,
              date,
              max_marks: maxMarks,
            })
            .select()
            .single();
          if (error) throw error;
          return { realId: data.id };
        } else if (action === 'delete') {
          const { error } = await supabase.from('tests').delete().eq('id', payload.id);
          if (error) throw error;
        }
        break;
      }

      case 'marks': {
        const { testId, marks } = payload;
        if (marks && marks.length > 0) {
          const rows = marks
            .filter((m: any) => m.marksObtained !== null && m.marksObtained !== undefined)
            .map((m: any) => ({
              test_id: testId,
              student_id: m.studentId,
              marks_obtained: m.marksObtained,
            }));
          if (rows.length > 0) {
            const { error } = await supabase
              .from('test_marks')
              .upsert(rows, { onConflict: 'test_id,student_id' });
            if (error) throw error;
          }
        }
        break;
      }

      case 'fee': {
        const { studentId, batchId, amount, month, date, paymentMode, referenceNo, notes } = payload;
        const { data, error } = await supabase
          .from('fee_payments')
          .insert({
            student_id: studentId,
            batch_id: batchId,
            amount,
            month,
            date,
            payment_mode: paymentMode,
            reference_no: referenceNo || null,
            notes: notes || null,
          })
          .select()
          .single();
        if (error) throw error;
        return { realId: data.id };
      }

      default:
        console.warn(`[SyncQueue] Unhandled entity type: ${entity}`);
    }
  }

  private resolveIdReferences(payload: any) {
    if (!payload || typeof payload !== 'object') return;
    for (const key of Object.keys(payload)) {
      const val = payload[key];
      if (typeof val === 'string' && this._idMapping.has(val)) {
        payload[key] = this._idMapping.get(val);
      }
    }
  }

  /**
   * Get real-time status snapshot for UI badges and indicators
   */
  async getSnapshot(): Promise<SyncQueueSnapshot> {
    const queue = await this.getQueue();
    const isOnline = networkMonitor.isOnline;

    let status: SyncStatusState = 'synced';
    if (this._isProcessing) {
      status = 'syncing';
    } else if (!isOnline && queue.length > 0) {
      status = 'offline';
    } else if (queue.length > 0) {
      status = 'pending';
    } else if (queue.some((m) => m.status === 'failed')) {
      status = 'error';
    }

    return {
      status,
      pendingCount: queue.length,
      lastSyncedAt: this._lastSyncedAt,
      isOnline,
    };
  }

  subscribe(listener: SyncQueueListener): () => void {
    this._listeners.add(listener);
    this.getSnapshot().then(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private async emitSnapshot() {
    const snapshot = await this.getSnapshot();
    this._listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (e) {
        console.warn('[SyncQueue] Listener notification error:', e);
      }
    });
  }

  /**
   * Manually clear queue if user requests cache reset
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    this.emitSnapshot();
  }
}

export const syncQueueService = new SyncQueueService();
