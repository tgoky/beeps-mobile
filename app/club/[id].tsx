import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Club, ClubType } from '@/types/database';

type Tab = 'about' | 'members';

// Club type labels
const CLUB_TYPE_LABELS: Record<ClubType, string> = {
  RECORDING: 'Recording',
  PRODUCTION: 'Production',
  RENTAL: 'Rental',
  MANAGEMENT: 'Management',
  DISTRIBUTION: 'Distribution',
  CREATIVE: 'Creative',
};

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [activeTab, setActiveTab] = useState<Tab>('about');

  // Fetch club details
  const { data: club, isLoading } = useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          *,
          users!owner_id (
            id,
            username,
            full_name,
            avatar
          ),
          club_members (
            id,
            role,
            joined_at,
            users!user_id (
              id,
              username,
              avatar
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        type: data.type as ClubType,
        description: data.description,
        icon: data.icon,
        ownerId: data.owner_id,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        owner: {
          id: data.users?.id || '',
          username: data.users?.username || '',
          fullName: data.users?.full_name,
          avatar: data.users?.avatar,
        },
        members: (data.club_members || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.joined_at,
          user: {
            id: m.users?.id || '',
            username: m.users?.username || '',
            avatar: m.users?.avatar,
          },
        })),
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Club not found
          </Text>
        </View>
      </View>
    );
  }

  const isMember = club.members.some((m: any) => m.user.id === user?.id);
  const isOwner = club.ownerId === user?.id;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Club</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Club Cover */}
        <View style={[styles.cover, { backgroundColor: colors.card }]}>
          <Text style={styles.coverIcon}>{club.icon || '🎵'}</Text>
        </View>

        {/* Club Info */}
        <View style={styles.info}>
          <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.typeText, { color: colors.textSecondary }]}>
              {CLUB_TYPE_LABELS[club.type]}
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {club.members.length} {club.members.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="person" size={16} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                Owner: {club.owner.username}
              </Text>
            </View>
          </View>

          {!isMember && !isOwner && (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: colors.accent }]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Join Club</Text>
            </TouchableOpacity>
          )}

          {isMember && !isOwner && (
            <View style={[styles.memberBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.memberBadgeText, { color: colors.text }]}>Member</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'about' ? colors.primary : colors.textSecondary }
            ]}>
              About
            </Text>
            {activeTab === 'about' && (
              <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'members' ? colors.primary : colors.textSecondary }
            ]}>
              Members ({club.members.length})
            </Text>
            {activeTab === 'members' && (
              <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'about' && (
            <View>
              {club.description ? (
                <Text style={[styles.description, { color: colors.text }]}>
                  {club.description}
                </Text>
              ) : (
                <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
                  No description provided
                </Text>
              )}
            </View>
          )}

          {activeTab === 'members' && (
            <View style={styles.membersList}>
              {club.members.map((member: any) => (
                <View
                  key={member.id}
                  style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={styles.memberAvatarText}>
                      {member.user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.user.username}
                    </Text>
                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                      {member.role}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.base,
  },
  cover: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: {
    fontSize: 64,
  },
  info: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  clubName: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSizes.sm,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  memberBadgeText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: FontSizes.base,
    lineHeight: 24,
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    fontStyle: 'italic',
  },
  membersList: {
    gap: Spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  memberRole: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
});
