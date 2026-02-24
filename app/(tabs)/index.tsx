import { NotificationBell } from "@/components/NotificationBell";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBeats } from "@/hooks/useBeats";
import { useProducers } from "@/hooks/useProducers";
import { useStudios } from "@/hooks/useStudios";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
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
const HERO_HEIGHT = 200;
const STUDIO_CARD_WIDTH = width * 0.7;
const PRODUCER_AVATAR_SIZE = 80;
const BEAT_CARD_WIDTH = (width - Spacing.lg * 2 - 12) / 2;

const CATEGORIES = [
  { key: "studios", label: "Studios", icon: "home-sound-in-out" as const, gradient: ["#6366F1", "#8B5CF6"] },
  { key: "producers", label: "Producers", icon: "fader" as const, gradient: ["#3B82F6", "#06B6D4"] },
  { key: "artists", label: "Artists", icon: "microphone-variant" as const, gradient: ["#EC4899", "#F43F5E"] },
  { key: "beats", label: "Beats", icon: "music" as const, gradient: ["#F59E0B", "#EF4444"] },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";

  const { data: studios, isLoading: studiosLoading, refetch: refetchStudios } = useStudios();
  const { data: producers, isLoading: producersLoading, refetch: refetchProducers } = useProducers();
  const { data: beats, isLoading: beatsLoading, refetch: refetchBeats } = useBeats();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStudios(), refetchProducers(), refetchBeats()]);
    setRefreshing(false);
  };

  // Derived data
  const featuredStudio = useMemo(() => {
    if (!studios || studios.length === 0) return null;
    // Pick the highest rated studio as featured
    return [...studios].sort((a, b) => b.rating - a.rating)[0];
  }, [studios]);

  const topStudios = useMemo(() => {
    if (!studios) return [];
    return [...studios].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [studios]);

  const topProducers = useMemo(() => {
    if (!producers) return [];
    return [...producers]
      .sort((a, b) => (b.user?.followersCount || 0) - (a.user?.followersCount || 0))
      .slice(0, 10);
  }, [producers]);

  const recentBeats = useMemo(() => {
    if (!beats) return [];
    return beats.slice(0, 6);
  }, [beats]);

  if (!user) return null;

  const firstName = (user.fullName || user.username || "").split(" ")[0];

  const handleCategoryPress = (key: string) => {
    if (key === "beats") {
      router.push("/(tabs)/hub");
    } else {
      router.push("/explore");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {firstName || "Creator"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push("/explore")}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.notifBtn, { backgroundColor: colors.backgroundSecondary }]}>
              <NotificationBell size={20} color={colors.text} />
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Search Bar (navigates to explore) */}
          <TouchableOpacity
            style={[styles.searchBarButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push("/explore")}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>
              Search studios, producers, artists...
            </Text>
          </TouchableOpacity>

          {/* Hero Banner - Featured Studio */}
          {featuredStudio && (
            <TouchableOpacity
              style={styles.heroContainer}
              activeOpacity={0.9}
              onPress={() => router.push(`/studio/${featuredStudio.id}`)}
            >
              <Image
                source={{
                  uri:
                    featuredStudio.imageUrl ||
                    "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=800&q=80",
                }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.heroGradient}
              >
                <View style={styles.heroBadge}>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text style={styles.heroBadgeText}>Featured</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {featuredStudio.name}
                </Text>
                <View style={styles.heroMeta}>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.heroMetaText}>
                      {featuredStudio.city || featuredStudio.location || "Local"}
                    </Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.heroMetaText}>
                      {featuredStudio.rating.toFixed(1)}
                    </Text>
                  </View>
                  {featuredStudio.hourlyRate > 0 && (
                    <View style={styles.heroMetaItem}>
                      <Text style={styles.heroPrice}>
                        ${featuredStudio.hourlyRate}/hr
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Category Pills */}
          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.categoryPill}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(cat.key)}
                >
                  <LinearGradient
                    colors={cat.gradient}
                    style={styles.categoryIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={22}
                      color="#fff"
                    />
                  </LinearGradient>
                  <Text
                    style={[styles.categoryLabel, { color: colors.text }]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Top Rated Studios - Horizontal Scroll */}
          {topStudios.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Top Rated Studios
                </Text>
                <TouchableOpacity onPress={() => router.push("/explore")}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {topStudios.map((studio) => (
                  <TouchableOpacity
                    key={studio.id}
                    style={[
                      styles.studioCard,
                      { backgroundColor: colors.card },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/studio/${studio.id}`)}
                  >
                    <Image
                      source={{
                        uri:
                          studio.imageUrl ||
                          "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=400&q=80",
                      }}
                      style={styles.studioCardImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.studioCardContent}>
                      <Text
                        style={[styles.studioCardName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {studio.name}
                      </Text>
                      <View style={styles.studioCardMeta}>
                        <Ionicons
                          name="location-sharp"
                          size={11}
                          color={colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.studioCardLocation,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {studio.city || "Local"}
                        </Text>
                      </View>
                      <View style={styles.studioCardFooter}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text style={styles.ratingText}>
                            {studio.rating.toFixed(1)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.studioCardPrice,
                            { color: colors.text },
                          ]}
                        >
                          {studio.hourlyRate > 0
                            ? `$${studio.hourlyRate}`
                            : "Contact"}
                          {studio.hourlyRate > 0 && (
                            <Text
                              style={{
                                fontSize: 10,
                                color: colors.textTertiary,
                                fontWeight: "400",
                              }}
                            >
                              /hr
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Popular Producers - Circle Avatars */}
          {topProducers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Popular Producers
                </Text>
                <TouchableOpacity onPress={() => router.push("/explore")}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {topProducers.map((producer) => {
                  const name =
                    producer.user?.fullName ||
                    producer.user?.username ||
                    "Unknown";
                  const avatarUrl =
                    producer.user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
                  const genres = producer.genres?.slice(0, 2) || [];

                  return (
                    <TouchableOpacity
                      key={producer.id}
                      style={styles.producerItem}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push(`/producer/${producer.userId}`)
                      }
                    >
                      <View
                        style={[
                          styles.producerAvatarRing,
                          { borderColor: colors.border },
                        ]}
                      >
                        <Image
                          source={{ uri: avatarUrl }}
                          style={styles.producerAvatar}
                          contentFit="cover"
                          transition={200}
                        />
                      </View>
                      <Text
                        style={[
                          styles.producerName,
                          { color: colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {name.split(" ")[0]}
                      </Text>
                      {genres.length > 0 && (
                        <Text
                          style={[
                            styles.producerGenre,
                            { color: colors.textTertiary },
                          ]}
                          numberOfLines={1}
                        >
                          {genres[0]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Fresh Beats */}
          {recentBeats.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Fresh Beats
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/hub")}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.beatsGrid}>
                {recentBeats.map((beat) => {
                  const producerName =
                    beat.producer?.fullName ||
                    beat.producer?.username ||
                    "Unknown";
                  return (
                    <TouchableOpacity
                      key={beat.id}
                      style={[
                        styles.beatCard,
                        { backgroundColor: colors.card },
                      ]}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          beat.genres?.includes("Hip Hop")
                            ? ["#8B5CF6", "#6366F1"]
                            : beat.genres?.includes("R&B")
                              ? ["#EC4899", "#8B5CF6"]
                              : beat.genres?.includes("Pop")
                                ? ["#06B6D4", "#3B82F6"]
                                : ["#F59E0B", "#EF4444"]
                        }
                        style={styles.beatCardCover}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <MaterialCommunityIcons
                          name="music"
                          size={28}
                          color="rgba(255,255,255,0.6)"
                        />
                        <View style={styles.beatPlaysBadge}>
                          <Ionicons
                            name="play"
                            size={9}
                            color="rgba(255,255,255,0.9)"
                          />
                          <Text style={styles.beatPlaysText}>
                            {beat.plays || 0}
                          </Text>
                        </View>
                      </LinearGradient>
                      <View style={styles.beatCardContent}>
                        <Text
                          style={[
                            styles.beatCardTitle,
                            { color: colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {beat.title}
                        </Text>
                        <Text
                          style={[
                            styles.beatCardProducer,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {producerName}
                        </Text>
                        <View style={styles.beatCardFooter}>
                          <Text
                            style={[
                              styles.beatCardPrice,
                              { color: colors.text },
                            ]}
                          >
                            ${beat.price}
                          </Text>
                          {beat.bpm && (
                            <Text
                              style={[
                                styles.beatCardBpm,
                                { color: colors.textTertiary },
                              ]}
                            >
                              {beat.bpm} BPM
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push("/(tabs)/hub")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#8B5CF620" }]}>
                  <MaterialCommunityIcons name="music-note-plus" size={22} color="#8B5CF6" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Browse Beats
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push("/(tabs)/bookings")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#10B98120" }]}>
                  <Ionicons name="calendar-outline" size={22} color="#10B981" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  My Bookings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push("/(tabs)/community")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#3B82F620" }]}>
                  <Ionicons name="people-outline" size={22} color="#3B82F6" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Community
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push("/(tabs)/profile")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#F59E0B20" }]}>
                  <Ionicons name="person-outline" size={22} color="#F59E0B" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  My Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search Bar Button
  searchBarButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginHorizontal: Spacing.lg,
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontWeight: "400",
  },

  // Hero Banner
  heroContainer: {
    marginHorizontal: Spacing.lg,
    height: HERO_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    justifyContent: "flex-end",
    padding: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: "#FCD34D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  heroPrice: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 20,
  },
  categoryPill: {
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 14,
  },

  // Studio Cards
  studioCard: {
    width: STUDIO_CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  studioCardImage: {
    width: "100%",
    height: STUDIO_CARD_WIDTH * 0.55,
  },
  studioCardContent: {
    padding: 12,
  },
  studioCardName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  studioCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 8,
  },
  studioCardLocation: {
    fontSize: 12,
    flex: 1,
  },
  studioCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  studioCardPrice: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Producer Avatars
  producerItem: {
    alignItems: "center",
    width: PRODUCER_AVATAR_SIZE + 20,
  },
  producerAvatarRing: {
    width: PRODUCER_AVATAR_SIZE,
    height: PRODUCER_AVATAR_SIZE,
    borderRadius: PRODUCER_AVATAR_SIZE / 2,
    borderWidth: 2,
    padding: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  producerAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: PRODUCER_AVATAR_SIZE / 2,
  },
  producerName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  producerGenre: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 1,
  },

  // Beat Cards
  beatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: Spacing.lg,
  },
  beatCard: {
    width: BEAT_CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  beatCardCover: {
    height: BEAT_CARD_WIDTH * 0.75,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  beatPlaysBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  beatPlaysText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "600",
  },
  beatCardContent: {
    padding: 10,
  },
  beatCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  beatCardProducer: {
    fontSize: 11,
    marginBottom: 6,
  },
  beatCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  beatCardPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  beatCardBpm: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: Spacing.lg,
  },
  quickAction: {
    width: (width - Spacing.lg * 2 - 12) / 2,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
