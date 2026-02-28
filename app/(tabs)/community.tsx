import CreateClubModal from "@/components/CreateClubModal";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useClubs, useMyClubs } from "@/hooks/useClubs";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// 1. IMPORT MANROPE
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";

const { width } = Dimensions.get("window");
const GAP = 12;
const PADDING = 20;
const GRID_ITEM_WIDTH = (width - PADDING * 2 - GAP * 2) / 3;

const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  pureWhite: "#FFFFFF",
  offWhite: "#F5F5F5",
  textGrey: "#888888",
  lightGrey: "#1A1A1A",
  border: "#222222",
  accent: "#f59e0b",
  badgeBlue: "#2563eb",
};

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // 2. LOAD FONTS
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: clubs,
    isLoading: clubsLoading,
    refetch: refetchClubs,
  } = useClubs();
  const { data: myClubs, refetch: refetchMyClubs } = useMyClubs(user?.id);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchClubs(), refetchMyClubs()]);
    setRefreshing(false);
  };

  const filteredClubs = clubs?.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

        <View style={styles.badgeRow}>
          <TouchableOpacity
            style={styles.blueBadge}
            onPress={() => router.push(`/community/artist`)}
          >
            <View style={styles.patternContainer}>
              <MaterialCommunityIcons
                name="waveform"
                size={90}
                color="rgba(255,255,255,0.2)"
              />
            </View>
            <Text style={styles.blueBadgeText}>ARTISTS{"\n"}COMMUNITY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueBadge}
            onPress={() => router.push(`/community/producer`)}
          >
            <View
              style={[styles.patternContainer, { right: -10, bottom: -20 }]}
            >
              <MaterialCommunityIcons
                name="tune"
                size={90}
                color="rgba(255,255,255,0.2)"
              />
            </View>
            <Text style={styles.blueBadgeText}>PRODUCERS{"\n"}COMMUNITY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPromoBanner = () => (
    <View style={styles.promoContainer}>
      <View style={styles.promoPatternContainer}>
        <MaterialCommunityIcons
          name="playlist-music"
          size={120}
          color="rgba(0,0,0,0.06)"
        />
      </View>

      <View style={styles.promoContent}>
        <Text style={[styles.promoLabel, { color: "#000000" }]}>
          JOIN CLUBS & COMMUNITIES
        </Text>
        <Text style={styles.promoTitle}>
          GET CREATIVE{"\n"}CREATE YOUR MAGIC!
        </Text>

        <TouchableOpacity
          style={[styles.promoButton, { backgroundColor: COLORS.accent }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.promoButtonText}>JOIN CLUB</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.promoBadge, { backgroundColor: COLORS.accent }]}>
        <Text style={styles.promoBadgeText}>NEW</Text>
      </View>

      <View style={styles.promoDecoration}>
        <MaterialCommunityIcons
          name="party-popper"
          size={40}
          color={COLORS.accent}
        />
      </View>
    </View>
  );

  const renderMyClubsSection = () => {
    if (clubsLoading) return null;
    const myClubsList = myClubs || [];
    if (myClubsList.length === 0) return null;

    const DISPLAY_LIMIT = 6;
    const shouldTruncate = myClubsList.length > DISPLAY_LIMIT;
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
          {shouldTruncate && (
            <Text
              style={{
                color: COLORS.accent,
                fontSize: 12,
                fontFamily: "Manrope_700Bold",
              }}
            >
              SEE ALL
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
              <View style={styles.gridIconContainer}>
                <Text style={{ fontSize: 24 }}>{club.icon || "🎸"}</Text>
              </View>
              <Text style={styles.gridLabel} numberOfLines={1}>
                {club.name}
              </Text>
            </TouchableOpacity>
          ))}

          {shouldTruncate && (
            <TouchableOpacity
              style={[
                styles.gridItem,
                { backgroundColor: "#222", borderColor: COLORS.accent },
              ]}
              onPress={() => router.push("/my-clubs")}
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
                    fontFamily: "Manrope_800ExtraBold",
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
                <View style={styles.gridIconContainer}>
                  <Text style={{ fontSize: 24 }}>{club.icon || "🎸"}</Text>
                </View>
                <Text style={styles.gridLabel} numberOfLines={1}>
                  {club.name}
                </Text>
                {club.memberCount > 50 && (
                  <View
                    style={[
                      styles.gridBadge,
                      { backgroundColor: COLORS.accent },
                    ]}
                  >
                    <Text style={styles.gridBadgeText}>HOT</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
    fontFamily: "Manrope_500Medium",
  },
  clearButton: {
    marginRight: 12,
  },
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
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
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
    color: COLORS.black,
    fontFamily: "Manrope_800ExtraBold",
  },
  welcomeText: {
    color: COLORS.offWhite,
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
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
    marginRight: 8,
    fontFamily: "Manrope_600SemiBold",
  },
  balanceAmount: {
    color: COLORS.pureWhite,
    fontSize: 32,
    letterSpacing: -1,
    fontFamily: "Manrope_800ExtraBold",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 5,
  },
  blueBadge: {
    flex: 1,
    backgroundColor: COLORS.badgeBlue,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 90,
    overflow: "hidden",
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
    lineHeight: 22,
    zIndex: 2,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  patternContainer: {
    position: "absolute",
    right: -15,
    bottom: -15,
    transform: [{ rotate: "-15deg" }],
  },
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
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    fontFamily: "Manrope_800ExtraBold",
  },
  promoTitle: {
    fontSize: 18,
    color: COLORS.offWhite,
    lineHeight: 22,
    marginBottom: 12,
    textTransform: "uppercase",
    fontFamily: "Manrope_800ExtraBold",
  },
  promoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  promoButtonText: {
    color: COLORS.pureWhite,
    fontSize: 12,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
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
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.offWhite,
    marginBottom: 16,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
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
    fontSize: 11,
    color: COLORS.offWhite,
    textAlign: "center",
    fontFamily: "Manrope_600SemiBold",
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
    fontFamily: "Manrope_800ExtraBold",
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noResultsText: {
    color: COLORS.textGrey,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Manrope_500Medium",
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
