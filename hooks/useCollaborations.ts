import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Collaboration, CollaborationType } from '@/types/database';

export interface CollaborationWithCreator extends Collaboration {
  creator: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export function useCollaborations() {
  return useQuery({
    queryKey: ['collaborations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select(`
          *,
          users!creator_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript types
      return (data || []).map((collab) => {
        const creatorUser = collab.users;

        return {
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
          creator: {
            id: creatorUser?.id || '',
            username: creatorUser?.username || '',
            fullName: creatorUser?.full_name,
            avatar: creatorUser?.avatar,
          },
        };
      }) as CollaborationWithCreator[];
    },
  });
}

// Fetch collaborations by type
export function useCollaborationsByType(type?: string) {
  return useQuery({
    queryKey: ['collaborations', 'type', type],
    queryFn: async () => {
      if (!type) {
        // If no type specified, return all open collaborations
        const { data, error } = await supabase
          .from('collaborations')
          .select(`
            *,
            users!creator_id (
              id,
              username,
              full_name,
              avatar
            )
          `)
          .eq('status', 'OPEN')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((collab) => {
          const creatorUser = collab.users;

          return {
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
            creator: {
              id: creatorUser?.id || '',
              username: creatorUser?.username || '',
              fullName: creatorUser?.full_name,
              avatar: creatorUser?.avatar,
            },
          };
        }) as CollaborationWithCreator[];
      }

      const { data, error } = await supabase
        .from('collaborations')
        .select(`
          *,
          users!creator_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('type', type.toUpperCase())
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((collab) => {
        const creatorUser = collab.users;

        return {
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
          creator: {
            id: creatorUser?.id || '',
            username: creatorUser?.username || '',
            fullName: creatorUser?.full_name,
            avatar: creatorUser?.avatar,
          },
        };
      }) as CollaborationWithCreator[];
    },
    enabled: !!type,
  });
}

// Fetch user's collaborations
export function useMyCollaborations(userId?: string) {
  return useQuery({
    queryKey: ['collaborations', 'my', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('collaborations')
        .select(`
          *,
          users!creator_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((collab) => {
        const creatorUser = collab.users;

        return {
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
          creator: {
            id: creatorUser?.id || '',
            username: creatorUser?.username || '',
            fullName: creatorUser?.full_name,
            avatar: creatorUser?.avatar,
          },
        };
      }) as CollaborationWithCreator[];
    },
    enabled: !!userId,
  });
}

// Create a collaboration
export function useCreateCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collaboration: {
      type: CollaborationType;
      title: string;
      description?: string;
      userId: string;
      price?: number;
      minBid?: number;
      duration?: number;
      location?: string;
      genre?: string;
      equipment?: string[];
      slots?: number;
      availableDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('collaborations')
        .insert({
          type: collaboration.type,
          status: 'OPEN',
          title: collaboration.title,
          description: collaboration.description,
          creator_id: collaboration.userId,
          price: collaboration.price,
          min_bid: collaboration.minBid,
          duration: collaboration.duration,
          location: collaboration.location,
          genre: collaboration.genre,
          equipment: collaboration.equipment,
          slots: collaboration.slots,
          available_date: collaboration.availableDate,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['collaborations', 'my'] });
    },
  });
}
