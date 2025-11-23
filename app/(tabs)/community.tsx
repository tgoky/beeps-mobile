import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useClubs, useMyClubs, useJoinClub } from '@/hooks/useClubs';
import { useUserRoles } from '@/hooks/useCommunities';
import { UserRole } from '@/types/database';
import CreateClubModal from '@/components/CreateClubModal';
import { NotificationBell } from '@/components/NotificationBell';

type CommunityTab = 'feed' | 'clubs' | 'communities';

// Role display configuration
const ROLE_CONFIG: Record<UserRole, {
  name: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}> = {
  ARTIST: {
    name: 'Artists',
    icon: '🎤',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.1)',
    description: 'Vocalists, musicians, performers'
  },
  PRODUCER: {
    name: 'Producers',
    icon: '🎚️',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.1)',
    description: 'Beat makers, music producers'
  },
  STUDIO_OWNER: {
    name: 'Studio Owners',
    icon: '🏠',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    description: 'Recording studio operators'
  },
  GEAR_SELLER: {
    name: 'Gear Specialists',
    icon: '🎸',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    description: 'Equipment sellers & renters'
  },
  LYRICIST: {
    name: 'Lyricists',
    icon: '✍️',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.1)',
    description: 'Songwriters, lyricists'
  },
};

export default function CommunityScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Fetch data
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs(user?.id);
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(user?.id);
  const joinClub = useJoinClub();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Community</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect with creators
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <NotificationBell size={20} />
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
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
            activeTab === 'feed' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('feed')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="newspaper-variant"
            size={16}
            color={activeTab === 'feed' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'feed' ? '#fff' : colors.textSecondary },
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'clubs' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('clubs')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={16}
            color={activeTab === 'clubs' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'clubs' ? '#fff' : colors.textSecondary },
            ]}
          >
            Clubs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'communities' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('communities')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="earth"
            size={16}
            color={activeTab === 'communities' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'communities' ? '#fff' : colors.textSecondary },
            ]}
          >
            Communities
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'feed' && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="newspaper-variant" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Community Feed</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Connect with other creators,{'\n'}share your work, and collaborate
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => setActiveTab('clubs')}
            >
              <Text style={styles.actionButtonText}>Browse Clubs</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'clubs' && (
          <>
            {clubsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading clubs...
                </Text>
              </View>
            ) : clubs && clubs.length > 0 ? (
              <View style={styles.clubsContainer}>
                {/* Featured Clubs Header */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Clubs</Text>
                  <TouchableOpacity>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                  </TouchableOpacity>
                </View>

                {/* Clubs List */}
                {clubs.map((club) => {
                  const isMember = myClubs?.some((mc: any) => mc.id === club.id);

                  return (
                    <TouchableOpacity
                      key={club.id}
                      style={[styles.clubCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/club/${club.id}`)}
                    >
                      {/* Club Cover */}
                      <View style={[styles.clubCover, { backgroundColor: colors.card }]}>
                        <Text style={styles.clubCoverIcon}>{club.icon || '🎵'}</Text>
                      </View>

                      {/* Club Info */}
                      <View style={styles.clubInfo}>
                        <View style={styles.clubHeader}>
                          <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                          <View style={[styles.typeBadge, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
                              {club.type}
                            </Text>
                          </View>
                        </View>
                        {club.description && (
                          <Text style={[styles.clubDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {club.description}
                          </Text>
                        )}

                        {/* Stats */}
                        <View style={styles.clubStats}>
                          <View style={styles.statItem}>
                            <Ionicons name="people" size={14} color={colors.textTertiary} />
                            <Text style={[styles.statText, { color: colors.textTertiary }]}>
                              {(club.memberCount || 0).toLocaleString()} members
                            </Text>
                          </View>
                        </View>

                        {/* Join Button */}
                        <TouchableOpacity
                          style={[
                            styles.joinButton,
                            { backgroundColor: isMember ? colors.backgroundSecondary : colors.accent },
                          ]}
                          onPress={() => {
                            if (!isMember && user?.id) {
                              joinClub.mutate({ clubId: club.id, userId: user.id });
                            }
                          }}
                          disabled={isMember || joinClub.isPending}
                        >
                          {joinClub.isPending ? (
                            <ActivityIndicator color={isMember ? colors.text : '#fff'} size="small" />
                          ) : (
                            <Text style={[styles.joinButtonText, isMember && { color: colors.text }]}>
                              {isMember ? 'Joined' : 'Join Club'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Create Club CTA */}
                <TouchableOpacity
                  style={[styles.createClubCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <View style={[styles.createClubIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.createClubTitle, { color: colors.text }]}>Create Your Own Club</Text>
                  <Text style={[styles.createClubSubtitle, { color: colors.textSecondary }]}>
                    Build a community around your passion
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Clubs Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Be the first to create a club{'\n'}and build your community
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.accent }]}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Ionicons name="add-circle" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Create Club</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === 'communities' && (
          <>
            {rolesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading communities...
                </Text>
              </View>
            ) : userRoles && userRoles.length > 0 ? (
              <View style={styles.communitiesContainer}>
                <View style={styles.infoSection}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Your Communities</Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Access communities based on your roles. Create clubs to unlock new communities!
                  </Text>
                </View>

                <View style={styles.communitiesGrid}>
                  {userRoles.map((role) => {
                    const config = ROLE_CONFIG[role];
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.communityCard,
                          { backgroundColor: config.bg, borderColor: config.color }
                        ]}
                        onPress={() => router.push(`/community/${role.toLowerCase()}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.communityIcon}>{config.icon}</Text>
                        <Text style={[styles.communityName, { color: colors.text }]}>
                          {config.name}
                        </Text>
                        <Text style={[styles.communityDescription, { color: colors.textSecondary }]}>
                          {config.description}
                        </Text>
                        <View style={[styles.communityBadge, { backgroundColor: config.color }]}>
                          <Ionicons name="arrow-forward" size={14} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="earth" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Communities Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Create a club to unlock access{'\n'}to role-based communities
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    setActiveTab('clubs');
                    setCreateModalVisible(true);
                  }}
                >
                  <Ionicons name="add-circle" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Create Club</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Club Modal */}
      {user && (
        <CreateClubModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          userId={user.id}
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
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    marginTop: 2,
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  clubsContainer: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  clubCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clubCover: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubCoverIcon: {
    fontSize: 48,
  },
  clubInfo: {
    padding: Spacing.md + 2,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    textTransform: 'capitalize',
  },
  clubName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  clubDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  clubStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  joinButton: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  createClubCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  createClubIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  createClubTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  createClubSubtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  communitiesContainer: {
    padding: Spacing.lg,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  communitiesGrid: {
    gap: Spacing.md,
  },
  communityCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    position: 'relative',
  },
  communityIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  communityName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  communityDescription: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  communityBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
