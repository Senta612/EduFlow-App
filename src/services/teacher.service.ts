/**
 * TeacherService Facade
 * 
 * Provides a unified, backward-compatible API for all teacher operations by delegating
 * to domain-specific services in `./teacher/`.
 */

import {
  Batch,
  Student,
  StudentAttendanceItem,
  AttendanceRecord,
  Homework,
  StudentHomeworkItem,
  Test,
  StudentMark,
  TeacherTask,
  StudentProfileData,
  TuitionAnalyticsSummary,
} from '@/types/teacher';

import {
  batchesService,
  studentsService,
  attendanceService,
  homeworkService,
  testsService,
  analyticsService,
  tasksService,
  BatchListener,
  isBatchScheduledToday,
  isBatchScheduledOnDate,
  formatStudentProgressWhatsAppMessage,
  formatDefaulterWhatsAppMessage,
  formatTopperWhatsAppMessage,
} from './teacher';

export {
  isBatchScheduledToday,
  isBatchScheduledOnDate,
  formatStudentProgressWhatsAppMessage,
  formatDefaulterWhatsAppMessage,
  formatTopperWhatsAppMessage,
};

export type { BatchListener };

export class TeacherService {
  // 1. Batches Management
  async getBatches(): Promise<Batch[]> {
    return batchesService.getBatches();
  }

  async getTodayClasses(): Promise<Batch[]> {
    return batchesService.getTodayClasses();
  }

  async getClassesForDate(
    dateStr: string,
  ): Promise<(Batch & { attendanceTakenForDate: boolean; attendanceRecord?: AttendanceRecord })[]> {
    return batchesService.getClassesForDate(dateStr);
  }

  async getBatchById(batchId: string): Promise<Batch | null> {
    return batchesService.getBatchById(batchId);
  }

  async createBatch(
    data: Omit<Batch, 'id' | 'studentCount' | 'attendanceTakenToday'>,
  ): Promise<Batch> {
    return batchesService.createBatch(data);
  }

  async deleteBatch(batchId: string): Promise<void> {
    return batchesService.deleteBatch(batchId);
  }

  subscribeBatches(listener: BatchListener): () => void {
    return batchesService.subscribeBatches(listener);
  }

  // 2. Students Management
  async getAllStudents(): Promise<Record<string, Student[]>> {
    return studentsService.getAllStudents();
  }

  async getBatchStudents(batchId: string): Promise<Student[]> {
    return studentsService.getBatchStudents(batchId);
  }

  async addStudent(batchId: string, studentData: Omit<Student, 'id'>): Promise<Student> {
    return studentsService.addStudent(batchId, studentData);
  }

  async updateStudent(
    batchId: string,
    studentId: string,
    studentData: Partial<Omit<Student, 'id'>>,
  ): Promise<Student> {
    return studentsService.updateStudent(batchId, studentId, studentData);
  }

  async deleteStudent(batchId: string, studentId: string): Promise<void> {
    return studentsService.deleteStudent(batchId, studentId);
  }

  // 3. Attendance Management
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return attendanceService.getAttendanceRecords();
  }

  async getBatchAttendanceHistory(batchId: string): Promise<AttendanceRecord[]> {
    return attendanceService.getBatchAttendanceHistory(batchId);
  }

  async isAttendanceTakenToday(batchId: string): Promise<boolean> {
    return attendanceService.isAttendanceTakenToday(batchId);
  }

  async submitAttendance(
    batchId: string,
    date: string,
    records: StudentAttendanceItem[],
  ): Promise<AttendanceRecord> {
    return attendanceService.submitAttendance(batchId, date, records);
  }

  // 4. Homework Management
  async getHomeworkList(): Promise<Homework[]> {
    return homeworkService.getHomeworkList();
  }

  async getBatchHomework(batchId: string): Promise<Homework[]> {
    return homeworkService.getBatchHomework(batchId);
  }

  async getHomeworkById(homeworkId: string): Promise<Homework | null> {
    return homeworkService.getHomeworkById(homeworkId);
  }

  async createHomework(
    data: Omit<Homework, 'id' | 'createdAt' | 'submissionsCount'>,
  ): Promise<Homework> {
    return homeworkService.createHomework(data);
  }

  async deleteHomework(homeworkId: string): Promise<void> {
    return homeworkService.deleteHomework(homeworkId);
  }

  async getHomeworkSubmissions(
    homeworkId: string,
    batchId: string,
  ): Promise<StudentHomeworkItem[]> {
    return homeworkService.getHomeworkSubmissions(homeworkId, batchId);
  }

  async saveHomeworkSubmissions(
    homeworkId: string,
    batchId: string,
    submissions: StudentHomeworkItem[],
  ): Promise<void> {
    return homeworkService.saveHomeworkSubmissions(homeworkId, batchId, submissions);
  }

  // 5. Tests & Marks Management
  async getTestsList(): Promise<Test[]> {
    return testsService.getTestsList();
  }

  async getBatchTests(batchId: string): Promise<Test[]> {
    return testsService.getBatchTests(batchId);
  }

  async getTestById(testId: string): Promise<Test | null> {
    return testsService.getTestById(testId);
  }

  async createTest(data: Omit<Test, 'id' | 'submittedCount'>): Promise<Test> {
    return testsService.createTest(data);
  }

  async deleteTest(testId: string): Promise<void> {
    return testsService.deleteTest(testId);
  }

  async getTestMarks(testId: string, batchId: string): Promise<StudentMark[]> {
    return testsService.getTestMarks(testId, batchId);
  }

  async saveTestMarks(testId: string, marks: StudentMark[]): Promise<void> {
    return testsService.saveTestMarks(testId, marks);
  }

  // 6. Analytics & Student Profile Reports
  async getStudentProfileData(
    batchId: string,
    studentId: string,
  ): Promise<StudentProfileData | null> {
    return analyticsService.getStudentProfileData(batchId, studentId);
  }

  async getTuitionAnalytics(selectedBatchId?: string): Promise<TuitionAnalyticsSummary> {
    return analyticsService.getTuitionAnalytics(selectedBatchId);
  }

  // 7. Pending Tasks
  async getPendingTasks(): Promise<TeacherTask[]> {
    return tasksService.getPendingTasks();
  }
}

export const teacherService = new TeacherService();
