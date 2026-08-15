import { Redirect } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // If the user is already signed in, send them to the home screen.
  if (isAuthenticated) {
    return <Redirect href="/(app)/index" />;
  }

  if (showLogin) {
    return <LoginScreen onSwitchToSignup={() => setShowLogin(false)} />;
  }

  return <SignupScreen onSwitchToLogin={() => setShowLogin(true)} />;
}