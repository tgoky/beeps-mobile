import React, { useState, useMemo } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreateBooking, useStudioBookings } from '@/hooks/useBookings';
import dayjs from 'dayjs';

type TabType = 'details' | 'equipment' | 'reviews';

export default function StudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionLength, setSessionLength] = useState(2);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('details');

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

  const amenities = [
    { icon: 'wifi', label: 'High-speed WiFi' },
    { icon: 'car', label: 'Free Parking' },
    { icon: 'cafe', label: 'Coffee Bar' },
    { icon: 'people', label: 'Green Room' },
    { icon: 'volume-high', label: 'Sound Proof' },
  ];

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  // Check if a time slot is available
  const isTimeSlotAvailable = (time: string) => {
    if (!existingBookings || existingBookings.length === 0) return true;

    // Parse the time slot
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return true;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const slotStart = selectedDate.hour(hours).minute(minutes).second(0);
    const slotEnd = slotStart.add(sessionLength, 'hour');

    // Check against existing bookings
    return !existingBookings.some((booking) => {
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);
      const bookingDate = bookingStart.format('YYYY-MM-DD');
      const selectedDateStr = selectedDate.format('YYYY-MM-DD');

      // Only check bookings on the selected date
      if (bookingDate !== selectedDateStr) return false;

      // Only check confirmed or pending bookings
      if (booking.status === 'CANCELLED') return false;

      // Check if time slots overlap
      return (
        (slotStart.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart)) ||
        (slotStart.isSame(bookingStart)) ||
        (slotEnd.isSame(bookingEnd))
      );
    });
  };

  const handleBooking = async () => {
    if (!user || !studio) {
      Alert.alert('Error', 'Please sign in to book a studio');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot for your booking');
      return;
    }

    // Check if the selected time slot is available
    if (!isTimeSlotAvailable(selectedTime)) {
      Alert.alert('Time Unavailable', 'This time slot is already booked. Please select a different time.');
      return;
    }

    // Parse selected time to create start and end dates
    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) {
      Alert.alert('Error', 'Invalid time format');
      return;
    }

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const startDate = selectedDate.hour(hours).minute(minutes).second(0).toDate();
    const endDate = selectedDate.hour(hours).minute(minutes).add(sessionLength, 'hour').second(0).toDate();
    const totalAmount = studio.hourlyRate * sessionLength;

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
        'Booking Submitted',
        `Your booking request has been submitted!\n\nTotal: $${totalAmount.toFixed(2)} for ${sessionLength} hours\n\nYou'll be notified when the studio owner responds.`,
        [
          {
            text: 'View Bookings',
            onPress: () => {
              setBookingModalVisible(false);
              router.push('/bookings');
            },
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
    return studio.hourlyRate * sessionLength;
  };

  const calculateServiceFee = () => {
    return calculateBookingPrice() * 0.1;
  };

  const calculateTotal = () => {
    return calculateBookingPrice() + calculateServiceFee();
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
          <MaterialCommunityIcons name="microphone" size={64} color={colors.textTertiary} />
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

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tabsHeader, { borderBottomColor: colors.border }]}>
            {(['details', 'equipment', 'reviews'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab ? colors.accent : colors.textSecondary },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'details' && (
              <View style={styles.tabPanel}>
                {/* About */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>About this studio</Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {studio.description || 'Professional recording studio with state-of-the-art equipment and comfortable environment for artists and producers.'}
                  </Text>
                </View>

                {/* Amenities */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Amenities</Text>
                  <View style={styles.amenitiesList}>
                    {amenities.map((amenity, index) => (
                      <View
                        key={index}
                        style={[styles.amenityChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      >
                        <Ionicons name={amenity.icon as any} size={16} color={colors.accent} />
                        <Text style={[styles.amenityText, { color: colors.text }]}>{amenity.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'equipment' && (
              <View style={styles.tabPanel}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Equipment</Text>
                {studio.equipment && studio.equipment.length > 0 ? (
                  <View style={styles.equipmentList}>
                    {studio.equipment.map((item, index) => (
                      <View
                        key={index}
                        style={[styles.equipmentChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      >
                        <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                        <Text style={[styles.equipmentText, { color: colors.text }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No equipment listed</Text>
                )}
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.tabPanel}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Reviews</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl }]}>
                  No reviews yet
                </Text>
              </View>
            )}
          </View>
        </View>

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

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Date Selection */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.text }]}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScrollContent}
              >
                {Array.from({ length: 14 }, (_, i) => {
                  const date = dayjs().add(i, 'day');
                  const isSelected = selectedDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedDate(date)}
                      style={[
                        styles.dateChip,
                        { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      <Text style={[styles.dateDay, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                        {date.format('ddd')}
                      </Text>
                      <Text style={[styles.dateNumber, { color: isSelected ? '#fff' : colors.text }]}>
                        {date.format('D')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={[styles.selectedDateText, { color: colors.textSecondary }]}>
                Selected: {selectedDate.format('MMMM D, YYYY')}
              </Text>
            </View>

            {/* Time Slots */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.text }]}>Available Times</Text>
              <View style={styles.timeSlots}>
                {timeSlots.map((time) => {
                  const isAvailable = isTimeSlotAvailable(time);
                  const isSelected = selectedTime === time;

                  return (
                    <TouchableOpacity
                      key={time}
                      onPress={() => isAvailable && setSelectedTime(time)}
                      disabled={!isAvailable}
                      style={[
                        styles.timeSlot,
                        { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                        !isAvailable && { opacity: 0.4 },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      <Text style={[styles.timeSlotText, { color: isSelected ? '#fff' : colors.text }]}>
                        {time}
                      </Text>
                      {!isAvailable && (
                        <Ionicons name="close-circle" size={12} color={colors.error} style={styles.bookedIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {existingBookings && existingBookings.length > 0 && (
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  <Ionicons name="close-circle" size={12} color={colors.error} /> = Already booked
                </Text>
              )}
            </View>

            {/* Session Length */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.text }]}>Session Length</Text>
              <View style={styles.sessionLengths}>
                {[2, 4, 8].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    onPress={() => setSessionLength(hours)}
                    style={[
                      styles.sessionChip,
                      { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                      sessionLength === hours && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                  >
                    <Text style={[styles.sessionText, { color: sessionLength === hours ? '#fff' : colors.text }]}>
                      {hours} hours
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {sessionLength} hours × ${studio.hourlyRate}/hr
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${calculateBookingPrice().toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${calculateServiceFee().toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: FontWeights.bold }]}>
                  Total
                </Text>
                <Text style={[styles.summaryValue, { color: colors.accent, fontWeight: FontWeights.bold }]}>
                  ${calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: colors.accent },
                (!selectedTime || createBooking.isPending) && { opacity: 0.5 },
              ]}
              onPress={handleBooking}
              disabled={!selectedTime || createBooking.isPending}
            >
              {createBooking.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Request to Book</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              You will only be charged when the studio confirms
            </Text>
          </ScrollView>
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
  tabsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  tabPanel: {
    gap: Spacing.lg,
  },
  detailSection: {
    gap: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.base,
    lineHeight: 22,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  amenityText: {
    fontSize: FontSizes.sm,
  },
  equipmentList: {
    gap: Spacing.sm,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
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
  bookingSection: {
    marginBottom: Spacing.xl,
  },
  bookingLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  dateScrollContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  dateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: 2,
  },
  dateNumber: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  selectedDateText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexBasis: '30%',
    alignItems: 'center',
    position: 'relative',
  },
  timeSlotText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  bookedIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  helpText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  sessionLengths: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sessionChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  sessionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
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
    fontSize: FontSizes.sm,
  },
  summaryValue: {
    fontSize: FontSizes.sm,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  noteText: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
