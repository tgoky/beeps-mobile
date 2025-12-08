import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useServiceRequests, useUpdateServiceRequestStatus } from '@/hooks/useProducers';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type ViewMode = 'sent' | 'received';
type FilterType = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  IN_PROGRESS: '#3B82F6',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function ServiceRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [viewMode, setViewMode] = useState<ViewMode>('sent');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const { data: requests = [], isLoading, refetch } = useServiceRequests(user?.id);
  const updateStatus = useUpdateServiceRequestStatus();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAcceptRequest = (request: any) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const handleRejectRequest = (request: any) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this service request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatus.mutateAsync({
                requestId: request.id,
                status: 'REJECTED',
              });
              Alert.alert('Success', 'Request rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    try {
      await updateStatus.mutateAsync({
        requestId: selectedRequest.id,
        status: 'ACCEPTED',
        producerResponse: responseMessage.trim() || undefined,
      });
      Alert.alert('Success', 'Request accepted');
      setShowResponseModal(false);
      setResponseMessage('');
      setSelectedRequest(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleStartWork = async (requestId: string) => {
    try {
      await updateStatus.mutateAsync({
        requestId,
        status: 'IN_PROGRESS',
      });
      Alert.alert('Success', 'Marked as in progress');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCompleteWork = async (requestId: string) => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this work as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await updateStatus.mutateAsync({
                requestId,
                status: 'COMPLETED',
              });
              Alert.alert('Success', 'Request marked as completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter((request) => {
    // Filter by view mode
    const isReceived = request.producerId === user?.id;
    if (viewMode === 'sent' && isReceived) return false;
    if (viewMode === 'received' && !isReceived) return false;

    // Filter by status
    if (filter === 'all') return true;
    return request.status.toLowerCase() === filter.replace('_', '_');
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Service Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* View Mode Toggle */}
      <View style={[styles.viewModeContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[
            styles.viewModeTab,
            viewMode === 'sent' && { backgroundColor: colors.accent },
          ]}
          onPress={() => setViewMode('sent')}
        >
          <Ionicons
            name="send"
            size={16}
            color={viewMode === 'sent' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.viewModeText,
              { color: viewMode === 'sent' ? '#fff' : colors.textSecondary },
            ]}
          >
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeTab,
            viewMode === 'received' && { backgroundColor: colors.accent },
          ]}
          onPress={() => setViewMode('received')}
        >
          <Ionicons
            name="briefcase"
            size={16}
            color={viewMode === 'received' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.viewModeText,
              { color: viewMode === 'received' ? '#fff' : colors.textSecondary },
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'pending', 'accepted', 'in_progress', 'completed'] as FilterType[]).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterTab,
                filter === filterType && { backgroundColor: colors.accent },
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === filterType ? '#fff' : colors.textSecondary },
                ]}
              >
                {filterType === 'in_progress' ? 'In Progress' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {viewMode === 'sent'
              ? 'You haven\'t sent any service requests yet'
              : 'You haven\'t received any service requests yet'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {filteredRequests.map((request) => {
            const isReceived = request.producerId === user?.id;
            const otherUser = isReceived ? request.client : request.producer;
            const canManage = isReceived && request.status === 'PENDING';
            const canStart = isReceived && request.status === 'ACCEPTED';
            const canComplete = isReceived && request.status === 'IN_PROGRESS';

            return (
              <View
                key={request.id}
                style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Header */}
                <View style={styles.requestHeader}>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {otherUser?.fullName || otherUser?.username || 'Unknown User'}
                    </Text>
                    <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
                      @{otherUser?.username}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[request.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[request.status] }]}>
                      {STATUS_LABELS[request.status]}
                    </Text>
                  </View>
                </View>

                {/* Project Details */}
                <View style={styles.projectSection}>
                  <Text style={[styles.projectTitle, { color: colors.text }]}>{request.projectTitle}</Text>
                  <Text style={[styles.projectDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                    {request.projectDescription}
                  </Text>
                </View>

                {/* Meta Info */}
                <View style={styles.metaSection}>
                  {request.budget && (
                    <View style={styles.metaRow}>
                      <Ionicons name="cash-outline" size={16} color={colors.textTertiary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        Budget: ${request.budget}
                      </Text>
                    </View>
                  )}
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {dayjs(request.createdAt).fromNow()}
                    </Text>
                  </View>
                </View>

                {/* Producer Response */}
                {request.producerResponse && (
                  <View style={[styles.responseSection, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.responseLabel, { color: colors.textSecondary }]}>Response:</Text>
                    <Text style={[styles.responseText, { color: colors.text }]}>{request.producerResponse}</Text>
                  </View>
                )}

                {/* Actions */}
                {canManage && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.acceptButton, { backgroundColor: colors.accent }]}
                      onPress={() => handleAcceptRequest(request)}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectButton, { borderColor: colors.error }]}
                      onPress={() => handleRejectRequest(request)}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                      <Text style={[styles.rejectButtonText, { color: colors.error }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {canStart && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleStartWork(request.id)}
                  >
                    <Ionicons name="play-circle" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Work</Text>
                  </TouchableOpacity>
                )}

                {canComplete && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.accent }]}
                    onPress={() => handleCompleteWork(request.id)}
                  >
                    <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowResponseModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Accept Request</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              You can optionally add a message to the client about accepting their request.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Response Message (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., I'd be happy to work on this project! When would you like to start?"
                placeholderTextColor={colors.textTertiary}
                value={responseMessage}
                onChangeText={setResponseMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.accent }]}
              onPress={handleSubmitResponse}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Accept Request</Text>
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
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  viewModeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  requestCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  userHandle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  projectSection: {
    marginBottom: Spacing.md,
  },
  projectTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  projectDescription: {
    fontSize: FontSizes.base,
    lineHeight: 20,
  },
  metaSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.sm,
  },
  responseSection: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  responseLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
    marginBottom: 4,
  },
  responseText: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  rejectButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
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
  modalDescription: {
    fontSize: FontSizes.base,
    lineHeight: 22,
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
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
    height: 100,
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
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
