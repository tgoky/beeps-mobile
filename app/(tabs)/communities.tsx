import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useUserRoles } from '@/hooks/useCommunities';
import { UserRole } from '@/types/database';

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

export default function CommunitiesScreen() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const router = useRouter();

  const { data: userRoles, isLoading } = useUserRoles(user?.id);

  const handleCommunityPress = (role: UserRole) => {
    router.push(`/community/${role.toLowerCase()}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect with your creative network
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* My Communities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Communities</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Communities you have access to based on your roles
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your communities...
            </Text>
          </View>
        ) : userRoles && userRoles.length > 0 ? (
          <View style={styles.communitiesGrid}>
            {userRoles.map((role) => {
              const config = ROLE_CONFIG[role];
              return (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.communityCard,
                    { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                  onPress={() => handleCommunityPress(role)}
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                    <Text style={styles.iconEmoji}>{config.icon}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.communityInfo}>
                    <Text style={[styles.communityName, { color: colors.text }]}>
                      {config.name}
                    </Text>
                    <Text style={[styles.communityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {config.description}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Communities Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create a club to unlock access{'\n'}to role-specific communities
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/community')}
            >
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Create a Club</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* How it Works */}
        <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>How Communities Work</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Create clubs to unlock role-specific communities
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                A Production club grants you Producer community access
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Share your work and collaborate with peers
              </Text>
            </View>
          </View>
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
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
  },
  loadingContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.base,
  },
  communitiesGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  communityDescription: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
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
  infoSection: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  infoContent: {
    gap: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoBullet: {
    fontSize: FontSizes.base,
    color: '#6B7280',
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
