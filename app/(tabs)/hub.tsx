import CreateCollaborationModal from "@/components/CreateCollaborationModal";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Colors,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBeats } from "@/hooks/useBeats";
import {
  useCollaborations,
  useCreateCollaboration,
} from "@/hooks/useCollaborations";
import { useEquipment } from "@/hooks/useEquipment";
import { CollaborationType } from "@/types/database";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - Spacing.lg * 2 - CARD_GAP) / 2;
const FEATURED_WIDTH = width - Spacing.lg * 2;

type HubTab = "collabs" | "beats" | "equipment" | "deals" | "bids";

export default function HubScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();
  const isDark = effectiveTheme === "dark";

  const [activeTab, setActiveTab] = useState<HubTab>("beats");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Data Hooks
  const { data: beats, isLoading: beatsLoading, refetch: refetchBeats } = useBeats();
  const { data: equipment, isLoading: equipmentLoading, refetch: refetchEquipment } = useEquipment();

  const collabTypeMap: Record<"deals" | "collabs" | "bids", CollaborationType> =
  {
    deals: "PROJECT",
    collabs: "SESSION",
    bids: "AUCTION",
  };

  const { data: collaborations, isLoading: collabsLoading, refetch: refetchCollabs } = useCollaborations(
    activeTab === "deals"
      ? collabTypeMap.deals
      : activeTab === "collabs"
        ? collabTypeMap.collabs
        : activeTab === "bids"
          ? collabTypeMap.bids
          : undefined,
  );

  const createCollab = useCreateCollaboration();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBeats(), refetchEquipment(), refetchCollabs()]);
    setRefreshing(false);
  };

  // Filtering Logic
  const filteredBeats = useMemo(() => {
    if (!beats) return [];
    let filtered = beats;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.producer.username.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [beats, searchQuery]);

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    let filtered = equipment;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [equipment, searchQuery]);

  const filteredCollabs = useMemo(() => {
    if (!collaborations) return [];
    let filtered = collaborations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.creator.username.toLowerCase().includes(query),
      );
    }
    if (selectedGenre !== "all") {
      filtered = filtered.filter((c) => c.genre?.includes(selectedGenre));
    }
    return filtered;
  }, [collaborations, searchQuery, selectedGenre]);

  // Actions
  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateCollab = () => {
    if (!user) {
      Alert.alert("Sign In", "Please sign in to create.");
      return;
    }
    setShowCreateModal(true);
  };

  const tabs: { key: HubTab; label: string; icon: any }[] = [
    { key: "beats", label: "Beats", icon: "musical-notes" },
    { key: "collabs", label: "Collabs", icon: "people" },
    { key: "equipment", label: "Gear", icon: "headset" },
    { key: "deals", label: "Deals", icon: "flash" },
    { key: "bids", label: "Bids", icon: "trending-up" },
  ];

  const genres = ["all", "Hip Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz"];

  // Featured beat (first one)
  const featuredBeat = filteredBeats[0];

  // BEATS
  const renderBeats = () => {
    if (beatsLoading)
      return (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      );
    if (filteredBeats.length === 0)
      return <EmptyState type="music" text="No beats found" />;

    return (
      <View>
        {/* Featured Beat */}
        {featuredBeat && (
          <TouchableOpacity
            style={[styles.featuredCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/beat/${featuredBeat.id}`)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              style={styles.featuredImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name="music"
                size={48}
                color="rgba(255,255,255,0.4)"
              />
              <View style={styles.featuredBadge}>
                <Ionicons name="flame" size={12} color="#FCD34D" />
                <Text style={styles.featuredBadgeText}>Trending</Text>
              </View>
            </LinearGradient>
            <View style={styles.featuredContent}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featuredTitle, { color: colors.text }]} numberOfLines={1}>
                  {featuredBeat.title}
                </Text>
                <Text style={[styles.featuredSubtitle, { color: colors.textSecondary }]}>
                  {featuredBeat.producer.fullName || featuredBeat.producer.username}
                </Text>
              </View>
              <View style={styles.featuredMeta}>
                <Text style={[styles.featuredPrice, { color: colors.text }]}>
                  ${featuredBeat.price}
                </Text>
                <View style={styles.featuredStats}>
                  <Ionicons name="play" size={12} color={colors.textTertiary} />
                  <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: "600" }}>
                    {featuredBeat.plays}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Grid */}
        <View style={styles.gridContainer}>
          {filteredBeats.slice(featuredBeat ? 1 : 0).map((beat) => (
            <TouchableOpacity
              key={beat.id}
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/beat/${beat.id}`)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  beat.genres?.includes("Hip Hop") ? ["#8B5CF6", "#6366F1"] :
                  beat.genres?.includes("R&B") ? ["#EC4899", "#8B5CF6"] :
                  ["#F59E0B", "#EF4444"]
                }
                style={styles.cardImage}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name="music"
                  size={28}
                  color="rgba(255,255,255,0.6)"
                />
                <TouchableOpacity
                  style={styles.likeBtn}
                  onPress={() => toggleLike(beat.id)}
                >
                  <Ionicons
                    name={likedItems.has(beat.id) ? "heart" : "heart-outline"}
                    size={16}
                    color={likedItems.has(beat.id) ? "#EF4444" : "#fff"}
                  />
                </TouchableOpacity>
              </LinearGradient>
              <View style={styles.cardContent}>
                <Text
                  style={[styles.cardTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {beat.title}
                </Text>
                <Text
                  style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {beat.producer.fullName || beat.producer.username}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.priceText, { color: colors.text }]}>
                    ${beat.price}
                  </Text>
                  <View style={styles.statsRow}>
                    <Ionicons name="play" size={10} color={colors.textTertiary} />
                    <Text style={[styles.statsText, { color: colors.textTertiary }]}>
                      {beat.plays}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // GEAR
  const renderEquipment = () => {
    if (equipmentLoading)
      return (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      );
    if (filteredEquipment.length === 0)
      return <EmptyState type="hardware-chip" text="No gear found" />;

    return (
      <View style={styles.gridContainer}>
        {filteredEquipment.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/equipment/${item.id}`)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#F59E0B", "#EF4444"]}
              style={styles.cardImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name="microphone-variant"
                size={28}
                color="rgba(255,255,255,0.6)"
              />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text
                style={[styles.cardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.category}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.priceText, { color: colors.text }]}>
                  ${item.price}
                </Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                    {item.condition}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // COLLABS
  const renderCollabs = () => {
    if (collabsLoading)
      return (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      );
    if (filteredCollabs.length === 0)
      return (
        <EmptyState type="people" text={`No ${activeTab} found`} showCreate />
      );

    const getGradient = () => {
      if (activeTab === "deals") return ["#10B981", "#059669"];
      if (activeTab === "bids") return ["#3B82F6", "#2563EB"];
      return ["#8B5CF6", "#6366F1"];
    };

    return (
      <View style={styles.gridContainer}>
        {filteredCollabs.map((collab) => (
          <TouchableOpacity
            key={collab.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/collaboration/${collab.id}`)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={getGradient()}
              style={styles.cardImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Text style={styles.avatarText}>
                  {collab.creator.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text
                style={[styles.cardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {collab.title}
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                by {collab.creator.fullName || collab.creator.username}
              </Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                {collab.price && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      ${collab.price}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                    {dayjs(collab.createdAt).fromNow(true)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const EmptyState = ({
    type,
    text,
    showCreate,
  }: {
    type: any;
    text: string;
    showCreate?: boolean;
  }) => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Ionicons name={type} size={36} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{text}</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        Check back later or try refreshing.
      </Text>
      {showCreate && (
        <TouchableOpacity
          style={[styles.createBtnEmpty, { backgroundColor: colors.text }]}
          onPress={handleCreateCollab}
        >
          <Text style={{ color: colors.background, fontWeight: "600" }}>Create New</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Hub
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Marketplace & Collabs
            </Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell size={22} color={colors.text} />
            {["collabs", "deals", "bids"].includes(activeTab) && (
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.text }]}
                onPress={handleCreateCollab}
              >
                <Ionicons name="add" size={22} color={colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Search ${activeTab}...`}
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabItem,
                  activeTab === tab.key
                    ? { backgroundColor: colors.text, borderColor: colors.text }
                    : { borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={
                    activeTab === tab.key
                      ? colors.background
                      : colors.textSecondary
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

        {/* Genre Filters */}
        {["collabs", "deals", "bids"].includes(activeTab) && (
          <View style={{ height: 44 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              {genres.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGenre(g)}
                  style={[
                    styles.filterChip,
                    selectedGenre === g
                      ? {
                          backgroundColor: colors.primary + "20",
                          borderColor: colors.primary,
                        }
                      : { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color:
                          selectedGenre === g
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {g === "all" ? "All" : g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === "beats" && renderBeats()}
          {activeTab === "equipment" && renderEquipment()}
          {["collabs", "deals", "bids"].includes(activeTab) && renderCollabs()}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateCollaborationModal
            visible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              try {
                await createCollab.mutateAsync(data);
                setShowCreateModal(false);
                Alert.alert("Success", "Posted successfully!");
              } catch (e) {
                Alert.alert("Error", "Failed to create");
              }
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  createBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    height: "100%",
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 8,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: { fontWeight: "600", fontSize: 13 },

  // Filters
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: { fontSize: 12, fontWeight: "600" },

  // Featured Card
  featuredCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  featuredImage: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  featuredBadgeText: {
    color: "#FCD34D",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  featuredContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  featuredSubtitle: {
    fontSize: 13,
  },
  featuredMeta: {
    alignItems: "flex-end",
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  featuredStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  // Grid & Cards
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: CARD_GAP,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    height: CARD_WIDTH * 0.85,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  likeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: { fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  statsText: { fontSize: 11, fontWeight: "600" },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },

  // Collab Avatar
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#fff" },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  emptySub: { fontSize: 14, marginBottom: 24 },
  createBtnEmpty: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
});
