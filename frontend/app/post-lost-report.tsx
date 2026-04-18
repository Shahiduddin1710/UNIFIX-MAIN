import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, StatusBar,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";
import { lostReportsAPI } from "../services/api";

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const CATEGORIES = ["Phone", "Laptop", "ID Card", "Keys", "Wallet", "Bag", "Bottle", "Other"];

const ROOM_MAP: Record<string, string> = {
  "003A": "Photocopy Center", "003": "First Aid / Counselling Room", "004": "Conference Room",
  "007": "Basic Workshop", "008": "Machine Shop", "009": "Seminar Hall",
  "013": "Thermal Engineering Lab", "014": "Theory of Machines Lab", "015": "Refrigeration & AC Lab",
  "016": "HOD Civil Engineering", "017": "Geotechnics Lab", "019": "Transportation Engineering Lab",
  "020": "Fluid Mechanics Lab", "021": "Applied Hydraulics Lab", "022": "Basic Workshop II",
  "023": "Material Testing Lab", "024": "HOD Mechanical Engineering",
  "101": "Administrative Office", "102": "Principal's Office", "104": "Principal's Office",
  "112": "CAD Center", "113": "Computer Lab B", "114": "Networking & DevOps Lab",
  "115": "Programming & Project Lab", "117": "Environmental Engineering Lab",
  "118": "Meeting Room", "119": "Faculty Room", "120": "Robotics Lab", "121": "Robotics Lab",
  "123": "Project Lab", "124": "Measurement & Automation Lab", "127": "Joint Director Office",
  "201": "Cubicles / Staff Room", "202": "HOD Computers", "209": "HOD IT",
  "212": "Ladies Staff Room", "213": "NSS / Dept Office", "214": "Classroom 1",
  "215": "Classroom 2", "216": "Classroom 3", "217": "Faculty Room", "218": "Classroom",
  "219": "Computer Center", "220": "Computer Center", "221": "Computer Center",
  "222": "Computer Center", "223": "Computer Center", "224": "Language Lab",
  "301": "Gymkhana", "302": "Gymkhana", "306": "Server Room", "307": "CSEDS Staff Room",
  "312": "Tutorial Room", "313": "Classroom", "314": "Classroom", "315": "Classroom",
  "318": "Seminar Hall", "319": "Physics Lab", "320": "Classroom", "321": "Classroom",
  "322": "Chemistry Lab", "323": "Classroom",
  "401": "EXTC / VLSI Lab", "402": "EXTC / VLSI Lab", "406": "HOD EXTC Cabin",
  "414": "Tutorial Room", "415": "Classroom", "416": "Classroom", "417": "Classroom",
  "420": "Classroom", "421": "Drawing Hall", "422": "Classroom", "423": "Classroom",
  "501": "Staff Room", "502": "Staff Room", "503": "Staff Room",
  "515": "Classroom", "516": "Classroom", "517": "Classroom", "518": "MMS Staff Room",
  "519": "Classroom", "520": "Classroom", "527": "Student Activity Room",
};

async function uploadToCloudinary(uri: string, fileName: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", { uri, type: "image/jpeg", name: fileName } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "unifix/lostReports");
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

function isValidDate(dateStr: string): boolean {
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12) return false;
  
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (inputDate > today) return false;
  
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  return inputDate >= fourteenDaysAgo;
}

