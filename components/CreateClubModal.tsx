import {
  Colors,
  Spacing
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useCreateClub } from "@/hooks/useClubs";
import { ClubType } from "@/types/database";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// Club types mapped to roles
const CLUB_TYPES: {
  value: ClubType;
  label: string;
  emoji: string;
  grantsRole: string;
  description: string;
}[] = [
  {
    value: "RECORDING",
    label: "Recording",
    emoji: "🎙️",
    grantsRole: "ARTIST",
    description: "Recording sessions & vocals",
  },
  {
    value: "PRODUCTION",
    label: "Production",
    emoji: "🎚️",
    grantsRole: "PRODUCER",
    description: "Mixing & mastering",
  },
  {
    value: "RENTAL",
    label: "Rental",
    emoji: "🏠",
    grantsRole: "STUDIO_OWNER",
    description: "Studio space rental",
  },
  {
    value: "MANAGEMENT",
    label: "Management",
    emoji: "🧑‍💼",
    grantsRole: "OTHER",
    description: "Artist & business management",
  },
  {
    value: "DISTRIBUTION",
    label: "Distribution",
    emoji: "📣",
    grantsRole: "OTHER",
    description: "Promotion & publicity",
  },
  {
    value: "CREATIVE",
    label: "Creative",
    emoji: "🎨",
    grantsRole: "LYRICIST",
    description: "Artistic direction",
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
];

export default function CreateClubModal({
  visible,
  onClose,
  userId,
}: CreateClubModalProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
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
  const isDark = effectiveTheme === "dark";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: isDark ? colors.border : "transparent" },
          ]}
        >
          <TouchableOpacity
            onPress={handleClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? colors.card
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            New Club
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Preview Section */}
          <View style={styles.previewSection}>
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.card,
                  shadowColor: "#000",
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.previewIcon}>{selectedIcon}</Text>
              <Text
                style={[
                  styles.previewName,
                  { color: name ? colors.text : colors.textTertiary },
                ]}
              >
                {name || "Club Name"}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.textSecondary }]}
                >
                  {selectedClubType?.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Club Name
              </Text>
              <TextInput
                style={[
                  styles.inputLarge,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: name ? colors.accent : colors.border,
                  },
                ]}
                placeholder="Ex. Metro Studios"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Choose Icon
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconScroll}
              >
                {ICON_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      selectedIcon === emoji && {
                        borderColor: colors.accent,
                        backgroundColor: colors.backgroundSecondary,
                        transform: [{ scale: 1.1 }],
                      },
                    ]}
                    onPress={() => setSelectedIcon(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Club Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Category
              </Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                Determines your community role
              </Text>

              <View style={styles.typeGrid}>
                {CLUB_TYPES.map((type) => {
                  const isSelected = selectedType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: isSelected
                            ? colors.accent
                            : colors.border,
                        },
                        isSelected && {
                          backgroundColor: isDark ? colors.card : "#F0F9FF",
                        }, // Subtle tint on light mode
                      ]}
                      onPress={() => setSelectedType(type.value)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.typeHeader}>
                        <Text style={styles.typeEmoji}>{type.emoji}</Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.accent}
                          />
                        )}
                      </View>
                      <Text style={[styles.typeLabel, { color: colors.text }]}>
                        {type.label}
                      </Text>
                      <Text
                        style={[
                          styles.typeDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.inputLarge,
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Briefly describe what you do..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              shadowColor: "#000",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.accent },
              (!name.trim() || createClub.isPending) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!name.trim() || createClub.isPending}
            activeOpacity={0.8}
          >
            {createClub.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Club</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: Spacing.md,
    height: 90,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circle
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20, // Larger title
    fontWeight: "800", // Extra bold
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  previewSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  previewCard: {
    width: "100%",
    paddingVertical: 30,
    borderRadius: 24, // Softer corners
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    // Premium Shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  previewIcon: {
    fontSize: 64, // Huge icon
    marginBottom: Spacing.sm,
  },
  previewName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    marginBottom: 28, // More spacing between sections
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: -4,
  },
  inputLarge: {
    borderWidth: 1.5, // Thicker border
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16, // Taller input
    fontSize: 17,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: "top",
  },
  iconScroll: {
    gap: 12,
    paddingVertical: 4, // Allow space for shadow/transform
    paddingHorizontal: 2,
  },
  iconCircle: {
    width: 64, // Larger
    height: 64,
    borderRadius: 32, // Perfect circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  iconEmoji: {
    fontSize: 30,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeCard: {
    width: "48%",
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 140,
    justifyContent: "space-between",
  },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  typeEmoji: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Safe area
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  createButton: {
    height: 56, // Standard mobile button height
    borderRadius: 28, // Pill shape
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
