import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, Image, Modal, TextInput,
  KeyboardAvoidingView, Platform, StatusBar, Dimensions,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";
import { lostFoundAPI } from "../services/api";
import { PanResponder, Animated } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

function ImageViewer({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const initialDistance = useRef(0);

  const reset = () => {
    lastScale.current = 1; lastX.current = 0; lastY.current = 0;
    scale.setValue(1); translateX.setValue(0); translateY.setValue(0);
  };

  useEffect(() => { if (visible) reset(); }, [visible]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gs) => { if (gs.numberActiveTouches === 2) initialDistance.current = 0; },
    onPanResponderMove: (e, gs) => {
      const touches = e.nativeEvent.touches;
      if (touches.length === 2) {
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (initialDistance.current === 0) { initialDistance.current = dist; return; }
        scale.setValue(Math.max(1, Math.min(5, lastScale.current * (dist / initialDistance.current))));
      } else if (touches.length === 1 && lastScale.current > 1) {
        translateX.setValue(lastX.current + gs.dx);
        translateY.setValue(lastY.current + gs.dy);
      }
    },
    onPanResponderRelease: () => {
      lastScale.current = (scale as any)._value;
      lastX.current = (translateX as any)._value;
      lastY.current = (translateY as any)._value;
      if (lastScale.current <= 1) reset();
    },
  })).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={iv.overlay}>
        <TouchableOpacity style={iv.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={iv.hint}>Pinch to zoom  •  Long press to reset</Text>
        <Animated.View style={{ transform: [{ scale }, { translateX }, { translateY }] }} {...panResponder.panHandlers}>
          <TouchableOpacity activeOpacity={1} onPress={() => { if (lastScale.current <= 1) onClose(); }} onLongPress={reset}>
            <Image source={{ uri }} style={iv.image} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const iv = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  closeBtn: { position: "absolute", top: 52, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  hint:     { position: "absolute", bottom: 44, alignSelf: "center", color: "rgba(255,255,255,0.45)", fontSize: 12, zIndex: 10 },
  image:    { width: SW, height: SH },
});

type LostItem = {
  id: string; itemName: string; category: string; description: string;
  roomNumber: string; roomLabel: string; collectLocation: string;
  photoUrl: string | null; postedByName: string; postedByRole: string;
  createdAt: any; status: string; isMyPost: boolean;
  handedToName?: string; handedAt?: any;
};

type TabType = "feed" | "myposts";

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

