import { useCreateCollaboration } from "@/hooks/useCollaborations";
import { CollaborationType } from "@/types/database";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CreateCollaborationModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

// 🎨 THEME COLORS (Matching Community Screen)
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
  disabled: "#333333",
};

const COLLAB_TYPES: {
  value: CollaborationType;
  label: string;
  icon: any; // MaterialCommunityIcons name
  description: string;
}[] = [
  {
    value: "PROJECT",
    label: "Project",
    icon: "folder-music-outline",
    description: "Long-term collaboration",
  },
  {
    value: "SESSION",
    label: "Session",
    icon: "album",
    description: "Recording session",
  },
  {
    value: "GIG",
    label: "Gig",
    icon: "microphone-variant",
    description: "Performance opportunity",
  },
  {
    value: "AUCTION",
    label: "Auction",
    icon: "gavel",
    description: "Bid for opportunity",
  },
];

const GENRE_OPTIONS = [
  "Hip-Hop",
  "R&B",
  "Pop",
  "Rock",
  "Electronic",
  "Jazz",
  "Classical",
  "Country",
  "Latin",
  "Other",
];

export default function CreateCollaborationModal({
  visible,
  onClose,
  userId,
}: CreateCollaborationModalProps) {
  const createCollaboration = useCreateCollaboration();

  // Form State
  const [type, setType] = useState<CollaborationType>("PROJECT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [minBid, setMinBid] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [genre, setGenre] = useState("");
  const [slots, setSlots] = useState("");

  // UI State
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

  const toggleGenreDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsGenreDropdownOpen(!isGenreDropdownOpen);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (type === "AUCTION" && !minBid.trim()) {
      Alert.alert("Error", "Please enter a minimum bid for auction");
      return;
    }

    try {
      await createCollaboration.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        userId,
        price: price ? parseFloat(price) : undefined,
        minBid: minBid ? parseFloat(minBid) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        location: location.trim() || undefined,
        genre: genre || undefined,
        slots: slots ? parseInt(slots) : undefined,
      });

      Alert.alert("Success", "Collaboration created successfully!");
      handleClose();
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to create collaboration. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleClose = () => {
    setType("PROJECT");
    setTitle("");
    setDescription("");
    setPrice("");
    setMinBid("");
    setDuration("");
    setLocation("");
    setGenre("");
    setSlots("");
    setIsGenreDropdownOpen(false);
    onClose();
  };

  const isFormValid = title.trim().length > 0;

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
          <Text style={styles.headerTitle}>CREATE COLLABORATION</Text>
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
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. TYPE SELECTION */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Text style={styles.label}>COLLABORATION TYPE</Text>
                <Text style={styles.subLabel}>Choose format</Text>
              </View>

              <View style={styles.typeGrid}>
                {COLLAB_TYPES.map((collabType) => {
                  const isSelected = type === collabType.value;
                  return (
                    <TouchableOpacity
                      key={collabType.value}
                      style={[
                        styles.typeCard,
                        isSelected && styles.typeCardSelected,
                      ]}
                      onPress={() => setType(collabType.value)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.typeCardTop}>
                        <MaterialCommunityIcons
                          name={collabType.icon}
                          size={28}
                          color={isSelected ? COLORS.accent : COLORS.textGrey}
                        />
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
                        {collabType.label}
                      </Text>
                      <Text style={styles.typeDesc}>
                        {collabType.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. TITLE INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TITLE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Looking for a producer for my EP"
                placeholderTextColor={COLORS.textGrey}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* 3. DESCRIPTION */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the vibe, requirements, and vision..."
                placeholderTextColor={COLORS.textGrey}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {/* 4. GENRE DROPDOWN */}
            <View style={[styles.inputGroup, { zIndex: 100 }]}>
              <Text style={styles.label}>GENRE</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dropdownButton,
                  isGenreDropdownOpen && {
                    borderColor: COLORS.accent,
                    backgroundColor: COLORS.cardDark,
                  },
                ]}
                onPress={toggleGenreDropdown}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.inputText,
                    !genre && { color: COLORS.textGrey },
                  ]}
                >
                  {genre || "Select a genre"}
                </Text>
                <Ionicons
                  name={isGenreDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={isGenreDropdownOpen ? COLORS.accent : COLORS.textGrey}
                />
              </TouchableOpacity>

              {isGenreDropdownOpen && (
                <View style={styles.dropdownList}>
                  {GENRE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        genre === option && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setGenre(option);
                        toggleGenreDropdown();
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          genre === option && { color: COLORS.accent },
                        ]}
                      >
                        {option}
                      </Text>
                      {genre === option && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={COLORS.accent}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 5. DYNAMIC FIELDS (Price/Bid/Location) */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>
                  {type === "AUCTION" ? "MIN BID ($)" : "BUDGET ($)"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={type === "AUCTION" ? "50" : "Optional"}
                  placeholderTextColor={COLORS.textGrey}
                  value={type === "AUCTION" ? minBid : price}
                  onChangeText={type === "AUCTION" ? setMinBid : setPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>LOCATION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Remote / City"
                  placeholderTextColor={COLORS.textGrey}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* 6. DURATION & SLOTS */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>DURATION (HRS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 4"
                  placeholderTextColor={COLORS.textGrey}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>OPEN SLOTS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  placeholderTextColor={COLORS.textGrey}
                  value={slots}
                  onChangeText={setSlots}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* FLOATING FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!isFormValid || createCollaboration.isPending) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!isFormValid || createCollaboration.isPending}
            activeOpacity={0.8}
          >
            {createCollaboration.isPending ? (
              <ActivityIndicator color={isFormValid ? "#000" : "#fff"} />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  !isFormValid && styles.createButtonTextDisabled,
                ]}
              >
                CREATE COLLAB
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

  // FORM SECTION
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    color: COLORS.textGrey,
    fontFamily: "Manrope_800ExtraBold",
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  subLabel: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: "Manrope_600SemiBold",
  },

  // INPUTS
  input: {
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.pureWhite,
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
  },
  inputText: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.pureWhite,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 16,
  },

  // TYPE GRID
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  typeCard: {
    width: "48%", // 2 columns
    backgroundColor: COLORS.cardBlack,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
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
    lineHeight: 16,
  },

  // DROPDOWN
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: COLORS.cardBlack,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.accentDim,
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.pureWhite,
    fontFamily: "Manrope_500Medium",
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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  createButtonDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 1,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 1,
  },
  createButtonTextDisabled: {
    color: "#888888",
  },
});
