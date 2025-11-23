import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

export default function AuthLanding() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Section - Branding */}
      <View style={styles.topSection}>
        {/* Logo */}
        <View style={[styles.logoContainer, { backgroundColor: colors.text }]}>
          <Ionicons name="musical-notes" size={64} color={colors.background} />
        </View>

        {/* App Name & Tagline */}
        <Text style={[styles.appName, { color: colors.text }]}>Beeps</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Where Music Creators Connect
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="people"
            text="Find collaborators"
            color={colors.textSecondary}
          />
          <FeatureItem
            icon="calendar"
            text="Book studios"
            color={colors.textSecondary}
          />
          <FeatureItem
            icon="cart"
            text="Buy & sell gear"
            color={colors.textSecondary}
          />
        </View>
      </View>

      {/* Bottom Section - Auth Buttons */}
      <View style={styles.bottomSection}>
        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.9}
        >
          <Text style={[styles.primaryButtonText, { color: colors.background }]}>
            Create Account
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={colors.background}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Sign In
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.textTertiary }]}>
          By continuing, you agree to our{'\n'}
          <Text style={{ color: colors.textSecondary }}>Terms of Service</Text> and{' '}
          <Text style={{ color: colors.textSecondary }}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
      <Text style={[styles.featureText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 128,
    height: 128,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: FontSizes['5xl'],
    fontWeight: FontWeights.light,
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.5,
    marginBottom: 48,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.3,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
  },
  terms: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});
