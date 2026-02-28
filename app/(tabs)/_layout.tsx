import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Define the palette based on your screenshots
const COLORS = {
  barBackground: "#000000", // The warm beige/off-white background
  activeBackground: "#434040", // Sharp Black for the active button
  activeText: "#FFFFFF",
  inactiveText: "#9b9b9b",
  inactiveIcon: "#1A1A1A",
};

/**
 * 1. Custom Tab Item Component
 * Renders both the Icon AND the Label inside a single animated container.
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
  // Animation Values
  const animation = useSharedValue(0);

  React.useEffect(() => {
    // 0 = Inactive, 1 = Active
    animation.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  // 1. Background Animation (Transparent -> Black)
  const containerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animation.value,
      [0, 1],
      ["transparent", COLORS.activeBackground],
    );
    return {
      backgroundColor,
    };
  });

  // 2. Text/Icon Color Animation (Black -> White)
  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animation.value,
      [0, 1],
      [COLORS.inactiveText, COLORS.activeText],
    );
    return { color };
  });

  // Helper to apply animated color to Ionicons
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
            paddingVertical: 8,
            paddingHorizontal: 12, // Wider padding for that "button" look
            borderRadius: 12, // Distinct rectangular rounded corners
            width: 70, // Fixed width to prevent jumping
            height: 60,
          },
        ]}
      >
        <AnimatedIcon
          name={focused ? (name as any).replace("-outline", "") : name}
          size={22}
          style={textStyle} // Animates the icon color
        />
        <Animated.Text
          style={[
            textStyle,
            {
              fontSize: 10,
              fontWeight: "600",
              marginTop: 4,
              textAlign: "center",
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // We hide system labels to use our custom ones
        tabBarStyle: {
          backgroundColor: COLORS.barBackground,
          borderTopWidth: 0, // Clean look
          elevation: 0,
          height: Platform.OS === "ios" ? 95 : 80, // Taller bar to accommodate the buttons
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem name="home-outline" label="Home" focused={focused} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem name="grid-outline" label="Hub" focused={focused} />
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
              label="Clubs"
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
              label="Bookings"
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
              label="Profile"
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
