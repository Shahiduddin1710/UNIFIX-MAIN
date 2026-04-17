import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";

const BACKEND_URL = process.env.EXPO_PUBLIC_BASE_URL;
const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const SUB_ISSUES: Record<string, string[]> = {
  electrical: ["Projector not working", "AC not working", "Fan not working", "Light not working", "Power socket issue", "Wiring problem"],
  plumbing:   ["Water leakage", "Tap not working", "Blocked drain", "No water supply", "Broken pipe"],
  carpentry:  ["Broken desk", "Broken chair", "Door not closing", "Window damaged", "Cupboard broken", "Shelf damaged"],
  cleaning:   ["Classroom dirty", "Garbage not collected", "Floor not cleaned", "Dustbin full", "Bad smell"],
  technician: ["Computer not working", "Projector issue", "WiFi not working", "Printer issue", "Speaker not working", "Smart board issue"],
  safety:     ["Ragging", "Emergency", "Fire Hazard", "Broken Stairs", "Loose Railing", "Suspicious Activity", "Medical Emergency"],
  washroom:   ["Washroom dirty", "Water leakage in washroom", "No water supply", "Broken flush", "Broken door/lock", "Bad smell", "Blocked drain"],
  others:     [],
};

const CATEGORIES: { id: string; label: string; iconName: keyof typeof Ionicons.glyphMap }[] = [
  { id: "electrical", label: "Electrical", iconName: "flash-outline" },
  { id: "plumbing",   label: "Plumbing",   iconName: "water-outline" },
  { id: "carpentry",  label: "Furniture",  iconName: "hammer-outline" },
  { id: "cleaning",   label: "Cleaning",   iconName: "sparkles-outline" },
  { id: "technician", label: "Technician", iconName: "desktop-outline" },
  { id: "washroom",   label: "Washroom",   iconName: "man-outline" },
  { id: "safety",     label: "Safety",     iconName: "shield-outline" },
];

