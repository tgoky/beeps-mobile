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
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useBeats } from '@/hooks/useBeats';
import { useEquipment } from '@/hooks/useEquipment';
import {
  useCollaborations,
  useCreateCollaboration,
  CollaborationWithCreator,
} from '@/hooks/useCollaborations';
import { CollaborationType } from '@/types/database';
import CreateCollaborationModal from '@/components/CreateCollaborationModal';
import { NotificationBell } from '@/components/NotificationBell';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

type HubTab = 'beats' | 'equipment' | 'collabs' | 'deals' | 'bids';

export default function HubScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<HubTab>('collabs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: beats, isLoading: beatsLoading } = useBeats();
  const { data: equipment, isLoading: equipmentLoading } = useEquipment();

  const collabTypeMap: Record<'deals' | 'collabs' | 'bids', CollaborationType> = {
    deals: 'PROJECT',
    collabs: 'SESSION',
    bids: 'AUCTION',
  };

  const { data: collaborations, isLoading: collabsLoading } = useCollaborations(
    activeTab === 'deals' ? collabTypeMap.deals :
    activeTab === 'collabs' ? collabTypeMap.collabs :
    activeTab === 'bids' ? collabTypeMap.bids :
    undefined
  );

  const createCollab = useCreateCollaboration();

  // Filter data
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

  const filteredCollabs = useMemo(() => {
    if (!collaborations) return [];
    let filtered = collaborations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (collab) =>
          collab.title.toLowerCase().includes(query) ||
          collab.description?.toLowerCase().includes(query) ||
          collab.creator.username.toLowerCase().includes(query)
      );
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter((collab) => collab.genre?.includes(selectedGenre));
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter((collab) => collab.location?.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    return filtered;
  }, [collaborations, searchQuery, selectedGenre, selectedLocation]);

  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateCollab = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create a collaboration');
      return;
    }
    setShowCreateModal(true);
  };

  const handleBeatPress = (beatId: string) => {
    router.push(`/beat/${beatId}`);
  };

  const handleEquipmentPress = (equipId: string) => {
    router.push(`/equipment/${equipId}`);
  };

  const handleCollabPress = (collabId: string) => {
    router.push(`/collaboration/${collabId}`);
  };

  const tabs: { key: HubTab; label: string; icon: string; gradient: string[] }[] = [
    { key: 'collabs', label: 'Collabs', icon: 'people', gradient: ['#8B5CF6', '#6366F1'] },
    { key: 'beats', label: 'Beats', icon: 'musical-notes', gradient: ['#EC4899', '#8B5CF6'] },
    { key: 'equipment', label: 'Gear', icon: 'hardware-chip', gradient: ['#F59E0B', '#EC4899'] },
    { key: 'deals', label: 'Deals', icon: 'flash', gradient: ['#10B981', '#059669'] },
    { key: 'bids', label: 'Bids', icon: 'trending-up', gradient: ['#3B82F6', '#2563EB'] },
  ];

  const genres = ['all', 'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz'];

  const renderBeatsGrid = () => {
    if (beatsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (!filteredBeats || filteredBeats.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="music-note-off" size={48} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Beats Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Check back later for new beats
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {filteredBeats.map((beat) => (
          <TouchableOpacity
            key={beat.id}
            style={styles.gridCard}
            activeOpacity={0.8}
            onPress={() => handleBeatPress(beat.id)}
          >
            <View style={[styles.cardImageContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.2)', 'rgba(139, 92, 246, 0.2)']}
                style={styles.cardGradient}
              >
                <MaterialCommunityIcons name="music" size={40} color={colors.accent} />
              </LinearGradient>
              <TouchableOpacity
                style={styles.cardLikeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleLike(beat.id);
                }}
              >
                <Ionicons
                  name={likedItems.has(beat.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={likedItems.has(beat.id) ? '#EF4444' : '#fff'}
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.cardContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {beat.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {beat.producer.fullName || beat.producer.username}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardPrice, { color: colors.accent }]}>${beat.price}</Text>
                <View style={styles.cardStats}>
                  <Ionicons name="play" size={12} color={colors.textTertiary} />
                  <Text style={[styles.cardStat, { color: colors.textTertiary }]}>{beat.plays}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEquipmentGrid = () => {
    if (equipmentLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (!filteredEquipment || filteredEquipment.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="guitar-electric" size={48} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Equipment Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Check back later for new gear
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {filteredEquipment.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridCard}
            activeOpacity={0.8}
            onPress={() => handleEquipmentPress(item.id)}
          >
            <View style={[styles.cardImageContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(236, 72, 153, 0.2)']}
                style={styles.cardGradient}
              >
                <MaterialCommunityIcons name="microphone" size={40} color={colors.accent} />
              </LinearGradient>
              <TouchableOpacity
                style={styles.cardLikeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleLike(item.id);
                }}
              >
                <Ionicons
                  name={likedItems.has(item.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={likedItems.has(item.id) ? '#EF4444' : '#fff'}
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.cardContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.category}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardPrice, { color: colors.accent }]}>${item.price}</Text>
                <View style={[styles.conditionBadge, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                    {item.condition}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCollabsGrid = () => {
    if (collabsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (!filteredCollabs || filteredCollabs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons
              name={activeTab === 'deals' ? 'flash-off' : activeTab === 'collabs' ? 'handshake' : 'gavel'}
              size={48}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No {activeTab} yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Be the first to create one!
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={handleCreateCollab}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createButtonText}>
              Create {activeTab === 'deals' ? 'Deal' : activeTab === 'collabs' ? 'Collab' : 'Bid'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const gradientMap = {
      deals: ['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.15)'],
      collabs: ['rgba(139, 92, 246, 0.15)', 'rgba(99, 102, 241, 0.15)'],
      bids: ['rgba(59, 130, 246, 0.15)', 'rgba(37, 99, 235, 0.15)'],
    };

    return (
      <View style={styles.grid}>
        {filteredCollabs.map((collab) => (
          <TouchableOpacity
            key={collab.id}
            style={styles.gridCard}
            activeOpacity={0.8}
            onPress={() => handleCollabPress(collab.id)}
          >
            <View style={[styles.cardImageContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <LinearGradient
                colors={gradientMap[activeTab as keyof typeof gradientMap] || gradientMap.collabs}
                style={styles.cardGradient}
              >
                <View style={[styles.collabAvatar, { backgroundColor: colors.accent }]}>
                  <Text style={styles.collabAvatarText}>
                    {collab.creator.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </LinearGradient>
              <TouchableOpacity
                style={styles.cardLikeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleLike(collab.id);
                }}
              >
                <Ionicons
                  name={likedItems.has(collab.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={likedItems.has(collab.id) ? '#EF4444' : '#fff'}
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.cardContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {collab.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {collab.creator.fullName || collab.creator.username}
              </Text>
              {collab.description && (
                <Text style={[styles.collabDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {collab.description}
                </Text>
              )}
              <View style={styles.collabMetaRow}>
                {collab.price ? (
                  <View style={styles.collabMetaItem}>
                    <Ionicons name="cash-outline" size={12} color={colors.accent} />
                    <Text style={[styles.collabMetaText, { color: colors.accent }]}>${collab.price}</Text>
                  </View>
                ) : null}
                {collab.location && (
                  <View style={styles.collabMetaItem}>
                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                    <Text style={[styles.collabMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
                      {collab.location.split(',')[0]}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.collabTime, { color: colors.textTertiary }]}>
                {dayjs(collab.createdAt).fromNow()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === 'beats') return renderBeatsGrid();
    if (activeTab === 'equipment') return renderEquipmentGrid();
    return renderCollabsGrid();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Hub</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Discover & Connect
          </Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell size={24} />
          {(activeTab === 'deals' || activeTab === 'collabs' || activeTab === 'bids') && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateCollab}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${activeTab}...`}
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

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                { borderColor: colors.border },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={tab.gradient}
                  style={styles.tabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={tab.icon as any} size={18} color="#fff" />
                  <Text style={[styles.tabText, { color: '#fff' }]}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInner}>
                  <Ionicons name={tab.icon as any} size={18} color={colors.textSecondary} />
                  <Text style={[styles.tabText, { color: colors.textSecondary }]}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Genre Filter for Collabs */}
      {(activeTab === 'collabs' || activeTab === 'deals' || activeTab === 'bids') && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedGenre === genre ? colors.accent : colors.backgroundSecondary,
                  borderColor: selectedGenre === genre ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedGenre(genre)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedGenre === genre ? '#fff' : colors.textSecondary },
                ]}
              >
                {genre === 'all' ? 'All Genres' : genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Collaboration Modal */}
      {showCreateModal && (
        <CreateCollaborationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            try {
              await createCollab.mutateAsync(data);
              setShowCreateModal(false);
              Alert.alert('Success', 'Collaboration created successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create collaboration');
            }
          }}
        />
      )}
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    padding: 0,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  filterText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageContainer: {
    height: 140,
    position: 'relative',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLikeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStat: {
    fontSize: FontSizes.xs,
  },
  conditionBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  conditionText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  collabAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collabAvatarText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: '#fff',
  },
  collabDescription: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  collabMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  collabMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collabMetaText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  collabTime: {
    fontSize: FontSizes.xs,
  },
});
