import { supabase } from './supabase';

// Match Prisma NotificationType enum
export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'NEW_REVIEW'
  | 'NEW_FOLLOWER'
  | 'CLUB_INVITATION'
  | 'TRANSACTION_COMPLETED'
  | 'JOB_REQUEST'
  | 'JOB_ACCEPTED'
  | 'JOB_REJECTED'
  | 'JOB_UPDATED';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: 'booking' | 'message' | 'collaboration' | 'gear' | 'user' | 'post' | 'transaction' | 'service_request';
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        reference_id: params.referenceId,
        reference_type: params.referenceType,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Transform snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: data.is_read,
      referenceId: data.reference_id,
      referenceType: data.reference_type,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create a booking confirmation notification
 */
export async function notifyBookingConfirmed(
  userId: string,
  studioName: string,
  bookingId: string,
  startTime: string
) {
  return createNotification({
    userId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    message: `Your booking at ${studioName} has been confirmed for ${new Date(startTime).toLocaleDateString()}`,
    referenceId: bookingId,
    referenceType: 'booking',
  });
}

/**
 * Create a booking cancelled notification
 */
export async function notifyBookingCancelled(
  userId: string,
  studioName: string,
  bookingId: string
) {
  return createNotification({
    userId,
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    message: `Your booking at ${studioName} has been cancelled`,
    referenceId: bookingId,
    referenceType: 'booking',
  });
}

/**
 * Create a new follower notification
 */
export async function notifyNewFollower(
  userId: string,
  followerName: string,
  followerId: string
) {
  return createNotification({
    userId,
    type: 'NEW_FOLLOWER',
    title: 'New Follower',
    message: `${followerName} started following you`,
    referenceId: followerId,
    referenceType: 'user',
  });
}

/**
 * Create a new review notification
 */
export async function notifyNewReview(
  userId: string,
  reviewerName: string,
  rating: number,
  reviewId: string
) {
  return createNotification({
    userId,
    type: 'NEW_REVIEW',
    title: 'New Review',
    message: `${reviewerName} left you a ${rating}-star review`,
    referenceId: reviewId,
    referenceType: 'post',
  });
}

/**
 * Create a club invitation notification
 */
export async function notifyClubInvitation(
  userId: string,
  clubName: string,
  clubId: string
) {
  return createNotification({
    userId,
    type: 'CLUB_INVITATION',
    title: 'Club Invitation',
    message: `You've been invited to join ${clubName}`,
    referenceId: clubId,
    referenceType: 'post',
  });
}

/**
 * Create a transaction completed notification
 */
export async function notifyTransactionCompleted(
  userId: string,
  amount: string,
  itemName: string,
  transactionId: string
) {
  return createNotification({
    userId,
    type: 'TRANSACTION_COMPLETED',
    title: 'Transaction Completed',
    message: `Your purchase of ${itemName} for ${amount} was successful`,
    referenceId: transactionId,
    referenceType: 'transaction',
  });
}

/**
 * Create a service request notification
 */
export async function notifyServiceRequest(
  userId: string,
  clientName: string,
  projectTitle: string,
  requestId: string
) {
  return createNotification({
    userId,
    type: 'JOB_REQUEST',
    title: 'New Service Request',
    message: `${clientName} sent you a request for "${projectTitle}"`,
    referenceId: requestId,
    referenceType: 'service_request',
  });
}

/**
 * Create a service request accepted notification
 */
export async function notifyServiceAccepted(
  userId: string,
  producerName: string,
  projectTitle: string,
  requestId: string
) {
  return createNotification({
    userId,
    type: 'JOB_ACCEPTED',
    title: 'Service Request Accepted',
    message: `${producerName} accepted your request for "${projectTitle}"`,
    referenceId: requestId,
    referenceType: 'service_request',
  });
}

/**
 * Create a service request rejected notification
 */
export async function notifyServiceRejected(
  userId: string,
  producerName: string,
  projectTitle: string,
  requestId: string
) {
  return createNotification({
    userId,
    type: 'JOB_REJECTED',
    title: 'Service Request Declined',
    message: `${producerName} declined your request for "${projectTitle}"`,
    referenceId: requestId,
    referenceType: 'service_request',
  });
}

/**
 * Create a service request updated notification
 */
export async function notifyServiceUpdated(
  userId: string,
  projectTitle: string,
  status: string,
  requestId: string
) {
  return createNotification({
    userId,
    type: 'JOB_UPDATED',
    title: 'Service Request Updated',
    message: `Your request for "${projectTitle}" is now ${status}`,
    referenceId: requestId,
    referenceType: 'service_request',
  });
}

/**
 * Bulk create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    // Transform snake_case to camelCase
    return data?.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      referenceId: notification.reference_id,
      referenceType: notification.reference_type,
      createdAt: notification.created_at,
    }));
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}
