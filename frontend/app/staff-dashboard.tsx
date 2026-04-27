import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth, db } from "../firebase/firebaseConfig";

import { saveCache, loadCache, loadCacheForce } from '../utils/cache';
import { authAPI, complaintsAPI, lostFoundAPI } from "../services/api";
import ScreenWrapper from "@/wrappers/ScreenWrapper";

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

async function uploadToCloudinary(
  uri: string,
  folder: string,
): Promise<string> {
  const formData = new FormData();
  const name = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
  formData.append("file", { uri, type: "image/jpeg", name } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", folder);
  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const { width: SW, height: SH } = Dimensions.get("window");

const CAT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  electrical: "flash-outline",
  plumbing: "water-outline",
  carpentry: "hammer-outline",
  cleaning: "sparkles-outline",
  technician: "desktop-outline",
  safety: "shield-outline",
  others: "clipboard-outline",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "New", color: "#d97706", bg: "#fef3c7" },
  assigned: { label: "Assigned", color: "#2563eb", bg: "#dbeafe" },
  in_progress: { label: "In Progress", color: "#7c3aed", bg: "#ede9fe" },
  completed: { label: "Completed", color: "#16a34a", bg: "#dcfce7" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
};

type Complaint = {
  id: string;
  ticketId: string;
  category: string;
  subIssue: string | null;
  customIssue: string | null;
  description: string;
  building: string;
  roomDetail: string;
  status: string;
  submittedByName: string;
  submittedByEmail: string;
  submittedByRole: string;
  submittedByPhone?: string;
  photoUrl?: string | null;
  createdAt: any;
  assignedTo?: string;
  assignedToName?: string;
  rejectedBy?: {
    uid: string;
    name: string;
    reason: string;
    rejectedAt: string;
  }[];
  assignableTo?: string[];
};

type LostItem = {
  id: string;
  itemName: string;
  category: string;
  description: string;
  roomNumber: string;
  roomLabel: string;
  collectLocation: string;
  photoUrl?: string | null;
  postedByName: string;
  createdAt: any;
  status: string;
  isMyPost: boolean;
  handedToName?: string;
  handedAt?: any;
};

type ClaimItem = {
  id: string;
  itemName: string;
  photoUrl: string | null;
  handedByName: string;
  handedByRole: string;
  handedToName: string;
  roomNumber: string;
  roomLabel: string;
  collectLocation: string;
  handedAt: any;
};

type StaffData = {
  fullName: string;
  email: string;
  designation: string;
  employeeId: string;
  experience: string;
  phone?: string;
  photoUrl?: string;
  gender?: string;
  nationalIdCardUrl?: string;
};

type TabType = "tasks" | "lostfound" | "history" | "profile";
type ProfileScreen =
  | "main"
  | "personalInfo"
  | "changePassword"
  | "reportSecurity";

function formatDate(ts: any) {
  if (!ts) return "—";
  let ms: number | null = null;
  if (typeof ts === "number") ms = ts * 1000;
  else if (ts?.toDate) ms = ts.toDate().getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAgo(ts: any): string {
  if (!ts) return "";
  const seconds =
    ts._seconds ?? ts.seconds ?? (typeof ts === "number" ? ts : null);
  if (!seconds) return "";
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ImageViewer({
  uri,
  visible,
  onClose,
}: {
  uri: string;
  visible: boolean;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const initialDistance = useRef(0);
  const reset = () => {
    lastScale.current = 1;
    lastX.current = 0;
    lastY.current = 0;
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  };
  useEffect(() => {
    if (visible) reset();
  }, [visible]);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        if (gs.numberActiveTouches === 2) initialDistance.current = 0;
      },
      onPanResponderMove: (e, gs) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (initialDistance.current === 0) {
            initialDistance.current = dist;
            return;
          }
          scale.setValue(
            Math.max(
              1,
              Math.min(5, lastScale.current * (dist / initialDistance.current)),
            ),
          );
        } else if (touches.length === 1 && lastScale.current > 1) {
          translateX.setValue(lastX.current + gs.dx);
          translateY.setValue(lastY.current + gs.dy);
        }
      },
      onPanResponderRelease: () => {
        lastScale.current = (scale as any)._value;
        lastX.current = (translateX as any)._value;
        lastY.current = (translateY as any)._value;
        if (lastScale.current <= 1) reset();
      },
    }),
  ).current;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={iv.overlay}>
        <TouchableOpacity style={iv.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Animated.View
          style={{ transform: [{ scale }, { translateX }, { translateY }] }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (lastScale.current <= 1) onClose();
            }}
            onLongPress={reset}
          >
            <Image source={{ uri }} style={iv.image} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const iv = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: SW, height: SH },
});

export default function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
const { openComplaintId, openTab, openLFTab } = useLocalSearchParams<{
    openComplaintId?: string;
    openTab?: string;
    openLFTab?: string;
  }>();

  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [feedItems, setFeedItems] = useState<LostItem[]>([]);
  const [myPosts, setMyPosts] = useState<LostItem[]>([]);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [staffUid, setStaffUid] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("tasks");
  const [profileScreen, setProfileScreen] = useState<ProfileScreen>("main");
  const [lostFoundTab, setLostFoundTab] = useState<
    "feed" | "myposts" | "claims"
  >("feed");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [handoverItem, setHandoverItem] = useState<LostItem | null>(null);
  const [handedToName, setHandedToName] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState("");
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [securityIssueType, setSecurityIssueType] = useState("");
  const [securityDescription, setSecurityDescription] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<any>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const pendingOpenComplaintId = useRef<string | null>(null);

  const SECURITY_ISSUE_TYPES = [
    "Unauthorized Access",
    "Account Compromise",
    "Data Privacy Concern",
    "Suspicious Activity",
    "Password Issue",
    "Other",
  ];

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastAnim.setValue(0);
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3000);
  };

  const subscribeToComplaints = useCallback((uid: string) => {
    if (unsubRef.current) unsubRef.current();

    const pendingQ = query(
      collection(db, "complaints"),
      where("assignableTo", "array-contains", uid),
      where("status", "==", "pending"),
    );
    const assignedQ = query(
      collection(db, "complaints"),
      where("assignedTo", "==", uid),
    );

    const pendingUnsub = onSnapshot(pendingQ, () => refetchAll(uid));
    const assignedUnsub = onSnapshot(assignedQ, () => refetchAll(uid));

    const userUnsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAvgRating(data.avgRating ?? null);
        setRatingCount(data.ratingCount ?? 0);
      }
    });

    unsubRef.current = () => {
      pendingUnsub();
      assignedUnsub();
      userUnsub();
    };
  }, []);

