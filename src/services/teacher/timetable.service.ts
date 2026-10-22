import { Batch } from '@/types/teacher';
import { batchesService } from './batches.service';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface TimetableSlot {
  id: string;
  batch: Batch;
  day: DayOfWeek;
  startTime: string; // e.g. "04:00 PM"
  endTime: string; // e.g. "05:30 PM"
  startMinutes: number; // e.g. 960
  endMinutes: number; // e.g. 1050
  durationMinutes: number;
  hasConflict: boolean;
  conflictWith?: string; // batch name
}

export interface DaySchedule {
  day: DayOfWeek;
  slots: TimetableSlot[];
  totalClasses: number;
  totalMinutes: number;
}

export interface WeeklyTimetableOverview {
  days: DaySchedule[];
  totalWeeklyClasses: number;
  totalWeeklyHours: number;
  conflictCount: number;
  nextClassToday: TimetableSlot | null;
}

/**
 * Parses time string like "04:00 PM" or "10:30 AM" into minutes from midnight
 */
export function parseTimeToMinutes(raw: string): number {
  if (!raw) return 0;
  const clean = raw.trim().toUpperCase();
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Checks if a batch schedule string includes a specific day
 */
export function isBatchOnDay(scheduleStr: string, day: DayOfWeek): boolean {
  if (!scheduleStr) return false;
  const s = scheduleStr.toLowerCase();
  const d = day.toLowerCase();
  const short = d.slice(0, 3); // "mon", "tue", etc.

  if (s.includes('daily') || s.includes('all days') || s.includes('everyday')) {
    return true;
  }

  if (s.includes('mon to sat') || s.includes('mon - sat')) {
    return day !== 'Sunday';
  }

  if (s.includes('mon to fri') || s.includes('mon - fri') || s.includes('weekdays')) {
    return day !== 'Saturday' && day !== 'Sunday';
  }

  if (s.includes('weekend')) {
    return day === 'Saturday' || day === 'Sunday';
  }

  return s.includes(d) || s.includes(short);
}

export class TimetableService {
  async getWeeklySchedule(): Promise<WeeklyTimetableOverview> {
    const batches = await batchesService.getBatches();
    const days: DaySchedule[] = [];
    let conflictCount = 0;

    for (const day of DAYS_OF_WEEK) {
      const slots: TimetableSlot[] = [];

      for (const batch of batches) {
        if (isBatchOnDay(batch.schedule, day)) {
          // Parse timing e.g. "04:00 PM - 05:30 PM"
          const parts = (batch.timing || '').split('-');
          const startStr = parts[0]?.trim() || '09:00 AM';
          const endStr = parts[1]?.trim() || '10:00 AM';

          const startM = parseTimeToMinutes(startStr);
          const endM = parseTimeToMinutes(endStr);
          const duration = Math.max(30, endM - startM);

          slots.push({
            id: `${batch.id}_${day}`,
            batch,
            day,
            startTime: startStr,
            endTime: endStr,
            startMinutes: startM,
            endMinutes: endM,
            durationMinutes: duration,
            hasConflict: false,
          });
        }
      }

      // Sort chronologically
      slots.sort((a, b) => a.startMinutes - b.startMinutes);

      // Conflict detection for overlapping times
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slotA = slots[i];
          const slotB = slots[j];

          // Overlap condition: startA < endB && startB < endA
          if (slotA.startMinutes < slotB.endMinutes && slotB.startMinutes < slotA.endMinutes) {
            slotA.hasConflict = true;
            slotA.conflictWith = slotB.batch.name;
            slotB.hasConflict = true;
            slotB.conflictWith = slotA.batch.name;
            conflictCount++;
          }
        }
      }

      const totalMinutes = slots.reduce((sum, s) => sum + s.durationMinutes, 0);

      days.push({
        day,
        slots,
        totalClasses: slots.length,
        totalMinutes,
      });
    }

    const totalWeeklyClasses = days.reduce((sum, d) => sum + d.totalClasses, 0);
    const totalWeeklyMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalWeeklyHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10;

    // Find next class today
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const dayMap: Record<number, DayOfWeek> = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };
    const todayName = dayMap[todayIndex];
    const todaySchedule = days.find((d) => d.day === todayName);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextClassToday: TimetableSlot | null = null;
    if (todaySchedule && todaySchedule.slots.length > 0) {
      nextClassToday =
        todaySchedule.slots.find((s) => s.startMinutes > currentMinutes) ||
        todaySchedule.slots[0];
    }

    return {
      days,
      totalWeeklyClasses,
      totalWeeklyHours,
      conflictCount,
      nextClassToday,
    };
  }
}

export const timetableService = new TimetableService();
