import CreateClubModal from "@/components/CreateClubModal";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useClubs, useMyClubs } from "@/hooks/useClubs";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Enable LayoutAnimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const GAP = 12;
const PADDING = 20;
const GRID_ITEM_WIDTH = (width - PADDING * 2 - GAP * 2) / 3;

const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#151515",
  pureWhite: "#FFFFFF",
  offWhite: "#F5F5F5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",
  badgeBlue: "#2563eb",
  red: "#D50000",
};

// --- ANIMATION COMPONENTS ---

// 1. Staggered Entrance (Slide Up + Fade)
const FadeInUp = ({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: any;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[style, { opacity: anim, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
};

// 2. Tactile Button (Squish Effect on Press)
const BouncyCard = ({ onPress, style, children, delay = 0 }: any) => {
  const scale = useRef(new Animated.Value(0)).current; // Start at 0 for entrance
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale: Animated.multiply(scale, pressScale) }] },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// 3. Attention Pulse (Breathing Effect)
const PulseBadge = ({ children, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

// --- TERMS MODAL COMPONENT ---
const CommunityTermsModal = ({
  visible,
  onClose,
  onAccept,
  type,
}: {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  type: "artist" | "producer";
}) => {
  const communityName = type === "artist" ? "Artist" : "Producer";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={Platform.OS === "android"}
    >
      <View style={styles.modalWrapper}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>COMMUNITY GUIDELINES</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textGrey} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconHeader}>
              <View style={styles.shieldIcon}>
                <MaterialCommunityIcons
                  name={type === "artist" ? "microphone-variant" : "speaker"}
                  size={48}
                  color={COLORS.accent}
                />
              </View>
              <Text style={styles.welcomeTextModal}>
                Welcome to the {communityName} Community
              </Text>
              <Text style={styles.welcomeSubText}>
                To ensure a safe and creative environment for everyone, please
                agree to the following rules before entering.
              </Text>
            </View>

            {/* ANIMATED RULES LIST */}
            <View style={styles.rulesContainer}>
              <FadeInUp delay={100}>
                <RuleItem
                  icon="hand-shake"
                  title="Respect Everyone"
                  desc="Harassment, hate speech, and bullying will result in an immediate ban. Be cool."
                />
              </FadeInUp>
              <FadeInUp delay={200}>
                <RuleItem
                  icon="copyright"
                  title="Respect Copyright"
                  desc="Only upload beats, lyrics, and content you own or have rights to. No stealing flows."
                />
              </FadeInUp>
              <FadeInUp delay={300}>
                <RuleItem
                  icon="message-alert"
                  title="No Spamming"
                  desc="Don't spam collaborations or self-promo in inappropriate channels."
                />
              </FadeInUp>
              <FadeInUp delay={400}>
                <RuleItem
                  icon="account-check"
                  title="Authenticity"
                  desc="Be yourself. Impersonating other artists or producers is not allowed."
                />
              </FadeInUp>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.legalFinePrint}>
              By clicking "I Agree", you acknowledge that you have read and
              understood our full Terms of Service and Privacy Policy.
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.declineButton} onPress={onClose}>
                <Text style={styles.declineText}>DECLINE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                <Text style={styles.acceptText}>I AGREE & ENTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const RuleItem = ({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) => (
  <View style={styles.ruleItem}>
    <View style={styles.ruleIconBox}>
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.pureWhite} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <Text style={styles.ruleDesc}>{desc}</Text>
    </View>
  </View>
);

