import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Notification } from '@/types/database';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  expoPushToken: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Register for push notifications
  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        setExpoPushToken(token || null);
        if (token) {
          // Save token to user profile in Supabase
          savePushTokenToProfile(token);
        }
      });

      // Listen for incoming notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Refresh notifications when a new one arrives
        refreshNotifications();
      });

      // Listen for notification interactions (user taps notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const notificationData = response.notification.request.content.data;
        handleNotificationTap(notificationData);
      });

      return () => {
        // Check if removeNotificationSubscription exists (not available in Expo Go SDK 53+)
        if (notificationListener.current && Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        } else if (notificationListener.current?.remove) {
          notificationListener.current.remove();
        }
        if (responseListener.current && Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(responseListener.current);
        } else if (responseListener.current?.remove) {
          responseListener.current.remove();
        }
      };
    }
  }, [user]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
      setupRealtimeSubscription();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
    // Update app badge (if available)
    if (Notifications.setBadgeCountAsync) {
      Notifications.setBadgeCountAsync(count).catch(error => {
        console.log('Badge count not supported:', error.message);
      });
    }
  }, [notifications]);

  const refreshNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform snake_case to camelCase
      const transformedData = data?.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.is_read,
        referenceId: notification.reference_id,
        referenceType: notification.reference_type,
        createdAt: notification.created_at,
      })) || [];

      setNotifications(transformedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Subscribe to real-time updates for user's notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const rawNotification = payload.new as any;
          // Transform snake_case to camelCase
          const newNotification: Notification = {
            id: rawNotification.id,
            userId: rawNotification.user_id,
            type: rawNotification.type,
            title: rawNotification.title,
            message: rawNotification.message,
            isRead: rawNotification.is_read,
            referenceId: rawNotification.reference_id,
            referenceType: rawNotification.reference_type,
            createdAt: rawNotification.created_at,
          };
          setNotifications(prev => [newNotification, ...prev]);

          // Show local notification
          showLocalNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const rawNotification = payload.new as any;
          // Transform snake_case to camelCase
          const updatedNotification: Notification = {
            id: rawNotification.id,
            userId: rawNotification.user_id,
            type: rawNotification.type,
            title: rawNotification.title,
            message: rawNotification.message,
            isRead: rawNotification.is_read,
            referenceId: rawNotification.reference_id,
            referenceType: rawNotification.reference_type,
            createdAt: rawNotification.created_at,
          };
          setNotifications(prev =>
            prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const showLocalNotification = async (notification: Notification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification.id,
            referenceId: notification.referenceId,
            referenceType: notification.referenceType,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.log('Could not schedule local notification:', error);
      // This is expected in Expo Go
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const savePushTokenToProfile = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ pushToken: token })
        .eq('id', user.id);

      if (error) console.error('Error saving push token:', error);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const handleNotificationTap = (data: any) => {
    // Handle navigation based on notification type
    // This will be implemented with deep linking
    console.log('Notification tapped:', data);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        expoPushToken,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6B7280',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  try {
    // Note: Push tokens don't work in Expo Go for SDK 53+
    // This will only work in development builds or production
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (error) {
    console.log('Failed to get push token for push notification!');
    console.error('Error getting push token:', error);
    // This is expected in Expo Go - push notifications require a development build
    return undefined;
  }

  return token;
}