const refetchAll = useCallback(async (uid: string) => {
    const cached = await loadCacheForce('staff_complaints');
    if (cached) { setAllComplaints(cached); setLoading(false); }
    try {
      const data = await complaintsAPI.staffComplaints();
      const combined: Complaint[] = [
        ...(data.pending || []),
        ...(data.active || []),
        ...(data.completed || []),
        ...(data.rejected || []),
      ];
      const seen = new Set<string>();
      const unique = combined.filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      setAllComplaints(unique);
      saveCache('staff_complaints', unique);
      setAvgRating(data.avgRating ?? null);
      setRatingCount(data.ratingCount ?? 0);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const lfUnsubRef = useRef<(() => void)[]>([]);

const fetchLostFound = useCallback(async (uid: string) => {
  try {
    const { getDocs } = await import("firebase/firestore");

    const feedSnap = await getDocs(
      query(collection(db, "lostFound"), where("status", "==", "available"), orderBy("createdAt", "desc"))
    );
    setFeedItems(feedSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), isMyPost: d.data().postedBy === uid })));

    const myPostsSnap = await getDocs(
      query(collection(db, "lostFound"), where("postedBy", "==", uid), orderBy("createdAt", "desc"))
    );
    setMyPosts(myPostsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), isMyPost: true })));

    const claimsSnap = await getDocs(
      query(collection(db, "claims"), orderBy("createdAt", "desc"))
    );
    setClaimItems(claimsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

    setIsOffline(false);
  } catch {
    setIsOffline(true);
  }
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
      if (!u) {
        router.replace("/login" as any);
        return;
      }
      setStaffUid(u.uid);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setStaffData(snap.data() as StaffData);
      subscribeToComplaints(u.uid);
      fetchLostFound(u.uid);
      registerPushToken();
    });
 return () => {
  unsub();
  if (unsubRef.current) unsubRef.current();
};
  }, []);

  useEffect(() => {
    if (openComplaintId) {
      pendingOpenComplaintId.current = openComplaintId as string;
    }
  }, [openComplaintId]);

  useEffect(() => {
    if (pendingOpenComplaintId.current && allComplaints.length > 0) {
      const found = allComplaints.find(
        (c) => c.id === pendingOpenComplaintId.current,
      );
      if (found) {
        setActiveTab("tasks");
        setSelectedComplaint(found);
        setDetailVisible(true);
        pendingOpenComplaintId.current = null;
      }
    }
  }, [allComplaints]);

