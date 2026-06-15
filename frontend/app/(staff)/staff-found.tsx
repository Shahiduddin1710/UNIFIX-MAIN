import ScreenWrapper from "@/wrappers/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/firebaseConfig";
import { lostFoundAPI } from "../../services/api";
import { useLoadingStore } from "../../store/loadingStore";

const { width: SW, height: SH } = Dimensions.get("window");

const LF_ROOM_MAP: Record<string, string> = {
  "003A": "Photocopy Center",
  "003": "First Aid / Counselling Room",
  "004": "Conference Room",
  "007": "Basic Workshop",
  "008": "Machine Shop",
  "009": "Seminar Hall",
  "013": "Thermal Engineering Lab",
  "014": "Theory of Machines Lab",
  "015": "Refrigeration & AC Lab",
  "016": "HOD Civil Engineering",
  "017": "Geotechnics Lab",
  "019": "Transportation Engineering Lab",
  "020": "Fluid Mechanics Lab",
  "021": "Applied Hydraulics Lab",
  "022": "Basic Workshop II",
  "023": "Material Testing Lab",
  "024": "HOD Mechanical Engineering",
  "101": "Administrative Office",
  "102": "Principal's Office",
  "112": "CAD Center",
  "113": "Computer Lab B",
  "114": "Networking & DevOps Lab",
  "115": "Programming & Project Lab",
  "117": "Environmental Engineering Lab",
  "118": "Meeting Room",
  "119": "Faculty Room",
  "120": "Robotics Lab",
  "121": "Robotics Lab",
  "123": "Project Lab",
  "124": "Measurement & Automation Lab",
  "127": "Joint Director Office",
  "201": "Cubicles / Staff Room",
  "202": "HOD Computers",
  "209": "HOD IT",
  "212": "Ladies Staff Room",
  "213": "NSS / Dept Office",
  "214": "Classroom 1",
  "215": "Classroom 2",
  "216": "Classroom 3",
  "217": "Faculty Room",
  "218": "Classroom",
  "219": "Computer Center",
  "220": "Computer Center",
  "221": "Computer Center",
  "222": "Computer Center",
  "223": "Computer Center",
  "224": "Language Lab",
  "301": "Gymkhana",
  "302": "Gymkhana",
  "306": "Server Room",
  "307": "CSEDS Staff Room",
  "312": "Tutorial Room",
  "313": "Classroom",
  "314": "Classroom",
  "315": "Classroom",
  "318": "Seminar Hall",
  "319": "Physics Lab",
  "320": "Classroom",
  "321": "Classroom",
  "322": "Chemistry Lab",
  "323": "Classroom",
  "401": "EXTC / VLSI Lab",
  "402": "EXTC / VLSI Lab",
  "406": "HOD EXTC Cabin",
  "414": "Tutorial Room",
  "415": "Classroom",
  "416": "Classroom",
  "417": "Classroom",
  "420": "Classroom",
  "421": "Drawing Hall",
  "422": "Classroom",
  "423": "Classroom",
  "501": "Staff Room",
  "502": "Staff Room",
  "503": "Staff Room",
  "515": "Classroom",
  "516": "Classroom",
  "517": "Classroom",
  "518": "MMS Staff Room",
  "519": "Classroom",
  "520": "Classroom",
  "527": "Student Activity Room",
};

const LF_CATEGORIES_FOUND = [
  "Electronics", "Clothing", "Stationery", "ID Card", "Keys",
  "Bag", "Water Bottle", "Earphones", "Books", "Others",
];

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

type LostItem = {
  id: string;
  itemName: string;
  category: string;
  description: string;
  roomNumber: string;
  roomLabel: string;
  collectLocation: string;
  photoUrl?: string | null;
  postedByName: string;
  createdAt: any;
  status: string;
  isMyPost: boolean;
  handedToName?: string;
  handedAt?: any;
};

type ClaimItem = {
  id: string;
  itemName: string;
  photoUrl: string | null;
  handedByName: string;
  handedByRole: string;
  handedToName: string;
  roomNumber: string;
  roomLabel: string;
  collectLocation: string;
  handedAt: any;
};

type StaffData = {
  fullName: string;
  email: string;
  designation: string;
  employeeId: string;
  experience: string;
  phone?: string;
  photoUrl?: string;
  gender?: string;
  nationalIdCardUrl?: string;
};


