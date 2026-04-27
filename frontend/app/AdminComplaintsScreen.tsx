import { useRef, useState, useMemo, useEffect } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

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

const FILTER_TABS = ["All", "Pending", "Assigned", "In Progress", "Completed", "Rejected"];

const SEARCH_SUGGESTIONS = [
  { label: "Student complaints", query: "role:student" },
  { label: "Teacher complaints", query: "role:teacher" },
  { label: "HOD notified", query: "hod:yes" },
];

function formatElapsed(acceptedAt: any): string {
  if (!acceptedAt) return "N/A";
  const date = acceptedAt.toDate ? acceptedAt.toDate() : new Date(acceptedAt._seconds * 1000);
  const ms = Date.now() - date.getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTimestamp(ts: any): string {
  if (!ts) return "N/A";
  const date = ts.toDate ? ts.toDate() : new Date(ts._seconds * 1000);
  return date.toLocaleString("en-IN");
}

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

const SCREEN_WIDTH = Dimensions.get("window").width;

function ImageZoom({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4); })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX;
        translateY.value = savedY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }, { translateY: translateY.value }],
  }));
  const imgWidth = SCREEN_WIDTH - 40;

  return (
    <View style={[styles.zoomContainer, { width: imgWidth }]}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[animatedStyle, { width: imgWidth, height: 220 }]}>
          <Image source={{ uri }} style={{ width: imgWidth, height: 220 }} resizeMode="cover" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
