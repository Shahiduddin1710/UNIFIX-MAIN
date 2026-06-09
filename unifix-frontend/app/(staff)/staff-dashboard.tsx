import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  View
} from "react-native";
import StaffFoundScreen from "./staff-found";
import StaffHistoryScreen from "./staff-history";
import StaffProfileScreen from "./staff-profile";

import { Ionicons } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth, db } from "../../firebase/firebaseConfig";
import { authAPI, complaintsAPI } from "../../services/api";

import ScreenWrapper from "@/wrappers/ScreenWrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadCacheForce, saveCache } from "../../utils/cache";



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

export default memo(function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { openComplaintId, openTab, openLFTab } = useLocalSearchParams<{
    openComplaintId?: string;
    openTab?: string;
    openLFTab?: string;
  }>();

  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);

 const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [staffUid, setStaffUid] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const hasBootstrapped = useRef(false);
  const [skeletonEnabled, setSkeletonEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("tasks");

 
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);



  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);


  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<any>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const pendingOpenComplaintId = useRef<string | null>(null);



  const showToast = useCallback((
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
  }, [toastAnim]);
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

    const pendingUnsub = onSnapshot(pendingQ, () => refetchAll(uid, true));
    const assignedUnsub = onSnapshot(assignedQ, () => refetchAll(uid, true));

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

  const refetchAll = useCallback(async (uid: string, skipCache = false) => {
    if (!skipCache) {
 const cached = await loadCacheForce("staff_complaints");
      if (cached) {
        setAllComplaints(cached);
        setLoading(false);
        setDataReady(true);
      }
    }
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
      saveCache("staff_complaints", unique);
      setAvgRating(data.avgRating ?? null);
      setRatingCount(data.ratingCount ?? 0);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setLoading(false);
      setDataReady(true);
      setRefreshing(false);
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
    const bootstrap = async () => {
      const cachedUserStr = await AsyncStorage.getItem("unifix_cached_user");
      const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;

      if (cachedUser?.uid && !hasBootstrapped.current) {
        hasBootstrapped.current = true;
        setStaffUid(cachedUser.uid);

        // load cached staff profile instantly
        const cachedStaffStr = await AsyncStorage.getItem(`user_${cachedUser.uid}`);
        if (cachedStaffStr) {
          setStaffData(JSON.parse(cachedStaffStr));
        }

        // load cached complaints instantly
        const cached = await loadCacheForce("staff_complaints");
        if (cached) {
          setAllComplaints(cached);
          setDataReady(true);
          setLoading(false);
        } else {
          setSkeletonEnabled(true);
        }

        // background: subscribe + refetch
        subscribeToComplaints(cachedUser.uid);
        refetchAll(cachedUser.uid, true);
        registerPushToken();
        return;
      }

      setSkeletonEnabled(true);
    };

    bootstrap();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login" as any);
        return;
      }
      if (hasBootstrapped.current) {
        // already handled by cache — just update staff data in background
        getDoc(doc(db, "users", u.uid)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as StaffData;
            setStaffData(data);
            AsyncStorage.setItem(`user_${u.uid}`, JSON.stringify(data));
          }
        });
        return;
      }
      hasBootstrapped.current = true;
      setStaffUid(u.uid);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data() as StaffData;
        setStaffData(data);
        AsyncStorage.setItem(`user_${u.uid}`, JSON.stringify(data));
      }
      subscribeToComplaints(u.uid);
      refetchAll(u.uid, true);
      registerPushToken();
    });

    return () => {
      unsub();
      if (unsubRef.current) unsubRef.current();
    };
  }, [router, subscribeToComplaints, registerPushToken, refetchAll]);

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
      router.push("/(staff)/staff-found" as any);
    }
  }, [openTab, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (staffUid) {
        await refetchAll(staffUid, true);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleCall = useCallback((phone?: string) => {
    if (!phone?.trim()) {
      showToast("No phone number available.", "info");
      return;
    }
    Linking.openURL(`tel:${phone.trim()}`);
  }, [showToast]);

  const handleAccept = useCallback(async (complaintId: string) => {
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
  }, [showToast]);

  const openRejectModal = useCallback((complaintId: string) => {
    setRejectTarget(complaintId);
    setRejectReason("");
    setDetailVisible(false);
    setRejectVisible(true);
  }, []);

  const handleReject = useCallback(async () => {
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
  }, [rejectReason, rejectTarget, showToast]);

  const handleUpdateStatus = useCallback(async (complaintId: string, status: string) => {
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
  }, [showToast]);


  const uid = staffUid ?? "";
  const pending = useMemo(() => allComplaints.filter(
    (c) =>
      c.status === "pending" &&
      Array.isArray(c.assignableTo) &&
      c.assignableTo.includes(uid),
  ), [allComplaints, uid]);
  const active = useMemo(() => allComplaints.filter(
    (c) =>
      (c.status === "assigned" || c.status === "in_progress") &&
      c.assignedTo === uid,
  ), [allComplaints, uid]);

 

  const inProgress = useMemo(() => allComplaints.filter(
    (c) => c.status === "in_progress" && c.assignedTo === uid,
  ), [allComplaints, uid]);
  const assigned = useMemo(() => allComplaints.filter(
    (c) => c.status === "assigned" && c.assignedTo === uid,
  ), [allComplaints, uid]);
  const allTasks = useMemo(() => [...inProgress, ...assigned, ...pending], [inProgress, assigned, pending]);
  const today = useMemo(() => new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }), []);
  const firstName = useMemo(() => staffData?.fullName?.split(" ")[0] ?? "Team", [staffData?.fullName]);
  const bottomNavHeight = useMemo(() => 60 + insets.bottom, [insets.bottom]);

  const STAT_ITEMS = useMemo(() => [
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
      value: allComplaints.filter((c) => c.status === "completed" && c.assignedTo === uid).length,
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
  ], [pending.length, active, allComplaints, uid, avgRating, ratingCount]);

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
                {(c as any).rating}/5, rated by reporter
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


