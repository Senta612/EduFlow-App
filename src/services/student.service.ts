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
} from '@/types/student';
import { HomeworkStatus } from '@/types/teacher';
import { isBatchScheduledToday } from './teacher.service';

const STUDENT_DATA_STORAGE_KEY = '@eduflow_student_storage_v1';

export class StudentService {
  private static async getStudentInfo(studentId?: string): Promise<{
    id: string;
    name: string;
    rollNumber: string;
    batchId?: string;
    email?: string;
    parentPhone?: string;
  } | null> {
    try {
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

    try {
      const { data: assignments, error } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('batch_id', student.batchId)
        .order('created_at', { ascending: false });

      if (!error && assignments) {
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
      console.warn('Student getHomeworkList error:', e);
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

    try {
      const { data: tests, error } = await supabase
        .from('tests')
        .select('*')
        .eq('batch_id', student.batchId)
        .order('date', { ascending: false });

      if (!error && tests) {
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
      console.warn('Student getTestResults error:', e);
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
      console.warn('Student getAttendanceOverview error:', e);
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
