import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useProducers, type ProducerWithUser } from '@/hooks/useProducers';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function ProducersScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: producers = [], isLoading, refetch } = useProducers();

  // Filter producers based on search
  const filteredProducers = producers.filter((producer) => {
    const query = searchQuery.toLowerCase();
    return (
      producer.user.username.toLowerCase().includes(query) ||
      producer.user.fullName?.toLowerCase().includes(query) ||
      producer.genres.some((g) => g.toLowerCase().includes(query))
    );
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Producers</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect with top music producers
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search producers..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading producers...
            </Text>
          </View>
        ) : filteredProducers.length > 0 ? (
          <View style={styles.producersContainer}>
            {/* Results Count */}
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              {filteredProducers.length} {filteredProducers.length === 1 ? 'producer' : 'producers'} found
            </Text>

            {/* Producers Grid */}
            <View style={styles.producersGrid}>
              {filteredProducers.map((producer) => (
                <TouchableOpacity
                  key={producer.id}
                  style={[styles.producerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/producer/${producer.userId}`)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View style={styles.producerHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                      {producer.user.avatar ? (
                        <Text>👤</Text>
                      ) : (
                        <Text style={[styles.avatarText, { color: colors.text }]}>
                          {producer.user.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    {producer.user.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Producer Info */}
                  <View style={styles.producerInfo}>
                    <Text style={[styles.producerName, { color: colors.text }]} numberOfLines={1}>
                      {producer.user.fullName || producer.user.username}
                    </Text>
                    <Text style={[styles.producerHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                      @{producer.user.username}
                    </Text>

                    {/* Location */}
                    {producer.user.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={12} color={colors.textTertiary} />
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
                            <Text style={[styles.genreText, { color: colors.textSecondary }]}>
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
                          <Ionicons name="business" size={12} color={colors.textTertiary} />
                          <Text style={[styles.statText, { color: colors.textTertiary }]}>
                            {producer.studios.length} {producer.studios.length === 1 ? 'studio' : 'studios'}
                          </Text>
                        </View>
                      )}
                      {producer.beats && producer.beats.length > 0 && (
                        <View style={styles.statItem}>
                          <Ionicons name="musical-notes" size={12} color={colors.textTertiary} />
                          <Text style={[styles.statText, { color: colors.textTertiary }]}>
                            {producer.beats.length} {producer.beats.length === 1 ? 'beat' : 'beats'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: colors.accent }]}
                    onPress={() => router.push(`/producer/${producer.userId}`)}
                  >
                    <Text style={styles.viewButtonText}>View Profile</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? 'No producers found' : 'No producers yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search' : 'Producers will appear here'}
            </Text>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
  },
  producersContainer: {
    paddingHorizontal: Spacing.lg,
  },
  resultsText: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  producersGrid: {
    gap: Spacing.md,
  },
  producerCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  producerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
  },
  verifiedBadge: {
    marginLeft: -8,
    marginTop: 28,
  },
  producerInfo: {
    marginBottom: Spacing.sm,
  },
  producerName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  producerHandle: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: FontSizes.xs,
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
  genreText: {
    fontSize: FontSizes.xs,
  },
  moreText: {
    fontSize: FontSizes.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  emptyState: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
