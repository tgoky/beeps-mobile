import {
  Colors,
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
import { LinearGradient } from "expo-linear-gradient";
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
  { color: string; bg: string; label: string; icon: any }
> = {
  PENDING: { color: "#D97706", bg: "#FEF3C7", label: "Pending", icon: "time-outline" },
  CONFIRMED: { color: "#059669", bg: "#D1FAE5", label: "Confirmed", icon: "checkmark-circle-outline" },
  CANCELLED: { color: "#DC2626", bg: "#FEE2E2", label: "Cancelled", icon: "close-circle-outline" },
  COMPLETED: { color: "#6B7280", bg: "#F3F4F6", label: "Completed", icon: "flag-outline" },
  ACCEPTED: { color: "#059669", bg: "#D1FAE5", label: "Accepted", icon: "checkmark-done-outline" },
  REJECTED: { color: "#DC2626", bg: "#FEE2E2", label: "Rejected", icon: "ban-outline" },
  IN_PROGRESS: { color: "#2563EB", bg: "#DBEAFE", label: "In Progress", icon: "construct-outline" },
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

  const pendingCount = mainView === "service_requests"
    ? filteredServiceRequests.filter(r => r.status === "PENDING").length
    : filteredBookings.filter(b => b.status === "PENDING").length;

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isDark ? config.color + "20" : config.bg,
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
      <SafeAreaView style={{ backgroundColor: colors.background }}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Activity
            </Text>
            {pendingCount > 0 && (
              <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
                {pendingCount} pending
              </Text>
            )}
          </View>
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
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={mainView === "service_requests" ? colors.text : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
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
              <Ionicons
                name="calendar-outline"
                size={16}
                color={mainView === "bookings" ? colors.text : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
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

      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.subTabsRow}>
          {mainView === "service_requests" ? (
            <>
              {(["sent", "received"] as ServiceRequestViewMode[]).map((view) => (
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
                      {
                        color:
                          serviceRequestView === view
                            ? colors.text
                            : colors.textTertiary,
                      },
                    ]}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </Text>
                  {serviceRequestView === view && (
                    <View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: colors.text },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {([
                { key: "my_bookings" as BookingViewMode, label: "My Bookings" },
                { key: "studio_bookings" as BookingViewMode, label: "Studio Bookings" },
              ]).map((item) => (
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
                      {
                        color:
                          bookingView === item.key
                            ? colors.text
                            : colors.textTertiary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {bookingView === item.key && (
                    <View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: colors.text },
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
            {mainView === "service_requests" &&
              (filteredServiceRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyCircle, { backgroundColor: colors.card }]}>
                    <MaterialCommunityIcons
                      name="briefcase-off-outline"
                      size={40}
                      color={colors.textTertiary}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No requests yet
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Service requests will appear here.
                  </Text>
                </View>
              ) : (
                filteredServiceRequests.map((req) => {
                  const isReceived = req.producerId === user?.id;
                  const otherUser = isReceived ? req.client : req.producer;
                  const canManage = isReceived && req.status === "PENDING";
                  const canStart = isReceived && req.status === "ACCEPTED";
                  const canComplete = isReceived && req.status === "IN_PROGRESS";

                  return (
                    <View
                      key={req.id}
                      style={[styles.card, { backgroundColor: colors.card }]}
                    >
                      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                        <View style={styles.cardHeaderLeft}>
                          <LinearGradient
                            colors={isReceived ? ["#3B82F6", "#6366F1"] : ["#8B5CF6", "#EC4899"]}
                            style={styles.avatarGradient}
                          >
                            <Text style={styles.avatarInitial}>
                              {otherUser?.fullName?.[0] || otherUser?.username?.[0] || "U"}
                            </Text>
                          </LinearGradient>
                          <View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                              {otherUser?.fullName || otherUser?.username}
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                              @{otherUser?.username}
                            </Text>
                          </View>
                        </View>
                        <StatusBadge status={req.status} />
                      </View>

                      <View style={styles.cardBody}>
                        <Text style={[styles.projectTitle, { color: colors.text }]}>
                          {req.projectTitle}
                        </Text>
                        {req.projectDescription && (
                          <Text
                            style={[styles.projectDesc, { color: colors.textSecondary }]}
                            numberOfLines={2}
                          >
                            {req.projectDescription}
                          </Text>
                        )}
                        <View style={styles.metaRow}>
                          {req.budget && (
                            <View style={[styles.metaPill, { backgroundColor: colors.backgroundSecondary }]}>
                              <Ionicons name="cash-outline" size={13} color={colors.text} />
                              <Text style={[styles.metaText, { color: colors.text }]}>${req.budget}</Text>
                            </View>
                          )}
                          <View style={[styles.metaPill, { backgroundColor: colors.backgroundSecondary }]}>
                            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {dayjs(req.createdAt).fromNow()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {(canManage || canStart || canComplete) && (
                        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                          {canManage && (
                            <>
                              <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.text, flex: 1 }]}
                                onPress={() => handleAcceptRequest(req)}
                              >
                                <Ionicons name="checkmark" size={16} color={colors.background} style={{ marginRight: 4 }} />
                                <Text style={[styles.actionBtnText, { color: colors.background }]}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtnOutlined, { borderColor: colors.error, flex: 1 }]}
                                onPress={() => handleRejectRequest(req)}
                              >
                                <Text style={[styles.actionBtnText, { color: colors.error }]}>Reject</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {canStart && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: "#3B82F6", flex: 1 }]}
                              onPress={() => handleStartWork(req.id)}
                            >
                              <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 4 }} />
                              <Text style={[styles.actionBtnText, { color: "#fff" }]}>Start Work</Text>
                            </TouchableOpacity>
                          )}
                          {canComplete && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: "#10B981", flex: 1 }]}
                              onPress={() => handleCompleteWork(req.id)}
                            >
                              <Ionicons name="checkmark-done" size={14} color="#fff" style={{ marginRight: 4 }} />
                              <Text style={[styles.actionBtnText, { color: "#fff" }]}>Complete</Text>
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
                  <View style={[styles.emptyCircle, { backgroundColor: colors.card }]}>
                    <MaterialCommunityIcons
                      name="calendar-remove-outline"
                      size={40}
                      color={colors.textTertiary}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No bookings yet
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Studio bookings will appear here.
                  </Text>
                </View>
              ) : (
                filteredBookings.map((booking) => {
                  const start = dayjs(booking.startTime);
                  const end = dayjs(booking.endTime);
                  const duration = end.diff(start, "hour", true);
                  const isStudioBooking = bookingView === "studio_bookings";
                  const canCancel =
                    !isStudioBooking && ["PENDING", "CONFIRMED"].includes(booking.status);
                  const canManage =
                    isStudioBooking && booking.status === "PENDING";

                  return (
                    <View
                      key={booking.id}
                      style={[styles.card, { backgroundColor: colors.card }]}
                    >
                      <View style={styles.bookingLayout}>
                        <View style={[styles.dateBox, { backgroundColor: colors.backgroundSecondary }]}>
                          <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>
                            {start.format("MMM")}
                          </Text>
                          <Text style={[styles.dateDay, { color: colors.text }]}>
                            {start.format("DD")}
                          </Text>
                          <Text style={[styles.dateWeekday, { color: colors.textTertiary }]}>
                            {start.format("ddd")}
                          </Text>
                        </View>

                        <View style={styles.bookingInfo}>
                          <View style={styles.bookingInfoHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                              {booking.studio.name}
                            </Text>
                            <StatusBadge status={booking.status} />
                          </View>
                          <View style={styles.bookingTimeMeta}>
                            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {start.format("h:mm A")} - {end.format("h:mm A")} ({duration}h)
                            </Text>
                          </View>
                          {isStudioBooking && (booking as any).client && (
                            <Text style={[styles.metaText, { color: colors.textTertiary, fontStyle: "italic", marginTop: 2 }]}>
                              Client: {(booking as any).client.fullName}
                            </Text>
                          )}
                          <Text style={[styles.bookingPrice, { color: colors.text }]}>
                            ${booking.totalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {(canCancel || canManage) && (
                        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                          {canCancel && (
                            <TouchableOpacity
                              style={[styles.actionBtnOutlined, { borderColor: colors.error, flex: 1 }]}
                              onPress={() => handleCancelBooking(booking.id, booking.studio.name)}
                            >
                              <Text style={{ color: colors.error, fontWeight: "600", fontSize: 13 }}>
                                Cancel Booking
                              </Text>
                            </TouchableOpacity>
                          )}
                          {canManage && (
                            <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
                              <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.text, flex: 1 }]}
                                onPress={() => handleConfirmBooking(booking.id)}
                              >
                                <Text style={{ color: colors.background, fontWeight: "600", fontSize: 13 }}>
                                  Confirm
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtnOutlined, { borderColor: colors.error, flex: 1 }]}
                                onPress={() => handleRejectBooking(booking.id)}
                              >
                                <Text style={{ color: colors.error, fontWeight: "600", fontSize: 13 }}>
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

      <Modal visible={showResponseModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Accept Request</Text>
            <TouchableOpacity onPress={() => setShowResponseModal(false)}>
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 14 }}>
              Message to client (Optional)
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              multiline
              numberOfLines={4}
              value={responseMessage}
              onChangeText={setResponseMessage}
              placeholder="E.g. I'm excited to start..."
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              onPress={handleSubmitResponse}
            >
              <Ionicons name="checkmark" size={18} color={colors.background} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>
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
  screenTitle: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  screenSubtitle: { fontSize: 13, marginTop: 2 },

  segmentedControlContainer: { paddingHorizontal: 20, marginBottom: 10 },
  segmentedControl: { flexDirection: "row", borderRadius: 14, padding: 4, height: 48 },
  segmentBtn: {
    flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", borderRadius: 11,
  },
  segmentBtnActive: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: "600" },

  subHeader: { borderBottomWidth: 1, paddingBottom: 12 },
  subTabsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 24 },
  subTab: { paddingVertical: 10, position: "relative" },
  subTabActive: {},
  subTabText: { fontSize: 15, fontWeight: "600" },
  activeIndicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: "600" },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, gap: 14 },

  emptyState: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14 },

  card: { borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSubtitle: { fontSize: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  cardBody: { padding: 14 },
  projectTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  projectDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  metaText: { fontSize: 12, fontWeight: "500" },

  bookingLayout: { flexDirection: "row" },
  dateBox: { width: 70, justifyContent: "center", alignItems: "center", paddingVertical: 14 },
  dateMonth: { fontSize: 11, textTransform: "uppercase", fontWeight: "700" },
  dateDay: { fontSize: 26, fontWeight: "800", lineHeight: 30 },
  dateWeekday: { fontSize: 11, fontWeight: "500" },
  bookingInfo: { flex: 1, padding: 14 },
  bookingInfoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  bookingTimeMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  bookingPrice: { fontSize: 16, fontWeight: "800", marginTop: 4 },

  cardFooter: { flexDirection: "row", padding: 12, gap: 10, borderTopWidth: 1 },
  actionBtn: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionBtnOutlined: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, backgroundColor: "transparent" },
  actionBtnText: { fontWeight: "600", fontSize: 13 },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalInput: { borderRadius: 14, padding: 14, fontSize: 16, height: 120, textAlignVertical: "top" },
  modalSubmitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, marginTop: 20 },
});
