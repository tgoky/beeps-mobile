import CreateClubModal from "@/components/CreateClubModal";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useClubs, useJoinClub, useMyClubs } from "@/hooks/useClubs";
import { useUserRoles } from "@/hooks/useCommunities";
import { UserRole } from "@/types/database";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
// Calculate grid item width: (Screen Width - Padding - Gap) / 3
const GAP = 12;
const PADDING = 20;
const GRID_ITEM_WIDTH = (width - PADDING * 2 - GAP * 2) / 3;

// 🎨 BLACK THEME with Brand Accent #f59e0b
const COLORS = {
  background: "#000000", // Pure Black background
  cardBlack: "#0A0A0A", // Slightly lighter black for cards
  pureWhite: "#FFFFFF", // White text
  offWhite: "#F5F5F5", // Off white for secondary text
  textGrey: "#888888", // Grey text
  lightGrey: "#1A1A1A", // Dark grey for borders
  border: "#222222", // Border color
  // Brand accent
  accent: "#f59e0b", // Amber/Orange brand color
  // Accents matching the "Bill Payments" icons (keeping original colors)
  green: "#00C853", // Glo/Electricity
  red: "#D50000", // Airtel
  yellow: "#FFD600", // MTN
  blue: "#2962FF", // Button Blue
  orange: "#FF6D00",
};

// Map Roles to simple icon colors (keeping original colors)
const ROLE_CONFIG: Record<
  UserRole,
  { name: string; icon: string; color: string }
> = {
  ARTIST: { name: "Artist", icon: "microphone", color: COLORS.red },
  PRODUCER: { name: "Producer", icon: "fader", color: COLORS.blue },
  STUDIO_OWNER: { name: "Studio", icon: "domain", color: COLORS.green },
  GEAR_SELLER: { name: "Gear", icon: "guitar-pick", color: COLORS.orange },
  LYRICIST: { name: "Writer", icon: "pencil", color: COLORS.yellow },
};

