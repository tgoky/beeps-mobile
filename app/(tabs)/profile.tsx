import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useMyClubs } from "@/hooks/useClubs";
import {
  useUserBeats,
  useUserCollaborations,
  useUserEquipment,
  useUserProfile,
} from "@/hooks/useProfile";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const GAP = 12;
// Adjust item width based on new padding
const ITEM_WIDTH = (width - 40 - GAP) / 2;

type ProfileTab = "beats" | "equipment" | "collabs" | "clubs";

// 🎨 UPDATED THEME COLORS
const COLORS = {
  mainBackground: "#000000",

  // Section Backgrounds
  sectionTop: "#111111", // Dark Grey for Identity
  sectionMiddle: "#000000", // Pure black for Utility area
  sectionBottom: "#080808", // Slightly lighter for content grid

  // Components
  cardBlack: "#1A1A1A",
  pureWhite: "#FFFFFF",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",

  // Button Colors
  walletBg: "#064e3b", // Deep Emerald Green
  walletBorder: "#10b981", // Bright Green Border
  studioBg: "#1e3a8a", // Deep Blue
  studioBorder: "#3b82f6", // Bright Blue Border
  red: "#D50000",
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [activeTab, setActiveTab] = useState<ProfileTab>("collabs");

  // Fetch Data
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: beats, isLoading: beatsLoading } = useUserBeats(user?.id);
  const { data: equipment, isLoading: equipmentLoading } = useUserEquipment(
    user?.id,
  );
  const { data: collaborations, isLoading: collabsLoading } =
    useUserCollaborations(user?.id);
  const { data: clubs, isLoading: clubsLoading } = useMyClubs(user?.id);

  const isProducer =
    profile?.primaryRole === "PRODUCER" ||
    !!profile?.producerProfile ||
    (profile?.roles && profile.roles.includes("producer"));

  useEffect(() => {
    if (isProducer) setActiveTab("beats");
    else setActiveTab("collabs");
  }, [isProducer]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.fullName || user?.fullName}'s profile on BeatConnect!`,
        url: `https://beatconnect.app/user/${user?.id}`,
      });
    } catch (error) {
      console.error("Error sharing profile:", error);
    }
  };

  const renderContent = () => {
    let isLoading = false;
    let data: any[] = [];
    let emptyIcon = "folder-open-outline";
    let emptyText = "No items";

    switch (activeTab) {
      case "beats":
        isLoading = beatsLoading;
        data = beats || [];
        emptyIcon = "music-note-off";
        emptyText = "No beats uploaded";
        break;
      case "equipment":
        isLoading = equipmentLoading;
        data = equipment || [];
        emptyIcon = "microphone-off";
        emptyText = "No equipment listed";
        break;
      case "collabs":
        isLoading = collabsLoading;
        data = collaborations || [];
        emptyIcon = "account-group-outline";
        emptyText = "No active collaborations";
        break;
      case "clubs":
        isLoading = clubsLoading;
        data = clubs || [];
        emptyIcon = "shield-off-outline";
        emptyText = "No clubs joined";
        break;
    }

    if (isLoading)
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      );

    if (data.length === 0) {
      return (
        <View style={styles.emptyTabState}>
          <MaterialCommunityIcons
            name={emptyIcon as any}
            size={40}
            color="#333"
          />
          <Text style={styles.emptyTabText}>{emptyText}</Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {data.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            activeOpacity={0.7}
          >
            <View style={styles.gridImagePlaceholder}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.gridImage}
                  contentFit="cover"
                />
              ) : (
                <MaterialCommunityIcons
                  name="waveform"
                  size={40}
                  color={COLORS.textGrey}
                  style={{ opacity: 0.5 }}
                />
              )}
              {item.price && (
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>${item.price}</Text>
                </View>
              )}
            </View>
            <View style={styles.gridContent}>
              <Text style={styles.gridTitle} numberOfLines={1}>
                {item.title || item.name}
              </Text>
              <Text style={styles.gridSubtitle}>
                {activeTab === "beats" && `${item.bpm} BPM`}
                {activeTab === "collabs" && (item.status || "Active")}
                {activeTab === "equipment" && "Gear"}
                {activeTab === "clubs" && "Member"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!user || !fontsLoaded) return null;

  const avatarUrl =
    profile?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.fullName || "User",
    )}&background=random`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.sectionTop} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Navigation - Placed inside SafeArea */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShareProfile}>
            <Ionicons
              name="share-social-outline"
              size={20}
              color={COLORS.pureWhite}
            />
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            <NotificationBell />
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={[styles.iconBtn, { marginLeft: 16 }]}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={COLORS.pureWhite}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ================================================== */}
          {/* ZONE 1: TOP SECTION (Identity, Stats, Bio) */}
          {/* ================================================== */}
          <View style={styles.topSectionContainer}>
            {/* Background Patterns */}
            <View style={styles.patternContainer}>
              <MaterialCommunityIcons
                name="human"
                size={180}
                color="rgba(255,255,255,0.03)"
                style={styles.patternLeft}
              />
              <MaterialCommunityIcons
                name="human"
                size={180}
                color="rgba(245, 158, 11, 0.05)"
                style={styles.patternRight}
              />
            </View>

            <View style={styles.headerSection}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarRing}>
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                </View>
                <TouchableOpacity
                  style={styles.editBadge}
                  onPress={() => router.push("/profile/edit")}
                >
                  <Ionicons name="pencil" size={12} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.nameContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.fullName}>
                    {profile?.fullName || user?.fullName}
                  </Text>
                  {profile?.verified && (
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={20}
                      color={COLORS.accent}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
                <Text style={styles.roleText}>
                  {profile?.primaryRole || "Artist"} • @
                  {profile?.username || user?.username}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.collaborationCount || 0}
                </Text>
                <Text style={styles.statLabel}>COLLABS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.studioCount || 0}
                </Text>
                <Text style={styles.statLabel}>STUDIOS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.clubCount || 0}</Text>
                <Text style={styles.statLabel}>CLUBS</Text>
              </View>
            </View>

            {/* Bio */}
            {profile?.bio && (
              <Text style={styles.bioText} numberOfLines={3}>
                {profile.bio}
              </Text>
            )}
          </View>

          {/* ================================================== */}
          {/* ZONE 2: MIDDLE SECTION (Utility Buttons) */}
          {/* ================================================== */}
          <View style={styles.middleSectionContainer}>
            <Text style={styles.sectionHeader}>Studio Manager</Text>
            <View style={styles.dashboardGrid}>
              <DashboardButton
                title="WALLET"
                subtitle="Transaction"
                icon="wallet"
                bgColor={COLORS.walletBg}
                borderColor={COLORS.walletBorder}
                iconColor="#FFF"
                onPress={() => router.push("/transactions")}
              />
              <DashboardButton
                title="STUDIO"
                subtitle="Manager"
                icon="equalizer"
                bgColor={COLORS.studioBg}
                borderColor={COLORS.studioBorder}
                iconColor="#FFF"
                onPress={() => router.push("/(tabs)/debug-studios")}
              />
            </View>
          </View>

          {/* ================================================== */}
          {/* ZONE 3: BOTTOM SECTION (Content Tabs) */}
          {/* ================================================== */}
          <View style={styles.bottomSectionContainer}>
            <View style={styles.tabsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScrollContent}
              >
                {isProducer && (
                  <TabButton
                    label="BEATS"
                    isActive={activeTab === "beats"}
                    onPress={() => setActiveTab("beats")}
                  />
                )}
                <TabButton
                  label="COLLABS"
                  isActive={activeTab === "collabs"}
                  onPress={() => setActiveTab("collabs")}
                />
                <TabButton
                  label="GEAR"
                  isActive={activeTab === "equipment"}
                  onPress={() => setActiveTab("equipment")}
                />
                <TabButton
                  label="CLUBS"
                  isActive={activeTab === "clubs"}
                  onPress={() => setActiveTab("clubs")}
                />
              </ScrollView>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>{renderContent()}</View>

            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// --- HELPER COMPONENTS ---

const TabButton = ({ label, isActive, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
  >
    <Text style={[styles.tabText, isActive && { color: COLORS.pureWhite }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const DashboardButton = ({
  title,
  subtitle,
  icon,
  onPress,
  bgColor,
  borderColor,
  iconColor,
}: any) => (
  <TouchableOpacity
    style={[
      styles.dashboardCard,
      { backgroundColor: bgColor, borderColor: borderColor },
    ]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={[styles.iconBox, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
      <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.dashboardLabel}>{title}</Text>
      <Text style={styles.dashboardSubLabel}>{subtitle}</Text>
    </View>
    <View style={styles.arrowBox}>
      {/* Subtle circular arrow bg */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 4,
        }}
      >
        <Ionicons name="arrow-forward" size={14} color="#FFF" />
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mainBackground },
  safeArea: { flex: 1 },

  // --- TOP BAR ---
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.sectionTop, // Blend with top section
    zIndex: 10,
  },
  topBarRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // --- ZONE 1: TOP SECTION ---
  topSectionContainer: {
    backgroundColor: COLORS.sectionTop,
    paddingBottom: 30,
    marginBottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  patternLeft: {
    position: "absolute",
    top: 40,
    left: -40,
    transform: [{ rotate: "90deg" }],
  },
  patternRight: {
    position: "absolute",
    top: 50,
    right: -50,
    transform: [{ rotate: "-15deg" }],
  },
  headerSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    zIndex: 1,
  },
  avatarWrapper: { marginBottom: 16, position: "relative" },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#222",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.sectionTop,
  },
  nameContainer: { alignItems: "center", gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  fullName: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: -0.5,
  },
  roleText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  statItem: { alignItems: "center", minWidth: 80 },
  statValue: {
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textGrey,
    textTransform: "uppercase",
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 15,
  },
  bioText: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: "#DDD",
    lineHeight: 22,
    paddingHorizontal: 40,
    zIndex: 1,
  },

  // --- ZONE 2: MIDDLE SECTION ---
  middleSectionContainer: {
    backgroundColor: COLORS.sectionMiddle,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1,
  },
  dashboardGrid: { flexDirection: "row", gap: 12 },
  dashboardCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dashboardLabel: {
    fontSize: 13,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dashboardSubLabel: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  arrowBox: { marginLeft: "auto" },

  // --- ZONE 3: BOTTOM SECTION ---
  bottomSectionContainer: {
    flex: 1,
    backgroundColor: COLORS.sectionBottom,
    marginTop: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    minHeight: 500, // Ensure it fills screen
  },
  tabsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  tabsScrollContent: { gap: 10 },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: COLORS.cardBlack,
    borderColor: COLORS.border,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textGrey,
    letterSpacing: 0.5,
  },

  contentArea: { paddingHorizontal: 20 },
  loadingContainer: { padding: 40, alignItems: "center" },
  emptyTabState: { padding: 40, alignItems: "center", gap: 12, opacity: 0.7 },
  emptyTabText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textGrey,
  },

  // Grid
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  gridItem: {
    width: ITEM_WIDTH,
    borderRadius: 16,
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 4,
  },
  gridImagePlaceholder: {
    height: ITEM_WIDTH,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  gridImage: { width: "100%", height: "100%" },
  priceTag: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: "#000",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 10,
  },
  gridContent: { padding: 12 },
  gridTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.pureWhite,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },

  // Sign Out
  signOutBtn: {
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.red,
    backgroundColor: "rgba(213, 0, 0, 0.05)",
  },
  signOutText: {
    color: COLORS.red,
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
});
