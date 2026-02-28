import CreateCollaborationModal from "@/components/CreateCollaborationModal";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBeats } from "@/hooks/useBeats";
import {
  useCollaborations,
  useCreateCollaboration,
} from "@/hooks/useCollaborations";
import { useEquipment } from "@/hooks/useEquipment";
import { CollaborationType } from "@/types/database";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

dayjs.extend(relativeTime);

const { width } = Dimensions.get("window");
const GAP = 12;
const PADDING = 20;
const ITEM_WIDTH = (width - PADDING * 2 - GAP) / 2;

// 🎨 THEME COLORS
const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#151515",
  heroCard: "#343029", // The specific color from Community Screen
  pureWhite: "#FFFFFF",
  offWhite: "#F5F5F5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",
  accentDim: "rgba(245, 158, 11, 0.15)",
  red: "#D50000",
  green: "#00C853",
};

type HubTab = "collabs" | "beats" | "equipment" | "bids";

export default function HubScreen() {
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();

  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [activeTab, setActiveTab] = useState<HubTab>("beats");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- DATA HOOKS ---
  const {
    data: beats,
    isLoading: beatsLoading,
    refetch: refetchBeats,
  } = useBeats();
  const {
    data: equipment,
    isLoading: equipmentLoading,
    refetch: refetchEquipment,
  } = useEquipment();

  const collabTypeMap: Record<"collabs" | "bids", CollaborationType> = {
    collabs: "SESSION",
    bids: "AUCTION",
  };

  const {
    data: collaborations,
    isLoading: collabsLoading,
    refetch: refetchCollabs,
  } = useCollaborations(
    ["collabs", "bids"].includes(activeTab)
      ? collabTypeMap[activeTab as "collabs" | "bids"]
      : undefined,
  );

  const createCollab = useCreateCollaboration();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBeats(), refetchEquipment(), refetchCollabs()]);
    setRefreshing(false);
  };

  const filteredData = useMemo(() => {
    if (activeTab === "beats") return beats || [];
    if (activeTab === "equipment") return equipment || [];
    return collaborations || [];
  }, [beats, equipment, collaborations, activeTab]);

  // --- RENDERERS ---

  // 1. TOP HERO SECTION (Header + Tabs)
  const renderHeroSection = () => {
    const tabs = [
      { key: "beats", label: "BEATS", icon: "music-note" },
      { key: "collabs", label: "COLLABS", icon: "account-group" },
      { key: "equipment", label: "GEAR", icon: "headphones" },
      { key: "bids", label: "BIDS", icon: "gavel" },
    ];

    return (
      <View style={styles.heroContainer}>
        {/* Background Pattern */}
        <View style={styles.heroPattern}>
          <MaterialCommunityIcons
            name="waveform"
            size={240}
            color="rgba(255,255,255,0.05)"
          />
        </View>

        {/* Header Row (Inside Hero) */}
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>HUB</Text>
          <View style={styles.notificationWrapper}>
            <NotificationBell />
          </View>
        </View>

        {/* Circular Tabs Row */}
        <View style={styles.heroTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as HubTab)}
                  activeOpacity={0.7}
                  style={styles.tabItem}
                >
                  <View
                    style={[
                      styles.tabIconCircle,
                      isActive && styles.tabIconCircleActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={tab.icon as any}
                      size={24}
                      color={isActive ? COLORS.accent : COLORS.pureWhite}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && { color: COLORS.accent },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  // 2. BENTO CARDS
  const renderBentoCard = (item: any, index: number) => {
    const iconName =
      activeTab === "beats"
        ? "music-circle-outline"
        : activeTab === "equipment"
          ? "speaker"
          : "handshake-outline";

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        onPress={() => {
          const route =
            activeTab === "beats"
              ? `/beat/${item.id}`
              : activeTab === "equipment"
                ? `/equipment/${item.id}`
                : `/collaboration/${item.id}`;
          router.push(route);
        }}
        style={styles.bentoCard}
      >
        <View style={styles.bentoImageArea}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={100}
            color="rgba(255,255,255,0.03)"
            style={styles.bgPattern}
          />

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={iconName as any}
              size={32}
              color={COLORS.textGrey}
            />
          </View>

          {item.price !== undefined && (
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>
                ${item.price > 0 ? item.price : "FREE"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bentoContent}>
          <Text style={styles.bentoTitle} numberOfLines={1}>
            {item.title || item.name}
          </Text>
          <Text style={styles.bentoSub} numberOfLines={1}>
            {item.producer?.username ||
              item.creator?.username ||
              item.category ||
              "Unknown"}
          </Text>

          {item.type && (
            <View style={{ marginTop: 8, flexDirection: "row" }}>
              <View style={styles.miniBadge}>
                <Text style={styles.miniBadgeText}>{item.type}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = beatsLoading || equipmentLoading || collabsLoading;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
            />
          }
        >
          {/* New Combined Header & Tabs Section */}
          {renderHeroSection()}

          {/* Main Content Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === "beats"
                ? "LATEST BEATS"
                : activeTab === "equipment"
                  ? "GEAR MARKET"
                  : "ACTIVE LISTINGS"}
            </Text>
            <TouchableOpacity>
              <Ionicons name="filter" size={20} color={COLORS.textGrey} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.accent}
              style={{ marginTop: 40 }}
            />
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="ghost"
                size={48}
                color={COLORS.cardDark}
              />
              <Text style={styles.emptyStateText}>No items found.</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredData.map((item, index) => renderBentoCard(item, index))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB */}
        {["collabs", "bids"].includes(activeTab) && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="plus" size={28} color={COLORS.background} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {showCreateModal && (
        <CreateCollaborationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={user?.id || ""}
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
  scrollContent: {
    paddingBottom: 40,
  },

  // HERO SECTION (The new Header + Tabs container)
  heroContainer: {
    backgroundColor: COLORS.heroCard, // #343029
    marginHorizontal: PADDING,
    marginTop: 10,
    marginBottom: 24,
    borderRadius: 24,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
    overflow: "hidden", // Clip the pattern
  },
  heroPattern: {
    position: "absolute",
    right: -60,
    bottom: -40,
    transform: [{ rotate: "-15deg" }],
    zIndex: 0,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: 1,
  },
  notificationWrapper: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    padding: 4,
  },
  heroTabs: {
    zIndex: 1,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tabItem: {
    alignItems: "center",
    gap: 8,
  },
  tabIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.3)", // Semi-transparent dark
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tabIconCircleActive: {
    backgroundColor: COLORS.pureWhite, // White background for active
    borderColor: COLORS.pureWhite,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },

  // GRID HEADERS
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: 1,
  },

  // GRID
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyStateText: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },

  // BENTO CARDS
  bentoCard: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.cardBlack,
    borderRadius: 20,
    marginBottom: GAP,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bentoImageArea: {
    height: ITEM_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#111",
    overflow: "hidden",
  },
  bgPattern: {
    position: "absolute",
    bottom: -20,
    right: -20,
    transform: [{ rotate: "-15deg" }],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardBlack,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pricePill: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  priceText: {
    fontSize: 10,
    fontFamily: "Manrope_800ExtraBold",
    color: "#000",
  },
  bentoContent: {
    padding: 14,
  },
  bentoTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.pureWhite,
    marginBottom: 4,
  },
  bentoSub: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "flex-start",
  },
  miniBadgeText: {
    fontSize: 9,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textGrey,
    textTransform: "uppercase",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
