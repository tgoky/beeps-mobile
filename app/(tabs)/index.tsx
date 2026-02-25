import CustomMapView from "@/components/CustomMapView";
import { NotificationBell } from "@/components/NotificationBell";
import { RequestServiceModal } from "@/components/RequestServiceModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useArtists } from "@/hooks/useArtists";
import { useProducers } from "@/hooks/useProducers";
import { useStudios } from "@/hooks/useStudios";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

// --- CONFIGURATION ---
// Increased to show Horizontal list immediately
const COLLAPSED_HEIGHT = height * 0.55;
const EXPANDED_HEIGHT = height * 0.92;
const DRAG_THRESHOLD = 30; // Reduced threshold for easier snapping

type TabType = "studios" | "producers" | "artists";
type FilterType = "budget" | "top_rated" | "open_now" | null;

// --- HELPER: Haversine Distance (Km) ---
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of earth in km
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

// --- HELPER: Open Status ---
const getOpenStatus = (item: any) => {
  const now = new Date();
  const hour = now.getHours();
  const open = item.openHour || 9;
  const close = item.closeHour || 22;
  const isOpen = hour >= open && hour < close;
  return {
    isOpen,
    text: isOpen ? `Open until ${close}:00` : `Opens at ${open}:00`,
  };
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();

  // Theme Colors (Strict Black/White)
  const isDark = effectiveTheme === "dark";
  const bg = isDark ? "#000000" : "#FFFFFF";
  const txt = isDark ? "#FFFFFF" : "#000000";
  const cardBg = isDark ? "#121212" : "#FFFFFF";
  const border = isDark ? "#333333" : "#F0F0F0";
  const inputBg = isDark ? "#222" : "#F5F5F5";
  const accent = isDark ? "#FFF" : "#000";

  // Data
  const { data: studios } = useStudios();
  const { data: producers } = useProducers();
  const { data: artists } = useArtists();

  // State
  const [region, setRegion] = useState({
    latitude: 6.5244, // Default Lagos
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState<any>(null); // Real GPS
  const [activeTab, setActiveTab] = useState<TabType>("studios");
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [requestServiceProducer, setRequestServiceProducer] =
    useState<any>(null);

  // Animated Value for Sheet
  const animatedTop = useRef(
    new Animated.Value(height - COLLAPSED_HEIGHT),
  ).current;

  // --- 1. INITIALIZATION (GPS) ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  // --- 2. SEARCH & FILTER LOGIC ---
  const fetchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&addressdetails=1&limit=5&countrycodes=ng`,
      );
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.log("Loc Error", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (activeTab === "studios") fetchLocations(text);
  };

  const handleLocationSelect = (loc: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    setSearchQuery(loc.display_name.split(",")[0]);
    setLocationSuggestions([]);

    setRegion({
      latitude: parseFloat(loc.lat),
      longitude: parseFloat(loc.lon),
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
    snapToCollapsed();
  };

  const handleRecenter = () => {
    if (userLocation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

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

    if (searchQuery && locationSuggestions.length === 0) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item: any) => {
        const name =
          activeTab === "studios"
            ? item.name
            : item.user?.fullName || item.user?.username;
        return name?.toLowerCase().includes(q);
      });
    }

    if (activeFilter === "budget") {
      data = data.filter((d) => (d.hourlyRate || d.productionRate || 0) <= 50);
    } else if (activeFilter === "top_rated") {
      data = data.filter((d) => (d.rating || d.user?.rating || 0) >= 4.5);
    } else if (activeFilter === "open_now" && activeTab === "studios") {
      data = data.filter((d) => getOpenStatus(d).isOpen);
    }

    if (activeTab === "studios") {
      data.sort((a, b) => {
        const distA = parseFloat(
          getDistance(
            region.latitude,
            region.longitude,
            a.latitude,
            a.longitude,
          ) || "9999",
        );
        const distB = parseFloat(
          getDistance(
            region.latitude,
            region.longitude,
            b.latitude,
            b.longitude,
          ) || "9999",
        );
        return distA - distB;
      });
    }

    return data;
  }, [
    activeTab,
    studios,
    producers,
    artists,
    searchQuery,
    activeFilter,
    locationSuggestions,
    region,
  ]);

  // --- 3. GESTURES ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Allow drag if moving vertically
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const currentTop = isExpanded
          ? height - EXPANDED_HEIGHT
          : height - COLLAPSED_HEIGHT;
        let newTop = currentTop + gestureState.dy;

        // Limits
        if (newTop < height - EXPANDED_HEIGHT)
          newTop = height - EXPANDED_HEIGHT; // Top limit
        // Add some resistance at the bottom, but don't let it disappear
        if (newTop > height - COLLAPSED_HEIGHT + 50)
          newTop = height - COLLAPSED_HEIGHT + 50;

        animatedTop.setValue(newTop);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -DRAG_THRESHOLD) {
          snapToExpanded();
        } else if (gestureState.dy > DRAG_THRESHOLD) {
          snapToCollapsed();
        } else {
          // Return to nearest state
          if (isExpanded) snapToExpanded();
          else snapToCollapsed();
        }
      },
    }),
  ).current;

  const snapToExpanded = () => {
    setIsExpanded(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(animatedTop, {
      toValue: height - EXPANDED_HEIGHT,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const snapToCollapsed = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(animatedTop, {
      toValue: height - COLLAPSED_HEIGHT,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  // --- 4. GUARD CLAUSE (Moved AFTER all hooks) ---
  if (!user) return null;

  // --- 5. RENDER COMPONENTS ---

  const renderHorizontalItem = ({ item }: { item: any }) => {
    const distance = getDistance(
      region.latitude,
      region.longitude,
      item.latitude,
      item.longitude,
    );
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/studio/${item.id}`)}
        style={[styles.hCard, { backgroundColor: cardBg, borderColor: border }]}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.hImage}
          contentFit="cover"
        />
        <View style={styles.hContent}>
          <Text numberOfLines={1} style={[styles.hTitle, { color: txt }]}>
            {item.name}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: "#666" }}>
              ${item.hourlyRate}/hr
            </Text>
            {distance && (
              <Text style={{ fontSize: 12, color: "#666" }}>{distance} km</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVerticalItem = ({ item }: { item: any }) => {
    let name =
      activeTab === "studios"
        ? item.name
        : item.user?.fullName || item.user?.username;
    let sub =
      activeTab === "studios"
        ? item.city
        : activeTab === "producers"
          ? "Producer"
          : "Artist";
    let imageUrl =
      activeTab === "studios" ? item.imageUrl : item.user?.avatarUrl;
    let rating = activeTab === "studios" ? item.rating : item.user?.rating;
    let price = activeTab === "studios" ? item.hourlyRate : item.productionRate;

    const distance =
      activeTab === "studios"
        ? getDistance(
            region.latitude,
            region.longitude,
            item.latitude,
            item.longitude,
          )
        : null;
    const status = activeTab === "studios" ? getOpenStatus(item) : null;

    if (!imageUrl)
      imageUrl =
        "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=400&q=80";

    return (
      <TouchableOpacity
        style={[styles.vItem, { borderBottomColor: border }]}
        onPress={() =>
          router.push(
            activeTab === "studios"
              ? `/studio/${item.id}`
              : activeTab === "producers"
                ? `/producer/${item.userId}`
                : `/profile/${item.user.id}`,
          )
        }
      >
        <Image source={{ uri: imageUrl }} style={styles.vImage} />
        <View style={{ flex: 1 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{ color: txt, fontWeight: "700", fontSize: 16, flex: 1 }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {distance && (
              <Text style={{ color: "#888", fontSize: 12 }}>{distance} km</Text>
            )}
          </View>
          <Text style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
            {sub}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 6,
              gap: 10,
            }}
          >
            {rating > 0 && (
              <View style={styles.badge}>
                <Ionicons name="star" size={10} color={txt} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    marginLeft: 2,
                    color: txt,
                  }}
                >
                  {rating.toFixed(1)}
                </Text>
              </View>
            )}
            {status && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: status.isOpen ? "#10B981" : "#EF4444",
                    marginRight: 4,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: status.isOpen ? "#10B981" : "#EF4444",
                  }}
                >
                  {status.isOpen ? "Open" : "Closed"}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "center",
            paddingLeft: 10,
          }}
        >
          {price > 0 ? (
            <Text style={{ color: txt, fontWeight: "700", fontSize: 15 }}>
              ${price}
            </Text>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* 1. BACKGROUND MAP */}
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
          onRegionChangeComplete={setRegion}
          userLocation={userLocation}
        />
      </View>

      {/* 2. FLOATING UI */}
      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push("/profile/settings")}
            style={[styles.circleBtn, { backgroundColor: cardBg }]}
          >
            <Ionicons name="menu" size={24} color={txt} />
          </TouchableOpacity>
          <View style={[styles.circleBtn, { backgroundColor: cardBg }]}>
            <NotificationBell size={24} color={txt} />
          </View>
        </View>
        {!isExpanded && (
          <TouchableOpacity
            onPress={handleRecenter}
            style={[styles.recenterBtn, { backgroundColor: cardBg }]}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={22} color={txt} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* 3. BOTTOM SHEET */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { backgroundColor: cardBg, top: animatedTop, height: height },
        ]}
      >
        {/* --- DRAGGABLE HEADER AREA --- */}
        {/* We attach panHandlers here so dragging works on the Handle, Search, and Tabs */}
        <View {...panResponder.panHandlers} style={{ backgroundColor: cardBg }}>
          {/* Handle */}
          <View style={styles.dragHandleContainer}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isDark ? "#333" : "#E0E0E0" },
              ]}
            />
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
              <Ionicons
                name="search"
                size={20}
                color="#888"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={[styles.searchInput, { color: txt }]}
                placeholder="Where to create?"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={snapToExpanded}
              />
              {isSearchingLocation && (
                <ActivityIndicator
                  size="small"
                  color={txt}
                  style={{ marginRight: 10 }}
                />
              )}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setLocationSuggestions([]);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="#888"
                    style={{ marginRight: 10 }}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* A. LOCATION SUGGESTIONS (Immediate Overlay) */}
          {locationSuggestions.length > 0 && searchQuery.length > 2 ? null : ( // Don't show tabs/filters if searching for location
            <>
              {/* Tabs */}
              <View style={styles.tabsRow}>
                {(["studios", "producers", "artists"] as TabType[]).map(
                  (tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tabItem,
                        activeTab === tab && {
                          borderBottomColor: txt,
                          borderBottomWidth: 2,
                        },
                      ]}
                      onPress={() => {
                        setActiveTab(tab);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: activeTab === tab ? txt : "#888",
                            fontFamily:
                              activeTab === tab
                                ? "Manrope-Bold"
                                : "Manrope-Medium",
                          },
                        ]}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              {/* Filters */}
              <View style={styles.filtersRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
                >
                  <FilterChip
                    label="Budget"
                    icon="wallet-outline"
                    isActive={activeFilter === "budget"}
                    onPress={() =>
                      setActiveFilter(
                        activeFilter === "budget" ? null : "budget",
                      )
                    }
                    accent={accent}
                    bg={bg}
                    txt={txt}
                  />
                  <FilterChip
                    label="Top Rated"
                    icon="star-outline"
                    isActive={activeFilter === "top_rated"}
                    onPress={() =>
                      setActiveFilter(
                        activeFilter === "top_rated" ? null : "top_rated",
                      )
                    }
                    accent={accent}
                    bg={bg}
                    txt={txt}
                  />
                  {activeTab === "studios" && (
                    <FilterChip
                      label="Open Now"
                      icon="time-outline"
                      isActive={activeFilter === "open_now"}
                      onPress={() =>
                        setActiveFilter(
                          activeFilter === "open_now" ? null : "open_now",
                        )
                      }
                      accent={accent}
                      bg={bg}
                      txt={txt}
                    />
                  )}
                  {activeFilter && (
                    <TouchableOpacity
                      onPress={() => setActiveFilter(null)}
                      style={{ justifyContent: "center", paddingHorizontal: 8 }}
                    >
                      <Text
                        style={{
                          color: "#EF4444",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        Clear
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <View style={{ height: 1, backgroundColor: border }} />
            </>
          )}
        </View>
        {/* --- END DRAGGABLE HEADER --- */}

        {/* --- SCROLLABLE CONTENT --- */}
        <View style={{ flex: 1 }}>
          {locationSuggestions.length > 0 && searchQuery.length > 2 ? (
            <View style={{ flex: 1, width: "100%" }}>
              <Text style={styles.sectionTitle}>LOCATIONS</Text>
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.locationItem, { borderBottomColor: border }]}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <View
                      style={[
                        styles.locIcon,
                        { backgroundColor: isDark ? "#333" : "#F0F0F0" },
                      ]}
                    >
                      <Ionicons name="location-sharp" size={18} color={txt} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: txt, fontWeight: "700", fontSize: 15 }}
                      >
                        {item.display_name.split(",")[0]}
                      </Text>
                      <Text
                        style={{ color: "#888", fontSize: 12 }}
                        numberOfLines={1}
                      >
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : (
            <>
              {/* Horizontal Discovery (Visible when collapsed) */}
              {!isExpanded && !searchQuery && filteredData.length > 0 && (
                <View style={{ paddingVertical: 15 }}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { marginLeft: 20, marginBottom: 10 },
                    ]}
                  >
                    Nearby {activeTab}
                  </Text>
                  <FlatList
                    horizontal
                    data={filteredData.slice(0, 5)}
                    renderItem={renderHorizontalItem}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  />
                </View>
              )}

              {/* Vertical List (Expanded) */}
              {(isExpanded || searchQuery) && (
                <FlatList
                  data={filteredData}
                  renderItem={renderVerticalItem}
                  keyExtractor={(item) =>
                    item.id || item.userId || Math.random().toString()
                  }
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 150,
                    paddingTop: 10,
                  }}
                  ListHeaderComponent={
                    <Text
                      style={{ color: "#888", fontSize: 12, marginBottom: 10 }}
                    >
                      {filteredData.length} results near map center
                    </Text>
                  }
                />
              )}
            </>
          )}
        </View>
      </Animated.View>

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

