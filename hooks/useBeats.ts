import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Beat } from '@/types/database';

export interface BeatWithProducer extends Beat {
  producer: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export function useBeats() {
  return useQuery({
    queryKey: ['beats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          producer_profiles!producer_id (
            id,
            users!user_id (
              id,
              username,
              full_name,
              avatar
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((beat) => {
        const producerProfile = beat.producer_profiles;
        const producerUser = producerProfile?.users;

        return {
          id: beat.id,
          title: beat.title,
          description: beat.description,
          producerId: beat.producer_id,
          clubId: beat.club_id,
          bpm: beat.bpm,
          key: beat.key,
          price: beat.price,
          type: beat.type,
          genres: beat.genres || [],
          moods: beat.moods || [],
          tags: beat.tags || [],
          imageUrl: beat.image_url,
          audioUrl: beat.audio_url,
          plays: beat.plays || 0,
          likes: beat.likes || 0,
          isActive: beat.is_active,
          createdAt: beat.created_at,
          updatedAt: beat.updated_at,
          producer: {
            id: producerUser?.id || '',
            username: producerUser?.username || '',
            fullName: producerUser?.full_name,
            avatar: producerUser?.avatar,
          },
        };
      }) as BeatWithProducer[];
    },
  });
}

// Fetch beats by genre
export function useBeatsByGenre(genre?: string) {
  return useQuery({
    queryKey: ['beats', 'genre', genre],
    queryFn: async () => {
      if (!genre) {
        // If no genre specified, return all beats
        const { data, error } = await supabase
          .from('beats')
          .select(`
            *,
            producer_profiles!producer_id (
              id,
              users!user_id (
                id,
                username,
                full_name,
                avatar
              )
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((beat) => {
          const producerProfile = beat.producer_profiles;
          const producerUser = producerProfile?.users;

          return {
            id: beat.id,
            title: beat.title,
            description: beat.description,
            producerId: beat.producer_id,
            clubId: beat.club_id,
            bpm: beat.bpm,
            key: beat.key,
            price: beat.price,
            type: beat.type,
            genres: beat.genres || [],
            moods: beat.moods || [],
            tags: beat.tags || [],
            imageUrl: beat.image_url,
            audioUrl: beat.audio_url,
            plays: beat.plays || 0,
            likes: beat.likes || 0,
            isActive: beat.is_active,
            createdAt: beat.created_at,
            updatedAt: beat.updated_at,
            producer: {
              id: producerUser?.id || '',
              username: producerUser?.username || '',
              fullName: producerUser?.full_name,
              avatar: producerUser?.avatar,
            },
          };
        }) as BeatWithProducer[];
      }

      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          producer_profiles!producer_id (
            id,
            users!user_id (
              id,
              username,
              full_name,
              avatar
            )
          )
        `)
        .contains('genres', [genre])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((beat) => {
        const producerProfile = beat.producer_profiles;
        const producerUser = producerProfile?.users;

        return {
          id: beat.id,
          title: beat.title,
          description: beat.description,
          producerId: beat.producer_id,
          clubId: beat.club_id,
          bpm: beat.bpm,
          key: beat.key,
          price: beat.price,
          type: beat.type,
          genres: beat.genres || [],
          moods: beat.moods || [],
          tags: beat.tags || [],
          imageUrl: beat.image_url,
          audioUrl: beat.audio_url,
          plays: beat.plays || 0,
          likes: beat.likes || 0,
          isActive: beat.is_active,
          createdAt: beat.created_at,
          updatedAt: beat.updated_at,
          producer: {
            id: producerUser?.id || '',
            username: producerUser?.username || '',
            fullName: producerUser?.full_name,
            avatar: producerUser?.avatar,
          },
        };
      }) as BeatWithProducer[];
    },
    enabled: !!genre,
  });
}
