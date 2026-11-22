import { supabase } from '@/lib/supabase';
import { Test, StudentMark } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';
import { studentsService } from './students.service';
import { syncQueueService } from '@/services/offline';
import { pushTokenService, pushDispatchService } from '@/services/notifications';

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
    const { subscriptionService } = await import('@/services/subscription.service');
    await subscriptionService.assertProEntitlement('create a test');

    const newTest: Test = {
      ...data,
      id: `test-${Date.now()}`,
      submittedCount: 0,
    };

    // 1. Optimistic local store
    const all = await getStored<Test[]>(STORAGE_KEYS.TESTS, []);
    const updated = [newTest, ...all.filter((t) => t.id !== newTest.id)];
    await setStored(STORAGE_KEYS.TESTS, updated);

    // 2. Queue offline mutation
    await syncQueueService.enqueue('test', 'create', newTest);

    return newTest;
  }

  async deleteTest(testId: string): Promise<void> {
    const { subscriptionService } = await import('@/services/subscription.service');
    await subscriptionService.assertProEntitlement('delete a test');

    const list = await getStored<Test[]>(STORAGE_KEYS.TESTS, []);
    const filtered = list.filter((t) => t.id !== testId);
    await setStored(STORAGE_KEYS.TESTS, filtered);

    // Offline queue
    await syncQueueService.enqueue('test', 'delete', { id: testId });
  }
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
    const { subscriptionService } = await import('@/services/subscription.service');
    await subscriptionService.assertProEntitlement('enter or update test marks');

    // 1. Optimistic local store
    const key = `${STORAGE_KEYS.MARKS}_${testId}`;
    await setStored(key, marks);

    // Update submitted count on test
    const enteredCount = marks.filter((m) => m.marksObtained !== null).length;
    const tests = await this.getTestsList();
    const updatedTests = tests.map((t) =>
      t.id === testId ? { ...t, submittedCount: enteredCount } : t,
    );
    await setStored(STORAGE_KEYS.TESTS, updatedTests);

    // 2. Offline sync queue
    await syncQueueService.enqueue('marks', 'create', { testId, marks });

    // 3. Dispatch Push Notifications for scored students
    const targetTest = tests.find((t) => t.id === testId);
    if (targetTest) {
      const scoredStudents = marks.filter(
        (m) => m.marksObtained !== null && m.marksObtained !== undefined,
      );

      for (const st of scoredStudents) {
        pushTokenService
          .getTokensForStudents([st.studentId])
          .then((tokens) => {
            if (tokens.length > 0) {
              pushDispatchService.sendTestMarksAlert(
                targetTest.title,
                st.studentName,
                Number(st.marksObtained),
                targetTest.maxMarks,
                tokens,
              );
            }
          })
          .catch((err) => console.warn('[TestsService] Marks alert notice:', err));
      }
    }
  }
  }
}

export const testsService = new TestsService();
