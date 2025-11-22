import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useCreateClub } from '@/hooks/useClubs';

interface CreateClubModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const COVER_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const ICON_OPTIONS = [
  { name: 'musical-notes', label: 'Music' },
  { name: 'mic', label: 'Mic' },
  { name: 'headset', label: 'Headset' },
  { name: 'disc', label: 'Disc' },
  { name: 'radio', label: 'Radio' },
  { name: 'videocam', label: 'Video' },
  { name: 'people', label: 'People' },
  { name: 'star', label: 'Star' },
];

export default function CreateClubModal({ visible, onClose, userId }: CreateClubModalProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const createClub = useCreateClub();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COVER_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0].name);
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    try {
      await createClub.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        userId,
        coverColor: selectedColor,
        iconName: selectedIcon,
        category: category.trim() || undefined,
        isPrivate,
      });

      Alert.alert('Success', 'Club created successfully!');
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create club. Please try again.');
      console.error('Create club error:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor(COVER_COLORS[0]);
    setSelectedIcon(ICON_OPTIONS[0].name);
    setCategory('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Club</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={styles.previewSection}>
            <View style={[styles.preview, { backgroundColor: selectedColor }]}>
              <View style={[styles.previewIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons name={selectedIcon as any} size={32} color="#fff" />
              </View>
            </View>
          </View>

          {/* Club Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Club Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter club name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="Describe your club..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Hip-Hop, Production, Recording"
              placeholderTextColor={colors.textTertiary}
              value={category}
              onChangeText={setCategory}
              maxLength={30}
            />
          </View>

          {/* Cover Color */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Cover Color</Text>
            <View style={styles.colorGrid}>
              {COVER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                  activeOpacity={0.7}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  style={[
                    styles.iconOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedIcon === icon.name && { borderColor: colors.accent, backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => setSelectedIcon(icon.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={icon.name as any}
                    size={24}
                    color={selectedIcon === icon.name ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.privacyToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setIsPrivate(!isPrivate)}
              activeOpacity={0.7}
            >
              <View style={styles.privacyInfo}>
                <Text style={[styles.privacyLabel, { color: colors.text }]}>Private Club</Text>
                <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>
                  Only invited members can join
                </Text>
              </View>
              <View
                style={[
                  styles.switch,
                  { backgroundColor: isPrivate ? colors.accent : colors.backgroundSecondary },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    { backgroundColor: '#fff' },
                    isPrivate && styles.switchThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Create Button */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.accent },
              (!name.trim() || createClub.isPending) && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!name.trim() || createClub.isPending}
            activeOpacity={0.7}
          >
            {createClub.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Club</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.base,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.sm + 2,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: FontSizes.sm,
  },
  switch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
