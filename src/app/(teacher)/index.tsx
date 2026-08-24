import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

// Isolated as a single source of truth so the destination can be swapped
// once the class creation screen (src/app/(teacher)/classes/create.tsx)
// is added and registered in the generated route types.
const CREATE_CLASS_ROUTE = '/classes/create';

function getFirstName(fullName: string | null | undefined): string | undefined {
  const firstName = fullName?.trim().split(/\s+/)[0];
  return firstName || undefined;
}

export default function TeacherHomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const handleCreateClass = () => {
    // Cast is required until '/classes/create' is part of the typed routes.
    router.push(CREATE_CLASS_ROUTE as unknown as Href);
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Teacher dashboard header / greeting */}
      <View style={styles.header}>
        <Text variant="title">
          {`Hello${profile?.full_name ? `, ${getFirstName(profile.full_name)}` : ''}`}
        </Text>
        <Text variant="body" style={styles.headerSubtitle}>
          Manage your classes and students.
        </Text>
      </View>

      {/* Empty state for the teacher's (currently empty) classes list */}
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <View style={styles.iconContainer}>
            <Feather name="folder" size={44} color={theme.colors.primary.main} />
          </View>
          <Text variant="heading">No classes yet</Text>
          <Text variant="body" style={styles.emptyStateText}>
            Create your first class to get started.
          </Text>
        </View>

        <Button title="Create Class" fullWidth onPress={handleCreateClass} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: theme.spacing.lg,
  },
  header: { gap: theme.spacing.xs, marginTop: theme.spacing.lg },
  headerSubtitle: { color: theme.colors.text.secondary },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  iconContainer: {
    width: 104,
    height: 104,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.bg,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: { color: theme.colors.text.secondary, textAlign: 'center' },
});