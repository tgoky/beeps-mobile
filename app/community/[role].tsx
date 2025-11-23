import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useCommunityPosts, useCommunityStats, useCreateCommunityPost } from '@/hooks/useCommunities';
import { UserRole } from '@/types/database';

// Role display configuration (matching communities.tsx)
const ROLE_CONFIG: Record<string, {
  name: string;
  icon: string;
  color: string;
  bg: string;
}> = {
  artist: {
    name: 'Artists',
    icon: '🎤',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.1)',
  },
  producer: {
    name: 'Producers',
    icon: '🎚️',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  studio_owner: {
    name: 'Studio Owners',
    icon: '🏠',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  gear_seller: {
    name: 'Gear Specialists',
    icon: '🎸',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  lyricist: {
    name: 'Lyricists',
    icon: '✍️',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.1)',
  },
};

export default function CommunityFeedScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const config = ROLE_CONFIG[role || ''] || ROLE_CONFIG.artist;
  const { data: posts, isLoading, refetch } = useCommunityPosts(role || '');
  const { data: stats } = useCommunityStats(role || '');
  const createPost = useCreateCommunityPost();

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;

    try {
      await createPost.mutateAsync({
        authorId: user.id,
        communityRole: role?.toUpperCase() as UserRole,
        content: postContent.trim(),
      });

      setPostContent('');
      setShowCreatePost(false);
      Alert.alert('Success', 'Post created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'now';
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerTitle}>
              <Text style={styles.headerIcon}>{config.icon}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{config.name}</Text>
            </View>
            {stats && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {stats.totalMembers.toLocaleString()} members • {stats.postsThisWeek} posts this week
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowCreatePost(true)}
            style={[styles.createButton, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading posts...
            </Text>
          </View>
        ) : posts && posts.length > 0 ? (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <View
                key={post.id}
                style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Author */}
                <View style={styles.postHeader}>
                  <View style={[styles.avatar, { backgroundColor: config.bg }]}>
                    {post.author.avatar ? (
                      <Text>👤</Text>
                    ) : (
                      <Text style={styles.avatarText}>
                        {post.author.username.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.authorInfo}>
                    <View style={styles.authorName}>
                      <Text style={[styles.username, { color: colors.text }]}>
                        {post.author.username}
                      </Text>
                      {post.author.verified && (
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      )}
                    </View>
                    <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                      {formatTimestamp(post.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={[styles.postContent, { color: colors.text }]}>
                  {post.content}
                </Text>

                {/* Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                      {post.likesCount}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                      {post.commentsCount}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                      {post.sharesCount}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{config.icon}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Posts Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Be the first to share in this community
            </Text>
            <TouchableOpacity
              style={[styles.actionButton2, { backgroundColor: colors.accent }]}
              onPress={() => setShowCreatePost(true)}
            >
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Post</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textTertiary}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.accent },
                (!postContent.trim() || createPost.isPending) && styles.submitButtonDisabled,
              ]}
              onPress={handleCreatePost}
              disabled={!postContent.trim() || createPost.isPending}
            >
              {createPost.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  postsContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  postCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  postContent: {
    fontSize: FontSizes.base,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: FontSizes.sm,
  },
  emptyState: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionButton2: {
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    height: 150,
    marginBottom: Spacing.md,
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
