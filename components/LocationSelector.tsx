import { Ionicons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Priority countries (West African + music hubs)
const PRIORITY_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "BR", name: "Brazil" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JM", name: "Jamaica" },
];

export interface LocationData {
  country: string;
  countryCode: string;
  state: string;
  city: string;
  streetAddress?: string;
  latitude?: number;
  longitude?: number;
  fullAddress: string;
}

interface LocationSelectorProps {
  onLocationChange: (location: LocationData) => void;
  showStreetAddress?: boolean;
  showGeolocation?: boolean;
  compact?: boolean;
  colors?: {
    background: string;
    text: string;
    border: string;
    placeholder: string;
    card: string;
    accent: string;
  };
}

const DEFAULT_COLORS = {
  background: "#000000",
  text: "#FFFFFF",
  border: "#222222",
  placeholder: "#888888",
  card: "#0A0A0A",
  accent: "#f59e0b",
};

export default function LocationSelector({
  onLocationChange,
  showStreetAddress = false,
  showGeolocation = true,
  compact = false,
  colors = DEFAULT_COLORS,
}: LocationSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const buildLocationData = useCallback((): LocationData => {
    const country = PRIORITY_COUNTRIES.find((c) => c.code === selectedCountry);
    const parts = [cityInput, stateInput, country?.name].filter(Boolean);
    return {
      country: country?.name || "",
      countryCode: selectedCountry,
      state: stateInput,
      city: cityInput,
      streetAddress: streetAddress || undefined,
      fullAddress: parts.join(", "),
    };
  }, [selectedCountry, stateInput, cityInput, streetAddress]);

  // Forward geocode when city is set
  useEffect(() => {
    if (!cityInput || !selectedCountry) return;

    const geocode = async () => {
      setIsGeocoding(true);
      try {
        const country = PRIORITY_COUNTRIES.find(
          (c) => c.code === selectedCountry,
        );
        const query = [cityInput, stateInput, country?.name]
          .filter(Boolean)
          .join(", ");

        const results = await ExpoLocation.geocodeAsync(query);
        if (results.length > 0) {
          const { latitude, longitude } = results[0];
          const locationData: LocationData = {
            ...buildLocationData(),
            latitude,
            longitude,
          };
          onLocationChange(locationData);
        } else {
          onLocationChange(buildLocationData());
        }
      } catch {
        onLocationChange(buildLocationData());
      } finally {
        setIsGeocoding(false);
      }
    };

    const timeout = setTimeout(geocode, 500);
    return () => clearTimeout(timeout);
  }, [cityInput, stateInput, selectedCountry]);

  // Also update when street address changes
  useEffect(() => {
    if (streetAddress && cityInput) {
      onLocationChange({ ...buildLocationData(), streetAddress });
    }
  }, [streetAddress]);

  const handleUseMyLocation = async () => {
    setIsGeolocating(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature.",
        );
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const reverseResults = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseResults.length > 0) {
        const result = reverseResults[0];

        // Find matching country
        const matchedCountry = PRIORITY_COUNTRIES.find(
          (c) => c.code === result.isoCountryCode,
        );

        if (matchedCountry) {
          setSelectedCountry(matchedCountry.code);
        }
        setStateInput(result.region || "");
        setCityInput(result.city || result.subregion || "");
        if (showStreetAddress && result.street) {
          setStreetAddress(
            [result.streetNumber, result.street].filter(Boolean).join(" "),
          );
        }

        const locationData: LocationData = {
          country: result.country || "",
          countryCode: result.isoCountryCode || "",
          state: result.region || "",
          city: result.city || result.subregion || "",
          streetAddress: result.street || undefined,
          latitude,
          longitude,
          fullAddress: [
            result.city || result.subregion,
            result.region,
            result.country,
          ]
            .filter(Boolean)
            .join(", "),
        };

        onLocationChange(locationData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get your location. Please try again.");
    } finally {
      setIsGeolocating(false);
    }
  };

  const spacing = compact ? 8 : 12;

  return (
    <View>
      {/* Geolocation button */}
      {showGeolocation && (
        <TouchableOpacity
          style={[
            styles.geoButton,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          onPress={handleUseMyLocation}
          disabled={isGeolocating}
        >
          {isGeolocating ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="navigate-outline" size={18} color={colors.accent} />
          )}
          <Text style={[styles.geoButtonText, { color: colors.text }]}>
            {isGeolocating ? "Getting location..." : "Use My Current Location"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ gap: spacing }}>
        {/* Country selector */}
        <View>
          <Text style={[styles.label, { color: colors.placeholder }]}>
            Country
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {PRIORITY_COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={[
                  styles.chip,
                  {
                    borderColor: colors.border,
                    backgroundColor:
                      selectedCountry === country.code
                        ? colors.text
                        : colors.card,
                  },
                ]}
                onPress={() => setSelectedCountry(country.code)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedCountry === country.code
                          ? colors.background
                          : colors.text,
                    },
                  ]}
                >
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* State/Region input */}
        <View>
          <Text style={[styles.label, { color: colors.placeholder }]}>
            State / Region
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={stateInput}
            onChangeText={setStateInput}
            placeholder="e.g., Lagos State"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* City input */}
        <View>
          <Text style={[styles.label, { color: colors.placeholder }]}>
            City
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={cityInput}
            onChangeText={setCityInput}
            placeholder="e.g., Lagos"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Street address (optional) */}
        {showStreetAddress && (
          <View>
            <Text style={[styles.label, { color: colors.placeholder }]}>
              Street Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="e.g., 123 Studio Lane"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        )}

        {/* Geocoding indicator */}
        {isGeocoding && (
          <View style={styles.geocodingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.geocodingText, { color: colors.placeholder }]}>
              Resolving coordinates...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  geoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  geoButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  chipScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  geocodingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  geocodingText: {
    fontSize: 12,
  },
});