const BOTTOM_TABS = useMemo<{
  key: TabType;
  iconName: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
}[]>(() => [
  { key: "tasks", iconName: "clipboard-outline", iconActive: "clipboard", label: "Tasks", badge: pending.length },
  { key: "lostfound", iconName: "search-outline", iconActive: "search", label: "Lost & Found" },
  { key: "history", iconName: "time-outline", iconActive: "time", label: "History" },
  { key: "profile", iconName: "person-circle-outline", iconActive: "person-circle", label: "Profile" },
], [pending.length]);

  return (
<ScreenWrapper
      loading={skeletonEnabled && !dataReady}
      skeleton="staff"
      roleReady={true}
    >
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {activeTab === "tasks" ? (
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
                    source={require("../../assets/images/logo.png")}
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
              <View
                style={{
                  backgroundColor: "#f59e0b",
                  padding: 8,
                  alignItems: "center",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
                >
                  {"You're offline, showing cached data"}
                </Text>
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
        ) : null}

<View style={{ flex: 1, display: activeTab === "lostfound" ? "flex" : "none" }}>
  <StaffFoundScreen />
</View>

<View style={{ flex: 1, display: activeTab === "history" ? "flex" : "none" }}>
  <StaffHistoryScreen
    allComplaints={allComplaints}
    staffUid={staffUid}
    refreshing={refreshing}
    onRefresh={onRefresh}
  />
</View>

<View style={{ flex: 1, display: activeTab === "profile" ? "flex" : "none" }}>
  <StaffProfileScreen />
</View>

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
                    onPress={() =>
                      setImageViewerUri(selectedComplaint.photoUrl!)
                    }
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
                    onPress={() =>
                      handleCall(selectedComplaint.submittedByPhone)
                    }
                  >
                    <Ionicons name="call-outline" size={20} color="#16a34a" />
                  </TouchableOpacity>
                </View>
                <Text style={s.modalSectionLabel}>LOCATION</Text>
                <View style={s.locationCard}>
                  <View style={s.locationCardIcon}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#16a34a"
                    />
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
                        <Text style={s.inProgressText}>
                          Mark as In Progress
                        </Text>
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
                          ? (selectedComplaint as any).flagResolvedBy ===
                            "admin"
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
                  style={[
                    s.sheetRejectBtn,
                    !!actionLoading && { opacity: 0.55 },
                  ]}
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
});

const s = StyleSheet.create({

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
