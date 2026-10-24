import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { AuthProvider, TeacherPreferencesProvider } from '@/providers';
import { LanguageProvider } from '@/i18n';
import { theme } from '@/theme';

function RootNavigator() {
  const { user, studentSession, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTeacherGroup = segments[0] === '(teacher)';
    const inStudentGroup = segments[0] === '(student)';

    const isAuthenticated = Boolean(user) || Boolean(studentSession);
    const role = profile?.role || (studentSession ? 'student' : undefined);

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (role === 'teacher') {
        if (!inTeacherGroup) {
          router.replace('/(teacher)');
        }
      } else if (role === 'student') {
        if (!inStudentGroup) {
          router.replace('/(student)');
        }
      }
    }
  }, [user, studentSession, profile, isLoading, segments, router]);

  // Senior Pattern: Listen for notification click responses and cold-start launches
  useEffect(() => {
    import('@/services/notifications/notification.service').then(({ notificationService }) => {
      notificationService.init();
    });

    import('expo-notifications').then((Notifications) => {
      // Handle initial launch from notification
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse?.notification) {
        const data = lastResponse.notification.request.content.data;
        if (data?.batchId) {
          router.push(`/(teacher)/attendance/${data.batchId}` as any);
        } else if (data?.url) {
          router.push(data.url as any);
        }
      }

      // Handle runtime notification response while app is running
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.batchId) {
          router.push(`/(teacher)/attendance/${data.batchId}` as any);
        } else if (data?.url) {
          router.push(data.url as any);
        }
      });

      return () => {
        subscription.remove();
      };
    }).catch((err) => {
      console.warn('Notifications listener setup notice:', err);
    });
  }, [router]);

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(student)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <TeacherPreferencesProvider>
          <RootNavigator />
        </TeacherPreferencesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}