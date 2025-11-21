import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎵</Text>
            <Text style={styles.logoTitle}>Beeps</Text>
          </View>
          <Text style={styles.welcomeTitle}>Welcome to Beeps</Text>
          <Text style={styles.welcomeSubtitle}>
            Your music production marketplace
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user.fullName || user.username}! 👋</Text>
          <Text style={styles.role}>{user.primaryRole?.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#F0F9FF' }]}>
            <Text style={styles.actionIcon}>🎵</Text>
            <Text style={styles.actionTitle}>Browse Beats</Text>
            <Text style={styles.actionSubtitle}>Find the perfect sound</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={styles.actionIcon}>🎙️</Text>
            <Text style={styles.actionTitle}>Find Studios</Text>
            <Text style={styles.actionSubtitle}>Book recording time</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#FDF4FF' }]}>
            <Text style={styles.actionIcon}>🤝</Text>
            <Text style={styles.actionTitle}>Collaborations</Text>
            <Text style={styles.actionSubtitle}>Connect with artists</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.actionIcon}>🎹</Text>
            <Text style={styles.actionTitle}>Equipment</Text>
            <Text style={styles.actionSubtitle}>Rent or buy gear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No recent activity</Text>
          <Text style={styles.emptyText}>
            Your activity will appear here once you start exploring
          </Text>
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoText: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  logoTitle: {
    fontSize: FontSizes['4xl'],
    fontFamily: Fonts.displayBold,
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  welcomeTitle: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.displayBold,
    marginBottom: Spacing.sm,
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.light,
    color: Colors.light.textSecondary,
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    width: '100%',
    maxWidth: 300,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    width: '100%',
    maxWidth: 300,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: FontSizes.base,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
    backgroundColor: Colors.light.background,
  },
  greeting: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.displayBold,
    marginBottom: Spacing.xs,
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  role: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.medium,
    color: Colors.light.primary,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  section: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.lg,
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    backgroundColor: Colors.light.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.semiBold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  actionSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.light.textSecondary,
    letterSpacing: 0.1,
  },
  emptyState: {
    backgroundColor: Colors.light.background,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.semiBold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
