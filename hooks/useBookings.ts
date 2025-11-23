import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus } from '@/types/database';

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
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          studio_id: booking.studioId,
          user_id: booking.userId,
          start_time: booking.startTime,
          end_time: booking.endTime,
          status: 'PENDING',
          total_amount: booking.totalAmount,
          notes: booking.notes,
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
