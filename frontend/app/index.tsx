import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, StatusBar, RefreshControl, Image, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, Linking,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../firebase/firebaseConfig";
import { authAPI, complaintsAPI, lostFoundAPI } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

async function uploadToCloudinary(uri: string, folder: string): Promise<string> {
  const formData = new FormData();
  const name = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
  formData.append("file", { uri, type: "image/jpeg", name } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", folder);
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

type TabType = "home" | "lostfound" | "complaints" | "profile";
type FilterTab = "all" | "pending" | "resolved";
type ProfileScreen = "main" | "personalInfo" | "changePassword" | "reportSecurity";

type UserData = {
  fullName: string; email: string; role: string; phone?: string;
  year?: string; branch?: string; department?: string;
  employeeId?: string; designation?: string; experience?: string;
  photoUrl?: string; gender?: string;
  studentIdCardUrl?: string; teacherIdCardUrl?: string;
  rollNumber?: string; teacherId?: string;
};

type Complaint = {
  id: string; ticketId: string; category: string;
  subIssue: string | null; customIssue: string | null;
  description: string; building: string; roomDetail: string;
  status: string; queueStatus?: string; createdAt: any;
  assignedToName: string | null; assignedToPhone: string | null;
  photoUrl?: string | null; rating?: number | null;
  ratingComment?: string | null; ratedAt?: any;
};

type LostItem = {
  id: string; itemName: string; category: string; description: string;
  roomNumber: string; roomLabel: string; collectLocation: string;
  photoUrl: string | null; postedByName: string; createdAt: any;
  status: string; isMyPost: boolean; handedToName?: string; handedAt?: any;
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending:     { color: "#d97706", bg: "#fef3c7", label: "Pending",     dot: "#d97706", icon: "time-outline" },
  assigned:    { color: "#2563eb", bg: "#dbeafe", label: "Assigned",    dot: "#2563eb", icon: "person-outline" },
  in_progress: { color: "#7c3aed", bg: "#ede9fe", label: "In Progress", dot: "#7c3aed", icon: "reload-outline" },
  completed:   { color: "#16a34a", bg: "#dcfce7", label: "Completed",   dot: "#16a34a", icon: "checkmark-circle" },
  rejected:    { color: "#dc2626", bg: "#fef2f2", label: "Rejected",    dot: "#dc2626", icon: "close-circle-outline" },
};

const PROGRESS_STEPS = ["pending", "assigned", "in_progress", "completed"];
const STEP_LABELS = ["Pending", "Assigned", "In Progress", "Done"];

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  electrical: "flash-outline",
  plumbing: "water-outline",
  carpentry: "hammer-outline",
  cleaning: "sparkles-outline",
  technician: "desktop-outline",
  safety: "shield-outline",
  others: "clipboard-outline",
};

function formatAgo(ts: any): string {
  if (!ts) return "";
  const seconds = ts._seconds ?? ts.seconds ?? (typeof ts === "number" ? ts : null);
  if (!seconds) return "";
  const diff = Math.floor((Date.now() / 1000) - seconds);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(ts: any): string {
  if (!ts) return "—";
  let ms: number | null = null;
  if (typeof ts === "number") ms = ts * 1000;
  else if (ts?.toDate) ms = ts.toDate().getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(ts: any): string {
  if (!ts) return "—";
  let ms: number | null = null;
  if (typeof ts === "number") ms = ts * 1000;
  else if (ts?.toDate) ms = ts.toDate().getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [userData, setUserData]               = useState<UserData | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [activeTab, setActiveTab]             = useState<TabType>("home");
  const [profileScreen, setProfileScreen]     = useState<ProfileScreen>("main");
  const tokenRef                              = useRef("");
  const router                                = useRouter();
  const unsubComplaintsRef                    = useRef<(() => void) | null>(null);

  const [complaints, setComplaints]           = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [filterTab, setFilterTab]             = useState<FilterTab>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [trackingVisible, setTrackingVisible] = useState(false);

  const [ratingComplaint, setRatingComplaint] = useState<Complaint | null>(null);
  const [ratingVisible, setRatingVisible]     = useState(false);
  const [selectedStars, setSelectedStars]     = useState(0);
  const [ratingComment, setRatingComment]     = useState("");
  const [ratingLoading, setRatingLoading]     = useState(false);
  const [ratingError, setRatingError]         = useState("");

  const [feedItems, setFeedItems]             = useState<LostItem[]>([]);
  const [myPosts, setMyPosts]                 = useState<LostItem[]>([]);
  const [lfTab, setLfTab]                     = useState<"feed" | "myposts">("feed");
  const [lfLoading, setLfLoading]             = useState(false);
  const [handoverItem, setHandoverItem]       = useState<LostItem | null>(null);
  const [handedToName, setHandedToName]       = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError]     = useState("");
  const [photoUploading, setPhotoUploading]   = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [hasPendingIdCard, setHasPendingIdCard] = useState(false);

  const [editName, setEditName]               = useState("");
  const [editPhone, setEditPhone]             = useState("");
  const [profileSaving, setProfileSaving]     = useState(false);
  const [profileError, setProfileError]       = useState("");
  const [profileSuccess, setProfileSuccess]   = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading]             = useState(false);
  const [pwError, setPwError]                 = useState("");
  const [pwSuccess, setPwSuccess]             = useState("");
  const [showCurrentPw, setShowCurrentPw]     = useState(false);
  const [showNewPw, setShowNewPw]             = useState(false);
  const [showConfirmPw, setShowConfirmPw]     = useState(false);

  const [securityIssueType, setSecurityIssueType]   = useState("");
  const [securityDescription, setSecurityDescription] = useState("");
  const [securityLoading, setSecurityLoading]       = useState(false);
  const [securityError, setSecurityError]           = useState("");
  const [securitySuccess, setSecuritySuccess]       = useState("");

  const [idCardUploading, setIdCardUploading] = useState(false);
  const [idCardError, setIdCardError]         = useState("");
  const [idCardSuccess, setIdCardSuccess]     = useState("");

  const SECURITY_ISSUE_TYPES = [
    "Unauthorized Access", "Account Compromise", "Data Privacy Concern",
    "Suspicious Activity", "Password Issue", "Other",
  ];

  const subscribeToComplaints = useCallback((uid: string) => {
    if (unsubComplaintsRef.current) unsubComplaintsRef.current();
    const q = query(
      collection(db, "complaints"),
      where("submittedBy", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Complaint[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setComplaints(data);
      setComplaintsLoading(false);
      setSelectedComplaint((prev) => {
        if (!prev) return prev;
        const updated = data.find((c) => c.id === prev.id);
        return updated ?? prev;
      });
    }, () => { setComplaintsLoading(false); });
    unsubComplaintsRef.current = unsub;
  }, []);

  const fetchLostFound = useCallback(async () => {
    setLfLoading(true);
    try {
      const [feedData, myData] = await Promise.all([lostFoundAPI.feed(), lostFoundAPI.myPosts()]);
      setFeedItems(feedData.items || []);
      setMyPosts(myData.items || []);
    } catch {} finally { setLfLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await authAPI.myProfile();
      setHasPendingIdCard(data.hasPendingIdCardRequest || false);
    } catch {}
  }, []);

  const registerPushToken = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) await authAPI.savePushToken(token);
    } catch {}
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (!snap.exists()) return;
        setUserData(snap.data() as UserData);
        tokenRef.current = await u.getIdToken();
        subscribeToComplaints(u.uid);
        await fetchProfile();
        await registerPushToken();
      } catch {}
      finally { setLoading(false); }
    });
    return () => {
      unsub();
      if (unsubComplaintsRef.current) unsubComplaintsRef.current();
    };
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      const { type, complaintId, itemId } = data || {};
      if (complaintId && (
        type === "complaint_accepted" ||
        type === "complaint_in_progress" ||
        type === "complaint_completed" ||
        type === "complaint_rejected" ||
        type === "new_complaint" ||
        type === "new_rating"
      )) {
        switchTab("complaints");
        const found = complaints.find(c => c.id === complaintId);
        if (found) { setSelectedComplaint(found); setTrackingVisible(true); }
      }
      if (itemId && (type === "new_lost_found" || type === "item_handover")) {
        switchTab("lostfound");
      }
    });
    return () => sub.remove();
  }, [complaints]);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setProfileScreen("main");
    if (tab === "lostfound") fetchLostFound();
  }, [fetchLostFound]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "lostfound") await fetchLostFound();
    setRefreshing(false);
  }, [activeTab, fetchLostFound]);

  const handleCall = (phone: string | null, name: string | null) => {
    if (!phone?.trim()) return;
    Alert.alert(
      `Call ${name || "Staff"}`,
      `Do you want to call ${name || "the assigned staff"} at ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const handleHandover = async () => {
    if (!handedToName.trim()) { setHandoverError("Please enter the name."); return; }
    if (!handoverItem) return;
    setHandoverLoading(true);
    try {
      await lostFoundAPI.handover(handoverItem.id, handedToName.trim());
      setFeedItems((prev) => prev.filter((i) => i.id !== handoverItem.id));
      setHandoverItem(null);
      await fetchLostFound();
    } catch (err: any) {
      setHandoverError(err.message || "Failed.");
    } finally { setHandoverLoading(false); }
  };

  const handleSubmitRating = async () => {
    if (selectedStars === 0) { setRatingError("Please select a star rating."); return; }
    if (!ratingComplaint) return;
    setRatingLoading(true);
    setRatingError("");
    try {
      await complaintsAPI.rate(ratingComplaint.id, selectedStars, ratingComment.trim());
      setRatingVisible(false);
      setRatingComplaint(null);
      setSelectedStars(0);
      setRatingComment("");
    } catch (err: any) {
      setRatingError(err.message || "Failed to submit rating.");
    } finally { setRatingLoading(false); }
  };

  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (result.canceled) return;
      setPhotoUploading(true);
      const url = await uploadToCloudinary(result.assets[0].uri, "unifix/profiles");
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), { photoUrl: url });
        setUserData((prev) => prev ? { ...prev, photoUrl: url } : prev);
      }
    } catch {}
    finally { setPhotoUploading(false); }
  };

  const handleLogout = async () => { await auth.signOut(); router.replace("/login" as any); };

  const handleSaveProfile = async () => {
    setProfileError(""); setProfileSuccess("");
    if (!editName.trim()) { setProfileError("Full name is required."); return; }
    if (editPhone && !/^[6-9]\d{9}$/.test(editPhone.trim())) {
      setProfileError("Enter a valid 10-digit Indian phone number."); return;
    }
    setProfileSaving(true);
    try {
      await authAPI.updateProfile(editName.trim(), editPhone.trim());
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), { fullName: editName.trim(), phone: editPhone.trim() });
        setUserData((prev) => prev ? { ...prev, fullName: editName.trim(), phone: editPhone.trim() } : prev);
      }
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally { setProfileSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) { setPwError("All fields are required."); return; }
    if (newPassword.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(newPassword)) { setPwError("Password must contain at least one uppercase letter."); return; }
    if (!/[0-9]/.test(newPassword)) { setPwError("Password must contain at least one number."); return; }
    if (newPassword !== confirmPassword) { setPwError("New passwords do not match."); return; }
    setPwLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPwSuccess("Password changed successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to change password.");
    } finally { setPwLoading(false); }
  };

  const handleLogoutAllDevices = async () => {
    Alert.alert("Logout All Devices", "This will end all active sessions on all devices.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: async () => {
        try {
          await authAPI.logoutAllDevices();
          await auth.signOut();
          router.replace("/login" as any);
        } catch {}
      }},
    ]);
  };

  const handleDeleteAccount = async () => {
    const isStaff = userData?.role === "staff";
    Alert.alert(
      "Delete Account",
      isStaff
        ? "Your deletion request will be sent to admin for approval."
        : "This will permanently delete your account. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: isStaff ? "Submit Request" : "Delete", style: "destructive", onPress: async () => {
          try {
            const data = await authAPI.deleteAccount();
            if (data.requiresApproval) {
              Alert.alert("Request Submitted", "Your account deletion request has been submitted and is currently under review.");
            } else {
              await auth.signOut();
              router.replace("/login" as any);
            }
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to process request.");
          }
        }},
      ]
    );
  };

  const handleSubmitSecurityIssue = async () => {
    setSecurityError(""); setSecuritySuccess("");
    if (!securityIssueType) { setSecurityError("Please select an issue type."); return; }
    if (!securityDescription.trim()) { setSecurityError("Please describe the issue."); return; }
    setSecurityLoading(true);
    try {
      await authAPI.reportSecurityIssue(securityIssueType, securityDescription.trim());
      setSecuritySuccess("Security issue reported. Our team will review it shortly.");
      setSecurityIssueType(""); setSecurityDescription("");
    } catch (err: any) {
      setSecurityError(err.message || "Failed to report issue.");
    } finally { setSecurityLoading(false); }
  };

  const handleIdCardReUpload = async () => {
    setIdCardError(""); setIdCardSuccess("");
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
      if (result.canceled) return;
      setIdCardUploading(true);
      const folder = userData?.role === "student" ? "unifix/student_documents" : "unifix/teacher_documents";
      const url = await uploadToCloudinary(result.assets[0].uri, folder);
      const fileName = result.assets[0].uri.split("/").pop() || `idcard_${Date.now()}.jpg`;
      await authAPI.requestIdCardUpdate(url, fileName);
      setIdCardSuccess("ID card update request submitted. Admin will review it shortly.");
      setHasPendingIdCard(true);
    } catch (err: any) {
      setIdCardError(err.message || "Upload failed. Please try again.");
    } finally { setIdCardUploading(false); }
  };

  if (loading) return <View style={s.loader}><ActivityIndicator size="large" color="#16a34a" /></View>;

  const bottomNavHeight = 60 + insets.bottom;
  const firstName = userData?.fullName?.split(" ")[0] ?? "User";
  const recentComplaints = complaints.slice(0, 3);
  const filteredComplaints = complaints.filter((c) => {
    if (filterTab === "all") return true;
    if (filterTab === "pending") return c.status === "pending";
    if (filterTab === "resolved") return c.status === "completed" || c.status === "rejected";
    return true;
  });

  const idCardUrl = userData?.studentIdCardUrl || userData?.teacherIdCardUrl || null;
  const uniqueId = userData?.role === "student" ? userData?.rollNumber : userData?.teacherId;

  const NAV_TABS: { key: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "home",       icon: "home-outline",     activeIcon: "home",       label: "Home" },
    { key: "report",     icon: "warning-outline",   activeIcon: "warning",    label: "Report" },
    { key: "lostfound",  icon: "search-outline",    activeIcon: "search",     label: "Lost & Found" },
    { key: "complaints", icon: "clipboard-outline", activeIcon: "clipboard",  label: "Complaints" },
    { key: "profile",    icon: "person-outline",    activeIcon: "person",     label: "Profile" },
  ];

  const renderStars = (count: number, size: number = 28, interactive: boolean = false) => (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => interactive && setSelectedStars(star)} disabled={!interactive} activeOpacity={interactive ? 0.7 : 1}>
          <Ionicons name={star <= count ? "star" : "star-outline"} size={size} color={star <= count ? "#f59e0b" : "#e2e8f0"} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProfileMain = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.container, { paddingBottom: bottomNavHeight + 20 }]} showsVerticalScrollIndicator={false}>
      <View style={s.profileHero}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={s.profileAvatarBtn}>
          {userData?.photoUrl ? (
            <Image source={{ uri: userData.photoUrl }} style={s.profileAvatarImg} />
          ) : (
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>
                {userData?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "U"}
              </Text>
            </View>
          )}
          <View style={s.profileCameraBtn}>
            {photoUploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera-outline" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>
        <Text style={s.profileName}>{userData?.fullName ?? "—"}</Text>
        <View style={s.profileRoleBadge}>
          <Ionicons name={userData?.role === "student" ? "school-outline" : "person-outline"} size={13} color="#16a34a" style={{ marginRight: 5 }} />
          <Text style={s.profileRoleBadgeText}>{userData?.role === "student" ? "Student" : "Teacher"}</Text>
        </View>
        <Text style={s.profileHint}>{photoUploading ? "Uploading..." : "TAP PHOTO TO CHANGE"}</Text>
      </View>

      <TouchableOpacity style={s.menuCard} activeOpacity={0.85} onPress={() => { setEditName(userData?.fullName || ""); setEditPhone(userData?.phone || ""); setProfileError(""); setProfileSuccess(""); setProfileScreen("personalInfo"); }}>
        <View style={s.menuCardLeft}>
          <View style={s.menuIconWrap}><Ionicons name="person-outline" size={18} color="#16a34a" /></View>
          <Text style={s.menuLabel}>Personal Information</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      <TouchableOpacity style={s.menuCard} activeOpacity={0.85}>
        <View style={s.menuCardLeft}>
          <View style={s.menuIconWrap}><Ionicons name="notifications-outline" size={18} color="#16a34a" /></View>
          <Text style={s.menuLabel}>Notifications</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      <View style={s.sectionBlock}>
        <Text style={s.sectionBlockTitle}>Privacy & Security</Text>
        <TouchableOpacity style={s.securityRow} activeOpacity={0.85} onPress={() => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwError(""); setPwSuccess(""); setProfileScreen("changePassword"); }}>
          <View style={[s.menuIconWrap, { backgroundColor: "#f0fdf4" }]}><Ionicons name="lock-closed-outline" size={18} color="#16a34a" /></View>
          <Text style={s.securityRowLabel}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity style={s.securityRow} activeOpacity={0.85} onPress={handleLogoutAllDevices}>
          <View style={[s.menuIconWrap, { backgroundColor: "#f0fdf4" }]}><Ionicons name="phone-portrait-outline" size={18} color="#16a34a" /></View>
          <Text style={s.securityRowLabel}>Logout from all devices</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity style={s.securityRow} activeOpacity={0.85} onPress={handleDeleteAccount}>
          <View style={[s.menuIconWrap, { backgroundColor: "#fef2f2" }]}><Ionicons name="trash-outline" size={18} color="#dc2626" /></View>
          <Text style={[s.securityRowLabel, { color: "#dc2626" }]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#dc2626" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity style={s.securityRow} activeOpacity={0.85} onPress={() => { setSecurityIssueType(""); setSecurityDescription(""); setSecurityError(""); setSecuritySuccess(""); setProfileScreen("reportSecurity"); }}>
          <View style={[s.menuIconWrap, { backgroundColor: "#fff7ed" }]}><Ionicons name="shield-outline" size={18} color="#d97706" /></View>
          <Text style={s.securityRowLabel}>Report Security Issue</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={s.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
      <Text style={s.platformLabel}>UNIFIX PLATFORM</Text>
    </ScrollView>
  );

  const renderPersonalInfo = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.container, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
      <View style={s.subPageHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => setProfileScreen("main")}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.subPageTitle}>Personal Information</Text>
      </View>
      <View style={s.formCard}>
        <Text style={s.formSectionLabel}>BASIC INFO</Text>
        <View style={s.formField}><Text style={s.formLabel}>Full Name</Text><TextInput style={s.formInput} value={editName} onChangeText={setEditName} placeholder="Enter your full name" placeholderTextColor="#9ca3af" autoCapitalize="words" /></View>
        <View style={s.formField}><Text style={s.formLabel}>Email</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{userData?.email || "—"}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>
        <View style={s.formField}><Text style={s.formLabel}>Phone Number</Text><TextInput style={s.formInput} value={editPhone} onChangeText={setEditPhone} placeholder="Enter 10-digit phone number" placeholderTextColor="#9ca3af" keyboardType="phone-pad" maxLength={10} /></View>
        <View style={s.formField}><Text style={s.formLabel}>Gender</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{userData?.gender || "Not set"}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>
        <View style={s.formField}><Text style={s.formLabel}>Role</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "—"}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>
        {uniqueId && (<View style={s.formField}><Text style={s.formLabel}>{userData?.role === "student" ? "Roll Number" : "Teacher ID"}</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{uniqueId}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>)}
        {userData?.role === "student" && userData.branch && (<View style={s.formField}><Text style={s.formLabel}>Branch</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{userData.branch}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>)}
        {userData?.role === "student" && userData.year && (<View style={s.formField}><Text style={s.formLabel}>Year</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{userData.year}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>)}
        {userData?.role === "teacher" && userData.department && (<View style={s.formField}><Text style={s.formLabel}>Department</Text><View style={s.formInputReadOnly}><Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">{userData.department}</Text><Text style={s.readOnlyTag}>Read only</Text></View></View>)}
        {profileError ? <Text style={s.formError}>{profileError}</Text> : null}
        {profileSuccess ? <Text style={s.formSuccess}>{profileSuccess}</Text> : null}
        <TouchableOpacity style={[s.saveBtn, profileSaving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={profileSaving}>
          {profileSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
      {(userData?.role === "student" || userData?.role === "teacher") && (
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ID CARD MANAGEMENT</Text>
          {idCardUrl ? (<Image source={{ uri: idCardUrl }} style={s.idCardPreview} resizeMode="contain" />) : (<View style={s.idCardEmpty}><Ionicons name="id-card-outline" size={36} color="#94a3b8" style={{ marginBottom: 8 }} /><Text style={s.idCardEmptyText}>No ID card uploaded</Text></View>)}
          <View style={s.privacyNote}><Ionicons name="lock-closed-outline" size={16} color="#64748b" /><Text style={s.privacyNoteText}>Your ID card is only visible to you and the Admin.</Text></View>
          {hasPendingIdCard ? (
            <View style={s.pendingBadge}><Ionicons name="time-outline" size={14} color="#d97706" style={{ marginRight: 6 }} /><Text style={s.pendingBadgeText}>ID card update request is pending admin review</Text></View>
          ) : (
            <TouchableOpacity style={[s.idCardUploadBtn, idCardUploading && { opacity: 0.6 }]} onPress={handleIdCardReUpload} disabled={idCardUploading}>
              {idCardUploading ? <ActivityIndicator color="#16a34a" /> : <><Ionicons name="cloud-upload-outline" size={16} color="#16a34a" style={{ marginRight: 6 }} /><Text style={s.idCardUploadBtnText}>Request ID Card Update</Text></>}
            </TouchableOpacity>
          )}
          {idCardError ? <Text style={s.formError}>{idCardError}</Text> : null}
          {idCardSuccess ? <Text style={s.formSuccess}>{idCardSuccess}</Text> : null}
        </View>
      )}
      <View style={s.formCard}>
        <Text style={s.formSectionLabel}>ACCOUNT PRIVACY</Text>
        <View style={s.privacyNote}><Ionicons name="shield-checkmark-outline" size={16} color="#64748b" /><Text style={s.privacyNoteText}>Your personal data is securely stored and accessible only to Admin.</Text></View>
      </View>
    </ScrollView>
  );

  const renderChangePassword = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={s.scroll} contentContainerStyle={[s.container, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
        <View style={s.subPageHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => setProfileScreen("main")}><Ionicons name="arrow-back" size={20} color="#0f172a" /></TouchableOpacity>
          <Text style={s.subPageTitle}>Change Password</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>UPDATE PASSWORD</Text>
          <View style={s.formField}><Text style={s.formLabel}>Current Password</Text><View style={s.pwInputWrap}><TextInput style={s.pwInput} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" placeholderTextColor="#9ca3af" secureTextEntry={!showCurrentPw} /><TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)}><Ionicons name={showCurrentPw ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" /></TouchableOpacity></View></View>
          <View style={s.formField}><Text style={s.formLabel}>New Password</Text><View style={s.pwInputWrap}><TextInput style={s.pwInput} value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" placeholderTextColor="#9ca3af" secureTextEntry={!showNewPw} /><TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}><Ionicons name={showNewPw ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" /></TouchableOpacity></View></View>
          <View style={s.formField}><Text style={s.formLabel}>Confirm New Password</Text><View style={s.pwInputWrap}><TextInput style={s.pwInput} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#9ca3af" secureTextEntry={!showConfirmPw} /><TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}><Ionicons name={showConfirmPw ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" /></TouchableOpacity></View></View>
          <View style={s.pwRules}>
            {[{ rule: "At least 8 characters", ok: newPassword.length >= 8 }, { rule: "At least one uppercase letter", ok: /[A-Z]/.test(newPassword) }, { rule: "At least one number", ok: /[0-9]/.test(newPassword) }, { rule: "Passwords match", ok: newPassword === confirmPassword && confirmPassword.length > 0 }].map((r) => (
              <View key={r.rule} style={s.pwRuleRow}><Ionicons name={r.ok ? "checkmark-circle" : "ellipse-outline"} size={16} color={r.ok ? "#16a34a" : "#94a3b8"} /><Text style={[s.pwRuleText, { color: r.ok ? "#16a34a" : "#94a3b8" }]}>{r.rule}</Text></View>
            ))}
          </View>
          {pwError ? <Text style={s.formError}>{pwError}</Text> : null}
          {pwSuccess ? <Text style={s.formSuccess}>{pwSuccess}</Text> : null}
          <TouchableOpacity style={[s.saveBtn, (pwLoading || !currentPassword || !newPassword || !confirmPassword) && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}>
            {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Change Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderReportSecurity = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={s.scroll} contentContainerStyle={[s.container, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
        <View style={s.subPageHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => setProfileScreen("main")}><Ionicons name="arrow-back" size={20} color="#0f172a" /></TouchableOpacity>
          <Text style={s.subPageTitle}>Report Security Issue</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ISSUE DETAILS</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Issue Type</Text>
            <View style={s.issueTypeGrid}>
              {SECURITY_ISSUE_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[s.issueTypeChip, securityIssueType === type && s.issueTypeChipActive]} onPress={() => setSecurityIssueType(type)}>
                  <Text style={[s.issueTypeChipText, securityIssueType === type && s.issueTypeChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.formField}><Text style={s.formLabel}>Description</Text><TextInput style={[s.formInput, { minHeight: 120, textAlignVertical: "top", paddingTop: 12 }]} value={securityDescription} onChangeText={setSecurityDescription} placeholder="Describe the security issue in detail..." placeholderTextColor="#9ca3af" multiline numberOfLines={5} /></View>
          {securityError ? <Text style={s.formError}>{securityError}</Text> : null}
          {securitySuccess ? <Text style={s.formSuccess}>{securitySuccess}</Text> : null}
          <TouchableOpacity style={[s.saveBtn, (securityLoading || !securityIssueType || !securityDescription.trim()) && { opacity: 0.6 }]} onPress={handleSubmitSecurityIssue} disabled={securityLoading || !securityIssueType || !securityDescription.trim()}>
            {securityLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Submit Report</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.topBar}><Text style={s.topBarTitle}>UniFiX</Text></View>

      {activeTab === "home" && (
        <ScrollView style={s.scroll} contentContainerStyle={[s.container, { paddingBottom: bottomNavHeight + 20 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}>
          <View style={s.greetingRow}>
            <Text style={s.greeting}>Hello, {firstName}</Text>
            <Text style={s.greetingSub}>Welcome back to your campus dashboard</Text>
          </View>
          {recentComplaints.length > 0 ? (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => switchTab("complaints")}><Text style={s.seeAll}>View All</Text></TouchableOpacity>
              </View>
              {recentComplaints.map((c) => {
                const sm = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                const issue = c.subIssue || c.customIssue || "Issue reported";
                return (
                  <TouchableOpacity key={c.id} style={s.activityCard} onPress={() => switchTab("complaints")} activeOpacity={0.85}>
                    <View style={s.activityLeft}>
                      <View style={s.activityIconWrap}>
                        <Ionicons name={CAT_ICONS[c.category] || "construct-outline"} size={18} color="#16a34a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.activityTitle} numberOfLines={1}>{issue}</Text>
                        <Text style={s.activitySub} numberOfLines={1}>{c.building} • {formatAgo(c.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: sm.bg }]}><Text style={[s.statusPillText, { color: sm.color }]}>{sm.label}</Text></View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}><Ionicons name="clipboard-outline" size={40} color="#16a34a" /></View>
              <Text style={s.emptyStateTitle}>No recent activity</Text>
              <Text style={s.emptyStateSub}>Use the tabs below to report issues or check lost items</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === "complaints" && (
        <View style={s.fullTab}>
          <View style={s.tabHeader}><Text style={s.tabHeaderTitle}>My Complaints</Text></View>
          <View style={s.filterRow}>
            {(["all", "pending", "resolved"] as FilterTab[]).map((tab) => (
              <TouchableOpacity key={tab} style={[s.filterChip, filterTab === tab && s.filterChipActive]} onPress={() => setFilterTab(tab)}>
                <Text style={[s.filterChipText, filterTab === tab && s.filterChipTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {complaintsLoading ? (
            <View style={s.tabLoader}><ActivityIndicator size="large" color="#16a34a" /></View>
          ) : (
            <ScrollView contentContainerStyle={[s.tabContainer, { paddingBottom: bottomNavHeight + 20 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}>
              {filteredComplaints.length === 0 ? (
                <View style={s.emptyState}>
                  <View style={s.emptyIconWrap}><Ionicons name="clipboard-outline" size={40} color="#16a34a" /></View>
                  <Text style={s.emptyStateTitle}>No complaints found</Text>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push("/submit-complaint" as any)}><Text style={s.actionBtnText}>Report an Issue</Text></TouchableOpacity>
                </View>
              ) : (
                filteredComplaints.map((complaint) => {
                  const sc = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
                  const issueTitle = complaint.subIssue || complaint.customIssue || "Issue reported";
                  const catIcon = CAT_ICONS[complaint.category] || "clipboard-outline";
                  const isCompleted = complaint.status === "completed";
                  const hasRating = complaint.rating != null;
                  const isAssigned = complaint.status === "assigned" || complaint.status === "in_progress";
                  return (
                    <View key={complaint.id} style={s.complaintCard}>
                      <View style={s.complaintCardTop}>
                        <View style={s.complaintCatIcon}><Ionicons name={catIcon} size={18} color="#16a34a" /></View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.complaintTitle} numberOfLines={2}>{issueTitle}</Text>
                          <View style={s.complaintMetaRow}><Ionicons name="location-outline" size={12} color="#64748b" /><Text style={s.complaintMetaText}>{[complaint.building, complaint.roomDetail].filter(Boolean).join(", ")}</Text></View>
                          <View style={s.complaintMetaRow}><Ionicons name="calendar-outline" size={12} color="#94a3b8" /><Text style={s.complaintDate}>{formatDateShort(complaint.createdAt)}</Text></View>
                          {complaint.status === "pending" && complaint.queueStatus === "waiting_for_staff" && (
                            <View style={s.queueBanner}>
                              <Ionicons name="time-outline" size={12} color="#7c3aed" style={{ marginRight: 4 }} />
                              <Text style={s.queueBannerText}>Waiting for staff to be assigned</Text>
                            </View>
                          )}
                        </View>
                        {complaint.photoUrl ? (<Image source={{ uri: complaint.photoUrl }} style={s.complaintThumb} resizeMode="cover" />) : (<View style={[s.complaintThumb, s.complaintThumbEmpty]}><Ionicons name={catIcon} size={20} color="#94a3b8" /></View>)}
                      </View>
                      {isAssigned && complaint.assignedToName ? (
                        <View style={s.staffBanner}>
                          <View style={s.staffLeft}>
                            <View style={s.staffIconWrap}><Ionicons name="person" size={14} color="#2563eb" /></View>
                            <View>
                              <Text style={s.staffLabel}>Assigned Staff</Text>
                              <Text style={s.staffName}>{complaint.assignedToName}</Text>
                            </View>
                          </View>
                          {complaint.assignedToPhone ? (
                            <TouchableOpacity style={s.staffCallBtn} onPress={() => handleCall(complaint.assignedToPhone, complaint.assignedToName)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                              <Ionicons name="call" size={16} color="#ffffff" />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ) : null}
                      {isCompleted && hasRating && (
                        <View style={s.ratingDisplayRow}>
                          {renderStars(complaint.rating!, 16)}
                          <Text style={s.ratingDisplayText}>You rated {complaint.rating}/5</Text>
                        </View>
                      )}
                      <View style={s.complaintCardBottom}>
                        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                          <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
                          <Text style={[s.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                          {isCompleted && !hasRating && (
                            <TouchableOpacity style={s.rateBtn} onPress={() => { setRatingComplaint(complaint); setSelectedStars(0); setRatingComment(""); setRatingError(""); setRatingVisible(true); }}>
                              <Ionicons name="star-outline" size={12} color="#d97706" style={{ marginRight: 4 }} />
                              <Text style={s.rateBtnText}>Rate</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={s.trackBtn} onPress={() => { setSelectedComplaint(complaint); setTrackingVisible(true); }} activeOpacity={0.85}>
                            <Text style={s.trackBtnText}>View Tracking</Text>
                            <Ionicons name="arrow-forward" size={13} color="#16a34a" style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === "lostfound" && (
        <View style={s.fullTab}>
          <View style={s.tabHeader}>
            <Text style={s.tabHeaderTitle}>Lost & Found</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => router.push("/post-found-item" as any)}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.segmentRow}>
            <TouchableOpacity style={[s.segmentBtn, lfTab === "feed" && s.segmentBtnActive]} onPress={() => setLfTab("feed")}><Text style={[s.segmentBtnText, lfTab === "feed" && s.segmentBtnTextActive]}>All Items</Text></TouchableOpacity>
            <TouchableOpacity style={[s.segmentBtn, lfTab === "myposts" && s.segmentBtnActive]} onPress={() => setLfTab("myposts")}><Text style={[s.segmentBtnText, lfTab === "myposts" && s.segmentBtnTextActive]}>My Posts</Text></TouchableOpacity>
          </View>
          {lfLoading ? (
            <View style={s.tabLoader}><ActivityIndicator size="large" color="#16a34a" /></View>
          ) : (
            <ScrollView contentContainerStyle={[s.tabContainer, { paddingBottom: bottomNavHeight + 20 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}>
              {(lfTab === "feed" ? feedItems : myPosts).length === 0 ? (
                <View style={s.emptyState}>
                  <View style={s.emptyIconWrap}><Ionicons name={lfTab === "feed" ? "search-outline" : "cube-outline"} size={40} color="#16a34a" /></View>
                  <Text style={s.emptyStateTitle}>{lfTab === "feed" ? "No items posted yet" : "No posts yet"}</Text>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push("/post-found-item" as any)}><Text style={s.actionBtnText}>Post Found Item</Text></TouchableOpacity>
                </View>
              ) : (
                (lfTab === "feed" ? feedItems : myPosts).map((item) => {
                  const isHandedOver = item.status === "handed_over";
                  return (
                    <View key={item.id} style={s.lfCard}>
                      <View style={s.lfCardHeader}>
                        <View style={s.lfAvatar}><Text style={s.lfAvatarText}>{item.postedByName?.[0]?.toUpperCase() ?? "?"}</Text></View>
                        <View style={{ flex: 1 }}><Text style={s.lfPosterName}>{item.postedByName}</Text><Text style={s.lfPosterTime}>{formatAgo(item.createdAt)}</Text></View>
                        {item.isMyPost && <View style={s.myPostBadge}><Text style={s.myPostBadgeText}>MY POST</Text></View>}
                        {!isHandedOver && <View style={s.foundBadge}><Text style={s.foundBadgeText}>FOUND</Text></View>}
                      </View>
                      {item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={s.lfImage} resizeMode="cover" /> : <View style={s.lfImageEmpty}><Ionicons name="cube-outline" size={40} color="#94a3b8" /></View>}
                      <View style={s.lfBody}>
                        <Text style={s.lfTitle}>{item.itemName}</Text>
                        {item.description ? <Text style={s.lfDesc}>{item.description}</Text> : null}
                        <View style={s.lfMetaRow}><Ionicons name="location-outline" size={13} color="#374151" /><Text style={s.lfLocText}>Room {item.roomNumber}{item.roomLabel ? ` — ${item.roomLabel}` : ""}</Text></View>
                        {item.collectLocation ? <View style={s.lfMetaRow}><Ionicons name="pin-outline" size={13} color="#16a34a" /><Text style={s.lfCollectText}>Collect from: {item.collectLocation}</Text></View> : null}
                        {isHandedOver ? (
                          <View style={s.handedBox}><Ionicons name="hand-left-outline" size={14} color="#16a34a" style={{ marginRight: 6 }} /><Text style={s.handedText}>Handed to {item.handedToName}</Text></View>
                        ) : item.isMyPost ? (
                          <TouchableOpacity style={s.handoverBtn} onPress={() => { setHandoverItem(item); setHandedToName(""); setHandoverError(""); }}><Text style={s.handoverBtnText}>Mark as Handed Over</Text></TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === "profile" && (
        <>
          {profileScreen === "main" && renderProfileMain()}
          {profileScreen === "personalInfo" && renderPersonalInfo()}
          {profileScreen === "changePassword" && renderChangePassword()}
          {profileScreen === "reportSecurity" && renderReportSecurity()}
        </>
      )}

      <View style={[s.bottomNav, { paddingBottom: insets.bottom + 10, height: bottomNavHeight }]}>
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={s.navItem} onPress={() => { if (tab.key === "report") router.push("/submit-complaint" as any); else switchTab(tab.key as TabType); }}>
              <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? "#16a34a" : "#94a3b8"} />
              <Text style={[s.navLabel, isActive && s.navLabelActive]}>{tab.label}</Text>
              {isActive && <View style={s.navActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={ratingVisible} animationType="slide" transparent onRequestClose={() => setRatingVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.modalHandle} />
            <Text style={s.ratingModalTitle}>Rate the Work</Text>
            <Text style={s.ratingModalSub}>{ratingComplaint?.subIssue || ratingComplaint?.customIssue || "Maintenance work"}</Text>
            <View style={s.starsRow}>{renderStars(selectedStars, 40, true)}</View>
            <View style={s.starLabels}>
              {["Terrible", "Bad", "Okay", "Good", "Excellent"].map((label, i) => (
                <Text key={label} style={[s.starLabel, selectedStars === i + 1 && s.starLabelActive]}>{label}</Text>
              ))}
            </View>
            <TextInput style={s.ratingInput} placeholder="Add a comment (optional)" placeholderTextColor="#9ca3af" value={ratingComment} onChangeText={setRatingComment} multiline numberOfLines={3} textAlignVertical="top" />
            {ratingError ? <Text style={s.ratingError}>{ratingError}</Text> : null}
            <View style={s.ratingBtnRow}>
              <TouchableOpacity style={s.ratingCancelBtn} onPress={() => setRatingVisible(false)}><Text style={s.ratingCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.ratingSubmitBtn, (ratingLoading || selectedStars === 0) && { opacity: 0.55 }]} onPress={handleSubmitRating} disabled={ratingLoading || selectedStars === 0}>
                {ratingLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.ratingSubmitText}>Submit Rating</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={trackingVisible} animationType="slide" transparent onRequestClose={() => setTrackingVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            {selectedComplaint && (() => {
              const sc = STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG.pending;
              const catIcon = CAT_ICONS[selectedComplaint.category] || "clipboard-outline";
              const issueTitle = selectedComplaint.subIssue || selectedComplaint.customIssue || "Issue";
              const stepIdx = PROGRESS_STEPS.indexOf(selectedComplaint.status);
              const isAssigned = selectedComplaint.status === "assigned" || selectedComplaint.status === "in_progress";
              return (
                <>
                  <View style={s.modalHandle} />
                  <View style={s.modalTitleRow}>
                    <View style={s.modalCatIcon}><Ionicons name={catIcon} size={24} color="#16a34a" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modalIssueTitle}>{issueTitle}</Text>
                      <Text style={s.modalCategory}>{selectedComplaint.category.charAt(0).toUpperCase() + selectedComplaint.category.slice(1)}</Text>
                    </View>
                    <View style={[s.modalStatusBadge, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon} size={12} color={sc.color} style={{ marginRight: 4 }} />
                      <Text style={[s.modalStatusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <View style={s.modalDivider} />
                  <View style={s.modalInfoGrid}>
                    <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Ticket ID</Text><Text style={s.modalTicketId}>{selectedComplaint.ticketId}</Text></View>
                    <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Location</Text><Text style={s.modalInfoValue} numberOfLines={2}>{[selectedComplaint.building, selectedComplaint.roomDetail].filter(Boolean).join(", ")}</Text></View>
                    <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Submitted</Text><Text style={s.modalInfoValue}>{formatDate(selectedComplaint.createdAt)}</Text></View>
                    {isAssigned && selectedComplaint.assignedToName ? (
                      <View style={s.modalStaffRow}>
                        <View style={s.modalStaffLeft}>
                          <View style={s.modalStaffIconWrap}><Ionicons name="person" size={14} color="#2563eb" /></View>
                          <View>
                            <Text style={s.modalStaffLabel}>Assigned Staff</Text>
                            <Text style={s.modalStaffName}>{selectedComplaint.assignedToName}</Text>
                          </View>
                        </View>
                        {selectedComplaint.assignedToPhone ? (
                          <TouchableOpacity style={s.modalCallBtn} onPress={() => handleCall(selectedComplaint.assignedToPhone, selectedComplaint.assignedToName)}>
                            <Ionicons name="call" size={16} color="#ffffff" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : null}
                    {selectedComplaint.rating != null && (
                      <View style={s.modalInfoRow}>
                        <Text style={s.modalInfoLabel}>Your Rating</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {renderStars(selectedComplaint.rating, 14)}
                          <Text style={s.modalInfoValue}>{selectedComplaint.rating}/5</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={s.progressTracker}>
                    <View style={s.progressRow}>
                      {PROGRESS_STEPS.map((step, i) => {
                        const isStepActive = i <= stepIdx && selectedComplaint.status !== "rejected";
                        return (
                          <View key={step} style={s.progressStepWrap}>
                            <View style={s.progressDotCol}>
                              <View style={[s.progressDot, isStepActive && s.progressDotActive]} />
                              <Text style={[s.progressLabel, isStepActive && s.progressLabelActive]}>{STEP_LABELS[i]}</Text>
                            </View>
                            {i < 3 && <View style={[s.progressLine, i < stepIdx && selectedComplaint.status !== "rejected" && s.progressLineActive]} />}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setTrackingVisible(false)}><Text style={s.modalCloseBtnText}>Close</Text></TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      <Modal visible={!!handoverItem} animationType="slide" transparent onRequestClose={() => setHandoverItem(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalIssueTitle}>Mark as Handed Over</Text>
            <TextInput style={s.handoverInput} placeholder="e.g. Soham Patil" placeholderTextColor="#9ca3af" value={handedToName} onChangeText={(t) => { setHandedToName(t); setHandoverError(""); }} autoCapitalize="words" />
            {handoverError ? <Text style={s.handoverError}>{handoverError}</Text> : null}
            <View style={s.handoverBtnRow}>
              <TouchableOpacity style={s.handoverCancelBtn} onPress={() => setHandoverItem(null)}><Text style={s.handoverCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.handoverConfirmBtn, handoverLoading && { opacity: 0.55 }]} onPress={handleHandover} disabled={handoverLoading}>
                {handoverLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.handoverConfirmText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" },
  root: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  topBarTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 20 },
  greetingRow: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  greetingSub: { fontSize: 14, color: "#64748b", marginTop: 4 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  seeAll: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  activityCard: { backgroundColor: "#ffffff", borderRadius: 14, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  activityIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  activityTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  activitySub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyStateTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginBottom: 6 },
  emptyStateSub: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  actionBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  fullTab: { flex: 1 },
  tabHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tabHeaderTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  addBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0" },
  filterChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  filterChipText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  filterChipTextActive: { color: "#16a34a", fontWeight: "700" },
  tabLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContainer: { padding: 16, gap: 12 },
  complaintCard: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  complaintCardTop: { flexDirection: "row", gap: 12, marginBottom: 14 },
  complaintCatIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  complaintTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 6, lineHeight: 22 },
  complaintMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  complaintMetaText: { fontSize: 12, color: "#64748b" },
  complaintDate: { fontSize: 12, color: "#94a3b8" },
  complaintThumb: { width: 72, height: 72, borderRadius: 10 },
  complaintThumbEmpty: { backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  queueBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4, alignSelf: "flex-start" },
  queueBannerText: { fontSize: 11, color: "#7c3aed", fontWeight: "600" },
  staffBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#eff6ff", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: "#bfdbfe" },
  staffLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  staffIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  staffLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", marginBottom: 2 },
  staffName: { fontSize: 13, color: "#1e40af", fontWeight: "700" },
  staffCallBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  complaintCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  ratingDisplayRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  ratingDisplayText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  rateBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef3c7", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#fde68a" },
  rateBtnText: { fontSize: 12, fontWeight: "700", color: "#d97706" },
  trackBtn: { flexDirection: "row", alignItems: "center" },
  trackBtnText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  segmentRow: { flexDirection: "row", backgroundColor: "#f8fafc", margin: 16, borderRadius: 10, padding: 3, borderWidth: 1.5, borderColor: "#e2e8f0" },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
  segmentBtnActive: { backgroundColor: "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  segmentBtnText: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  segmentBtnTextActive: { color: "#0f172a", fontWeight: "700" },
  lfCard: { backgroundColor: "#ffffff", borderRadius: 14, overflow: "hidden", borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  lfCardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  lfAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  lfAvatarText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  lfPosterName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  lfPosterTime: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  myPostBadge: { backgroundColor: "#f0fdf4", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: "#bbf7d0", marginLeft: 6 },
  myPostBadgeText: { fontSize: 9, fontWeight: "700", color: "#16a34a", letterSpacing: 0.3 },
  foundBadge: { backgroundColor: "#16a34a", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  foundBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  lfImage: { width: "100%", height: 200 },
  lfImageEmpty: { width: "100%", height: 140, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  lfBody: { padding: 14 },
  lfTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  lfDesc: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 8 },
  lfMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  lfLocText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  lfCollectText: { fontSize: 13, color: "#16a34a", fontWeight: "500" },
  handedBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  handedText: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
  handoverBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  handoverBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  profileHero: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  profileAvatarBtn: { position: "relative", marginBottom: 14 },
  profileAvatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#16a34a" },
  profileAvatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "#16a34a" },
  profileAvatarText: { fontSize: 32, fontWeight: "800", color: "#16a34a" },
  profileCameraBtn: { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 9, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  profileName: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  profileRoleBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, borderColor: "#bbf7d0", marginBottom: 8 },
  profileRoleBadgeText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  profileHint: { fontSize: 11, color: "#94a3b8", letterSpacing: 0.5 },
  menuCard: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  menuCardLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  sectionBlock: { backgroundColor: "#ffffff", borderRadius: 14, padding: 8, marginBottom: 16, borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  sectionBlockTitle: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 10 },
  securityRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 8, paddingVertical: 12 },
  securityRowLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0f172a" },
  securityDivider: { height: 1, backgroundColor: "#f8fafc", marginHorizontal: 8 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: "#fecaca", marginBottom: 16 },
  logoutBtnText: { color: "#dc2626", fontSize: 15, fontWeight: "700" },
  platformLabel: { fontSize: 11, color: "#cbd5e1", fontWeight: "600", letterSpacing: 1, textAlign: "center", marginBottom: 8 },
  subPageHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20, paddingTop: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  subPageTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  formCard: { backgroundColor: "#ffffff", borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  formSectionLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8, marginBottom: 16 },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 7 },
  formInput: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 13, fontSize: 14, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0" },
  formInputReadOnly: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 13, flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", gap: 8 },
  formInputReadOnlyText: { fontSize: 14, color: "#64748b", flex: 1 },
  readOnlyTag: { fontSize: 10, fontWeight: "700", color: "#94a3b8", backgroundColor: "#f1f5f9", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 },
  formError: { fontSize: 13, color: "#dc2626", fontWeight: "600", marginBottom: 10, textAlign: "center" },
  formSuccess: { fontSize: 13, color: "#16a34a", fontWeight: "600", marginBottom: 10, textAlign: "center" },
  saveBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  idCardPreview: { width: "100%", height: 200, borderRadius: 10, backgroundColor: "#f8fafc", marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  idCardEmpty: { backgroundColor: "#f8fafc", borderRadius: 10, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 1.5, borderColor: "#e2e8f0", borderStyle: "dashed" },
  idCardEmptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  idCardUploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#f0fdf4", borderRadius: 10, paddingVertical: 13, borderWidth: 1.5, borderColor: "#bbf7d0", marginTop: 4 },
  idCardUploadBtnText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  pendingBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fef3c7", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fde68a", marginTop: 8 },
  pendingBadgeText: { fontSize: 13, fontWeight: "600", color: "#d97706" },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginTop: 4 },
  privacyNoteText: { flex: 1, fontSize: 13, color: "#64748b", lineHeight: 20 },
  pwInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", paddingRight: 12 },
  pwInput: { flex: 1, padding: 13, fontSize: 14, color: "#0f172a" },
  pwRules: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 14, gap: 8 },
  pwRuleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pwRuleText: { fontSize: 13, fontWeight: "500" },
  issueTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  issueTypeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0" },
  issueTypeChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  issueTypeChipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  issueTypeChipTextActive: { color: "#16a34a", fontWeight: "700" },
  bottomNav: { flexDirection: "row", backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10, position: "absolute", bottom: 0, left: 0, right: 0, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 8 },
  navItem: { flex: 1, alignItems: "center", gap: 3, position: "relative" },
  navLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "600" },
  navLabelActive: { color: "#16a34a", fontWeight: "700" },
  navActiveDot: { position: "absolute", bottom: -10, width: 4, height: 4, borderRadius: 2, backgroundColor: "#16a34a" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 20 },
  ratingModalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4, textAlign: "center" },
  ratingModalSub: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 24 },
  starsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  starLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingHorizontal: 4 },
  starLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "600", textAlign: "center", flex: 1 },
  starLabelActive: { color: "#f59e0b", fontWeight: "800" },
  ratingInput: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 14, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", textAlignVertical: "top", minHeight: 80, marginBottom: 12 },
  ratingError: { fontSize: 13, color: "#dc2626", marginBottom: 8, fontWeight: "500", textAlign: "center" },
  ratingBtnRow: { flexDirection: "row", gap: 10 },
  ratingCancelBtn: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  ratingCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  ratingSubmitBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  ratingSubmitText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  modalCatIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  modalIssueTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  modalCategory: { fontSize: 13, color: "#94a3b8" },
  modalStatusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  modalStatusText: { fontSize: 12, fontWeight: "700" },
  modalDivider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 },
  modalInfoGrid: { gap: 12, marginBottom: 20 },
  modalInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalInfoLabel: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  modalTicketId: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  modalInfoValue: { fontSize: 13, fontWeight: "600", color: "#0f172a", maxWidth: "55%", textAlign: "right" },
  modalStaffRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#eff6ff", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#bfdbfe" },
  modalStaffLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalStaffIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  modalStaffLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", marginBottom: 2 },
  modalStaffName: { fontSize: 13, color: "#1e40af", fontWeight: "700" },
  modalCallBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  progressTracker: { marginBottom: 20 },
  progressRow: { flexDirection: "row", alignItems: "flex-start" },
  progressStepWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDotCol: { alignItems: "center", gap: 6 },
  progressDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#e2e8f0", borderWidth: 2, borderColor: "#e2e8f0" },
  progressDotActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  progressLine: { flex: 1, height: 2, backgroundColor: "#e2e8f0", marginBottom: 20 },
  progressLineActive: { backgroundColor: "#16a34a" },
  progressLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  progressLabelActive: { color: "#16a34a", fontWeight: "700" },
  modalCloseBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  modalCloseBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  handoverInput: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 14, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", marginTop: 16, marginBottom: 8 },
  handoverError: { fontSize: 13, color: "#dc2626", marginBottom: 8, fontWeight: "500" },
  handoverBtnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  handoverCancelBtn: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  handoverCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  handoverConfirmBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  handoverConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});