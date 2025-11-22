import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Line, Path, Circle, Rect, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH;
const MAP_HEIGHT = 700;

interface Studio {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hourlyRate: number;
  rating: number;
  city?: string;
  state?: string;
}

interface CustomMapViewProps {
  studios: Studio[];
  theme: 'light' | 'dark';
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
  const colors = Colors[theme];
  const [hoveredStudio, setHoveredStudio] = useState<string | null>(null);

  // Calculate map bounds
  const allLats = studios.map(s => s.latitude).filter(Boolean);
  const allLons = studios.map(s => s.longitude).filter(Boolean);

  if (userLocation) {
    allLats.push(userLocation.latitude);
    allLons.push(userLocation.longitude);
  }

  const bounds = {
    minLat: Math.min(...allLats, 37.7),
    maxLat: Math.max(...allLats, 37.8),
    minLon: Math.min(...allLons, -122.5),
    maxLon: Math.max(...allLons, -122.4),
  };

  const latRange = bounds.maxLat - bounds.minLat || 0.1;
  const lonRange = bounds.maxLon - bounds.minLon || 0.1;

  // Add padding
  const padding = 0.15;
  const paddedBounds = {
    minLat: bounds.minLat - latRange * padding,
    maxLat: bounds.maxLat + latRange * padding,
    minLon: bounds.minLon - lonRange * padding,
    maxLon: bounds.maxLon + lonRange * padding,
  };

  const paddedLatRange = paddedBounds.maxLat - paddedBounds.minLat;
  const paddedLonRange = paddedBounds.maxLon - paddedBounds.minLon;

  // Convert lat/lon to pixel coordinates
  const getPosition = (lat: number, lon: number) => {
    const x = ((lon - paddedBounds.minLon) / paddedLonRange) * MAP_WIDTH;
    const y = ((paddedBounds.maxLat - lat) / paddedLatRange) * MAP_HEIGHT;
    return { x, y };
  };

  // Road colors
  const majorRoadColor = theme === 'dark' ? '#fbbf24' : '#f59e0b';
  const secondaryRoadColor = theme === 'dark' ? '#f97316' : '#ea580c';
  const minorRoadColor = theme === 'dark' ? '#3f3f46' : '#a8a29e';

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f0' }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
      >
        <View style={styles.mapContainer}>
          {/* Map Background with Roads */}
          <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={styles.svg}>
            <Defs>
              <RadialGradient id="mapGradient" cx="50%" cy="50%">
                <Stop offset="0%" stopColor={theme === 'dark' ? '#111827' : '#f9fafb'} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={theme === 'dark' ? '#000000' : '#e5e7eb'} stopOpacity="0.1" />
              </RadialGradient>
            </Defs>

