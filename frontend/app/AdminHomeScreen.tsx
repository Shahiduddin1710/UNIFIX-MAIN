import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where, orderBy, getDoc, doc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../firebase/firebaseConfig";
import {Image} from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  assigned: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#16a34a",
  rejected: "#ef4444",
};

const STATUS_BG: Record<string, string> = {
  pending: "#fffbeb",
  assigned: "#eff6ff",
  in_progress: "#f5f3ff",
  completed: "#f0fdf4",
  rejected: "#fef2f2",
};

function formatTimeAgo(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts._seconds * 1000);
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CATEGORY_ICONS: Record<string, string> = {
  Electrical: "flash",
  Plumbing: "water",
  Cleaning: "sparkles",
  "IT / Technical": "wifi",
  Civil: "construct",
  Carpentry: "hammer",
  Lab: "flask",
};

function getCategoryIcon(category: string): string {
  for (const key of Object.keys(CATEGORY_ICONS)) {
    if (category?.toLowerCase().includes(key.toLowerCase())) return CATEGORY_ICONS[key];
  }
  return "alert-circle";
}

interface HomeScreenProps {
  flaggedComplaints: any[];
  allComplaints: any[];
  pendingStaff: any[];
  adminData: any;
  onNavigateToComplaints: () => void;
  onNavigateToHistory: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}
