import { NotificationBell } from "@/components/NotificationBell";
import {
  Colors,
  Spacing
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 160;

type ProfileTab = "beats" | "equipment" | "collabs" | "clubs";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";
  const [activeTab, setActiveTab] = useState<ProfileTab>("beats");

  // Fetch full profile data
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: beats, isLoading: beatsLoading } = useUserBeats(user?.id);
  const { data: equipment, isLoading: equipmentLoading } = useUserEquipment(
    user?.id,
  );
  const { data: collaborations, isLoading: collabsLoading } =
    useUserCollaborations(user?.id);
  const { data: clubs, isLoading: clubsLoading } = useMyClubs(user?.id);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.centerContent}>
          <MaterialCommunityIcons
            name="account-lock-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sign in to view profile
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Join the community to connect with others.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const renderContent = () => {
    const getLoadingState = () => {
      switch (activeTab) {
        case "beats":
          return beatsLoading;
        case "equipment":
          return equipmentLoading;
        case "collabs":
          return collabsLoading;
        case "clubs":
          return clubsLoading;
        default:
          return false;
      }
    };

    const getData = () => {
      switch (activeTab) {
        case "beats":
          return beats || [];
        case "equipment":
          return equipment || [];
        case "collabs":
          return collaborations || [];
        case "clubs":
          return clubs || [];
        default:
          return [];
      }
    };

    if (getLoadingState()) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    const data = getData();

    if (data.length === 0) {
      return (
        <View style={styles.emptyTabState}>
          <View
            style={[styles.emptyIconCircle, { backgroundColor: colors.card }]}
          >
            <MaterialCommunityIcons
              name={
                activeTab === "beats"
                  ? "music-note-off"
                  : activeTab === "equipment"
                    ? "microphone-off"
                    : activeTab === "collabs"
                      ? "account-off"
                      : "account-group-outline"
              }
              size={32}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
            No {activeTab} found
          </Text>
          {activeTab === "beats" && (
            <TouchableOpacity style={{ marginTop: 12 }}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Upload a beat
              </Text>
            </TouchableOpacity>
          )}
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
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              // Navigate to details if needed
            }}
          >
            {/* Placeholder Image for Item */}
            <View
              style={[
                styles.gridImagePlaceholder,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  activeTab === "beats"
                    ? "music-circle"
                    : activeTab === "equipment"
                      ? "speaker"
                      : "account-group"
                }
                size={24}
                color={colors.textTertiary}
              />
            </View>

            <View style={styles.gridContent}>
              <Text
                style={[styles.gridTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title || item.name}
              </Text>

              {activeTab === "beats" && (
                <Text
                  style={[styles.gridSubtitle, { color: colors.textSecondary }]}
                >
                  {item.bpm} BPM • ${item.price}
                </Text>
              )}
              {activeTab === "equipment" && (
                <Text
                  style={[styles.gridSubtitle, { color: colors.textSecondary }]}
                >
                  {item.category} • ${item.price || item.rentalRate}/day
                </Text>
              )}
              {activeTab === "collabs" && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "completed"
                          ? colors.success + "20"
                          : colors.warning + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === "completed"
                            ? colors.success
                            : colors.warning,
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              )}
              {activeTab === "clubs" && (
                <Text
                  style={[styles.gridSubtitle, { color: colors.textSecondary }]}
                >
                  {item.memberCount} members
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Mock cover image
  const coverUrl =
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80";
  const avatarUrl =
    profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.username || "User")}&background=random&size=200`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* --- Header Section --- */}
        <View style={{ marginBottom: 60 }}>
          {/* Cover Image */}
          <View style={{ height: COVER_HEIGHT }}>
            <Image
              source={{ uri: coverUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "transparent"]}
              style={styles.coverGradient}
            />
          </View>

          {/* Top Nav Overlay */}
          <SafeAreaView style={styles.topNavOverlay}>
            <View style={styles.topNavContent}>
              <Text style={styles.topNavTitle}>Profile</Text>
              <View style={styles.topNavActions}>
                <NotificationBell size={22} color="#fff" />
                <TouchableOpacity
                  onPress={() => router.push("/settings")}
                  style={styles.iconButtonBlur}
                >
                  <Ionicons name="settings-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Avatar & Edit Button */}
          <View style={styles.profileHeaderBar}>
            <View
              style={[
                styles.avatarContainer,
                { borderColor: colors.background },
              ]}
            >
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            </View>
            <TouchableOpacity
              style={[styles.editProfileBtn, { borderColor: colors.border }]}
              onPress={() => router.push("/settings")}
            >
              <Text style={[styles.editProfileText, { color: colors.text }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Profile Info --- */}
        <View style={styles.infoContainer}>
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.fullName, { color: colors.text }]}>
                {profile?.fullName || user?.fullName || "User"}
              </Text>
              {profile?.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color={colors.primary}
                />
              )}
            </View>
            <Text style={[styles.username, { color: colors.textSecondary }]}>
              @{profile?.username || user?.username}
            </Text>
          </View>

          {/* Role & Location */}
          <View style={styles.detailsRow}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <MaterialCommunityIcons
                name="star-four-points"
                size={12}
                color={colors.text}
              />
              <Text style={[styles.roleText, { color: colors.text }]}>
                {profile?.primaryRole || user?.primaryRole || "Creator"}
              </Text>
            </View>

            {profile?.location && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {profile.location}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {profile?.bio && (
            <Text style={[styles.bioText, { color: colors.text }]}>
              {profile.bio}
            </Text>
          )}

          {/* Links */}
          {profile?.website && (
            <TouchableOpacity
              onPress={() => Linking.openURL(profile.website!)}
              style={styles.linkRow}
            >
              <Ionicons name="link-outline" size={16} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {profile.website}
              </Text>
            </TouchableOpacity>
          )}

          {/* Stats Row */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile?.followersCount || user?.followersCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Followers
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile?.followingCount || user?.followingCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Following
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {(beats?.length || 0) +
                  (equipment?.length || 0) +
                  (collaborations?.length || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Creations
              </Text>
            </View>
          </View>
        </View>

        {/* --- Content Tabs --- */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {(["beats", "equipment", "collabs", "clubs"] as ProfileTab[]).map(
              (tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabItem,
                    activeTab === tab && {
                      borderBottomColor: colors.text,
                      borderBottomWidth: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === tab ? colors.text : colors.textTertiary,
                      },
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>

        {/* --- Tab Content --- */}
        <View
          style={[
            styles.contentArea,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          {renderContent()}
        </View>

        {/* --- Menu / Settings Section --- */}
        <View
          style={[styles.menuSection, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            Account
          </Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/bookings")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Bookings
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/service-requests")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={colors.text}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Service Requests
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/transactions")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="receipt-outline" size={20} color={colors.text} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Transactions
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Studio Manager Debug Link */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/(tabs)/debug-studios")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="hammer-outline" size={20} color={colors.text} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Studio Manager
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, styles.lastMenuRow]}
            onPress={handleSignOut}
          >
            <View style={[styles.menuIconBox, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.menuLabel, { color: "#EF4444" }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  topNavOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topNavContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  topNavTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topNavActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButtonBlur: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile Bar (Avatar + Edit)
  profileHeaderBar: {
    position: "absolute",
    bottom: -50,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ccc",
  },
  editProfileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Info Container
  infoContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: Spacing.lg,
  },
  nameSection: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fullName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 15,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tabsScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: 24,
  },
  tabItem: {
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Grid Content
  contentArea: {
    minHeight: 200,
    padding: Spacing.md,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: (width - 32 - 12) / 2, // 2 columns with gap
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  gridImagePlaceholder: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // States
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTabState: {
    padding: 40,
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTabText: {
    fontSize: 15,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  lastMenuRow: {
    marginTop: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },

  // Empty Auth State
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
