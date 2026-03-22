import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, StatusBar, Image,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";
import { authAPI } from "../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    setResetMessage("");
    if (!email.trim()) return setError("Please enter your email.");
    if (!password) return setError("Please enter your password.");
    setLoading(true);
    try {
      const data = await authAPI.login(email.trim(), password);
      await signInWithCustomToken(auth, data.token);
      const snap = await getDoc(doc(db, "users", data.user.uid));
      if (!snap.exists()) { setError("User record not found."); await auth.signOut(); return; }
      const userData = snap.data();
      if (userData.role === "staff" && userData.verificationStatus === "approved") {
        router.replace("/staff-dashboard");
      } else if (userData.profileCompleted) {
        router.replace("/");
      } else {
        router.replace("/complete-profile");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");
    if (!email.trim()) return setError("Enter your email above, then tap Forgot Password.");
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setResetMessage("OTP sent to your email!");
      setTimeout(() => {
        router.push({
          pathname: "/otp-verification",
          params: { email: email.trim(), fullName: "User", password: "", role: "", type: "password-reset" },
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={s.outer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} bounces={false}>
        <View style={s.heroSection}>
          <View style={s.logoWrap}>
            <Image source={require("../assets/images/logo.png")} style={s.logoImg} resizeMode="contain" />
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.formSection}>
          <Text style={s.formTitle}>Welcome Back</Text>
          <Text style={s.formSubtitle}>Sign in to your account</Text>

          <Text style={s.label}>Email Address</Text>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={17} color="#9ca3af" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="name@college.edu"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.passwordLabelRow}>
            <Text style={s.label}>Password</Text>
            <TouchableOpacity onPress={handleForgotPassword} disabled={forgotLoading}>
              {forgotLoading
                ? <ActivityIndicator size="small" color="#16a34a" />
                : <Text style={s.forgotText}>Forgot password?</Text>}
            </TouchableOpacity>
          </View>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={17} color="#9ca3af" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
          {resetMessage ? <View style={s.successBox}><Text style={s.successText}>{resetMessage}</Text></View> : null}

          <TouchableOpacity style={[s.loginBtn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginBtnText}>Log In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.signupRow} onPress={() => router.replace("/signup")}>
            <Text style={s.signupText}>{"Don't have an account?"} </Text>
            <Text style={s.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footerWrap}>
          <Text style={s.footerLabel}>By continuing, you agree to our</Text>
          <TouchableOpacity onPress={() => router.push("/terms-and-conditions" as any)}>
            <Text style={s.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer: { flexGrow: 1, backgroundColor: "#ffffff", paddingHorizontal: 24, paddingBottom: 32 },
  heroSection: { alignItems: "center", paddingTop: 60, paddingBottom: 24 },
  logoWrap: { width: 90, height: 90, borderRadius: 50, backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center", overflow: "hidden", shadowColor: "#16a34a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  logoImg: { width: 88, height: 88 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 24 },
  formSection: { width: "100%", marginBottom: 20 },
  formTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 4, letterSpacing: -0.3 },
  formSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 14 },
  passwordLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 14 },
  eyeBtn: { padding: 6 },
  forgotText: { color: "#16a34a", fontSize: 13, fontWeight: "600" },
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, textAlign: "center", fontWeight: "500" },
  successBox: { backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  successText: { color: "#16a34a", fontSize: 13, textAlign: "center", fontWeight: "500" },
  loginBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 22 },
  btnDisabled: { opacity: 0.55 },
  loginBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  signupText: { fontSize: 14, color: "#64748b" },
  signupLink: { fontSize: 14, color: "#16a34a", fontWeight: "700" },
  footerWrap: { alignItems: "center", gap: 4, paddingTop: 8 },
  footerLabel: { fontSize: 12, color: "#94a3b8" },
  footerLink: { fontSize: 12, color: "#16a34a", fontWeight: "700", textDecorationLine: "underline" },
});