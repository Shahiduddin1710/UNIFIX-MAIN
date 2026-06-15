import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, FlatList, Image, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { auth } from "../../firebase/firebaseConfig"

async function getToken() {
  const user = auth.currentUser
  if (!user) throw new Error("Not authenticated")
  return user.getIdToken()
}

const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", approved: "#16a34a", rejected: "#ef4444" }
const STATUS_BG: Record<string, string> = { pending: "#fffbeb", approved: "#f0fdf4", rejected: "#fef2f2" }

export default function MaintenanceScreen() {
  const router = useRouter()
  const [staff, setStaff] = useState<any[]>([])
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ uid: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  async function fetchStaff(silent = false) {
    try {
      if (!silent) setLoading(true)
      const token = await getToken()
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/admin/all-staff?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setStaff(data.staff ?? [])
    } catch {}
    finally { setLoading(false) }
  }

async function handleAction(uid: string, action: "approve" | "reject", rejectionMessage?: string) {
    try {
      setActionLoading(uid)
      const token = await getToken()
      const endpoint = action === "approve" ? "/admin/approve-staff" : "/admin/reject-staff"
      const body: any = { uid }
      if (action === "reject") body.rejectionMessage = rejectionMessage?.trim() || "Rejected by admin."
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      await fetchStaff(true)
    } catch {}
    finally { setActionLoading(null) }
  }

  async function handleReject(uid: string, name: string) {
    setRejectReason("")
    setRejectModal({ uid, name })
  }

  async function submitRejection() {
    if (!rejectReason.trim()) {
      Alert.alert("Required", "Please enter a rejection reason.")
      return
    }
    if (!rejectModal) return
    setRejectModal(null)
    await handleAction(rejectModal.uid, "reject", rejectReason)
  }
  useEffect(() => { fetchStaff() }, [])

  const visible = staff.filter(s => s.verificationStatus === tab)

return (
    <View style={s.root}>
    <Modal visible={!!rejectModal} transparent animationType="fade" onRequestClose={() => setRejectModal(null)}>
        <View style={s.rejectOverlay}>
          <View style={s.rejectSheet}>
            <Text style={s.rejectSheetTitle}>Reject Staff</Text>
            <Text style={s.rejectSheetSub}>Provide a reason for rejecting <Text style={{ fontWeight: "800", color: "#1a3c2e" }}>{rejectModal?.name}</Text>. This will be sent to them via email.</Text>
            <TextInput
              style={s.rejectInput}
              placeholder="e.g. ID card not clear, invalid certificate..."
              placeholderTextColor="#94a3b8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={s.rejectSheetActions}>
              <TouchableOpacity style={s.rejectCancelBtn} onPress={() => setRejectModal(null)}>
                <Text style={s.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.rejectConfirmBtn} onPress={submitRejection}>
                <Text style={s.rejectConfirmText}>Send & Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!zoomImage} transparent animationType="fade" onRequestClose={() => setZoomImage(null)}>
        <View style={s.zoomOverlay}>
          <TouchableOpacity style={s.zoomClose} onPress={() => setZoomImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            maximumZoomScale={5}
            minimumZoomScale={1}
            centerContent
            contentContainerStyle={s.zoomScroll}
          >
            {zoomImage && <Image source={{ uri: zoomImage }} style={s.zoomImage} resizeMode="contain" />}
          </ScrollView>
        </View>
      </Modal>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a3c2e" />
        </TouchableOpacity>
        <Text style={s.title}>Maintenance Staff</Text>
      </View>

      <View style={s.tabs}>
        {(["pending", "approved", "rejected"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            <View style={[s.tabBadge, { backgroundColor: tab === t ? "#16a34a" : "#f1f5f9" }]}>
              <Text style={[s.tabBadgeText, { color: tab === t ? "#fff" : "#64748b" }]}>
                {staff.filter(x => x.verificationStatus === t).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchStaff(true); setRefreshing(false) }} colors={["#16a34a"]} />}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="people-outline" size={40} color="#cbd5e1" /><Text style={s.emptyText}>No {tab} staff</Text></View>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardRow}>
                <View style={s.avatar}><Text style={s.avatarText}>{item.fullName?.[0]?.toUpperCase() ?? "S"}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.fullName}</Text>
                  <Text style={s.sub}>{item.email}</Text>
                  <Text style={s.sub}>{item.department ?? item.category ?? "—"}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: STATUS_BG[item.verificationStatus] }]}>
                  <Text style={[s.statusText, { color: STATUS_COLOR[item.verificationStatus] }]}>{item.verificationStatus}</Text>
                </View>
              </View>
    {(item.idCardUrl || item.idCardBase64 || item.certificateUrl || item.certificateBase64) ? (
  <View style={s.docsRow}>
    {(item.idCardUrl || item.idCardBase64) && (
      <TouchableOpacity
        style={s.docBox}
        activeOpacity={0.85}
        onPress={() => setZoomImage(item.idCardUrl ?? `data:image/jpeg;base64,${item.idCardBase64}`)}
      >
        <Text style={s.imageLabel}>🪪 ID Card</Text>
        <Image
          source={{ uri: item.idCardUrl ?? `data:image/jpeg;base64,${item.idCardBase64}` }}
          style={s.docImage}
          resizeMode="cover"
        />
        <View style={s.tapHint}><Ionicons name="expand-outline" size={12} color="#fff" /><Text style={s.tapHintText}>Tap to zoom</Text></View>
      </TouchableOpacity>
    )}
    {(item.certificateUrl || item.certificateBase64) && (
      <TouchableOpacity
        style={s.docBox}
        activeOpacity={0.85}
        onPress={() => setZoomImage(item.certificateUrl ?? `data:image/jpeg;base64,${item.certificateBase64}`)}
      >
        <Text style={s.imageLabel}>📄 Certificate</Text>
        <Image
          source={{ uri: item.certificateUrl ?? `data:image/jpeg;base64,${item.certificateBase64}` }}
          style={s.docImage}
          resizeMode="cover"
        />
        <View style={s.tapHint}><Ionicons name="expand-outline" size={12} color="#fff" /><Text style={s.tapHintText}>Tap to zoom</Text></View>
      </TouchableOpacity>
    )}
  </View>
) : (
  <View style={s.noImageBox}>
    <Text style={s.noImageText}>No documents uploaded</Text>
  </View>
)}
              <View style={s.detailsBox}>
                <Text style={s.detailRow}>Phone: {item.phone || "—"}</Text>
                <Text style={s.detailRow}>Gender: {item.gender || "—"}</Text>
                <Text style={s.detailRow}>Experience: {item.experience || "—"}</Text>
                <Text style={s.detailRow}>Employee ID: {item.employeeId || "—"}</Text>
              </View>
           {tab === "pending" && (
                <View style={s.actions}>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(item.id, item.fullName)} disabled={actionLoading === item.id}>
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
  title: { fontSize: 18, fontWeight: "800", color: "#1a3c2e" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#f1f5f9" },
  tabActive: { backgroundColor: "#1a3c2e" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { fontSize: 11, fontWeight: "700" },
card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  idImage: { width: "100%", height: 160, borderRadius: 10, marginTop: 12 },
  detailsBox: { marginTop: 12, gap: 4 },
  detailRow: { fontSize: 12, color: "#374151" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c2e", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  name: { fontSize: 14, fontWeight: "700", color: "#1a3c2e" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, backgroundColor: "#fef2f2", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
  approveBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
imageLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  noImageBox: { marginTop: 12, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 14, alignItems: "center" },
  noImageText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  docsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  docBox: { flex: 1, borderRadius: 10, overflow: "hidden", backgroundColor: "#f1f5f9" },
  docImage: { width: "100%", height: 140, borderRadius: 10 },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 4, position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  tapHintText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  zoomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  zoomClose: { position: "absolute", top: 52, right: 20, zIndex: 10, padding: 8 },
  zoomScroll: { flex: 1, justifyContent: "center", alignItems: "center" },
zoomImage: { width: 380, height: 600 },
  rejectOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  rejectSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  rejectSheetTitle: { fontSize: 18, fontWeight: "800", color: "#1a3c2e", marginBottom: 8 },
  rejectSheetSub: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 16 },
  rejectInput: { backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", padding: 14, fontSize: 14, color: "#1a3c2e", minHeight: 100, marginBottom: 16 },
  rejectSheetActions: { flexDirection: "row", gap: 12 },
  rejectCancelBtn: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  rejectCancelText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  rejectConfirmBtn: { flex: 1, backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  rejectConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
})