import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';

export default function HomeScreen() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text variant="title">Welcome to EduFlow</Text>
      <Text variant="body" style={styles.subtitle}>
        You are signed in. Dashboard coming soon.
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