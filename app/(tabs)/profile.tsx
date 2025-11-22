import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Not Signed In</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user.fullName || user.username}</Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>
        <Text style={[styles.role, { color: colors.primary }]}>{user.primaryRole}</Text>
      </View>

      <View style={[styles.stats, { backgroundColor: colors.background, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{user.followersCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{user.followingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
        </View>
      </View>

      {user.bio && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/(tabs)/debug-studios')}
        >
          <Text style={[styles.menuText, { color: colors.accent }]}>🔧 Studio Manager (Debug)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleSignOut}>
          <Text style={styles.menuTextDanger}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'] + 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
  name: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.xs,
  },
  role: {
    fontSize: FontSizes.sm,
    textTransform: 'capitalize',
    fontWeight: FontWeights.medium,
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
  },
  section: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  bio: {
    fontSize: FontSizes.base,
    lineHeight: 22,
  },
  menuItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
  },
  menuTextDanger: {
    fontSize: FontSizes.base,
    color: '#FF3B30',
    fontWeight: FontWeights.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    marginBottom: Spacing.lg,
  },
  button: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
});
