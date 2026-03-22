import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ComplaintSuccessScreen() {
  const { ticketId } = useLocalSearchParams();

  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={s.iconCircle}>
          <Ionicons name="checkmark" size={36} color="#16a34a" />
        </View>
        <Text style={s.title}>Complaint Submitted!</Text>
        <Text style={s.sub}>Your complaint has been received. We will resolve it as soon as possible.</Text>
        <View style={s.ticketBox}>
          <Text style={s.ticketLabel}>Your Ticket ID</Text>
          <Text style={s.ticketId}>{ticketId}</Text>
          <Text style={s.ticketHint}>Save this ID to track your complaint</Text>
        </View>
        <TouchableOpacity style={s.trackBtn} onPress={() => router.replace("/" as any)} activeOpacity={0.85}>
          <Ionicons name="search-outline" size={16} color="#fff" style={s.btnIcon} />
          <Text style={s.trackBtnText}>Track My Complaint</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.homeBtn} onPress={() => router.replace("/" as any)} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={16} color="#374151" style={s.btnIcon} />
          <Text style={s.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center", padding: 24 },
  card:         { backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", maxWidth: 380, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  iconCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title:        { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 8, textAlign: "center" },
  sub:          { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  ticketBox:    { backgroundColor: "#f0fdf4", borderRadius: 16, padding: 20, alignItems: "center", width: "100%", marginBottom: 24, borderWidth: 1, borderColor: "#86efac" },
  ticketLabel:  { fontSize: 12, color: "#065f46", fontWeight: "600", marginBottom: 6 },
  ticketId:     { fontSize: 20, fontWeight: "800", color: "#16a34a", letterSpacing: 1.5, marginBottom: 6, textAlign: "center" },
  ticketHint:   { fontSize: 11, color: "#6b7280", textAlign: "center" },
  trackBtn:     { backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 14, width: "100%", alignItems: "center", marginBottom: 10, flexDirection: "row", justifyContent: "center" },
  trackBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  homeBtn:      { backgroundColor: "#f3f4f6", borderRadius: 14, paddingVertical: 14, width: "100%", alignItems: "center", flexDirection: "row", justifyContent: "center" },
  homeBtnText:  { color: "#374151", fontSize: 15, fontWeight: "600" },
  btnIcon:      { marginRight: 8 },
});