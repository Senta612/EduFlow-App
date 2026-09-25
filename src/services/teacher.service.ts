import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  Batch,
  Student,
  StudentAttendanceItem,
  AttendanceRecord,
  AttendanceStatus,
  Homework,
  HomeworkStatus,
  StudentHomeworkItem,
  Test,
  StudentMark,
  TeacherTask,
  StudentProfileData,
  StudentAttendanceHistoryItem,
  StudentHomeworkReportItem,
  StudentTestReportItem,
  DefaulterStudent,
  DefaulterIssue,
  TestLeaderboardItem,
  TestRankStudent,
  BatchAnalyticsSummary,
  TuitionAnalyticsSummary,
} from '@/types/teacher';

const STORAGE_KEYS = {
  BATCHES: '@eduflow_teacher_batches',
  ATTENDANCE: '@eduflow_teacher_attendance',
  HOMEWORK: '@eduflow_teacher_homework',
  TESTS: '@eduflow_teacher_tests',
  MARKS: '@eduflow_teacher_marks',
  STUDENTS: '@eduflow_teacher_students',
  HW_SUBMISSIONS: '@eduflow_teacher_hw_submissions',
};

type BatchListener = (batches: Batch[]) => void;
const batchListeners = new Set<BatchListener>();

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

class TeacherService {
  private async getStored<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async setStored<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('TeacherService storage write error:', e);
    }
  }

  // Batches
  async getBatches(): Promise<Batch[]> {
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
        await this.setStored(STORAGE_KEYS.BATCHES, mappedBatches);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const attendance = await this.getAttendanceRecords();
        const attendanceMap = new Set(
          attendance.filter((r) => r.date === todayStr).map((r) => r.batchId),
        );
        return mappedBatches.map((b) => ({
          ...b,
          attendanceTakenToday: attendanceMap.has(b.id) || Boolean(b.attendanceTakenToday),
        }));
      }
    } catch (err) {
      console.warn('Supabase getBatches notice:', err);
    }

    const batches = await this.getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await this.getAttendanceRecords();
    const attendanceMap = new Set(
      attendance.filter((r) => r.date === todayStr).map((r) => r.batchId),
    );
    return batches.map((b) => ({
      ...b,
      attendanceTakenToday: attendanceMap.has(b.id) || Boolean(b.attendanceTakenToday),
    }));
  }

  async getTodayClasses(): Promise<Batch[]> {
    const batches = await this.getBatches();
    const todayBatches = batches.filter((b) => isBatchScheduledToday(b.schedule));
    return todayBatches.length > 0 ? todayBatches : batches;
  }

  async getClassesForDate(dateStr: string): Promise<(Batch & { attendanceTakenForDate: boolean; attendanceRecord?: AttendanceRecord })[]> {
    const batches = await this.getBatches();
    const targetDate = new Date(dateStr);
    const attendance = await this.getAttendanceRecords();
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
        const takenToday = await this.isAttendanceTakenToday(batchId);
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
    const takenToday = await this.isAttendanceTakenToday(batchId);
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

    const batches = await this.getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const updated = [newBatch, ...batches.filter((b) => b.id !== newBatch.id)];
    await this.setStored(STORAGE_KEYS.BATCHES, updated);

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

    const batches = await this.getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const filtered = batches.filter((b) => b.id !== batchId);
    await this.setStored(STORAGE_KEYS.BATCHES, filtered);
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

  // Students
  async getAllStudents(): Promise<Record<string, Student[]>> {
    const stored = await this.getStored<Record<string, Student[]> | null>(STORAGE_KEYS.STUDENTS, null);
    return stored || {};
  }

  async getBatchStudents(batchId: string): Promise<Student[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('batch_id', batchId)
        .order('roll_number', { ascending: true });

      if (!error && data) {
        const mapped: Student[] = data.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.roll_number,
          email: s.email || undefined,
          parentPhone: s.parent_phone || undefined,
          avatarUrl: s.avatar_url || undefined,
        }));
        const allStudents = await this.getAllStudents();
        allStudents[batchId] = mapped;
        await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase getBatchStudents notice:', err);
    }

    const allStudents = await this.getAllStudents();
    return allStudents[batchId] || [];
  }

  async addStudent(batchId: string, studentData: Omit<Student, 'id'>): Promise<Student> {
    const newStudent: Student = {
      ...studentData,
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    try {
      const { data: inserted, error } = await supabase
        .from('students')
        .insert({
          batch_id: batchId,
          name: studentData.name,
          roll_number: studentData.rollNumber,
          email: studentData.email || null,
          parent_phone: studentData.parentPhone || null,
          avatar_url: studentData.avatarUrl || null,
        })
        .select()
        .single();

      if (!error && inserted) {
        newStudent.id = inserted.id;
      }
    } catch (err) {
      console.warn('Supabase addStudent notice:', err);
    }

    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId] || [];

    const updatedBatchStudents = [...batchStudents, newStudent];
    allStudents[batchId] = updatedBatchStudents;
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);

    // Update batch studentCount
    const batches = await this.getBatches();
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        studentCount: updatedBatchStudents.length,
      };
      await this.setStored(STORAGE_KEYS.BATCHES, batches);
      batchListeners.forEach((listener) => listener(batches));
    }

    // Sync student_count to Supabase batch
    try {
      await supabase
        .from('batches')
        .update({ student_count: updatedBatchStudents.length })
        .eq('id', batchId);
    } catch (e) {
      console.warn('Sync student count notice:', e);
    }

    return newStudent;
  }

  async updateStudent(
    batchId: string,
    studentId: string,
    studentData: Partial<Omit<Student, 'id'>>,
  ): Promise<Student> {
    try {
      await supabase
        .from('students')
        .update({
          name: studentData.name,
          roll_number: studentData.rollNumber,
          email: studentData.email || null,
          parent_phone: studentData.parentPhone || null,
          avatar_url: studentData.avatarUrl || null,
        })
        .eq('id', studentId);
    } catch (err) {
      console.warn('Supabase updateStudent notice:', err);
    }

    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId] || [];

    const index = batchStudents.findIndex((s) => s.id === studentId);

    if (index === -1) {
      const newStudent: Student = {
        id: studentId || `st-${Date.now()}`,
        name: studentData.name || 'Student',
        rollNumber: studentData.rollNumber || '01',
        parentPhone: studentData.parentPhone,
        email: studentData.email,
      };
      allStudents[batchId] = [...batchStudents, newStudent];
      await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);
      return newStudent;
    }

    const updatedStudent: Student = {
      ...batchStudents[index],
      ...studentData,
    };

    batchStudents[index] = updatedStudent;
    allStudents[batchId] = [...batchStudents];
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);

    return updatedStudent;
  }

  async deleteStudent(batchId: string, studentId: string): Promise<void> {
    try {
      await supabase.from('students').delete().eq('id', studentId);
    } catch (err) {
      console.warn('Supabase deleteStudent notice:', err);
    }

    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId] || [];

    const filtered = batchStudents.filter((s) => s.id !== studentId);
    allStudents[batchId] = filtered;
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);

    // Update batch studentCount
    const batches = await this.getBatches();
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        studentCount: filtered.length,
      };
      await this.setStored(STORAGE_KEYS.BATCHES, batches);
      batchListeners.forEach((listener) => listener(batches));
    }

    try {
      await supabase
        .from('batches')
        .update({ student_count: filtered.length })
        .eq('id', batchId);
    } catch (e) {
      console.warn('Sync student count notice:', e);
    }
  }

  // Attendance
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
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
        await this.setStored(STORAGE_KEYS.ATTENDANCE, mappedRecords);
        return mappedRecords;
      }
    } catch (err) {
      console.warn('Supabase getAttendanceRecords notice:', err);
    }

    return this.getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
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
        .upsert({
          batch_id: batchId,
          date: date,
          present_count: presentCount,
          absent_count: absentCount,
          total_students: records.length,
          submitted_at: newRecord.submittedAt,
        }, { onConflict: 'batch_id,date' })
        .select()
        .single();

      if (!recErr && rec) {
        newRecord.id = rec.id;
        const items = records.map((r) => ({
          attendance_record_id: rec.id,
          student_id: r.studentId,
          status: r.status,
        }));
        await supabase.from('attendance_items').upsert(items, { onConflict: 'attendance_record_id,student_id' });
      }
    } catch (err) {
      console.warn('Supabase submitAttendance notice:', err);
    }

    const all = await this.getAttendanceRecords();
    // Replace if already exists for this batch+date, or prepend
    const filtered = all.filter((r) => !(r.batchId === batchId && r.date === date));
    const updated = [newRecord, ...filtered];
    await this.setStored(STORAGE_KEYS.ATTENDANCE, updated);

    // Update batch flag and notify listeners
    const batches = await this.getBatches();
    const updatedBatches = batches.map((b) =>
      b.id === batchId ? { ...b, attendanceTakenToday: true } : b,
    );
    await this.setStored(STORAGE_KEYS.BATCHES, updatedBatches);
    batchListeners.forEach((listener) => listener(updatedBatches));

    return newRecord;
  }

  // Homework
  async getHomeworkList(): Promise<Homework[]> {
    try {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const batches = await this.getBatches();
        const batchMap = new Map(batches.map((b) => [b.id, b]));

        const { data: subs } = await supabase.from('homework_submissions').select('homework_id, status');
        const subCounts = new Map<string, { done: number; half: number; notDone: number; total: number }>();
        if (subs) {
          subs.forEach((s) => {
            const c = subCounts.get(s.homework_id) || { done: 0, half: 0, notDone: 0, total: 0 };
            if (s.status === 'done') c.done++;
            else if (s.status === 'half_done') c.half++;
            else if (s.status === 'not_done') c.notDone++;
            c.total++;
            subCounts.set(s.homework_id, c);
          });
        }

        const mapped: Homework[] = data.map((h) => {
          const b = batchMap.get(h.batch_id);
          const c = subCounts.get(h.id);
          const done = c?.done || 0;
          const half = c?.half || 0;
          const notDone = c?.notDone || 0;
          return {
            id: h.id,
            batchId: h.batch_id,
            batchName: b?.name || 'Class Batch',
            title: h.title,
            description: h.description || undefined,
            dueDate: h.due_date,
            createdAt: h.created_at,
            submissionsCount: done + half,
            totalStudents: b?.studentCount || (c ? c.total : 0),
            doneCount: done,
            halfDoneCount: half,
            notDoneCount: notDone,
          };
        });
        await this.setStored(STORAGE_KEYS.HOMEWORK, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase getHomeworkList notice:', err);
    }

    return this.getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
  }

  async getBatchHomework(batchId: string): Promise<Homework[]> {
    const all = await this.getHomeworkList();
    return all.filter((h) => h.batchId === batchId);
  }

  async getHomeworkById(homeworkId: string): Promise<Homework | null> {
    const all = await this.getHomeworkList();
    return all.find((h) => h.id === homeworkId) ?? null;
  }

  async createHomework(
    data: Omit<Homework, 'id' | 'createdAt' | 'submissionsCount'>,
  ): Promise<Homework> {
    const newHw: Homework = {
      ...data,
      id: `hw-${Date.now()}`,
      createdAt: 'Just now',
      submissionsCount: 0,
      doneCount: 0,
      halfDoneCount: 0,
      notDoneCount: data.totalStudents || 0,
    };

    try {
      const { data: inserted, error } = await supabase
        .from('homework_assignments')
        .insert({
          batch_id: data.batchId,
          title: data.title,
          description: data.description || null,
          due_date: data.dueDate,
        })
        .select()
        .single();

      if (!error && inserted) {
        newHw.id = inserted.id;
      }
    } catch (err) {
      console.warn('Supabase createHomework notice:', err);
    }

    const all = await this.getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
    const updated = [newHw, ...all.filter((h) => h.id !== newHw.id)];
    await this.setStored(STORAGE_KEYS.HOMEWORK, updated);
    return newHw;
  }

  async deleteHomework(homeworkId: string): Promise<void> {
    try {
      await supabase.from('homework_assignments').delete().eq('id', homeworkId);
    } catch (err) {
      console.warn('Supabase deleteHomework notice:', err);
    }

    const list = await this.getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
    const filtered = list.filter((h) => h.id !== homeworkId);
    await this.setStored(STORAGE_KEYS.HOMEWORK, filtered);
  }

  async getHomeworkSubmissions(
    homeworkId: string,
    batchId: string,
  ): Promise<StudentHomeworkItem[]> {
    const students = await this.getBatchStudents(batchId);

    try {
      const { data: subs, error } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('homework_id', homeworkId);

      if (!error && subs && subs.length > 0) {
        const subMap = new Map(subs.map((s) => [s.student_id, s]));
        return students.map((s) => {
          const sub = subMap.get(s.id);
          return {
            studentId: s.id,
            studentName: s.name,
            rollNumber: s.rollNumber,
            status: (sub?.status as HomeworkStatus) || 'done',
            remarks: sub?.remarks || undefined,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase getHomeworkSubmissions notice:', err);
    }

    const key = `${STORAGE_KEYS.HW_SUBMISSIONS}_${homeworkId}`;
    const stored = await this.getStored<StudentHomeworkItem[] | null>(key, null);

    if (stored && stored.length > 0) {
      const storedMap = new Map(stored.map((s) => [s.studentId, s]));
      return students.map((s) => {
        const existing = storedMap.get(s.id);
        if (existing) {
          return {
            ...existing,
            studentName: s.name,
            rollNumber: s.rollNumber,
          };
        }
        return {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          status: 'done' as const,
        };
      });
    }

    return students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      status: 'done' as const,
    }));
  }

  async saveHomeworkSubmissions(
    homeworkId: string,
    batchId: string,
    submissions: StudentHomeworkItem[],
  ): Promise<void> {
    const key = `${STORAGE_KEYS.HW_SUBMISSIONS}_${homeworkId}`;
    await this.setStored(key, submissions);

    try {
      const rows = submissions.map((s) => ({
        homework_id: homeworkId,
        student_id: s.studentId,
        status: s.status,
        remarks: s.remarks || null,
      }));
      await supabase.from('homework_submissions').upsert(rows, { onConflict: 'homework_id,student_id' });
    } catch (err) {
      console.warn('Supabase saveHomeworkSubmissions notice:', err);
    }

    const doneCount = submissions.filter((s) => s.status === 'done').length;
    const halfDoneCount = submissions.filter((s) => s.status === 'half_done').length;
    const notDoneCount = submissions.filter((s) => s.status === 'not_done').length;
    const submissionsCount = doneCount + halfDoneCount;

    // Update the homework object in storage
    const all = await this.getHomeworkList();
    const updated = all.map((hw) => {
      if (hw.id === homeworkId) {
        return {
          ...hw,
          submissionsCount,
          totalStudents: submissions.length,
          doneCount,
          halfDoneCount,
          notDoneCount,
        };
      }
      return hw;
    });

    await this.setStored(STORAGE_KEYS.HOMEWORK, updated);
  }

  // Tests & Marks
  async getTestsList(): Promise<Test[]> {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const batches = await this.getBatches();
        const batchMap = new Map(batches.map((b) => [b.id, b]));

        const { data: marks } = await supabase.from('test_marks').select('test_id, marks_obtained');
        const marksCount = new Map<string, number>();
        if (marks) {
          marks.forEach((m) => {
            if (m.marks_obtained !== null) {
              marksCount.set(m.test_id, (marksCount.get(m.test_id) || 0) + 1);
            }
          });
        }

        const mapped: Test[] = data.map((t) => {
          const b = batchMap.get(t.batch_id);
          return {
            id: t.id,
            batchId: t.batch_id,
            batchName: b?.name || 'Class Batch',
            title: t.title,
            date: t.date,
            maxMarks: Number(t.max_marks),
            submittedCount: marksCount.get(t.id) || 0,
            totalStudents: b?.studentCount || 0,
          };
        });
        await this.setStored(STORAGE_KEYS.TESTS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase getTestsList notice:', err);
    }

    return this.getStored<Test[]>(STORAGE_KEYS.TESTS, []);
  }

  async getBatchTests(batchId: string): Promise<Test[]> {
    const all = await this.getTestsList();
    return all.filter((t) => t.batchId === batchId);
  }

  async getTestById(testId: string): Promise<Test | null> {
    const all = await this.getTestsList();
    return all.find((t) => t.id === testId) ?? null;
  }

  async createTest(data: Omit<Test, 'id' | 'submittedCount'>): Promise<Test> {
    const newTest: Test = {
      ...data,
      id: `test-${Date.now()}`,
      submittedCount: 0,
    };

    try {
      const { data: inserted, error } = await supabase
        .from('tests')
        .insert({
          batch_id: data.batchId,
          title: data.title,
          date: data.date,
          max_marks: data.maxMarks,
        })
        .select()
        .single();

      if (!error && inserted) {
        newTest.id = inserted.id;
      }
    } catch (err) {
      console.warn('Supabase createTest notice:', err);
    }

    const all = await this.getStored<Test[]>(STORAGE_KEYS.TESTS, []);
    const updated = [newTest, ...all.filter((t) => t.id !== newTest.id)];
    await this.setStored(STORAGE_KEYS.TESTS, updated);
    return newTest;
  }

  async deleteTest(testId: string): Promise<void> {
    try {
      await supabase.from('tests').delete().eq('id', testId);
    } catch (err) {
      console.warn('Supabase deleteTest notice:', err);
    }

    const list = await this.getStored<Test[]>(STORAGE_KEYS.TESTS, []);
    const filtered = list.filter((t) => t.id !== testId);
    await this.setStored(STORAGE_KEYS.TESTS, filtered);
  }

  async getTestMarks(testId: string, batchId: string): Promise<StudentMark[]> {
    const students = await this.getBatchStudents(batchId);

    try {
      const { data: marks, error } = await supabase
        .from('test_marks')
        .select('*')
        .eq('test_id', testId);

      if (!error && marks && marks.length > 0) {
        const markMap = new Map(marks.map((m) => [m.student_id, m.marks_obtained]));
        return students.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          marksObtained: markMap.has(s.id) ? (markMap.get(s.id) !== null ? Number(markMap.get(s.id)) : null) : null,
        }));
      }
    } catch (err) {
      console.warn('Supabase getTestMarks notice:', err);
    }

    const key = `${STORAGE_KEYS.MARKS}_${testId}`;
    const stored = await this.getStored<StudentMark[] | null>(key, null);
    if (stored && stored.length > 0) {
      const storedMap = new Map(stored.map((m) => [m.studentId, m]));
      return students.map((s) => {
        const existing = storedMap.get(s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          marksObtained: existing?.marksObtained ?? null,
        };
      });
    }

    return students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      marksObtained: null,
    }));
  }

  async saveTestMarks(testId: string, marks: StudentMark[]): Promise<void> {
    const key = `${STORAGE_KEYS.MARKS}_${testId}`;
    await this.setStored(key, marks);

    try {
      const rows = marks.map((m) => ({
        test_id: testId,
        student_id: m.studentId,
        marks_obtained: m.marksObtained,
      }));
      await supabase.from('test_marks').upsert(rows, { onConflict: 'test_id,student_id' });
    } catch (err) {
      console.warn('Supabase saveTestMarks notice:', err);
    }

    // Update submitted count on test
    const enteredCount = marks.filter((m) => m.marksObtained !== null).length;
    const tests = await this.getTestsList();
    const updatedTests = tests.map((t) =>
      t.id === testId ? { ...t, submittedCount: enteredCount } : t,
    );
    await this.setStored(STORAGE_KEYS.TESTS, updatedTests);
  }

  async getStudentProfileData(batchId: string, studentId: string): Promise<StudentProfileData | null> {
    const [batch, students, attendanceRecords, homeworkList, testsList] = await Promise.all([
      this.getBatchById(batchId),
      this.getBatchStudents(batchId),
      this.getBatchAttendanceHistory(batchId),
      this.getBatchHomework(batchId),
      this.getBatchTests(batchId),
    ]);

    if (!batch) return null;
    const student = students.find((s) => s.id === studentId);
    if (!student) return null;

    // 1. Attendance aggregation
    const history: StudentAttendanceHistoryItem[] = [];
    let presentCount = 0;
    let absentCount = 0;

    // Sort attendance records newest first
    const sortedAttendance = [...attendanceRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    for (const record of sortedAttendance) {
      const item = record.records?.find((r) => r.studentId === studentId);
      if (item) {
        if (item.status === 'present') presentCount++;
        else if (item.status === 'absent') absentCount++;

        history.push({
          id: record.id,
          date: record.date,
          status: item.status,
          submittedAt: record.submittedAt,
        });
      }
    }

    const totalClasses = presentCount + absentCount;
    const attendancePercentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    // 2. Homework aggregation
    const hwReportItems: StudentHomeworkReportItem[] = [];
    let hwDoneCount = 0;
    let hwHalfDoneCount = 0;
    let hwNotDoneCount = 0;

    for (const hw of homeworkList) {
      const submissions = await this.getHomeworkSubmissions(hw.id, batchId);
      const sub = submissions.find((s) => s.studentId === studentId);
      const status: HomeworkStatus = sub ? sub.status : 'done';
      if (status === 'done') hwDoneCount++;
      else if (status === 'half_done') hwHalfDoneCount++;
      else hwNotDoneCount++;

      hwReportItems.push({
        homeworkId: hw.id,
        title: hw.title,
        description: hw.description,
        dueDate: hw.dueDate,
        status,
        remarks: sub?.remarks,
      });
    }

    const totalAssigned = homeworkList.length;
    const hwScoreSum = hwDoneCount + 0.5 * hwHalfDoneCount;
    const completionPercentage =
      totalAssigned > 0 ? Math.round((hwScoreSum / totalAssigned) * 100) : 0;

    // 3. Tests & Marks aggregation
    const testReportItems: StudentTestReportItem[] = [];
    let testsAttempted = 0;
    let totalMarksScored = 0;
    let totalMaxMarks = 0;

    for (const test of testsList) {
      const marks = await this.getTestMarks(test.id, batchId);
      const markEntry = marks.find((m) => m.studentId === studentId);
      const marksObtained = markEntry?.marksObtained ?? null;

      let percentage: number | null = null;
      let gradeBadge = 'Pending';

      if (marksObtained !== null) {
        testsAttempted++;
        totalMarksScored += marksObtained;
        totalMaxMarks += test.maxMarks;
        percentage = test.maxMarks > 0 ? Math.round((marksObtained / test.maxMarks) * 100) : 0;
        if (percentage >= 90) gradeBadge = 'Outstanding';
        else if (percentage >= 80) gradeBadge = 'Excellent';
        else if (percentage >= 70) gradeBadge = 'Good';
        else if (percentage >= 60) gradeBadge = 'Average';
        else gradeBadge = 'Needs Attention';
      }

      testReportItems.push({
        testId: test.id,
        title: test.title,
        date: test.date,
        maxMarks: test.maxMarks,
        marksObtained,
        percentage,
        gradeBadge,
      });
    }

    const averagePercentage =
      totalMaxMarks > 0 ? Math.round((totalMarksScored / totalMaxMarks) * 100) : 0;

    let gradeLetter = 'N/A';
    if (testsAttempted > 0) {
      if (averagePercentage >= 90) gradeLetter = 'A+';
      else if (averagePercentage >= 80) gradeLetter = 'A';
      else if (averagePercentage >= 70) gradeLetter = 'B';
      else if (averagePercentage >= 60) gradeLetter = 'C';
      else if (averagePercentage >= 50) gradeLetter = 'D';
      else gradeLetter = 'F';
    }

    return {
      student,
      batch,
      attendance: {
        totalClasses,
        presentCount,
        absentCount,
        percentage: attendancePercentage,
        history,
      },
      homework: {
        totalAssigned,
        doneCount: hwDoneCount,
        halfDoneCount: hwHalfDoneCount,
        notDoneCount: hwNotDoneCount,
        completionPercentage,
        items: hwReportItems,
      },
      tests: {
        totalTests: testsList.length,
        testsAttempted,
        totalMarksScored,
        totalMaxMarks,
        averagePercentage,
        gradeLetter,
        items: testReportItems,
      },
    };
  }

  // Tasks Aggregator
  async getPendingTasks(): Promise<TeacherTask[]> {
    const batches = await this.getBatches();
    const tasks: TeacherTask[] = [];

    // 1. Pending attendance tasks
    for (const batch of batches) {
      if (!batch.attendanceTakenToday && (batch.studentCount ?? 0) > 0) {
        tasks.push({
          id: `task-att-${batch.id}`,
          title: 'Mark Today Attendance',
          subtitle: `${batch.grade} ${batch.subject} • ${batch.timing}`,
          type: 'attendance',
          batchId: batch.id,
          batchName: batch.name,
          dueDate: 'Today',
          status: 'pending',
          studentCount: batch.studentCount,
          progressText: `${batch.studentCount} students pending`,
          route: `/(teacher)/attendance/${batch.id}`,
        });
      }
    }

    // 2. Homework Review tasks
    const homework = await this.getHomeworkList();
    for (const hw of homework) {
      if (hw.submissionsCount > 0) {
        tasks.push({
          id: `task-hw-${hw.id}`,
          title: `Review Homework: ${hw.title}`,
          subtitle: `${hw.batchName} • Due: ${hw.dueDate}`,
          type: 'homework',
          batchId: hw.batchId,
          batchName: hw.batchName,
          dueDate: hw.dueDate,
          status: 'in_progress',
          studentCount: hw.totalStudents,
          progressText: `${hw.submissionsCount}/${hw.totalStudents} submitted`,
          route: `/(teacher)/batch/${hw.batchId}`,
        });
      }
    }

    // 3. Test Marks entry tasks
    const tests = await this.getTestsList();
    for (const test of tests) {
      if (test.submittedCount < test.totalStudents && test.totalStudents > 0) {
        tasks.push({
          id: `task-test-${test.id}`,
          title: `Enter Marks: ${test.title}`,
          subtitle: `${test.batchName} • Max ${test.maxMarks} marks`,
          type: 'marks',
          batchId: test.batchId,
          batchName: test.batchName,
          dueDate: test.date,
          status: test.submittedCount === 0 ? 'pending' : 'in_progress',
          studentCount: test.totalStudents,
          progressText: `${test.submittedCount}/${test.totalStudents} marks entered`,
          route: `/(teacher)/tests/${test.id}/marks`,
        });
      }
    }

    return tasks;
  }

  // Tuition Analytics Aggregator
  async getTuitionAnalytics(selectedBatchId?: string): Promise<TuitionAnalyticsSummary> {
    const allBatches = await this.getBatches();
    const activeBatches =
      selectedBatchId && selectedBatchId !== 'all'
        ? allBatches.filter((b) => b.id === selectedBatchId)
        : allBatches;

    const defaulters: DefaulterStudent[] = [];
    const testLeaderboards: TestLeaderboardItem[] = [];
    const batchSummaries: BatchAnalyticsSummary[] = [];

    let totalStudentsAcc = 0;
    let totalPresentOverall = 0;
    let totalAttendanceEntriesOverall = 0;
    let totalHwSubmissionsOverall = 0;
    let totalHwAssignedOverall = 0;
    let totalTestsCount = 0;

    for (const batch of activeBatches) {
      const [students, attendanceRecords, homeworkList, testsList] = await Promise.all([
        this.getBatchStudents(batch.id),
        this.getBatchAttendanceHistory(batch.id),
        this.getBatchHomework(batch.id),
        this.getBatchTests(batch.id),
      ]);

      totalStudentsAcc += students.length;
      totalTestsCount += testsList.length;

      // 1. Batch Attendance calculation
      let batchPresent = 0;
      let batchTotalEntries = 0;
      for (const rec of attendanceRecords) {
        batchPresent += rec.presentCount;
        batchTotalEntries += rec.presentCount + rec.absentCount;
      }
      totalPresentOverall += batchPresent;
      totalAttendanceEntriesOverall += batchTotalEntries;

      const batchAttPercent =
        batchTotalEntries > 0 ? Math.round((batchPresent / batchTotalEntries) * 100) : 0;

      let attStatus: 'excellent' | 'good' | 'needs_attention' = 'good';
      if (batchAttPercent >= 90) attStatus = 'excellent';
      else if (batchAttPercent < 75 && batchTotalEntries > 0) attStatus = 'needs_attention';

      // 2. Batch Homework calculation
      let batchHwDone = 0;
      let batchHwTotal = 0;
      for (const hw of homeworkList) {
        batchHwDone += hw.submissionsCount;
        batchHwTotal += hw.totalStudents;
      }
      totalHwSubmissionsOverall += batchHwDone;
      totalHwAssignedOverall += batchHwTotal;

      const batchHwPercent =
        batchHwTotal > 0 ? Math.round((batchHwDone / batchHwTotal) * 100) : 0;

      batchSummaries.push({
        batch,
        totalStudents: students.length,
        attendancePercentage: batchAttPercent,
        attendanceStatus: attStatus,
        totalClasses: attendanceRecords.length,
        hwCompletionPercentage: batchHwPercent,
        activeTestsCount: testsList.length,
      });

      // 3. Defaulter Identification per student
      const sortedAttendance = [...attendanceRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      for (const student of students) {
        const issues: DefaulterIssue[] = [];

        // Check attendance
        let studentPresent = 0;
        let studentTotal = 0;
        let consecutiveAbsences = 0;
        let checkingConsecutive = true;

        for (const record of sortedAttendance) {
          const item = record.records?.find((r) => r.studentId === student.id);
          if (item) {
            studentTotal++;
            if (item.status === 'present') {
              studentPresent++;
              checkingConsecutive = false;
            } else if (item.status === 'absent') {
              if (checkingConsecutive) consecutiveAbsences++;
            }
          }
        }

        const studentAttPercent =
          studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;

        if (consecutiveAbsences >= 2) {
          issues.push({
            type: 'attendance',
            severity: 'high',
            label: `${consecutiveAbsences} Consecutive Absences`,
            details: `Absent in last ${consecutiveAbsences} classes`,
          });
        } else if (studentTotal >= 2 && studentAttPercent < 75) {
          issues.push({
            type: 'attendance',
            severity: 'high',
            label: `Low Attendance (${studentAttPercent}%)`,
            details: `Attended ${studentPresent} of ${studentTotal} classes`,
          });
        }

        // Check homeworks
        let missedHw = 0;
        for (const hw of homeworkList) {
          const subs = await this.getHomeworkSubmissions(hw.id, batch.id);
          const sub = subs.find((s) => s.studentId === student.id);
          if (sub && sub.status === 'not_done') {
            missedHw++;
          }
        }

        if (missedHw >= 2) {
          issues.push({
            type: 'homework',
            severity: 'medium',
            label: `${missedHw} Missed Homeworks`,
            details: `Incomplete assignments pending review`,
          });
        }

        // Check test scores
        let latestScoreStr: string | undefined;
        for (const test of testsList) {
          const marks = await this.getTestMarks(test.id, batch.id);
          const markEntry = marks.find((m) => m.studentId === student.id);
          if (markEntry && markEntry.marksObtained !== null) {
            const mark = markEntry.marksObtained;
            const pct = test.maxMarks > 0 ? Math.round((mark / test.maxMarks) * 100) : 0;
            latestScoreStr = `${mark}/${test.maxMarks} (${pct}%)`;

            if (pct < 50) {
              issues.push({
                type: 'test',
                severity: 'high',
                label: `Low Test Score (${pct}%)`,
                details: `Scored ${mark}/${test.maxMarks} in ${test.title}`,
              });
            }
          }
        }

        if (issues.length > 0) {
          defaulters.push({
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            parentPhone: student.parentPhone,
            batchId: batch.id,
            batchName: batch.name,
            issues,
            attendancePercentage: studentAttPercent,
            missedHwCount: missedHw,
            recentTestScore: latestScoreStr,
          });
        }
      }

      // 4. Test Leaderboards
      for (const test of testsList) {
        const marks = await this.getTestMarks(test.id, batch.id);
        const enteredMarks = marks.filter((m) => m.marksObtained !== null);

        if (enteredMarks.length > 0) {
          const numericMarks = enteredMarks.map((m) => m.marksObtained as number);
          const highestMarks = Math.max(...numericMarks);
          const lowestMarks = Math.min(...numericMarks);
          const averageMarks = Math.round(
            numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length,
          );

          // Sort descending by marks
          const sortedMarks = [...enteredMarks].sort(
            (a, b) => (b.marksObtained ?? 0) - (a.marksObtained ?? 0),
          );

          let currentRank = 1;
          const topStudents: TestRankStudent[] = [];

          sortedMarks.slice(0, 5).forEach((m, idx) => {
            if (idx > 0 && m.marksObtained! < sortedMarks[idx - 1].marksObtained!) {
              currentRank = idx + 1;
            }
            const st = students.find((s) => s.id === m.studentId);
            const pct =
              test.maxMarks > 0 ? Math.round((m.marksObtained! / test.maxMarks) * 100) : 0;

            topStudents.push({
              rank: currentRank,
              studentId: m.studentId,
              studentName: m.studentName,
              rollNumber: m.rollNumber,
              marksObtained: m.marksObtained!,
              maxMarks: test.maxMarks,
              percentage: pct,
              parentPhone: st?.parentPhone,
            });
          });

          testLeaderboards.push({
            test,
            highestMarks,
            lowestMarks,
            averageMarks,
            topStudents,
            totalEntered: enteredMarks.length,
          });
        }
      }
    }

    const overallAttPercent =
      totalAttendanceEntriesOverall > 0
        ? Math.round((totalPresentOverall / totalAttendanceEntriesOverall) * 100)
        : 0;

    const overallHwPercent =
      totalHwAssignedOverall > 0
        ? Math.round((totalHwSubmissionsOverall / totalHwAssignedOverall) * 100)
        : 0;

    return {
      totalStudentsCount: totalStudentsAcc,
      averageAttendance: overallAttPercent,
      hwCompletionRate: overallHwPercent,
      totalTestsConducted: totalTestsCount,
      defaulters,
      testLeaderboards,
      batchSummaries,
    };
  }
}

export const teacherService = new TeacherService();

// WhatsApp Message Formatters for Local Tuition Classes (Multilingual: en, hi, gu)
export function formatStudentProgressWhatsAppMessage(params: {
  studentName: string;
  rollNumber: string;
  batchName: string;
  attendancePercentage: number;
  totalClassesAttended: number;
  totalClasses: number;
  hwCompletionPercentage: number;
  latestTest?: { title: string; marksObtained: number; maxMarks: number; rank?: number };
  remarks?: string;
  language?: 'en' | 'hi' | 'gu';
}): string {
  const lang = params.language || 'en';

  if (lang === 'gu') {
    const lines = [
      `📚 *EduFlow ટ્યુશન પ્રગતિ પત્રક* 📚`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *વિદ્યાર્થી:* ${params.studentName} (રોલ નં: ${params.rollNumber})`,
      `🏷️ *બેચ:* ${params.batchName}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 *હાજરી:* ${params.attendancePercentage}% (${params.totalClassesAttended}/${params.totalClasses} દિવસો)`,
      `📝 *લેસન:* ${params.hwCompletionPercentage}% પૂર્ણ`,
    ];
    if (params.latestTest) {
      const testPercent =
        params.latestTest.maxMarks > 0
          ? Math.round((params.latestTest.marksObtained / params.latestTest.maxMarks) * 100)
          : 0;
      const rankStr = params.latestTest.rank ? ` | 🏆 રેન્ક: #${params.latestTest.rank}` : '';
      lines.push(`🎯 *છેલ્લી ટેસ્ટ:* ${params.latestTest.title}`);
      lines.push(`   ગુણ: ${params.latestTest.marksObtained}/${params.latestTest.maxMarks} (${testPercent}%)${rankStr}`);
    }
    if (params.remarks && params.remarks.trim()) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`💬 *શિક્ષકની નોંધ:* ${params.remarks.trim()}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_આપના સતત સહકાર અને વિશ્વાસ બદલ આભાર!_`);
    return lines.join('\n');
  }

  if (lang === 'hi') {
    const lines = [
      `📚 *EduFlow ट्यूशन प्रगति पत्र* 📚`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *छात्र:* ${params.studentName} (रोल नं: ${params.rollNumber})`,
      `🏷️ *बैच:* ${params.batchName}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 *उपस्थिति:* ${params.attendancePercentage}% (${params.totalClassesAttended}/${params.totalClasses} दिन)`,
      `📝 *गृहकार्य:* ${params.hwCompletionPercentage}% पूर्ण`,
    ];
    if (params.latestTest) {
      const testPercent =
        params.latestTest.maxMarks > 0
          ? Math.round((params.latestTest.marksObtained / params.latestTest.maxMarks) * 100)
          : 0;
      const rankStr = params.latestTest.rank ? ` | 🏆 रैंक: #${params.latestTest.rank}` : '';
      lines.push(`🎯 *नवीनतम टेस्ट:* ${params.latestTest.title}`);
      lines.push(`   अंक: ${params.latestTest.marksObtained}/${params.latestTest.maxMarks} (${testPercent}%)${rankStr}`);
    }
    if (params.remarks && params.remarks.trim()) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`💬 *शिक्षक टिप्पणी:* ${params.remarks.trim()}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_आपके निरंतर सहयोग और विश्वास के लिए धन्यवाद!_`);
    return lines.join('\n');
  }

  const lines = [
    `📚 *EduFlow Tuition Progress Report* 📚`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Student:* ${params.studentName} (Roll: ${params.rollNumber})`,
    `🏷️ *Batch:* ${params.batchName}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📅 *Attendance:* ${params.attendancePercentage}% (${params.totalClassesAttended}/${params.totalClasses} classes)`,
    `📝 *Homework:* ${params.hwCompletionPercentage}% Completed`,
  ];
  if (params.latestTest) {
    const testPercent =
      params.latestTest.maxMarks > 0
        ? Math.round((params.latestTest.marksObtained / params.latestTest.maxMarks) * 100)
        : 0;
    const rankStr = params.latestTest.rank ? ` | 🏆 Rank: #${params.latestTest.rank}` : '';
    lines.push(`🎯 *Latest Test:* ${params.latestTest.title}`);
    lines.push(`   Score: ${params.latestTest.marksObtained}/${params.latestTest.maxMarks} (${testPercent}%)${rankStr}`);
  }
  if (params.remarks && params.remarks.trim()) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💬 *Teacher Remarks:* ${params.remarks.trim()}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Thank you for your continuous support & trust!_`);
  return lines.join('\n');
}

export function formatDefaulterWhatsAppMessage(params: {
  studentName: string;
  batchName: string;
  issuesSummary: string;
  language?: 'en' | 'hi' | 'gu';
}): string {
  const lang = params.language || 'en';

  if (lang === 'gu') {
    return [
      `⚠️ *ટ્યુશન ક્લાસ તરફથી મહત્વપૂર્ણ સંદેશ*`,
      `આદરણીય વાલીશ્રી, આ સંદેશ *${params.studentName}* (${params.batchName}) ના અભ્યાસ અંગે છે.`,
      ``,
      `અમે નીચે મુજબની બાબતો ધ્યાને લીધી છે જેમાં આપના માર્ગદર્શનની જરૂર છે:`,
      `• ${params.issuesSummary}`,
      ``,
      `કૃપા કરીને નિયમિત હાજરી અને સમયસર લેસન પૂર્ણ કરાવવા વિનંતી છે. કોઈ સહાયની જરૂર હોય તો અમારો સંપર્ક કરી શકો છો.`,
      ``,
      `_સાદર પ્રણામ,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  if (lang === 'hi') {
    return [
      `⚠️ *ट्यूशन क्लास से महत्वपूर्ण अपडेट*`,
      `प्रिय अभिभावक, यह संदेश *${params.studentName}* (${params.batchName}) के संबंध में है।`,
      ``,
      `हमने निम्नलिखित बिंदुओं पर ध्यान दिया है जिनमें आपके मार्गदर्शन की आवश्यकता है:`,
      `• ${params.issuesSummary}`,
      ``,
      `कृपया नियमित उपस्थिति और समय पर गृहकार्य पूरा करना सुनिश्चित करें। यदि किसी सहायता की आवश्यकता हो तो हमसे संपर्क करें।`,
      ``,
      `_ सादर,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  return [
    `⚠️ *Important Update from Tuition Class*`,
    `Dear Parent, this is an update regarding *${params.studentName}* (${params.batchName}).`,
    ``,
    `We observed the following points that require your guidance:`,
    `• ${params.issuesSummary}`,
    ``,
    `Kindly ensure regular attendance and timely homework completion. Please feel free to reach out to us if any support is needed.`,
    ``,
    `_Warm regards,_`,
    `*EduFlow Coaching Academy*`,
  ].join('\n');
}

export function formatTopperWhatsAppMessage(params: {
  studentName: string;
  batchName: string;
  testTitle: string;
  rank: number;
  marksObtained: number;
  maxMarks: number;
  language?: 'en' | 'hi' | 'gu';
}): string {
  const rankEmoji = params.rank === 1 ? '🥇' : params.rank === 2 ? '🥈' : '🥉';
  const percent = Math.round((params.marksObtained / params.maxMarks) * 100);
  const lang = params.language || 'en';

  if (lang === 'gu') {
    return [
      `🌟 *ટ્યુશન ક્લાસ તરફથી ખૂબ ખૂબ અભિનંદન!* 🌟`,
      `આદરણીય વાલીશ્રી, જણાવતા ખૂબ આનંદ થાય છે કે *${params.studentName}* એ તાજેતરની ટેસ્ટમાં ${rankEmoji} *રેન્ક #${params.rank}* મેળવ્યો છે!`,
      ``,
      `📝 *ટેસ્ટ:* ${params.testTitle}`,
      `🏷️ *બેચ:* ${params.batchName}`,
      `🎯 *મેળવેલ ગુણ:* ${params.marksObtained}/${params.maxMarks} (${percent}%)`,
      ``,
      `આવી જ મહેનત અને લગન ચાલુ રાખો! 🚀`,
      ``,
      `_સાદર પ્રણામ,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  if (lang === 'hi') {
    return [
      `🌟 *ट्यूशन क्लास की ओर से हार्दिक बधाई!* 🌟`,
      `प्रिय अभिभावक, हमें यह बताते हुए खुशी हो रही है कि *${params.studentName}* ने हालिया टेस्ट में ${rankEmoji} *रैंक #${params.rank}* प्राप्त की है!`,
      ``,
      `📝 *टेस्ट:* ${params.testTitle}`,
      `🏷️ *बैच:* ${params.batchName}`,
      `🎯 *प्राप्त अंक:* ${params.marksObtained}/${params.maxMarks} (${percent}%)`,
      ``,
      `शानदार समर्पण और कड़ी मेहनत जारी रखें! 🚀`,
      ``,
      `_सादर,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  return [
    `🌟 *Congratulations from Tuition Class!* 🌟`,
    `Dear Parent, we are delighted to share that *${params.studentName}* has achieved ${rankEmoji} *Rank #${params.rank}* in the recent test!`,
    ``,
    `📝 *Test:* ${params.testTitle}`,
    `🏷️ *Batch:* ${params.batchName}`,
    `🎯 *Score:* ${params.marksObtained}/${params.maxMarks} (${percent}%)`,
    ``,
    `Keep up the fantastic dedication and hard work! 🚀`,
    ``,
    `_Warm regards,_`,
    `*EduFlow Coaching Academy*`,
  ].join('\n');
}
