import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { auth } from "../../firebase/firebaseConfig"

async function getToken() {
  const user = auth.currentUser
  if (!user) throw new Error("Not authenticated")
  return user.getIdToken()
}

export default function IdCardsScreen() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  async function fetchRequests(silent = false) {
    try {
      if (!silent) setLoading(true)
      const token = await getToken()
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/admin/idcard-requests?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setRequests(data.requests ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  async function handleAction(requestId: string, action: "approve" | "reject") {
    try {
      setActionLoading(requestId)
      const token = await getToken()
      const endpoint = action === "approve" ? "/admin/approve-idcard" : "/admin/reject-idcard"
      const body: any = { requestId }
      if (action === "reject") body.reason = "Rejected by admin."
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      await fetchRequests(true)
    } catch {}
    finally { setActionLoading(null) }
  }

  useEffect(() => { fetchRequests() }, [])
  const pending = requests.filter(r => r.status === "pending")
  const processed = requests.filter(r => r.status !== "pending")

 return (
    <View style={s.root}>
      <Modal visible={!!zoomImage} transparent animationType="fade" onRequestClose={() => setZoomImage(null)}>
        <View style={s.zoomOverlay}>
          <TouchableOpacity style={s.zoomClose} onPress={() => setZoomImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView maximumZoomScale={5} minimumZoomScale={1} centerContent contentContainerStyle={s.zoomScroll}>
            {zoomImage && <Image source={{ uri: zoomImage }} style={s.zoomImage} resizeMode="contain" />}
          </ScrollView>
        </View>
      </Modal>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a3c2e" />
        </TouchableOpacity>
        <Text style={s.title}>ID Card Requests</Text>
        {pending.length > 0 && <View style={s.headerBadge}><Text style={s.headerBadgeText}>{pending.length}</Text></View>}
      </View>

      {loading ? <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={[...pending, ...processed]}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchRequests(true); setRefreshing(false) }} colors={["#16a34a"]} />}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="card-outline" size={40} color="#cbd5e1" /><Text style={s.emptyText}>No ID card requests</Text></View>}
          renderItem={({ item }) => (
            <View style={[s.card, item.status === "pending" && s.cardPending]}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.fullName}</Text>
                  <Text style={s.sub}>{item.email}</Text>
                  <Text style={s.sub}>Role: {item.role}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: item.status === "pending" ? "#fffbeb" : item.status === "approved" ? "#f0fdf4" : "#fef2f2" }]}>
                  <Text style={[s.statusText, { color: item.status === "pending" ? "#f59e0b" : item.status === "approved" ? "#16a34a" : "#ef4444" }]}>{item.status}</Text>
                </View>
              </View>
            {item.newIdCardUrl && (
                <TouchableOpacity onPress={() => setZoomImage(item.newIdCardUrl)} activeOpacity={0.85} style={{ marginBottom: 12 }}>
                  <Image source={{ uri: item.newIdCardUrl }} style={s.idImage} resizeMode="cover" />
                  <View style={s.tapHint}>
                    <Ionicons name="expand-outline" size={12} color="#fff" />
                    <Text style={s.tapHintText}>Tap to zoom</Text>
                  </View>
                </TouchableOpacity>
              )}
              {item.status === "pending" && (
                <View style={s.actions}>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleAction(item.id, "reject")} disabled={actionLoading === item.id}>
                    <Text style={s.rejectBtnText}>{actionLoading === item.id ? "…" : "Reject"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.approveBtn} onPress={() => handleAction(item.id, "approve")} disabled={actionLoading === item.id}>
                    <Text style={s.approveBtnText}>{actionLoading === item.id ? "…" : "Approve"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  cardPending: { borderLeftWidth: 3, borderLeftColor: "#f59e0b" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  name: { fontSize: 14, fontWeight: "700", color: "#1a3c2e" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  idImage: { width: "100%", height: 160, borderRadius: 10, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, backgroundColor: "#fef2f2", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
  approveBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 4, position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  tapHintText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  zoomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  zoomClose: { position: "absolute", top: 52, right: 20, zIndex: 10, padding: 8 },
  zoomScroll: { flex: 1, justifyContent: "center", alignItems: "center" },
  zoomImage: { width: 380, height: 600 },
})