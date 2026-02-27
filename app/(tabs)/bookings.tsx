import { Colors } from "@/constants/theme";
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

type MainViewMode = "service_requests" | "bookings";
type ServiceRequestViewMode = "sent" | "received";
type BookingViewMode = "my_bookings" | "studio_bookings";
type FilterType = "all" | "pending" | "upcoming" | "past";

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string; icon: any; gradient: string[] }
> = {
  PENDING: {
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.15)",
    label: "Pending",
    icon: "time-outline",
    gradient: ["#FBBF24", "#F59E0B"],
  },
  CONFIRMED: {
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.15)",
    label: "Confirmed",
    icon: "checkmark-circle-outline",
    gradient: ["#34D399", "#10B981"],
  },
  CANCELLED: {
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.15)",
    label: "Cancelled",
    icon: "close-circle-outline",
    gradient: ["#F87171", "#EF4444"],
  },
  COMPLETED: {
    color: "#9CA3AF",
    bg: "rgba(156, 163, 175, 0.15)",
    label: "Completed",
    icon: "flag-outline",
    gradient: ["#9CA3AF", "#6B7280"],
  },
  ACCEPTED: {
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.15)",
    label: "Accepted",
    icon: "checkmark-done-outline",
    gradient: ["#34D399", "#10B981"],
  },
  REJECTED: {
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.15)",
    label: "Rejected",
    icon: "ban-outline",
    gradient: ["#F87171", "#EF4444"],
  },
  IN_PROGRESS: {
    color: "#60A5FA",
    bg: "rgba(96, 165, 250, 0.15)",
    label: "In Progress",
    icon: "construct-outline",
    gradient: ["#60A5FA", "#3B82F6"],
  },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";

  // Get navigation params
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

  // Filtering
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
          },
        ]}
      >
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: "#000000" }]}>
      <SafeAreaView style={{ backgroundColor: "#000000" }}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={[styles.screenTitle, { color: "#FFFFFF" }]}>
              Activity
            </Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={[styles.screenSubtitle, { color: "#9CA3AF" }]}>
                  {pendingCount} pending {pendingCount === 1 ? "item" : "items"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.segmentedControlContainer}>
          <View
            style={[styles.segmentedControl, { backgroundColor: "#1A1A1A" }]}
          >
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mainView === "service_requests" && [
                  styles.segmentBtnActive,
                  { backgroundColor: "#2A2A2A" },
                ],
              ]}
              onPress={() => setMainView("service_requests")}
            >
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={mainView === "service_requests" ? "#FFFFFF" : "#6B7280"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      mainView === "service_requests" ? "#FFFFFF" : "#6B7280",
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
                  { backgroundColor: "#2A2A2A" },
                ],
              ]}
              onPress={() => setMainView("bookings")}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={mainView === "bookings" ? "#FFFFFF" : "#6B7280"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: mainView === "bookings" ? "#FFFFFF" : "#6B7280" },
                ]}
              >
                Bookings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.subHeader, { borderBottomColor: "#1F1F1F" }]}>
        <View style={styles.subTabsRow}>
          {mainView === "service_requests" ? (
            <>
              {(["sent", "received"] as ServiceRequestViewMode[]).map(
                (view) => (
                  <TouchableOpacity
                    key={view}
                    onPress={() => setServiceRequestView(view)}
                    style={styles.subTab}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        {
                          color:
                            serviceRequestView === view ? "#FFFFFF" : "#4B5563",
                        },
                      ]}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Text>
                    {serviceRequestView === view && (
                      <View
                        style={[
                          styles.activeIndicator,
                          { backgroundColor: "#FFFFFF" },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                ),
              )}
            </>
          ) : (
            <>
              {[
                { key: "my_bookings" as BookingViewMode, label: "My Bookings" },
                {
                  key: "studio_bookings" as BookingViewMode,
                  label: "Studio Bookings",
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setBookingView(item.key)}
                  style={styles.subTab}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      {
                        color: bookingView === item.key ? "#FFFFFF" : "#4B5563",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {bookingView === item.key && (
                    <View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: "#FFFFFF" },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={{ marginTop: 16 }}
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
                  ? { backgroundColor: "#FFFFFF" }
                  : { backgroundColor: "#1A1A1A" },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filter === f ? "#000000" : "#9CA3AF" },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#FFFFFF" size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#FFFFFF"
                progressBackgroundColor="#1A1A1A"
              />
            }
          >
            {mainView === "service_requests" &&
              (filteredServiceRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View
                    style={[styles.emptyCircle, { backgroundColor: "#1A1A1A" }]}
                  >
                    <MaterialCommunityIcons
                      name="briefcase-off-outline"
                      size={40}
                      color="#4B5563"
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>
                    No requests yet
                  </Text>
                  <Text style={[styles.emptyText, { color: "#6B7280" }]}>
                    Service requests will appear here
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
                      style={[styles.card, { backgroundColor: "#0A0A0A" }]}
                    >
                      <LinearGradient
                        colors={["rgba(255,255,255,0.03)", "transparent"]}
                        style={styles.cardGradient}
                      />

                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <LinearGradient
                            colors={
                              isReceived
                                ? ["#3B82F6", "#2563EB"]
                                : ["#8B5CF6", "#7C3AED"]
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
                            <Text
                              style={[styles.cardTitle, { color: "#FFFFFF" }]}
                            >
                              {otherUser?.fullName || otherUser?.username}
                            </Text>
                            <Text
                              style={[
                                styles.cardSubtitle,
                                { color: "#6B7280" },
                              ]}
                            >
                              @{otherUser?.username}
                            </Text>
                          </View>
                        </View>
                        <StatusBadge status={req.status} />
                      </View>

                      <View style={styles.cardBody}>
                        <Text
                          style={[styles.projectTitle, { color: "#FFFFFF" }]}
                        >
                          {req.projectTitle}
                        </Text>
                        {req.projectDescription && (
                          <Text
                            style={[styles.projectDesc, { color: "#9CA3AF" }]}
                            numberOfLines={2}
                          >
                            {req.projectDescription}
                          </Text>
                        )}
                        <View style={styles.metaRow}>
                          {req.budget && (
                            <View
                              style={[
                                styles.metaPill,
                                { backgroundColor: "#1A1A1A" },
                              ]}
                            >
                              <Ionicons
                                name="cash-outline"
                                size={13}
                                color="#34D399"
                              />
                              <Text
                                style={[styles.metaText, { color: "#34D399" }]}
                              >
                                ${req.budget}
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.metaPill,
                              { backgroundColor: "#1A1A1A" },
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={13}
                              color="#6B7280"
                            />
                            <Text
                              style={[styles.metaText, { color: "#9CA3AF" }]}
                            >
                              {dayjs(req.createdAt).fromNow()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {(canManage || canStart || canComplete) && (
                        <View
                          style={[
                            styles.cardFooter,
                            { borderTopColor: "#1F1F1F" },
                          ]}
                        >
                          {canManage && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtn,
                                  { backgroundColor: "#FFFFFF", flex: 1 },
                                ]}
                                onPress={() => handleAcceptRequest(req)}
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#000000"
                                />
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: "#000000" },
                                  ]}
                                >
                                  Accept
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtnOutlined,
                                  { borderColor: "#EF4444", flex: 1 },
                                ]}
                                onPress={() => handleRejectRequest(req)}
                              >
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: "#EF4444" },
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
                                { backgroundColor: "#3B82F6", flex: 1 },
                              ]}
                              onPress={() => handleStartWork(req.id)}
                            >
                              <Ionicons name="play" size={14} color="#FFFFFF" />
                              <Text
                                style={[
                                  styles.actionBtnText,
                                  { color: "#FFFFFF" },
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
                                { backgroundColor: "#10B981", flex: 1 },
                              ]}
                              onPress={() => handleCompleteWork(req.id)}
                            >
                              <Ionicons
                                name="checkmark-done"
                                size={14}
                                color="#FFFFFF"
                              />
                              <Text
                                style={[
                                  styles.actionBtnText,
                                  { color: "#FFFFFF" },
                                ]}
                              >
                                Complete
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ))}

            {mainView === "bookings" &&
              (filteredBookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <View
                    style={[styles.emptyCircle, { backgroundColor: "#1A1A1A" }]}
                  >
                    <MaterialCommunityIcons
                      name="calendar-remove-outline"
                      size={40}
                      color="#4B5563"
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>
                    No bookings yet
                  </Text>
                  <Text style={[styles.emptyText, { color: "#6B7280" }]}>
                    Studio bookings will appear here
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
                      style={[styles.card, { backgroundColor: "#0A0A0A" }]}
                    >
                      <LinearGradient
                        colors={["rgba(255,255,255,0.03)", "transparent"]}
                        style={styles.cardGradient}
                      />

                      <View style={styles.bookingLayout}>
                        <View
                          style={[
                            styles.dateBox,
                            { backgroundColor: "#1A1A1A" },
                          ]}
                        >
                          <Text
                            style={[styles.dateMonth, { color: "#9CA3AF" }]}
                          >
                            {start.format("MMM")}
                          </Text>
                          <Text style={[styles.dateDay, { color: "#FFFFFF" }]}>
                            {start.format("DD")}
                          </Text>
                          <Text
                            style={[styles.dateWeekday, { color: "#4B5563" }]}
                          >
                            {start.format("ddd")}
                          </Text>
                        </View>

                        <View style={styles.bookingInfo}>
                          <View style={styles.bookingInfoHeader}>
                            <Text
                              style={[
                                styles.cardTitle,
                                { color: "#FFFFFF", flex: 1 },
                              ]}
                              numberOfLines={1}
                            >
                              {booking.studio.name}
                            </Text>
                            <StatusBadge status={booking.status} />
                          </View>
                          <View style={styles.bookingTimeMeta}>
                            <Ionicons
                              name="time-outline"
                              size={13}
                              color="#6B7280"
                            />
                            <Text
                              style={[styles.metaText, { color: "#9CA3AF" }]}
                            >
                              {start.format("h:mm A")} - {end.format("h:mm A")}{" "}
                              ({duration}h)
                            </Text>
                          </View>
                          {isStudioBooking && (booking as any).client && (
                            <Text
                              style={[
                                styles.metaText,
                                { color: "#6B7280", marginTop: 4 },
                              ]}
                            >
                              Client: {(booking as any).client.fullName}
                            </Text>
                          )}
                          <Text
                            style={[styles.bookingPrice, { color: "#34D399" }]}
                          >
                            ${booking.totalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {(canCancel || canManage) && (
                        <View
                          style={[
                            styles.cardFooter,
                            { borderTopColor: "#1F1F1F" },
                          ]}
                        >
                          {canCancel && (
                            <TouchableOpacity
                              style={[
                                styles.actionBtnOutlined,
                                { borderColor: "#EF4444", flex: 1 },
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
                                  color: "#EF4444",
                                  fontWeight: "600",
                                  fontSize: 13,
                                }}
                              >
                                Cancel Booking
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
                                  { backgroundColor: "#FFFFFF", flex: 1 },
                                ]}
                                onPress={() => handleConfirmBooking(booking.id)}
                              >
                                <Text
                                  style={{
                                    color: "#000000",
                                    fontWeight: "600",
                                    fontSize: 13,
                                  }}
                                >
                                  Confirm
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.actionBtnOutlined,
                                  { borderColor: "#EF4444", flex: 1 },
                                ]}
                                onPress={() => handleRejectBooking(booking.id)}
                              >
                                <Text
                                  style={{
                                    color: "#EF4444",
                                    fontWeight: "600",
                                    fontSize: 13,
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

      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: "#0A0A0A" }]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.05)", "transparent"]}
              style={styles.modalGradient}
            />

            <View
              style={[styles.modalHeader, { borderBottomColor: "#1F1F1F" }]}
            >
              <Text style={[styles.modalTitle, { color: "#FFFFFF" }]}>
                Accept Request
              </Text>
              <TouchableOpacity
                onPress={() => setShowResponseModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: "#9CA3AF" }]}>
                Message to client (Optional)
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: "#1A1A1A", color: "#FFFFFF" },
                ]}
                multiline
                numberOfLines={4}
                value={responseMessage}
                onChangeText={setResponseMessage}
                placeholder="E.g., I'm excited to start working on your project..."
                placeholderTextColor="#4B5563"
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: "#FFFFFF" }]}
                onPress={handleSubmitResponse}
              >
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text style={[styles.modalSubmitText, { color: "#000000" }]}>
                  Confirm Acceptance
                </Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pendingBadge: {
    marginTop: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },

  segmentedControlContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    height: 52,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  segmentBtnActive: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
  },

  subHeader: {
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  subTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 32,
  },
  subTab: {
    paddingVertical: 8,
    position: "relative",
  },
  subTabText: {
    fontSize: 16,
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
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 100,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    gap: 16,
  },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
    gap: 12,
  },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
  },

  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  projectDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "500",
  },

  bookingLayout: {
    flexDirection: "row",
  },
  dateBox: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    margin: 16,
    marginRight: 0,
    borderRadius: 16,
  },
  dateMonth: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  dateWeekday: {
    fontSize: 12,
    fontWeight: "600",
  },
  bookingInfo: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
  },
  bookingInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bookingTimeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: -0.3,
  },

  cardFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnOutlined: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  actionBtnText: {
    fontWeight: "700",
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  modalGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalInput: {
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    height: 140,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modalSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  modalSubmitText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
