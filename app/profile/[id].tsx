import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 180;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user: currentUser } = useAuth();
  const isDark = effectiveTheme === "dark";

  const { data: profile, isLoading, error } = useUserProfile(id);

  // --- Loading State ---
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerSimple}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- Error State ---
  if (error || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerSimple}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContent}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={colors.error}
            />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Profile Not Found
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              This user profile could not be loaded.
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const avatarUrl =
    profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || profile.username)}&background=random&size=200`;
  // Mock cover image if none exists
  const coverUrl =
    profile.coverUrl ||
    `https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800&q=80`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* --- Cover Image & Header Actions --- */}
        <View style={{ height: COVER_HEIGHT + 60, marginBottom: Spacing.sm }}>
          <Image
            source={{ uri: coverUrl }}
            style={{ width: "100%", height: COVER_HEIGHT }}
            contentFit="cover"
          />
          {/* Gradient Overlay for back button visibility */}
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            style={styles.coverGradient}
          />

          {/* Back Button */}
          <SafeAreaView style={styles.headerOverlay}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButtonBlur}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => router.push("/settings")}
                style={styles.backButtonBlur}
              >
                <Ionicons name="settings-outline" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </SafeAreaView>

          {/* Avatar - overlapping cover and body */}
          <View
            style={[styles.avatarContainer, { borderColor: colors.background }]}
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          </View>
        </View>

        {/* --- Profile Info --- */}
        <View style={styles.contentContainer}>
          {/* Name & Role */}
          <View style={styles.profileHeader}>
            <View style={styles.nameRow}>
              <Text style={[styles.fullName, { color: colors.text }]}>
                {profile.fullName || profile.username}
              </Text>
              {profile.verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </View>
            <Text style={[styles.username, { color: colors.textSecondary }]}>
              @{profile.username}
            </Text>

            {/* Role Badge */}
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  profile.primaryRole === "producer"
                    ? "music-box"
                    : profile.primaryRole === "artist"
                      ? "microphone-variant"
                      : profile.primaryRole === "studio_owner"
                        ? "home-music"
                        : "account"
                }
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {profile.primaryRole?.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.followersCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Followers
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.followingCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Following
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.clubCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Clubs
              </Text>
            </View>
          </View>

          {/* Action Buttons (Follow / Message) */}
          {!isOwnProfile && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.text, flex: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.background },
                  ]}
                >
                  Follow
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { borderColor: colors.border, flex: 1 },
                ]}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: colors.text }]}
                >
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* About Section */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                About
              </Text>
              <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Location */}
          {profile.location && (
            <View style={[styles.infoRow, { backgroundColor: colors.card }]}>
              <Ionicons
                name="location-sharp"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {profile.location}
              </Text>
            </View>
          )}

          {/* --- PRODUCER SPECIFIC INFO --- */}
          {profile.producerProfile && (
            <View
              style={[styles.sectionCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="fader"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Producer Details
                </Text>
              </View>

              {profile.producerProfile.productionRate && (
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Rate
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    ${profile.producerProfile.productionRate}/hr
                  </Text>
                </View>
              )}

              {profile.producerProfile.genres?.length > 0 && (
                <View style={styles.tagsWrapper}>
                  {profile.producerProfile.genres.map((g, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tagChip,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {g}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* --- ARTIST SPECIFIC INFO --- */}
          {profile.artistProfile && (
            <View
              style={[styles.sectionCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="microphone"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Artist Details
                </Text>
              </View>

              {profile.artistProfile.performanceRate && (
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Performance
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    ${profile.artistProfile.performanceRate}/show
                  </Text>
                </View>
              )}

              {profile.artistProfile.genres?.length > 0 && (
                <View style={styles.tagsWrapper}>
                  {profile.artistProfile.genres.map((g, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tagChip,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {g}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  headerSimple: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  // Cover & Header
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === "android" ? 40 : 0, // Adjust for android status bar
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },

  // Avatar
  avatarContainer: {
    position: "absolute",
    bottom: 0,
    left: Spacing.lg,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ccc",
  },

  // Main Content
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    marginTop: Spacing.xs,
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fullName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ccc", // You might want to use colors.border here via context passing or opacity
    opacity: 0.2,
  },

  // Actions
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Cards (Producer/Artist Info)
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // States
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
});
