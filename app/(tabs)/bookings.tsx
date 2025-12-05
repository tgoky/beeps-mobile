import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useBookings, useCancelBooking } from '@/hooks/useBookings';
import { BookingStatus } from '@/types/database';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#10B981',
  CANCELLED: '#EF4444',
  COMPLETED: '#6B7280',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: bookings = [], isLoading, refetch } = useBookings(user?.id);
  const cancelBooking = useCancelBooking();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCancelBooking = (bookingId: string, studioName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${studioName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking.mutateAsync(bookingId);
              Alert.alert('Success', 'Booking cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const isUpcoming = startTime > now && booking.status !== 'CANCELLED';
    const isPast = startTime <= now || booking.status === 'COMPLETED';
    const isCancelled = booking.status === 'CANCELLED';

    switch (filter) {
      case 'upcoming':
        return isUpcoming;
      case 'past':
        return isPast;
      case 'cancelled':
        return isCancelled;
      default:
        return true;
    }
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'upcoming', 'past', 'cancelled'] as FilterType[]).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterTab,
                filter === filterType && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => setFilter(filterType)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === filterType ? '#fff' : colors.textSecondary,
                  },
                ]}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {filter === 'upcoming'
              ? 'You have no upcoming bookings'
              : filter === 'past'
              ? 'You have no past bookings'
              : filter === 'cancelled'
              ? 'You have no cancelled bookings'
              : 'Book a studio to get started!'}
          </Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.browseButtonText}>Browse Studios</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {filteredBookings.map((booking) => {
            const startTime = dayjs(booking.startTime);
            const endTime = dayjs(booking.endTime);
            const duration = endTime.diff(startTime, 'hour', true);
            const isUpcoming = new Date(booking.startTime) > new Date();
            const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

            return (
              <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Studio Info */}
                <View style={styles.bookingHeader}>
                  <View style={styles.studioInfo}>
                    <Text style={[styles.studioName, { color: colors.text }]}>{booking.studio.name}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color={colors.textTertiary} />
                      <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                        {booking.studio.location}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_COLORS[booking.status] + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>
                      {STATUS_LABELS[booking.status]}
                    </Text>
                  </View>
                </View>

                {/* Date & Time */}
                <View style={styles.timeSection}>
                  <View style={styles.timeRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {startTime.format('MMM D, YYYY')}
                    </Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {startTime.format('h:mm A')} - {endTime.format('h:mm A')} ({duration.toFixed(1)}h)
                    </Text>
                  </View>
                </View>

                {/* Price */}
                <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.priceAmount, { color: colors.accent }]}>
                    ${booking.totalAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Actions */}
                {canCancel && isUpcoming && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: colors.error }]}
                      onPress={() => handleCancelBooking(booking.id, booking.studio.name)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                      <Text style={[styles.cancelButtonText, { color: colors.error }]}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  list: {
    flex: 1,
  },
  bookingCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  studioInfo: {
    flex: 1,
  },
  studioName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FontSizes.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  timeSection: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.base,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginBottom: Spacing.md,
  },
  priceLabel: {
    fontSize: FontSizes.base,
  },
  priceAmount: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  actions: {
    gap: Spacing.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  cancelButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
});
