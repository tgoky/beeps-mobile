import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

type CommunityTab = 'feed' | 'clubs';

export default function CommunityScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');

  // Mock clubs data - replace with real Supabase data
  const mockClubs = [
    {
      id: '1',
      name: 'Hip-Hop Producers',
      description: 'Connect with hip-hop producers worldwide',
      memberCount: 1234,
      icon: 'music',
      coverColor: '#EF4444',
    },
    {
      id: '2',
      name: 'Studio Owners Network',
      description: 'Share tips and grow your studio business',
      memberCount: 892,
      icon: 'business',
      coverColor: '#8B5CF6',
    },
    {
      id: '3',
      name: 'Beat Makers Hub',
      description: 'Share beats, get feedback, collaborate',
      memberCount: 2156,
      icon: 'musical-notes',
      coverColor: '#10B981',
    },
  ];

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
        <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.accent }]}>
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
          <View style={styles.clubsContainer}>
            {/* Featured Clubs Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Clubs</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Clubs List */}
            {mockClubs.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={[styles.clubCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                {/* Club Cover */}
                <View style={[styles.clubCover, { backgroundColor: club.coverColor }]}>
                  <View style={[styles.clubIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <Ionicons name={club.icon as any} size={24} color="#fff" />
                  </View>
                </View>

                {/* Club Info */}
                <View style={styles.clubInfo}>
                  <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                  <Text style={[styles.clubDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {club.description}
                  </Text>

                  {/* Stats */}
                  <View style={styles.clubStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="people" size={14} color={colors.textTertiary} />
                      <Text style={[styles.statText, { color: colors.textTertiary }]}>
                        {club.memberCount.toLocaleString()} members
                      </Text>
                    </View>
                  </View>

                  {/* Join Button */}
                  <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.accent }]}>
                    <Text style={styles.joinButtonText}>Join Club</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Create Club CTA */}
            <TouchableOpacity
              style={[styles.createClubCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              activeOpacity={0.7}
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
        )}
      </ScrollView>
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
  clubIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubInfo: {
    padding: Spacing.md + 2,
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