function formatDate(ts: any) {
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAgo(ts: any): string {
  if (!ts) return "";
  const seconds = ts._seconds ?? ts.seconds ?? (typeof ts === "number" ? ts : null);
  if (!seconds) return "";
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ImageViewer({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const initialDistance = useRef(0);
  const reset = () => {
    lastScale.current = 1;
    lastX.current = 0;
    lastY.current = 0;
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  };
  useEffect(() => {
    if (visible) reset();
  }, [visible]);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        if (gs.numberActiveTouches === 2) initialDistance.current = 0;
      },
      onPanResponderMove: (e, gs) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (initialDistance.current === 0) {
            initialDistance.current = dist;
            return;
          }
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
    }),
  ).current;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={iv.overlay}>
        <TouchableOpacity style={iv.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale }, { translateX }, { translateY }] }} {...panResponder.panHandlers}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { if (lastScale.current <= 1) onClose(); }}
            onLongPress={reset}
          >
            <Image source={{ uri }} style={iv.image} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const iv = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  closeBtn: { position: "absolute", top: 52, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  image: { width: SW, height: SH },
});

export default memo(function StaffFoundScreen({ initialTab }: { initialTab?: "feed" | "myposts" | "claims" }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [staffUid, setStaffUid] = useState<string | null>(null);
 const isLoaded = useLoadingStore((s) => s.isLoaded);
  const markLoaded = useLoadingStore((s) => s.markLoaded);
  const [loading, setLoading] = useState(!isLoaded("staffFound"));
  const [refreshing, setRefreshing] = useState(false);
 const [feedItems, setFeedItems] = useState<LostItem[]>([]);
  const [myPosts, setMyPosts] = useState<LostItem[]>([]);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
 const [lostFoundTab, setLostFoundTab] = useState<"feed" | "myposts" | "claims">(initialTab || "feed");
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [showPostFoundModal, setShowPostFoundModal] = useState(false);
  const [postFoundItemName, setPostFoundItemName] = useState("");
  const [postFoundCategory, setPostFoundCategory] = useState("Others");
  const [postFoundDescription, setPostFoundDescription] = useState("");
  const [postFoundRoomInput, setPostFoundRoomInput] = useState("");
  const [postFoundResolvedRoom, setPostFoundResolvedRoom] = useState<{ label: string } | null>(null);
  const [postFoundRoomError, setPostFoundRoomError] = useState("");
  const [postFoundCollectLocation, setPostFoundCollectLocation] = useState("");
  const [postFoundPhoto, setPostFoundPhoto] = useState<{ uri: string; name: string } | null>(null);
  const [postFoundSubmitting, setPostFoundSubmitting] = useState(false);
  const [postFoundUploadingPhoto, setPostFoundUploadingPhoto] = useState(false);
  const [postFoundError, setPostFoundError] = useState("");
  const [handoverItem, setHandoverItem] = useState<LostItem | null>(null);
  const [handedToName, setHandedToName] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
const [handoverError, setHandoverError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const bottomNavHeight = 60 + insets.bottom;
  


  const handlePostFoundRoomInput = useCallback((val: string) => {
    setPostFoundRoomInput(val);
    setPostFoundRoomError("");
    if (!val.trim()) { setPostFoundResolvedRoom(null); return; }
    const key = val.trim().toUpperCase() === "003A" ? "003A" : val.trim();
    if (LF_ROOM_MAP[key]) setPostFoundResolvedRoom({ label: LF_ROOM_MAP[key] });
    else { setPostFoundResolvedRoom(null); if (val.trim().length >= 3) setPostFoundRoomError("Invalid room number."); }
  }, []);

const handlePostFoundPickPhoto = useCallback(async () => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("Permission Required", "Please allow camera access.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPostFoundPhoto({ uri: asset.uri, name: asset.uri.split("/").pop() || `lostfound_${Date.now()}.jpg` });
          } catch {
            Alert.alert("Error", "Failed to open camera.");
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("Permission Required", "Please allow photo library access.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPostFoundPhoto({ uri: asset.uri, name: asset.uri.split("/").pop() || `lostfound_${Date.now()}.jpg` });
          } catch {
            Alert.alert("Error", "Failed to pick photo.");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const resetPostFoundForm = useCallback(() => {
    setPostFoundItemName("");
    setPostFoundCategory("Others");
    setPostFoundDescription("");
    setPostFoundRoomInput("");
    setPostFoundResolvedRoom(null);
    setPostFoundRoomError("");
    setPostFoundCollectLocation("");
    setPostFoundPhoto(null);
    setPostFoundError("");
    setPostFoundSubmitting(false);
    setPostFoundUploadingPhoto(false);
  }, []);

  const handlePostFoundSubmit = useCallback(async () => {
    setPostFoundError("");
    if (!postFoundItemName.trim()) return setPostFoundError("Please enter the item name.");
    if (!postFoundResolvedRoom) return setPostFoundError("Please enter a valid room number.");
    if (!postFoundCollectLocation.trim()) return setPostFoundError("Please mention where to collect the item.");
    setPostFoundSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (postFoundPhoto) {
        setPostFoundUploadingPhoto(true);
        const formData = new FormData();
        formData.append("file", { uri: postFoundPhoto.uri, type: "image/jpeg", name: postFoundPhoto.name } as any);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", "unifix/lostFound");
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        photoUrl = data.secure_url;
        setPostFoundUploadingPhoto(false);
      }
      await lostFoundAPI.postItem({
        itemName: postFoundItemName.trim(),
        category: postFoundCategory,
        description: postFoundDescription.trim(),
        roomNumber: postFoundRoomInput.trim(),
        roomLabel: postFoundResolvedRoom.label,
        collectLocation: postFoundCollectLocation.trim(),
        photoUrl,
      });
  setShowPostFoundModal(false);
      resetPostFoundForm();
      if (staffUid) {
        const { getLostFoundFeedFromDb, getAllClaimsFromDb, syncLostFoundFeed, syncClaims, syncMyLostFoundPosts, getMyLostFoundPostsFromDb } = await import("../../sync/lostFoundSyncManager");
        const { setMeta } = await import("../../db/metadataDb");
        await setMeta("lf_feed_hash", "");
        await Promise.all([syncLostFoundFeed(), syncClaims(), syncMyLostFoundPosts(staffUid)]);
        const [feed, claims, myPostsData] = await Promise.all([getLostFoundFeedFromDb(), getAllClaimsFromDb(), getMyLostFoundPostsFromDb(staffUid)]);
        setFeedItems((feed as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
        setClaimItems(claims as any);
        setMyPosts((myPostsData as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
      }
    } catch (err: any) { setPostFoundError(err.message || "Failed to post."); }
    finally { setPostFoundSubmitting(false); setPostFoundUploadingPhoto(false); }
}, [postFoundItemName, postFoundResolvedRoom, postFoundCollectLocation, postFoundPhoto, postFoundCategory, postFoundDescription, postFoundRoomInput, staffUid, resetPostFoundForm]);

  const handleDeletePost = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await lostFoundAPI.deletePost(id);
      const { deleteLostFoundItemById } = await import("../../sync/lostFoundSyncManager");
      await deleteLostFoundItemById(id);
      setFeedItems((prev) => prev.filter((i) => i.id !== id));
      setMyPosts((prev) => prev.filter((i) => i.id !== id));
      if (staffUid) {
        const { getLostFoundFeedFromDb, syncLostFoundFeed, syncMyLostFoundPosts, getMyLostFoundPostsFromDb } = await import("../../sync/lostFoundSyncManager");
        const { setMeta } = await import("../../db/metadataDb");
        await setMeta("lf_feed_hash", "");
        await Promise.all([syncLostFoundFeed(), syncMyLostFoundPosts(staffUid)]);
        const [feed, myPostsData] = await Promise.all([getLostFoundFeedFromDb(), getMyLostFoundPostsFromDb(staffUid)]);
        setFeedItems((feed as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
        setMyPosts((myPostsData as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }, [staffUid]);

  const handleHandover = useCallback(async () => {
    if (!handedToName.trim()) { setHandoverError("Please enter the name."); return; }
    if (!handoverItem) return;
    setHandoverLoading(true);
   try {
      await lostFoundAPI.handover(handoverItem.id, handedToName.trim());
      const handedAt = { _seconds: Math.floor(Date.now() / 1000) };
      setFeedItems((prev) => prev.map((i) =>
        i.id === handoverItem.id
          ? { ...i, status: "handed_over", handedToName: handedToName.trim(), handedAt }
          : i
      ));
      setMyPosts((prev) => prev.map((i) =>
        i.id === handoverItem.id
          ? { ...i, status: "handed_over", handedToName: handedToName.trim(), handedAt }
          : i
      ));
      setHandoverItem(null);
      if (staffUid) {
        const { getLostFoundFeedFromDb, getAllClaimsFromDb, syncLostFoundFeed, syncClaims, syncMyLostFoundPosts } = await import("../../sync/lostFoundSyncManager");
        const { setMeta } = await import("../../db/metadataDb");
        await setMeta("lostfound_feed_hash", "");
        await Promise.all([syncLostFoundFeed(), syncClaims(), syncMyLostFoundPosts(staffUid)]);
       const [feed, claims] = await Promise.all([getLostFoundFeedFromDb(), getAllClaimsFromDb()]);
        setFeedItems((feed as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
        setClaimItems(claims as any);
      }
    } catch (err: any) { setHandoverError(err.message || "Failed."); }
    finally { setHandoverLoading(false); }
 }, [handedToName, handoverItem, staffUid]);

const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { getLostFoundFeedFromDb, getAllClaimsFromDb, syncLostFoundFeed, syncClaims, syncMyLostFoundPosts } = await import("../../sync/lostFoundSyncManager");
      const { setMeta } = await import("../../db/metadataDb");
      if (staffUid) {
        await setMeta("lostfound_feed_hash", "");
        await setMeta("lostfound_claims_hash", "");
        await Promise.all([
          syncLostFoundFeed(),
          syncClaims(),
          syncMyLostFoundPosts(staffUid),
        ]);
     const { getMyLostFoundPostsFromDb: getMyPosts } = await import("../../sync/lostFoundSyncManager");
        const [feed, claims, myPostsData] = await Promise.all([getLostFoundFeedFromDb(), getAllClaimsFromDb(), getMyPosts(staffUid!)]);
        setFeedItems((feed as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
        setClaimItems(claims as any);
        setMyPosts((myPostsData as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
      }
    } catch {} finally {
      setRefreshing(false);
    }
  }, [staffUid]);

useEffect(() => {
    const bootstrap = async () => {
      // Read SQLite immediately via the sync manager — same pattern as Admin.
      // This dismisses the skeleton before Firebase or network resolves.
      const { getLostFoundFeedFromDb, getAllClaimsFromDb, syncLostFoundFeed, syncClaims, syncMyLostFoundPosts } = await import("../../sync/lostFoundSyncManager");
      const uid = auth.currentUser?.uid;
      const cachedUid = uid ?? (await import("../../utils/cache").then(m => m.loadUserCache()))?.uid ?? null;

   if (cachedUid) {
        const { getMyLostFoundPostsFromDb } = await import("../../sync/lostFoundSyncManager");
        const [localFeed, localClaims, localMyPosts] = await Promise.all([
          getLostFoundFeedFromDb(),
          getAllClaimsFromDb(),
          getMyLostFoundPostsFromDb(cachedUid),
        ]);
       if (localFeed.length > 0) {
          const sorted = (localFeed as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
          setFeedItems(sorted);
        }
        if (localClaims.length > 0) setClaimItems(localClaims as any);
        if (localMyPosts.length > 0) setMyPosts((localMyPosts as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
      }
      // Always dismiss skeleton after SQLite read, regardless of result.
      setLoading(false);
      markLoaded("staffFound");

      // Background network sync — never re-shows skeleton.
      if (cachedUid) {
        try {
          await Promise.all([
            syncLostFoundFeed(),
            syncClaims(),
            syncMyLostFoundPosts(cachedUid),
          ]);
        const { getLostFoundFeedFromDb: getFeed, getAllClaimsFromDb: getClaims, getMyLostFoundPostsFromDb: getMyPosts } = await import("../../sync/lostFoundSyncManager");
          const [updatedFeed, updatedClaims, updatedMyPosts] = await Promise.all([getFeed(), getClaims(), getMyPosts(cachedUid)]);
          setFeedItems((updatedFeed as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
          setClaimItems(updatedClaims as any);
          setMyPosts((updatedMyPosts as any[]).sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0)));
        } catch {}
      }
    };

    bootstrap();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const { default: NetInfo } = await import("@react-native-community/netinfo");
        const netState = await NetInfo.fetch();
        const online = !!(netState.isConnected && netState.isInternetReachable);
        if (!online) return; // offline — bootstrap already loaded from SQLite
        router.replace("/login" as any);
        return;
      }
      setStaffUid(u.uid);
      // Background profile fetch only — skeleton already dismissed by bootstrap.
      getDoc(doc(db, "users", u.uid)).then((snap) => {
        if (snap.exists()) setStaffData(snap.data() as StaffData);
      }).catch(() => {});
    });

    return () => unsub();
  }, []);
  const renderLostFoundCard = useCallback((item: LostItem) => {
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
          <View style={s.lfImageEmpty}><Ionicons name="cube-outline" size={44} color="#cbd5e1" /></View>
        )}
        <View style={s.lfBody}>
          <Text style={s.lfTitle}>{item.itemName}</Text>
          {item.description ? <Text style={s.lfDesc}>{item.description}</Text> : null}
         <View style={s.lfMetaRow}>
            <Ionicons name="location-outline" size={13} color="#374151" />
            <Text style={s.lfLocationText}>Room {item.roomNumber}{item.roomLabel ? ` , ${item.roomLabel}` : ""}</Text>
          </View>
          <View style={s.lfMetaRow}>
            <Ionicons name="time-outline" size={13} color="#64748b" />
            <Text style={s.lfLocationText}>{formatDate(item.createdAt)}</Text>
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
        ) : (lostFoundTab === "myposts" && item.isMyPost) ? (
            <View style={{ gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[s.lfHandoverBtn, { marginTop: 0 }]}
                onPress={() => { setHandoverItem(item); setHandedToName(""); setHandoverError(""); }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.lfHandoverBtnText}>Mark as Handed Over</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.lfDeleteBtn, deletingId === item.id && { opacity: 0.6 }]}
                onPress={() => handleDeletePost(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                    <Text style={s.lfDeleteBtnText}>Delete Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
   }, [lostFoundTab, deletingId]);

  return (
    <ScreenWrapper loading={loading} skeleton="staffFound" roleReady={!!staffUid && !!staffData}>
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <View style={s.lfPageHeader}>
          <View style={{ width: 36 }} />
          <Text style={s.lfPageTitle}>Lost & Found</Text>
          <TouchableOpacity style={s.lfPageAddBtn} onPress={() => setShowPostFoundModal(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={s.lfSegmentRow}>
          {(["feed", "myposts", "claims"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.lfSegBtn, lostFoundTab === tab && s.lfSegBtnActive]}
              onPress={() => setLostFoundTab(tab)}
            >
              <Text style={[s.lfSegBtnText, lostFoundTab === tab && s.lfSegBtnTextActive]}>
                {tab === "feed" ? "All Items" : tab === "myposts" ? "My Posts" : "Claims"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[s.lfContainer, { paddingBottom: bottomNavHeight + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
        >
         {refreshing ? (
            <>
     {lostFoundTab === "claims" ? (
                <>
                  <View style={[s.lfCard, { opacity: 0.6, padding: 16 }]}>
                    <View style={{ height: 20, width: "30%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 13, width: "50%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 14 }} />
                    <View style={{ height: 13, width: "55%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 13, width: "45%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 13, width: "40%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 11, width: "35%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                  </View>
                  <View style={[s.lfCard, { opacity: 0.6, padding: 16 }]}>
                    <View style={{ height: 20, width: "30%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 13, width: "50%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 14 }} />
                    <View style={{ height: 13, width: "55%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 13, width: "45%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 13, width: "40%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 11, width: "35%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                  </View>
                </>
              ) : (
                <>
                  <View style={[s.lfCard, { opacity: 0.6, padding: 16 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", marginRight: 10 }} />
                      <View style={{ height: 14, width: "40%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                    </View>
                    <View style={{ height: 160, width: "100%", backgroundColor: "#f1f5f9", borderRadius: 12, marginBottom: 12 }} />
                    <View style={{ height: 16, width: "60%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 13, width: "45%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                  </View>
                  <View style={[s.lfCard, { opacity: 0.6, padding: 16 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", marginRight: 10 }} />
                      <View style={{ height: 14, width: "40%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                    </View>
                    <View style={{ height: 160, width: "100%", backgroundColor: "#f1f5f9", borderRadius: 12, marginBottom: 12 }} />
                    <View style={{ height: 16, width: "60%", backgroundColor: "#f1f5f9", borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 13, width: "45%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
                  </View>
                </>
              )}
            </>
          ) : lostFoundTab === "feed" && (
            feedItems.length === 0 ? (
              <View style={s.lfEmptyState}>
                <View style={s.lfEmptyIconWrap}><Ionicons name="search-outline" size={36} color="#16a34a" /></View>
                <Text style={s.lfEmptyTitle}>No items posted yet</Text>
                <TouchableOpacity style={s.lfPostBtn} onPress={() => setShowPostFoundModal(true)}>
                  <Text style={s.lfPostBtnText}>Post Found Item</Text>
                </TouchableOpacity>
              </View>
            ) : (feedItems.map(renderLostFoundCard))
          )}

         {!refreshing && lostFoundTab === "myposts" && (
            myPosts.length === 0 ? (
              <View style={s.lfEmptyState}>
                <View style={s.lfEmptyIconWrap}><Ionicons name="cube-outline" size={36} color="#16a34a" /></View>
                <Text style={s.lfEmptyTitle}>No posts yet</Text>
                <TouchableOpacity style={s.lfPostBtn} onPress={() => setShowPostFoundModal(true)}>
                  <Text style={s.lfPostBtnText}>Post Found Item</Text>
                </TouchableOpacity>
              </View>
            ) : (myPosts.map(renderLostFoundCard))
          )}

          {!refreshing && lostFoundTab === "claims" && (
            claimItems.length === 0 ? (
              <View style={s.lfEmptyState}>
                <View style={s.lfEmptyIconWrap}><Ionicons name="hand-left-outline" size={36} color="#16a34a" /></View>
                <Text style={s.lfEmptyTitle}>No claims yet</Text>
              </View>
            ) : (
              claimItems.map((item) => (
                <View key={item.id} style={s.lfCard}>
                  <View style={s.lfCardHeader}>
                    <View style={[s.lfAvatar, { width: 42, height: 42, borderRadius: 12 }]}>
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
                          <Text style={s.lfLocationText}>Room {item.roomNumber}{item.roomLabel ? ` , ${item.roomLabel}` : ""}</Text>
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
                        <Image source={{ uri: item.photoUrl }} style={{ width: 56, height: 56, borderRadius: 10 }} resizeMode="cover" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>

        <Modal visible={!!handoverItem} animationType="slide" transparent onRequestClose={() => setHandoverItem(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.sheetOverlay}>
            <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Mark as Handed Over</Text>
              <Text style={s.sheetSub}>Enter the name of the person who collected {handoverItem?.itemName}</Text>
              <TextInput
                style={[s.sheetInput, { minHeight: 50, textAlignVertical: "auto" }]}
                placeholder="e.g. Shaho"
                placeholderTextColor="#9ca3af"
                value={handedToName}
                onChangeText={(t) => { setHandedToName(t); setHandoverError(""); }}
                autoCapitalize="words"
              />
              {handoverError && <Text style={{ color: "#dc2626", fontSize: 13, marginBottom: 8, fontWeight: "500" }}>{handoverError}</Text>}
              <View style={s.sheetBtnRow}>
                <TouchableOpacity style={s.sheetCancelBtn} onPress={() => setHandoverItem(null)} disabled={handoverLoading}>
                  <Text style={s.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.acceptActionBtn, { flex: 1 }, handoverLoading && { opacity: 0.55 }]} onPress={handleHandover} disabled={handoverLoading}>
                  {handoverLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.acceptActionBtnText}>Confirm</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={showPostFoundModal} animationType="slide" onRequestClose={() => { setShowPostFoundModal(false); resetPostFoundForm(); }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                <TouchableOpacity onPress={() => { setShowPostFoundModal(false); resetPostFoundForm(); }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={18} color="#0f172a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>Post Found Item</Text>
                <View style={{ width: 36 }} />
              </View>
              <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={{ backgroundColor: "#f8fafc", borderRadius: 16, overflow: "hidden", minHeight: 160, borderWidth: 1.5, borderColor: "#e2e8f0", borderStyle: "dashed", alignItems: "center", justifyContent: "center" }} onPress={handlePostFoundPickPhoto} activeOpacity={0.85}>
                  {postFoundPhoto ? (
                    <Image source={{ uri: postFoundPhoto.uri }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
                  ) : (
                    <View style={{ padding: 24, alignItems: "center", gap: 8 }}>
                      <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                      <Text style={{ fontSize: 14, color: "#64748b", fontWeight: "500" }}>Tap to add photo (optional)</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={{ backgroundColor: "#ffffff", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#f1f5f9" }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Item Name</Text>
                  <TextInput style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", marginBottom: 14 }} placeholder="e.g. Black Leather Wallet" placeholderTextColor="#9ca3af" value={postFoundItemName} onChangeText={setPostFoundItemName} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {LF_CATEGORIES_FOUND.map((c) => (
                      <TouchableOpacity key={c} style={[{ backgroundColor: "#f8fafc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1.5, borderColor: "#e2e8f0" }, postFoundCategory === c && { backgroundColor: "#f0fdf4", borderColor: "#16a34a" }]} onPress={() => setPostFoundCategory(c)}>
                        <Text style={[{ fontSize: 13, color: "#374151", fontWeight: "500" }, postFoundCategory === c && { color: "#16a34a", fontWeight: "700" }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Description</Text>
                  <TextInput style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", height: 80, textAlignVertical: "top" }} placeholder="Color, brand, unique marks..." placeholderTextColor="#9ca3af" value={postFoundDescription} onChangeText={setPostFoundDescription} multiline textAlignVertical="top" />
                </View>

                <View style={{ backgroundColor: "#ffffff", borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: "#f1f5f9" }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Where Found (Room Number)</Text>
                  <View style={[{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: "#e2e8f0" }, postFoundResolvedRoom ? { borderColor: "#16a34a", backgroundColor: "#f0fdf4" } : postFoundRoomError ? { borderColor: "#ef4444" } : null]}>
                    <Ionicons name="location-outline" size={16} color={postFoundResolvedRoom ? "#16a34a" : "#94a3b8"} style={{ marginRight: 8 }} />
                    <TextInput style={{ flex: 1, fontSize: 15, color: "#0f172a" }} placeholder="e.g. 319, 214" placeholderTextColor="#9ca3af" value={postFoundRoomInput} onChangeText={handlePostFoundRoomInput} autoCapitalize="characters" maxLength={5} />
                  </View>
                  {postFoundResolvedRoom && (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: "#bbf7d0" }}>
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "600" }}>Room {postFoundRoomInput}, {postFoundResolvedRoom.label}</Text>
                    </View>
                  )}
                  {postFoundRoomError && <Text style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{postFoundRoomError}</Text>}
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 14 }}>Where to Collect</Text>
                  <TextInput style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", height: 80, textAlignVertical: "top" }} placeholder="e.g. Room 214 after 2PM, or Staff Room 501" placeholderTextColor="#9ca3af" value={postFoundCollectLocation} onChangeText={setPostFoundCollectLocation} multiline textAlignVertical="top" />
                </View>

                {postFoundError && <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "500", textAlign: "center" }}>{postFoundError}</Text>}
                <TouchableOpacity style={[{ backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center" }, postFoundSubmitting && { opacity: 0.55 }]} onPress={handlePostFoundSubmit} disabled={postFoundSubmitting} activeOpacity={0.85}>
                  {postFoundSubmitting ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <ActivityIndicator color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>{postFoundUploadingPhoto ? "Uploading photo..." : "Publishing..."}</Text>
                    </View>
                  ) : (
                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Submit Found Item</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {imageViewerUri && <ImageViewer uri={imageViewerUri} visible={!!imageViewerUri} onClose={() => setImageViewerUri(null)} />}
      </View>
    </ScreenWrapper>
  );
});

const s = StyleSheet.create({
  lfPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lfPageBackBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  lfPageTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  lfPageAddBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  lfSegmentRow: { flexDirection: "row", backgroundColor: "#ffffff", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  lfSegBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  lfSegBtnActive: { borderBottomColor: "#16a34a" },
  lfSegBtnText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  lfSegBtnTextActive: { color: "#16a34a", fontWeight: "700" },
  lfContainer: { padding: 14, gap: 14 },
  lfEmptyState: { alignItems: "center", paddingTop: 80 },
  lfEmptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  lfEmptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  lfPostBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  lfPostBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
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
  lfDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    minHeight: 44,
  },
  lfDeleteBtnText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  sheetSub: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  sheetInput: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 14, color: "#0f172a", borderWidth: 1.5, borderColor: "#e2e8f0", textAlignVertical: "top", minHeight: 100, marginBottom: 16 },
  sheetBtnRow: { flexDirection: "row", gap: 10 },
  sheetCancelBtn: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  sheetCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  sheetRejectBtn: { flex: 1, backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  sheetRejectText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  acceptActionBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  acceptActionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});