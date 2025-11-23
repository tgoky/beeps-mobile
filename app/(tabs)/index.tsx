import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useStudios } from '@/hooks/useStudios';
import { useProducers } from '@/hooks/useProducers';
import { useArtists } from '@/hooks/useArtists';
import CustomMapView from '@/components/CustomMapView';
import { NotificationBell } from '@/components/NotificationBell';

const { width } = Dimensions.get('window');

type TabType = 'studios' | 'producers' | 'artists';
type ViewMode = 'map' | 'grid';

const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Country'];

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [activeTab, setActiveTab] = useState<TabType>('studios');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedStudio, setSelectedStudio] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(50); // km
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch real data
  const { data: studios, isLoading: studiosLoading } = useStudios();
  const { data: producers, isLoading: producersLoading } = useProducers();
  const { data: artists, isLoading: artistsLoading } = useArtists();

  // User location (San Francisco for demo)
  const userLocation = { latitude: 37.7849, longitude: -122.4094 };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setMaxDistance(50);
    setMinRating(0);
  };

  const hasActiveFilters = searchQuery || selectedGenres.length > 0 || maxDistance < 50 || minRating > 0;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="music-circle" size={64} color={colors.primary} />
          <Text style={[styles.authSubtitle, { color: colors.text }]}>Welcome to Beeps</Text>
          <Text style={[styles.authDescription, { color: colors.textSecondary }]}>
            Your music production marketplace
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[styles.authButtonTextSecondary, { color: colors.text }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getFilteredData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'studios':
        data = studios || [];
        break;
      case 'producers':
        data = producers || [];
        break;
      case 'artists':
        data = artists || [];
        break;
    }

    // Apply filters
    return data.filter((item: any) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = activeTab === 'studios'
          ? item.name?.toLowerCase()
          : (item.user?.fullName?.toLowerCase() || item.user?.username?.toLowerCase() || '');
        if (!name.includes(query)) return false;
      }

      // Genre filter
      if (selectedGenres.length > 0 && activeTab !== 'studios') {
        const itemGenres = item.genres || [];
        if (!itemGenres.some((g: string) => selectedGenres.includes(g))) return false;
      }

      // Rating filter
      if (minRating > 0) {
        const rating = activeTab === 'studios' ? item.rating : item.user?.rating || 0;
        if (rating < minRating) return false;
      }

      return true;
    });
  };

  const filteredData = useMemo(() => getFilteredData(), [
    activeTab,
    studios,
    producers,
    artists,
    searchQuery,
    selectedGenres,
    maxDistance,
    minRating,
  ]);

  const isLoading = () => {
    switch (activeTab) {
      case 'studios':
        return studiosLoading;
      case 'producers':
        return producersLoading;
      case 'artists':
        return artistsLoading;
      default:
        return false;
    }
  };

  const renderGridView = () => {
    const loading = isLoading();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'studios' ? 'microphone' : activeTab === 'producers' ? 'music-box' : 'account-music'}
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No {activeTab} found
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredData.map((item: any) => {
            let name = '';
            let price = 0;
            let rating = 0;
            let location = '';
            let genres: string[] = [];

            if (activeTab === 'studios') {
              name = item.name;
              price = item.hourlyRate;
              rating = item.rating;
              location = item.city || item.state || '';
            } else if (activeTab === 'producers') {
              name = item.user.fullName || item.user.username;
              price = item.productionRate || 0;
              rating = item.user?.rating || 0;
              location = item.user.location || '';
              genres = item.genres || [];
            } else if (activeTab === 'artists') {
              name = item.user.fullName || item.user.username;
              rating = item.user?.rating || 0;
              location = item.user.location || '';
              genres = item.genres || [];
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (activeTab === 'studios') {
                    Alert.alert('Coming Soon', 'Studio booking feature will be available soon!');
                  } else if (activeTab === 'producers') {
                    router.push(`/producer/${item.userId}`);
                  } else {
                    router.push(`/profile/${item.user.id}`);
                  }
                }}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    {rating > 0 && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={10} color="#F59E0B" />
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                          {rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={10} color={colors.textTertiary} />
                      <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                  )}

                  {genres.length > 0 && (
                    <View style={styles.genresRow}>
                      {genres.slice(0, 2).map((genre, index) => (
                        <View key={index} style={[styles.genreChip, { backgroundColor: colors.backgroundSecondary }]}>
                          <Text style={[styles.genreText, { color: colors.textSecondary }]}>{genre}</Text>
                        </View>
                      ))}
                      {genres.length > 2 && (
                        <Text style={[styles.moreGenres, { color: colors.textTertiary }]}>+{genres.length - 2}</Text>
                      )}
                    </View>
                  )}

                  {price > 0 && (
                    <Text style={[styles.priceText, { color: colors.text }]}>
                      ${price}/hr
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  const renderMapView = () => {
    const loading = isLoading();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (activeTab !== 'studios') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Map view is only available for studios
          </Text>
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: colors.accent }]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={styles.switchButtonText}>Switch to Grid</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No studios found
          </Text>
        </View>
      );
    }

    const studiosWithLocation = filteredData.map((studio: any, index: number) => {
      if (studio.latitude && studio.longitude) {
        return studio;
      }
      const offsetLat = (index % 5) * 0.01 - 0.02;
      const offsetLon = Math.floor(index / 5) * 0.01 - 0.02;
      return {
        ...studio,
        latitude: userLocation.latitude + offsetLat,
        longitude: userLocation.longitude + offsetLon,
      };
    });

    return (
      <CustomMapView
        studios={studiosWithLocation}
        theme={effectiveTheme}
        onStudioPress={(studio) => setSelectedStudio(studio)}
        selectedStudio={selectedStudio}
        userLocation={userLocation}
      />
    );
  };

  const tabs = [
    { key: 'studios' as TabType, label: 'Studios', icon: 'business' },
    { key: 'producers' as TabType, label: 'Producers', icon: 'headset' },
    { key: 'artists' as TabType, label: 'Artists', icon: 'mic' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.greeting, { color: colors.text }]}>Discover</Text>
        <View style={styles.headerActions}>
          <NotificationBell size={20} />
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.filterBadgeText}>{filteredData.length}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.filterButton, showFilters && { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.viewToggleContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'grid' && { backgroundColor: colors.card }]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={14} color={viewMode === 'grid' ? colors.accent : colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'map' && { backgroundColor: colors.card }]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map" size={14} color={viewMode === 'map' ? colors.accent : colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Genre Filter */}
            {activeTab !== 'studios' && (
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Genre</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreFilterChip,
                        { borderColor: colors.border },
                        selectedGenres.includes(genre) && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => toggleGenre(genre)}
                    >
                      <Text
                        style={[
                          styles.genreFilterText,
                          { color: selectedGenres.includes(genre) ? '#fff' : colors.textSecondary },
                        ]}
                      >
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Rating Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Min Rating</Text>
              <View style={styles.ratingFilters}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingChip,
                      { borderColor: colors.border },
                      minRating === rating && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => setMinRating(rating)}
                  >
                    <Ionicons name="star" size={10} color={minRating === rating ? '#fff' : '#F59E0B'} />
                    <Text
                      style={[
                        styles.ratingChipText,
                        { color: minRating === rating ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearAllButton} onPress={clearFilters}>
                <Text style={[styles.clearAllText, { color: colors.error }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsContainer, { backgroundColor: colors.background }]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              { borderColor: colors.border },
              activeTab === tab.key && {
                backgroundColor: colors.accent,
                borderColor: colors.accent
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? '#fff' : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {viewMode === 'map' ? renderMapView() : renderGridView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  viewToggleButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    padding: 0,
  },
  filtersPanel: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.lg,
  },
  filterGroup: {
    marginRight: Spacing.lg,
  },
  filterLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  genreFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  genreFilterText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  ratingFilters: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  ratingChipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  clearAllButton: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  clearAllText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  gridCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardHeader: {
    marginBottom: Spacing.xs,
  },
  cardName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  ratingText: {
    fontSize: FontSizes.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: FontSizes.xs,
    flex: 1,
  },
  genresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  genreChip: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  genreText: {
    fontSize: FontSizes.xs,
  },
  moreGenres: {
    fontSize: FontSizes.xs,
  },
  priceText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  clearFiltersButton: {
    marginTop: Spacing.sm,
  },
  clearFiltersText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  switchButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  authSubtitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  authDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  authButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    width: width - Spacing.xl * 2,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  authButtonTextSecondary: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
});