export default function PostLostReportScreen() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [resolvedRoom, setResolvedRoom] = useState<{ label: string } | null>(null);
  const [roomError, setRoomError] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [dateError, setDateError] = useState("");
  const [howToReach, setHowToReach] = useState("");
  const [photo, setPhoto] = useState<{ uri: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login" as any);
    });
    return () => unsub();
  }, []);

  const handleRoomInput = (val: string) => {
    setRoomInput(val);
    setRoomError("");
    if (!val.trim()) { setResolvedRoom(null); return; }
    const key = val.trim().toUpperCase() === "003A" ? "003A" : val.trim();
    if (ROOM_MAP[key]) setResolvedRoom({ label: ROOM_MAP[key] });
    else {
      setResolvedRoom(null);
      if (val.trim().length >= 3) setRoomError("Invalid room number.");
    }
  };

  const handleDateInput = (val: string) => {
    let digits = val.replace(/\D/g, "");
    
    if (digits.length > 8) {
      digits = digits.slice(0, 8);
    }
    
    let formatted = "";
    if (digits.length > 0) {
      formatted = digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += "/" + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += "/" + digits.slice(4, 8);
    }
    
    setDateLost(formatted);
    setDateError("");
    
    if (formatted.length === 10 && !isValidDate(formatted)) {
      setDateError("Date must be within last 14 days and not in future.");
    }
  };

  const pickPhoto = async () => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) { Alert.alert("Permission Required", "Please allow camera access."); return; }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPhoto({ uri: asset.uri, name: asset.uri.split("/").pop() || `lostreport_${Date.now()}.jpg` });
          } catch { Alert.alert("Error", "Failed to open camera."); }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) { Alert.alert("Permission Required", "Please allow photo library access."); return; }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPhoto({ uri: asset.uri, name: asset.uri.split("/").pop() || `lostreport_${Date.now()}.jpg` });
          } catch { Alert.alert("Error", "Failed to pick photo."); }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!itemName.trim()) return setError("Please enter the item name.");
    if (!description.trim()) return setError("Please describe the item.");
    if (!resolvedRoom) return setError("Please enter a valid room number.");
    if (!dateLost.trim()) return setError("Please enter the date you lost it.");
    if (!isValidDate(dateLost)) return setError("Enter valid date. Cannot be future date.");
    if (!howToReach.trim()) return setError("Please mention how people can reach you.");
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        setUploadingPhoto(true);
        imageUrl = await uploadToCloudinary(photo.uri, photo.name);
        setUploadingPhoto(false);
      }
      await lostReportsAPI.post({
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        locationLost: `Room ${roomInput.trim()} — ${resolvedRoom.label}`,
        dateLost: dateLost.trim(),
        howToReach: howToReach.trim(),
        images: imageUrl ? [imageUrl] : [],
      });
      router.replace({ pathname: "/lost-and-found", params: { openTab: "lostreports" } } as any);
    } catch (err: any) {
      setError(err.message || "Failed to post. Check your connection.");
    } finally { setSubmitting(false); setUploadingPhoto(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post Lost Report</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.photoCard} onPress={pickPhoto} activeOpacity={0.85}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={s.photoImage} resizeMode="cover" />
            ) : (
              <View style={s.photoPlaceholder}>
                <View style={s.photoIconWrap}>
                  <Ionicons name="camera-outline" size={28} color="#16a34a" />
                  <View style={s.photoPlusBadge}>
                    <Ionicons name="add" size={13} color="#fff" />
                  </View>
                </View>
                <Text style={s.photoPlaceholderTitle}>Upload Image (Optional)</Text>
                <Text style={s.photoPlaceholderSub}>Add a photo to help identify your item</Text>
                <View style={s.selectFileBtn}>
                  <Text style={s.selectFileBtnText}>Select File</Text>
                </View>
                <Text style={s.photoFormats}>JPG, PNG up to 5MB</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Item Information</Text>
            <Text style={s.label}>Item Name</Text>
            <TextInput style={s.input} placeholder="e.g. Black iPhone 14" placeholderTextColor="#9ca3af" value={itemName} onChangeText={setItemName} />
            <Text style={s.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[s.catChip, category === c && s.catChipActive]} onPress={() => setCategory(c)}>
                  <Text style={[s.catChipText, category === c && s.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.label}>Description</Text>
            <TextInput style={[s.input, s.textarea]} placeholder="Color, brand, model, any unique marks..." placeholderTextColor="#9ca3af" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Where & When</Text>
            <Text style={s.label}>Where Lost (Room Number)</Text>
            <View style={[s.inputWrap, resolvedRoom ? s.inputWrapSuccess : roomError ? s.inputWrapError : null]}>
              <Ionicons name="location-outline" size={16} color={resolvedRoom ? "#16a34a" : "#94a3b8"} style={{ marginRight: 8 }} />
              <TextInput
                style={s.inputInner}
                placeholder="e.g. 319, 214, 003A"
                placeholderTextColor="#9ca3af"
                value={roomInput}
                onChangeText={handleRoomInput}
                autoCapitalize="characters"
                maxLength={5}
              />
            </View>
            {resolvedRoom && (
              <View style={s.resolvedBox}>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={s.resolvedText}>Room {roomInput} — {resolvedRoom.label}</Text>
              </View>
            )}
            {roomError ? (
              <View style={s.errorInlineBox}>
                <Ionicons name="alert-circle-outline" size={13} color="#dc2626" style={{ marginRight: 5 }} />
                <Text style={s.errorInlineText}>{roomError}</Text>
              </View>
            ) : null}
            <Text style={s.label}>Date Lost</Text>
            <TextInput style={[s.input, dateError ? { borderColor: "#dc2626" } : null]} placeholder="DD/MM/YYYY" placeholderTextColor="#9ca3af" value={dateLost} onChangeText={handleDateInput} keyboardType="numeric" maxLength={10} />
            {dateError ? (
              <View style={s.errorInlineBox}>
                <Ionicons name="alert-circle-outline" size={13} color="#dc2626" style={{ marginRight: 5 }} />
                <Text style={s.errorInlineText}>{dateError}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>How to Reach You</Text>
            <Text style={s.label}>Contact Info</Text>
            <TextInput style={[s.input, s.textarea]} placeholder="e.g. Call 9876543210, or find me in Classroom 319" placeholderTextColor="#9ca3af" value={howToReach} onChangeText={setHowToReach} multiline textAlignVertical="top" />
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={[s.submitBtn, submitting && s.btnDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.submitBtnText}>{uploadingPhoto ? "Uploading photo..." : "Publishing..."}</Text>
              </View>
            ) : (
              <Text style={s.submitBtnText}>Post Lost Report</Text>
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
  photoCard: { backgroundColor: "#f8fafc", borderRadius: 16, overflow: "hidden", minHeight: 200, borderWidth: 1.5, borderColor: "#e2e8f0", borderStyle: "dashed" },
  photoImage: { width: "100%", height: 220 },
  photoPlaceholder: { padding: 32, alignItems: "center", gap: 8 },
  photoIconWrap: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 8 },
  photoPlusBadge: { position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: 6, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  photoPlaceholderTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  photoPlaceholderSub: { fontSize: 13, color: "#64748b", textAlign: "center" },
  selectFileBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 22, marginTop: 4 },
  selectFileBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  photoFormats: { fontSize: 10, color: "#94a3b8", fontWeight: "600", letterSpacing: 0.3, marginTop: 4 },
  section: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#f1f5f9" },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 14, letterSpacing: -0.2 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0" },
  textarea: { height: 80, textAlignVertical: "top" },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: "#e2e8f0" },
  inputWrapSuccess: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  inputWrapError: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  inputInner: { flex: 1, fontSize: 15, color: "#0f172a" },
  catChip: { backgroundColor: "#f8fafc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1.5, borderColor: "#e2e8f0", marginBottom: 4 },
  catChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  catChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  catChipTextActive: { color: "#16a34a", fontWeight: "700" },
  resolvedBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 10, padding: 11, marginTop: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  resolvedText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  errorInlineBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: "#fecaca" },
  errorInlineText: { fontSize: 12, color: "#dc2626", fontWeight: "500" },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500", flex: 1 },
  submitBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  btnDisabled: { opacity: 0.55 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});