// --- MAIN SCREEN ---
export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // TERMS STATE
  const [termsVisible, setTermsVisible] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [selectedCommunityType, setSelectedCommunityType] = useState<
    "artist" | "producer"
  >("artist");
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const {
    data: clubs,
    isLoading: clubsLoading,
    refetch: refetchClubs,
  } = useClubs();
  const { data: myClubs, refetch: refetchMyClubs } = useMyClubs(user?.id);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchClubs(), refetchMyClubs()]);
    setRefreshing(false);
  };

  const filteredClubs = clubs?.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCommunityPress = (type: "artist" | "producer", route: string) => {
    setSelectedCommunityType(type);
    if (hasAcceptedTerms) {
      router.push(route as any);
    } else {
      setTargetRoute(route);
      setTermsVisible(true);
    }
  };

  const handleAcceptTerms = () => {
    setHasAcceptedTerms(true);
    setTermsVisible(false);
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchSection}>
        <Ionicons
          name="search"
          size={20}
          color={COLORS.textGrey}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clubs..."
          placeholderTextColor={COLORS.textGrey}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.textGrey} />
          </TouchableOpacity>
        )}
      </View>
      <NotificationBell />
    </View>
  );

  const renderHeroSection = () => (
    <View style={styles.heroContainer}>
      {/* 1. Stats Card - Slide Up */}
      <FadeInUp delay={0}>
        <View style={styles.blackCard}>
          <View style={styles.blackCardTop}>
            <Text style={styles.blackCardLabel}>COMMUNITY STATUS</Text>
            <View style={styles.historyPill}>
              <Text style={styles.historyText}>Clubs Created</Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={COLORS.cardBlack}
              />
            </View>
          </View>

          <Text style={styles.welcomeText}>
            Hello, {user?.fullName?.split(" ")[0]}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>Active in</Text>
            <Text style={styles.balanceAmount}>{myClubs?.length || 0}</Text>
            <Ionicons
              name="eye"
              size={20}
              color="#666"
              style={{ marginLeft: 10 }}
            />
          </View>

          {/* 2. Community Buttons INSIDE THE CARD */}
          <View style={styles.badgeRow}>
            <BouncyCard
              delay={150}
              style={styles.blueBadge}
              onPress={() =>
                handleCommunityPress("artist", "/community/artist")
              }
            >
              <View style={styles.patternContainer}>
                <MaterialCommunityIcons
                  name="waveform"
                  size={90}
                  color="rgba(255,255,255,0.2)"
                />
              </View>
              <Text style={styles.blueBadgeText}>ARTISTS{"\n"}COMMUNITY</Text>
            </BouncyCard>

            <View style={{ width: 12 }} />

            <BouncyCard
              delay={250}
              style={styles.blueBadge}
              onPress={() =>
                handleCommunityPress("producer", "/community/producer")
              }
            >
              <View
                style={[styles.patternContainer, { right: -10, bottom: -20 }]}
              >
                <MaterialCommunityIcons
                  name="tune"
                  size={90}
                  color="rgba(255,255,255,0.2)"
                />
              </View>
              <Text style={styles.blueBadgeText}>PRODUCERS{"\n"}COMMUNITY</Text>
            </BouncyCard>
          </View>
        </View>
      </FadeInUp>
    </View>
  );

  const renderPromoBanner = () => (
    <FadeInUp delay={350}>
      <View style={styles.promoContainer}>
        <View style={styles.promoPatternContainer}>
          <MaterialCommunityIcons
            name="playlist-music"
            size={120}
            color="rgba(0,0,0,0.06)"
          />
        </View>

        <View style={styles.promoContent}>
          <Text style={[styles.promoLabel, { color: "#000000" }]}>
            JOIN CLUBS & COMMUNITIES
          </Text>
          <Text style={styles.promoTitle}>
            GET CREATIVE{"\n"}CREATE YOUR MAGIC!
          </Text>

          <TouchableOpacity
            style={[styles.promoButton, { backgroundColor: COLORS.accent }]}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.promoButtonText}>JOIN CLUB</Text>
          </TouchableOpacity>
        </View>

        {/* PULSING ATTENTION BADGE */}
        <PulseBadge
          style={[styles.promoBadge, { backgroundColor: COLORS.accent }]}
        >
          <Text style={styles.promoBadgeText}>NEW</Text>
        </PulseBadge>

        <View style={styles.promoDecoration}>
          <MaterialCommunityIcons
            name="party-popper"
            size={40}
            color={COLORS.accent}
          />
        </View>
      </View>
    </FadeInUp>
  );

  const renderMyClubsSection = () => {
    if (clubsLoading) return null;
    const myClubsList = myClubs || [];
    if (myClubsList.length === 0) return null;

    const DISPLAY_LIMIT = 6;
    const shouldTruncate = myClubsList.length > DISPLAY_LIMIT;
    const clubsToDisplay = shouldTruncate
      ? myClubsList.slice(0, 5)
      : myClubsList;
    const remainingCount = myClubsList.length - 5;

    return (
      <View style={styles.sectionContainer}>
        <FadeInUp delay={400}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              My Clubs
            </Text>
            {shouldTruncate && (
              <Text
                style={{
                  color: COLORS.accent,
                  fontSize: 12,
                  fontFamily: "Manrope_700Bold",
                }}
              >
                SEE ALL
              </Text>
            )}
          </View>
        </FadeInUp>

        <View style={styles.gridContainer}>
          {clubsToDisplay.map((club, index) => (
            <FadeInUp key={club.id} delay={450 + index * 50}>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => router.push(`/club/${club.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.gridIconContainer}>
                  <Text style={{ fontSize: 24 }}>{club.icon || "🎸"}</Text>
                </View>
                <Text style={styles.gridLabel} numberOfLines={1}>
                  {club.name}
                </Text>
              </TouchableOpacity>
            </FadeInUp>
          ))}

          {shouldTruncate && (
            <FadeInUp delay={450 + clubsToDisplay.length * 50}>
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  { backgroundColor: "#222", borderColor: COLORS.accent },
                ]}
                onPress={() => router.push("/my-clubs")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.gridIconContainer,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: COLORS.accent,
                      fontFamily: "Manrope_800ExtraBold",
                    }}
                  >
                    +{remainingCount}
                  </Text>
                </View>
                <Text style={[styles.gridLabel, { color: COLORS.accent }]}>
                  See More
                </Text>
              </TouchableOpacity>
            </FadeInUp>
          )}
        </View>
      </View>
    );
  };

  const renderExploreClubsSection = () => {
    if (clubsLoading)
      return (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      );
    const displayClubs = filteredClubs || [];

    return (
      <View style={styles.sectionContainer}>
        <FadeInUp delay={500}>
          <Text style={styles.sectionTitle}>
            Explore Clubs or Join Communities
          </Text>
        </FadeInUp>

        {displayClubs.length === 0 && searchQuery.length > 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No clubs found matching "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {displayClubs.map((club, index) => (
              <FadeInUp key={club.id} delay={550 + index * 50}>
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => router.push(`/club/${club.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridIconContainer}>
                    <Text style={{ fontSize: 24 }}>{club.icon || "🎸"}</Text>
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {club.name}
                  </Text>
                  {club.memberCount > 50 && (
                    <View
                      style={[
                        styles.gridBadge,
                        { backgroundColor: COLORS.accent },
                      ]}
                    >
                      <Text style={styles.gridBadgeText}>HOT</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </FadeInUp>
            ))}
            <FadeInUp delay={550 + displayClubs.length * 50}>
              <TouchableOpacity style={styles.gridItem}>
                <View
                  style={[
                    styles.gridIconContainer,
                    { backgroundColor: "#222" },
                  ]}
                >
                  <Ionicons name="grid" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.gridLabel}>All Clubs</Text>
              </TouchableOpacity>
            </FadeInUp>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={{ flex: 1 }}>
        {renderHeader()}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
            />
          }
        >
          {renderHeroSection()}
          {renderPromoBanner()}
          {renderMyClubsSection()}
          {renderExploreClubsSection()}
        </ScrollView>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: COLORS.accent }]}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={28} color={COLORS.pureWhite} />
        </TouchableOpacity>
      </SafeAreaView>

      {user && (
        <CreateClubModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          userId={user.id}
        />
      )}

      <CommunityTermsModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        onAccept={handleAcceptTerms}
        type={selectedCommunityType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  searchSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBlack,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.offWhite,
    fontSize: 15,
    paddingHorizontal: 8,
    height: "100%",
    fontFamily: "Manrope_500Medium",
  },
  clearButton: {
    marginRight: 12,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  blackCard: {
    backgroundColor: "#343029",
    borderRadius: 24,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blackCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  blackCardLabel: {
    color: COLORS.textGrey,
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  historyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.pureWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyText: {
    fontSize: 10,
    color: COLORS.cardBlack,
    fontFamily: "Manrope_800ExtraBold",
  },
  welcomeText: {
    color: COLORS.offWhite,
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  currencySymbol: {
    color: COLORS.offWhite,
    fontSize: 20,
    marginRight: 8,
    fontFamily: "Manrope_600SemiBold",
  },
  balanceAmount: {
    color: COLORS.pureWhite,
    fontSize: 32,
    letterSpacing: -1,
    fontFamily: "Manrope_800ExtraBold",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  blueBadge: {
    flex: 1,
    backgroundColor: COLORS.badgeBlue,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 90,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  blueBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    zIndex: 2,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  patternContainer: {
    position: "absolute",
    right: -15,
    bottom: -15,
    transform: [{ rotate: "-15deg" }],
  },
  promoContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#b7a88e",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  promoPatternContainer: {
    position: "absolute",
    left: -20,
    bottom: -30,
    opacity: 1,
    zIndex: 1,
  },
  promoContent: {
    flex: 1,
    zIndex: 2,
  },
  promoLabel: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    fontFamily: "Manrope_800ExtraBold",
  },
  promoTitle: {
    fontSize: 18,
    color: COLORS.offWhite,
    lineHeight: 22,
    marginBottom: 12,
    textTransform: "uppercase",
    fontFamily: "Manrope_800ExtraBold",
  },
  promoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  promoButtonText: {
    color: COLORS.pureWhite,
    fontSize: 12,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  promoDecoration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-10deg" }],
  },
  promoBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 3,
  },
  promoBadgeText: {
    color: COLORS.pureWhite,
    fontSize: 10,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.offWhite,
    marginBottom: 16,
    fontFamily: "Manrope_800ExtraBold",
    textTransform: "uppercase",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH,
    backgroundColor: "#474137",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  gridIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    color: COLORS.offWhite,
    textAlign: "center",
    fontFamily: "Manrope_600SemiBold",
  },
  gridBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridBadgeText: {
    fontSize: 8,
    color: COLORS.pureWhite,
    fontFamily: "Manrope_800ExtraBold",
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noResultsText: {
    color: COLORS.textGrey,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Manrope_500Medium",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalWrapper: {
    flex: 1,
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.8)" : undefined,
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
    marginTop: Platform.OS === "android" ? 50 : 0,
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
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    letterSpacing: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  iconHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  shieldIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  welcomeTextModal: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
    textAlign: "center",
    lineHeight: 22,
  },
  rulesContainer: {
    gap: 20,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.cardBlack,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ruleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.lightGrey,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  ruleTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: COLORS.pureWhite,
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: COLORS.background,
  },
  legalFinePrint: {
    fontSize: 11,
    color: COLORS.textGrey,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Manrope_500Medium",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  declineText: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  acceptText: {
    color: COLORS.pureWhite,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 14,
  },
});
