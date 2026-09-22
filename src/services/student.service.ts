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

const STUDENT_DATA_STORAGE_KEY = '@eduflow_student_storage_v1';

// Default mock student data linked to Class 10 - Alpha (Aarav Sharma)
const DEFAULT_ENROLLED_BATCH: EnrolledBatchInfo = {
  id: 'batch-math-10',
  name: 'Class 10 - Alpha',
  grade: 'Class 10',
  subject: 'Mathematics',
  schedule: 'Mon • Wed • Fri',
  timing: '10:00 AM - 11:30 AM',
  room: 'Room 204',
  teacherName: 'Prof. Rajesh Sharma',
  teacherPhone: '+91 98765 00123',
  teacherEmail: 'rajesh.sharma@eduflow.app',
  instituteName: 'Zenith Academy',
};

const DEFAULT_ANNOUNCEMENTS: StudentAnnouncement[] = [
  {
    id: 'anc-01',
    title: 'Upcoming Mock Board Exam',
    message: 'Chapter 4 & 5 Quadratic equations and Arithmetic Progressions test on this Friday at 10:00 AM sharp.',
    date: 'Today, 08:30 AM',
    tag: 'test',
    author: 'Prof. Rajesh Sharma',
  },
  {
    id: 'anc-02',
    title: 'Formula Sheet Uploaded',
    message: 'Please review the Chapter 4 summary formula cheat sheet before the doubt clearing session tomorrow.',
    date: 'Yesterday',
    tag: 'info',
    author: 'Zenith Academy',
  },
];

const DEFAULT_HOMEWORK: StudentHomeworkItemView[] = [
  {
    id: 'hw-01',
    batchId: 'batch-math-10',
    batchName: 'Class 10 - Alpha',
    subject: 'Mathematics',
    title: 'Quadratic Equations Exercise 4.2',
    description: 'Solve Questions 1 to 15 in homework notebook with step-by-step discriminant calculations and roots verification.',
    dueDate: 'Tomorrow, 05:00 PM',
    isUrgent: true,
    isDueToday: false,
    status: 'pending',
    totalQuestions: 15,
  },
  {
    id: 'hw-02',
    batchId: 'batch-math-10',
    batchName: 'Class 10 - Alpha',
    subject: 'Mathematics',
    title: 'Word Problems on Quadratic Roots',
    description: 'Complete word problems from NCERT exemplar Page 88, questions 7 through 12.',
    dueDate: 'Friday, 10:00 AM',
    isUrgent: false,
    isDueToday: false,
    status: 'pending',
    totalQuestions: 6,
  },
  {
    id: 'hw-03',
    batchId: 'batch-math-10',
    batchName: 'Class 10 - Alpha',
    subject: 'Mathematics',
    title: 'Polynomial Factorization Review',
    description: 'Splitting the middle term practice sheet 3.',
    dueDate: 'Last Monday',
    isUrgent: false,
    isDueToday: false,
    status: 'done',
    remarks: 'Well done! All 10 solutions verified accurate.',
    submittedAt: '2 days ago',
    totalQuestions: 10,
  },
  {
    id: 'hw-04',
    batchId: 'batch-math-10',
    batchName: 'Class 10 - Alpha',
    subject: 'Mathematics',
    title: 'Linear Equations in Two Variables',
    description: 'Cross multiplication method exercises 3.5.',
    dueDate: 'Last Week',
    isUrgent: false,
    isDueToday: false,
    status: 'done',
    remarks: 'Neat work shown.',
    submittedAt: '5 days ago',
    totalQuestions: 8,
  },
];

const DEFAULT_TESTS: StudentTestResultView[] = [
  {
    id: 'test-01',
    title: 'Unit Test 1: Real Numbers & Polynomials',
    subject: 'Mathematics',
    date: '15 Sep 2026',
    maxMarks: 50,
    marksObtained: 46,
    percentage: 92,
    gradeBadge: 'A+',
    classAverage: 37.4,
    highestMarks: 49,
    rankInBatch: 3,
    totalStudents: 32,
  },
  {
    id: 'test-02',
    title: 'Weekly Revision Test: Linear Equations',
    subject: 'Mathematics',
    date: '02 Sep 2026',
    maxMarks: 25,
    marksObtained: 23,
    percentage: 92,
    gradeBadge: 'A+',
    classAverage: 18.5,
    highestMarks: 25,
    rankInBatch: 2,
    totalStudents: 32,
  },
  {
    id: 'test-03',
    title: 'Monthly Assessment: Algebra Foundations',
    subject: 'Mathematics',
    date: '20 Aug 2026',
    maxMarks: 50,
    marksObtained: 42.5,
    percentage: 85,
    gradeBadge: 'A',
    classAverage: 34.0,
    highestMarks: 48,
    rankInBatch: 5,
    totalStudents: 32,
  },
  {
    id: 'test-04',
    title: 'Diagnostic Benchmark Test',
    subject: 'Mathematics',
    date: '05 Aug 2026',
    maxMarks: 40,
    marksObtained: 35,
    percentage: 87.5,
    gradeBadge: 'A',
    classAverage: 28.2,
    highestMarks: 39,
    rankInBatch: 4,
    totalStudents: 32,
  },
];

