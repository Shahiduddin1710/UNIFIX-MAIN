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

function formatDate(ts: any) {
  if (!ts) return "—"
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function SecurityScreen() {
  const router = useRouter()
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
 const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function fetchIssues(silent = false) {
    try {
      if (!silent) setLoading(true)
      const token = await getToken()
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/admin/security-issues?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setIssues(data.issues ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  async function handleResolve(issueId: string) {
    Alert.alert("Resolve Issue", "Mark this security issue as resolved?", [
      { text: "Cancel", style: "cancel" },
      { text: "Resolve", style: "default", onPress: async () => {
        try {
          setActionLoading(issueId)
          const token = await getToken()
          await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/admin/resolve-security-issue`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ issueId, resolution: "Resolved by admin." }),
          })
          await fetchIssues(true)
        } catch {}
        finally { setActionLoading(null) }
      }},
    ])
  }

  useEffect(() => { fetchIssues() }, [])
  const open = issues.filter(i => i.status === "open")
  const resolved = issues.filter(i => i.status === "resolved")

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a3c2e" />
        </TouchableOpacity>
        <Text style={s.title}>Security Issues</Text>
        {open.length > 0 && <View style={s.headerBadge}><Text style={s.headerBadgeText}>{open.length}</Text></View>}
      </View>

      {loading ? <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={[...open, ...resolved]}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchIssues(true); setRefreshing(false) }} colors={["#16a34a"]} />}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="shield-checkmark-outline" size={40} color="#cbd5e1" /><Text style={s.emptyText}>No security issues</Text></View>}
       renderItem={({ item }) => {
            const isOpen = item.status === "open"
            const isExpanded = expanded === item.id
            return (
              <TouchableOpacity
                style={[s.card, isOpen && s.cardOpen]}
                activeOpacity={0.9}
                onPress={() => setExpanded(isExpanded ? null : item.id)}
              >
                <View style={s.cardTop}>
                  <View style={[s.iconWrap, { backgroundColor: isOpen ? "#fef2f2" : "#f0fdf4" }]}>
                    <Ionicons name={isOpen ? "warning" : "shield-checkmark"} size={20} color={isOpen ? "#ef4444" : "#16a34a"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.type ?? item.issueType ?? "Security Issue"}</Text>
                    <Text style={s.sub} numberOfLines={isExpanded ? undefined : 1}>
                      {item.description ?? "—"}
                    </Text>
                    <Text style={s.sub}>Reported: {formatDate(item.reportedAt)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[s.statusBadge, { backgroundColor: isOpen ? "#fef2f2" : "#f0fdf4" }]}>
                      <Text style={[s.statusText, { color: isOpen ? "#ef4444" : "#16a34a" }]}>{item.status}</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#94a3b8" />
                  </View>
                </View>

                {isExpanded && (
                  <View style={s.detailBox}>
                    <View style={s.divider} />

                    {/* Reporter Info */}
                    <Text style={s.detailSectionTitle}>Reporter Details</Text>
                <View style={s.detailRow}>
                      <Ionicons name="person-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>{item.fullName ?? "—"}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Ionicons name="mail-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>{item.email ?? "—"}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Ionicons name="call-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>{item.phone ?? "No phone saved"}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Ionicons name="shield-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>Role: {item.role ?? "—"}</Text>
                    </View>

                    {/* Full Description */}
                    <Text style={[s.detailSectionTitle, { marginTop: 10 }]}>Full Description</Text>
                    <Text style={s.detailFull}>{item.description ?? "No description provided."}</Text>

                    {/* Resolution if resolved */}
                    {item.status === "resolved" && item.resolution && (
                      <>
                        <Text style={[s.detailSectionTitle, { marginTop: 10, color: "#16a34a" }]}>Resolution</Text>
                        <Text style={[s.detailFull, { color: "#16a34a" }]}>{item.resolution}</Text>
                        {item.resolvedAt && (
                          <Text style={s.sub}>Resolved: {formatDate(item.resolvedAt)}</Text>
                        )}
                      </>
                    )}
                  </View>
                )}

                {isOpen && (
                  <TouchableOpacity
                    style={[s.resolveBtn, { marginTop: isExpanded ? 12 : 0 }]}
                    onPress={() => handleResolve(item.id)}
                    disabled={actionLoading === item.id}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={s.resolveBtnText}>{actionLoading === item.id ? "Resolving…" : "Mark Resolved"}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
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
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardOpen: { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700", color: "#1a3c2e" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  resolveBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: "flex-start" },
  resolveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  resolution: { fontSize: 12, color: "#16a34a", fontStyle: "italic", marginTop: 6 },
empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  detailBox: { marginTop: 4 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 12 },
  detailSectionTitle: { fontSize: 11, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  detailText: { fontSize: 13, color: "#374151", flex: 1 },
  detailFull: { fontSize: 13, color: "#374151", lineHeight: 20 },
})