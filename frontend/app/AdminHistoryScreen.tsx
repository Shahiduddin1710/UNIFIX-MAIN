import { useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ComplaintDetailModal } from "./AdminComplaintsScreen";

function formatTimestamp(ts: any): string {
  if (!ts) return "N/A";
  const date = ts.toDate ? ts.toDate() : new Date(ts._seconds * 1000);
  return date.toLocaleString("en-IN");
}

function formatElapsed(ts: any): string {
  if (!ts) return "N/A";
  const date = ts.toDate ? ts.toDate() : new Date(ts._seconds * 1000);
  const ms = Date.now() - date.getTime();
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours}h ${totalMins % 60}m`;
  return `${totalMins}m`;
}

function formatResolutionTime(acceptedAt: any, completedAt: any): string {
  if (!acceptedAt || !completedAt) return "N/A";
  const start = acceptedAt.toDate ? acceptedAt.toDate() : new Date(acceptedAt._seconds * 1000);
  const end = completedAt.toDate ? completedAt.toDate() : new Date(completedAt._seconds * 1000);
  const ms = end.getTime() - start.getTime();
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours}h ${totalMins % 60}m`;
  return `${totalMins}m`;
}

interface HistoryScreenProps {
  allComplaints: any[];
  flaggedComplaints: any[];
  onIWillHandle: (id: string) => void;
  onMarkResolved: (id: string) => void;
  actionLoading?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function AdminHistoryScreen({
  allComplaints,
  flaggedComplaints,
  onIWillHandle,
  onMarkResolved,
  actionLoading,
  refreshing = false,
  onRefresh,
}: HistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<"flagged" | "completed">("flagged");
const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
const [modalVisible, setModalVisible] = useState(false);

const completedComplaints = allComplaints.filter((c) => c.status === "completed" && c.flagged === true);
const flaggedActive = allComplaints.filter((c) => c.flagged === true && !c.flagResolved && c.status !== "completed");
const flaggedHistory = allComplaints.filter((c) => c.flagged === true && c.flagResolved === true);
const allFlagged = [...flaggedActive, ...flaggedHistory];

const selectedComplaint = allComplaints.find((c) => c.id === selectedComplaintId) ?? allFlagged.find((c) => c.id === selectedComplaintId) ?? null;

function openComplaint(item: any) {
  setSelectedComplaintId(item.id);
  setModalVisible(true);
}

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resolution History</Text>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === "flagged" && styles.toggleBtnActive]}
          onPress={() => setActiveTab("flagged")}
        >
          <Text style={[styles.toggleBtnText, activeTab === "flagged" && styles.toggleBtnTextActive]}>
            Flagged
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === "completed" && styles.toggleBtnActive]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.toggleBtnText, activeTab === "completed" && styles.toggleBtnTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
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

        {activeTab === "flagged" && (
          <View style={styles.section}>
            {allFlagged.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="flag-outline" size={36} color="#cbd5e1" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No flagged complaints</Text>
                <Text style={styles.emptySubText}>Escalated complaints will appear here</Text>
              </View>
            ) : (
              allFlagged.map((item) => {
                const isResolved = item.flagResolved === true;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.flaggedCard, isResolved && styles.flaggedCardResolved]}
                    onPress={() => openComplaint(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.flaggedCardTop}>
                      <View style={styles.flaggedBadgeRow}>
                        <View style={[styles.flagBadge, isResolved && styles.flagBadgeResolved]}>
                          <Text style={[styles.flagBadgeText, isResolved && styles.flagBadgeTextResolved]}>
                            {isResolved ? "RESOLVED" : "FLAGGED"}
                          </Text>
                        </View>
                        {item.hodEmailSent && (
                          <View style={styles.hodBadge}>
                            <Ionicons name="mail-outline" size={11} color="#64748b" />
                            <Text style={styles.hodBadgeText}>HOD Notified</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                    </View>

                    <Text style={styles.flaggedTitle} numberOfLines={2}>
                      {item.subIssue || item.customIssue || item.category || "Complaint"}
                    </Text>

                    {item.assignedToName && (
                      <View style={styles.assignedRow}>
                        <Ionicons name="people-outline" size={13} color="#64748b" />
                        <Text style={styles.assignedText}>Assigned: {item.assignedToName}</Text>
                      </View>
                    )}

                    <View style={styles.elapsedRow}>
                      <Ionicons name="time" size={13} color={isResolved ? "#16a34a" : "#dc2626"} />
                      <Text style={[styles.elapsedText, isResolved && styles.elapsedTextResolved]}>
                        {isResolved
                          ? `Resolved in ${formatResolutionTime(item.acceptedAt, item.completedAt)}`
                          : item.acceptedAt
                          ? `Pending for ${formatElapsed(item.flaggedAt || item.acceptedAt)}`
                          : `Flagged at ${formatTimestamp(item.flaggedAt)}`}
                      </Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.categoryTag}>CATEGORY: {(item.category || "N/A").toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {activeTab === "completed" && (
          <View style={styles.section}>
            {completedComplaints.length > 0 && (
              <View style={styles.resolvedSectionHeader}>
                <Text style={styles.resolvedSectionLabel}>RECENTLY RESOLVED</Text>
              </View>
            )}

            {completedComplaints.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#cbd5e1" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No completed complaints</Text>
                <Text style={styles.emptySubText}>Resolved complaints will appear here</Text>
              </View>
            ) : (
              completedComplaints.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.completedCard}
                  onPress={() => openComplaint(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.completedCardTop}>
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>COMPLETED</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                  </View>

                  <Text style={styles.completedTitle} numberOfLines={2}>
                    {item.subIssue || item.customIssue || item.category || "Complaint"}
                  </Text>

                  {item.assignedToName && (
                    <View style={styles.assignedRow}>
                      <Ionicons name="person-outline" size={13} color="#64748b" />
                      <Text style={styles.assignedText}>Assigned: {item.assignedToName}</Text>
                    </View>
                  )}

                  <View style={styles.resolvedRow}>
                    <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                    <Text style={styles.resolvedText}>
                      Resolved in {formatResolutionTime(item.acceptedAt, item.completedAt)}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.categoryTag}>CATEGORY: {(item.category || "N/A").toUpperCase()}</Text>
                    <View style={styles.viewLogBtn}>
                      <Text style={styles.viewLogBtnText}>VIEW LOG</Text>
                      <Ionicons name="document-text-outline" size={12} color="#16a34a" />
                    </View>
                  </View>

                  {item.rating !== null && item.rating !== undefined && (
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Ionicons
                          key={i}
                          name={i <= item.rating ? "star" : "star-outline"}
                          size={13}
                          color={i <= item.rating ? "#f59e0b" : "#e2e8f0"}
                        />
                      ))}
                      <Text style={styles.ratingText}>{item.rating}/5</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
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
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#1a3c2e" },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  toggleBtnActive: { backgroundColor: "#1a3c2e" },
  toggleBtnText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  toggleBtnTextActive: { color: "#ffffff" },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16 },
  flaggedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  flaggedCardResolved: { borderLeftColor: "#16a34a" },
  flaggedCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  flaggedBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flagBadge: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  flagBadgeResolved: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  flagBadgeText: { fontSize: 10, fontWeight: "800", color: "#dc2626", letterSpacing: 0.5 },
  flagBadgeTextResolved: { color: "#16a34a" },
  hodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  hodBadgeText: { fontSize: 10, fontWeight: "600", color: "#64748b" },
  flaggedTitle: { fontSize: 16, fontWeight: "800", color: "#1a3c2e", marginBottom: 10 },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  assignedText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  elapsedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  elapsedText: { fontSize: 13, fontWeight: "700", color: "#dc2626" },
  elapsedTextResolved: { color: "#16a34a" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  categoryTag: { fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5 },
  resolvedSectionHeader: { marginBottom: 12 },
  resolvedSectionLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", letterSpacing: 1 },
  completedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  completedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  completedBadgeText: { fontSize: 10, fontWeight: "800", color: "#16a34a", letterSpacing: 0.5 },
  completedTitle: { fontSize: 16, fontWeight: "800", color: "#1a3c2e", marginBottom: 10 },
  resolvedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  resolvedText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  viewLogBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewLogBtnText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 10 },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#f59e0b", marginLeft: 4 },
  emptyCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 32, alignItems: "center", marginTop: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#475569", marginBottom: 6, textAlign: "center" },
  emptySubText: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 18 },
});