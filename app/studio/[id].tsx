import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreateBooking, useStudioBookings } from '@/hooks/useBookings';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

export default function StudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000)); // 1 hour later
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [notes, setNotes] = useState('');

  const createBooking = useCreateBooking();

  // Fetch studio details
  const { data: studio, isLoading } = useQuery({
    queryKey: ['studio', id],
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
        .eq('id', id)
        .single();

      if (error) throw error;

      const ownerProfile = data.studio_owner_profiles;
      const ownerUser = ownerProfile?.users;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        ownerId: data.owner_id,
        location: data.location,
        city: data.city,
        state: data.state,
        country: data.country,
        hourlyRate: data.hourly_rate,
        equipment: data.equipment || [],
        capacity: data.capacity,
        imageUrl: data.image_url,
        rating: data.rating || 0,
        reviewsCount: data.reviews_count || 0,
        isActive: data.is_active,
        createdAt: data.created_at,
        owner: {
          id: ownerUser?.id || '',
          username: ownerUser?.username || '',
          fullName: ownerUser?.full_name,
          avatar: ownerUser?.avatar,
        },
      };
    },
    enabled: !!id,
  });

  // Fetch existing bookings for this studio
  const { data: existingBookings = [] } = useStudioBookings(id);

  const handleBooking = async () => {
    if (!user || !studio) {
      Alert.alert('Error', 'Please sign in to book a studio');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const totalAmount = hours * studio.hourlyRate;

    try {
      await createBooking.mutateAsync({
        studioId: studio.id,
        userId: user.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        totalAmount,
        notes,
      });

      Alert.alert(
        'Booking Created',
        `Your booking request has been submitted!\n\nTotal: $${totalAmount.toFixed(2)} for ${hours.toFixed(1)} hours`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.push('/bookings'),
          },
          { text: 'OK', onPress: () => setBookingModalVisible(false) },
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!studio) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Studio not found</Text>
        </View>
      </View>
    );
  }

  const calculateBookingPrice = () => {
    const hours = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    return hours * studio.hourlyRate;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Studio Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Studio Cover */}
        <View style={[styles.cover, { backgroundColor: colors.card }]}>
          <Ionicons name="business" size={64} color={colors.textTertiary} />
        </View>

        {/* Studio Info */}
        <View style={styles.info}>
          <Text style={[styles.studioName, { color: colors.text }]}>{studio.name}</Text>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={16} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {[studio.city, studio.state].filter(Boolean).join(', ') || studio.location}
              </Text>
            </View>
            {studio.rating > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>
                  {studio.rating.toFixed(1)} ({studio.reviewsCount} reviews)
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Hourly Rate</Text>
            <Text style={[styles.priceAmount, { color: colors.accent }]}>${studio.hourlyRate}/hr</Text>
          </View>
        </View>

        {/* Description */}
        {studio.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{studio.description}</Text>
          </View>
        )}

        {/* Equipment */}
        {studio.equipment && studio.equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipment</Text>
            <View style={styles.equipmentList}>
              {studio.equipment.map((item, index) => (
                <View key={index} style={[styles.equipmentChip, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  <Text style={[styles.equipmentText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Studio Owner</Text>
          <View style={[styles.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.ownerAvatar, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.ownerAvatarText, { color: colors.text }]}>
                {studio.owner.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={[styles.ownerName, { color: colors.text }]}>
                {studio.owner.fullName || studio.owner.username}
              </Text>
              <Text style={[styles.ownerUsername, { color: colors.textSecondary }]}>@{studio.owner.username}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Now Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.accent }]}
          onPress={() => setBookingModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.bookButtonText}>Book Studio</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal visible={bookingModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Book {studio.name}</Text>
            <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Start Time */}
            <View style={styles.timeSection}>
              <Text style={[styles.timeLabel, { color: colors.text }]}>Start Time</Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.accent} />
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {dayjs(startDate).format('MMM D, YYYY • h:mm A')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* End Time */}
            <View style={styles.timeSection}>
              <Text style={[styles.timeLabel, { color: colors.text }]}>End Time</Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.accent} />
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {dayjs(endDate).format('MMM D, YYYY • h:mm A')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Price Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)).toFixed(1)} hours
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Rate</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>${studio.hourlyRate}/hr</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: FontWeights.bold }]}>
                  Total
                </Text>
                <Text style={[styles.summaryValue, { color: colors.accent, fontWeight: FontWeights.bold }]}>
                  ${calculateBookingPrice().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.accent }]}
              onPress={handleBooking}
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Date/Time Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>
      </Modal>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.base,
  },
  cover: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  studioName: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSizes.sm,
  },
  priceCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  priceLabel: {
    fontSize: FontSizes.sm,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.base,
    lineHeight: 24,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  equipmentText: {
    fontSize: FontSizes.sm,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  ownerUsername: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  timeSection: {
    marginBottom: Spacing.lg,
  },
  timeLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.base,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryTotal: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: FontSizes.base,
  },
  summaryValue: {
    fontSize: FontSizes.base,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
