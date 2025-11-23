import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useProducerDetail, useRequestService } from '@/hooks/useProducers';

type Tab = 'about' | 'studios' | 'beats' | 'services';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function ProducerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budget, setBudget] = useState('');

  const { data: producer, isLoading } = useProducerDetail(id);
  const requestService = useRequestService();

  const handleRequestService = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      Alert.alert('Error', 'Please fill in project title and description');
      return;
    }

    if (!user || !id) return;

    try {
      await requestService.mutateAsync({
        producerId: id,
        clientId: user.id,
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        budget: budget ? parseFloat(budget) : undefined,
      });

      Alert.alert('Success', 'Service request sent successfully!');
      setShowRequestModal(false);
      setProjectTitle('');
      setProjectDescription('');
      setBudget('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!producer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Producer not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Producer</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Producer Info */}
        <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
            {producer.user.avatar ? (
              <Text style={{ fontSize: 48 }}>👤</Text>
            ) : (
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {producer.user.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {producer.user.fullName || producer.user.username}
              </Text>
              {producer.user.verified && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.handle, { color: colors.textSecondary }]}>
              @{producer.user.username}
            </Text>

            {producer.user.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.textTertiary} />
                <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                  {producer.user.location}
                </Text>
              </View>
            )}

            {producer.user.bio && (
              <Text style={[styles.bio, { color: colors.text }]}>
                {producer.user.bio}
              </Text>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {producer.studios?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Studios
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {producer.beats?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Beats
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatNumber(producer.user.followersCount)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Followers
                </Text>
              </View>
            </View>

            {/* Request Service Button */}
            {user && user.id !== producer.userId && (
              <TouchableOpacity
                style={[styles.requestButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowRequestModal(true)}
              >
                <Ionicons name="briefcase" size={18} color="#fff" />
                <Text style={styles.requestButtonText}>Request Service</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {[
            { key: 'about', label: 'About' },
            { key: 'studios', label: `Studios (${producer.studios?.length || 0})` },
            { key: 'beats', label: `Beats (${producer.beats?.length || 0})` },
            { key: 'services', label: `Services (${producer.services?.length || 0})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key as Tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'about' && (
            <View style={styles.aboutSection}>
              {producer.genres.length > 0 && (
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Genres
                  </Text>
                  <View style={styles.tagsRow}>
                    {producer.genres.map((genre, index) => (
                      <View
                        key={index}
                        style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
                      >
                        <Text style={[styles.tagText, { color: colors.text }]}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {producer.specialties.length > 0 && (
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Specialties
                  </Text>
                  <View style={styles.tagsRow}>
                    {producer.specialties.map((specialty, index) => (
                      <View
                        key={index}
                        style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
                      >
                        <Text style={[styles.tagText, { color: colors.text }]}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {producer.experience !== undefined && (
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Experience
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {producer.experience} years
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'studios' && (
            <View style={styles.listSection}>
              {producer.studios && producer.studios.length > 0 ? (
                producer.studios.map((studio) => (
                  <View
                    key={studio.id}
                    style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.listTitle, { color: colors.text }]}>
                      {studio.name}
                    </Text>
                    <View style={styles.listRow}>
                      <Ionicons name="location" size={14} color={colors.textTertiary} />
                      <Text style={[styles.listText, { color: colors.textSecondary }]}>
                        {studio.location}
                      </Text>
                    </View>
                    <View style={styles.listRow}>
                      <Ionicons name="cash" size={14} color={colors.textTertiary} />
                      <Text style={[styles.listText, { color: colors.textSecondary }]}>
                        ${studio.hourlyRate}/hour
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No studios listed
                </Text>
              )}
            </View>
          )}

          {activeTab === 'beats' && (
            <View style={styles.listSection}>
              {producer.beats && producer.beats.length > 0 ? (
                producer.beats.map((beat) => (
                  <View
                    key={beat.id}
                    style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.listTitle, { color: colors.text }]}>
                      {beat.title}
                    </Text>
                    <View style={styles.listRow}>
                      {beat.bpm && (
                        <>
                          <Ionicons name="pulse" size={14} color={colors.textTertiary} />
                          <Text style={[styles.listText, { color: colors.textSecondary }]}>
                            {beat.bpm} BPM
                          </Text>
                        </>
                      )}
                      <Ionicons name="cash" size={14} color={colors.textTertiary} />
                      <Text style={[styles.listText, { color: colors.textSecondary }]}>
                        ${beat.price}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No beats available
                </Text>
              )}
            </View>
          )}

          {activeTab === 'services' && (
            <View style={styles.listSection}>
              {producer.services && producer.services.length > 0 ? (
                producer.services.map((service) => (
                  <View
                    key={service.id}
                    style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.listTitle, { color: colors.text }]}>
                      {service.title}
                    </Text>
                    <View style={styles.listRow}>
                      <Ionicons name="pricetag" size={14} color={colors.textTertiary} />
                      <Text style={[styles.listText, { color: colors.textSecondary }]}>
                        {service.category}
                      </Text>
                    </View>
                    <View style={styles.listRow}>
                      <Ionicons name="cash" size={14} color={colors.textTertiary} />
                      <Text style={[styles.listText, { color: colors.textSecondary }]}>
                        ${service.price}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No services offered
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Request Service Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowRequestModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Request Service</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
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
    </View>
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
    paddingTop: 48,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
  profileSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FontWeights.semiBold,
  },
  profileInfo: {},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  name: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  handle: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: FontSizes.sm,
  },
  bio: {
    fontSize: FontSizes.base,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.sm,
    marginRight: Spacing.lg,
    position: 'relative',
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  aboutSection: {
    gap: Spacing.md,
  },
  infoBlock: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSizes.base,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSizes.sm,
  },
  listSection: {
    gap: Spacing.sm,
  },
  listCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  listTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  listText: {
    fontSize: FontSizes.sm,
  },
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
