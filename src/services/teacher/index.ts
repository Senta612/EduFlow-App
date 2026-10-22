export { STORAGE_KEYS, getStored, setStored } from './storage.keys';
export {
  BatchesService,
  batchesService,
  isBatchScheduledToday,
  isBatchScheduledOnDate,
} from './batches.service';
export type { BatchListener } from './batches.service';
export { StudentsService, studentsService } from './students.service';
export { AttendanceService, attendanceService } from './attendance.service';
export { HomeworkService, homeworkService } from './homework.service';
export { TestsService, testsService } from './tests.service';
export { AnalyticsService, analyticsService } from './analytics.service';
export { TasksService, tasksService } from './tasks.service';
export { MaterialsService, materialsService, detectFileType } from './materials.service';
export { FeesService, feesService } from './fees.service';
export { TimetableService, timetableService, DAYS_OF_WEEK } from './timetable.service';
export type { DayOfWeek, TimetableSlot, DaySchedule, WeeklyTimetableOverview } from './timetable.service';
export {
  formatStudentProgressWhatsAppMessage,
  formatDefaulterWhatsAppMessage,
  formatTopperWhatsAppMessage,
} from './whatsapp.formatters';

