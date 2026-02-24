import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  MapPin,
  Maximize2,
  Mic2,
  Minimize2,
  Navigation,
  Star,
  X,
  Zap,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  Image,
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
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
// Added Height to calculate vertical center
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_SIZE = 1000;
// CHANGED: Reduced scale to 0.45 to show the whole map "Zoomed Out"
const INITIAL_SCALE = 0.45;

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

  // CHANGED: Center the 1000px map on the screen
  const initialX = (SCREEN_WIDTH - MAP_SIZE) / 2;
  const initialY = (SCREEN_HEIGHT - MAP_SIZE) / 2;

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const savedTranslateX = useSharedValue(initialX);
  const savedTranslateY = useSharedValue(initialY);

  // --- Map Logic ---
  const getPosition = (lat: number, lon: number) => {
    const mapMinX = 250,
      mapMaxX = 850;
    const mapMinY = 150,
      mapMaxY = 800;
    const x = mapMinX + (Math.abs(lon * 1000) % (mapMaxX - mapMinX));
    const y = mapMinY + (Math.abs(lat * 1000) % (mapMaxY - mapMinY));
    return { x, y };
  };

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

  const resetMap = () => {
    scale.value = withSpring(INITIAL_SCALE);
    translateX.value = withSpring(initialX);
    translateY.value = withSpring(initialY);
  };

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

              {/* Greenery / Hills */}
              <Path
                d="M 60 0 L 100 0 L 100 40 Q 80 50 60 30 Q 50 15 60 0 Z"
                fill={colors.greenery}
                opacity="0.8"
              />

              {/* City Park */}
              <Path
                d="M 60 55 L 75 55 L 75 65 L 60 65 Z"
                fill={colors.greenery}
                opacity="0.8"
              />

              {/* Beach */}
              <Path
                d="M 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 L 12 0 C 2 15 8 32 28 38 C 48 44 52 62 38 72 C 22 82 28 100 28 100 Z"
                fill={colors.beach}
                opacity="0.6"
              />

              {/* Roads Infrastructure */}
              <G stroke={colors.road} strokeWidth="0.8" opacity="0.6">
                {[45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((x) => (
                  <Line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                ))}
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
                  <Line key={`h-${y}`} x1="20" y1={y} x2="100" y2={y} />
                ))}
              </G>

              {/* Main Highways */}
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

            {/* Markers */}
            {studios.map((studio) => {
              const pos = getPosition(studio.latitude, studio.longitude);
              const isSelected = selectedStudio?.id === studio.id;
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

            {/* User Location */}
            {userLocation && (
              <View
                style={{
                  position: "absolute",
                  left: MAP_SIZE * 0.35,
                  top: MAP_SIZE * 0.4,
                  zIndex: 5,
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

        {/* HUD: District Label */}
        <View style={styles.hudDistrict}>
          <BlurView intensity={40} tint={theme} style={styles.districtBlur}>
            <View
              style={[styles.districtBar, { backgroundColor: colors.text }]}
            />
            <View>
              <Text style={[styles.districtLabelSmall, { color: colors.text }]}>
                DISTRICT
              </Text>
              <Text style={[styles.districtLabelLarge, { color: colors.text }]}>
                VINEWOOD HILLS
              </Text>
            </View>
          </BlurView>
        </View>

        {/* HUD: Zoom Controls */}
        <View
          style={[
            styles.hudZoom,
            { borderColor: colors.border, backgroundColor: colors.cardBg },
          ]}
        >
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

        {/* HUD: Reset Button */}
        <TouchableOpacity
          onPress={resetMap}
          style={[
            styles.hudLocate,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
          ]}
        >
          <Navigation size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Selected Studio Card */}
        {selectedStudio && (
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={styles.cardWrapper}
          >
            <BlurView
              intensity={90}
              tint={theme === "dark" ? "dark" : "light"}
              style={[styles.cardContainer, { borderColor: colors.border }]}
            >
              <View style={styles.cardDecoration} />
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.cardTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedStudio.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <MapPin size={10} color={colors.text} opacity={0.7} />
                    <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                      {selectedStudio.location || "Los Santos"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <View
                  style={[
                    styles.cardImageContainer,
                    { borderColor: colors.border },
                  ]}
                >
                  {selectedStudio.imageUrl ? (
                    <Image
                      source={{ uri: selectedStudio.imageUrl }}
                      style={styles.cardImage}
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#ccc",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Zap size={24} color="#666" />
                    </View>
                  )}
                  <View style={styles.cardImageTag}>
                    <Text style={styles.cardImageTagText}>
                      {selectedStudio.location || "STUDIO"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.statRow}>
                    <View>
                      <Text style={styles.statLabel}>REPUTATION</Text>
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            fill={
                              i < Math.floor(selectedStudio.rating)
                                ? colors.text
                                : "transparent"
                            }
                            color={colors.text}
                          />
                        ))}
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.statLabel}>RATE</Text>
                      <Text style={[styles.rateText, { color: colors.text }]}>
                        ${selectedStudio.hourlyRate}
                        <Text style={{ fontSize: 10, fontWeight: "400" }}>
                          /hr
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      {
                        backgroundColor: colors.text,
                        borderColor: colors.text,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bookButtonText,
                        { color: theme === "dark" ? "#000" : "#fff" },
                      ]}
                    >
                      BOOK SESSION
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}
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
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
  markerSelected: {
    transform: [{ translateX: -20 }, { translateY: -50 }, { scale: 1.1 }],
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
  hudDistrict: {
    position: "absolute",
    bottom: 40,
    left: 20,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  districtBlur: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    alignItems: "center",
    borderLeftWidth: 6,
    borderLeftColor: "#fff",
  },
  districtBar: {
    width: 4,
    height: "100%",
    display: "none",
  },
  districtLabelSmall: {
    fontSize: 8,
    fontWeight: "900",
    opacity: 0.6,
    letterSpacing: 1,
  },
  districtLabelLarge: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  hudZoom: {
    position: "absolute",
    bottom: 40,
    right: 20,
    borderRadius: 8,
    borderWidth: 2,
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
    bottom: 140,
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
  cardWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 10,
  },
  cardContainer: {
    borderRadius: 2,
    borderWidth: 2,
    overflow: "hidden",
  },
  cardDecoration: {
    height: 6,
    width: "100%",
    backgroundColor: "#ef4444",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -1,
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    opacity: 0.7,
  },
  closeBtn: {
    padding: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardImageContainer: {
    height: 120,
    width: "100%",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 16,
    position: "relative",
    padding: 4,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
  },
  cardImageTag: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardImageTagText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cardStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(128,128,128,0.2)",
    borderStyle: "dotted",
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#888",
    marginBottom: 4,
  },
  rateText: {
    fontSize: 18,
    fontWeight: "900",
  },
  bookButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
