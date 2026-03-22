import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, StatusBar,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { signInWithCustomToken } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";
import { authAPI } from "../services/api";

export default function OTPVerificationScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";
  const fullName = (params.fullName as string) || "";
  const password = (params.password as string) || "";
  const role = (params.role as string) || "";
  const type = (params.type as string) || "email-verification";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<any[]>([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (val: string, idx: number) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[idx] = cleaned;
    setOtp(newOtp);
    if (cleaned && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) return setError("Please enter the complete 6-digit OTP.");
    setLoading(true);
    try {
      if (type === "email-verification") {
        const data = await authAPI.verifyOtp(email, code, fullName, password, role);
        await signInWithCustomToken(auth, data.token);
        router.replace("/complete-profile");
      } else if (type === "password-reset") {
        await authAPI.validateResetOtp(email, code);
        router.push({ pathname: "/reset-password", params: { email, otp: code } });
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    try {
      await authAPI.resendOtp(email, fullName || "User", type === "email-verification" ? "email-verification" : "password-reset");
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={s.outer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace("/login")} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>UniFiX</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.heroSection}>
          <View style={s.iconWrap}>
            <Ionicons name="mail-unread-outline" size={28} color="#16a34a" />
          </View>
          <Text style={s.title}>Verify Email</Text>
          <Text style={s.subtitle}>{"We've sent a 6-digit code to"}</Text>
          <Text style={s.emailText}>{email}</Text>
        </View>

        <View style={s.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => { inputs.current[idx] = ref; }}
              style={[s.otpBox, digit ? s.otpBoxFilled : null]}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[s.verifyBtn, loading && s.btnDisabled]} onPress={handleVerifyOTP} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.verifyBtnText}>Verify Code</Text>}
        </TouchableOpacity>

        <View style={s.resendRow}>
          <Text style={s.resendLabel}>{"Didn't receive the code? "}</Text>
          {!canResend ? (
            <View style={s.timerWrap}>
              <Ionicons name="time-outline" size={13} color="#16a34a" style={{ marginRight: 3 }} />
              <Text style={s.timerText}>Resend in {timer}s</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={resending}>
              <Text style={s.resendLink}>{resending ? "Resending..." : "Resend OTP"}</Text>
            </TouchableOpacity>
          )}
        </View>

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
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 24 },
  otpBox: { flex: 1, height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#ffffff", textAlign: "center", fontSize: 22, fontWeight: "700", color: "#0f172a" },
  otpBoxFilled: { borderColor: "#16a34a", backgroundColor: "#f0fdf4", color: "#16a34a" },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500", flex: 1 },
  verifyBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 24 },
  btnDisabled: { opacity: 0.55 },
  verifyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: 16 },
  resendLabel: { fontSize: 13, color: "#64748b" },
  timerWrap: { flexDirection: "row", alignItems: "center" },
  timerText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  resendLink: { fontSize: 13, color: "#16a34a", fontWeight: "700" },
  backRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 4 },
  backText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
});