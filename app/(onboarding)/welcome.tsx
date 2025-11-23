import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'musical-notes',
    title: 'Welcome to Beeps',
    description: 'Your all-in-one platform for music collaboration, studio booking, and creative networking.',
    color: '#6B7280',
  },
  {
    id: '2',
    icon: 'people',
    title: 'Connect with Creators',
    description: 'Find artists, producers, studios, and gear sellers in your area. Build your music network.',
    color: '#9CA3AF',
  },
  {
    id: '3',
    icon: 'calendar',
    title: 'Book Studio Sessions',
    description: 'Browse available studios, check real-time availability, and book sessions instantly.',
    color: '#4B5563',
  },
  {
    id: '4',
    icon: 'cart',
    title: 'Buy & Sell Gear',
    description: 'List your equipment for sale or rent. Discover quality gear from trusted sellers.',
    color: '#6B7280',
  },
  {
    id: '5',
    icon: 'flash',
    title: 'Ready to Create?',
    description: "You're all set! Start exploring, connecting, and creating amazing music together.",
    color: '#9CA3AF',
  },
];

export default function WelcomeOnboarding() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { completeOnboarding: markOnboardingComplete } = useAuth();
  const colors = Colors[effectiveTheme];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    // Mark onboarding as complete
    await markOnboardingComplete();
    // Navigate to main app
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Icon Container */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.text,
          }
        ]}
      >
        <Ionicons name={item.icon} size={64} color={colors.background} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {item.title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {item.description}
      </Text>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: colors.text,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Pagination Dots */}
      {renderPagination()}

      {/* Next/Get Started Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.text }
          ]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={[styles.nextButtonText, { color: colors.background }]}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? "checkmark" : "arrow-forward"}
            size={20}
            color={colors.background}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.light,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  description: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.regular,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
    paddingHorizontal: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
  },
});
