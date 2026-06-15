import ScreenWrapper from "@/wrappers/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState, AppStateStatus,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLoadingStore } from "../../store/loadingStore";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  authAPI,
  lostReportsAPI
} from "../../services/api";
import {
  deleteLostReportById,
  getAllClaimsFromDb,
  getLostFoundFeedFromDb,
  getLostReportsFromDb,
  syncClaims,
  syncLostFoundFeed,
  syncLostReports,
  syncMyLostFoundPosts
} from "../../sync/lostFoundSyncManager";

import { getStudentComplaintsFromDb, syncStudentComplaints } from "../../sync/syncManager";
import { loadUserCache, saveUserCache } from "../../utils/cache";
import ComplaintsSection from "./sections/ComplaintsSection";
import LostFoundSection from "./sections/LostFoundSection";
import ProfileSection from "./sections/ProfileSection";
import ReportSection from "./sections/ReportSection";

const { width: SW, height: SH } = Dimensions.get("window");

type TabType = "home" | "lostfound" | "complaints" | "profile" | "report";
type FilterTab = "all" | "pending" | "resolved";

type UserData = {
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  year?: string;
  branch?: string;
  department?: string;
  employeeId?: string;
  designation?: string;
  experience?: string;
  photoUrl?: string;
  gender?: string;
  studentIdCardUrl?: string;
  teacherIdCardUrl?: string;
  rollNumber?: string;
  teacherId?: string;
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
  queueStatus?: string;
  createdAt: any;
  assignedToName: string | null;
  assignedToPhone: string | null;
  photoUrl?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  ratedAt?: any;
};

