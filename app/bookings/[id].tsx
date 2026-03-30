import { useAuth } from "@/contexts/AuthContext";
import {
  useBookingDetail,
  useCancelBooking,
  useCheckIn,
  useCheckOut,
  useConfirmBooking,
  useConfirmCheckIn,
  useConfirmSession,
  usePayBooking,
  useRaiseDispute,
  useRejectBooking,
  useReleasePayment,
} from "@/hooks/useBookings";
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
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);

const T = {
  bg: "#000000",
  surface: "#0A0A0A",
  surfaceHi: "#151515",
  text: "#FFFFFF",
  dim: "#888888",
  dark: "#444444",
  accent: "#f59e0b",
  border: "#222222",
  success: "#00E096",
  error: "#FF453A",
  blue: "#3B82F6",
};

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string; icon: string }
> = {
  PENDING: {
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.15)",
    label: "Pending",
    icon: "time-outline",
  },
  CONFIRMED: {
    color: "#34D399",
    bg: "rgba(52,211,153,0.15)",
    label: "Confirmed",
    icon: "checkmark-circle-outline",
  },
  ACTIVE: {
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.15)",
    label: "In Session",
    icon: "pulse-outline",
  },
  CANCELLED: {
    color: "#F87171",
    bg: "rgba(248,113,113,0.15)",
    label: "Cancelled",
    icon: "close-circle-outline",
  },
  COMPLETED: {
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.15)",
    label: "Completed",
    icon: "flag-outline",
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> =
  {
    UNPAID: { color: "#FBBF24", label: "Unpaid" },
    PAYMENT_HELD: { color: "#60A5FA", label: "Payment Held (Escrow)" },
    PAYMENT_CAPTURED: { color: "#34D399", label: "Payment Captured" },
    PAYMENT_RELEASED: { color: "#00E096", label: "Payment Released" },
    REFUNDED: { color: "#F87171", label: "Refunded" },
  };

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [now, setNow] = useState(new Date());
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRInputModal, setShowQRInputModal] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [showConfirmCodeModal, setShowConfirmCodeModal] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [endReason, setEndReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Mutations
  const cancelBooking = useCancelBooking();
  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();
  const payBooking = usePayBooking();
  const checkIn = useCheckIn();
  const confirmCheckIn = useConfirmCheckIn();
  const checkOut = useCheckOut();
  const confirmSession = useConfirmSession();
  const raiseDispute = useRaiseDispute();
  const releasePayment = useReleasePayment();

  const { data: booking, isLoading, refetch } = useBookingDetail(id);

  // Live timer for active sessions
  useEffect(() => {
    if (booking?.status === "ACTIVE") {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [booking?.status]);

  // Progress animation for active sessions
  useEffect(() => {
    if (booking?.status === "ACTIVE" && booking.checkedInAt) {
      const start = new Date(booking.checkedInAt).getTime();
      const end = new Date(booking.endTime).getTime();
      const total = end - start;
      const elapsed = now.getTime() - start;
      const progress = Math.min(elapsed / total, 1.5); // Allow showing overtime

      Animated.timing(progressAnim, {
        toValue: Math.min(progress, 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [now, booking?.status]);

  if (!fontsLoaded || isLoading || !booking) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  const start = dayjs(booking.startTime);
  const end = dayjs(booking.endTime);
  const duration = end.diff(start, "hour", true);
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const paymentCfg = PAYMENT_STATUS_CONFIG[booking.paymentStatus || "UNPAID"];
  const isClient = booking.userId === user?.id;
  const isOwner = booking.studio?.ownerId === user?.id;

  // Session timer calculations
  const getSessionTimer = () => {
    if (booking.status !== "ACTIVE" || !booking.checkedInAt) return null;
    const checkedIn = new Date(booking.checkedInAt).getTime();
    const scheduled = new Date(booking.endTime).getTime();
    const elapsed = now.getTime() - checkedIn;
    const remaining = scheduled - now.getTime();
    const isOvertime = remaining < 0;

    const absRemaining = Math.abs(remaining);
    const hours = Math.floor(absRemaining / 3600000);
    const mins = Math.floor((absRemaining % 3600000) / 60000);
    const secs = Math.floor((absRemaining % 60000) / 1000);

    return {
      elapsed: Math.floor(elapsed / 60000),
      remaining: `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
      isOvertime,
    };
  };

  const timer = getSessionTimer();

  // --- ACTION HANDLERS ---
  const handlePay = () => {
    Alert.alert(
      "Pay for Booking",
      `Hold $${booking.totalAmount.toFixed(2)} in escrow for your session at ${booking.studio.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay & Confirm",
          onPress: async () => {
            try {
              await payBooking.mutateAsync({
                bookingId: id!,
                totalAmount: booking.totalAmount,
              });
              Alert.alert(
                "Payment Held",
                "Your payment is held securely in escrow. Show your QR code at the studio to check in.",
              );
              refetch();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to process payment");
            }
          },
        },
      ],
    );
  };

  const handleCheckIn = () => {
    setQrCodeInput("");
    setShowQRInputModal(true);
  };

  const handleSubmitQRCheckIn = async () => {
    const code = qrCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert("Error", "Please enter the artist's QR code");
      return;
    }
    try {
      const result = await checkIn.mutateAsync({
        bookingId: id!,
        qrCode: code,
      });
      setShowQRInputModal(false);
      setQrCodeInput("");
      Alert.alert(
        "Session Started!",
        `A 6-digit confirmation code has been sent to the artist: ${(result as any).confirmationCode}\n\nThey must enter it within 10 minutes to confirm their presence.`,
      );
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Invalid QR code or check-in failed");
    }
  };

  const handleConfirmPresence = async () => {
    if (!confirmCode.trim()) {
      Alert.alert("Error", "Please enter the confirmation code");
      return;
    }
    try {
      await confirmCheckIn.mutateAsync({
        bookingId: id!,
        confirmationCode: confirmCode.trim(),
      });
      setShowConfirmCodeModal(false);
      setConfirmCode("");
      Alert.alert("Confirmed", "Your presence has been confirmed.");
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Invalid confirmation code");
    }
  };

  const handleEndSession = async () => {
    const isEarly = new Date() < new Date(booking.endTime);
    if (isEarly && !endReason.trim()) {
      Alert.alert(
        "Error",
        "Please provide a reason for ending the session early",
      );
      return;
    }
    try {
      const result = await checkOut.mutateAsync({
        bookingId: id!,
        reason: isEarly ? endReason.trim() : undefined,
        endedBy: isOwner ? "STUDIO_OWNER" : "BOOKER",
      });
      setShowEndSessionModal(false);
      setEndReason("");
      const summary = (result as any).sessionSummary;
      Alert.alert(
        "Session Ended",
        summary.isEarlyEnd
          ? `Session ended early. Pro-rata amount: $${summary.proRataAmount?.toFixed(2)} for ${summary.actualMinutes} minutes.`
          : summary.overtimeMinutes > 0
            ? `Session ended with ${summary.overtimeMinutes} min overtime. Total: $${summary.finalAmount?.toFixed(2)}`
            : "Session completed successfully!",
      );
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to end session");
    }
  };

  const handleConfirmSession = () => {
    const totalAmount = booking.proRataAmount || booking.totalAmount;
    const overtime = booking.overtimeAmount || 0;
    const final = totalAmount + overtime;

    Alert.alert(
      "Confirm Session & Release Payment",
      `Approve payment of $${final.toFixed(2)} to the studio owner?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Pay",
          onPress: async () => {
            try {
              await confirmSession.mutateAsync(id!);
              Alert.alert(
                "Payment Released",
                "Payment has been released to the studio owner. Thank you!",
              );
              refetch();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to confirm session");
            }
          },
        },
      ],
    );
  };

  const handleRaiseDispute = async () => {
    if (disputeReason.trim().length < 10) {
      Alert.alert(
        "Error",
        "Please provide a detailed reason (at least 10 characters)",
      );
      return;
    }
    try {
      await raiseDispute.mutateAsync({
        bookingId: id!,
        reason: disputeReason.trim(),
        userId: user!.id,
      });
      setShowDisputeModal(false);
      setDisputeReason("");
      Alert.alert(
        "Dispute Raised",
        "Your dispute has been submitted and is under review.",
      );
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to raise dispute");
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      `Cancel your booking at ${booking.studio.name}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelBooking.mutateAsync(id!);
              refetch();
            } catch {
              Alert.alert("Error", "Failed to cancel booking");
            }
          },
        },
      ],
    );
  };

  const handleConfirmBooking = () =>
    confirmBooking.mutate(id!, { onSuccess: () => refetch() });
  const handleRejectBooking = () => {
    Alert.alert("Reject Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          rejectBooking.mutate(id!, { onSuccess: () => refetch() }),
      },
    ]);
  };

  // --- DETERMINE AVAILABLE ACTIONS ---
  const canPay =
    isClient &&
    booking.status === "PENDING" &&
    booking.paymentStatus === "UNPAID";
  const canPayConfirmed =
    isClient &&
    booking.status === "CONFIRMED" &&
    booking.paymentStatus === "UNPAID";
  const canCancel =
    isClient && ["PENDING", "CONFIRMED"].includes(booking.status);
  const canManage = isOwner && booking.status === "PENDING";
  const canCheckIn =
    isOwner &&
    booking.status === "CONFIRMED" &&
    booking.paymentStatus === "PAYMENT_HELD";
  const canConfirmPresence =
    isClient && booking.status === "ACTIVE" && !booking.bookerConfirmedCheckIn;
  const canEndSession = (isOwner || isClient) && booking.status === "ACTIVE";
  const canConfirmSession =
    isClient &&
    booking.status === "COMPLETED" &&
    booking.paymentStatus !== "PAYMENT_RELEASED" &&
    booking.disputeStatus !== "OPEN";
  const canDispute =
    (isClient || isOwner) &&
    booking.status === "COMPLETED" &&
    booking.paymentStatus !== "PAYMENT_RELEASED" &&
    !booking.disputeStatus;
  const showQR =
    isClient && booking.qrCode && ["CONFIRMED", "ACTIVE"].includes(booking.status);

  return (
    <View style={s.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={{ backgroundColor: T.bg }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>BOOKING DETAILS</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.backBtn}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View
          style={[
            s.statusBanner,
            { backgroundColor: statusCfg.bg, borderColor: statusCfg.color },
          ]}
        >
          <Ionicons
            name={statusCfg.icon as any}
            size={20}
            color={statusCfg.color}
          />
          <Text style={[s.statusLabel, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>

        {/* ACTIVE SESSION TIMER */}
        {booking.status === "ACTIVE" && timer && (
          <View
            style={[
              s.card,
              { borderColor: timer.isOvertime ? T.accent : T.blue },
            ]}
          >
            <Text style={s.cardLabel}>LIVE SESSION</Text>
            <Text
              style={[s.timerText, timer.isOvertime && { color: T.accent }]}
            >
              {timer.isOvertime ? "+" : ""}
              {timer.remaining}
            </Text>
            <Text
              style={[s.timerSubtext, timer.isOvertime && { color: T.accent }]}
            >
              {timer.isOvertime ? "OVERTIME" : "REMAINING"}
            </Text>

            {/* Progress Bar */}
            <View style={s.progressTrack}>
              <Animated.View
                style={[
                  s.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: timer.isOvertime ? T.accent : T.blue,
                  },
                ]}
              />
            </View>

            <View style={s.progressMeta}>
              <Text style={s.progressMetaText}>
                {timer.elapsed} min elapsed
              </Text>
              <Text style={s.progressMetaText}>
                {Math.round(duration * 60)} min total
              </Text>
            </View>

            {!booking.bookerConfirmedCheckIn && isClient && (
              <View style={[s.warningBanner, { marginTop: 12 }]}>
                <Ionicons name="warning-outline" size={16} color={T.accent} />
                <Text style={s.warningText}>
                  Please confirm your presence to secure payment protection
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Date & Time */}
        <View style={s.card}>
          <View style={s.dateTimeRow}>
            <View style={s.dateBlock}>
              <Text style={s.dateMonth}>{start.format("MMM")}</Text>
              <Text style={s.dateDay}>{start.format("DD")}</Text>
              <Text style={s.dateWeekday}>{start.format("ddd")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.timeLabel}>SESSION TIME</Text>
              <Text style={s.timeValue}>
                {start.format("h:mm A")} - {end.format("h:mm A")}
              </Text>
              <Text style={s.durationText}>{duration}h session</Text>
            </View>
          </View>
        </View>

        {/* Studio Info */}
        <View style={s.card}>
          <Text style={s.cardLabel}>STUDIO</Text>
          <TouchableOpacity
            style={s.studioRow}
            onPress={() => router.push(`/studio/${booking.studioId}`)}
          >
            <View style={s.studioIcon}>
              <MaterialCommunityIcons
                name="music-box"
                size={24}
                color={T.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.studioName}>{booking.studio.name}</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="location-outline" size={14} color={T.dim} />
                <Text style={s.dimText}>
                  {[booking.studio.city, booking.studio.state]
                    .filter(Boolean)
                    .join(", ") || booking.studio.location}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={T.dim} />
          </TouchableOpacity>
        </View>

        {/* QR Code Display (for client with confirmed booking) */}
        {showQR && (
          <TouchableOpacity
            style={[s.card, { borderColor: T.accent }]}
            onPress={() => setShowQRModal(true)}
          >
            <Text style={s.cardLabel}>YOUR QR CODE</Text>
            <View style={s.qrDisplay}>
              <MaterialCommunityIcons
                name="qrcode"
                size={80}
                color={T.accent}
              />
              <Text style={s.qrCode}>{booking.qrCode}</Text>
              <Text style={s.dimText}>
                Show this to the studio owner to start your session
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Check-in window info (for CONFIRMED + owner with payment held) */}
        {isOwner && booking.status === "CONFIRMED" && booking.paymentStatus === "PAYMENT_HELD" && (() => {
          const scheduledStart = new Date(booking.startTime);
          const earliest = new Date(scheduledStart.getTime() - 30 * 60 * 1000);
          const latest = new Date(scheduledStart.getTime() + 15 * 60 * 1000);
          const tooEarly = now < earliest;
          const expired = now > latest;
          const inWindow = !tooEarly && !expired;
          return (
            <View style={[s.card, { borderColor: inWindow ? T.success : T.dim }]}>
              <Text style={s.cardLabel}>CHECK-IN WINDOW</Text>
              <View style={s.metaRow}>
                <Ionicons name="time-outline" size={16} color={T.dim} />
                <Text style={s.dimText}>
                  Opens: {dayjs(earliest).format("h:mm A")} · Closes: {dayjs(latest).format("h:mm A")}
                </Text>
              </View>
              {tooEarly && (
                <View style={[s.warningBanner, { marginTop: 8 }]}>
                  <Ionicons name="hourglass-outline" size={16} color={T.accent} />
                  <Text style={s.warningText}>
                    Check-in opens {dayjs(earliest).fromNow()}
                  </Text>
                </View>
              )}
              {inWindow && (
                <View style={[s.warningBanner, { marginTop: 8, borderColor: T.success, backgroundColor: "rgba(0,224,150,0.08)" }]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={T.success} />
                  <Text style={[s.warningText, { color: T.success }]}>
                    Check-in window is open — ask the artist for their QR code
                  </Text>
                </View>
              )}
              {expired && (
                <View style={[s.warningBanner, { marginTop: 8, borderColor: T.error, backgroundColor: "rgba(255,69,58,0.08)" }]}>
                  <Ionicons name="close-circle-outline" size={16} color={T.error} />
                  <Text style={[s.warningText, { color: T.error }]}>Check-in window has expired</Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* Payment Info */}
        <View style={s.card}>
          <Text style={s.cardLabel}>PAYMENT</Text>
          <View
            style={[
              s.paymentBadge,
              { backgroundColor: paymentCfg?.bg || "rgba(251,191,36,0.15)" },
            ]}
          >
            <Ionicons
              name={
                booking.paymentStatus === "PAYMENT_RELEASED"
                  ? "checkmark-circle"
                  : "card-outline"
              }
              size={16}
              color={paymentCfg?.color || T.accent}
            />
            <Text
              style={[
                s.paymentBadgeText,
                { color: paymentCfg?.color || T.accent },
              ]}
            >
              {paymentCfg?.label || "Unpaid"}
            </Text>
          </View>

          <View style={s.priceBreakdown}>
            <View style={s.priceRow}>
              <Text style={s.dimText}>
                Rate ({duration}h x ${booking.studio.hourlyRate}/hr)
              </Text>
              <Text style={s.whiteText}>
                ${(booking.studio.hourlyRate * duration).toFixed(2)}
              </Text>
            </View>
            {booking.platformFee != null && booking.platformFee > 0 && (
              <View style={s.priceRow}>
                <Text style={s.dimText}>Platform Fee (10%)</Text>
                <Text style={s.whiteText}>
                  ${booking.platformFee.toFixed(2)}
                </Text>
              </View>
            )}
            {booking.overtimeAmount != null && booking.overtimeAmount > 0 && (
              <View style={s.priceRow}>
                <Text style={[s.dimText, { color: T.accent }]}>
                  Overtime ({booking.overtimeMinutes} min)
                </Text>
                <Text style={[s.whiteText, { color: T.accent }]}>
                  +${booking.overtimeAmount.toFixed(2)}
                </Text>
              </View>
            )}
            {booking.proRataAmount != null && (
              <View style={s.priceRow}>
                <Text style={[s.dimText, { color: T.blue }]}>
                  Pro-rata (early end)
                </Text>
                <Text style={[s.whiteText, { color: T.blue }]}>
                  ${booking.proRataAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={s.divider} />
            <View style={s.priceRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={s.totalValue}>
                ${booking.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Session Summary (for completed) */}
        {booking.status === "COMPLETED" &&
          booking.actualSessionMinutes != null && (
            <View style={s.card}>
              <Text style={s.cardLabel}>SESSION SUMMARY</Text>
              <View style={s.metaRow}>
                <Text style={s.dimText}>Actual Duration</Text>
                <Text style={s.whiteText}>
                  {booking.actualSessionMinutes} min
                </Text>
              </View>
              {booking.earlyEndReason && (
                <View style={s.metaRow}>
                  <Text style={s.dimText}>Early End Reason</Text>
                  <Text
                    style={[s.whiteText, { flex: 1, textAlign: "right" }]}
                    numberOfLines={2}
                  >
                    {booking.earlyEndReason}
                  </Text>
                </View>
              )}
              {booking.endedBy && (
                <View style={s.metaRow}>
                  <Text style={s.dimText}>Ended By</Text>
                  <Text style={s.whiteText}>
                    {booking.endedBy === "STUDIO_OWNER"
                      ? "Studio Owner"
                      : "You"}
                  </Text>
                </View>
              )}
              {booking.checkedInAt && (
                <View style={s.metaRow}>
                  <Text style={s.dimText}>Checked In</Text>
                  <Text style={s.whiteText}>
                    {dayjs(booking.checkedInAt).format("h:mm A")}
                  </Text>
                </View>
              )}
              {booking.checkedOutAt && (
                <View style={s.metaRow}>
                  <Text style={s.dimText}>Checked Out</Text>
                  <Text style={s.whiteText}>
                    {dayjs(booking.checkedOutAt).format("h:mm A")}
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Dispute Info */}
        {booking.disputeStatus && (
          <View style={[s.card, { borderColor: T.error }]}>
            <Text style={s.cardLabel}>DISPUTE</Text>
            <View
              style={[
                s.paymentBadge,
                { backgroundColor: "rgba(248,113,113,0.15)" },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={T.error} />
              <Text style={[s.paymentBadgeText, { color: T.error }]}>
                {booking.disputeStatus === "OPEN"
                  ? "Dispute Open"
                  : booking.disputeStatus === "UNDER_REVIEW"
                    ? "Under Review"
                    : booking.disputeStatus}
              </Text>
            </View>
            {booking.disputeReason && (
              <Text style={[s.dimText, { marginTop: 12, lineHeight: 20 }]}>
                {booking.disputeReason}
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        {booking.notes && booking.notes.trim() !== "" && (
          <View style={s.card}>
            <Text style={s.cardLabel}>NOTES</Text>
            <Text style={[s.dimText, { lineHeight: 22 }]}>{booking.notes}</Text>
          </View>
        )}

        {/* Client/Owner Info */}
        {isOwner && booking.client && (
          <View style={s.card}>
            <Text style={s.cardLabel}>CLIENT</Text>
            <View style={s.personRow}>
              <LinearGradient colors={[T.blue, "#2563EB"]} style={s.avatarGrad}>
                <Text style={s.avatarInit}>
                  {booking.client.fullName?.[0] ||
                    booking.client.username?.[0] ||
                    "U"}
                </Text>
              </LinearGradient>
              <View>
                <Text style={s.personName}>
                  {booking.client.fullName || booking.client.username}
                </Text>
                <Text style={s.dimText}>@{booking.client.username}</Text>
              </View>
            </View>
          </View>
        )}

        {isClient && booking.owner && (
          <View style={s.card}>
            <Text style={s.cardLabel}>HOSTED BY</Text>
            <View style={s.personRow}>
              <LinearGradient
                colors={[T.accent, "#D97706"]}
                style={s.avatarGrad}
              >
                <Text style={s.avatarInit}>
                  {booking.owner.fullName?.[0] ||
                    booking.owner.username?.[0] ||
                    "O"}
                </Text>
              </LinearGradient>
              <View>
                <Text style={s.personName}>
                  {booking.owner.fullName || booking.owner.username}
                </Text>
                <Text style={s.dimText}>@{booking.owner.username}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Booking Meta */}
        <View style={s.card}>
          <Text style={s.cardLabel}>BOOKING INFO</Text>
          <View style={s.metaRow}>
            <Text style={s.dimText}>Booking ID</Text>
            <Text style={s.whiteText}>{booking.id.slice(0, 8)}...</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.dimText}>Created</Text>
            <Text style={s.whiteText}>
              {dayjs(booking.createdAt).format("MMM D, YYYY h:mm A")}
            </Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={s.actionsSection}>
          {/* Client: Pay for booking */}
          {(canPay || canPayConfirmed) && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: T.accent }]}
              onPress={handlePay}
            >
              <Ionicons name="card" size={20} color="#000" />
              <Text style={s.actionBtnTextDark}>PAY & HOLD IN ESCROW</Text>
            </TouchableOpacity>
          )}

          {/* Owner: Confirm/Reject pending booking */}
          {canManage && (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[s.actionBtn, { flex: 1, backgroundColor: T.success }]}
                onPress={handleConfirmBooking}
              >
                <Ionicons name="checkmark" size={20} color="#000" />
                <Text style={s.actionBtnTextDark}>CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtnOutline, { flex: 1, borderColor: T.error }]}
                onPress={handleRejectBooking}
              >
                <Text style={[s.actionBtnTextLight, { color: T.error }]}>
                  REJECT
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Owner: Start session — opens QR input for 2FA verification */}
          {canCheckIn && (() => {
            const scheduledStart = new Date(booking.startTime);
            const earliest = new Date(scheduledStart.getTime() - 30 * 60 * 1000);
            const latest = new Date(scheduledStart.getTime() + 15 * 60 * 1000);
            const inWindow = now >= earliest && now <= latest;
            const tooEarly = now < earliest;
            return inWindow ? (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: T.blue }]}
                onPress={handleCheckIn}
                disabled={checkIn.isPending}
              >
                {checkIn.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Ionicons name="play" size={20} color="#FFF" />
                )}
                <Text style={s.actionBtnTextLight}>START SESSION</Text>
              </TouchableOpacity>
            ) : (
              <View style={[s.infoBox, { borderColor: tooEarly ? T.accent : T.error }]}>
                <Ionicons
                  name={tooEarly ? "hourglass-outline" : "close-circle-outline"}
                  size={18}
                  color={tooEarly ? T.accent : T.error}
                />
                <Text style={[s.infoText, { color: tooEarly ? T.accent : T.error }]}>
                  {tooEarly
                    ? `Check-in opens ${dayjs(earliest).fromNow()}`
                    : "Check-in window has expired"}
                </Text>
              </View>
            );
          })()}

          {/* Client: Confirm presence */}
          {canConfirmPresence && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: T.accent }]}
              onPress={() => setShowConfirmCodeModal(true)}
            >
              <Ionicons name="finger-print" size={20} color="#000" />
              <Text style={s.actionBtnTextDark}>CONFIRM PRESENCE</Text>
            </TouchableOpacity>
          )}

          {/* End session */}
          {canEndSession && (
            <TouchableOpacity
              style={[s.actionBtnOutline, { borderColor: T.error }]}
              onPress={() => setShowEndSessionModal(true)}
            >
              <Ionicons name="stop-circle-outline" size={20} color={T.error} />
              <Text style={[s.actionBtnTextLight, { color: T.error }]}>
                END SESSION
              </Text>
            </TouchableOpacity>
          )}

          {/* Client: Confirm session & release payment */}
          {canConfirmSession && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: T.success }]}
              onPress={handleConfirmSession}
            >
              <Ionicons name="checkmark-done" size={20} color="#000" />
              <Text style={s.actionBtnTextDark}>
                CONFIRM SESSION & RELEASE PAYMENT
              </Text>
            </TouchableOpacity>
          )}

          {/* Owner: Awaiting artist payment approval */}
          {isOwner &&
            booking.status === "COMPLETED" &&
            booking.paymentStatus === "PAYMENT_HELD" &&
            !booking.bookerApprovedPayment && (
              <View style={[s.infoBox, { borderColor: T.accent }]}>
                <Ionicons name="time-outline" size={18} color={T.accent} />
                <Text style={[s.infoText, { color: T.accent }]}>
                  Awaiting artist payment approval. Payment auto-releases{" "}
                  {booking.paymentReleaseEligibleAt
                    ? dayjs(booking.paymentReleaseEligibleAt).fromNow()
                    : "in 24h"}{" "}
                  if no dispute is raised.
                </Text>
              </View>
            )}

          {/* Dispute */}
          {canDispute && (
            <TouchableOpacity
              style={[s.actionBtnOutline, { borderColor: T.accent }]}
              onPress={() => setShowDisputeModal(true)}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={T.accent}
              />
              <Text style={[s.actionBtnTextLight, { color: T.accent }]}>
                RAISE DISPUTE
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          {canCancel && (
            <TouchableOpacity
              style={[s.actionBtnOutline, { borderColor: T.error }]}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle-outline" size={20} color={T.error} />
              <Text style={[s.actionBtnTextLight, { color: T.error }]}>
                CANCEL BOOKING
              </Text>
            </TouchableOpacity>
          )}

          {/* Payment release info */}
          {booking.status === "COMPLETED" &&
            booking.paymentReleaseEligibleAt &&
            booking.paymentStatus !== "PAYMENT_RELEASED" && (
              <View style={s.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={T.dim}
                />
                <Text style={s.infoText}>
                  Payment auto-releases{" "}
                  {dayjs(booking.paymentReleaseEligibleAt).fromNow()} if no
                  dispute is raised.
                </Text>
              </View>
            )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* QR CODE MODAL */}
      <Modal visible={showQRModal} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>YOUR QR CODE</Text>
            <View style={s.qrDisplayLarge}>
              <MaterialCommunityIcons
                name="qrcode"
                size={160}
                color={T.accent}
              />
            </View>
            <Text style={[s.qrCode, { fontSize: 18 }]}>{booking.qrCode}</Text>
            <Text style={[s.dimText, { textAlign: "center", marginTop: 8 }]}>
              Show this to the studio owner to check in
            </Text>
            <TouchableOpacity
              style={[
                s.actionBtn,
                { backgroundColor: T.accent, marginTop: 24 },
              ]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={s.actionBtnTextDark}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONFIRM PRESENCE MODAL */}
      <Modal visible={showConfirmCodeModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>CONFIRM PRESENCE</Text>
            <Text style={[s.dimText, { marginBottom: 16 }]}>
              Enter the 6-character code provided by the studio owner
            </Text>
            <TextInput
              style={s.codeInput}
              value={confirmCode}
              onChangeText={setConfirmCode}
              placeholder="ENTER CODE"
              placeholderTextColor={T.dark}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[s.actionBtnOutline, { flex: 1, borderColor: T.dim }]}
                onPress={() => setShowConfirmCodeModal(false)}
              >
                <Text style={[s.actionBtnTextLight, { color: T.dim }]}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { flex: 1, backgroundColor: T.accent }]}
                onPress={handleConfirmPresence}
                disabled={confirmCheckIn.isPending}
              >
                {confirmCheckIn.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={s.actionBtnTextDark}>CONFIRM</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* END SESSION MODAL */}
      <Modal visible={showEndSessionModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>END SESSION</Text>
            {new Date() < new Date(booking.endTime) && (
              <>
                <View style={s.warningBanner}>
                  <Ionicons name="warning-outline" size={16} color={T.accent} />
                  <Text style={s.warningText}>
                    Session is ending early. A reason is required.
                  </Text>
                </View>
                <TextInput
                  style={s.modalInput}
                  value={endReason}
                  onChangeText={setEndReason}
                  placeholder="Reason for ending early..."
                  placeholderTextColor={T.dark}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[s.actionBtnOutline, { flex: 1, borderColor: T.dim }]}
                onPress={() => setShowEndSessionModal(false)}
              >
                <Text style={[s.actionBtnTextLight, { color: T.dim }]}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { flex: 1, backgroundColor: T.error }]}
                onPress={handleEndSession}
                disabled={checkOut.isPending}
              >
                {checkOut.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.actionBtnTextLight}>END SESSION</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DISPUTE MODAL */}
      <Modal visible={showDisputeModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>RAISE DISPUTE</Text>
            <Text style={[s.dimText, { marginBottom: 12 }]}>
              Describe the issue with this session. Be as detailed as possible.
            </Text>
            <TextInput
              style={s.modalInput}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Describe the issue (minimum 10 characters)..."
              placeholderTextColor={T.dark}
              multiline
              numberOfLines={4}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[s.actionBtnOutline, { flex: 1, borderColor: T.dim }]}
                onPress={() => setShowDisputeModal(false)}
              >
                <Text style={[s.actionBtnTextLight, { color: T.dim }]}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { flex: 1, backgroundColor: T.error }]}
                onPress={handleRaiseDispute}
                disabled={raiseDispute.isPending}
              >
                {raiseDispute.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.actionBtnTextLight}>SUBMIT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR CODE INPUT MODAL (Studio Owner — scans/enters artist's QR) */}
      <Modal visible={showQRInputModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>START SESSION</Text>
            <Text style={[s.dimText, { marginBottom: 6, textAlign: "center" }]}>
              Ask the artist to show their QR code, then enter it below to verify and start the session.
            </Text>
            <View style={[s.warningBanner, { marginBottom: 16 }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={T.accent} />
              <Text style={s.warningText}>
                This is a 2-factor verification step — only the artist's code will work.
              </Text>
            </View>
            <TextInput
              style={s.codeInput}
              value={qrCodeInput}
              onChangeText={setQrCodeInput}
              placeholder="BEEPS-XXXXXXXX-XXXXXXXX"
              placeholderTextColor={T.dark}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[s.actionBtnOutline, { flex: 1, borderColor: T.dim }]}
                onPress={() => { setShowQRInputModal(false); setQrCodeInput(""); }}
              >
                <Text style={[s.actionBtnTextLight, { color: T.dim }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { flex: 1, backgroundColor: T.blue }]}
                onPress={handleSubmitQRCheckIn}
                disabled={checkIn.isPending}
              >
                {checkIn.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.actionBtnTextLight}>VERIFY & START</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    letterSpacing: 1,
  },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // Status
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 0.5,
  },

  // Cards
  card: {
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: "Manrope_800ExtraBold",
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  // Timer
  timerText: {
    fontSize: 48,
    fontFamily: "Manrope_800ExtraBold",
    color: T.blue,
    textAlign: "center",
  },
  timerSubtext: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: T.blue,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: T.surfaceHi,
    borderRadius: 3,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressMetaText: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: T.dim,
  },

  // Date
  dateTimeRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  dateBlock: {
    width: 80,
    alignItems: "center",
    backgroundColor: T.surfaceHi,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  dateMonth: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: T.accent,
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    marginVertical: 2,
  },
  dateWeekday: { fontSize: 12, fontFamily: "Manrope_500Medium", color: T.dim },
  timeLabel: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: T.dim,
    letterSpacing: 1,
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    color: "#FFF",
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: T.accent,
  },

  // Studio
  studioRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  studioIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: T.surfaceHi,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  studioName: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#FFF",
    marginBottom: 4,
  },

  // QR
  qrDisplay: { alignItems: "center", gap: 12 },
  qrDisplayLarge: { alignItems: "center", marginVertical: 24 },
  qrCode: {
    fontSize: 14,
    fontFamily: "Manrope_800ExtraBold",
    color: T.accent,
    letterSpacing: 2,
  },

  // Payment
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  paymentBadgeText: { fontSize: 12, fontFamily: "Manrope_700Bold" },
  priceBreakdown: { marginTop: 4 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontFamily: "Manrope_700Bold", color: "#FFF" },
  totalValue: {
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
    color: T.accent,
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  // Person
  personRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInit: {
    fontSize: 18,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
  },
  personName: { fontSize: 16, fontFamily: "Manrope_700Bold", color: "#FFF" },

  // Text helpers
  dimText: { fontSize: 13, fontFamily: "Manrope_500Medium", color: T.dim },
  whiteText: { fontSize: 14, fontFamily: "Manrope_600SemiBold", color: "#FFF" },

  // Actions
  actionsSection: { gap: 12, marginTop: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnTextDark: {
    fontSize: 14,
    fontFamily: "Manrope_800ExtraBold",
    color: "#000",
    letterSpacing: 0.5,
  },
  actionBtnTextLight: {
    fontSize: 14,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    letterSpacing: 0.5,
  },

  // Warning
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.1)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  warningText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: T.accent,
    flex: 1,
  },

  // Info box
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: T.surfaceHi,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: T.dim,
    flex: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: T.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: T.surfaceHi,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: "#FFF",
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: T.border,
    marginTop: 8,
  },
  codeInput: {
    backgroundColor: T.surfaceHi,
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    textAlign: "center",
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
});
