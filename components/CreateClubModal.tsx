import { useCreateClub } from "@/hooks/useClubs";
import { ClubType } from "@/types/database";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateClubModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const { width } = Dimensions.get("window");

// 🎨 THEME COLORS
const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#151515",
  pureWhite: "#FFFFFF",
  offWhite: "#F5F5F5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",
  accentDim: "rgba(245, 158, 11, 0.15)",
  red: "#D50000",
  disabled: "#333333", // New distinct disabled color
};

// Club types mapped with specific background patterns
const CLUB_TYPES: {
  value: ClubType;
  label: string;
  emoji: string;
  grantsRole: string;
  description: string;
  patternIcon: any;
}[] = [
  {
    value: "RECORDING",
    label: "Recording",
    emoji: "🎙️",
    grantsRole: "ARTIST",
    description: "Recording sessions & vocals",
    patternIcon: "waveform",
  },
  {
    value: "PRODUCTION",
    label: "Production",
    emoji: "🎚️",
    grantsRole: "PRODUCER",
    description: "Mixing & mastering",
    patternIcon: "tune",
  },
  {
    value: "RENTAL",
    label: "Rental",
    emoji: "🏠",
    grantsRole: "STUDIO_OWNER",
    description: "Studio space rental",
    patternIcon: "domain",
  },
  {
    value: "MANAGEMENT",
    label: "Management",
    emoji: "🧑‍💼",
    grantsRole: "OTHER",
    description: "Artist & business management",
    patternIcon: "briefcase-outline",
  },
  {
    value: "DISTRIBUTION",
    label: "Distribution",
    emoji: "📣",
    grantsRole: "OTHER",
    description: "Promotion & publicity",
    patternIcon: "bullhorn-outline",
  },
  {
    value: "CREATIVE",
    label: "Creative",
    emoji: "🎨",
    grantsRole: "LYRICIST",
    description: "Artistic direction",
    patternIcon: "palette-outline",
  },
];

const ICON_OPTIONS = [
  "🎵",
  "🎸",
  "🎹",
  "🎧",
  "🎼",
  "🎺",
  "🎷",
  "🥁",
  "🎻",
  "🎤",
  "💿",
  "📻",
];

