import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useProducers, type ProducerWithUser } from '@/hooks/useProducers';

const { width } = Dimensions.get('window');

const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Country'];

export default function ProducersScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: producers = [], isLoading, refetch } = useProducers();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setMinRating(0);
  };

  const hasActiveFilters = searchQuery || selectedGenres.length > 0 || minRating > 0;

  const filteredProducers = useMemo(() => {
    return producers.filter((producer) => {
      const query = searchQuery.toLowerCase();

      // Search filter
      if (searchQuery && !(
        producer.user.username.toLowerCase().includes(query) ||
        producer.user.fullName?.toLowerCase().includes(query) ||
        producer.genres.some((g) => g.toLowerCase().includes(query))
      )) {
        return false;
      }

      // Genre filter
      if (selectedGenres.length > 0) {
        if (!producer.genres.some(g => selectedGenres.includes(g))) {
          return false;
        }
      }

      // Rating filter
      if (minRating > 0) {
        const rating = producer.user?.rating || 0;
        if (rating < minRating) return false;
      }

      return true;
    });
  }, [producers, searchQuery, selectedGenres, minRating]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Producers</Text>
        <View style={styles.headerActions}>
          {hasActiveFilters && (
            <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.filterBadgeText}>{filteredProducers.length}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.filterButton, showFilters && { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search producers..."
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
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Genre</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {GENRES.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreChip,
                      { borderColor: colors.border },
                      selectedGenres.includes(genre) && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        { color: selectedGenres.includes(genre) ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

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
                        styles.ratingText,
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredProducers.length > 0 ? (
          <View style={styles.grid}>
            {filteredProducers.map((producer) => (
              <TouchableOpacity
                key={producer.id}
                style={[styles.producerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/producer/${producer.userId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.avatarText, { color: colors.text }]}>
                        {producer.user.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {producer.user.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <Text style={[styles.producerName, { color: colors.text }]} numberOfLines={1}>
                    {producer.user.fullName || producer.user.username}
                  </Text>
                  <Text style={[styles.producerHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                    @{producer.user.username}
                  </Text>

                  {/* Location */}
                  {producer.user.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={10} color={colors.textTertiary} />
                      <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
                        {producer.user.location}
                      </Text>
                    </View>
                  )}

                  {/* Genres */}
                  {producer.genres.length > 0 && (
                    <View style={styles.genresRow}>
                      {producer.genres.slice(0, 2).map((genre, index) => (
                        <View
                          key={index}
                          style={[styles.genreBadge, { backgroundColor: colors.backgroundSecondary }]}
                        >
                          <Text style={[styles.genreBadgeText, { color: colors.textSecondary }]}>
                            {genre}
                          </Text>
                        </View>
                      ))}
                      {producer.genres.length > 2 && (
                        <Text style={[styles.moreText, { color: colors.textTertiary }]}>
                          +{producer.genres.length - 2}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    {producer.studios && producer.studios.length > 0 && (
                      <View style={styles.statItem}>
                        <Ionicons name="business" size={10} color={colors.textTertiary} />
                        <Text style={[styles.statText, { color: colors.textTertiary }]}>
                          {producer.studios.length}
                        </Text>
                      </View>
                    )}
                    {producer.beats && producer.beats.length > 0 && (
                      <View style={styles.statItem}>
                        <Ionicons name="musical-notes" size={10} color={colors.textTertiary} />
                        <Text style={[styles.statText, { color: colors.textTertiary }]}>
                          {producer.beats.length}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action */}
                  <View style={[styles.viewButton, { backgroundColor: colors.accent }]}>
                    <Text style={styles.viewButtonText}>View Profile</Text>
                    <Ionicons name="arrow-forward" size={12} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery || hasActiveFilters ? 'No producers found' : 'No producers yet'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  title: {
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
  genreChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  genreText: {
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
  ratingText: {
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  producerCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  verifiedBadge: {
    marginLeft: -8,
    marginTop: 22,
  },
  producerName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  producerHandle: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
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
  genreBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  genreBadgeText: {
    fontSize: FontSizes.xs,
  },
  moreText: {
    fontSize: FontSizes.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: FontSizes.xs,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
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
});
