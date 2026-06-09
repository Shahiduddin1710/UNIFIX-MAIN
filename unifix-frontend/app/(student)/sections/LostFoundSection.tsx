import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lostFoundAPI, lostReportsAPI } from "../../../services/api";

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const LF_CATEGORIES_FOUND = [
  "Electronics",
  "Clothing",
  "Stationery",
  "ID Card",
  "Keys",
  "Bag",
  "Water Bottle",
  "Earphones",
  "Books",
  "Others",
];

const LF_CATEGORIES_LOST = [
  "Phone",
  "Laptop",
  "ID Card",
  "Keys",
  "Wallet",
  "Bag",
  "Bottle",
  "Other",
];

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
  "104": "Principal's Office",
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

type LostItem = {
  id: string;
  itemName: string;
  category: string;
  description: string;
  roomNumber: string;
  roomLabel: string;
  collectLocation: string;
  photoUrl: string | null;
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

type LostReport = {
  id: string;
  itemName: string;
  category: string;
  description: string;
  locationLost: string;
  dateLost: string;
  howToReach: string;
  images: string[];
  postedBy?: {
    uid?: string;
    name?: string;
    role?: string;
    department?: string;
  };
  postedByName?: string;
  postedAt: any;
  status: string;
  isMyPost: boolean;
};

type LfActiveTab = "lostreports" | "feed" | "lost-history" | "claims";

interface LostFoundSectionProps {
  feedItems: LostItem[];
  lostReports: LostReport[];
  userLostReports: LostReport[];
  claimItems: ClaimItem[];
  lfLoading: boolean;
  lfOffline: boolean;
  lfActiveTab: LfActiveTab;
  refreshing: boolean;
  onRefresh: () => void;
  onSetLfActiveTab: (tab: LfActiveTab) => void;
  onMarkFound: (id: string) => void;
  onDeleteLostReport: (id: string) => void;
  onImageViewer: (uri: string) => void;
  deletingReportId: string | null;
  formatDate: (ts: any) => string;
  formatAgo: (ts: any) => string;
}

function isValidLostDate(dateStr: string): boolean {
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12)
    return false;
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inputDate > today) return false;
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  return inputDate >= fourteenDaysAgo;
}

