import {
  BorderRadius,
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Notification } from "@/types/database";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

dayjs.extend(relativeTime);

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterType = "all" | "unread" | "bookings" | "messages";

export default function NotificationsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await deleteNotification(id);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // Navigation logic...
    if (notification.referenceType === "booking" && notification.referenceId) {
      router.push("/(tabs)/bookings");
    } else if (
      notification.referenceType === "message" &&
      notification.referenceId
    ) {
      router.push("/(tabs)/community");
    } else if (
      notification.referenceType === "collaboration" &&
      notification.referenceId
    ) {
      router.push("/(tabs)/community");
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    if (filter === "bookings") return notification.type.includes("BOOKING");
    if (filter === "messages") return notification.type.includes("JOB");
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markReadPill}
              >
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.markAllText, { color: colors.primary }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
        </View>

        {/* Modern Pill Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(["all", "unread", "bookings", "messages"] as FilterType[]).map(
              (filterType) => {
                const isActive = filter === filterType;
                return (
                  <TouchableOpacity
                    key={filterType}
                    style={[
                      styles.filterTab,
                      isActive
                        ? {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }
                        : {
                            backgroundColor: "transparent",
                            borderColor: colors.border,
                          },
                    ]}
                    onPress={() => setFilter(filterType)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isActive ? { color: "#FFF" } : { color: colors.text },
                      ]}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Text>
                    {filterType === "unread" && unreadCount > 0 && (
                      <View
                        style={[
                          styles.badge,
                          isActive
                            ? { backgroundColor: "rgba(255,255,255,0.2)" }
                            : { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isActive ? { color: "#FFF" } : { color: "#FFF" },
                          ]}
                        >
                          {unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <View
              style={[
                styles.emptyIconBg,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: colors.text, opacity: 0.6 },
              ]}
            >
              We will let you know when something important arrives.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                colors={colors}
                onPress={() => handleNotificationPress(notification)}
                onDelete={() => handleDelete(notification.id)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

// ------------------------------------------------------------------
// Sub-Components
// ------------------------------------------------------------------

interface NotificationCardProps {
  notification: Notification;
  colors: any;
  onPress: () => void;
  onDelete: () => void;
}

function NotificationCard({
  notification,
  colors,
  onPress,
  onDelete,
}: NotificationCardProps) {
  // Helper to determine styles based on type
  const getStyleMeta = (type: string) => {
    switch (type) {
      case "BOOKING_CONFIRMED":
      case "JOB_ACCEPTED":
        return { icon: "checkmark-circle", color: "#10B981", bg: "#D1FAE5" }; // Green
      case "BOOKING_CANCELLED":
      case "JOB_REJECTED":
        return { icon: "close-circle", color: "#EF4444", bg: "#FEE2E2" }; // Red
      case "JOB_REQUEST":
      case "JOB_UPDATED":
        return { icon: "briefcase", color: "#3B82F6", bg: "#DBEAFE" }; // Blue
      case "NEW_REVIEW":
        return { icon: "star", color: "#F59E0B", bg: "#FEF3C7" }; // Amber
      case "TRANSACTION_COMPLETED":
        return { icon: "wallet", color: "#8B5CF6", bg: "#EDE9FE" }; // Purple
      default:
        return {
          icon: "notifications",
          color: colors.primary,
          bg: colors.primary + "20",
        };
    }
  };

  const meta = getStyleMeta(notification.type);
  const isUnread = !notification.isRead;

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isUnread ? colors.primary + "08" : colors.card, // Very subtle tint for unread
            borderColor: isUnread ? colors.primary + "30" : "transparent",
            borderWidth: isUnread ? 1 : 0,
            shadowColor: colors.shadow || "#000",
          },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          {/* Icon Column */}
          <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={22} color={meta.color} />
          </View>

          {/* Text Column */}
          <View style={styles.textContent}>
            <View style={styles.textHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {notification.title}
              </Text>
              <Text
                style={[styles.timeText, { color: colors.text, opacity: 0.5 }]}
              >
                {dayjs(notification.createdAt).fromNow(true)}
              </Text>
            </View>

            <Text
              style={[styles.cardBody, { color: colors.text, opacity: 0.7 }]}
              numberOfLines={2}
            >
              {notification.message}
            </Text>
          </View>

          {/* Action Column */}
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close"
              size={18}
              color={colors.text}
              style={{ opacity: 0.3 }}
            />
          </TouchableOpacity>
        </View>

        {isUnread && (
          <View
            style={[
              styles.unreadIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 40 : Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  markReadPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  markAllText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  filterContainer: {
    paddingBottom: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.base,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    gap: Spacing.md,
  },
  // Card Styles
  cardWrapper: {
    marginBottom: 4,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    // Premium Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16, // Squircle
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  textHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  cardBody: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontWeight: "400",
  },
  deleteAction: {
    paddingLeft: Spacing.sm,
    paddingTop: 2,
  },
  unreadIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
});