export function ComplaintDetailModal({ complaint, visible, onClose, onIWillHandle, onMarkResolved, actionLoading }: {
  complaint: any;
  visible: boolean;
  onClose: () => void;
  onIWillHandle: (id: string) => void;
  onMarkResolved: (id: string) => void;
  actionLoading?: string | null;
}) {
const [imageModal, setImageModal] = useState(false);
const [rejectedByDetails, setRejectedByDetails] = useState<Record<string, any>>({});

useEffect(() => {
  if (!visible || !complaint?.rejectedBy?.length) return;
  setRejectedByDetails({});
  const fetchStaffDetails = async () => {
    const details: Record<string, any> = {};
    for (const r of complaint.rejectedBy) {
      if (!r.uid) continue;
      try {
        const base = process.env.EXPO_PUBLIC_BASE_URL;
        const loginRes = await fetch(`${base}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
            password: process.env.EXPO_PUBLIC_ADMIN_PASSWORD,
          }),
        });
        const loginData = await loginRes.json();
        if (!loginData.success) continue;

        const res = await fetch(`${base}/admin/user/${r.uid}`, {
          headers: { Authorization: `Bearer ${loginData.token}` },
        });
        const data = await res.json();
        if (data.success && data.user) details[r.uid] = data.user;
      } catch (e) {
        console.log("Error fetching staff:", e);
      }
    }
    setRejectedByDetails(details);
  };
  fetchStaffDetails();
}, [visible, complaint?.id]);

if (!complaint) return null;
 const isFlagged = complaint.flagged && !complaint.flagResolved && ["pending", "assigned", "in_progress"].includes(complaint.status);
const wasFlagged = complaint.flagged === true;

const TIMELINE = [
  { key: "pending", label: "Submitted", time: complaint.createdAt },
  { key: "assigned", label: "Accepted", time: complaint.acceptedAt || complaint.assignedAt },
  { key: "in_progress", label: "In Progress", time: complaint.inProgressAt || complaint.updatedAt },
  { key: "completed", label: "Completed", time: complaint.completedAt },
];
  const STATUS_ORDER = ["pending", "assigned", "in_progress", "completed"];
  const currentIndex = STATUS_ORDER.indexOf(complaint.status);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color="#1a3c2e" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complaint Details</Text>
            <View style={{ width: 36 }} />
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.badgeRowModal}>
              <View style={[styles.statusPill, { backgroundColor: STATUS_BG[complaint.status] || "#f8fafc" }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[complaint.status] || "#64748b" }]} />
                <Text style={[styles.statusPillText, { color: STATUS_COLORS[complaint.status] || "#64748b" }]}>
                  {complaint.status?.replace("_", " ").toUpperCase()}
                </Text>
              </View>
              {isFlagged && (
                <View style={styles.flagPill}>
                  <Ionicons name="flag" size={11} color="#dc2626" />
                  <Text style={styles.flagPillText}>FLAGGED</Text>
                </View>
              )}
              {complaint.hodEmailSent && (
                <View style={styles.hodPill}>
                  <Ionicons name="mail" size={11} color="#d97706" />
                  <Text style={styles.hodPillText}>HOD NOTIFIED</Text>
                </View>
              )}
            </View>

            <View style={styles.ticketBox}>
              <Text style={styles.ticketLabel}>TICKET ID</Text>
              <Text style={styles.ticketValue}>{complaint.ticketId || "N/A"}</Text>
            </View>

            {complaint.photoUrl && (
              <View style={styles.imageBox}>
                <Text style={styles.sectionLabel}>Complaint Photo</Text>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setImageModal(true)}>
                  <Image source={{ uri: complaint.photoUrl }} style={styles.complaintImage} resizeMode="cover" />
                </TouchableOpacity>
                <Modal visible={imageModal} transparent animationType="fade" onRequestClose={() => setImageModal(false)}>
                  <View style={styles.fullImageWrap}>
                    <TouchableOpacity style={styles.closeZoomBtn} onPress={() => setImageModal(false)}>
                      <Ionicons name="close" size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <Image source={{ uri: complaint.photoUrl }} style={styles.fullImage} resizeMode="contain" />
                  </View>
                </Modal>
              </View>
            )}

            {complaint.status !== "rejected" && (
              <View style={styles.timelineBox}>
                <Text style={styles.sectionLabel}>Progress</Text>
                {TIMELINE.map((step, index) => {
                  const isDone = index <= currentIndex;
                  const isLast = index === TIMELINE.length - 1;
                  return (
                    <View key={step.key} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, isDone && styles.timelineDotDone]} />
                        {!isLast && <View style={[styles.timelineLine, isDone && index < currentIndex && styles.timelineLineDone]} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone]}>{step.label}</Text>
                        {isDone && step.time && <Text style={styles.timelineTime}>{formatTimestamp(step.time)}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Details</Text>
            {[
              ["Category", complaint.category],
              ["Issue", complaint.subIssue || complaint.customIssue],
              ["Building", complaint.building],
              ["Room / Area", complaint.roomDetail],
              ["Description", complaint.description],
              ["Submitted By", complaint.submittedByName ? `${complaint.submittedByName} (${complaint.submittedByRole})` : "N/A"],
              ["Email", complaint.submittedByEmail],
              ["Phone", complaint.submittedByPhone],
              ["Submitted At", formatTimestamp(complaint.createdAt)],
              ["Assigned To", complaint.assignedToName || "Not assigned"],
              ["Staff Phone", complaint.assignedToPhone],
              ["Accepted At", formatTimestamp(complaint.acceptedAt)],
              ["Completed At", formatTimestamp(complaint.completedAt)],
             ["Flagged At", wasFlagged ? formatTimestamp(complaint.flaggedAt) : "Not flagged"],
              ["HOD Email Sent At", complaint.hodEmailSent ? formatTimestamp(complaint.hodEmailSentAt) : "Not sent"],
              ["Time Elapsed", complaint.acceptedAt ? formatElapsed(complaint.acceptedAt) : "N/A"],
            ].map(([label, value]) => value ? (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ) : null)}

        {complaint.flagged && !complaint.flagResolved && complaint.status !== "completed" && complaint.status !== "rejected" && (
              <View style={styles.flagActionsBox}>
                <Text style={styles.sectionLabel}>Flagged Actions</Text>
                {!complaint.adminHandling ? (
                  <TouchableOpacity style={styles.iwillhandleBtn} onPress={() => { onClose(); onIWillHandle(complaint.id); }}>
                    <Ionicons name="hand-left" size={16} color="#ffffff" />
                    <Text style={styles.iwillhandleBtnText}>I Will Handle</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.adminHandlingBadge}>
                    <Ionicons name="hand-left" size={14} color="#16a34a" />
                    <Text style={styles.adminHandlingText}>You are handling this</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.resolveBtn} onPress={() => { onClose(); onMarkResolved(complaint.id); }}>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                </TouchableOpacity>
              </View>
            )}

            {complaint.flagResolved && (
              <View style={styles.flagResolvedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.flagResolvedText}>Resolved by {complaint.flagResolvedBy === "admin" ? "Admin" : "Staff"}</Text>
              </View>
            )}

            {complaint.rating !== null && complaint.rating !== undefined && (
              <View style={styles.ratingBox}>
                <Text style={styles.sectionLabel}>Student Rating</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name={i <= complaint.rating ? "star" : "star-outline"} size={20} color={i <= complaint.rating ? "#f59e0b" : "#e2e8f0"} />
                  ))}
                  <Text style={styles.ratingNum}>{complaint.rating}/5</Text>
                </View>
                {complaint.ratingComment ? <Text style={styles.ratingComment}>{`"${complaint.ratingComment}"`}</Text> : null}
                {complaint.ratedAt && <Text style={styles.ratingTime}>Rated at: {formatTimestamp(complaint.ratedAt)}</Text>}
              </View>
            )}

{complaint.rejectedBy?.length > 0 &&
  complaint.rejectedBy.some((r: any) => r.uid !== complaint.assignedTo) && (
  <View style={styles.rejectionsBox}>
    <Text style={styles.sectionLabel}>Rejection History</Text>
    {complaint.rejectedBy.map((r: any, i: number) => {
      const staffInfo = rejectedByDetails[r.uid] || {};
      return (
        <View key={i} style={[styles.rejectionRow, i < complaint.rejectedBy.length - 1 && { borderBottomWidth: 1, borderBottomColor: "#fecaca", paddingBottom: 12, marginBottom: 12 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fef2f2", borderWidth: 1.5, borderColor: "#fecaca", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#dc2626" }}>{r.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectionName}>{r.name}</Text>
              {staffInfo.designation && <Text style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{staffInfo.designation}</Text>}
              {r.rejectedAt && <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{new Date(r.rejectedAt).toLocaleString("en-IN")}</Text>}
            </View>
          </View>
          {(staffInfo.email || staffInfo.phone) && (
            <View style={{ backgroundColor: "#ffffff", borderRadius: 8, padding: 10, marginBottom: 8, gap: 4 }}>
              {staffInfo.email && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="mail-outline" size={13} color="#64748b" />
                  <Text style={{ fontSize: 12, color: "#374151", fontWeight: "500" }}>{staffInfo.email}</Text>
                </View>
              )}
              {staffInfo.phone && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="call-outline" size={13} color="#64748b" />
                  <Text style={{ fontSize: 12, color: "#374151", fontWeight: "500" }}>{staffInfo.phone}</Text>
                </View>
              )}
            </View>
          )}
          <View style={{ backgroundColor: "#fff5f5", borderRadius: 8, padding: 8, borderLeftWidth: 3, borderLeftColor: "#dc2626" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#dc2626", marginBottom: 2 }}>REASON</Text>
            <Text style={styles.rejectionReason}>{r.reason}</Text>
          </View>
        </View>
      );
    })}
  </View>
)}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

interface ComplaintsScreenProps {
  allComplaints: any[];
  pendingStaff: any[];
  approvingUid: string | null;
  onStaffAction: (uid: string, action: "approve" | "reject") => void;
  onIWillHandle: (id: string) => void;
  onMarkResolved: (id: string) => void;
  actionLoading?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function AdminComplaintsScreen({
  allComplaints,
  pendingStaff,
  approvingUid,
  onStaffAction,
  onIWillHandle,
  onMarkResolved,
  actionLoading,
  refreshing = false,
  onRefresh,
}: ComplaintsScreenProps){
  const [activeFilter, setActiveFilter] = useState("All");
const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
const [modalVisible, setModalVisible] = useState(false);
const selectedComplaint = allComplaints.find((c) => c.id === selectedComplaintId) ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<any>(null);

 const filteredComplaints = allComplaints.filter((c) => {
  const q = searchQuery.trim().toLowerCase();
  let statusMatch = false;
  if (activeFilter === "All") statusMatch = true;
  else if (activeFilter === "Rejected") {
    statusMatch = c.status === "rejected" || (Array.isArray(c.rejectedBy) && c.rejectedBy.length > 0);
  }
  else statusMatch = c.status === activeFilter.toLowerCase().replace(/ /g, "_");

    if (!q) return statusMatch;
    if (q === "hod:yes") return statusMatch && c.hodEmailSent === true;
    if (q.startsWith("role:")) {
      const role = q.replace("role:", "").trim();
      return statusMatch && (c.submittedByRole || "").toLowerCase() === role;
    }
    const searchable = [c.submittedByName, c.submittedByEmail, c.assignedToName, c.category, c.subIssue, c.customIssue, c.description, c.location, c.roomNumber, c.floor, c.building, c.roomDetail, c.ticketId, c.submittedByRole]
      .filter(Boolean).join(" ").toLowerCase();
    return statusMatch && searchable.includes(q);
  });

  const dynamicSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SEARCH_SUGGESTIONS;
    return SEARCH_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(q) || s.query.toLowerCase().includes(q));
  }, [searchQuery]);

  const getSuggestionIcon = (query: string) => {
    if (query.startsWith("role:")) return "person";
    if (query.startsWith("flagged:")) return "flag";
    if (query.startsWith("hod:")) return "mail";
    return "search";
  };

const openTasksCount = allComplaints.filter((c) => ["pending", "assigned", "in_progress"].includes(c.status)).length;
const rejectedCount = allComplaints.filter((c) => c.status === "rejected").length;


function openComplaint(item: any) {
  setSelectedComplaintId(item.id);
  setModalVisible(true);
}

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Complaints</Text>
        <Text style={styles.headerSubtitle}>Oversee and resolve campus facility issues</Text>
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

        {pendingStaff.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-add-outline" size={16} color="#d97706" />
              <Text style={styles.sectionTitle}>Pending Staff Approvals</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingStaff.length}</Text>
              </View>
            </View>
            {pendingStaff.map((staff) => (
              <View key={staff.id} style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{staff.fullName?.[0]?.toUpperCase() ?? "S"}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{staff.fullName || "N/A"}</Text>
                  <Text style={styles.staffMeta}>{staff.designation || "N/A"} · {staff.department || "N/A"}</Text>
                  <Text style={styles.staffEmail}>{staff.email}</Text>
                </View>
                <View style={styles.staffActionsCol}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => onStaffAction(staff.uid || staff.id, "approve")}
                    disabled={approvingUid === (staff.uid || staff.id)}
                  >
                    {approvingUid === (staff.uid || staff.id)
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => onStaffAction(staff.uid || staff.id, "reject")}
                    disabled={approvingUid === (staff.uid || staff.id)}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.searchWrapper}>
            <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
              <Ionicons name="search" size={16} color="#64748b" />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search by ID, category or student name..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                  <Ionicons name="close" size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            {searchFocused && (
              <View style={styles.suggestionsBox}>
                {dynamicSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionRow, i < dynamicSuggestions.length - 1 && styles.suggestionRowBorder]}
                    onPress={() => { searchInputRef.current?.blur(); setSearchFocused(false); setSearchQuery(s.query); }}
                  >
                    <Ionicons name={getSuggestionIcon(s.query) as any} size={14} color="#94a3b8" />
                    <Text style={styles.suggestionText}>{s.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.openTasksCard}>
            <View>
              <Text style={styles.openTasksLabel}>OPEN TASKS</Text>
              <Text style={styles.openTasksValue}>{openTasksCount} Active</Text>
            </View>
            <Ionicons name="flash" size={28} color="#4ade80" />
          </View>

          {searchQuery.length > 0 && (
           <Text style={styles.resultCount}>{filteredComplaints.length} result{filteredComplaints.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;</Text>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, activeFilter === tab && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterChipText, activeFilter === tab && styles.filterChipTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredComplaints.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name={searchQuery ? "search-outline" : "documents-outline"} size={36} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? `No results for "${searchQuery}"` : activeFilter !== "All" ? `No ${activeFilter.toLowerCase()} complaints` : "No complaints yet"}
              </Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? "Try a different search term" : "Complaints will appear here once submitted"}
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredComplaints.map((item) => {
              const isFlagged = item.flagged && ["pending", "assigned", "in_progress"].includes(item.status);
              const statusColor = STATUS_COLORS[item.status] || "#64748b";
              const statusBg = STATUS_BG[item.status] || "#f8fafc";
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.complaintCard, isFlagged && styles.complaintCardFlagged]}
                  onPress={() => openComplaint(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.complaintCardTop}>
                    <Text style={styles.complaintId}>#{item.ticketId || item.id?.slice(0, 6)} · {formatTimeAgo(item.createdAt)}</Text>
                    <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusChipText, { color: statusColor }]}>
                        {isFlagged ? "FLAGGED" : item.status?.replace("_", " ").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.complaintTitle} numberOfLines={1}>
                    {item.subIssue || item.customIssue || item.category || "Complaint"}
                  </Text>
                  <View style={styles.complaintMeta}>
                    <View style={styles.complaintMetaItem}>
                      <Ionicons name="person-outline" size={12} color="#64748b" />
                      <Text style={styles.complaintMetaText}>{item.submittedByName || "N/A"} ({item.submittedByRole || ""})</Text>
                    </View>
                    <View style={styles.complaintMetaItem}>
                      <Ionicons name="construct-outline" size={12} color="#64748b" />
                      <Text style={styles.complaintMetaText}>{item.category || "N/A"}</Text>
                    </View>
                  </View>
                  {item.assignedToName ? (
                    <View style={styles.assignedRow}>
                      <View style={styles.assignedAvatar}>
                        <Ionicons name="person" size={12} color="#16a34a" />
                      </View>
                      <View>
                        <Text style={styles.assignedLabel}>STAFF</Text>
                        <Text style={styles.assignedName}>{item.assignedToName}</Text>
                      </View>
                      <View style={styles.assignedEditBtn}>
                        <Ionicons name="create-outline" size={14} color="#16a34a" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.unassignedRow}>
                      <Text style={styles.unassignedText}>Unassigned</Text>
                      <View style={styles.assignIconBtn}>
                        <Ionicons name="person-add-outline" size={16} color="#64748b" />
                      </View>
                    </View>
                  )}
                  {item.hodEmailSent && (
                    <View style={styles.hodMiniTag}>
                      <Ionicons name="mail" size={11} color="#d97706" />
                      <Text style={styles.hodMiniTagText}>HOD Notified</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

  <ComplaintDetailModal
  complaint={selectedComplaint}
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onIWillHandle={onIWillHandle}
  onMarkResolved={onMarkResolved}
  actionLoading={actionLoading}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0fdf4" },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#f0fdf4" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1a3c2e", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "#4b7a5c" },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a3c2e", flex: 1 },
  countBadge: { backgroundColor: "#f59e0b", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: "#ffffff" },
  staffCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  staffAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c2e", alignItems: "center", justifyContent: "center" },
  staffAvatarText: { fontSize: 18, fontWeight: "800", color: "#ffffff" },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: "700", color: "#1a3c2e" },
  staffMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  staffEmail: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  staffActionsCol: { gap: 8 },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  searchWrapper: { position: "relative", marginBottom: 14, zIndex: 100 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  searchBoxFocused: { borderColor: "#16a34a" },
  searchInput: { flex: 1, fontSize: 13, color: "#1a3c2e", fontWeight: "500" },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsBox: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  suggestionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  suggestionRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  suggestionText: { flex: 1, fontSize: 13, color: "#1a3c2e", fontWeight: "500" },
  openTasksCard: {
    backgroundColor: "#1a3c2e",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  openTasksLabel: { fontSize: 10, fontWeight: "700", color: "#4ade80", letterSpacing: 1, textTransform: "uppercase" },
  openTasksValue: { fontSize: 20, fontWeight: "800", color: "#ffffff", marginTop: 4 },
  resultCount: { fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: "500" },
  filterRow: { marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  filterChipActive: { backgroundColor: "#1a3c2e", borderColor: "#1a3c2e" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  filterChipTextActive: { color: "#ffffff" },
  complaintCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  complaintCardFlagged: { borderLeftColor: "#ef4444" },
  complaintCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  complaintId: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  statusChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusChipText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  complaintTitle: { fontSize: 15, fontWeight: "800", color: "#1a3c2e", marginBottom: 8 },
  complaintMeta: { gap: 4, marginBottom: 10 },
  complaintMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  complaintMetaText: { fontSize: 12, color: "#64748b" },
  assignedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  assignedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  assignedLabel: { fontSize: 9, fontWeight: "700", color: "#4b7a5c", letterSpacing: 0.5 },
  assignedName: { fontSize: 13, fontWeight: "700", color: "#1a3c2e" },
  assignedEditBtn: {
    marginLeft: "auto",
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  unassignedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  unassignedText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  assignIconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  hodMiniTag: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  hodMiniTagText: { fontSize: 11, fontWeight: "600", color: "#d97706" },
  emptyCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 32, alignItems: "center" },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 6, textAlign: "center" },
  emptySubText: { fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 18 },
  clearSearchBtn: { marginTop: 14, backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1, borderColor: "#bbf7d0" },
  clearSearchBtnText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  modalContainer: { flex: 1, backgroundColor: "#f0fdf4" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#1a3c2e" },
  modalBody: { flex: 1, padding: 20 },
  badgeRowModal: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  flagPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fef2f2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fecaca" },
  flagPillText: { fontSize: 11, fontWeight: "700", color: "#dc2626" },
  hodPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fffbeb", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fde68a" },
  hodPillText: { fontSize: 11, fontWeight: "700", color: "#d97706" },
  ticketBox: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  ticketLabel: { fontSize: 10, fontWeight: "700", color: "#166534", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  ticketValue: { fontSize: 15, fontWeight: "800", color: "#16a34a", fontFamily: "monospace" },
  imageBox: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  complaintImage: { width: "100%", height: 220, borderRadius: 14, marginTop: 8 },
  fullImageWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  fullImage: { width: "100%", height: "85%" },
  closeZoomBtn: { position: "absolute", top: 50, right: 20, zIndex: 10, backgroundColor: "rgba(255,255,255,0.15)", width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  zoomContainer: { height: 220, borderRadius: 14, overflow: "hidden", marginTop: 8 },
  timelineBox: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1 },
  timelineRow: { flexDirection: "row", marginBottom: 4 },
  timelineLeft: { alignItems: "center", width: 24, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#e2e8f0", borderWidth: 2, borderColor: "#cbd5e1" },
  timelineDotDone: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#e2e8f0", marginVertical: 2 },
  timelineLineDone: { backgroundColor: "#16a34a" },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  timelineLabelDone: { color: "#1a3c2e" },
  timelineTime: { fontSize: 11, color: "#64748b", marginTop: 2 },
  detailRow: { backgroundColor: "#ffffff", borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  detailLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#1a3c2e" },
  flagActionsBox: { backgroundColor: "#fff7ed", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#fed7aa" },
  iwillhandleBtn: { backgroundColor: "#3b82f6", borderRadius: 10, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginBottom: 10 },
  iwillhandleBtnText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  resolveBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  resolveBtnText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  adminHandlingBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  adminHandlingText: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
  flagResolvedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  flagResolvedText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  ratingBox: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  ratingNum: { fontSize: 14, fontWeight: "700", color: "#1a3c2e", marginLeft: 6 },
  ratingComment: { fontSize: 13, color: "#64748b", fontStyle: "italic", marginBottom: 4 },
  ratingTime: { fontSize: 11, color: "#94a3b8" },
  rejectionsBox: { backgroundColor: "#fef2f2", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#fecaca" },
  rejectionRow: { marginBottom: 10 },
  rejectionName: { fontSize: 13, fontWeight: "700", color: "#1a3c2e" },
  rejectionReason: { fontSize: 12, color: "#ef4444", marginTop: 2 },
});
