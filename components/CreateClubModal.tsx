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
import { ClubType } from '@/types/database';

interface CreateClubModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

// Club types mapped to roles they grant (matching web app)
const CLUB_TYPES: Array<{
  value: ClubType;
  label: string;
  emoji: string;
  grantsRole: string;
  description: string;
}> = [
  {
    value: 'RECORDING',
    label: 'Recording',
    emoji: '🎙️',
    grantsRole: 'ARTIST',
    description: 'Recording sessions & vocals'
  },
  {
    value: 'PRODUCTION',
    label: 'Production',
    emoji: '🎚️',
    grantsRole: 'PRODUCER',
    description: 'Mixing & mastering'
  },
  {
    value: 'RENTAL',
    label: 'Rental',
    emoji: '🏠',
    grantsRole: 'STUDIO_OWNER',
    description: 'Studio space rental'
  },
  {
    value: 'MANAGEMENT',
    label: 'Management',
    emoji: '🧑‍💼',
    grantsRole: 'OTHER',
    description: 'Artist & business management'
  },
  {
    value: 'DISTRIBUTION',
    label: 'Distribution',
    emoji: '📣',
    grantsRole: 'OTHER',
    description: 'Promotion & publicity'
  },
  {
    value: 'CREATIVE',
    label: 'Creative',
    emoji: '🎨',
    grantsRole: 'LYRICIST',
    description: 'Artistic direction'
  }
];

// Emoji icon options
const ICON_OPTIONS = ['🎵', '🎸', '🎹', '🎧', '🎼', '🎺', '🎷', '🥁', '🎻', '🎤'];

export default function CreateClubModal({ visible, onClose, userId }: CreateClubModalProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const createClub = useCreateClub();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<ClubType>('RECORDING');
  const [selectedIcon, setSelectedIcon] = useState('🎵');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    try {
      const result = await createClub.mutateAsync({
        name: name.trim(),
        type: selectedType,
        description: description.trim() || undefined,
        icon: selectedIcon,
        ownerId: userId,
      });

      const grantedRole = CLUB_TYPES.find(t => t.value === selectedType)?.grantsRole;
      Alert.alert(
        'Success!',
        `Club created successfully!\n\n🎉 You now have access to the ${grantedRole} community.`
      );
      handleClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create club. Please try again.';
      Alert.alert('Error', errorMessage);
      console.error('Create club error:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedType('RECORDING');
    setSelectedIcon('🎵');
    onClose();
  };

  const selectedClubType = CLUB_TYPES.find(t => t.value === selectedType);

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
            <View style={[styles.preview, { backgroundColor: colors.card }]}>
              <Text style={styles.previewIcon}>{selectedIcon}</Text>
              {name.trim() && (
                <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                  {name}
                </Text>
              )}
              {selectedClubType && (
                <Text style={[styles.previewType, { color: colors.textSecondary }]}>
                  {selectedClubType.label}
                </Text>
              )}
            </View>
          </View>

          {/* Club Icon Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.iconOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedIcon === emoji && {
                      borderColor: colors.accent,
                      backgroundColor: colors.backgroundSecondary
                    },
                  ]}
                  onPress={() => setSelectedIcon(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.iconEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Club Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Club Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Studio Alpha"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Club Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Selecting a type grants you the corresponding role
            </Text>
            <View style={styles.typeGrid}>
              {CLUB_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedType === type.value && {
                      borderColor: colors.accent,
                      backgroundColor: colors.backgroundSecondary
                    },
                  ]}
                  onPress={() => setSelectedType(type.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[
                    styles.typeLabel,
                    { color: selectedType === type.value ? colors.text : colors.textSecondary }
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.typeDescription, { color: colors.textTertiary }]} numberOfLines={2}>
                    {type.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
              placeholder="What makes your club special?"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
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
    width: 140,
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  previewName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  previewType: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSizes.xs,
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
    height: 80,
    paddingTop: Spacing.sm + 2,
    textAlignVertical: 'top',
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
  iconEmoji: {
    fontSize: 28,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeOption: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 100,
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
    lineHeight: 14,
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