export default function CommunityScreen() {
  const { user } = useAuth();
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
  const { data: myClubs, refetch: refetchMyClubs } = useMyClubs(user?.id);
  const { data: userRoles } = useUserRoles(user?.id);
  const joinClub = useJoinClub();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchClubs(), refetchMyClubs()]);
    setRefreshing(false);
  };

  // 1. HEADER SECTION
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.headerLabel}>Current Location</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={COLORS.offWhite} />
          <Text style={styles.headerTitle}>Lagos, Nigeria</Text>
        </View>
      </View>
      <NotificationBell />
    </View>
  );

  // 2. CARD SECTION (Updated with brand accent)
  const renderHeroSection = () => (
    <View style={styles.heroContainer}>
      <View style={styles.blackCard}>
        <View style={styles.blackCardTop}>
          <Text style={styles.blackCardLabel}>COMMUNITY STATUS</Text>
          <View style={styles.historyPill}>
            <Text style={styles.historyText}>History</Text>
            <Ionicons name="chevron-down" size={12} color={COLORS.black} />
          </View>
        </View>

        <Text style={styles.welcomeText}>
          Hello, {user?.fullName?.split(" ")[0]}
        </Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currencySymbol}>Active in</Text>
          <Text style={styles.balanceAmount}>{myClubs?.length || 0}</Text>
          <Ionicons
            name="eye"
            size={20}
            color="#666"
            style={{ marginLeft: 10 }}
          />
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          {userRoles?.slice(0, 4).map((role) => (
            <TouchableOpacity
              key={role}
              style={styles.actionItem}
              onPress={() => router.push(`/community/${role.toLowerCase()}`)}
            >
              <View
                style={[
                  styles.actionIconBox,
                  { backgroundColor: "rgba(245, 158, 11, 0.2)" },
                ]}
              >
                <MaterialCommunityIcons
                  name={(ROLE_CONFIG[role]?.icon as any) || "star"}
                  size={24}
                  color={COLORS.accent}
                />
              </View>
              <Text style={styles.actionText}>{ROLE_CONFIG[role]?.name}</Text>
            </TouchableOpacity>
          ))}

          {/* If no roles, show default actions */}
          {(!userRoles || userRoles.length === 0) && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/settings")}
            >
              <View
                style={[
                  styles.actionIconBox,
                  { backgroundColor: "rgba(245, 158, 11, 0.2)" },
                ]}
              >
                <Ionicons name="add" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.actionText}>Join Role</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // 3. PROMO BANNER (Updated with brand accent)
  const renderPromoBanner = () => (
    <View style={styles.promoContainer}>
      <View style={styles.promoContent}>
        <Text style={[styles.promoLabel, { color: "#000000" }]}>
          No active events yet
        </Text>
        <Text style={styles.promoTitle}>
          Start hosting your{"\n"}own events
        </Text>

        <TouchableOpacity
          style={[styles.promoButton, { backgroundColor: COLORS.accent }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.promoButtonText}>Create Club</Text>
        </TouchableOpacity>
      </View>

      {/* Visual Badge */}
      <View style={[styles.promoBadge, { backgroundColor: COLORS.accent }]}>
        <Text style={styles.promoBadgeText}>New</Text>
      </View>

      {/* Decorative Circle */}
      <View style={styles.promoDecoration}>
        <MaterialCommunityIcons
          name="party-popper"
          size={40}
          color={COLORS.accent}
        />
      </View>
    </View>
  );

  // 4. GRID SECTION
  const renderClubsGrid = () => {
    if (clubsLoading)
      return (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      );

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Explore Communities</Text>

        <View style={styles.gridContainer}>
          {clubs?.map((club) => (
            <TouchableOpacity
              key={club.id}
              style={styles.gridItem}
              onPress={() => router.push(`/club/${club.id}`)}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View style={styles.gridIconContainer}>
                <Text style={{ fontSize: 24 }}>{club.icon || "🎸"}</Text>
              </View>

              {/* Text */}
              <Text style={styles.gridLabel} numberOfLines={1}>
                {club.name}
              </Text>

              {/* Optional "New" or "Hot" Badge */}
              {club.memberCount > 50 && (
                <View
                  style={[styles.gridBadge, { backgroundColor: COLORS.accent }]}
                >
                  <Text style={styles.gridBadgeText}>Hot</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* "See More" placeholder item */}
          <TouchableOpacity style={styles.gridItem}>
            <View
              style={[styles.gridIconContainer, { backgroundColor: "#222" }]}
            >
              <Ionicons name="grid" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.gridLabel}>All Clubs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <SafeAreaView style={{ flex: 1 }}>
        {renderHeader()}

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
            />
          }
        >
          {renderHeroSection()}
          {renderPromoBanner()}
          {renderClubsGrid()}
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: COLORS.accent }]}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={28} color={COLORS.pureWhite} />
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
    backgroundColor: COLORS.background,
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLabel: {
    fontSize: 12,
    color: COLORS.textGrey,
    fontWeight: "600",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.offWhite,
  },

  // Black Card (Hero)
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  blackCard: {
    backgroundColor: "#343029",
    borderRadius: 24,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blackCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  blackCardLabel: {
    color: COLORS.textGrey,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  historyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.pureWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.black,
  },
  welcomeText: {
    color: COLORS.offWhite,
    fontSize: 14,
    fontWeight: "500",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  currencySymbol: {
    color: COLORS.offWhite,
    fontSize: 20,
    fontWeight: "600",
    marginRight: 8,
  },
  balanceAmount: {
    color: COLORS.pureWhite,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionItem: {
    alignItems: "center",
    gap: 8,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  actionText: {
    color: COLORS.offWhite,
    fontSize: 12,
    fontWeight: "600",
  },

  // Promo Banner
  promoContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#b7a88e",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  promoContent: {
    flex: 1,
    zIndex: 2,
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.offWhite,
    lineHeight: 22,
    marginBottom: 12,
  },
  promoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  promoButtonText: {
    color: COLORS.pureWhite,
    fontWeight: "700",
    fontSize: 12,
  },
  promoDecoration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-10deg" }],
  },
  promoBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 3,
  },
  promoBadgeText: {
    color: COLORS.pureWhite,
    fontSize: 10,
    fontWeight: "700",
  },

  // Grid Section
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.offWhite,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH,
    backgroundColor: "#474137",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  gridIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.offWhite,
    textAlign: "center",
  },
  gridBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridBadgeText: {
    fontSize: 8,
    color: COLORS.pureWhite,
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
