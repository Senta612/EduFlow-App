export interface Batch {
  id: string;
  name: string;
  grade: string;
  subject: string;
  studentCount: number;
  schedule: string;
  timing: string;
  room?: string;
  attendanceTakenToday?: boolean;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  parentPhone?: string;
  avatarUrl?: string;
}

export type AttendanceStatus = 'present' | 'absent';

export interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  date: string;
  records: StudentAttendanceItem[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  submittedAt: string;
}

export type HomeworkStatus = 'done' | 'half_done' | 'not_done';

export interface StudentHomeworkItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: HomeworkStatus;
  remarks?: string;
}

export interface Homework {
  id: string;
  batchId: string;
  batchName: string;
  title: string;
  description?: string;
  dueDate: string;
  createdAt: string;
  submissionsCount: number;
  totalStudents: number;
  doneCount?: number;
  halfDoneCount?: number;
  notDoneCount?: number;
}

export interface Test {
  id: string;
  batchId: string;
  batchName: string;
  title: string;
  date: string;
  maxMarks: number;
  submittedCount: number;
  totalStudents: number;
}

export interface StudentMark {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number | null;
}

export type TaskType = 'attendance' | 'homework' | 'marks';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface TeacherTask {
  id: string;
  title: string;
  subtitle: string;
  type: TaskType;
  batchId: string;
  batchName: string;
  dueDate: string;
  status: TaskStatus;
  studentCount: number;
  progressText?: string;
  route: string;
}

export interface StudentAttendanceHistoryItem {
  id: string;
  date: string;
  status: AttendanceStatus;
  submittedAt: string;
}

export interface StudentHomeworkReportItem {
  homeworkId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: HomeworkStatus;
  remarks?: string;
}

export interface StudentTestReportItem {
  testId: string;
  title: string;
  date: string;
  maxMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  gradeBadge: string;
}

export interface StudentProfileData {
  student: Student;
  batch: Batch;
  attendance: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    history: StudentAttendanceHistoryItem[];
  };
  homework: {
    totalAssigned: number;
    doneCount: number;
    halfDoneCount: number;
    notDoneCount: number;
    completionPercentage: number;
    items: StudentHomeworkReportItem[];
  };
  tests: {
    totalTests: number;
    testsAttempted: number;
    totalMarksScored: number;
    totalMaxMarks: number;
    averagePercentage: number;
    gradeLetter: string;
    items: StudentTestReportItem[];
  };
}

