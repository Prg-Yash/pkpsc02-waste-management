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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingWasteReport } from "../services/wasteCollectionService";
import { verifyBeforeImage, verifyAfterImage } from "../services/geminiService";
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

type VerificationStep =
  | "capture-before"
  | "verifying-before"
  | "capture-after"
  | "verifying-after"
  | "success"
  | "failed";

export default function CollectorVerificationScreen({
  report,
  userId,
  onSuccess,
  onCancel,
}: CollectorVerificationScreenProps) {
  const [step, setStep] = React.useState<VerificationStep>("capture-before");
  const [beforeImageUri, setBeforeImageUri] = React.useState<string | null>(
    null
  );
  const [afterImageUri, setAfterImageUri] = React.useState<string | null>(null);
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

  // Load previously captured before image if exists
  React.useEffect(() => {
    loadBeforeImage();
  }, []);

  const loadBeforeImage = async () => {
    try {
      const storedUri = await AsyncStorage.getItem(`before_image_${report.id}`);
      if (storedUri) {
        setBeforeImageUri(storedUri);
        setStep("capture-after"); // Jump to after image if before already captured
      }
    } catch (error) {
      console.error("Error loading before image:", error);
    }
  };

  const saveBeforeImage = async (uri: string) => {
    try {
      await AsyncStorage.setItem(`before_image_${report.id}`, uri);
    } catch (error) {
      console.error("Error saving before image:", error);
    }
  };

  const clearBeforeImage = async () => {
    try {
      await AsyncStorage.removeItem(`before_image_${report.id}`);
    } catch (error) {
      console.error("Error clearing before image:", error);
    }
  };

  const pickImage = async (isBeforeImage: boolean = true) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        if (isBeforeImage) {
          setBeforeImageUri(result.assets[0].uri);
        } else {
          setAfterImageUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const pickFromGallery = async (isBeforeImage: boolean = true) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        if (isBeforeImage) {
          setBeforeImageUri(result.assets[0].uri);
        } else {
          setAfterImageUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking from gallery:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  // STEP 1: Verify "before" image - checks similarity with original report
  const handleVerifyBefore = async () => {
    if (!beforeImageUri) {
      Alert.alert("Error", "Please capture a before image first");
      return;
    }

    setIsLoading(true);
    setStep("verifying-before");

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

      // Store collector location
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
          `Location verification failed: ${proximityCheck.message}\n\nYou must be within 500m of the waste location.`
        );
        setIsLoading(false);
        return;
      }

      // Step 3: Run Gemini AI similarity check (before vs original)
      console.log("🤖 Running AI similarity check (before image)...");
      const beforeVerification = await verifyBeforeImage(
        report.imageUrl,
        beforeImageUri
      );

      // Step 4: Validate AI result
      if (!beforeVerification.isValid) {
        setStep("failed");
        setVerificationMessage(
          `Before Image Verification Failed ❌\n\n${
            beforeVerification.message
          }\n\nDetails:\n• Location Match: ${
            beforeVerification.details?.locationMatch ? "✓" : "✗"
          }\n• Waste Match: ${
            beforeVerification.details?.wasteMatch ? "✓" : "✗"
          }\n• Landmarks Match: ${
            beforeVerification.details?.landmarksMatch ? "✓" : "✗"
          }\n\nConfidence: ${(beforeVerification.confidence * 100).toFixed(1)}%`
        );
        setIsLoading(false);
        return;
      }

      // Success! Save before image and move to after image step
      await saveBeforeImage(beforeImageUri);
      setStep("capture-after");
      setVerificationMessage(
        `Before Image Verified ✅\n\n${
          beforeVerification.message
        }\n\nConfidence: ${(beforeVerification.confidence * 100).toFixed(
          1
        )}%\n\nNow capture the AFTER image showing the area is clean!`
      );
      setIsLoading(false);

      Alert.alert(
        "Before Image Verified! ✅",
        `${beforeVerification.message}\n\nConfidence: ${(
          beforeVerification.confidence * 100
        ).toFixed(
          1
        )}%\n\nNow please capture an AFTER image showing that the waste has been removed and the area is clean.`,
        [{ text: "Continue" }]
      );
    } catch (error) {
      console.error("❌ Before verification error:", error);
      setStep("failed");
      setVerificationMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsLoading(false);
    }
  };

  // STEP 2: Verify "after" image - checks if waste is removed and area is clean
  const handleVerifyAfter = async () => {
    if (!afterImageUri || !beforeImageUri) {
      Alert.alert("Error", "Please capture an after image first");
      return;
    }

    setIsLoading(true);
    setStep("verifying-after");

    try {
      // Run Gemini AI verification (before vs after)
      console.log("🧹 Running AI removal verification (after image)...");
      const afterVerification = await verifyAfterImage(
        beforeImageUri,
        afterImageUri
      );

      // Validate AI result
      if (!afterVerification.isValid) {
        setStep("failed");
        setVerificationMessage(
          `After Image Verification Failed ❌\n\n${
            afterVerification.message
          }\n\nDetails:\n• Waste Removed: ${
            afterVerification.details?.wasteRemoved ? "✓" : "✗"
          }\n• Ground Clean: ${
            afterVerification.details?.groundClean ? "✓" : "✗"
          }\n• Landmarks Same: ${
            afterVerification.details?.landmarksSame ? "✓" : "✗"
          }\n• Same Location: ${
            afterVerification.details?.sameLocation ? "✓" : "✗"
          }\n• Image Fresh: ${
            afterVerification.details?.imageFresh ? "✓" : "✗"
          }\n• Lighting Consistent: ${
            afterVerification.details?.lightingConsistent ? "✓" : "✗"
          }\n\nConfidence: ${(afterVerification.confidence * 100).toFixed(1)}%`
        );
        setIsLoading(false);
        return;
      }

      // Submit to backend (only after image gets uploaded to S3)
      console.log("📤 Submitting collection verification...");
      if (!collectorLocation) {
        throw new Error("Collector location not found");
      }

      await submitCollectionVerification({
        reportId: report.id,
        collectorId: userId,
        afterImageUri: afterImageUri, // Only after image sent to backend
        collectorLatitude: collectorLocation.latitude,
        collectorLongitude: collectorLocation.longitude,
        verificationData: {
          sameWaste: afterVerification.isValid,
          matchConfidence: afterVerification.confidence,
          notes: afterVerification.message,
          ...afterVerification.details,
        },
      });

      // Clear before image from storage
      await clearBeforeImage();

      // Success!
      setStep("success");
      setVerificationMessage(
        `✅ Collection Verified!\n\n${
          afterVerification.message
        }\n\nConfidence: ${(afterVerification.confidence * 100).toFixed(1)}%`
      );

      // Find nearest dumping grounds
      const grounds = findSuitableDumpingGrounds(
        report.aiAnalysis.wasteType,
        collectorLocation.latitude,
        collectorLocation.longitude,
        3
      );
      setNearestDumpingGrounds(grounds);

      setIsLoading(false);
    } catch (error) {
      console.error("❌ After verification error:", error);
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

  if (step === "verifying-before" || step === "verifying-after") {
    const isBeforeStep = step === "verifying-before";
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
            {isBeforeStep
              ? "Verifying Before Image..."
              : "Verifying After Image..."}
          </H4>
          <Paragraph color="$gray10" textAlign="center" marginTop="$2">
            {isBeforeStep ? (
              <>
                • Checking location proximity{"\n"}• Comparing with original
                report{"\n"}• Validating landmarks and waste match
              </>
            ) : (
              <>
                • Checking if waste is removed{"\n"}• Verifying ground is clean
                {"\n"}• Validating same location{"\n"}• Checking image freshness
              </>
            )}
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
                // Reset to appropriate step
                if (beforeImageUri && !afterImageUri) {
                  setStep("capture-after");
                  setAfterImageUri(null);
                } else {
                  setStep("capture-before");
                  setBeforeImageUri(null);
                  clearBeforeImage();
                }
              }}
              backgroundColor="$blue9"
              color="white"
              fontWeight="600"
            >
              Try Again
            </Button>
            <Button
              onPress={async () => {
                await clearBeforeImage();
                onCancel();
              }}
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

  // Step: "capture-before" or "capture-after"
  const isBeforeStep = step === "capture-before";
  const currentImageUri = isBeforeStep ? beforeImageUri : afterImageUri;
  const stepTitle = isBeforeStep
    ? "Step 1: Before Collection"
    : "Step 2: After Collection";
  const stepDescription = isBeforeStep
    ? "Capture the waste BEFORE you start collecting"
    : "Capture the area AFTER collection (clean ground)";

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack backgroundColor="$blue9" padding="$5" paddingTop="$10">
          <H2 color="white" fontWeight="bold">
            {stepTitle}
          </H2>
          <Paragraph color="white" opacity={0.9} marginTop="$1">
            {stepDescription}
          </Paragraph>
          {!isBeforeStep && (
            <YStack
              backgroundColor="$green2"
              padding="$3"
              borderRadius="$3"
              marginTop="$3"
            >
              <Text color="$green11" fontWeight="600" fontSize="$3">
                ✅ Before image verified! Now show the clean area.
              </Text>
            </YStack>
          )}
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

        {/* Show Before Image if in after step */}
        {!isBeforeStep && beforeImageUri && (
          <>
            <Separator borderColor="$gray5" marginHorizontal="$4" />
            <YStack
              margin="$4"
              padding="$4"
              backgroundColor="white"
              borderRadius="$4"
              elevation="$2"
            >
              <H4 color="$gray12" marginBottom="$3">
                Your Before Image ✅
              </H4>
              <Image
                source={{ uri: beforeImageUri }}
                width="100%"
                height={200}
                borderRadius="$3"
              />
            </YStack>
          </>
        )}

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
            {isBeforeStep
              ? "Before Collection Image"
              : "After Collection Image"}
          </H4>
          {currentImageUri ? (
            <>
              <Image
                source={{ uri: currentImageUri }}
                width="100%"
                height={200}
                borderRadius="$3"
                marginBottom="$3"
              />
              <Button
                onPress={() =>
                  isBeforeStep
                    ? setBeforeImageUri(null)
                    : setAfterImageUri(null)
                }
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
                onPress={() => pickImage(isBeforeStep)}
                backgroundColor="$blue9"
                color="white"
                fontWeight="600"
                icon={<Text>📷</Text>}
              >
                Take Photo
              </Button>
              <Button
                onPress={() => pickFromGallery(isBeforeStep)}
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
            onPress={isBeforeStep ? handleVerifyBefore : handleVerifyAfter}
            backgroundColor="$green9"
            color="white"
            fontWeight="600"
            disabled={!currentImageUri || isLoading}
            opacity={!currentImageUri || isLoading ? 0.5 : 1}
            size="$5"
          >
            {isLoading
              ? "Verifying..."
              : isBeforeStep
              ? "Verify Before Image with AI"
              : "Verify After Image & Complete"}
          </Button>
          <Button
            onPress={async () => {
              await clearBeforeImage();
              onCancel();
            }}
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
            ℹ️{" "}
            {isBeforeStep
              ? "Before Image Requirements"
              : "After Image Requirements"}
          </H4>
          <Paragraph color="$blue11" fontSize="$2">
            {isBeforeStep ? (
              <>
                • Must be within 500m of location{"\n"}• Image must match
                original report{"\n"}• Landmarks and waste must be visible{"\n"}
                • AI confidence must be ≥60%
              </>
            ) : (
              <>
                • Waste must be completely removed{"\n"}• Ground must be clean
                {"\n"}• Landmarks must match before image{"\n"}• Image must be
                fresh (not reused){"\n"}• AI confidence must be ≥60%
              </>
            )}
          </Paragraph>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
