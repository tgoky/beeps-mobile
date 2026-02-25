import * as Haptics from "expo-haptics";
import {
  Maximize2,
  Mic2,
  Minimize2,
  Navigation
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  withTiming
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
const INITIAL_SCALE = 0.6; // Balanced zoom

// 🔥 CRITICAL FIX: Shift map center UP by 25% of screen height.
// This ensures markers appear in the top half, visible above the bottom sheet.
const VERTICAL_OFFSET = SCREEN_HEIGHT * 0.25;

// --- GTA Theme Colors ---
const THEME_COLORS = {
  light: {
    water: "#a5c5d9",
    land: "#e5e7eb",
    greenery: "#c4d7a8",
    beach: "#fde047",
    road: "#ffffff",
    highway: "#fcd34d",
    highwayOutline: "#a3a3a3",
    text: "#000000",
    cardBg: "rgba(255,255,255,0.85)",
    border: "#000000",
    accent: "#000000",
  },
  dark: {
    water: "#0f172a",
    land: "#18181b",
    greenery: "#14532d",
    beach: "#451a03",
    road: "#3f3f46",
    highway: "#ca8a04",
    highwayOutline: "#000000",
    text: "#ffffff",
    cardBg: "rgba(24, 24, 27, 0.85)",
    border: "#52525b",
    accent: "#ffffff",
  },
};

interface Studio {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hourlyRate: number;
  rating: number;
  location?: string;
  imageUrl?: string | null;
  equipment?: string[];
}

interface CustomMapViewProps {
  studios: Studio[];
  theme: "light" | "dark";
  onStudioPress: (studio: Studio) => void;
  selectedStudio?: Studio | null;
  userLocation?: { latitude: number; longitude: number } | null;
  region?: any;
  onRegionChangeComplete?: (region: any) => void;
}

export default function CustomMapView({
  studios,
  theme,
  onStudioPress,
  selectedStudio,
  userLocation,
}: CustomMapViewProps) {
  const colors = THEME_COLORS[theme];

  // --- Animation State ---
  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);

  const initialX = (SCREEN_WIDTH - MAP_SIZE * INITIAL_SCALE) / 2;
  const initialY = (SCREEN_HEIGHT - MAP_SIZE * INITIAL_SCALE) / 2;

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const savedTranslateX = useSharedValue(initialX);
  const savedTranslateY = useSharedValue(initialY);

  // --- Map Coordinate System ---
  // Transforms Real Lat/Lon to Fake Map X/Y (0-1000)
  const getPosition = (lat: number, lon: number) => {
    // We use a deterministic mapping so the same lat/lon always hits the same spot
    const mapMinX = 250,
      mapMaxX = 850;
    const mapMinY = 150,
      mapMaxY = 800;

    if (!lat || !lon) return { x: 500, y: 500 };

    const x = mapMinX + (Math.abs(lon * 1000) % (mapMaxX - mapMinX));
    const y = mapMinY + (Math.abs(lat * 1000) % (mapMaxY - mapMinY));
    return { x, y };
  };

  // --- Focus Logic (The "Camera") ---
  const focusMap = (targetX: number, targetY: number) => {
    "worklet";
    // 1. Determine the center point of the VISIBLE screen area
    const screenCenterX = SCREEN_WIDTH / 2;
    const screenCenterY = SCREEN_HEIGHT / 2 - VERTICAL_OFFSET; // Shifted UP

    // 2. Calculate the translate values needed to put targetX/Y at screenCenterX/Y
    const newTx = screenCenterX - targetX * scale.value;
    const newTy = screenCenterY - targetY * scale.value;

    translateX.value = withTiming(newTx, { duration: 800 });
    translateY.value = withTiming(newTy, { duration: 800 });
    savedTranslateX.value = newTx;
    savedTranslateY.value = newTy;
  };

  // --- Effects ---
  // 1. Center on User Location on Mount/Update
  useEffect(() => {
    if (userLocation) {
      const pos = getPosition(userLocation.latitude, userLocation.longitude);
      focusMap(pos.x, pos.y);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  // 2. Center on Selected Studio
  useEffect(() => {
    if (selectedStudio) {
      const pos = getPosition(
        selectedStudio.latitude,
        selectedStudio.longitude,
      );
      focusMap(pos.x, pos.y);
    }
  }, [selectedStudio]);

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

  const handleClose = () => {
    Haptics.selectionAsync();
    onStudioPress(null as any);
  };

  const handleLocateMe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userLocation) {
      // Zoom out slightly to show context, then focus
      scale.value = withTiming(INITIAL_SCALE, { duration: 500 });
      const pos = getPosition(userLocation.latitude, userLocation.longitude);
      focusMap(pos.x, pos.y);
    } else {
      // Fallback
      scale.value = withSpring(INITIAL_SCALE);
      translateX.value = withSpring(initialX);
      translateY.value = withSpring(initialY);
    }
  };

  // Calculate user position for rendering
  const userPos = userLocation
    ? getPosition(userLocation.latitude, userLocation.longitude)
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

              {/* Water Texture */}
              <Rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#waterPattern)"
              />

              {/* Land Mass */}
              <Path
                d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z"
                fill={colors.land}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.5"
              />

              {/* Greenery */}
              <Path
                d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z"
                fill={colors.greenery}
                opacity="0.8"
              />

              {/* Roads */}
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
            </Svg>

            {/* Studio Markers */}
            {studios.map((studio) => {
              const pos = getPosition(studio.latitude, studio.longitude);
              const isSelected = selectedStudio?.id === studio.id;

              // Scale coordinates to map size
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
                            : theme === "dark"
                              ? "#27272a"
                              : "#ffffff",
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
                    <View
                      style={[
                        styles.markerStick,
                        { backgroundColor: "rgba(0,0,0,0.5)" },
                      ]}
                    />
                    <View
                      style={[
                        styles.markerLabel,
                        {
                          backgroundColor:
                            theme === "dark"
                              ? "rgba(0,0,0,0.9)"
                              : "rgba(255,255,255,0.9)",
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.markerLabelText, { color: colors.text }]}
                      >
                        {studio.location || "STUDIO"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Dynamic User Location Marker */}
            {userPos && (
              <View
                style={{
                  position: "absolute",
                  left: (userPos.x / 100) * MAP_SIZE,
                  top: (userPos.y / 100) * MAP_SIZE,
                  zIndex: 5,
                  // Center the icon (40px)
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

        {/* HUD Controls */}
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

        {/* Updated Locate Me Button */}
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

        {/* Removed Card Logic - Handled by Home Screen Bottom Sheet */}
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
  },
  markerLabel: {
    marginTop: -2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  markerLabelText: {
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
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
    top: Platform.OS === "ios" ? 120 : 100, // Moved to top right
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
    top: Platform.OS === "ios" ? 220 : 200, // Moved to top right below zoom
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
