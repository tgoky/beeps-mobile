import CustomMapView from "@/components/CustomMapView";
import { RequestServiceModal } from "@/components/RequestServiceModal";
import StudioVerificationBadge from "@/components/StudioVerificationBadge";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useArtists } from "@/hooks/useArtists";
import { useProducers } from "@/hooks/useProducers";
import { useStudios } from "@/hooks/useStudios";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

type TabType = "studios" | "producers" | "artists";
type ViewMode = "map" | "list";

const GENRES = [
  "Hip Hop",
  "R&B",
  "Pop",
  "Rock",
  "Electronic",
  "Jazz",
  "Classical",
  "Country",
];

export default function ExploreScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";

  const [activeTab, setActiveTab] = useState<TabType>("studios");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedStudio, setSelectedStudio] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [requestServiceProducer, setRequestServiceProducer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: studios, isLoading: studiosLoading } = useStudios();
  const { data: producers, isLoading: producersLoading } = useProducers();
  const { data: artists, isLoading: artistsLoading } = useArtists();

  const userLocation = { latitude: 37.7849, longitude: -122.4094 };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenres([]);
    setMinRating(0);
  };

  const hasActiveFilters =
    searchQuery || selectedGenres.length > 0 || minRating > 0;

  const getFilteredData = () => {
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
    return data.filter((item: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        let name = "";
        if (activeTab === "studios") {
          name = item.name?.toLowerCase() || "";
        } else {
          name =
            item.user?.fullName?.toLowerCase() ||
            item.user?.username?.toLowerCase() ||
            "";
        }
        if (!name.includes(query)) return false;
      }
      if (selectedGenres.length > 0) {
        const itemGenres = item.genres || [];
        if (!itemGenres.some((g: string) => selectedGenres.includes(g)))
          return false;
      }
      if (minRating > 0) {
        const rating =
          activeTab === "studios" ? item.rating : item.user?.rating || 0;
        if (rating < minRating) return false;
      }
      return true;
    });
  };

  const filteredData = useMemo(
    () => getFilteredData(),
    [
      activeTab,
      studios,
      producers,
      artists,
      searchQuery,
      selectedGenres,
      minRating,
    ],
  );

  const isLoading = () => {
    switch (activeTab) {
      case "studios":
        return studiosLoading;
      case "producers":
        return producersLoading;
      case "artists":
        return artistsLoading;
      default:
        return false;
    }
  };

  if (!user) return null;

  const renderCompactItem = ({ item }: { item: any }) => {
    let name = "",
      price = 0,
      rating = 0,
      location = "",
      imageUrl = "";

    if (activeTab === "studios") {
      name = item.name;
      price = item.hourlyRate;
      rating = item.rating;
      location = item.city || "Downtown";
      imageUrl =
        item.imageUrl ||
        `https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=400&q=80`;
    } else {
      name = item.user?.fullName || item.user?.username || "Unknown";
      price = item.productionRate || 0;
      rating = item.user?.rating || 0;
      location = item.user?.location || "Remote";
      imageUrl =
        item.user?.avatarUrl ||
        `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80`;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.compactCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => {
          if (activeTab === "studios") router.push(`/studio/${item.id}`);
          else if (activeTab === "producers")
            router.push(`/producer/${item.userId}`);
          else router.push(`/profile/${item.user.id}`);
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.compactImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                flex: 1,
              }}
            >
              <Text
                style={[styles.compactTitle, { color: colors.text, flex: 0 }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              {activeTab === "studios" && item.verificationStatus && (
                <StudioVerificationBadge
                  status={item.verificationStatus}
                  size="sm"
                />
              )}
            </View>
            {rating > 0 && (
              <View style={styles.compactRating}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text
                  style={[styles.compactRatingText, { color: colors.text }]}
                >
                  {rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.compactLocation, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            <Ionicons
              name="location-sharp"
              size={10}
              color={colors.textTertiary}
            />{" "}
            {location}
          </Text>
          <View style={styles.compactFooter}>
            <Text style={[styles.compactPrice, { color: colors.primary }]}>
              {price > 0 ? `$${price}` : "Contact"}
              {price > 0 && (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "400",
                    color: colors.textTertiary,
                  }}
                >
                  /hr
                </Text>
              )}
            </Text>
            {activeTab === "producers" && user.id !== item.userId && (
              <TouchableOpacity
                style={[
                  styles.compactAddBtn,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={() =>
                  setRequestServiceProducer({ id: item.userId, name })
                }
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading()) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (viewMode === "map") {
      if (activeTab !== "studios") {
        return (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Map view only available for Studios
            </Text>
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Return to List
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      const studiosWithLocation = filteredData.map(
        (studio: any, index: number) => ({
          ...studio,
          latitude:
            studio.latitude ||
            userLocation.latitude + (Math.random() - 0.5) * 0.05,
          longitude:
            studio.longitude ||
            userLocation.longitude + (Math.random() - 0.5) * 0.05,
        }),
      );

      return (
        <CustomMapView
          studios={studiosWithLocation}
          theme={effectiveTheme}
          onStudioPress={setSelectedStudio}
          selectedStudio={selectedStudio}
          userLocation={userLocation}
          region={userLocation}
        />
      );
    }

    if (filteredData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="magnify-remove-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No matches found
          </Text>
          <TouchableOpacity onPress={clearFilters} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredData}
        renderItem={renderCompactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header with back button */}
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Explore
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchRow}>
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
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="options-outline" size={20} color={colors.text} />
              {hasActiveFilters && <View style={styles.activeFilterDot} />}
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {["studios", "producers", "artists"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  setActiveTab(tab as TabType);
                  if (tab !== "studios") setViewMode("list");
                }}
                style={[
                  styles.tabItem,
                  activeTab === tab && {
                    borderBottomColor: colors.text,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab ? colors.text : colors.textTertiary,
                    },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filters */}
        {showFilters && (
          <View
            style={[
              styles.filtersContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => toggleGenre(g)}
                  style={[
                    styles.filterChip,
                    selectedGenres.includes(g)
                      ? {
                          backgroundColor: colors.text,
                          borderColor: colors.text,
                        }
                      : { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: selectedGenres.includes(g)
                        ? colors.background
                        : colors.text,
                    }}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content */}
        <View style={{ flex: 1 }}>{renderContent()}</View>

        {/* Map Toggle */}
        {activeTab === "studios" && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.floatingButton, { backgroundColor: colors.text }]}
              onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
            >
              <Ionicons
                name={viewMode === "list" ? "map" : "list"}
                size={18}
                color={colors.background}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.floatingButtonText,
                  { color: colors.background },
                ]}
              >
                {viewMode === "list" ? "Map" : "List"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modals */}
        {requestServiceProducer && (
          <RequestServiceModal
            visible={!!requestServiceProducer}
            onClose={() => setRequestServiceProducer(null)}
            producerId={requestServiceProducer.id}
            producerName={requestServiceProducer.name}
            clientId={user.id}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "500",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilterDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 24,
  },
  tabItem: {
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  listContent: {
    padding: Spacing.md,
  },
  compactCard: {
    flexDirection: "row",
    height: 90,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  compactImage: {
    width: 90,
    height: "100%",
  },
  compactContent: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  compactRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactRatingText: {
    fontSize: 11,
    fontWeight: "700",
  },
  compactLocation: {
    fontSize: 12,
    marginTop: -4,
  },
  compactFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  compactAddBtn: {
    padding: 4,
    borderRadius: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#000",
    borderRadius: 20,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
  },
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
