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
} from "tamagui";

export default function CollectWasteScreen() {
  const pendingReports = [
    {
      id: 1,
      location: "123 Main Street",
      type: "Plastic",
      distance: "0.5 km",
      points: 20,
      time: "2 hours ago",
    },
    {
      id: 2,
      location: "Park Avenue",
      type: "Organic",
      distance: "1.2 km",
      points: 15,
      time: "5 hours ago",
    },
    {
      id: 3,
      location: "Downtown Plaza",
      type: "Metal",
      distance: "2.0 km",
      points: 25,
      time: "1 day ago",
    },
    {
      id: 4,
      location: "River Road",
      type: "Glass",
      distance: "3.5 km",
      points: 30,
      time: "1 day ago",
    },
  ];

  const handleCollect = (id: number, points: number) => {
    alert(`Collection started! You'll earn ${points} points upon completion.`);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Plastic: "$blue9",
      Organic: "$green9",
      Metal: "$yellow9",
      Glass: "$purple9",
      Electronic: "$red9",
      Paper: "$teal9",
    };
    return colors[type] || "$gray9";
  };

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
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
              12
            </H2>
            <Text color="$gray10" fontSize="$2" marginTop="$1">
              Collected Today
            </Text>
          </YStack>
          <Separator vertical height={40} borderColor="$gray5" />
          <YStack flex={1} alignItems="center">
            <H2 color="$blue9" fontWeight="bold">
              240
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
            <Button unstyled onPress={() => {}}>
              <Text color="$blue9" fontWeight="600">
                🗺️ Map View
              </Text>
            </Button>
          </XStack>

          {pendingReports.map((report) => (
            <YStack
              key={report.id}
              backgroundColor="white"
              borderRadius="$4"
              padding="$4"
              marginBottom="$3"
              elevation="$1"
            >
              <XStack justifyContent="space-between" marginBottom="$3">
                <YStack flex={1}>
                  <Text
                    color="$gray12"
                    fontWeight="600"
                    fontSize="$4"
                    marginBottom="$2"
                  >
                    {report.location}
                  </Text>
                  <XStack alignItems="center" gap="$3">
                    <YStack
                      backgroundColor="$background" // Placeholder, ideally use opacity or specific light color
                      style={{
                        backgroundColor: getTypeColor(report.type),
                        opacity: 0.2,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 8,
                      }}
                    />
                    <YStack
                      paddingHorizontal="$3"
                      paddingVertical="$1"
                      borderRadius="$3"
                      backgroundColor="transparent" // Let the absolute view show through
                    >
                      <Text
                        color={getTypeColor(report.type)}
                        fontSize="$2"
                        fontWeight="600"
                      >
                        {report.type}
                      </Text>
                    </YStack>
                    <Text color="$gray10" fontSize="$2">
                      📍 {report.distance}
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
                    +{report.points}
                  </Text>
                  <Text color="$yellow10" fontSize="$1">
                    pts
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
                  Reported {report.time}
                </Text>
                <Button
                  onPress={() => handleCollect(report.id, report.points)}
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
          ))}
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
          <Paragraph color="$blue11">• Mark as collected when done</Paragraph>
          <Paragraph color="$blue11">
            • Earn bonus points for quick collection
          </Paragraph>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
