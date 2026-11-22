import { supabase } from '@/lib/supabase';
import {
  AttendanceRecord,
  StudentAttendanceItem,
  AttendanceStatus,
  Batch,
} from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';
import { syncQueueService } from '@/services/offline';
import { pushDispatchService } from '@/services/notifications';

export class AttendanceService {
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const localRecords = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);

    try {
      const { data: recs, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: false });

      if (!error && recs) {
        const { data: items } = await supabase
          .from('attendance_items')
          .select('*, students(name, roll_number)');

        const itemsByRecordId = new Map<string, StudentAttendanceItem[]>();
        if (items) {
          items.forEach((item: any) => {
            const list = itemsByRecordId.get(item.attendance_record_id) || [];
            list.push({
              studentId: item.student_id,
              studentName: item.students?.name || 'Student',
              rollNumber: item.students?.roll_number || '',
              status: item.status as AttendanceStatus,
            });
            itemsByRecordId.set(item.attendance_record_id, list);
          });
        }

        const mappedRecords: AttendanceRecord[] = recs.map((r) => ({
          id: r.id,
          batchId: r.batch_id,
          date: r.date,
          records: itemsByRecordId.get(r.id) || [],
          totalStudents: r.total_students,
          presentCount: r.present_count,
          absentCount: r.absent_count,
          submittedAt: r.submitted_at,
        }));

        const supabaseIds = new Set(mappedRecords.map((m) => m.id));
        const unsynced = localRecords.filter((l) => !supabaseIds.has(l.id));
        const combined = [...mappedRecords, ...unsynced];

        await setStored(STORAGE_KEYS.ATTENDANCE, combined);
        return combined;
      }
    } catch (err) {
      console.warn('Supabase getAttendanceRecords notice:', err);
    }

    return localRecords;
  }

  async getBatchAttendanceHistory(batchId: string): Promise<AttendanceRecord[]> {
    const all = await this.getAttendanceRecords();
    return all.filter((r) => r.batchId === batchId);
  }

  async isAttendanceTakenToday(batchId: string): Promise<boolean> {
    const todayStr = new Date().toISOString().split('T')[0];
    const all = await this.getAttendanceRecords();
    return all.some((r) => r.batchId === batchId && r.date === todayStr);
  }

  async submitAttendance(
    batchId: string,
    date: string,
    records: StudentAttendanceItem[],
  ): Promise<AttendanceRecord> {
    const { subscriptionService } = await import('@/services/subscription.service');
    await subscriptionService.assertProEntitlement('record or update attendance');

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;

    const newRecord: AttendanceRecord = {
      id: `att-${batchId}-${Date.now()}`,
      batchId,
      date,
      records,
      totalStudents: records.length,
      presentCount,
      absentCount,
      submittedAt: new Date().toISOString(),
    };

    // 1. Optimistic local write for zero-latency UI response
    const all = await this.getAttendanceRecords();
    const filtered = all.filter((r) => !(r.batchId === batchId && r.date === date));
    const updated = [newRecord, ...filtered];
    await setStored(STORAGE_KEYS.ATTENDANCE, updated);

    // 2. Update batch flag and notify listeners immediately
    const batches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const updatedBatches = batches.map((b) =>
      b.id === batchId ? { ...b, attendanceTakenToday: true } : b,
    );
    await setStored(STORAGE_KEYS.BATCHES, updatedBatches);
    batchesService.notifyBatchListeners(updatedBatches);

    // 3. Queue mutation for background sync (works offline and online)
    await syncQueueService.enqueue('attendance', 'create', newRecord);

    // 4. Trigger Parent Push Notifications for absent students
    const absentStudents = records
      .filter((r) => r.status === 'absent')
      .map((r) => ({ id: r.studentId, name: r.studentName }));

    if (absentStudents.length > 0) {
      const currentBatch = batches.find((b) => b.id === batchId);
      pushDispatchService
        .dispatchAttendanceAbsentees(
          batchId,
          currentBatch?.name || 'Class',
          absentStudents,
        )
        .catch((err) => console.warn('[AttendanceService] Push alert notice:', err));
    }

    return newRecord;

    return newRecord;
  }
}

export const attendanceService = new AttendanceService();
