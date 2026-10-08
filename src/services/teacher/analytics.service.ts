import {
  StudentProfileData,
  StudentAttendanceHistoryItem,
  StudentHomeworkReportItem,
  StudentTestReportItem,
  HomeworkStatus,
  TuitionAnalyticsSummary,
  BatchAnalyticsSummary,
  DefaulterStudent,
  DefaulterIssue,
  TestLeaderboardItem,
  TestRankStudent,
} from '@/types/teacher';
import { batchesService } from './batches.service';
import { studentsService } from './students.service';
import { attendanceService } from './attendance.service';
import { homeworkService } from './homework.service';
import { testsService } from './tests.service';

export class AnalyticsService {
  async getStudentProfileData(
    batchId: string,
    studentId: string,
  ): Promise<StudentProfileData | null> {
    const [batch, students, attendanceRecords, homeworkList, testsList] = await Promise.all([
      batchesService.getBatchById(batchId),
      studentsService.getBatchStudents(batchId),
      attendanceService.getBatchAttendanceHistory(batchId),
      homeworkService.getBatchHomework(batchId),
      testsService.getBatchTests(batchId),
    ]);

    if (!batch) return null;
    const student = students.find((s) => s.id === studentId);
    if (!student) return null;

    // 1. Attendance aggregation
    const history: StudentAttendanceHistoryItem[] = [];
    let presentCount = 0;
    let absentCount = 0;

    // Sort attendance records newest first
    const sortedAttendance = [...attendanceRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    for (const record of sortedAttendance) {
      const item = record.records?.find((r) => r.studentId === studentId);
      if (item) {
        if (item.status === 'present') presentCount++;
        else if (item.status === 'absent') absentCount++;

        history.push({
          id: record.id,
          date: record.date,
          status: item.status,
          submittedAt: record.submittedAt,
        });
      }
    }

    const totalClasses = presentCount + absentCount;
    const attendancePercentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    // 2. Homework aggregation
    const hwReportItems: StudentHomeworkReportItem[] = [];
    let hwDoneCount = 0;
    let hwHalfDoneCount = 0;
    let hwNotDoneCount = 0;

    for (const hw of homeworkList) {
      const submissions = await homeworkService.getHomeworkSubmissions(hw.id, batchId);
      const sub = submissions.find((s) => s.studentId === studentId);
      const status: HomeworkStatus = sub ? sub.status : 'done';
      if (status === 'done') hwDoneCount++;
      else if (status === 'half_done') hwHalfDoneCount++;
      else hwNotDoneCount++;

      hwReportItems.push({
        homeworkId: hw.id,
        title: hw.title,
        description: hw.description,
        dueDate: hw.dueDate,
        status,
        remarks: sub?.remarks,
      });
    }

    const totalAssigned = homeworkList.length;
    const hwScoreSum = hwDoneCount + 0.5 * hwHalfDoneCount;
    const completionPercentage =
      totalAssigned > 0 ? Math.round((hwScoreSum / totalAssigned) * 100) : 0;

    // 3. Tests & Marks aggregation
    const testReportItems: StudentTestReportItem[] = [];
    let testsAttempted = 0;
    let totalMarksScored = 0;
    let totalMaxMarks = 0;

    for (const test of testsList) {
      const marks = await testsService.getTestMarks(test.id, batchId);
      const markEntry = marks.find((m) => m.studentId === studentId);
      const marksObtained = markEntry?.marksObtained ?? null;

      let percentage: number | null = null;
      let gradeBadge = 'Pending';

      if (marksObtained !== null) {
        testsAttempted++;
        totalMarksScored += marksObtained;
        totalMaxMarks += test.maxMarks;
        percentage = test.maxMarks > 0 ? Math.round((marksObtained / test.maxMarks) * 100) : 0;
        if (percentage >= 90) gradeBadge = 'Outstanding';
        else if (percentage >= 80) gradeBadge = 'Excellent';
        else if (percentage >= 70) gradeBadge = 'Good';
        else if (percentage >= 60) gradeBadge = 'Average';
        else gradeBadge = 'Needs Attention';
      }

      testReportItems.push({
        testId: test.id,
        title: test.title,
        date: test.date,
        maxMarks: test.maxMarks,
        marksObtained,
        percentage,
        gradeBadge,
      });
    }

    const averagePercentage =
      totalMaxMarks > 0 ? Math.round((totalMarksScored / totalMaxMarks) * 100) : 0;

    let gradeLetter = 'N/A';
    if (testsAttempted > 0) {
      if (averagePercentage >= 90) gradeLetter = 'A+';
      else if (averagePercentage >= 80) gradeLetter = 'A';
      else if (averagePercentage >= 70) gradeLetter = 'B';
      else if (averagePercentage >= 60) gradeLetter = 'C';
      else if (averagePercentage >= 50) gradeLetter = 'D';
      else gradeLetter = 'F';
    }

    return {
      student,
      batch,
      attendance: {
        totalClasses,
        presentCount,
        absentCount,
        percentage: attendancePercentage,
        history,
      },
      homework: {
        totalAssigned,
        doneCount: hwDoneCount,
        halfDoneCount: hwHalfDoneCount,
        notDoneCount: hwNotDoneCount,
        completionPercentage,
        items: hwReportItems,
      },
      tests: {
        totalTests: testsList.length,
        testsAttempted,
        totalMarksScored,
        totalMaxMarks,
        averagePercentage,
        gradeLetter,
        items: testReportItems,
      },
    };
  }

  async getTuitionAnalytics(selectedBatchId?: string): Promise<TuitionAnalyticsSummary> {
    const allBatches = await batchesService.getBatches();
    const activeBatches =
      selectedBatchId && selectedBatchId !== 'all'
        ? allBatches.filter((b) => b.id === selectedBatchId)
        : allBatches;

    const defaulters: DefaulterStudent[] = [];
    const testLeaderboards: TestLeaderboardItem[] = [];
    const batchSummaries: BatchAnalyticsSummary[] = [];

    let totalStudentsAcc = 0;
    let totalPresentOverall = 0;
    let totalAttendanceEntriesOverall = 0;
    let totalHwSubmissionsOverall = 0;
    let totalHwAssignedOverall = 0;
    let totalTestsCount = 0;

    // Process all active batches concurrently
    const batchResults = await Promise.all(
      activeBatches.map(async (batch) => {
        const [students, attendanceRecords, homeworkList, testsList] = await Promise.all([
          studentsService.getBatchStudents(batch.id),
          attendanceService.getBatchAttendanceHistory(batch.id),
          homeworkService.getBatchHomework(batch.id),
          testsService.getBatchTests(batch.id),
        ]);

        // Prefetch homework submissions in parallel
        const hwSubmissionsEntries = await Promise.all(
          homeworkList.map(async (hw) => {
            const subs = await homeworkService.getHomeworkSubmissions(hw.id, batch.id);
            return [hw.id, subs] as const;
          }),
        );
        const hwSubmissionsMap = new Map(hwSubmissionsEntries);

        // Prefetch test marks in parallel
        const testMarksEntries = await Promise.all(
          testsList.map(async (t) => {
            const marks = await testsService.getTestMarks(t.id, batch.id);
            return [t.id, marks] as const;
          }),
        );
        const testMarksMap = new Map(testMarksEntries);

        // 1. Batch Attendance calculation
        let batchPresent = 0;
        let batchTotalEntries = 0;
        for (const rec of attendanceRecords) {
          batchPresent += rec.presentCount;
          batchTotalEntries += rec.presentCount + rec.absentCount;
        }

        const batchAttPercent =
          batchTotalEntries > 0 ? Math.round((batchPresent / batchTotalEntries) * 100) : 0;

        let attStatus: 'excellent' | 'good' | 'needs_attention' = 'good';
        if (batchAttPercent >= 90) attStatus = 'excellent';
        else if (batchAttPercent < 75 && batchTotalEntries > 0) attStatus = 'needs_attention';

        // 2. Batch Homework calculation
        let batchHwDone = 0;
        let batchHwTotal = 0;
        for (const hw of homeworkList) {
          batchHwDone += hw.submissionsCount;
          batchHwTotal += hw.totalStudents;
        }

        const batchHwPercent =
          batchHwTotal > 0 ? Math.round((batchHwDone / batchHwTotal) * 100) : 0;

        const summary: BatchAnalyticsSummary = {
          batch,
          totalStudents: students.length,
          attendancePercentage: batchAttPercent,
          attendanceStatus: attStatus,
          totalClasses: attendanceRecords.length,
          hwCompletionPercentage: batchHwPercent,
          activeTestsCount: testsList.length,
        };

        // 3. Defaulter Identification per student
        const sortedAttendance = [...attendanceRecords].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        const batchDefaulters: DefaulterStudent[] = [];

        for (const student of students) {
          const issues: DefaulterIssue[] = [];

          let studentPresent = 0;
          let studentTotal = 0;
          let consecutiveAbsences = 0;
          let checkingConsecutive = true;

          for (const record of sortedAttendance) {
            const item = record.records?.find((r) => r.studentId === student.id);
            if (item) {
              studentTotal++;
              if (item.status === 'present') {
                studentPresent++;
                checkingConsecutive = false;
              } else if (item.status === 'absent') {
                if (checkingConsecutive) consecutiveAbsences++;
              }
            }
          }

          const studentAttPercent =
            studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;

          if (consecutiveAbsences >= 2) {
            issues.push({
              type: 'attendance',
              severity: 'high',
              label: `${consecutiveAbsences} Consecutive Absences`,
              details: `Absent in last ${consecutiveAbsences} classes`,
            });
          } else if (studentTotal >= 2 && studentAttPercent < 75) {
            issues.push({
              type: 'attendance',
              severity: 'high',
              label: `Low Attendance (${studentAttPercent}%)`,
              details: `Attended ${studentPresent} of ${studentTotal} classes`,
            });
          }

          // Check homeworks from pre-fetched Map
          let missedHw = 0;
          for (const hw of homeworkList) {
            const subs = hwSubmissionsMap.get(hw.id) || [];
            const sub = subs.find((s) => s.studentId === student.id);
            if (sub && sub.status === 'not_done') {
              missedHw++;
            }
          }

          if (missedHw >= 2) {
            issues.push({
              type: 'homework',
              severity: 'medium',
              label: `${missedHw} Missed Homeworks`,
              details: `Incomplete assignments pending review`,
            });
          }

          // Check test scores from pre-fetched Map
          let latestScoreStr: string | undefined;
          for (const test of testsList) {
            const marks = testMarksMap.get(test.id) || [];
            const markEntry = marks.find((m) => m.studentId === student.id);
            if (markEntry && markEntry.marksObtained !== null) {
              const mark = markEntry.marksObtained;
              const pct = test.maxMarks > 0 ? Math.round((mark / test.maxMarks) * 100) : 0;
              latestScoreStr = `${mark}/${test.maxMarks} (${pct}%)`;

              if (pct < 50) {
                issues.push({
                  type: 'test',
                  severity: 'high',
                  label: `Low Test Score (${pct}%)`,
                  details: `Scored ${mark}/${test.maxMarks} in ${test.title}`,
                });
              }
            }
          }

          if (issues.length > 0) {
            batchDefaulters.push({
              studentId: student.id,
              studentName: student.name,
              rollNumber: student.rollNumber,
              parentPhone: student.parentPhone,
              batchId: batch.id,
              batchName: batch.name,
              issues,
              attendancePercentage: studentAttPercent,
              missedHwCount: missedHw,
              recentTestScore: latestScoreStr,
            });
          }
        }

        // 4. Test Leaderboards
        const batchLeaderboards: TestLeaderboardItem[] = [];
        for (const test of testsList) {
          const marks = testMarksMap.get(test.id) || [];
          const enteredMarks = marks.filter((m) => m.marksObtained !== null);

          if (enteredMarks.length > 0) {
            const numericMarks = enteredMarks.map((m) => m.marksObtained as number);
            const highestMarks = Math.max(...numericMarks);
            const lowestMarks = Math.min(...numericMarks);
            const averageMarks = Math.round(
              numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length,
            );

            // Sort descending by marks
            const sortedMarks = [...enteredMarks].sort(
              (a, b) => (b.marksObtained ?? 0) - (a.marksObtained ?? 0),
            );

            let currentRank = 1;
            const topStudents: TestRankStudent[] = [];

            sortedMarks.slice(0, 5).forEach((m, idx) => {
              if (idx > 0 && m.marksObtained! < sortedMarks[idx - 1].marksObtained!) {
                currentRank = idx + 1;
              }
              const st = students.find((s) => s.id === m.studentId);
              const pct =
                test.maxMarks > 0 ? Math.round((m.marksObtained! / test.maxMarks) * 100) : 0;

              topStudents.push({
                rank: currentRank,
                studentId: m.studentId,
                studentName: m.studentName,
                rollNumber: m.rollNumber,
                marksObtained: m.marksObtained!,
                maxMarks: test.maxMarks,
                percentage: pct,
                parentPhone: st?.parentPhone,
              });
            });

            batchLeaderboards.push({
              test,
              highestMarks,
              lowestMarks,
              averageMarks,
              topStudents,
              totalEntered: enteredMarks.length,
            });
          }
        }

        return {
          studentsCount: students.length,
          testsCount: testsList.length,
          presentCount: batchPresent,
          totalAttendanceEntries: batchTotalEntries,
          hwDone: batchHwDone,
          hwTotal: batchHwTotal,
          summary,
          defaulters: batchDefaulters,
          leaderboards: batchLeaderboards,
        };
      }),
    );

    for (const res of batchResults) {
      totalStudentsAcc += res.studentsCount;
      totalTestsCount += res.testsCount;
      totalPresentOverall += res.presentCount;
      totalAttendanceEntriesOverall += res.totalAttendanceEntries;
      totalHwSubmissionsOverall += res.hwDone;
      totalHwAssignedOverall += res.hwTotal;
      batchSummaries.push(res.summary);
      defaulters.push(...res.defaulters);
      testLeaderboards.push(...res.leaderboards);
    }

    const overallAttPercent =
      totalAttendanceEntriesOverall > 0
        ? Math.round((totalPresentOverall / totalAttendanceEntriesOverall) * 100)
        : 0;

    const overallHwPercent =
      totalHwAssignedOverall > 0
        ? Math.round((totalHwSubmissionsOverall / totalHwAssignedOverall) * 100)
        : 0;

    return {
      totalStudentsCount: totalStudentsAcc,
      averageAttendance: overallAttPercent,
      hwCompletionRate: overallHwPercent,
      totalTestsConducted: totalTestsCount,
      defaulters,
      testLeaderboards,
      batchSummaries,
    };
  }
}

export const analyticsService = new AnalyticsService();
