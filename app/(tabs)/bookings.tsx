import {
  Colors
} from "@/constants/theme";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
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

type MainViewMode = "service_requests" | "bookings";
type ServiceRequestViewMode = "sent" | "received";
type BookingViewMode = "my_bookings" | "studio_bookings";
type FilterType = "all" | "pending" | "upcoming" | "past";

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: any }
> = {
  PENDING: { color: "#F59E0B", label: "Pending", icon: "time-outline" },
  CONFIRMED: {
    color: "#10B981",
    label: "Confirmed",
    icon: "checkmark-circle-outline",
  },
  CANCELLED: {
    color: "#EF4444",
    label: "Cancelled",
    icon: "close-circle-outline",
  },
  COMPLETED: { color: "#6B7280", label: "Completed", icon: "flag-outline" },
  ACCEPTED: {
    color: "#10B981",
    label: "Accepted",
    icon: "checkmark-done-outline",
  },
  REJECTED: { color: "#EF4444", label: "Rejected", icon: "ban-outline" },
  IN_PROGRESS: {
    color: "#3B82F6",
    label: "In Progress",
    icon: "construct-outline",
  },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";

  const [mainView, setMainView] = useState<MainViewMode>("service_requests");
  const [serviceRequestView, setServiceRequestView] =
    useState<ServiceRequestViewMode>("sent");
  const [bookingView, setBookingView] =
    useState<BookingViewMode>("my_bookings");
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");

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

  // ... (Keep existing handlers: handleAcceptRequest, handleRejectRequest, handleSubmitResponse, etc.)
  const handleAcceptRequest = (request: any) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const handleRejectRequest = (request: any) => {
    Alert.alert("Reject", "Reject this request?", [
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
            Alert.alert("Error", "Failed");
          }
        },
      },
    ]);
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
      Alert.alert("Error", "Failed");
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
    Alert.alert("Cancel", `Cancel booking at ${name}?`, [
      { text: "Yes", onPress: () => cancelBooking.mutate(id) },
      { text: "No" },
    ]);
  };
  const handleConfirmBooking = (id: string) => confirmBooking.mutate(id);
  const handleRejectBooking = (id: string) => rejectBooking.mutate(id);

  // --- Filtering Logic ---
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

  // --- Helper Components ---
  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: config.color + "15",
            borderColor: config.color + "30",
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={12}
          color={config.color}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* --- Top Segmented Control (Main View) --- */}
      <SafeAreaView style={{ backgroundColor: colors.background }}>
        <View style={styles.headerContainer}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            Activity
          </Text>
        </View>
        <View style={styles.segmentedControlContainer}>
          <View
            style={[
              styles.segmentedControl,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mainView === "service_requests" && [
                  styles.segmentBtnActive,
                  { backgroundColor: colors.card, shadowColor: colors.shadow },
                ],
              ]}
              onPress={() => setMainView("service_requests")}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      mainView === "service_requests"
                        ? colors.text
                        : colors.textSecondary,
                  },
                ]}
              >
                Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mainView === "bookings" && [
                  styles.segmentBtnActive,
                  { backgroundColor: colors.card, shadowColor: colors.shadow },
                ],
              ]}
              onPress={() => setMainView("bookings")}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      mainView === "bookings"
                        ? colors.text
                        : colors.textSecondary,
                  },
                ]}
              >
                Bookings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* --- Secondary Tabs & Filters --- */}
      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        {/* Sub Tabs */}
        <View style={styles.subTabsRow}>
          {mainView === "service_requests" ? (
            <>
              <TouchableOpacity
                onPress={() => setServiceRequestView("sent")}
                style={[
                  styles.subTab,
                  serviceRequestView === "sent" && styles.subTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    {
                      color:
                        serviceRequestView === "sent"
                          ? colors.text
                          : colors.textTertiary,
                    },
                  ]}
                >
                  Sent
                </Text>
                {serviceRequestView === "sent" && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setServiceRequestView("received")}
                style={[
                  styles.subTab,
                  serviceRequestView === "received" && styles.subTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    {
                      color:
                        serviceRequestView === "received"
                          ? colors.text
                          : colors.textTertiary,
                    },
                  ]}
                >
                  Received
                </Text>
                {serviceRequestView === "received" && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setBookingView("my_bookings")}
                style={[
                  styles.subTab,
                  bookingView === "my_bookings" && styles.subTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    {
                      color:
                        bookingView === "my_bookings"
                          ? colors.text
                          : colors.textTertiary,
                    },
                  ]}
                >
                  My Bookings
                </Text>
                {bookingView === "my_bookings" && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBookingView("studio_bookings")}
                style={[
                  styles.subTab,
                  bookingView === "studio_bookings" && styles.subTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    {
                      color:
                        bookingView === "studio_bookings"
                          ? colors.text
                          : colors.textTertiary,
                    },
                  ]}
                >
                  Studio Bookings
                </Text>
                {bookingView === "studio_bookings" && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Horizontal Filters */}
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
                  ? { backgroundColor: colors.text, borderColor: colors.text }
                  : {
                      backgroundColor: "transparent",
                      borderColor: colors.border,
                    },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      filter === f ? colors.background : colors.textSecondary,
                  },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* --- CONTENT LIST --- */}
      <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {/* 1. SERVICE REQUESTS LIST */}
            {mainView === "service_requests" &&
              (filteredServiceRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="briefcase-off-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No requests found
                  </Text>
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
                    <View
                      key={req.id}
                      style={[styles.card, { backgroundColor: colors.card }]}
                    >
                      {/* Header */}
                      <View
                        style={[
                          styles.cardHeader,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <View
                            style={[
                              styles.avatarPlaceholder,
                              { backgroundColor: colors.backgroundSecondary },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: colors.text,
                              }}
                            >
                              {otherUser?.fullName?.[0] ||
                                otherUser?.username?.[0] ||
                                "U"}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={[styles.cardTitle, { color: colors.text }]}
                            >
                              {otherUser?.fullName || otherUser?.username}
                            </Text>
                            <Text
                              style={[
                                styles.cardSubtitle,
                                { color: colors.textSecondary },
                              ]}
                            >
                              @{otherUser?.username}
                            </Text>
                          </View>
                        </View>
                        <StatusBadge status={req.status} />
                      </View>

                      {/* Body */}
                      <View style={styles.cardBody}>
                        <Text
                          style={[styles.projectTitle, { color: colors.text }]}
                        >
                          {req.projectTitle}
                        </Text>
                        <Text
                          style={[
                            styles.projectDesc,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={3}
                        >
                          {req.projectDescription}
                        </Text>

                        <View style={styles.metaRow}>
                          {req.budget && (
                            <View
                              style={[
                                styles.metaPill,
                                { backgroundColor: colors.backgroundSecondary },
                              ]}
                            >
                              <Ionicons
                                name="cash-outline"
                                size={14}
                                color={colors.text}
                              />
                              <Text
                                style={[
                                  styles.metaText,
                                  { color: colors.text },
                                ]}
                              >
                                ${req.budget}
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.metaPill,
                              { backgroundColor: colors.backgroundSecondary },
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={colors.text}
                            />
                            <Text
                              style={[styles.metaText, { color: colors.text }]}
                            >
                              {dayjs(req.createdAt).fromNow()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions */}
                      {(canManage || canStart || canComplete) && (
                        <View
                          style={[
                            styles.cardFooter,
                            { borderTopColor: colors.border },
                          ]}
                        >
                          {canManage && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtn,
                                  { backgroundColor: colors.text },
                                ]}
                                onPress={() => handleAcceptRequest(req)}
                              >
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: colors.background },
                                  ]}
                                >
                                  Accept
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtnOutlined,
                                  { borderColor: colors.error },
                                ]}
                                onPress={() => handleRejectRequest(req)}
                              >
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: colors.error },
                                  ]}
                                >
                                  Reject
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {canStart && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                { backgroundColor: colors.primary },
                              ]}
                              onPress={() => handleStartWork(req.id)}
                            >
                              <Text
                                style={[
                                  styles.actionBtnText,
                                  { color: "#fff" },
                                ]}
                              >
                                Start Work
                              </Text>
                            </TouchableOpacity>
                          )}
                          {canComplete && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                { backgroundColor: colors.success },
                              ]}
                              onPress={() => handleCompleteWork(req.id)}
                            >
                              <Text
                                style={[
                                  styles.actionBtnText,
                                  { color: "#fff" },
                                ]}
                              >
                                Mark Complete
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ))}

            {/* 2. BOOKINGS LIST */}
            {mainView === "bookings" &&
              (filteredBookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="calendar-remove-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No bookings found
                  </Text>
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
                    <View
                      key={booking.id}
                      style={[styles.card, { backgroundColor: colors.card }]}
                    >
                      {/* Date Column & Info */}
                      <View style={{ flexDirection: "row" }}>
                        {/* Date Box */}
                        <View
                          style={[
                            styles.dateBox,
                            { backgroundColor: colors.backgroundSecondary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dateMonth,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {start.format("MMM")}
                          </Text>
                          <Text
                            style={[styles.dateDay, { color: colors.text }]}
                          >
                            {start.format("DD")}
                          </Text>
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1, padding: 12 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <Text
                              style={[styles.cardTitle, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {booking.studio.name}
                            </Text>
                            <StatusBadge status={booking.status} />
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={colors.textSecondary}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.metaText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {start.format("h:mm A")} - {end.format("h:mm A")}{" "}
                              ({duration}h)
                            </Text>
                          </View>

                          {isStudioBooking && (booking as any).client && (
                            <Text
                              style={[
                                styles.metaText,
                                {
                                  color: colors.textTertiary,
                                  fontStyle: "italic",
                                },
                              ]}
                            >
                              Client: {(booking as any).client.fullName}
                            </Text>
                          )}

                          <Text
                            style={[styles.priceText, { color: colors.text }]}
                          >
                            ${booking.totalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      {(canCancel || canManage) && (
                        <View
                          style={[
                            styles.cardFooter,
                            { borderTopColor: colors.border },
                          ]}
                        >
                          {canCancel && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtnOutlined,
                                { borderColor: colors.error, flex: 1 },
                              ]}
                              onPress={() =>
                                handleCancelBooking(
                                  booking.id,
                                  booking.studio.name,
                                )
                              }
                            >
                              <Text
                                style={{
                                  color: colors.error,
                                  fontWeight: "600",
                                }}
                              >
                                Cancel
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
                                  { backgroundColor: colors.text, flex: 1 },
                                ]}
                                onPress={() => handleConfirmBooking(booking.id)}
                              >
                                <Text
                                  style={{
                                    color: colors.background,
                                    fontWeight: "600",
                                  }}
                                >
                                  Confirm
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtnOutlined,
                                  { borderColor: colors.error, flex: 1 },
                                ]}
                                onPress={() => handleRejectBooking(booking.id)}
                              >
                                <Text
                                  style={{
                                    color: colors.error,
                                    fontWeight: "600",
                                  }}
                                >
                                  Reject
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

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Accept Request
            </Text>
            <TouchableOpacity onPress={() => setShowResponseModal(false)}>
              <Ionicons
                name="close-circle"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Message to client (Optional)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                },
              ]}
              multiline
              numberOfLines={4}
              value={responseMessage}
              onChangeText={setResponseMessage}
              placeholder="E.g. I'm excited to start..."
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary, marginTop: 20 },
              ]}
              onPress={handleSubmitResponse}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                Confirm Acceptance
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  // Segment Control
  segmentedControlContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    height: 44,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  segmentBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Sub Header
  subHeader: {
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  subTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 24,
  },
  subTab: {
    paddingVertical: 10,
    position: "relative",
  },
  subTabActive: {},
  subTabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Lists & Cards
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, gap: 16 },

  emptyState: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { fontSize: 16 },

  card: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardBody: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  projectDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: { fontSize: 12, fontWeight: "500" },

  // Booking Card Specifics
  dateBox: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
  },
  dateMonth: { fontSize: 12, textTransform: "uppercase", fontWeight: "700" },
  dateDay: { fontSize: 24, fontWeight: "800" },
  priceText: { fontSize: 16, fontWeight: "800", marginTop: 4 },

  cardFooter: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnOutlined: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  actionBtnText: { fontWeight: "600", fontSize: 13 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
  },
});