// --- SUB COMPONENTS ---
const FilterChip = ({
  label,
  icon,
  isActive,
  onPress,
  accent,
  bg,
  txt,
}: any) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      isActive
        ? { backgroundColor: txt, borderColor: txt }
        : { borderColor: "#ccc" },
    ]}
    onPress={() => {
      onPress();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }}
  >
    <Ionicons name={icon} size={14} color={isActive ? bg : txt} />
    <Text style={[styles.filterText, { color: isActive ? bg : txt }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: "hidden",
  },
  dragHandleContainer: { alignItems: "center", paddingVertical: 12 },
  dragHandle: { width: 40, height: 4, borderRadius: 2 },
  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 16,
    fontFamily: "Manrope-SemiBold",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tabItem: { marginRight: 25, paddingBottom: 10 },
  tabText: { fontSize: 14, fontWeight: "600" },
  filtersRow: { height: 34, marginBottom: 15 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: "600", marginLeft: 6 },
  sectionTitle: {
    paddingHorizontal: 20,
    color: "#888",
    fontWeight: "700",
    fontSize: 12,
  },
  vItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  vImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#eee",
    marginRight: 15,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  hCard: { width: 150, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  hImage: { width: "100%", height: 90, backgroundColor: "#eee" },
  hContent: { padding: 8 },
  hTitle: { fontWeight: "700", fontSize: 14 },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  locIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
