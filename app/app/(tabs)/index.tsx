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
} from "tamagui";

export default function HomeScreen() {
  const { user } = useUser();

  const stats = [
    { label: "Total Reports", value: "156", color: "$green10" },
    { label: "Collected", value: "124", color: "$blue10" },
    { label: "Your Points", value: "450", color: "$yellow10" },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Waste reported",
      location: "Main Street",
      time: "2 hours ago",
    },
    {
      id: 2,
      action: "Waste collected",
      location: "Park Avenue",
      time: "5 hours ago",
    },
    { id: 3, action: "Points earned", amount: "+50 pts", time: "1 day ago" },
  ];

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
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

        <XStack padding="$4" gap="$3">
          {stats.map((stat, index) => (
            <YStack
              key={index}
              flex={1}
              backgroundColor="white"
              padding="$3"
              borderRadius="$4"
              borderLeftWidth={4}
              borderLeftColor={stat.color}
              elevation="$2"
            >
              <H2 color="$gray12" fontWeight="bold">
                {stat.value}
              </H2>
              <Paragraph color="$gray10" fontSize="$2" marginTop="$1">
                {stat.label}
              </Paragraph>
            </YStack>
          ))}
        </XStack>

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

        <YStack padding="$4" gap="$4">
          <H4 color="$gray12" fontWeight="bold">
            Recent Activity
          </H4>
          {recentActivity.map((activity) => (
            <XStack
              key={activity.id}
              backgroundColor="white"
              padding="$4"
              borderRadius="$4"
              alignItems="center"
              gap="$3"
              elevation="$1"
            >
              <Circle size={10} backgroundColor="$green9" />
              <YStack flex={1}>
                <Text color="$gray12" fontWeight="bold">
                  {activity.action}
                </Text>
                <Text color="$gray10" fontSize="$3">
                  {activity.location || activity.amount}
                </Text>
              </YStack>
              <Text color="$gray9" fontSize="$2">
                {activity.time}
              </Text>
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    </Theme>
  );
}