async function uploadToCloudinary(
  uri: string,
  folder: string,
): Promise<string> {
  const formData = new FormData();
  const name = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
  formData.append("file", { uri, type: "image/jpeg", name } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", folder);
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}
export default memo(function LostFoundSection({
  feedItems,
  lostReports,
  userLostReports,
  claimItems,
  lfLoading,
  lfOffline,
  lfActiveTab,
  refreshing,
  onRefresh,
  onSetLfActiveTab,
  onMarkFound,
  onDeleteLostReport,
  onImageViewer,
  deletingReportId,
  formatDate,
  formatAgo,
}: LostFoundSectionProps) {
  const insets = useSafeAreaInsets();
  const [handoverItem, setHandoverItem] = useState<LostItem | null>(null);
  const [handedToName, setHandedToName] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState("");
  const [showPostSheet, setShowPostSheet] = useState(false);
  const [showPostFoundModal, setShowPostFoundModal] = useState(false);
  const [showPostLostModal, setShowPostLostModal] = useState(false);

  const [postFoundItemName, setPostFoundItemName] = useState("");
  const [postFoundCategory, setPostFoundCategory] = useState("Others");
  const [postFoundDescription, setPostFoundDescription] = useState("");
  const [postFoundRoomInput, setPostFoundRoomInput] = useState("");
  const [postFoundResolvedRoom, setPostFoundResolvedRoom] = useState<{
    label: string;
  } | null>(null);
  const [postFoundRoomError, setPostFoundRoomError] = useState("");
  const [postFoundCollectLocation, setPostFoundCollectLocation] = useState("");
  const [postFoundPhoto, setPostFoundPhoto] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [postFoundSubmitting, setPostFoundSubmitting] = useState(false);
  const [postFoundUploadingPhoto, setPostFoundUploadingPhoto] = useState(false);
  const [postFoundError, setPostFoundError] = useState("");

  const [postLostItemName, setPostLostItemName] = useState("");
  const [postLostCategory, setPostLostCategory] = useState("Other");
  const [postLostDescription, setPostLostDescription] = useState("");
  const [postLostRoomInput, setPostLostRoomInput] = useState("");
  const [postLostResolvedRoom, setPostLostResolvedRoom] = useState<{
    label: string;
  } | null>(null);
  const [postLostRoomError, setPostLostRoomError] = useState("");
  const [postLostDateLost, setPostLostDateLost] = useState("");
  const [postLostDateError, setPostLostDateError] = useState("");
  const [postLostHowToReach, setPostLostHowToReach] = useState("");
  const [postLostPhoto, setPostLostPhoto] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [postLostError, setPostLostError] = useState("");
  const [postLostSubmitting, setPostLostSubmitting] = useState(false);
  const [postLostUploadingPhoto, setPostLostUploadingPhoto] = useState(false);

  const bottomNavHeight = 60 + insets.bottom;

  const handleHandover = useCallback(async () => {
    if (!handedToName.trim()) {
      setHandoverError("Please enter the name.");
      return;
    }
    if (!handoverItem) return;
    setHandoverLoading(true);
    try {
      await lostFoundAPI.handover(handoverItem.id, handedToName.trim());
      setHandoverItem(null);
      onRefresh();
    } catch (err: any) {
      setHandoverError(err.message || "Failed.");
    } finally {
      setHandoverLoading(false);
    }
  }, [handedToName, handoverItem, onRefresh]);

  const handlePostFoundRoomInput = useCallback((val: string) => {
    setPostFoundRoomInput(val);
    setPostFoundRoomError("");
    if (!val.trim()) {
      setPostFoundResolvedRoom(null);
      return;
    }
    const key = val.trim().toUpperCase() === "003A" ? "003A" : val.trim();
    if (LF_ROOM_MAP[key]) setPostFoundResolvedRoom({ label: LF_ROOM_MAP[key] });
    else {
      setPostFoundResolvedRoom(null);
      if (val.trim().length >= 3) setPostFoundRoomError("Invalid room number.");
    }
  }, []);

  const handlePostLostRoomInput = useCallback((val: string) => {
    setPostLostRoomInput(val);
    setPostLostRoomError("");
    if (!val.trim()) {
      setPostLostResolvedRoom(null);
      return;
    }
    const key = val.trim().toUpperCase() === "003A" ? "003A" : val.trim();
    if (LF_ROOM_MAP[key]) setPostLostResolvedRoom({ label: LF_ROOM_MAP[key] });
    else {
      setPostLostResolvedRoom(null);
      if (val.trim().length >= 3) setPostLostRoomError("Invalid room number.");
    }
  }, []);

  const handlePostLostDateInput = useCallback((val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.slice(0, 8);
    let formatted = "";
    if (digits.length > 0) formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
    if (digits.length > 4) formatted += "/" + digits.slice(4, 8);
    setPostLostDateLost(formatted);
    setPostLostDateError("");
    if (formatted.length === 10 && !isValidLostDate(formatted)) {
      setPostLostDateError(
        "Date must be within last 14 days and not in future.",
      );
    }
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
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPostFoundPhoto({
              uri: asset.uri,
              name: asset.uri.split("/").pop() || `lostfound_${Date.now()}.jpg`,
            });
          } catch {
            Alert.alert("Error", "Failed to open camera.");
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          try {
            const perm =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Permission Required",
                "Please allow photo library access.",
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPostFoundPhoto({
              uri: asset.uri,
              name: asset.uri.split("/").pop() || `lostfound_${Date.now()}.jpg`,
            });
          } catch {
            Alert.alert("Error", "Failed to pick photo.");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const handlePostLostPickPhoto = useCallback(async () => {
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
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPostLostPhoto({
              uri: asset.uri,
              name:
                asset.uri.split("/").pop() || `lostreport_${Date.now()}.jpg`,
            });
          } catch {
            Alert.alert("Error", "Failed to open camera.");
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          try {
            const perm =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Permission Required",
                "Please allow photo library access.",
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            setPostLostPhoto({
              uri: asset.uri,
              name:
                asset.uri.split("/").pop() || `lostreport_${Date.now()}.jpg`,
            });
          } catch {
            Alert.alert("Error", "Failed to pick photo.");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);
  const handlePostFoundSubmit = useCallback(async () => {
    setPostFoundError("");
    if (!postFoundItemName.trim())
      return setPostFoundError("Please enter the item name.");
    if (!postFoundResolvedRoom)
      return setPostFoundError("Please enter a valid room number.");
    if (!postFoundCollectLocation.trim())
      return setPostFoundError("Please mention where to collect the item.");
    setPostFoundSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (postFoundPhoto) {
        setPostFoundUploadingPhoto(true);
        const formData = new FormData();
        formData.append("file", {
          uri: postFoundPhoto.uri,
          type: "image/jpeg",
          name: postFoundPhoto.name,
        } as any);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", "unifix/lostFound");
        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
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
      onSetLfActiveTab("feed");
      onRefresh();
    } catch (err: any) {
      setPostFoundError(
        err.message || "Failed to post. Check your connection.",
      );
    } finally {
      setPostFoundSubmitting(false);
      setPostFoundUploadingPhoto(false);
    }
  }, [postFoundItemName, postFoundResolvedRoom, postFoundCollectLocation, postFoundPhoto, postFoundCategory, postFoundDescription, postFoundRoomInput, onSetLfActiveTab, onRefresh]);

  const handlePostLostSubmit = useCallback(async () => {
    setPostLostError("");
    if (!postLostItemName.trim())
      return setPostLostError("Please enter the item name.");
    if (!postLostDescription.trim())
      return setPostLostError("Please describe the item.");
    if (!postLostResolvedRoom)
      return setPostLostError("Please enter a valid room number.");
    if (!postLostDateLost.trim())
      return setPostLostError("Please enter the date you lost it.");
    if (!isValidLostDate(postLostDateLost))
      return setPostLostError("Enter valid date. Cannot be future date.");
    if (!postLostHowToReach.trim())
      return setPostLostError("Please mention how people can reach you.");
    setPostLostSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (postLostPhoto) {
        setPostLostUploadingPhoto(true);
        const formData = new FormData();
        formData.append("file", {
          uri: postLostPhoto.uri,
          type: "image/jpeg",
          name: postLostPhoto.name,
        } as any);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", "unifix/lostReports");
        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        imageUrl = data.secure_url;
        setPostLostUploadingPhoto(false);
      }
      await lostReportsAPI.post({
        itemName: postLostItemName.trim(),
        category: postLostCategory,
        description: postLostDescription.trim(),
        locationLost: `Room ${postLostRoomInput.trim()}, ${postLostResolvedRoom.label}`,
        dateLost: postLostDateLost.trim(),
        howToReach: postLostHowToReach.trim(),
        images: imageUrl ? [imageUrl] : [],
      });
      setShowPostLostModal(false);
      resetPostLostForm();
      onSetLfActiveTab("lostreports");
      onRefresh();
    } catch (err: any) {
      setPostLostError(err.message || "Failed to post. Check your connection.");
    } finally {
      setPostLostSubmitting(false);
      setPostLostUploadingPhoto(false);
    }
  }, [postLostItemName, postLostDescription, postLostResolvedRoom, postLostDateLost, postLostHowToReach, postLostPhoto, postLostCategory, postLostRoomInput, onSetLfActiveTab, onRefresh]);

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

  const resetPostLostForm = useCallback(() => {
    setPostLostItemName("");
    setPostLostCategory("Other");
    setPostLostDescription("");
    setPostLostRoomInput("");
    setPostLostResolvedRoom(null);
    setPostLostRoomError("");
    setPostLostDateLost("");
    setPostLostDateError("");
    setPostLostHowToReach("");
    setPostLostPhoto(null);
    setPostLostError("");
    setPostLostSubmitting(false);
    setPostLostUploadingPhoto(false);
  }, []);

 

  return (
    <View style={s.fullTab}>
      <View style={[s.tabHeader, { paddingTop: insets.top + 14 }]}>
        <View style={{ width: 36 }} />
        <Text style={[s.tabHeaderTitle, { flex: 1, textAlign: "center" }]}>
          Lost & Found
        </Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setShowPostSheet(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {lfOffline && (
        <View
          style={{
            backgroundColor: "#f59e0b",
            padding: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            {"You're offline, showing cached data"}
          </Text>
        </View>
      )}
      <View style={s.segmentRow}>
        {(
          ["lostreports", "feed", "lost-history", "claims"] as LfActiveTab[]
        ).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.segmentBtn, lfActiveTab === tab && s.segmentBtnActive]}
            onPress={() => onSetLfActiveTab(tab)}
          >
            <Text
              style={[
                s.segmentBtnText,
                lfActiveTab === tab && s.segmentBtnTextActive,
              ]}
            >
              {tab === "lostreports"
                ? "Lost"
                : tab === "feed"
                  ? "Found"
                  : tab === "lost-history"
                    ? "History"
                    : "Claims"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={[
          s.tabContainer,
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
        {lfActiveTab === "lostreports" &&
          (lfLoading ? (
            <View style={s.emptyState}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : userLostReports.length === 0 ? (
            <View style={s.emptyState}>
              <View
                style={[
                  s.emptyIconWrap,
                  { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
                ]}
              >
                <Ionicons name="cube-outline" size={40} color="#16a34a" />
              </View>
              <Text style={s.emptyStateTitle}>
                {"You haven't reported any lost items"}
              </Text>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: "#16a34a" }]}
                onPress={() => setShowPostLostModal(true)}
              >
                <Text style={s.actionBtnText}>+ Post Lost Report</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {userLostReports.map((item) => (
                <View key={item.id} style={s.lfCard}>
                  <View style={s.lfCardHeader}>
                    <View style={s.lfAvatar}>
                      <Text style={s.lfAvatarText}>
                        {(item.postedBy?.name ||
                          item.postedByName)?.[0]?.toUpperCase() ?? "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.lfPosterName}>
                        {item.postedBy?.name || item.postedByName}
                      </Text>
                      <Text style={s.lfPosterTime}>
                        {item.postedBy?.role ?? ""} · {formatAgo(item.postedAt)}
                      </Text>
                    </View>
                    {item.isMyPost && (
                      <View style={s.myPostBadge}>
                        <Text style={s.myPostBadgeText}>MY POST</Text>
                      </View>
                    )}
                    <View
                      style={[
                        s.foundBadge,
                        item.status === "found" && {
                          backgroundColor: "#2563eb",
                        },
                      ]}
                    >
                      <Text style={s.foundBadgeText}>
                        {item.status === "found" ? "FOUND" : "LOST"}
                      </Text>
                    </View>
                  </View>
                  {item.images?.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => onImageViewer(item.images[0])}
                    >
                      <Image
                        source={{ uri: item.images[0] }}
                        style={s.lfImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={s.lfImageEmpty}>
                      <Ionicons
                        name="search-outline"
                        size={40}
                        color="#94a3b8"
                      />
                    </View>
                  )}
                  <View style={s.lfBody}>
                    <Text style={s.lfTitle}>{item.itemName}</Text>
                    <View
                      style={[
                        s.myPostBadge,
                        {
                          alignSelf: "flex-start",
                          marginBottom: 8,
                          backgroundColor: "#fef3c7",
                          borderColor: "#fde68a",
                        },
                      ]}
                    >
                      <Text style={[s.myPostBadgeText, { color: "#92400e" }]}>
                        {item.category}
                      </Text>
                    </View>
                    {item.description ? (
                      <Text style={s.lfDesc}>{item.description}</Text>
                    ) : null}
                    <View style={s.lfMetaRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#374151"
                      />
                      <Text style={s.lfLocText}>{item.locationLost}</Text>
                    </View>
                    <View style={s.lfMetaRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color="#374151"
                      />
                      <Text style={s.lfLocText}>Lost: {item.dateLost}</Text>
                    </View>
                    <View style={s.lfMetaRow}>
                      <Ionicons name="call-outline" size={13} color="#16a34a" />
                      <Text style={s.lfCollectText}>{item.howToReach}</Text>
                    </View>
                    {item.isMyPost && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginTop: 12,
                          alignItems: "flex-end",
                        }}
                      >
                        {item.status !== "found" && (
                          <TouchableOpacity
                            style={[
                              s.handoverBtn,
                              {
                                width: "48%",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                            onPress={() => onMarkFound(item.id)}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={16}
                              color="#fff"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={s.handoverBtnText}>Mark as Found</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            {
                              width: item.status === "found" ? "100%" : "48%",
                              backgroundColor: "#dc2626",
                              paddingVertical: 12,
                              borderRadius: 12,
                              flexDirection: "row",
                              justifyContent: "center",
                              alignItems: "center",
                              opacity: deletingReportId === item.id ? 0.6 : 1,
                            },
                          ]}
                          onPress={() => onDeleteLostReport(item.id)}
                          disabled={deletingReportId === item.id}
                        >
                          {deletingReportId === item.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#fff"
                                style={{ marginRight: 6 }}
                              />
                              <Text
                                style={{
                                  color: "#fff",
                                  fontWeight: "700",
                                  fontSize: 15,
                                }}
                              >
                                Delete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={[
                  s.actionBtn,
                  {
                    backgroundColor: "#16a34a",
                    alignSelf: "center",
                    marginTop: 8,
                  },
                ]}
                onPress={() => setShowPostLostModal(true)}
              >
                <Text style={s.actionBtnText}>+ Post Lost Report</Text>
              </TouchableOpacity>
            </>
          ))}

        {lfActiveTab === "lost-history" &&
          (lfLoading ? (
            <View style={s.emptyState}>
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
          ) : lostReports.length === 0 ? (
            <View style={s.emptyState}>
              <View
                style={[
                  s.emptyIconWrap,
                  { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
                ]}
              >
                <Ionicons name="search-outline" size={40} color="#f59e0b" />
              </View>
              <Text style={s.emptyStateTitle}>No lost reports yet</Text>
              <Text style={s.emptyStateSub}>
                All campus lost reports appear here.
              </Text>
            </View>
          ) : (
            (lostReports ?? []).map((item) => (
              <View key={item.id} style={s.lfCard}>
                <View style={s.lfCardHeader}>
                  <View style={s.lfAvatar}>
                    <Text style={s.lfAvatarText}>
                      {(item.postedBy?.name ||
                        item.postedByName)?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lfPosterName}>
                      {item.postedBy?.name || item.postedByName}
                    </Text>
                    <Text style={s.lfPosterTime}>
                      {item.postedBy?.role ?? ""} · {formatAgo(item.postedAt)}
                    </Text>
                  </View>
                  {item.isMyPost && (
                    <View style={s.myPostBadge}>
                      <Text style={s.myPostBadgeText}>MY POST</Text>
                    </View>
                  )}
                  <View
                    style={[
                      s.foundBadge,
                      item.status === "found" && {
                        backgroundColor: "#2563eb",
                      },
                    ]}
                  >
                    <Text style={s.foundBadgeText}>
                      {item.status === "found" ? "FOUND" : "LOST"}
                    </Text>
                  </View>
                </View>
                {item.images?.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => onImageViewer(item.images[0])}
                  >
                    <Image
                      source={{ uri: item.images[0] }}
                      style={s.lfImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={s.lfImageEmpty}>
                    <Ionicons name="search-outline" size={40} color="#94a3b8" />
                  </View>
                )}
                <View style={s.lfBody}>
                  <Text style={s.lfTitle}>{item.itemName}</Text>
                  <View
                    style={[
                      s.myPostBadge,
                      {
                        alignSelf: "flex-start",
                        marginBottom: 8,
                        backgroundColor: "#fef3c7",
                        borderColor: "#fde68a",
                      },
                    ]}
                  >
                    <Text style={[s.myPostBadgeText, { color: "#92400e" }]}>
                      {item.category}
                    </Text>
                  </View>
                  {item.description ? (
                    <Text style={s.lfDesc}>{item.description}</Text>
                  ) : null}
                  <View style={s.lfMetaRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color="#374151"
                    />
                    <Text style={s.lfLocText}>{item.locationLost}</Text>
                  </View>
                  <View style={s.lfMetaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color="#374151"
                    />
                    <Text style={s.lfLocText}>Lost: {item.dateLost}</Text>
                  </View>
                  <View style={s.lfMetaRow}>
                    <Ionicons name="call-outline" size={13} color="#16a34a" />
                    <Text style={s.lfCollectText}>{item.howToReach}</Text>
                  </View>
                </View>
              </View>
            ))
          ))}

        {lfActiveTab === "feed" &&
          (feedItems.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="search-outline" size={40} color="#16a34a" />
              </View>
              <Text style={s.emptyStateTitle}>No found items posted yet</Text>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => setShowPostFoundModal(true)}
              >
                <Text style={s.actionBtnText}>Post Found Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            feedItems.map((item) => {
              const isHandedOver = item.status === "handed_over";
              return (
                <View key={item.id} style={s.lfCard}>
                  <View style={s.lfCardHeader}>
                    <View style={s.lfAvatar}>
                      <Text style={s.lfAvatarText}>
                        {item.postedByName?.[0]?.toUpperCase() ?? "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.lfPosterName}>{item.postedByName}</Text>
                      <Text style={s.lfPosterTime}>
                        {formatAgo(item.createdAt)}
                      </Text>
                    </View>
                    {item.isMyPost && (
                      <View style={s.myPostBadge}>
                        <Text style={s.myPostBadgeText}>MY POST</Text>
                      </View>
                    )}
                    {!isHandedOver && (
                      <View style={s.foundBadge}>
                        <Text style={s.foundBadgeText}>FOUND</Text>
                      </View>
                    )}
                  </View>
                  {item.photoUrl ? (
                    <TouchableOpacity
                      onPress={() => onImageViewer(item.photoUrl!)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: item.photoUrl }}
                        style={s.lfImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={s.lfImageEmpty}>
                      <Ionicons name="cube-outline" size={40} color="#94a3b8" />
                    </View>
                  )}
                  <View style={s.lfBody}>
                    <Text style={s.lfTitle}>{item.itemName}</Text>
                    {item.description ? (
                      <Text style={s.lfDesc}>{item.description}</Text>
                    ) : null}
                    <View style={s.lfMetaRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#374151"
                      />
                      <Text style={s.lfLocText}>
                        Room {item.roomNumber}
                        {item.roomLabel ? `, ${item.roomLabel}` : ""}
                      </Text>
                    </View>
                    {item.collectLocation ? (
                      <View style={s.lfMetaRow}>
                        <Ionicons
                          name="pin-outline"
                          size={13}
                          color="#16a34a"
                        />
                        <Text style={s.lfCollectText}>
                          Collect from: {item.collectLocation}
                        </Text>
                      </View>
                    ) : null}
                    {isHandedOver ? (
                      <View style={s.handedBox}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#16a34a"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={s.handedText}>
                          Handed to {item.handedToName}
                        </Text>
                      </View>
                    ) : item.isMyPost ? (
                      <TouchableOpacity
                        style={s.handoverBtn}
                        onPress={() => {
                          setHandoverItem(item);
                          setHandedToName("");
                          setHandoverError("");
                        }}
                      >
                        <Text style={s.handoverBtnText}>
                          Mark as Handed Over
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          ))}

        {lfActiveTab === "claims" &&
          (claimItems.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={40}
                  color="#16a34a"
                />
              </View>
              <Text style={s.emptyStateTitle}>No claims yet</Text>
              <Text style={s.emptyStateSub}>
                Handover records will appear here so everyone knows who
                collected what.
              </Text>
            </View>
          ) : (
            claimItems.map((item) => (
              <View
                key={item.id}
                style={[
                  s.lfCard,
                  {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: 14,
                  },
                ]}
              >
                <View
                  style={[
                    s.lfAvatar,
                    {
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      marginTop: 2,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#16a34a"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.lfTitle}>{item.itemName}</Text>
                  <Text style={s.lfDesc}>
                    <Text style={{ color: "#94a3b8" }}>Handed by </Text>
                    <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                      {item.handedByName}
                    </Text>
                    {item.handedByRole ? (
                      <Text style={{ color: "#64748b" }}>
                        {" "}
                        ({item.handedByRole})
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={s.lfDesc}>
                    <Text style={{ color: "#94a3b8" }}>Collected by </Text>
                    <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                      {item.handedToName}
                    </Text>
                  </Text>
                  {item.roomNumber ? (
                    <View style={s.lfMetaRow}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#64748b"
                      />
                      <Text style={s.lfLocText}>
                        Room {item.roomNumber}
                        {item.roomLabel ? `, ${item.roomLabel}` : ""}
                      </Text>
                    </View>
                  ) : null}
                  {item.collectLocation ? (
                    <View style={s.lfMetaRow}>
                      <Ionicons name="pin-outline" size={12} color="#16a34a" />
                      <Text style={s.lfCollectText}>
                        Handed at: {item.collectLocation}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    {formatDate(item.handedAt)}
                  </Text>
                </View>
                {item.photoUrl ? (
                  <TouchableOpacity
                    onPress={() => onImageViewer(item.photoUrl!)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        marginTop: 2,
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ))}
      </ScrollView>

      {/* Handover Modal */}
      <Modal
        visible={!!handoverItem}
        animationType="slide"
        transparent
        onRequestClose={() => setHandoverItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalOverlay}
        >
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalIssueTitle}>Mark as Handed Over</Text>
            <TextInput
              style={s.handoverInput}
              placeholder="e.g. Shaho"
              placeholderTextColor="#9ca3af"
              value={handedToName}
              onChangeText={(t) => {
                setHandedToName(t);
                setHandoverError("");
              }}
              autoCapitalize="words"
            />
            {handoverError ? (
              <Text style={s.handoverError}>{handoverError}</Text>
            ) : null}
            <View style={s.handoverBtnRow}>
              <TouchableOpacity
                style={s.handoverCancelBtn}
                onPress={() => setHandoverItem(null)}
              >
                <Text style={s.handoverCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.handoverConfirmBtn,
                  handoverLoading && { opacity: 0.55 },
                ]}
                onPress={handleHandover}
                disabled={handoverLoading}
              >
                {handoverLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.handoverConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Post Sheet Modal */}
      <Modal
        visible={showPostSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPostSheet(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.5)" }}
          activeOpacity={1}
          onPress={() => setShowPostSheet(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#e2e8f0",
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                What would you like to post?
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Choose an option below
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: 14,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: "#bbf7d0",
                }}
                onPress={() => {
                  setShowPostSheet(false);
                  setShowPostFoundModal(true);
                }}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#16a34a",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="cube-outline" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#0f172a",
                    }}
                  >
                    Post Found Item
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}
                  >
                    I found something on campus
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff7ed",
                  borderRadius: 14,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  borderWidth: 1.5,
                  borderColor: "#fed7aa",
                }}
                onPress={() => {
                  setShowPostSheet(false);
                  setShowPostLostModal(true);
                }}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#f97316",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="search-outline" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#0f172a",
                    }}
                  >
                    Post Lost Report
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}
                  >
                    I lost something on campus
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Post Found Modal */}
      <Modal
        visible={showPostFoundModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPostFoundModal(false);
          resetPostFoundForm();
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: insets.top + 14,
                paddingHorizontal: 20,
                paddingBottom: 14,
                backgroundColor: "#ffffff",
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowPostFoundModal(false);
                  resetPostFoundForm();
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-back" size={18} color="#0f172a" />
              </TouchableOpacity>
              <Text
                style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}
              >
                Post Found Item
              </Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView
              contentContainerStyle={{
                padding: 16,
                gap: 14,
                paddingBottom: 48,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  overflow: "hidden",
                  minHeight: 200,
                  borderWidth: 1.5,
                  borderColor: "#e2e8f0",
                  borderStyle: "dashed",
                }}
                onPress={handlePostFoundPickPhoto}
                activeOpacity={0.85}
              >
                {postFoundPhoto ? (
                  <Image
                    source={{ uri: postFoundPhoto.uri }}
                    style={{ width: "100%", height: 220 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ padding: 32, alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        backgroundColor: "#f0fdf4",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={28}
                        color="#16a34a"
                      />
                      <View
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          backgroundColor: "#16a34a",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="add" size={13} color="#fff" />
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#0f172a",
                      }}
                    >
                      Upload Image
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        textAlign: "center",
                      }}
                    >
                      Add photos of the item to help identify it
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#16a34a",
                        borderRadius: 10,
                        paddingVertical: 9,
                        paddingHorizontal: 22,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        Select File
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontWeight: "600",
                        letterSpacing: 0.3,
                        marginTop: 4,
                      }}
                    >
                      JPG, PNG up to 5MB
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  Item Information
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Item Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: "#0f172a",
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                  }}
                  placeholder="e.g. Black Leather Wallet"
                  placeholderTextColor="#9ca3af"
                  value={postFoundItemName}
                  onChangeText={setPostFoundItemName}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 4 }}
                >
                  {LF_CATEGORIES_FOUND.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        {
                          backgroundColor: "#f8fafc",
                          borderRadius: 20,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          marginRight: 8,
                          borderWidth: 1.5,
                          borderColor: "#e2e8f0",
                          marginBottom: 4,
                        },
                        postFoundCategory === c && {
                          backgroundColor: "#f0fdf4",
                          borderColor: "#16a34a",
                        },
                      ]}
                      onPress={() => setPostFoundCategory(c)}
                    >
                      <Text
                        style={[
                          {
                            fontSize: 13,
                            color: "#374151",
                            fontWeight: "500",
                          },
                          postFoundCategory === c && {
                            color: "#16a34a",
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: "#0f172a",
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                    height: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Describe color, brand, unique marks..."
                  placeholderTextColor="#9ca3af"
                  value={postFoundDescription}
                  onChangeText={setPostFoundDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  Location Details
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Where Found (Room Number)
                </Text>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      borderWidth: 1.5,
                      borderColor: "#e2e8f0",
                    },
                    postFoundResolvedRoom
                      ? { borderColor: "#16a34a", backgroundColor: "#f0fdf4" }
                      : postFoundRoomError
                        ? {
                            borderColor: "#ef4444",
                            backgroundColor: "#fef2f2",
                          }
                        : null,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={postFoundResolvedRoom ? "#16a34a" : "#94a3b8"}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: "#0f172a" }}
                    placeholder="e.g. 319, 214, 003A"
                    placeholderTextColor="#9ca3af"
                    value={postFoundRoomInput}
                    onChangeText={handlePostFoundRoomInput}
                    autoCapitalize="characters"
                    maxLength={5}
                  />
                </View>
                {postFoundResolvedRoom && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#f0fdf4",
                      borderRadius: 10,
                      padding: 11,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#bbf7d0",
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#16a34a"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#16a34a",
                        fontWeight: "600",
                      }}
                    >
                      Room {postFoundRoomInput} , {postFoundResolvedRoom.label}
                    </Text>
                  </View>
                )}
                {postFoundRoomError ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#fef2f2",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#fecaca",
                    }}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={13}
                      color="#dc2626"
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#dc2626",
                        fontWeight: "500",
                      }}
                    >
                      {postFoundRoomError}
                    </Text>
                  </View>
                ) : null}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Where to Collect
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: "#0f172a",
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                    height: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="e.g., Room 214 after 2PM, or Staff Room 501"
                  placeholderTextColor="#9ca3af"
                  value={postFoundCollectLocation}
                  onChangeText={setPostFoundCollectLocation}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              {postFoundError ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fef2f2",
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#fecaca",
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color="#dc2626"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: "#dc2626",
                      fontSize: 13,
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {postFoundError}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[
                  {
                    backgroundColor: "#16a34a",
                    borderRadius: 12,
                    paddingVertical: 15,
                    alignItems: "center",
                  },
                  postFoundSubmitting && { opacity: 0.55 },
                ]}
                onPress={handlePostFoundSubmit}
                disabled={postFoundSubmitting}
                activeOpacity={0.85}
              >
                {postFoundSubmitting ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {postFoundUploadingPhoto
                        ? "Uploading photo..."
                        : "Publishing..."}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
                  >
                    Submit Found Item
                  </Text>
                )}
              </TouchableOpacity>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#94a3b8",
                  lineHeight: 18,
                  paddingHorizontal: 10,
                }}
              >
                By submitting, you agree to our Terms regarding false claims.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Post Lost Modal */}
      <Modal
        visible={showPostLostModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPostLostModal(false);
          resetPostLostForm();
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: insets.top + 14,
                paddingHorizontal: 20,
                paddingBottom: 14,
                backgroundColor: "#ffffff",
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowPostLostModal(false);
                  resetPostLostForm();
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-back" size={18} color="#0f172a" />
              </TouchableOpacity>
              <Text
                style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}
              >
                Post Lost Report
              </Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView
              contentContainerStyle={{
                padding: 16,
                gap: 14,
                paddingBottom: 48,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  overflow: "hidden",
                  minHeight: 200,
                  borderWidth: 1.5,
                  borderColor: "#e2e8f0",
                  borderStyle: "dashed",
                }}
                onPress={handlePostLostPickPhoto}
                activeOpacity={0.85}
              >
                {postLostPhoto ? (
                  <Image
                    source={{ uri: postLostPhoto.uri }}
                    style={{ width: "100%", height: 220 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ padding: 32, alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        backgroundColor: "#f0fdf4",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={28}
                        color="#16a34a"
                      />
                      <View
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          backgroundColor: "#16a34a",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="add" size={13} color="#fff" />
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#0f172a",
                      }}
                    >
                      Upload Image (Optional)
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        textAlign: "center",
                      }}
                    >
                      Add a photo to help identify your item
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#16a34a",
                        borderRadius: 10,
                        paddingVertical: 9,
                        paddingHorizontal: 22,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        Select File
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontWeight: "600",
                        letterSpacing: 0.3,
                        marginTop: 4,
                      }}
                    >
                      JPG, PNG up to 5MB
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  Item Information
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Item Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: "#0f172a",
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                  }}
                  placeholder="e.g. Black iPhone 14"
                  placeholderTextColor="#9ca3af"
                  value={postLostItemName}
                  onChangeText={setPostLostItemName}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 4 }}
                >
                  {LF_CATEGORIES_LOST.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        {
                          backgroundColor: "#f8fafc",
                          borderRadius: 20,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          marginRight: 8,
                          borderWidth: 1.5,
                          borderColor: "#e2e8f0",
                          marginBottom: 4,
                        },
                        postLostCategory === c && {
                          backgroundColor: "#f0fdf4",
                          borderColor: "#16a34a",
                        },
                      ]}
                      onPress={() => setPostLostCategory(c)}
                    >
                      <Text
                        style={[
                          {
                            fontSize: 13,
                            color: "#374151",
                            fontWeight: "500",
                          },
                          postLostCategory === c && {
                            color: "#16a34a",
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: "#0f172a",
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                    height: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Color, brand, model, any unique marks..."
                  placeholderTextColor="#9ca3af"
                  value={postLostDescription}
                  onChangeText={setPostLostDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  Where & When
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Where Lost (Room Number)
                </Text>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      borderWidth: 1.5,
                      borderColor: "#e2e8f0",
                    },
                    postLostResolvedRoom
                      ? { borderColor: "#16a34a", backgroundColor: "#f0fdf4" }
                      : postLostRoomError
                        ? {
                            borderColor: "#dc2626",
                            backgroundColor: "#fef2f2",
                          }
                        : null,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={postLostResolvedRoom ? "#16a34a" : "#94a3b8"}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: "#0f172a" }}
                    placeholder="e.g. 319, 214, 003A"
                    placeholderTextColor="#9ca3af"
                    value={postLostRoomInput}
                    onChangeText={handlePostLostRoomInput}
                    autoCapitalize="characters"
                    maxLength={5}
                  />
                </View>
                {postLostResolvedRoom && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#f0fdf4",
                      borderRadius: 10,
                      padding: 11,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#bbf7d0",
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#16a34a"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#16a34a",
                        fontWeight: "600",
                      }}
                    >
                      Room {postLostRoomInput} , {postLostResolvedRoom.label}
                    </Text>
                  </View>
                )}
                {postLostRoomError ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#fef2f2",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#fecaca",
                    }}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={13}
                      color="#dc2626"
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#dc2626",
                        fontWeight: "500",
                      }}
                    >
                      {postLostRoomError}
                    </Text>
                  </View>
                ) : null}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Date Lost
                </Text>
                <TextInput
                  style={[
                    {
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      fontSize: 15,
                      color: "#0f172a",
                      borderWidth: 1.5,
                      borderColor: "#e2e8f0",
                    },
                    postLostDateError ? { borderColor: "#dc2626" } : null,
                  ]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9ca3af"
                  value={postLostDateLost}
                  onChangeText={handlePostLostDateInput}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {postLostDateError ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#fef2f2",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#fecaca",
                    }}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={13}
                      color="#dc2626"
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#dc2626",
                        fontWeight: "500",
                      }}
                    >
                      {postLostDateError}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  How to Reach You
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                    marginTop: 14,
                  }}
                >
                  Contact Info
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: "#0f172a",
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                    height: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="e.g. Call 9876543210, or find me in Classroom 319"
                  placeholderTextColor="#9ca3af"
                  value={postLostHowToReach}
                  onChangeText={setPostLostHowToReach}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              {postLostError ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fef2f2",
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#fecaca",
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color="#dc2626"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: "#dc2626",
                      fontSize: 13,
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {postLostError}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[
                  {
                    backgroundColor: "#16a34a",
                    borderRadius: 12,
                    paddingVertical: 15,
                    alignItems: "center",
                  },
                  postLostSubmitting && { opacity: 0.55 },
                ]}
                onPress={handlePostLostSubmit}
                disabled={postLostSubmitting}
                activeOpacity={0.85}
              >
                {postLostSubmitting ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {postLostUploadingPhoto
                        ? "Uploading photo..."
                        : "Publishing..."}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
                  >
                    Post Lost Report
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
   </View>
  );
});

