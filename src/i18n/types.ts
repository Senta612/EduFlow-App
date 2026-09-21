export type SupportedLanguage = 'en' | 'hi' | 'gu';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface TranslationDictionary {
  common: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    loading: string;
    search: string;
    all: string;
    present: string;
    absent: string;
    done: string;
    pending: string;
    share: string;
    call: string;
    whatsapp: string;
    view: string;
    retry: string;
    submit: string;
    back: string;
    close: string;
    filter: string;
    active: string;
    success: string;
    failed: string;
    students: string;
    batch: string;
    batches: string;
    date: string;
    marks: string;
    rank: string;
    attendance: string;
    homework: string;
    tests: string;
  };
  tabs: {
    home: string;
    batches: string;
    tasks: string;
    more: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    signIn: string;
    welcomeBack: string;
    roleTeacher: string;
    roleStudent: string;
    signOut: string;
    signOutConfirm: string;
  };
  dashboard: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    todaySchedule: string;
    quickActions: string;
    pendingTasks: string;
    takeAttendance: string;
    postHomework: string;
    createTest: string;
    viewReports: string;
  };
  batches: {
    activeBatches: string;
    createBatch: string;
    studentsEnrolled: string;
    schedule: string;
    timing: string;
    room: string;
    subject: string;
    grade: string;
    batchDetails: string;
  };
  attendance: {
    title: string;
    markAttendance: string;
    submitAttendance: string;
    history: string;
    rate: string;
    presentCount: string;
    absentCount: string;
    allPresent: string;
  };
  homework: {
    title: string;
    createHomework: string;
    dueDate: string;
    submissions: string;
    partiallyDone: string;
    notDone: string;
    completed: string;
  };
  tests: {
    title: string;
    createTest: string;
    maxMarks: string;
    enterMarks: string;
    classAverage: string;
    highestScore: string;
    lowestScore: string;
    rankList: string;
  };
  reports: {
    title: string;
    subtitle: string;
    enrolledDirectory: string;
    needsAttention: string;
    toppers: string;
    progressSlip: string;
    avgAttendance: string;
  };
  profile: {
    title: string;
    subtitle: string;
    instituteName: string;
    specialization: string;
    qualifications: string;
    bio: string;
    contactDetails: string;
    editProfile: string;
  };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    selectLanguage: string;
    notifications: string;
    appVersion: string;
    classReminders: string;
    attendanceAlerts: string;
  };
}
