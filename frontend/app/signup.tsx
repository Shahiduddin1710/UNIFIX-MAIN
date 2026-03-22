import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../services/api";

type Role = "student" | "teacher" | "staff";

const ROLE_OPTIONS: { label: string; value: Role; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Student", value: "student", icon: "school-outline" },
  { label: "Teacher", value: "teacher", icon: "person-outline" },
  { label: "Staff",   value: "staff",   icon: "construct-outline" },
];

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateEmail = (emailVal: string, selectedRole: Role): boolean => {
    if (selectedRole === "student" || selectedRole === "teacher") {
      return emailVal.trim().toLowerCase().endsWith("@vcet.edu.in");
    }
    return true;
  };

  const handleSignup = async () => {
    setError("");
    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!role) return setError("Please select a role.");
    if (!password) return setError("Please enter a password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!validateEmail(email, role)) {
      return setError(role === "student" ? "Students must use a @vcet.edu.in email." : "Teachers must use a @vcet.edu.in email.");
    }
    if (!agreedToTerms) return setError("Please accept the Terms & Conditions to continue.");
    setLoading(true);
    try {
      await authAPI.signup(name.trim(), email.trim().toLowerCase(), password, role);
      router.push({
        pathname: "/otp-verification",
        params: { email: email.trim().toLowerCase(), fullName: name.trim(), password, role, type: "email-verification" },
      });
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={s.outer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace("/login")} style={s.backBtn}><Text style={s.backIcon}>←</Text></TouchableOpacity>
          <Text style={s.headerTitle}>UniFiX</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.titleSection}>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join the UniFiX community today</Text>
        </View>
        <Text style={s.label}>Full Name</Text>
        <View style={s.inputWrap}>
          <Ionicons name="person-outline" size={18} color="#9ca3af" style={s.inputIcon} />
          <TextInput style={s.input} placeholder="Enter your full name" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />
        </View>
        <Text style={s.label}>College Email</Text>
        <View style={s.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#9ca3af" style={s.inputIcon} />
          <TextInput style={s.input} placeholder="email@university.edu" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
        </View>
        <Text style={s.label}>Select Role</Text>
        <View style={s.roleRow}>
          {ROLE_OPTIONS.map((r) => {
            const active = role === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                style={[s.roleCard, active && s.roleCardActive]}
                onPress={() => setRole(r.value)}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={r.icon}
                  size={28}
                  color={active ? "#16a34a" : "#94a3b8"}
                />
                <Text style={[s.roleLabel, active && s.roleLabelActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {role ? (
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#16a34a" style={{ marginTop: 1 }} />
            <Text style={s.infoText}>
              {role === "student"
                ? "Student access allows you to submit campus repair requests and track maintenance updates in real-time."
                : role === "teacher"
                ? "Teachers must use a @vcet.edu.in email address."
                : "Maintenance staff can use any valid email address."}
            </Text>
          </View>
        ) : null}
        <Text style={s.label}>Password</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={s.inputIcon} />
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry={!showPass} editable={!loading} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
            <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <Text style={s.label}>Confirm Password</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={s.inputIcon} />
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#9ca3af" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} editable={!loading} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)} disabled={loading} activeOpacity={0.7}>
          <View style={[s.checkbox, agreedToTerms && s.checkboxChecked]}>
            {agreedToTerms && <Ionicons name="checkmark" size={13} color="#ffffff" />}
          </View>
          <Text style={s.termsText}>
            I have read and agree to the{" "}
            <Text style={s.termsLink} onPress={(e) => { e.stopPropagation(); router.push("/terms-and-conditions" as any); }}>Terms & Conditions</Text>
          </Text>
        </TouchableOpacity>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
        <TouchableOpacity style={[s.signupBtn, (loading || !agreedToTerms) && s.btnDisabled]} onPress={handleSignup} disabled={loading || !agreedToTerms} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.signupBtnText}>Sign Up</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.loginRow} onPress={() => router.replace("/login")} disabled={loading}>
          <Text style={s.loginText}>Already have an account? </Text>
          <Text style={s.loginLink}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.footerRow} onPress={() => router.push("/terms-and-conditions" as any)}>
          <Text style={s.footerText}>Terms & Conditions</Text>
          <Text style={s.footerDot}> · </Text>
          <Text style={s.footerText}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer: { flexGrow: 1, backgroundColor: "#ffffff", paddingHorizontal: 20, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  titleSection: { paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 16 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 14 },
  eyeBtn: { padding: 6 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleCard: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 20, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#e2e8f0", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  roleCardActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  roleLabel: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  roleLabelActive: { color: "#16a34a", fontWeight: "700" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#bbf7d0" },
  infoText: { fontSize: 13, color: "#16a34a", fontWeight: "400", flex: 1, lineHeight: 20 },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, paddingVertical: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#d1d5db", backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  termsText: { fontSize: 13, color: "#374151", flex: 1, lineHeight: 20 },
  termsLink: { color: "#16a34a", fontWeight: "700", textDecorationLine: "underline" },
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, textAlign: "center", fontWeight: "500" },
  signupBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 20 },
  btnDisabled: { opacity: 0.45 },
  signupBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  loginText: { fontSize: 14, color: "#64748b" },
  loginLink: { fontSize: 14, color: "#16a34a", fontWeight: "700" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 12, color: "#94a3b8" },
  footerDot: { fontSize: 12, color: "#cbd5e1" },
});