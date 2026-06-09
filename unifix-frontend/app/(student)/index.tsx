import ScreenWrapper from "@/wrappers/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Alert,
  Animated,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  authAPI,
  lostFoundAPI,
  lostReportsAPI
} from "../../services/api";
import { loadCacheForce, saveCache } from "../../utils/cache";
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
  const [loading, setLoading] = useState(true);

 const [activeTab, setActiveTab] = useState<TabType>("home");
  const activeTabRef = useRef<TabType>("home");

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
    } else if (params.openTab === "lostfound") {
      setActiveTab("lostfound");
      if (params.openLFTab) {
        setLfActiveTab(params.openLFTab as LfActiveTab);
      }
    }
  }, [params.openTab, params.openLFTab]);

const hasFetchedRef = useRef(false);
  const isFirstLoad = useRef(true);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
 const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const [userRole, setUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [hasPendingIdCard, setHasPendingIdCard] = useState(false);

  const [feedItems, setFeedItems] = useState<LostItem[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
  const [userLostReports, setUserLostReports] = useState<LostReport[]>([]);
  const [lfLoading, setLfLoading] = useState(false);
  const [lfOffline, setLfOffline] = useState(false);
  const [lfActiveTab, setLfActiveTab] = useState<LfActiveTab>("lostreports");
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  const fetchComplaints = useCallback(async (uid: string) => {
    setComplaintsLoading(true);
    try {
      const snapshot = await getDocs(
        query(
          collection(db, "complaints"),
          where("submittedBy", "==", uid),
          orderBy("createdAt", "desc"),
        ),
      );
      const data: Complaint[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setComplaints(data);
    } catch {
      // Error handled silently
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  const lfUnsubRef = useRef<(() => void)[]>([]);

  const fetchLostFound = useCallback(async (uid: string) => {
    setLfLoading(true);
    setLfOffline(false);

    try {
      const cached = await loadCacheForce("lost_found_items");
      if (cached) setFeedItems(cached);
      const cachedReports = await loadCacheForce("lost_history");
      if (cachedReports) {
        setLostReports(cachedReports);
        setUserLostReports(
          cachedReports.filter((r: LostReport) => r.postedBy?.uid === uid),
        );
      }
    } catch {
      // Error handled silently
    }

    try {
      const [feedRes, reportsRes] = await Promise.all([
        lostFoundAPI.feed(),
        lostReportsAPI.feed(),
      ]);

      const feedItemsData = feedRes.items || [];
      setFeedItems(feedItemsData);
      saveCache("lost_found_items", feedItemsData);

      const allReports = (reportsRes.items || []) as LostReport[];
      setLostReports(allReports);
      setUserLostReports(
        allReports.filter((r: LostReport) => r.postedBy?.uid === uid),
      );

      saveCache("lost_history", allReports);

      setLfOffline(false);
    } catch {
      setLfOffline(true);
    } finally {
      setLfLoading(false);
    }

    const unsubClaims = onSnapshot(
      query(collection(db, "claims"), orderBy("createdAt", "desc")),
      (snap) => {
        setClaimItems(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        );
      },
      () => {},
    );

    lfUnsubRef.current.forEach((fn) => fn());
    lfUnsubRef.current = [unsubClaims];
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
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) await authAPI.savePushToken(token);
    } catch {
      // Error handled silently
    }
  }, []);
useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        if (!hasFetchedRef.current) {
          await u.getIdToken(true);
        }
        setCurrentUserId(u.uid);
        const snap = await getDoc(doc(db, "users", u.uid));
        if (!snap.exists()) return;
        setUserData(snap.data() as UserData);
        setUserRole(snap.data()?.role || "");

  if (!hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchComplaints(u.uid);
          fetchLostFound(u.uid);
          await fetchProfile();
          await registerPushToken();
        }
      } catch {
        // Error handled silently
} finally {
        if (!hasFetchedRef.current) {
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    });
    return () => {
      unsub();
      lfUnsubRef.current.forEach((fn) => fn());
    };
  }, [fetchComplaints, fetchLostFound, fetchProfile, registerPushToken]);

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

const [, startTransition] = useTransition();
  const switchTab = useCallback((tab: TabType) => {
    activeTabRef.current = tab;
    startTransition(() => {
      setActiveTab(tab);
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await fetchComplaints(user.uid);
        await fetchLostFound(user.uid);
      }
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchComplaints, fetchLostFound]);

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
    await AsyncStorage.removeItem("unifix_cached_user");
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
              setLostReports((prev) => prev.filter((r) => r.id !== reportId));
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
  }, []);

  const handleMarkFound = useCallback(async (id: string) => {
    Alert.alert("Mark as Found", "Did you find your item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Found it!",
        style: "default",
        onPress: async () => {
          try {
            await lostReportsAPI.markFound(id);
            setLostReports((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: "found" } : r)),
            );
            setUserLostReports((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: "found" } : r)),
            );
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to mark as found.");
          }
        },
      },
    ]);
  }, []);

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

if (!currentUserId || (userRole && userRole !== "student" && userRole !== "teacher")) return null;

return (
<ScreenWrapper
      loading={loading}
      skeleton={params.skeleton === "complaint" ? "complaint" : "dashboard"}
      roleReady={userRole === "student" || userRole === "teacher"}
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

<View style={activeTab !== "complaints" ? { display: "none" } : { flex: 1 }}>
          <ComplaintsSection
            complaints={complaints}
            complaintsLoading={complaintsLoading}
            filterTab={filterTab}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onSetFilterTab={setFilterTab}
            onCall={handleCall}
            bottomNavHeight={bottomNavHeight}
          />
        </View>

        {activeTab === "lostfound" && (
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
            onImageViewer={setImageViewerUri}
            deletingReportId={deletingReportId}
            formatDate={formatDate}
            formatAgo={formatAgo}
          />
        )}

        {activeTab === "report" && (
          <ReportSection
            bottomNavHeight={bottomNavHeight}
            onBackToHome={() => switchTab("home")}
          />
        )}

        {activeTab === "profile" && (
          <ProfileSection
            userData={userData}
            onLogout={handleLogout}
            hasPendingIdCard={hasPendingIdCard}
            onIdCardUpdate={fetchProfile}
          />
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