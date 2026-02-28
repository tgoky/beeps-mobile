import CreateCollaborationModal from "@/components/CreateCollaborationModal";
import { NotificationBell } from "@/components/NotificationBell";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBeats } from "@/hooks/useBeats";
import {
  useCollaborations,
  useCreateCollaboration,
} from "@/hooks/useCollaborations";
import { useEquipment } from "@/hooks/useEquipment";
import { CollaborationType } from "@/types/database";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

dayjs.extend(relativeTime);

const { width } = Dimensions.get("window");
const GAP = 12;
const ITEM_WIDTH = (width - Spacing.lg * 2 - GAP) / 2;

type HubTab = "collabs" | "beats" | "equipment" | "deals" | "bids";

export default function HubScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();

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

  const collabTypeMap: Record<"deals" | "collabs" | "bids", CollaborationType> =
    {
      deals: "PROJECT",
      collabs: "SESSION",
      bids: "AUCTION",
    };

  const {
    data: collaborations,
    isLoading: collabsLoading,
    refetch: refetchCollabs,
  } = useCollaborations(
    ["deals", "collabs", "bids"].includes(activeTab)
      ? collabTypeMap[activeTab as "deals" | "collabs" | "bids"]
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

  // --- COMPONENT RENDERERS ---

  // 1. HEADER (Centered like reference)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={{ width: 40 }} />
      <Text style={[styles.headerTitle, { color: colors.text }]}>Hub</Text>
      <View style={styles.headerActions}>
        <NotificationBell />
      </View>
    </View>
  );

  // 2. CIRCULAR TABS (Matches "Recently Visited" style)
  const renderCircularTabs = () => {
    const tabs = [
      { key: "beats", label: "Beats", icon: "music", color: "#443e3f" }, // Redish
      {
        key: "collabs",
        label: "Collabs",
        icon: "account-group",
        color: "#443e3f",
      }, // Purple
      {
        key: "equipment",
        label: "Gear",
        icon: "microphone-variant",
        color: "#443e3f",
      }, // Orange/Yellow
      {
        key: "deals",
        label: "Deals",
        icon: "lightning-bolt",
        color: "#443e3f",
      }, // Green
      { key: "bids", label: "Bids", icon: "gavel", color: "#443e3f" }, // Blue
    ];

    return (
      <View style={styles.navSection}>
        {/* <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          CATEGORIES
        </Text> */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.circularTabContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as HubTab)}
                activeOpacity={0.7}
                style={styles.circularTabItem}
              >
                <View
                  style={[
                    styles.circleIcon,
                    {
                      backgroundColor: isActive ? tab.color : colors.card,
                      borderColor: isActive ? tab.color : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={24}
                    color={isActive ? "#FFF" : tab.color}
                  />
                </View>
                <Text
                  style={[
                    styles.circleLabel,
                    {
                      color: isActive ? colors.text : colors.textSecondary,
                      fontWeight: isActive ? "600" : "400",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // 3. BENTO CARDS (Matches "Betting/Airtime" cards)
  const renderBentoCard = (item: any, index: number) => {
    // Generate a soft background color based on index to give that "playful" look
    const bgColors = [
      colors.card, // Default card color
      effectiveTheme === "dark" ? "#1f2937" : "#F3F4F6",
      effectiveTheme === "dark" ? "#1f2937" : "#FDF2F8", // Pink tint
      effectiveTheme === "dark" ? "#1f2937" : "#ECFDF5", // Green tint
    ];
    const bgColor = bgColors[index % bgColors.length];

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
        style={[
          styles.bentoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Card Header (Icon/Image) */}
        <View style={[styles.bentoImageArea, { backgroundColor: bgColor }]}>
          {/* If we had real images, we'd use <Image /> here. Using Icons/Gradients as fallback */}
          <View style={styles.iconFloat}>
            <MaterialCommunityIcons
              name={
                activeTab === "beats"
                  ? "music-note"
                  : activeTab === "equipment"
                    ? "headphones"
                    : "handshake"
              }
              size={40}
              color={colors.text}
              style={{ opacity: 0.8 }}
            />
          </View>

          {/* Price Pill */}
          {item.price && (
            <View
              style={[styles.pricePill, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.priceText, { color: colors.text }]}>
                ${item.price}
              </Text>
            </View>
          )}
        </View>

        {/* Card Footer (Text) */}
        <View style={styles.bentoContent}>
          <Text
            style={[styles.bentoTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title || item.name}
          </Text>
          <Text style={[styles.bentoSub, { color: colors.textSecondary }]}>
            {item.producer?.username || item.creator?.username || item.category}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = beatsLoading || equipmentLoading || collabsLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={effectiveTheme === "dark" ? "light-content" : "dark-content"}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {renderHeader()}

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
          {/* Top Categories */}
          {renderCircularTabs()}

          <View style={styles.divider} />

          {/* Main Content Grid */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {activeTab === "beats"
                ? "Latest Beats"
                : activeTab === "equipment"
                  ? "Gear Market"
                  : "Active Collabs"}
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ color: colors.textSecondary }}>
                No items found.
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredData.map((item, index) => renderBentoCard(item, index))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB for creation */}
        {["collabs", "deals", "bids"].includes(activeTab) && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.text }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="plus" size={28} color={colors.background} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {showCreateModal && (
        <CreateCollaborationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => createCollab.mutateAsync(data)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // HEADER
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  headerActions: {
    width: 40,
    alignItems: "flex-end",
  },

  // CIRCULAR TABS
  navSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 32, // Increased from Spacing.lg to push it away from the edge
    textTransform: "uppercase",
  },
  circularTabContainer: {
    paddingHorizontal: 20,

    gap: 12,

    flexGrow: 1,
    justifyContent: "center",
  },
  circularTabItem: {
    alignItems: "center",
    gap: 8,
  },
  circleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  circleLabel: {
    fontSize: 13,
    textAlign: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(150,150,150,0.1)",
    marginHorizontal: Spacing.lg,
    marginBottom: 20,
  },

  // GRID SECTION
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingTop: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: GAP,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },

  // BENTO CARDS
  bentoCard: {
    width: ITEM_WIDTH,
    borderRadius: 20, // High radius like the reference image
    marginBottom: GAP,
    overflow: "hidden",
    borderWidth: 1,
    // No heavy shadow, just border and cleanliness
  },
  bentoImageArea: {
    height: ITEM_WIDTH * 0.75, // Aspect ratio
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconFloat: {
    transform: [{ rotate: "-10deg" }], // Playful tilt
  },
  pricePill: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priceText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bentoContent: {
    padding: 12,
    justifyContent: "center",
  },
  bentoTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  bentoSub: {
    fontSize: 12,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
