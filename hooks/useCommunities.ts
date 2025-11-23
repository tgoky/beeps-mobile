import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserRole, CommunityPost } from '@/types/database';

// Get user's accessible roles (primary role + granted roles)
export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get user's primary role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('primary_role')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get granted roles
      const { data: grantedRoles, error: grantsError } = await supabase
        .from('user_role_grants')
        .select('role_type')
        .eq('user_id', userId);

      if (grantsError) throw grantsError;

      // Combine primary role and granted roles (remove duplicates)
      const roles = new Set<UserRole>();
      if (userData?.primary_role) {
        roles.add(userData.primary_role as UserRole);
      }
      grantedRoles?.forEach(grant => roles.add(grant.role_type as UserRole));

      return Array.from(roles);
    },
    enabled: !!userId,
  });
}

// Get community posts for a specific role
export function useCommunityPosts(role: string) {
  return useQuery({
    queryKey: ['community-posts', role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users!author_id (
            id,
            username,
            full_name,
            avatar,
            primary_role,
            verified
          )
        `)
        .eq('community_role', role.toUpperCase())
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((post) => ({
        id: post.id,
        authorId: post.author_id,
        communityRole: post.community_role as UserRole,
        content: post.content,
        imageUrl: post.image_url,
        videoUrl: post.video_url,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        sharesCount: post.shares_count || 0,
        isActive: post.is_active,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: {
          id: post.users?.id || '',
          username: post.users?.username || '',
          fullName: post.users?.full_name,
          avatar: post.users?.avatar,
          primaryRole: post.users?.primary_role as UserRole,
          verified: post.users?.verified || false,
        },
      }));
    },
  });
}

// Get community stats
export function useCommunityStats(role: string) {
  return useQuery({
    queryKey: ['community-stats', role],
    queryFn: async () => {
      const roleUpper = role.toUpperCase();

      // Get total members with this role
      const { count: primaryRoleCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('primary_role', roleUpper);

      const { count: grantedRoleCount } = await supabase
        .from('user_role_grants')
        .select('user_id', { count: 'exact', head: true })
        .eq('role_type', roleUpper);

      const totalMembers = (primaryRoleCount || 0) + (grantedRoleCount || 0);

      // Get posts this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: postsThisWeek } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_role', roleUpper)
        .eq('is_active', true)
        .gte('created_at', oneWeekAgo.toISOString());

      return {
        totalMembers,
        postsThisWeek: postsThisWeek || 0,
      };
    },
  });
}

// Create a community post
export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: {
      authorId: string;
      communityRole: UserRole;
      content: string;
      imageUrl?: string;
      videoUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: post.authorId,
          community_role: post.communityRole,
          content: post.content,
          image_url: post.imageUrl,
          video_url: post.videoUrl,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['community-posts', variables.communityRole.toLowerCase()]
      });
    },
  });
}
