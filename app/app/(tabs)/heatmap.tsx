import React from "react";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Button,
  H2,
  H4,
  Paragraph,
  Theme,
  Spinner,
  Switch,
  Slider,
} from "tamagui";
import { View, StyleSheet, Alert, Dimensions } from "react-native";
import MapView, {
  Heatmap,
  Marker,
  Callout,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const { width, height } = Dimensions.get("window");

interface WasteData {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  wasteType?: string;
  city?: string;
  state?: string;
  reportedAt: string;
  aiAnalysis?: {
    wasteType?: string;
    category?: string;
    estimatedWeightKg?: number;
  };
}

interface Stats {
  total: number;
  pending: number;
  collected: number;
  hotspots: number;
}

export default function HeatmapScreen() {
  const { user } = useUser();
  const [wasteData, setWasteData] = React.useState<WasteData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<Stats>({
    total: 0,
    pending: 0,
    collected: 0,
    hotspots: 0,
  });
  const [region, setRegion] = React.useState({
    latitude: 19.076,
    longitude: 72.8777,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [showHeatmap, setShowHeatmap] = React.useState(true);
  const [showMarkers, setShowMarkers] = React.useState(false);
  const [heatmapRadius, setHeatmapRadius] = React.useState(30);
  const [heatmapOpacity, setHeatmapOpacity] = React.useState(0.6);
  const [selectedMarker, setSelectedMarker] = React.useState<WasteData | null>(
    null
  );
  const mapRef = React.useRef<MapView>(null);

  React.useEffect(() => {
    initializeLocation();
    fetchWasteData();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const fetchWasteData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/waste/report`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const wastesArray = data.wastes || [];

      // Filter wastes with valid coordinates
      const validWastes = wastesArray.filter((w: any) => {
        const lat = parseFloat(w.latitude);
        const lng = parseFloat(w.longitude);
        return (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      });

      setWasteData(validWastes);
      calculateStats(validWastes);

      // Set center to first waste location if available
      if (validWastes.length > 0) {
        setRegion({
          latitude: validWastes[0].latitude,
          longitude: validWastes[0].longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error("Error fetching waste data:", error);
      Alert.alert("Error", "Failed to fetch waste data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (wastes: WasteData[]) => {
    if (!wastes || wastes.length === 0) {
      setStats({ total: 0, pending: 0, collected: 0, hotspots: 0 });
      return;
    }

    let pending = 0;
    let collected = 0;

    wastes.forEach((w) => {
      if (w.status === "PENDING") pending++;
      else if (w.status === "COLLECTED") collected++;
    });

    // Calculate hotspots (areas with 3+ wastes within 500m)
    let hotspots = 0;
    const processed = new Set<number>();

    wastes.forEach((waste, index) => {
      if (processed.has(index)) return;

      let nearby = 0;
      for (
        let otherIndex = index + 1;
        otherIndex < wastes.length;
        otherIndex++
      ) {
        if (processed.has(otherIndex)) continue;

        const other = wastes[otherIndex];
        const distance = getDistance(
          waste.latitude,
          waste.longitude,
          other.latitude,
          other.longitude
        );

        if (distance <= 0.5) {
          nearby++;
          processed.add(otherIndex);
        }
      }

      if (nearby >= 2) {
        hotspots++;
      }
    });

    setStats({ total: wastes.length, pending, collected, hotspots });
  };

  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getHeatmapPoints = () => {
    return wasteData.map((waste) => {
      const weight = waste.aiAnalysis?.estimatedWeightKg || 1;
      return {
        latitude: waste.latitude,
        longitude: waste.longitude,
        weight: Math.min(weight * 3, 150), // Scale weight for better visualization
      };
    });
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "COLLECTED":
        return "#10b981"; // green
      case "IN_PROGRESS":
        return "#f59e0b"; // yellow
      default:
        return "#ef4444"; // red
    }
  };

  const handleMarkerPress = (waste: WasteData) => {
    setSelectedMarker(waste);
    mapRef.current?.animateToRegion(
      {
        latitude: waste.latitude,
        longitude: waste.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      300
    );
  };

  const handleRefresh = () => {
    fetchWasteData();
  };

  const handleResetControls = () => {
    setHeatmapRadius(30);
    setHeatmapOpacity(0.6);
  };

  if (loading) {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="large" color="$blue9" />
          <Text color="$gray11" marginTop="$4" fontWeight="600">
            Loading heatmap data...
          </Text>
        </YStack>
      </Theme>
    );
  }

  return (
    <Theme name="light">
      <YStack flex={1} backgroundColor="$background">
        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            toolbarEnabled
          >
            {/* Heatmap Layer */}
            {showHeatmap && wasteData.length > 0 && (
              <Heatmap
                points={getHeatmapPoints()}
                radius={heatmapRadius}
                opacity={heatmapOpacity}
                gradient={{
                  colors: [
                    "rgba(0, 255, 255, 0.7)",
                    "rgba(0, 191, 255, 0.8)",
                    "rgba(0, 127, 255, 0.9)",
                    "rgba(0, 191, 0, 1)",
                    "rgba(255, 255, 0, 1)",
                    "rgba(255, 191, 0, 1)",
                    "rgba(255, 127, 0, 1)",
                    "rgba(255, 63, 0, 1)",
                    "rgba(255, 0, 0, 1)",
                  ],
                  startPoints: [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 1.0],
                  colorMapSize: 256,
                }}
              />
            )}

            {/* Markers */}
            {showMarkers &&
              wasteData.map((waste) => (
                <Marker
                  key={waste.id}
                  coordinate={{
                    latitude: waste.latitude,
                    longitude: waste.longitude,
                  }}
                  pinColor={getMarkerColor(waste.status)}
                  onPress={() => handleMarkerPress(waste)}
                >
                  <Callout>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>
                        {waste.aiAnalysis?.wasteType ||
                          waste.wasteType ||
                          "Mixed Waste"}
                      </Text>
                      <Text style={styles.calloutStatus}>
                        Status: {waste.status}
                      </Text>
                      <Text style={styles.calloutLocation}>
                        📍 {waste.city}, {waste.state}
                      </Text>
                      {waste.aiAnalysis?.estimatedWeightKg && (
                        <Text style={styles.calloutWeight}>
                          Weight: {waste.aiAnalysis.estimatedWeightKg} kg
                        </Text>
                      )}
                      <Text style={styles.calloutDate}>
                        {new Date(waste.reportedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
          </MapView>

          {/* Stats Overlay */}
          <View style={styles.statsOverlay}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <YStack
                backgroundColor="white"
                padding="$3"
                borderRadius="$3"
                marginRight="$2"
                elevation="$3"
              >
                <Text color="$gray10" fontSize="$1" fontWeight="600">
                  Total Waste
                </Text>
                <Text color="$blue9" fontSize="$6" fontWeight="bold">
                  {stats.total}
                </Text>
              </YStack>

              <YStack
                backgroundColor="white"
                padding="$3"
                borderRadius="$3"
                marginRight="$2"
                elevation="$3"
              >
                <Text color="$gray10" fontSize="$1" fontWeight="600">
                  Pending
                </Text>
                <Text color="$yellow9" fontSize="$6" fontWeight="bold">
                  {stats.pending}
                </Text>
              </YStack>

              <YStack
                backgroundColor="white"
                padding="$3"
                borderRadius="$3"
                marginRight="$2"
                elevation="$3"
              >
                <Text color="$gray10" fontSize="$1" fontWeight="600">
                  Collected
                </Text>
                <Text color="$green9" fontSize="$6" fontWeight="bold">
                  {stats.collected}
                </Text>
              </YStack>

              <YStack
                backgroundColor="white"
                padding="$3"
                borderRadius="$3"
                elevation="$3"
              >
                <Text color="$gray10" fontSize="$1" fontWeight="600">
                  Hotspots
                </Text>
                <Text color="$red9" fontSize="$6" fontWeight="bold">
                  {stats.hotspots}
                </Text>
              </YStack>
            </ScrollView>
          </View>

          {/* Controls Overlay */}
          <View style={styles.controlsOverlay}>
            <ScrollView>
              <YStack
                backgroundColor="white"
                padding="$4"
                borderRadius="$4"
                elevation="$4"
                gap="$3"
              >
                <H4 color="$gray12" fontWeight="bold" fontSize="$4">
                  Map Controls
                </H4>

                {/* Refresh Button */}
                <Button
                  onPress={handleRefresh}
                  backgroundColor="$blue9"
                  color="white"
                  fontWeight="600"
                  icon={<Text>🔄</Text>}
                  size="$3"
                >
                  Refresh
                </Button>

                {/* Reset Controls */}
                <Button
                  onPress={handleResetControls}
                  backgroundColor="$gray5"
                  color="$gray12"
                  fontWeight="600"
                  icon={<Text>✖️</Text>}
                  size="$3"
                >
                  Reset
                </Button>

                {/* Heatmap Intensity */}
                <YStack gap="$2">
                  <Text color="$gray11" fontSize="$2" fontWeight="600">
                    Heatmap Intensity
                  </Text>
                  <Slider
                    value={[heatmapRadius]}
                    onValueChange={(value) => setHeatmapRadius(value[0])}
                    min={20}
                    max={60}
                    step={5}
                    size="$3"
                  >
                    <Slider.Track backgroundColor="$gray5">
                      <Slider.TrackActive backgroundColor="$blue9" />
                    </Slider.Track>
                    <Slider.Thumb circular index={0} backgroundColor="$blue9" />
                  </Slider>
                  <XStack justifyContent="space-between">
                    <Text color="$gray10" fontSize="$1">
                      Low
                    </Text>
                    <Text color="$gray10" fontSize="$1">
                      High
                    </Text>
                  </XStack>
                </YStack>

                {/* Opacity Control */}
                <YStack gap="$2">
                  <Text color="$gray11" fontSize="$2" fontWeight="600">
                    Opacity
                  </Text>
                  <Slider
                    value={[heatmapOpacity]}
                    onValueChange={(value) => setHeatmapOpacity(value[0])}
                    min={0.2}
                    max={1}
                    step={0.1}
                    size="$3"
                  >
                    <Slider.Track backgroundColor="$gray5">
                      <Slider.TrackActive backgroundColor="$blue9" />
                    </Slider.Track>
                    <Slider.Thumb circular index={0} backgroundColor="$blue9" />
                  </Slider>
                  <XStack justifyContent="space-between">
                    <Text color="$gray10" fontSize="$1">
                      Transparent
                    </Text>
                    <Text color="$gray10" fontSize="$1">
                      Opaque
                    </Text>
                  </XStack>
                </YStack>

                {/* Layer Toggles */}
                <YStack gap="$2">
                  <Text color="$gray11" fontSize="$2" fontWeight="600">
                    Map Layers
                  </Text>

                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    padding="$3"
                    backgroundColor={showHeatmap ? "$blue2" : "$gray2"}
                    borderRadius="$3"
                  >
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={18}>🔥</Text>
                      <Text
                        color={showHeatmap ? "$blue11" : "$gray11"}
                        fontWeight="600"
                        fontSize="$3"
                      >
                        Heatmap
                      </Text>
                    </XStack>
                    <Switch
                      checked={showHeatmap}
                      onCheckedChange={setShowHeatmap}
                      size="$3"
                    >
                      <Switch.Thumb animation="quick" backgroundColor="white" />
                    </Switch>
                  </XStack>

                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    padding="$3"
                    backgroundColor={showMarkers ? "$green2" : "$gray2"}
                    borderRadius="$3"
                  >
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={18}>📍</Text>
                      <Text
                        color={showMarkers ? "$green11" : "$gray11"}
                        fontWeight="600"
                        fontSize="$3"
                      >
                        Markers
                      </Text>
                    </XStack>
                    <Switch
                      checked={showMarkers}
                      onCheckedChange={setShowMarkers}
                      size="$3"
                    >
                      <Switch.Thumb animation="quick" backgroundColor="white" />
                    </Switch>
                  </XStack>
                </YStack>

                {/* Legend */}
                <YStack gap="$2" marginTop="$2">
                  <Text color="$gray11" fontSize="$2" fontWeight="600">
                    ℹ️ Legend
                  </Text>
                  <YStack
                    backgroundColor="$gray2"
                    padding="$3"
                    borderRadius="$3"
                    gap="$2"
                  >
                    <Text color="$gray11" fontSize="$2">
                      Heat Intensity
                    </Text>
                    <View style={styles.gradient} />
                    <XStack justifyContent="space-between">
                      <Text color="$gray10" fontSize="$1">
                        Low
                      </Text>
                      <Text color="$gray10" fontSize="$1">
                        Medium
                      </Text>
                      <Text color="$gray10" fontSize="$1">
                        High
                      </Text>
                    </XStack>
                    <Text color="$gray10" fontSize="$1" marginTop="$1">
                      Higher concentration = warmer colors
                    </Text>
                  </YStack>
                </YStack>
              </YStack>
            </ScrollView>
          </View>
        </View>
      </YStack>
    </Theme>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: width,
    height: height,
  },
  statsOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 20,
    right: 10,
    maxHeight: 500,
    width: 280,
  },
  callout: {
    padding: 8,
    maxWidth: 200,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  calloutLocation: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
  },
  calloutWeight: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  calloutDate: {
    fontSize: 10,
    color: "#999",
  },
  gradient: {
    height: 30,
    borderRadius: 8,
    backgroundColor: "#ff7f00",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
});