export default function CreateClubModal({
  visible,
  onClose,
  userId,
}: CreateClubModalProps) {
  const createClub = useCreateClub();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<ClubType>("RECORDING");
  const [selectedIcon, setSelectedIcon] = useState("🎵");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter a name for your club.");
      return;
    }

    try {
      await createClub.mutateAsync({
        name: name.trim(),
        type: selectedType,
        description: description.trim() || undefined,
        icon: selectedIcon,
        ownerId: userId,
      });

      const grantedRole = CLUB_TYPES.find(
        (t) => t.value === selectedType,
      )?.grantsRole;
      Alert.alert(
        "Club Created 🚀",
        `You created ${name} and now have access to the ${grantedRole} community.`,
      );
      handleClose();
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to create club. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedType("RECORDING");
    setSelectedIcon("🎵");
    onClose();
  };

  const selectedClubType = CLUB_TYPES.find((t) => t.value === selectedType);
  const isFormValid = name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CREATE NEW CLUB</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={COLORS.pureWhite} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. HERO PREVIEW CARD */}
          <View style={styles.previewContainer}>
            <View style={styles.previewCard}>
              <View style={styles.cardPatternContainer}>
                <MaterialCommunityIcons
                  name={selectedClubType?.patternIcon || "waveform"}
                  size={180}
                  color="rgba(255,255,255,0.03)"
                />
              </View>

              <View style={styles.previewIconCircle}>
                <Text style={styles.previewIcon}>{selectedIcon}</Text>
              </View>

              <Text
                style={[
                  styles.previewName,
                  !name && { color: COLORS.textGrey, opacity: 0.5 },
                ]}
                numberOfLines={1}
              >
                {name || "CLUB NAME"}
              </Text>

              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>
                  {selectedClubType?.label.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. FORM SECTION */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CLUB NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. Metro Studios"
                placeholderTextColor={COLORS.textGrey}
                value={name}
                onChangeText={setName}
                maxLength={30}
              />
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CHOOSE ICON</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconScroll}
              >
                {ICON_OPTIONS.map((emoji) => {
                  const isSelected = selectedIcon === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.iconCircle,
                        isSelected && styles.iconCircleSelected,
                      ]}
                      onPress={() => setSelectedIcon(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.iconEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Club Type Grid */}
            <View style={styles.inputGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Text style={styles.label}>CATEGORY</Text>
                <Text style={styles.subLabel}>Determines your role</Text>
              </View>

              <View style={styles.typeGrid}>
                {CLUB_TYPES.map((type) => {
                  const isSelected = selectedType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeCard,
                        isSelected && styles.typeCardSelected,
                      ]}
                      onPress={() => setSelectedType(type.value)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.typeCardTop}>
                        <Text style={styles.typeEmoji}>{type.emoji}</Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={COLORS.accent}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.typeLabel,
                          isSelected && { color: COLORS.accent },
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text style={styles.typeDesc} numberOfLines={2}>
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Briefly describe what your club does..."
                placeholderTextColor={COLORS.textGrey}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </View>
        </ScrollView>

        {/* 3. FLOATING FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!isFormValid || createClub.isPending) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!isFormValid || createClub.isPending}
            activeOpacity={0.8}
          >
            {createClub.isPending ? (
              <ActivityIndicator color={isFormValid ? "#000" : "#fff"} />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  !isFormValid && styles.createButtonTextDisabled,
                ]}
              >
                CREATE CLUB
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    color: COLORS.pureWhite,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBlack,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  content: {
    flex: 1,
  },

  // HERO PREVIEW CARD
  previewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  previewCard: {
    backgroundColor: "#343029",
    borderRadius: 24,
    paddingVertical: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
    overflow: "hidden",
  },
  cardPatternContainer: {
    position: "absolute",
    right: -40,
    bottom: -40,
    transform: [{ rotate: "-15deg" }],
    opacity: 0.8,
  },
  previewIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  previewIcon: {
    fontSize: 40,
  },
  previewName: {
    fontSize: 26,
    color: COLORS.pureWhite,
    fontFamily: "Manrope_800ExtraBold",
    marginBottom: 16,
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
  previewBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  previewBadgeText: {
    color: "#000",
    fontSize: 12,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 0.5,
  },

  // FORM
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    color: COLORS.textGrey,
    fontFamily: "Manrope_800ExtraBold",
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  subLabel: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: "Manrope_600SemiBold",
  },
  input: {
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: COLORS.pureWhite,
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 16,
  },

  // ICON SCROLL
  iconScroll: {
    gap: 12,
    paddingRight: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleSelected: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  iconEmoji: {
    fontSize: 30,
  },

  // TYPE GRID
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeCard: {
    width: "48%",
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    justifyContent: "space-between",
  },
  typeCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
    borderWidth: 2,
  },
  typeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  typeEmoji: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 14,
    color: COLORS.pureWhite,
    fontFamily: "Manrope_800ExtraBold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  typeDesc: {
    fontSize: 12,
    color: COLORS.textGrey,
    fontFamily: "Manrope_500Medium",
    lineHeight: 18,
  },

  // FOOTER
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background, // Ensure this isn't transparent
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 20,
    // Add extra padding for iOS home indicator
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  createButton: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  // FIXED: DISABLED BUTTON STYLE IS NOW VISIBLE
  createButtonDisabled: {
    backgroundColor: COLORS.disabled, // Visible Dark Grey (#333)
    borderWidth: 0,
    opacity: 1, // Full opacity so it doesn't vanish
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 1,
  },
  // FIXED: DISABLED TEXT COLOR
  createButtonTextDisabled: {
    color: "#888888", // Grey text for disabled state
  },
});
