import { useLoadingStore } from "@/store/loadingStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState, AppStateStatus,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import { auth } from "../../firebase/firebaseConfig";
import { authAPI } from "../../services/api";
import { getAdminComplaintsFromDb, syncAdminComplaints } from "../../sync/syncManager";
import AdminComplaintsScreen from "./AdminComplaintsScreen";
import AdminHistoryScreen from "./AdminHistoryScreen";
import AdminHomeScreen from "./AdminHomeScreen";
import AdminProfileScreen from "./AdminProfileScreen";

type TabName = "home" | "complaints" | "history" | "profile";

const TABS: { key: TabName; label: string; icon: string; activeIcon: string }[] = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "complaints", label: "Complaints", icon: "chatbubble-outline", activeIcon: "chatbubble" },
  { key: "history", label: "History", icon: "time-outline", activeIcon: "time" },
  { key: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

export default memo(function AdminDashboard() {
  const router = useRouter();
const [activeTab, setActiveTab] = useState<TabName>(
  () => (useLoadingStore.getState().getActiveTab("admin", "home") as TabName)
);

  const [flaggedComplaints, setFlaggedComplaints] = useState<any[]>([]);
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
const hasFetchedRef = useRef(false);
const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cacheCheckedRef = useRef(useLoadingStore.getState().isLoaded('admin_cache_checked'));
  const appStateRef = useRef(AppState.currentState);
  const mountedRef = useRef(true);

  async function getAdminToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    return await user.getIdToken();
  }

const fetchAdminData = useCallback(async (silent = false) => {
    try {
      if (!silent && !hasFetchedRef.current) setLoading(true);
      if (silent) {
        const { setMeta } = await import('../../db/metadataDb');
        await setMeta('admin_complaints_hash', '');
      }
      const token = await getAdminToken();
      const base = process.env.EXPO_PUBLIC_BASE_URL;

      const [staffRes, userRes] = await Promise.all([
        fetch(`${base}/admin/all-staff?_=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/me?_=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const staffData = await staffRes.json();
      const userData = await userRes.json();

      await syncAdminComplaints();
      const all = await getAdminComplaintsFromDb();

      setAllComplaints(all as any);
      setFlaggedComplaints(
     all.filter((c: any) =>
          (c.flagged === true || c.flagged === 1) &&
          !c.flagResolved &&
          ["pending", "assigned", "in_progress"].includes(c.status)
        )
      );
      const pending = (staffData.staff ?? []).filter((s: any) => s.verificationStatus === "pending");
      setPendingStaff(pending);
      if (userData.admin) setAdminData(userData.admin);
      hasFetchedRef.current = true;
    } catch (e: any) {
    } finally {
      if (mountedRef.current && !silent) {
        setLoading(false);
        setDataReady(true);
        cacheCheckedRef.current = true;
      }
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  }, [fetchAdminData]);

useEffect(() => {
    getAdminComplaintsFromDb().then((local) => {
      if (local.length > 0) {
        setAllComplaints(local as any);
        setFlaggedComplaints(
        local.filter((c: any) =>
            (c.flagged === true || c.flagged === 1) &&
            !c.flagResolved &&
            ["pending", "assigned", "in_progress"].includes(c.status)
          )
        );
      }
      cacheCheckedRef.current = true;
      useLoadingStore.getState().markLoaded('admin_cache_checked');
      setDataReady(true);
    });
  }, []);
  
useEffect(() => {
     if (activeTab === "complaints") {
    pollIntervalRef.current = setInterval(() => {
      fetchAdminData(true);
    }, 30000); // refresh every 30 seconds
  } else {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === "active") {
        fetchAdminData(true); // always silent — no loading state
      }
      appStateRef.current = next;
    });
   return () => {
      sub.remove();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchAdminData, activeTab]);

useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAdminData();
        registerAdminPushToken();
      } else {
        setLoading(false);
        setDataReady(true);
      }
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  async function registerAdminPushToken() {
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
      // silent fail
    }
  }

useEffect(() => {
    const handleNotificationData = (data: any) => {
      const { type } = data || {};
      if (type === "new_staff_signup") {
        setActiveTab("complaints");
      } else if (type === "new_idcard_request") {
        router.push("/(admin)/IdCardsScreen" as any);
      } else if (type === "new_deletion_request") {
        router.push("/(admin)/DeletionsScreen" as any);
      } else if (type === "new_security_issue") {
        router.push("/(admin)/SecurityScreen" as any);
      }
    };

    // Handle tap when app was killed (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        handleNotificationData(response.notification.request.content.data);
      }
    });

    // Handle tap when app is in background/foreground
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationData(response.notification.request.content.data as any);
    });
    return () => sub.remove();
  }, []);

  const handleStaffAction = useCallback(async (uid: string, action: "approve" | "reject") => {
    try {
      setApprovingUid(uid);
      const base = process.env.EXPO_PUBLIC_BASE_URL;
      const token = await getAdminToken();
      const endpoint = action === "approve" ? "/admin/approve-staff" : "/admin/reject-staff";
      const body: any = { uid };
      if (action === "reject") body.rejectionMessage = "Rejected by admin via mobile dashboard.";
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      Alert.alert("Success", `Staff ${action === "approve" ? "approved" : "rejected"} successfully.`);
      await fetchAdminData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Action failed");
    } finally {
      setApprovingUid(null);
    }
  }, [fetchAdminData]);

const handleIWillHandle = useCallback(async (complaintId: string) => {
    try {
      setActionLoading("iwillhandle_" + complaintId);
      const token = await getAdminToken();
      const base = process.env.EXPO_PUBLIC_BASE_URL;
      const res = await fetch(`${base}/admin/iwillhandle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ complaintId }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      Toast.show({ type: "success", text1: "I Will Handle", text2: "You are now handling this complaint.", position: "bottom" });
      const { setMeta } = await import('../../db/metadataDb');
      await setMeta('admin_complaints_hash', '');
      await fetchAdminData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  }, [fetchAdminData]);

  const handleMarkResolved = useCallback(async (complaintId: string) => {
    Alert.alert(
      "Mark as Resolved",
      "This will mark the complaint as completed and notify the student. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading("resolve_" + complaintId);
              const token = await getAdminToken();
              const base = process.env.EXPO_PUBLIC_BASE_URL;
            const res = await fetch(`${base}/admin/mark-flag-resolved`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ complaintId }),
              });
              const result = await res.json();
              if (!result.success) throw new Error(result.message);
              Toast.show({ type: "success", text1: "Resolved", text2: "Complaint marked as resolved. Student notified.", position: "bottom" });
              const { setMeta } = await import('../../db/metadataDb');
              await setMeta('admin_complaints_hash', '');
              await fetchAdminData();
            } catch (e: any) {
              Toast.show({ type: "error", text1: "Error", text2: e.message || "Action failed", position: "bottom" });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [fetchAdminData]);
const flaggedCount = useMemo(() => flaggedComplaints.length, [flaggedComplaints]);
  const pendingStaffCount = useMemo(() => pendingStaff.length, [pendingStaff]);


  return (
    <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

        <View style={styles.screenContainer}>
          <View style={{ flex: 1, display: activeTab === "home" ? "flex" : "none" }}>
        <AdminHomeScreen
              flaggedComplaints={flaggedComplaints}
              allComplaints={allComplaints}
              pendingStaff={pendingStaff}
              adminData={adminData}
              onNavigateToComplaints={() => setActiveTab("complaints")}
              onNavigateToHistory={() => setActiveTab("history")}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              getAdminToken={getAdminToken}
            />
          </View>
          <View style={{ flex: 1, display: activeTab === "complaints" ? "flex" : "none" }}>
        <AdminComplaintsScreen
              allComplaints={allComplaints}
              onIWillHandle={handleIWillHandle}
              onMarkResolved={handleMarkResolved}
              actionLoading={actionLoading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          </View>
          <View style={{ flex: 1, display: activeTab === "history" ? "flex" : "none" }}>
            <AdminHistoryScreen
              allComplaints={allComplaints}
              flaggedComplaints={flaggedComplaints}
              onIWillHandle={handleIWillHandle}
              onMarkResolved={handleMarkResolved}
              actionLoading={actionLoading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          </View>
          <View style={{ flex: 1, display: activeTab === "profile" ? "flex" : "none" }}>
            <AdminProfileScreen
              adminData={adminData}
              allComplaints={allComplaints}
            />
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const showBadge = (tab.key === "complaints" && pendingStaffCount > 0) || (tab.key === "history" && flaggedCount > 0);
            const badgeCount = tab.key === "complaints" ? pendingStaffCount : flaggedCount;
            return (
<TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
  onPress={() => {
  setActiveTab(tab.key);
  requestAnimationFrame(() => {
    useLoadingStore.getState().setActiveTab("admin", tab.key);
  });
}}
                activeOpacity={0.7}
              >
                <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                  <Ionicons
                    name={(isActive ? tab.activeIcon : tab.icon) as any}
                    size={20}
                    color={isActive ? "#16a34a" : "#94a3b8"}
                  />
                  {showBadge && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
</View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0fdf4" },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: { flex: 1, alignItems: "center", gap: 4 },
  tabIconWrap: { width: 44, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", position: "relative" },
  tabIconWrapActive: { backgroundColor: "#f0fdf4" },
  tabBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  tabBadgeText: { fontSize: 9, fontWeight: "800", color: "#ffffff" },
  tabLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8" },
  tabLabelActive: { color: "#16a34a", fontWeight: "700" },
});