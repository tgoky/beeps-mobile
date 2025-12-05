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
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useBeats } from '@/hooks/useBeats';
import { useEquipment } from '@/hooks/useEquipment';
import { useCollaborations, CollaborationWithCreator } from '@/hooks/useCollaborations';
import { CollaborationType } from '@/types/database';
import { NotificationBell } from '@/components/NotificationBell';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.lg * 2;

type HubTab = 'all' | 'beats' | 'equipment' | 'deals' | 'collabs' | 'bids';

const GRADIENT_COLORS = {
  beats: ['#8B5CF6', '#EC4899'],
  equipment: ['#10B981', '#059669'],
  deals: ['#F59E0B', '#EF4444'],
  collabs: ['#3B82F6', '#8B5CF6'],
  bids: ['#EF4444', '#F97316'],
};

export default function HubScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<HubTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: beats = [], isLoading: beatsLoading } = useBeats();
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipment();
  const { data: dealsData = [], isLoading: dealsLoading } = useCollaborations('PROJECT');
  const { data: collabsData = [], isLoading: collabsLoading } = useCollaborations('SESSION');
  const { data: bidsData = [], isLoading: bidsLoading } = useCollaborations('AUCTION');

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

  // Filter and combine all data based on active tab
  const filteredData = useMemo(() => {
    let allItems: any[] = [];

    if (activeTab === 'all' || activeTab === 'beats') {
      allItems = [...allItems, ...beats.map(b => ({ ...b, type: 'beat' }))];
    }
    if (activeTab === 'all' || activeTab === 'equipment') {
      allItems = [...allItems, ...equipment.map(e => ({ ...e, type: 'equipment' }))];
    }
    if (activeTab === 'all' || activeTab === 'deals') {
      allItems = [...allItems, ...dealsData.map(d => ({ ...d, type: 'deal' }))];
    }
    if (activeTab === 'all' || activeTab === 'collabs') {
      allItems = [...allItems, ...collabsData.map(c => ({ ...c, type: 'collab' }))];
    }
    if (activeTab === 'all' || activeTab === 'bids') {
      allItems = [...allItems, ...bidsData.map(b => ({ ...b, type: 'bid' }))];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allItems = allItems.filter(item => {
        if (item.type === 'beat') {
          return item.title?.toLowerCase().includes(query) ||
                 item.producer?.username?.toLowerCase().includes(query);
        }
        if (item.type === 'equipment') {
          return item.name?.toLowerCase().includes(query) ||
                 item.category?.toLowerCase().includes(query);
        }
        return item.title?.toLowerCase().includes(query) ||
               item.creator?.username?.toLowerCase().includes(query);
      });
    }

    return allItems;
  }, [beats, equipment, dealsData, collabsData, bidsData, activeTab, searchQuery]);

  const tabs = [
    { key: 'all' as HubTab, label: 'All', icon: 'apps', count: filteredData.length },
    { key: 'beats' as HubTab, label: 'Beats', icon: 'musical-notes', count: beats.length },
    { key: 'equipment' as HubTab, label: 'Gear', icon: 'hardware-chip', count: equipment.length },
    { key: 'deals' as HubTab, label: 'Deals', icon: 'flash', count: dealsData.length },
    { key: 'collabs' as HubTab, label: 'Collabs', icon: 'people', count: collabsData.length },
    { key: 'bids' as HubTab, label: 'Bids', icon: 'trending-up', count: bidsData.length },
  ];

  const renderBeatCard = (beat: any) => (
    <TouchableOpacity
      key={beat.id}
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
      activeOpacity={0.9}
      onPress={() => {
        // Navigate to beat detail or play preview
        Alert.alert('Beat', `Playing ${beat.title}`);
      }}
    >
      <View style={styles.cardImageContainer}>
        <LinearGradient
          colors={GRADIENT_COLORS.beats}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="music-note" size={48} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(beat.id)}
        >
          <Ionicons
            name={likedItems.has(beat.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={likedItems.has(beat.id) ? '#EF4444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {beat.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {beat.producer?.fullName || beat.producer?.username}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
            <Text style={[styles.typeBadgeText, { color: '#8B5CF6' }]}>BEAT</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="musical-note" size={14} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{beat.bpm} BPM</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="play" size={14} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{beat.plays || 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="heart" size={14} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{beat.likes || 0}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.priceText, { color: colors.accent }]}>${beat.price}</Text>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]}>
            <Ionicons name="cart" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Buy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEquipmentCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
      activeOpacity={0.9}
      onPress={() => {
        Alert.alert('Equipment', `Viewing ${item.name}`);
      }}
    >
      <View style={styles.cardImageContainer}>
        <LinearGradient
          colors={GRADIENT_COLORS.equipment}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="microphone" size={48} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons
            name={likedItems.has(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={likedItems.has(item.id) ? '#EF4444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Text style={[styles.typeBadgeText, { color: '#10B981' }]}>GEAR</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={[styles.metaText, { color: colors.text }]}>{item.condition}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={14} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.location || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.priceText, { color: colors.accent }]}>${item.price}</Text>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]}>
            <Ionicons name="cart" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Buy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCollabCard = (collab: any, type: 'deal' | 'collab' | 'bid') => {
    const gradientColors = type === 'deal' ? GRADIENT_COLORS.deals :
                          type === 'collab' ? GRADIENT_COLORS.collabs :
                          GRADIENT_COLORS.bids;
    const badgeColor = type === 'deal' ? '#F59E0B' :
                      type === 'collab' ? '#3B82F6' :
                      '#EF4444';
    const badgeLabel = type === 'deal' ? 'DEAL' :
                      type === 'collab' ? 'COLLAB' :
                      'BID';
    const icon = type === 'deal' ? 'flash' :
                type === 'collab' ? 'people' :
                'trending-up';

    return (
      <TouchableOpacity
        key={collab.id}
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        activeOpacity={0.9}
        onPress={() => {
          Alert.alert(badgeLabel, `Viewing ${collab.title}`);
        }}
      >
        <View style={styles.cardImageContainer}>
          <LinearGradient
            colors={gradientColors}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon as any} size={48} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleLike(collab.id)}
          >
            <Ionicons
              name={likedItems.has(collab.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={likedItems.has(collab.id) ? '#EF4444' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {collab.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                by {collab.creator?.fullName || collab.creator?.username}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: `${badgeColor}1A` }]}>
              <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
          </View>

          {collab.description && (
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {collab.description}
            </Text>
          )}

          <View style={styles.cardMeta}>
            {collab.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {collab.location}
                </Text>
              </View>
            )}
            {collab.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time" size={14} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {collab.duration}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {dayjs(collab.createdAt).fromNow()}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            {collab.price && (
              <Text style={[styles.priceText, { color: colors.accent }]}>${collab.price}</Text>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: badgeColor }]}
              onPress={() => {
                if (type === 'bid') {
                  Alert.alert('Place Bid', `Bidding on ${collab.title}`);
                } else if (type === 'collab') {
                  Alert.alert('Request Collab', `Requesting to collaborate on ${collab.title}`);
                } else {
                  Alert.alert('Claim Deal', `Claiming ${collab.title}`);
                }
              }}
            >
              <Ionicons
                name={type === 'bid' ? 'hammer' : type === 'collab' ? 'handshake' : 'flash'}
                size={16}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>
                {type === 'bid' ? 'Bid' : type === 'collab' ? 'Request' : 'Claim'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = beatsLoading || equipmentLoading || dealsLoading || collabsLoading || bidsLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Hub</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Discover beats, gear & collabs
          </Text>
        </View>
        <NotificationBell size={24} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search beats, gear, deals..."
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

      {/* Category Tabs - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.categoryChip,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              activeTab === tab.key && {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryChipText,
                { color: activeTab === tab.key ? '#fff' : colors.text },
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: activeTab === tab.key
                    ? 'rgba(255,255,255,0.2)'
                    : colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  { color: activeTab === tab.key ? '#fff' : colors.textSecondary },
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading amazing content...
          </Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="inbox" size={80} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No items found</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'Try a different search' : 'Be the first to add something!'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredData.map((item) => {
            if (item.type === 'beat') return renderBeatCard(item);
            if (item.type === 'equipment') return renderEquipmentCard(item);
            if (item.type === 'deal') return renderCollabCard(item, 'deal');
            if (item.type === 'collab') return renderCollabCard(item, 'collab');
            if (item.type === 'bid') return renderCollabCard(item, 'bid');
            return null;
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    padding: 0,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  typeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  priceText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
});
