import { TeacherTask } from '@/types/teacher';
import { batchesService } from './batches.service';
import { homeworkService } from './homework.service';
import { testsService } from './tests.service';

export class TasksService {
  async getPendingTasks(): Promise<TeacherTask[]> {
    const batches = await batchesService.getBatches();
    const tasks: TeacherTask[] = [];

    // 1. Pending attendance tasks
    for (const batch of batches) {
      if (!batch.attendanceTakenToday && (batch.studentCount ?? 0) > 0) {
        tasks.push({
          id: `task-att-${batch.id}`,
          title: 'Mark Today Attendance',
          subtitle: `${batch.grade} ${batch.subject} • ${batch.timing}`,
          type: 'attendance',
          batchId: batch.id,
          batchName: batch.name,
          dueDate: 'Today',
          status: 'pending',
          studentCount: batch.studentCount,
          progressText: `${batch.studentCount} students pending`,
          route: `/(teacher)/attendance/${batch.id}`,
        });
      }
    }

    // 2. Homework Review tasks
    const homework = await homeworkService.getHomeworkList();
    for (const hw of homework) {
      const isCompleted =
        (hw.submissionsCount ?? 0) >= (hw.totalStudents ?? 0) && (hw.totalStudents ?? 0) > 0;
      tasks.push({
        id: `task-hw-${hw.id}`,
        title: `Review Homework: ${hw.title}`,
        subtitle: `${hw.batchName} • Due: ${hw.dueDate}`,
        type: 'homework',
        batchId: hw.batchId,
        batchName: hw.batchName,
        dueDate: hw.dueDate,
        status: isCompleted
          ? 'completed'
          : (hw.submissionsCount ?? 0) > 0
          ? 'in_progress'
          : 'pending',
        studentCount: hw.totalStudents,
        progressText: `${hw.submissionsCount || 0}/${hw.totalStudents || 0} submitted`,
        route: `/(teacher)/homework/${hw.id}/submissions`,
      });
    }

    // 3. Test Marks entry tasks
    const tests = await testsService.getTestsList();
    for (const test of tests) {
      if (test.submittedCount < test.totalStudents && test.totalStudents > 0) {
        tasks.push({
          id: `task-test-${test.id}`,
          title: `Enter Marks: ${test.title}`,
          subtitle: `${test.batchName} • Max ${test.maxMarks} marks`,
          type: 'marks',
          batchId: test.batchId,
          batchName: test.batchName,
          dueDate: test.date,
          status: test.submittedCount === 0 ? 'pending' : 'in_progress',
          studentCount: test.totalStudents,
          progressText: `${test.submittedCount}/${test.totalStudents} marks entered`,
          route: `/(teacher)/tests/${test.id}/marks`,
        });
      }
    }

    return tasks;
  }
}

export const tasksService = new TasksService();