const DEFAULT_ATTENDANCE_DAYS = [
  { date: '2026-09-22', dayName: 'Tue', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-20', dayName: 'Sun', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-18', dayName: 'Fri', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-16', dayName: 'Wed', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-14', dayName: 'Mon', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-11', dayName: 'Fri', status: 'absent' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-09', dayName: 'Wed', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-07', dayName: 'Mon', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-04', dayName: 'Fri', status: 'present' as const, batchName: 'Class 10 - Alpha' },
  { date: '2026-09-02', dayName: 'Wed', status: 'present' as const, batchName: 'Class 10 - Alpha' },
];

export class StudentService {
  private static async getCustomHomeworkMap(): Promise<Record<string, HomeworkStatus>> {
    try {
      const raw = await AsyncStorage.getItem(`${STUDENT_DATA_STORAGE_KEY}_hw_status`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static async saveCustomHomeworkMap(map: Record<string, HomeworkStatus>): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STUDENT_DATA_STORAGE_KEY}_hw_status`, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  /**
   * Get main student dashboard aggregated metrics and schedule
   */
  static async getDashboardSummary(studentId: string = 'st-01'): Promise<StudentDashboardSummary> {
    const hwList = await this.getHomeworkList(studentId);
    const pendingHw = hwList.filter((h) => h.status !== 'done').length;
    const completedHw = hwList.filter((h) => h.status === 'done').length;

    const tests = await this.getTestResults(studentId);
    const avgTestPct = tests.length > 0
      ? Math.round(tests.reduce((acc, t) => acc + (t.percentage || 0), 0) / tests.length)
      : 89;

    const todayClasses: StudentTodayClass[] = [
      {
        id: 'cls-01',
        batchName: 'Class 10 - Alpha',
        subject: 'Mathematics',
        timing: '10:00 AM - 11:30 AM',
        room: 'Room 204',
        status: 'upcoming',
        teacherName: 'Prof. Rajesh Sharma',
      },
      {
        id: 'cls-02',
        batchName: 'Class 10 - Science Lab',
        subject: 'Physics & Chemistry',
        timing: '04:00 PM - 05:30 PM',
        room: 'Lab 2',
        status: 'upcoming',
        teacherName: 'Dr. Meera Iyer',
      },
    ];

    return {
      studentId: studentId || 'st-01',
      studentName: 'Aarav Sharma',
      rollNumber: '1001',
      avatarUrl: undefined,
      enrolledBatch: DEFAULT_ENROLLED_BATCH,
      nextClass: todayClasses[0],
      todayClasses,
      stats: {
        attendancePercentage: 91,
        totalClasses: 22,
        presentClasses: 20,
        pendingHomeworkCount: pendingHw,
        completedHomeworkCount: completedHw,
        averageTestPercentage: avgTestPct,
        testsTaken: tests.length,
        classRank: 3,
        totalStudentsInBatch: 32,
      },
      recentAnnouncements: DEFAULT_ANNOUNCEMENTS,
    };
  }

  /**
   * Get all homework items for the student with live status overrides
   */
  static async getHomeworkList(
    studentId: string = 'st-01',
    filter?: 'pending' | 'completed' | 'all'
  ): Promise<StudentHomeworkItemView[]> {
    const overrides = await this.getCustomHomeworkMap();

    const items = DEFAULT_HOMEWORK.map((hw) => {
      const currentStatus = overrides[hw.id] || hw.status;
      return {
        ...hw,
        status: currentStatus,
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

  /**
   * Toggle student's homework completion status
   */
  static async updateHomeworkStatus(
    homeworkId: string,
    newStatus: HomeworkStatus
  ): Promise<StudentHomeworkItemView> {
    const overrides = await this.getCustomHomeworkMap();
    overrides[homeworkId] = newStatus;
    await this.saveCustomHomeworkMap(overrides);

    const hw = DEFAULT_HOMEWORK.find((h) => h.id === homeworkId) || DEFAULT_HOMEWORK[0];
    return {
      ...hw,
      status: newStatus,
      submittedAt: newStatus === 'done' ? 'Just now' : undefined,
    };
  }

  /**
   * Get test history and scorecards
   */
  static async getTestResults(studentId: string = 'st-01'): Promise<StudentTestResultView[]> {
    return DEFAULT_TESTS;
  }

  /**
   * Get attendance calendar and percentage summary
   */
  static async getAttendanceOverview(studentId: string = 'st-01'): Promise<StudentAttendanceOverview> {
    const total = DEFAULT_ATTENDANCE_DAYS.length;
    const present = DEFAULT_ATTENDANCE_DAYS.filter((d) => d.status === 'present').length;
    const absent = total - present;
    const percentage = Math.round((present / total) * 100);

    return {
      overallPercentage: percentage,
      totalClasses: total,
      presentCount: present,
      absentCount: absent,
      streakDays: 5,
      currentMonthDays: DEFAULT_ATTENDANCE_DAYS,
    };
  }
}
