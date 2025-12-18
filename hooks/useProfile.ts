import { supabase } from '@/lib/supabase';
import { ArtistProfile, ProducerProfile, User } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export interface UserProfile extends User {
  artistProfile?: ArtistProfile;
  producerProfile?: ProducerProfile;
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId) // ✅ Correct - using Prisma id
        .maybeSingle();

      if (error) throw error;
      if (!user) return null;

      // Fetch artist profile if applicable
      let artistProfile = null;
      if (user.primary_role === 'ARTIST') {
        const { data } = await supabase
          .from('artist_profiles')
          .select('*')
          .eq('user_id', userId) // ✅ Correct - user_id references Prisma id
          .maybeSingle();
        artistProfile = data;
      }

      // Fetch producer profile if applicable
      let producerProfile = null;
      if (user.primary_role === 'PRODUCER') {
        const { data } = await supabase
          .from('producer_profiles')
          .select('*')
          .eq('user_id', userId) // ✅ Correct - user_id references Prisma id
          .maybeSingle();
        producerProfile = data;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatar: user.avatar,
        coverImage: user.cover_image,
        bio: user.bio,
        location: user.location,
        website: user.website,
        socialLinks: user.social_links,
        primaryRole: user.primary_role,
        verified: user.verified,
        membershipTier: user.membership_tier,
        followersCount: user.followers_count,
        followingCount: user.following_count,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        artistProfile: artistProfile ? {
          id: artistProfile.id,
          userId: artistProfile.user_id,
          genres: artistProfile.genres || [],
          skills: artistProfile.skills || [],
          createdAt: artistProfile.created_at,
          updatedAt: artistProfile.updated_at,
        } : undefined,
        producerProfile: producerProfile ? {
          id: producerProfile.id,
          userId: producerProfile.user_id,
          genres: producerProfile.genres || [],
          specialties: producerProfile.specialties || [],
          equipment: producerProfile.equipment || [],
          experience: producerProfile.experience,
          productionRate: producerProfile.production_rate,
          songwritingRate: producerProfile.songwriting_rate,
          mixingRate: producerProfile.mixing_rate,
          availability: producerProfile.availability,
          createdAt: producerProfile.created_at,
          updatedAt: producerProfile.updated_at,
        } : undefined,
      } as UserProfile;
    },
    enabled: !!userId,
  });
}

// Fetch user's beats
export function useUserBeats(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId, 'beats'],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', userId) // ✅ Correct - producer_id references Prisma id
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((beat) => ({
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
      }));
    },
    enabled: !!userId,
  });
}

// ❌ PROBLEM: Equipment table uses seller_id which references GearSalesProfile.id, not User.id
// We need to first get the GearSalesProfile.id for this user
export function useUserEquipment(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId, 'equipment'],
    queryFn: async () => {
      if (!userId) return [];

      // First, get the gear sales profile for this user
      const { data: gearProfile } = await supabase
        .from('gear_sales_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!gearProfile) return []; // User doesn't have a gear sales profile

      // Then get equipment for this profile
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('seller_id', gearProfile.id) // ✅ seller_id references GearSalesProfile.id
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        sellerId: item.seller_id,
        clubId: item.club_id,
        price: item.price,
        rentalRate: item.rental_rate,
        condition: item.condition,
        location: item.location,
        city: item.city,
        state: item.state,
        country: item.country,
        imageUrl: item.image_url,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    },
    enabled: !!userId,
  });
}

// Fetch user's collaborations
export function useUserCollaborations(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId, 'collaborations'],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .eq('creator_id', userId) // ✅ Correct - creator_id references Prisma id
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((collab) => ({
        id: collab.id,
        type: collab.type,
        status: collab.status,
        title: collab.title,
        description: collab.description,
        creatorId: collab.creator_id,
        studioId: collab.studio_id,
        price: collab.price,
        minBid: collab.min_bid,
        currentBid: collab.current_bid,
        duration: collab.duration,
        location: collab.location,
        genre: collab.genre,
        equipment: collab.equipment || [],
        slots: collab.slots,
        availableDate: collab.available_date,
        expiresAt: collab.expires_at,
        imageUrl: collab.image_url,
        createdAt: collab.created_at,
        updatedAt: collab.updated_at,
      }));
    },
    enabled: !!userId,
  });
}