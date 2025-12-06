import React from "react";
import { useUser } from "@clerk/clerk-expo";
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
import {
  fetchGlobalLeaderboard,
  fetchReportersLeaderboard,
  fetchCollectorsLeaderboard,
  LeaderboardUser,
} from "../services/leaderboardService";

type LeaderboardType = "global" | "reporters" | "collectors";

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<LeaderboardType>("global");
  const [leaderboardData, setLeaderboardData] = React.useState<
    LeaderboardUser[]
  >([]);
  const [myData, setMyData] = React.useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user, activeTab]);

  const loadLeaderboard = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      let response;

      switch (activeTab) {
        case "reporters":
          response = await fetchReportersLeaderboard(user.id);
          break;
        case "collectors":
          response = await fetchCollectorsLeaderboard(user.id);
          break;
        default:
          response = await fetchGlobalLeaderboard(user.id);
      }

      setLeaderboardData(response.leaderboard);
      setMyData(response.me);
      console.log(
        `✅ Loaded ${activeTab} leaderboard:`,
        response.leaderboard.length,
        "users"
      );
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      Alert.alert("Error", "Failed to load leaderboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getPointsForUser = (user: LeaderboardUser): number => {
    if (activeTab === "reporters") return user.reporterPoints || 0;
    if (activeTab === "collectors") return user.collectorPoints || 0;
    return user.globalPoints || 0;
  };

  const getPointsLabel = (): string => {
    if (activeTab === "reporters") return "Reporter Points";
    if (activeTab === "collectors") return "Collector Points";
    return "Total Points";
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfUsers = leaderboardData.slice(3);

  const achievements = [
    {
      icon: "🌟",
      title: "First Report",
      description: "Submit your first waste report",
    },
    {
      icon: "⚡",
      title: "Quick Collector",
      description: "Collect 10 reports in a day",
    },
    {
      icon: "🎯",
      title: "Accuracy Master",
      description: "100% collection rate",
    },
    { icon: "🌱", title: "Eco Warrior", description: "Earn 1000 points" },
  ];

  return (
    <Theme name="light">
      <ScrollView
        flex={1}
        backgroundColor="$background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tab Buttons */}
        <XStack padding="$4" gap="$2">
          <Button
            flex={1}
            backgroundColor={activeTab === "global" ? "$yellow9" : "white"}
            borderRadius="$4"
            height="$4"
            onPress={() => setActiveTab("global")}
          >
            <Text
              color={activeTab === "global" ? "white" : "$gray10"}
              fontWeight="600"
              fontSize="$2"
            >
              Global
            </Text>
          </Button>
          <Button
            flex={1}
            backgroundColor={activeTab === "reporters" ? "$yellow9" : "white"}
            borderRadius="$4"
            height="$4"
            onPress={() => setActiveTab("reporters")}
          >
            <Text
              color={activeTab === "reporters" ? "white" : "$gray10"}
              fontWeight="600"
              fontSize="$2"
            >
              Reporters
            </Text>
          </Button>
          <Button
            flex={1}
            backgroundColor={activeTab === "collectors" ? "$yellow9" : "white"}
            borderRadius="$4"
            height="$4"
            onPress={() => setActiveTab("collectors")}
          >
            <Text
              color={activeTab === "collectors" ? "white" : "$gray10"}
              fontWeight="600"
              fontSize="$2"
            >
              Collectors
            </Text>
          </Button>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center" justifyContent="center">
            <Spinner size="large" color="$yellow9" />
            <Text color="$gray10" marginTop="$4">
              Loading leaderboard...
            </Text>
          </YStack>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length >= 3 && (
              <XStack
                justifyContent="center"
                alignItems="flex-end"
                paddingHorizontal="$4"
                marginBottom="$6"
                gap="$2"
              >
                {/* Second Place */}
                <YStack flex={1} alignItems="center">
                  <Text fontSize="$8" marginBottom="$2">
                    🥈
                  </Text>
                  <YStack
                    backgroundColor="white"
                    borderRadius="$4"
                    padding="$3"
                    width="100%"
                    alignItems="center"
                    elevation="$2"
                  >
                    <Text
                      color="$gray12"
                      fontWeight="600"
                      marginBottom="$1"
                      numberOfLines={1}
                    >
                      {topThree[1]?.name || "N/A"}
                    </Text>
                    <H2 color="$yellow9" fontWeight="bold">
                      {getPointsForUser(topThree[1])}
                    </H2>
                    <Text color="$gray10" fontSize="$1">
                      points
                    </Text>
                  </YStack>
                </YStack>

                {/* First Place */}
                <YStack flex={1} alignItems="center" marginBottom="$4">
                  <Text fontSize="$8" marginBottom="$2">
                    🏆
                  </Text>
                  <YStack
                    backgroundColor="$yellow2"
                    borderColor="$yellow9"
                    borderWidth={2}
                    borderRadius="$4"
                    padding="$3"
                    width="100%"
                    alignItems="center"
                    elevation="$2"
                  >
                    <Text
                      color="$gray12"
                      fontWeight="600"
                      marginBottom="$1"
                      numberOfLines={1}
                    >
                      {topThree[0]?.name || "N/A"}
                    </Text>
                    <H2 color="$yellow9" fontWeight="bold" fontSize="$8">
                      {getPointsForUser(topThree[0])}
                    </H2>
                    <Text color="$gray10" fontSize="$1">
                      points
                    </Text>
                  </YStack>
                </YStack>

                {/* Third Place */}
                <YStack flex={1} alignItems="center">
                  <Text fontSize="$8" marginBottom="$2">
                    🥉
                  </Text>
                  <YStack
                    backgroundColor="white"
                    borderRadius="$4"
                    padding="$3"
                    width="100%"
                    alignItems="center"
                    elevation="$2"
                  >
                    <Text
                      color="$gray12"
                      fontWeight="600"
                      marginBottom="$1"
                      numberOfLines={1}
                    >
                      {topThree[2]?.name || "N/A"}
                    </Text>
                    <H2 color="$yellow9" fontWeight="bold">
                      {getPointsForUser(topThree[2])}
                    </H2>
                    <Text color="$gray10" fontSize="$1">
                      points
                    </Text>
                  </YStack>
                </YStack>
              </XStack>
            )}

            {/* My Rank Card */}
            {myData && (
              <YStack paddingHorizontal="$4" marginBottom="$4">
                <XStack
                  backgroundColor="$blue2"
                  borderColor="$blue9"
                  borderWidth={2}
                  borderRadius="$4"
                  padding="$3"
                  alignItems="center"
                  elevation="$2"
                >
                  <Circle size="$4" backgroundColor="$blue9" marginRight="$3">
                    <Text color="white" fontWeight="bold">
                      {myData.rank}
                    </Text>
                  </Circle>
                  <YStack flex={1}>
                    <Text color="$blue9" fontWeight="600" marginBottom="$1">
                      You - {myData.name}
                    </Text>
                    <Text color="$gray10" fontSize="$2">
                      {getPointsLabel()}
                    </Text>
                  </YStack>
                  <YStack alignItems="flex-end">
                    <Text color="$blue9" fontWeight="bold" fontSize="$5">
                      {getPointsForUser(myData)}
                    </Text>
                    <Text color="$gray10" fontSize="$1">
                      pts
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            )}

            {/* Rest of Leaderboard */}
            <YStack paddingHorizontal="$4" gap="$2">
              {restOfUsers.length === 0 ? (
                <YStack
                  padding="$8"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="white"
                  borderRadius="$4"
                >
                  <Text fontSize={60}>🏆</Text>
                  <H4 color="$gray11" marginTop="$3" textAlign="center">
                    No More Users
                  </H4>
                  <Paragraph color="$gray10" textAlign="center" marginTop="$2">
                    You're viewing the top users
                  </Paragraph>
                </YStack>
              ) : (
                restOfUsers.map((user) => {
                  const isCurrentUser = user.id === myData?.id;
                  return (
                    <XStack
                      key={user.id}
                      backgroundColor={isCurrentUser ? "$green2" : "white"}
                      borderColor={isCurrentUser ? "$green9" : "transparent"}
                      borderWidth={isCurrentUser ? 2 : 0}
                      borderRadius="$4"
                      padding="$3"
                      alignItems="center"
                      elevation="$1"
                    >
                      <Circle
                        size="$4"
                        backgroundColor="$gray3"
                        marginRight="$3"
                      >
                        <Text color="$gray10" fontWeight="bold">
                          {user.rank}
                        </Text>
                      </Circle>
                      <YStack flex={1}>
                        <Text
                          color={isCurrentUser ? "$green9" : "$gray12"}
                          fontWeight="600"
                          marginBottom="$1"
                          numberOfLines={1}
                        >
                          {user.name}
                        </Text>
                        <Text color="$gray10" fontSize="$2">
                          {activeTab === "global" && (
                            <>
                              📍 {user.reporterPoints || 0} report points • 🚛{" "}
                              {user.collectorPoints || 0} collected points
                            </>
                          )}
                          {activeTab === "reporters" && (
                            <>📍 {user.reporterPoints || 0} reporter points</>
                          )}
                          {activeTab === "collectors" && (
                            <>
                              🚛{" "}
                              {user.collectorPoints === null
                                ? "Not a collector"
                                : `${user.collectorPoints} collector points`}
                            </>
                          )}
                        </Text>
                      </YStack>
                      <YStack alignItems="flex-end">
                        <Text
                          color={isCurrentUser ? "$green9" : "$yellow9"}
                          fontWeight="bold"
                          fontSize="$5"
                        >
                          {getPointsForUser(user)}
                        </Text>
                        <Text color="$gray10" fontSize="$1">
                          pts
                        </Text>
                      </YStack>
                    </XStack>
                  );
                })
              )}
            </YStack>

            {/* Achievements Section */}
            <YStack padding="$4" marginTop="$2">
              <H4 color="$gray12" fontWeight="bold" marginBottom="$3">
                🏅 Achievements
              </H4>
              <XStack flexWrap="wrap" gap="$3">
                {achievements.map((achievement, index) => (
                  <YStack
                    key={index}
                    width="48%"
                    backgroundColor="white"
                    borderRadius="$4"
                    padding="$3"
                    alignItems="center"
                    elevation="$1"
                  >
                    <Text fontSize="$8" marginBottom="$2">
                      {achievement.icon}
                    </Text>
                    <Text
                      color="$gray12"
                      fontWeight="600"
                      textAlign="center"
                      marginBottom="$1"
                    >
                      {achievement.title}
                    </Text>
                    <Text color="$gray10" fontSize="$1" textAlign="center">
                      {achievement.description}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            </YStack>
          </>
        )}
      </ScrollView>
    </Theme>
  );
}
