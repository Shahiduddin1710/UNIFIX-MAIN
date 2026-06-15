import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { auth } from "../../firebase/firebaseConfig"

async function getToken() {
  const user = auth.currentUser
  if (!user) throw new Error("Not authenticated")
  return user.getIdToken()
}

export default function DeletionsScreen() {
  const router = useRouter()
  const [data, setData] = useState<{ staffRequests: any[]; userDeletions: any[] }>({ staffRequests: [], userDeletions: [] })
  const [tab, setTab] = useState<"pending" | "logs">("pending")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchData(silent = false) {
    try {
      if (!silent) setLoading(true)
      const token = await getToken()
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/admin/deletion-requests?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      setData({ staffRequests: result.staffRequests ?? [], userDeletions: result.userDeletions ?? [] })
    } catch {}
    finally { setLoading(false) }
  }

  async function handleAction(requestId: string, action: "approve" | "reject") {
    Alert.alert(
      action === "approve" ? "Approve Deletion" : "Reject Deletion",
      action === "approve" ? "This will permanently delete the account. Continue?" : "Reject this deletion request?",
      [
        { text: "Cancel", style: "cancel" },
        { text: action === "approve" ? "Delete" : "Reject", style: "destructive", onPress: async () => {
          try {
            setActionLoading(requestId)
            const token = await getToken()
            const endpoint = action === "approve" ? "/admin/approve-deletion" : "/admin/reject-deletion"
            await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}${endpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ requestId, reason: "Processed by admin." }),
            })
            await fetchData(true)
          } catch {}
          finally { setActionLoading(null) }
        }},
      ]
    )
  }

  useEffect(() => { fetchData() }, [])
  const pending = data.staffRequests.filter(r => r.status === "pending")

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a3c2e" />
        </TouchableOpacity>
        <Text style={s.title}>Deletion Requests</Text>
        {pending.length > 0 && <View style={s.headerBadge}><Text style={s.headerBadgeText}>{pending.length}</Text></View>}
      </View>

      <View style={s.tabs}>
        {([{ key: "pending", label: "Pending" }, { key: "logs", label: "Deletion Logs" }] as const).map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={tab === "pending" ? data.staffRequests.filter(r => r.status === "pending") : data.userDeletions}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(true); setRefreshing(false) }} colors={["#16a34a"]} />}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="trash-outline" size={40} color="#cbd5e1" /><Text style={s.emptyText}>No {tab === "pending" ? "pending requests" : "deletion logs"}</Text></View>}
 renderItem={({ item }) => {
            const dateTs = item.requestedAt ?? item.deletedAt ?? null
            const dateStr = dateTs?._seconds
              ? new Date(dateTs._seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—"
            return (
              <View style={[s.card, tab === "pending" && s.cardPending]}>
                <View style={s.cardTopRow}>
                  <View style={s.avatarSmall}>
                    <Text style={s.avatarSmallText}>{item.fullName?.[0]?.toUpperCase() ?? "U"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.fullName ?? item.uid}</Text>
                    <Text style={s.sub}>{item.email ?? "—"}</Text>
                  </View>
                  <View style={[s.rolePill, { backgroundColor: tab === "pending" ? "#fef2f2" : "#f1f5f9" }]}>
                    <Text style={[s.rolePillText, { color: tab === "pending" ? "#ef4444" : "#64748b" }]}>
                      {item.role ?? "—"}
                    </Text>
                  </View>
                </View>

                <View style={s.metaRow}>
                  <Ionicons name="time-outline" size={13} color="#94a3b8" />
                  <Text style={s.metaText}>
                    {tab === "pending" ? "Requested" : "Deleted"}: {dateStr}
                  </Text>
                </View>

                {item.designation && (
                  <View style={s.metaRow}>
                    <Ionicons name="briefcase-outline" size={13} color="#94a3b8" />
                    <Text style={s.metaText}>Designation: {item.designation}</Text>
                  </View>
                )}

                {item.reason && (
                  <View style={s.metaRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
                    <Text style={[s.metaText, { color: "#ef4444" }]}>Reason: {item.reason}</Text>
                  </View>
                )}

                {tab === "pending" && (
                  <View style={s.actions}>
                    <TouchableOpacity style={s.rejectBtn} onPress={() => handleAction(item.id, "reject")} disabled={actionLoading === item.id}>
                      <Text style={s.rejectBtnText}>{actionLoading === item.id ? "…" : "Reject"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.approveBtn} onPress={() => handleAction(item.id, "approve")} disabled={actionLoading === item.id}>
                      <Ionicons name="trash-outline" size={14} color="#fff" />
                      <Text style={s.approveBtnText}>{actionLoading === item.id ? "…" : "Approve & Delete"}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {tab === "logs" && (
                  <View style={s.deletedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                    <Text style={s.deletedBadgeText}>Account Deleted</Text>
                  </View>
                )}
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#f8fafc" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#1a3c2e", flex: 1 },
  headerBadge: { backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  headerBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#f1f5f9" },
  tabActive: { backgroundColor: "#1a3c2e" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardPending: { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  name: { fontSize: 14, fontWeight: "700", color: "#1a3c2e", marginBottom: 2 },
  sub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  reason: { fontSize: 12, color: "#ef4444", marginTop: 6, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a3c2e", alignItems: "center", justifyContent: "center" },
  avatarSmallText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  rolePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  metaText: { fontSize: 12, color: "#64748b" },
  approveBtn: { flex: 1, backgroundColor: "#ef4444", borderRadius: 10, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  deletedBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "#f0fdf4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start" },
  deletedBadgeText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
})