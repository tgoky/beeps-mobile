import LocationSelector, { LocationData } from "@/components/LocationSelector";
import {
  BorderRadius,
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/database";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const USER_ROLES: {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  needsLocation: boolean;
}[] = [
  {
    value: "ARTIST",
    label: "Artist",
    icon: "mic-outline",
    needsLocation: false,
  },
  {
    value: "PRODUCER",
    label: "Producer",
    icon: "musical-notes-outline",
    needsLocation: false,
  },
  {
    value: "STUDIO_OWNER",
    label: "Studio Owner",
    icon: "business-outline",
    needsLocation: true,
  },
  {
    value: "GEAR_SELLER",
    label: "Gear Seller",
    icon: "cart-outline",
    needsLocation: true,
  },
  {
    value: "LYRICIST",
    label: "Lyricist",
    icon: "document-text-outline",
    needsLocation: false,
  },
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const isDark = effectiveTheme === "dark";

  // Step tracking
  const [step, setStep] = useState(1); // 1 = basic info, 2 = role-specific

  // Basic fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Location data (for studio owners and gear sellers)
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Studio owner specific
  const [studioName, setStudioName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const [loading, setLoading] = useState(false);

  const roleConfig = USER_ROLES.find((r) => r.value === selectedRole);
  const needsLocation = roleConfig?.needsLocation ?? false;

  const validateStep1 = () => {
    if (!email || !password || !username || !fullName || !selectedRole) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep1()) return;

    // If role needs location/extra fields, go to step 2
    if (needsLocation) {
      setStep(2);
    } else {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    // Validate step 2 for studio owners
    if (selectedRole === "STUDIO_OWNER") {
      if (!locationData?.city) {
        Alert.alert("Error", "Please select your location");
        return;
      }
      if (!studioName) {
        Alert.alert("Error", "Please enter your studio name");
        return;
      }
    }

    if (selectedRole === "GEAR_SELLER" && !locationData?.city) {
      Alert.alert("Error", "Please select your location");
      return;
    }

    setLoading(true);
    try {
      // Create the user account
      const locationString = locationData ? locationData.fullAddress : "";

      await signUp(email, password, {
        username,
        fullName,
        primaryRole: selectedRole!,
        location: locationString,
        verified: false,
        membershipTier: "FREE",
        followersCount: 0,
        followingCount: 0,
      });

      // If studio owner, create studio_owner_profile and studio
      if (selectedRole === "STUDIO_OWNER" && studioName) {
        // We need to get the user ID that was just created
        // Wait a moment for the auth state to settle
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          // Find the user profile
          const { data: userProfile } = await supabase
            .from("users")
            .select("id")
            .eq("supabase_id", authData.user.id)
            .single();

          if (userProfile) {
            const now = new Date().toISOString();
            const profileId = Crypto.randomUUID();

            // Create studio owner profile
            await supabase.from("studio_owner_profiles").insert({
              id: profileId,
              user_id: userProfile.id,
              created_at: now,
              updated_at: now,
            });

            // Create the studio
            const studioId = Crypto.randomUUID();
            await supabase.from("studios").insert({
              id: studioId,
              name: studioName,
              owner_id: profileId,
              location: locationData?.fullAddress || "",
              street_address: locationData?.streetAddress || null,
              city: locationData?.city || null,
              state: locationData?.state || null,
              country: locationData?.country || null,
              latitude: locationData?.latitude || null,
              longitude: locationData?.longitude || null,
              hourly_rate: parseFloat(hourlyRate) || 25,
              capacity: capacity || null,
              equipment: [],
              rating: 0,
              reviews_count: 0,
              is_active: true,
              verification_status: "UNVERIFIED",
              created_at: now,
              updated_at: now,
            });
          }
        }
      }

      Alert.alert(
        "Success",
        "Account created! Please check your email to verify your account.",
      );
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const locationColors = {
    background: colors.background,
    text: colors.text,
    border: colors.border,
    placeholder: colors.textTertiary,
    card: colors.backgroundSecondary,
    accent: colors.primary,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {step === 1 ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Create Account
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Join the Beeps community
              </Text>

              <View style={styles.form}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Username"
                  placeholderTextColor={colors.textTertiary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />

                <Text style={[styles.label, { color: colors.text }]}>
                  I am a:
                </Text>
                <View style={styles.roleContainer}>
                  {USER_ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.roleButton,
                        {
                          borderColor: colors.border,
                          backgroundColor:
                            selectedRole === role.value
                              ? colors.primary
                              : colors.card,
                        },
                      ]}
                      onPress={() => setSelectedRole(role.value)}
                      disabled={loading}
                    >
                      <Ionicons
                        name={role.icon}
                        size={16}
                        color={
                          selectedRole === role.value
                            ? "#fff"
                            : colors.textSecondary
                        }
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          {
                            color:
                              selectedRole === role.value
                                ? "#fff"
                                : colors.textSecondary,
                          },
                          selectedRole === role.value &&
                            styles.roleButtonTextSelected,
                        ]}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {needsLocation ? "Next" : "Create Account"}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text
                    style={[styles.footerText, { color: colors.textSecondary }]}
                  >
                    Already have an account?{" "}
                  </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text style={[styles.link, { color: colors.primary }]}>
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Step 2: Location & Role-Specific Fields */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.title, { color: colors.text }]}>
                {selectedRole === "STUDIO_OWNER"
                  ? "Studio Setup"
                  : "Your Location"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {selectedRole === "STUDIO_OWNER"
                  ? "Tell us about your studio"
                  : "Where are you located?"}
              </Text>

              <View style={styles.form}>
                {/* Studio Owner specific fields */}
                {selectedRole === "STUDIO_OWNER" && (
                  <>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Studio Name"
                      placeholderTextColor={colors.textTertiary}
                      value={studioName}
                      onChangeText={setStudioName}
                      editable={!loading}
                    />

                    <View style={styles.row}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.halfInput,
                          {
                            backgroundColor: colors.backgroundSecondary,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        placeholder="Capacity (e.g., 5)"
                        placeholderTextColor={colors.textTertiary}
                        value={capacity}
                        onChangeText={setCapacity}
                        editable={!loading}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.halfInput,
                          {
                            backgroundColor: colors.backgroundSecondary,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        placeholder="Rate $/hr"
                        placeholderTextColor={colors.textTertiary}
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </>
                )}

                {/* Location Selector */}
                <View style={styles.locationSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.primary}
                    />{" "}
                    Location
                  </Text>
                  <LocationSelector
                    onLocationChange={setLocationData}
                    showStreetAddress={selectedRole === "STUDIO_OWNER"}
                    showGeolocation
                    compact
                    colors={locationColors}
                  />
                </View>

                {/* Location preview */}
                {locationData?.fullAddress ? (
                  <View
                    style={[
                      styles.locationPreview,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#00C853"
                    />
                    <Text
                      style={[
                        styles.locationPreviewText,
                        { color: colors.text },
                      ]}
                      numberOfLines={2}
                    >
                      {locationData.fullAddress}
                    </Text>
                    {locationData.latitude && (
                      <Text
                        style={[
                          styles.coordText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {locationData.latitude.toFixed(4)},{" "}
                        {locationData.longitude?.toFixed(4)}
                      </Text>
                    )}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary, marginTop: 16 },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  backButton: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: FontSizes["4xl"],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.base,
    marginBottom: Spacing["2xl"],
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    fontSize: FontSizes.base,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  roleButtonText: {
    fontSize: FontSizes.sm,
  },
  roleButtonTextSelected: {
    fontWeight: FontWeights.semiBold,
  },
  locationSection: {
    marginBottom: Spacing.md,
  },
  locationPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  locationPreviewText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  coordText: {
    width: "100%",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 26,
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.base,
  },
  link: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
