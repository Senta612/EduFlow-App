import { supabase } from '@/lib/supabase';
import { Student, Batch } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';

export class StudentsService {
  async getAllStudents(): Promise<Record<string, Student[]>> {
    const stored = await getStored<Record<string, Student[]> | null>(STORAGE_KEYS.STUDENTS, null);
    return stored || {};
  }

  async getBatchStudents(batchId: string): Promise<Student[]> {
    const allStudents = await this.getAllStudents();
    const existingBatchStudents = allStudents[batchId] || [];

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('batch_id', batchId)
        .order('roll_number', { ascending: true });

      if (!error && data) {
        const mapped: Student[] = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.roll_number,
          email: s.email || undefined,
          parentPhone: s.parent_phone || undefined,
          avatarUrl: s.avatar_url || undefined,
          inviteCode: s.invite_code || `STU-${s.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'PORTAL'}`,
        }));

        const supabaseIds = new Set(mapped.map((s) => s.id));
        const unsynced = existingBatchStudents.filter((s) => !supabaseIds.has(s.id));
        const combined = [...mapped, ...unsynced];

        allStudents[batchId] = combined;
        await setStored(STORAGE_KEYS.STUDENTS, allStudents);
        return combined;
      }
    } catch (err) {
      console.warn('Supabase getBatchStudents notice:', err);
    }

    return existingBatchStudents;
  }

  async addStudent(batchId: string, studentData: Omit<Student, 'id'>): Promise<Student> {
    const generatedCode = `STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newStudent: Student = {
      ...studentData,
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      inviteCode: studentData.inviteCode || generatedCode,
    };

    try {
      const { data: inserted, error } = await (supabase
        .from('students') as any)
        .insert({
          batch_id: batchId,
          name: studentData.name,
          roll_number: studentData.rollNumber,
          email: studentData.email || null,
          parent_phone: studentData.parentPhone || null,
          avatar_url: studentData.avatarUrl || null,
          invite_code: newStudent.inviteCode,
        })
        .select()
        .single();

      if (!error && inserted) {
        newStudent.id = inserted.id;
        if (inserted.invite_code) {
          newStudent.inviteCode = inserted.invite_code;
        }
      }
    } catch (err) {
      console.warn('Supabase addStudent notice:', err);
    }

    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId] || [];

    const updatedBatchStudents = [...batchStudents, newStudent];
    allStudents[batchId] = updatedBatchStudents;
    await setStored(STORAGE_KEYS.STUDENTS, allStudents);

    // Update batch studentCount
    const batches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        studentCount: updatedBatchStudents.length,
      };
      await setStored(STORAGE_KEYS.BATCHES, batches);
      batchesService.notifyBatchListeners(batches);
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
      await setStored(STORAGE_KEYS.STUDENTS, allStudents);
      return newStudent;
    }

    const updatedStudent: Student = {
      ...batchStudents[index],
      ...studentData,
    };

    batchStudents[index] = updatedStudent;
    allStudents[batchId] = [...batchStudents];
    await setStored(STORAGE_KEYS.STUDENTS, allStudents);

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
    await setStored(STORAGE_KEYS.STUDENTS, allStudents);

    // Update batch studentCount
    const batches = await getStored<Batch[]>(STORAGE_KEYS.BATCHES, []);
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        studentCount: filtered.length,
      };
      await setStored(STORAGE_KEYS.BATCHES, batches);
      batchesService.notifyBatchListeners(batches);
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
}

export const studentsService = new StudentsService();