const ROOM_MAP: Record<string, string> = {
  "003A": "Photocopy Center", "003": "First Aid / Counselling Room", "004": "Conference Room",
  "005": "Ladies Toilet", "006": "Gents Toilet", "007": "Basic Workshop", "008": "Machine Shop",
  "009": "Seminar Hall", "010": "Lift Control Room", "011": "Gents Toilet", "012": "Ladies Toilet",
  "013": "Thermal Engineering Lab", "014": "Theory of Machines Lab", "015": "Refrigeration & AC Lab",
  "016": "HOD Civil Engineering", "017": "Geotechnics Lab", "018": "Building Material & Construction Technology Lab",
  "019": "Transportation Engineering Lab", "020": "Fluid Mechanics Lab", "021": "Applied Hydraulics Lab",
  "022": "Basic Workshop II", "023": "Material Testing Lab", "024": "HOD Mechanical Engineering",
  "101": "Administrative Office", "102": "Principal's Office", "104": "Principal's Office",
  "105": "Pantry", "106": "Record Room", "107": "Gents Toilet", "108": "Girls Room",
  "109": "Store Room", "111": "Store Room", "112": "CAD Center", "113": "Computer Lab B / Engineering",
  "114": "Networking & DevOps Lab", "115": "Programming & Project Lab", "116": "Gents Toilet",
  "117": "Environmental Engineering Lab", "118": "Meeting Room", "119": "Faculty Room",
  "120": "Robotics Lab", "121": "Robotics Lab", "122": "Room 122", "123": "Project Lab",
  "124": "Measurement & Automation / Maintenance Engineering Lab", "125": "Room 125",
  "126": "Room 126", "127": "Joint Director Office (Mr. VK Save)",
  "201": "Cubicles / Staff Room & Labs 1–3", "202": "HOD Computers", "203": "Handicap Toilet (M/F)",
  "204": "Ladies Toilet", "205": "Gents Toilet", "206": "UPS Room (Danger)", "207": "Room 207",
  "208": "Room 208", "209": "HOD IT", "210": "Room 210", "211": "Room 211",
  "212": "Ladies Staff Room", "213": "NSS / Dept Office", "214": "Classroom 1",
  "215": "Classroom 2", "216": "Classroom 3", "217": "Faculty Room", "218": "Classroom",
  "219": "Computer Center", "220": "Computer Center", "221": "Computer Center",
  "222": "Computer Center", "223": "Computer Center", "224": "Computer Center (Language Lab)",
  "301": "Gymkhana", "302": "Gymkhana", "303": "Room 303", "304": "Girls Toilet",
  "305": "Boys Toilet", "306": "Server Room", "307": "CSEDS Staff Room", "308": "CSEDS HOD / Labs",
  "309": "Lab", "310": "Boys Toilet", "311": "Girls Toilet", "312": "Tutorial Room",
  "313": "Classroom", "314": "Classroom", "315": "Classroom", "316": "Tutorial Room",
  "317": "Tutorial Room", "318": "Seminar Hall", "319": "Physics Lab", "320": "Classroom",
  "321": "Classroom", "322": "Chemistry Lab", "323": "Classroom",
  "401": "EXTC / VLSI Lab", "402": "EXTC / VLSI Lab", "403": "EXTC / VLSI Lab",
  "404": "Girls Toilet", "405": "Boys Toilet", "406": "HOD EXTC Cabin",
  "407": "EXTC / VLSI Lab", "408": "EXTC / VLSI Lab", "409": "EXTC / VLSI Lab",
  "410": "EXTC / VLSI Lab", "411": "EXTC / VLSI Lab", "412": "Boys Toilet", "413": "Girls Toilet",
  "414": "Tutorial Room", "415": "Classroom", "416": "Classroom", "417": "Classroom",
  "418": "Tutorial Room", "419": "Tutorial Room", "420": "Classroom", "421": "Drawing Hall",
  "422": "Classroom", "423": "Classroom", "424": "Classroom", "425": "Classroom", "426": "Tutorial Room",
  "501": "Staff Room", "502": "Staff Room", "503": "Staff Room", "504": "Girls Toilet",
  "505": "Boys Toilet", "512": "Boys Toilet", "513": "Girls Toilet", "514": "Tutorial Room",
  "515": "Classroom", "516": "Classroom", "517": "Classroom", "518": "MMS Staff Room",
  "519": "Classroom", "520": "Classroom", "527": "Student Activity Room (Council Room)",
};

function resolveRoom(input: string): { building: string; label: string } | null {
  const normalised = input.trim();
  if (normalised.toUpperCase() === "003A" && ROOM_MAP["003A"])
    return { building: "Ground Floor", label: ROOM_MAP["003A"] };
  if (ROOM_MAP[normalised]) {
    const num = parseInt(normalised.replace(/\D/g, ""), 10);
    const floor = Math.floor(num / 100);
    return { building: floor === 0 ? "Ground Floor" : `Floor ${floor}`, label: ROOM_MAP[normalised] };
  }
  return null;
}

