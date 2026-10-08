import { supabase } from '@/lib/supabase';
import { Homework, StudentHomeworkItem, HomeworkStatus } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';
import { studentsService } from './students.service';

export class HomeworkService {
  async getHomeworkList(): Promise<Homework[]> {
    const localStored = await getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);

    try {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const batches = await batchesService.getBatches();
        const batchMap = new Map(batches.map((b) => [b.id, b]));

        const { data: subs } = await supabase
          .from('homework_submissions')
          .select('homework_id, status');
        const subCounts = new Map<
          string,
          { done: number; half: number; notDone: number; total: number }
        >();
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

        const supabaseMapped: Homework[] = data.map((h) => {
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

        // Merge Supabase items with local offline items
        const supabaseIds = new Set(supabaseMapped.map((s) => s.id));
        const unsyncedLocal = localStored.filter((loc) => !supabaseIds.has(loc.id));
        const combined = [...supabaseMapped, ...unsyncedLocal];

        await setStored(STORAGE_KEYS.HOMEWORK, combined);
        return combined;
      }
    } catch (err) {
      console.warn('Supabase getHomeworkList notice:', err);
    }

    return localStored;
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
    const totalStudents = data.totalStudents || 0;
    const newHw: Homework = {
      ...data,
      id: `hw-${Date.now()}`,
      createdAt: 'Just now',
      submissionsCount: totalStudents,
      doneCount: totalStudents,
      halfDoneCount: 0,
      notDoneCount: 0,
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

    // Initialize student submission list for this homework (default: done)
    try {
      const students = await studentsService.getBatchStudents(data.batchId);
      if (students.length > 0) {
        const initialSubmissions: StudentHomeworkItem[] = students.map((st) => ({
          studentId: st.id,
          studentName: st.name,
          rollNumber: st.rollNumber,
          status: 'done' as const,
        }));
        const subKey = `${STORAGE_KEYS.HW_SUBMISSIONS}_${newHw.id}`;
        await setStored(subKey, initialSubmissions);

        newHw.totalStudents = students.length;
        newHw.submissionsCount = students.length;
        newHw.doneCount = students.length;
        newHw.halfDoneCount = 0;
        newHw.notDoneCount = 0;
      }
    } catch (err) {
      console.warn('Initialize submissions notice:', err);
    }

    const all = await getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
    const updated = [newHw, ...all.filter((h) => h.id !== newHw.id)];
    await setStored(STORAGE_KEYS.HOMEWORK, updated);
    return newHw;
  }

  async deleteHomework(homeworkId: string): Promise<void> {
    try {
      await supabase.from('homework_assignments').delete().eq('id', homeworkId);
    } catch (err) {
      console.warn('Supabase deleteHomework notice:', err);
    }

    const list = await getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, []);
    const filtered = list.filter((h) => h.id !== homeworkId);
    await setStored(STORAGE_KEYS.HOMEWORK, filtered);
  }

  async getHomeworkSubmissions(
    homeworkId: string,
    batchId: string,
  ): Promise<StudentHomeworkItem[]> {
    const students = await studentsService.getBatchStudents(batchId);

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
    const stored = await getStored<StudentHomeworkItem[] | null>(key, null);

    if (stored && stored.length > 0) {
      const storedMap = new Map(stored.map((s) => [s.studentId, s]));
      return students.map((s) => {
        const existing = storedMap.get(s.id);
        if (existing) {
          return {
            ...existing,
            studentName: s.name,
            rollNumber: s.rollNumber,
            status: existing.status || ('done' as const),
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
    await setStored(key, submissions);

    try {
      const rows = submissions.map((s) => ({
        homework_id: homeworkId,
        student_id: s.studentId,
        status: s.status,
        remarks: s.remarks || null,
      }));
      await supabase
        .from('homework_submissions')
        .upsert(rows, { onConflict: 'homework_id,student_id' });
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

    await setStored(STORAGE_KEYS.HOMEWORK, updated);
  }
}

export const homeworkService = new HomeworkService();
