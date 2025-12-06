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
} from "tamagui";

export default function LeaderboardScreen() {
  const { user } = useUser();

  const topUsers = [
    {
      rank: 1,
      name: "Sarah Johnson",
      points: 1250,
      reports: 45,
      collected: 38,
      badge: "🏆",
    },
    {
      rank: 2,
      name: "Mike Chen",
      points: 1180,
      reports: 42,
      collected: 35,
      badge: "🥈",
    },
    {
      rank: 3,
      name: "Emma Davis",
      points: 1050,
      reports: 38,
      collected: 32,
      badge: "🥉",
    },
    {
      rank: 4,
      name: "You",
      points: 450,
      reports: 15,
      collected: 12,
      badge: "",
    },
    {
      rank: 5,
      name: "Alex Kumar",
      points: 420,
      reports: 14,
      collected: 11,
      badge: "",
    },
    {
      rank: 6,
      name: "Lisa Wang",
      points: 390,
      reports: 13,
      collected: 10,
      badge: "",
    },
    {
      rank: 7,
      name: "Tom Brown",
      points: 360,
      reports: 12,
      collected: 9,
      badge: "",
    },
    {
      rank: 8,
      name: "Maria Garcia",
      points: 340,
      reports: 11,
      collected: 9,
      badge: "",
    },
  ];

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
      <ScrollView flex={1} backgroundColor="$background">
        <YStack backgroundColor="$yellow9" padding="$5" paddingTop="$10">
          <H2 color="white" fontWeight="bold">
            Leaderboard
          </H2>
          <Paragraph color="white" opacity={0.9} marginTop="$1">
            Compete and earn rewards
          </Paragraph>
        </YStack>

        <XStack padding="$4" gap="$2">
          <Button
            flex={1}
            backgroundColor="$yellow9"
            borderRadius="$4"
            height="$4"
          >
            <Text color="white" fontWeight="600">
              This Week
            </Text>
          </Button>
          <Button
            flex={1}
            backgroundColor="white"
            borderRadius="$4"
            height="$4"
          >
            <Text color="$gray10" fontWeight="600">
              All Time
            </Text>
          </Button>
          <Button
            flex={1}
            backgroundColor="white"
            borderRadius="$4"
            height="$4"
          >
            <Text color="$gray10" fontWeight="600">
              This Month
            </Text>
          </Button>
        </XStack>

        <XStack
          justifyContent="center"
          alignItems="flex-end"
          paddingHorizontal="$4"
          marginBottom="$6"
          gap="$2"
        >
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
              <Text color="$gray12" fontWeight="600" marginBottom="$1">
                {topUsers[1].name}
              </Text>
              <H2 color="$yellow9" fontWeight="bold">
                {topUsers[1].points}
              </H2>
              <Text color="$gray10" fontSize="$1">
                points
              </Text>
            </YStack>
          </YStack>
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
              <Text color="$gray12" fontWeight="600" marginBottom="$1">
                {topUsers[0].name}
              </Text>
              <H2 color="$yellow9" fontWeight="bold" fontSize="$8">
                {topUsers[0].points}
              </H2>
              <Text color="$gray10" fontSize="$1">
                points
              </Text>
            </YStack>
          </YStack>
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
              <Text color="$gray12" fontWeight="600" marginBottom="$1">
                {topUsers[2].name}
              </Text>
              <H2 color="$yellow9" fontWeight="bold">
                {topUsers[2].points}
              </H2>
              <Text color="$gray10" fontSize="$1">
                points
              </Text>
            </YStack>
          </YStack>
        </XStack>

        <YStack paddingHorizontal="$4" gap="$2">
          {topUsers.slice(3).map((user) => (
            <XStack
              key={user.rank}
              backgroundColor={user.name === "You" ? "$green2" : "white"}
              borderColor={user.name === "You" ? "$green9" : "transparent"}
              borderWidth={user.name === "You" ? 2 : 0}
              borderRadius="$4"
              padding="$3"
              alignItems="center"
              elevation="$1"
            >
              <Circle size="$4" backgroundColor="$gray3" marginRight="$3">
                <Text color="$gray10" fontWeight="bold">
                  {user.rank}
                </Text>
              </Circle>
              <YStack flex={1}>
                <Text
                  color={user.name === "You" ? "$green9" : "$gray12"}
                  fontWeight="600"
                  marginBottom="$1"
                >
                  {user.name}
                </Text>
                <XStack gap="$3">
                  <Text color="$gray10" fontSize="$2">
                    📍 {user.reports} reports
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    🚛 {user.collected} collected
                  </Text>
                </XStack>
              </YStack>
              <YStack alignItems="flex-end">
                <Text
                  color={user.name === "You" ? "$green9" : "$yellow9"}
                  fontWeight="bold"
                  fontSize="$5"
                >
                  {user.points}
                </Text>
                <Text color="$gray10" fontSize="$1">
                  pts
                </Text>
              </YStack>
            </XStack>
          ))}
        </YStack>

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
      </ScrollView>
    </Theme>
  );
}
