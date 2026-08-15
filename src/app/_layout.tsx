import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function RootLayout() {
  const { isAuthenticated, loading } = useAuth();

  // Show a splash/loading state while we check for an existing session.
  // This prevents flashing the auth screen for logged-in users.
  if (loading) {
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Screen name="index" />
    </Stack>
  );
}