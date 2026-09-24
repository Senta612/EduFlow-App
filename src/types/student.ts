import { AttendanceStatus, HomeworkStatus } from './teacher';

export interface EnrolledBatchInfo {
  id: string;
  name: string;
  grade: string;
  subject: string;
  schedule: string;
  timing: string;
  room?: string;
  teacherName?: string;
  teacherPhone?: string;
  teacherEmail?: string;
  instituteName?: string;
}

export interface StudentTodayClass {
  id: string;
  batchName: string;
  subject: string;
  timing: string;
  room?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  teacherName?: string;
}

export interface StudentDashboardSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  avatarUrl?: string;
  enrolledBatch: EnrolledBatchInfo;
  nextClass?: StudentTodayClass;
  todayClasses: StudentTodayClass[];
  stats: {
    attendancePercentage: number;
    totalClasses: number;
    presentClasses: number;
    pendingHomeworkCount: number;
    completedHomeworkCount: number;
    averageTestPercentage: number;
    testsTaken: number;
    classRank?: number;
    totalStudentsInBatch: number;
  };
  recentAnnouncements: StudentAnnouncement[];
}

export interface StudentAnnouncement {
  id: string;
  title: string;
  message: string;
  date: string;
  tag: 'urgent' | 'info' | 'test' | 'holiday';
  author: string;
}

export interface StudentHomeworkItemView {
  id: string;
  batchId: string;
  batchName: string;
  subject: string;
  title: string;
  description?: string;
  dueDate: string;
  isUrgent?: boolean;
  isDueToday?: boolean;
  status: HomeworkStatus;
  remarks?: string;
  submittedAt?: string;
  totalQuestions?: number;
}

export interface StudentTestResultView {
  id: string;
  title: string;
  subject: string;
  date: string;
  maxMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  gradeBadge: string;
  classAverage: number;
  highestMarks: number;
  rankInBatch?: number;
  totalStudents: number;
}

export interface StudentAttendanceDayRecord {
  date: string;
  dayName: string;
  status: AttendanceStatus;
  batchName: string;
}

export interface StudentAttendanceOverview {
  overallPercentage: number;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  streakDays: number;
  currentMonthDays: StudentAttendanceDayRecord[];
}
