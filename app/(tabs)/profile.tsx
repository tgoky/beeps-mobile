import { NotificationBell } from "@/components/NotificationBell";
import {
  Colors,
  Spacing,
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
  Alert,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 180;

type ProfileTab = "beats" | "equipment" | "collabs" | "clubs";

const TAB_ICONS: Record<ProfileTab, string> = {
  beats: "music-circle",
  equipment: "speaker",
  collabs: "account-group",
  clubs: "account-group-outline",
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";
  const [activeTab, setActiveTab] = useState<ProfileTab>("beats");

  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: beats, isLoading: beatsLoading } = useUserBeats(user?.id);
  const { data: equipment, isLoading: equipmentLoading } = useUserEquipment(user?.id);
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
          <View style={[styles.emptyCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons
              name="account-lock-outline"
              size={48}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sign in to view profile
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Join the community to connect with others.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.text }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={[styles.signInBtnText, { color: colors.background }]}>Sign In</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const renderContent = () => {
    const getLoadingState = () => {
      switch (activeTab) {
        case "beats": return beatsLoading;
        case "equipment": return equipmentLoading;
        case "collabs": return collabsLoading;
        case "clubs": return clubsLoading;
        default: return false;
      }
    };

    const getData = () => {
      switch (activeTab) {
        case "beats": return beats || [];
        case "equipment": return equipment || [];
        case "collabs": return collaborations || [];
        case "clubs": return clubs || [];
        default: return [];
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
            style={[styles.emptyTabCircle, { backgroundColor: colors.backgroundSecondary }]}
          >
            <MaterialCommunityIcons
              name={TAB_ICONS[activeTab] as any}
              size={28}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
            No {activeTab} yet
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
              { backgroundColor: colors.card },
            ]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                activeTab === "beats" ? ["#8B5CF6", "#6366F1"] :
                activeTab === "equipment" ? ["#F59E0B", "#EF4444"] :
                activeTab === "clubs" ? ["#3B82F6", "#06B6D4"] :
                ["#10B981", "#059669"]
              }
              style={styles.gridImagePlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name={TAB_ICONS[activeTab] as any}
                size={22}
                color="rgba(255,255,255,0.6)"
              />
            </LinearGradient>
            <View style={styles.gridContent}>
              <Text
                style={[styles.gridTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title || item.name}
              </Text>
              {activeTab === "beats" && (
                <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>
                  {item.bpm} BPM · ${item.price}
                </Text>
              )}
              {activeTab === "equipment" && (
                <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>
                  {item.category} · ${item.price || item.rentalRate}/day
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
                <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>
                  {item.memberCount} members
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const coverUrl =
    profile?.coverImage ||
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80";
  const avatarUrl =
    profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.username || "User")}&background=random&size=200`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Cover + Avatar Header */}
        <View style={{ marginBottom: 56 }}>
          <View style={{ height: COVER_HEIGHT }}>
            <Image
              source={{ uri: coverUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.2)"]}
              style={styles.coverGradient}
            />
          </View>

          {/* Top Nav Overlay */}
          <SafeAreaView style={styles.topNavOverlay}>
            <View style={styles.topNavContent}>
              <Text style={styles.topNavTitle}>Profile</Text>
              <View style={styles.topNavActions}>
                <NotificationBell size={20} color="#fff" />
                <TouchableOpacity
                  onPress={() => router.push("/settings")}
                  style={styles.iconButtonBlur}
                >
                  <Ionicons name="settings-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Avatar + Edit */}
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
              style={[styles.editProfileBtn, { backgroundColor: colors.text }]}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="pencil-outline" size={14} color={colors.background} style={{ marginRight: 4 }} />
              <Text style={[styles.editProfileText, { color: colors.background }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
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
                  color="#3B82F6"
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

          {/* Link */}
          {profile?.website && (
            <TouchableOpacity
              onPress={() => Linking.openURL(profile.website!)}
              style={styles.linkRow}
            >
              <Ionicons name="link-outline" size={15} color="#3B82F6" />
              <Text style={styles.linkText}>
                {profile.website}
              </Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile?.followersCount || user?.followersCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Followers
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile?.followingCount || user?.followingCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Following
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
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

        {/* Content Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
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

        {/* Tab Content */}
        <View style={[styles.contentArea, { backgroundColor: colors.background }]}>
          {renderContent()}
        </View>

        {/* Account Menu */}
        <View style={[styles.menuSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
            Account
          </Text>

          {[
            { label: "Bookings", icon: "calendar-outline", route: "/bookings", iconColor: colors.text },
            { label: "Service Requests", icon: "briefcase-outline", route: "/service-requests", iconColor: colors.text },
            { label: "Transactions", icon: "receipt-outline", route: "/transactions", iconColor: colors.text },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              onPress={() => router.push(item.route as any)}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.menuRow, { marginTop: 12 }]}
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
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    gap: 10,
  },
  iconButtonBlur: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile Header Bar
  profileHeaderBar: {
    position: "absolute",
    bottom: -46,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ccc",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Info Container
  infoContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 16,
  },
  nameSection: {
    marginBottom: 10,
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
    fontSize: 14,
    marginTop: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
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
    gap: 3,
  },
  locationText: {
    fontSize: 13,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3B82F6",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
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
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
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
    padding: Spacing.lg,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: (width - Spacing.lg * 2 - 12) / 2,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  gridImagePlaceholder: {
    height: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 11,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
  emptyTabCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTabText: {
    fontSize: 14,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // Empty Auth State
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  signInBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  signInBtnText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