useEffect(() => {
    if (openTab === "lostfound") {
      setActiveTab("lostfound");
      if (openLFTab === "claims") setLostFoundTab("claims");
      else if (openLFTab === "myposts") setLostFoundTab("myposts");
      else setLostFoundTab("feed");
    }
  }, [openTab, openLFTab]);

  
  const onRefresh = () => {
    setRefreshing(true);
    if (staffUid) refetchAll(staffUid);
  };

  const handleCall = (phone?: string) => {
    if (!phone?.trim()) {
      showToast("No phone number available.", "info");
      return;
    }
    Linking.openURL(`tel:${phone.trim()}`);
  };

  const handleAccept = async (complaintId: string) => {
    setActionLoading(complaintId);
    try {
      await complaintsAPI.accept(complaintId);
      showToast("Task accepted!", "success");
      setDetailVisible(false);
    } catch (err: any) {
      showToast(err.message || "Failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (complaintId: string) => {
    setRejectTarget(complaintId);
    setRejectReason("");
    setDetailVisible(false);
    setRejectVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Please enter a rejection reason.", "error");
      return;
    }
    if (!rejectTarget) return;
    setActionLoading(rejectTarget);
    try {
      await complaintsAPI.reject(rejectTarget, rejectReason.trim());
      showToast("Rejected.", "info");
      setRejectVisible(false);
      setRejectTarget(null);
    } catch (err: any) {
      showToast(err.message || "Failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (complaintId: string, status: string) => {
    setActionLoading(complaintId);
    try {
      await complaintsAPI.updateStatus(complaintId, status);
      showToast("Status updated!", "success");
      setDetailVisible(false);
    } catch (err: any) {
      showToast(err.message || "Failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHandover = async () => {
    if (!handedToName.trim()) {
      setHandoverError("Please enter the name.");
      return;
    }
    if (!handoverItem) return;
    setHandoverLoading(true);
    try {
      await lostFoundAPI.handover(handoverItem.id, handedToName.trim());
      setFeedItems((prev) => prev.filter((i) => i.id !== handoverItem.id));
      setHandoverItem(null);
     if (staffUid) fetchLostFound(staffUid);
setRefreshing(false);
    } catch (err: any) {
      setHandoverError(err.message || "Failed.");
    } finally {
      setHandoverLoading(false);
    }
  };
  const handlePickPhoto = async () => {
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
      setPhotoUploading(true);
      const url = await uploadToCloudinary(
        result.assets[0].uri,
        "unifix/profiles",
      );
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), { photoUrl: url });
        setStaffData((prev) => (prev ? { ...prev, photoUrl: url } : prev));
      }
    } catch {
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileError("");
    setProfileSuccess("");
    if (!editName.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    if (editPhone && !/^[6-9]\d{9}$/.test(editPhone.trim())) {
      setProfileError("Enter a valid 10-digit phone number.");
      return;
    }
    setProfileSaving(true);
    try {
      await authAPI.updateProfile(editName.trim(), editPhone.trim());
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), {
          fullName: editName.trim(),
          phone: editPhone.trim(),
        });
        setStaffData((prev) =>
          prev
            ? { ...prev, fullName: editName.trim(), phone: editPhone.trim() }
            : prev,
        );
      }
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwError("Must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPwError("Must contain at least one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPwSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogoutAllDevices = () => {
    Alert.alert("Logout All Devices", "This will end all active sessions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          try {
            await authAPI.logoutAllDevices();
            await auth.signOut();
            router.replace("/login" as any);
          } catch {}
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Your deletion request will be sent to admin for approval.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await authAPI.deleteAccount();
              if (data.requiresApproval)
                Alert.alert(
                  "Request Submitted",
                  "Your account deletion request has been submitted and is currently under review.",
                );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to submit request.");
            }
          },
        },
      ],
    );
  };

  const handleSubmitSecurityIssue = async () => {
    setSecurityError("");
    setSecuritySuccess("");
    if (!securityIssueType) {
      setSecurityError("Please select an issue type.");
      return;
    }
    if (!securityDescription.trim()) {
      setSecurityError("Please describe the issue.");
      return;
    }
    setSecurityLoading(true);
    try {
      await authAPI.reportSecurityIssue(
        securityIssueType,
        securityDescription.trim(),
      );
      setSecuritySuccess("Security issue reported successfully.");
      setSecurityIssueType("");
      setSecurityDescription("");
    } catch (err: any) {
      setSecurityError(err.message || "Failed.");
    } finally {
      setSecurityLoading(false);
    }
  };



  const uid = staffUid ?? "";
  const pending = allComplaints.filter(
    (c) =>
      c.status === "pending" &&
      Array.isArray(c.assignableTo) &&
      c.assignableTo.includes(uid),
  );
  const active = allComplaints.filter(
    (c) =>
      (c.status === "assigned" || c.status === "in_progress") &&
      c.assignedTo === uid,
  );
  const completed = allComplaints.filter(
    (c) => c.status === "completed" && c.assignedTo === uid,
  );
  const rejected = allComplaints.filter(
    (c) =>
      Array.isArray(c.rejectedBy) && c.rejectedBy.some((r) => r.uid === uid),
  );

  const allTasks = [...pending, ...active];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const firstName = staffData?.fullName?.split(" ")[0] ?? "Team";
  const bottomNavHeight = 60 + insets.bottom;

  const STAT_ITEMS = [
    {
      iconName: "clipboard-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      label: "PENDING",
      value: pending.length,
      sub: `+${Math.min(pending.length, 3)} since morning`,
      subColor: "#8b5cf6",
    },
    {
      iconName: "flash-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      label: "IN PROGRESS",
      value: active.filter((c) => c.status === "in_progress").length,
      sub: `${Math.min(active.length, 4)} Priority`,
      subColor: "#d97706",
    },
    {
      iconName: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      label: "COMPLETED",
      value: completed.length,
      sub: "Last 7 days",
      subColor: "#16a34a",
    },
    {
      iconName: "star-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#fef3c7",
      iconColor: "#f59e0b",
      label: "RATING",
      value: avgRating !== null ? `${avgRating}/5` : "—",
      sub:
        ratingCount > 0
          ? `${ratingCount} rating${ratingCount > 1 ? "s" : ""}`
          : "No ratings yet",
      subColor: "#f59e0b",
    },
  ];

  const renderTaskCard = (c: Complaint) => {
    const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
    const catIconName = CAT_ICON_MAP[c.category] || "clipboard-outline";
    const catLabel = c.category.charAt(0).toUpperCase() + c.category.slice(1);
    const title = c.subIssue || c.customIssue || "Issue";
    const location = c.building || "Campus";
    return (
      <View key={c.id} style={s.taskCard}>
        {c.photoUrl ? (
          <TouchableOpacity
            onPress={() => setImageViewerUri(c.photoUrl!)}
            activeOpacity={0.9}
            style={{ position: "relative" }}
          >
            <Image
              source={{ uri: c.photoUrl }}
              style={s.taskPhoto}
              resizeMode="cover"
            />
            <View style={[s.urgentBadge, { backgroundColor: sc.color }]}>
              <Text style={s.urgentBadgeText}>{sc.label.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
        <View style={s.taskBody}>
          {!c.photoUrl && (
            <View style={[s.statusBadgeTop, { backgroundColor: sc.bg }]}>
              <Text style={[s.statusBadgeTopText, { color: sc.color }]}>
                {sc.label}
              </Text>
            </View>
          )}
          <Text style={s.taskTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={s.taskCatBadge}>
            <Ionicons name={catIconName} size={12} color="#16a34a" />
            <Text style={s.taskCatText}>{catLabel.toUpperCase()}</Text>
          </View>
          <View style={s.taskLocationRow}>
            <Ionicons name="location-outline" size={13} color="#64748b" />
            <Text style={s.taskLocationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <View style={s.taskReporterRow}>
            <View style={s.taskReporterAvatar}>
              <Text style={s.taskReporterAvatarText}>
                {c.submittedByName?.[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={s.taskReporterName}>
              Reporter: {c.submittedByName}
            </Text>
          </View>
          {c.status === "completed" && (c as any).rating != null && (
            <View style={s.taskRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (c as any).rating ? "star" : "star-outline"}
                  size={14}
                  color={star <= (c as any).rating ? "#f59e0b" : "#e2e8f0"}
                />
              ))}
              <Text style={s.taskRatingText}>
                {(c as any).rating}/5 — rated by reporter
              </Text>
            </View>
          )}
          <View style={s.taskBtnRow}>
            {c.status === "pending" && (
              <>
                <TouchableOpacity
                  style={s.acceptBtn}
                  onPress={() => handleAccept(c.id)}
                  disabled={actionLoading === c.id}
                >
                  {actionLoading === c.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.acceptBtnText}>Accept</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.detailBtn}
                  onPress={() => {
                    setSelectedComplaint(c);
                    setDetailVisible(true);
                  }}
                >
                  <Text style={s.detailBtnText}>View Details</Text>
                </TouchableOpacity>
              </>
            )}
            {c.status === "assigned" && (
              <>
                <TouchableOpacity
                  style={s.progressBtn}
                  onPress={() => handleUpdateStatus(c.id, "in_progress")}
                  disabled={actionLoading === c.id}
                >
                  {actionLoading === c.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.acceptBtnText}>Start Work</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.detailBtn}
                  onPress={() => {
                    setSelectedComplaint(c);
                    setDetailVisible(true);
                  }}
                >
                  <Text style={s.detailBtnText}>View Details</Text>
                </TouchableOpacity>
              </>
            )}
            {c.status === "in_progress" && (
              <>
                <TouchableOpacity
                  style={s.acceptBtn}
                  onPress={() => handleUpdateStatus(c.id, "completed")}
                  disabled={actionLoading === c.id}
                >
                  {actionLoading === c.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.acceptBtnText}>Mark Complete</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.detailBtn}
                  onPress={() => {
                    setSelectedComplaint(c);
                    setDetailVisible(true);
                  }}
                >
                  <Text style={s.detailBtnText}>View Details</Text>
                </TouchableOpacity>
              </>
            )}
            {(c.status === "completed" || c.status === "rejected") && (
              <TouchableOpacity
                style={[s.detailBtn, { flex: 1 }]}
                onPress={() => {
                  setSelectedComplaint(c);
                  setDetailVisible(true);
                }}
              >
                <Text style={s.detailBtnText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderRejectedCard = (c: Complaint) => {
    const catIconName = CAT_ICON_MAP[c.category] || "clipboard-outline";
    const catLabel = c.category.charAt(0).toUpperCase() + c.category.slice(1);
    const title = c.subIssue || c.customIssue || "Issue";
    const myRejection = Array.isArray(c.rejectedBy)
      ? c.rejectedBy.find((r) => r.uid === uid)
      : null;
    return (
      <View key={c.id} style={s.taskCard}>
        {c.photoUrl ? (
          <TouchableOpacity
            onPress={() => setImageViewerUri(c.photoUrl!)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: c.photoUrl }}
              style={s.taskPhoto}
              resizeMode="cover"
            />
            <View style={[s.urgentBadge, { backgroundColor: "#dc2626" }]}>
              <Text style={s.urgentBadgeText}>REJECTED</Text>
            </View>
          </TouchableOpacity>
        ) : null}
        <View style={s.taskBody}>
          {!c.photoUrl && (
            <View style={[s.statusBadgeTop, { backgroundColor: "#fef2f2" }]}>
              <Text style={[s.statusBadgeTopText, { color: "#dc2626" }]}>
                Rejected by You
              </Text>
            </View>
          )}
          <Text style={s.taskTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={s.taskCatBadge}>
            <Ionicons name={catIconName} size={12} color="#16a34a" />
            <Text style={s.taskCatText}>{catLabel.toUpperCase()}</Text>
          </View>
          <View style={s.taskLocationRow}>
            <Ionicons name="location-outline" size={13} color="#64748b" />
            <Text style={s.taskLocationText} numberOfLines={1}>
              {c.building || "Campus"}
            </Text>
          </View>
          <View style={s.taskReporterRow}>
            <View style={s.taskReporterAvatar}>
              <Text style={s.taskReporterAvatarText}>
                {c.submittedByName?.[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={s.taskReporterName}>
              Reporter: {c.submittedByName}
            </Text>
          </View>
          {myRejection?.reason ? (
            <View style={s.rejectedReasonBox}>
              <Text style={s.rejectedReasonLabel}>Your reason:</Text>
              <Text style={s.rejectedReasonText}>{myRejection.reason}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[s.detailBtn, { marginTop: 10 }]}
            onPress={() => {
              setSelectedComplaint(c);
              setDetailVisible(true);
            }}
          >
            <Text style={s.detailBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLostFoundCard = (item: LostItem) => {
    const isHandedOver = item.status === "handed_over";
    return (
      <View key={item.id} style={s.lfCard}>
        <View style={s.lfCardHeader}>
          <View style={s.lfAvatar}>
            <Text style={s.lfAvatarText}>
              {item.postedByName?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.lfPosterName}>{item.postedByName}</Text>
            <Text style={s.lfPosterTime}>{formatAgo(item.createdAt)}</Text>
          </View>
          {item.isMyPost && (
            <View style={s.lfMyPostBadge}>
              <Text style={s.lfMyPostBadgeText}>MY POST</Text>
            </View>
          )}
          {!isHandedOver && (
            <View style={s.lfFoundBadge}>
              <Text style={s.lfFoundBadgeText}>FOUND</Text>
            </View>
          )}
        </View>
        {item.photoUrl ? (
          <TouchableOpacity
            onPress={() => setImageViewerUri(item.photoUrl!)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.photoUrl }}
              style={s.lfImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={s.lfImageEmpty}>
            <Ionicons name="cube-outline" size={44} color="#cbd5e1" />
          </View>
        )}
        <View style={s.lfBody}>
          <Text style={s.lfTitle}>{item.itemName}</Text>
          {item.description ? (
            <Text style={s.lfDesc}>{item.description}</Text>
          ) : null}
          <View style={s.lfMetaRow}>
            <Ionicons name="location-outline" size={13} color="#374151" />
            <Text style={s.lfLocationText}>
              Room {item.roomNumber}
              {item.roomLabel ? ` — ${item.roomLabel}` : ""}
            </Text>
          </View>
          {item.collectLocation ? (
            <View style={s.lfMetaRow}>
              <Ionicons name="pin-outline" size={13} color="#16a34a" />
              <Text style={s.lfCollectText}>
                Collect from: {item.collectLocation}
              </Text>
            </View>
          ) : null}
          {isHandedOver ? (
            <View style={s.lfHandedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={s.lfHandedName}>
                  Handed to {item.handedToName}
                </Text>
                <Text style={s.lfHandedDate}>{formatDate(item.handedAt)}</Text>
              </View>
            </View>
          ) : item.isMyPost ? (
            <TouchableOpacity
              style={s.lfHandoverBtn}
              onPress={() => {
                setHandoverItem(item);
                setHandedToName("");
                setHandoverError("");
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={s.lfHandoverBtnText}>Mark as Handed Over</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderProfileMain = () => (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={[
        s.tabContainer,
        { paddingBottom: bottomNavHeight + 20 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#16a34a"]}
        />
      }
    >
      <View style={s.subHeader}>
        <Text style={s.subHeaderTitle}>My Profile</Text>
      </View>
      <View style={s.profileCard}>
        <TouchableOpacity
          onPress={handlePickPhoto}
          activeOpacity={0.85}
          style={s.profileAvatarBtn}
        >
          {staffData?.photoUrl ? (
            <Image
              source={{ uri: staffData.photoUrl }}
              style={s.profileAvatarImg}
            />
          ) : (
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>
                {staffData?.fullName?.[0]?.toUpperCase() || "S"}
              </Text>
            </View>
          )}
          <View style={s.profileCameraBtn}>
            {photoUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={13} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={s.profileName}>
          {staffData?.fullName || "Staff Member"}
        </Text>
        <View style={s.profileRoleBadge}>
          <Text style={s.profileRoleBadgeText}>MAINTENANCE STAFF</Text>
        </View>
        <Text style={s.profileHint}>
          {photoUploading ? "Uploading..." : "Tap photo to change"}
        </Text>
        <View style={s.idBadge}>
          <Text style={s.idBadgeText}>
            Staff ID: {staffData?.employeeId || "—"}
          </Text>
        </View>
        <View style={s.profilePerfBox}>
          <Text style={s.profilePerfLabel}>MONTHLY PERFORMANCE</Text>
          <Text style={s.profilePerfScore}>{completed.length} / 150</Text>
          <Text style={s.profilePerfSub}>Completed Tasks</Text>
          <Text style={s.profilePerfDesc}>
            Total: {completed.length} tasks completed this month
          </Text>
          <View style={s.progressBarWrap}>
            <View
              style={[
                s.progressBarFill,
                { width: `${Math.min(completed.length * 2, 100)}%` as any },
              ]}
            />
          </View>
        </View>
      </View>
      <View style={s.settingsList}>
        {[
          {
            icon: "person-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#f8fafc",
            label: "Personal Information",
            color: "#0f172a",
            onPress: () => {
              setEditName(staffData?.fullName || "");
              setEditPhone(staffData?.phone || "");
              setProfileError("");
              setProfileSuccess("");
              setProfileScreen("personalInfo");
            },
          },
       
          {
            icon: "lock-closed-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#f0fdf4",
            label: "Change Password",
            color: "#0f172a",
            onPress: () => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setPwError("");
              setPwSuccess("");
              setProfileScreen("changePassword");
            },
          },
          {
            icon: "phone-portrait-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#f0fdf4",
            label: "Logout from all devices",
            color: "#0f172a",
            onPress: handleLogoutAllDevices,
          },
          {
            icon: "trash-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#fef2f2",
            label: "Delete Account",
            color: "#dc2626",
            onPress: handleDeleteAccount,
          },
          {
            icon: "shield-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#fff7ed",
            label: "Report Security Issue",
            color: "#0f172a",
            onPress: () => {
              setSecurityIssueType("");
              setSecurityDescription("");
              setSecurityError("");
              setSecuritySuccess("");
              setProfileScreen("reportSecurity");
            },
          },
          {
            icon: "log-out-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#fef2f2",
            label: "Log Out",
            color: "#dc2626",
            onPress: async () => {
              await auth.signOut();
              router.replace("/login" as any);
            },
          },
        ].map((item, index, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[
              s.settingRow,
              index === arr.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={item.onPress}
          >
            <View style={[s.settingIcon, { backgroundColor: item.bg }]}>
              <Ionicons
                name={item.icon}
                size={18}
                color={item.color === "#dc2626" ? "#dc2626" : "#374151"}
              />
            </View>
            <Text style={[s.settingLabel, { color: item.color }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderPersonalInfo = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setProfileScreen("main")}
          >
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.subPageTitle}>Personal Information</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>BASIC INFO</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Full Name</Text>
            <TextInput
              style={s.formInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Phone Number</Text>
            <TextInput
              style={s.formInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="10-digit phone"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Email</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {staffData?.email || "—"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Gender</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {staffData?.gender || "Not set"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Role</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Maintenance Staff
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Designation</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {staffData?.designation || "—"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Staff ID</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {staffData?.employeeId || "—"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          {profileError ? (
            <Text style={s.formError}>{profileError}</Text>
          ) : null}
          {profileSuccess ? (
            <Text style={s.formSuccess}>{profileSuccess}</Text>
          ) : null}
          <TouchableOpacity
            style={[s.saveBtn, profileSaving && { opacity: 0.6 }]}
            onPress={handleSaveProfile}
            disabled={profileSaving}
          >
            {profileSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
        {staffData?.nationalIdCardUrl && (
          <View style={s.formCard}>
            <Text style={s.formSectionLabel}>ID CARD</Text>
            <Image
              source={{ uri: staffData.nationalIdCardUrl }}
              style={s.idCardPreview}
              resizeMode="contain"
            />
            <View style={s.privacyNote}>
              <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
              <Text style={s.privacyNoteText}>
                Your ID card is only visible to you and Admin.
              </Text>
            </View>
          </View>
        )}
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ACCOUNT PRIVACY</Text>
          <View style={s.privacyNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#64748b"
            />
            <Text style={s.privacyNoteText}>
              Your personal data is securely stored and accessible only to
              Admin.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderChangePassword = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setProfileScreen("main")}
          >
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.subPageTitle}>Change Password</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>UPDATE PASSWORD</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Current Password</Text>
            <View style={s.pwInputWrap}>
              <TextInput
                style={s.pwInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrentPw}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPw(!showCurrentPw)}
              >
                <Ionicons
                  name={showCurrentPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>New Password</Text>
            <View style={s.pwInputWrap}>
              <TextInput
                style={s.pwInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPw}
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Ionicons
                  name={showNewPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Confirm New Password</Text>
            <View style={s.pwInputWrap}>
              <TextInput
                style={s.pwInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPw}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPw(!showConfirmPw)}
              >
                <Ionicons
                  name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.pwRules}>
            {[
              { rule: "At least 8 characters", ok: newPassword.length >= 8 },
              { rule: "One uppercase letter", ok: /[A-Z]/.test(newPassword) },
              { rule: "One number", ok: /[0-9]/.test(newPassword) },
              {
                rule: "Passwords match",
                ok:
                  newPassword === confirmPassword && confirmPassword.length > 0,
              },
            ].map((r) => (
              <View key={r.rule} style={s.pwRuleRow}>
                <Ionicons
                  name={r.ok ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={r.ok ? "#16a34a" : "#94a3b8"}
                />
                <Text
                  style={[
                    s.pwRuleText,
                    { color: r.ok ? "#16a34a" : "#94a3b8" },
                  ]}
                >
                  {r.rule}
                </Text>
              </View>
            ))}
          </View>
          {pwError ? <Text style={s.formError}>{pwError}</Text> : null}
          {pwSuccess ? <Text style={s.formSuccess}>{pwSuccess}</Text> : null}
          <TouchableOpacity
            style={[
              s.saveBtn,
              (pwLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword) && { opacity: 0.6 },
            ]}
            onPress={handleChangePassword}
            disabled={
              pwLoading || !currentPassword || !newPassword || !confirmPassword
            }
          >
            {pwLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderReportSecurity = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setProfileScreen("main")}
          >
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text style={s.subPageTitle}>Report Security Issue</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ISSUE DETAILS</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Issue Type</Text>
            <View style={s.issueTypeGrid}>
              {SECURITY_ISSUE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    s.issueTypeChip,
                    securityIssueType === type && s.issueTypeChipActive,
                  ]}
                  onPress={() => setSecurityIssueType(type)}
                >
                  <Text
                    style={[
                      s.issueTypeChipText,
                      securityIssueType === type && s.issueTypeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Description</Text>
            <TextInput
              style={[
                s.formInput,
                { minHeight: 120, textAlignVertical: "top", paddingTop: 12 },
              ]}
              value={securityDescription}
              onChangeText={setSecurityDescription}
              placeholder="Describe the security issue..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
            />
          </View>
          {securityError ? (
            <Text style={s.formError}>{securityError}</Text>
          ) : null}
          {securitySuccess ? (
            <Text style={s.formSuccess}>{securitySuccess}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              s.saveBtn,
              (securityLoading ||
                !securityIssueType ||
                !securityDescription.trim()) && { opacity: 0.6 },
            ]}
            onPress={handleSubmitSecurityIssue}
            disabled={
              securityLoading ||
              !securityIssueType ||
              !securityDescription.trim()
            }
          >
            {securityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const BOTTOM_TABS: {
    key: TabType;
    iconName: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
    label: string;
    badge?: number;
  }[] = [
    {
      key: "tasks",
      iconName: "clipboard-outline",
      iconActive: "clipboard",
      label: "Tasks",
      badge: pending.length,
    },
    {
      key: "lostfound",
      iconName: "search-outline",
      iconActive: "search",
      label: "Lost & Found",
    },
    {
      key: "history",
      iconName: "time-outline",
      iconActive: "time",
      label: "History",
    },
    {
      key: "profile",
      iconName: "person-circle-outline",
      iconActive: "person-circle",
      label: "Profile",
    },
  ];

 return (
  <ScreenWrapper loading={loading} skeleton="staff" roleReady={!!staffUid && !!staffData}>
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {activeTab === "tasks" && (
        <ScrollView
          style={s.tabScroll}
          contentContainerStyle={[
            s.tabContainer,
            { paddingBottom: bottomNavHeight + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#16a34a"]}
            />
          }
        >
          <View style={s.topBar}>
            <View style={s.topBarLeft}>
              <View style={s.topBarLogoCircle}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={s.topBarLogoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={s.topBarTitle}>UniFiX</Text>
            </View>
       <View style={s.topBarRight}>
              <TouchableOpacity onPress={() => setActiveTab("profile")}>
                {staffData?.photoUrl ? (
                  <Image
                    source={{ uri: staffData.photoUrl }}
                    style={s.topBarAvatar}
                  />
                ) : (
                  <View style={s.topBarAvatarEmpty}>
                    <Text style={s.topBarAvatarText}>
                      {staffData?.fullName?.[0]?.toUpperCase() || "S"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
         {isOffline && (
            <View style={{ backgroundColor: '#f59e0b', padding: 8, alignItems: 'center', borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{"You're offline — showing cached data"}</Text>
            </View>
          )}
          <View style={s.welcomeBanner}>
            <Text style={s.welcomeLabel}>STAFF DASHBOARD</Text>
            <Text style={s.welcomeName}>Welcome, {firstName}</Text>
            <View style={s.welcomeDateRow}>
              <Ionicons name="calendar-outline" size={13} color="#64748b" />
              <Text style={s.welcomeDate}>{today}</Text>
            </View>
          </View>
          <View style={s.statsGrid}>
            {STAT_ITEMS.map((stat) => (
              <View key={stat.label} style={s.statCard}>
                <View
                  style={[s.statIconWrap, { backgroundColor: stat.iconBg }]}
                >
                  <Ionicons
                    name={stat.iconName}
                    size={20}
                    color={stat.iconColor}
                  />
                </View>
                <Text style={s.statLabel}>{stat.label}</Text>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={[s.statSub, { color: stat.subColor }]}>
                  {stat.sub}
                </Text>
              </View>
            ))}
          </View>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Active Tasks</Text>
          </View>
          {allTasks.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={36}
                  color="#16a34a"
                />
              </View>
              <Text style={s.emptyText}>All clear! No tasks assigned.</Text>
            </View>
          ) : (
            allTasks.map((c) => renderTaskCard(c))
          )}
        </ScrollView>
      )}

      {activeTab === "lostfound" && (
        <View style={{ flex: 1 }}>
          <View style={s.lfPageHeader}>
            <TouchableOpacity
              onPress={() => setActiveTab("tasks")}
              style={s.lfPageBackBtn}
            >
              <Ionicons name="arrow-back" size={18} color="#0f172a" />
            </TouchableOpacity>
            <Text style={s.lfPageTitle}>Lost & Found</Text>
            <TouchableOpacity
              style={s.lfPageAddBtn}
              onPress={() => router.push("/post-found-item" as any)}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.lfSegmentRow}>
            {(["feed", "myposts", "claims"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.lfSegBtn, lostFoundTab === tab && s.lfSegBtnActive]}
                onPress={() => setLostFoundTab(tab)}
              >
                <Text
                  style={[
                    s.lfSegBtnText,
                    lostFoundTab === tab && s.lfSegBtnTextActive,
                  ]}
                >
                  {tab === "feed"
                    ? "All Items"
                    : tab === "myposts"
                      ? "My Posts"
                      : "Claims"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView
            contentContainerStyle={[
              s.lfContainer,
              { paddingBottom: bottomNavHeight + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#16a34a"]}
              />
            }
          >
            {lostFoundTab === "feed" &&
              (feedItems.length === 0 ? (
                <View style={s.lfEmptyState}>
                  <View style={s.lfEmptyIconWrap}>
                    <Ionicons name="search-outline" size={36} color="#16a34a" />
                  </View>
                  <Text style={s.lfEmptyTitle}>No items posted yet</Text>
                  <TouchableOpacity
                    style={s.lfPostBtn}
                    onPress={() => router.push("/post-found-item" as any)}
                  >
                    <Text style={s.lfPostBtnText}>Post Found Item</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                feedItems.map(renderLostFoundCard)
              ))}
            {lostFoundTab === "myposts" &&
              (myPosts.length === 0 ? (
                <View style={s.lfEmptyState}>
                  <View style={s.lfEmptyIconWrap}>
                    <Ionicons name="cube-outline" size={36} color="#16a34a" />
                  </View>
                  <Text style={s.lfEmptyTitle}>No posts yet</Text>
                  <TouchableOpacity
                    style={s.lfPostBtn}
                    onPress={() => router.push("/post-found-item" as any)}
                  >
                    <Text style={s.lfPostBtnText}>Post Found Item</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myPosts.map(renderLostFoundCard)
              ))}
            {lostFoundTab === "claims" &&
              (claimItems.length === 0 ? (
                <View style={s.lfEmptyState}>
                  <View style={s.lfEmptyIconWrap}>
                    <Ionicons
                      name="hand-left-outline"
                      size={36}
                      color="#16a34a"
                    />
                  </View>
                  <Text style={s.lfEmptyTitle}>No claims yet</Text>
                </View>
              ) : (
                claimItems.map((item) => (
                  <View key={item.id} style={s.lfCard}>
                    <View style={s.lfCardHeader}>
                      <View
                        style={[
                          s.lfAvatar,
                          { width: 42, height: 42, borderRadius: 12 },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color="#16a34a"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.lfTitle}>{item.itemName}</Text>
                        <Text style={s.lfDesc}>
                          <Text style={{ color: "#94a3b8" }}>Handed by </Text>
                          <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                            {item.handedByName}
                          </Text>
                          {item.handedByRole ? (
                            <Text style={{ color: "#64748b" }}>
                              {" "}
                              ({item.handedByRole})
                            </Text>
                          ) : null}
                        </Text>
                        <Text style={s.lfDesc}>
                          <Text style={{ color: "#94a3b8" }}>
                            Collected by{" "}
                          </Text>
                          <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                            {item.handedToName}
                          </Text>
                        </Text>
                        {item.roomNumber ? (
                          <View style={s.lfMetaRow}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color="#64748b"
                            />
                            <Text style={s.lfLocationText}>
                              Room {item.roomNumber}
                              {item.roomLabel ? ` — ${item.roomLabel}` : ""}
                            </Text>
                          </View>
                        ) : null}
                        {item.collectLocation ? (
                          <View style={s.lfMetaRow}>
                            <Ionicons
                              name="pin-outline"
                              size={12}
                              color="#16a34a"
                            />
                            <Text style={s.lfCollectText}>
                              Handed at: {item.collectLocation}
                            </Text>
                          </View>
                        ) : null}
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 4,
                          }}
                        >
                          {formatDate(item.handedAt)}
                        </Text>
                      </View>
                      {item.photoUrl ? (
                        <TouchableOpacity
                          onPress={() => setImageViewerUri(item.photoUrl!)}
                          activeOpacity={0.9}
                        >
                          <Image
                            source={{ uri: item.photoUrl }}
                            style={{ width: 56, height: 56, borderRadius: 10 }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))
              ))}
          </ScrollView>
        </View>
      )}

      {activeTab === "history" && (
        <ScrollView
          style={s.tabScroll}
          contentContainerStyle={[
            s.tabContainer,
            { paddingBottom: bottomNavHeight + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#16a34a"]}
            />
          }
        >
          <View style={s.subHeader}>
            <Text style={s.subHeaderTitle}>History</Text>
          </View>
          <View style={s.historyStats}>
            <View style={s.historyItem}>
              <Text style={[s.historyNum, { color: "#16a34a" }]}>
                {completed.length}
              </Text>
              <Text style={s.historyLabel}>Completed</Text>
            </View>
            <View style={s.historyDivider} />
            <View style={s.historyItem}>
              <Text style={[s.historyNum, { color: "#dc2626" }]}>
                {rejected.length}
              </Text>
              <Text style={s.historyLabel}>Rejected</Text>
            </View>
          </View>
          {completed.length === 0 && rejected.length === 0 && (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="time-outline" size={36} color="#94a3b8" />
              </View>
              <Text style={s.emptyText}>No history yet</Text>
            </View>
          )}
          {completed.length > 0 && (
            <>
              <View style={s.historySection}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#16a34a"
                  style={{ marginRight: 6 }}
                />
                <Text style={s.historySectionTitle}>Completed</Text>
              </View>
              {completed.map((c) => renderTaskCard(c))}
            </>
          )}
          {rejected.length > 0 && (
            <>
              <View style={s.historySection}>
                <Ionicons
                  name="close-circle"
                  size={14}
                  color="#dc2626"
                  style={{ marginRight: 6 }}
                />
                <Text style={[s.historySectionTitle, { color: "#dc2626" }]}>
                  Rejected by You
                </Text>
              </View>
              {rejected.map((c) => renderRejectedCard(c))}
            </>
          )}
        </ScrollView>
      )}

      {activeTab === "profile" && (
        <>
          {profileScreen === "main" && renderProfileMain()}
          {profileScreen === "personalInfo" && renderPersonalInfo()}
          {profileScreen === "changePassword" && renderChangePassword()}
          {profileScreen === "reportSecurity" && renderReportSecurity()}
        </>
      )}

      <View
        style={[
          s.bottomBar,
          { paddingBottom: insets.bottom + 10, height: bottomNavHeight },
        ]}
      >
        {BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={s.bottomTab}
              onPress={() => {
                setActiveTab(tab.key);
                setProfileScreen("main");
              }}
            >
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconName}
                  size={22}
                  color={isActive ? "#16a34a" : "#94a3b8"}
                />
                {tab.badge != null && tab.badge > 0 && (
                  <View style={s.badgeDot}>
                    <Text style={s.badgeDotText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.bottomLabel, isActive && s.bottomLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={s.modalRoot}>
          <View style={s.modalTopBar}>
            <TouchableOpacity
              onPress={() => setDetailVisible(false)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={18} color="#0f172a" />
            </TouchableOpacity>
            <Text style={s.modalTopTitle}>Task Details</Text>
            <View style={{ width: 36 }} />
          </View>
          {selectedComplaint && (
            <ScrollView contentContainerStyle={s.modalContent}>
              {selectedComplaint.photoUrl ? (
                <TouchableOpacity
                  onPress={() => setImageViewerUri(selectedComplaint.photoUrl!)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: selectedComplaint.photoUrl }}
                    style={s.modalPhoto}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : null}
              <Text style={s.modalIssueTitle}>
                {selectedComplaint.subIssue ||
                  selectedComplaint.customIssue ||
                  "Issue"}
              </Text>
              <View
                style={[
                  s.statusPill,
                  {
                    backgroundColor: (
                      STATUS_CONFIG[selectedComplaint.status] ||
                      STATUS_CONFIG.pending
                    ).bg,
                    alignSelf: "flex-start",
                    marginBottom: 16,
                  },
                ]}
              >
                <Text
                  style={[
                    s.statusPillText,
                    {
                      color: (
                        STATUS_CONFIG[selectedComplaint.status] ||
                        STATUS_CONFIG.pending
                      ).color,
                    },
                  ]}
                >
                  {
                    (
                      STATUS_CONFIG[selectedComplaint.status] ||
                      STATUS_CONFIG.pending
                    ).label
                  }
                </Text>
              </View>
              <Text style={s.modalSectionLabel}>REPORTER</Text>
              <View style={s.reporterCard}>
                <View style={s.reporterAvatar}>
                  <Text style={s.reporterAvatarText}>
                    {selectedComplaint.submittedByName?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reporterName}>
                    {selectedComplaint.submittedByName}
                  </Text>
                  {selectedComplaint.submittedByPhone ? (
                    <Text style={s.reporterPhone}>
                      {selectedComplaint.submittedByPhone}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={s.callBtn}
                  onPress={() => handleCall(selectedComplaint.submittedByPhone)}
                >
                  <Ionicons name="call-outline" size={20} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <Text style={s.modalSectionLabel}>LOCATION</Text>
              <View style={s.locationCard}>
                <View style={s.locationCardIcon}>
                  <Ionicons name="location-outline" size={20} color="#16a34a" />
                </View>
                <View>
                  <Text style={s.locationCardMain}>
                    {selectedComplaint.building || "Campus"}
                  </Text>
                  <Text style={s.locationCardSub}>
                    {selectedComplaint.roomDetail || "—"}
                  </Text>
                </View>
              </View>
              {selectedComplaint.description ? (
                <>
                  <Text style={s.modalSectionLabel}>DESCRIPTION</Text>
                  <View style={s.descCard}>
                    <Text style={s.descText}>
                      {selectedComplaint.description}
                    </Text>
                  </View>
                </>
              ) : null}
              <View style={s.modalActions}>
                {selectedComplaint.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={s.acceptActionBtn}
                      onPress={() => handleAccept(selectedComplaint.id)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === selectedComplaint.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.acceptActionBtnText}>
                          Accept Request
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.rejectActionBtn}
                      onPress={() => openRejectModal(selectedComplaint.id)}
                      disabled={!!actionLoading}
                    >
                      <Text style={s.rejectActionText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedComplaint.status === "assigned" && (
                  <TouchableOpacity
                    style={s.inProgressActionBtn}
                    onPress={() =>
                      handleUpdateStatus(selectedComplaint.id, "in_progress")
                    }
                    disabled={!!actionLoading}
                  >
                    {actionLoading === selectedComplaint.id ? (
                      <ActivityIndicator color="#7c3aed" />
                    ) : (
                      <Text style={s.inProgressText}>Mark as In Progress</Text>
                    )}
                  </TouchableOpacity>
                )}
                {selectedComplaint.status === "in_progress" && (
                  <TouchableOpacity
                    style={s.acceptActionBtn}
                    onPress={() =>
                      handleUpdateStatus(selectedComplaint.id, "completed")
                    }
                    disabled={!!actionLoading}
                  >
                    {actionLoading === selectedComplaint.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.acceptActionBtnText}>
                        Mark as Completed
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
         {(selectedComplaint.status === "completed" ||
  selectedComplaint.status === "rejected") && (
  <View style={s.resolvedBanner}>
    <Text style={s.resolvedBannerText}>
      {selectedComplaint.status === "completed"
        ? (selectedComplaint as any).flagResolvedBy === "admin"
          ? "Resolved by Admin"
          : "Task completed"
        : "Task rejected"}
    </Text>
  </View>
)}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={rejectVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRejectVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.sheetOverlay}
        >
          <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Reject Complaint</Text>
            <Text style={s.sheetSub}>
              Please provide a reason for rejection
            </Text>
            <TextInput
              style={s.sheetInput}
              placeholder="Enter reason here..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
              textAlignVertical="top"
            />
            <View style={s.sheetBtnRow}>
              <TouchableOpacity
                style={s.sheetCancelBtn}
                onPress={() => {
                  setRejectVisible(false);
                  setDetailVisible(true);
                }}
              >
                <Text style={s.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.sheetRejectBtn, !!actionLoading && { opacity: 0.55 }]}
                onPress={handleReject}
                disabled={!!actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.sheetRejectText}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!handoverItem}
        animationType="slide"
        transparent
        onRequestClose={() => setHandoverItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.sheetOverlay}
        >
          <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Mark as Handed Over</Text>
            <Text style={s.sheetSub}>
              Enter the name of the person who collected{" "}
              {handoverItem?.itemName}
            </Text>
            <TextInput
              style={[
                s.sheetInput,
                { minHeight: 50, textAlignVertical: "auto" },
              ]}
              placeholder="e.g. Shaho"
              placeholderTextColor="#9ca3af"
              value={handedToName}
              onChangeText={(t) => {
                setHandedToName(t);
                setHandoverError("");
              }}
              autoCapitalize="words"
            />
            {handoverError ? (
              <Text
                style={{
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 8,
                  fontWeight: "500",
                }}
              >
                {handoverError}
              </Text>
            ) : null}
            <View style={s.sheetBtnRow}>
              <TouchableOpacity
                style={s.sheetCancelBtn}
                onPress={() => setHandoverItem(null)}
                disabled={handoverLoading}
              >
                <Text style={s.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.acceptActionBtn,
                  { flex: 1 },
                  handoverLoading && { opacity: 0.55 },
                ]}
                onPress={handleHandover}
                disabled={handoverLoading}
              >
                {handoverLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.acceptActionBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {imageViewerUri && (
        <ImageViewer
          uri={imageViewerUri}
          visible={!!imageViewerUri}
          onClose={() => setImageViewerUri(null)}
        />
      )}

      {toast && (
        <Animated.View
          style={[
            s.toast,
            toast.type === "success" && s.toastSuccess,
            toast.type === "error" && s.toastError,
            toast.type === "info" && s.toastInfo,
            {
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 0],
                  }),
                },
              ],
              opacity: toastAnim,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={
              toast.type === "success"
                ? "checkmark-circle"
                : toast.type === "error"
                  ? "close-circle"
                  : "information-circle"
            }
            size={18}
            color="#fff"
          />
          <Text style={s.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
</View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  tabScroll: { flex: 1 },
  tabContainer: { paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 16,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBarLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  topBarLogoImg: { width: 32, height: 32 },
  topBarTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  topBarAvatarEmpty: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarAvatarText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  welcomeBanner: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  welcomeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 1,
    marginBottom: 6,
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  welcomeDateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  welcomeDate: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  statSub: { fontSize: 11, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  taskPhoto: { width: "100%", height: 180 },
  urgentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  statusBadgeTop: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  statusBadgeTopText: { fontSize: 11, fontWeight: "700" },
  taskBody: { padding: 14 },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    lineHeight: 22,
  },
  taskCatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  taskCatText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  taskLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  taskLocationText: { fontSize: 13, color: "#64748b", flex: 1 },
  taskReporterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  taskReporterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  taskReporterAvatarText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  taskReporterName: { fontSize: 12, color: "#64748b" },
  taskRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  taskRatingText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "600",
    marginLeft: 4,
  },
  taskBtnRow: { flexDirection: "row", gap: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  progressBtn: {
    flex: 1,
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  detailBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  detailBtnText: { color: "#16a34a", fontSize: 13, fontWeight: "600" },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  subHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  lfPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lfPageBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  lfPageTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  lfPageAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  lfSegmentRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lfSegBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  lfSegBtnActive: { borderBottomColor: "#16a34a" },
  lfSegBtnText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  lfSegBtnTextActive: { color: "#16a34a", fontWeight: "700" },
  lfContainer: { padding: 14, gap: 14 },
  lfEmptyState: { alignItems: "center", paddingTop: 80 },
  lfEmptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  lfEmptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  lfPostBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  lfPostBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  lfCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lfCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  lfAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },
  lfAvatarText: { fontSize: 15, fontWeight: "700", color: "#16a34a" },
  lfPosterName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  lfPosterTime: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  lfMyPostBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginLeft: 4,
  },
  lfMyPostBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  lfFoundBadge: {
    backgroundColor: "#16a34a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  lfFoundBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  lfImage: { width: "100%", height: 220 },
  lfImageEmpty: {
    width: "100%",
    height: 150,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  lfBody: { padding: 14 },
  lfTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  lfDesc: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 8 },
  lfMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  lfLocationText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  lfCollectText: { fontSize: 13, color: "#16a34a", fontWeight: "500" },
  lfHandedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  lfHandedName: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  lfHandedDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  lfHandoverBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  lfHandoverBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  historyStats: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  historyItem: { flex: 1, alignItems: "center" },
  historyNum: { fontSize: 28, fontWeight: "800" },
  historyLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 4,
  },
  historyDivider: { width: 1, height: 40, backgroundColor: "#f1f5f9" },
  historySection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  historySectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.2,
  },
  rejectedReasonBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectedReasonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 3,
  },
  rejectedReasonText: { fontSize: 13, color: "#7f1d1d", lineHeight: 18 },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  profileAvatarBtn: { position: "relative", marginBottom: 12 },
  profileAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  profileAvatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  profileAvatarText: { fontSize: 34, fontWeight: "800", color: "#16a34a" },
  profileCameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  profileRoleBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    marginBottom: 4,
  },
  profileRoleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  profileHint: { fontSize: 12, color: "#94a3b8", marginBottom: 10 },
  idBadge: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  idBadgeText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  profilePerfBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  profilePerfLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profilePerfScore: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  profilePerfSub: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  profilePerfDesc: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  progressBarWrap: { height: 5, backgroundColor: "#e2e8f0", borderRadius: 3 },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 3,
  },
  settingsList: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    gap: 14,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a", flex: 1 },
  subPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    paddingTop: 56,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  subPageTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  formSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  formField: { marginBottom: 16 },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },
  formInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  formInputReadOnly: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  formInputReadOnlyText: { fontSize: 14, color: "#64748b", flex: 1 },
  readOnlyTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    backgroundColor: "#f1f5f9",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  formError: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  formSuccess: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  idCardPreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
  },
  privacyNoteText: { flex: 1, fontSize: 13, color: "#64748b", lineHeight: 20 },
  pwInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingRight: 12,
  },
  pwInput: { flex: 1, padding: 13, fontSize: 14, color: "#0f172a" },
  pwRules: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  pwRuleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pwRuleText: { fontSize: 13, fontWeight: "500" },
  issueTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  issueTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  issueTypeChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  issueTypeChipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  issueTypeChipTextActive: { color: "#16a34a", fontWeight: "700" },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTab: { flex: 1, alignItems: "center", gap: 3 },
  bottomLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  bottomLabelActive: { color: "#16a34a", fontWeight: "700" },
  badgeDot: {
    position: "absolute",
    top: -3,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeDotText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  modalRoot: { flex: 1, backgroundColor: "#f8fafc" },
  modalTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTopTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  modalContent: { padding: 16, gap: 12, paddingBottom: 60 },
  modalPhoto: { width: "100%", height: 220, borderRadius: 14 },
  modalIssueTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  reporterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  reporterAvatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  reporterAvatarText: { fontSize: 18, fontWeight: "800", color: "#16a34a" },
  reporterName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  reporterPhone: { fontSize: 13, color: "#64748b", marginTop: 2 },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
  },
  locationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  locationCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  locationCardMain: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  locationCardSub: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  descCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  descText: { fontSize: 14, color: "#374151", lineHeight: 22 },
  modalActions: { gap: 10, paddingTop: 4 },
  acceptActionBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptActionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  inProgressActionBtn: {
    flex: 1,
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  inProgressText: { color: "#7c3aed", fontSize: 14, fontWeight: "700" },
  completeActionBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  completeText: { color: "#374151", fontSize: 14, fontWeight: "700" },
  rejectActionBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fecaca",
  },
  rejectActionText: { color: "#dc2626", fontSize: 14, fontWeight: "700" },
  resolvedBanner: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  resolvedBannerText: { color: "#16a34a", fontSize: 14, fontWeight: "700" },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  sheetSub: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  sheetInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 16,
  },
  sheetBtnRow: { flexDirection: "row", gap: 10 },
  sheetCancelBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  sheetCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  sheetRejectBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  sheetRejectText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  toastSuccess: { backgroundColor: "#0f172a" },
  toastError: { backgroundColor: "#dc2626" },
  toastInfo: { backgroundColor: "#1e40af" },
  toastText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    lineHeight: 20,
  },
});
