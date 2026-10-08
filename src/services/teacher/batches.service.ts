import { supabase } from '@/lib/supabase';
import { Batch, AttendanceRecord, Student, Homework, Test } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';

export function isBatchScheduledToday(schedule: string): boolean {
  if (!schedule) return false;
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = daysMap[new Date().getDay()];
  return schedule.toLowerCase().includes(todayDay.toLowerCase());
}

export function isBatchScheduledOnDate(schedule: string, date: Date): boolean {
  if (!schedule) return true;
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const targetDay = daysMap[date.getDay()];
  return schedule.toLowerCase().includes(targetDay.toLowerCase());
}

export type BatchListener = (batches: Batch[]) => void;
const batchListeners = new Set<BatchListener>();

export class BatchesService {
  async getBatches(): Promise<Batch[]> {
    const localBatches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);

    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mappedBatches: Batch[] = data.map((b) => ({
          id: b.id,
          name: b.name,
          grade: b.grade,
          subject: b.subject,
          studentCount: b.student_count ?? 0,
          schedule: b.schedule,
          timing: b.timing,
          room: b.room || undefined,
          attendanceTakenToday: false,
        }));

        const supabaseIds = new Set(mappedBatches.map((b) => b.id));
        const unsyncedLocal = localBatches.filter((loc) => !supabaseIds.has(loc.id));
        const combined = [...mappedBatches, ...unsyncedLocal];

        await setStored(STORAGE_KEYS.BATCHES, combined);

        const todayStr = new Date().toISOString().split('T')[0];
        const attendance = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
        const attendanceMap = new Set(
          attendance.filter((r) => r.date === todayStr).map((r) => r.batchId),
        );
        return combined.map((b) => ({
          ...b,
          attendanceTakenToday: attendanceMap.has(b.id) || Boolean(b.attendanceTakenToday),
        }));
      }
    } catch (err) {
      console.warn('Supabase getBatches notice:', err);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const attendanceMap = new Set(
      attendance.filter((r) => r.date === todayStr).map((r) => r.batchId),
    );
    return localBatches.map((b) => ({
      ...b,
      attendanceTakenToday: attendanceMap.has(b.id) || Boolean(b.attendanceTakenToday),
    }));
  }

  async getTodayClasses(): Promise<Batch[]> {
    const batches = await this.getBatches();
    const todayBatches = batches.filter((b) => isBatchScheduledToday(b.schedule));
    return todayBatches.length > 0 ? todayBatches : batches;
  }

  async getClassesForDate(
    dateStr: string,
  ): Promise<(Batch & { attendanceTakenForDate: boolean; attendanceRecord?: AttendanceRecord })[]> {
    const batches = await this.getBatches();
    const targetDate = new Date(dateStr);
    const attendance = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const dateRecords = attendance.filter((r) => r.date === dateStr);
    const recordMap = new Map(dateRecords.map((r) => [r.batchId, r]));

    const scheduledBatches = batches.filter((b) => isBatchScheduledOnDate(b.schedule, targetDate));
    const list = scheduledBatches.length > 0 ? scheduledBatches : batches;

    return list.map((b) => {
      const rec = recordMap.get(b.id);
      return {
        ...b,
        attendanceTakenForDate: Boolean(rec),
        attendanceRecord: rec,
      };
    });
  }

  async getBatchById(batchId: string): Promise<Batch | null> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .maybeSingle();

      if (!error && data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const attendance = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
        const takenToday = attendance.some((r) => r.batchId === batchId && r.date === todayStr);

        return {
          id: data.id,
          name: data.name,
          grade: data.grade,
          subject: data.subject,
          studentCount: data.student_count ?? 0,
          schedule: data.schedule,
          timing: data.timing,
          room: data.room || undefined,
          attendanceTakenToday: takenToday,
        };
      }
    } catch {
      // fallback below
    }

    const batches = await this.getBatches();
    const batch = batches.find((b) => b.id === batchId) ?? null;
    if (!batch) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const takenToday = attendance.some((r) => r.batchId === batchId && r.date === todayStr);

    return {
      ...batch,
      attendanceTakenToday: takenToday || Boolean(batch.attendanceTakenToday),
    };
  }

  async createBatch(
    data: Omit<Batch, 'id' | 'studentCount' | 'attendanceTakenToday'>,
  ): Promise<Batch> {
    const newBatch: Batch = {
      ...data,
      id: `batch-${Date.now()}`,
      studentCount: 0,
      attendanceTakenToday: false,
    };

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase
        .from('batches')
        .insert({
          name: data.name,
          grade: data.grade,
          subject: data.subject,
          schedule: data.schedule,
          timing: data.timing,
          room: data.room || null,
          student_count: 0,
          teacher_id: userRes?.user?.id || null,
        })
        .select()
        .single();

      if (!error && inserted) {
        newBatch.id = inserted.id;
      }
    } catch (err) {
      console.warn('Supabase createBatch notice:', err);
    }

    const batches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const updated = [newBatch, ...batches.filter((b) => b.id !== newBatch.id)];
    await setStored(STORAGE_KEYS.BATCHES, updated);

    // Notify listeners
    batchListeners.forEach((listener) => listener(updated));

    return newBatch;
  }

  async deleteBatch(batchId: string): Promise<void> {
    try {
      await supabase.from('batches').delete().eq('id', batchId);
    } catch (err) {
      console.warn('Supabase deleteBatch notice:', err);
    }

    const batches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const filtered = batches.filter((b) => b.id !== batchId);
    await setStored(STORAGE_KEYS.BATCHES, filtered);

    // Clean up associated local records
    try {
      const students = await getStored<Student[]>(STORAGE_KEYS.STUDENTS, []);
      await setStored(STORAGE_KEYS.STUDENTS, students.filter((s) => s.batchId !== batchId));

      const attendance = await getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
      await setStored(STORAGE_KEYS.ATTENDANCE, attendance.filter((a) => a.batchId !== batchId));

      const homework = await getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
      await setStored(STORAGE_KEYS.HOMEWORK, homework.filter((h) => h.batchId !== batchId));

      const tests = await getStored<Test[]>(STORAGE_KEYS.TESTS, []);
      await setStored(STORAGE_KEYS.TESTS, tests.filter((t) => t.batchId !== batchId));
    } catch (e) {
      console.warn('Cleanup storage notice:', e);
    }

    batchListeners.forEach((listener) => listener(filtered));
  }

  subscribeBatches(listener: BatchListener): () => void {
    batchListeners.add(listener);

    try {
      const channel = supabase
        .channel('public:batches_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'batches' },
          async () => {
            const fresh = await this.getBatches();
            listener(fresh);
          },
        )
        .subscribe();

      return () => {
        batchListeners.delete(listener);
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        batchListeners.delete(listener);
      };
    }
  }

  notifyBatchListeners(batches: Batch[]) {
    batchListeners.forEach((listener) => listener(batches));
  }
}

export const batchesService = new BatchesService();
