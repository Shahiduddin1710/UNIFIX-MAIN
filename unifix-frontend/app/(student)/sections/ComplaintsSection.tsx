import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../../firebase/firebaseConfig";
import { complaintsAPI } from "../../../services/api";

type Complaint = {
  id: string;
  ticketId: string;
  category: string;
  subIssue: string | null;
  customIssue: string | null;
  description: string;
  building: string;
  roomDetail: string;
  status: string;
  queueStatus?: string;
  createdAt: any;
  assignedToName: string | null;
  assignedToPhone: string | null;
  photoUrl?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  ratedAt?: any;
};

type FilterTab = "all" | "pending" | "resolved";

interface ComplaintsSectionProps {
  complaints: Complaint[];
  complaintsLoading: boolean;
  filterTab: FilterTab;
  refreshing: boolean;
  onRefresh: () => void;
  onSetFilterTab: (tab: FilterTab) => void;
  onCall: (phone: string | null, name: string | null) => void;
  bottomNavHeight: number;
}

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    label: string;
    dot: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  pending: {
    color: "#d97706",
    bg: "#fef3c7",
    label: "Pending",
    dot: "#d97706",
    icon: "time-outline",
  },
  assigned: {
    color: "#2563eb",
    bg: "#dbeafe",
    label: "Assigned",
    dot: "#2563eb",
    icon: "person-outline",
  },
  in_progress: {
    color: "#7c3aed",
    bg: "#ede9fe",
    label: "In Progress",
    dot: "#7c3aed",
    icon: "reload-outline",
  },
  completed: {
    color: "#16a34a",
    bg: "#dcfce7",
    label: "Completed",
    dot: "#16a34a",
    icon: "checkmark-circle",
  },
  rejected: {
    color: "#dc2626",
    bg: "#fef2f2",
    label: "Rejected",
    dot: "#dc2626",
    icon: "close-circle-outline",
  },
};

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  electrical: "flash-outline",
  plumbing: "water-outline",
  carpentry: "hammer-outline",
  cleaning: "sparkles-outline",
  technician: "desktop-outline",
  safety: "shield-outline",
  others: "clipboard-outline",
};

function formatDateShort(ts: any): string {
  if (!ts) return "—";
  let ms: number | null = null;
  if (typeof ts === "number") ms = ts * 1000;
  else if (ts?.toDate) ms = ts.toDate().getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const renderStars = (count: number, size: number = 16) => (
  <View style={{ flexDirection: "row", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= count ? "star" : "star-outline"}
        size={size}
        color={star <= count ? "#f59e0b" : "#e2e8f0"}
      />
    ))}
  </View>
);

const PROGRESS_STEPS = ["pending", "assigned", "in_progress", "completed"];
const STEP_LABELS = ["Pending", "Assigned", "In Progress", "Done"];

