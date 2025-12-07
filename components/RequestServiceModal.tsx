import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useRequestService } from '@/hooks/useProducers';

interface RequestServiceModalProps {
  visible: boolean;
  onClose: () => void;
  producerId: string;
  producerName: string;
  clientId: string;
}

export function RequestServiceModal({
  visible,
  onClose,
  producerId,
  producerName,
  clientId,
}: RequestServiceModalProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const requestService = useRequestService();

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budget, setBudget] = useState('');

  const handleClose = () => {
    setProjectTitle('');
    setProjectDescription('');
    setBudget('');
    onClose();
  };

  const handleRequestService = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      Alert.alert('Error', 'Please fill in project title and description');
      return;
    }

    try {
      await requestService.mutateAsync({
        producerId,
        clientId,
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        budget: budget ? parseFloat(budget) : undefined,
      });

      Alert.alert('Success', 'Service request sent successfully!');
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Request Service</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={[styles.producerName, { color: colors.textSecondary }]}>
            Requesting service from {producerName}
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Project Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Mix & Master my EP"
              placeholderTextColor={colors.textTertiary}
              value={projectTitle}
              onChangeText={setProjectTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Project Description *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe your project, timeline, and expectations..."
              placeholderTextColor={colors.textTertiary}
              value={projectDescription}
              onChangeText={setProjectDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Budget (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 500"
              placeholderTextColor={colors.textTertiary}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.accent },
              (!projectTitle.trim() || !projectDescription.trim() || requestService.isPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleRequestService}
            disabled={!projectTitle.trim() || !projectDescription.trim() || requestService.isPending}
          >
            {requestService.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Send Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  producerName: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
    height: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
