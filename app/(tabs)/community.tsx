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
  TextInput,
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
  // New specific blue for the screenshot design
  badgeBlue: "#2563eb",
};

// Map Roles to simple icon colors (keeping original colors)
const ROLE_CONFIG: Record<
  UserRole,
  { name: string; displayName: string; icon: string; color: string }
> = {
  ARTIST: {
    name: "Artist",
    displayName: "Artist",
    icon: "microphone",
    color: COLORS.red,
  },
  PRODUCER: {
    name: "Producer",
    displayName: "Producer",
    icon: "fader",
    color: COLORS.blue,
  },
  STUDIO_OWNER: {
    name: "Studio",
    displayName: "Studio",
    icon: "domain",
    color: COLORS.green,
  },
  GEAR_SELLER: {
    name: "Gear",
    displayName: "Gear",
    icon: "guitar-pick",
    color: COLORS.orange,
  },
  LYRICIST: {
    name: "Writer",
    displayName: "Writer",
    icon: "pencil",
    color: COLORS.yellow,
  },
};

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter clubs based on search query
  const filteredClubs = clubs?.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 1. HEADER SECTION - Updated with Search Bar
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchSection}>
        <Ionicons
          name="search"
          size={20}
          color={COLORS.textGrey}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clubs..."
          placeholderTextColor={COLORS.textGrey}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.textGrey} />
          </TouchableOpacity>
        )}
      </View>
      <NotificationBell />
    </View>
  );

  // 2. CARD SECTION - Updated with Pattern Backgrounds
  const renderHeroSection = () => (
    <View style={styles.heroContainer}>
      <View style={styles.blackCard}>
        <View style={styles.blackCardTop}>
          <Text style={styles.blackCardLabel}>COMMUNITY STATUS</Text>
          <View style={styles.historyPill}>
            <Text style={styles.historyText}>Clubs Created</Text>
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

        {/* REPLACED SECTION: New Badge Design with Patterns */}
        <View style={styles.badgeRow}>
          {/* Artists Community Badge */}
          <TouchableOpacity
            style={styles.blueBadge}
            onPress={() => router.push(`/community/artist`)}
          >
            {/* Cool Pattern: Sound Wave - VISIBILITY INCREASED */}
            <View style={styles.patternContainer}>
              <MaterialCommunityIcons
                name="waveform"
                size={90}
                color="rgba(255,255,255,0.2)" // Increased opacity
              />
            </View>
            <Text style={styles.blueBadgeText}>Artists{"\n"}Community</Text>
          </TouchableOpacity>

          {/* Producers Community Badge */}
          <TouchableOpacity
            style={styles.blueBadge}
            onPress={() => router.push(`/community/producer`)}
          >
            {/* Cool Pattern: Sliders/Lines - VISIBILITY INCREASED */}
            <View
              style={[styles.patternContainer, { right: -10, bottom: -20 }]}
            >
              <MaterialCommunityIcons
                name="tune"
                size={90}
                color="rgba(255,255,255,0.2)" // Increased opacity
              />
            </View>
            <Text style={styles.blueBadgeText}>Producers{"\n"}Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // 3. PROMO BANNER (Updated with brand accent + Pattern)
  const renderPromoBanner = () => (
    <View style={styles.promoContainer}>
      {/* ADDED: Background Pattern for Promo */}
      <View style={styles.promoPatternContainer}>
        <MaterialCommunityIcons
          name="playlist-music"
          size={120}
          color="rgba(0,0,0,0.06)"
        />
      </View>

      <View style={styles.promoContent}>
        <Text style={[styles.promoLabel, { color: "#000000" }]}>
          join clubs & communities
        </Text>
        <Text style={styles.promoTitle}>
          Get creative and join{"\n"}create your magic!
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

  // 4. MY CLUBS SECTION - Updated with "See More" Logic
  const renderMyClubsSection = () => {
    if (clubsLoading) return null;

    const myClubsList = myClubs || [];
    if (myClubsList.length === 0) return null;

    // Logic: If user has > 6 clubs, show 5 clubs + 1 "See More" card.
    // If user has <= 6 clubs, show all of them.
    const DISPLAY_LIMIT = 6;
    const shouldTruncate = myClubsList.length > DISPLAY_LIMIT;

    // We display 5 real clubs if truncating (to make room for the 6th "See More" card),
    // otherwise we display all of them.
    const clubsToDisplay = shouldTruncate
      ? myClubsList.slice(0, 5)
      : myClubsList;

    const remainingCount = myClubsList.length - 5;

    return (
      <View style={styles.sectionContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
            My Clubs
          </Text>
          {/* Optional text link if preferred over card */}
          {shouldTruncate && (
            <Text
              style={{ color: COLORS.accent, fontSize: 12, fontWeight: "700" }}
            >
              See All
            </Text>
          )}
        </View>

        <View style={styles.gridContainer}>
          {clubsToDisplay.map((club) => (
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
            </TouchableOpacity>
          ))}

          {/* SEE MORE CARD: Only renders if shouldTruncate is true */}
          {shouldTruncate && (
            <TouchableOpacity
              style={[
                styles.gridItem,
                { backgroundColor: "#222", borderColor: COLORS.accent },
              ]}
              onPress={() => router.push("/my-clubs")} // Example route
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.gridIconContainer,
                  { backgroundColor: "transparent" },
                ]}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: COLORS.accent,
                    fontWeight: "800",
                  }}
                >
                  +{remainingCount}
                </Text>
              </View>
              <Text style={[styles.gridLabel, { color: COLORS.accent }]}>
                See More
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // 5. EXPLORE CLUBS SECTION
  const renderExploreClubsSection = () => {
    if (clubsLoading)
      return (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      );

    const displayClubs = filteredClubs || [];

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          Explore Clubs or Join Communities
        </Text>

        {displayClubs.length === 0 && searchQuery.length > 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No clubs found matching "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {displayClubs.map((club) => (
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
                    style={[
                      styles.gridBadge,
                      { backgroundColor: COLORS.accent },
                    ]}
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
        )}
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
          {renderMyClubsSection()}
          {renderExploreClubsSection()}
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
    gap: 12,
  },
  searchSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBlack,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.offWhite,
    fontSize: 15,
    paddingHorizontal: 8,
    height: "100%",
  },
  clearButton: {
    marginRight: 12,
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

  // NEW STYLES FOR SCREENSHOT LOOKING BUTTONS WITH PATTERNS
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 5,
  },
  blueBadge: {
    flex: 1,
    backgroundColor: COLORS.badgeBlue, // The blue from screenshot
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "center", // Text centered vertically
    minHeight: 90,
    overflow: "hidden", // Clips the large pattern icons
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  blueBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
    zIndex: 2, // Ensures text is above the pattern
  },
  patternContainer: {
    position: "absolute",
    right: -15,
    bottom: -15,
    // Removed Opacity container, used Color Alpha instead
    transform: [{ rotate: "-15deg" }],
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
  promoPatternContainer: {
    position: "absolute",
    left: -20,
    bottom: -30,
    opacity: 1,
    zIndex: 1,
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
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noResultsText: {
    color: COLORS.textGrey,
    fontSize: 14,
    textAlign: "center",
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
