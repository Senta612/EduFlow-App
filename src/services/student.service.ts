import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  StudentDashboardSummary,
  StudentHomeworkItemView,
  StudentTestResultView,
  StudentAttendanceOverview,
  EnrolledBatchInfo,
  StudentTodayClass,
  StudentAnnouncement,
  StudentSession,
} from '@/types/student';
import { HomeworkStatus } from '@/types/teacher';
import { isBatchScheduledToday } from './teacher.service';

const STUDENT_DATA_STORAGE_KEY = '@eduflow_student_storage_v1';
const STUDENT_SESSION_KEY = '@eduflow_active_student_session';

export class StudentService {
  /**
   * Get active local student session (from invite link / token)
   */
  static async getActiveSession(): Promise<StudentSession | null> {
    try {
      const raw = await AsyncStorage.getItem(STUDENT_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw) as StudentSession;
      }
    } catch (e) {
      console.warn('Failed to read active student session:', e);
    }
    return null;
  }

  /**
   * Set active local student session
   */
  static async setActiveSession(session: StudentSession): Promise<void> {
    try {
      await AsyncStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to save active student session:', e);
    }
  }

  /**
   * Clear active student session
   */
  static async clearActiveSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STUDENT_SESSION_KEY);
    } catch (e) {
      console.warn('Failed to clear active student session:', e);
    }
  }

  /**
   * Extract and sanitize invite code from raw input, URL, or shared WhatsApp message
   */
  static parseInviteCode(rawInput: string): string {
    if (!rawInput) return '';
    const text = rawInput.trim();

    // 1. Direct match for STU-XXXXXX pattern
    const stuMatch = text.match(/\b(STU-[a-zA-Z0-9]+)\b/i);
    if (stuMatch && stuMatch[1]) {
      return stuMatch[1].toUpperCase();
    }

    // 2. Query parameter match in URL (e.g. ?code=STU-123 or &token=123)
    const urlParamMatch = text.match(/[?&](?:code|token)=([a-zA-Z0-9-]+)/i);
    if (urlParamMatch && urlParamMatch[1]) {
      return urlParamMatch[1].toUpperCase();
    }

    // 3. Match after "Access Code:" or "Code:"
    const codeLabelMatch = text.match(/(?:Access\s*Code|Code)\s*:\s*([a-zA-Z0-9-]+)/i);
    if (codeLabelMatch && codeLabelMatch[1]) {
      return codeLabelMatch[1].toUpperCase();
    }

    // 4. Default clean up
    return text.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  }

  /**
   * Verify an invite code and log student in directly without password
   */
  static async verifyAndLoginWithInvite(rawCode: string): Promise<{
    success: boolean;
    session?: StudentSession;
    error?: string;
  }> {
    const cleanCode = this.parseInviteCode(rawCode);
    if (!cleanCode || cleanCode.length < 2) {
      return { success: false, error: 'Please enter a valid student invite code.' };
    }

    // 1. Check Supabase by invite_code
    try {
      // Check if cleanCode is a valid UUID format to avoid Postgres casting error
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
      
      let query = supabase
        .from('students')
        .select('*, batches(id, name, subject, grade)');

      if (isUUID) {
        query = query.or(`invite_code.ilike.${cleanCode},id.eq.${cleanCode}`);
      } else {
        query = query.or(`invite_code.ilike.${cleanCode},invite_code.ilike.STU-${cleanCode}`);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const batchInfo = (data as any).batches;
        const session: StudentSession = {
          studentId: data.id,
          name: data.name,
          rollNumber: data.roll_number,
          batchId: data.batch_id,
          batchName: batchInfo ? `${batchInfo.name} (${batchInfo.subject || ''})` : 'Class Batch',
          inviteCode: data.invite_code || cleanCode,
          email: data.email || undefined,
          parentPhone: data.parent_phone || undefined,
          joinedAt: new Date().toISOString(),
        };

        await this.setActiveSession(session);
        return { success: true, session };
      }
    } catch (err) {
      console.warn('Supabase invite verification notice:', err);
    }

    // 2. Fallback: Search local storage students for offline / demo support
    try {
      // Check all possible student storage keys in EduFlow
      const candidateKeys = [
        '@eduflow_teacher_students',
        '@eduflow_teacher_students_v1',
        '@eduflow_students',
      ];

      // Also get batches from local storage for accurate batch names
      let localBatches: any[] = [];
      try {
        const batchesRaw = await AsyncStorage.getItem('@eduflow_teacher_batches');
        if (batchesRaw) localBatches = JSON.parse(batchesRaw);
      } catch {
        // ignore
      }

      for (const key of candidateKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        let studentList: { student: any; batchId: string }[] = [];

        if (Array.isArray(parsed)) {
          studentList = parsed.map((s) => ({ student: s, batchId: s.batchId || '' }));
        } else if (typeof parsed === 'object' && parsed !== null) {
          for (const [batchId, students] of Object.entries(parsed)) {
            if (Array.isArray(students)) {
              students.forEach((s) => studentList.push({ student: s, batchId }));
            }
          }
        }

        const match = studentList.find(({ student: s }) => {
          if (!s) return false;
          const sInvite = s.inviteCode?.toUpperCase();
          const sId = s.id?.toUpperCase();
          const sGenerated = `STU-${(s.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
          const sRoll = String(s.rollNumber || '').trim();

          return (
            sInvite === cleanCode ||
            sInvite === `STU-${cleanCode}` ||
            cleanCode === sInvite ||
            sId === cleanCode ||
            sGenerated === cleanCode ||
            sRoll === cleanCode ||
            (s.email && s.email.toUpperCase() === cleanCode)
          );
        });

        if (match) {
          const s = match.student;
          const batchObj = localBatches.find((b) => b.id === match.batchId);
          const batchName = batchObj
            ? `${batchObj.name} (${batchObj.subject || batchObj.grade || ''})`
            : 'Class Batch';

          const session: StudentSession = {
            studentId: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
            batchId: match.batchId,
            batchName,
            inviteCode: s.inviteCode || cleanCode,
            email: s.email,
            parentPhone: s.parentPhone,
            joinedAt: new Date().toISOString(),
          };

          await this.setActiveSession(session);
          return { success: true, session };
        }
      }
    } catch (localErr) {
      console.warn('Local storage invite lookup error:', localErr);
    }

    return {
      success: false,
      error: 'Invalid or expired student invite code. Please ask your teacher for a fresh link.',
    };
  }

  private static async getStudentInfo(studentId?: string): Promise<{
    id: string;
    name: string;
    rollNumber: string;
    batchId?: string;
    email?: string;
    parentPhone?: string;
  } | null> {
    try {
      // Check active local student session first if no studentId explicitly given
      if (!studentId) {
        const active = await this.getActiveSession();
        if (active) {
          return {
            id: active.studentId,
            name: active.name,
            rollNumber: active.rollNumber,
            batchId: active.batchId,
            email: active.email,
            parentPhone: active.parentPhone,
          };
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase.from('students').select('*');
      if (studentId) {
        query = query.eq('id', studentId);
      } else if (user?.email) {
        query = query.eq('email', user.email);
      } else if (user?.id) {
        query = query.eq('id', user.id);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          rollNumber: data.roll_number,
          batchId: data.batch_id,
          email: data.email || undefined,
          parentPhone: data.parent_phone || undefined,
        };
      }

      // If active session exists, fallback to it
      const activeFallback = await this.getActiveSession();
      if (activeFallback) {
        return {
          id: activeFallback.studentId,
          name: activeFallback.name,
          rollNumber: activeFallback.rollNumber,
          batchId: activeFallback.batchId,
          email: activeFallback.email,
          parentPhone: activeFallback.parentPhone,
        };
      }

      if (user) {
        return {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
          rollNumber: '-',
          email: user.email,
        };
      }
    } catch (e) {
      console.warn('getStudentInfo error:', e);
    }
    return null;
  }

  /**
   * Get main student dashboard aggregated metrics and schedule from real database
   */
  static async getDashboardSummary(studentId?: string): Promise<StudentDashboardSummary> {
    const student = await this.getStudentInfo(studentId);
    const sId = student?.id || studentId || '';
    const studentName = student?.name || 'Student';
    const rollNumber = student?.rollNumber || '-';

    let enrolledBatch: EnrolledBatchInfo | undefined = undefined;
    const todayClasses: StudentTodayClass[] = [];

    if (student?.batchId) {
      try {
        const { data: batchData } = await supabase
          .from('batches')
          .select('*')
          .eq('id', student.batchId)
          .maybeSingle();

        if (batchData) {
          let teacherName = 'Teacher';
          let teacherPhone = '';
          let teacherEmail = '';
          let instituteName = 'EduFlow Academy';

          if (batchData.teacher_id) {
            const { data: teacherProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', batchData.teacher_id)
              .maybeSingle();

            if (teacherProfile) {
              teacherName = teacherProfile.full_name || 'Teacher';
              teacherPhone = teacherProfile.phone || '';
              teacherEmail = teacherProfile.email || '';
              instituteName = teacherProfile.institute_name || instituteName;
            }
          }

          enrolledBatch = {
            id: batchData.id,
            name: batchData.name,
            grade: batchData.grade,
            subject: batchData.subject,
            schedule: batchData.schedule,
            timing: batchData.timing,
            room: batchData.room || undefined,
            teacherName,
            teacherPhone,
            teacherEmail,
            instituteName,
          };

          if (isBatchScheduledToday(batchData.schedule)) {
            todayClasses.push({
              id: `cls-${batchData.id}`,
              batchName: batchData.name,
              subject: batchData.subject,
              timing: batchData.timing,
              room: batchData.room || 'Classroom',
              status: 'upcoming',
              teacherName,
            });
          }
        }
      } catch (err) {
        console.warn('Dashboard batch fetch warning:', err);
      }

      // Local storage fallback for batch
      if (!enrolledBatch) {
        try {
          const batchesRaw = await AsyncStorage.getItem('@eduflow_teacher_batches');
          if (batchesRaw) {
            const batches = JSON.parse(batchesRaw);
            const b = batches.find((item: any) => item.id === student.batchId);
            if (b) {
              enrolledBatch = {
                id: b.id,
                name: b.name,
                grade: b.grade,
                subject: b.subject,
                schedule: b.schedule,
                timing: b.timing,
                room: b.room || undefined,
                teacherName: 'Teacher',
                instituteName: 'EduFlow Academy',
              };

              if (isBatchScheduledToday(b.schedule)) {
                todayClasses.push({
                  id: `cls-${b.id}`,
                  batchName: b.name,
                  subject: b.subject,
                  timing: b.timing,
                  room: b.room || 'Classroom',
                  status: 'upcoming',
                  teacherName: 'Teacher',
                });
              }
            }
          }
        } catch (localBatchErr) {
          console.warn('Local batch lookup error:', localBatchErr);
        }
      }
    }

    const hwList = await this.getHomeworkList(sId);
    const pendingHw = hwList.filter((h) => h.status !== 'done').length;
    const completedHw = hwList.filter((h) => h.status === 'done').length;

    const tests = await this.getTestResults(sId);
    const avgTestPct = tests.length > 0
      ? Math.round(tests.reduce((acc, t) => acc + (t.percentage || 0), 0) / tests.length)
      : 0;

    const attendance = await this.getAttendanceOverview(sId);

    return {
      studentId: sId,
      studentName,
      rollNumber,
      avatarUrl: undefined,
      enrolledBatch,
      nextClass: todayClasses[0],
      todayClasses,
      stats: {
        attendancePercentage: attendance.overallPercentage,
        totalClasses: attendance.totalClasses,
        presentClasses: attendance.presentCount,
        pendingHomeworkCount: pendingHw,
        completedHomeworkCount: completedHw,
        averageTestPercentage: avgTestPct,
        testsTaken: tests.length,
        classRank: tests.length > 0 && tests[0].rankInBatch ? tests[0].rankInBatch : undefined,
        totalStudentsInBatch: enrolledBatch ? 1 : 0,
      },
      recentAnnouncements: [],
    };
  }

  /**
   * Get all homework items for the student with live status overrides
   */
  static async getHomeworkList(
    studentId?: string,
    filter?: 'pending' | 'completed' | 'all'
  ): Promise<StudentHomeworkItemView[]> {
    const student = await this.getStudentInfo(studentId);
    if (!student?.batchId) {
      return [];
    }

    // 1. Supabase Fetch
    try {
      const { data: assignments, error } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('batch_id', student.batchId)
        .order('created_at', { ascending: false });

      if (!error && assignments && assignments.length > 0) {
        const { data: submissions } = await supabase
          .from('homework_submissions')
          .select('*')
          .eq('student_id', student.id);

        const subMap = new Map((submissions || []).map((s) => [s.homework_id, s]));

        const items: StudentHomeworkItemView[] = assignments.map((h) => {
          const sub = subMap.get(h.id);
          const status = (sub?.status as HomeworkStatus) || 'pending';
          return {
            id: h.id,
            batchId: h.batch_id,
            batchName: 'My Batch',
            subject: 'Homework',
            title: h.title,
            description: h.description || undefined,
            dueDate: h.due_date,
            isUrgent: false,
            isDueToday: h.due_date === new Date().toISOString().split('T')[0],
            status,
            remarks: sub?.remarks || undefined,
          };
        });

        if (filter === 'pending') {
          return items.filter((h) => h.status !== 'done');
        }
        if (filter === 'completed') {
          return items.filter((h) => h.status === 'done');
        }
        return items;
      }
    } catch (e) {
      console.warn('Student getHomeworkList Supabase error:', e);
    }

    // 2. Local Storage Fallback
    try {
      const localHwRaw = await AsyncStorage.getItem('@eduflow_teacher_homework');
      if (localHwRaw) {
        const localHw = JSON.parse(localHwRaw);
        const batchHw = (Array.isArray(localHw) ? localHw : []).filter(
          (h: any) => h.batchId === student.batchId
        );

        const items: StudentHomeworkItemView[] = batchHw.map((h: any) => ({
          id: h.id,
          batchId: h.batchId,
          batchName: 'My Batch',
          subject: 'Homework',
          title: h.title,
          description: h.description || undefined,
          dueDate: h.dueDate,
          isUrgent: false,
          isDueToday: h.dueDate === new Date().toISOString().split('T')[0],
          status: 'pending',
        }));

        if (filter === 'pending') return items.filter((h) => h.status !== 'done');
        if (filter === 'completed') return items.filter((h) => h.status === 'done');
        return items;
      }
    } catch (localErr) {
      console.warn('Local homework fallback error:', localErr);
    }

    return [];
  }

  /**
   * Toggle student's homework completion status
   */
  static async updateHomeworkStatus(
    homeworkId: string,
    newStatus: HomeworkStatus,
    studentId?: string
  ): Promise<StudentHomeworkItemView | null> {
    const student = await this.getStudentInfo(studentId);
    if (!student) return null;

    try {
      await supabase.from('homework_submissions').upsert({
        homework_id: homeworkId,
        student_id: student.id,
        status: newStatus,
      }, { onConflict: 'homework_id,student_id' });
    } catch (e) {
      console.warn('updateHomeworkStatus error:', e);
    }

    const list = await this.getHomeworkList(student.id);
    return list.find((h) => h.id === homeworkId) || null;
  }

  /**
   * Get test history and scorecards
   */
  static async getTestResults(studentId?: string): Promise<StudentTestResultView[]> {
    const student = await this.getStudentInfo(studentId);
    if (!student?.batchId) {
      return [];
    }

    // 1. Supabase Fetch
    try {
      const { data: tests, error } = await supabase
        .from('tests')
        .select('*')
        .eq('batch_id', student.batchId)
        .order('date', { ascending: false });

      if (!error && tests && tests.length > 0) {
        const { data: marks } = await supabase
          .from('test_marks')
          .select('*')
          .eq('student_id', student.id);

        const markMap = new Map((marks || []).map((m) => [m.test_id, m.marks_obtained]));

        return tests.map((t) => {
          const maxMarks = Number(t.max_marks) || 50;
          const markVal = markMap.get(t.id);
          const marksObtained = markVal !== undefined && markVal !== null ? Number(markVal) : 0;
          const percentage = maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0;
          
          let gradeBadge = 'Average';
          if (percentage >= 90) gradeBadge = 'A+';
          else if (percentage >= 80) gradeBadge = 'A';
          else if (percentage >= 70) gradeBadge = 'B';
          else if (percentage >= 60) gradeBadge = 'C';
          else gradeBadge = 'Needs Attention';

          return {
            id: t.id,
            title: t.title,
            subject: 'Test',
            date: t.date,
            maxMarks,
            marksObtained,
            percentage,
            gradeBadge,
            classAverage: maxMarks * 0.7,
            highestMarks: maxMarks,
            rankInBatch: 1,
            totalStudents: 1,
          };
        });
      }
    } catch (e) {
      console.warn('Student getTestResults Supabase error:', e);
    }

    // 2. Local Storage Fallback
    try {
      const localTestsRaw = await AsyncStorage.getItem('@eduflow_teacher_tests');
      if (localTestsRaw) {
        const localTests = JSON.parse(localTestsRaw);
        const batchTests = (Array.isArray(localTests) ? localTests : []).filter(
          (t: any) => t.batchId === student.batchId
        );

        return batchTests.map((t: any) => {
          const maxMarks = Number(t.maxMarks) || 50;
          return {
            id: t.id,
            title: t.title,
            subject: 'Test',
            date: t.date,
            maxMarks,
            marksObtained: 0,
            percentage: 0,
            gradeBadge: 'Pending Marks',
            classAverage: maxMarks * 0.7,
            highestMarks: maxMarks,
            rankInBatch: 1,
            totalStudents: 1,
          };
        });
      }
    } catch (localTestErr) {
      console.warn('Local tests fallback error:', localTestErr);
    }

    return [];
  }

  /**
   * Get attendance calendar and percentage summary
   */
  static async getAttendanceOverview(studentId?: string): Promise<StudentAttendanceOverview> {
    const student = await this.getStudentInfo(studentId);
    if (!student?.id) {
      return {
        overallPercentage: 0,
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        streakDays: 0,
        currentMonthDays: [],
      };
    }

    // 1. Supabase Fetch
    try {
      const { data: items, error } = await supabase
        .from('attendance_items')
        .select('*, attendance_records(date, batch_id)')
        .eq('student_id', student.id);

      if (!error && items && items.length > 0) {
        const total = items.length;
        const present = items.filter((i) => i.status === 'present').length;
        const absent = total - present;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        const days = items.map((i: any) => ({
          date: i.attendance_records?.date || '',
          dayName: i.attendance_records?.date ? new Date(i.attendance_records.date).toLocaleDateString('en-US', { weekday: 'short' }) : '',
          status: i.status as 'present' | 'absent',
          batchName: 'My Batch',
        }));

        return {
          overallPercentage: percentage,
          totalClasses: total,
          presentCount: present,
          absentCount: absent,
          streakDays: present,
          currentMonthDays: days,
        };
      }
    } catch (e) {
      console.warn('Student getAttendanceOverview Supabase error:', e);
    }

    // 2. Local Storage Fallback
    try {
      const localAttRaw = await AsyncStorage.getItem('@eduflow_teacher_attendance');
      if (localAttRaw) {
        const localRecords = JSON.parse(localAttRaw);
        if (Array.isArray(localRecords)) {
          const studentRecords: any[] = [];
          for (const rec of localRecords) {
            if (rec.batchId === student.batchId && Array.isArray(rec.items)) {
              const myItem = rec.items.find((it: any) => it.studentId === student.id);
              if (myItem) {
                studentRecords.push({
                  date: rec.date,
                  dayName: new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' }),
                  status: myItem.status,
                  batchName: 'My Batch',
                });
              }
            }
          }

          if (studentRecords.length > 0) {
            const total = studentRecords.length;
            const present = studentRecords.filter((r) => r.status === 'present').length;
            const absent = total - present;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            return {
              overallPercentage: percentage,
              totalClasses: total,
              presentCount: present,
              absentCount: absent,
              streakDays: present,
              currentMonthDays: studentRecords,
            };
          }
        }
      }
    } catch (localAttErr) {
      console.warn('Local attendance fallback error:', localAttErr);
    }

    return {
      overallPercentage: 0,
      totalClasses: 0,
      presentCount: 0,
      absentCount: 0,
      streakDays: 0,
      currentMonthDays: [],
    };
  }
}
