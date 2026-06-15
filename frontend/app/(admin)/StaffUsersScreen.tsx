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

const ROLE_COLOR: Record<string, string> = { student: "#3b82f6", teacher: "#8b5cf6", staff: "#f59e0b" }
const ROLE_BG: Record<string, string> = { student: "#eff6ff", teacher: "#f5f3ff", staff: "#fffbeb" }

export default function StaffUsersScreen() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState<"student" | "teacher" | "staff">("student")
  const [loading, setLoading] = useState(true)
 const [refreshing, setRefreshing] = useState(false)
const [expanded, setExpanded] = useState<string | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  async function fetchUsers(silent = false) {
    try {
      if (!silent) setLoading(true)
      const token = await getToken()
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/admin/all-users?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])
  const visible = users.filter(u => u.role === tab)

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
        <Text style={s.title}>Staff & Users</Text>
      </View>

      <View style={s.tabs}>
        {(["student", "teacher", "staff"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            <View style={[s.tabBadge, { backgroundColor: tab === t ? "#16a34a" : "#f1f5f9" }]}>
              <Text style={[s.tabBadgeText, { color: tab === t ? "#fff" : "#64748b" }]}>
                {users.filter(x => x.role === t).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={visible}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchUsers(true); setRefreshing(false) }} colors={["#16a34a"]} />}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="people-outline" size={40} color="#cbd5e1" /><Text style={s.emptyText}>No {tab}s found</Text></View>}
    renderItem={({ item }) => {
            const isExpanded = expanded === item.id
            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.9}
                onPress={() => setExpanded(isExpanded ? null : item.id)}
              >
         {/* Top Row */}
                <View style={s.topRow}>
                  <View style={s.avatar}><Text style={s.avatarText}>{item.fullName?.[0]?.toUpperCase() ?? "U"}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.fullName}</Text>
                    <Text style={s.sub}>{item.email}</Text>
                    {item.department && <Text style={s.sub}>{item.department}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[s.roleBadge, { backgroundColor: ROLE_BG[item.role] }]}>
                      <Text style={[s.roleText, { color: ROLE_COLOR[item.role] }]}>{item.role}</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#94a3b8" />
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={s.detailBox}>
                    <View style={s.divider} />

                    <View style={s.detailRow}>
                      <Ionicons name="call-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>{item.phone || "No phone"}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Ionicons name="transgender-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>Gender: {item.gender || "—"}</Text>
                    </View>

                    {/* Student fields */}
                    {item.role === "student" && <>
                      <View style={s.detailRow}>
                        <Ionicons name="card-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Roll No: {item.rollNumber || "—"}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Ionicons name="school-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Branch: {item.branch || "—"} | Year: {item.year || "—"}</Text>
                      </View>
                    </>}

                    {/* Teacher fields */}
                    {item.role === "teacher" && <>
                      <View style={s.detailRow}>
                        <Ionicons name="business-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Dept: {item.department || "—"}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Ionicons name="ribbon-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Designation: {item.designation || "—"}</Text>
                      </View>
                    </>}

                    {/* Staff fields */}
                    {item.role === "staff" && <>
                      <View style={s.detailRow}>
                        <Ionicons name="construct-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Category: {item.category || item.department || "—"}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Ionicons name="id-card-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Employee ID: {item.employeeId || "—"}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Ionicons name="star-outline" size={14} color="#64748b" />
                        <Text style={s.detailText}>Experience: {item.experience || "—"}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#64748b" />
                        <Text style={[s.detailText, {
                          color: item.verificationStatus === "approved" ? "#16a34a"
                            : item.verificationStatus === "rejected" ? "#ef4444" : "#f59e0b"
                        }]}>
                          Status: {item.verificationStatus || "—"}
                        </Text>
                      </View>
                    </>}

              <View style={s.detailRow}>
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <Text style={s.detailText}>
                        Joined: {item.createdAt?._seconds
                          ? new Date(item.createdAt._seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </Text>
                    </View>

                    {/* ID Card */}
                    {(() => {
                      const idUrl = item.studentIdCardUrl || item.teacherIdCardUrl || item.idCardUrl || null
                      return idUrl ? (
                        <View style={{ marginTop: 10 }}>
                          <Text style={s.idLabel}>🪪 ID Card</Text>
                          <TouchableOpacity onPress={() => setZoomImage(idUrl)} activeOpacity={0.85}>
                            <Image source={{ uri: idUrl }} style={s.idThumb} resizeMode="cover" />
                            <View style={s.tapHint}>
                              <Ionicons name="expand-outline" size={12} color="#fff" />
                              <Text style={s.tapHintText}>Tap to zoom</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      ) : null
                    })()}
                  </View>
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
  title: { fontSize: 18, fontWeight: "800", color: "#1a3c2e" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#f1f5f9" },
  tabActive: { backgroundColor: "#1a3c2e" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "column", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }, 
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c2e", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  name: { fontSize: 14, fontWeight: "700", color: "#1a3c2e" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  roleBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
 topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailBox: { marginTop: 4 },
  idLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  idThumb: { width: "100%", height: 160, borderRadius: 10 },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 4, position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  tapHintText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  zoomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  zoomClose: { position: "absolute", top: 52, right: 20, zIndex: 10, padding: 8 },
  zoomScroll: { flex: 1, justifyContent: "center", alignItems: "center" },
  zoomImage: { width: 380, height: 600 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 10, marginTop: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  detailText: { fontSize: 13, color: "#374151", flex: 1 },
})