import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useStudios } from '@/hooks/useStudios';
import { useProducers } from '@/hooks/useProducers';
import { useArtists } from '@/hooks/useArtists';

const { width } = Dimensions.get('window');

type TabType = 'studios' | 'producers' | 'artists';
type ViewMode = 'map' | 'grid';

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [activeTab, setActiveTab] = useState<TabType>('studios');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

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
          <Text style={[styles.authTitle, { color: colors.text }]}>🎵</Text>
          <Text style={[styles.authSubtitle, { color: colors.text }]}>Welcome to Beeps</Text>
          <Text style={[styles.authDescription, { color: colors.textSecondary }]}>
            Your music production marketplace
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authButtonSecondary, { borderColor: colors.primary }]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[styles.authButtonTextSecondary, { color: colors.primary }]}>
              Create Account
            </Text>
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No {activeTab} found
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

          if (activeTab === 'studios') {
            name = item.name;
            price = item.hourlyRate;
            rating = item.rating;
          } else if (activeTab === 'producers') {
            name = item.user.fullName || item.user.username;
            price = item.productionRate || 0;
            rating = 0; // Producers don't have ratings in schema
          } else if (activeTab === 'artists') {
            name = item.user.fullName || item.user.username;
            price = 0; // Artists don't have pricing
            rating = 0;
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.gridCardContent}>
                <View style={styles.gridCardHeader}>
                  <View>
                    <Text style={[styles.gridCardName, { color: colors.text }]}>{name}</Text>
                    {price > 0 && (
                      <Text style={[styles.gridCardPrice, { color: colors.textSecondary }]}>
                        ${price}/hr
                      </Text>
                    )}
                    {activeTab !== 'studios' && item.user.location && (
                      <Text style={[styles.gridCardLocation, { color: colors.textTertiary }]}>
                        📍 {item.user.location}
                      </Text>
                    )}
                  </View>
                  {rating > 0 && (
                    <View style={styles.gridCardRating}>
                      <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
                    </View>
                  )}
                  {activeTab !== 'studios' && item.user.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.bookButtonText}>
                    {activeTab === 'studios' ? 'Book Studio' : 'View Profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
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

    // Filter items that have location data
    const itemsWithLocation = data.filter((item: any) => {
      if (activeTab === 'studios') {
        return item.latitude && item.longitude;
      }
      // For producers/artists, we'd need geocoded location data
      // For now, skip them or show in grid view
      return false;
    });

    if (itemsWithLocation.length === 0 && activeTab !== 'studios') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Map view is only available for studios.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Please use grid view for {activeTab}.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          customMapStyle={effectiveTheme === 'dark' ? darkMapStyle : []}
        >
          {/* User location */}
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor={colors.primary}
          />

          {/* Studios markers */}
          {itemsWithLocation.map((item: any) => {
            let name = '';
            let description = '';

            if (activeTab === 'studios') {
              name = item.name;
              description = `$${item.hourlyRate}/hr${item.rating > 0 ? ` • ⭐ ${item.rating.toFixed(1)}` : ''}`;
            }

            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={name}
                description={description}
              />
            );
          })}
        </MapView>
      </View>
    );
  };

  const tabs: Array<{ key: TabType; label: string; icon: string }> = [
    { key: 'studios', label: 'Studios', icon: '🎙️' },
    { key: 'producers', label: 'Producers', icon: '🎵' },
    { key: 'artists', label: 'Artists', icon: '🎤' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Hey, {user.fullName?.split(' ')[0] || user.username}! 👋
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find your perfect {activeTab.slice(0, -1)}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && [styles.tabActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
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

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'map' && [styles.viewButtonActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewButtonText, { color: viewMode === 'map' ? '#fff' : colors.textSecondary }]}>
              🗺️
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'grid' && [styles.viewButtonActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.viewButtonText, { color: viewMode === 'grid' ? '#fff' : colors.textSecondary }]}>
              📋
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'map' ? renderMapView() : renderGridView()}
    </View>
  );
}

// Dark map style for Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  authTitle: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  authSubtitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  authDescription: {
    fontSize: FontSizes.base,
    marginBottom: Spacing['2xl'],
  },
  authButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    width: width - Spacing.xl * 2,
  },
  authButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    textAlign: 'center',
  },
  authButtonSecondary: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    width: width - Spacing.xl * 2,
  },
  authButtonTextSecondary: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'] + 20,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  tabs: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  viewToggle: {
    flexDirection: 'row',
    marginRight: Spacing.md,
    gap: Spacing.xs,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonActive: {},
  viewButtonText: {
    fontSize: 18,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  gridCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  gridCardContent: {
    padding: Spacing.md,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  gridCardName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  gridCardPrice: {
    fontSize: FontSizes.sm,
  },
  gridCardRating: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  bookButton: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  gridCardLocation: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: FontWeights.bold,
  },
});
