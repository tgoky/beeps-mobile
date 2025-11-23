import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading, error } = useUserProfile(id);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Profile Not Found</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            This user profile could not be loaded.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Back Button */}
      <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          {profile.fullName || profile.username}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.background }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>
            {profile.fullName?.charAt(0) || profile.username?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.fullName || profile.username}
            </Text>
            {profile.verified && (
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            )}
          </View>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{profile.username}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialCommunityIcons
            name={
              profile.primaryRole === 'producer'
                ? 'music-box'
                : profile.primaryRole === 'artist'
                ? 'microphone-variant'
                : profile.primaryRole === 'studio_owner'
                ? 'home-music'
                : 'account'
            }
            size={16}
            color={colors.accent}
          />
          <Text style={[styles.roleText, { color: colors.accent }]}>
            {profile.primaryRole?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View
        style={[
          styles.stats,
          { backgroundColor: colors.background, borderTopColor: colors.border, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{profile.followersCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{profile.followingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{profile.clubCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Clubs</Text>
        </View>
      </View>

      {/* Bio */}
      {profile.bio && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
        </View>
      )}

      {/* Location */}
      {profile.location && (
        <View style={[styles.infoRow, { backgroundColor: colors.background }]}>
          <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{profile.location}</Text>
        </View>
      )}

      {/* Producer Profile */}
      {profile.producerProfile && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Producer Info</Text>

          {profile.producerProfile.productionRate && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Production Rate</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                ${profile.producerProfile.productionRate}/hr
              </Text>
            </View>
          )}

          {profile.producerProfile.genres.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Genres</Text>
              <View style={styles.tagContainer}>
                {profile.producerProfile.genres.map((genre, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.producerProfile.equipment.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Equipment</Text>
              <View style={styles.tagContainer}>
                {profile.producerProfile.equipment.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Artist Profile */}
      {profile.artistProfile && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Artist Info</Text>

          {profile.artistProfile.performanceRate && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Performance Rate</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                ${profile.artistProfile.performanceRate}/show
              </Text>
            </View>
          )}

          {profile.artistProfile.genres.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Genres</Text>
              <View style={styles.tagContainer}>
                {profile.artistProfile.genres.map((genre, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Activity Stats */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>

        <View style={styles.activityRow}>
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="home-music" size={24} color={colors.accent} />
            <Text style={[styles.activityValue, { color: colors.text }]}>
              {profile.studioCount}
            </Text>
            <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>Studios</Text>
          </View>

          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="account-group" size={24} color={colors.accent} />
            <Text style={[styles.activityValue, { color: colors.text }]}>
              {profile.collaborationCount}
            </Text>
            <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
              Collaborations
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {!isOwnProfile && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Follow</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble" size={20} color={colors.text} />
            <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
              Message
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  username: {
    fontSize: FontSizes.base,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
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
    fontWeight: FontWeights.bold,
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
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.md,
  },
  bio: {
    fontSize: FontSizes.base,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.base,
  },
  infoItem: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSizes.base,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSizes.sm,
  },
  activityRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: FontSizes.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  actionButtonTextSecondary: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  button: {
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
