import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/providers/AuthProvider';
import { theme } from '@/theme';

function RootNavigator() {
  const { user, profile, isLoading } = useAuth();

  // Show a splash/loading state while we check for an existing session.
  // This prevents flashing the auth screen for logged-in users.
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.screen,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  const isAuthenticated = !!user;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Authenticated teacher routes — owns / when role is teacher */}
      <Stack.Protected guard={isAuthenticated && profile?.role === 'teacher'}>
        <Stack.Screen name="(teacher)" />
      </Stack.Protected>

      {/* Authenticated student routes — owns / when role is student */}
      <Stack.Protected guard={isAuthenticated && profile?.role === 'student'}>
        <Stack.Screen name="(student)" />
      </Stack.Protected>

      {/* Unauthenticated routes — owns / when logged out */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}