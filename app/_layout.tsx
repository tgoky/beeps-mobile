import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProviders } from '@/providers/AppProviders';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoadingScreen } from '@/components/ui/shared/AppLoadingScreen';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading, hasCompletedOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't navigate while loading

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAppGroup = inTabsGroup || segments[0] === 'studio' || segments[0] === 'producer' || segments[0] === 'profile' || segments[0] === 'club' || segments[0] === 'community' || segments[0] === 'bookings' || segments[0] === 'transactions' || segments[0] === 'settings' || segments[0] === 'notifications' || segments[0] === 'modal';

    if (!session) {
      // User not authenticated - redirect to auth
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // User authenticated
      if (!hasCompletedOnboarding) {
        // User hasn't completed onboarding - show welcome screens
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)/welcome');
        }
      } else {
        // User authenticated and onboarded - allow main app and detail pages
        if (!inAppGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, loading, hasCompletedOnboarding, segments]);

  // Show loading screen while checking auth
  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="studio/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="producer/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="club/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="community/[role]" options={{ headerShown: false }} />
        <Stack.Screen name="bookings" options={{ headerShown: false }} />
        <Stack.Screen name="transactions" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
