import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where, orderBy, getDoc, doc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../firebase/firebaseConfig";
import AdminHomeScreen from "./AdminHomeScreen";
import AdminComplaintsScreen from "./AdminComplaintsScreen";
import AdminHistoryScreen from "./AdminHistoryScreen";
import AdminProfileScreen from "./AdminProfileScreen";
import Toast from "react-native-toast-message";
import ScreenWrapper from "@/wrappers/ScreenWrapper";
type TabName = "home" | "complaints" | "history" | "profile";

const TABS: { key: TabName; label: string; icon: string; activeIcon: string }[] = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "complaints", label: "Complaints", icon: "chatbubble-outline", activeIcon: "chatbubble" },
  { key: "history", label: "History", icon: "time-outline", activeIcon: "time" },
  { key: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [flaggedComplaints, setFlaggedComplaints] = useState<any[]>([]);
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);
const [actionLoading, setActionLoading] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);

async function handleRefresh() {
  setRefreshing(true);
  setTimeout(() => setRefreshing(false), 1000);
}
const [adminData, setAdminData] = useState<any>(null);
const [loading, setLoading] = useState(true);
  const unsubs = useRef<(() => void)[]>([]);

  useEffect(() => {
    (async () => {
const u1 = onSnapshot(
  query(collection(db, "complaints"), orderBy("createdAt", "desc")),
  (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAllComplaints(all);
    setFlaggedComplaints(
      all.filter((c: any) =>
        c.flagged === true &&
        !c.flagResolved &&
        ["pending", "assigned", "in_progress"].includes(c.status)
      )
    );
  }
);

      const q3 = query(
        collection(db, "users"),
        where("role", "==", "staff"),
        where("verificationStatus", "==", "pending")
      );
      const u3 = onSnapshot(q3, (snap) => {
        setPendingStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      unsubs.current = [u1, u3];

const user = auth.currentUser;
if (user) {
  const adminUnsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (snap.exists()) setAdminData(snap.data());
    setLoading(false);
  });
  unsubs.current.push(adminUnsub);
} else {
  setLoading(false);
}
    })();

    return () => unsubs.current.forEach((u) => u());
  }, []);

async function getAdminToken(): Promise<string> {
  const base = process.env.EXPO_PUBLIC_BASE_URL;
  const res = await fetch(`${base}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
      password: process.env.EXPO_PUBLIC_ADMIN_PASSWORD,
    }),
  });
  const data = await res.json();
  console.log("Admin login response:", JSON.stringify(data));
  if (!data.success) throw new Error("Admin login failed");
 return data.token;
}

  async function handleStaffAction(uid: string, action: "approve" | "reject") {
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
    } catch (e: any) {
      Alert.alert("Error", e.message || "Action failed");
    } finally {
      setApprovingUid(null);
    }
  }

async function handleIWillHandle(complaintId: string) {
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
  } catch (e: any) {
    Alert.alert("❌ Error", e.message || "Action failed");
  } finally {
    setActionLoading(null);
  }
}

 async function handleMarkResolved(complaintId: string) {
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
          } catch (e: any) {
           Toast.show({ type: "error", text1: "Error", text2: e.message || "Action failed", position: "bottom" });
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]
  );
}

  const flaggedCount = flaggedComplaints.length;
  const pendingStaffCount = pendingStaff.length;

return (
   <ScreenWrapper loading={loading} skeleton="admin" padTop={false} roleReady={!!adminData}>
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

      <View style={styles.screenContainer}>
   {activeTab === "home" && (
          <AdminHomeScreen
            flaggedComplaints={flaggedComplaints}
            allComplaints={allComplaints}
            pendingStaff={pendingStaff}
            adminData={adminData}
            onNavigateToComplaints={() => setActiveTab("complaints")}
            onNavigateToHistory={() => setActiveTab("history")}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      {activeTab === "complaints" && (
  <AdminComplaintsScreen
    allComplaints={allComplaints}
    pendingStaff={pendingStaff}
    approvingUid={approvingUid}
    onStaffAction={handleStaffAction}
    onIWillHandle={handleIWillHandle}
    onMarkResolved={handleMarkResolved}
    actionLoading={actionLoading}
    refreshing={refreshing}
    onRefresh={handleRefresh}
  />
)}
{activeTab === "history" && (
  <AdminHistoryScreen
    allComplaints={allComplaints}
    flaggedComplaints={flaggedComplaints}
    onIWillHandle={handleIWillHandle}
    onMarkResolved={handleMarkResolved}
    actionLoading={actionLoading}
    refreshing={refreshing}
    onRefresh={handleRefresh}
  />
)}
        {activeTab === "profile" && (
          <AdminProfileScreen
            adminData={adminData}
            allComplaints={allComplaints}
          />
        )}
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
              onPress={() => setActiveTab(tab.key)}
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
    </ScreenWrapper>
  );
}

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
