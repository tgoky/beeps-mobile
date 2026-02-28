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
import { LinearGradient } from "expo-linear-gradient";
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
const ITEM_WIDTH = (width - 40 - GAP) / 2;

type ProfileTab = "beats" | "equipment" | "collabs" | "clubs";

// 🎨 THEME COLORS
const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#151515",
  pureWhite: "#FFFFFF",
  offWhite: "#F5F5F5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",
  accentDim: "rgba(245, 158, 11, 0.15)",
  red: "#D50000",
};

// --- COMPONENT: Section Divider ---
const SectionDivider = () => (
  <View style={styles.dividerContainer}>
    <View style={styles.dividerLine} />
  </View>
);

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  // Load Fonts
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

  // RBAC
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
        message: `Check out ${
          profile?.fullName || user?.fullName
        }'s profile on BeatConnect!`,
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
      <StatusBar barStyle="light-content" />

      {/* Atmospheric Glow */}
      <View style={styles.spotlightContainer}>
        <LinearGradient
          colors={["rgba(245, 158, 11, 0.15)", "transparent"]}
          style={styles.spotlightGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShareProfile}>
            <Ionicons
              name="share-social-outline"
              size={22}
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
                size={22}
                color={COLORS.pureWhite}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* --- SECTION 1: IDENTITY & STATS BACKGROUND PATTERNS --- */}
          <View style={styles.headerBackgroundContainer}>
            {/* Pattern 1: Spectrum Lines (Left) - INCREASED OPACITY */}
            <MaterialCommunityIcons
              name="graphic-eq"
              size={180}
              color="rgba(255,255,255,0.12)" // Much brighter
              style={styles.patternLeft}
            />

            {/* Pattern 2: Tune/Sliders (Right) - CHANGED FROM STAR to LINES */}
            <MaterialCommunityIcons
              name="tune"
              size={160}
              color="rgba(245, 158, 11, 0.15)" // Brighter Amber
              style={styles.patternRight}
            />

            {/* Content */}
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

          <SectionDivider />

          {/* --- SECTION 2: UTILITY (Wallet/Manager) --- */}
          <View style={styles.dashboardGrid}>
            <DashboardButton
              title="WALLET"
              subtitle="Transactions"
              icon="wallet-outline"
              onPress={() => router.push("/transactions")}
            />
            <DashboardButton
              title="STUDIO"
              subtitle="Manager"
              icon="options-outline"
              onPress={() => router.push("/(tabs)/debug-studios")}
            />
          </View>

          <SectionDivider />

          {/* --- SECTION 3: CONTENT TABS --- */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {isProducer && (
                <TouchableOpacity
                  onPress={() => setActiveTab("beats")}
                  style={[
                    styles.tabButton,
                    activeTab === "beats" && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "beats" && { color: COLORS.accent },
                    ]}
                  >
                    BEATS
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setActiveTab("collabs")}
                style={[
                  styles.tabButton,
                  activeTab === "collabs" && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "collabs" && { color: COLORS.accent },
                  ]}
                >
                  COLLABS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("equipment")}
                style={[
                  styles.tabButton,
                  activeTab === "equipment" && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "equipment" && { color: COLORS.accent },
                  ]}
                >
                  GEAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("clubs")}
                style={[
                  styles.tabButton,
                  activeTab === "clubs" && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "clubs" && { color: COLORS.accent },
                  ]}
                >
                  CLUBS
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Content Area */}
          <View style={styles.contentArea}>{renderContent()}</View>

          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Reusable Dashboard Button
const DashboardButton = ({ title, subtitle, icon, onPress }: any) => (
  <TouchableOpacity
    style={styles.dashboardCard}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={24} color={COLORS.accent} />
    </View>
    <View>
      <Text style={styles.dashboardLabel}>{title}</Text>
      <Text style={styles.dashboardSubLabel}>{subtitle}</Text>
    </View>
    <View style={styles.arrowBox}>
      <Ionicons name="arrow-forward" size={14} color={COLORS.textGrey} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },

  // DIVIDER
  dividerContainer: {
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  dividerLine: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.border,
  },

  // SPOTLIGHT
  spotlightContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: "hidden",
  },
  spotlightGradient: { width: "100%", height: "100%", opacity: 0.8 },

  // TOP BAR
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // HEADER CONTAINER
  headerBackgroundContainer: {
    position: "relative",
    overflow: "hidden",
    paddingBottom: 10,
  },

  // PATTERNS
  patternLeft: {
    position: "absolute",
    top: 40,
    left: -40,
    opacity: 0.8, // Increased for visibility
    transform: [{ rotate: "90deg" }],
  },
  patternRight: {
    position: "absolute",
    top: 20,
    right: -40,
    opacity: 0.9, // Increased for visibility
    transform: [{ rotate: "-15deg" }],
  },

  // HEADER SECTION
  headerSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 16,
    position: "relative",
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBlack,
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
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  // NAME
  nameContainer: {
    alignItems: "center",
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullName: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: -0.5,
  },
  roleText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },

  // STATS
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: { alignItems: "center", minWidth: 80 },
  statValue: {
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textGrey,
    textTransform: "uppercase",
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 15,
  },

  bioText: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: "#CCC",
    lineHeight: 22,
    paddingHorizontal: 40,
    marginBottom: 10,
  },

  // DASHBOARD GRID
  dashboardGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  dashboardCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dashboardLabel: {
    fontSize: 14,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dashboardSubLabel: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },
  arrowBox: {
    marginLeft: "auto",
  },

  // TABS
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsScrollContent: {
    gap: 30,
  },
  tabButton: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.textGrey,
    letterSpacing: 1,
  },

  // CONTENT AREA
  contentArea: {
    paddingHorizontal: 20,
    minHeight: 200,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTabState: {
    padding: 40,
    alignItems: "center",
    gap: 12,
    opacity: 0.7,
  },
  emptyTabText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textGrey,
  },

  // GRID ITEMS
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
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
    backgroundColor: COLORS.cardDark,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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

  // SIGN OUT
  signOutBtn: {
    alignSelf: "center",
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  signOutText: {
    color: COLORS.red,
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
});
