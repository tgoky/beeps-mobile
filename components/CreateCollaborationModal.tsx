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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useCreateCollaboration } from '@/hooks/useCollaborations';
import { CollaborationType } from '@/types/database';

interface CreateCollaborationModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const COLLAB_TYPES: { value: CollaborationType; label: string; icon: string; description: string }[] = [
  { value: 'PROJECT', label: 'Project', icon: 'folder-music', description: 'Long-term collaboration' },
  { value: 'SESSION', label: 'Session', icon: 'record-circle', description: 'Recording session' },
  { value: 'GIG', label: 'Gig', icon: 'microphone-variant', description: 'Performance opportunity' },
  { value: 'AUCTION', label: 'Auction', icon: 'gavel', description: 'Bid for opportunity' },
];

const GENRE_OPTIONS = [
  'Hip-Hop',
  'R&B',
  'Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Country',
  'Latin',
  'Other',
];

export default function CreateCollaborationModal({ visible, onClose, userId }: CreateCollaborationModalProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const createCollaboration = useCreateCollaboration();

  const [type, setType] = useState<CollaborationType>('PROJECT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [minBid, setMinBid] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [genre, setGenre] = useState('');
  const [slots, setSlots] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (type === 'AUCTION' && !minBid.trim()) {
      Alert.alert('Error', 'Please enter a minimum bid for auction');
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

      Alert.alert('Success', 'Collaboration created successfully!');
      handleClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create collaboration. Please try again.';
      Alert.alert('Error', errorMessage);
      console.error('Create collaboration error:', error);
    }
  };

  const handleClose = () => {
    setType('PROJECT');
    setTitle('');
    setDescription('');
    setPrice('');
    setMinBid('');
    setDuration('');
    setLocation('');
    setGenre('');
    setSlots('');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Collaboration</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
            <View style={styles.typeGrid}>
              {COLLAB_TYPES.map((collabType) => (
                <TouchableOpacity
                  key={collabType.value}
                  style={[
                    styles.typeOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    type === collabType.value && {
                      borderColor: colors.accent,
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => setType(collabType.value)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={collabType.icon as any}
                    size={24}
                    color={type === collabType.value ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color: type === collabType.value ? colors.accent : colors.text,
                      },
                    ]}
                  >
                    {collabType.label}
                  </Text>
                  <Text style={[styles.typeDescription, { color: colors.textTertiary }]}>
                    {collabType.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Looking for a producer for my EP"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
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
              placeholder="Describe what you're looking for..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Genre */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
              {GENRE_OPTIONS.map((genreOption) => (
                <TouchableOpacity
                  key={genreOption}
                  style={[
                    styles.genreChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    genre === genreOption && {
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setGenre(genre === genreOption ? '' : genreOption)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genreText,
                      { color: genre === genreOption ? '#fff' : colors.text },
                    ]}
                  >
                    {genreOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Price / Min Bid */}
          {type === 'AUCTION' ? (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Minimum Bid ($) *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Enter minimum bid"
                placeholderTextColor={colors.textTertiary}
                value={minBid}
                onChangeText={setMinBid}
                keyboardType="decimal-pad"
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Price ($)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Enter price (optional)"
                placeholderTextColor={colors.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Los Angeles, CA or Remote"
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>

          {/* Duration & Slots */}
          <View style={styles.row}>
            <View style={[styles.halfSection, { marginRight: Spacing.sm }]}>
              <Text style={[styles.label, { color: colors.text }]}>Duration (hours)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="e.g., 2"
                placeholderTextColor={colors.textTertiary}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfSection}>
              <Text style={[styles.label, { color: colors.text }]}>Slots</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="e.g., 3"
                placeholderTextColor={colors.textTertiary}
                value={slots}
                onChangeText={setSlots}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Create Button */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.accent },
              (!title.trim() || createCollaboration.isPending) && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!title.trim() || createCollaboration.isPending}
            activeOpacity={0.7}
          >
            {createCollaboration.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Collaboration</Text>
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
  section: {
    marginTop: Spacing.lg,
  },
  halfSection: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
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
  },
  typeLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.xs,
  },
  typeDescription: {
    fontSize: FontSizes.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  genreScroll: {
    flexDirection: 'row',
  },
  genreChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  genreText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
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
