/**
 * Premium design system for Beeps Mobile
 * Using iOS System Fonts (San Francisco) - Clean, modern, optimized
 * Color palette optimized for music/creative industry
 */

import { Platform } from 'react-native';

// Brand colors
const primaryColor = '#6366F1'; // Indigo - Premium, creative
const secondaryColor = '#8B5CF6'; // Purple - Music/audio industry standard
const accentColor = '#EC4899'; // Pink - Energy and creativity

export const Colors = {
  light: {
    // Primary palette
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,

    // Text colors
    text: '#0F172A', // Slate 900 - Deep, readable
    textSecondary: '#475569', // Slate 600
    textTertiary: '#94A3B8', // Slate 400

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC', // Slate 50
    backgroundTertiary: '#F1F5F9', // Slate 100

    // UI elements
    border: '#E2E8F0', // Slate 200
    card: '#FFFFFF',
    tint: primaryColor,

    // Icons
    icon: '#64748B', // Slate 500
    tabIconDefault: '#94A3B8', // Slate 400
    tabIconSelected: primaryColor,

    // Status colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    info: primaryColor,
  },
  dark: {
    // Primary palette
    primary: '#818CF8', // Indigo 400 - Lighter for dark mode
    secondary: '#A78BFA', // Purple 400
    accent: '#F472B6', // Pink 400

    // Text colors
    text: '#F1F5F9', // Slate 100
    textSecondary: '#CBD5E1', // Slate 300
    textTertiary: '#64748B', // Slate 500

    // Backgrounds
    background: '#0F172A', // Slate 900
    backgroundSecondary: '#1E293B', // Slate 800
    backgroundTertiary: '#334155', // Slate 700

    // UI elements
    border: '#334155', // Slate 700
    card: '#1E293B', // Slate 800
    tint: '#818CF8',

    // Icons
    icon: '#94A3B8', // Slate 400
    tabIconDefault: '#64748B', // Slate 500
    tabIconSelected: '#818CF8', // Indigo 400

    // Status colors
    success: '#34D399', // Green 400
    warning: '#FBBF24', // Amber 400
    error: '#F87171', // Red 400
    info: '#818CF8', // Indigo 400
  },
};

// System font weights (iOS San Francisco / Android Roboto)
export const Fonts = {
  // Use system fonts - looks native and premium
  light: Platform.select({ ios: 'System', default: 'sans-serif-light' }),
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  semiBold: Platform.select({ ios: 'System', default: 'sans-serif' }),
  bold: Platform.select({ ios: 'System', default: 'sans-serif' }),
};

// Font weight mapping for system fonts
export const FontWeights: { [key: string]: any } = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Typography scale
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
