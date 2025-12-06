import React, { useState } from "react";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Input,
  Button,
  TextArea,
  H2,
  H4,
  Paragraph,
  Theme,
  Label,
} from "tamagui";

export default function ReportWasteScreen() {
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [wasteType, setWasteType] = useState("");

  const wasteTypes = [
    "Plastic",
    "Organic",
    "Electronic",
    "Metal",
    "Glass",
    "Paper",
  ];

  const handleSubmit = () => {
    // Handle report submission
    alert("Waste reported successfully! +10 points earned");
    setLocation("");
    setDescription("");
    setWasteType("");
  };

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        <YStack backgroundColor="$green9" padding="$5" paddingTop="$10">
          <H2 color="white" fontWeight="bold">
            Report Waste
          </H2>
          <Paragraph color="white" opacity={0.9} marginTop="$1">
            Help keep our community clean
          </Paragraph>
        </YStack>

        <YStack padding="$4" gap="$4">
          <YStack gap="$2">
            <Label color="$gray12" fontWeight="600">
              Location
            </Label>
            <Input
              placeholder="Enter location or address"
              value={location}
              onChangeText={setLocation}
              backgroundColor="white"
            />
            <Button
              onPress={() => {}}
              variant="outlined"
              borderColor="$green9"
              borderStyle="dashed"
              color="$green9"
              marginTop="$2"
            >
              <Text color="$green9">📍 Use Current Location</Text>
            </Button>
          </YStack>

          <YStack gap="$2">
            <Label color="$gray12" fontWeight="600">
              Waste Type
            </Label>
            <XStack flexWrap="wrap" gap="$2">
              {wasteTypes.map((type) => (
                <Button
                  key={type}
                  onPress={() => setWasteType(type)}
                  backgroundColor={wasteType === type ? "$green9" : "white"}
                  borderColor={wasteType === type ? "$green9" : "$gray5"}
                  borderWidth={1}
                  borderRadius="$4"
                  size="$3"
                >
                  <Text color={wasteType === type ? "white" : "$gray10"}>
                    {type}
                  </Text>
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Label color="$gray12" fontWeight="600">
              Description
            </Label>
            <TextArea
              placeholder="Describe the waste issue..."
              value={description}
              onChangeText={setDescription}
              backgroundColor="white"
              numberOfLines={4}
            />
          </YStack>

          <Button
            onPress={() => {}}
            backgroundColor="white"
            borderColor="$gray5"
            borderWidth={1}
            borderStyle="dashed"
            height="$6"
          >
            <Text color="$gray10">📷 Add Photos</Text>
          </Button>

          <Button
            onPress={handleSubmit}
            disabled={!location || !wasteType}
            backgroundColor={!location || !wasteType ? "$gray5" : "$green9"}
            height="$5"
            opacity={!location || !wasteType ? 0.5 : 1}
          >
            <Text color="white" fontWeight="bold" fontSize="$4">
              Submit Report
            </Text>
          </Button>
        </YStack>

        <YStack
          margin="$4"
          padding="$4"
          backgroundColor="$yellow2"
          borderRadius="$4"
          borderLeftWidth={4}
          borderLeftColor="$yellow9"
        >
          <H4 color="$yellow11" fontWeight="bold" marginBottom="$2">
            💡 Reporting Tips
          </H4>
          <Paragraph color="$yellow11">
            • Be specific about the location
          </Paragraph>
          <Paragraph color="$yellow11">• Include photos if possible</Paragraph>
          <Paragraph color="$yellow11">• Earn points for each report</Paragraph>
          <Paragraph color="$yellow11">
            • Help your community stay clean
          </Paragraph>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
