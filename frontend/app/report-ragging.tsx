import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Switch,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";
import { authAPI } from "../services/api";

const ROOM_MAP: Record<string, string> = {
  "003A": "Photocopy Center", "003": "First Aid / Counselling Room", "004": "Conference Room",
  "009": "Seminar Hall", "101": "Administrative Office", "102": "Principal's Office",
  "112": "CAD Center", "113": "Computer Lab B", "114": "Networking & DevOps Lab",
  "201": "Cubicles / Staff Room", "202": "HOD Computers", "209": "HOD IT",
  "214": "Classroom 1", "215": "Classroom 2", "216": "Classroom 3",
  "219": "Computer Center", "220": "Computer Center", "221": "Computer Center",
  "301": "Gymkhana", "307": "CSEDS Staff Room", "313": "Classroom", "314": "Classroom",
  "315": "Classroom", "318": "Seminar Hall", "319": "Physics Lab",
  "401": "EXTC / VLSI Lab", "415": "Classroom", "416": "Classroom",
  "515": "Classroom", "516": "Classroom", "517": "Classroom",
};

function isValidDate(dateStr: string): boolean {
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12) return false;
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return inputDate <= today;
}

export default function ReportRaggingScreen() {
  const [incidentDate, setIncidentDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [resolvedRoom, setResolvedRoom] = useState<string | null>(null);
  const [roomError, setRoomError] = useState("");
  const [description, setDescription] = useState("");
  const [bullyDescription, setBullyDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login" as any);
    });
    return () => unsub();
  }, []);

  const handleDateInput = (val: string) => {
    let digits = val.replace(/\D/g, "").slice(0, 8);
    let formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
    if (digits.length > 4) formatted += "/" + digits.slice(4, 8);
    setIncidentDate(formatted);
    setDateError("");
    if (formatted.length === 10 && !isValidDate(formatted)) {
      setDateError("Date cannot be in the future.");
    }
  };

  const handleRoomInput = (val: string) => {
    setRoomInput(val);
    setRoomError("");
    if (!val.trim()) { setResolvedRoom(null); return; }
    const key = val.trim().toUpperCase() === "003A" ? "003A" : val.trim();
    if (ROOM_MAP[key]) setResolvedRoom(ROOM_MAP[key]);
    else {
      setResolvedRoom(null);
      if (val.trim().length >= 3) setRoomError("Invalid room. You can also type a custom location below.");
    }
  };

