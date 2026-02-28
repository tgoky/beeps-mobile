import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ClubType } from "@/types/database";
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
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

type Tab = "lounge" | "members" | "events";

// 🎨 THEME COLORS
const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#121212",
  pureWhite: "#FFFFFF",
  offWhite: "#E5E5E5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b", // Amber
  accentDim: "rgba(245, 158, 11, 0.15)",
  red: "#D50000",
  green: "#10B981",
  blue: "#3B82F6",
};

// Club type labels
const CLUB_TYPE_LABELS: Record<ClubType, string> = {
  RECORDING: "Studio",
  PRODUCTION: "Production",
  RENTAL: "Rental",
  MANAGEMENT: "Label",
  DISTRIBUTION: "Distro",
  CREATIVE: "Collective",
};

export default function ClubDetailScreen() {
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

  const [activeTab, setActiveTab] = useState<Tab>("lounge");
  const [isLiked, setIsLiked] = useState(false);

  // Fetch club details
  const { data: club, isLoading } = useQuery({
    queryKey: ["club", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select(
          `
          *,
          users!owner_id (id, username, full_name, avatar),
          club_members (id, role, joined_at, users!user_id (id, username, avatar))
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        ...data,
        owner: data.users,
        members: data.club_members.map((m: any) => ({
          ...m,
          user: m.users,
        })),
      };
    },
    enabled: !!id,
  });

  if (isLoading || !fontsLoaded) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!club) return null;

  const isMember = club.members.some((m: any) => m.user.id === user?.id);
  const isOwner = club.ownerId === user?.id;
  const memberCount = club.members.length;

  // --- SUB-COMPONENTS ---

  // 1. FACEPILE (Overlapping Avatars)
  const MemberFacepile = () => (
    <View style={styles.facepileContainer}>
      {club.members.slice(0, 4).map((m: any, index: number) => (
        <View
          key={m.id}
          style={[
            styles.facepileAvatar,
            { zIndex: 10 - index, marginLeft: index === 0 ? 0 : -12 },
          ]}
        >
          <Text style={styles.facepileText}>
            {m.user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      ))}
      {memberCount > 4 && (
        <View
          style={[
            styles.facepileAvatar,
            styles.facepileCounter,
            { zIndex: 0, marginLeft: -12 },
          ]}
        >
          <Text style={styles.facepileCountText}>+{memberCount - 4}</Text>
        </View>
      )}
      <Text style={styles.onlineText}>
        <Text style={{ color: COLORS.green }}>●</Text> {memberCount} Members
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND IMAGE / HEADER AREA */}
      <View style={styles.headerBackground}>
        {/* Placeholder for Cover Image - using patterns since we don't have real images yet */}
        <View style={styles.patternOverlay}>
          <MaterialCommunityIcons
            name="waveform"
            size={300}
            color="rgba(255,255,255,0.03)"
            style={{ top: -50, right: -50, position: "absolute" }}
          />
        </View>
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "#000000"]}
          style={styles.gradientOverlay}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* NAV BAR */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButtonBlur}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.pureWhite} />
          </TouchableOpacity>
          <View style={styles.navActions}>
            <TouchableOpacity
              style={styles.iconButtonBlur}
              onPress={() => setIsLiked(!isLiked)}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? COLORS.red : COLORS.pureWhite}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonBlur}>
              <Ionicons
                name="share-social-outline"
                size={20}
                color={COLORS.pureWhite}
              />
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity style={styles.iconButtonBlur}>
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={COLORS.pureWhite}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* CLUB IDENTITY */}
          <View style={styles.clubHeader}>
            <View style={styles.clubIdentityRow}>
              <View style={styles.clubLogo}>
                <Text style={{ fontSize: 32 }}>{club.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clubTitle}>{club.name}</Text>
                <View style={styles.badgesRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {CLUB_TYPE_LABELS[club.type as ClubType]}
                    </Text>
                  </View>
                  {isOwner && (
                    <View
                      style={[
                        styles.tag,
                        { backgroundColor: COLORS.accentDim },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: COLORS.accent }]}>
                        Owner
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <MemberFacepile />

            {/* ACTION BAR */}
            <View style={styles.actionBar}>
              {isMember || isOwner ? (
                <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
                  <Ionicons name="chatbubbles" size={20} color="#000" />
                  <Text style={styles.primaryBtnText}>ENTER CHAT</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
                  <Ionicons name="add-circle" size={20} color="#000" />
                  <Text style={styles.primaryBtnText}>JOIN COMMUNITY</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryBtn}>
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={COLORS.pureWhite}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* TABS */}
          <View style={styles.tabRow}>
            {(["lounge", "members", "events"] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tabItem,
                  activeTab === t && styles.tabItemActive,
                ]}
                onPress={() => setActiveTab(t)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === t && styles.tabTextActive,
                  ]}
                >
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB CONTENT */}
          <View style={styles.contentArea}>
            {/* --- LOUNGE / FEED TAB --- */}
            {activeTab === "lounge" && (
              <View>
                {/* Pinned "About" Post */}
                <View style={styles.feedPost}>
                  <View style={styles.postHeader}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarTextSmall}>
                        {club.owner.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.postAuthor}>
                        {club.owner.full_name || club.owner.username}{" "}
                        <Ionicons
                          name="shield-checkmark"
                          size={12}
                          color={COLORS.accent}
                        />
                      </Text>
                      <Text style={styles.postTime}>
                        Pinned Message • Admin
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.postBody}>
                    {club.description ||
                      "Welcome to the club! This is where we collaborate, share ideas, and build together. Respect the vibe and let's create something dope."}
                  </Text>
                  <View style={styles.postActions}>
                    <View style={styles.reactionPill}>
                      <Text>🔥 24</Text>
                    </View>
                    <View style={styles.reactionPill}>
                      <Text>🙌 12</Text>
                    </View>
                  </View>
                </View>

                {/* Simulated Feed Item */}
                <View style={styles.feedPost}>
                  <View style={styles.postHeader}>
                    <View
                      style={[
                        styles.avatarSmall,
                        { backgroundColor: COLORS.blue },
                      ]}
                    >
                      <Text style={styles.avatarTextSmall}>J</Text>
                    </View>
                    <View>
                      <Text style={styles.postAuthor}>JayProducer</Text>
                      <Text style={styles.postTime}>2 hours ago</Text>
                    </View>
                  </View>
                  <Text style={styles.postBody}>
                    Just uploaded a new beat pack to the shared folder. Check it
                    out in the resources tab! 🎹
                  </Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="heart-outline"
                        size={18}
                        color={COLORS.textGrey}
                      />
                      <Text style={{ color: COLORS.textGrey }}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={COLORS.textGrey}
                      />
                      <Text style={{ color: COLORS.textGrey }}>Comment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* --- MEMBERS TAB --- */}
            {activeTab === "members" && (
              <View style={styles.membersGrid}>
                {club.members.map((m: any) => (
                  <View key={m.id} style={styles.memberRow}>
                    <View style={styles.memberLeft}>
                      <View style={styles.avatarMedium}>
                        <Text style={styles.avatarTextMedium}>
                          {m.user.username.charAt(0).toUpperCase()}
                        </Text>
                        <View style={styles.onlineDot} />
                      </View>
                      <View>
                        <Text style={styles.memberName}>{m.user.username}</Text>
                        <Text style={styles.memberRole}>{m.role}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.chatIconBtn}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={20}
                        color={COLORS.pureWhite}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* --- EVENTS TAB --- */}
            {activeTab === "events" && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={48}
                  color={COLORS.cardDark}
                />
                <Text style={styles.emptyStateText}>No upcoming events</Text>
                <TouchableOpacity style={styles.smallOutlineBtn}>
                  <Text
                    style={{
                      color: COLORS.pureWhite,
                      fontFamily: "Manrope_700Bold",
                    }}
                  >
                    Schedule Event
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // BACKGROUND
  headerBackground: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 300,
    backgroundColor: "#111", // Fallback
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // NAV BAR
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    zIndex: 10,
  },
  navActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  // CLUB HEADER
  clubHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  clubIdentityRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: 24, // Squircle
    backgroundColor: COLORS.cardBlack,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clubTitle: {
    fontSize: 26,
    fontFamily: "Manrope_800ExtraBold",
    color: COLORS.pureWhite,
    lineHeight: 32,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.cardDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.textGrey,
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    textTransform: "uppercase",
  },

  // FACEPILE
  facepileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  facepileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardDark,
    borderWidth: 2,
    borderColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  facepileCounter: {
    backgroundColor: COLORS.border,
  },
  facepileText: {
    color: COLORS.pureWhite,
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
  },
  facepileCountText: {
    color: COLORS.pureWhite,
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
  },
  onlineText: {
    color: COLORS.textGrey,
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    marginLeft: 12,
  },

  // ACTION BAR
  actionBar: {
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryBtnText: {
    color: "#000",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.cardBlack,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },

  // TABS
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.pureWhite,
  },

  // FEED STYLES
  contentArea: {
    paddingHorizontal: 20,
  },
  feedPost: {
    backgroundColor: COLORS.cardBlack,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTextSmall: {
    color: "#000",
    fontFamily: "Manrope_800ExtraBold",
  },
  postAuthor: {
    color: COLORS.pureWhite,
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  postTime: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
  },
  postBody: {
    color: COLORS.offWhite,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: "row",
    gap: 16,
  },
  reactionPill: {
    backgroundColor: COLORS.cardDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // MEMBER LIST
  membersGrid: {
    gap: 12,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.cardBlack,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarMedium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  avatarTextMedium: {
    color: COLORS.pureWhite,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.cardBlack,
  },
  memberName: {
    color: COLORS.pureWhite,
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  memberRole: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  chatIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.cardDark,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    color: COLORS.textGrey,
    fontFamily: "Manrope_600SemiBold",
  },
  smallOutlineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: 8,
  },
});