export default function AdminHomeScreen({
  flaggedComplaints,
  allComplaints,
  pendingStaff,
  adminData,
  onNavigateToComplaints,
  onNavigateToHistory,
  refreshing = false,
  onRefresh,
}: HomeScreenProps) {
  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? "Good morning" : getHour() < 17 ? "Good afternoon" : "Good evening";

  const totalComplaints = allComplaints.length;
  const pendingCount = allComplaints.filter((c) => c.status === "pending").length;
  const inProgressCount = allComplaints.filter((c) => c.status === "in_progress").length;
  const completedCount = allComplaints.filter((c) => c.status === "completed").length;
  const flaggedCount = flaggedComplaints.length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyResolved = allComplaints.filter((c) => {
    if (c.status !== "completed" || !c.completedAt) return false;
    const d = c.completedAt.toDate ? c.completedAt.toDate() : new Date(c.completedAt._seconds * 1000);
    return d >= monthStart;
  }).length;

  const recentActivity = allComplaints.slice(0, 5);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

  <View style={styles.header}>
  <View style={styles.headerLeft}>
   {adminData?.photoUrl ? (
  <Image source={{ uri: adminData.photoUrl }} style={[styles.avatarSmall, { borderWidth: 1.5, borderColor: "#4ade80" }]} />
) : (
  <View style={styles.avatarSmall}>
    <Text style={styles.avatarSmallText}>{adminData?.fullName?.[0]?.toUpperCase() ?? "A"}</Text>
  </View>
)}
    <View>
      <Text style={styles.appName}>UniFix</Text>
      <Text style={styles.appSubtitle}>VCET Admin</Text>
    </View>
  </View>
</View>

     <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16a34a"]}
            tintColor="#16a34a"
          />
        }
      >

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{greeting}, Admin</Text>
          <Text style={styles.greetingSubtitle}>Here is the status of campus facilities today.</Text>
        </View>

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>TOTAL REPORTS</Text>
            <View style={styles.totalValueRow}>
              <Text style={styles.totalValue}>{totalComplaints}</Text>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up" size={12} color="#16a34a" />
                <Text style={styles.trendText}>Active</Text>
              </View>
            </View>
          </View>
          <View style={styles.miniBarChart}>
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0].map((h, i) => (
              <View key={i} style={[styles.miniBar, { height: 28 * h, opacity: 0.3 + i * 0.1 }]} />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: "#f59e0b" }]}>
            <Ionicons name="time-outline" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#3b82f6" }]}>
            <Ionicons name="construct-outline" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>Under Repair</Text>
          </View>
        </View>

        {flaggedCount > 0 && (
          <TouchableOpacity style={styles.criticalCard} onPress={onNavigateToHistory} activeOpacity={0.85}>
            <View style={styles.criticalLeft}>
              <Text style={styles.criticalLabel}>CRITICAL PRIORITY</Text>
              <View style={styles.criticalCountRow}>
                <Ionicons name="alert-circle" size={22} color="#dc2626" />
                <Text style={styles.criticalCount}>{String(flaggedCount).padStart(2, "0")}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewFlagsBtn} onPress={onNavigateToHistory}>
              <Text style={styles.viewFlagsBtnText}>View Flags</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View style={styles.monthlyCard}>
          <View>
            <Text style={styles.monthlyLabel}>Monthly Resolved</Text>
            <Text style={styles.monthlyValue}>{monthlyResolved}</Text>
          </View>
          <View style={styles.monthlyCheck}>
            <Ionicons name="checkmark" size={22} color="#ffffff" />
          </View>
        </View>

        {pendingStaff.length > 0 && (
          <View style={styles.pendingStaffCard}>
            <View style={styles.pendingStaffLeft}>
              <Ionicons name="person-add-outline" size={18} color="#f59e0b" />
              <Text style={styles.pendingStaffText}>
                {pendingStaff.length} Staff Pending Approval
              </Text>
            </View>
            <TouchableOpacity onPress={onNavigateToComplaints}>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onNavigateToComplaints}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.map((item) => {
            const isFlagged = item.flagged && ["pending", "assigned", "in_progress"].includes(item.status);
            const statusColor = STATUS_COLORS[item.status] || "#64748b";
            const statusBg = STATUS_BG[item.status] || "#f8fafc";
            return (
              <View key={item.id} style={[styles.activityCard, isFlagged && styles.activityCardFlagged]}>
                <View style={[styles.activityIcon, { backgroundColor: statusBg }]}>
                  <Ionicons name={getCategoryIcon(item.category) as any} size={18} color={statusColor} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {item.subIssue || item.customIssue || item.category || "Complaint"}
                  </Text>
                  <Text style={styles.activityLocation} numberOfLines={1}>
                    {item.building ? `${item.building}${item.roomDetail ? `, ${item.roomDetail}` : ""}` : `Floor ${item.floor || "N/A"}`}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <View style={[styles.activityStatusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.activityStatusText, { color: statusColor }]}>
                      {isFlagged ? "Critical" : item.status?.replace("_", " ")}
                    </Text>
                  </View>
                  <Text style={styles.activityTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={onNavigateToComplaints} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0fdf4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#f0fdf4",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a3c2e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
  appName: { fontSize: 15, fontWeight: "800", color: "#1a3c2e" },
  appSubtitle: { fontSize: 11, color: "#4ade80", fontWeight: "600" },

  scroll: { flex: 1 },
  greetingSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  greetingText: { fontSize: 26, fontWeight: "800", color: "#1a3c2e", marginBottom: 4 },
  greetingSubtitle: { fontSize: 13, color: "#4b7a5c", lineHeight: 18 },
  totalCard: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  totalLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.8, textTransform: "uppercase" },
  totalValueRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  totalValue: { fontSize: 36, fontWeight: "800", color: "#1a3c2e" },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  miniBarChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 32 },
  miniBar: { width: 8, backgroundColor: "#16a34a", borderRadius: 3 },
  statsRow: { flexDirection: "row", gap: 14, marginHorizontal: 20, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: "800", color: "#1a3c2e", marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  criticalCard: {
    marginHorizontal: 20,
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#fecaca",
  },
  criticalLeft: {},
  criticalLabel: { fontSize: 10, fontWeight: "800", color: "#dc2626", letterSpacing: 1, textTransform: "uppercase" },
  criticalCountRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  criticalCount: { fontSize: 30, fontWeight: "800", color: "#dc2626" },
  viewFlagsBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  viewFlagsBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  monthlyCard: {
    marginHorizontal: 20,
    backgroundColor: "#1a3c2e",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthlyLabel: { fontSize: 12, color: "#4ade80", fontWeight: "600", marginBottom: 4 },
  monthlyValue: { fontSize: 36, fontWeight: "800", color: "#ffffff" },
  monthlyCheck: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingStaffCard: {
    marginHorizontal: 20,
    backgroundColor: "#fffbeb",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  pendingStaffLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  pendingStaffText: { fontSize: 13, fontWeight: "600", color: "#92400e" },
  recentSection: { paddingHorizontal: 20 },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  recentTitle: { fontSize: 17, fontWeight: "800", color: "#1a3c2e" },
  viewAllText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  activityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  activityCardFlagged: { borderLeftColor: "#ef4444" },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: "700", color: "#1a3c2e", marginBottom: 2 },
  activityLocation: { fontSize: 12, color: "#64748b" },
  activityRight: { alignItems: "flex-end", gap: 4 },
  activityStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activityStatusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  activityTime: { fontSize: 11, color: "#94a3b8" },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16a34a",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
