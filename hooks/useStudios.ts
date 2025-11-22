import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Studio } from '@/types/database';

export interface StudioWithOwner extends Studio {
  owner: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export function useStudios() {
  return useQuery({
    queryKey: ['studios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select(`
          *,
          studio_owner_profiles!owner_id (
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
        .order('rating', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((studio) => {
        const ownerProfile = studio.studio_owner_profiles;
        const ownerUser = ownerProfile?.users;

        return {
          id: studio.id,
          name: studio.name,
          description: studio.description,
          ownerId: studio.owner_id,
          clubId: studio.club_id,
          location: studio.location,
          city: studio.city,
          state: studio.state,
          country: studio.country,
          latitude: studio.latitude,
          longitude: studio.longitude,
          hourlyRate: studio.hourly_rate,
          equipment: studio.equipment || [],
          capacity: studio.capacity,
          imageUrl: studio.image_url,
          rating: studio.rating || 0,
          reviewsCount: studio.reviews_count || 0,
          isActive: studio.is_active,
          createdAt: studio.created_at,
          updatedAt: studio.updated_at,
          owner: {
            id: ownerUser?.id || '',
            username: ownerUser?.username || '',
            fullName: ownerUser?.full_name,
            avatar: ownerUser?.avatar,
          },
        };
      }) as StudioWithOwner[];
    },
  });
}

// Fetch ALL studios (including inactive) - used by Studio Manager tool
export function useAllStudiosDebug() {
  return useQuery({
    queryKey: ['studios', 'debug', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select(`
          *,
          studio_owner_profiles!owner_id (
            id,
            users!user_id (
              id,
              username,
              full_name,
              avatar
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data
      return (data || []).map((studio) => {
        const ownerProfile = studio.studio_owner_profiles;
        const ownerUser = ownerProfile?.users;

        return {
          id: studio.id,
          name: studio.name,
          description: studio.description,
          ownerId: studio.owner_id,
          clubId: studio.club_id,
          location: studio.location,
          city: studio.city,
          state: studio.state,
          country: studio.country,
          latitude: studio.latitude,
          longitude: studio.longitude,
          hourlyRate: studio.hourly_rate,
          equipment: studio.equipment || [],
          capacity: studio.capacity,
          imageUrl: studio.image_url,
          rating: studio.rating || 0,
          reviewsCount: studio.reviews_count || 0,
          isActive: studio.is_active,
          createdAt: studio.created_at,
          updatedAt: studio.updated_at,
          owner: {
            id: ownerUser?.id || '',
            username: ownerUser?.username || '',
            fullName: ownerUser?.full_name,
            avatar: ownerUser?.avatar,
          },
        };
      }) as StudioWithOwner[];
    },
  });
}

// Mutation to update studio is_active status
export function useUpdateStudioStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studioId, isActive }: { studioId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('studios')
        .update({ is_active: isActive })
        .eq('id', studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch studios queries
      queryClient.invalidateQueries({ queryKey: ['studios'] });
    },
  });
}

export function useNearbyStudios(latitude?: number, longitude?: number, radiusKm: number = 50) {
  return useQuery({
    queryKey: ['studios', 'nearby', latitude, longitude, radiusKm],
    queryFn: async () => {
      if (!latitude || !longitude) {
        // If no location provided, just get all studios
        const { data, error } = await supabase
          .from('studios')
          .select(`
            *,
            studio_owner_profiles!owner_id (
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
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('rating', { ascending: false })
          .limit(20);

        if (error) throw error;

        return (data || []).map((studio) => {
          const ownerProfile = studio.studio_owner_profiles;
          const ownerUser = ownerProfile?.users;

          return {
            id: studio.id,
            name: studio.name,
            description: studio.description,
            ownerId: studio.owner_id,
            clubId: studio.club_id,
            location: studio.location,
            city: studio.city,
            state: studio.state,
            country: studio.country,
            latitude: studio.latitude,
            longitude: studio.longitude,
            hourlyRate: studio.hourly_rate,
            equipment: studio.equipment || [],
            capacity: studio.capacity,
            imageUrl: studio.image_url,
            rating: studio.rating || 0,
            reviewsCount: studio.reviews_count || 0,
            isActive: studio.is_active,
            createdAt: studio.created_at,
            updatedAt: studio.updated_at,
            owner: {
              id: ownerUser?.id || '',
              username: ownerUser?.username || '',
              fullName: ownerUser?.full_name,
              avatar: ownerUser?.avatar,
            },
          };
        }) as StudioWithOwner[];
      }

      // Use PostGIS earth_distance for proximity search
      const { data, error } = await supabase.rpc('nearby_studios', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
      });

      if (error) {
        // Fallback to simple query if RPC function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('studios')
          .select(`
            *,
            studio_owner_profiles!owner_id (
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
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('rating', { ascending: false })
          .limit(20);

        if (fallbackError) throw fallbackError;

        return (fallbackData || []).map((studio) => {
          const ownerProfile = studio.studio_owner_profiles;
          const ownerUser = ownerProfile?.users;

          return {
            id: studio.id,
            name: studio.name,
            description: studio.description,
            ownerId: studio.owner_id,
            clubId: studio.club_id,
            location: studio.location,
            city: studio.city,
            state: studio.state,
            country: studio.country,
            latitude: studio.latitude,
            longitude: studio.longitude,
            hourlyRate: studio.hourly_rate,
            equipment: studio.equipment || [],
            capacity: studio.capacity,
            imageUrl: studio.image_url,
            rating: studio.rating || 0,
            reviewsCount: studio.reviews_count || 0,
            isActive: studio.is_active,
            createdAt: studio.created_at,
            updatedAt: studio.updated_at,
            owner: {
              id: ownerUser?.id || '',
              username: ownerUser?.username || '',
              fullName: ownerUser?.full_name,
              avatar: ownerUser?.avatar,
            },
          };
        }) as StudioWithOwner[];
      }

      return data as StudioWithOwner[];
    },
    enabled: !!latitude && !!longitude,
  });
}
