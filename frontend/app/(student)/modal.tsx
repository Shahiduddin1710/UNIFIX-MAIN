import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Information</Text>
      <Text style={styles.body}>UNIFIX is your campus maintenance and complaint management portal.</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#F1F8F1", alignItems: "center", justifyContent: "center", padding: 32 },
  title:        { fontSize: 24, fontWeight: "800", color: "#2E7D32", marginBottom: 16 },
  body:         { fontSize: 15, color: "#444", textAlign: "center", lineHeight: 24, marginBottom: 32 },
  closeBtn:     { backgroundColor: "#2E7D32", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40 },
  closeBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});