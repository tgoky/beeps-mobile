import { supabase } from './supabase';

export type NotificationType =
  | 'BOOKING'
  | 'MESSAGE'
  | 'COLLABORATION'
  | 'GEAR'
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'SYSTEM';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: 'booking' | 'message' | 'collaboration' | 'gear' | 'user' | 'post';
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    type: 'BOOKING',
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
    type: 'BOOKING',
    title: 'Booking Cancelled',
    message: `Your booking at ${studioName} has been cancelled`,
    referenceId: bookingId,
    referenceType: 'booking',
  });
}

/**
 * Create a new message notification
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  conversationId: string
) {
  return createNotification({
    userId,
    type: 'MESSAGE',
    title: 'New Message',
    message: `${senderName} sent you a message`,
    referenceId: conversationId,
    referenceType: 'message',
  });
}

/**
 * Create a collaboration request notification
 */
export async function notifyCollaborationRequest(
  userId: string,
  requesterName: string,
  collaborationId: string
) {
  return createNotification({
    userId,
    type: 'COLLABORATION',
    title: 'Collaboration Request',
    message: `${requesterName} wants to collaborate with you`,
    referenceId: collaborationId,
    referenceType: 'collaboration',
  });
}

/**
 * Create a gear listing sold notification
 */
export async function notifyGearSold(
  userId: string,
  gearName: string,
  gearId: string
) {
  return createNotification({
    userId,
    type: 'GEAR',
    title: 'Gear Sold',
    message: `Your ${gearName} has been sold!`,
    referenceId: gearId,
    referenceType: 'gear',
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
    type: 'FOLLOW',
    title: 'New Follower',
    message: `${followerName} started following you`,
    referenceId: followerId,
    referenceType: 'user',
  });
}

/**
 * Create a like notification
 */
export async function notifyLike(
  userId: string,
  likerName: string,
  itemType: string,
  itemId: string
) {
  return createNotification({
    userId,
    type: 'LIKE',
    title: 'New Like',
    message: `${likerName} liked your ${itemType}`,
    referenceId: itemId,
    referenceType: 'post',
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
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}
