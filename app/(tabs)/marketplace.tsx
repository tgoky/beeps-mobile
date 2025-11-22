import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

type MarketplaceTab = 'beats' | 'equipment';

export default function MarketplaceScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('beats');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Marketplace</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Buy beats & equipment
          </Text>
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="options-outline" size={20} color={colors.text} />
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
            activeTab === 'beats' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('beats')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="music-box-multiple"
            size={20}
            color={activeTab === 'beats' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'beats' ? '#fff' : colors.textSecondary },
            ]}
          >
            Beats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === 'equipment' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => setActiveTab('equipment')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="microphone"
            size={20}
            color={activeTab === 'equipment' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'equipment' ? '#fff' : colors.textSecondary },
            ]}
          >
            Equipment
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'beats' && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="music-box-multiple" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Browse Beats</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Discover and purchase high-quality beats{'\n'}from talented producers
            </Text>
          </View>
        )}

        {activeTab === 'equipment' && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="microphone" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Equipment Market</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Buy or rent music production{'\n'}equipment from sellers
            </Text>
          </View>
        )}
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
  filterButton: {
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
});
