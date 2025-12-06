import React from "react";
import { useUser } from "@clerk/clerk-expo";
import { SignOutButton } from "@/app/components/SignOutButton";
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
  Circle,
  Spinner,
} from "tamagui";
import { Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import {
  fetchHomeStats,
  fetchRecentActivity,
  formatRelativeTime,
  HomeStats,
  RecentActivity,
} from "../services/homeService";

export default function HomeScreen() {
  const { user } = useUser();
  const [stats, setStats] = React.useState<HomeStats | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      loadHomeData();
    }
  }, [user]);

  const loadHomeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [statsData, activityData] = await Promise.all([
        fetchHomeStats(user.id),
        fetchRecentActivity(user.id),
      ]);
      setStats(statsData);
      setRecentActivity(activityData);
      console.log("✅ Home data loaded successfully");
    } catch (error) {
      console.error("Error loading home data:", error);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "report":
        return "📝";
      case "collect":
        return "✅";
      case "points":
        return "🏆";
      default:
        return "📍";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "report":
        return "$blue9";
      case "collect":
        return "$green9";
      case "points":
        return "$yellow9";
      default:
        return "$gray9";
    }
  };

  return (
    <Theme name="light">
      <ScrollView
        flex={1}
        backgroundColor="$background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <YStack backgroundColor="$green9" padding="$4" paddingBottom="$6">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack>
              <Text color="white" opacity={0.9} fontSize="$3">
                Welcome back,
              </Text>
              <H2 color="white" fontWeight="bold" marginTop="$1">
                {user?.firstName || user?.emailAddresses[0].emailAddress}
              </H2>
            </YStack>
            <SignOutButton />
          </XStack>
        </YStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center" justifyContent="center">
            <Spinner size="large" color="$green9" />
            <Text color="$gray10" marginTop="$4">
              Loading dashboard...
            </Text>
          </YStack>
        ) : (
          <>
            {/* Stats Cards */}
            <XStack padding="$4" gap="$3">
              <YStack
                flex={1}
                backgroundColor="white"
                padding="$3"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$green10"
                elevation="$2"
              >
                <H2 color="$gray12" fontWeight="bold">
                  {stats?.totalReports || 0}
                </H2>
                <Paragraph color="$gray10" fontSize="$2" marginTop="$1">
                  Total Reports
                </Paragraph>
              </YStack>
              <YStack
                flex={1}
                backgroundColor="white"
                padding="$3"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$blue10"
                elevation="$2"
              >
                <H2 color="$gray12" fontWeight="bold">
                  {stats?.totalCollected || 0}
                </H2>
                <Paragraph color="$gray10" fontSize="$2" marginTop="$1">
                  Collected
                </Paragraph>
              </YStack>
              <YStack
                flex={1}
                backgroundColor="white"
                padding="$3"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$yellow10"
                elevation="$2"
              >
                <H2 color="$gray12" fontWeight="bold">
                  {stats?.yourPoints || 0}
                </H2>
                <Paragraph color="$gray10" fontSize="$2" marginTop="$1">
                  Your Points
                </Paragraph>
              </YStack>
            </XStack>

            {/* Quick Actions */}
            <YStack padding="$4" gap="$4">
              <H4 color="$gray12" fontWeight="bold">
                Quick Actions
              </H4>
              <XStack gap="$3">
                <Button
                  flex={1}
                  backgroundColor="$green9"
                  height="$10"
                  borderRadius="$4"
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => router.push("/(tabs)/report-waste")}
                >
                  <YStack alignItems="center" gap="$2">
                    <Text fontSize="$6">📍</Text>
                    <Text color="white" fontWeight="bold">
                      Report Waste
                    </Text>
                  </YStack>
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$blue9"
                  height="$10"
                  borderRadius="$4"
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => router.push("/(tabs)/collect-waste")}
                >
                  <YStack alignItems="center" gap="$2">
                    <Text fontSize="$6">🚛</Text>
                    <Text color="white" fontWeight="bold">
                      Collect Waste
                    </Text>
                  </YStack>
                </Button>
              </XStack>
            </YStack>

            {/* Recent Activity */}
            <YStack padding="$4" gap="$4">
              <H4 color="$gray12" fontWeight="bold">
                Recent Activity
              </H4>
              {recentActivity.length === 0 ? (
                <YStack
                  backgroundColor="white"
                  padding="$8"
                  borderRadius="$4"
                  alignItems="center"
                  elevation="$1"
                >
                  <Text fontSize={60}>📊</Text>
                  <H4 color="$gray11" marginTop="$3" textAlign="center">
                    No Activity Yet
                  </H4>
                  <Paragraph color="$gray10" textAlign="center" marginTop="$2">
                    Start reporting or collecting waste to see your activity
                  </Paragraph>
                </YStack>
              ) : (
                recentActivity.map((activity) => (
                  <XStack
                    key={activity.id}
                    backgroundColor="white"
                    padding="$4"
                    borderRadius="$4"
                    alignItems="center"
                    gap="$3"
                    elevation="$1"
                  >
                    <Circle
                      size={40}
                      backgroundColor={getActivityColor(activity.type)}
                    >
                      <Text fontSize={20}>{getActivityIcon(activity.type)}</Text>
                    </Circle>
                    <YStack flex={1}>
                      <Text color="$gray12" fontWeight="bold">
                        {activity.action}
                      </Text>
                      <Text color="$gray10" fontSize="$3">
                        {activity.location || activity.amount}
                        {activity.wasteType && ` • ${activity.wasteType}`}
                      </Text>
                    </YStack>
                    <Text color="$gray9" fontSize="$2">
                      {formatRelativeTime(activity.time)}
                    </Text>
                  </XStack>
                ))
              )}
            </YStack>

            {/* Points Breakdown */}
            {stats && (stats.reporterPoints > 0 || stats.collectorPoints > 0) && (
              <YStack padding="$4" gap="$3">
                <H4 color="$gray12" fontWeight="bold">
                  Points Breakdown
                </H4>
                <YStack backgroundColor="white" borderRadius="$4" padding="$4" gap="$3" elevation="$1">
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={24}>📝</Text>
                      <Text color="$gray11" fontWeight="600">
                        Reporter Points
                      </Text>
                    </XStack>
                    <Text color="$green9" fontSize="$5" fontWeight="bold">
                      {stats.reporterPoints}
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={24}>🚛</Text>
                      <Text color="$gray11" fontWeight="600">
                        Collector Points
                      </Text>
                    </XStack>
                    <Text color="$blue9" fontSize="$5" fontWeight="bold">
                      {stats.collectorPoints}
                    </Text>
                  </XStack>
                </YStack>
              </YStack>
            )}
          </>
        )}
      </ScrollView>
    </Theme>
  );
}
