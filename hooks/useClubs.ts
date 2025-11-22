import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Club } from '@/types/database';

export interface ClubWithCreator extends Club {
  creator: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export function useClubs() {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          *,
          users!creator_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('is_active', true)
        .order('member_count', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((club) => {
        const creatorUser = club.users;

        return {
          id: club.id,
          name: club.name,
          description: club.description,
          creatorId: club.creator_id,
          coverColor: club.cover_color,
          coverImageUrl: club.cover_image_url,
          iconName: club.icon_name,
          category: club.category,
          tags: club.tags || [],
          memberCount: club.member_count || 0,
          isPrivate: club.is_private,
          isActive: club.is_active,
          createdAt: club.created_at,
          updatedAt: club.updated_at,
          creator: {
            id: creatorUser?.id || '',
            username: creatorUser?.username || '',
            fullName: creatorUser?.full_name,
            avatar: creatorUser?.avatar,
          },
        };
      }) as ClubWithCreator[];
    },
  });
}

// Fetch user's clubs
export function useMyClubs(userId?: string) {
  return useQuery({
    queryKey: ['clubs', 'my', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          club_id,
          role,
          joined_at,
          clubs!club_id (
            *,
            users!creator_id (
              id,
              username,
              full_name,
              avatar
            )
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Transform the data
      return (data || []).map((membership) => {
        const club = membership.clubs;
        const creatorUser = club?.users;

        return {
          id: club.id,
          name: club.name,
          description: club.description,
          creatorId: club.creator_id,
          coverColor: club.cover_color,
          coverImageUrl: club.cover_image_url,
          iconName: club.icon_name,
          category: club.category,
          tags: club.tags || [],
          memberCount: club.member_count || 0,
          isPrivate: club.is_private,
          isActive: club.is_active,
          createdAt: club.created_at,
          updatedAt: club.updated_at,
          creator: {
            id: creatorUser?.id || '',
            username: creatorUser?.username || '',
            fullName: creatorUser?.full_name,
            avatar: creatorUser?.avatar,
          },
          membership: {
            role: membership.role,
            joinedAt: membership.joined_at,
          },
        };
      });
    },
    enabled: !!userId,
  });
}

// Join a club
export function useJoinClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: userId,
          role: 'MEMBER',
        })
        .select()
        .single();

      if (error) throw error;

      // Update member count
      const { error: updateError } = await supabase.rpc('increment_club_members', {
        club_id: clubId,
      });

      if (updateError) {
        // Fallback to manual update
        const { data: clubData } = await supabase
          .from('clubs')
          .select('member_count')
          .eq('id', clubId)
          .single();

        await supabase
          .from('clubs')
          .update({ member_count: (clubData?.member_count || 0) + 1 })
          .eq('id', clubId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my'] });
    },
  });
}

// Create a club
export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (club: {
      name: string;
      description?: string;
      userId: string;
      coverColor?: string;
      coverImageUrl?: string;
      iconName?: string;
      category?: string;
      tags?: string[];
      isPrivate?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('clubs')
        .insert({
          name: club.name,
          description: club.description,
          creator_id: club.userId,
          cover_color: club.coverColor,
          cover_image_url: club.coverImageUrl,
          icon_name: club.iconName,
          category: club.category,
          tags: club.tags,
          is_private: club.isPrivate || false,
          member_count: 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase.from('club_memberships').insert({
        club_id: data.id,
        user_id: club.userId,
        role: 'OWNER',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my'] });
    },
  });
}
