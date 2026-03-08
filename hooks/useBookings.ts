import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus, PaymentStatus } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

// Helper to map snake_case DB row to camelCase Booking
function mapBookingRow(booking: any): Booking {
  return {
    id: booking.id,
    studioId: booking.studio_id,
    userId: booking.user_id,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status as BookingStatus,
    totalAmount: booking.total_amount,
    notes: booking.notes,
    // Session lifecycle
    checkedInAt: booking.checked_in_at,
    checkedOutAt: booking.checked_out_at,
    qrCode: booking.qr_code,
    overtimeMinutes: booking.overtime_minutes,
    overtimeAmount: booking.overtime_amount,
    // Payment
    paymentStatus: booking.payment_status as PaymentStatus,
    paymentIntentId: booking.payment_intent_id,
    platformFee: booking.platform_fee,
    // Confirmations
    bookerConfirmedCheckIn: booking.booker_confirmed_check_in,
    bookerConfirmedCheckOut: booking.booker_confirmed_check_out,
    confirmationCode: booking.confirmation_code,
    confirmationExpiresAt: booking.confirmation_expires_at,
    // Early end
    earlyEndReason: booking.early_end_reason,
    actualSessionMinutes: booking.actual_session_minutes,
    proRataAmount: booking.pro_rata_amount,
    endedBy: booking.ended_by,
    // Dispute
    disputeStatus: booking.dispute_status,
    disputeReason: booking.dispute_reason,
    disputedAt: booking.disputed_at,
    disputeResolvedAt: booking.dispute_resolved_at,
    disputedBy: booking.disputed_by,
    // Payment release
    paymentReleaseEligibleAt: booking.payment_release_eligible_at,
    bookerApprovedPayment: booking.booker_approved_payment,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
  };
}

export interface BookingWithStudio extends Booking {
  studio: {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
    imageUrl?: string;
  };
}

export interface BookingWithStudioAndClient extends BookingWithStudio {
  client?: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

// ---------- QUERIES ----------

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
            id, name, location, hourly_rate, image_url
          )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        ...mapBookingRow(row),
        studio: {
          id: row.studios.id,
          name: row.studios.name,
          location: row.studios.location,
          hourlyRate: row.studios.hourly_rate,
          imageUrl: row.studios.image_url,
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
      return (data || []).map(mapBookingRow) as Booking[];
    },
    enabled: !!studioId,
  });
}

export function useStudioOwnerBookings(userId?: string) {
  return useQuery({
    queryKey: ['bookings', 'owner', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: studios, error: studiosError } = await supabase
        .from('studios')
        .select('id')
        .eq('owner_id', userId);

      if (studiosError) throw studiosError;
      if (!studios || studios.length === 0) return [];

      const studioIds = studios.map(s => s.id);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          studios!studio_id (id, name, location, hourly_rate, image_url),
          users!user_id (id, username, full_name, avatar)
        `)
        .in('studio_id', studioIds)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        ...mapBookingRow(row),
        studio: {
          id: row.studios.id,
          name: row.studios.name,
          location: row.studios.location,
          hourlyRate: row.studios.hourly_rate,
          imageUrl: row.studios.image_url,
        },
        client: {
          id: row.users.id,
          username: row.users.username,
          fullName: row.users.full_name,
          avatar: row.users.avatar,
        },
      })) as BookingWithStudioAndClient[];
    },
    enabled: !!userId,
  });
}

// Get single booking with full details
export function useBookingDetail(bookingId?: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          studios!studio_id (
            id, name, location, city, state, hourly_rate, image_url, capacity,
            owner_id
          ),
          users!user_id (id, username, full_name, avatar)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Get studio owner info
      let owner = null;
      if (data.studios?.owner_id) {
        const { data: ownerData } = await supabase
          .from('users')
          .select('id, username, full_name, avatar')
          .eq('id', data.studios.owner_id)
          .single();
        if (ownerData) {
          owner = {
            id: ownerData.id,
            username: ownerData.username,
            fullName: ownerData.full_name,
            avatar: ownerData.avatar,
          };
        }
      }

      return {
        ...mapBookingRow(data),
        studio: {
          id: data.studios.id,
          name: data.studios.name,
          location: data.studios.location,
          city: data.studios.city,
          state: data.studios.state,
          hourlyRate: data.studios.hourly_rate,
          imageUrl: data.studios.image_url,
          capacity: data.studios.capacity,
          ownerId: data.studios.owner_id,
        },
        client: {
          id: data.users.id,
          username: data.users.username,
          fullName: data.users.full_name,
          avatar: data.users.avatar,
        },
        owner,
      };
    },
    enabled: !!bookingId,
  });
}

// Active sessions for a user (as booker or studio owner)
export function useActiveSessions(userId?: string) {
  return useQuery({
    queryKey: ['sessions', 'active', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get bookings where user is the booker
      const { data: myActive, error: err1 } = await supabase
        .from('bookings')
        .select(`
          *,
          studios!studio_id (id, name, location, hourly_rate, image_url)
        `)
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('start_time', { ascending: true });

      if (err1) throw err1;

      // Get bookings for studios owned by user
      const { data: studios } = await supabase
        .from('studios')
        .select('id')
        .eq('owner_id', userId);

      let studioActive: any[] = [];
      if (studios && studios.length > 0) {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            studios!studio_id (id, name, location, hourly_rate, image_url),
            users!user_id (id, username, full_name, avatar)
          `)
          .in('studio_id', studios.map(s => s.id))
          .eq('status', 'ACTIVE')
          .order('start_time', { ascending: true });

        if (!error && data) studioActive = data;
      }

      const mapRow = (row: any, isOwner: boolean) => ({
        ...mapBookingRow(row),
        studio: {
          id: row.studios.id,
          name: row.studios.name,
          location: row.studios.location,
          hourlyRate: row.studios.hourly_rate,
          imageUrl: row.studios.image_url,
        },
        ...(isOwner && row.users ? {
          client: {
            id: row.users.id,
            username: row.users.username,
            fullName: row.users.full_name,
            avatar: row.users.avatar,
          },
        } : {}),
        isOwnerView: isOwner,
      });

      return [
        ...(myActive || []).map(r => mapRow(r, false)),
        ...(studioActive || []).map(r => mapRow(r, true)),
      ];
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30s for active sessions
  });
}

