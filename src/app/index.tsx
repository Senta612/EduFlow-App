import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { SignupScreen } from '@/screens/auth/SignupScreen';

export default function Index() {
  const { isAuthenticated } = useAuth();

  // If the user is already signed in, send them to the dashboard.
  // Otherwise show the signup screen.
  if (isAuthenticated) {
    return <Redirect href="/(app)/index" />;
  }

  return <SignupScreen />;
}