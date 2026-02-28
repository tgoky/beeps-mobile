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
  cardDark: "#121212",
  inputBg: "#1A1A1A",
  pureWhite: "#FFFFFF",
  offWhite: "#E5E5E5",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b", // Amber
  accentDim: "rgba(245, 158, 11, 0.1)",
  disabled: "#333333",
  success: "#10B981",
};

// Professional Vector Icons instead of Emojis
const CLUB_ICONS = [
  "microphone-variant",
  "music-clef-treble",
  "piano",
  "guitar-electric",
  "drums",
  "speaker",
  "headphones",
  "cassette",
  "waveform",
  "account-group",
];

const CLUB_TYPES: {
  value: ClubType;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    value: "RECORDING",
    label: "Recording Studio",
    icon: "microphone",
    description: "Vocals, tracking & sessions",
  },
  {
    value: "PRODUCTION",
    label: "Production House",
    icon: "speaker",
    description: "Beat making, mixing & mastering",
  },
  {
    value: "RENTAL",
    label: "Rehearsal Space",
    icon: "domain",
    description: "Room rentals & practice",
  },
  {
    value: "MANAGEMENT",
    label: "Label / Mgmt",
    icon: "briefcase-variant",
    description: "Artist development & business",
  },
  {
    value: "DISTRIBUTION",
    label: "Distribution",
    icon: "broadcast",
    description: "Marketing, promo & release",
  },
  {
    value: "CREATIVE",
    label: "Creative Collective",
    icon: "palette",
    description: "Art, video & direction",
  },
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
  const [selectedIcon, setSelectedIcon] = useState("microphone-variant");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a name for your club.");
      return;
    }

    try {
      await createClub.mutateAsync({
        name: name.trim(),
        type: selectedType,
        description: description.trim() || undefined,
        icon: selectedIcon, // Saving the icon name string
        ownerId: userId,
      });

      Alert.alert("Success", "Club created successfully!");
      handleClose();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create club.");
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedType("RECORDING");
    setSelectedIcon("microphone-variant");
    onClose();
  };

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
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NEW CLUB</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.pureWhite} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: IDENTITY (Name + Icon) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IDENTITY</Text>

            <View style={styles.identityContainer}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>CLUB NAME</Text>
                <TextInput
                  style={styles.mainInput}
                  placeholder="e.g. Metro Boomin"
                  placeholderTextColor={COLORS.textGrey}
                  value={name}
                  onChangeText={setName}
                  maxLength={40}
                />
              </View>

              {/* Selected Icon Preview */}
              <View style={styles.iconPreviewBox}>
                <MaterialCommunityIcons
                  name={selectedIcon as any}
                  size={32}
                  color={COLORS.accent}
                />
              </View>
            </View>

            {/* Icon Grid Selector */}
            <Text
              style={[styles.inputLabel, { marginTop: 16, marginBottom: 8 }]}
            >
              BADGE ICON
            </Text>
            <View style={styles.iconGrid}>
              {CLUB_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      isSelected && styles.iconOptionSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={20}
                      color={isSelected ? COLORS.pureWhite : COLORS.textGrey}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION 2: CATEGORY (List Layout) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.listContainer}>
              {CLUB_TYPES.map((type, index) => {
                const isSelected = selectedType === type.value;
                const isLast = index === CLUB_TYPES.length - 1;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.listItem,
                      !isLast && styles.listItemBorder,
                      isSelected && styles.listItemSelected,
                    ]}
                    onPress={() => setSelectedType(type.value)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.listIconBox,
                        isSelected && { backgroundColor: COLORS.accent },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={type.icon}
                        size={18}
                        color={isSelected ? "#000" : COLORS.pureWhite}
                      />
                    </View>

                    <View style={styles.listContent}>
                      <Text
                        style={[
                          styles.listTitle,
                          isSelected && { color: COLORS.accent },
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text style={styles.listDesc}>{type.description}</Text>
                    </View>

                    <View style={styles.radioCircle}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION 3: DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What is your community about?"
              placeholderTextColor={COLORS.textGrey}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={150}
            />
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!isFormValid || createClub.isPending) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!isFormValid || createClub.isPending}
          >
            {createClub.isPending ? (
              <ActivityIndicator color={COLORS.textGrey} />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  !isFormValid && { color: COLORS.textGrey },
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
    padding: 4,
  },

  content: {
    flex: 1,
    paddingTop: 20,
  },

  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textGrey,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // IDENTITY SECTION
  identityContainer: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: COLORS.textGrey,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  mainInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    color: COLORS.pureWhite,
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  iconPreviewBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 19, // Align with input
  },

  // ICON GRID
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconOption: {
    width: (width - 40 - 50) / 6, // roughly 6 per row
    aspectRatio: 1,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconOptionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  // CATEGORY LIST
  listContainer: {
    backgroundColor: COLORS.cardBlack,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.cardBlack,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemSelected: {
    backgroundColor: COLORS.accentDim,
  },
  listIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.cardDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: COLORS.pureWhite,
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    color: COLORS.textGrey,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },

  // DESCRIPTION
  textArea: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    color: COLORS.pureWhite,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    height: 100,
    textAlignVertical: "top",
  },

  // FOOTER
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
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
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 1,
  },
});
