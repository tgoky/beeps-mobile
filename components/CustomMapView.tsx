import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  History,
  Maximize2,
  Mic2,
  Minimize2,
  Music,
  Navigation,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
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
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from "react-native-svg";

// --- Configuration ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MAP_SIZE = 1500;
const CENTER_OFFSET = MAP_SIZE / 2;

// Constraints
const MIN_SCALE =
  Math.max(SCREEN_WIDTH / MAP_SIZE, SCREEN_HEIGHT / MAP_SIZE) * 1.1;
const MAX_SCALE = 2.5;

const COORD_SCALE = 2000;
const VERTICAL_OFFSET = SCREEN_HEIGHT * 0.25;

const THEME_COLORS = {
  light: {
    water: "#a5c5d9",
    land: "#e5e7eb",
    road: "#ffffff",
    roadOutline: "rgba(255,255,255,0.4)",
    highway: "#fcd34d",
    text: "#000000",
    cardBg: "#ffffff",
    border: "#000000",
    accent: "#000000",
    marker: "#ffffff",
    history: "#8B5CF6",
    historyBg: "#EDE9FE",
    dropdownBg: "#ffffff",
  },
  dark: {
    water: "#0f172a",
    land: "#18181b",
    road: "#3f3f46",
    roadOutline: "rgba(63, 63, 70, 0.4)",
    highway: "#ca8a04",
    text: "#ffffff",
    cardBg: "#18181b",
    border: "#52525b",
    accent: "#ffffff",
    marker: "#27272a",
    history: "#A78BFA",
    historyBg: "#2e1065",
    dropdownBg: "#262626",
  },
};

// --- Types ---
interface Studio {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  hourlyRate: number;
}

export interface RecentActivity {
  id: string;
  type: "studio_visit" | "collaboration" | "artist_meet";
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  avatarUrl?: string;
  sessionId?: string;
  details?: { label: string; value: string }[];
}

interface CustomMapViewProps {
  studios: Studio[];
  producers?: any[]; // Add this
  artists?: any[]; // Add this
  recentActivity?: RecentActivity[];
  theme: "light" | "dark";
  onStudioPress: (studio: Studio) => void;
  onProducerPress?: (producer: any) => void; // Add this
  onArtistPress?: (artist: any) => void; // Add this
  selectedStudio?: Studio | null;
  userLocation?: { latitude: number; longitude: number } | null;
  region: { latitude: number; longitude: number };
}
// --- Activity Dropdown Component ---
const ActivityDropdown = ({
  activity,
  onClose,
  onViewSession,
  colors,
  position,
}: {
  activity: RecentActivity;
  onClose: () => void;
  onViewSession: () => void;
  colors: any;
  position: { x: number; y: number };
}) => {
  const screenX = position.x + (SCREEN_WIDTH - MAP_SIZE) / 2;
  const screenY = position.y + (SCREEN_HEIGHT - MAP_SIZE) / 2 - VERTICAL_OFFSET;

  const dropdownX = Math.min(Math.max(screenX - 140, 10), SCREEN_WIDTH - 290);
  const dropdownY = Math.min(Math.max(screenY - 120, 40), SCREEN_HEIGHT - 300);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[
        styles.dropdownContainer,
        {
          position: "absolute",
          left: dropdownX,
          top: dropdownY,
          backgroundColor: colors.dropdownBg,
          borderColor: colors.history,
          shadowColor: "#000",
          zIndex: 10000,
        },
      ]}
    >
      <View
        style={[styles.dropdownArrow, { borderBottomColor: colors.dropdownBg }]}
      />

      <View style={styles.dropdownHeader}>
        <View
          style={[styles.dropdownTypeIcon, { backgroundColor: colors.history }]}
        >
          {activity.type === "collaboration" ? (
            <User size={16} color="#fff" />
          ) : (
            <History size={16} color="#fff" />
          )}
        </View>
        <Text
          style={[styles.dropdownTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {activity.name}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.dropdownContent}>
        <View style={styles.dropdownInfo}>
          <Clock size={14} color="#888" />
          <Text style={styles.dropdownInfoText}>{activity.timestamp}</Text>
        </View>

        {activity.details?.map((detail, index) => (
          <View key={index} style={styles.dropdownInfo}>
            {index === 0 ? (
              <Music size={14} color="#888" />
            ) : (
              <Calendar size={14} color="#888" />
            )}
            <Text style={styles.dropdownInfoText}>{detail.value}</Text>
          </View>
        ))}

        {activity.sessionId && (
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.history }]}
            onPress={onViewSession}
          >
            <Text style={styles.dropdownButtonText}>View Session</Text>
            <ArrowRight size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// --- Activity List Modal ---
