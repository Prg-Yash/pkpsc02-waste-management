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
  Image,
  Spinner,
} from "tamagui";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PendingWasteReport } from "../services/wasteCollectionService";
import {
  compareWasteImages,
  validateSimilarity,
} from "../services/geminiSimilarityService";
import { validateProximity } from "../utils/locationUtils";
import { submitCollectionVerification } from "../services/wasteCollectionService";
import {
  findSuitableDumpingGrounds,
  DumpingGroundWithDistance,
} from "../services/dumpingGroundService";

interface CollectorVerificationScreenProps {
  report: PendingWasteReport;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type VerificationStep = "capture" | "verifying" | "success" | "failed";

export default function CollectorVerificationScreen({
  report,
  userId,
  onSuccess,
  onCancel,
}: CollectorVerificationScreenProps) {
  const [step, setStep] = React.useState<VerificationStep>("capture");
  const [collectorImageUri, setCollectorImageUri] = React.useState<
    string | null
  >(null);
  const [verificationMessage, setVerificationMessage] =
    React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [nearestDumpingGrounds, setNearestDumpingGrounds] = React.useState<
    DumpingGroundWithDistance[]
  >([]);
  const [collectorLocation, setCollectorLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setCollectorImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setCollectorImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking from gallery:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleVerify = async () => {
    if (!collectorImageUri) {
      Alert.alert("Error", "Please capture a verification image first");
      return;
    }

    setIsLoading(true);
    setStep("verifying");

    try {
      // Step 1: Get current location
      console.log("📍 Getting current location...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      const location = await Location.getCurrentPositionAsync({});
      const collectorLat = location.coords.latitude;
      const collectorLon = location.coords.longitude;

      // Store collector location for dumping grounds
      setCollectorLocation({
        latitude: collectorLat,
        longitude: collectorLon,
      });

      // Step 2: Validate proximity
      console.log("📏 Validating proximity...");
      const proximityCheck = validateProximity(
        report.latitude,
        report.longitude,
        collectorLat,
        collectorLon,
        500 // 500 meter threshold
      );

      if (!proximityCheck.isValid) {
        setStep("failed");
        setVerificationMessage(
          `Location verification failed: ${proximityCheck.message}`
        );
        setIsLoading(false);
        return;
      }

      // Step 3: Run AI similarity check
      console.log("🤖 Running AI similarity check...");
      const similarityResult = await compareWasteImages(
        report.imageUrl,
        collectorImageUri,
        report.aiAnalysis.category
      );

      // Step 4: Validate AI result
      const validation = validateSimilarity(similarityResult);

      if (!validation.isValid) {
        setStep("failed");
        setVerificationMessage(`AI Verification Failed: ${validation.reason}`);
        setIsLoading(false);
        return;
      }

      // Step 5: Submit to backend
      console.log("📤 Submitting collection verification...");
      await submitCollectionVerification({
        reportId: report.id,
        collectorId: userId,
        collectorImageUri: collectorImageUri,
        collectorLatitude: collectorLat,
        collectorLongitude: collectorLon,
        verificationData: similarityResult,
      });

      // Success!
      setStep("success");
      setVerificationMessage(
        `✅ Collection verified! ${validation.reason}\n📍 ${proximityCheck.message}`
      );

      // Find nearest dumping grounds
      const grounds = findSuitableDumpingGrounds(
        report.aiAnalysis.wasteType,
        collectorLat,
        collectorLon,
        3
      );
      setNearestDumpingGrounds(grounds);

      setIsLoading(false);

      // Don't auto-redirect - let user see dumping grounds first
    } catch (error) {
      console.error("❌ Verification error:", error);
      setStep("failed");
      setVerificationMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsLoading(false);
    }
  };

  const openInMaps = (ground: DumpingGroundWithDistance) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${ground.latitude},${ground.longitude}`;
    Linking.openURL(url);
  };

  const getWasteTypeColor = (wasteType: string) => {
    const colorMap: { [key: string]: string } = {
      Plastic: "$blue9",
      Organic: "$green9",
      Metal: "$yellow9",
      Glass: "$purple9",
      Electronic: "$red9",
      Paper: "$teal9",
      Mixed: "$gray9",
    };
    return colorMap[wasteType] || "$gray9";
  };

  if (step === "verifying") {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Spinner size="large" color="$blue9" />
          <H4 color="$gray12" marginTop="$4" textAlign="center">
            Verifying Collection...
          </H4>
          <Paragraph color="$gray10" textAlign="center" marginTop="$2">
            • Checking location proximity{"\n"}• Running AI similarity analysis
            {"\n"}• Validating waste match
          </Paragraph>
        </YStack>
      </Theme>
    );
  }

  if (step === "success") {
    return (
      <Theme name="light">
        <ScrollView flex={1} backgroundColor="$background">
          <YStack padding="$4" alignItems="center">
            <Text fontSize={80}>✅</Text>
            <H2 color="$green10" marginTop="$4" textAlign="center">
              Verification Successful!
            </H2>
            <Paragraph
              color="$gray11"
              textAlign="center"
              marginTop="$3"
              paddingHorizontal="$4"
            >
              {verificationMessage}
            </Paragraph>
          </YStack>

          {/* Nearest Dumping Grounds */}
          <YStack padding="$4" paddingTop="$0">
            <H4 color="$gray12" fontWeight="bold" marginBottom="$3">
              🗑️ Nearest Disposal Facilities
            </H4>
            <Paragraph color="$gray10" marginBottom="$4" fontSize="$3">
              Navigate to one of these facilities to dispose the waste properly:
            </Paragraph>

            {nearestDumpingGrounds.map((ground, index) => (
              <YStack
                key={ground.id}
                backgroundColor="white"
                borderRadius="$4"
                padding="$4"
                marginBottom="$3"
                elevation="$2"
              >
                <XStack
                  justifyContent="space-between"
                  alignItems="flex-start"
                  marginBottom="$2"
                >
                  <YStack flex={1}>
                    <Text color="$gray12" fontWeight="600" fontSize="$4">
                      {index + 1}. {ground.name}
                    </Text>
                    <XStack alignItems="center" marginTop="$1">
                      <Text color="$gray10" fontSize="$2">
                        📍 {ground.formattedDistance} away
                      </Text>
                    </XStack>
                  </YStack>
                  <YStack
                    backgroundColor="$blue2"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                  >
                    <Text color="$blue10" fontSize="$1" fontWeight="600">
                      {ground.type}
                    </Text>
                  </YStack>
                </XStack>

                <Text color="$gray11" fontSize="$2" marginBottom="$2">
                  {ground.address}
                </Text>

                <XStack gap="$2" marginBottom="$2" flexWrap="wrap">
                  {ground.acceptedWaste.slice(0, 3).map((waste, i) => (
                    <YStack
                      key={i}
                      backgroundColor="$gray2"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      <Text color="$gray11" fontSize="$1">
                        {waste}
                      </Text>
                    </YStack>
                  ))}
                </XStack>

                <Text color="$gray10" fontSize="$2" marginBottom="$3">
                  ⏰ {ground.openHours}
                </Text>

                <Button
                  onPress={() => openInMaps(ground)}
                  backgroundColor="$blue9"
                  color="white"
                  fontWeight="600"
                  size="$3"
                  icon={<Text>🗺️</Text>}
                >
                  Navigate
                </Button>
              </YStack>
            ))}
          </YStack>

          {/* Complete Button */}
          <YStack padding="$4" paddingTop="$0">
            <Button
              onPress={onSuccess}
              backgroundColor="$green9"
              color="white"
              fontWeight="600"
              size="$5"
            >
              Complete Collection
            </Button>
          </YStack>
        </ScrollView>
      </Theme>
    );
  }

  if (step === "failed") {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text fontSize={80}>❌</Text>
          <H2 color="$red10" marginTop="$4" textAlign="center">
            Verification Failed
          </H2>
          <Paragraph
            color="$gray11"
            textAlign="center"
            marginTop="$3"
            paddingHorizontal="$4"
          >
            {verificationMessage}
          </Paragraph>
          <YStack gap="$3" marginTop="$6" width="100%">
            <Button
              onPress={() => {
                setStep("capture");
                setCollectorImageUri(null);
              }}
              backgroundColor="$blue9"
              color="white"
              fontWeight="600"
            >
              Try Again
            </Button>
            <Button
              onPress={onCancel}
              backgroundColor="$gray5"
              color="$gray12"
              fontWeight="600"
            >
              Cancel
            </Button>
          </YStack>
        </YStack>
      </Theme>
    );
  }

  // Step: "capture"
  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack backgroundColor="$blue9" padding="$5" paddingTop="$10">
          <H2 color="white" fontWeight="bold">
            Verify Collection
          </H2>
          <Paragraph color="white" opacity={0.9} marginTop="$1">
            Capture the waste to verify collection
          </Paragraph>
        </YStack>

        {/* Report Info */}
        <YStack
          margin="$4"
          padding="$4"
          backgroundColor="white"
          borderRadius="$4"
          elevation="$2"
        >
          <H4 color="$gray12" marginBottom="$3">
            Original Report
          </H4>
          <Image
            source={{ uri: report.imageUrl }}
            width="100%"
            height={200}
            borderRadius="$3"
            marginBottom="$3"
          />
          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1}>
              <Text color="$gray11" fontSize="$2" marginBottom="$1">
                Waste Type
              </Text>
              <Text
                color={getWasteTypeColor(report.aiAnalysis.wasteType)}
                fontWeight="600"
                fontSize="$4"
              >
                {report.aiAnalysis.wasteType}
              </Text>
            </YStack>
            <YStack flex={1} alignItems="flex-end">
              <Text color="$gray11" fontSize="$2" marginBottom="$1">
                Category
              </Text>
              <Text color="$gray12" fontWeight="600" fontSize="$4">
                {report.aiAnalysis.category}
              </Text>
            </YStack>
          </XStack>
          {report.aiAnalysis.estimatedWeightKg && (
            <XStack marginTop="$2">
              <Text color="$gray11" fontSize="$3">
                Est. Weight:{" "}
                <Text fontWeight="600">
                  {report.aiAnalysis.estimatedWeightKg} kg
                </Text>
              </Text>
            </XStack>
          )}
          {report.city && (
            <XStack marginTop="$2">
              <Text color="$gray11" fontSize="$3">
                📍 {report.city}, {report.state}
              </Text>
            </XStack>
          )}
        </YStack>

        <Separator borderColor="$gray5" marginHorizontal="$4" />

        {/* Collector Image */}
        <YStack
          margin="$4"
          padding="$4"
          backgroundColor="white"
          borderRadius="$4"
          elevation="$2"
        >
          <H4 color="$gray12" marginBottom="$3">
            Your Verification Image
          </H4>
          {collectorImageUri ? (
            <>
              <Image
                source={{ uri: collectorImageUri }}
                width="100%"
                height={200}
                borderRadius="$3"
                marginBottom="$3"
              />
              <Button
                onPress={() => setCollectorImageUri(null)}
                backgroundColor="$gray5"
                color="$gray12"
                fontWeight="600"
              >
                Retake Image
              </Button>
            </>
          ) : (
            <YStack gap="$3">
              <Button
                onPress={pickImage}
                backgroundColor="$blue9"
                color="white"
                fontWeight="600"
                icon={<Text>📷</Text>}
              >
                Take Photo
              </Button>
              <Button
                onPress={pickFromGallery}
                backgroundColor="$gray8"
                color="white"
                fontWeight="600"
                icon={<Text>🖼️</Text>}
              >
                Choose from Gallery
              </Button>
            </YStack>
          )}
        </YStack>

        {/* Action Buttons */}
        <YStack padding="$4" gap="$3">
          <Button
            onPress={handleVerify}
            backgroundColor="$green9"
            color="white"
            fontWeight="600"
            disabled={!collectorImageUri || isLoading}
            opacity={!collectorImageUri || isLoading ? 0.5 : 1}
            size="$5"
          >
            {isLoading ? "Verifying..." : "Verify with AI"}
          </Button>
          <Button
            onPress={onCancel}
            backgroundColor="$gray5"
            color="$gray12"
            fontWeight="600"
          >
            Cancel
          </Button>
        </YStack>

        {/* Info Box */}
        <YStack
          margin="$4"
          marginTop="$0"
          padding="$4"
          backgroundColor="$blue2"
          borderRadius="$4"
          borderLeftWidth={4}
          borderLeftColor="$blue9"
          marginBottom="$4"
        >
          <H4 color="$blue11" fontWeight="bold" marginBottom="$2" fontSize="$3">
            ℹ️ Verification Process
          </H4>
          <Paragraph color="$blue11" fontSize="$2">
            • Must be within 500m of location{"\n"}• AI checks if waste matches
            original{"\n"}• Confidence must be ≥60%
          </Paragraph>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
