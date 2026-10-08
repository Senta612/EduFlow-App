import { supabase } from '@/lib/supabase';
import {
  AttendanceRecord,
  StudentAttendanceItem,
  AttendanceStatus,
  Batch,
} from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';

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

    try {
      const { data: rec, error: recErr } = await supabase
        .from('attendance_records')
        .upsert(
          {
            batch_id: batchId,
            date: date,
            present_count: presentCount,
            absent_count: absentCount,
            total_students: records.length,
            submitted_at: newRecord.submittedAt,
          },
          { onConflict: 'batch_id,date' },
        )
        .select()
        .single();

      if (!recErr && rec) {
        newRecord.id = rec.id;
        const items = records.map((r) => ({
          attendance_record_id: rec.id,
          student_id: r.studentId,
          status: r.status,
        }));
        await supabase
          .from('attendance_items')
          .upsert(items, { onConflict: 'attendance_record_id,student_id' });
      }
    } catch (err) {
      console.warn('Supabase submitAttendance notice:', err);
    }

    const all = await this.getAttendanceRecords();
    // Replace if already exists for this batch+date, or prepend
    const filtered = all.filter((r) => !(r.batchId === batchId && r.date === date));
    const updated = [newRecord, ...filtered];
    await setStored(STORAGE_KEYS.ATTENDANCE, updated);

    // Update batch flag and notify listeners
    const batches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const updatedBatches = batches.map((b) =>
      b.id === batchId ? { ...b, attendanceTakenToday: true } : b,
    );
    await setStored(STORAGE_KEYS.BATCHES, updatedBatches);
    batchesService.notifyBatchListeners(updatedBatches);

    return newRecord;
  }
}

export const attendanceService = new AttendanceService();
