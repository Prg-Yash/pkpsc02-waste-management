import React from "react";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Button,
  H2,
  H4,
  Avatar,
  Theme,
  Separator,
  Spinner,
} from "tamagui";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { fetchUserStats, UserStats } from "../services/userStatsService";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userStats = await fetchUserStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        {/* User Info */}
        <YStack
          margin="$4"
          padding="$4"
          backgroundColor="white"
          borderRadius="$4"
          elevation="$2"
          alignItems="center"
        >
          <Avatar circular size="$10" marginBottom="$3">
            <Avatar.Image src={user.imageUrl} />
            <Avatar.Fallback backgroundColor="$blue9" />
          </Avatar>

          <H4 color="$gray12" fontWeight="bold">
            {user.fullName || user.firstName || "User"}
          </H4>
          <Text color="$gray10" fontSize="$3" marginTop="$1">
            {user.primaryEmailAddress?.emailAddress}
          </Text>
        </YStack>

        {/* Stats */}
        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" color="$blue9" />
          </YStack>
        ) : stats ? (
          <>
            <YStack paddingHorizontal="$4">
              <H4 color="$gray12" fontWeight="bold" marginBottom="$3">
                Your Statistics
              </H4>

              {/* Points Card */}
              <YStack
                backgroundColor="$yellow2"
                borderRadius="$4"
                padding="$4"
                marginBottom="$3"
                borderWidth={2}
                borderColor="$yellow9"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text color="$yellow10" fontSize="$2" fontWeight="600">
                      Total Points
                    </Text>
                    <H2 color="$yellow10" fontWeight="bold" marginTop="$1">
                      {stats.points}
                    </H2>
                  </YStack>
                  <Text fontSize={50}>🏆</Text>
                </XStack>
              </YStack>

              {/* Stats Grid */}
              <XStack gap="$3" marginBottom="$3">
                <YStack
                  flex={1}
                  backgroundColor="white"
                  borderRadius="$4"
                  padding="$4"
                  elevation="$1"
                  alignItems="center"
                >
                  <Text color="$gray11" fontSize="$2" marginBottom="$1">
                    Reported
                  </Text>
                  <H2 color="$blue9" fontWeight="bold">
                    {stats.totalReported}
                  </H2>
                  <Text color="$gray10" fontSize="$1" marginTop="$1">
                    waste items
                  </Text>
                </YStack>

                <YStack
                  flex={1}
                  backgroundColor="white"
                  borderRadius="$4"
                  padding="$4"
                  elevation="$1"
                  alignItems="center"
                >
                  <Text color="$gray11" fontSize="$2" marginBottom="$1">
                    Collected
                  </Text>
                  <H2 color="$green9" fontWeight="bold">
                    {stats.totalCollected}
                  </H2>
                  <Text color="$gray10" fontSize="$1" marginTop="$1">
                    waste items
                  </Text>
                </YStack>
              </XStack>

              <YStack
                backgroundColor="white"
                borderRadius="$4"
                padding="$4"
                elevation="$1"
                marginBottom="$4"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text color="$gray11" fontSize="$2" marginBottom="$1">
                      Pending Reports
                    </Text>
                    <H4 color="$orange9" fontWeight="bold">
                      {stats.pendingReports}
                    </H4>
                  </YStack>
                  <Text fontSize={30}>⏳</Text>
                </XStack>
              </YStack>
            </YStack>

            {/* Impact Info */}
            <YStack
              margin="$4"
              marginTop="$0"
              padding="$4"
              backgroundColor="$green2"
              borderRadius="$4"
              borderLeftWidth={4}
              borderLeftColor="$green9"
            >
              <H4 color="$green11" fontWeight="bold" marginBottom="$2">
                🌍 Your Impact
              </H4>
              <Text color="$green11" fontSize="$3">
                You've helped make your community cleaner by reporting{" "}
                {stats.totalReported} waste items and collecting{" "}
                {stats.totalCollected} items!
              </Text>
            </YStack>
          </>
        ) : null}

        {/* Sign Out Button */}
        <YStack padding="$4" paddingTop="$2">
          <Button
            onPress={handleSignOut}
            backgroundColor="$red9"
            color="white"
            fontWeight="600"
            size="$5"
          >
            Sign Out
          </Button>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
