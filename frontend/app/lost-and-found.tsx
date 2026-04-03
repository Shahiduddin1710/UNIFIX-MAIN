import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, Image, Modal, TextInput,
  KeyboardAvoidingView, Platform, StatusBar, Dimensions,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";
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
  closeBtn: { position: "absolute", top: 52, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  image:    { width: SW, height: SH },
});

type LostItem = {
  id: string; itemName: string; category: string; description: string;
  roomNumber: string; roomLabel: string; collectLocation: string;
  photoUrl: string | null; postedByName: string; postedByRole: string;
  createdAt: any; status: string; isMyPost: boolean;
  handedToName?: string; handedAt?: any;
};

type ClaimItem = {
  id: string; itemName: string; photoUrl: string | null;
  handedByName: string; handedByRole: string;
  handedToName: string; roomNumber: string; roomLabel: string;
  collectLocation: string; handedAt: any;
};

type TabType = "feed" | "myposts" | "claims";

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
  let ms: number | null = null;
  if (typeof ts === "number") ms = ts * 1000;
  else if (ts?.toDate) ms = ts.toDate().getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function LostAndFoundScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [feedItems, setFeedItems] = useState<LostItem[]>([]);
  const [myPosts, setMyPosts] = useState<LostItem[]>([]);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [handoverItem, setHandoverItem] = useState<LostItem | null>(null);
  const [handedToName, setHandedToName] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState("");
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubFeed: (() => void) | null = null;
    let unsubMyPosts: (() => void) | null = null;
    let unsubClaims: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login" as any); return; }

      const uid = u.uid;

      unsubFeed = onSnapshot(
        query(collection(db, "lostFound"), where("status", "==", "available"), orderBy("createdAt", "desc")),
        (snap) => {
          setFeedItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any, isMyPost: doc.data().postedBy === uid })));
          setLoading(false);
          setRefreshing(false);
        }
      );

      unsubMyPosts = onSnapshot(
        query(collection(db, "lostFound"), where("postedBy", "==", uid), orderBy("createdAt", "desc")),
        (snap) => {
          setMyPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any, isMyPost: true })));
        }
      );

      unsubClaims = onSnapshot(
        query(collection(db, "claims"), orderBy("createdAt", "desc")),
        (snap) => {
          setClaimItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
        }
      );
    });

    return () => {
      unsubAuth();
      unsubFeed?.();
      unsubMyPosts?.();
      unsubClaims?.();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleHandover = async () => {
    if (!handedToName.trim()) { setHandoverError("Please enter the name of the person."); return; }
    if (!handoverItem) return;
    setHandoverLoading(true);
    try {
      await lostFoundAPI.handover(handoverItem.id, handedToName.trim());
      setHandoverItem(null);
      setActiveTab("claims");
    } catch (err: any) {
      setHandoverError(err.message || "Failed to mark as handed over.");
    } finally { setHandoverLoading(false); }
  };
  
  const renderCard = (item: LostItem) => {
    const isHandedOver = item.status === "handed_over";
    return (
      <View key={item.id} style={s.lfCard}>
        <View style={s.lfCardHeader}>
          <View style={s.lfAvatar}>
            <Text style={s.lfAvatarText}>{item.postedByName?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.lfPosterName}>{item.postedByName}</Text>
            <Text style={s.lfPosterTime}>{formatAgo(item.createdAt)}</Text>
          </View>
          {item.isMyPost && <View style={s.lfMyPostBadge}><Text style={s.lfMyPostBadgeText}>MY POST</Text></View>}
          {!isHandedOver && <View style={s.lfFoundBadge}><Text style={s.lfFoundBadgeText}>FOUND</Text></View>}
        </View>
        {item.photoUrl ? (
          <TouchableOpacity onPress={() => setImageViewerUri(item.photoUrl!)} activeOpacity={0.9}>
            <Image source={{ uri: item.photoUrl }} style={s.lfImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={s.lfImageEmpty}>
            <Ionicons name="cube-outline" size={44} color="#cbd5e1" />
          </View>
        )}
        <View style={s.lfBody}>
          <Text style={s.lfTitle}>{item.itemName}</Text>
          {item.description ? <Text style={s.lfDesc}>{item.description}</Text> : null}
          <View style={s.lfMetaRow}>
            <Ionicons name="location-outline" size={13} color="#374151" />
            <Text style={s.lfLocationText}>
              {item.roomNumber ? `Room ${item.roomNumber}${item.roomLabel ? ` — ${item.roomLabel}` : ""}` : "—"}
            </Text>
          </View>
          {item.collectLocation ? (
            <View style={s.lfMetaRow}>
              <Ionicons name="pin-outline" size={13} color="#16a34a" />
              <Text style={s.lfCollectText}>Collect from: {item.collectLocation}</Text>
            </View>
          ) : null}
          {isHandedOver ? (
            <View style={s.lfHandedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={s.lfHandedName}>Handed to {item.handedToName}</Text>
                <Text style={s.lfHandedDate}>{formatDate(item.handedAt)}</Text>
              </View>
            </View>
          ) : item.isMyPost ? (
            <TouchableOpacity
              style={s.lfHandoverBtn}
              onPress={() => { setHandoverItem(item); setHandedToName(""); setHandoverError(""); }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.lfHandoverBtnText}>Mark as Handed Over</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderClaimCard = (item: ClaimItem) => (
    <View key={item.id} style={[s.lfCard, { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 }]}>
      <View style={[s.lfAvatar, { width: 42, height: 42, borderRadius: 12, marginTop: 2 }]}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.lfTitle}>{item.itemName}</Text>
        <Text style={s.lfDesc}>
          <Text style={{ color: "#94a3b8" }}>Handed by </Text>
          <Text style={{ fontWeight: "700", color: "#0f172a" }}>{item.handedByName}</Text>
          {item.handedByRole ? <Text style={{ color: "#64748b" }}> ({item.handedByRole})</Text> : null}
        </Text>
        <Text style={s.lfDesc}>
          <Text style={{ color: "#94a3b8" }}>Collected by </Text>
          <Text style={{ fontWeight: "700", color: "#0f172a" }}>{item.handedToName}</Text>
        </Text>
        {item.roomNumber ? (
          <View style={s.lfMetaRow}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <Text style={s.lfLocationText}>Room {item.roomNumber}{item.roomLabel ? ` — ${item.roomLabel}` : ""}</Text>
          </View>
        ) : null}
        {item.collectLocation ? (
          <View style={s.lfMetaRow}>
            <Ionicons name="pin-outline" size={12} color="#16a34a" />
            <Text style={s.lfCollectText}>Handed at: {item.collectLocation}</Text>
          </View>
        ) : null}
        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{formatDate(item.handedAt)}</Text>
      </View>
      {item.photoUrl ? (
        <TouchableOpacity onPress={() => setImageViewerUri(item.photoUrl!)} activeOpacity={0.9}>
          <Image source={{ uri: item.photoUrl }} style={{ width: 56, height: 56, borderRadius: 10, marginTop: 2 }} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}
    </View>
  );

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
        {(["feed", "myposts", "claims"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.segmentBtn, activeTab === tab && s.segmentBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.segmentBtnText, activeTab === tab && s.segmentBtnTextActive]}>
              {tab === "feed" ? "All Items" : tab === "myposts" ? "My Posts" : "Claims"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
      >
        {activeTab === "feed" && (
          feedItems.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}><Ionicons name="search-outline" size={36} color="#16a34a" /></View>
              <Text style={s.emptyTitle}>No items posted yet</Text>
              <Text style={s.emptySub}>Found something on campus? Post it here!</Text>
              <TouchableOpacity style={s.postBtn} onPress={() => router.push("/post-found-item" as any)}>
                <Text style={s.postBtnText}>Post Found Item</Text>
              </TouchableOpacity>
            </View>
          ) : feedItems.map(renderCard)
        )}
        {activeTab === "myposts" && (
          myPosts.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}><Ionicons name="cube-outline" size={36} color="#16a34a" /></View>
              <Text style={s.emptyTitle}>No posts yet</Text>
              <Text style={s.emptySub}>Items you post will appear here.</Text>
              <TouchableOpacity style={s.postBtn} onPress={() => router.push("/post-found-item" as any)}>
                <Text style={s.postBtnText}>Post Found Item</Text>
              </TouchableOpacity>
            </View>
          ) : myPosts.map(renderCard)
        )}
        {activeTab === "claims" && (
          claimItems.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}><Ionicons name="hand-left-outline" size={36} color="#16a34a" /></View>
              <Text style={s.emptyTitle}>No claims yet</Text>
              <Text style={s.emptySub}>Handover records will appear here.</Text>
            </View>
          ) : claimItems.map(renderClaimCard)
        )}
      </ScrollView>

      <Modal visible={!!handoverItem} animationType="slide" transparent onRequestClose={() => setHandoverItem(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.sheetOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Mark as Handed Over</Text>
            <Text style={s.sheetSub}>{`Enter the name of the person who collected "${handoverItem?.itemName}"`}</Text>
            <TextInput
              style={s.sheetInput}
              placeholder="e.g. Shaho"
              placeholderTextColor="#9ca3af"
              value={handedToName}
              onChangeText={(t) => { setHandedToName(t); setHandoverError(""); }}
              autoCapitalize="words"
            />
            {handoverError ? <Text style={s.sheetError}>{handoverError}</Text> : null}
            <View style={s.sheetBtnRow}>
              <TouchableOpacity style={s.sheetCancelBtn} onPress={() => setHandoverItem(null)} disabled={handoverLoading}>
                <Text style={s.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetConfirmBtn, handoverLoading && { opacity: 0.55 }]} onPress={handleHandover} disabled={handoverLoading}>
                {handoverLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.sheetConfirmText}>Confirm Handover</Text>}
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
  lfCard: { backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: "#f1f5f9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  lfCardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  lfAvatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  lfAvatarText: { fontSize: 15, fontWeight: "700", color: "#16a34a" },
  lfPosterName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  lfPosterTime: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  lfMyPostBadge: { backgroundColor: "#f0fdf4", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: "#bbf7d0", marginLeft: 4 },
  lfMyPostBadgeText: { fontSize: 9, fontWeight: "700", color: "#16a34a", letterSpacing: 0.3 },
  lfFoundBadge: { backgroundColor: "#16a34a", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  lfFoundBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  lfImage: { width: "100%", height: 220 },
  lfImageEmpty: { width: "100%", height: 150, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  lfBody: { padding: 14 },
  lfTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  lfDesc: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 8 },
  lfMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  lfLocationText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  lfCollectText: { fontSize: 13, color: "#16a34a", fontWeight: "500" },
  lfHandedBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  lfHandedName: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  lfHandedDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  lfHandoverBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10, flexDirection: "row", justifyContent: "center" },
  lfHandoverBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  sheetSub: { fontSize: 14, color: "#64748b", lineHeight: 22, marginBottom: 20 },
  sheetInput: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", marginBottom: 8 },
  sheetError: { fontSize: 13, color: "#dc2626", marginBottom: 12, fontWeight: "500" },
  sheetBtnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  sheetCancelBtn: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  sheetCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  sheetConfirmBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  sheetConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});