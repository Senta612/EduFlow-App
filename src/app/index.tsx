import { spacing, theme, typography } from '@/theme';
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const color = theme.colors;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EduFlow</Text>
      <Text style={styles.subTitle}>This is the 1408/2026 starting the app EduFlow gole is the earn a 5CR from this </Text>
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
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: color.text.primary,
  },
  subTitle: {
    fontSize: typography.sizes.base,
    marginTop: spacing.sm,
    color: color.text.secondary,
  }
})