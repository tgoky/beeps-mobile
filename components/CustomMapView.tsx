import * as Haptics from "expo-haptics";
import { Maximize2, Mic2, Minimize2, Navigation } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Rect,
} from "react-native-svg";

// --- Configuration ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_SIZE = 1000;
const INITIAL_SCALE = 1; // Start at 1:1 scale for the radar logic
const VIEWBOX_SIZE = 100;

// 🔥 PROXIMITY SCALE: Controls how far apart things look.
// Higher number = markers appear further away.
// 3000 is a sweet spot for city-level density.
const COORD_SCALE = 3000;

// Vertical Offset to keep markers above the Bottom Sheet
const VERTICAL_OFFSET = SCREEN_HEIGHT * 0.25;

const THEME_COLORS = {
  light: {
    water: "#a5c5d9",
    land: "#e5e7eb",
    greenery: "#c4d7a8",
    road: "#ffffff",
    highway: "#fcd34d",
    highwayOutline: "#a3a3a3",
    text: "#000000",
    cardBg: "rgba(255,255,255,0.85)",
    border: "#000000",
    accent: "#000000",
    marker: "#ffffff",
  },
  dark: {
    water: "#0f172a",
    land: "#18181b",
    greenery: "#14532d",
    road: "#3f3f46",
    highway: "#ca8a04",
    highwayOutline: "#000000",
    text: "#ffffff",
    cardBg: "rgba(24, 24, 27, 0.85)",
    border: "#52525b",
    accent: "#ffffff",
    marker: "#27272a",
  },
};

interface Studio {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hourlyRate: number;
  rating?: number;
  location?: string;
  imageUrl?: string | null;
}

interface CustomMapViewProps {
  studios: Studio[];
  theme: "light" | "dark";
  onStudioPress: (studio: Studio) => void;
  selectedStudio?: Studio | null;
  userLocation?: { latitude: number; longitude: number } | null;
  region: { latitude: number; longitude: number }; // REQUIRED: The center point
}

