import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useCollaborations, useMyCollaborations } from '@/hooks/useCollaborations';
import CreateCollaborationModal from '@/components/CreateCollaborationModal';

type CollabTab = 'browse' | 'my-collabs';

export default function CollaborationsScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CollabTab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch data
  const { data: collaborations, isLoading: collaborationsLoading } = useCollaborations();
  const { data: myCollaborations, isLoading: myCollabsLoading } = useMyCollaborations(user?.id);

  // Filter collaborations based on search query
  const filteredCollaborations = useMemo(() => {
    if (!collaborations || !searchQuery.trim()) return collaborations;
    const query = searchQuery.toLowerCase();
    return collaborations.filter(
      (collab) =>
        collab.title.toLowerCase().includes(query) ||
        collab.description?.toLowerCase().includes(query) ||
        collab.genre?.toLowerCase().includes(query) ||
        collab.location?.toLowerCase().includes(query) ||
        collab.creator.username.toLowerCase().includes(query) ||
        collab.creator.fullName?.toLowerCase().includes(query)
    );
  }, [collaborations, searchQuery]);

  const filteredMyCollaborations = useMemo(() => {
    if (!myCollaborations || !searchQuery.trim()) return myCollaborations;
    const query = searchQuery.toLowerCase();
    return myCollaborations.filter(
      (collab) =>
        collab.title.toLowerCase().includes(query) ||
        collab.description?.toLowerCase().includes(query) ||
        collab.genre?.toLowerCase().includes(query) ||
        collab.location?.toLowerCase().includes(query)
    );
  }, [myCollaborations, searchQuery]);

  const getCollabTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      PROJECT: 'Project',
      SESSION: 'Session',
      GIG: 'Gig',
      AUCTION: 'Auction',
    };
    return labels[type] || type;
  };

  const getCollabTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      PROJECT: 'folder-music',
      SESSION: 'record-circle',
      GIG: 'microphone-variant',
      AUCTION: 'gavel',
    };
    return icons[type] || 'music';
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      OPEN: colors.success,
      IN_PROGRESS: colors.warning,
      COMPLETED: colors.textTertiary,
      CANCELLED: colors.error,
    };
    return statusColors[status] || colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Collaborations</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find your next creative partner
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.accent }]}
          onPress={() => {
            if (!user?.id) {
              Alert.alert('Sign In Required', 'Please sign in to create a collaboration');
              return;
            }
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsContainer, { backgroundColor: colors.background }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'browse' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('browse')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === 'browse' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'browse' ? '#fff' : colors.textSecondary },
            ]}
          >
            Browse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'my-collabs' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('my-collabs')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={activeTab === 'my-collabs' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'my-collabs' ? '#fff' : colors.textSecondary },
            ]}
          >
            My Collabs
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search collaborations..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'browse' && (
          <>
            {collaborationsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading collaborations...
                </Text>
              </View>
            ) : filteredCollaborations && filteredCollaborations.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredCollaborations.map((collab) => (
                  <TouchableOpacity
                    key={collab.id}
                    style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <MaterialCommunityIcons
                          name={getCollabTypeIcon(collab.type) as any}
                          size={20}
                          color={colors.accent}
                        />
                        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                          {collab.title}
                        </Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.typeText, { color: colors.accent }]}>
                          {getCollabTypeLabel(collab.type)}
                        </Text>
                      </View>
                    </View>

                    {collab.creator && (
                      <View style={styles.creatorRow}>
                        <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.creatorText, { color: colors.textTertiary }]}>
                          {collab.creator.fullName || collab.creator.username}
                        </Text>
                      </View>
                    )}

                    {collab.description && (
                      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                        {collab.description}
                      </Text>
                    )}

                    <View style={styles.metaRow}>
                      {collab.genre && (
                        <View style={[styles.metaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="musical-notes" size={12} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {collab.genre}
                          </Text>
                        </View>
                      )}
                      {collab.location && (
                        <View style={[styles.metaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="location" size={12} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {collab.location}
                          </Text>
                        </View>
                      )}
                      {collab.slots && (
                        <View style={[styles.metaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="people" size={12} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {collab.slots} slots
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <View>
                        {collab.type === 'AUCTION' && collab.minBid && (
                          <Text style={[styles.priceText, { color: colors.text }]}>
                            Min: ${collab.minBid.toFixed(2)}
                          </Text>
                        )}
                        {collab.type !== 'AUCTION' && collab.price && (
                          <Text style={[styles.priceText, { color: colors.text }]}>
                            ${collab.price.toFixed(2)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: colors.accent }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cardButtonText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 80 }} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-search" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No Collaborations Found' : 'No Opportunities Available'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? `No collaborations match "${searchQuery}"\nTry a different search term`
                    : 'Check back later for new\ncollaboration opportunities'}
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'my-collabs' && (
          <>
            {myCollabsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading your collaborations...
                </Text>
              </View>
            ) : filteredMyCollaborations && filteredMyCollaborations.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredMyCollaborations.map((collab) => (
                  <TouchableOpacity
                    key={collab.id}
                    style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <MaterialCommunityIcons
                          name={getCollabTypeIcon(collab.type) as any}
                          size={20}
                          color={colors.accent}
                        />
                        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                          {collab.title}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(collab.status) }]}>
                        <Text style={styles.statusText}>{collab.status}</Text>
                      </View>
                    </View>

                    {collab.description && (
                      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                        {collab.description}
                      </Text>
                    )}

                    <View style={styles.metaRow}>
                      {collab.genre && (
                        <View style={[styles.metaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="musical-notes" size={12} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {collab.genre}
                          </Text>
                        </View>
                      )}
                      {collab.location && (
                        <View style={[styles.metaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="location" size={12} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {collab.location}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.metaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {getCollabTypeLabel(collab.type)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View>
                        {collab.type === 'AUCTION' && collab.currentBid && (
                          <Text style={[styles.priceText, { color: colors.text }]}>
                            Current: ${collab.currentBid.toFixed(2)}
                          </Text>
                        )}
                        {collab.type !== 'AUCTION' && collab.price && (
                          <Text style={[styles.priceText, { color: colors.text }]}>
                            ${collab.price.toFixed(2)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: colors.accent }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cardButtonText}>Manage</Text>
                        <Ionicons name="settings-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 80 }} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No Collaborations Found' : 'No Collaborations Yet'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? `No collaborations match "${searchQuery}"\nTry a different search term`
                    : 'Create your first collaboration\nto get started'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Collaboration Modal */}
      {user?.id && (
        <CreateCollaborationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={user.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  emptyState: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  gridCard: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    flex: 1,
    letterSpacing: -0.2,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  creatorText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  description: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  priceText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.3,
  },
});
