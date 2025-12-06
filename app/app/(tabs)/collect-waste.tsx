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
  Separator,
  Spinner,
  Image,
} from "tamagui";
import { useUser } from "@clerk/clerk-expo";
import { Alert, RefreshControl } from "react-native";
import * as Location from "expo-location";
import {
  fetchPendingReports,
  PendingWasteReport,
} from "../services/wasteCollectionService";
import {
  formatDistance,
  getDistanceToReport,
  sortByDistance,
} from "../utils/locationUtils";
import CollectorVerificationScreen from "../components/CollectorVerificationScreen";

export default function CollectWasteScreen() {
  const { user } = useUser();
  const [reports, setReports] = React.useState<PendingWasteReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedReport, setSelectedReport] =
    React.useState<PendingWasteReport | null>(null);
  const [stats, setStats] = React.useState({
    collectedToday: 0,
    pointsEarned: 0,
  });

  // Fetch user location on mount
  React.useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch reports on mount
  React.useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

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

  const loadReports = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const pendingReports = await fetchPendingReports(user.id);

      // Sort by distance if we have user location
      if (userLocation) {
        const sorted = sortByDistance(
          pendingReports,
          userLocation.latitude,
          userLocation.longitude
        );
        setReports(sorted);
      } else {
        setReports(pendingReports);
      }

      console.log(`✅ Loaded ${pendingReports.length} pending reports`);
    } catch (error) {
      console.error("Error loading reports:", error);
      Alert.alert("Error", "Failed to load waste reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserLocation();
    await loadReports();
    setRefreshing(false);
  };

  const handleCollect = (report: PendingWasteReport) => {
    setSelectedReport(report);
  };

  const handleVerificationSuccess = () => {
    // Reload reports and update stats
    setSelectedReport(null);
    loadReports();
    setStats({
      collectedToday: stats.collectedToday + 1,
      pointsEarned: stats.pointsEarned + 20, // Example points
    });
    Alert.alert(
      "Success! 🎉",
      "Collection verified successfully. Navigate to dumping grounds to complete the process."
    );
  };

  const handleVerificationCancel = () => {
    setSelectedReport(null);
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

  const getDistanceText = (report: PendingWasteReport): string => {
    if (!userLocation || !report.latitude || !report.longitude) {
      return "Unknown";
    }
    const distance = getDistanceToReport(
      userLocation.latitude,
      userLocation.longitude,
      report.latitude,
      report.longitude
    );
    return distance !== null ? formatDistance(distance) : "Unknown";
  };

  const getUrgencyBadge = (report: PendingWasteReport) => {
    if (
      report.aiAnalysis.category === "large" &&
      report.aiAnalysis.urgency === "high"
    ) {
      return (
        <YStack
          backgroundColor="$red2"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
        >
          <Text color="$red10" fontSize="$1" fontWeight="600">
            🔥 URGENT
          </Text>
        </YStack>
      );
    }
    return null;
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
        <YStack backgroundColor="$blue9" padding="$5" paddingTop="$10">
          <H2 color="white" fontWeight="bold">
            Collect Waste
          </H2>
          <Paragraph color="white" opacity={0.9} marginTop="$1">
            Find and collect reported waste
          </Paragraph>
        </YStack>

        <XStack
          margin="$4"
          padding="$4"
          backgroundColor="white"
          borderRadius="$4"
          elevation="$2"
          alignItems="center"
        >
          <YStack flex={1} alignItems="center">
            <H2 color="$blue9" fontWeight="bold">
              {stats.collectedToday}
            </H2>
            <Text color="$gray10" fontSize="$2" marginTop="$1">
              Collected Today
            </Text>
          </YStack>
          <Separator vertical height={40} borderColor="$gray5" />
          <YStack flex={1} alignItems="center">
            <H2 color="$blue9" fontWeight="bold">
              {stats.pointsEarned}
            </H2>
            <Text color="$gray10" fontSize="$2" marginTop="$1">
              Points Earned
            </Text>
          </YStack>
        </XStack>

        <YStack paddingHorizontal="$4">
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$4"
          >
            <H4 color="$gray12" fontWeight="bold">
              Nearby Reports
            </H4>
            <Text color="$blue9" fontWeight="600" fontSize="$2">
              {reports.length} available
            </Text>
          </XStack>

          {isLoading ? (
            <YStack padding="$8" alignItems="center" justifyContent="center">
              <Spinner size="large" color="$blue9" />
              <Text color="$gray10" marginTop="$4">
                Loading waste reports...
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
              <Text fontSize={60}>🗑️</Text>
              <H4 color="$gray11" marginTop="$3" textAlign="center">
                No Pending Reports
              </H4>
              <Paragraph color="$gray10" textAlign="center" marginTop="$2">
                Check back later for new waste collection opportunities
              </Paragraph>
            </YStack>
          ) : (
            reports.map((report) => (
              <YStack
                key={report.id}
                backgroundColor="white"
                borderRadius="$4"
                padding="$4"
                marginBottom="$3"
                elevation="$1"
              >
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
                      {getUrgencyBadge(report)}
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
                <XStack gap="$3" marginBottom="$3">
                  {report.aiAnalysis.estimatedWeightKg && (
                    <YStack
                      flex={1}
                      backgroundColor="$gray2"
                      padding="$2"
                      borderRadius="$2"
                    >
                      <Text color="$gray11" fontSize="$1" marginBottom="$1">
                        Weight
                      </Text>
                      <Text color="$gray12" fontWeight="600" fontSize="$3">
                        {report.aiAnalysis.estimatedWeightKg} kg
                      </Text>
                    </YStack>
                  )}
                  <YStack
                    flex={1}
                    backgroundColor="$gray2"
                    padding="$2"
                    borderRadius="$2"
                  >
                    <Text color="$gray11" fontSize="$1" marginBottom="$1">
                      Category
                    </Text>
                    <Text color="$gray12" fontWeight="600" fontSize="$3">
                      {report.aiAnalysis.category}
                    </Text>
                  </YStack>
                </XStack>

                <Separator borderColor="$gray4" marginVertical="$2" />
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  paddingTop="$2"
                >
                  <Text color="$gray9" fontSize="$2">
                    Reported {new Date(report.reportedAt).toLocaleDateString()}
                  </Text>
                  <Button
                    onPress={() => handleCollect(report)}
                    backgroundColor="$blue9"
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    borderRadius="$2"
                    height="unset"
                  >
                    <Text color="white" fontWeight="600">
                      Collect
                    </Text>
                  </Button>
                </XStack>
              </YStack>
            ))
          )}
        </YStack>

        <YStack
          margin="$4"
          padding="$4"
          backgroundColor="$blue2"
          borderRadius="$4"
          borderLeftWidth={4}
          borderLeftColor="$blue9"
        >
          <H4 color="$blue11" fontWeight="bold" marginBottom="$2">
            🎯 Collection Tips
          </H4>
          <Paragraph color="$blue11">• Start with nearby locations</Paragraph>
          <Paragraph color="$blue11">
            • Bring appropriate collection bags
          </Paragraph>
          <Paragraph color="$blue11">
            • Take clear photo for verification
          </Paragraph>
          <Paragraph color="$blue11">
            • Must be within 500m of waste location
          </Paragraph>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