const locationText = roomInput.trim();

  const handleSubmit = async () => {
    setError("");
    if (!incidentDate.trim()) return setError("Please enter the date of the incident.");
    if (!isValidDate(incidentDate)) return setError("Please enter a valid date.");
    if (!roomInput.trim()) return setError("Please enter the location.");
    if (!description.trim()) return setError("Please describe what happened.");
    if (description.trim().length < 30) return setError("Please describe in at least 30 characters.");

    Alert.alert(
      "Submit Report",
      isAnonymous
        ? "Your report will be submitted anonymously. HOD will be notified without your identity."
        : "Your name and details will be shared with HOD. Do you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit", style: "default",
          onPress: async () => {
            setSubmitting(true);
            try {
              await authAPI.reportRagging({
                incidentDate: incidentDate.trim(),
                incidentTime: incidentTime.trim(),
                location: locationText,
                description: description.trim(),
                bullyDescription: bullyDescription.trim(),
                isAnonymous,
              });
              Alert.alert(
                "Report Submitted ✓",
                "Your ragging report has been submitted. The HOD has been notified and will take appropriate action.",
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (err: any) {
              setError(err.message || "Failed to submit. Please try again.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Report Ragging</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Warning Banner */}
          <View style={s.warningBanner}>
            <Ionicons name="shield-checkmark" size={22} color="#dc2626" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.warningTitle}>Confidential Report</Text>
              <Text style={s.warningDesc}>This report goes directly to the HOD only. Your information is protected under UGC Anti-Ragging regulations.</Text>
            </View>
          </View>

          {/* Anonymous Toggle */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Identity</Text>
            <View style={s.anonymousRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Submit Anonymously</Text>
                <Text style={s.sublabel}>HOD will not see your name or details</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: "#e2e8f0", true: "#16a34a" }}
                thumbColor="#ffffff"
              />
            </View>
            {!isAnonymous && (
              <View style={s.namedNote}>
                <Ionicons name="information-circle-outline" size={14} color="#2563eb" style={{ marginRight: 6 }} />
                <Text style={s.namedNoteText}>Your name, email, roll number, branch and year will be shared with HOD only.</Text>
              </View>
            )}
          </View>

          {/* Incident Details */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Incident Details</Text>

            <Text style={s.label}>Date of Incident <Text style={s.required}>*</Text></Text>
            <TextInput
              style={[s.input, dateError ? { borderColor: "#dc2626" } : null]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#9ca3af"
              value={incidentDate}
              onChangeText={handleDateInput}
              keyboardType="numeric"
              maxLength={10}
            />
            {dateError ? <Text style={s.fieldError}>{dateError}</Text> : null}

            <Text style={s.label}>Time of Incident (optional)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 2:30 PM or After college hours"
              placeholderTextColor="#9ca3af"
              value={incidentTime}
              onChangeText={setIncidentTime}
            />

     <Text style={s.label}>Location <Text style={s.required}>*</Text></Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Near Staff Room 201, Canteen, Ground Floor Corridor"
              placeholderTextColor="#9ca3af"
              value={roomInput}
              onChangeText={(val) => { setRoomInput(val); setRoomError(""); }}
              autoCapitalize="sentences"
            />
          </View>

          {/* Description */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>What Happened</Text>
            <Text style={s.label}>Describe the Incident <Text style={s.required}>*</Text></Text>
            <TextInput
              style={[s.input, s.textarea]}
              placeholder="Describe what happened in detail. Include what was said or done, how many people were involved, etc."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
            <Text style={[s.charCount, description.length < 30 && description.length > 0 ? { color: "#dc2626" } : null]}>
              {description.length} chars {description.length < 30 && description.length > 0 ? `(${30 - description.length} more needed)` : ""}
            </Text>

            <Text style={s.label}>Description of Person(s) Involved (optional)</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="e.g. Senior student, tall, wearing blue jacket. Department, year if known."
              placeholderTextColor="#9ca3af"
              value={bullyDescription}
              onChangeText={setBullyDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Legal Note */}
          <View style={s.legalNote}>
            <Ionicons name="document-text-outline" size={16} color="#64748b" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={s.legalText}>
              Under UGC Regulations 2009 and Maharashtra Prohibition of Ragging Act, all ragging complaints must be addressed within 72 hours. False complaints are also punishable.
            </Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.submitBtnText}>Submitting...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={s.submitBtnText}>Submit Report to HOD</Text>
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  container: { padding: 16, gap: 14, paddingBottom: 48 },
  warningBanner: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fef2f2", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#fecaca" },
  warningTitle: { fontSize: 14, fontWeight: "800", color: "#dc2626", marginBottom: 4 },
  warningDesc: { fontSize: 12, color: "#7f1d1d", lineHeight: 18 },
  section: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#f1f5f9" },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 14, letterSpacing: -0.2 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 12 },
  sublabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  required: { color: "#dc2626" },
  input: { backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0" },
  textarea: { height: 120, textAlignVertical: "top" },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: "#e2e8f0" },
  inputWrapSuccess: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  inputWrapError: { borderColor: "#dc2626" },
  inputInner: { flex: 1, fontSize: 15, color: "#0f172a" },
  resolvedBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  resolvedText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  fieldError: { fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: "500" },
  anonymousRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  namedNote: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#eff6ff", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#bfdbfe" },
  namedNoteText: { flex: 1, fontSize: 12, color: "#1e40af", lineHeight: 18 },
  charCount: { fontSize: 11, color: "#94a3b8", marginTop: 4, textAlign: "right" },
  legalNote: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  legalText: { flex: 1, fontSize: 12, color: "#64748b", lineHeight: 18 },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500", flex: 1 },
  submitBtn: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});