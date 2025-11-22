import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
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

const { width } = Dimensions.get('window');

type TabType = 'studios' | 'producers' | 'artists';
type ViewMode = 'map' | 'grid';

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [activeTab, setActiveTab] = useState<TabType>('studios');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedStudio, setSelectedStudio] = useState<any | null>(null);

  // Fetch real data
  const { data: studios, isLoading: studiosLoading } = useStudios();
  const { data: producers, isLoading: producersLoading } = useProducers();
  const { data: artists, isLoading: artistsLoading } = useArtists();

  // User location (San Francisco for demo)
  const userLocation = { latitude: 37.7849, longitude: -122.4094 };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="music-circle" size={80} color={colors.primary} />
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

  const getData = () => {
    switch (activeTab) {
      case 'studios':
        return studios || [];
      case 'producers':
        return producers || [];
      case 'artists':
        return artists || [];
      default:
        return [];
    }
  };

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
    const data = getData();
    const loading = isLoading();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading {activeTab}...
          </Text>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'studios' ? 'microphone' : activeTab === 'producers' ? 'music-box' : 'account-music'}
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No {activeTab} found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Check back later for new listings
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {data.map((item: any) => {
          let name = '';
          let price = 0;
          let rating = 0;
          let location = '';

          if (activeTab === 'studios') {
            name = item.name;
            price = item.hourlyRate;
            rating = item.rating;
            location = item.city || item.state || '';
          } else if (activeTab === 'producers') {
            name = item.user.fullName || item.user.username;
            price = item.productionRate || 0;
            location = item.user.location || '';
          } else if (activeTab === 'artists') {
            name = item.user.fullName || item.user.username;
            location = item.user.location || '';
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  {activeTab !== 'studios' && item.user?.verified && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  )}
                </View>
                {rating > 0 && (
                  <View style={[styles.ratingBadge, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>

              {location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.locationText, { color: colors.textTertiary }]}>{location}</Text>
                </View>
              )}

              {price > 0 && (
                <Text style={[styles.priceText, { color: colors.textSecondary }]}>
                  ${price}/hr
                </Text>
              )}

              <TouchableOpacity
                style={[styles.cardButton, { backgroundColor: colors.accent }]}
                activeOpacity={0.8}
              >
                <Text style={styles.cardButtonText}>
                  {activeTab === 'studios' ? 'Book Now' : 'View Profile'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  const renderMapView = () => {
    const data = getData();
    const loading = isLoading();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading {activeTab}...
          </Text>
        </View>
      );
    }

    // Only studios can be shown on map
    if (activeTab !== 'studios') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Map view is only available for studios.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Please use grid view for {activeTab}.
          </Text>
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: colors.accent }]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={styles.switchButtonText}>Switch to Grid View</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No studios found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Check back later for new listings
          </Text>
        </View>
      );
    }

    // Assign default coordinates to studios without location
    // Spread them around San Francisco bay area
    const studiosWithLocation = data.map((studio: any, index: number) => {
      if (studio.latitude && studio.longitude) {
        return studio;
      }
      // Assign default coordinates in SF bay area with slight variations
      const offsetLat = (index % 5) * 0.01 - 0.02; // -0.02 to +0.02
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Discover
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find your perfect {activeTab.slice(0, -1)}
          </Text>
        </View>

        {/* View Toggle */}
        <View style={[styles.viewToggleContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'grid' && { backgroundColor: colors.card },
            ]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === 'grid' ? colors.accent : colors.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'map' && { backgroundColor: colors.card },
            ]}
            onPress={() => setViewMode('map')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="map"
              size={18}
              color={viewMode === 'map' ? colors.accent : colors.textTertiary}
            />
          </TouchableOpacity>
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
                borderColor: colors.accent
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  greeting: {
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
  viewToggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  viewToggleButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
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
  gridContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  priceText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.3,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  switchButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  authSubtitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  authDescription: {
    fontSize: FontSizes.base,
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
  },
  authButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    width: width - Spacing.xl * 2,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  authButtonTextSecondary: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
