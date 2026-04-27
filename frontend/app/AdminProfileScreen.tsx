import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

interface ProfileScreenProps {
  adminData: any;
  allComplaints: any[];
}

export default function AdminProfileScreen({ adminData, allComplaints }: ProfileScreenProps) {
  const router = useRouter();
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
const [showCurrentPw, setShowCurrentPw] = useState(false);
const [showNewPw, setShowNewPw] = useState(false);
const [privacyVisible, setPrivacyVisible] = useState(false);
const [aboutVisible, setAboutVisible] = useState(false);

  const resolvedCount = allComplaints.filter((c) => c.status === "completed").length;
  const totalCount = allComplaints.length;
  const efficiency = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const flaggedCount = allComplaints.filter((c) => c.flagged && !c.flagResolved).length;

  function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await auth.signOut();
          router.replace("/login" as any);
        },
      },
    ]);
  }

async function handlePickPhoto() {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const formData = new FormData();
    const name = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
    formData.append("file", { uri, type: "image/jpeg", name } as any);
    formData.append("upload_preset", "unifix_upload");
    formData.append("folder", "unifix/profiles");
    const res = await fetch("https://api.cloudinary.com/v1_1/dcizaxjul/image/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    const url = data.secure_url;
    const u = auth.currentUser;
    if (u) {
      await updateDoc(doc(db, "users", u.uid), { photoUrl: url });
    }
    Alert.alert("Success", "Profile photo updated!");
  } catch (e: any) {
    Alert.alert("Error", e.message || "Failed to upload photo.");
  }
}

