import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, StatusBar,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;

const YEARS = ["1", "2", "3", "4"];
const BRANCHES = ["Computer Engineering", "IT", "EXTC", "Mechanical", "Civil"];
const DEPARTMENTS = ["Computer", "IT", "EXTC", "Mechanical", "Civil"];
const DESIGNATIONS = ["Electrician", "Plumber", "Carpenter", "Technician", "Cleaner", "Safety Officer"];
const GENDERS: { value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "Male",   icon: "man-outline" },
  { value: "Female", icon: "woman-outline" },
  { value: "Other",  icon: "person-outline" },
];

async function uploadToCloudinary(uri: string, fileName: string, folder: string): Promise<string> {
  const formData = new FormData();
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
  formData.append("file", { uri, type: mime, name: fileName } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", `unifix/${folder}`);
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
}

function DropdownPicker({ label, options, selected, onSelect, iconName }: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ zIndex: open ? 99 : 1 }}>
      <TouchableOpacity style={[dp.trigger, open && dp.triggerOpen]} onPress={() => setOpen(!open)}>
        {iconName && <Ionicons name={iconName} size={16} color="#94a3b8" style={dp.triggerIcon} />}
        <Text style={selected ? dp.selected : dp.placeholder}>{selected || `Select ${label}`}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color="#94a3b8" />
      </TouchableOpacity>
      {open && (
        <View style={dp.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={[dp.option, selected === opt && dp.optionActive]} onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={[dp.optionText, selected === opt && dp.optionTextActive]}>{opt}</Text>
              {selected === opt && <Ionicons name="checkmark" size={14} color="#16a34a" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const dp = StyleSheet.create({
  trigger: { backgroundColor: "#ffffff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: "#e2e8f0", flexDirection: "row", alignItems: "center" },
  triggerOpen: { borderColor: "#16a34a" },
  triggerIcon: { marginRight: 10 },
  placeholder: { color: "#9ca3af", fontSize: 15, flex: 1 },
  selected: { color: "#0f172a", fontSize: 15, flex: 1 },
  dropdown: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5, overflow: "hidden" },
  option: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionActive: { backgroundColor: "#f0fdf4" },
  optionText: { fontSize: 14, color: "#374151" },
  optionTextActive: { color: "#16a34a", fontWeight: "700" },
});

type FileItem = { name: string; uri: string; preview?: string } | null;

function FileUploadBox({ label, file, onPick, iconName }: {
  label: string;
  file: FileItem;
  onPick: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity style={fu.box} onPress={onPick} activeOpacity={0.85}>
      {file ? (
        <View style={fu.fileRow}>
          {file.preview
            ? <Image source={{ uri: file.preview }} style={fu.preview} />
            : <View style={fu.fileIconWrap}><Ionicons name="document-outline" size={22} color="#16a34a" /></View>}
          <View style={{ flex: 1 }}>
            <Text style={fu.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={fu.fileReady}>Ready to upload</Text>
          </View>
          <Text style={fu.changeBtn}>Change</Text>
        </View>
      ) : (
        <View style={fu.empty}>
          <View style={fu.emptyIconWrap}>
            <Ionicons name={iconName} size={22} color="#16a34a" />
          </View>
          <Text style={fu.emptyLabel}>{label}</Text>
          <Text style={fu.emptyHint}>PNG, JPG up to 5MB</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const fu = StyleSheet.create({
  box: { backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", borderStyle: "dashed", padding: 20, minHeight: 80, justifyContent: "center" },
  empty: { alignItems: "center", gap: 6 },
  emptyIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyLabel: { color: "#374151", fontSize: 13, fontWeight: "600" },
  emptyHint: { color: "#94a3b8", fontSize: 12 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  fileIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  preview: { width: 44, height: 44, borderRadius: 10 },
  fileName: { color: "#0f172a", fontSize: 13, fontWeight: "600" },
  fileReady: { color: "#16a34a", fontSize: 12, marginTop: 2 },
  changeBtn: { color: "#16a34a", fontSize: 13, fontWeight: "700" },
});

function GenderSelector({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {GENDERS.map((g) => {
        const active = selected === g.value;
        return (
          <TouchableOpacity key={g.value} style={[gst.btn, active && gst.btnActive]} onPress={() => onSelect(g.value)} activeOpacity={0.85}>
            <Ionicons name={g.icon} size={22} color={active ? "#16a34a" : "#94a3b8"} />
            <Text style={[gst.label, active && gst.labelActive]}>{g.value}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const gst = StyleSheet.create({
  btn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff", gap: 6 },
  btnActive: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  label: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  labelActive: { color: "#16a34a", fontWeight: "700" },
});

export default function CompleteProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [gender, setGender] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");
  const [phone, setPhone] = useState("");
  const [idCard, setIdCard] = useState<FileItem>(null);
  const [certificate, setCertificate] = useState<FileItem>(null);
  const [teacherIdCard, setTeacherIdCard] = useState<FileItem>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login" as any); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "");
          if (data.role === "staff") {
            if (data.verificationStatus === "pending" && data.profileCompleted) setPendingApproval(true);
            else if (data.verificationStatus === "rejected") setRejectionMessage(data.rejectionMessage || "");
          }
        }
      } catch { setError("Failed to load profile data."); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const pickImage = async (setter: (f: FileItem) => void) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission Required", "Please allow photo library access."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const name = asset.uri.split("/").pop() || `file_${Date.now()}.jpg`;
      setter({ name, uri: asset.uri, preview: asset.uri });
    } catch { Alert.alert("Error", "Failed to pick image."); }
  };

  const pickDocument = async (setter: (f: FileItem) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "application/pdf"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      setter({ name: file.name, uri: file.uri });
    } catch { Alert.alert("Error", "Failed to pick file."); }
  };

  const pickFile = (setter: (f: FileItem) => void) => {
    Alert.alert("Upload From", "Choose source", [
      { text: "Photo Library", onPress: () => pickImage(setter) },
      { text: "Files (PDF/Doc)", onPress: () => pickDocument(setter) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validatePhone = (p: string) => /^[6-9]\d{9}$/.test(p);

  const handleSave = async () => {
    setError("");
    if (!gender) return setError("Please select your gender.");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!validatePhone(phone.trim())) return setError("Enter a valid 10-digit Indian mobile number.");
    if (role === "student") {
      if (!year) return setError("Please select your year.");
      if (!branch) return setError("Please select your branch.");
    }
    if (role === "teacher" && !department) return setError("Please select your department.");
    if (role === "staff") {
      if (!employeeId.trim()) return setError("Employee ID is required.");
      if (!designation) return setError("Please select your designation.");
      if (!experience.trim()) return setError("Years of experience is required.");
      if (!idCard) return setError("Please upload your ID card.");
      if (!certificate) return setError("Please upload your employee certificate.");
    }
    if (!user) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = { phone: phone.trim(), gender, profileCompleted: true };
      if (role === "student") {
        updateData.year = year;
        updateData.branch = branch;
        if (rollNumber.trim()) updateData.rollNumber = rollNumber.trim();
        if (idCard) {
          setUploadStatus("Uploading Student ID...");
          const url = await uploadToCloudinary(idCard.uri, idCard.name, "student_documents");
          updateData.studentIdCardUrl = url;
          updateData.studentIdCardName = idCard.name;
        }
      }
      if (role === "teacher") {
        updateData.department = department;
        if (teacherId.trim()) updateData.teacherId = teacherId.trim();
        if (teacherIdCard) {
          setUploadStatus("Uploading Teacher ID...");
          const url = await uploadToCloudinary(teacherIdCard.uri, teacherIdCard.name, "teacher_documents");
          updateData.teacherIdCardUrl = url;
          updateData.teacherIdCardName = teacherIdCard.name;
        }
      }
      if (role === "staff") {
        setUploadStatus("Uploading ID card...");
        const idCardUrl = await uploadToCloudinary(idCard!.uri, idCard!.name, "staff_documents");
        setUploadStatus("Uploading certificate...");
        const certificateUrl = await uploadToCloudinary(certificate!.uri, certificate!.name, "staff_documents");
        setUploadStatus("Saving profile...");
        updateData.employeeId = employeeId.trim();
        updateData.designation = designation;
        updateData.experience = experience.trim();
        updateData.idCardUrl = idCardUrl;
        updateData.idCardName = idCard!.name;
        updateData.certificateUrl = certificateUrl;
        updateData.certificateName = certificate!.name;
        updateData.verificationStatus = "pending";
        updateData.rejectionMessage = null;
      }
      await updateDoc(doc(db, "users", user.uid), updateData);
      if (role === "staff") setPendingApproval(true);
      else router.replace("/" as any);
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  };

  const roleIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    student: "school-outline",
    teacher: "person-outline",
    staff:   "construct-outline",
  };

  if (loading) return <View style={s.loader}><ActivityIndicator size="large" color="#16a34a" /></View>;

  if (pendingApproval) {
    return (
      <View style={s.pendingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={s.pendingHeader}>
          <TouchableOpacity onPress={() => router.replace("/login" as any)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.pendingHeaderTitle}>Staff Verification</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.pendingScroll} showsVerticalScrollIndicator={false}>
          <View style={s.pendingCard}>
            <View style={s.pendingBadge}><Text style={s.pendingBadgeText}>PENDING APPROVAL</Text></View>
            <Text style={s.pendingTitle}>Verification in{"\n"}Progress</Text>
            <Text style={s.pendingDesc}>Your account is under review. Please wait up to 24 hours for admin approval.</Text>
            <View style={s.pendingIcons}>
              {[
                { iconName: "shield-checkmark-outline" as keyof typeof Ionicons.glyphMap, label: "SECURE" },
                { iconName: "time-outline"             as keyof typeof Ionicons.glyphMap, label: "24 HOURS" },
                { iconName: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap, label: "VERIFIED" },
              ].map((item) => (
                <View key={item.label} style={s.pendingIconItem}>
                  <View style={s.pendingIconCircle}>
                    <Ionicons name={item.iconName} size={24} color="#16a34a" />
                  </View>
                  <Text style={s.pendingIconLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity style={s.backToLoginBtn} onPress={async () => { await auth.signOut(); router.replace("/login" as any); }} activeOpacity={0.85}>
            <Text style={s.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
          <Text style={s.pendingFooter}>UNIFIX • MAINTENANCE PORTAL</Text>
        </ScrollView>
      </View>
    );
  }

  const roleLabel = role === "student" ? "Student Information" : role === "teacher" ? "Teacher Information" : "Maintenance Staff Information";
  const roleSubtitle = role === "student" ? "Please fill in your academic details to continue" : role === "teacher" ? "Please provide your professional details to continue" : "Profile Verification Required";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace("/login" as any)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Complete Your Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          {rejectionMessage ? (
            <View style={s.rejectionBanner}>
              <Text style={s.rejectionTitle}>Profile Rejected</Text>
              <Text style={s.rejectionMsg}>{rejectionMessage}</Text>
              <Text style={s.rejectionHint}>Please update your details and resubmit.</Text>
            </View>
          ) : null}
          <View style={s.roleHeader}>
            <View style={s.roleIconCircle}>
              <Ionicons name={roleIconMap[role] || "person-outline"} size={24} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.roleLabelSmall}>{role === "staff" ? "STAFF ROLE" : ""}</Text>
              <Text style={s.roleTitleText}>{roleLabel}</Text>
              <Text style={s.roleSubtitleText}>{roleSubtitle}</Text>
            </View>
          </View>

          <Text style={s.label}>Gender</Text>
          <GenderSelector selected={gender} onSelect={setGender} />

          <Text style={s.label}>Phone Number</Text>
          <View style={s.inputWrap}>
            <Ionicons name="call-outline" size={16} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="+91 9876543210" placeholderTextColor="#9ca3af" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
          </View>

          {role === "student" && (
            <>
              <Text style={s.label}>Branch / Course</Text>
              <DropdownPicker label="Branch" options={BRANCHES} selected={branch} onSelect={setBranch} iconName="library-outline" />
              <Text style={s.label}>Year</Text>
              <DropdownPicker label="Select Year" options={YEARS} selected={year} onSelect={setYear} iconName="calendar-outline" />
              <Text style={s.label}>Roll Number</Text>
              <View style={s.inputWrap}>
                <Ionicons name="id-card-outline" size={16} color="#94a3b8" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Enter Roll Number" placeholderTextColor="#9ca3af" value={rollNumber} onChangeText={setRollNumber} />
              </View>
              <Text style={s.label}>Student ID Card</Text>
              <FileUploadBox label="Upload Student ID Card" iconName="cloud-upload-outline" file={idCard} onPick={() => pickFile(setIdCard)} />
            </>
          )}

          {role === "teacher" && (
            <>
              <Text style={s.label}>Department</Text>
              <DropdownPicker label="Department" options={DEPARTMENTS} selected={department} onSelect={setDepartment} iconName="business-outline" />
              <Text style={s.label}>Teacher ID / Staff ID</Text>
              <View style={s.inputWrap}>
                <Ionicons name="card-outline" size={16} color="#94a3b8" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Enter ID e.g. T-2024-001" placeholderTextColor="#9ca3af" value={teacherId} onChangeText={setTeacherId} />
              </View>
              <Text style={s.label}>Teacher ID Card</Text>
              <FileUploadBox label="Upload Teacher ID Card" iconName="id-card-outline" file={teacherIdCard} onPick={() => pickFile(setTeacherIdCard)} />
            </>
          )}

          {role === "staff" && (
            <>
              <Text style={s.label}>Employee ID</Text>
              <View style={s.inputWrap}>
                <Ionicons name="card-outline" size={16} color="#94a3b8" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Enter ID number" placeholderTextColor="#9ca3af" value={employeeId} onChangeText={setEmployeeId} autoCapitalize="characters" />
              </View>
              <Text style={s.label}>Designation</Text>
              <DropdownPicker label="Select your trade" options={DESIGNATIONS} selected={designation} onSelect={setDesignation} iconName="construct-outline" />
              <Text style={s.label}>Years of Experience</Text>
              <View style={s.inputWrap}>
                <Ionicons name="briefcase-outline" size={16} color="#94a3b8" style={s.inputIcon} />
                <TextInput style={s.input} placeholder="e.g. 5" placeholderTextColor="#9ca3af" value={experience} onChangeText={setExperience} keyboardType="number-pad" maxLength={2} />
              </View>
              <View style={s.uploadRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>National ID Card</Text>
                  <FileUploadBox label="Upload ID Card" iconName="id-card-outline" file={idCard} onPick={() => pickFile(setIdCard)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Certificate/License</Text>
                  <FileUploadBox label="Upload Certificate" iconName="document-text-outline" file={certificate} onPick={() => pickFile(setCertificate)} />
                </View>
              </View>
            </>
          )}

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <TouchableOpacity style={[s.saveBtn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.saveBtnText}>{uploadStatus || "Saving..."}</Text>
              </View>
            ) : (
              <Text style={s.saveBtnText}>Save Profile</Text>
            )}
          </TouchableOpacity>
          <Text style={s.footer}>UNIFIX PLATFORM</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  root: { flex: 1, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  rejectionBanner: { backgroundColor: "#fef2f2", borderLeftWidth: 4, borderLeftColor: "#dc2626", borderRadius: 10, padding: 16, marginBottom: 20 },
  rejectionTitle: { color: "#dc2626", fontWeight: "700", fontSize: 14, marginBottom: 4 },
  rejectionMsg: { color: "#7f1d1d", fontSize: 13, lineHeight: 20, marginBottom: 4 },
  rejectionHint: { color: "#b91c1c", fontSize: 12 },
  roleHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20, backgroundColor: "#f0fdf4", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#bbf7d0" },
  roleIconCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" },
  roleLabelSmall: { fontSize: 10, fontWeight: "700", color: "#16a34a", letterSpacing: 0.5, marginBottom: 2 },
  roleTitleText: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  roleSubtitleText: { fontSize: 12, color: "#64748b", marginTop: 2 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 16 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 14 },
  uploadRow: { flexDirection: "row", gap: 12 },
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginTop: 16, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, textAlign: "center", fontWeight: "500" },
  saveBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 28, flexDirection: "row", justifyContent: "center" },
  btnDisabled: { opacity: 0.55 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 11, color: "#94a3b8", fontWeight: "600", letterSpacing: 1.5, marginTop: 28 },
  pendingRoot: { flex: 1, backgroundColor: "#ffffff" },
  pendingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pendingHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  pendingScroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 },
  pendingCard: { backgroundColor: "#f8fafc", borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", marginBottom: 24 },
  pendingBadge: { backgroundColor: "#fef3c7", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 24, borderWidth: 1, borderColor: "#fde68a" },
  pendingBadgeText: { fontSize: 11, fontWeight: "700", color: "#d97706", letterSpacing: 0.8 },
  pendingTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a", textAlign: "center", lineHeight: 34, marginBottom: 14, letterSpacing: -0.3 },
  pendingDesc: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  pendingIcons: { flexDirection: "row", gap: 28 },
  pendingIconItem: { alignItems: "center", gap: 8 },
  pendingIconCircle: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  pendingIconLabel: { fontSize: 10, fontWeight: "700", color: "#64748b", letterSpacing: 0.5 },
  backToLoginBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 20 },
  backToLoginText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  pendingFooter: { textAlign: "center", fontSize: 11, color: "#94a3b8", fontWeight: "600", letterSpacing: 1.5 },
});