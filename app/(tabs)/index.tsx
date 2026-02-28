import CustomMapView from "@/components/CustomMapView";
import { NotificationBell } from "@/components/NotificationBell";
import { RequestServiceModal } from "@/components/RequestServiceModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useArtists } from "@/hooks/useArtists";
import { useProducers } from "@/hooks/useProducers";
import { useStudios } from "@/hooks/useStudios";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  LayoutAnimation,
  PanResponder,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Enable LayoutAnimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

// --- CONFIGURATION ---
const COLLAPSED_HEIGHT = height * 0.55;
const EXPANDED_HEIGHT = height * 0.92;
const DRAG_THRESHOLD = 50;

type TabType = "studios" | "producers" | "artists";
type SortOrder = "price_asc" | "price_desc" | "rating_desc" | null;

// --- DYNAMIC FILTER CONFIGURATION ---
const FILTER_OPTIONS = {
  studios: [
    { label: "Budget", min: 0, max: 25, text: "Under $25/hr" },
    { label: "Standard", min: 25, max: 50, text: "$25 - $50/hr" },
    { label: "Premium", min: 50, max: 100, text: "$50 - $100/hr" },
    { label: "Pro", min: 100, max: 9999, text: "$100+/hr" },
  ],
  producers: [
    { label: "Starter Beats", min: 0, max: 50, text: "Under $50" },
    { label: "Pro Beats", min: 50, max: 150, text: "$50 - $150" },
    { label: "Exclusive", min: 150, max: 500, text: "$150 - $500" },
    { label: "Full Prod", min: 500, max: 99999, text: "$500+" },
  ],
  artists: [
    { label: "New Wave", min: 0, max: 100, text: "Feat. under $100" },
    { label: "Rising", min: 100, max: 300, text: "Feat. $100-$300" },
    { label: "Established", min: 300, max: 99999, text: "Feat. $300+" },
  ],
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  // LOAD FONTS
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Theme Colors
  const theme = {
    bg: isDark ? "#000" : "#FFF",
    card: isDark ? "#121212" : "#FFF",
    text: isDark ? "#FFF" : "#000",
    subtext: "#8E8E93",
    border: isDark ? "#333" : "#E5E5EA",
    accent: "#FF3B30",
    input: isDark ? "#222" : "#F2F2F7",
  };

  // Data Hooks
  const { data: studios } = useStudios();
  const { data: producers } = useProducers();
  const { data: artists } = useArtists();

  // State
  const [region, setRegion] = useState({ latitude: 6.5244, longitude: 3.3792 });
  const [userLocation, setUserLocation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("studios");

  // Filter States
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [requestServiceProducer, setRequestServiceProducer] =
    useState<any>(null);

  // Animation
  const animatedTop = useRef(
    new Animated.Value(height - COLLAPSED_HEIGHT),
  ).current;
  const lastGestureDy = useRef(0);

  // --- SAFE GPS LOADING ---
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission denied");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(loc.coords);
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (error) {
        console.log("Error fetching location, using default:", error);
      }
    })();
  }, []);

  // --- FILTER LOGIC ---
  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  // Update search suggestions based on query
  const updateSearchSuggestions = (query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const q = query.toLowerCase();
    const suggestions = new Set<string>();

    // Get unique locations from current tab data
    if (activeTab === "studios" && studios) {
      studios.forEach((studio) => {
        if (studio.city?.toLowerCase().includes(q)) {
          suggestions.add(studio.city);
        }
        if (studio.state?.toLowerCase().includes(q)) {
          suggestions.add(studio.state);
        }
        if (studio.country?.toLowerCase().includes(q)) {
          suggestions.add(studio.country);
        }
      });
    } else if (activeTab === "producers" && producers) {
      producers.forEach((producer) => {
        if (producer.user?.location?.toLowerCase().includes(q)) {
          suggestions.add(producer.user.location);
        }
      });
    } else if (activeTab === "artists" && artists) {
      artists.forEach((artist) => {
        if (artist.user?.location?.toLowerCase().includes(q)) {
          suggestions.add(artist.user.location);
        }
      });
    }

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  };

  // Reset filters when tab changes
  useEffect(() => {
    setSelectedFilterIndex(null);
    setSortOrder(null);
    setSearchQuery("");
    setSearchSuggestions([]);
  }, [activeTab]);

  const filteredData = useMemo(() => {
    let data: any[] = [];
    if (activeTab === "studios") data = studios || [];
    else if (activeTab === "producers") data = producers || [];
    else data = artists || [];

    // 1. Search Filter - Search by name AND location
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();

      data = data.filter((item) => {
        // For studios - search by name AND location fields
        if (activeTab === "studios") {
          const name = (item.name || "").toLowerCase();
          const city = (item.city || "").toLowerCase();
          const state = (item.state || "").toLowerCase();
          const country = (item.country || "").toLowerCase();
          const location = (item.location || "").toLowerCase();
          const description = (item.description || "").toLowerCase();

          // Check if query matches ANY of these fields
          return (
            name.includes(q) ||
            city.includes(q) ||
            state.includes(q) ||
            country.includes(q) ||
            location.includes(q) ||
            description.includes(q)
          );
        }

        // For producers and artists (they have user object with location)
        const fullName = (item.user?.fullName || "").toLowerCase();
        const username = (item.user?.username || "").toLowerCase();
        const userLocation = (item.user?.location || "").toLowerCase();
        const bio = (item.user?.bio || "").toLowerCase();

        // For producers - also search by genres
        const genres = (item.genres?.join(" ") || "").toLowerCase();

        return (
          fullName.includes(q) ||
          username.includes(q) ||
          userLocation.includes(q) ||
          bio.includes(q) ||
          genres.includes(q)
        );
      });
    }

    // 2. Budget/Context Filter
    if (selectedFilterIndex !== null) {
      const currentOptions = FILTER_OPTIONS[activeTab];
      if (currentOptions && currentOptions[selectedFilterIndex]) {
        const range = currentOptions[selectedFilterIndex];

        let priceField = "hourlyRate";
        if (activeTab === "producers") priceField = "productionRate";
        if (activeTab === "artists") priceField = "featureRate";

        data = data.filter((d) => {
          const price = d[priceField] || 0;
          return price >= range.min && price < range.max;
        });
      }
    }

    // 3. Sort
    if (sortOrder === "price_asc") {
      const getPrice = (item: any) => {
        if (activeTab === "studios") return item.hourlyRate || 0;
        if (activeTab === "producers") return item.productionRate || 0;
        return item.featureRate || 0;
      };
      data.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortOrder === "rating_desc") {
      const getRating = (item: any) => item.rating || item.user?.rating || 0;
      data.sort((a, b) => getRating(b) - getRating(a));
    }

    return data;
  }, [
    activeTab,
    studios,
    producers,
    artists,
    searchQuery,
    selectedFilterIndex,
    sortOrder,
  ]);

  // --- SMOOTHER DRAG GESTURE ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,

      onPanResponderGrant: () => {
        lastGestureDy.current = animatedTop._value;
        animatedTop.extractOffset();
      },

      onPanResponderMove: (_, gs) => {
        animatedTop.setValue(gs.dy);
      },

      onPanResponderRelease: (_, gs) => {
        animatedTop.flattenOffset();

        if (gs.dy < -DRAG_THRESHOLD || gs.vy < -0.5) {
          snapTo(true);
        } else if (gs.dy > DRAG_THRESHOLD || gs.vy > 0.5) {
          snapTo(false);
        } else {
          const currentPos = lastGestureDy.current + gs.dy;
          const midPoint =
            (height - COLLAPSED_HEIGHT + height - EXPANDED_HEIGHT) / 2;
          snapTo(currentPos < midPoint);
        }
      },
    }),
  ).current;

  const snapTo = (expand: boolean) => {
    setIsExpanded(expand);
    Animated.spring(animatedTop, {
      toValue: expand ? height - EXPANDED_HEIGHT : height - COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleRecenter = () => {
    if (userLocation) {
      setRegion({ ...userLocation });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderVerticalItem = ({ item }: { item: any }) => {
    const title = activeTab === "studios" ? item.name : item.user?.fullName;
    const subtitle =
      activeTab === "studios"
        ? item.city || item.state || item.country
        : activeTab === "producers"
          ? "Producer"
          : "Artist";
    const img = activeTab === "studios" ? item.imageUrl : item.user?.avatarUrl;

    let rateDisplay = "";
    let rate = 0;
    if (activeTab === "studios") {
      rate = item.hourlyRate;
      rateDisplay = `/hr`;
    } else if (activeTab === "producers") {
      rate = item.productionRate;
      rateDisplay = ``;
    } else {
      rate = item.featureRate || 0;
      rateDisplay = ` feat`;
    }

    const rating = activeTab === "studios" ? item.rating : item.user?.rating;
    const dist =
      activeTab === "studios"
        ? getDistance(
            region.latitude,
            region.longitude,
            item.latitude,
            item.longitude,
          )
        : null;

    return (
      <TouchableOpacity
        style={[styles.vCard, { borderBottomColor: theme.border }]}
        onPress={() => {
          if (activeTab === "producers")
            setRequestServiceProducer({ id: item.userId, name: title });
          else
            router.push(
              activeTab === "studios"
                ? `/studio/${item.id}`
                : `/profile/${item.userId || item.user?.id}`,
            );
        }}
      >
        <Image
          source={{ uri: img || "https://via.placeholder.com/150" }}
          style={styles.vImage}
          contentFit="cover"
        />
        <View style={styles.vMain}>
          <View style={styles.vHeader}>
            <Text
              style={[styles.vTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={[styles.vPrice, { color: theme.text }]}>
              ${rate}
              <Text style={styles.vUnit}>{rateDisplay}</Text>
            </Text>
          </View>
          <Text style={styles.vSub}>
            {subtitle} {dist ? `• ${dist}km` : ""}
          </Text>
          <View style={styles.vFooter}>
            <View style={styles.vRating}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.vRatingText, { color: theme.text }]}>
                {rating?.toFixed(1) || "New"}
              </Text>
            </View>
            {activeTab === "studios" && (
              <Text style={[styles.vStatus, { color: "#4CD964" }]}>
                Open Now
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user || !fontsLoaded) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* MAP LAYER */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { paddingBottom: COLLAPSED_HEIGHT - 60 },
        ]}
      >
        <CustomMapView
          studios={activeTab === "studios" ? filteredData : []}
          theme={effectiveTheme}
          region={region}
          userLocation={userLocation}
          onStudioPress={(studio) => {
            router.push(`/studio/${studio.id}`);
          }}
          selectedStudio={null}
          recentActivity={[]}
        />
      </View>

      {/* FLOATING UI LAYER */}
      <SafeAreaView style={styles.overlayUI} pointerEvents="box-none">
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: theme.card }]}
            onPress={() => router.push("/profile/settings")}
          >
            <Ionicons name="menu" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.circleBtn, { backgroundColor: theme.card }]}>
            <NotificationBell size={22} color={theme.text} />
          </View>
        </View>
        {!isExpanded && (
          <TouchableOpacity
            style={[styles.recenterBtn, { backgroundColor: theme.card }]}
            onPress={handleRecenter}
          >
            <Ionicons name="navigate" size={20} color={theme.text} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* BOTTOM SHEET */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.card, top: animatedTop },
        ]}
      >
        {/* DRAGGABLE HEADER */}
        <View
          {...panResponder.panHandlers}
          style={[styles.headerContainer, { backgroundColor: theme.card }]}
        >
          <View style={styles.dragHandleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.sheetHeader}>
            <View style={[styles.searchRow, { backgroundColor: theme.input }]}>
              <Ionicons
                name="search"
                size={18}
                color={theme.subtext}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Search ${activeTab} by name or location...`}
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  updateSearchSuggestions(text);
                }}
                onFocus={() => snapTo(true)}
              />
              <TouchableOpacity
                onPress={toggleFilters}
                style={styles.filterToggle}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={showFilters ? theme.accent : theme.text}
                />
              </TouchableOpacity>
            </View>

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <View
                style={[
                  styles.suggestionsContainer,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {searchSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(suggestion);
                      setSearchSuggestions([]);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={theme.subtext}
                    />
                    <Text
                      style={[styles.suggestionText, { color: theme.text }]}
                    >
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* DYNAMIC FILTERS AREA */}
            {showFilters && (
              <View style={styles.filterMenu}>
                <Text
                  style={{
                    color: theme.subtext,
                    fontSize: 11,
                    marginBottom: 8,
                    fontFamily: "Manrope_800ExtraBold",
                  }}
                >
                  {activeTab === "studios"
                    ? "HOURLY RATE"
                    : activeTab === "producers"
                      ? "PRODUCTION RATE"
                      : "FEATURE PRICE"}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                >
                  {FILTER_OPTIONS[activeTab].map((option, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setSelectedFilterIndex(
                          selectedFilterIndex === i ? null : i,
                        );
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.pill,
                        selectedFilterIndex === i
                          ? { backgroundColor: theme.text }
                          : { borderColor: theme.border, borderWidth: 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              selectedFilterIndex === i ? theme.bg : theme.text,
                          },
                        ]}
                      >
                        {option.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />

                <View style={styles.sortRow}>
                  <TouchableOpacity
                    onPress={() =>
                      setSortOrder(
                        sortOrder === "price_asc" ? null : "price_asc",
                      )
                    }
                    style={styles.sortBtn}
                  >
                    <Text
                      style={[
                        styles.sortBtnText,
                        sortOrder === "price_asc" && { color: theme.accent },
                      ]}
                    >
                      Lowest Price
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setSortOrder(
                        sortOrder === "rating_desc" ? null : "rating_desc",
                      )
                    }
                    style={styles.sortBtn}
                  >
                    <Text
                      style={[
                        styles.sortBtnText,
                        sortOrder === "rating_desc" && { color: theme.accent },
                      ]}
                    >
                      Highest Rated
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.tabs}>
              {(["studios", "producers", "artists"] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    Haptics.selectionAsync();
                  }}
                  style={styles.tab}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: activeTab === tab ? theme.text : theme.subtext,
                        fontFamily:
                          activeTab === tab
                            ? "Manrope_800ExtraBold"
                            : "Manrope_500Medium",
                      },
                    ]}
                  >
                    {tab.toUpperCase()}
                  </Text>
                  {activeTab === tab && (
                    <View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: theme.text },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <FlatList
          data={filteredData}
          renderItem={renderVerticalItem}
          keyExtractor={(item, index) =>
            item.id || item.userId || index.toString()
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text
                style={{
                  color: theme.subtext,
                  fontFamily: "Manrope_500Medium",
                }}
              >
                No {activeTab} found matching {searchQuery}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* SERVICE MODAL */}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlayUI: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  recenterBtn: {
    position: "absolute",
    bottom: COLLAPSED_HEIGHT + 20,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    elevation: 5,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 15,
    bottom: 0,
    height: height,
  },
  headerContainer: {
    width: "100%",
    paddingBottom: 5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
  },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: { paddingHorizontal: 20 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 23,
    marginBottom: 15,
    position: "relative",
    zIndex: 1001,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
  },
  filterToggle: { paddingRight: 15 },
  suggestionsContainer: {
    position: "absolute",
    top: 46,
    left: 20,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
  filterMenu: { marginBottom: 15 },
  filterScroll: { gap: 8, paddingBottom: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 18 },
  pillText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  divider: { height: 1, marginVertical: 10, width: "100%" },
  sortRow: { flexDirection: "row", gap: 15 },
  sortBtn: { paddingVertical: 4 },
  sortBtnText: {
    fontSize: 12,
    color: "#8E8E93",
    fontFamily: "Manrope_700Bold",
  },
  tabs: { flexDirection: "row", marginBottom: 10, gap: 25 },
  tab: { paddingVertical: 8 },
  tabText: { fontSize: 12, letterSpacing: 0.5 },
  activeIndicator: { height: 2, width: "100%", marginTop: 4, borderRadius: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  vCard: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: 0.5 },
  vImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
  },
  vMain: { flex: 1, marginLeft: 16, justifyContent: "space-between" },
  vHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  vTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    fontFamily: "Manrope_700Bold",
  },
  vPrice: { fontSize: 16, fontFamily: "Manrope_800ExtraBold" },
  vUnit: {
    fontSize: 11,
    color: "#8E8E93",
    fontFamily: "Manrope_500Medium",
  },
  vSub: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: -2,
    fontFamily: "Manrope_500Medium",
  },
  vFooter: { flexDirection: "row", alignItems: "center", gap: 12 },
  vRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  vRatingText: { fontSize: 12, fontFamily: "Manrope_700Bold" },
  vStatus: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  empty: { alignItems: "center", marginTop: 40, paddingHorizontal: 20 },
});
