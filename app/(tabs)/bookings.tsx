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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useBookings, useCancelBooking, useStudioOwnerBookings, useConfirmBooking, useRejectBooking } from '@/hooks/useBookings';
import { useServiceRequests, useUpdateServiceRequestStatus } from '@/hooks/useProducers';
import { BookingStatus } from '@/types/database';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type MainViewMode = 'service_requests' | 'bookings';
type ServiceRequestViewMode = 'sent' | 'received';
type BookingViewMode = 'my_bookings' | 'studio_bookings';
type FilterType = 'all' | 'pending' | 'upcoming' | 'past';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  CONFIRMED: '#10B981',
  CANCELLED: '#EF4444',
  COMPLETED: '#6B7280',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  IN_PROGRESS: '#3B82F6',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In Progress',
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [mainView, setMainView] = useState<MainViewMode>('service_requests');
  const [serviceRequestView, setServiceRequestView] = useState<ServiceRequestViewMode>('sent');
  const [bookingView, setBookingView] = useState<BookingViewMode>('my_bookings');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const { data: myBookings = [], isLoading: myBookingsLoading, refetch: refetchMyBookings } = useBookings(user?.id);
  const { data: studioBookings = [], isLoading: studioBookingsLoading, refetch: refetchStudioBookings } = useStudioOwnerBookings(user?.id);
  const { data: serviceRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useServiceRequests(user?.id);

  const cancelBooking = useCancelBooking();
  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();
  const updateRequestStatus = useUpdateServiceRequestStatus();

  const handleRefresh = async () => {
    setRefreshing(true);
    if (mainView === 'service_requests') {
      await refetchRequests();
    } else {
      if (bookingView === 'my_bookings') {
        await refetchMyBookings();
      } else {
        await refetchStudioBookings();
      }
    }
    setRefreshing(false);
  };

  // Service Request handlers
  const handleAcceptRequest = (request: any) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const handleRejectRequest = (request: any) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this service request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateRequestStatus.mutateAsync({
                requestId: request.id,
                status: 'REJECTED',
              });
              Alert.alert('Success', 'Request rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    try {
      await updateRequestStatus.mutateAsync({
        requestId: selectedRequest.id,
        status: 'ACCEPTED',
        producerResponse: responseMessage.trim() || undefined,
      });
      Alert.alert('Success', 'Request accepted');
      setShowResponseModal(false);
      setResponseMessage('');
      setSelectedRequest(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleStartWork = async (requestId: string) => {
    try {
      await updateRequestStatus.mutateAsync({
        requestId,
        status: 'IN_PROGRESS',
      });
      Alert.alert('Success', 'Marked as in progress');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCompleteWork = async (requestId: string) => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this work as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await updateRequestStatus.mutateAsync({
                requestId,
                status: 'COMPLETED',
              });
              Alert.alert('Success', 'Request marked as completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  // Booking handlers
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

  const handleConfirmBooking = (bookingId: string, clientName: string) => {
    Alert.alert(
      'Confirm Booking',
      `Confirm booking from ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await confirmBooking.mutateAsync(bookingId);
              Alert.alert('Success', 'Booking confirmed');
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm booking');
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = (bookingId: string, clientName: string) => {
    Alert.alert(
      'Reject Booking',
      `Reject booking from ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectBooking.mutateAsync(bookingId);
              Alert.alert('Success', 'Booking rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject booking');
            }
          },
        },
      ]
    );
  };

  const filteredServiceRequests = serviceRequests.filter((request) => {
    const isReceived = request.producerId === user?.id;
    if (serviceRequestView === 'sent' && isReceived) return false;
    if (serviceRequestView === 'received' && !isReceived) return false;

    if (filter === 'all') return true;
    if (filter === 'pending') return request.status === 'PENDING';
    return true;
  });

  const currentBookings = bookingView === 'my_bookings' ? myBookings : studioBookings;
  const filteredBookings = currentBookings.filter((booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const isUpcoming = startTime > now && booking.status !== 'CANCELLED';
    const isPast = startTime <= now || booking.status === 'COMPLETED';

    if (filter === 'all') return true;
    if (filter === 'pending') return booking.status === 'PENDING';
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'past') return isPast;
    return true;
  });

  const isLoading = mainView === 'service_requests'
    ? requestsLoading
    : (bookingView === 'my_bookings' ? myBookingsLoading : studioBookingsLoading);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Main View Toggle */}
      <View style={[styles.mainViewContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[
            styles.mainViewTab,
            mainView === 'service_requests' && { backgroundColor: colors.accent },
          ]}
          onPress={() => setMainView('service_requests')}
        >
          <Ionicons
            name="briefcase"
            size={18}
            color={mainView === 'service_requests' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.mainViewText,
              { color: mainView === 'service_requests' ? '#fff' : colors.textSecondary },
            ]}
          >
            Service Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainViewTab,
            mainView === 'bookings' && { backgroundColor: colors.accent },
          ]}
          onPress={() => setMainView('bookings')}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={mainView === 'bookings' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.mainViewText,
              { color: mainView === 'bookings' ? '#fff' : colors.textSecondary },
            ]}
          >
            Bookings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub View Toggle */}
      {mainView === 'service_requests' ? (
        <View style={[styles.subViewContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.subViewTab,
              serviceRequestView === 'sent' && styles.activeSubTab,
            ]}
            onPress={() => setServiceRequestView('sent')}
          >
            <Text style={[styles.subViewText, { color: serviceRequestView === 'sent' ? colors.accent : colors.textSecondary }]}>
              Sent
            </Text>
            {serviceRequestView === 'sent' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.subViewTab,
              serviceRequestView === 'received' && styles.activeSubTab,
            ]}
            onPress={() => setServiceRequestView('received')}
          >
            <Text style={[styles.subViewText, { color: serviceRequestView === 'received' ? colors.accent : colors.textSecondary }]}>
              Received
            </Text>
            {serviceRequestView === 'received' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.subViewContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.subViewTab,
              bookingView === 'my_bookings' && styles.activeSubTab,
            ]}
            onPress={() => setBookingView('my_bookings')}
          >
            <Text style={[styles.subViewText, { color: bookingView === 'my_bookings' ? colors.accent : colors.textSecondary }]}>
              My Bookings
            </Text>
            {bookingView === 'my_bookings' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.subViewTab,
              bookingView === 'studio_bookings' && styles.activeSubTab,
            ]}
            onPress={() => setBookingView('studio_bookings')}
          >
            <Text style={[styles.subViewText, { color: bookingView === 'studio_bookings' ? colors.accent : colors.textSecondary }]}>
              Studio Bookings
            </Text>
            {bookingView === 'studio_bookings' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {mainView === 'service_requests' ? (
            <>
              {(['all', 'pending'] as FilterType[]).map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  style={[
                    styles.filterTab,
                    filter === filterType && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => setFilter(filterType)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: filter === filterType ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {(['all', 'pending', 'upcoming', 'past'] as FilterType[]).map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  style={[
                    styles.filterTab,
                    filter === filterType && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => setFilter(filterType)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: filter === filterType ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : mainView === 'service_requests' ? (
        // Service Requests List
        filteredServiceRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {serviceRequestView === 'sent'
                ? 'You haven\'t sent any service requests yet'
                : 'You haven\'t received any service requests yet'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          >
            {filteredServiceRequests.map((request) => {
              const isReceived = request.producerId === user?.id;
              const otherUser = isReceived ? request.client : request.producer;
              const canManage = isReceived && request.status === 'PENDING';
              const canStart = isReceived && request.status === 'ACCEPTED';
              const canComplete = isReceived && request.status === 'IN_PROGRESS';

              return (
                <View
                  key={request.id}
                  style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {otherUser?.fullName || otherUser?.username || 'Unknown User'}
                      </Text>
                      <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
                        @{otherUser?.username}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[request.status] + '20' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[request.status] }]}>
                        {STATUS_LABELS[request.status]}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.projectTitle, { color: colors.text }]}>{request.projectTitle}</Text>
                  <Text style={[styles.projectDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                    {request.projectDescription}
                  </Text>

                  <View style={styles.metaSection}>
                    {request.budget && (
                      <View style={styles.metaRow}>
                        <Ionicons name="cash-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          ${request.budget}
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {dayjs(request.createdAt).fromNow()}
                      </Text>
                    </View>
                  </View>

                  {canManage && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.acceptButton, { backgroundColor: colors.accent }]}
                        onPress={() => handleAcceptRequest(request)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rejectButton, { borderColor: colors.error }]}
                        onPress={() => handleRejectRequest(request)}
                      >
                        <Ionicons name="close-circle" size={16} color={colors.error} />
                        <Text style={[styles.rejectButtonText, { color: colors.error }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {canStart && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleStartWork(request.id)}
                    >
                      <Ionicons name="play-circle" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Start Work</Text>
                    </TouchableOpacity>
                  )}
                  {canComplete && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.accent }]}
                      onPress={() => handleCompleteWork(request.id)}
                    >
                      <Ionicons name="checkmark-done-circle" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Mark Completed</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <View style={{ height: 80 }} />
          </ScrollView>
        )
      ) : (
        // Bookings List
        filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {bookingView === 'my_bookings'
                ? 'You haven\'t made any bookings yet'
                : 'No bookings received for your studios'}
            </Text>
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
              const isStudioBooking = bookingView === 'studio_bookings';
              const canCancel = !isStudioBooking && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');
              const canManage = isStudioBooking && booking.status === 'PENDING';

              return (
                <View
                  key={booking.id}
                  style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.studioInfo}>
                      <Text style={[styles.studioName, { color: colors.text }]}>{booking.studio.name}</Text>
                      {isStudioBooking && (booking as any).client && (
                        <Text style={[styles.clientName, { color: colors.textSecondary }]}>
                          Client: {(booking as any).client.fullName || (booking as any).client.username}
                        </Text>
                      )}
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={12} color={colors.textTertiary} />
                        <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                          {booking.studio.location}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>
                        {STATUS_LABELS[booking.status]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeSection}>
                    <View style={styles.timeRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.timeText, { color: colors.text }]}>
                        {startTime.format('MMM D, YYYY')}
                      </Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.timeText, { color: colors.text }]}>
                        {startTime.format('h:mm A')} - {endTime.format('h:mm A')} ({duration.toFixed(1)}h)
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total</Text>
                    <Text style={[styles.priceAmount, { color: colors.accent }]}>
                      ${booking.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  {canCancel && isUpcoming && (
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: colors.error }]}
                      onPress={() => handleCancelBooking(booking.id, booking.studio.name)}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                      <Text style={[styles.cancelButtonText, { color: colors.error }]}>Cancel Booking</Text>
                    </TouchableOpacity>
                  )}
                  {canManage && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.acceptButton, { backgroundColor: colors.accent }]}
                        onPress={() => handleConfirmBooking(booking.id, (booking as any).client?.fullName || (booking as any).client?.username || 'Client')}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.acceptButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rejectButton, { borderColor: colors.error }]}
                        onPress={() => handleRejectBooking(booking.id, (booking as any).client?.fullName || (booking as any).client?.username || 'Client')}
                      >
                        <Ionicons name="close-circle" size={16} color={colors.error} />
                        <Text style={[styles.rejectButtonText, { color: colors.error }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 80 }} />
          </ScrollView>
        )
      )}

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowResponseModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Accept Request</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              You can optionally add a message to the client about accepting their request.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Response Message (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., I'd be happy to work on this project!"
                placeholderTextColor={colors.textTertiary}
                value={responseMessage}
                onChangeText={setResponseMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.accent }]}
              onPress={handleSubmitResponse}
              disabled={updateRequestStatus.isPending}
            >
              {updateRequestStatus.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Accept Request</Text>
                </>
              )}
            </TouchableOpacity>
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
  mainViewContainer: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.sm,
    paddingTop: 60,
  },
  mainViewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  mainViewText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  subViewContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  subViewTab: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
    position: 'relative',
  },
  activeSubTab: {},
  subViewText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  filterText: {
    fontSize: FontSizes.xs,
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
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  requestCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  bookingCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  userHandle: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  projectTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  projectDescription: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  metaSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.xs,
  },
  studioInfo: {
    flex: 1,
  },
  studioName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  clientName: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FontSizes.xs,
  },
  timeSection: {
    marginBottom: Spacing.sm,
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeText: {
    fontSize: FontSizes.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    fontSize: FontSizes.sm,
  },
  priceAmount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  rejectButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  cancelButtonText: {
    fontSize: FontSizes.xs,
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
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalDescription: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    height: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
});
