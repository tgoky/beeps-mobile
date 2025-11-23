import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useBeats } from '@/hooks/useBeats';
import { useEquipment } from '@/hooks/useEquipment';
import { NotificationBell } from '@/components/NotificationBell';

type MarketplaceTab = 'beats' | 'equipment';

export default function MarketplaceScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('beats');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const { data: beats, isLoading: beatsLoading } = useBeats();
  const { data: equipment, isLoading: equipmentLoading } = useEquipment();

  // Filter data based on search query
  const filteredBeats = useMemo(() => {
    if (!beats || !searchQuery.trim()) return beats;
    const query = searchQuery.toLowerCase();
    return beats.filter(
      (beat) =>
        beat.title.toLowerCase().includes(query) ||
        beat.producer.username.toLowerCase().includes(query) ||
        beat.producer.fullName?.toLowerCase().includes(query) ||
        beat.genres.some((genre) => genre.toLowerCase().includes(query))
    );
  }, [beats, searchQuery]);

  const filteredEquipment = useMemo(() => {
    if (!equipment || !searchQuery.trim()) return equipment;
    const query = searchQuery.toLowerCase();
    return equipment.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.seller.username.toLowerCase().includes(query) ||
        item.seller.fullName?.toLowerCase().includes(query)
    );
  }, [equipment, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Marketplace</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Buy beats & equipment
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <NotificationBell size={20} />
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsContainer, { backgroundColor: colors.background }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'beats' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('beats')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="music-box-multiple"
            size={20}
            color={activeTab === 'beats' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'beats' ? '#fff' : colors.textSecondary },
            ]}
          >
            Beats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'equipment' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('equipment')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="microphone"
            size={20}
            color={activeTab === 'equipment' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'equipment' ? '#fff' : colors.textSecondary },
            ]}
          >
            Equipment
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'beats' && (
          <>
            {beatsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading beats...
                </Text>
              </View>
            ) : filteredBeats && filteredBeats.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredBeats.map((beat) => (
                  <TouchableOpacity
                    key={beat.id}
                    style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <MaterialCommunityIcons name="music-box-multiple" size={20} color={colors.accent} />
                        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                          {beat.title}
                        </Text>
                      </View>
                      <View style={[styles.playsBadge, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="play" size={12} color={colors.textSecondary} />
                        <Text style={[styles.playsText, { color: colors.textSecondary }]}>
                          {beat.plays}
                        </Text>
                      </View>
                    </View>

                    {beat.producer && (
                      <View style={styles.producerRow}>
                        <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.producerText, { color: colors.textTertiary }]}>
                          {beat.producer.fullName || beat.producer.username}
                        </Text>
                      </View>
                    )}

                    {beat.genres && beat.genres.length > 0 && (
                      <View style={styles.genresContainer}>
                        {beat.genres.slice(0, 3).map((genre, index) => (
                          <View key={index} style={[styles.genreBadge, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.genreText, { color: colors.textSecondary }]}>
                              {genre}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.beatInfoRow}>
                      {beat.bpm && (
                        <Text style={[styles.beatInfoText, { color: colors.textSecondary }]}>
                          {beat.bpm} BPM
                        </Text>
                      )}
                      {beat.key && (
                        <Text style={[styles.beatInfoText, { color: colors.textSecondary }]}>
                          {beat.key}
                        </Text>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.priceText, { color: colors.text }]}>
                        ${beat.price.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: colors.accent }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cart" size={16} color="#fff" />
                        <Text style={styles.cardButtonText}>Add to Cart</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 80 }} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="music-box-multiple" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No Beats Found' : 'No Beats Available'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? `No beats match "${searchQuery}"\nTry a different search term`
                    : 'Check back later for new beats\nfrom talented producers'}
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'equipment' && (
          <>
            {equipmentLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading equipment...
                </Text>
              </View>
            ) : filteredEquipment && filteredEquipment.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredEquipment.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <MaterialCommunityIcons name="microphone" size={20} color={colors.accent} />
                        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <View style={[styles.conditionBadge, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                          {item.condition}
                        </Text>
                      </View>
                    </View>

                    {item.seller && (
                      <View style={styles.producerRow}>
                        <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.producerText, { color: colors.textTertiary }]}>
                          {item.seller.fullName || item.seller.username}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.categoryBadge, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.categoryText, { color: colors.accent }]}>
                        {item.category}
                      </Text>
                    </View>

                    {(item.city || item.state) && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                          {[item.city, item.state].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <View>
                        {item.price && (
                          <Text style={[styles.priceText, { color: colors.text }]}>
                            ${item.price.toFixed(2)}
                          </Text>
                        )}
                        {item.rentalRate && (
                          <Text style={[styles.rentalText, { color: colors.textSecondary }]}>
                            ${item.rentalRate}/day rental
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: colors.accent }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cardButtonText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 80 }} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="microphone" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No Equipment Found' : 'No Equipment Available'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? `No equipment matches "${searchQuery}"\nTry a different search term`
                    : 'Check back later for new\nequipment listings'}
                </Text>
              </View>
            )}
          </>
        )}
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
    alignItems: 'flex-start',
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
    letterSpacing: 0.2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  emptyState: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  gridCard: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    flex: 1,
    letterSpacing: -0.2,
  },
  playsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  playsText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  producerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  producerText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  genreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  genreText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  beatInfoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  beatInfoText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  priceText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.3,
  },
  conditionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  conditionText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    textTransform: 'capitalize',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  rentalText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    marginTop: 2,
  },
});
