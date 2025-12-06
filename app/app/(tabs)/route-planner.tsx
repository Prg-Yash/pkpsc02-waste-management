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
  Image,
  Separator,
} from "tamagui";
import { useUser } from "@clerk/clerk-expo";
import { Alert, RefreshControl, Linking, Dimensions, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import {
  fetchRoutePlannerReports,
  removeFromRoutePlanner,
  RouteReport,
} from "../services/routePlannerService";
import { formatDistance, calculateDistance } from "../utils/locationUtils";
import CollectorVerificationScreen from "../components/CollectorVerificationScreen";
import {
  MapPin,
  Navigation,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "@tamagui/lucide-icons";

const { width, height } = Dimensions.get("window");

export default function RoutePlannerScreen() {
  const { user } = useUser();
  const [reports, setReports] = React.useState<RouteReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedReport, setSelectedReport] =
    React.useState<RouteReport | null>(null);
  const [totalDistance, setTotalDistance] = React.useState<number>(0);
  const [mapRegion, setMapRegion] = React.useState({
    latitude: 19.076, // Default to Mumbai
    longitude: 72.8777,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Fetch user location on mount
  React.useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch route reports on mount
  React.useEffect(() => {
    if (user) {
      loadRouteReports();
    }
  }, [user]);

  // Calculate total distance when reports or user location changes
  React.useEffect(() => {
    if (userLocation && reports.length > 0) {
      calculateTotalDistance();
    }
  }, [reports, userLocation]);

  // Update map region when user location or reports change
  React.useEffect(() => {
    if (reports.length > 0 && reports[0].latitude && reports[0].longitude) {
      setMapRegion({
        latitude: reports[0].latitude,
        longitude: reports[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } else if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [reports, userLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const loadRouteReports = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const routeReports = await fetchRoutePlannerReports(user.id);
      setReports(routeReports);
      console.log(`✅ Loaded ${routeReports.length} reports in route planner`);
    } catch (error) {
      console.error("Error loading route reports:", error);
      Alert.alert(
        "Error",
        "Failed to load route planner reports. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalDistance = () => {
    if (!userLocation || reports.length === 0) {
      setTotalDistance(0);
      return;
    }

    let total = 0;
    let currentLat = userLocation.latitude;
    let currentLng = userLocation.longitude;

    // Calculate distance from user to first report, then between consecutive reports
    reports.forEach((report) => {
      if (report.latitude && report.longitude) {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          report.latitude,
          report.longitude
        );
        total += distance;
        currentLat = report.latitude;
        currentLng = report.longitude;
      }
    });

    // Convert meters to kilometers
    setTotalDistance(total / 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserLocation();
    await loadRouteReports();
    setRefreshing(false);
  };

  const handleRemoveFromRoute = async (reportId: string) => {
    if (!user) return;

    Alert.alert(
      "Remove from Route?",
      "This will change the report status back to PENDING.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromRoutePlanner(reportId, user.id);
              Alert.alert("Removed", "Report removed from route planner");
              await loadRouteReports();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to remove from route"
              );
            }
          },
        },
      ]
    );
  };

  const handleCollectNow = (report: RouteReport) => {
    setSelectedReport(report);
  };

  const handleVerificationSuccess = async () => {
    // Reload reports (collected report will be removed)
    setSelectedReport(null);
    await loadRouteReports();
    Alert.alert(
      "Success! 🎉",
      "Collection verified successfully. The report has been removed from your route."
    );
  };

  const handleVerificationCancel = () => {
    setSelectedReport(null);
  };

  // Move priority up (decrease index)
  const movePriorityUp = (index: number) => {
    if (index === 0) return; // Already at top

    const newReports = [...reports];
    [newReports[index - 1], newReports[index]] = [
      newReports[index],
      newReports[index - 1],
    ];
    setReports(newReports);
  };

  // Move priority down (increase index)
  const movePriorityDown = (index: number) => {
    if (index === reports.length - 1) return; // Already at bottom

    const newReports = [...reports];
    [newReports[index], newReports[index + 1]] = [
      newReports[index + 1],
      newReports[index],
    ];
    setReports(newReports);
  };

  const openRouteInMaps = () => {
    if (reports.length === 0) {
      Alert.alert("No Route", "Add some reports to your route first!");
      return;
    }

    if (!userLocation) {
      Alert.alert("Location Error", "Unable to get your current location");
      return;
    }

    // Build route: origin (user) -> waypoints (all except last) -> destination (last report)
    const origin = `${userLocation.latitude},${userLocation.longitude}`;

    const validReports = reports.filter((r) => r.latitude && r.longitude);

    if (validReports.length === 0) {
      Alert.alert("No Route", "No valid locations found in route!");
      return;
    }

    // Last report is the destination
    const lastReport = validReports[validReports.length - 1];
    const destination = `${lastReport.latitude},${lastReport.longitude}`;

    // All reports except the last are waypoints
    const waypoints = validReports
      .slice(0, -1)
      .map((r) => `${r.latitude},${r.longitude}`)
      .join("|");

    // Build Google Maps URL - dir_action=navigate forces navigation mode
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;

    // Only add waypoints parameter if there are intermediate stops
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }

    console.log("Opening Google Maps with URL:", url);

    Linking.openURL(url).catch((err) => {
      console.error("Failed to open maps:", err);
      Alert.alert("Error", "Failed to open Google Maps");
    });
  };

  const getRouteCoordinates = () => {
    if (!userLocation || reports.length === 0) return [];

    const coordinates = [
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      },
    ];

    // Add all report locations in priority order
    reports.forEach((report) => {
      if (report.latitude && report.longitude) {
        coordinates.push({
          latitude: report.latitude,
          longitude: report.longitude,
        });
      }
    });

    return coordinates;
  };

  const getDistanceText = (report: RouteReport): string => {
    if (!userLocation || !report.latitude || !report.longitude) {
      return "Unknown";
    }
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      report.latitude,
      report.longitude
    );
    return formatDistance(distance);
  };

  const getWasteTypeColor = (wasteType: string) => {
    const colors: { [key: string]: string } = {
      Plastic: "$blue9",
      Organic: "$green9",
      Metal: "$yellow9",
      Glass: "$purple9",
      Electronic: "$red9",
      Paper: "$teal9",
      Mixed: "$gray9",
    };
    return colors[wasteType] || "$gray9";
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "$red9";
    if (priority === 2) return "$orange9";
    if (priority === 3) return "$yellow9";
    return "$green9";
  };

  // If verification screen is open, show it
  if (selectedReport && user) {
    return (
      <CollectorVerificationScreen
        report={selectedReport}
        userId={user.id}
        onSuccess={handleVerificationSuccess}
        onCancel={handleVerificationCancel}
      />
    );
  }

  return (
    <Theme name="light">
      <ScrollView
        flex={1}
        backgroundColor="$background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Stats */}
        <YStack margin="$4">
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$4"
            gap="$2"
            flexWrap="wrap"
          >
            <YStack flex={1} minWidth={200}>
              <H2 color="$gray12" fontWeight="bold">
                🗺️ Collection Route
              </H2>
              <Text color="$gray10" fontSize="$2" marginTop="$1">
                Plan your optimal route
              </Text>
            </YStack>
            <Button
              onPress={openRouteInMaps}
              backgroundColor="$purple9"
              color="white"
              size="$3"
              icon={<Navigation size={16} color="white" />}
              disabled={reports.length === 0}
              flexShrink={0}
            >
              Open Maps
            </Button>
          </XStack>

          {/* Stats Cards */}
          <XStack gap="$3" marginBottom="$4">
            <YStack
              flex={1}
              backgroundColor="white"
              padding="$3"
              borderRadius="$4"
              elevation="$2"
              alignItems="center"
            >
              <Text fontSize={24}>📍</Text>
              <H4 color="$purple9" fontWeight="bold" marginTop="$1">
                {reports.length}
              </H4>
              <Text color="$gray10" fontSize="$1">
                Stops
              </Text>
            </YStack>

            <YStack
              flex={1}
              backgroundColor="white"
              padding="$3"
              borderRadius="$4"
              elevation="$2"
              alignItems="center"
            >
              <Text fontSize={24}>🗺️</Text>
              <H4 color="$blue9" fontWeight="bold" marginTop="$1">
                {totalDistance > 0 ? totalDistance.toFixed(1) : "0"}
              </H4>
              <Text color="$gray10" fontSize="$1">
                km Total
              </Text>
            </YStack>

            <YStack
              flex={1}
              backgroundColor="white"
              padding="$3"
              borderRadius="$4"
              elevation="$2"
              alignItems="center"
            >
              <Text fontSize={24}>🏆</Text>
              <H4 color="$yellow9" fontWeight="bold" marginTop="$1">
                {reports.length * 20}
              </H4>
              <Text color="$gray10" fontSize="$1">
                Points
              </Text>
            </YStack>
          </XStack>

          {/* Map View */}
          {reports.length > 0 && (
            <YStack
              backgroundColor="white"
              borderRadius="$4"
              overflow="hidden"
              marginBottom="$4"
              elevation="$2"
            >
              <View style={{ height: 400, width: "100%" }}>
                <MapView
                  style={{ flex: 1 }}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  {/* Route Polyline - draws path connecting all stops */}
                  {getRouteCoordinates().length > 1 && (
                    <Polyline
                      coordinates={getRouteCoordinates()}
                      strokeColor="#8b5cf6" // Purple color for route
                      strokeWidth={4}
                      lineDashPattern={[1]}
                    />
                  )}

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      coordinate={userLocation}
                      title="Your Location"
                      pinColor="blue"
                    />
                  )}

                  {/* Waste Report Markers */}
                  {reports.map((report, index) => {
                    if (!report.latitude || !report.longitude) return null;
                    return (
                      <Marker
                        key={report.id}
                        coordinate={{
                          latitude: report.latitude,
                          longitude: report.longitude,
                        }}
                        title={`Stop ${index + 1}`}
                        description={`${report.city || report.locationRaw} - ${
                          report.aiAnalysis.wasteType
                        }`}
                      >
                        <View
                          style={{
                            backgroundColor:
                              index === 0
                                ? "#dc2626"
                                : index === 1
                                ? "#ea580c"
                                : index === 2
                                ? "#ca8a04"
                                : "#16a34a",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: "white",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: 14,
                            }}
                          >
                            {index + 1}
                          </Text>
                        </View>
                      </Marker>
                    );
                  })}
                </MapView>
              </View>
            </YStack>
          )}
        </YStack>

        {/* Route Reports List */}
        <YStack paddingHorizontal="$4">
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$4"
          >
            <H4 color="$gray12" fontWeight="bold">
              Your Collection Points
            </H4>
            {reports.length > 0 && (
              <Text color="$purple9" fontWeight="600" fontSize="$2">
                {reports.length} stops
              </Text>
            )}
          </XStack>

          {isLoading ? (
            <YStack padding="$8" alignItems="center" justifyContent="center">
              <Spinner size="large" color="$purple9" />
              <Text color="$gray10" marginTop="$4">
                Loading your route...
              </Text>
            </YStack>
          ) : reports.length === 0 ? (
            <YStack
              padding="$8"
              alignItems="center"
              justifyContent="center"
              backgroundColor="white"
              borderRadius="$4"
            >
              <Text fontSize={60}>🗺️</Text>
              <H4 color="$gray11" marginTop="$3" textAlign="center">
                No Reports in Route
              </H4>
              <Paragraph color="$gray10" textAlign="center" marginTop="$2">
                Add reports from the Collect tab to build your collection route
              </Paragraph>
            </YStack>
          ) : (
            reports.map((report, index) => (
              <YStack
                key={report.id}
                backgroundColor="white"
                borderRadius="$4"
                padding="$4"
                marginBottom="$3"
                elevation="$1"
                borderLeftWidth={4}
                borderLeftColor={getPriorityColor(index + 1)}
              >
                {/* Stop Number Badge & Priority Controls */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  marginBottom="$3"
                >
                  <YStack
                    backgroundColor={getPriorityColor(index + 1)}
                    width={40}
                    height={40}
                    borderRadius="$10"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="white" fontWeight="bold" fontSize="$5">
                      {index + 1}
                    </Text>
                  </YStack>

                  {/* Priority Control Buttons */}
                  <XStack gap="$2">
                    <Button
                      size="$2"
                      circular
                      icon={<ChevronUp size={16} />}
                      backgroundColor="$gray3"
                      onPress={() => movePriorityUp(index)}
                      disabled={index === 0}
                      opacity={index === 0 ? 0.3 : 1}
                    />
                    <Button
                      size="$2"
                      circular
                      icon={<ChevronDown size={16} />}
                      backgroundColor="$gray3"
                      onPress={() => movePriorityDown(index)}
                      disabled={index === reports.length - 1}
                      opacity={index === reports.length - 1 ? 0.3 : 1}
                    />
                  </XStack>
                </XStack>

                {/* Report Image */}
                <Image
                  source={{ uri: report.imageUrl }}
                  width="100%"
                  height={150}
                  borderRadius="$3"
                  marginBottom="$3"
                />

                <XStack justifyContent="space-between" marginBottom="$3">
                  <YStack flex={1}>
                    <Text
                      color="$gray12"
                      fontWeight="600"
                      fontSize="$4"
                      marginBottom="$2"
                    >
                      {report.city || report.locationRaw}
                    </Text>
                    <XStack alignItems="center" gap="$2" flexWrap="wrap">
                      <YStack
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        borderRadius="$3"
                        backgroundColor={getWasteTypeColor(
                          report.aiAnalysis.wasteType
                        )}
                        opacity={0.2}
                      >
                        <Text
                          color={getWasteTypeColor(report.aiAnalysis.wasteType)}
                          fontSize="$2"
                          fontWeight="600"
                        >
                          {report.aiAnalysis.wasteType}
                        </Text>
                      </YStack>
                      <Text color="$gray10" fontSize="$2">
                        📍 {getDistanceText(report)}
                      </Text>
                    </XStack>
                  </YStack>
                  <YStack
                    backgroundColor="$yellow2"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$2"
                    alignItems="center"
                  >
                    <Text color="$yellow10" fontSize="$5" fontWeight="bold">
                      +20
                    </Text>
                    <Text color="$yellow10" fontSize="$1">
                      pts
                    </Text>
                  </YStack>
                </XStack>

                {/* Additional Info */}
                {report.aiAnalysis.estimatedWeightKg && (
                  <YStack
                    backgroundColor="$gray2"
                    padding="$2"
                    borderRadius="$2"
                    marginBottom="$3"
                  >
                    <Text color="$gray11" fontSize="$1" marginBottom="$1">
                      Estimated Weight
                    </Text>
                    <Text color="$gray12" fontWeight="600" fontSize="$3">
                      {report.aiAnalysis.estimatedWeightKg} kg
                    </Text>
                  </YStack>
                )}

                <Separator borderColor="$gray4" marginVertical="$2" />

                {/* Action Buttons */}
                <XStack gap="$2" paddingTop="$2">
                  <Button
                    onPress={() => handleRemoveFromRoute(report.id)}
                    backgroundColor="$red9"
                    flex={1}
                    paddingVertical="$2"
                    borderRadius="$2"
                    height="unset"
                  >
                    <XStack alignItems="center" gap="$2">
                      <Trash2 size={16} color="white" />
                      <Text color="white" fontWeight="600" fontSize="$2">
                        Remove
                      </Text>
                    </XStack>
                  </Button>
                  <Button
                    onPress={() => handleCollectNow(report)}
                    backgroundColor="$green9"
                    flex={1}
                    paddingVertical="$2"
                    borderRadius="$2"
                    height="unset"
                  >
                    <Text color="white" fontWeight="600" fontSize="$2">
                      Collect Now
                    </Text>
                  </Button>
                </XStack>
              </YStack>
            ))
          )}
        </YStack>

        {/* Tips Section */}
        {reports.length > 0 && (
          <YStack
            margin="$4"
            padding="$4"
            backgroundColor="$purple2"
            borderRadius="$4"
            borderLeftWidth={4}
            borderLeftColor="$purple9"
          >
            <H4 color="$purple11" fontWeight="bold" marginBottom="$2">
              🗺️ Route Planning Tips
            </H4>
            <Paragraph color="$purple11">
              • Use ↑↓ arrows to reorder stops by priority
            </Paragraph>
            <Paragraph color="$purple11">
              • Map shows your route with numbered stops
            </Paragraph>
            <Paragraph color="$purple11">
              • Open in Google Maps for turn-by-turn navigation
            </Paragraph>
            <Paragraph color="$purple11">
              • Collect reports in order for optimal route
            </Paragraph>
          </YStack>
        )}
      </ScrollView>
    </Theme>
  );
}
