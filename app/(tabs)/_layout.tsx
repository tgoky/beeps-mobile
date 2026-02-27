import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// 1. Enhanced Icon Component with "Pill" Background
const TabIcon = ({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
}) => {
  // Shared values for animation
  const scale = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  React.useEffect(() => {
    // Animate the scale of the pill (0 -> 1)
    scale.value = withSpring(focused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    // Animate the color transition wrapper
    colorProgress.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  // Style for the background Pill
  const pillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value, // Fade in as it grows
    };
  });

  // Style for the Icon (Optional: animate color if you want)
  // In this design, we keep the icon white, but the pill gives it contrast

  return (
    <Animated.View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 50,
        height: 50,
      }}
    >
      {/* THE PILL BACKGROUND */}
      <Animated.View
        style={[
          pillStyle,
          {
            position: "absolute",
            width: 48, // Width of the pill
            height: 32, // Height of the pill
            borderRadius: 20, // Fully rounded corners
            backgroundColor: "#222222", // A lighter gray to stand out on Black
            zIndex: -1, // Ensure it sits BEHIND the icon
          },
        ]}
      />

      {/* THE ICON */}
      <Ionicons
        // Switch between Outline and Filled
        name={focused ? (name as any).replace("-outline", "") : name}
        // Force White when focused, Gray when inactive
        color={focused ? "#FFFFFF" : "#666666"}
        size={24}
      />
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // We handle colors manually in the icon now, but these are fallbacks
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#666666",

        tabBarStyle: {
          backgroundColor: "#000000", // Pure Black
          borderTopWidth: 0, // Removed border for a cleaner "floating" look
          elevation: 0,
          height: Platform.OS === "ios" ? 85 : 60,
          paddingTop: 10,
        },
        tabBarBackground: undefined, // No blur
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="compass-outline" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: "Hub",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="musical-notes-outline" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="people-outline" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-outline" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focused={focused} />
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
