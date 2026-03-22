import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useRef, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { height: SH } = Dimensions.get("window");

type Section = {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string;
};

const SECTIONS: Section[] = [
  {
    id: "1",
    iconName: "document-text-outline",
    title: "Acceptance of Terms",
    content:
      "By accessing or using the UniFiX platform ('Service'), you agree to be bound by these Terms and Conditions. This agreement is between you ('User') and UniFiX, operated under VCET College. If you do not agree to these terms, you must not use the Service. These terms apply to all users including students, teachers, and maintenance staff.",
  },
  {
    id: "2",
    iconName: "lock-closed-outline",
    title: "Account Registration & Security",
    content:
      "You must provide accurate, complete, and current information during registration. Students and teachers must register using their official @vcet.edu.in college email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify the administrator of any unauthorized use of your account. UniFiX reserves the right to suspend or terminate accounts that violate these terms.",
  },
  {
    id: "3",
    iconName: "construct-outline",
    title: "Use of the Service",
    content:
      "UniFiX is a campus maintenance and complaint management platform. You agree to use the Service only for its intended purpose, reporting genuine maintenance issues, tracking complaint status, and managing campus facilities. You must not submit false, misleading, or malicious complaints. You must not attempt to access restricted areas of the platform. You must not interfere with or disrupt the Service or servers connected to it. Repeated misuse may result in permanent account suspension.",
  },
  {
    id: "4",
    iconName: "card-outline",
    title: "Identity Verification",
    content:
      "Users may be required to submit identity documents (college ID cards, employee IDs) for verification purposes. This information is used solely for account authentication and will not be shared with third parties without your consent. Submitting false identity documents is strictly prohibited and may result in legal action. ID card information is only accessible to you and authorized administrators.",
  },
  {
    id: "5",
    iconName: "shield-checkmark-outline",
    title: "Privacy & Data Protection",
    content:
      "We collect personal information including your name, email address, phone number, role, and complaint data to provide and improve the Service. Your data is stored securely on Firebase-powered infrastructure. We do not sell your personal data to third parties. Complaint photos and attachments are stored on Cloudinary and are accessible only to you, assigned staff, and administrators. You may request deletion of your account and associated data at any time through the app settings.",
  },
  {
    id: "6",
    iconName: "camera-outline",
    title: "User-Generated Content",
    content:
      "When you submit complaints, photos, or descriptions, you grant UniFiX a non-exclusive license to use that content for the purposes of providing the Service. You confirm that any images or content you upload are related to legitimate maintenance issues on campus. You must not upload offensive, harmful, or irrelevant content. We reserve the right to remove any content that violates these guidelines without prior notice.",
  },
  {
    id: "7",
    iconName: "people-outline",
    title: "Maintenance Staff Obligations",
    content:
      "Maintenance staff using this platform agree to handle assigned complaints professionally and within reasonable time frames. Staff must accurately update complaint statuses and not misrepresent work completion. Staff accounts require administrator verification before activation. Any misconduct in handling complaints or misuse of user data by staff will result in immediate account termination.",
  },
  {
    id: "8",
    iconName: "alert-circle-outline",
    title: "Disclaimers & Limitation of Liability",
    content:
      "The Service is provided 'as is' without warranties of any kind. UniFiX does not guarantee that complaints will be resolved within any specific timeframe. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. The platform is a communication and tracking tool — actual maintenance resolution is the responsibility of the college facilities department.",
  },
  {
    id: "9",
    iconName: "refresh-outline",
    title: "Modifications to Terms",
    content:
      "UniFiX reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes through the app. Your continued use of the Service after modifications constitutes acceptance of the updated terms. We recommend reviewing these terms periodically to stay informed of any changes.",
  },
  {
    id: "10",
    iconName: "mail-outline",
    title: "Contact & Grievances",
    content:
      "If you have any questions about these Terms, or wish to raise a grievance regarding the Service, please contact your campus administrator or submit a support request through the app. For data-related concerns, you may use the 'Report Security Issue' feature available in your Profile settings.",
  },
];

