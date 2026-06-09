import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../../firebase/firebaseConfig";
import { authAPI } from "../../../services/api";

const CLOUDINARY_CLOUD = "dcizaxjul";
const CLOUDINARY_PRESET = "unifix_upload";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

type UserData = {
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  year?: string;
  branch?: string;
  department?: string;
  employeeId?: string;
  designation?: string;
  experience?: string;
  photoUrl?: string;
  gender?: string;
  studentIdCardUrl?: string;
  teacherIdCardUrl?: string;
  rollNumber?: string;
  teacherId?: string;
};

type ProfileScreen =
  | "main"
  | "personalInfo"
  | "changePassword"
  | "reportSecurity"
  | "legal"
  | "settings";

type ProfileScreenHistory = ProfileScreen[];

interface ProfileSectionProps {
  userData: UserData | null;
  onLogout: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  hasPendingIdCard?: boolean;
  onIdCardUpdate?: () => void;
}

const SECURITY_ISSUE_TYPES = [
  "Unauthorized Access",
  "Account Compromise",
  "Data Privacy Concern",
  "Suspicious Activity",
  "Password Issue",
  "Other",
];

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

export default memo(function ProfileSection({
  userData,
  onLogout,
  hasPendingIdCard = false,
  onIdCardUpdate,
}: ProfileSectionProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
 const [profileScreen, setProfileScreen] = useState<ProfileScreen>("main");
  const [screenHistory, setScreenHistory] = useState<ProfileScreenHistory>([]);

  const navigateTo = useCallback((screen: ProfileScreen) => {
    setScreenHistory((prev) => [...prev, profileScreen]);
    setProfileScreen(screen);
  }, [profileScreen]);

  const goBack = useCallback(() => {
    setScreenHistory((prev) => {
      const newHistory = [...prev];
      const lastScreen = newHistory.pop();
      setProfileScreen(lastScreen || "main");
      return newHistory;
    });
  }, []);

  // Personal Info state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Security Issue state
  const [securityIssueType, setSecurityIssueType] = useState("");
  const [securityDescription, setSecurityDescription] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");

  // ID Card state
  const [idCardUploading, setIdCardUploading] = useState(false);
  const [idCardError, setIdCardError] = useState("");
  const [idCardSuccess, setIdCardSuccess] = useState("");

  const bottomNavHeight = 60 + insets.bottom;
  const firstName = useMemo(() => userData?.fullName?.split(" ")[0] ?? "User", [userData?.fullName]);
  const idCardUrl = useMemo(
    () => userData?.studentIdCardUrl || userData?.teacherIdCardUrl || null,
    [userData?.studentIdCardUrl, userData?.teacherIdCardUrl]
  );
  const uniqueId = useMemo(
    () => userData?.role === "student" ? userData?.rollNumber : userData?.teacherId,
    [userData?.role, userData?.rollNumber, userData?.teacherId]
  );

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
      const url = await uploadToCloudinary(
        result.assets[0].uri,
        "unifix/profiles",
      );
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db, "users", u.uid), { photoUrl: url });
        if (onIdCardUpdate) onIdCardUpdate();
      }
    } catch {
    } finally {
      setPhotoUploading(false);
    }
  }, [onIdCardUpdate]);

  const handleSaveProfile = useCallback(async () => {
    setProfileError("");
    setProfileSuccess("");
    if (!editName.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    if (editPhone && !/^[6-9]\d{9}$/.test(editPhone.trim())) {
      setProfileError("Enter a valid 10-digit Indian phone number.");
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
        if (onIdCardUpdate) onIdCardUpdate();
      }
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }, [editName, editPhone, onIdCardUpdate]);

  const handleChangePassword = useCallback(async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPwError("Password must contain at least one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
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
      setPwError(err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleLogoutAllDevices = useCallback(async () => {
    Alert.alert(
      "Logout All Devices",
      "This will end all active sessions on all devices.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              await authAPI.logoutAllDevices();
              await onLogout();
            } catch {}
          },
        },
      ],
    );
  }, [onLogout]);

  const handleDeleteAccount = useCallback(async () => {
    const isStaff = userData?.role === "staff";
    Alert.alert(
      "Delete Account",
      isStaff
        ? "Your deletion request will be sent to admin for approval."
        : "This will permanently delete your account. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isStaff ? "Submit Request" : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await authAPI.deleteAccount();
              if (data.requiresApproval) {
                Alert.alert(
                  "Request Submitted",
                  "Your account deletion request has been submitted and is currently under review.",
                );
              } else {
                await onLogout();
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to process request.");
            }
          },
        },
      ],
    );
  }, [userData?.role, onLogout]);
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
      await authAPI.reportSecurityIssue(
        securityIssueType,
        securityDescription.trim(),
      );
      setSecuritySuccess(
        "Security issue reported. Our team will review it shortly.",
      );
      setSecurityIssueType("");
      setSecurityDescription("");
    } catch (err: any) {
      setSecurityError(err.message || "Failed to report issue.");
    } finally {
      setSecurityLoading(false);
    }
  }, [securityIssueType, securityDescription]);

  const handleIdCardReUpload = useCallback(async () => {
    setIdCardError("");
    setIdCardSuccess("");
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled) return;
      setIdCardUploading(true);
      const folder =
        userData?.role === "student"
          ? "unifix/student_documents"
          : "unifix/teacher_documents";
      const url = await uploadToCloudinary(result.assets[0].uri, folder);
      const fileName =
        result.assets[0].uri.split("/").pop() || `idcard_${Date.now()}.jpg`;
      await authAPI.requestIdCardUpdate(url, fileName);
      setIdCardSuccess(
        "ID card update request submitted. Admin will review it shortly.",
      );
      if (onIdCardUpdate) onIdCardUpdate();
    } catch (err: any) {
      setIdCardError(err.message || "Upload failed. Please try again.");
    } finally {
      setIdCardUploading(false);
    }
  }, [userData?.role, onIdCardUpdate]);

  const renderStars = useCallback((count: number, size: number = 28) => (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= count ? "star" : "star-outline"}
          size={size}
          color={star <= count ? "#f59e0b" : "#e2e8f0"}
        />
      ))}
    </View>
  ), []);
  const renderProfileMain = () => (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.container,
        { paddingBottom: bottomNavHeight + 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.profileHero}>
        <TouchableOpacity
          onPress={handlePickPhoto}
          activeOpacity={0.85}
          style={s.profileAvatarBtn}
        >
          {userData?.photoUrl ? (
            <Image
              source={{ uri: userData.photoUrl }}
              style={s.profileAvatarImg}
            />
          ) : (
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>
                {userData?.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "U"}
              </Text>
            </View>
          )}  
          <View style={s.profileCameraBtn}>
            {photoUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={s.profileName}>{userData?.fullName ?? "—"}</Text>
        <View style={s.profileRoleBadge}>
          <Ionicons
            name={
              userData?.role === "student" ? "school-outline" : "person-outline"
            }
            size={13}
            color="#16a34a"
            style={{ marginRight: 5 }}
          />
          <Text style={s.profileRoleBadgeText}>
            {userData?.role === "student" ? "Student" : "Teacher"}
          </Text>
        </View>
        <Text style={s.profileHint}>
          {photoUploading ? "Uploading..." : "TAP PHOTO TO CHANGE"}
        </Text>
      </View>

      <TouchableOpacity
        style={s.menuCard}
        activeOpacity={0.85}
        onPress={() => {
          setEditName(userData?.fullName || "");
          setEditPhone(userData?.phone || "");
          setProfileError("");
          setProfileSuccess("");
          navigateTo("personalInfo");
        }}
      >
        <View style={s.menuCardLeft}>
          <View style={s.menuIconWrap}>
            <Ionicons name="person-outline" size={18} color="#16a34a" />
          </View>
          <Text style={s.menuLabel}>Personal Information</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {userData?.role === "student" && (
        <TouchableOpacity
          style={[s.menuCard, { borderColor: "#fecaca" }]}
          activeOpacity={0.85}
          onPress={() => router.push("/report-ragging" as any)}
        >
          <View style={s.menuCardLeft}>
            <View style={[s.menuIconWrap, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="warning-outline" size={18} color="#dc2626" />
            </View>
            <View>
              <Text style={[s.menuLabel, { color: "#dc2626" }]}>
                Report Ragging
              </Text>
              <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                Confidential · Goes directly to HOD
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#dc2626" />
        </TouchableOpacity>
      )}

    <TouchableOpacity
        style={s.menuCard}
        activeOpacity={0.85}
       onPress={() => navigateTo("settings")}
      >
        <View style={s.menuCardLeft}>
          <View style={[s.menuIconWrap, { backgroundColor: "#f8fafc" }]}>
            <Ionicons name="settings-outline" size={18} color="#64748b" />
          </View>
          <Text style={s.menuLabel}>Settings</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>
   <TouchableOpacity
        style={s.menuCard}
        activeOpacity={0.85}
       onPress={() => navigateTo("legal")}
      >
        <View style={s.menuCardLeft}>
          <View style={[s.menuIconWrap, { backgroundColor: "#f0f9ff" }]}>
            <Ionicons name="information-circle-outline" size={18} color="#0ea5e9" />
          </View>
          <Text style={s.menuLabel}>Legal</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

 <TouchableOpacity
        style={s.logoutBtn}
        onPress={() => {
          Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
              { text: "No", style: "cancel" },
              { text: "Yes", style: "destructive", onPress: onLogout },
            ]
          );
        }}
        activeOpacity={0.85}
      >
        <Ionicons
          name="log-out-outline"
          size={18}
          color="#dc2626"
          style={{ marginRight: 8 }}
        />
        <Text style={s.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
      <Text style={s.platformLabel}>UNIFIX PLATFORM</Text>
    </ScrollView>
  );

  const renderPersonalInfo = () => (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subPageHeader}>
       <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
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
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
          />
        </View>
        <View style={s.formField}>
          <Text style={s.formLabel}>Email</Text>
          <View style={s.formInputReadOnly}>
            <Text
              style={s.formInputReadOnlyText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userData?.email || "—"}
            </Text>
            <Text style={s.readOnlyTag}>Read only</Text>
          </View>
        </View>
        <View style={s.formField}>
          <Text style={s.formLabel}>Phone Number</Text>
          <TextInput
            style={s.formInput}
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        <View style={s.formField}>
          <Text style={s.formLabel}>Gender</Text>
          <View style={s.formInputReadOnly}>
            <Text
              style={s.formInputReadOnlyText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userData?.gender || "Not set"}
            </Text>
            <Text style={s.readOnlyTag}>Read only</Text>
          </View>
        </View>
        <View style={s.formField}>
          <Text style={s.formLabel}>Role</Text>
          <View style={s.formInputReadOnly}>
            <Text
              style={s.formInputReadOnlyText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userData?.role
                ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                : "—"}
            </Text>
            <Text style={s.readOnlyTag}>Read only</Text>
          </View>
        </View>
        {uniqueId && (
          <View style={s.formField}>
            <Text style={s.formLabel}>
              {userData?.role === "student" ? "Roll Number" : "Teacher ID"}
            </Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {uniqueId}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
        )}
        {userData?.role === "student" && userData.branch && (
          <View style={s.formField}>
            <Text style={s.formLabel}>Branch</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userData.branch}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
        )}
        {userData?.role === "student" && userData.year && (
          <View style={s.formField}>
            <Text style={s.formLabel}>Year</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userData.year}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
        )}
        {userData?.role === "teacher" && userData.department && (
          <View style={s.formField}>
            <Text style={s.formLabel}>Department</Text>
            <View style={s.formInputReadOnly}>
              <Text
                style={s.formInputReadOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userData.department}
              </Text>
              <Text style={s.readOnlyTag}>Read only</Text>
            </View>
          </View>
        )}
        {profileError ? <Text style={s.formError}>{profileError}</Text> : null}
        {profileSuccess ? (
          <Text style={s.formSuccess}>{profileSuccess}</Text>
        ) : null}
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
      {(userData?.role === "student" || userData?.role === "teacher") && (
        <View style={s.formCard}>
          <Text style={s.formSectionLabel}>ID CARD MANAGEMENT</Text>
          {idCardUrl ? (
            <Image
              source={{ uri: idCardUrl }}
              style={s.idCardPreview}
              resizeMode="contain"
            />
          ) : (
            <View style={s.idCardEmpty}>
              <Ionicons
                name="id-card-outline"
                size={36}
                color="#94a3b8"
                style={{ marginBottom: 8 }}
              />
              <Text style={s.idCardEmptyText}>No ID card uploaded</Text>
            </View>
          )}
          <View style={s.privacyNote}>
            <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
            <Text style={s.privacyNoteText}>
              Your ID card is only visible to you and the Admin.
            </Text>
          </View>
          {hasPendingIdCard ? (
            <View style={s.pendingBadge}>
              <Ionicons
                name="time-outline"
                size={14}
                color="#d97706"
                style={{ marginRight: 6 }}
              />
              <Text style={s.pendingBadgeText}>
                ID card update request is pending admin review
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.idCardUploadBtn, idCardUploading && { opacity: 0.6 }]}
              onPress={handleIdCardReUpload}
              disabled={idCardUploading}
            >
              {idCardUploading ? (
                <ActivityIndicator color="#16a34a" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={16}
                    color="#16a34a"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={s.idCardUploadBtnText}>
                    Request ID Card Update
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {idCardError ? <Text style={s.formError}>{idCardError}</Text> : null}
          {idCardSuccess ? (
            <Text style={s.formSuccess}>{idCardSuccess}</Text>
          ) : null}
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
  );

  const renderChangePassword = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.container, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
          <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
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
                placeholder="Enter current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrentPw}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPw(!showCurrentPw)}
              >
                <Ionicons
                  name={showCurrentPw ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#64748b"
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
                placeholder="Enter new password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPw}
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Ionicons
                  name={showNewPw ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#64748b"
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
                placeholder="Confirm new password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPw}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPw(!showConfirmPw)}
              >
                <Ionicons
                  name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.pwRules}>
            {[
              { rule: "At least 8 characters", ok: newPassword.length >= 8 },
              {
                rule: "At least one uppercase letter",
                ok: /[A-Z]/.test(newPassword),
              },
              { rule: "At least one number", ok: /[0-9]/.test(newPassword) },
              {
                rule: "Passwords match",
                ok:
                  newPassword === confirmPassword && confirmPassword.length > 0,
              },
            ].map((r) => (
              <View key={r.rule} style={s.pwRuleRow}>
                <Ionicons
                  name={r.ok ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={r.ok ? "#16a34a" : "#94a3b8"}
                />
                <Text
                  style={[
                    s.pwRuleText,
                    { color: r.ok ? "#16a34a" : "#94a3b8" },
                  ]}
                >
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
              (pwLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword) && { opacity: 0.6 },
            ]}
            onPress={handleChangePassword}
            disabled={
              pwLoading || !currentPassword || !newPassword || !confirmPassword
            }
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
        style={s.scroll}
        contentContainerStyle={[s.container, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.subPageHeader}>
         <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
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
              placeholder="Describe the security issue in detail..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
            />
          </View>
          {securityError ? (
            <Text style={s.formError}>{securityError}</Text>
          ) : null}
          {securitySuccess ? (
            <Text style={s.formSuccess}>{securitySuccess}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              s.saveBtn,
              (securityLoading ||
                !securityIssueType ||
                !securityDescription.trim()) && { opacity: 0.6 },
            ]}
            onPress={handleSubmitSecurityIssue}
            disabled={
              securityLoading ||
              !securityIssueType ||
              !securityDescription.trim()
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
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subPageHeader}>
       <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
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
          <View style={[s.menuIconWrap, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="lock-closed-outline" size={18} color="#16a34a" />
          </View>
          <Text style={s.securityRowLabel}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity
          style={s.securityRow}
          activeOpacity={0.85}
          onPress={handleLogoutAllDevices}
        >
          <View style={[s.menuIconWrap, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="phone-portrait-outline" size={18} color="#16a34a" />
          </View>
          <Text style={s.securityRowLabel}>Logout from All Devices</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
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
          <View style={[s.menuIconWrap, { backgroundColor: "#fff7ed" }]}>
            <Ionicons name="shield-outline" size={18} color="#d97706" />
          </View>
          <Text style={s.securityRowLabel}>Report Security Issue</Text>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <View style={s.securityDivider} />
        <TouchableOpacity
          style={s.securityRow}
          activeOpacity={0.85}
          onPress={handleDeleteAccount}
        >
          <View style={[s.menuIconWrap, { backgroundColor: "#fef2f2" }]}>
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </View>
          <Text style={[s.securityRowLabel, { color: "#dc2626" }]}>
            Delete Account
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderLegal = () => (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.subPageHeader}>
       <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
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
          style={s.menuCard}
          activeOpacity={0.85}
          onPress={() => { if (item.url) Linking.openURL(item.url); }}
        >
          <View style={s.menuCardLeft}>
            <View style={[s.menuIconWrap, { backgroundColor: "#f0f9ff" }]}>
              <Ionicons name={item.icon as any} size={18} color="#0ea5e9" />
            </View>
            <Text style={s.menuLabel}>{item.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      ))}

     
    </ScrollView>
  );

  return (
    <>
      {profileScreen === "main" && renderProfileMain()}
      {profileScreen === "personalInfo" && renderPersonalInfo()}
      {profileScreen === "changePassword" && renderChangePassword()}
  {profileScreen === "reportSecurity" && renderReportSecurity()}
      {profileScreen === "legal" && renderLegal()}
      {profileScreen === "settings" && renderSettings()}
    </>
  );
});

const s = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 20 },
  profileHero: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  profileAvatarBtn: { position: "relative", marginBottom: 14 },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  profileAvatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  profileAvatarText: { fontSize: 32, fontWeight: "800", color: "#16a34a" },
  profileCameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  profileRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    marginBottom: 8,
  },
  profileRoleBadgeText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  profileHint: { fontSize: 11, color: "#94a3b8", letterSpacing: 0.5 },
  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuCardLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  sectionBlock: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  logoutBtnText: { color: "#dc2626", fontSize: 15, fontWeight: "700" },
  platformLabel: {
    fontSize: 11,
    color: "#cbd5e1",
    fontWeight: "600",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  subPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    paddingTop: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
  idCardEmpty: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  idCardEmptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  idCardUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    marginTop: 4,
  },
  idCardUploadBtnText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginTop: 8,
  },
  pendingBadgeText: { fontSize: 13, fontWeight: "600", color: "#d97706" },
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
  pwRuleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
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
});
