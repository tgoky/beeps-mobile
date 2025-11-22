import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useAllStudiosDebug, useUpdateStudioStatus } from '@/hooks/useStudios';
import { router } from 'expo-router';

export default function DebugStudiosScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const { data: studios, isLoading } = useAllStudiosDebug();
  const updateStudioStatus = useUpdateStudioStatus();

  const handleToggleStatus = async (studioId: string, currentStatus: boolean) => {
    try {
      await updateStudioStatus.mutateAsync({
        studioId,
        isActive: !currentStatus,
      });
    } catch (error) {
      console.error('Failed to update studio status:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading studios...
          </Text>
        </View>
      </View>
    );
  }

  const activeStudios = studios?.filter(s => s.isActive) || [];
  const inactiveStudios = studios?.filter(s => !s.isActive) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Studio Manager
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: colors.accent }]}>
              {studios?.length || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Studios
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: colors.success }]}>
              {activeStudios.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Active
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: colors.error }]}>
              {inactiveStudios.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Inactive
            </Text>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      {inactiveStudios.length > 0 && (
        <View style={[styles.infoBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {inactiveStudios.length} studio{inactiveStudios.length !== 1 ? 's are' : ' is'} hidden from the app.
            Toggle the switch to activate.
          </Text>
        </View>
      )}

      {/* Studios List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {studios && studios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No studios found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create a studio on the web app to see it here
            </Text>
          </View>
        ) : (
          studios?.map((studio) => (
            <View
              key={studio.id}
              style={[
                styles.studioCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: studio.isActive ? 1 : 0.6,
                },
              ]}
            >
              <View style={styles.studioHeader}>
                <View style={styles.studioInfo}>
                  <View style={styles.studioTitleRow}>
                    <Text style={[styles.studioName, { color: colors.text }]} numberOfLines={1}>
                      {studio.name}
                    </Text>
                    {studio.isActive ? (
                      <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.success }]}>Active</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.error }]}>Inactive</Text>
                      </View>
                    )}
                  </View>
                  {studio.city && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                        {studio.city}{studio.state ? `, ${studio.state}` : ''}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.ownerText, { color: colors.textSecondary }]}>
                    Owner: {studio.owner.fullName || studio.owner.username}
                  </Text>
                  {studio.hourlyRate > 0 && (
                    <Text style={[styles.priceText, { color: colors.textSecondary }]}>
                      ${studio.hourlyRate}/hr
                    </Text>
                  )}
                </View>
                <Switch
                  value={studio.isActive}
                  onValueChange={() => handleToggleStatus(studio.id, studio.isActive)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={studio.isActive ? '#fff' : colors.textTertiary}
                  ios_backgroundColor={colors.border}
                  disabled={updateStudioStatus.isPending}
                />
              </View>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  summaryContainer: {
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: 18,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  studioCard: {
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
  studioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  studioInfo: {
    flex: 1,
  },
  studioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  studioName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    flex: 1,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  ownerText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    marginBottom: 4,
  },
  priceText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing['2xl'] * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