// ---------- MUTATIONS ----------

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
          payment_status: 'UNPAID',
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
        .update({ status, updated_at: new Date().toISOString() })
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

// Pay for booking - escrow hold + QR code generation
export function usePayBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, totalAmount }: { bookingId: string; totalAmount: number }) => {
      const qrCode = `BEEPS-${bookingId.slice(0, 8)}-${Crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const platformFee = Math.round(totalAmount * 0.10 * 100) / 100;
      const paymentIntentId = `pi_sim_${Crypto.randomUUID().slice(0, 24)}`;

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'CONFIRMED',
          payment_status: 'PAYMENT_HELD',
          payment_intent_id: paymentIntentId,
          platform_fee: platformFee,
          qr_code: qrCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create transaction record
      await supabase.from('transactions').insert({
        id: Crypto.randomUUID(),
        user_id: data.user_id,
        type: 'STUDIO_BOOKING',
        status: 'PENDING',
        amount: totalAmount,
        reference_id: bookingId,
        reference_type: 'booking',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { ...data, qrCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Check in - studio owner initiates (requires QR code)
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, qrCode }: { bookingId: string; qrCode: string }) => {
      // Fetch booking to validate QR
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*, studios!studio_id (name)')
        .eq('id', bookingId)
        .single();

      if (fetchErr) throw fetchErr;
      if (booking.status !== 'CONFIRMED') throw new Error('Booking must be CONFIRMED to check in');
      if (!booking.qr_code || qrCode !== booking.qr_code) throw new Error('Invalid QR code');

      // Time window: 30 min before to 15 min after
      const now = new Date();
      const start = new Date(booking.start_time);
      const earliest = new Date(start.getTime() - 30 * 60 * 1000);
      const latest = new Date(start.getTime() + 15 * 60 * 1000);

      if (now < earliest) throw new Error('Too early to check in');
      if (now > latest) throw new Error('Check-in window has expired');

      // Generate confirmation code for artist
      const confirmationCode = Crypto.randomUUID().slice(0, 6).toUpperCase();
      const confirmationExpiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'ACTIVE',
          checked_in_at: now.toISOString(),
          confirmation_code: confirmationCode,
          confirmation_expires_at: confirmationExpiresAt,
          booker_confirmed_check_in: false,
          updated_at: now.toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Notify artist
      await supabase.from('notifications').insert({
        id: Crypto.randomUUID(),
        user_id: booking.user_id,
        type: 'SESSION_CONFIRM_REQUIRED',
        title: 'Confirm Your Presence',
        message: `Your session at ${booking.studios.name} is starting. Confirm with code: ${confirmationCode}`,
        reference_id: bookingId,
        reference_type: 'BOOKING',
        created_at: now.toISOString(),
      });

      return { ...data, confirmationCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Confirm check-in (artist enters confirmation code)
export function useConfirmCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, confirmationCode }: { bookingId: string; confirmationCode: string }) => {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchErr) throw fetchErr;
      if (booking.status !== 'ACTIVE') throw new Error('Booking must be ACTIVE');
      if (booking.booker_confirmed_check_in) throw new Error('Already confirmed');
      if (!booking.confirmation_code || confirmationCode !== booking.confirmation_code) {
        throw new Error('Invalid confirmation code');
      }
      if (booking.confirmation_expires_at && new Date() > new Date(booking.confirmation_expires_at)) {
        throw new Error('Confirmation code has expired');
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({
          booker_confirmed_check_in: true,
          confirmation_code: null,
          confirmation_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Check out - end session (both parties can)
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason, endedBy }: {
      bookingId: string;
      reason?: string;
      endedBy: 'STUDIO_OWNER' | 'BOOKER';
    }) => {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*, studios!studio_id (name, hourly_rate)')
        .eq('id', bookingId)
        .single();

      if (fetchErr) throw fetchErr;
      if (booking.status !== 'ACTIVE') throw new Error('Session must be ACTIVE');

      const now = new Date();
      const scheduledEnd = new Date(booking.end_time);
      const scheduledStart = new Date(booking.start_time);
      const checkedInAt = booking.checked_in_at ? new Date(booking.checked_in_at) : scheduledStart;

      const totalScheduledMinutes = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60));
      const actualSessionMinutes = Math.max(1, Math.round((now.getTime() - checkedInAt.getTime()) / (1000 * 60)));
      const isEarlyEnd = now < scheduledEnd;

      if (isEarlyEnd && !reason) throw new Error('Reason required for early session end');

      let overtimeMinutes = 0;
      let overtimeAmount = 0;
      if (now > scheduledEnd) {
        overtimeMinutes = Math.ceil((now.getTime() - scheduledEnd.getTime()) / (1000 * 60));
        overtimeAmount = (overtimeMinutes / 60) * parseFloat(booking.studios.hourly_rate);
      }

      const totalAmount = parseFloat(booking.total_amount);
      let proRataAmount: number | null = null;
      if (isEarlyEnd) {
        const usageRatio = Math.min(actualSessionMinutes / totalScheduledMinutes, 1);
        proRataAmount = Math.round(totalAmount * usageRatio * 100) / 100;
      }

      const paymentReleaseEligibleAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'COMPLETED',
          checked_out_at: now.toISOString(),
          overtime_minutes: overtimeMinutes,
          overtime_amount: overtimeAmount,
          actual_session_minutes: actualSessionMinutes,
          pro_rata_amount: isEarlyEnd ? proRataAmount : null,
          early_end_reason: isEarlyEnd ? reason : null,
          ended_by: endedBy,
          payment_release_eligible_at: paymentReleaseEligibleAt,
          booker_confirmed_check_out: endedBy === 'BOOKER',
          updated_at: now.toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        sessionSummary: {
          scheduledMinutes: totalScheduledMinutes,
          actualMinutes: actualSessionMinutes,
          isEarlyEnd,
          overtimeMinutes,
          overtimeAmount,
          proRataAmount,
          finalAmount: isEarlyEnd ? proRataAmount : totalAmount + overtimeAmount,
        },
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Confirm session & approve payment (artist)
export function useConfirmSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchErr) throw fetchErr;
      if (booking.status !== 'COMPLETED') throw new Error('Session must be COMPLETED');
      if (booking.payment_status === 'PAYMENT_RELEASED') throw new Error('Payment already released');

      const totalAmount = parseFloat(booking.total_amount);
      const overtimeAmount = parseFloat(booking.overtime_amount || '0');
      const proRataAmount = booking.pro_rata_amount ? parseFloat(booking.pro_rata_amount) : null;
      const baseAmount = proRataAmount !== null ? proRataAmount : totalAmount;
      const finalAmount = baseAmount + overtimeAmount;
      const platformFee = Math.round(finalAmount * 0.10 * 100) / 100;

      const { data, error } = await supabase
        .from('bookings')
        .update({
          booker_confirmed_check_out: true,
          booker_approved_payment: true,
          payment_status: 'PAYMENT_RELEASED',
          platform_fee: platformFee,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, finalAmount, platformFee, studioOwnerPayout: finalAmount - platformFee };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Raise dispute
export function useRaiseDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason, userId }: {
      bookingId: string;
      reason: string;
      userId: string;
    }) => {
      if (reason.length < 10) throw new Error('Dispute reason must be at least 10 characters');

      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchErr) throw fetchErr;
      if (!['ACTIVE', 'COMPLETED'].includes(booking.status)) throw new Error('Cannot dispute this booking');
      if (booking.payment_status === 'PAYMENT_RELEASED') throw new Error('Cannot dispute after payment released');
      if (booking.dispute_status === 'OPEN' || booking.dispute_status === 'UNDER_REVIEW') {
        throw new Error('A dispute is already active');
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .update({
          dispute_status: 'OPEN',
          dispute_reason: reason,
          disputed_at: now,
          disputed_by: userId,
          updated_at: now,
        })
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

// Release payment (auto or manual)
export function useReleasePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchErr) throw fetchErr;
      if (booking.status !== 'COMPLETED') throw new Error('Booking must be COMPLETED');
      if (booking.payment_status === 'PAYMENT_RELEASED') throw new Error('Payment already released');
      if (booking.dispute_status === 'OPEN' || booking.dispute_status === 'UNDER_REVIEW') {
        throw new Error('Cannot release payment with active dispute');
      }

      const totalAmount = parseFloat(booking.total_amount);
      const overtimeAmount = parseFloat(booking.overtime_amount || '0');
      const proRataAmount = booking.pro_rata_amount ? parseFloat(booking.pro_rata_amount) : null;
      const baseAmount = proRataAmount !== null ? proRataAmount : totalAmount;
      const finalAmount = baseAmount + overtimeAmount;
      const platformFee = Math.round(finalAmount * 0.10 * 100) / 100;

      const { data, error } = await supabase
        .from('bookings')
        .update({
          booker_approved_payment: true,
          payment_status: 'PAYMENT_RELEASED',
          platform_fee: platformFee,
          updated_at: new Date().toISOString(),
        })
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