async function uploadToCloudinary(uri: string, fileName: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", { uri, type: "image/jpeg", name: fileName } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "unifix/complaints");
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function SubmitComplaintScreen() {
  const params = useLocalSearchParams();
  const initCategory = (params.category as string) || "";

  const [selectedCategory, setSelectedCategory] = useState(initCategory);
  const [subIssue, setSubIssue] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [resolvedRoom, setResolvedRoom] = useState<{ building: string; label: string } | null>(null);
  const [roomError, setRoomError] = useState("");
  const [photo, setPhoto] = useState<{ uri: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

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
    const resolved = resolveRoom(val);
    if (resolved) setResolvedRoom(resolved);
    else {
      setResolvedRoom(null);
      if (val.trim().length >= 3) setRoomError("Room not found. Try e.g. 319, 214, 003A.");
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
            setPhoto({ uri: asset.uri, name: asset.uri.split("/").pop() || `complaint_${Date.now()}.jpg` });
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
            setPhoto({ uri: asset.uri, name: asset.uri.split("/").pop() || `complaint_${Date.now()}.jpg` });
          } catch { Alert.alert("Error", "Failed to pick photo."); }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

 const handleSubmit = async () => {
    setError("");
    // const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    // const hour = nowIST.getUTCHours();
    // if (hour < 8 || hour >= 20) { 
    //   return setError("Complaints can only be submitted between 8:00 AM and 8:00 PM.");
    // }
    const category = selectedCategory || "others";
    const finalSubIssue = subIssue || null;
    const finalCustom = issueTitle.trim() || null;
    if (!finalSubIssue && !finalCustom) return setError("Please select or describe the issue.");
    if (!resolvedRoom) return setError("Please enter a valid room number.");

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) { setError("Authentication error. Please login again."); return; }
      const freshToken = await user.getIdToken(true);

      let photoUrl: string | null = null;
      if (photo) {
        setUploadingPhoto(true);
        try {
          photoUrl = await uploadToCloudinary(photo.uri, photo.name);
        } catch {
          setError("Failed to upload photo. Please try again.");
          return;
        } finally {
          setUploadingPhoto(false);
        }
      }

      const response = await fetch(`${BACKEND_URL}/complaints/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({
          category,
          subIssue: finalSubIssue,
          customIssue: finalCustom,
          description: description.trim(),
          building: `${resolvedRoom.building} — Room ${roomInput.trim()}`,
          roomDetail: `${roomInput.trim()} — ${resolvedRoom.label}`,
          photoUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) { setError(data.error || data.message || "Failed to submit complaint."); return; }
      router.replace(`/complaint-success?ticketId=${data.ticketId}` as any);
    } catch (err: any) {
      if (err?.message?.includes("Network request failed")) {
        setError("Cannot reach server. Make sure you're on the same WiFi network.");
      } else {
        setError("Failed to submit. Please check your connection.");
      }
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  const subIssues = SUB_ISSUES[selectedCategory] || [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
      <View style={s.root}>
        <View style={s.heroSection}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.replace("/" as any)} style={s.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#0f172a" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Report Issue</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={s.progressDots}>
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
            <View style={s.dot} />
          </View>
          <Text style={s.pageTitle}>{"What's the issue?"}</Text>
          <Text style={s.pageSubtitle}>Please provide details about the maintenance request.</Text>
        </View>

        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>SELECT CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, active && s.catChipActive]}
                  onPress={() => { setSelectedCategory(cat.id); setSubIssue(""); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={cat.iconName} size={15} color={active ? "#ffffff" : "#374151"} />
                  <Text style={[s.catChipText, active && s.catChipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedCategory === "washroom" && (
            <View style={s.washroomNote}>
              <Ionicons name="information-circle-outline" size={14} color="#1d4ed8" style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={s.washroomNoteText}>Washroom requests are assigned to staff based on your gender for privacy.</Text>
            </View>
          )}

          {subIssues.length > 0 && (
            <>
              <Text style={s.fieldLabel}>Specific Issue</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {subIssues.map((issue) => (
                  <TouchableOpacity
                    key={issue}
                    style={[s.subChip, subIssue === issue && s.subChipActive]}
                    onPress={() => setSubIssue(subIssue === issue ? "" : issue)}
                  >
                    <Text style={[s.subChipText, subIssue === issue && s.subChipTextActive]}>{issue}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={s.fieldLabel}>Location</Text>
          <View style={[s.locationWrap, resolvedRoom ? s.locationWrapSuccess : roomError ? s.locationWrapError : null]}>
            <Ionicons
              name="location-outline"
              size={16}
              color={resolvedRoom ? "#16a34a" : "#9ca3af"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={s.locationInput}
              placeholder="Enter room number e.g. 214"
              placeholderTextColor="#9ca3af"
              value={roomInput}
              onChangeText={handleRoomInput}
              autoCapitalize="characters"
              maxLength={5}
            />
          </View>
          {resolvedRoom && (
            <View style={s.resolvedBox}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 5 }} />
              <Text style={s.resolvedText}>Room {roomInput} — {resolvedRoom.label}, {resolvedRoom.building}</Text>
            </View>
          )}
          {roomError ? (
            <View style={s.roomErrorBox}>
              <Ionicons name="alert-circle-outline" size={13} color="#dc2626" style={{ marginRight: 5 }} />
              <Text style={s.roomErrorText}>{roomError}</Text>
            </View>
          ) : null}

          <Text style={s.fieldLabel}>Description</Text>
          <TextInput
            style={s.textarea}
            placeholder="Describe the issue in detail..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={s.fieldLabel}>Add Photos</Text>
          <TouchableOpacity style={s.photoBox} onPress={pickPhoto} activeOpacity={0.85}>
            {photo ? (
              <View style={s.photoSelected}>
                <View style={s.photoSelectedIcon}>
                  <Ionicons name="image-outline" size={22} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.photoName} numberOfLines={1}>{photo.name}</Text>
                  <Text style={s.photoReady}>Ready to upload</Text>
                </View>
                <Text style={s.changeBtn}>Change</Text>
              </View>
            ) : (
              <View style={s.photoEmpty}>
                <View style={s.cameraIconWrap}>
                  <Ionicons name="camera-outline" size={22} color="#64748b" />
                </View>
                <Text style={s.photoEmptyText}>Upload photo or take a picture</Text>
              </View>
            )}
          </TouchableOpacity>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.submitBtn, submitting && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.submitBtnText}>{uploadingPhoto ? "Uploading photo..." : "Submitting..."}</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={s.submitBtnText}>Submit Report</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={s.disclaimer}>By submitting, you agree to our maintenance guidelines.</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  heroSection: { backgroundColor: "#e8f5e9", paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  progressDots: { flexDirection: "row", gap: 6, marginBottom: 16 },
  dot: { width: 24, height: 5, borderRadius: 3, backgroundColor: "#a7d7a9" },
  dotActive: { backgroundColor: "#16a34a", width: 32 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 6, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: "#4b5563", lineHeight: 20 },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#16a34a", letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  catScroll: { marginBottom: 4 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#e2e8f0", marginRight: 10 },
  catChipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  catChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  catChipTextActive: { color: "#ffffff" },
  washroomNote: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: "#bfdbfe" },
  washroomNoteText: { fontSize: 12, color: "#1d4ed8", lineHeight: 18, fontWeight: "500", flex: 1 },
  subChip: { backgroundColor: "#f8fafc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1.5, borderColor: "#e2e8f0" },
  subChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  subChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  subChipTextActive: { color: "#16a34a", fontWeight: "700" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 18 },
  locationWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 12 },
  locationWrapSuccess: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  locationWrapError: { borderColor: "#ef4444" },
  locationInput: { flex: 1, fontSize: 14, color: "#0f172a", paddingVertical: 13 },
  resolvedBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: "#bbf7d0" },
  resolvedText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  roomErrorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: "#fecaca" },
  roomErrorText: { fontSize: 12, color: "#dc2626" },
  textarea: { backgroundColor: "#ffffff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", height: 110, textAlignVertical: "top" },
  photoBox: { backgroundColor: "#ffffff", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", borderStyle: "dashed", paddingVertical: 28, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  photoEmpty: { alignItems: "center", gap: 10 },
  cameraIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  photoEmptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  photoSelected: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  photoSelectedIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  photoName: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  photoReady: { fontSize: 12, color: "#16a34a", marginTop: 2 },
  changeBtn: { color: "#16a34a", fontSize: 13, fontWeight: "700" },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginTop: 16, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500", flex: 1 },
  submitBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 28 },
  btnDisabled: { opacity: 0.55 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  disclaimer: { textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 14 },
});