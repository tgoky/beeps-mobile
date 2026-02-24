import CreateClubModal from "@/components/CreateClubModal";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Colors,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useClubs, useJoinClub, useMyClubs } from "@/hooks/useClubs";
import { useUserRoles } from "@/hooks/useCommunities";
import { UserRole } from "@/types/database";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const FEATURED_CARD_WIDTH = width * 0.72;

type CommunityTab = "clubs" | "communities";

const ROLE_CONFIG: Record<
  UserRole,
  {
    name: string;
    icon: string;
    gradient: string[];
    description: string;
  }
> = {
  ARTIST: {
    name: "Artists",
    icon: "microphone-variant",
    gradient: ["#A855F7", "#7C3AED"],
    description: "Vocalists & Performers",
  },
  PRODUCER: {
    name: "Producers",
    icon: "fader",
    gradient: ["#3B82F6", "#2563EB"],
    description: "Beat Makers & Engineers",
  },
  STUDIO_OWNER: {
    name: "Studios",
    icon: "home-sound-in-out",
    gradient: ["#10B981", "#059669"],
    description: "Space Owners",
  },
  GEAR_SELLER: {
    name: "Gear",
    icon: "guitar-electric",
    gradient: ["#F59E0B", "#D97706"],
    description: "Equipment Specialists",
  },
  LYRICIST: {
    name: "Writers",
    icon: "pencil-ruler",
    gradient: ["#EC4899", "#DB2777"],
    description: "Songwriters & Poets",
  },
};

export default function CommunityScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommunityTab>("clubs");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: clubs, isLoading: clubsLoading, refetch: refetchClubs } = useClubs();
  const { data: myClubs, isLoading: myClubsLoading, refetch: refetchMyClubs } = useMyClubs(user?.id);
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(user?.id);
  const joinClub = useJoinClub();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchClubs(), refetchMyClubs()]);
    setRefreshing(false);
  };

  const renderClubs = () => {
    if (clubsLoading)
      return (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      );

    if (!clubs || clubs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons
              name="account-group"
              size={40}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Clubs Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start a movement. Create the first club.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.text }]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>
              Create Club
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.clubsContainer}>
        {/* Trending Horizontal */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Trending
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
        >
          {clubs.slice(0, 4).map((club, index) => {
            const gradients = [
              ["#8B5CF6", "#6366F1"],
              ["#EC4899", "#8B5CF6"],
              ["#3B82F6", "#06B6D4"],
              ["#10B981", "#059669"],
            ];
            return (
              <TouchableOpacity
                key={club.id}
                style={[styles.featuredCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/club/${club.id}`)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={gradients[index % gradients.length]}
                  style={styles.featuredCover}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.featuredIcon}>{club.icon || "🎵"}</Text>
                </LinearGradient>
                <View style={styles.featuredContent}>
                  <Text
                    style={[styles.featuredTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {club.name}
                  </Text>
                  <View style={styles.featuredMeta}>
                    <Ionicons
                      name="people-outline"
                      size={12}
                      color={colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.featuredSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {club.memberCount || 0} Members
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Create CTA */}
        <TouchableOpacity
          style={[
            styles.createBanner,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setCreateModalVisible(true)}
        >
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            style={styles.createIconBox}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.createBannerTitle, { color: colors.text }]}>
              Start a Club
            </Text>
            <Text
              style={[styles.createBannerText, { color: colors.textSecondary }]}
            >
              Build your own community
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        {/* All Clubs */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Discover
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
            {clubs.length} clubs
          </Text>
        </View>

        {clubs.map((club) => {
          const isMember = myClubs?.some((mc: any) => mc.id === club.id);
          return (
            <TouchableOpacity
              key={club.id}
              style={[
                styles.clubListCard,
                { backgroundColor: colors.card },
              ]}
              onPress={() => router.push(`/club/${club.id}`)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.listCover,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{club.icon || "🎸"}</Text>
              </View>

              <View style={styles.listContent}>
                <View style={styles.listHeaderRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      style={[styles.listTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {club.name}
                    </Text>
                    <Text
                      style={[styles.listDesc, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {club.description || club.type}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.joinBtn,
                      isMember
                        ? { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border }
                        : { backgroundColor: colors.text },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (!isMember && user?.id)
                        joinClub.mutate({ clubId: club.id, userId: user.id });
                    }}
                    disabled={isMember}
                  >
                    <Text
                      style={[
                        styles.joinBtnText,
                        { color: isMember ? colors.textSecondary : colors.background },
                      ]}
                    >
                      {isMember ? "Joined" : "Join"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.listFooter}>
                  <View style={styles.memberCount}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color={colors.textTertiary}
                    />
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                      {club.memberCount || 0}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Text
                      style={[styles.typeText, { color: colors.textSecondary }]}
                    >
                      {club.type}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </View>
    );
  };

  const renderCommunities = () => {
    if (rolesLoading)
      return (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      );

    if (!userRoles || userRoles.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={40}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Roles Found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Complete your profile to unlock role-based communities.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.text }]}
            onPress={() => router.push("/settings")}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.communitiesContainer}>
        <Text style={[styles.rolesIntro, { color: colors.textSecondary }]}>
          Access exclusive spaces based on your profile roles.
        </Text>

        <View style={styles.rolesGrid}>
          {userRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            if (!config) return null;

            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleCard,
                  { backgroundColor: colors.card },
                ]}
                onPress={() => router.push(`/community/${role.toLowerCase()}`)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={config.gradient}
                  style={styles.roleIconCircle}
                >
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={24}
                    color="#fff"
                  />
                </LinearGradient>

                <View style={styles.roleContent}>
                  <Text style={[styles.roleTitle, { color: colors.text }]}>
                    {config.name}
                  </Text>
                  <Text
                    style={[styles.roleDesc, { color: colors.textSecondary }]}
                  >
                    {config.description}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Community
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Connect & Build
            </Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell size={22} color={colors.text} />
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              onPress={() => setCreateModalVisible(true)}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {[
              { key: "clubs" as CommunityTab, label: "Clubs", icon: "account-group-outline" },
              { key: "communities" as CommunityTab, label: "Roles", icon: "shield-account-outline" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key
                    ? { backgroundColor: colors.text, borderColor: colors.text }
                    : {
                        borderColor: colors.border,
                        backgroundColor: "transparent",
                      },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={17}
                  color={
                    activeTab === tab.key ? colors.background : colors.textSecondary
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab.key
                          ? colors.background
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === "clubs" && renderClubs()}
          {activeTab === "communities" && renderCommunities()}
        </ScrollView>

        {/* Modal */}
        {user && (
          <CreateClubModal
            visible={createModalVisible}
            onClose={() => setCreateModalVisible(false)}
            userId={user.id}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabsWrapper: {
    paddingBottom: Spacing.md,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },

  content: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Featured Clubs
  featuredScroll: {
    gap: 14,
    paddingRight: Spacing.lg,
    marginBottom: 24,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  featuredCover: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredIcon: {
    fontSize: 40,
  },
  featuredContent: {
    padding: 14,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredSubtitle: {
    fontSize: 12,
  },

  // Create Banner
  createBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 24,
    gap: 14,
  },
  createIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  createBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  createBannerText: {
    fontSize: 13,
    marginTop: 1,
  },

  // Club List
  clubsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  clubListCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  listCover: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
  },
  listFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Communities / Roles
  communitiesContainer: {
    paddingHorizontal: Spacing.lg,
  },
  rolesIntro: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  rolesGrid: {
    gap: 12,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  roleIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12,
  },

  // Empty States
  emptyState: {
    padding: 40,
    alignItems: "center",
    marginTop: 20,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
