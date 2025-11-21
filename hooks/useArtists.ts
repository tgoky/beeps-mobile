import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArtistProfile } from '@/types/database';

export interface ArtistWithUser extends ArtistProfile {
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
    location?: string;
    bio?: string;
    verified: boolean;
    followersCount: number;
  };
}

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select(`
          *,
          user:users!user_id (
            id,
            username,
            full_name,
            avatar,
            location,
            bio,
            verified,
            followers_count
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((artist) => ({
        id: artist.id,
        userId: artist.user_id,
        genres: artist.genres || [],
        skills: artist.skills || [],
        createdAt: artist.created_at,
        updatedAt: artist.updated_at,
        user: {
          id: artist.user.id,
          username: artist.user.username,
          fullName: artist.user.full_name,
          avatar: artist.user.avatar,
          location: artist.user.location,
          bio: artist.user.bio,
          verified: artist.user.verified,
          followersCount: artist.user.followers_count || 0,
        },
      })) as ArtistWithUser[];
    },
  });
}

export function useTopArtists(limit: number = 20) {
  return useQuery({
    queryKey: ['artists', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select(`
          *,
          user:users!user_id (
            id,
            username,
            full_name,
            avatar,
            location,
            bio,
            verified,
            followers_count
          )
        `)
        .limit(limit);

      if (error) throw error;

      // Sort by followers count client-side
      const sorted = (data || []).sort(
        (a, b) => (b.user.followers_count || 0) - (a.user.followers_count || 0)
      );

      return sorted.map((artist) => ({
        id: artist.id,
        userId: artist.user_id,
        genres: artist.genres || [],
        skills: artist.skills || [],
        createdAt: artist.created_at,
        updatedAt: artist.updated_at,
        user: {
          id: artist.user.id,
          username: artist.user.username,
          fullName: artist.user.full_name,
          avatar: artist.user.avatar,
          location: artist.user.location,
          bio: artist.user.bio,
          verified: artist.user.verified,
          followersCount: artist.user.followers_count || 0,
        },
      })) as ArtistWithUser[];
    },
  });
}
