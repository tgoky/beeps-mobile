import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';

export function AppLoadingScreen() {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: colors.text,
          }
        ]}
      >
        <Ionicons name="musical-notes" size={48} color={colors.background} />
      </Animated.View>

      {/* App Name */}
      <Text style={[styles.appName, { color: colors.text }]}>Beeps</Text>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>
        Connect. Collaborate. Create.
      </Text>

      {/* Loading Indicator */}
      <Animated.View
        style={[
          styles.spinner,
          {
            transform: [{ rotate }],
            borderColor: colors.border,
            borderTopColor: colors.text,
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
    marginBottom: 48,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderRadius: 20,
    borderStyle: 'solid',
  },
});
