import React from 'react';
import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="batch/create" options={{ headerShown: false }} />
      <Stack.Screen name="batch/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="student/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="attendance/[batchId]" options={{ headerShown: false }} />
      <Stack.Screen name="homework/create" options={{ headerShown: false }} />
      <Stack.Screen name="tests/create" options={{ headerShown: false }} />
      <Stack.Screen name="tests/[id]/marks" options={{ headerShown: false }} />
      <Stack.Screen name="more/profile" options={{ headerShown: false }} />
      <Stack.Screen name="more/reports" options={{ headerShown: false }} />
      <Stack.Screen name="more/notifications" options={{ headerShown: false }} />
      <Stack.Screen name="more/settings" options={{ headerShown: false }} />
    </Stack>
  );
}