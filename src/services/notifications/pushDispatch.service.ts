import { pushTokenService } from './pushToken.service';

export interface ExpoPushMessage {
  to: string | string[];
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export interface PushDispatchResult {
  sentCount: number;
  failedCount: number;
}

class PushDispatchService {
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  /**
   * Dispatch push messages to Expo's push service with automatic chunking (<= 100 per call)
   */
  async sendPushMessages(messages: ExpoPushMessage[]): Promise<PushDispatchResult> {
    if (!messages || messages.length === 0) {
      return { sentCount: 0, failedCount: 0 };
    }

    // Filter valid Expo Push Tokens
    const validMessages = messages.filter((m) => {
      const targets = Array.isArray(m.to) ? m.to : [m.to];
      return targets.some((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'));
    });

    if (validMessages.length === 0) {
      return { sentCount: 0, failedCount: 0 };
    }

    // Chunk into batches of 100
    const CHUNK_SIZE = 100;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validMessages.length; i += CHUNK_SIZE) {
      const chunk = validMessages.slice(i, i + CHUNK_SIZE);
      try {
        const response = await fetch(this.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (response.ok) {
          const resData = await response.json();
          const tickets = resData.data || [];
          tickets.forEach((ticket: any) => {
            if (ticket.status === 'ok') {
              sentCount++;
            } else {
              failedCount++;
            }
          });
        } else {
          failedCount += chunk.length;
        }
      } catch (err) {
        console.warn('[PushDispatch] Failed to dispatch chunk:', err);
        failedCount += chunk.length;
      }
    }

    return { sentCount, failedCount };
  }

  /**
   * Send instant Absence Alert to parents of a student
   */
  async sendAbsenceAlert(studentName: string, batchName: string, tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      priority: 'high',
      title: '🚨 Absence Alert',
      body: `${studentName} was marked Absent today in ${batchName}.`,
      data: {
        type: 'attendance',
        route: '/(student)/(tabs)',
      },
    }));

    await this.sendPushMessages(messages);
  }

  /**
   * Send notification to all batch students & parents when new homework is published
   */
  async sendHomeworkAlert(
    batchName: string,
    title: string,
    dueDate: string,
    tokens: string[],
  ): Promise<void> {
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      priority: 'normal',
      title: '📚 New Homework Assigned',
      body: `${batchName}: "${title}" (Due: ${dueDate})`,
      data: {
        type: 'homework',
        route: '/(student)/(tabs)/homework',
      },
    }));

    await this.sendPushMessages(messages);
  }

  /**
   * Send test result notification to student/parent
   */
  async sendTestMarksAlert(
    testTitle: string,
    studentName: string,
    marks: number,
    maxMarks: number,
    tokens: string[],
  ): Promise<void> {
    if (tokens.length === 0) return;

    const percent = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      priority: 'normal',
      title: '🎯 Test Marks Published',
      body: `${testTitle}: ${studentName} scored ${marks}/${maxMarks} (${percent}%)`,
      data: {
        type: 'test',
        route: '/(student)/(tabs)/tests',
      },
    }));

    await this.sendPushMessages(messages);
  }

  /**
   * Dispatch absence notifications for all absent students in a batch
   */
  async dispatchAttendanceAbsentees(
    batchId: string,
    batchName: string,
    absentees: { id: string; name: string }[],
  ): Promise<void> {
    if (!absentees || absentees.length === 0) return;

    for (const st of absentees) {
      try {
        const tokens = await pushTokenService.getTokensForStudents([st.id]);
        if (tokens.length > 0) {
          await this.sendAbsenceAlert(st.name, batchName, tokens);
        }
      } catch (err) {
        console.warn(`[PushDispatch] Failed to send absence alert for ${st.name}:`, err);
      }
    }
  }
}

export const pushDispatchService = new PushDispatchService();
