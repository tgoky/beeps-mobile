/**
 * Premium design system for Beeps Mobile
 * Using iOS System Fonts (San Francisco) - Clean, modern, optimized
 * Sophisticated ash gray color palette for professional feel
 */

import { Platform } from 'react-native';

// Brand colors - Sophisticated ash gray palette
const primaryColor = '#6B7280'; // Gray 500 - Professional, timeless
const secondaryColor = '#9CA3AF'; // Gray 400 - Subtle accent
const accentColor = '#4B5563'; // Gray 600 - Strong contrast

export const Colors = {
  light: {
    // Primary palette
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,

    // Text colors
    text: '#111827', // Gray 900 - Deep, readable
    textSecondary: '#4B5563', // Gray 600
    textTertiary: '#9CA3AF', // Gray 400

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB', // Gray 50
    backgroundTertiary: '#F3F4F6', // Gray 100

    // UI elements
    border: '#E5E7EB', // Gray 200
    card: '#FFFFFF',
    tint: primaryColor,

    // Icons
    icon: '#6B7280', // Gray 500
    tabIconDefault: '#9CA3AF', // Gray 400
    tabIconSelected: accentColor,

    // Status colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    info: primaryColor,
  },
  dark: {
    // Primary palette
    primary: '#9CA3AF', // Gray 400 - Lighter for dark mode
    secondary: '#6B7280', // Gray 500
    accent: '#D1D5DB', // Gray 300

    // Text colors
    text: '#F9FAFB', // Gray 50
    textSecondary: '#D1D5DB', // Gray 300
    textTertiary: '#6B7280', // Gray 500

    // Backgrounds
    background: '#111827', // Gray 900
    backgroundSecondary: '#1F2937', // Gray 800
    backgroundTertiary: '#374151', // Gray 700

    // UI elements
    border: '#374151', // Gray 700
    card: '#1F2937', // Gray 800
    tint: '#9CA3AF',

    // Icons
    icon: '#9CA3AF', // Gray 400
    tabIconDefault: '#6B7280', // Gray 500
    tabIconSelected: '#D1D5DB', // Gray 300

    // Status colors
    success: '#34D399', // Green 400
    warning: '#FBBF24', // Amber 400
    error: '#F87171', // Red 400
    info: '#9CA3AF', // Gray 400
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

// Font weight mapping for system fonts (lighter, friendlier)
export const FontWeights: { [key: string]: any } = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Typography scale (reduced sizes for friendlier feel)
export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 19,
  '2xl': 22,
  '3xl': 26,
  '4xl': 32,
  '5xl': 42,
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
