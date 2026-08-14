import { StyleSheet, Text, View } from "react-native";


export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EduFlow</Text>
      <Text style={styles.subTitle}>This is the 1408/2026 starting the app EduFlow gole is the earn a 5CR from this </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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