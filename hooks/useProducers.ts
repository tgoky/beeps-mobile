import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ProducerProfile } from '@/types/database';
import * as Crypto from 'expo-crypto';

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
  studios?: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
    imageUrl?: string;
    rating: number;
  }[];
  beats?: {
    id: string;
    title: string;
    bpm?: number;
    price: number;
    plays: number;
    imageUrl?: string;
  }[];
  services?: {
    id: string;
    title: string;
    category: string;
    price: number;
  }[];
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  producerId: string;
  projectTitle: string;
  projectDescription: string;
  budget?: number;
  deadline?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  producerResponse?: string;
  respondedAt?: string;
  createdAt: string;
  client?: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  producer?: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
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

// Get detailed producer profile with studios, beats, and services
export function useProducerDetail(producerId?: string) {
  return useQuery({
    queryKey: ['producer', producerId],
    queryFn: async () => {
      if (!producerId) return null;

      // Fetch producer profile
      const { data: producerData, error: producerError } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          avatar,
          bio,
          location,
          verified,
          followers_count,
          producer_profiles!user_id (
            genres,
            specialties,
            equipment,
            experience,
            production_rate,
            songwriting_rate,
            mixing_rate,
            availability
          )
        `)
        .eq('id', producerId)
        .single();

      if (producerError) throw producerError;

      // Fetch studios
      const { data: studios } = await supabase
        .from('studios')
        .select('*')
        .eq('owner_id', producerId)
        .eq('is_active', true);

      // Fetch beats
      const { data: beats } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', producerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch services
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', producerId)
        .eq('is_active', true);

      const profile = producerData.producer_profiles?.[0];

      return {
        id: producerData.id,
        userId: producerData.id,
        genres: profile?.genres || [],
        specialties: profile?.specialties || [],
        equipment: profile?.equipment || [],
        experience: profile?.experience,
        productionRate: profile?.production_rate,
        songwritingRate: profile?.songwriting_rate,
        mixingRate: profile?.mixing_rate,
        availability: profile?.availability,
        user: {
          id: producerData.id,
          username: producerData.username,
          fullName: producerData.full_name,
          avatar: producerData.avatar,
          location: producerData.location,
          bio: producerData.bio,
          verified: producerData.verified,
          followersCount: producerData.followers_count || 0,
        },
        studios: (studios || []).map(s => ({
          id: s.id,
          name: s.name,
          location: s.location,
          hourlyRate: s.hourly_rate,
          imageUrl: s.image_url,
          rating: s.rating,
        })),
        beats: (beats || []).map(b => ({
          id: b.id,
          title: b.title,
          bpm: b.bpm,
          price: b.price,
          plays: b.plays,
          imageUrl: b.image_url,
        })),
        services: (services || []).map(s => ({
          id: s.id,
          title: s.title,
          category: s.category,
          price: s.price,
        })),
      } as ProducerWithUser;
    },
    enabled: !!producerId,
  });
}

// Request service from producer
export function useRequestService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      producerId: string;
      clientId: string;
      projectTitle: string;
      projectDescription: string;
      budget?: number;
      deadline?: string;
    }) => {
      // Generate UUID using expo-crypto
      const requestId = Crypto.randomUUID();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('service_requests')
        .insert({
          id: requestId,
          producer_id: request.producerId,
          client_id: request.clientId,
          project_title: request.projectTitle,
          project_description: request.projectDescription,
          budget: request.budget,
          deadline: request.deadline,
          status: 'PENDING',
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    },
  });
}

// Get service requests for current user
export function useServiceRequests(userId?: string) {
  return useQuery({
    queryKey: ['service-requests', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          client:users!client_id (
            id,
            username,
            full_name,
            avatar
          ),
          producer:users!producer_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .or(`client_id.eq.${userId},producer_id.eq.${userId}`)
        .order('created_at', { ascending: false});

      if (error) throw error;

      return (data || []).map((req: any) => ({
        id: req.id,
        clientId: req.client_id,
        producerId: req.producer_id,
        projectTitle: req.project_title,
        projectDescription: req.project_description,
        budget: req.budget,
        deadline: req.deadline,
        status: req.status,
        producerResponse: req.producer_response,
        respondedAt: req.responded_at,
        createdAt: req.created_at,
        client: req.client ? {
          id: req.client.id,
          username: req.client.username,
          fullName: req.client.full_name,
          avatar: req.client.avatar,
        } : undefined,
        producer: req.producer ? {
          id: req.producer.id,
          username: req.producer.username,
          fullName: req.producer.full_name,
          avatar: req.producer.avatar,
        } : undefined,
      })) as ServiceRequest[];
    },
    enabled: !!userId,
  });
}