export default function TermsAndConditionsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const lastUpdated = "17 March 2026";

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const canGoBack = router.canGoBack?.() ?? false;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Animated.View style={[s.stickyHeader, { opacity: headerOpacity }]}>
        <Text style={s.stickyTitle}>Terms & Conditions</Text>
      </Animated.View>

      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => (canGoBack ? router.back() : router.replace("/login"))}
        >
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.topBarBrand}>UniFiX</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <View style={s.heroBlock}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>LEGAL</Text>
          </View>
          <Text style={s.heroTitle}>Terms &{"\n"}Conditions</Text>
          <Text style={s.heroSubtitle}>
            Please read these terms carefully before using the UniFiX platform.
          </Text>
          <View style={s.metaRow}>
            <View style={s.metaChip}>
              <Ionicons name="calendar-outline" size={12} color="#64748b" />
              <Text style={s.metaChipText}>Last updated: {lastUpdated}</Text>
            </View>
            <View style={s.metaChip}>
              <Ionicons name="business-outline" size={12} color="#64748b" />
              <Text style={s.metaChipText}>VCET College</Text>
            </View>
          </View>
        </View>

        <View style={s.summaryCard}>
          <View style={s.summaryIconWrap}>
            <Ionicons name="bulb-outline" size={22} color="#facc15" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.summaryTitle}>Quick Summary</Text>
            <Text style={s.summaryText}>
              Use UniFiX only for genuine campus maintenance. Keep your account
              secure. Your data is private and protected. Misuse may result in
              account suspension.
            </Text>
          </View>
        </View>

        <View style={s.sectionsWrap}>
          {SECTIONS.map((section) => {
            const isOpen = activeSection === section.id;
            return (
              <TouchableOpacity
                key={section.id}
                style={[s.sectionCard, isOpen && s.sectionCardOpen]}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.85}
              >
                <View style={s.sectionHeader}>
                  <View
                    style={[s.sectionIconWrap, isOpen && s.sectionIconWrapOpen]}
                  >
                    <Ionicons
                      name={section.iconName}
                      size={18}
                      color={isOpen ? "#16a34a" : "#64748b"}
                    />
                  </View>
                  <View style={s.sectionTitleWrap}>
                    <Text style={s.sectionNum}>SECTION {section.id}</Text>
                    <Text
                      style={[s.sectionTitle, isOpen && s.sectionTitleOpen]}
                    >
                      {section.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-down" : "chevron-forward"}
                    size={18}
                    color={isOpen ? "#16a34a" : "#94a3b8"}
                  />
                </View>
                {isOpen && (
                  <View style={s.sectionBody}>
                    <View style={s.sectionDivider} />
                    <Text style={s.sectionContent}>{section.content}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.bottomSection}>
          <Text style={s.bottomVersion}>UniFiX Platform · Version 1.0</Text>
          <Text style={s.bottomCopy}>
            © 2026 VCET College. All rights reserved.
          </Text>
        </View>

        <TouchableOpacity
          style={s.agreeBtn}
          onPress={() => (canGoBack ? router.back() : router.replace("/login"))}
          activeOpacity={0.85}
        >
          <Text style={s.agreeBtnText}>I Understand</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    height: Platform.OS === "ios" ? 88 : 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  stickyTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 56 : 48,
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarBrand: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  heroBlock: { paddingTop: 12, paddingBottom: 28 },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16a34a",
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 22,
    marginBottom: 18,
  },
  metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaChipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  summaryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  summaryIconWrap: { marginTop: 2 },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  summaryText: { fontSize: 13, color: "#94a3b8", lineHeight: 20 },
  sectionsWrap: { gap: 10, marginBottom: 24 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  sectionCardOpen: {
    borderColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionIconWrapOpen: { backgroundColor: "#f0fdf4" },
  sectionTitleWrap: { flex: 1 },
  sectionNum: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 19,
  },
  sectionTitleOpen: { color: "#16a34a" },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 18 },
  sectionDivider: { height: 1, backgroundColor: "#f0fdf4", marginBottom: 14 },
  sectionContent: { fontSize: 13, color: "#475569", lineHeight: 22 },
  bottomSection: { alignItems: "center", gap: 4, marginBottom: 24 },
  bottomVersion: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  bottomCopy: { fontSize: 11, color: "#cbd5e1" },
  agreeBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
  },
  agreeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
