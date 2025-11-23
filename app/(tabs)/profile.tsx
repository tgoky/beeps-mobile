import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useUserProfile, useUserBeats, useUserEquipment, useUserCollaborations } from '@/hooks/useProfile';
import { useMyClubs } from '@/hooks/useClubs';
import { NotificationBell } from '@/components/NotificationBell';

type ProfileTab = 'beats' | 'equipment' | 'collabs' | 'clubs';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const [activeTab, setActiveTab] = useState<ProfileTab>('beats');

  // Fetch full profile data
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: beats, isLoading: beatsLoading } = useUserBeats(user?.id);
  const { data: equipment, isLoading: equipmentLoading } = useUserEquipment(user?.id);
  const { data: collaborations, isLoading: collabsLoading } = useUserCollaborations(user?.id);
  const { data: clubs, isLoading: clubsLoading } = useMyClubs(user?.id);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Not Signed In</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    const getLoadingState = () => {
      switch (activeTab) {
        case 'beats':
          return beatsLoading;
        case 'equipment':
          return equipmentLoading;
        case 'collabs':
          return collabsLoading;
        case 'clubs':
          return clubsLoading;
        default:
          return false;
      }
    };

    const getData = () => {
      switch (activeTab) {
        case 'beats':
          return beats || [];
        case 'equipment':
          return equipment || [];
        case 'collabs':
          return collaborations || [];
        case 'clubs':
          return clubs || [];
        default:
          return [];
      }
    };

    if (getLoadingState()) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const data = getData();

    if (data.length === 0) {
      return (
        <View style={styles.emptyContentState}>
          <MaterialCommunityIcons
            name={
              activeTab === 'beats'
                ? 'music-box-multiple'
                : activeTab === 'equipment'
                  ? 'microphone'
                  : activeTab === 'collabs'
                    ? 'account-group'
                    : 'account-multiple'
            }
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyContentText, { color: colors.textSecondary }]}>
            No {activeTab} yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentGrid}>
        {data.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title || item.name}
            </Text>
            {activeTab === 'beats' && (
              <View style={styles.contentMeta}>
                <Text style={[styles.contentMetaText, { color: colors.textSecondary }]}>
                  {item.bpm} BPM • ${item.price}
                </Text>
              </View>
            )}
            {activeTab === 'equipment' && (
              <View style={styles.contentMeta}>
                <Text style={[styles.contentMetaText, { color: colors.textSecondary }]}>
                  {item.category} • ${item.price || item.rentalRate}
                </Text>
              </View>
            )}
            {activeTab === 'collabs' && (
              <View style={styles.contentMeta}>
                <Text style={[styles.contentMetaText, { color: colors.textSecondary }]}>
                  {item.type} • {item.status}
                </Text>
              </View>
            )}
            {activeTab === 'clubs' && (
              <View style={styles.contentMeta}>
                <Text style={[styles.contentMetaText, { color: colors.textSecondary }]}>
                  {item.memberCount} members
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.topNav, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.topNavTitle, { color: colors.text }]}>Profile</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <NotificationBell size={20} />
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(profile?.fullName || user?.fullName)?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {profile?.fullName || user?.fullName || user?.username}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{profile?.username || user?.username}
        </Text>
        {profile?.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
          </View>
        )}
        <Text style={[styles.role, { color: colors.primary }]}>
          {profile?.primaryRole || user?.primaryRole}
        </Text>

        {/* Additional Info */}
        {profile?.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{profile.location}</Text>
          </View>
        )}
        {profile?.website && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => Linking.openURL(profile.website!)}
          >
            <Ionicons name="link" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>{profile.website}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.stats,
          { backgroundColor: colors.background, borderTopColor: colors.border, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {profile?.followersCount || user?.followersCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {profile?.followingCount || user?.followingCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {(beats?.length || 0) + (equipment?.length || 0) + (collaborations?.length || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items</Text>
        </View>
      </View>

      {profile?.bio && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.bio, { color: colors.text }]}>{profile.bio}</Text>
        </View>
      )}

      {/* Role-specific Info */}
      {profile?.producerProfile && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Producer Info</Text>
          {profile.producerProfile.genres && profile.producerProfile.genres.length > 0 && (
            <View style={styles.tagRow}>
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>Genres:</Text>
              <View style={styles.tags}>
                {profile.producerProfile.genres.slice(0, 3).map((genre, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tagText, { color: colors.text }]}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {profile.producerProfile.productionRate && (
            <View style={styles.rateRow}>
              <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Production Rate:</Text>
              <Text style={[styles.rateValue, { color: colors.text }]}>
                ${profile.producerProfile.productionRate}/hr
              </Text>
            </View>
          )}
        </View>
      )}

      {profile?.artistProfile && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Artist Info</Text>
          {profile.artistProfile.genres && profile.artistProfile.genres.length > 0 && (
            <View style={styles.tagRow}>
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>Genres:</Text>
              <View style={styles.tags}>
                {profile.artistProfile.genres.slice(0, 3).map((genre, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tagText, { color: colors.text }]}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {profile.artistProfile.skills && profile.artistProfile.skills.length > 0 && (
            <View style={styles.tagRow}>
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>Skills:</Text>
              <View style={styles.tags}>
                {profile.artistProfile.skills.slice(0, 3).map((skill, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tagText, { color: colors.text }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'beats' && { borderBottomColor: colors.accent }]}
            onPress={() => setActiveTab('beats')}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'beats' ? colors.accent : colors.textSecondary },
              ]}
            >
              Beats ({beats?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'equipment' && { borderBottomColor: colors.accent }]}
            onPress={() => setActiveTab('equipment')}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'equipment' ? colors.accent : colors.textSecondary },
              ]}
            >
              Equipment ({equipment?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'collabs' && { borderBottomColor: colors.accent }]}
            onPress={() => setActiveTab('collabs')}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'collabs' ? colors.accent : colors.textSecondary },
              ]}
            >
              Collabs ({collaborations?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'clubs' && { borderBottomColor: colors.accent }]}
            onPress={() => setActiveTab('clubs')}
          >
            <Text
              style={[
                styles.tabItemText,
                { color: activeTab === 'clubs' ? colors.accent : colors.textSecondary },
              ]}
            >
              Clubs ({clubs?.length || 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {renderContent()}
      </View>

      {/* Menu Section */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/bookings')}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/transactions')}
        >
          <Ionicons name="receipt-outline" size={20} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/(tabs)/debug-studios')}
        >
          <Ionicons name="hammer-outline" size={20} color={colors.accent} />
          <Text style={[styles.menuText, { color: colors.accent }]}>Studio Manager (Debug)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.menuTextDanger}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  topNavTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'] + 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
  name: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  verifiedText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  role: {
    fontSize: FontSizes.sm,
    textTransform: 'capitalize',
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.sm,
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
  },
  section: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  bio: {
    fontSize: FontSizes.base,
    lineHeight: 22,
  },
  tagRow: {
    marginBottom: Spacing.sm,
  },
  tagLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  rateLabel: {
    fontSize: FontSizes.sm,
  },
  rateValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  tabsScroll: {
    marginBottom: Spacing.md,
  },
  tabItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyContentState: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyContentText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  contentCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  contentTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  contentMeta: {
    marginTop: Spacing.xs,
  },
  contentMetaText: {
    fontSize: FontSizes.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
  },
  menuTextDanger: {
    fontSize: FontSizes.base,
    color: '#FF3B30',
    fontWeight: FontWeights.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.lg,
  },
  button: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
