import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Batch,
  Student,
  StudentAttendanceItem,
  AttendanceRecord,
  Homework,
  Test,
  StudentMark,
  TeacherTask,
} from '@/types/teacher';

// Initial baseline teaching data
const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch-math-10',
    name: 'Class 10 - Alpha',
    grade: 'Class 10',
    subject: 'Mathematics',
    studentCount: 32,
    schedule: 'Mon • Wed • Fri',
    timing: '10:00 AM - 11:30 AM',
    room: 'Room 204',
    attendanceTakenToday: false,
  },
  {
    id: 'batch-phy-12',
    name: 'Class 12 - Advanced',
    grade: 'Class 12',
    subject: 'Physics',
    studentCount: 25,
    schedule: 'Tue • Thu • Sat',
    timing: '12:30 PM - 02:00 PM',
    room: 'Lab 2',
    attendanceTakenToday: false,
  },
  {
    id: 'batch-chem-11',
    name: 'Class 11 - Prime',
    grade: 'Class 11',
    subject: 'Chemistry',
    studentCount: 28,
    schedule: 'Mon • Wed • Fri',
    timing: '03:00 PM - 04:30 PM',
    room: 'Room 105',
    attendanceTakenToday: true,
  },
];

const INITIAL_STUDENTS: Record<string, Student[]> = {
  'batch-math-10': [
    { id: 'st-01', name: 'Aarav Sharma', rollNumber: '1001', email: 'aarav.s@eduflow.app', parentPhone: '+91 98765 43210' },
    { id: 'st-02', name: 'Ananya Verma', rollNumber: '1002', email: 'ananya.v@eduflow.app', parentPhone: '+91 98765 43211' },
    { id: 'st-03', name: 'Dhruv Patel', rollNumber: '1003', email: 'dhruv.p@eduflow.app', parentPhone: '+91 98765 43212' },
    { id: 'st-04', name: 'Diya Joshi', rollNumber: '1004', email: 'diya.j@eduflow.app', parentPhone: '+91 98765 43213' },
    { id: 'st-05', name: 'Ishaan Kumar', rollNumber: '1005', email: 'ishaan.k@eduflow.app', parentPhone: '+91 98765 43214' },
    { id: 'st-06', name: 'Kavya Nair', rollNumber: '1006', email: 'kavya.n@eduflow.app', parentPhone: '+91 98765 43215' },
    { id: 'st-07', name: 'Manav Gupta', rollNumber: '1007', email: 'manav.g@eduflow.app', parentPhone: '+91 98765 43216' },
    { id: 'st-08', name: 'Neha Reddy', rollNumber: '1008', email: 'neha.r@eduflow.app', parentPhone: '+91 98765 43217' },
    { id: 'st-09', name: 'Pranav Shah', rollNumber: '1009', email: 'pranav.s@eduflow.app', parentPhone: '+91 98765 43218' },
    { id: 'st-10', name: 'Rhea Mehta', rollNumber: '1010', email: 'rhea.m@eduflow.app', parentPhone: '+91 98765 43219' },
    { id: 'st-11', name: 'Rohan Deshmukh', rollNumber: '1011', email: 'rohan.d@eduflow.app', parentPhone: '+91 98765 43220' },
    { id: 'st-12', name: 'Sanya Malhotra', rollNumber: '1012', email: 'sanya.m@eduflow.app', parentPhone: '+91 98765 43221' },
  ],
  'batch-phy-12': [
    { id: 'st-21', name: 'Aditya Sen', rollNumber: '1201', email: 'aditya.s@eduflow.app', parentPhone: '+91 98765 43230' },
    { id: 'st-22', name: 'Bhavna Kulkarni', rollNumber: '1202', email: 'bhavna.k@eduflow.app', parentPhone: '+91 98765 43231' },
    { id: 'st-23', name: 'Chirag Sethi', rollNumber: '1203', email: 'chirag.s@eduflow.app', parentPhone: '+91 98765 43232' },
    { id: 'st-24', name: 'Deepika Rao', rollNumber: '1204', email: 'deepika.r@eduflow.app', parentPhone: '+91 98765 43233' },
    { id: 'st-25', name: 'Eklavya Singh', rollNumber: '1205', email: 'eklavya.s@eduflow.app', parentPhone: '+91 98765 43234' },
  ],
  'batch-chem-11': [
    { id: 'st-31', name: 'Farhan Akhtar', rollNumber: '1101', email: 'farhan.a@eduflow.app', parentPhone: '+91 98765 43240' },
    { id: 'st-32', name: 'Gauri Shinde', rollNumber: '1102', email: 'gauri.s@eduflow.app', parentPhone: '+91 98765 43241' },
    { id: 'st-33', name: 'Harsh Vardhan', rollNumber: '1103', email: 'harsh.v@eduflow.app', parentPhone: '+91 98765 43242' },
  ],
};

