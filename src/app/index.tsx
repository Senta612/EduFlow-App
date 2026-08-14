import { theme } from '@/theme';
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const color = theme.colors;
  return (
    <View style={[styles.container, { backgroundColor: color.background.screen }]}>
      <Text style={[styles.title, { color: color.text.primary }]}>EduFlow</Text>
      <Text style={[styles.subTitle, { color: color.text.secondary }]}>This is the 1408/2026 starting the app EduFlow gole is the earn a 5CR from this </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 16,
    marginTop: 8,

  }
})