import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Club, ClubType, UserRole } from '@/types/database';

// Map club types to the roles they grant
const CLUB_TYPE_TO_ROLE_MAP: Record<ClubType, UserRole> = {
  RECORDING: 'ARTIST',
  PRODUCTION: 'PRODUCER',
  RENTAL: 'STUDIO_OWNER',
  MANAGEMENT: 'ARTIST', // Changed from OTHER to ARTIST for better UX
  DISTRIBUTION: 'ARTIST', // Changed from OTHER to ARTIST for better UX
  CREATIVE: 'LYRICIST',
};

export interface ClubWithOwner extends Club {
  owner: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  memberCount?: number;
}

export function useClubs() {
  return useQuery({
    queryKey: ['clubs'],
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
          club_members(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((club) => {
        const ownerUser = club.users;

        return {
          id: club.id,
          name: club.name,
          type: club.type as ClubType,
          description: club.description,
          icon: club.icon,
          ownerId: club.owner_id,
          isActive: club.is_active,
          createdAt: club.created_at,
          updatedAt: club.updated_at,
          owner: {
            id: ownerUser?.id || '',
            username: ownerUser?.username || '',
            fullName: ownerUser?.full_name,
            avatar: ownerUser?.avatar,
          },
          memberCount: club.club_members?.[0]?.count || 0,
        };
      }) as ClubWithOwner[];
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
        .from('club_members')
        .select(`
          club_id,
          role,
          joined_at,
          clubs!club_id (
            *,
            users!owner_id (
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
        const ownerUser = club?.users;

        return {
          id: club.id,
          name: club.name,
          type: club.type as ClubType,
          description: club.description,
          icon: club.icon,
          ownerId: club.owner_id,
          isActive: club.is_active,
          createdAt: club.created_at,
          updatedAt: club.updated_at,
          owner: {
            id: ownerUser?.id || '',
            username: ownerUser?.username || '',
            fullName: ownerUser?.full_name,
            avatar: ownerUser?.avatar,
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
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: userId,
          role: 'MEMBER',
        })
        .select()
        .single();

      if (error) throw error;
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
      type: ClubType;
      description?: string;
      icon: string;
      ownerId: string;
    }) => {
      // Insert the club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: club.name,
          type: club.type,
          description: club.description,
          icon: club.icon,
          owner_id: club.ownerId,
          is_active: true,
        })
        .select()
        .single();

      if (clubError) throw clubError;

      // Add creator as owner in club_members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          user_id: club.ownerId,
          role: 'OWNER',
        });

      if (memberError) throw memberError;

      // Grant the corresponding role to the user
      const grantedRole = CLUB_TYPE_TO_ROLE_MAP[club.type];
      const { error: roleGrantError } = await supabase
        .from('user_role_grants')
        .upsert({
          user_id: club.ownerId,
          role_type: grantedRole,
          granted_by: clubData.id,
        }, {
          onConflict: 'user_id,role_type',
        });

      if (roleGrantError) {
        console.warn('Failed to grant role:', roleGrantError);
        // Don't throw - club was created successfully
      }

      return { club: clubData, grantedRole };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
}
