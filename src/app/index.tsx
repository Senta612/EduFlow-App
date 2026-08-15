import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { spacing, theme } from '@/theme';
import { StyleSheet, View } from "react-native";

export default function Index() {
  const color = theme.colors;
  return (
    <View style={styles.container}>
      <Text variant="title" >EduFlow</Text>
      <Text variant="body">This is the 1408/2026 starting the app EduFlow gole is the earn a 5CR from this </Text>
      <Input label="Email" placeholder="Enter your email" keyboardType="email-address" leftContent={<Text>✉️</Text>} />
      <Input label="Password" placeholder="Enter your password" secureTextEntry rightContent={<Text variant="caption">Show</Text>} />

      <Button title="Get Started" fullWidth />
      <Button title="Get Started" variant="secondary" />
    </View >
  )
}

const color = theme.colors;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: color.background.screen,
    gap: spacing.sm,
  },
})