type LostItem = {
  id: string;
  itemName: string;
  category: string;
  description: string;
  roomNumber: string;
  roomLabel: string;
  collectLocation: string;
  photoUrl: string | null;
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

type LostReport = {
  id: string;
  itemName: string;
  category: string;
  description: string;
  locationLost: string;
  dateLost: string;
  howToReach: string;
  images: string[];
  postedBy?: {
    uid?: string;
    name?: string;
    role?: string;
    department?: string;
  };
  postedByName?: string;
  postedAt: any;
  status: string;
  isMyPost: boolean;
};

type LfActiveTab = "lostreports" | "feed" | "lost-history" | "claims";

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    label: string;
    dot: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  pending: {
    color: "#d97706",
    bg: "#fef3c7",
    label: "Pending",
    dot: "#d97706",
    icon: "time-outline",
  },
  assigned: {
    color: "#2563eb",
    bg: "#dbeafe",
    label: "Assigned",
    dot: "#2563eb",
    icon: "person-outline",
  },
  in_progress: {
    color: "#7c3aed",
    bg: "#ede9fe",
    label: "In Progress",
    dot: "#7c3aed",
    icon: "reload-outline",
  },
  completed: {
    color: "#16a34a",
    bg: "#dcfce7",
    label: "Completed",
    dot: "#16a34a",
    icon: "checkmark-circle",
  },
  rejected: {
    color: "#dc2626",
    bg: "#fef2f2",
    label: "Rejected",
    dot: "#dc2626",
    icon: "close-circle-outline",
  },
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
  const seconds =
    ts._seconds ?? ts.seconds ?? (typeof ts === "number" ? ts : null);
  if (!seconds) return "";
  const diff = Math.floor(Date.now() / 1000 - seconds);
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
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          style={{
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
          }}
          onPress={onClose}
        >
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
            <Image
              source={{ uri }}
              style={{ width: SW, height: SH }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(function DashboardScreen() {
  const insets = useSafeAreaInsets();
const [userData, setUserData] = useState<UserData | null>(null);
const hasLoadedOnceRef = useRef(useLoadingStore.getState().isLoaded('dashboard_loaded'));
const [loading, setLoading] = useState(!hasLoadedOnceRef.current);

const setLoadingOnce = useCallback((val: boolean) => {
  if (val === false) {
    hasLoadedOnceRef.current = true;
    useLoadingStore.getState().markLoaded('dashboard_loaded');
  }
  if (hasLoadedOnceRef.current && val === true) return;
  setLoading(val);
}, []);

// Load cached user instantly to skip skeleton on return
useEffect(() => {
    if (hasLoadedOnceRef.current) return; // already loaded, skip
    loadUserCache().then((parsed) => {
      if (parsed) {
        setUserData(parsed);
        setUserRole(parsed.role || "");
        setLoadingOnce(false);
      } else if (!hasLoadedOnceRef.current) {
        // no cache, keep loading=true until network fetch completes
      }
    });
  }, []);
const [activeTab, setActiveTab] = useState<TabType>(
  () => (useLoadingStore.getState().getActiveTab("student", "home") as TabType)
);
const activeTabRef = useRef<TabType>(activeTab);



  const router = useRouter();
const params = useLocalSearchParams<{
    openTab?: string;
    openComplaintId?: string;
    openLFTab?: string;
    skeleton?: string;
  }>();

 useEffect(() => {
    if (params.openTab === "complaints") {
      setActiveTab("complaints");
      // Force sync when coming from complaint submission
      const u = auth.currentUser;
      if (u) fetchComplaints(u.uid);
    } else if (params.openTab === "lostfound") {
      setActiveTab("lostfound");
      if (params.openLFTab) {
        setLfActiveTab(params.openLFTab as LfActiveTab);
      }
    }
  }, [params.openTab, params.openLFTab]);

const appStateRef = useRef(AppState.currentState);
const lastBgTime = useRef<number | null>(null);

  const { isLoaded, markLoaded, setDataCache, getDataCache } = useLoadingStore();
  const [complaints, setComplaints] = useState<Complaint[]>(() => getDataCache('complaints') ?? []);
 const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const [userRole, setUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [hasPendingIdCard, setHasPendingIdCard] = useState(false);

 const [feedItems, setFeedItems] = useState<LostItem[]>(() => getDataCache('feedItems') ?? []);
  const [lostReports, setLostReports] = useState<LostReport[]>(() => getDataCache('lostReports') ?? []);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>(() => getDataCache('claimItems') ?? []);
  const [userLostReports, setUserLostReports] = useState<LostReport[]>(() => getDataCache('userLostReports') ?? []);
  const [lfLoading, setLfLoading] = useState(false);
  const [lfOffline, setLfOffline] = useState(false);
  const [lfActiveTab, setLfActiveTab] = useState<LfActiveTab>("lostreports");
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

const fetchComplaints = useCallback(async (uid: string, silent = false) => {
    if (!silent) setComplaintsLoading(true);
    try {
      await syncStudentComplaints(uid);
      const data = await getStudentComplaintsFromDb(uid);
      setComplaints(data as any);
      setDataCache('complaints', data);
    } catch {
    } finally {
      if (!silent) setComplaintsLoading(false);
    }
  }, []);

  const lfUnsubRef = useRef<(() => void)[]>([]);

const forceRefreshLostReports = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await syncLostReports(true);
    const reportsUpdated = await getLostReportsFromDb();
    setLostReports(reportsUpdated as any);
    setUserLostReports(reportsUpdated.filter((r: any) => r.postedByUid === uid || r.isMyPost === true) as any);
  }, []);

const forceRefreshFeed = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    // Clear feed hash so next sync does a full re-fetch
    const { setMeta } = await import("../../db/metadataDb");
    await setMeta("lostfound_feed_hash", "");
    await setMeta("lostfound_claims_hash", "");
    await Promise.all([
      syncLostFoundFeed(),
      syncClaims(),
    ]);
    const [feedUpdated, claimsUpdated] = await Promise.all([
      getLostFoundFeedFromDb(),
      getAllClaimsFromDb(),
    ]);
    setFeedItems(feedUpdated as any);
    setClaimItems(claimsUpdated as any);
  }, []);
const fetchLostFound = useCallback(async (uid: string, silent = false) => {
    if (!silent) {
      setLfLoading(true);
      setLfOffline(false);
    }

    try {
      const [feedLocal, reportsLocal, claimsLocal] = await Promise.all([
        getLostFoundFeedFromDb(),
        getLostReportsFromDb(),
        getAllClaimsFromDb(),
      ]);

     if (feedLocal.length > 0) setFeedItems(feedLocal.map((item: any) => ({ ...item, isMyPost: item.postedBy === uid })) as any);
   if (reportsLocal.length > 0) {
        setLostReports(reportsLocal as any);
        setUserLostReports(reportsLocal.filter((r: any) => r.postedByUid === uid || r.isMyPost === true) as any);
      }
      if (claimsLocal.length > 0) setClaimItems(claimsLocal as any);

await Promise.all([
        syncLostFoundFeed(),
        syncLostReports(!silent),
        syncClaims(),
        syncMyLostFoundPosts(uid),
      ]);

      const [feedUpdated, reportsUpdated, claimsUpdated] = await Promise.all([
        getLostFoundFeedFromDb(),
        getLostReportsFromDb(),
        getAllClaimsFromDb(),
      ]);

     setFeedItems(feedUpdated.map((item: any) => ({ ...item, isMyPost: item.postedBy === uid })) as any);
      setLostReports(reportsUpdated as any);
  setUserLostReports(reportsUpdated.filter((r: any) => r.postedByUid === uid || r.isMyPost === true) as any);
      setClaimItems(claimsUpdated as any);
      setDataCache('feedItems', feedUpdated);
      setDataCache('lostReports', reportsUpdated);
      setDataCache('claimItems', claimsUpdated);

      if (!silent) setLfOffline(false);
    } catch {
      if (!silent) setLfOffline(true);
    } finally {
      if (!silent) setLfLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await authAPI.myProfile();
      setHasPendingIdCard(data.hasPendingIdCardRequest || false);
    } catch {
      // Error handled silently
    }
  }, []);

const registerPushToken = useCallback(async () => {
    try {
      const already = await AsyncStorage.getItem("unifix_push_registered");
      if (already) return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) {
        await authAPI.savePushToken(token);
        await AsyncStorage.setItem("unifix_push_registered", "1");
      }
    } catch {
      // Error handled silently
    }
  }, []);

 

 useEffect(() => {
    const init = async () => {
      try {
        // Always load profile from cache first for instant display
        const cached = await loadUserCache();
        if (cached) {
          setUserData(cached);
          setUserRole(cached.role || "");
          setLoadingOnce(false);
        }

        // Use Firebase's live user if it's ready yet, otherwise fall back to
        // the cached uid — matters right after an offline cold start, where
        // Firebase hasn't finished restoring its session but our cache +
        // SQLite data is already available.
        const u = auth.currentUser;
        const uid = u?.uid || cached?.uid;
        if (!uid) return;

        setCurrentUserId(uid);

        const alreadyFetched = isLoaded("dashboard");

        // Always load SQLite data immediately, regardless of network status
        // or whether the Firestore profile fetch below succeeds.
        const [localComplaints, localFeed, localReports, localClaims] = await Promise.all([
          getStudentComplaintsFromDb(uid),
          getLostFoundFeedFromDb(),
          getLostReportsFromDb(),
          getAllClaimsFromDb(),
        ]);
    if (localComplaints.length > 0) setComplaints(localComplaints as any);
        if (localFeed.length > 0) setFeedItems(localFeed.map((item: any) => ({ ...item, isMyPost: item.postedBy === uid })) as any);
        if (localReports.length > 0) {
          setLostReports(localReports as any);
          setUserLostReports(localReports.filter((r: any) => r.postedByUid === uid) as any);
        }
        if (localClaims.length > 0) setClaimItems(localClaims as any);
        // Always dismiss skeleton here — after SQLite read attempt — regardless of
        // whether SQLite had data. Matches Admin pattern. Network calls below are
        // background only and must never re-show the skeleton.
        setLoadingOnce(false);

        if (!u || alreadyFetched) {
          // Offline or already synced this session — stop here, cached data is shown.
          return;
        }

        // First time this session — try a full profile refresh + sync.
        // If this fails (e.g. offline), the cached profile + SQLite data
        // loaded above stay on screen as-is.
        markLoaded("dashboard");
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            const profile = snap.data() as UserData;
            setUserData(profile);
            setUserRole(profile.role || "");
            saveUserCache(profile);
          }
        } catch {
          // offline or Firestore error — keep showing cached profile
        }

        fetchComplaints(u.uid);
        fetchLostFound(u.uid);
        await fetchProfile();
        await registerPushToken();
      } catch {
        // Error handled silently
      } finally {
        setLoadingOnce(false);
      }
    };

    init();

   return () => {};
  }, []);


useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === "active") {
        const user = auth.currentUser;
        if (user) {
          // Always silent refresh — no skeleton, no loading, user sees existing data
          fetchComplaints(user.uid, true);
          fetchLostFound(user.uid, true);
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [fetchComplaints, fetchLostFound]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(  
      (response) => {
        const data = response.notification.request.content.data as any;
        const { type, complaintId } = data || {};
        if (
          complaintId &&
          (type === "complaint_accepted" ||
            type === "complaint_in_progress" ||
            type === "complaint_completed" ||
            type === "complaint_rejected" ||
            type === "new_complaint" ||
            type === "new_rating")
        ) {
          switchTab("complaints");
        }
        if (type === "new_lost_found" || type === "item_handover") {
          switchTab("lostfound");
          setLfActiveTab("feed");
        }
        if (type === "new_lost_report") {
          switchTab("lostfound");
          setLfActiveTab("lostreports");
        }
      },
    );
    return () => sub.remove();
  }, []);

const switchTab = useCallback((tab: TabType) => {
    activeTabRef.current = tab;
    setActiveTab(tab);
    requestAnimationFrame(() => {
      useLoadingStore.getState().setActiveTab("student", tab);
    });
  }, []);

const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const user = auth.currentUser;
      if (user) {
        if (activeTab === 'lostfound') {
          await fetchLostFound(user.uid);
        } else if (activeTab === 'complaints') {
          await fetchComplaints(user.uid);
        } else {
          await fetchComplaints(user.uid);
          await fetchLostFound(user.uid);
        }
      }
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchComplaints, fetchLostFound, activeTab]);

  const handleCall = useCallback((phone: string | null, name: string | null) => {
    if (!phone?.trim()) return;
    Alert.alert(
      `Call ${name || "Staff"}`,
      `Do you want to call ${name || "the assigned staff"} at ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
      ],
    );
  }, []);

const handleLogout = useCallback(async () => {
    setUserRole("");
    setLoading(false);
    await auth.signOut();
    await AsyncStorage.multiRemove([
      "unifix_cached_user",
      "unifix_active_tab",
      "unifix_staff_active_tab",
      "unifix_admin_active_tab",
    ]);
    router.replace("/login" as any);
  }, [router]);

 const handleDeleteLostReport = useCallback(async (reportId: string) => {
    Alert.alert(
      "Delete Lost Report",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingReportId(reportId);
            try {
             await lostReportsAPI.deleteReport(reportId);
              await deleteLostReportById(reportId);
              // Optimistic update
              setLostReports((prev) => prev.filter((r) => r.id !== reportId));
              setUserLostReports((prev) => prev.filter((r) => r.id !== reportId));
              // Force re-sync so hash refreshes
              forceRefreshLostReports();
            } catch (err: any) {
              Alert.alert(
                "Error",
                "Failed to delete report. Please try again.",
              );
            } finally {
              setDeletingReportId(null);
            }
          },
        },
      ],
    );
  }, [forceRefreshLostReports]);

const handleMarkFound = useCallback(async (id: string) => {
    Alert.alert("Mark as Found", "Did you find your item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Found it!",
        style: "default",
        onPress: async () => {
          try {
            await lostReportsAPI.markFound(id);
            // Optimistic update
            setLostReports((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: "found" } : r)),
            );
            setUserLostReports((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: "found" } : r)),
            );
            // Force re-sync so SQLite reflects server state
            forceRefreshLostReports();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to mark as found.");
          }
        },
      },
    ]);
  }, [forceRefreshLostReports]);

  const bottomNavHeight = useMemo(() => 60 + insets.bottom, [insets.bottom]);
  const firstName = useMemo(() => userData?.fullName?.split(" ")[0] ?? "User", [userData?.fullName]);
  const recentComplaints = useMemo(() => complaints.slice(0, 3), [complaints]);

  const NAV_TABS = useMemo<{
    key: TabType;
    icon: any;
    activeIcon: any;
    label: string;
  }[]>(() => [
    { key: "home", icon: "home-outline", activeIcon: "home", label: "Home" },
    {
      key: "report",
      icon: "warning-outline",
      activeIcon: "warning",
      label: "Report",
    },
    {
      key: "lostfound",
      icon: "search-outline",
      activeIcon: "search",
      label: "Lost & Found",
    },
    {
      key: "complaints",
      icon: "clipboard-outline",
      activeIcon: "clipboard",
      label: "Complaints",
    },
    {
      key: "profile",
      icon: "person-outline",
      activeIcon: "person",
      label: "Profile",
    },
  ], []);

useEffect(() => {
  if (userRole === "admin") {
    router.replace("/admin-dashboard" as any);
  } else if (userRole === "staff") {
    router.replace("/staff-dashboard" as any);
  }
}, [userRole]);
  



return (
<ScreenWrapper
      loading={loading}
      skeleton="dashboard"
    >
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {activeTab !== "report" && activeTab !== "lostfound" && (
          <View style={s.topBar}>
            <Text style={s.topBarTitle}>UniFiX</Text>
          </View>
        )}

        {activeTab === "home" && (
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.container,
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
            <View style={s.greetingRow}>
              <Text style={s.greeting}>Hello, {firstName}</Text>
              <Text style={s.greetingSub}>
                Welcome back to your campus dashboard
              </Text>
            </View>
            {recentComplaints.length > 0 ? (
              <>
                <View style={s.sectionRow}>
                  <Text style={s.sectionTitle}>Recent Activity</Text>
                  <TouchableOpacity onPress={() => switchTab("complaints")}>
                    <Text style={s.seeAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                {recentComplaints.map((c) => {
                  const sm = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                  const issue = c.subIssue || c.customIssue || "Issue reported";
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={s.activityCard}
                      onPress={() => switchTab("complaints")}
                      activeOpacity={0.85}
                    >
                      <View style={s.activityLeft}>
                        <View style={s.activityIconWrap}>
                          <Ionicons
                            name={CAT_ICONS[c.category] || "construct-outline"}
                            size={18}
                            color="#16a34a"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.activityTitle} numberOfLines={1}>
                            {issue}
                          </Text>
                          <Text style={s.activitySub} numberOfLines={1}>
                            {c.building} • {formatAgo(c.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={[s.statusPill, { backgroundColor: sm.bg }]}>
                        <Text style={[s.statusPillText, { color: sm.color }]}>
                          {sm.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <View style={s.emptyState}>
                <View style={s.emptyIconWrap}>
                  <Ionicons
                    name="clipboard-outline"
                    size={40}
                    color="#16a34a"
                  />
                </View>
                <Text style={s.emptyStateTitle}>No recent activity</Text>
                <Text style={s.emptyStateSub}>
                  Use the tabs below to report issues or check lost items
                </Text>
              </View>
            )}
          </ScrollView>
        )}

{activeTab === "complaints" && (
  <View style={{ flex: 1 }}>
   <ComplaintsSection
            complaints={complaints}
            complaintsLoading={complaintsLoading}
            filterTab={filterTab}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onSetFilterTab={setFilterTab}
            onCall={handleCall}
            bottomNavHeight={bottomNavHeight}
            onComplaintsRefreshed={(fresh) => setComplaints(fresh as any)}
          />
        </View>
)}

{activeTab === "lostfound" && (
  <View style={{ flex: 1 }}>
          <LostFoundSection
            feedItems={feedItems}
            lostReports={lostReports}
            userLostReports={userLostReports}
            claimItems={claimItems}
            lfLoading={lfLoading}
            lfOffline={lfOffline}
            lfActiveTab={lfActiveTab}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onSetLfActiveTab={setLfActiveTab}
            onMarkFound={handleMarkFound}
            onDeleteLostReport={handleDeleteLostReport}
       onForceRefreshLostReports={forceRefreshLostReports}
onForceRefreshFeed={forceRefreshFeed}
            onImageViewer={setImageViewerUri}
            deletingReportId={deletingReportId}
            formatDate={formatDate}
            formatAgo={formatAgo}
        />
        </View>
)}

{activeTab === "report" && (
  <View style={{ flex: 1 }}>
          <ReportSection
            bottomNavHeight={bottomNavHeight}
            onBackToHome={() => switchTab("home")}
       />
        </View>
)}

{activeTab === "profile" && (
  <View style={{ flex: 1 }}>
          <ProfileSection
            userData={userData}
            onLogout={handleLogout}
            hasPendingIdCard={hasPendingIdCard}
            onIdCardUpdate={fetchProfile}
     />
        </View>
)}

        <View
          style={[
            s.bottomNav,
            { paddingBottom: insets.bottom + 10, height: bottomNavHeight },
          ]}
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={s.navItem}
                onPress={() => {
                  if (tab.key === "report") switchTab("report");
                  else if (tab.key === "lostfound") switchTab("lostfound");
                  else switchTab(tab.key as TabType);
                }}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? "#16a34a" : "#94a3b8"}
                />
                <Text style={[s.navLabel, isActive && s.navLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={s.navActiveDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {imageViewerUri && (
          <ImageViewer
            uri={imageViewerUri}
            visible={!!imageViewerUri}
            onClose={() => setImageViewerUri(null)}
          />
        )}
      </View>
    </ScreenWrapper>
  );
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  topBarTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 20 },
  greetingRow: { marginBottom: 24 },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  greetingSub: { fontSize: 14, color: "#64748b", marginTop: 4 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  seeAll: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  activityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  activitySub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  bottomNav: {
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
  navItem: { flex: 1, alignItems: "center", gap: 3, position: "relative" },
  navLabel: { fontSize: 9, color: "#94a3b8", fontWeight: "600" },
  navLabelActive: { color: "#16a34a", fontWeight: "700" },
  navActiveDot: {
    position: "absolute",
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16a34a",
  },
});