import CreateClubModal from "@/components/CreateClubModal";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Colors,
  Spacing
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const FEATURED_CARD_WIDTH = width * 0.75;

type CommunityTab = "feed" | "clubs" | "communities";

// Role Config with Gradient Colors
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
  const [activeTab, setActiveTab] = useState<CommunityTab>("clubs"); // Default to clubs for better demo
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Fetch data
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs(user?.id);
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(user?.id);
  const joinClub = useJoinClub();

  // --- RENDER HELPERS ---

  const renderTabs = () => (
    <View style={styles.tabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {[
          { key: "feed", label: "Feed", icon: "newspaper-variant-outline" },
          { key: "clubs", label: "Clubs", icon: "account-group-outline" },
          {
            key: "communities",
            label: "Roles",
            icon: "shield-account-outline",
          },
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
            onPress={() => setActiveTab(tab.key as CommunityTab)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={18}
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
  );

  const renderClubs = () => {
    if (clubsLoading)
      return (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      );

    if (!clubs || clubs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-group"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Clubs Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start a movement. Create the first club.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>Create Club</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.clubsContainer}>
        {/* Featured / Trending Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Trending Now
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
        >
          {clubs.slice(0, 3).map((club, index) => (
            <TouchableOpacity
              key={club.id}
              style={[styles.featuredCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/club/${club.id}`)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  index % 2 === 0
                    ? ["#8B5CF6", "#6366F1"]
                    : ["#EC4899", "#8B5CF6"]
                }
                style={styles.featuredCover}
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
                <Text
                  style={[
                    styles.featuredSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {club.memberCount || 0} Members
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
          <View
            style={[styles.createIconBox, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </View>
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

        {/* All Clubs List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Discover
          </Text>
        </View>

        {clubs.map((club) => {
          const isMember = myClubs?.some((mc: any) => mc.id === club.id);
          return (
            <TouchableOpacity
              key={club.id}
              style={[
                styles.clubListCard,
                { backgroundColor: colors.card, borderColor: colors.border },
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
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
                      {club.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tagBadge,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Text
                      style={[styles.tagText, { color: colors.textSecondary }]}
                    >
                      {club.type}
                    </Text>
                  </View>
                </View>

                <View style={styles.listFooter}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                      {club.memberCount || 0}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.miniJoinBtn,
                      isMember
                        ? {
                            backgroundColor: "transparent",
                            borderWidth: 1,
                            borderColor: colors.border,
                          }
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
                        styles.miniJoinText,
                        { color: isMember ? colors.text : colors.background },
                      ]}
                    >
                      {isMember ? "Joined" : "Join"}
                    </Text>
                  </TouchableOpacity>
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
          <MaterialCommunityIcons
            name="shield-account-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Roles Found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Complete your profile setup to unlock role-based communities.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.communitiesContainer}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
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
                  { backgroundColor: colors.card, borderColor: colors.border },
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

                <View style={styles.roleArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.textTertiary}
                  />
                </View>
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
            <NotificationBell size={24} color={colors.text} />
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              onPress={() => setCreateModalVisible(true)}
            >
              <Ionicons name="add" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Main Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === "feed" && (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.wipCircle,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Ionicons
                  name="newspaper-outline"
                  size={40}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Feed Coming Soon
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                A personalized feed of your clubs and community updates is in
                the works.
              </Text>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => setActiveTab("clubs")}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: colors.text }]}
                >
                  Browse Clubs
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
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

  // Content General
  content: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Featured Clubs
  featuredScroll: {
    gap: 12,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
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
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  featuredSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Create Banner
  createBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
    gap: 16,
  },
  createIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  createBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  createBannerText: {
    fontSize: 13,
  },

  // Club List Item
  clubsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  clubListCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },
  listCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
    marginBottom: 8,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  listFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniJoinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniJoinText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Communities / Roles
  communitiesContainer: {
    paddingHorizontal: Spacing.lg,
  },
  infoText: {
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
    borderWidth: 1,
  },
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
  roleArrow: {
    marginLeft: 8,
  },

  // Empty States
  emptyState: {
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  wipCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
