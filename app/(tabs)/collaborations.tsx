import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import {
  useCollaborations,
  useCreateCollaboration,
  CollaborationWithCreator,
} from '@/hooks/useCollaborations';
import { CollaborationType } from '@/types/database';
import CreateCollaborationModal from '@/components/CreateCollaborationModal';

type CollabTab = 'deal' | 'collab' | 'bid';

export default function CollaborationsScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<CollabTab>('deal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState(50);
  const [bidMessage, setBidMessage] = useState('');
  const [likedSessions, setLikedSessions] = useState<Set<string>>(new Set());

  // Map activeTab to API type filter
  const tabTypeMap: Record<CollabTab, CollaborationType> = {
    deal: 'PROJECT', // Using PROJECT for deals
    collab: 'SESSION', // Using SESSION for collabs
    bid: 'AUCTION', // Using AUCTION for bids
  };

  // Fetch collaborations
  const { data: apiCollaborations = [], isLoading, error } = useCollaborations();

  // Filter collaborations
  const filteredCollaborations = useMemo(() => {
    if (!apiCollaborations) return [];

    return apiCollaborations.filter((collab) => {
      // Type filter
      const matchesTab =
        (activeTab === 'deal' && collab.type === 'PROJECT') ||
        (activeTab === 'collab' && collab.type === 'SESSION') ||
        (activeTab === 'bid' && collab.type === 'AUCTION');

      // Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        collab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collab.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collab.creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collab.creator.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Genre filter
      const matchesGenre = selectedGenre === 'all' || collab.genre === selectedGenre;

      // Location filter
      const matchesLocation =
        selectedLocation === 'all' ||
        collab.location?.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesTab && matchesSearch && matchesGenre && matchesLocation;
    });
  }, [apiCollaborations, activeTab, searchQuery, selectedGenre, selectedLocation]);

  const toggleLike = (id: string) => {
    setLikedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAction = (collab: CollaborationWithCreator) => {
    setSelectedCollabId(collab.id);
    if (activeTab === 'bid') {
      setBidPrice(collab.currentBid ? parseFloat(collab.currentBid.toString()) + 5 : 50);
    }
    setShowBidModal(true);
  };

  const handleCreateByType = (type: CollabTab) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to create a collaboration');
      return;
    }
    setShowCreateModal(true);
  };

  const getTypeLabel = (type: CollabTab) => {
    return type === 'deal' ? 'Hot Deals' : type === 'collab' ? 'Collabs' : 'Bids';
  };

  const getTypeIcon = (type: CollabTab) => {
    return type === 'deal' ? 'flash' : type === 'collab' ? 'people' : 'cash';
  };

  const getRating = () => 4.5 + Math.random() * 0.5;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="music-box" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Collabs & Deals</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Find deals, collabs, or name your price
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.accent }]}
          onPress={() => handleCreateByType(activeTab)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters Section */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search sessions..."
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

        {/* Genre & Location Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterHalf}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Genre</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  // Show genre picker - simplified for mobile
                  Alert.alert(
                    'Select Genre',
                    '',
                    [
                      { text: 'All Genres', onPress: () => setSelectedGenre('all') },
                      { text: 'Hip Hop', onPress: () => setSelectedGenre('Hip Hop') },
                      { text: 'Trap', onPress: () => setSelectedGenre('Trap') },
                      { text: 'R&B', onPress: () => setSelectedGenre('R&B') },
                      { text: 'Pop', onPress: () => setSelectedGenre('Pop') },
                      { text: 'Electronic', onPress: () => setSelectedGenre('Electronic') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {selectedGenre === 'all' ? 'All Genres' : selectedGenre}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterHalf}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Location</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Location',
                    '',
                    [
                      { text: 'All Locations', onPress: () => setSelectedLocation('all') },
                      { text: 'Los Angeles', onPress: () => setSelectedLocation('Los Angeles') },
                      { text: 'New York', onPress: () => setSelectedLocation('New York') },
                      { text: 'Miami', onPress: () => setSelectedLocation('Miami') },
                      { text: 'Remote', onPress: () => setSelectedLocation('Remote') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
          {(['deal', 'collab', 'bid'] as CollabTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.accent },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getTypeIcon(tab) as any}
                size={16}
                color={activeTab === tab ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? '#fff' : colors.textSecondary },
                ]}
              >
                {getTypeLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading collaborations...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load collaborations
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Please try again later
          </Text>
        </View>
      )}

      {/* Results Count */}
      {!isLoading && !error && (
        <View style={styles.resultsCount}>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {filteredCollaborations.length} {filteredCollaborations.length === 1 ? 'session' : 'sessions'} found
          </Text>
        </View>
      )}

      {/* Collaborations List */}
      {!isLoading && !error && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredCollaborations.length > 0 ? (
            <View style={styles.gridContainer}>
              {filteredCollaborations.map((collab) => {
                const isLiked = likedSessions.has(collab.id);
                const rating = getRating();

                return (
                  <TouchableOpacity
                    key={collab.id}
                    style={[styles.collabCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      // TODO: Navigate to collaboration detail page
                      Alert.alert('Coming Soon', 'Collaboration details page');
                    }}
                  >
                    {/* Cover Image */}
                    <View style={styles.coverImageContainer}>
                      <Image
                        source={{
                          uri: collab.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
                        }}
                        style={styles.coverImage}
                      />

                      {/* Type Badge */}
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor:
                              activeTab === 'deal'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : activeTab === 'collab'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(34, 197, 94, 0.2)',
                            borderColor:
                              activeTab === 'deal'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : activeTab === 'collab'
                                ? 'rgba(59, 130, 246, 0.3)'
                                : 'rgba(34, 197, 94, 0.3)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeText,
                            {
                              color:
                                activeTab === 'deal'
                                  ? '#EF4444'
                                  : activeTab === 'collab'
                                  ? '#3B82F6'
                                  : '#22C55E',
                            },
                          ]}
                        >
                          {activeTab === 'deal' ? 'DEAL' : activeTab === 'collab' ? 'COLLAB' : 'BID'}
                        </Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={styles.collabContent}>
                      {/* Title & Creator */}
                      <View style={styles.collabHeader}>
                        <View style={styles.collabTitleContainer}>
                          <Text style={[styles.collabTitle, { color: colors.text }]} numberOfLines={1}>
                            {collab.title}
                          </Text>
                          <View style={styles.creatorRow}>
                            <Image
                              source={{
                                uri:
                                  collab.creator.avatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.creator.id}`,
                              }}
                              style={styles.creatorAvatar}
                            />
                            <Text style={[styles.creatorName, { color: colors.textSecondary }]} numberOfLines={1}>
                              {collab.creator.fullName || collab.creator.username}
                            </Text>
                            <View style={styles.ratingContainer}>
                              <Ionicons name="star" size={10} color="#F59E0B" />
                              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                                {rating.toFixed(1)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Details */}
                      <View style={styles.detailsRow}>
                        {collab.location && (
                          <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                              {collab.location}
                            </Text>
                          </View>
                        )}
                        {collab.duration && (
                          <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                              {collab.duration}h
                            </Text>
                          </View>
                        )}
                        {collab.slots && (
                          <View style={styles.detailItem}>
                            <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                              {collab.slots} left
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Genre Tag */}
                      {collab.genre && (
                        <View style={styles.tagsRow}>
                          <View
                            style={[
                              styles.genreTag,
                              {
                                backgroundColor: effectiveTheme === 'dark' ? '#fff' : '#000',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.genreText,
                                { color: effectiveTheme === 'dark' ? '#000' : '#fff' },
                              ]}
                            >
                              {collab.genre}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Footer - Price & Actions */}
                      <View style={[styles.collabFooter, { borderTopColor: colors.border }]}>
                        <View>
                          {activeTab === 'bid' ? (
                            <Text style={[styles.priceText, { color: colors.text }]}>Bid Now</Text>
                          ) : activeTab === 'collab' ? (
                            <Text style={[styles.priceText, { color: colors.text }]}>Negotiable</Text>
                          ) : collab.price ? (
                            <Text style={[styles.priceText, { color: colors.text }]}>${collab.price}</Text>
                          ) : (
                            <Text style={[styles.priceText, { color: colors.text }]}>-</Text>
                          )}
                        </View>

                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.accent }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAction(collab);
                            }}
                          >
                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>
                              {activeTab === 'deal' ? 'Book' : activeTab === 'collab' ? 'Request' : 'Offer'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.likeButton, { borderColor: colors.border }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleLike(collab.id);
                            }}
                          >
                            <Ionicons
                              name={isLiked ? 'heart' : 'heart-outline'}
                              size={14}
                              color={isLiked ? '#EF4444' : colors.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 80 }} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="music-box" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No sessions found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Try adjusting your filters
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Collaboration Modal */}
      {user?.id && (
        <CreateCollaborationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={user.id}
        />
      )}

      {/* Bid Modal */}
      <Modal
        visible={showBidModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
        onRequestClose={() => setShowBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bidModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.bidModalTitle, { color: colors.text }]}>Make an Offer</Text>

            {activeTab === 'bid' && (
              <View style={styles.bidPriceSection}>
                <Text style={[styles.bidLabel, { color: colors.textSecondary }]}>
                  Your Offer Price: ${bidPrice}
                </Text>
                <View style={styles.sliderContainer}>
                  <Text style={[styles.sliderValue, { color: colors.textTertiary }]}>$20</Text>
                  <View style={styles.sliderTrack}>
                    <View
                      style={[
                        styles.sliderFill,
                        { width: `${((bidPrice - 20) / 180) * 100}%`, backgroundColor: colors.accent },
                      ]}
                    />
                    <TouchableOpacity
                      style={[styles.sliderThumb, { backgroundColor: colors.accent }]}
                      onPressIn={() => {
                        // Handle slider interaction - simplified for now
                      }}
                    />
                  </View>
                  <Text style={[styles.sliderValue, { color: colors.textTertiary }]}>$200</Text>
                </View>
              </View>
            )}

            <View style={styles.bidMessageSection}>
              <Text style={[styles.bidLabel, { color: colors.textSecondary }]}>
                Add a Message (Optional)
              </Text>
              <TextInput
                style={[
                  styles.bidMessageInput,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="E.g., 'I need 2 hours for vocal recording...'"
                placeholderTextColor={colors.textTertiary}
                value={bidMessage}
                onChangeText={setBidMessage}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.bidModalActions}>
              <TouchableOpacity
                style={[styles.bidModalButton, { borderColor: colors.border }]}
                onPress={() => setShowBidModal(false)}
              >
                <Text style={[styles.bidModalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bidModalButton, styles.bidModalButtonPrimary, { backgroundColor: colors.accent }]}
                onPress={() => {
                  // TODO: Implement bid submission
                  Alert.alert('Success', 'Your offer has been submitted!');
                  setShowBidModal(false);
                  setBidMessage('');
                }}
              >
                <Text style={styles.bidModalButtonTextPrimary}>
                  Submit {activeTab === 'bid' ? 'Bid' : 'Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterHalf: {
    flex: 1,
  },
  filterLabel: {
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  pickerContainer: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  pickerText: {
    fontSize: FontSizes.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.md,
  },
  errorSubtext: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  resultsCount: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultsText: {
    fontSize: FontSizes.xs,
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  collabCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.semiBold,
  },
  collabContent: {
    padding: Spacing.md,
  },
  collabHeader: {
    marginBottom: Spacing.sm,
  },
  collabTitleContainer: {
    gap: Spacing.xs,
  },
  collabTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  creatorAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  creatorName: {
    fontSize: FontSizes.xs,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  genreTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  genreText: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
  },
  collabFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  priceText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: FontWeights.semiBold,
  },
  likeButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bidModal: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  bidModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.lg,
  },
  bidPriceSection: {
    marginBottom: Spacing.lg,
  },
  bidLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderValue: {
    fontSize: FontSizes.xs,
    width: 32,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -6,
    left: '50%',
  },
  bidMessageSection: {
    marginBottom: Spacing.lg,
  },
  bidMessageInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    fontSize: FontSizes.sm,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bidModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bidModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  bidModalButtonPrimary: {
    borderWidth: 0,
  },
  bidModalButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  bidModalButtonTextPrimary: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
});
