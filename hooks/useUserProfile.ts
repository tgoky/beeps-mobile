import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';

export interface UserProfile extends User {
  producerProfile?: {
    id: string;
    bio?: string;
    productionRate?: number;
    genres: string[];
    equipment: string[];
    credits: string[];
  };
  artistProfile?: {
    id: string;
    bio?: string;
    performanceRate?: number;
    genres: string[];
  };
  studioCount?: number;
  collaborationCount?: number;
  clubCount?: number;
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Fetch user data with all profiles
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Fetch producer profile if user is a producer
      let producerProfile = null;
      if (userData.primary_role === 'producer' || userData.roles?.includes('producer')) {
        const { data: producerData } = await supabase
          .from('producer_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (producerData) {
          producerProfile = {
            id: producerData.id,
            bio: producerData.bio,
            productionRate: producerData.production_rate,
            genres: producerData.genres || [],
            equipment: producerData.equipment || [],
            credits: producerData.credits || [],
          };
        }
      }

      // Fetch artist profile if user is an artist
      let artistProfile = null;
      if (userData.primary_role === 'artist' || userData.roles?.includes('artist')) {
        const { data: artistData } = await supabase
          .from('artist_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (artistData) {
          artistProfile = {
            id: artistData.id,
            bio: artistData.bio,
            performanceRate: artistData.performance_rate,
            genres: artistData.genres || [],
          };
        }
      }

      // Count user's resources - with error handling
      const { count: studioCount, error: studioError } = await supabase
        .from('studios')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      if (studioError) console.log('Studio count error:', studioError);

      const { count: collaborationCount, error: collabError } = await supabase
        .from('collaborations')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      if (collabError) console.log('Collaboration count error:', collabError);

      const { count: clubCount, error: clubError } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (clubError) console.log('Club count error:', clubError);

      return {
        id: userData.id,
        supabaseId: userData.supabase_id,
        email: userData.email,
        username: userData.username,
        fullName: userData.full_name,
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location,
        primaryRole: userData.primary_role,
        roles: userData.roles || [],
        verified: userData.verified,
        followersCount: userData.followers_count || 0,
        followingCount: userData.following_count || 0,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        producerProfile,
        artistProfile,
        studioCount: studioCount || 0,
        collaborationCount: collaborationCount || 0,
        clubCount: clubCount || 0,
      } as UserProfile;
    },
    enabled: !!userId,
  });
}
