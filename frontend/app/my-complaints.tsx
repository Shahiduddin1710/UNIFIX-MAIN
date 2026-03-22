import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, StatusBar, RefreshControl, Linking, Alert,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";
import { complaintsAPI } from "../services/api";

type RecentComplaint = {
  id: string;
  subIssue: string | null;
  customIssue: string | null;
  building: string;
  status: string;
  createdAt: any;
  assignedToName: string | null;
  assignedToPhone: string | null;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:     { label: "Pending",     color: "#d97706", bg: "#fef3c7", dot: "#d97706" },
  assigned:    { label: "Assigned",    color: "#2563eb", bg: "#dbeafe", dot: "#2563eb" },
  in_progress: { label: "In Progress", color: "#7c3aed", bg: "#ede9fe", dot: "#7c3aed" },
  completed:   { label: "Resolved",    color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
  rejected:    { label: "Rejected",    color: "#dc2626", bg: "#fee2e2", dot: "#dc2626" },
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

type FilterTab = "all" | "pending" | "assigned" | "resolved";

export default function MyComplaintsScreen() {
  const [complaints, setComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login" as any); return; }
      await fetchComplaints();
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await complaintsAPI.myComplaints();
      setComplaints(data.complaints || []);
    } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  }, []);

  const handleCall = (phone: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      `Do you want to call ${name} at ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    );
  };

  if (loading) return <View style={s.loader}><ActivityIndicator size="large" color="#16a34a" /></View>;

  const filtered = complaints.filter((c) => {
    if (filterTab === "all") return true;
    if (filterTab === "pending") return c.status === "pending";
    if (filterTab === "assigned") return c.status === "assigned" || c.status === "in_progress";
    if (filterTab === "resolved") return c.status === "completed" || c.status === "rejected";
    return true;
  });

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "pending",  label: "Pending" },
    { key: "assigned", label: "Assigned" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/" as any)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Complaints</Text>
        <View style={s.notifBtn}>
          <Ionicons name="notifications-outline" size={18} color="#0f172a" />
        </View>
      </View>
      <View style={s.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.filterChip, filterTab === tab.key && s.filterChipActive]}
            onPress={() => setFilterTab(tab.key)}
          >
            <Text style={[s.filterChipText, filterTab === tab.key && s.filterChipTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
      >
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="clipboard-outline" size={36} color="#16a34a" />
            </View>
            <Text style={s.emptyTitle}>No complaints found</Text>
            <Text style={s.emptySub}>
              {filterTab === "all"
                ? "You haven't submitted any complaints yet."
                : `No ${filterTab} complaints right now.`}
            </Text>
            <TouchableOpacity style={s.reportBtn} onPress={() => router.push("/submit-complaint" as any)}>
              <Text style={s.reportBtnText}>Report an Issue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((c) => {
            const sm = STATUS_META[c.status] || STATUS_META.pending;
            const issue = c.subIssue || c.customIssue || "Issue reported";
            const isAssigned = c.status === "assigned" || c.status === "in_progress";

            return (
              <TouchableOpacity key={c.id} style={s.card} activeOpacity={0.85} onPress={() => router.push("/submit-complaint" as any)}>
                <View style={s.cardTop}>
                  <View style={[s.statusDot, { backgroundColor: sm.dot }]} />
                  <View style={[s.statusBadge, { backgroundColor: sm.bg }]}>
                    <Text style={[s.statusBadgeText, { color: sm.color }]}>{sm.label}</Text>
                  </View>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.issueTitle} numberOfLines={2}>{issue}</Text>
                  <View style={s.metaRow}>
                    <Ionicons name="location-outline" size={13} color="#64748b" />
                    <Text style={s.metaText}>{c.building}</Text>
                  </View>
                  <View style={s.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                    <Text style={s.metaDate}>{formatDateShort(c.createdAt)}</Text>
                  </View>
                </View>

                {isAssigned && c.assignedToName ? (
                  <View style={s.staffBanner}>
                    <View style={s.staffLeft}>
                      <View style={s.staffIconWrap}>
                        <Ionicons name="person" size={14} color="#2563eb" />
                      </View>
                      <View>
                        <Text style={s.staffLabel}>Assigned Staff</Text>
                        <Text style={s.staffName}>{c.assignedToName}</Text>
                      </View>
                    </View>
                    {c.assignedToPhone ? (
                      <TouchableOpacity
                        style={s.callBtn}
                        onPress={() => handleCall(c.assignedToPhone!, c.assignedToName!)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="call" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                <View style={s.trackBtn}>
                  <Text style={s.trackBtnText}>View Tracking</Text>
                  <Ionicons name="arrow-forward" size={13} color="#16a34a" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" },
  root: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  notifBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0" },
  filterChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  filterChipText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  filterChipTextActive: { color: "#16a34a", fontWeight: "700" },
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  emptyState: { alignItems: "center", paddingTop: 72 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginBottom: 6 },
  emptySub: { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 22, marginBottom: 20, paddingHorizontal: 20 },
  reportBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  reportBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  cardBody: { marginBottom: 12 },
  issueTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 8, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  metaText: { fontSize: 13, color: "#64748b" },
  metaDate: { fontSize: 12, color: "#94a3b8" },
  staffBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#eff6ff", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: "#bfdbfe" },
  staffLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  staffIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  staffLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", marginBottom: 2 },
  staffName: { fontSize: 13, color: "#1e40af", fontWeight: "700" },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  trackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  trackBtnText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
});