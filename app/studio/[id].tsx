import { useAuth } from "@/contexts/AuthContext";
import { useCreateBooking, useStudioBookings } from "@/hooks/useBookings";
import { supabase } from "@/lib/supabase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Constants for the Premium Dark Look ---
const DARK_THEME = {
  bg: "#000000",
  surface: "#111111",
  surfaceHighlight: "#1A1A1A",
  text: "#FFFFFF",
  textDim: "rgba(255, 255, 255, 0.6)",
  textDark: "rgba(255, 255, 255, 0.3)",
  accent: "#6C63FF",
  border: "rgba(255, 255, 255, 0.1)",
  success: "#00E096",
  error: "#FF453A",
};

const { width } = Dimensions.get("window");
const IMG_HEIGHT = 350;

type TabType = "details" | "equipment" | "reviews";

export default function StudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const colors = DARK_THEME;

  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs()); // View state for calendar

  const [selectedTime, setSelectedTime] = useState("");
  const [sessionLength, setSessionLength] = useState(2);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("details");

  const createBooking = useCreateBooking();

  // --- Data Fetching ---
  const { data: studio, isLoading } = useQuery({
    queryKey: ["studio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studios")
        .select(
          `*, studio_owner_profiles!owner_id (id, users!user_id (id, username, full_name, avatar))`,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      const ownerProfile = data.studio_owner_profiles;
      const ownerUser = ownerProfile?.users;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        ownerId: data.owner_id,
        location: data.location,
        city: data.city,
        state: data.state,
        country: data.country,
        hourlyRate: data.hourly_rate,
        equipment: data.equipment || [],
        capacity: data.capacity,
        imageUrl: data.image_url,
        rating: data.rating || 0,
        reviewsCount: data.reviews_count || 0,
        isActive: data.is_active,
        createdAt: data.created_at,
        owner: {
          id: ownerUser?.id || "",
          username: ownerUser?.username || "",
          fullName: ownerUser?.full_name,
          avatar: ownerUser?.avatar,
        },
      };
    },
    enabled: !!id,
  });

  const { data: existingBookings = [] } = useStudioBookings(id);

  const amenities = [
    { icon: "wifi", label: "Fast WiFi" },
    { icon: "car", label: "Parking" },
    { icon: "coffee", label: "Coffee" },
    { icon: "sofa", label: "Lounge" },
    { icon: "volume-off", label: "Soundproof" },
  ];

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  // --- Helper: Generate Calendar Days ---
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startDayOfWeek = startOfMonth.day(); // 0 (Sunday) - 6 (Saturday)
    const daysInMonth = currentMonth.daysInMonth();

    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ key: `empty-${i}`, day: null });
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        key: i.toString(),
        day: i,
        date: currentMonth.date(i),
      });
    }

    return days;
  }, [currentMonth]);

  const changeMonth = (direction: -1 | 1) => {
    setCurrentMonth((prev) => prev.add(direction, "month"));
  };

  // --- Logic Functions ---
  const isTimeSlotAvailable = (time: string) => {
    if (!existingBookings || existingBookings.length === 0) return true;
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return true;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const slotStart = selectedDate.hour(hours).minute(minutes).second(0);
    const slotEnd = slotStart.add(sessionLength, "hour");

    return !existingBookings.some((booking) => {
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);
      const bookingDate = bookingStart.format("YYYY-MM-DD");
      const selectedDateStr = selectedDate.format("YYYY-MM-DD");

      if (bookingDate !== selectedDateStr) return false;
      if (booking.status === "CANCELLED") return false;

      return (
        (slotStart.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart)) ||
        slotStart.isSame(bookingStart) ||
        slotEnd.isSame(bookingEnd)
      );
    });
  };

  const handleBooking = async () => {
    if (!user || !studio) {
      Alert.alert("Error", "Please sign in to book a studio");
      return;
    }
    if (!selectedTime) {
      Alert.alert("Select Time", "Please select a time slot");
      return;
    }
    if (!isTimeSlotAvailable(selectedTime)) {
      Alert.alert("Unavailable", "This time slot is booked.");
      return;
    }

    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const startDate = selectedDate
      .hour(hours)
      .minute(minutes)
      .second(0)
      .toDate();
    const endDate = selectedDate
      .hour(hours)
      .minute(minutes)
      .add(sessionLength, "hour")
      .second(0)
      .toDate();
    const totalAmount = studio.hourlyRate * sessionLength;

    try {
      await createBooking.mutateAsync({
        studioId: studio.id,
        userId: user.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        totalAmount,
        notes,
      });

      Alert.alert("Success", "Request sent! Waiting for owner confirmation.", [
        {
          text: "OK",
          onPress: () => {
            setBookingModalVisible(false);
            router.push("/(tabs)/bookings");
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create booking.");
    }
  };

  const handleChat = () => {
    // Navigate to chat screen or open modal
    Alert.alert("Coming Soon", "Chat functionality is under development.");
  };

  const calculateBookingPrice = () =>
    studio ? studio.hourlyRate * sessionLength : 0;
  const calculateServiceFee = () => calculateBookingPrice() * 0.1;
  const calculateTotal = () => calculateBookingPrice() + calculateServiceFee();

  // --- Rendering ---

  if (isLoading || !studio) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const heroImageSource = studio.imageUrl
    ? { uri: studio.imageUrl }
    : {
        uri: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
      };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={heroImageSource}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.3)",
                "rgba(0,0,0,0.0)",
                "rgba(0,0,0,0.8)",
                "#000000",
              ]}
              style={styles.heroGradient}
            >
              <SafeAreaView style={styles.headerSafeArea}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.roundButtonBlur}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
              </SafeAreaView>

              <View style={styles.heroContent}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {studio.rating.toFixed(1)} ({studio.reviewsCount})
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{studio.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.textDim}
                  />
                  <Text style={styles.locationText}>
                    {[studio.city, studio.state].filter(Boolean).join(", ") ||
                      studio.location}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Tab Navigation (Sticky) */}
        <View style={styles.stickyTabs}>
          <View style={styles.tabContainer}>
            {(["details", "equipment", "reviews"] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Content Body */}
        <View style={styles.bodyContent}>
          {activeTab === "details" && (
            <View style={styles.sectionFade}>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>
                  ${studio.hourlyRate}
                  <Text style={styles.priceUnit}>/hr</Text>
                </Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Instant Book</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>About</Text>
              <Text style={styles.descriptionText}>
                {studio.description || "No description provided."}
              </Text>

              <Text style={styles.sectionHeader}>Amenities</Text>
              <View style={styles.gridContainer}>
                {amenities.map((item, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <View style={styles.iconBox}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={20}
                        color={colors.text}
                      />
                    </View>
                    <Text style={styles.amenityText}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionHeader}>Hosted By</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  {studio.owner.avatar ? (
                    <ImageBackground
                      source={{ uri: studio.owner.avatar }}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <Text style={styles.avatarInitials}>
                      {studio.owner.username.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View>
                  <Text style={styles.ownerName}>
                    {studio.owner.fullName || studio.owner.username}
                  </Text>
                  <Text style={styles.ownerRole}>Studio Owner</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === "equipment" && (
            <View style={styles.sectionFade}>
              <Text style={styles.sectionHeader}>Gear List</Text>
              {studio.equipment && studio.equipment.length > 0 ? (
                studio.equipment.map((item, i) => (
                  <View key={i} style={styles.equipmentRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.equipmentText}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No equipment listed.</Text>
              )}
            </View>
          )}

          {activeTab === "reviews" && (
            <View style={styles.sectionFade}>
              <Text style={styles.sectionHeader}>Reviews</Text>
              <Text style={styles.emptyText}>No reviews yet.</Text>
            </View>
          )}

          {/* Spacer for bottom bar */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Bar - UPDATED */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)", "#000"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
        <View style={styles.bottomContainer}>
          {/* Chat Button */}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChat}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Book Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setBookingModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Book Studio</Text>
            <Ionicons name="calendar" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dark Mode Booking Modal */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Booking</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={30}
                  color={colors.textDim}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* --- CUSTOM CALENDAR IMPLEMENTATION --- */}
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => changeMonth(-1)}
                    style={styles.calendarArrow}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthTitle}>
                    {currentMonth.format("MMMM YYYY")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => changeMonth(1)}
                    style={styles.calendarArrow}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>

                {/* Weekday Labels */}
                <View style={styles.weekDaysRow}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <Text key={i} style={styles.weekDayText}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calendarGrid}>
                  {calendarDays.map((item, index) => {
                    if (!item.day) {
                      return <View key={index} style={styles.dayCell} />;
                    }

                    const isSelected =
                      item.date &&
                      selectedDate.format("YYYY-MM-DD") ===
                        item.date.format("YYYY-MM-DD");
                    const isToday =
                      item.date &&
                      item.date.format("YYYY-MM-DD") ===
                        dayjs().format("YYYY-MM-DD");
                    const isPast =
                      item.date && item.date.isBefore(dayjs(), "day");

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          isToday && !isSelected && styles.dayCellToday,
                        ]}
                        disabled={!!isPast}
                        onPress={() => item.date && setSelectedDate(item.date)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isPast && styles.dayTextDisabled,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.selectedDateText}>
                  Selected: {selectedDate.format("dddd, MMMM D")}
                </Text>
              </View>

              {/* Time Slots */}
              <Text style={styles.inputLabel}>Start Time</Text>
              <View style={styles.wrapGrid}>
                {timeSlots.map((time) => {
                  const isAvailable = isTimeSlotAvailable(time);
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      disabled={!isAvailable}
                      onPress={() => setSelectedTime(time)}
                      style={[
                        styles.timeChip,
                        !isAvailable && styles.timeChipDisabled,
                        isSelected && styles.timeChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          !isAvailable && styles.timeTextDisabled,
                          isSelected && styles.textSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration */}
              <Text style={styles.inputLabel}>Duration</Text>
              <View style={styles.durationRow}>
                {[2, 4, 8].map((hrs) => (
                  <TouchableOpacity
                    key={hrs}
                    onPress={() => setSessionLength(hrs)}
                    style={[
                      styles.durationBtn,
                      sessionLength === hrs && styles.durationBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        sessionLength === hrs && styles.textSelected,
                      ]}
                    >
                      {hrs} Hours
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Receipt / Total */}
              <View style={styles.receiptContainer}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Rate</Text>
                  <Text style={styles.receiptValue}>
                    ${studio.hourlyRate} x {sessionLength}hrs
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Service Fee</Text>
                  <Text style={styles.receiptValue}>
                    ${calculateServiceFee().toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ${calculateTotal().toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedTime || createBooking.isPending) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={handleBooking}
                disabled={!selectedTime || createBooking.isPending}
              >
                {createBooking.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME.bg,
  },
  // Hero
  heroContainer: {
    height: IMG_HEIGHT,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  headerSafeArea: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  roundButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ratingText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    color: DARK_THEME.textDim,
    fontSize: 14,
    marginLeft: 4,
  },

  // Tabs
  stickyTabs: {
    backgroundColor: DARK_THEME.bg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DARK_THEME.surfaceHighlight,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
  },
  tab: {
    marginRight: 24,
    paddingVertical: 10,
    position: "relative",
  },
  tabActive: {},
  tabText: {
    color: DARK_THEME.textDim,
    fontSize: 16,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFF",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: DARK_THEME.accent,
    shadowColor: DARK_THEME.accent,
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },

  // Body
  bodyContent: {
    padding: 20,
  },
  sectionFade: {
    // animation hooks could go here
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: DARK_THEME.border,
  },
  priceValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "700",
  },
  priceUnit: {
    fontSize: 14,
    color: DARK_THEME.textDim,
    fontWeight: "400",
  },
  tag: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  tagText: {
    color: DARK_THEME.accent,
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 16,
    marginTop: 8,
  },
  descriptionText: {
    color: DARK_THEME.textDim,
    lineHeight: 24,
    fontSize: 15,
    marginBottom: 24,
  },

  // Amenities
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  amenityItem: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DARK_THEME.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  amenityText: {
    color: DARK_THEME.textDim,
    fontSize: 12,
  },

  // Owner
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK_THEME.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    marginRight: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  ownerName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  ownerRole: {
    color: DARK_THEME.textDim,
    fontSize: 12,
  },

  // Equipment
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: DARK_THEME.surface,
    padding: 12,
    borderRadius: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DARK_THEME.accent,
    marginRight: 12,
  },
  equipmentText: {
    color: "#FFF",
    fontSize: 14,
  },
  emptyText: {
    color: DARK_THEME.textDark,
    fontStyle: "italic",
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomContainer: {
    flexDirection: "row", // Changed to row
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12, // Gap between Chat and Book
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)", // Glass effect
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)", // Works on iOS mostly
  },
  primaryButton: {
    flex: 1, // Takes remaining space
    backgroundColor: "#FFF",
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#111",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "90%", // Made slightly taller for calendar
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    borderTopWidth: 1,
    borderTopColor: DARK_THEME.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  inputLabel: {
    color: DARK_THEME.textDim,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: "600",
    marginTop: 20,
  },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: DARK_THEME.surfaceHighlight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonthTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  calendarArrow: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 8,
  },
  weekDayText: {
    width: "14.28%", // 100 / 7
    textAlign: "center",
    color: DARK_THEME.textDim,
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: DARK_THEME.accent,
  },
  dayCellSelected: {
    backgroundColor: DARK_THEME.accent,
    borderColor: DARK_THEME.accent,
  },
  dayText: {
    color: "#FFF",
    fontSize: 14,
  },
  dayTextDisabled: {
    color: DARK_THEME.textDark,
  },
  dayTextSelected: {
    color: "#FFF",
    fontWeight: "bold",
  },
  selectedDateText: {
    color: DARK_THEME.accent,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },

  // Time & Duration
  wrapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: DARK_THEME.surfaceHighlight,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  timeChipDisabled: {
    opacity: 0.3,
  },
  timeChipSelected: {
    backgroundColor: "#FFF",
    borderColor: "#FFF",
  },
  timeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  timeTextDisabled: {
    textDecorationLine: "line-through",
  },
  textSelected: {
    color: "#000",
  },
  durationRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: DARK_THEME.surfaceHighlight,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  durationBtnSelected: {
    backgroundColor: "#FFF",
    borderColor: "#FFF",
  },
  durationText: {
    color: "#FFF",
    fontWeight: "600",
  },
  receiptContainer: {
    backgroundColor: DARK_THEME.surfaceHighlight,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  receiptLabel: {
    color: DARK_THEME.textDim,
    fontSize: 14,
  },
  receiptValue: {
    color: "#FFF",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: DARK_THEME.border,
    marginVertical: 12,
  },
  totalLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    color: DARK_THEME.accent,
    fontSize: 20,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: DARK_THEME.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: DARK_THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
