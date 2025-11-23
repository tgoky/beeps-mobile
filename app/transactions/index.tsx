import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useTransactions, useTransactionStats } from '@/hooks/useTransactions';
import { TransactionType, TransactionStatus } from '@/types/database';
import dayjs from 'dayjs';

type FilterType = 'all' | TransactionType;

const TYPE_ICONS: Record<TransactionType, string> = {
  BEAT_PURCHASE: 'musical-notes',
  EQUIPMENT_PURCHASE: 'hardware-chip',
  STUDIO_BOOKING: 'business',
  SERVICE_PAYMENT: 'briefcase',
  SUBSCRIPTION: 'star',
};

const TYPE_LABELS: Record<TransactionType, string> = {
  BEAT_PURCHASE: 'Beat Purchase',
  EQUIPMENT_PURCHASE: 'Equipment',
  STUDIO_BOOKING: 'Studio Booking',
  SERVICE_PAYMENT: 'Service',
  SUBSCRIPTION: 'Subscription',
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDING: '#F59E0B',
  COMPLETED: '#10B981',
  FAILED: '#EF4444',
  REFUNDED: '#6B7280',
};

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: transactions = [], isLoading, refetch } = useTransactions(user?.id);
  const { data: stats } = useTransactionStats(user?.id);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>${stats.total.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transactions</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.count}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === 'all' ? '#fff' : colors.textSecondary,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {(Object.keys(TYPE_LABELS) as TransactionType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                filter === type && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => setFilter(type)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === type ? '#fff' : colors.textSecondary,
                  },
                ]}
              >
                {TYPE_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {filter === 'all'
              ? 'Your transaction history will appear here'
              : `No ${TYPE_LABELS[filter as TransactionType]?.toLowerCase()} transactions found`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {filteredTransactions.map((transaction) => (
            <View
              key={transaction.id}
              style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.transactionHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.accent + '20' },
                  ]}
                >
                  <Ionicons name={TYPE_ICONS[transaction.type] as any} size={24} color={colors.accent} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionType, { color: colors.text }]}>
                    {TYPE_LABELS[transaction.type]}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
                    {dayjs(transaction.createdAt).format('MMM D, YYYY • h:mm A')}
                  </Text>
                  {transaction.description && (
                    <Text style={[styles.transactionDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {transaction.description}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.transactionFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[transaction.status] + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: STATUS_COLORS[transaction.status] }]}>
                    {transaction.status}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, { color: colors.accent }]}>
                  ${transaction.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
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
  statsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
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
  transactionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  transactionDescription: {
    fontSize: FontSizes.sm,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  transactionAmount: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
});
