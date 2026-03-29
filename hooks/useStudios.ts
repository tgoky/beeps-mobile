import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Studio, VerificationStatus } from '@/types/database';
import * as Crypto from 'expo-crypto';

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
          verificationStatus: studio.verification_status || 'UNVERIFIED',
          verificationDocuments: studio.verification_documents,
          verificationNotes: studio.verification_notes,
          verifiedAt: studio.verified_at,
          verificationRequestedAt: studio.verification_requested_at,
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
          verificationStatus: studio.verification_status || 'UNVERIFIED',
          verificationDocuments: studio.verification_documents,
          verificationNotes: studio.verification_notes,
          verifiedAt: studio.verified_at,
          verificationRequestedAt: studio.verification_requested_at,
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
            verificationStatus: studio.verification_status || 'UNVERIFIED',
            verificationDocuments: studio.verification_documents,
            verificationNotes: studio.verification_notes,
            verifiedAt: studio.verified_at,
            verificationRequestedAt: studio.verification_requested_at,
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
            verificationStatus: studio.verification_status || 'UNVERIFIED',
            verificationDocuments: studio.verification_documents,
            verificationNotes: studio.verification_notes,
            verifiedAt: studio.verified_at,
            verificationRequestedAt: studio.verification_requested_at,
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

// ---------- VERIFICATION HOOKS ----------

export function useStudioVerification(studioId?: string) {
  return useQuery({
    queryKey: ['studio', 'verification', studioId],
    queryFn: async () => {
      if (!studioId) return null;

      const { data, error } = await supabase
        .from('studios')
        .select('verification_status, verification_documents, verification_notes, verified_at, verification_requested_at')
        .eq('id', studioId)
        .single();

      if (error) throw error;

      return {
        status: (data.verification_status || 'UNVERIFIED') as VerificationStatus,
        documents: data.verification_documents || [],
        notes: data.verification_notes,
        verifiedAt: data.verified_at,
        requestedAt: data.verification_requested_at,
      };
    },
    enabled: !!studioId,
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studioId,
      userId,
      documents,
    }: {
      studioId: string;
      userId: string;
      documents: string[];
    }) => {
      // Verify ownership through studio_owner_profiles
      const { data: studio } = await supabase
        .from('studios')
        .select('owner_id, name, studio_owner_profiles!owner_id (user_id)')
        .eq('id', studioId)
        .single();

      if (!studio?.studio_owner_profiles || studio.studio_owner_profiles.user_id !== userId) {
        throw new Error('Only the studio owner can request verification');
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('studios')
        .update({
          verification_status: 'PENDING',
          verification_documents: documents,
          verification_requested_at: now,
          updated_at: now,
        })
        .eq('id', studioId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for the owner
      await supabase.from('notifications').insert({
        id: Crypto.randomUUID(),
        user_id: userId,
        type: 'STUDIO_VERIFICATION_SUBMITTED',
        title: 'Verification Request Submitted',
        message: `Your verification request for ${studio.name} has been submitted and is under review.`,
        reference_id: studioId,
        reference_type: 'STUDIO',
        created_at: now,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      queryClient.invalidateQueries({ queryKey: ['studio'] });
    },
  });
}

// Haversine distance calculation (in miles)
export function getDistanceMiles(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
