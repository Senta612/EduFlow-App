import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function TeacherHomeScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <Text variant="title">Teacher Dashboard</Text>
      <Text variant="body" style={styles.subtitle}>
        Welcome, {profile?.full_name ?? 'Teacher'}! Your dashboard is coming soon.
      </Text>

      <Button
        title="Sign Out"
        variant="secondary"
        fullWidth
        onPress={handleSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.screen,
  },

  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});