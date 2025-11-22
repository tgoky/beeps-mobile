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
      console.log('[useStudios] Fetching studios...');

      const { data, error } = await supabase
        .from('studios')
        .select(`
          *,
          owner:users!owner_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) {
        console.error('[useStudios] Error fetching studios:', error);
        throw error;
      }

      console.log('[useStudios] Raw data received:', data?.length || 0, 'studios');
      if (data && data.length > 0) {
        console.log('[useStudios] First studio sample:', {
          id: data[0].id,
          name: data[0].name,
          is_active: data[0].is_active,
          owner_id: data[0].owner_id,
        });
      }

      // Transform the data to match our TypeScript types
      return (data || []).map((studio) => ({
        id: studio.id,
        name: studio.name,
        description: studio.description,
        ownerId: studio.owner_id,
        clubId: studio.club_id,
        address: studio.address,
        city: studio.city,
        state: studio.state,
        country: studio.country,
        postalCode: studio.postal_code,
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
          id: studio.owner.id,
          username: studio.owner.username,
          fullName: studio.owner.full_name,
          avatar: studio.owner.avatar,
        },
      })) as StudioWithOwner[];
    },
  });
}

// Debug function to fetch ALL studios (including inactive) for troubleshooting
export function useAllStudiosDebug() {
  return useQuery({
    queryKey: ['studios', 'debug', 'all'],
    queryFn: async () => {
      console.log('[useAllStudiosDebug] Fetching ALL studios (including inactive)...');

      const { data, error } = await supabase
        .from('studios')
        .select(`
          *,
          owner:users!owner_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useAllStudiosDebug] Error:', error);
        throw error;
      }

      console.log('[useAllStudiosDebug] Total studios in DB:', data?.length || 0);
      const activeCount = data?.filter(s => s.is_active).length || 0;
      const inactiveCount = data?.filter(s => !s.is_active).length || 0;
      console.log('[useAllStudiosDebug] Active:', activeCount, 'Inactive:', inactiveCount);

      if (data && data.length > 0) {
        console.log('[useAllStudiosDebug] Studios breakdown:');
        data.forEach((studio, idx) => {
          console.log(`  ${idx + 1}. ${studio.name} - is_active: ${studio.is_active}, owner_id: ${studio.owner_id}`);
        });
      }

      // Transform the data
      return (data || []).map((studio) => ({
        id: studio.id,
        name: studio.name,
        description: studio.description,
        ownerId: studio.owner_id,
        clubId: studio.club_id,
        address: studio.address,
        city: studio.city,
        state: studio.state,
        country: studio.country,
        postalCode: studio.postal_code,
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
          id: studio.owner.id,
          username: studio.owner.username,
          fullName: studio.owner.full_name,
          avatar: studio.owner.avatar,
        },
      })) as StudioWithOwner[];
    },
  });
}

// Mutation to update studio is_active status
export function useUpdateStudioStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studioId, isActive }: { studioId: string; isActive: boolean }) => {
      console.log(`[useUpdateStudioStatus] Updating studio ${studioId} to is_active=${isActive}`);

      const { data, error } = await supabase
        .from('studios')
        .update({ is_active: isActive })
        .eq('id', studioId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateStudioStatus] Error:', error);
        throw error;
      }

      console.log('[useUpdateStudioStatus] Successfully updated studio');
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
            owner:users!owner_id (
              id,
              username,
              full_name,
              avatar
            )
          `)
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('rating', { ascending: false })
          .limit(20);

        if (error) throw error;

        return (data || []).map((studio) => ({
          id: studio.id,
          name: studio.name,
          description: studio.description,
          ownerId: studio.owner_id,
          clubId: studio.club_id,
          address: studio.address,
          city: studio.city,
          state: studio.state,
          country: studio.country,
          postalCode: studio.postal_code,
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
            id: studio.owner.id,
            username: studio.owner.username,
            fullName: studio.owner.full_name,
            avatar: studio.owner.avatar,
          },
        })) as StudioWithOwner[];
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
            owner:users!owner_id (
              id,
              username,
              full_name,
              avatar
            )
          `)
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('rating', { ascending: false })
          .limit(20);

        if (fallbackError) throw fallbackError;

        return (fallbackData || []).map((studio) => ({
          id: studio.id,
          name: studio.name,
          description: studio.description,
          ownerId: studio.owner_id,
          clubId: studio.club_id,
          address: studio.address,
          city: studio.city,
          state: studio.state,
          country: studio.country,
          postalCode: studio.postal_code,
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
            id: studio.owner.id,
            username: studio.owner.username,
            fullName: studio.owner.full_name,
            avatar: studio.owner.avatar,
          },
        })) as StudioWithOwner[];
      }

      return data as StudioWithOwner[];
    },
    enabled: !!latitude && !!longitude,
  });
}
