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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { width } = Dimensions.get('window');

type HubTab = 'beats' | 'equipment' | 'deals' | 'collabs' | 'bids';

export default function HubScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<HubTab>('beats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState(50);
  const [bidMessage, setBidMessage] = useState('');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Fetch marketplace data
  const { data: beats, isLoading: beatsLoading } = useBeats();
  const { data: equipment, isLoading: equipmentLoading } = useEquipment();

  // Fetch collaborations data
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

  // Filter marketplace data
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

  // Filter collaborations data
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

  const handlePlaceBid = (collabId: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to place a bid');
      return;
    }
    setSelectedCollabId(collabId);
    setShowBidModal(true);
  };

  const tabs: { key: HubTab; label: string; icon: string }[] = [
    { key: 'beats', label: 'Beats', icon: 'musical-notes' },
    { key: 'equipment', label: 'Gear', icon: 'hardware-chip' },
    { key: 'deals', label: 'Deals', icon: 'flash' },
    { key: 'collabs', label: 'Collabs', icon: 'people' },
    { key: 'bids', label: 'Bids', icon: 'trending-up' },
  ];

  const renderMarketplaceContent = () => {
    if (activeTab === 'beats') {
      if (beatsLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }

      if (!filteredBeats || filteredBeats.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="music-note-off" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No beats found</Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredBeats.map((beat) => (
              <TouchableOpacity
                key={beat.id}
                style={[styles.beatCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.beatImage, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="music" size={32} color={colors.textTertiary} />
                </View>
                <View style={styles.beatInfo}>
                  <Text style={[styles.beatTitle, { color: colors.text }]} numberOfLines={1}>
                    {beat.title}
                  </Text>
                  <Text style={[styles.beatProducer, { color: colors.textSecondary }]} numberOfLines={1}>
                    {beat.producer.fullName || beat.producer.username}
                  </Text>
                  <View style={styles.beatMeta}>
                    <Text style={[styles.beatPrice, { color: colors.accent }]}>${beat.price}</Text>
                    <View style={styles.beatStats}>
                      <Ionicons name="play" size={12} color={colors.textTertiary} />
                      <Text style={[styles.beatStat, { color: colors.textTertiary }]}>{beat.plays}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      );
    }

    if (activeTab === 'equipment') {
      if (equipmentLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }

      if (!filteredEquipment || filteredEquipment.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="tools" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No equipment found</Text>
          </View>
        );
      }

      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredEquipment.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.equipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.equipImage, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="microphone" size={32} color={colors.textTertiary} />
                </View>
                <View style={styles.equipInfo}>
                  <Text style={[styles.equipName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.equipCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <View style={styles.equipMeta}>
                    <Text style={[styles.equipPrice, { color: colors.accent }]}>${item.price}</Text>
                    <Text style={[styles.equipCondition, { color: colors.textTertiary }]}>{item.condition}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      );
    }

    return null;
  };

  const renderCollabsContent = () => {
    if (collabsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!filteredCollabs || filteredCollabs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'deals' ? 'flash-off' : activeTab === 'collabs' ? 'handshake' : 'gavel'}
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No {activeTab} found
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={handleCreateCollab}
          >
            <Text style={styles.createButtonText}>Create {activeTab === 'deals' ? 'Deal' : activeTab === 'collabs' ? 'Collab' : 'Bid'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredCollabs.map((collab) => (
          <TouchableOpacity
            key={collab.id}
            style={[styles.collabCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={styles.collabHeader}>
              <View style={styles.collabUser}>
                <View style={[styles.collabAvatar, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.collabAvatarText, { color: colors.text }]}>
                    {collab.creator.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.collabUsername, { color: colors.text }]}>
                    {collab.creator.fullName || collab.creator.username}
                  </Text>
                  <Text style={[styles.collabTime, { color: colors.textTertiary }]}>
                    {dayjs(collab.createdAt).fromNow()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleLike(collab.id)}>
                <Ionicons
                  name={likedItems.has(collab.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={likedItems.has(collab.id) ? '#EF4444' : colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.collabTitle, { color: colors.text }]}>{collab.title}</Text>
            {collab.description && (
              <Text style={[styles.collabDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {collab.description}
              </Text>
            )}

            <View style={styles.collabMeta}>
              {collab.price && (
                <View style={[styles.collabMetaItem, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="cash-outline" size={14} color={colors.accent} />
                  <Text style={[styles.collabMetaText, { color: colors.text }]}>${collab.price}</Text>
                </View>
              )}
              {collab.location && (
                <View style={[styles.collabMetaItem, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.collabMetaText, { color: colors.text }]}>{collab.location}</Text>
                </View>
              )}
              {collab.duration && (
                <View style={[styles.collabMetaItem, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.collabMetaText, { color: colors.text }]}>{collab.duration}</Text>
                </View>
              )}
            </View>

            {activeTab === 'bids' && (
              <TouchableOpacity
                style={[styles.bidButton, { backgroundColor: colors.accent }]}
                onPress={() => handlePlaceBid(collab.id)}
              >
                <Text style={styles.bidButtonText}>Place Bid</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hub</Text>
        <View style={styles.headerActions}>
          <NotificationBell size={20} />
          {(activeTab === 'deals' || activeTab === 'collabs' || activeTab === 'bids') && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateCollab}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
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
                borderColor: colors.accent,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#fff' : colors.textSecondary} />
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
      {activeTab === 'beats' || activeTab === 'equipment' ? renderMarketplaceContent() : renderCollabsContent()}

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
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  beatCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  beatImage: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatInfo: {
    padding: Spacing.sm,
  },
  beatTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  beatProducer: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  beatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beatPrice: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  beatStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  beatStat: {
    fontSize: FontSizes.xs,
  },
  equipCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  equipImage: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipInfo: {
    padding: Spacing.sm,
  },
  equipName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  equipCategory: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  equipMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipPrice: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  equipCondition: {
    fontSize: FontSizes.xs,
  },
  collabCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  collabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  collabUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  collabAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collabAvatarText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  collabUsername: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  collabTime: {
    fontSize: FontSizes.xs,
  },
  collabTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  collabDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  collabMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  collabMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  collabMetaText: {
    fontSize: FontSizes.xs,
  },
  bidButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  bidButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
});
