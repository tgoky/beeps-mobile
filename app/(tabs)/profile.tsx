import { NotificationBell } from "@/components/NotificationBell";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMyClubs } from "@/hooks/useClubs";
import {
  useUserBeats,
  useUserCollaborations,
  useUserEquipment,
  useUserProfile,
} from "@/hooks/useProfile";
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

type ProfileTab = "beats" | "equipment" | "collabs" | "clubs";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  // Refined Dark Theme Palette
  const theme = {
    bg: "#000000",
    surface: "#111111",
    border: "#333333",
    text: "#FFFFFF",
    textDim: "#888888",
    primary: Colors.dark.primary,
    danger: "#EF4444",
  };

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
        emptyText = "No equipment";
        break;
      case "collabs":
        isLoading = collabsLoading;
        data = collaborations || [];
        emptyIcon = "account-group-outline";
        emptyText = "No collaborations";
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
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      );

    if (data.length === 0) {
      return (
        <View style={styles.emptyTabState}>
          <MaterialCommunityIcons
            name={emptyIcon as any}
            size={32}
            color={theme.textDim}
          />
          <Text style={[styles.emptyTabText, { color: theme.textDim }]}>
            {emptyText}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {data.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.gridItem,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
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
                  name="image-filter-hdr"
                  size={20}
                  color={theme.textDim}
                />
              )}
            </View>
            <View style={styles.gridContent}>
              <Text
                style={[styles.gridTitle, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.title || item.name}
              </Text>
              <Text style={[styles.gridSubtitle, { color: theme.textDim }]}>
                {activeTab === "beats" && `${item.bpm} BPM • $${item.price}`}
                {activeTab === "collabs" && item.status}
                {activeTab === "equipment" && `$${item.price}`}
                {activeTab === "clubs" && "Member"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!user) return null;

  const avatarUrl =
    profile?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=random`;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Atmospheric Glow */}
      <View style={styles.spotlightContainer}>
        <LinearGradient
          colors={[theme.primary + "40", "transparent"]}
          style={styles.spotlightGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Navigation - Share moved to right side */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>{/* Empty view for balance */}</View>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              onPress={handleShareProfile}
              style={styles.topIconButton}
            >
              <Ionicons name="share-outline" size={22} color={theme.text} />
            </TouchableOpacity>
            <NotificationBell size={22} color={theme.text} />
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={styles.topIconButton}
            >
              <Ionicons name="settings-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Identity Section with Edit Button */}
          <View style={styles.headerSection}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarRing,
                  { borderColor: theme.border, backgroundColor: theme.bg },
                ]}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              </View>
            </View>

            {/* Name and Role with Edit Button - Larger Fonts */}
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.fullName, { color: theme.text }]}>
                  {profile?.fullName || user?.fullName}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/profile/edit")}
                  style={[styles.editNameButton, { borderColor: theme.border }]}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={theme.textDim}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.roleText, { color: theme.textDim }]}>
                {profile?.primaryRole || "User"} • @
                {profile?.username || user?.username}
                {profile?.verified && (
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={16}
                    color={theme.primary}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </Text>
            </View>
          </View>

          {/* Stats - Larger Fonts */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile?.collaborationCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: "#666" }]}>COLLABS</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile?.studioCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: "#666" }]}>STUDIOS</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile?.clubCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: "#666" }]}>CLUBS</Text>
            </View>
          </View>

          {/* Bio - Larger Font */}
          {profile?.bio && (
            <Text style={[styles.bioText, { color: theme.textDim }]}>
              {profile.bio}
            </Text>
          )}

          {/* Dashboard Grid */}
          <View style={styles.dashboardGrid}>
            {/* <DashboardButton
              title="Bookings"
              subtitle="Manage schedule"
              icon="calendar"
              color={theme.primary}
              onPress={() => router.push("/(tabs)/bookings")}
              theme={theme}
            /> */}
            {/* <DashboardButton
              title="Requests"
              subtitle="View offers"
              icon="briefcase"
              color={theme.primary}
              onPress={() => router.push("/service-requests")}
              theme={theme}
            /> */}
            <DashboardButton
              title="Wallet"
              subtitle="Transactions"
              icon="receipt"
              color={theme.primary}
              onPress={() => router.push("/transactions")}
              theme={theme}
            />
            <DashboardButton
              title="Studio"
              subtitle="Manager"
              icon="options"
              color={theme.primary}
              onPress={() => router.push("/(tabs)/debug-studios")}
              theme={theme}
            />
          </View>

          {/* Clean Tab Bar - Larger Fonts */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {isProducer && (
                <TouchableOpacity
                  onPress={() => setActiveTab("beats")}
                  style={styles.tabButton}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "beats" ? theme.primary : theme.textDim,
                        fontWeight: activeTab === "beats" ? "700" : "500",
                      },
                    ]}
                  >
                    BEATS
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setActiveTab("collabs")}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "collabs" ? theme.primary : theme.textDim,
                      fontWeight: activeTab === "collabs" ? "700" : "500",
                    },
                  ]}
                >
                  COLLABS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("equipment")}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "equipment"
                          ? theme.primary
                          : theme.textDim,
                      fontWeight: activeTab === "equipment" ? "700" : "500",
                    },
                  ]}
                >
                  GEAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("clubs")}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "clubs" ? theme.primary : theme.textDim,
                      fontWeight: activeTab === "clubs" ? "700" : "500",
                    },
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
            <Text
              style={{ color: theme.danger, fontSize: 14, fontWeight: "600" }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Dashboard Button Component
const DashboardButton = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  theme,
}: any) => (
  <TouchableOpacity
    style={[styles.dashboardCard, { borderColor: theme.border }]}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <LinearGradient
      colors={["#252525", "#111111"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View
      style={[styles.iconBox, { backgroundColor: "rgba(255,255,255,0.05)" }]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={[styles.dashboardLabel, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.dashboardSubLabel, { color: theme.textDim }]}>
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Spotlight
  spotlightContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    overflow: "hidden",
  },
  spotlightGradient: { width: "100%", height: "100%", opacity: 0.6 },

  // Clean Top Bar - Share on right
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarLeft: {
    flex: 1,
  },
  topBarRight: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  topIconButton: {
    padding: 4,
  },

  // Header Section
  headerSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#222",
  },

  // Name Container with Inline Edit - Larger Fonts
  nameContainer: {
    alignItems: "center",
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fullName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  editNameButton: {
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "500",
  },

  // Stats - Larger Fonts
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statItem: { alignItems: "center", minWidth: 90 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#333",
    marginHorizontal: 15,
  },

  bioText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 40,
    marginBottom: 30,
  },

  // Dashboard Grid
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  dashboardCard: {
    width: (width - 40 - 12) / 2,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 3,
    overflow: "hidden",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dashboardLabel: { fontSize: 15, fontWeight: "700" },
  dashboardSubLabel: { fontSize: 12 },

  // Clean Tabs - Larger Fonts
  tabsContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tabsScrollContent: {
    gap: 32,
    paddingVertical: 4,
  },
  tabButton: {
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },

  contentArea: { paddingHorizontal: 20, minHeight: 200 },
  loadingContainer: { padding: 40, alignItems: "center" },
  emptyTabState: { padding: 40, alignItems: "center", gap: 8, opacity: 0.7 },
  emptyTabText: { fontSize: 15 },

  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: {
    width: (width - 40 - 12) / 2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  gridImagePlaceholder: {
    height: 120,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  gridImage: { width: "100%", height: "100%" },
  gridContent: { padding: 12 },
  gridTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  gridSubtitle: { fontSize: 12 },

  signOutBtn: { alignSelf: "center", marginTop: 30, padding: 10 },
});
