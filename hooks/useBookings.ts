import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus } from '@/types/database';
import * as Crypto from 'expo-crypto';

export interface BookingWithStudio extends Booking {
  studio: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
    imageUrl?: string;
  };
}

export function useBookings(userId?: string) {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          studios!studio_id (
            id,
            name,
            location,
            hourly_rate,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return (data || []).map((booking) => ({
        id: booking.id,
        studioId: booking.studio_id,
        userId: booking.user_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status as BookingStatus,
        totalAmount: booking.total_amount,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        studio: {
          id: booking.studios.id,
          name: booking.studios.name,
          location: booking.studios.location,
          hourlyRate: booking.studios.hourly_rate,
          imageUrl: booking.studios.image_url,
        },
      })) as BookingWithStudio[];
    },
    enabled: !!userId,
  });
}

export function useStudioBookings(studioId?: string) {
  return useQuery({
    queryKey: ['bookings', 'studio', studioId],
    queryFn: async () => {
      if (!studioId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('studio_id', studioId)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return (data || []).map((booking) => ({
        id: booking.id,
        studioId: booking.studio_id,
        userId: booking.user_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status as BookingStatus,
        totalAmount: booking.total_amount,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      })) as Booking[];
    },
    enabled: !!studioId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: {
      studioId: string;
      userId: string;
      startTime: string;
      endTime: string;
      totalAmount: number;
      notes?: string;
    }) => {
      // Generate UUID for the booking
      const bookingId = Crypto.randomUUID();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          studio_id: booking.studioId,
          user_id: booking.userId,
          start_time: booking.startTime,
          end_time: booking.endTime,
          status: 'PENDING',
          total_amount: booking.totalAmount,
          notes: booking.notes || '',
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: BookingStatus }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Get bookings for studios owned by user
export function useStudioOwnerBookings(userId?: string) {
  return useQuery({
    queryKey: ['bookings', 'owner', userId],
    queryFn: async () => {
      if (!userId) return [];

      // First, get studios owned by the user
      const { data: studios, error: studiosError } = await supabase
        .from('studios')
        .select('id')
        .eq('owner_id', userId);

      if (studiosError) throw studiosError;
      if (!studios || studios.length === 0) return [];

      const studioIds = studios.map(s => s.id);

      // Then get bookings for those studios
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          studios!studio_id (
            id,
            name,
            location,
            hourly_rate,
            image_url
          ),
          users!user_id (
            id,
            username,
            full_name,
            avatar
          )
        `)
        .in('studio_id', studioIds)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return (data || []).map((booking) => ({
        id: booking.id,
        studioId: booking.studio_id,
        userId: booking.user_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status as BookingStatus,
        totalAmount: booking.total_amount,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        studio: {
          id: booking.studios.id,
          name: booking.studios.name,
          location: booking.studios.location,
          hourlyRate: booking.studios.hourly_rate,
          imageUrl: booking.studios.image_url,
        },
        client: {
          id: booking.users.id,
          username: booking.users.username,
          fullName: booking.users.full_name,
          avatar: booking.users.avatar,
        },
      })) as any[];
    },
    enabled: !!userId,
  });
}

// Confirm booking (studio owner)
export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Reject booking (studio owner)
export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