export default memo(function ComplaintsSection({
  complaints,
  complaintsLoading,
  filterTab,
  refreshing,
  onRefresh,
  onSetFilterTab,
  onCall,
  bottomNavHeight,
}: ComplaintsSectionProps) {
   
  const router = useRouter();

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [trackingVisible, setTrackingVisible] = useState(false);
  const [ratingComplaint, setRatingComplaint] = useState<Complaint | null>(
    null,
  );
  const [ratingVisible, setRatingVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");

  useEffect(() => {
    if (!trackingVisible || !selectedComplaint?.id) return;
    const unsub = onSnapshot(
      doc(db, "complaints", selectedComplaint.id),
      (snap) => {
        if (snap.exists())
          setSelectedComplaint({ id: snap.id, ...(snap.data() as any) });
      },
    );
    return () => unsub();
  }, [trackingVisible, selectedComplaint?.id]);

  const handleSubmitRating = useCallback(async () => {
    if (selectedStars === 0) {
      setRatingError("Please select a star rating.");
      return;
    }
    if (!ratingComplaint) return;
    setRatingLoading(true);
    setRatingError("");
    try {
      await complaintsAPI.rate(
        ratingComplaint.id,
        selectedStars,
        ratingComment.trim(),
      );
      setRatingVisible(false);
      setRatingComplaint(null);
      setSelectedStars(0);
      setRatingComment("");
    } catch (err: any) {
      setRatingError(err.message || "Failed to submit rating.");
    } finally {
      setRatingLoading(false);
    }
  }, [ratingComplaint, selectedStars, ratingComment]);

  const renderInteractiveStars = (count: number, size: number = 28) => (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setSelectedStars(star)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={star <= count ? "star" : "star-outline"}
            size={size}
            color={star <= count ? "#f59e0b" : "#e2e8f0"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((c) => {
        if (filterTab === "all") return true;
        if (filterTab === "pending") return c.status === "pending";
        if (filterTab === "resolved")
          return c.status === "completed" || c.status === "rejected";
        return true;
      }),
    [complaints, filterTab],
  );

  return (
    <>
      <View style={styles.fullTab}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabHeaderTitle}>My Complaints</Text>
        </View>
        <View style={styles.filterRow}>
          {(["all", "pending", "resolved"] as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                filterTab === tab && styles.filterChipActive,
              ]}
              onPress={() => onSetFilterTab(tab)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterTab === tab && styles.filterChipTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
    {complaintsLoading ? (
          <ScrollView contentContainerStyle={[styles.tabContainer, { paddingBottom: bottomNavHeight + 20 }]}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.complaintCard, { opacity: 0.6 }]}>
                <View style={styles.complaintCardTop}>
                  <View style={[styles.complaintCatIcon, { backgroundColor: "#f1f5f9" }]} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ height: 16, width: "80%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                    <View style={{ height: 12, width: "60%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                    <View style={{ height: 12, width: "40%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                  </View>
                  <View style={[styles.complaintThumb, styles.complaintThumbEmpty, { backgroundColor: "#f1f5f9", borderColor: "#f1f5f9" }]} />
                </View>
                <View style={[styles.complaintCardBottom, { borderTopColor: "#f1f5f9" }]}>
                  <View style={{ height: 28, width: 80, backgroundColor: "#f1f5f9", borderRadius: 8 }} />
                  <View style={{ height: 13, width: 100, backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.tabContainer,
              { paddingBottom: bottomNavHeight + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#16a34a"]}
              />
            }
          >
            {filteredComplaints.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="clipboard-outline"
                    size={40}
                    color="#16a34a"
                  />
                </View>
                <Text style={styles.emptyStateTitle}>No complaints found</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/submit-complaint" as any)}
                >
                  <Text style={styles.actionBtnText}>Report an Issue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredComplaints.map((complaint) => {
                const sc =
                  STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
                const issueTitle =
                  complaint.subIssue ||
                  complaint.customIssue ||
                  "Issue reported";
                const catIcon =
                  CAT_ICONS[complaint.category] || "clipboard-outline";
                const isCompleted = complaint.status === "completed";
                const resolvedByAdmin =
                  (complaint as any).flagResolvedBy === "admin";
                const hasRating = complaint.rating != null;
                const ratingDisabled =
                  (complaint as any).ratingDisabled === true || resolvedByAdmin;
                const isAssigned =
                  complaint.status === "assigned" ||
                  complaint.status === "in_progress";
                return (
                  <View key={complaint.id} style={styles.complaintCard}>
                    <View style={styles.complaintCardTop}>
                      <View style={styles.complaintCatIcon}>
                        <Ionicons name={catIcon} size={18} color="#16a34a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.complaintTitle} numberOfLines={2}>
                          {issueTitle}
                        </Text>
                   <View style={styles.complaintMetaRow}>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color="#64748b"
                          />
                          <Text style={styles.complaintMetaText} numberOfLines={1} ellipsizeMode="tail">
                            {complaint.building}
                          </Text>
                        </View>
                    {complaint.roomDetail ? (
                          <Text style={[styles.complaintMetaText, { marginLeft: 16, marginBottom: 3 }]} numberOfLines={1} ellipsizeMode="tail">
                            {complaint.roomDetail.includes(",") 
                              ? complaint.roomDetail.split(",").slice(1).join(",").trim() 
                              : complaint.roomDetail}
                          </Text>
                        ) : null} 
                        <View style={styles.complaintMetaRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={12}
                            color="#94a3b8"
                          />
                          <Text style={styles.complaintDate}>
                            {formatDateShort(complaint.createdAt)}
                          </Text>
                        </View>
                        {complaint.status === "pending" &&
                          complaint.queueStatus === "waiting_for_staff" && (
                            <View style={styles.queueBanner}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color="#7c3aed"
                                style={{ marginRight: 4 }}
                              />
                              <Text style={styles.queueBannerText}>
                                Waiting for staff to be assigned
                              </Text>
                            </View>
                          )}
                      </View>
                      {complaint.photoUrl ? (
                        <Image
                          source={{ uri: complaint.photoUrl }}
                          style={styles.complaintThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.complaintThumb,
                            styles.complaintThumbEmpty,
                          ]}
                        >
                          <Ionicons name={catIcon} size={20} color="#94a3b8" />
                        </View>
                      )}
                    </View>
                    {isAssigned && complaint.assignedToName && (
                      <View style={styles.staffBanner}>
                        <View style={styles.staffLeft}>
                          <View style={styles.staffIconWrap}>
                            <Ionicons name="person" size={14} color="#2563eb" />
                          </View>
                          <View>
                            <Text style={styles.staffLabel}>
                              Assigned Staff
                            </Text>
                            <Text style={styles.staffName}>
                              {complaint.assignedToName}
                            </Text>
                          </View>
                        </View>
                        {complaint.assignedToPhone && (
                          <TouchableOpacity
                            style={styles.staffCallBtn}
                            onPress={() =>
                              onCall(
                                complaint.assignedToPhone,
                                complaint.assignedToName,
                              )
                            }
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            <Ionicons name="call" size={16} color="#ffffff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {isCompleted &&
                      (complaint as any).flagResolvedBy === "admin" && (
                        <View style={styles.adminResolvedBadge}>
                          <Ionicons
                            name="shield-checkmark"
                            size={13}
                            color="#7c3aed"
                            style={{ marginRight: 5 }}
                          />
                          <Text style={styles.adminResolvedText}>
                            Resolved by Admin
                          </Text>
                        </View>
                      )}
                    {isCompleted && hasRating && !resolvedByAdmin && (
                      <View style={styles.ratingDisplayRow}>
                        {renderStars(complaint.rating!, 16)}
                        <Text style={styles.ratingDisplayText}>
                          You rated {complaint.rating}/5
                        </Text>
                      </View>
                    )}
                    <View style={styles.complaintCardBottom}>
                      <View
                        style={[styles.statusBadge, { backgroundColor: sc.bg }]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: sc.dot },
                          ]}
                        />
                        <Text
                          style={[styles.statusBadgeText, { color: sc.color }]}
                        >
                          {sc.label}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        {isCompleted && !hasRating && !ratingDisabled && (
                          <TouchableOpacity
                            style={styles.rateBtn}
                            onPress={() => {
                              setRatingComplaint(complaint);
                              setSelectedStars(0);
                              setRatingComment("");
                              setRatingError("");
                              setRatingVisible(true);
                            }}
                          >
                            <Ionicons
                              name="star-outline"
                              size={12}
                              color="#d97706"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.rateBtnText}>Rate</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.trackBtn}
                          onPress={() => {
                            setSelectedComplaint(complaint);
                            setTrackingVisible(true);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.trackBtnText}>View Tracking</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={13}
                            color="#16a34a"
                            style={{ marginLeft: 4 }}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Tracking Modal */}
      <Modal
        visible={trackingVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTrackingVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>Track Complaint</Text>
              <TouchableOpacity onPress={() => setTrackingVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedComplaint &&
              (() => {
                const sc =
                  STATUS_CONFIG[selectedComplaint.status] ||
                  STATUS_CONFIG.pending;
                const catIcon =
                  CAT_ICONS[selectedComplaint.category] || "clipboard-outline";
                const currentIdx = PROGRESS_STEPS.indexOf(
                  selectedComplaint.status,
                );
                const isRejected = selectedComplaint.status === "rejected";
                return (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    {/* Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 20,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: "#f0fdf4",
                          borderWidth: 1.5,
                          borderColor: "#bbf7d0",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name={catIcon} size={22} color="#16a34a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "800",
                            color: "#0f172a",
                          }}
                          numberOfLines={2}
                        >
                          {selectedComplaint.subIssue ||
                            selectedComplaint.customIssue ||
                            "Issue reported"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 2,
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedComplaint.category}
                        </Text>
                      </View>
                      <View
                        style={{
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          backgroundColor: sc.bg,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Ionicons name={sc.icon} size={12} color={sc.color} />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: sc.color,
                          }}
                        >
                          {sc.label}
                        </Text>
                      </View>
                    </View>

                    {/* Info rows */}
                    <View style={{ marginBottom: 20 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingVertical: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: "600",
                          }}
                        >
                          Ticket ID
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#16a34a",
                          }}
                        >
                          {selectedComplaint.ticketId}
                        </Text>
                      </View>
                      <View style={{ height: 1, backgroundColor: "#f1f5f9" }} />
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          paddingVertical: 10,
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: "600",
                            flexShrink: 0,
                          }}
                        >
                          Location
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#0f172a",
                            maxWidth: "65%",
                            textAlign: "right",
                          }}
                        >
                          {[
                            selectedComplaint.building,
                            selectedComplaint.roomDetail,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      </View>
                      <View style={{ height: 1, backgroundColor: "#f1f5f9" }} />
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingVertical: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: "600",
                          }}
                        >
                          Submitted
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {formatDateShort(selectedComplaint.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={trackingStyles.progressTracker}>
                      <View style={trackingStyles.progressRow}>
                        {PROGRESS_STEPS.map((step, i) => {
                          const isStepActive = i <= currentIdx && !isRejected;
                          return (
                            <View
                              key={step}
                              style={trackingStyles.progressStepWrap}
                            >
                              <View style={trackingStyles.progressDotCol}>
                                <View
                                  style={[
                                    trackingStyles.progressDot,
                                    isStepActive &&
                                      trackingStyles.progressDotActive,
                                  ]}
                                />
                                <Text
                                  style={[
                                    trackingStyles.progressLabel,
                                    isStepActive &&
                                      trackingStyles.progressLabelActive,
                                  ]}
                                >
                                  {STEP_LABELS[i]}
                                </Text>
                              </View>
                              {i < 3 && (
                                <View
                                  style={[
                                    trackingStyles.progressLine,
                                    i < currentIdx &&
                                      !isRejected &&
                                      trackingStyles.progressLineActive,
                                  ]}
                                />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Assigned staff */}
                    {selectedComplaint.assignedToName && (
                      <View style={modalStyles.staffBanner}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <View style={modalStyles.staffIcon}>
                            <Ionicons name="person" size={14} color="#2563eb" />
                          </View>
                          <View>
                            <Text style={modalStyles.staffLabel}>
                              Assigned Staff
                            </Text>
                            <Text style={modalStyles.staffName}>
                              {selectedComplaint.assignedToName}
                            </Text>
                          </View>
                        </View>
                        {selectedComplaint.assignedToPhone && (
                          <TouchableOpacity
                            style={modalStyles.callBtn}
                            onPress={() =>
                              onCall(
                                selectedComplaint.assignedToPhone,
                                selectedComplaint.assignedToName,
                              )
                            }
                          >
                            <Ionicons name="call" size={16} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Rating display */}
                    {selectedComplaint.rating != null && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={modalStyles.metaLabel}>Your Rating</Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          {renderStars(selectedComplaint.rating, 18)}
                          <Text style={{ fontSize: 13, color: "#64748b" }}>
                            {selectedComplaint.rating}/5
                          </Text>
                        </View>
                        {selectedComplaint.ratingComment ? (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                              marginTop: 4,
                            }}
                          >
                            &ldquo;{selectedComplaint.ratingComment}&rdquo;
                          </Text>
                        ) : null}
                      </View>
                    )}

                    {/* Close button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#16a34a",
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: "center",
                        marginTop: 8,
                      }}
                      onPress={() => setTrackingVisible(false)}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: "700",
                        }}
                      >
                        Close
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                );
              })()}
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={ratingVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRatingVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>Rate Service</Text>
              <TouchableOpacity onPress={() => setRatingVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
              How satisfied are you with how this complaint was handled?
            </Text>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              {renderInteractiveStars(selectedStars, 36)}
            </View>
            <TextInput
              style={modalStyles.ratingInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor="#94a3b8"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
            />
            {ratingError ? (
              <Text style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>
                {ratingError}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[modalStyles.submitBtn, ratingLoading && { opacity: 0.7 }]}
              onPress={handleSubmitRating}
              disabled={ratingLoading}
            >
              {ratingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={modalStyles.submitBtnText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  fullTab: { flex: 1, backgroundColor: "#f8fafc" },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tabHeaderTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  filterChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  filterChipText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  filterChipTextActive: { color: "#16a34a", fontWeight: "700" },
  tabLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContainer: { padding: 16, gap: 12 },
  emptyState: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  complaintCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  complaintCardTop: { flexDirection: "row", gap: 12, marginBottom: 14 },
  complaintCatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },
  complaintTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
    lineHeight: 22,
  },
  complaintMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  complaintMetaText: { fontSize: 12, color: "#64748b" },
  complaintDate: { fontSize: 12, color: "#94a3b8" },
  complaintThumb: { width: 72, height: 72, borderRadius: 10 },
  complaintThumbEmpty: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  queueBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ede9fe",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  queueBannerText: { fontSize: 11, color: "#7c3aed", fontWeight: "600" },
  staffBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  staffLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  staffIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  staffLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 2,
  },
  staffName: { fontSize: 13, color: "#1e40af", fontWeight: "700" },
  staffCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  complaintCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  ratingDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  ratingDisplayText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  rateBtnText: { fontSize: 12, fontWeight: "700", color: "#d97706" },
  trackBtn: { flexDirection: "row", alignItems: "center" },
  trackBtnText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  adminResolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  adminResolvedText: { fontSize: 12, fontWeight: "700", color: "#7c3aed" },
});

const trackingStyles = StyleSheet.create({
  progressTracker: { marginBottom: 20 },
  progressRow: { flexDirection: "row", alignItems: "flex-start" },
  progressStepWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDotCol: { alignItems: "center", gap: 6 },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#e2e8f0",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  progressDotActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginBottom: 20,
  },
  progressLineActive: { backgroundColor: "#16a34a" },
  progressLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "center",
  },
  progressLabelActive: { color: "#16a34a", fontWeight: "700" },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "88%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  metaLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 14,
  },
  staffBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  staffIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  staffLabel: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  staffName: { fontSize: 13, color: "#1e40af", fontWeight: "700" },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0f172a",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
