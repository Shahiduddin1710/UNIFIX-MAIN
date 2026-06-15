import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../firebase/firebaseConfig";
import { authAPI } from "../../services/api";


const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

async function uploadToCloudinary(uri: string, folder: string): Promise<string> {
  const formData = new FormData();
  const name = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
  formData.append("file", { uri, type: "image/jpeg", name } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", folder);
  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const SECURITY_ISSUE_TYPES = [
  "Unauthorized Access",
  "Account Compromise",
  "Data Privacy Concern",
  "Suspicious Activity",
  "Password Issue",
  "Other",
];

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

type ProfileScreen =
  | "main"
  | "personalInfo"
  | "changePassword"
  | "reportSecurity"
  | "settings"
  | "legal";
export default function StaffProfileScreen() {
  const insets = useSafeAreaInsets();

  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [profileScreen, setProfileScreen] = useState<ProfileScreen>("main");
  const [screenHistory, setScreenHistory] = useState<ProfileScreen[]>([]);

  const navigateTo = (screen: ProfileScreen) => {
    setScreenHistory((prev) => [...prev, profileScreen]);
    setProfileScreen(screen);
  };

  const goBack = () => {
    setScreenHistory((prev) => {
      const newHistory = [...prev];
      const lastScreen = newHistory.pop();
      setProfileScreen(lastScreen || "main");
      return newHistory;
    });
  };
  const [photoUploading, setPhotoUploading] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [securityIssueType, setSecurityIssueType] = useState("");
  const [securityDescription, setSecurityDescription] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<any>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, type });
      toastAnim.setValue(0);
      Animated.spring(toastAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 3000);
    },
    [toastAnim],
  );

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    getDoc(doc(db, "users", u.uid)).then((snap) => {
      if (snap.exists()) setStaffData(snap.data() as StaffData);
    });
  }, []);

  const handlePickPhoto = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setPhotoUploading(true);
      const url = await uploadToCloudinary(result.assets[0].uri, "unifix/profiles");
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), { photoUrl: url });
        setStaffData((prev) => (prev ? { ...prev, photoUrl: url } : prev));
      }
    } catch {
    } finally {
      setPhotoUploading(false);
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setProfileError("");
    setProfileSuccess("");
    if (!editName.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    if (editPhone && !/^[6-9]\d{9}$/.test(editPhone.trim())) {
      setProfileError("Enter a valid 10-digit phone number.");
      return;
    }
    setProfileSaving(true);
    try {
      await authAPI.updateProfile(editName.trim(), editPhone.trim());
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), {
          fullName: editName.trim(),
          phone: editPhone.trim(),
        });
        setStaffData((prev) =>
          prev ? { ...prev, fullName: editName.trim(), phone: editPhone.trim() } : prev,
        );
      }
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed.");
    } finally {
      setProfileSaving(false);
    }
  }, [editName, editPhone]);

  const handleChangePassword = useCallback(async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwError("Must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPwError("Must contain at least one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPwSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed.");
    } finally {
      setPwLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleLogoutAllDevices = useCallback(() => {
    Alert.alert("Logout All Devices", "This will end all active sessions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
       onPress: async () => {
              try {
                await authAPI.logoutAllDevices();
                await auth.signOut();
                await AsyncStorage.removeItem("unifix_cached_user");
                router.replace("/login" as any);
              } catch {}
        },
      },
    ]);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Your deletion request will be sent to admin for approval.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await authAPI.deleteAccount();
              if (data.requiresApproval)
                Alert.alert(
                  "Request Submitted",
                  "Your account deletion request has been submitted and is currently under review.",
                );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to submit request.");
            }
          },
        },
      ],
    );
  }, []);

  const handleSubmitSecurityIssue = useCallback(async () => {
    setSecurityError("");
    setSecuritySuccess("");
    if (!securityIssueType) {
      setSecurityError("Please select an issue type.");
      return;
    }
    if (!securityDescription.trim()) {
      setSecurityError("Please describe the issue.");
      return;
    }
    setSecurityLoading(true);
    try {
      await authAPI.reportSecurityIssue(securityIssueType, securityDescription.trim());
      setSecuritySuccess("Security issue reported successfully.");
      setSecurityIssueType("");
      setSecurityDescription("");
    } catch (err: any) {
      setSecurityError(err.message || "Failed.");
    } finally {
      setSecurityLoading(false);
    }
  }, [securityIssueType, securityDescription]);

  const renderProfileMain = () => (
    <ScrollView
      style={s.tabScroll}
   contentContainerStyle={[
        s.tabContainer,
        { paddingBottom: insets.bottom + 80 },
      ]}
    >
      <View style={s.subHeader}>
        <Text style={s.subHeaderTitle}>My Profile</Text>
      </View>
      <View style={s.profileCard}>
        <TouchableOpacity
          onPress={handlePickPhoto}
          activeOpacity={0.85}
          style={s.profileAvatarBtn}
        >
          {staffData?.photoUrl ? (
            <Image source={{ uri: staffData.photoUrl }} style={s.profileAvatarImg} />
          ) : (
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>
                {staffData?.fullName?.[0]?.toUpperCase() || "S"}
              </Text>
            </View>
          )}
          <View style={s.profileCameraBtn}>
            {photoUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={13} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={s.profileName}>{staffData?.fullName || "Staff Member"}</Text>
        <View style={s.profileRoleBadge}>
          <Text style={s.profileRoleBadgeText}>MAINTENANCE STAFF</Text>
        </View>
        <Text style={s.profileHint}>
          {photoUploading ? "Uploading..." : "Tap photo to change"}
        </Text>
        <View style={s.idBadge}>
          <Text style={s.idBadgeText}>Staff ID: {staffData?.employeeId || "—"}</Text>
        </View>
        <View style={s.profilePerfBox}>
          <Text style={s.profilePerfLabel}>MONTHLY PERFORMANCE</Text>
          <Text style={s.profilePerfScore}>{completedCount} / 150</Text>
          <Text style={s.profilePerfSub}>Completed Tasks</Text>
          <Text style={s.profilePerfDesc}>
            Total: {completedCount} tasks completed this month
          </Text>
          <View style={s.progressBarWrap}>
            <View
              style={[
                s.progressBarFill,
                { width: `${Math.min(completedCount * 2, 100)}%` as any },
              ]}
            />
          </View>
        </View>
      </View>
     <View style={s.settingsList}>
        {[
          {
            icon: "person-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#f8fafc",
            label: "Personal Information",
            color: "#0f172a",
            onPress: () => {
              setEditName(staffData?.fullName || "");
              setEditPhone(staffData?.phone || "");
              setProfileError("");
              setProfileSuccess("");
              setProfileScreen("personalInfo");
            },
          },
      {
            icon: "settings-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#f8fafc",
            label: "Settings",
            color: "#0f172a",
            onPress: () => navigateTo("settings"),
          },
          {
            icon: "information-circle-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#f0f9ff",
            label: "Legal",
            color: "#0f172a",
            onPress: () => navigateTo("legal"),
          },
       {
            icon: "log-out-outline" as keyof typeof Ionicons.glyphMap,
            bg: "#fef2f2",
            label: "Log Out",
            color: "#dc2626",
            onPress: () => {
              Alert.alert(
                "Log Out",
                "Are you sure you want to log out?",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes",
                    style: "destructive",
            onPress: async () => {
                      await auth.signOut();
                      await AsyncStorage.removeItem("unifix_cached_user");
                      router.replace("/login" as any);
                    },
                  },
                ]
              );
            },
          },
        ].map((item, index, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[s.settingRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}
            onPress={item.onPress}
          >
            <View style={[s.settingIcon, { backgroundColor: item.bg }]}>
              <Ionicons
                name={item.icon}
                size={18}
                color={item.color === "#dc2626" ? "#dc2626" : "#374151"}
              />
            </View>
            <Text style={[s.settingLabel, { color: item.color }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderPersonalInfo = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
         <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.subPageTitle}>Personal Information</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>BASIC INFO</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Full Name</Text>
            <TextInput
              style={s.formInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Phone Number</Text>
            <TextInput
              style={s.formInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="10-digit phone"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Email</Text>
            <View style={s.formInputReadOnly}>
              <Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">
                {staffData?.email || "—"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Gender</Text>
            <View style={s.formInputReadOnly}>
              <Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">
                {staffData?.gender || "Not set"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Role</Text>
            <View style={s.formInputReadOnly}>
              <Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">
                Maintenance Staff
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Designation</Text>
            <View style={s.formInputReadOnly}>
              <Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">
                {staffData?.designation || "—"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Staff ID</Text>
            <View style={s.formInputReadOnly}>
              <Text style={s.formInputReadOnlyText} numberOfLines={1} ellipsizeMode="tail">
                {staffData?.employeeId || "—"}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
          {profileError ? <Text style={s.formError}>{profileError}</Text> : null}
          {profileSuccess ? <Text style={s.formSuccess}>{profileSuccess}</Text> : null}
          <TouchableOpacity
            style={[s.saveBtn, profileSaving && { opacity: 0.6 }]}
            onPress={handleSaveProfile}
            disabled={profileSaving}
          >
            {profileSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
        {staffData?.nationalIdCardUrl && (
          <View style={s.formCard}>
            <Text style={s.formSectionLabel}>ID CARD</Text>
            <Image
              source={{ uri: staffData.nationalIdCardUrl }}
              style={s.idCardPreview}
              resizeMode="contain"
            />
            <View style={s.privacyNote}>
              <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
              <Text style={s.privacyNoteText}>
                Your ID card is only visible to you and Admin.
              </Text>
            </View>
          </View>
        )}
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ACCOUNT PRIVACY</Text>
          <View style={s.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#64748b" />
            <Text style={s.privacyNoteText}>
              Your personal data is securely stored and accessible only to Admin.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderChangePassword = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.subPageTitle}>Change Password</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>UPDATE PASSWORD</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Current Password</Text>
            <View style={s.pwInputWrap}>
              <TextInput
                style={s.pwInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrentPw}
              />
              <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)}>
                <Ionicons
                  name={showCurrentPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>New Password</Text>
            <View style={s.pwInputWrap}>
              <TextInput
                style={s.pwInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPw}
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Ionicons
                  name={showNewPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Confirm New Password</Text>
            <View style={s.pwInputWrap}>
              <TextInput
                style={s.pwInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPw}
              />
              <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                <Ionicons
                  name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.pwRules}>
            {[
              { rule: "At least 8 characters", ok: newPassword.length >= 8 },
              { rule: "One uppercase letter", ok: /[A-Z]/.test(newPassword) },
              { rule: "One number", ok: /[0-9]/.test(newPassword) },
              {
                rule: "Passwords match",
                ok: newPassword === confirmPassword && confirmPassword.length > 0,
              },
            ].map((r) => (
              <View key={r.rule} style={s.pwRuleRow}>
                <Ionicons
                  name={r.ok ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={r.ok ? "#16a34a" : "#94a3b8"}
                />
                <Text style={[s.pwRuleText, { color: r.ok ? "#16a34a" : "#94a3b8" }]}>
                  {r.rule}
                </Text>
              </View>
            ))}
          </View>
          {pwError ? <Text style={s.formError}>{pwError}</Text> : null}
          {pwSuccess ? <Text style={s.formSuccess}>{pwSuccess}</Text> : null}
          <TouchableOpacity
            style={[
              s.saveBtn,
              (pwLoading || !currentPassword || !newPassword || !confirmPassword) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleChangePassword}
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
          >
            {pwLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderReportSecurity = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.tabScroll}
        contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
          <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.subPageTitle}>Report Security Issue</Text>
        </View>
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ISSUE DETAILS</Text>
          <View style={s.formField}>
            <Text style={s.formLabel}>Issue Type</Text>
            <View style={s.issueTypeGrid}>
              {SECURITY_ISSUE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    s.issueTypeChip,
                    securityIssueType === type && s.issueTypeChipActive,
                  ]}
                  onPress={() => setSecurityIssueType(type)}
                >
                  <Text
                    style={[
                      s.issueTypeChipText,
                      securityIssueType === type && s.issueTypeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.formField}>
            <Text style={s.formLabel}>Description</Text>
            <TextInput
              style={[
                s.formInput,
                { minHeight: 120, textAlignVertical: "top", paddingTop: 12 },
              ]}
              value={securityDescription}
              onChangeText={setSecurityDescription}
              placeholder="Describe the security issue..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
            />
          </View>
          {securityError ? <Text style={s.formError}>{securityError}</Text> : null}
          {securitySuccess ? <Text style={s.formSuccess}>{securitySuccess}</Text> : null}
          <TouchableOpacity
            style={[
              s.saveBtn,
              (securityLoading || !securityIssueType || !securityDescription.trim()) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleSubmitSecurityIssue}
            disabled={
              securityLoading || !securityIssueType || !securityDescription.trim()
            }
          >
            {securityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

const renderSettings = () => (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subPageHeader}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.subPageTitle}>Settings</Text>
      </View>

      <View style={s.sectionBlock}>
        <Text style={s.sectionBlockTitle}>ACCOUNT</Text>
        <TouchableOpacity
          style={s.securityRow}
          activeOpacity={0.85}
  onPress={() => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPwError("");
            setPwSuccess("");
            navigateTo("changePassword");
          }}
        >
          <View style={[s.settingIcon, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="lock-closed-outline" size={18} color="#16a34a" />
          </View>
          <Text style={s.securityRowLabel}>Change Password</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity
          style={s.securityRow}
          activeOpacity={0.85}
          onPress={handleLogoutAllDevices}
        >
          <View style={[s.settingIcon, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="phone-portrait-outline" size={18} color="#16a34a" />
          </View>
          <Text style={s.securityRowLabel}>Logout from All Devices</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity
          style={s.securityRow}
          activeOpacity={0.85}
    onPress={() => {
            setSecurityIssueType("");
            setSecurityDescription("");
            setSecurityError("");
            setSecuritySuccess("");
            navigateTo("reportSecurity");
          }}
        >
          <View style={[s.settingIcon, { backgroundColor: "#fff7ed" }]}>
            <Ionicons name="shield-outline" size={18} color="#d97706" />
          </View>
          <Text style={s.securityRowLabel}>Report Security Issue</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity
          style={s.securityRow}
          activeOpacity={0.85}
          onPress={handleDeleteAccount}
        >
          <View style={[s.settingIcon, { backgroundColor: "#fef2f2" }]}>
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </View>
          <Text style={[s.securityRowLabel, { color: "#dc2626" }]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

 const renderLegal = () => (
    <ScrollView
      style={s.tabScroll}
      contentContainerStyle={[s.tabContainer, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subPageHeader}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.subPageTitle}>Legal</Text>
      </View>
      {[
        { label: "Terms & Conditions", icon: "document-text-outline", url: "https://unifixapp.vercel.app/terms" },
        { label: "Privacy Policy", icon: "shield-checkmark-outline", url: "https://unifixapp.vercel.app/privacy" },
        { label: "Copyright", icon: "copyright-outline", url: "https://unifixapp.vercel.app/copyright" },
      ].map((item, index) => (
        <TouchableOpacity
          key={index}
          style={s.legalRow}
          activeOpacity={0.85}
          onPress={() => { if (item.url) Linking.openURL(item.url); }}
        >
          <View style={s.menuCardLeft}>
            <View style={[s.settingIcon, { backgroundColor: "#f0f9ff" }]}>
              <Ionicons name={item.icon as any} size={18} color="#0ea5e9" />
            </View>
            <Text style={s.settingLabel}>{item.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {profileScreen === "main" && renderProfileMain()}
      {profileScreen === "personalInfo" && renderPersonalInfo()}
      {profileScreen === "changePassword" && renderChangePassword()}
      {profileScreen === "reportSecurity" && renderReportSecurity()}
      {profileScreen === "settings" && renderSettings()}
      {profileScreen === "legal" && renderLegal()}

      {toast && (
        <Animated.View
          style={[
            s.toast,
            toast.type === "success" && s.toastSuccess,
            toast.type === "error" && s.toastError,
            toast.type === "info" && s.toastInfo,
            {
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 0],
                  }),
                },
              ],
              opacity: toastAnim,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={
              toast.type === "success"
                ? "checkmark-circle"
                : toast.type === "error"
                  ? "close-circle"
                  : "information-circle"
            }
            size={18}
            color="#fff"
          />
          <Text style={s.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tabScroll: { flex: 1 },
  tabContainer: { paddingHorizontal: 16 },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  subHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  profileAvatarBtn: { position: "relative", marginBottom: 12 },
  profileAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  profileAvatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  profileAvatarText: { fontSize: 34, fontWeight: "800", color: "#16a34a" },
  profileCameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  profileRoleBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    marginBottom: 4,
  },
  profileRoleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  profileHint: { fontSize: 12, color: "#94a3b8", marginBottom: 10 },
  idBadge: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  idBadgeText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  profilePerfBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  profilePerfLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profilePerfScore: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  profilePerfSub: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  profilePerfDesc: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  progressBarWrap: { height: 5, backgroundColor: "#e2e8f0", borderRadius: 3 },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 3,
  },
  settingsList: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    gap: 14,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a", flex: 1 },
  subPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    paddingTop: 56,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  subPageTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  formSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  formField: { marginBottom: 16 },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },
  formInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  formInputReadOnly: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  formInputReadOnlyText: { fontSize: 14, color: "#64748b", flex: 1 },
  readOnlyTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    backgroundColor: "#f1f5f9",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  formError: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  formSuccess: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  idCardPreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
  },
  privacyNoteText: { flex: 1, fontSize: 13, color: "#64748b", lineHeight: 20 },
  pwInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingRight: 12,
  },
  pwInput: { flex: 1, padding: 13, fontSize: 14, color: "#0f172a" },
  pwRules: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  pwRuleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pwRuleText: { fontSize: 13, fontWeight: "500" },
  issueTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  issueTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  issueTypeChipActive: { backgroundColor: "#f0fdf4", borderColor: "#16a34a" },
  issueTypeChipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  issueTypeChipTextActive: { color: "#16a34a", fontWeight: "700" },
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  toastSuccess: { backgroundColor: "#0f172a" },
  toastError: { backgroundColor: "#dc2626" },
  toastInfo: { backgroundColor: "#1e40af" },
toastText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    lineHeight: 20,
  },
  sectionBlock: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  sectionBlockTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  securityRowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
securityDivider: {
    height: 1,
    backgroundColor: "#f8fafc",
    marginHorizontal: 8,
  },
  legalRow: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  menuCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});