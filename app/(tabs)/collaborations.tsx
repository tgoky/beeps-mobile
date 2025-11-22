import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

type CollabTab = 'browse' | 'my-collabs';

export default function CollaborationsScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const [activeTab, setActiveTab] = useState<CollabTab>('browse');

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
        <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.accent }]}>
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

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name={activeTab === 'browse' ? 'account-search' : 'account-group'}
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeTab === 'browse' ? 'Available Opportunities' : 'Your Collaborations'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeTab === 'browse'
              ? 'Browse collaboration opportunities\nfrom other creators'
              : 'Your active and past collaborations\nwill appear here'}
          </Text>
        </View>
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
