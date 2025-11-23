import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useClubs, useMyClubs, useJoinClub } from '@/hooks/useClubs';
import CreateClubModal from '@/components/CreateClubModal';

type CommunityTab = 'feed' | 'clubs';

export default function CommunityScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Fetch data
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs(user?.id);
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
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.accent }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
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
            size={20}
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
            size={20}
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
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
});