const INITIAL_HOMEWORK: Homework[] = [
  {
    id: 'hw-01',
    batchId: 'batch-math-10',
    batchName: 'Class 10 - Alpha',
    title: 'Quadratic Equations Exercise 4.2',
    description: 'Solve Questions 1 to 15 in homework notebook with step-by-step solutions.',
    dueDate: 'Tomorrow, 05:00 PM',
    createdAt: 'Yesterday',
    submissionsCount: 26,
    totalStudents: 32,
  },
  {
    id: 'hw-02',
    batchId: 'batch-phy-12',
    batchName: 'Class 12 - Advanced',
    title: "Electrostatics & Gauss's Law Problems",
    description: 'Complete numerical practice sheet 3. Derive electric field due to infinite sheet.',
    dueDate: 'Monday, 10:00 AM',
    createdAt: '2 days ago',
    submissionsCount: 18,
    totalStudents: 25,
  },
];

const INITIAL_TESTS: Test[] = [
  {
    id: 'test-01',
    batchId: 'batch-math-10',
    batchName: 'Class 10 - Alpha',
    title: 'Unit Test 2: Polynomials & Quadratics',
    date: '10 Sep 2026',
    maxMarks: 50,
    submittedCount: 32,
    totalStudents: 32,
  },
  {
    id: 'test-02',
    batchId: 'batch-phy-12',
    batchName: 'Class 12 - Advanced',
    title: 'Monthly Assessment: Electrostatics',
    date: '08 Sep 2026',
    maxMarks: 40,
    submittedCount: 15,
    totalStudents: 25,
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-chem-today',
    batchId: 'batch-chem-11',
    date: new Date().toISOString().split('T')[0],
    records: [
      { studentId: 'st-31', studentName: 'Farhan Akhtar', rollNumber: '1101', status: 'present' },
      { studentId: 'st-32', studentName: 'Gauri Shinde', rollNumber: '1102', status: 'present' },
      { studentId: 'st-33', studentName: 'Harsh Vardhan', rollNumber: '1103', status: 'absent' },
    ],
    totalStudents: 3,
    presentCount: 2,
    absentCount: 1,
    submittedAt: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  BATCHES: '@eduflow_teacher_batches',
  ATTENDANCE: '@eduflow_teacher_attendance',
  HOMEWORK: '@eduflow_teacher_homework',
  TESTS: '@eduflow_teacher_tests',
  MARKS: '@eduflow_teacher_marks',
  STUDENTS: '@eduflow_teacher_students',
};

type BatchListener = (batches: Batch[]) => void;
const batchListeners = new Set<BatchListener>();

export function isBatchScheduledToday(schedule: string): boolean {
  if (!schedule) return false;
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = daysMap[new Date().getDay()];
  return schedule.toLowerCase().includes(todayDay.toLowerCase());
}

class TeacherService {
  private async getStored<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async setStored<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('TeacherService storage write error:', e);
    }
  }

  // Batches
  async getBatches(): Promise<Batch[]> {
    const batches = await this.getStored<Batch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await this.getAttendanceRecords();
    const attendanceMap = new Set(
      attendance.filter((r) => r.date === todayStr).map((r) => r.batchId),
    );
    return batches.map((b) => ({
      ...b,
      attendanceTakenToday: attendanceMap.has(b.id) || Boolean(b.attendanceTakenToday),
    }));
  }

  async getTodayClasses(): Promise<Batch[]> {
    const batches = await this.getBatches();
    // Filter batches scheduled today, or return all if none match for testing
    const todayBatches = batches.filter((b) => isBatchScheduledToday(b.schedule));
    return todayBatches.length > 0 ? todayBatches : batches;
  }

  async getBatchById(batchId: string): Promise<Batch | null> {
    const batches = await this.getBatches();
    const batch = batches.find((b) => b.id === batchId) ?? null;
    if (!batch) return null;
    const takenToday = await this.isAttendanceTakenToday(batchId);
    return {
      ...batch,
      attendanceTakenToday: takenToday || Boolean(batch.attendanceTakenToday),
    };
  }

  async createBatch(
    data: Omit<Batch, 'id' | 'studentCount' | 'attendanceTakenToday'>,
  ): Promise<Batch> {
    const newBatch: Batch = {
      ...data,
      id: `batch-${Date.now()}`,
      studentCount: 0,
      attendanceTakenToday: false,
    };

    const batches = await this.getStored<Batch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const updated = [newBatch, ...batches];
    await this.setStored(STORAGE_KEYS.BATCHES, updated);

    // Notify listeners
    batchListeners.forEach((listener) => listener(updated));

    return newBatch;
  }

  subscribeBatches(listener: BatchListener): () => void {
    batchListeners.add(listener);
    return () => {
      batchListeners.delete(listener);
    };
  }

  // Students
  async getAllStudents(): Promise<Record<string, Student[]>> {
    const stored = await this.getStored<Record<string, Student[]> | null>(STORAGE_KEYS.STUDENTS, null);
    if (!stored) {
      await this.setStored(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      return { ...INITIAL_STUDENTS };
    }
    return stored;
  }

  async getBatchStudents(batchId: string): Promise<Student[]> {
    const allStudents = await this.getAllStudents();
    if (allStudents[batchId] && allStudents[batchId].length >= 0) {
      return allStudents[batchId];
    }
    const defaults = INITIAL_STUDENTS[batchId] ?? [
      { id: `st-${batchId}-1`, name: 'Aarav Kumar', rollNumber: '01', parentPhone: '+91 98765 43210' },
      { id: `st-${batchId}-2`, name: 'Bhavna Sharma', rollNumber: '02', parentPhone: '+91 98765 43211' },
      { id: `st-${batchId}-3`, name: 'Chetan Patel', rollNumber: '03', parentPhone: '+91 98765 43212' },
    ];
    allStudents[batchId] = defaults;
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);
    return defaults;
  }

  async addStudent(batchId: string, studentData: Omit<Student, 'id'>): Promise<Student> {
    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId];
    if (!batchStudents) {
      batchStudents = await this.getBatchStudents(batchId);
    }

    const newStudent: Student = {
      ...studentData,
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    const updatedBatchStudents = [...batchStudents, newStudent];
    allStudents[batchId] = updatedBatchStudents;
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);

    // Update batch studentCount
    const batches = await this.getBatches();
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        studentCount: updatedBatchStudents.length,
      };
      await this.setStored(STORAGE_KEYS.BATCHES, batches);
      batchListeners.forEach((listener) => listener(batches));
    }

    return newStudent;
  }

  async updateStudent(
    batchId: string,
    studentId: string,
    studentData: Partial<Omit<Student, 'id'>>,
  ): Promise<Student> {
    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId];
    if (!batchStudents) {
      batchStudents = await this.getBatchStudents(batchId);
    }

    const index = batchStudents.findIndex((s) => s.id === studentId);

    if (index === -1) {
      // Gracefully add if not existing
      const newStudent: Student = {
        id: studentId || `st-${Date.now()}`,
        name: studentData.name || 'Student',
        rollNumber: studentData.rollNumber || '01',
        parentPhone: studentData.parentPhone,
        email: studentData.email,
      };
      allStudents[batchId] = [...batchStudents, newStudent];
      await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);
      return newStudent;
    }

    const updatedStudent: Student = {
      ...batchStudents[index],
      ...studentData,
    };

    batchStudents[index] = updatedStudent;
    allStudents[batchId] = [...batchStudents];
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);

    return updatedStudent;
  }

  async deleteStudent(batchId: string, studentId: string): Promise<void> {
    const allStudents = await this.getAllStudents();
    let batchStudents = allStudents[batchId];
    if (!batchStudents) {
      batchStudents = await this.getBatchStudents(batchId);
    }

    const filtered = batchStudents.filter((s) => s.id !== studentId);
    allStudents[batchId] = filtered;
    await this.setStored(STORAGE_KEYS.STUDENTS, allStudents);

    // Update batch studentCount
    const batches = await this.getBatches();
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex !== -1) {
      batches[batchIndex] = {
        ...batches[batchIndex],
        studentCount: filtered.length,
      };
      await this.setStored(STORAGE_KEYS.BATCHES, batches);
      batchListeners.forEach((listener) => listener(batches));
    }
  }

  // Attendance
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const stored = await this.getStored<AttendanceRecord[] | null>(STORAGE_KEYS.ATTENDANCE, null);
    if (!stored) {
      await this.setStored(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
      return [...INITIAL_ATTENDANCE];
    }
    return stored;
  }

  async getBatchAttendanceHistory(batchId: string): Promise<AttendanceRecord[]> {
    const all = await this.getAttendanceRecords();
    return all.filter((r) => r.batchId === batchId);
  }

  async isAttendanceTakenToday(batchId: string): Promise<boolean> {
    const todayStr = new Date().toISOString().split('T')[0];
    const all = await this.getAttendanceRecords();
    return all.some((r) => r.batchId === batchId && r.date === todayStr);
  }

  async submitAttendance(
    batchId: string,
    date: string,
    records: StudentAttendanceItem[],
  ): Promise<AttendanceRecord> {
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;

    const newRecord: AttendanceRecord = {
      id: `att-${batchId}-${Date.now()}`,
      batchId,
      date,
      records,
      totalStudents: records.length,
      presentCount,
      absentCount,
      submittedAt: new Date().toISOString(),
    };

    const all = await this.getAttendanceRecords();
    // Replace if already exists for this batch+date, or prepend
    const filtered = all.filter((r) => !(r.batchId === batchId && r.date === date));
    const updated = [newRecord, ...filtered];
    await this.setStored(STORAGE_KEYS.ATTENDANCE, updated);

    // Update batch flag and notify listeners
    const batches = await this.getBatches();
    const updatedBatches = batches.map((b) =>
      b.id === batchId ? { ...b, attendanceTakenToday: true } : b,
    );
    await this.setStored(STORAGE_KEYS.BATCHES, updatedBatches);
    batchListeners.forEach((listener) => listener(updatedBatches));

    return newRecord;
  }

  // Homework
  async getHomeworkList(): Promise<Homework[]> {
    return this.getStored<Homework[]>(STORAGE_KEYS.HOMEWORK, INITIAL_HOMEWORK);
  }

  async getBatchHomework(batchId: string): Promise<Homework[]> {
    const all = await this.getHomeworkList();
    return all.filter((h) => h.batchId === batchId);
  }

  async createHomework(
    data: Omit<Homework, 'id' | 'createdAt' | 'submissionsCount'>,
  ): Promise<Homework> {
    const newHw: Homework = {
      ...data,
      id: `hw-${Date.now()}`,
      createdAt: 'Just now',
      submissionsCount: 0,
    };
    const all = await this.getHomeworkList();
    const updated = [newHw, ...all];
    await this.setStored(STORAGE_KEYS.HOMEWORK, updated);
    return newHw;
  }

  // Tests & Marks
  async getTestsList(): Promise<Test[]> {
    return this.getStored<Test[]>(STORAGE_KEYS.TESTS, INITIAL_TESTS);
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
    const newTest: Test = {
      ...data,
      id: `test-${Date.now()}`,
      submittedCount: 0,
    };
    const all = await this.getTestsList();
    const updated = [newTest, ...all];
    await this.setStored(STORAGE_KEYS.TESTS, updated);
    return newTest;
  }

  async getTestMarks(testId: string, batchId: string): Promise<StudentMark[]> {
    const key = `${STORAGE_KEYS.MARKS}_${testId}`;
    const stored = await this.getStored<StudentMark[] | null>(key, null);
    if (stored) return stored;

    // Generate initial mark template from students
    const students = await this.getBatchStudents(batchId);
    return students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      marksObtained: null,
    }));
  }

  async saveTestMarks(testId: string, marks: StudentMark[]): Promise<void> {
    const key = `${STORAGE_KEYS.MARKS}_${testId}`;
    await this.setStored(key, marks);

    // Update submitted count on test
    const enteredCount = marks.filter((m) => m.marksObtained !== null).length;
    const tests = await this.getTestsList();
    const updatedTests = tests.map((t) =>
      t.id === testId ? { ...t, submittedCount: enteredCount } : t,
    );
    await this.setStored(STORAGE_KEYS.TESTS, updatedTests);
  }

  // Tasks Aggregator
  async getPendingTasks(): Promise<TeacherTask[]> {
    const batches = await this.getBatches();
    const tasks: TeacherTask[] = [];

    // 1. Pending attendance tasks
    for (const batch of batches) {
      if (!batch.attendanceTakenToday) {
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
    const homework = await this.getHomeworkList();
    for (const hw of homework) {
      if (hw.submissionsCount > 0) {
        tasks.push({
          id: `task-hw-${hw.id}`,
          title: `Review Homework: ${hw.title}`,
          subtitle: `${hw.batchName} • Due: ${hw.dueDate}`,
          type: 'homework',
          batchId: hw.batchId,
          batchName: hw.batchName,
          dueDate: hw.dueDate,
          status: 'in_progress',
          studentCount: hw.totalStudents,
          progressText: `${hw.submissionsCount}/${hw.totalStudents} submitted`,
          route: `/(teacher)/batch/${hw.batchId}`,
        });
      }
    }

    // 3. Test Marks entry tasks
    const tests = await this.getTestsList();
    for (const test of tests) {
      if (test.submittedCount < test.totalStudents) {
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

export const teacherService = new TeacherService();