const MENU_ITEMS = [
  { icon: "shield-checkmark-outline", label: "Privacy Policy", color: "#3b82f6", onPress: () => setPrivacyVisible(true) },
  { icon: "information-circle-outline", label: "About UNIFIX", color: "#8b5cf6", onPress: () => setAboutVisible(true) },
];
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={styles.profileCard}>
         <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={styles.avatarWrap}>
  {adminData?.photoUrl ? (
    <Image source={{ uri: adminData.photoUrl }} style={[styles.avatar, { borderWidth: 2, borderColor: "#16a34a" }]} />
  ) : (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{adminData?.fullName?.[0]?.toUpperCase() ?? "A"}</Text>
    </View>
  )}
  <View style={[styles.onlineDot, { backgroundColor: "#16a34a", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" }]}>
    <Ionicons name="camera" size={11} color="#fff" />
  </View>
</TouchableOpacity>
          <Text style={styles.profileName}>{adminData?.fullName ?? "Admin"}</Text>
          <Text style={styles.profileEmail}>{adminData?.email ?? "admin@unifix.com"}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#16a34a" />
            <Text style={styles.roleBadgeText}>Administrator</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCenter]}>
            <Text style={[styles.statValue, { color: efficiency >= 70 ? "#16a34a" : "#f59e0b" }]}>{efficiency}%</Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: flaggedCount > 0 ? "#ef4444" : "#1a3c2e" }]}>{flaggedCount}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyVisible} animationType="slide" onRequestClose={() => setPrivacyVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
          <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", flexDirection: "row", alignItems: "center", gap: 14 }}>
            <TouchableOpacity onPress={() => setPrivacyVisible(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="arrow-back" size={20} color="#1a3c2e" />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#1a3c2e" }}>Privacy Policy</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {[
              { icon: "shield-checkmark", color: "#3b82f6", bg: "#eff6ff", title: "Data Collection", desc: "UNIFIX collects only the information necessary to manage campus complaints and maintenance requests. This includes your name, email, role, and complaint details submitted through the app." },
              { icon: "lock-closed", color: "#16a34a", bg: "#f0fdf4", title: "Data Security", desc: "All data is securely stored using Firebase and protected with industry-standard encryption. Access is restricted to authorized administrators and staff only." },
              { icon: "people", color: "#f59e0b", bg: "#fff7ed", title: "Data Sharing", desc: "Your data is never sold or shared with third parties. It is used exclusively for internal campus facility management at Vidyavardhini's College of Engineering & Technology." },
              { icon: "mail", color: "#ef4444", bg: "#fef2f2", title: "Contact", desc: "For any privacy-related concerns, contact the UNIFIX administrator at admin@unifix.com." },
            ].map((item, i) => (
              <View key={i} style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", gap: 14, alignItems: "flex-start", borderWidth: 1, borderColor: "#e2e8f0" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5, marginBottom: 4 }}>{item.title.toUpperCase()}</Text>
                  <Text style={{ fontSize: 13, color: "#475569", lineHeight: 20 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* About UNIFIX Modal */}
      <Modal visible={aboutVisible} animationType="slide" onRequestClose={() => setAboutVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
          <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", flexDirection: "row", alignItems: "center", gap: 14 }}>
            <TouchableOpacity onPress={() => setAboutVisible(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="arrow-back" size={20} color="#1a3c2e" />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#1a3c2e" }}>About UNIFIX</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <View style={{ backgroundColor: "#1a3c2e", borderRadius: 20, padding: 28, alignItems: "center", marginBottom: 16 }}>
            {adminData?.photoUrl ? (
  <Image source={{ uri: adminData.photoUrl }} style={{ width: 72, height: 72, borderRadius: 20, marginBottom: 14 }} resizeMode="cover" />
) : (
  <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: "#4ade80", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
    <Text style={{ fontSize: 28, fontWeight: "800", color: "#1a3c2e" }}>U</Text>
  </View>
)}
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#ffffff", marginBottom: 4 }}>UniFiX</Text>
              <Text style={{ fontSize: 13, color: "#4ade80", fontWeight: "600", marginBottom: 8 }}>Version 1.0.0</Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Campus Complaint & Maintenance Management System</Text>
            </View>
            {[
              { icon: "school", color: "#3b82f6", bg: "#eff6ff", title: "Institution", desc: "Vidyavardhini's College of Engineering & Technology, Vasai" },
              { icon: "construct", color: "#f59e0b", bg: "#fff7ed", title: "Purpose", desc: "Streamline campus facility management by enabling students, teachers, and staff to report and resolve maintenance issues efficiently." },
              { icon: "flash", color: "#8b5cf6", bg: "#f5f3ff", title: "Key Features", desc: "Role-based access · Real-time complaint tracking · Escalation system · Push notifications · Lost & Found · Anti-ragging module" },
              { icon: "server", color: "#16a34a", bg: "#f0fdf4", title: "Tech Stack", desc: "React Native · Node.js · Firebase Firestore · Cloudinary · Expo Push Notifications" },
              { icon: "calendar", color: "#ef4444", bg: "#fef2f2", title: "Released", desc: "April 2026 · Developed as a Final Year Project for B.E. Computer Engineering" },
            ].map((item, i) => (
              <View key={i} style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", gap: 14, alignItems: "flex-start", borderWidth: 1, borderColor: "#e2e8f0" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5, marginBottom: 4 }}>{item.title.toUpperCase()}</Text>
                  <Text style={{ fontSize: 13, color: "#475569", lineHeight: 20 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
            <Text style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Made with ❤️ for VCET</Text>
          </ScrollView>
        </View>
      </Modal>

     

      <Modal visible={pwModalVisible} animationType="slide" transparent onRequestClose={() => setPwModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.pwModalOverlay}>
          <View style={styles.pwModalSheet}>
            <View style={styles.pwModalHandle} />
            <Text style={styles.pwModalTitle}>Change Password</Text>

            <View style={styles.pwInputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
              <TextInput style={styles.pwInput} placeholder="Current password" placeholderTextColor="#9ca3af" secureTextEntry={!showCurrentPw} value={currentPassword} onChangeText={setCurrentPassword} />
              <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)}>
                <Ionicons name={showCurrentPw ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.pwInputWrap}>
              <Ionicons name="key-outline" size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
              <TextInput style={styles.pwInput} placeholder="New password" placeholderTextColor="#9ca3af" secureTextEntry={!showNewPw} value={newPassword} onChangeText={setNewPassword} />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Ionicons name={showNewPw ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

        

            {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}
            {pwSuccess ? <Text style={styles.pwSuccess}>{pwSuccess}</Text> : null}

           
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );

  
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0fdf4" },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#f0fdf4" },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#1a3c2e" },
  scroll: { flex: 1 },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#1a3c2e", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#ffffff" },
  onlineDot: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#16a34a", borderWidth: 2, borderColor: "#ffffff" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#1a3c2e", marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, borderColor: "#bbf7d0" },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  statsRow: { flexDirection: "row", marginHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardCenter: { borderTopWidth: 2, borderTopColor: "#16a34a" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#1a3c2e", marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  menuSection: { marginHorizontal: 20, backgroundColor: "#ffffff", borderRadius: 18, overflow: "hidden", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f8fafc", gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a3c2e" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  logoutBtnText: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
  version: { textAlign: "center", fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  pwModalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  pwModalSheet: { backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  pwModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 20 },
  pwModalTitle: { fontSize: 18, fontWeight: "800", color: "#1a3c2e", marginBottom: 20, textAlign: "center" },
  pwInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingRight: 14, marginBottom: 12, gap: 8 },
  pwInput: { flex: 1, padding: 13, fontSize: 14, color: "#1a3c2e" },
  pwError: { fontSize: 13, color: "#dc2626", fontWeight: "600", textAlign: "center", marginBottom: 10 },
  pwSuccess: { fontSize: 13, color: "#16a34a", fontWeight: "600", textAlign: "center", marginBottom: 10 },
  pwBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  pwCancelBtn: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  pwCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  pwSaveBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  pwSaveText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
});
