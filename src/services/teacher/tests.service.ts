import { supabase } from '@/lib/supabase';
import { Test, StudentMark } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';
import { studentsService } from './students.service';

export class TestsService {
  async getTestsList(): Promise<Test[]> {
    const localStored = await getStored<Test[]>(STORAGE_KEYS.TESTS, []);

    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const batches = await batchesService.getBatches();
        const batchMap = new Map(batches.map((b) => [b.id, b]));

        const { data: marks } = await supabase
          .from('test_marks')
          .select('test_id, marks_obtained');
        const marksCount = new Map<string, number>();
        if (marks) {
          marks.forEach((m) => {
            if (m.marks_obtained !== null) {
              marksCount.set(m.test_id, (marksCount.get(m.test_id) || 0) + 1);
            }
          });
        }

        const supabaseMapped: Test[] = data.map((t) => {
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

        const supabaseIds = new Set(supabaseMapped.map((s) => s.id));
        const unsyncedLocal = localStored.filter((loc) => !supabaseIds.has(loc.id));
        const combined = [...supabaseMapped, ...unsyncedLocal];

        await setStored(STORAGE_KEYS.TESTS, combined);
        return combined;
      }
    } catch (err) {
      console.warn('Supabase getTestsList notice:', err);
    }

    return localStored;
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

    // Initialize student test marks
    try {
      const students = await studentsService.getBatchStudents(data.batchId);
      if (students.length > 0) {
        const initialMarks: StudentMark[] = students.map((st) => ({
          studentId: st.id,
          studentName: st.name,
          rollNumber: st.rollNumber,
          marksObtained: null,
        }));
        const key = `${STORAGE_KEYS.MARKS}_${newTest.id}`;
        await setStored(key, initialMarks);
      }
    } catch (err) {
      console.warn('Initialize test marks notice:', err);
    }

    const all = await getStored<Test[]>(STORAGE_KEYS.TESTS, []);
    const updated = [newTest, ...all.filter((t) => t.id !== newTest.id)];
    await setStored(STORAGE_KEYS.TESTS, updated);
    return newTest;
  }

  async deleteTest(testId: string): Promise<void> {
    try {
      await supabase.from('tests').delete().eq('id', testId);
    } catch (err) {
      console.warn('Supabase deleteTest notice:', err);
    }

    const list = await getStored<Test[]>(STORAGE_KEYS.TESTS, []);
    const filtered = list.filter((t) => t.id !== testId);
    await setStored(STORAGE_KEYS.TESTS, filtered);
  }

  async getTestMarks(testId: string, batchId: string): Promise<StudentMark[]> {
    const students = await studentsService.getBatchStudents(batchId);

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
          marksObtained: markMap.has(s.id)
            ? markMap.get(s.id) !== null
              ? Number(markMap.get(s.id))
              : null
            : null,
        }));
      }
    } catch (err) {
      console.warn('Supabase getTestMarks notice:', err);
    }

    const key = `${STORAGE_KEYS.MARKS}_${testId}`;
    const stored = await getStored<StudentMark[] | null>(key, null);
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
    await setStored(key, marks);

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
    await setStored(STORAGE_KEYS.TESTS, updatedTests);
  }
}

export const testsService = new TestsService();
