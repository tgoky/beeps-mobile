import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ProducerProfile } from '@/types/database';

export interface ProducerWithUser extends ProducerProfile {
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

export function useProducers() {
  return useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producer_profiles')
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
      return (data || []).map((producer) => ({
        id: producer.id,
        userId: producer.user_id,
        genres: producer.genres || [],
        specialties: producer.specialties || [],
        equipment: producer.equipment || [],
        experience: producer.experience || 0,
        productionRate: producer.production_rate,
        songwritingRate: producer.songwriting_rate,
        mixingRate: producer.mixing_rate,
        availability: producer.availability || 'AVAILABLE',
        createdAt: producer.created_at,
        updatedAt: producer.updated_at,
        user: {
          id: producer.user.id,
          username: producer.user.username,
          fullName: producer.user.full_name,
          avatar: producer.user.avatar,
          location: producer.user.location,
          bio: producer.user.bio,
          verified: producer.user.verified,
          followersCount: producer.user.followers_count || 0,
        },
      })) as ProducerWithUser[];
    },
  });
}

export function useTopProducers(limit: number = 20) {
  return useQuery({
    queryKey: ['producers', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producer_profiles')
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
        .order('user.followers_count', { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback if ordering by nested field doesn't work
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('producer_profiles')
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

        if (fallbackError) throw fallbackError;

        // Sort by followers count client-side
        const sorted = (fallbackData || []).sort(
          (a, b) => (b.user.followers_count || 0) - (a.user.followers_count || 0)
        );

        return sorted.map((producer) => ({
          id: producer.id,
          userId: producer.user_id,
          genres: producer.genres || [],
          specialties: producer.specialties || [],
          equipment: producer.equipment || [],
          experience: producer.experience || 0,
          productionRate: producer.production_rate,
          songwritingRate: producer.songwriting_rate,
          mixingRate: producer.mixing_rate,
          availability: producer.availability || 'AVAILABLE',
          createdAt: producer.created_at,
          updatedAt: producer.updated_at,
          user: {
            id: producer.user.id,
            username: producer.user.username,
            fullName: producer.user.full_name,
            avatar: producer.user.avatar,
            location: producer.user.location,
            bio: producer.user.bio,
            verified: producer.user.verified,
            followersCount: producer.user.followers_count || 0,
          },
        })) as ProducerWithUser[];
      }

      return (data || []).map((producer) => ({
        id: producer.id,
        userId: producer.user_id,
        genres: producer.genres || [],
        specialties: producer.specialties || [],
        equipment: producer.equipment || [],
        experience: producer.experience || 0,
        productionRate: producer.production_rate,
        songwritingRate: producer.songwriting_rate,
        mixingRate: producer.mixing_rate,
        availability: producer.availability || 'AVAILABLE',
        createdAt: producer.created_at,
        updatedAt: producer.updated_at,
        user: {
          id: producer.user.id,
          username: producer.user.username,
          fullName: producer.user.full_name,
          avatar: producer.user.avatar,
          location: producer.user.location,
          bio: producer.user.bio,
          verified: producer.user.verified,
          followersCount: producer.user.followers_count || 0,
        },
      })) as ProducerWithUser[];
    },
  });
}