const s = StyleSheet.create({
    fullTab: { flex: 1 },
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
    addBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: "#16a34a",
      alignItems: "center",
      justifyContent: "center",
    },
    segmentRow: {
      flexDirection: "row",
      backgroundColor: "#f8fafc",
      margin: 16,
      borderRadius: 10,
      padding: 3,
      borderWidth: 1.5,
      borderColor: "#e2e8f0",
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 8,
      alignItems: "center",
    },
    segmentBtnActive: {
      backgroundColor: "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    segmentBtnText: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
    segmentBtnTextActive: { color: "#0f172a", fontWeight: "700" },
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
    lfCard: {
      backgroundColor: "#ffffff",
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: "#f1f5f9",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    lfCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 10,
    },
    lfAvatar: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "#f0fdf4",
      borderWidth: 1.5,
      borderColor: "#bbf7d0",
      alignItems: "center",
      justifyContent: "center",
    },
    lfAvatarText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
    lfPosterName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
    lfPosterTime: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
    myPostBadge: {
      backgroundColor: "#f0fdf4",
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: "#bbf7d0",
      marginLeft: 6,
    },
    myPostBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#16a34a",
      letterSpacing: 0.3,
    },
    foundBadge: {
      backgroundColor: "#16a34a",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginLeft: 6,
    },
    foundBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.3,
    },
    lfImage: { width: "100%", height: 200 },
    lfImageEmpty: {
      width: "100%",
      height: 140,
      backgroundColor: "#f8fafc",
      alignItems: "center",
      justifyContent: "center",
    },
    lfBody: { padding: 14 },
    lfTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#0f172a",
      marginBottom: 6,
    },
    lfDesc: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 8 },
    lfMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 4,
    },
    lfLocText: { fontSize: 13, color: "#374151", fontWeight: "500" },
    lfCollectText: { fontSize: 13, color: "#16a34a", fontWeight: "500" },
    handoverBtn: {
      backgroundColor: "#16a34a",
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 10,
    },
    handoverBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    handedBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f0fdf4",
      borderRadius: 10,
      padding: 12,
      marginTop: 10,
      borderWidth: 1,
      borderColor: "#bbf7d0",
    },
    handedText: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(15,23,42,0.5)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: "#fff",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#e2e8f0",
      alignSelf: "center",
      marginBottom: 20,
    },
    modalIssueTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#0f172a",
      marginBottom: 16,
      textAlign: "center",
    },
    handoverInput: {
      backgroundColor: "#f8fafc",
      borderRadius: 10,
      padding: 14,
      fontSize: 15,
      color: "#0f172a",
      borderWidth: 1.5,
      borderColor: "#e2e8f0",
      marginBottom: 8,
    },
    handoverError: {
      fontSize: 13,
      color: "#dc2626",
      marginBottom: 8,
      fontWeight: "500",
    },
    handoverBtnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
    handoverCancelBtn: {
      flex: 1,
      backgroundColor: "#f8fafc",
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: "#e2e8f0",
    },
    handoverCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
    handoverConfirmBtn: {
      flex: 1,
      backgroundColor: "#16a34a",
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
    },
    handoverConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  });