function formatDate(ts: any): string {
  if (!ts) return "—";
  const seconds = ts._seconds ?? ts.seconds ?? (typeof ts === "number" ? ts : null);
  if (!seconds) return "—";
  return new Date(seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function LostAndFoundScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [feedItems, setFeedItems] = useState<LostItem[]>([]);
  const [myPosts, setMyPosts] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [handoverItem, setHandoverItem] = useState<LostItem | null>(null);
  const [handedToName, setHandedToName] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState("");
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login" as any); return; }
      await fetchAll();
    });
    return () => unsub();
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await lostFoundAPI.feed();
      setFeedItems(data.items || []);
    } catch {}
  }, []);

  const fetchMyPosts = useCallback(async () => {
    try {
      const data = await lostFoundAPI.myPosts();
      setMyPosts(data.items || []);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchFeed(), fetchMyPosts()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchFeed, fetchMyPosts]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleHandover = async () => {
    if (!handedToName.trim()) { setHandoverError("Please enter the name of the person."); return; }
    if (!handoverItem) return;
    setHandoverLoading(true);
    try {
      await lostFoundAPI.handover(handoverItem.id, handedToName.trim());
      setFeedItems((prev) => prev.filter((i) => i.id !== handoverItem.id));
      setHandoverItem(null);
      await fetchMyPosts();
      setActiveTab("myposts");
    } catch (err: any) {
      setHandoverError(err.message || "Failed to mark as handed over.");
    } finally { setHandoverLoading(false); }
  };

  const renderCard = (item: LostItem) => {
    const isHandedOver = item.status === "handed_over";
    return (
      <View key={item.id} style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{item.postedByName?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.posterName}>{item.postedByName}</Text>
            <Text style={s.posterTime}>{formatAgo(item.createdAt)}</Text>
          </View>
          {item.isMyPost && <View style={s.myPostBadge}><Text style={s.myPostBadgeText}>MY POST</Text></View>}
          {!isHandedOver && <View style={s.foundBadge}><Text style={s.foundBadgeText}>FOUND</Text></View>}
        </View>
        {item.photoUrl ? (
          <TouchableOpacity activeOpacity={0.92} onPress={() => setImageViewerUri(item.photoUrl!)}>
            <Image source={{ uri: item.photoUrl }} style={s.cardImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={s.cardImageEmpty}>
            <Ionicons name="cube-outline" size={44} color="#cbd5e1" />
          </View>
        )}
        <View style={s.cardBody}>
          <Text style={s.cardTitle}>{item.itemName}</Text>
          {item.description ? <Text style={s.cardDesc}>{item.description}</Text> : null}
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={13} color="#374151" />
            <Text style={s.locationText}>
              {item.roomNumber ? `Room ${item.roomNumber}${item.roomLabel ? ` — ${item.roomLabel}` : ""}` : "—"}
            </Text>
          </View>
          {item.collectLocation ? (
            <View style={s.metaRow}>
              <Ionicons name="pin-outline" size={13} color="#16a34a" />
              <Text style={s.collectText}>Collect from: {item.collectLocation}</Text>
            </View>
          ) : null}
          {isHandedOver ? (
            <View style={s.handedBox}>
              <Ionicons name="hand-left-outline" size={20} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={s.handedName}>Handed to {item.handedToName}</Text>
                <Text style={s.handedDate}>{formatDate(item.handedAt)}</Text>
              </View>
            </View>
          ) : item.isMyPost ? (
            <TouchableOpacity
              style={s.handoverBtn}
              onPress={() => { setHandoverItem(item); setHandedToName(""); setHandoverError(""); }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.handoverBtnText}>Mark as Handed Over</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const displayItems = activeTab === "feed" ? feedItems : myPosts;

  if (loading) return <View style={s.loader}><ActivityIndicator size="large" color="#16a34a" /></View>;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/" as any)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Lost & Found</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/post-found-item" as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={s.segmentRow}>
        <TouchableOpacity style={[s.segmentBtn, activeTab === "feed" && s.segmentBtnActive]} onPress={() => setActiveTab("feed")}>
          <Text style={[s.segmentBtnText, activeTab === "feed" && s.segmentBtnTextActive]}>All Items</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.segmentBtn, activeTab === "myposts" && s.segmentBtnActive]} onPress={() => setActiveTab("myposts")}>
          <Text style={[s.segmentBtnText, activeTab === "myposts" && s.segmentBtnTextActive]}>My Posts</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}>
        {displayItems.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <Ionicons name={activeTab === "feed" ? "search-outline" : "cube-outline"} size={36} color="#16a34a" />
            </View>
            <Text style={s.emptyTitle}>{activeTab === "feed" ? "No items posted yet" : "No posts yet"}</Text>
            <Text style={s.emptySub}>{activeTab === "feed" ? "Found something on campus? Post it here!" : "Items you post will appear here."}</Text>
            <TouchableOpacity style={s.postBtn} onPress={() => router.push("/post-found-item" as any)}>
              <Text style={s.postBtnText}>Post Found Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayItems.map((item) => renderCard(item))
        )}
      </ScrollView>
      <Modal visible={!!handoverItem} animationType="slide" transparent onRequestClose={() => setHandoverItem(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Mark as Handed Over</Text>
            <Text style={s.modalSub}>{`Enter the name of the person who collected "${handoverItem?.itemName}"`}</Text>
            <Text style={s.modalLabel}>Collected By</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Shaho"
              placeholderTextColor="#9ca3af"
              value={handedToName}
              onChangeText={(t) => { setHandedToName(t); setHandoverError(""); }}
              autoCapitalize="words"
            />
            {handoverError ? <Text style={s.modalError}>{handoverError}</Text> : null}
            <View style={s.modalBtnRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setHandoverItem(null)} disabled={handoverLoading}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalConfirmBtn, handoverLoading && { opacity: 0.55 }]} onPress={handleHandover} disabled={handoverLoading}>
                {handoverLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.modalConfirmText}>Confirm Handover</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {imageViewerUri && <ImageViewer uri={imageViewerUri} visible={!!imageViewerUri} onClose={() => setImageViewerUri(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" },
  root: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  segmentRow: { flexDirection: "row", backgroundColor: "#ffffff", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  segmentBtnActive: { borderBottomColor: "#16a34a" },
  segmentBtnText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  segmentBtnTextActive: { color: "#16a34a", fontWeight: "700" },
  container: { padding: 14, paddingBottom: 40, gap: 14 },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  emptySub: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24, paddingHorizontal: 20, lineHeight: 22 },
  postBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  postBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700", color: "#16a34a" },
  posterName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  posterTime: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  myPostBadge: { backgroundColor: "#f0fdf4", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: "#bbf7d0", marginLeft: 4 },
  myPostBadgeText: { fontSize: 9, fontWeight: "700", color: "#16a34a", letterSpacing: 0.3 },
  foundBadge: { backgroundColor: "#16a34a", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  foundBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  cardImage: { width: "100%", height: 220 },
  cardImageEmpty: { width: "100%", height: 150, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  locationText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  collectText: { fontSize: 13, color: "#16a34a", fontWeight: "500" },
  handedBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  handedName: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  handedDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  handoverBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10, flexDirection: "row", justifyContent: "center" },
  handoverBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  modalSub: { fontSize: 14, color: "#64748b", lineHeight: 22, marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  modalInput: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", marginBottom: 8 },
  modalError: { fontSize: 13, color: "#dc2626", marginBottom: 12, fontWeight: "500" },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  modalConfirmBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  modalConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});