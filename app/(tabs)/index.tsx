import CustomMapView from "@/components/CustomMapView";
import { NotificationBell } from "@/components/NotificationBell";
import { RequestServiceModal } from "@/components/RequestServiceModal";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useArtists } from "@/hooks/useArtists";
import { useProducers } from "@/hooks/useProducers";
import { useStudios } from "@/hooks/useStudios";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

type TabType = "studios" | "producers" | "artists";

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";

  // State
  const [activeTab, setActiveTab] = useState<TabType>("studios");
  const [isSearching, setIsSearching] = useState(false); // Controls "Expanded" view
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudio, setSelectedStudio] = useState<any | null>(null);
  const [requestServiceProducer, setRequestServiceProducer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Data Hooks
  const { data: studios, isLoading: studiosLoading } = useStudios();
  const { data: producers, isLoading: producersLoading } = useProducers();
  const { data: artists, isLoading: artistsLoading } = useArtists();

  // Mock Location (San Francisco)
  const userLocation = { latitude: 37.7849, longitude: -122.4094 };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    let data: any[] = [];
    switch (activeTab) {
      case "studios":
        data = studios || [];
        break;
      case "producers":
        data = producers || [];
        break;
      case "artists":
        data = artists || [];
        break;
    }

    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item: any) => {
      const name =
        activeTab === "studios"
          ? item.name?.toLowerCase()
          : item.user?.fullName?.toLowerCase() ||
            item.user?.username?.toLowerCase();
      return name?.includes(query);
    });
  }, [activeTab, studios, producers, artists, searchQuery]);

  // Handle Search Focus
  const handleSearchFocus = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearching(true);
  };

  // Handle Back to "Bolt Home" State
  const handleCollapse = () => {
    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearching(false);
    setSearchQuery("");
    setSelectedStudio(null);
  };

  // Helper for rendering compact list items inside the bottom sheet
  const renderListItem = ({ item }: { item: any }) => {
    let name = "",
      subtitle = "",
      imageUrl = "",
      price = 0,
      rating = 0;

    if (activeTab === "studios") {
      name = item.name;
      subtitle = item.city || "Downtown";
      price = item.hourlyRate;
      rating = item.rating;
      imageUrl =
        item.imageUrl ||
        `https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=400&q=80`;
    } else {
      name = item.user?.fullName || item.user?.username || "Unknown";
      subtitle = activeTab === "producers" ? "Producer" : "Artist";
      price = item.productionRate || 0;
      rating = item.user?.rating || 0;
      imageUrl =
        item.user?.avatarUrl ||
        `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80`;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.resultItem, { borderBottomColor: colors.border }]}
        onPress={() => {
          if (activeTab === "studios") router.push(`/studio/${item.id}`);
          else if (activeTab === "producers")
            router.push(`/producer/${item.userId}`);
          else router.push(`/profile/${item.user.id}`);
        }}
      >
        <View style={styles.resultIconContainer}>
          <Image source={{ uri: imageUrl }} style={styles.resultImage} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {name}
          </Text>
          <Text
            style={[styles.resultSubtitle, { color: colors.textSecondary }]}
          >
            {rating > 0 && (
              <Text style={{ color: "#F59E0B" }}>★ {rating.toFixed(1)} • </Text>
            )}
            {subtitle}
          </Text>
        </View>
        <View style={styles.resultRight}>
          {price > 0 && (
            <Text style={[styles.resultPrice, { color: colors.text }]}>
              ${price}
            </Text>
          )}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // --- Map Data Prep ---
  // If we are looking at producers/artists, we might still want to show studios on the map
  // or random markers for aesthetic, but logically, Map is best for Studios.
  const mapData = (studios || []).map((studio: any) => ({
    ...studio,
    latitude:
      studio.latitude || userLocation.latitude + (Math.random() - 0.5) * 0.05,
    longitude:
      studio.longitude || userLocation.longitude + (Math.random() - 0.5) * 0.05,
  }));

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* 1. BACKGROUND MAP (Full Screen) */}
      <View style={StyleSheet.absoluteFill}>
        <CustomMapView
          studios={mapData} // Always show studios on map for context
          theme={effectiveTheme}
          onStudioPress={(studio) => {
            setActiveTab("studios");
            setSelectedStudio(studio);
            setIsSearching(true); // Open sheet when map pin clicked
          }}
          selectedStudio={selectedStudio}
          userLocation={userLocation}
        />
      </View>

      {/* 2. TOP FLOATING HEADER (Transparent) */}
      <SafeAreaView
        style={styles.topHeaderPointerEvents}
        pointerEvents="box-none"
      >
        <View style={styles.topHeader}>
          {/* Menu / Profile Button */}
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/profile/settings")}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Notification Bell */}
          <View style={[styles.circleBtn, { backgroundColor: colors.card }]}>
            <NotificationBell size={24} color={colors.text} />
          </View>
        </View>
      </SafeAreaView>

      {/* 3. BOTTOM SHEET (Bolt Style) */}
      {/* We use a KeyboardAvoidingView to push content up if needed, though usually just sliding up the sheet is enough */}
      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.card,
            height: isSearching ? "85%" : 280, // Dynamic Height
          },
        ]}
      >
        {/* Grabber Handle (Visual cue) */}
        <View style={styles.sheetHandleContainer}>
          <View
            style={[styles.sheetHandle, { backgroundColor: colors.border }]}
          />
        </View>

        {/* -- SEARCH HEADER INSIDE SHEET -- */}
        <View style={styles.sheetHeader}>
          {/* If searching, show Back button */}
          {isSearching && (
            <TouchableOpacity
              onPress={handleCollapse}
              style={{ paddingRight: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Ionicons
              name={isSearching ? "search" : "ellipse"}
              size={isSearching ? 20 : 12}
              color={isSearching ? colors.text : "#F59E0B"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                isSearching
                  ? `Search ${activeTab}...`
                  : "Find a studio, producer..."
              }
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
            />
          </View>
        </View>

        {/* -- CONTENT AREA -- */}
        {isSearching ? (
          // STATE B: EXPANDED LIST RESULTS
          <View style={{ flex: 1 }}>
            {/* Horizontal Category Selector (Small) */}
            <View style={styles.tabsRow}>
              {(["studios", "producers", "artists"] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabPill,
                    activeTab === tab
                      ? { backgroundColor: colors.text }
                      : { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      {
                        color:
                          activeTab === tab ? colors.background : colors.text,
                      },
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Results List */}
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id || item.userId}
              renderItem={renderListItem}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: colors.textTertiary }}>
                    No results found
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          // STATE A: IDLE (Category Cards)
          <View style={{ flex: 1, paddingTop: 10 }}>
            {/* Greeting */}
            <Text style={[styles.greetingText, { color: colors.text }]}>
              Ready to create, {user.username}?
            </Text>

            {/* Categories Grid */}
            <View style={styles.categoryGrid}>
              <CategoryCard
                title="Studios"
                icon="mic-outline"
                color={colors.primary}
                bgColor={colors.card}
                onPress={() => {
                  setActiveTab("studios");
                  handleSearchFocus();
                }}
              />
              <CategoryCard
                title="Producers"
                icon="options-outline"
                color="#8B5CF6"
                bgColor={colors.card}
                onPress={() => {
                  setActiveTab("producers");
                  handleSearchFocus();
                }}
              />
              <CategoryCard
                title="Artists"
                icon="musical-notes-outline"
                color="#10B981"
                bgColor={colors.card}
                onPress={() => {
                  setActiveTab("artists");
                  handleSearchFocus();
                }}
              />
            </View>

            {/* Recent or Promoted (Optional) */}
            <TouchableOpacity
              style={[
                styles.promoCard,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={[styles.promoText, { color: colors.text }]}>
                Top rated near you
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Request Modal */}
      {requestServiceProducer && (
        <RequestServiceModal
          visible={!!requestServiceProducer}
          onClose={() => setRequestServiceProducer(null)}
          producerId={requestServiceProducer.id}
          producerName={requestServiceProducer.name}
          clientId={user.id}
        />
      )}
    </View>
  );
}

// Helper Component for Category Cards
const CategoryCard = ({ title, icon, color, bgColor, onPress }: any) => (
  <TouchableOpacity
    style={[styles.categoryCard, { backgroundColor: bgColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.categoryTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // --- Floating Header ---
  topHeaderPointerEvents: {
    flex: 1,
    justifyContent: "flex-start",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10, // Adjust for status bar
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // --- Bottom Sheet ---
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20, // High elevation to cover map
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sheetHandleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  // --- State A: Idle Content ---
  greetingText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 5,
  },
  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  categoryCard: {
    width: (width - 60) / 3, // 3 columns with gap
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  promoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  // --- State B: List Content ---
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // List Items
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultIconContainer: {
    marginRight: 15,
  },
  resultImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
});
