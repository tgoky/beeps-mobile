import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useBookings,
  useCancelBooking,
  useConfirmBooking,
  useRejectBooking,
  useStudioOwnerBookings,
} from "@/hooks/useBookings";
import {
  useServiceRequests,
  useUpdateServiceRequestStatus,
} from "@/hooks/useProducers";
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
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);

const { width } = Dimensions.get("window");

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
};

type MainViewMode = "service_requests" | "bookings";
type ServiceRequestViewMode = "sent" | "received";
type BookingViewMode = "my_bookings" | "studio_bookings";
type FilterType = "all" | "pending" | "upcoming" | "past";

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string; icon: any }
> = {
  PENDING: {
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.15)",
    label: "Pending",
    icon: "time-outline",
  },
  CONFIRMED: {
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.15)",
    label: "Confirmed",
    icon: "checkmark-circle-outline",
  },
  CANCELLED: {
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.15)",
    label: "Cancelled",
    icon: "close-circle-outline",
  },
  COMPLETED: {
    color: "#9CA3AF",
    bg: "rgba(156, 163, 175, 0.15)",
    label: "Completed",
    icon: "flag-outline",
  },
  ACCEPTED: {
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.15)",
    label: "Accepted",
    icon: "checkmark-done-outline",
  },
  REJECTED: {
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.15)",
    label: "Rejected",
    icon: "ban-outline",
  },
  IN_PROGRESS: {
    color: "#60A5FA",
    bg: "rgba(96, 165, 250, 0.15)",
    label: "In Progress",
    icon: "construct-outline",
  },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const params = useLocalSearchParams<{
    initialView?: string;
    initialBookingView?: string;
  }>();

  const [mainView, setMainView] = useState<MainViewMode>(
    (params.initialView as MainViewMode) || "service_requests",
  );
  const [serviceRequestView, setServiceRequestView] =
    useState<ServiceRequestViewMode>("sent");
  const [bookingView, setBookingView] = useState<BookingViewMode>(
    (params.initialBookingView as BookingViewMode) || "my_bookings",
  );
  const [filter, setFilter] = useState<FilterType>("all");

  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");

  // Data Hooks
  const {
    data: myBookings = [],
    isLoading: myBookingsLoading,
    refetch: refetchMyBookings,
  } = useBookings(user?.id);
  const {
    data: studioBookings = [],
    isLoading: studioBookingsLoading,
    refetch: refetchStudioBookings,
  } = useStudioOwnerBookings(user?.id);
  const {
    data: serviceRequests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useServiceRequests(user?.id);

  // Mutations
  const cancelBooking = useCancelBooking();
  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();
  const updateRequestStatus = useUpdateServiceRequestStatus();

  const handleRefresh = async () => {
    setRefreshing(true);
    if (mainView === "service_requests") {
      await refetchRequests();
    } else {
      if (bookingView === "my_bookings") {
        await refetchMyBookings();
      } else {
        await refetchStudioBookings();
      }
    }
    setRefreshing(false);
  };

  // --- HANDLERS (Same logic, cleaner UI calls) ---
  const handleAcceptRequest = (request: any) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const handleRejectRequest = (request: any) => {
    Alert.alert(
      "Reject Request",
      "Are you sure you want to reject this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await updateRequestStatus.mutateAsync({
                requestId: request.id,
                status: "REJECTED",
              });
            } catch (e) {
              Alert.alert("Error", "Failed to reject request");
            }
          },
        },
      ],
    );
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;
    try {
      await updateRequestStatus.mutateAsync({
        requestId: selectedRequest.id,
        status: "ACCEPTED",
        producerResponse: responseMessage.trim() || undefined,
      });
      setShowResponseModal(false);
      setResponseMessage("");
      setSelectedRequest(null);
    } catch (e) {
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const handleStartWork = async (requestId: string) => {
    try {
      await updateRequestStatus.mutateAsync({
        requestId,
        status: "IN_PROGRESS",
      });
    } catch (e) {}
  };

  const handleCompleteWork = async (requestId: string) => {
    try {
      await updateRequestStatus.mutateAsync({ requestId, status: "COMPLETED" });
    } catch (e) {}
  };

  const handleCancelBooking = (id: string, name: string) => {
    Alert.alert("Cancel Booking", `Cancel booking at ${name}?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        onPress: () => cancelBooking.mutate(id),
        style: "destructive",
      },
    ]);
  };

  const handleConfirmBooking = (id: string) => confirmBooking.mutate(id);
  const handleRejectBooking = (id: string) => rejectBooking.mutate(id);

  // --- FILTERING ---
  const filteredServiceRequests = serviceRequests.filter((request) => {
    const isReceived = request.producerId === user?.id;
    if (serviceRequestView === "sent" && isReceived) return false;
    if (serviceRequestView === "received" && !isReceived) return false;
    if (filter === "all") return true;
    if (filter === "pending") return request.status === "PENDING";
    return true;
  });

  const currentBookings =
    bookingView === "my_bookings" ? myBookings : studioBookings;
  const filteredBookings = currentBookings.filter((booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const isUpcoming = startTime > now && booking.status !== "CANCELLED";
    const isPast = startTime <= now || booking.status === "COMPLETED";

    if (filter === "all") return true;
    if (filter === "pending") return booking.status === "PENDING";
    if (filter === "upcoming") return isUpcoming;
    if (filter === "past") return isPast;
    return true;
  });

  const isLoading =
    mainView === "service_requests"
      ? requestsLoading
      : bookingView === "my_bookings"
        ? myBookingsLoading
        : studioBookingsLoading;

  const pendingCount =
    mainView === "service_requests"
      ? filteredServiceRequests.filter((r) => r.status === "PENDING").length
      : filteredBookings.filter((b) => b.status === "PENDING").length;

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: config.bg,
            borderColor: config.color,
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons name={config.icon} size={10} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.screenTitle}>ACTIVITY</Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.screenSubtitle}>
                  {pendingCount} Pending{" "}
                  {pendingCount === 1 ? "Action" : "Actions"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* CUSTOM TOGGLE SWITCH */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleTrack}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mainView === "service_requests" && styles.toggleBtnActive,
              ]}
              onPress={() => setMainView("service_requests")}
            >
              <Text
                style={[
                  styles.toggleText,
                  mainView === "service_requests" && {
                    color: COLORS.background,
                  },
                ]}
              >
                REQUESTS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mainView === "bookings" && styles.toggleBtnActive,
              ]}
              onPress={() => setMainView("bookings")}
            >
              <Text
                style={[
                  styles.toggleText,
                  mainView === "bookings" && { color: COLORS.background },
                ]}
              >
                BOOKINGS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.subHeader}>
        {/* SUB TABS */}
        <View style={styles.subTabsRow}>
          {mainView === "service_requests" ? (
            <>
              {(["sent", "received"] as ServiceRequestViewMode[]).map(
                (view) => (
                  <TouchableOpacity
                    key={view}
                    onPress={() => setServiceRequestView(view)}
                    style={[
                      styles.subTab,
                      serviceRequestView === view && styles.subTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        serviceRequestView === view && {
                          color: COLORS.pureWhite,
                        },
                      ]}
                    >
                      {view.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </>
          ) : (
            <>
              {[
                { key: "my_bookings" as BookingViewMode, label: "MY BOOKINGS" },
                {
                  key: "studio_bookings" as BookingViewMode,
                  label: "STUDIO BOOKINGS",
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setBookingView(item.key)}
                  style={[
                    styles.subTab,
                    bookingView === item.key && styles.subTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      bookingView === item.key && { color: COLORS.pureWhite },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={{ marginTop: 12 }}
        >
          {(
            (mainView === "service_requests"
              ? ["all", "pending"]
              : ["all", "pending", "upcoming", "past"]) as FilterType[]
          ).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                filter === f
                  ? { backgroundColor: COLORS.pureWhite }
                  : {
                      backgroundColor: COLORS.cardBlack,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filter === f ? COLORS.background : COLORS.textGrey },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={COLORS.accent} size="large" />
          </View>
        ) : (
          <ScrollView
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
            {/* --- REQUESTS VIEW --- */}
            {mainView === "service_requests" &&
              (filteredServiceRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="briefcase-off-outline"
                    size={48}
                    color={COLORS.cardDark}
                  />
                  <Text style={styles.emptyTitle}>No requests yet</Text>
                </View>
              ) : (
                filteredServiceRequests.map((req) => {
                  const isReceived = req.producerId === user?.id;
                  const otherUser = isReceived ? req.client : req.producer;
                  const canManage = isReceived && req.status === "PENDING";
                  const canStart = isReceived && req.status === "ACCEPTED";
                  const canComplete =
                    isReceived && req.status === "IN_PROGRESS";

                  return (
                    <View key={req.id} style={styles.card}>
                      {/* Request Header */}
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <LinearGradient
                            colors={
                              isReceived
                                ? ["#3B82F6", "#2563EB"]
                                : [COLORS.accent, COLORS.accent]
                            }
                            style={styles.avatarGradient}
                          >
                            <Text style={styles.avatarInitial}>
                              {otherUser?.fullName?.[0] ||
                                otherUser?.username?.[0] ||
                                "U"}
                            </Text>
                          </LinearGradient>
                          <View>
                            <Text style={styles.cardTitle}>
                              {otherUser?.fullName || otherUser?.username}
                            </Text>
                            <Text style={styles.cardSubtitle}>
                              @{otherUser?.username}
                            </Text>
                          </View>
                        </View>
                        <StatusBadge status={req.status} />
                      </View>

                      {/* Request Body */}
                      <View style={styles.cardBody}>
                        <Text style={styles.projectTitle}>
                          {req.projectTitle}
                        </Text>
                        {req.projectDescription && (
                          <Text style={styles.projectDesc} numberOfLines={2}>
                            {req.projectDescription}
                          </Text>
                        )}
                        <View style={styles.metaRow}>
                          {req.budget && (
                            <View style={styles.metaPill}>
                              <Ionicons
                                name="cash-outline"
                                size={12}
                                color={COLORS.green}
                              />
                              <Text
                                style={[
                                  styles.metaText,
                                  { color: COLORS.green },
                                ]}
                              >
                                ${req.budget}
                              </Text>
                            </View>
                          )}
                          <View style={styles.metaPill}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={COLORS.textGrey}
                            />
                            <Text style={styles.metaText}>
                              {dayjs(req.createdAt).fromNow()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions */}
                      {(canManage || canStart || canComplete) && (
                        <View style={styles.cardFooter}>
                          {canManage && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtn,
                                  { backgroundColor: COLORS.pureWhite },
                                ]}
                                onPress={() => handleAcceptRequest(req)}
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color={COLORS.background}
                                />
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: COLORS.background },
                                  ]}
                                >
                                  ACCEPT
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtnOutlined,
                                  { borderColor: COLORS.red },
                                ]}
                                onPress={() => handleRejectRequest(req)}
                              >
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: COLORS.red },
                                  ]}
                                >
                                  REJECT
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {canStart && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                { backgroundColor: "#3B82F6" },
                              ]}
                              onPress={() => handleStartWork(req.id)}
                            >
                              <Ionicons
                                name="play"
                                size={14}
                                color={COLORS.pureWhite}
                              />
                              <Text style={styles.actionBtnText}>
                                START WORK
                              </Text>
                            </TouchableOpacity>
                          )}
                          {canComplete && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                { backgroundColor: COLORS.green },
                              ]}
                              onPress={() => handleCompleteWork(req.id)}
                            >
                              <Ionicons
                                name="checkmark-done"
                                size={14}
                                color={COLORS.pureWhite}
                              />
                              <Text style={styles.actionBtnText}>COMPLETE</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ))}

            {/* --- BOOKINGS VIEW --- */}
            {mainView === "bookings" &&
              (filteredBookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="calendar-remove-outline"
                    size={48}
                    color={COLORS.cardDark}
                  />
                  <Text style={styles.emptyTitle}>No bookings yet</Text>
                </View>
              ) : (
                filteredBookings.map((booking) => {
                  const start = dayjs(booking.startTime);
                  const end = dayjs(booking.endTime);
                  const duration = end.diff(start, "hour", true);
                  const isStudioBooking = bookingView === "studio_bookings";
                  const canCancel =
                    !isStudioBooking &&
                    ["PENDING", "CONFIRMED"].includes(booking.status);
                  const canManage =
                    isStudioBooking && booking.status === "PENDING";

                  return (
                    <View key={booking.id} style={styles.card}>
                      <View style={styles.bookingLayout}>
                        {/* Date Leaf */}
                        <View style={styles.dateBox}>
                          <Text style={styles.dateMonth}>
                            {start.format("MMM")}
                          </Text>
                          <Text style={styles.dateDay}>
                            {start.format("DD")}
                          </Text>
                          <Text style={styles.dateWeekday}>
                            {start.format("ddd")}
                          </Text>
                        </View>

                        {/* Booking Details */}
                        <View style={styles.bookingInfo}>
                          <View style={styles.bookingInfoHeader}>
                            <Text
                              style={[styles.cardTitle, { flex: 1 }]}
                              numberOfLines={1}
                            >
                              {booking.studio.name}
                            </Text>
                            <StatusBadge status={booking.status} />
                          </View>

                          <View style={styles.bookingTimeMeta}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={COLORS.textGrey}
                            />
                            <Text style={styles.metaText}>
                              {start.format("h:mm A")} - {end.format("h:mm A")}{" "}
                              <Text style={{ color: COLORS.accent }}>
                                ({duration}h)
                              </Text>
                            </Text>
                          </View>

                          {isStudioBooking && (booking as any).client && (
                            <Text style={[styles.metaText, { marginTop: 4 }]}>
                              Client: {(booking as any).client.fullName}
                            </Text>
                          )}

                          <Text style={styles.bookingPrice}>
                            ${booking.totalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      {(canCancel || canManage) && (
                        <View style={styles.cardFooter}>
                          {canCancel && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtnOutlined,
                                { borderColor: COLORS.red, flex: 1 },
                              ]}
                              onPress={() =>
                                handleCancelBooking(
                                  booking.id,
                                  booking.studio.name,
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.actionBtnText,
                                  { color: COLORS.red },
                                ]}
                              >
                                CANCEL BOOKING
                              </Text>
                            </TouchableOpacity>
                          )}
                          {canManage && (
                            <View
                              style={{ flexDirection: "row", gap: 10, flex: 1 }}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.actionBtn,
                                  {
                                    backgroundColor: COLORS.pureWhite,
                                    flex: 1,
                                  },
                                ]}
                                onPress={() => handleConfirmBooking(booking.id)}
                              >
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: COLORS.background },
                                  ]}
                                >
                                  CONFIRM
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtnOutlined,
                                  { borderColor: COLORS.red, flex: 1 },
                                ]}
                                onPress={() => handleRejectBooking(booking.id)}
                              >
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: COLORS.red },
                                  ]}
                                >
                                  REJECT
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* RESPONSE MODAL */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ACCEPT REQUEST</Text>
              <TouchableOpacity
                onPress={() => setShowResponseModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={COLORS.pureWhite} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Message (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                multiline
                numberOfLines={4}
                value={responseMessage}
                onChangeText={setResponseMessage}
                placeholder="E.g., I'm excited to start working on your project..."
                placeholderTextColor={COLORS.textGrey}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitResponse}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={COLORS.background}
                />
                <Text style={styles.modalSubmitText}>CONFIRM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // HEADER
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: -0.5,
  },
  pendingBadge: {
    marginTop: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.accent,
  },

  // TOGGLE
  toggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toggleTrack: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBlack,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.pureWhite,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.textGrey,
    letterSpacing: 1,
  },

  // SUB HEADER
  subHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  subTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 24,
  },
  subTab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabActive: {
    borderBottomColor: COLORS.accent,
  },
  subTabText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textGrey,
    letterSpacing: 0.5,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
  },

  // CONTENT
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textGrey,
  },

  // CARD STYLES
  card: {
    backgroundColor: COLORS.cardBlack,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: COLORS.pureWhite,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  cardBody: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    marginBottom: 6,
  },
  projectDesc: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textGrey,
  },

  // BOOKING SPECIFIC
  bookingLayout: {
    flexDirection: "row",
  },
  dateBox: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardDark,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 20,
  },
  dateMonth: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: COLORS.accent,
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    marginVertical: 2,
  },
  dateWeekday: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },
  bookingInfo: {
    flex: 1,
    padding: 16,
  },
  bookingInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bookingTimeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  bookingPrice: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
  },

  // FOOTER ACTIONS
  cardFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cardDark,
  },
  actionBtn: {
    flexDirection: "row",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnOutlined: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  actionBtnText: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 12,
    letterSpacing: 0.5,
    color: COLORS.pureWhite,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.cardBlack,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textGrey,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: "Manrope_500Medium",
    color: COLORS.pureWhite,
    height: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
    backgroundColor: COLORS.pureWhite,
  },
  modalSubmitText: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    color: COLORS.background,
  },
});
