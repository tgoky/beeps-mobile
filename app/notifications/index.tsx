import { useNotifications } from "@/contexts/NotificationContext";
import { Notification } from "@/types/database";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
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
dayjs.extend(utc);

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🎨 THEME COLORS
const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#151515",
  pureWhite: "#FFFFFF",
  offWhite: "#F5F5F5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",
  accentDim: "rgba(245, 158, 11, 0.15)",
  red: "#D50000",
  green: "#00C853",
  blue: "#2962FF",
};

type FilterType = "all" | "unread" | "bookings" | "messages";

export default function NotificationsScreen() {
  const router = useRouter();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

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

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* --- HEADER WITH PATTERNS --- */}
        <View style={styles.headerContainer}>
          {/* Background Patterns */}
          <View style={styles.patternContainer}>
            <MaterialCommunityIcons
              name="graphic-eq"
              size={180}
              color="rgba(255,255,255,0.08)"
              style={styles.patternLeft}
            />
            <MaterialCommunityIcons
              name="tune"
              size={140}
              color="rgba(245, 158, 11, 0.08)"
              style={styles.patternRight}
            />
          </View>

          {/* Header Content */}
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.iconButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={COLORS.pureWhite}
                />
              </TouchableOpacity>

              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllAsRead}
                  style={styles.markReadPill}
                >
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.markAllText}>MARK ALL READ</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
          </View>
        </View>

        {/* Filter Tabs */}
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
                      isActive && styles.filterTabActive,
                    ]}
                    onPress={() => setFilter(filterType)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isActive && styles.filterTextActive,
                      ]}
                    >
                      {filterType.toUpperCase()}
                    </Text>
                    {filterType === "unread" && unreadCount > 0 && (
                      <View
                        style={[
                          styles.badge,
                          isActive
                            ? { backgroundColor: COLORS.background }
                            : { backgroundColor: COLORS.accent },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isActive
                              ? { color: COLORS.pureWhite }
                              : { color: "#000" },
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
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconBg}>
              <MaterialCommunityIcons
                name="bell-sleep-outline"
                size={48}
                color={COLORS.textGrey}
              />
            </View>
            <Text style={styles.emptyTitle}>NO NOTIFICATIONS</Text>
            <Text style={styles.emptySubtitle}>
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
                tintColor={COLORS.accent}
                progressBackgroundColor={COLORS.cardBlack}
              />
            }
          >
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
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
  onPress: () => void;
  onDelete: () => void;
}

function NotificationCard({
  notification,
  onPress,
  onDelete,
}: NotificationCardProps) {
  // Helper to determine styles based on type
  const getStyleMeta = (type: string) => {
    switch (type) {
      case "BOOKING_CONFIRMED":
      case "JOB_ACCEPTED":
        return {
          icon: "checkmark-circle",
          color: COLORS.green,
          bg: "rgba(0, 200, 83, 0.1)",
        };
      case "BOOKING_CANCELLED":
      case "JOB_REJECTED":
        return {
          icon: "close-circle",
          color: COLORS.red,
          bg: "rgba(213, 0, 0, 0.1)",
        };
      case "JOB_REQUEST":
      case "JOB_UPDATED":
        return {
          icon: "briefcase",
          color: COLORS.blue,
          bg: "rgba(41, 98, 255, 0.1)",
        };
      case "NEW_REVIEW":
        return {
          icon: "star",
          color: COLORS.accent,
          bg: "rgba(245, 158, 11, 0.1)",
        };
      case "TRANSACTION_COMPLETED":
        return {
          icon: "wallet",
          color: "#8B5CF6",
          bg: "rgba(139, 92, 246, 0.1)",
        };
      default:
        return {
          icon: "notifications",
          color: COLORS.pureWhite,
          bg: COLORS.cardDark,
        };
    }
  };

  const meta = getStyleMeta(notification.type);
  const isUnread = !notification.isRead;

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          {/* Icon Column */}
          <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
          </View>

          {/* Text Column */}
          <View style={styles.textContent}>
            <View style={styles.textHeader}>
              <Text
                style={[styles.cardTitle, isUnread && { color: COLORS.accent }]}
              >
                {notification.title}
              </Text>
              <Text style={styles.timeText}>
                {dayjs.utc(notification.createdAt).local().fromNow()}
              </Text>
            </View>

            <Text style={styles.cardBody} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>

          {/* Action Column */}
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color={COLORS.textGrey} />
          </TouchableOpacity>
        </View>

        {/* Vertical Unread Stripe */}
        {isUnread && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // HEADER CONTAINER with Patterns
  headerContainer: {
    position: "relative",
    overflow: "hidden",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1, // Visible patterns
  },
  patternLeft: {
    position: "absolute",
    top: -40,
    left: -20,
    transform: [{ rotate: "45deg" }],
  },
  patternRight: {
    position: "absolute",
    top: 40,
    right: -40,
    transform: [{ rotate: "-15deg" }],
  },

  // Header Content
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: -0.5,
  },
  markReadPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  markAllText: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: COLORS.accent,
    textTransform: "uppercase",
  },

  // FILTERS
  filterContainer: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBlack,
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.pureWhite,
    borderColor: COLORS.pureWhite,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textGrey,
  },
  filterTextActive: {
    color: COLORS.background,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Manrope_800ExtraBold",
  },

  // CONTENT
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
    backgroundColor: COLORS.cardDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    color: COLORS.textGrey,
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },

  // CARD STYLES
  cardWrapper: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: COLORS.cardBlack,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
    overflow: "hidden",
  },
  cardUnread: {
    borderColor: COLORS.accentDim,
    backgroundColor: "#111", // Slightly lighter to pop
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  textHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.pureWhite,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
    lineHeight: 20,
  },
  deleteAction: {
    paddingLeft: 10,
    paddingTop: 2,
  },
  unreadIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.accent,
  },
});
