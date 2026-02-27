import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useCreateCollaboration } from "@/hooks/useCollaborations";
import { CollaborationType } from "@/types/database";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const COLLAB_TYPES: {
  value: CollaborationType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "PROJECT",
    label: "Project",
    icon: "folder-music",
    description: "Long-term collaboration",
  },
  {
    value: "SESSION",
    label: "Session",
    icon: "record-circle",
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
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
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

  // UI State for interactivity
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
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
      console.error("Create collaboration error:", error);
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

  // Helper to render sleek inputs
  const renderInput = (
    label: string,
    value: string,
    setter: (val: string) => void,
    placeholder: string,
    id: string,
    isMultiline = false,
    keyboardType: "default" | "number-pad" | "decimal-pad" = "default",
  ) => {
    const isFocused = focusedInput === id;
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            isMultiline && styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: isFocused ? colors.accent : colors.border,
              borderWidth: isFocused ? 2 : 1,
              color: colors.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={setter}
          multiline={isMultiline}
          numberOfLines={isMultiline ? 4 : 1}
          maxLength={isMultiline ? 500 : 100}
          keyboardType={keyboardType}
          onFocus={() => setFocusedInput(id)}
          onBlur={() => setFocusedInput(null)}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Sleek Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Collaboration
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selection Grid */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
            <View style={styles.typeGrid}>
              {COLLAB_TYPES.map((collabType) => {
                const isSelected = type === collabType.value;
                return (
                  <TouchableOpacity
                    key={collabType.value}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isSelected
                          ? colors.backgroundSecondary
                          : colors.card,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setType(collabType.value)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={collabType.icon as any}
                      size={28}
                      color={isSelected ? colors.accent : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isSelected ? colors.accent : colors.text },
                      ]}
                    >
                      {collabType.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeDescription,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {collabType.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Title Input */}
          {renderInput(
            "Title *",
            title,
            setTitle,
            "e.g., Looking for a producer for my EP",
            "title",
          )}

          {/* Description Input */}
          {renderInput(
            "Description",
            description,
            setDescription,
            "Describe what you're looking for...",
            "desc",
            true,
          )}

          {/* Genre Dropdown */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Genre</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                {
                  backgroundColor: colors.card,
                  borderColor: isGenreDropdownOpen
                    ? colors.accent
                    : colors.border,
                  borderWidth: isGenreDropdownOpen ? 2 : 1,
                },
              ]}
              onPress={toggleGenreDropdown}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: genre ? colors.text : colors.textTertiary },
                ]}
              >
                {genre || "Select a genre"}
              </Text>
              <Ionicons
                name={isGenreDropdownOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Dropdown Content */}
            {isGenreDropdownOpen && (
              <View
                style={[
                  styles.dropdownList,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {GENRE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      genre === option && {
                        backgroundColor: colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => {
                      setGenre(option);
                      toggleGenreDropdown();
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color: genre === option ? colors.accent : colors.text,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    {genre === option && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Price / Min Bid */}
          {type === "AUCTION"
            ? renderInput(
                "Minimum Bid ($) *",
                minBid,
                setMinBid,
                "Enter minimum bid",
                "minBid",
                false,
                "decimal-pad",
              )
            : renderInput(
                "Price ($)",
                price,
                setPrice,
                "Enter price (optional)",
                "price",
                false,
                "decimal-pad",
              )}

          {/* Location */}
          {renderInput(
            "Location",
            location,
            setLocation,
            "e.g., Los Angeles, CA or Remote",
            "location",
          )}

          {/* Duration & Slots (Split Row) */}
          <View style={styles.row}>
            <View style={[styles.halfSection, { marginRight: Spacing.md }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Duration (hours)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      focusedInput === "duration"
                        ? colors.accent
                        : colors.border,
                    borderWidth: focusedInput === "duration" ? 2 : 1,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., 2"
                placeholderTextColor={colors.textTertiary}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                onFocus={() => setFocusedInput("duration")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={styles.halfSection}>
              <Text style={[styles.label, { color: colors.text }]}>Slots</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      focusedInput === "slots" ? colors.accent : colors.border,
                    borderWidth: focusedInput === "slots" ? 2 : 1,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., 3"
                placeholderTextColor={colors.textTertiary}
                value={slots}
                onChangeText={setSlots}
                keyboardType="number-pad"
                onFocus={() => setFocusedInput("slots")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Action Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.accent },
              (!title.trim() || createCollaboration.isPending) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!title.trim() || createCollaboration.isPending}
            activeOpacity={0.8}
          >
            {createCollaboration.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.createButtonText}>
                  Create Collaboration
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.xl + 2, // Increased font
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  section: {
    marginTop: Spacing.xl, // Increased spacing between sections
  },
  halfSection: {
    flex: 1,
    marginTop: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: FontSizes.base, // Increased from sm
    fontWeight: "600",
    marginBottom: Spacing.sm + 2,
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: BorderRadius.lg, // Sleeker roundness
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.lg, // Larger input text
    height: 56, // Taller touch target
  },
  textArea: {
    height: 140,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  // Type Cards
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: Spacing.md,
  },
  typeOption: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeLabel: {
    fontSize: FontSizes.base + 1,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },
  typeDescription: {
    fontSize: FontSizes.sm,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  // Genre Dropdown Styles
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  dropdownText: {
    fontSize: FontSizes.lg,
  },
  dropdownList: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  dropdownItemText: {
    fontSize: FontSizes.base,
    fontWeight: "500",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    // Add shadow to footer upwards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18, // Taller button
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: "#fff",
    fontSize: FontSizes.lg,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
