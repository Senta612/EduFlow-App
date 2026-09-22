import React from 'react';
import { Redirect } from 'expo-router';

export default function StudentRootIndex() {
  return <Redirect href="/(student)/(tabs)" />;
}