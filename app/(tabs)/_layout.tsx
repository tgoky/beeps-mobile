import {
  Manrope_600SemiBold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// 🎨 THEME COLORS
const COLORS = {
  background: "#000000", // Deep Black
  border: "#222222", // Subtle border

  // Active State
  activeBg: "#1A1A1A", // Lighter black pill
  activeIcon: "#747373", // Brand Amber
  activeText: "#FFFFFF", // White text

  // Inactive State
  inactiveText: "#666666",
  inactiveIcon: "#666666",
};

/**
 * 1. Custom Tab Item Component
 * Renders an animated pill with Manrope font and Brand colors.
 */
const CustomTabItem = ({
  name,
  label,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  focused: boolean;
}) => {
  const animation = useSharedValue(0);

  useEffect(() => {
    // Spring animation for a snappier feel
    animation.value = withSpring(focused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [focused]);

  // 1. Background Animation (Transparent -> Dark Grey Pill)
  const containerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animation.value,
      [0, 1],
      ["transparent", COLORS.activeBg],
    );
    return { backgroundColor };
  });

  // 2. Icon Color Animation (Grey -> Amber)
  const iconStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animation.value,
      [0, 1],
      [COLORS.inactiveIcon, COLORS.activeIcon],
    );
    // Slight scale up on focus
    const scale = 1 + animation.value * 0.1;
    return { color, transform: [{ scale }] };
  });

  // 3. Text Color Animation (Grey -> White)
  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animation.value,
      [0, 1],
      [COLORS.inactiveText, COLORS.activeText],
    );
    return { color };
  });

  const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          containerStyle,
          {
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 6,
            width: 64,
            height: 56,
            borderRadius: 16, // Soft squircle
          },
        ]}
      >
        <AnimatedIcon
          name={focused ? (name as any).replace("-outline", "") : name}
          size={24}
          style={iconStyle}
        />
        <Animated.Text
          style={[
            textStyle,
            {
              fontSize: 10,
              fontFamily: "Manrope_800ExtraBold", // Brand Font
              marginTop: 4,
              textAlign: "center",
              letterSpacing: 0.5,
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_600SemiBold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingTop: 10,
          // Remove default bottom safe area padding to handle it manually or let flex handle it
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem name="home-outline" label="HOME" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem name="grid-outline" label="HUB" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem
              name="people-outline"
              label="CLUBS"
              focused={focused}
            />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem
              name="calendar-outline"
              label="DATE"
              focused={focused}
            />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem
              name="person-outline"
              label="USER"
              focused={focused}
            />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />

      {/* Hidden Routes */}
      <Tabs.Screen name="marketplace" options={{ href: null }} />
      <Tabs.Screen name="producers" options={{ href: null }} />
      <Tabs.Screen name="collaborations" options={{ href: null }} />
    </Tabs>
  );
}
