import CreateClubModal from "@/components/CreateClubModal";
import { NotificationBell } from "@/components/NotificationBell";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useClubs, useJoinClub, useMyClubs } from "@/hooks/useClubs";
import { useUserRoles } from "@/hooks/useCommunities";
import { UserRole } from "@/types/database";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.6; // Reduced from 0.75
const GAP = 12;

// Refined color palette
const ROLE_CONFIG: Record<
  UserRole,
  {
    name: string;
    icon: string;
    gradient: string[];
    accent: string;
  }
> = {
  ARTIST: {
    name: "Artists",
    icon: "microphone-variant",
    gradient: ["#7C3AED", "#9F7AEA"],
    accent: "#9F7AEA",
  },
  PRODUCER: {
    name: "Producers",
    icon: "fader",
    gradient: ["#2563EB", "#60A5FA"],
    accent: "#60A5FA",
  },
  STUDIO_OWNER: {
    name: "Studios",
    icon: "home-sound-in-out",
    gradient: ["#059669", "#34D399"],
    accent: "#34D399",
  },
  GEAR_SELLER: {
    name: "Gear",
    icon: "guitar-electric",
    gradient: ["#D97706", "#FBBF24"],
    accent: "#FBBF24",
  },
  LYRICIST: {
    name: "Writers",
    icon: "pencil-ruler",
    gradient: ["#DB2777", "#F472B6"],
    accent: "#F472B6",
  },
};

export default function CommunityScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const router = useRouter();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

  // Data Hooks
  const {
    data: clubs,
    isLoading: clubsLoading,
    refetch: refetchClubs,
  } = useClubs();
  const {
    data: myClubs,
    isLoading: myClubsLoading,
    refetch: refetchMyClubs,
  } = useMyClubs(user?.id);
  const { data: userRoles } = useUserRoles(user?.id);
  const joinClub = useJoinClub();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchClubs(), refetchMyClubs()]);
    setRefreshing(false);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  // --- RENDERERS ---

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        { backgroundColor: "#000000", opacity: headerOpacity },
      ]}
    >
      <Text style={styles.headerTitle}>Community</Text>
      <View style={styles.headerRight}>
        <NotificationBell />
      </View>
    </Animated.View>
  );

  // 1. Clean Roles Row
  const renderRolesRow = () => {
    if (!userRoles || userRoles.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your circles</Text>
          <Text style={styles.sectionCount}>{userRoles.length}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rolesScroll}
        >
          {userRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            if (!config) return null;

            return (
              <TouchableOpacity
                key={role}
                style={styles.roleItem}
                onPress={() => router.push(`/community/${role.toLowerCase()}`)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={config.gradient}
                  style={styles.roleCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={22}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <Text style={styles.roleName}>{config.name}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Create Role Button */}
          <TouchableOpacity
            style={styles.roleItem}
            onPress={() => router.push("/settings")}
          >
            <View style={[styles.roleCircle, styles.createRoleCircle]}>
              <Ionicons name="add" size={22} color="#6B7280" />
            </View>
            <Text style={[styles.roleName, styles.createRoleText]}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // 2. Featured Clubs - Clean and minimal
  const renderFeaturedClubs = () => {
    if (clubsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      );
    }

    if (!clubs || clubs.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + GAP}
        >
          {clubs.slice(0, 5).map((club, index) => (
            <TouchableOpacity
              key={club.id}
              style={styles.featuredCard}
              onPress={() => router.push(`/club/${club.id}`)}
              activeOpacity={0.9}
            >
              <View style={styles.featuredImageContainer}>
                <LinearGradient
                  colors={["#1A1A1A", "#0A0A0A"]}
                  style={styles.featuredImage}
                >
                  <Text style={styles.featuredEmoji}>{club.icon || "🎸"}</Text>
                </LinearGradient>
              </View>

              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={1}>
                  {club.name}
                </Text>
                <View style={styles.featuredMeta}>
                  <Ionicons name="people-outline" size={12} color="#6B7280" />
                  <Text style={styles.featuredMetaText}>
                    {club.memberCount || 128} members
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 3. All Clubs - Clean list
  const renderAllClubs = () => {
    if (!clubs) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discover</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {clubs.map((club) => {
            const isMember = myClubs?.some((mc: any) => mc.id === club.id);

            return (
              <TouchableOpacity
                key={club.id}
                style={styles.listCard}
                onPress={() => router.push(`/club/${club.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.listIconContainer}>
                  <LinearGradient
                    colors={["#1A1A1A", "#0F0F0F"]}
                    style={styles.listIcon}
                  >
                    <Text style={styles.listEmoji}>{club.icon || "🎸"}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {club.name}
                  </Text>
                  <Text style={styles.listMeta}>
                    {club.memberCount || 0} members
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.joinButton, isMember && styles.joinedButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!isMember && user?.id) {
                      joinClub.mutate({ clubId: club.id, userId: user.id });
                    }
                  }}
                  disabled={isMember}
                >
                  <Text
                    style={[
                      styles.joinButtonText,
                      isMember && styles.joinedButtonText,
                    ]}
                  >
                    {isMember ? "✓" : "+"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <SafeAreaView style={{ flex: 1 }}>
        {renderHeader()}

        <Animated.ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
            />
          }
        >
          {/* Minimal Header */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.fullName?.split(" ")[0] || "Creator"}
            </Text>
          </View>

          {/* Roles Section */}
          {renderRolesRow()}

          {/* Featured Section */}
          {renderFeaturedClubs()}

          {/* All Clubs List */}
          {renderAllClubs()}

          <View style={{ height: 100 }} />
        </Animated.ScrollView>

        {/* Clean FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F3F4F6"]}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={24} color="#000000" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      {user && (
        <CreateClubModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          userId={user.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },

  // Welcome
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "400",
  },
  userName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // Sections
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  seeAllText: {
    color: "#9CA3AF",
    fontWeight: "500",
    fontSize: 14,
  },

  // Loading
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },

  // Roles Row
  rolesScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  roleItem: {
    alignItems: "center",
    gap: 6,
    width: 64,
  },
  roleCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createRoleCircle: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderStyle: "dashed",
  },
  roleName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  createRoleText: {
    color: "#6B7280",
  },

  // Featured Cards
  featuredScroll: {
    paddingHorizontal: 20,
    gap: GAP,
  },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: "#0A0A0A",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  featuredImageContainer: {
    aspectRatio: 1,
    width: "100%",
  },
  featuredImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredEmoji: {
    fontSize: 40,
  },
  featuredContent: {
    padding: 14,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredMetaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  // List Cards
  listContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  listIconContainer: {
    marginRight: 14,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  listEmoji: {
    fontSize: 24,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  listMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  joinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  joinedButton: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  joinButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    lineHeight: 22,
  },
  joinedButtonText: {
    color: "#9CA3AF",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
