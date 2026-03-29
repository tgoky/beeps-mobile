import { useAuth } from "@/contexts/AuthContext";
import { useCreateBooking, useStudioBookings } from "@/hooks/useBookings";
import { supabase } from "@/lib/supabase";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
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

// --- Constants for the Premium Dark Look ---
const DARK_THEME = {
  bg: "#000000",
  surface: "#0A0A0A", // Card Black
  surfaceHighlight: "#151515", // Slightly lighter for inputs
  text: "#FFFFFF",
  textDim: "#888888",
  textDark: "#444444",
  accent: "#f59e0b", // Amber
  border: "#222222",
  success: "#00E096",
  error: "#FF453A",
};

const { width } = Dimensions.get("window");
const IMG_HEIGHT = 400; // Taller hero image for impact

type TabType = "details" | "equipment" | "reviews";

export default function StudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const iconScale = useRef(new Animated.Value(0)).current;

  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());

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
    const startDayOfWeek = startOfMonth.day();
    const daysInMonth = currentMonth.daysInMonth();
    const days = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ key: `empty-${i}`, day: null });
    }

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

  // Animation Effect
  useEffect(() => {
    if (bookingSuccess) {
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      iconScale.setValue(0);
    }
  }, [bookingSuccess]);

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

      setBookingSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create booking. Please try again.");
    }
  };

  const handleNegotiate = () => {
    Alert.alert(
      "Start Negotiation",
      "This feature will allow you to offer a custom price to the studio owner.",
    );
  };

  const handleChat = () => {
    Alert.alert("Coming Soon", "Chat functionality is under development.");
  };

  const calculateBookingPrice = () =>
    studio ? studio.hourlyRate * sessionLength : 0;
  const calculateServiceFee = () => calculateBookingPrice() * 0.1;
  const calculateTotal = () => calculateBookingPrice() + calculateServiceFee();

  const renderSuccessView = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconBg}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={DARK_THEME.success}
          />
        </Animated.View>
      </View>

      <Text style={styles.successTitle}>REQUEST SENT!</Text>
      <Text style={styles.successMessage}>
        Your booking request has been sent to the studio owner. You will be
        notified once they accept.
      </Text>

      <TouchableOpacity
        style={styles.successButton}
        onPress={() => {
          setBookingModalVisible(false);
          setBookingSuccess(false); // Reset
          router.push({
            pathname: "/(tabs)/bookings",
            params: {
              initialView: "bookings",
              initialBookingView: "my_bookings",
            },
          });
        }}
      >
        <Text style={styles.successButtonText}>VIEW MY BOOKINGS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeSuccessButton}
        onPress={() => {
          setBookingModalVisible(false);
          setBookingSuccess(false);
        }}
      >
        <Text style={styles.closeSuccessText}>CLOSE</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Rendering ---

  if (isLoading || !studio || !fontsLoaded) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={DARK_THEME.accent} />
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
                {/* Rating Badge */}
                <View style={styles.sleekRatingPill}>
                  <Ionicons name="star" size={12} color={DARK_THEME.accent} />
                  <Text style={styles.ratingText}>
                    {studio.rating.toFixed(1)}{" "}
                    <Text style={{ color: DARK_THEME.textDim }}>
                      ({studio.reviewsCount})
                    </Text>
                  </Text>
                </View>

                <Text style={styles.heroTitle}>{studio.name}</Text>

                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={DARK_THEME.textDim}
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
                style={styles.tab}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.toUpperCase()}
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
                  <Text style={styles.tagText}>INSTANT BOOK</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>ABOUT</Text>
              <Text style={styles.descriptionText}>
                {studio.description || "No description provided."}
              </Text>

              <Text style={styles.sectionHeader}>AMENITIES</Text>
              <View style={styles.gridContainer}>
                {amenities.map((item, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <View style={styles.iconBox}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={20}
                        color={DARK_THEME.text}
                      />
                    </View>
                    <Text style={styles.amenityText}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionHeader}>HOSTED BY</Text>
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
              <Text style={styles.sectionHeader}>GEAR LIST</Text>
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
              <Text style={styles.sectionHeader}>REVIEWS</Text>
              <Text style={styles.emptyText}>No reviews yet.</Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)", "#000"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChat}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setBookingModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>BOOK STUDIO</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
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

            {/* CONDITIONAL RENDERING STARTS HERE */}
            {bookingSuccess ? (
              renderSuccessView()
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>REQUEST BOOKING</Text>
                  <TouchableOpacity
                    onPress={() => setBookingModalVisible(false)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={DARK_THEME.textDim}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Calendar */}
                  <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity
                        onPress={() => changeMonth(-1)}
                        style={styles.calendarArrow}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={20}
                          color={DARK_THEME.text}
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
                          color={DARK_THEME.text}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.weekDaysRow}>
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <Text key={i} style={styles.weekDayText}>
                          {day}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.calendarGrid}>
                      {calendarDays.map((item, index) => {
                        if (!item.day)
                          return <View key={index} style={styles.dayCell} />;

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
                            onPress={() =>
                              item.date && setSelectedDate(item.date)
                            }
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

                  {/* Time Slots (Centered) */}
                  <Text style={styles.inputLabel}>START TIME</Text>
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

                  {/* Duration (Includes 1 Hour) */}
                  <Text style={styles.inputLabel}>DURATION</Text>
                  <View style={styles.durationRow}>
                    {[1, 2, 4, 8].map((hrs) => (
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
                          {hrs}H
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Notes */}
                  <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
                  <View style={styles.notesInputContainer}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Any special requests or requirements..."
                      placeholderTextColor={DARK_THEME.textDark}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                    />
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
                      <Text style={styles.totalLabel}>TOTAL</Text>
                      <Text style={styles.totalValue}>
                        ${calculateTotal().toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* --- NEGOTIATE & CONFIRM BUTTONS --- */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.negotiateButton}
                      onPress={handleNegotiate}
                    >
                      <Text style={styles.negotiateButtonText}>NEGOTIATE</Text>
                    </TouchableOpacity>

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
                        <Text style={styles.confirmButtonText}>CONFIRM</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
            {/* CONDITIONAL RENDERING ENDS HERE */}
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 36,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    letterSpacing: -1,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // RATING PILL
  sleekRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ratingText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
    marginLeft: 6,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    color: "#CCC",
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    marginLeft: 6,
  },

  // Tabs
  stickyTabs: {
    backgroundColor: DARK_THEME.bg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DARK_THEME.surface,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 30,
  },
  tab: {
    paddingVertical: 8,
    position: "relative",
  },
  tabActive: {},
  tabText: {
    color: DARK_THEME.textDim,
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: "#FFF",
    fontFamily: "Manrope_800ExtraBold",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: DARK_THEME.accent,
  },

  // Body
  bodyContent: {
    padding: 20,
  },
  sectionFade: {},
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
    fontFamily: "Manrope_800ExtraBold",
  },
  priceUnit: {
    fontSize: 16,
    color: DARK_THEME.textDim,
    fontFamily: "Manrope_500Medium",
  },
  tag: {
    backgroundColor: DARK_THEME.surfaceHighlight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  tagText: {
    color: DARK_THEME.accent,
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  descriptionText: {
    color: "#CCC",
    lineHeight: 24,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    marginBottom: 30,
  },

  // Amenities
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 30,
  },
  amenityItem: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 20,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: DARK_THEME.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  amenityText: {
    color: DARK_THEME.textDim,
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#222",
    marginRight: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
  },
  ownerName: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  ownerRole: {
    color: DARK_THEME.textDim,
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    marginTop: 2,
  },

  // Equipment
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: DARK_THEME.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DARK_THEME.accent,
    marginRight: 14,
  },
  equipmentText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
  emptyText: {
    color: DARK_THEME.textDark,
    fontFamily: "Manrope_500Medium",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DARK_THEME.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: DARK_THEME.accent,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: DARK_THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryButtonText: {
    color: "#000",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0A0A0A", // Slightly lighter than pure black
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "90%",
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
    fontSize: 22,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  inputLabel: {
    color: DARK_THEME.textDim,
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 20,
  },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: DARK_THEME.surfaceHighlight,
    borderRadius: 20,
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
    fontFamily: "Manrope_700Bold",
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
    width: "14.28%",
    textAlign: "center",
    color: DARK_THEME.textDim,
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
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
    borderRadius: 10,
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
    fontFamily: "Manrope_500Medium",
  },
  dayTextDisabled: {
    color: DARK_THEME.textDark,
  },
  dayTextSelected: {
    color: "#000",
    fontFamily: "Manrope_800ExtraBold",
  },
  selectedDateText: {
    color: DARK_THEME.accent,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
    fontFamily: "Manrope_600SemiBold",
  },

  // Time & Duration
  wrapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Better spacing
    gap: 10,
    marginBottom: 10,
  },
  timeChip: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: DARK_THEME.surfaceHighlight,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
    width: "30%", // 3 columns
    alignItems: "center",
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
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
  },
  timeTextDisabled: {
    textDecorationLine: "line-through",
  },
  textSelected: {
    color: "#000",
    fontFamily: "Manrope_700Bold",
  },
  notesInputContainer: {
    backgroundColor: DARK_THEME.surfaceHighlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_THEME.border,
    marginBottom: 20,
  },
  notesInput: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    padding: 16,
    minHeight: 80,
    textAlignVertical: "top",
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
    fontFamily: "Manrope_600SemiBold",
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
    fontFamily: "Manrope_500Medium",
  },
  receiptValue: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: DARK_THEME.border,
    marginVertical: 12,
  },
  totalLabel: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  totalValue: {
    color: DARK_THEME.accent,
    fontSize: 20,
    fontFamily: "Manrope_800ExtraBold",
  },

  // --- SPLIT ACTION BUTTONS ---
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  negotiateButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DARK_THEME.border,
  },
  negotiateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  confirmButton: {
    flex: 1,
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
    color: "#000",
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
  },

  // SUCCESS VIEW STYLES
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 224, 150, 0.1)", // Subtle green glow
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 224, 150, 0.2)",
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFF",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: DARK_THEME.textDim,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: "Manrope_500Medium",
  },
  successButton: {
    backgroundColor: DARK_THEME.accent,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: DARK_THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  successButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
  },
  closeSuccessButton: {
    paddingVertical: 12,
  },
  closeSuccessText: {
    color: DARK_THEME.textDim,
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
  },
});