export default function CustomMapView({
  studios,
  theme,
  onStudioPress,
  selectedStudio,
  userLocation,
  region,
}: CustomMapViewProps) {
  const colors = THEME_COLORS[theme];

  // --- Animation State ---
  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);

  // Center the map content on screen (factoring in the vertical offset)
  const initialX = (SCREEN_WIDTH - MAP_SIZE) / 2;
  const initialY = (SCREEN_HEIGHT - MAP_SIZE) / 2 - VERTICAL_OFFSET;

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const savedTranslateX = useSharedValue(initialX);
  const savedTranslateY = useSharedValue(initialY);

  // --- 🔥 LOGIC: REAL RELATIVE POSITIONING ---
  const getRelativePosition = (lat: number, lon: number) => {
    // 1. Calculate difference from the current Map Center (region)
    const deltaLat = lat - region.latitude;
    const deltaLon = lon - region.longitude;

    // 2. Scale to SVG coordinates (0-100)
    // Center of SVG is (50, 50). Y-axis is inverted.
    const x = 50 + deltaLon * COORD_SCALE;
    const y = 50 - deltaLat * COORD_SCALE;

    return { x, y };
  };

  // --- Effects ---
  // When the Region changes (Search or GPS update), reset the camera to center
  useEffect(() => {
    translateX.value = withTiming(initialX);
    translateY.value = withTiming(initialY);
    scale.value = withTiming(INITIAL_SCALE);
  }, [region.latitude, region.longitude]);

  // --- Gestures ---
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePress = (studio: Studio) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStudioPress(studio);
  };

  const handleLocateMe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reset view
    scale.value = withSpring(INITIAL_SCALE);
    translateX.value = withSpring(initialX);
    translateY.value = withSpring(initialY);
  };

  // Calculate positions
  const userPos = userLocation
    ? getRelativePosition(userLocation.latitude, userLocation.longitude)
    : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.water }]}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.mapContent, animatedStyle]}>
            <Svg width={MAP_SIZE} height={MAP_SIZE} viewBox="0 0 100 100">
              <Defs>
                <Pattern
                  id="waterPattern"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                >
                  <Circle
                    cx="1"
                    cy="1"
                    r="0.5"
                    fill={theme === "dark" ? "#1e293b" : "#93c5fd"}
                    opacity="0.3"
                  />
                </Pattern>
              </Defs>

              {/* 1. Background Visuals (The GTA Skin) */}
              <Rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#waterPattern)"
              />

              <Path
                d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z"
                fill={colors.land}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.5"
              />

              <Path
                d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z"
                fill={colors.greenery}
                opacity="0.8"
              />

              {/* Grid Roads */}
              <G stroke={colors.road} strokeWidth="0.8" opacity="0.6">
                {[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((x) => (
                  <Line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                ))}
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
                  <Line key={`h-${y}`} x1="20" y1={y} x2="100" y2={y} />
                ))}
              </G>

              {/* Highways */}
              <G fill="none">
                <Path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke={colors.highwayOutline}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M 60 100 L 60 40 Q 60 20 100 10"
                  stroke={colors.highwayOutline}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke={colors.highway}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M 60 100 L 60 40 Q 60 20 100 10"
                  stroke={colors.highway}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </G>

              {/* 2. User Location Dot (SVG Layer) */}
              {userPos && (
                <G x={userPos.x} y={userPos.y}>
                  <Circle r="5" fill="#3b82f6" fillOpacity={0.2} />
                </G>
              )}
            </Svg>

            {/* 3. Studio Markers (View Layer for Interaction) */}
            {studios.map((studio) => {
              const pos = getRelativePosition(
                studio.latitude,
                studio.longitude,
              );
              const isSelected = selectedStudio?.id === studio.id;

              // Don't render if way off screen (Optimization)
              if (pos.x < -20 || pos.x > 120 || pos.y < -20 || pos.y > 120)
                return null;

              const left = (pos.x / 100) * MAP_SIZE;
              const top = (pos.y / 100) * MAP_SIZE;

              return (
                <View
                  key={studio.id}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    zIndex: isSelected ? 100 : 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handlePress(studio)}
                    style={[
                      styles.markerContainer,
                      isSelected && styles.markerSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.markerHead,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : colors.marker,
                          borderColor: isSelected ? colors.text : colors.border,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Mic2
                          size={14}
                          color={theme === "dark" ? "#000" : "#fff"}
                          strokeWidth={3}
                        />
                      ) : (
                        <Text
                          style={[styles.markerPrice, { color: colors.text }]}
                        >
                          ${studio.hourlyRate}
                        </Text>
                      )}
                    </View>
                    <View style={styles.markerStick} />
                    {/* Only show name label if selected or zoomed in */}
                    {isSelected && (
                      <View
                        style={[
                          styles.markerLabel,
                          {
                            backgroundColor: colors.cardBg,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.markerLabelText,
                            { color: colors.text },
                          ]}
                        >
                          {studio.name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* 4. User Location Icon (View Layer) */}
            {userPos && (
              <View
                style={{
                  position: "absolute",
                  left: (userPos.x / 100) * MAP_SIZE,
                  top: (userPos.y / 100) * MAP_SIZE,
                  zIndex: 5,
                  transform: [{ translateX: -20 }, { translateY: -20 }],
                }}
              >
                <View style={styles.userLocationPulse} />
                <Navigation
                  size={24}
                  color="#3b82f6"
                  fill="#3b82f6"
                  style={{ transform: [{ rotate: "45deg" }] }}
                />
              </View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* 5. HUD Controls (Retained from Old Code) */}
        <View style={styles.hudZoom}>
          <TouchableOpacity
            onPress={() => (scale.value = withSpring(scale.value * 1.2))}
            style={[
              styles.zoomBtn,
              { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.1)" },
            ]}
          >
            <Maximize2 size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (scale.value = withSpring(scale.value * 0.8))}
            style={styles.zoomBtn}
          >
            <Minimize2 size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLocateMe}
          style={[
            styles.hudLocate,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
          ]}
        >
          <Navigation
            size={20}
            color={userLocation ? "#3b82f6" : colors.text}
            fill={userLocation ? "#3b82f6" : "none"}
          />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  mapContent: {
    width: MAP_SIZE,
    height: MAP_SIZE,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    // Adjust anchor point so stick points to location
    transform: [{ translateX: -18 }, { translateY: -46 }],
  },
  markerSelected: {
    transform: [{ translateX: -18 }, { translateY: -56 }, { scale: 1.1 }],
    zIndex: 100,
  },
  markerHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 2,
  },
  markerPrice: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  markerStick: {
    width: 2,
    height: 12,
    marginTop: -2,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  markerLabel: {
    marginTop: -2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: "800",
  },
  userLocationPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    top: -8,
    left: -8,
  },
  hudZoom: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    right: 20,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  hudLocate: {
    position: "absolute",
    top: Platform.OS === "ios" ? 220 : 200,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
});