const ActivityListModal = ({
  visible,
  onClose,
  activities,
  onSelectActivity,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  activities: RecentActivity[];
  onSelectActivity: (activity: RecentActivity) => void;
  colors: any;
}) => {
  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(200)}
          style={[styles.listModal, { backgroundColor: colors.dropdownBg }]}
        >
          <View style={styles.listModalHeader}>
            <Text style={[styles.listModalTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onSelectActivity(item);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.listItemIcon,
                    { backgroundColor: colors.history },
                  ]}
                >
                  {item.type === "collaboration" ? (
                    <User size={18} color="#fff" />
                  ) : (
                    <History size={18} color="#fff" />
                  )}
                </View>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.listItemTime}>{item.timestamp}</Text>
                </View>
                <ChevronRight size={20} color="#888" />
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// --- Off-Screen Indicator ---
const OffScreenIndicator = ({
  targetX,
  targetY,
  color,
  onPress,
}: {
  targetX: number;
  targetY: number;
  color: string;
  onPress: () => void;
}) => {
  const dx = targetX - CENTER_OFFSET;
  const dy = targetY - CENTER_OFFSET;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < SCREEN_WIDTH / 2 - 20) return null;

  const angle = Math.atan2(dy, dx);
  const radius = SCREEN_WIDTH / 2 - 40;
  const indX = Math.cos(angle) * radius;
  const indY = Math.sin(angle) * radius;
  const rotation = angle * (180 / Math.PI);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: SCREEN_WIDTH / 2,
        top: SCREEN_HEIGHT / 2 - VERTICAL_OFFSET,
        zIndex: 9999,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          position: "absolute",
          transform: [
            { translateX: indX - 20 },
            { translateY: indY - 20 },
            { rotate: `${rotation}deg` },
          ],
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 5,
          elevation: 10,
        }}
      >
        <ChevronRight size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default function CustomMapView({
  studios,
  producers, // Add this
  artists, // Add this
  recentActivity = [],
  theme,
  onStudioPress,
  onProducerPress, // Add this
  onArtistPress, // Add this
  selectedStudio,
  userLocation,
  region,
}: CustomMapViewProps) {
  const router = useRouter();
  const colors = THEME_COLORS[theme];

  // State for dropdown and list
  const [selectedActivity, setSelectedActivity] =
    useState<RecentActivity | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showActivityList, setShowActivityList] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const userPulse = useSharedValue(1);

  const initialX = (SCREEN_WIDTH - MAP_SIZE) / 2;
  const initialY = (SCREEN_HEIGHT - MAP_SIZE) / 2 - VERTICAL_OFFSET;

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const savedTranslateX = useSharedValue(initialX);
  const savedTranslateY = useSharedValue(initialY);

  const getRelativePosition = (lat: number, lon: number) => {
    const deltaLat = lat - region.latitude;
    const deltaLon = lon - region.longitude;
    const x = CENTER_OFFSET + deltaLon * COORD_SCALE;
    const y = CENTER_OFFSET - deltaLat * COORD_SCALE;
    return { x, y };
  };

  useEffect(() => {
    translateX.value = withTiming(initialX);
    translateY.value = withTiming(initialY);
    scale.value = withTiming(1);
    savedScale.value = 1;
  }, [region.latitude, region.longitude]);

  // Pulse Animation for User Marker
  useEffect(() => {
    userPulse.value = withRepeat(
      withTiming(1.5, { duration: 2000 }),
      -1, // Infinite
      false, // Do not reverse (ripple out)
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: userPulse.value }],
    opacity: 1 - (userPulse.value - 1) * 2,
  }));

  const clamp = (val: number, min: number, max: number) => {
    "worklet";
    return Math.min(Math.max(val, min), max);
  };

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
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
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

  const handleActivityPress = (
    activity: RecentActivity,
    x: number,
    y: number,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedActivity(activity);
    setDropdownPosition({ x, y });
  };

  const handleViewSession = () => {
    if (selectedActivity?.sessionId) {
      setSelectedActivity(null);
      // router.push(`/sessions/${selectedActivity.sessionId}`);
    }
  };

  const handleShowAllActivities = () => {
    setShowActivityList(true);
  };

  const userPos = userLocation
    ? getRelativePosition(userLocation.latitude, userLocation.longitude)
    : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.water }]}>
        {/* MAP LAYER */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[styles.mapContent, animatedStyle]}
            renderToHardwareTextureAndroid={true}
          >
            <Svg
              width={MAP_SIZE}
              height={MAP_SIZE}
              viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
            >
              <Defs>
                <Pattern
                  id="gridPattern"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <Path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    stroke={colors.roadOutline}
                    strokeWidth="2"
                  />
                </Pattern>
                <Pattern
                  id="waterPattern"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <Circle
                    cx="25"
                    cy="25"
                    r="2"
                    fill={theme === "dark" ? "#fff" : "#000"}
                    opacity="0.05"
                  />
                </Pattern>
              </Defs>

              <Rect
                x="0"
                y="0"
                width={MAP_SIZE}
                height={MAP_SIZE}
                fill={colors.water}
              />
              <Rect
                x="0"
                y="0"
                width={MAP_SIZE}
                height={MAP_SIZE}
                fill="url(#waterPattern)"
              />
              <Rect
                x="0"
                y="0"
                width={MAP_SIZE}
                height={MAP_SIZE}
                fill="url(#gridPattern)"
              />

              <G
                transform={`translate(${CENTER_OFFSET - 500}, ${CENTER_OFFSET - 500}) scale(10)`}
              >
                <Path
                  d="M 15 0 L 100 0 L 100 100 L 30 100 C 30 100 25 80 40 70 C 55 60 50 40 30 35 C 10 30 5 15 15 0 Z"
                  fill={colors.land}
                  stroke={colors.roadOutline}
                  strokeWidth="0.5"
                />
              </G>

              <G
                transform={`translate(${CENTER_OFFSET - 500}, ${CENTER_OFFSET - 500}) scale(10)`}
                fill="none"
              >
                <Path
                  d="M 20 0 Q 30 50 80 60 L 100 65"
                  stroke={colors.highway}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </G>
            </Svg>

            {/* Studio Markers */}
            {studios.map((studio) => {
              // Skip if no coordinates
              if (!studio.latitude || !studio.longitude) return null;

              const pos = getRelativePosition(
                studio.latitude,
                studio.longitude,
              );
              if (
                pos.x < -50 ||
                pos.x > MAP_SIZE + 50 ||
                pos.y < -50 ||
                pos.y > MAP_SIZE + 50
              )
                return null;
              const isSelected = selectedStudio?.id === studio.id;

              return (
                <View
                  key={studio.id}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    zIndex: 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onStudioPress(studio)}
                    style={styles.markerContainer}
                  >
                    <View
                      style={[
                        styles.markerHead,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : colors.marker,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Mic2 size={14} color="#fff" />
                      ) : (
                        <Text
                          style={[styles.markerPrice, { color: colors.text }]}
                        >
                          ${studio.hourlyRate}
                        </Text>
                      )}
                    </View>
                    <View style={styles.markerStick} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Producer Markers - ADD THIS HERE */}
            {producers?.map((producer) => {
              const pos = getRelativePosition(
                producer.latitude || region.latitude,
                producer.longitude || region.longitude,
              );
              return (
                <View
                  key={producer.userId || `prod-${producer.id}`}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    zIndex: 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onProducerPress?.(producer)}
                    style={styles.markerContainer}
                  >
                    <View
                      style={[
                        styles.markerHead,
                        { backgroundColor: "#8B5CF6" }, // Purple for producers
                      ]}
                    >
                      <Music size={14} color="#fff" />
                    </View>
                    <View style={styles.markerStick} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Artist Markers - ADD THIS HERE */}
            {artists?.map((artist) => {
              const pos = getRelativePosition(
                artist.latitude || region.latitude,
                artist.longitude || region.longitude,
              );
              return (
                <View
                  key={artist.userId || `artist-${artist.id}`}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    zIndex: 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onArtistPress?.(artist)}
                    style={styles.markerContainer}
                  >
                    <View
                      style={[
                        styles.markerHead,
                        { backgroundColor: "#10B981" }, // Green for artists
                      ]}
                    >
                      <User size={14} color="#fff" />
                    </View>
                    <View style={styles.markerStick} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Recent Activity Markers */}
            {recentActivity.map((activity) => {
              const pos = getRelativePosition(
                activity.latitude,
                activity.longitude,
              );

              return (
                <View
                  key={activity.id}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    zIndex: 100,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleActivityPress(activity, pos.x, pos.y)}
                    style={styles.savePointContainer}
                  >
                    <View
                      style={[
                        styles.activityCard,
                        {
                          backgroundColor: colors.history,
                          borderColor: "#fff",
                          borderWidth: 3,
                          shadowColor: "#000",
                          shadowOpacity: 0.5,
                          shadowRadius: 8,
                          elevation: 10,
                        },
                      ]}
                    >
                      <View style={{ marginRight: 6 }}>
                        {activity.type === "collaboration" ? (
                          <User size={14} color="#fff" />
                        ) : (
                          <History size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.activityCardText} numberOfLines={1}>
                        {activity.name.length > 8
                          ? activity.name.substring(0, 8) + "..."
                          : activity.name}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 3,
                        height: 16,
                        backgroundColor: colors.history,
                        shadowColor: colors.history,
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    />
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.history,
                        shadowColor: colors.history,
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* USER LOCATION MARKER - STATIC BLACK */}
            {userPos && (
              <View
                style={{
                  position: "absolute",
                  left: userPos.x,
                  top: userPos.y,
                  zIndex: 200,
                  transform: [{ translateX: -20 }, { translateY: -20 }],
                }}
              >
                {/* Pulsing Ring (Black) */}
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#000000",
                      opacity: 0.3,
                    },
                    pulseStyle,
                  ]}
                />

                {/* Static Black Marker */}
                <View style={styles.userIcon}>
                  <View
                    style={{
                      backgroundColor: "#000000",
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: "#ffffff",
                    }}
                  >
                    <Navigation
                      size={16}
                      fill="#fff"
                      color="#fff"
                      style={{
                        transform: [{ rotate: "0deg" }, { translateY: 1 }],
                      }}
                    />
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Off-Screen Indicators */}
        {recentActivity.map((activity) => {
          const pos = getRelativePosition(
            activity.latitude,
            activity.longitude,
          );
          return (
            <OffScreenIndicator
              key={`ind-${activity.id}`}
              targetX={pos.x}
              targetY={pos.y}
              color={colors.history}
              onPress={() => handleActivityPress(activity, pos.x, pos.y)}
            />
          );
        })}

        {/* HUD Controls - Static Black */}
        <View
          style={[
            styles.hudZoom,
            {
              backgroundColor: "#000000",
              shadowColor: "#000000",
              shadowOpacity: 0.4,
              shadowRadius: 8,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() =>
              (scale.value = withSpring(Math.min(scale.value * 1.5, MAX_SCALE)))
            }
            style={[
              styles.zoomBtn,
              {
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.3)",
              },
            ]}
          >
            <Maximize2 size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              (scale.value = withSpring(Math.max(scale.value * 0.6, MIN_SCALE)))
            }
            style={styles.zoomBtn}
          >
            <Minimize2 size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Activity List Button */}
        {recentActivity.length > 0 && (
          <TouchableOpacity
            style={[
              styles.activityListButton,
              { backgroundColor: colors.history },
            ]}
            onPress={handleShowAllActivities}
          >
            <History size={20} color="#fff" />
            <Text style={styles.activityListButtonText}>
              {recentActivity.length}{" "}
              {recentActivity.length === 1 ? "Activity" : "Activities"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Activity Dropdown */}
        {selectedActivity && (
          <ActivityDropdown
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
            onViewSession={handleViewSession}
            colors={colors}
            position={dropdownPosition}
          />
        )}

        {/* Activity List Modal */}
        <ActivityListModal
          visible={showActivityList}
          onClose={() => setShowActivityList(false)}
          activities={recentActivity}
          onSelectActivity={(activity) => {
            setSelectedActivity(activity);
          }}
          colors={colors}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  mapContent: { width: MAP_SIZE, height: MAP_SIZE },

  // Marker Styles
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -18 }, { translateY: -46 }],
  },
  markerHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerPrice: { fontSize: 10, fontWeight: "900" },
  markerStick: {
    width: 2,
    height: 12,
    marginTop: -1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // Activity Marker Styles
  savePointContainer: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -35 }, { translateY: -50 }],
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  activityCardText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // User Location Marker
  userIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // HUD Controls
  hudZoom: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    right: 20,
    borderRadius: 12,
    elevation: 5,
    zIndex: 50,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Activity List Button
  activityListButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  activityListButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Dropdown Styles
  dropdownContainer: {
    position: "absolute",
    width: 280,
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownArrow: {
    position: "absolute",
    top: -8,
    left: 140,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdownTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  dropdownTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  dropdownContent: {
    gap: 10,
  },
  dropdownInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownInfoText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  dropdownButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  // List Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  listModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  listModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  listModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  listItemTime: {
    fontSize: 12,
    color: "#888",
  },
});
