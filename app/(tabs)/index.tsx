import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

type TabType = 'studios' | 'producers' | 'artists';
type ViewMode = 'map' | 'grid';

// Mock data - replace with real data from Supabase
const mockStudios = [
  { id: '1', name: 'Sound Haven Studio', lat: 37.7849, lng: -122.4094, price: 75, rating: 4.8 },
  { id: '2', name: 'Beat Lab NYC', lat: 37.7899, lng: -122.4164, price: 95, rating: 4.9 },
  { id: '3', name: 'Echo Chamber', lat: 37.7799, lng: -122.4024, price: 60, rating: 4.7 },
];

const mockProducers = [
  { id: '1', name: 'DJ Marcus', lat: 37.7869, lng: -122.4104, rate: 150, rating: 4.9 },
  { id: '2', name: 'Sarah Beats', lat: 37.7889, lng: -122.4154, rate: 200, rating: 5.0 },
  { id: '3', name: 'Mike Producer', lat: 37.7819, lng: -122.4044, rate: 125, rating: 4.8 },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [activeTab, setActiveTab] = useState<TabType>('studios');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

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
        return mockStudios;
      case 'producers':
        return mockProducers;
      case 'artists':
        return [];
      default:
        return [];
    }
  };

  const renderGridView = () => {
    const data = getData();
    return (
      <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {data.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.gridCardContent}>
              <View style={styles.gridCardHeader}>
                <View>
                  <Text style={[styles.gridCardName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.gridCardPrice, { color: colors.textSecondary }]}>
                    ${item.price || item.rate}/hr
                  </Text>
                </View>
                <View style={styles.gridCardRating}>
                  <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.bookButtonText}>
                  {activeTab === 'studios' ? 'Book Studio' : 'View Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderMapView = () => {
    const data = getData();
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

          {/* Studios/Producers markers */}
          {data.map((item: any) => (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.lat, longitude: item.lng }}
              title={item.name}
              description={`$${item.price || item.rate}/hr • ⭐ ${item.rating}`}
            />
          ))}
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
});
