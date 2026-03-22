import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../services/api";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";
  const otp = (params.otp as string) || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    if (!newPassword.trim()) return setError("Please enter new password.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    if (!email || !otp) return setError("Invalid reset session. Please start over.");
    setLoading(true);
    try {
      await authAPI.verifyResetOtp(email, otp, newPassword);
      setSuccess("Password reset successfully!");
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Password reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { label: "At least 6 characters", ok: newPassword.length >= 6 },
    { label: "Passwords match",       ok: newPassword === confirmPassword && confirmPassword.length > 0 },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={s.outer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace("/login")} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>UniFiX</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.heroSection}>
          <View style={s.iconWrap}>
            <Ionicons name="lock-open-outline" size={28} color="#16a34a" />
          </View>
          <Text style={s.title}>Create New Password</Text>
          <Text style={s.subtitle}>Enter a new password for your account</Text>
          <Text style={s.emailText}>{email}</Text>
        </View>

        <Text style={s.label}>New Password</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={17} color="#9ca3af" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Enter new password"
            placeholderTextColor="#9ca3af"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)} style={s.eyeBtn}>
            <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Confirm Password</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={17} color="#9ca3af" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Confirm new password"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={s.rulesBox}>
          {rules.map((r) => (
            <View key={r.label} style={s.ruleRow}>
              <Ionicons name={r.ok ? "checkmark-circle" : "ellipse-outline"} size={14} color={r.ok ? "#16a34a" : "#94a3b8"} />
              <Text style={[s.ruleText, { color: r.ok ? "#16a34a" : "#94a3b8" }]}>{r.label}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={s.successText}>{success}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.resetBtn, loading && s.btnDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.resetBtnText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.backRow} onPress={() => router.replace("/login")}>
          <Ionicons name="arrow-back-outline" size={13} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={s.backText}>Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer: { flexGrow: 1, backgroundColor: "#ffffff", paddingHorizontal: 20, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  heroSection: { alignItems: "center", paddingTop: 28, paddingBottom: 32 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#0f172a", marginBottom: 8, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 4 },
  emailText: { fontSize: 14, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 16 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 14 },
  eyeBtn: { padding: 6 },
  rulesBox: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 14, marginTop: 14, gap: 8 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleText: { fontSize: 13, fontWeight: "500" },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500", flex: 1 },
  successBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  successText: { color: "#16a34a", fontSize: 13, fontWeight: "500", flex: 1 },
  resetBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 24 },
  btnDisabled: { opacity: 0.55 },
  resetBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  backRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 18 },
  backText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
});