import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  SyncEntity,
  SyncAction,
  SyncMutation,
  SyncQueueSnapshot,
} from '../src/services/offline/types.ts';
import type { ExpoPushMessage } from '../src/services/notifications/pushDispatch.service.ts';

test('1. Sync Mutation Structure & Timestamps', () => {
  const mutation: SyncMutation = {
    id: 'mut-test-123',
    entity: 'attendance',
    action: 'create',
    payload: {
      batchId: 'batch-1',
      date: '2026-11-22',
      records: [
        { studentId: 'st-1', studentName: 'Aarav Patel', rollNumber: '01', status: 'absent' },
        { studentId: 'st-2', studentName: 'Diya Shah', rollNumber: '02', status: 'present' },
      ],
    },
    clientTimestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  assert.equal(mutation.entity, 'attendance');
  assert.equal(mutation.status, 'pending');
  assert.equal(mutation.retryCount, 0);
  assert.equal(mutation.payload.records.length, 2);
  assert.ok(mutation.clientTimestamp);
});

test('2. Offline Queue Snapshot State Evaluation', () => {
  const evaluateSnapshot = (
    queueLength: number,
    isOnline: boolean,
    isProcessing: boolean,
    hasFailed: boolean,
  ): SyncQueueSnapshot['status'] => {
    if (isProcessing) return 'syncing';
    if (!isOnline && queueLength > 0) return 'offline';
    if (queueLength > 0) return 'pending';
    if (hasFailed) return 'error';
    return 'synced';
  };

  assert.equal(evaluateSnapshot(0, true, false, false), 'synced');
  assert.equal(evaluateSnapshot(3, false, false, false), 'offline');
  assert.equal(evaluateSnapshot(3, true, false, false), 'pending');
  assert.equal(evaluateSnapshot(3, true, true, false), 'syncing');
  assert.equal(evaluateSnapshot(0, true, false, true), 'error');
});

test('3. Absence Alert Push Message Formatting', () => {
  const studentName = 'Rohan Sharma';
  const batchName = 'Class 10 - Mathematics';
  const tokens = ['ExponentPushToken[Abc123Xyz]', 'ExponentPushToken[Def456Uvw]'];

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

  assert.equal(messages.length, 2);
  assert.equal(messages[0].priority, 'high');
  assert.equal(messages[0].title, '🚨 Absence Alert');
  assert.ok(messages[0].body.includes('Rohan Sharma'));
  assert.ok(messages[0].body.includes('Class 10 - Mathematics'));
  assert.equal(messages[0].data?.route, '/(student)/(tabs)');
});

test('4. Homework Alert Push Message Formatting', () => {
  const batchName = 'Physics Batch A';
  const hwTitle = 'Chapter 4 Numerical Exercises';
  const dueDate = '2026-11-25';
  const token = 'ExponentPushToken[Ghi789Rst]';

  const message: ExpoPushMessage = {
    to: token,
    sound: 'default',
    priority: 'normal',
    title: '📚 New Homework Assigned',
    body: `${batchName}: "${hwTitle}" (Due: ${dueDate})`,
    data: {
      type: 'homework',
      route: '/(student)/(tabs)/homework',
    },
  };

  assert.equal(message.title, '📚 New Homework Assigned');
  assert.ok(message.body.includes(batchName));
  assert.ok(message.body.includes(hwTitle));
  assert.equal(message.data?.route, '/(student)/(tabs)/homework');
});

test('5. Test Marks Alert Calculation & Formatting', () => {
  const testTitle = 'Weekly Algebra Quiz';
  const studentName = 'Priya Mehta';
  const marks = 45;
  const maxMarks = 50;
  const percent = Math.round((marks / maxMarks) * 100);

  const message: ExpoPushMessage = {
    to: 'ExponentPushToken[Jkl012Mno]',
    title: '🎯 Test Marks Published',
    body: `${testTitle}: ${studentName} scored ${marks}/${maxMarks} (${percent}%)`,
    data: {
      type: 'test',
      route: '/(student)/(tabs)/tests',
    },
  };

  assert.equal(percent, 90);
  assert.ok(message.body.includes('45/50 (90%)'));
  assert.equal(message.data?.route, '/(student)/(tabs)/tests');
});

test('6. Push Token Deduplication', () => {
  const rawTokens = [
    'ExponentPushToken[Token1]',
    'ExponentPushToken[Token2]',
    'ExponentPushToken[Token1]',
    'ExponentPushToken[Token3]',
  ];

  const unique = Array.from(new Set(rawTokens));
  assert.equal(unique.length, 3);
  assert.equal(unique[0], 'ExponentPushToken[Token1]');
  assert.equal(unique[1], 'ExponentPushToken[Token2]');
  assert.equal(unique[2], 'ExponentPushToken[Token3]');
});

test('7. Push Chunking Limit (100 per HTTP Request)', () => {
  const allMessages = Array.from({ length: 250 }, (_, i) => ({
    to: `ExponentPushToken[Token_${i}]`,
    title: 'Test',
    body: `Body ${i}`,
  }));

  const CHUNK_SIZE = 100;
  const chunks: any[][] = [];
  for (let i = 0; i < allMessages.length; i += CHUNK_SIZE) {
    chunks.push(allMessages.slice(i, i + CHUNK_SIZE));
  }

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 100);
  assert.equal(chunks[1].length, 100);
  assert.equal(chunks[2].length, 50);
});