            {/* Background gradient */}
            <Rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapGradient)" />

            {/* Major Highways - Horizontal */}
            <G opacity={theme === 'dark' ? 0.25 : 0.35}>
              <Line x1={0} y1={MAP_HEIGHT * 0.15} x2={MAP_WIDTH} y2={MAP_HEIGHT * 0.15}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={0} y1={MAP_HEIGHT * 0.35} x2={MAP_WIDTH} y2={MAP_HEIGHT * 0.37}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={0} y1={MAP_HEIGHT * 0.55} x2={MAP_WIDTH} y2={MAP_HEIGHT * 0.53}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={0} y1={MAP_HEIGHT * 0.75} x2={MAP_WIDTH} y2={MAP_HEIGHT * 0.75}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={0} y1={MAP_HEIGHT * 0.85} x2={MAP_WIDTH} y2={MAP_HEIGHT * 0.87}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
            </G>

            {/* Major Highways - Vertical */}
            <G opacity={theme === 'dark' ? 0.25 : 0.35}>
              <Line x1={MAP_WIDTH * 0.12} y1={0} x2={MAP_WIDTH * 0.12} y2={MAP_HEIGHT}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={MAP_WIDTH * 0.28} y1={0} x2={MAP_WIDTH * 0.30} y2={MAP_HEIGHT}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={MAP_WIDTH * 0.50} y1={0} x2={MAP_WIDTH * 0.50} y2={MAP_HEIGHT}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={MAP_WIDTH * 0.72} y1={0} x2={MAP_WIDTH * 0.70} y2={MAP_HEIGHT}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
              <Line x1={MAP_WIDTH * 0.88} y1={0} x2={MAP_WIDTH * 0.88} y2={MAP_HEIGHT}
                stroke={majorRoadColor} strokeWidth={theme === 'dark' ? 2.5 : 5} strokeLinecap="round" />
            </G>

            {/* Secondary Roads - Horizontal */}
            <G opacity={theme === 'dark' ? 0.18 : 0.25}>
              {[0.08, 0.22, 0.28, 0.42, 0.48, 0.62, 0.68, 0.82, 0.92].map((y, i) => (
                <Line key={`h-${i}`} x1={0} y1={MAP_HEIGHT * y} x2={MAP_WIDTH} y2={MAP_HEIGHT * (y + (i % 2) * 0.01)}
                  stroke={secondaryRoadColor} strokeWidth={theme === 'dark' ? 1.5 : 3} strokeLinecap="round" />
              ))}
            </G>

            {/* Secondary Roads - Vertical */}
            <G opacity={theme === 'dark' ? 0.18 : 0.25}>
              {[0.06, 0.18, 0.24, 0.36, 0.42, 0.56, 0.64, 0.76, 0.82, 0.94].map((x, i) => (
                <Line key={`v-${i}`} x1={MAP_WIDTH * x} y1={0} x2={MAP_WIDTH * (x + (i % 2) * 0.01)} y2={MAP_HEIGHT}
                  stroke={secondaryRoadColor} strokeWidth={theme === 'dark' ? 1.5 : 3} strokeLinecap="round" />
              ))}
            </G>

            {/* Minor Streets */}
            <G opacity={theme === 'dark' ? 0.08 : 0.15}>
              {[0.04, 0.10, 0.16, 0.20, 0.26, 0.32, 0.38, 0.44, 0.50, 0.56, 0.60, 0.66, 0.70, 0.78, 0.84, 0.90, 0.96].map((y, i) => (
                <Line key={`minor-h-${i}`} x1={0} y1={MAP_HEIGHT * y} x2={MAP_WIDTH} y2={MAP_HEIGHT * y}
                  stroke={minorRoadColor} strokeWidth={theme === 'dark' ? 0.5 : 1.5} strokeLinecap="round" />
              ))}
              {[0.03, 0.09, 0.15, 0.21, 0.27, 0.33, 0.39, 0.45, 0.51, 0.57, 0.63, 0.69, 0.75, 0.81, 0.87, 0.93, 0.99].map((x, i) => (
                <Line key={`minor-v-${i}`} x1={MAP_WIDTH * x} y1={0} x2={MAP_WIDTH * x} y2={MAP_HEIGHT}
                  stroke={minorRoadColor} strokeWidth={theme === 'dark' ? 0.5 : 1.5} strokeLinecap="round" />
              ))}
            </G>

            {/* Curved Roads */}
            <G opacity={theme === 'dark' ? 0.15 : 0.2}>
              <Path d={`M 0 ${MAP_HEIGHT * 0.25} Q ${MAP_WIDTH * 0.25} ${MAP_HEIGHT * 0.15}, ${MAP_WIDTH * 0.50} ${MAP_HEIGHT * 0.25} T ${MAP_WIDTH} ${MAP_HEIGHT * 0.25}`}
                stroke={secondaryRoadColor} strokeWidth={theme === 'dark' ? 1.5 : 3} fill="none" strokeLinecap="round" />
              <Path d={`M 0 ${MAP_HEIGHT * 0.65} Q ${MAP_WIDTH * 0.25} ${MAP_HEIGHT * 0.75}, ${MAP_WIDTH * 0.50} ${MAP_HEIGHT * 0.65} T ${MAP_WIDTH} ${MAP_HEIGHT * 0.65}`}
                stroke={secondaryRoadColor} strokeWidth={theme === 'dark' ? 1.5 : 3} fill="none" strokeLinecap="round" />
            </G>

            {/* Landmarks - Parks */}
            <Rect x={MAP_WIDTH * 0.68} y={MAP_HEIGHT * 0.08} width={MAP_WIDTH * 0.12} height={MAP_HEIGHT * 0.12}
              rx={8} fill={theme === 'dark' ? '#065f46' : '#6ee7b7'} opacity={0.3} />

            {/* Trees */}
            {[
              { x: 0.70, y: 0.10 }, { x: 0.73, y: 0.12 }, { x: 0.76, y: 0.11 },
              { x: 0.72, y: 0.15 }, { x: 0.77, y: 0.16 },
            ].map((tree, i) => (
              <G key={`tree-${i}`}>
                <Circle cx={MAP_WIDTH * tree.x} cy={MAP_HEIGHT * tree.y} r={4} fill="#10b981" opacity={0.6} />
                <Rect x={MAP_WIDTH * tree.x - 1} y={MAP_HEIGHT * tree.y + 3} width={2} height={6} fill="#065f46" opacity={0.5} />
              </G>
            ))}

            {/* Water body */}
            <Rect x={MAP_WIDTH * 0.28} y={MAP_HEIGHT * 0.48} width={MAP_WIDTH * 0.10} height={MAP_HEIGHT * 0.08}
              rx={8} fill={theme === 'dark' ? '#1e40af' : '#93c5fd'} opacity={0.3} />
          </Svg>

          {/* District Labels */}
          <View style={[styles.districtLabel, { top: 20, left: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', borderColor: theme === 'dark' ? 'rgba(236,72,153,0.3)' : 'rgba(236,72,153,0.5)' }]}>
            <Text style={[styles.districtText, { color: theme === 'dark' ? '#f9a8d4' : '#db2777' }]}>
              ENTERTAINMENT
            </Text>
          </View>

          <View style={[styles.districtLabel, { top: 20, right: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', borderColor: theme === 'dark' ? 'rgba(6,182,212,0.3)' : 'rgba(6,182,212,0.5)' }]}>
            <Text style={[styles.districtText, { color: theme === 'dark' ? '#67e8f9' : '#0891b2' }]}>
              TECH HUB
            </Text>
          </View>

          <View style={[styles.districtLabel, { bottom: 20, left: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', borderColor: theme === 'dark' ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.5)' }]}>
            <Text style={[styles.districtText, { color: theme === 'dark' ? '#c4b5fd' : '#7c3aed' }]}>
              ARTS QUARTER
            </Text>
          </View>

          <View style={[styles.districtLabel, { bottom: 20, right: 20, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', borderColor: theme === 'dark' ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.5)' }]}>
            <Text style={[styles.districtText, { color: theme === 'dark' ? '#fcd34d' : '#d97706' }]}>
              BUSINESS
            </Text>
          </View>

          {/* User Location Marker */}
          {userLocation && (
            <View style={[styles.markerContainer, getPosition(userLocation.latitude, userLocation.longitude)]}>
              <View style={styles.userMarkerPulse1} />
              <View style={styles.userMarkerPulse2} />
              <View style={styles.userMarkerPulse3} />
              <View style={styles.userMarker}>
                <View style={styles.userMarkerInner} />
              </View>
              <View style={[styles.userLabel, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)', borderColor: theme === 'dark' ? '#3b82f6' : '#60a5fa' }]}>
                <Text style={[styles.userLabelText, { color: theme === 'dark' ? '#93c5fd' : '#1e40af' }]}>
                  Your Location
                </Text>
              </View>
            </View>
          )}

          {/* Studio Markers */}
          {studios.map((studio) => {
            if (!studio.latitude || !studio.longitude) return null;
            const position = getPosition(studio.latitude, studio.longitude);
            const isSelected = selectedStudio?.id === studio.id;

            return (
              <TouchableOpacity
                key={studio.id}
                style={[styles.markerContainer, position]}
                onPress={() => onStudioPress(studio)}
                activeOpacity={0.7}
              >
                {/* Pulse rings */}
                <View style={[styles.studioPulse1, isSelected && styles.studioPulseActive]} />
                <View style={[styles.studioPulse2, isSelected && styles.studioPulseActive]} />

                {/* Studio Pin */}
                <View style={[styles.studioPin, isSelected && styles.studioPinSelected]}>
                  <View style={[styles.studioPinInner, isSelected && styles.studioPinInnerSelected]} />
                </View>

                {/* Studio Label on Selection */}
                {isSelected && (
                  <View style={[styles.studioCard, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)', borderColor: colors.border }]}>
                    <View style={styles.studioCardHeader}>
                      <MaterialCommunityIcons name="microphone" size={16} color={colors.primary} />
                      <Text style={[styles.studioName, { color: colors.text }]} numberOfLines={1}>
                        {studio.name}
                      </Text>
                    </View>
                    <View style={styles.studioCardRow}>
                      <View style={styles.studioRating}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={[styles.studioRatingText, { color: colors.text }]}>
                          {studio.rating.toFixed(1)}
                        </Text>
                      </View>
                      <Text style={[styles.studioPrice, { color: colors.textSecondary }]}>
                        ${studio.hourlyRate}/hr
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)', borderColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={styles.legendStudioMarker} />
          <Text style={[styles.legendText, { color: colors.text }]}>Studios</Text>
        </View>
        {userLocation && (
          <View style={styles.legendItem}>
            <View style={styles.legendUserMarker} />
            <Text style={[styles.legendText, { color: colors.text }]}>You</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // User Location Styles
  userMarkerPulse1: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    ...Platform.select({
      ios: {
        // On iOS we'd use Animated API for pulses
      },
      android: {
        // On Android too
      },
    }),
  },
  userMarkerPulse2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  userMarkerPulse3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  userLabel: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  userLabelText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Studio Marker Styles
  studioPulse1: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  studioPulse2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  studioPulseActive: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  studioPin: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioPinSelected: {
    transform: [{ scale: 1.2 }],
  },
  studioPinInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  studioPinInnerSelected: {
    backgroundColor: '#fff',
    borderColor: '#ef4444',
  },
  studioCard: {
    position: 'absolute',
    top: 50,
    minWidth: 180,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  studioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  studioName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  studioCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studioRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studioRatingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  studioPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  // District Labels
  districtLabel: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  districtText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
  },
  // Legend
  legend: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendStudioMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  legendUserMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
});
