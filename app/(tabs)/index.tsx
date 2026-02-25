import CustomMapView from "@/components/CustomMapView";
import { NotificationBell } from "@/components/NotificationBell";
import { RequestServiceModal } from "@/components/RequestServiceModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useArtists } from "@/hooks/useArtists";
import { useProducers } from "@/hooks/useProducers";
import { useStudios } from "@/hooks/useStudios";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
//

const { width, height } = Dimensions.get("window");

// --- CONFIGURATION ---
const COLLAPSED_HEIGHT = 340;
const EXPANDED_HEIGHT = height * 0.92;
const DRAG_THRESHOLD = 50;

type TabType = "studios" | "producers" | "artists";
type FilterType = "budget" | "top_rated" | null;
type SearchMode = "database" | "location"; // Database = Filtering items; Location = Moving map

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();

  // Theme
  const isDark = effectiveTheme === "dark";
  const bg = isDark ? "#000000" : "#FFFFFF";
  const txt = isDark ? "#FFFFFF" : "#000000";
  const cardBg = isDark ? "#121212" : "#FFFFFF";
  const border = isDark ? "#333333" : "#F0F0F0";
  const inputBg = isDark ? "#222" : "#F5F5F5";

  // Data
  const { data: studios } = useStudios();
  const { data: producers } = useProducers();
  const { data: artists } = useArtists();

  // Map State (Camera)
  const [region, setRegion] = useState({
    latitude: 6.5244, // Default to Lagos
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("studios");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("database");
  const [isExpanded, setIsExpanded] = useState(false);
  const [requestServiceProducer, setRequestServiceProducer] =
    useState<any>(null);

  // Animation
  const animatedTop = useRef(
    new Animated.Value(height - COLLAPSED_HEIGHT),
  ).current;

  // Guard
  if (!user) return null;

  // --- 1. REAL LOCATION SEARCH (Nominatim API) ---
  const fetchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      // Free OpenStreetMap API (No Key Needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=ng`, // Limiting to NG for context, remove if global
      );
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.log("Location search error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle Text Change
  const onSearchTextChange = (text: string) => {
    setSearchQuery(text);

    // If user is explicitly looking for a location (we can toggle this via UI or inference)
    // For now, let's assume if they are in "Studios" tab, they might be searching location
    if (activeTab === "studios") {
      fetchLocations(text);
    }
  };

  const handleLocationSelect = (loc: any) => {
    Keyboard.dismiss();
    setSearchQuery(loc.display_name.split(",")[0]); // Set text to "Lekki" instead of full address
    setLocationSuggestions([]); // Hide suggestions

    // 1. Move Map
    const newRegion = {
      latitude: parseFloat(loc.lat),
      longitude: parseFloat(loc.lon),
      latitudeDelta: 0.05, // Zoom in
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);

    // 2. Snap to partially expanded to show results
    snapToCollapsed();
  };

  // --- 2. FILTERING LOGIC (Database) ---
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

    // Filter by text (Name match)
    // Note: We don't filter by location text anymore, we trust the Map Center logic below
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

    // Filter by Map Proximity (If active tab is Studio)
    // This is "Search this area" logic
    if (activeTab === "studios") {
      // Simple bounding box or radius check could go here
      // For now, we just sort by distance to map center?
      // Let's keep it simple: Show all, but maybe sort nearby?
      // Or strictly filter:
      /* data = data.filter(studio => {
           const dist = getDistance(region, {lat: studio.latitude, lon: studio.longitude});
           return dist < 20km;
        }) 
        */
    }

    return data;
  }, [
    activeTab,
    studios,
    producers,
    artists,
    searchQuery,
    locationSuggestions,
    region,
  ]);

  // --- GESTURES & ANIMATION ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        const currentTop = isExpanded
          ? height - EXPANDED_HEIGHT
          : height - COLLAPSED_HEIGHT;
        let newTop = currentTop + gestureState.dy;
        if (newTop < height - EXPANDED_HEIGHT)
          newTop = height - EXPANDED_HEIGHT;
        if (newTop > height - COLLAPSED_HEIGHT)
          newTop = height - COLLAPSED_HEIGHT;
        animatedTop.setValue(newTop);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -DRAG_THRESHOLD) snapToExpanded();
        else if (gestureState.dy > DRAG_THRESHOLD) snapToCollapsed();
        else isExpanded ? snapToExpanded() : snapToCollapsed();
      },
    }),
  ).current;

  const snapToExpanded = () => {
    setIsExpanded(true);
    Animated.spring(animatedTop, {
      toValue: height - EXPANDED_HEIGHT,
      useNativeDriver: false,
    }).start();
  };

  const snapToCollapsed = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
    Animated.spring(animatedTop, {
      toValue: height - COLLAPSED_HEIGHT,
      useNativeDriver: false,
    }).start();
  };

  // --- RENDER ---
  const renderItem = ({ item }: { item: any }) => {
    // ... Standard list item render (same as before)
    let name =
      activeTab === "studios"
        ? item.name
        : item.user?.fullName || item.user?.username;
    let imageUrl =
      activeTab === "studios" ? item.imageUrl : item.user?.avatarUrl;
    if (!imageUrl)
      imageUrl =
        "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=400&q=80";

    return (
      <TouchableOpacity
        style={[styles.itemCard, { borderBottomColor: border }]}
        onPress={() =>
          router.push(
            activeTab === "studios"
              ? `/studio/${item.id}`
              : `/profile/${item.user?.id}`,
          )
        }
      >
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: txt, fontWeight: "bold", fontSize: 16 }}>
            {name}
          </Text>
          <Text style={{ color: "#888", fontSize: 13 }}>
            {activeTab === "studios" ? item.city : "Artist"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* 1. MAP VIEW (Source of Truth for Location) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { paddingBottom: COLLAPSED_HEIGHT - 50 },
        ]}
      >
        <CustomMapView
          studios={activeTab === "studios" ? filteredData : []} // Show pins for current list
          theme={effectiveTheme}
          region={region} // <--- DYNAMIC REGION
          onRegionChangeComplete={setRegion} // Update region when user pans manually
        />
      </View>

      {/* 2. HEADER */}
      <SafeAreaView style={styles.headerSafe} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => router.push("/profile/settings")}
          style={[styles.circleBtn, { backgroundColor: cardBg }]}
        >
          <Ionicons name="menu" size={24} color={txt} />
        </TouchableOpacity>
        <View style={[styles.circleBtn, { backgroundColor: cardBg }]}>
          <NotificationBell size={24} color={txt} />
        </View>
      </SafeAreaView>

      {/* 3. BOTTOM SHEET */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { backgroundColor: cardBg, top: animatedTop, height: height },
        ]}
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: isDark ? "#333" : "#E0E0E0" },
            ]}
          />
        </View>

        {/* SEARCH BAR */}
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
              placeholder="Find studio, artist or location..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={onSearchTextChange}
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

        {/* --- DYNAMIC CONTENT AREA --- */}

        {/* CASE A: SHOWING REAL WORLD LOCATIONS (Autocomplete) */}
        {locationSuggestions.length > 0 && searchQuery.length > 2 ? (
          <View style={{ flex: 1, width: "100%" }}>
            <Text
              style={{
                paddingHorizontal: 20,
                paddingBottom: 10,
                color: "#888",
                fontWeight: "600",
              }}
            >
              Locations
            </Text>
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
                      style={{ color: txt, fontWeight: "600", fontSize: 15 }}
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
          // CASE B: SHOWING DATABASE RESULTS (Normal App Flow)
          <>
            {/* Tabs */}
            <View style={styles.tabsRow}>
              {(["studios", "producers", "artists"] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabItem,
                    activeTab === tab && {
                      borderBottomColor: txt,
                      borderBottomWidth: 2,
                    },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === tab ? txt : "#888" },
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* List */}
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item) =>
                item.id || item.userId || Math.random().toString()
              }
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 150,
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#888" }}>
                    No results in this area.
                  </Text>
                </View>
              }
            />
          </>
        )}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafe: {
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
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginRight: 15,
  },

  // Location Suggestion Styles
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
