import * as React from "react";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H2,
  H3,
  H4,
  Paragraph,
  Theme,
  Label,
  Card,
  Spinner,
  Separator,
} from "tamagui";
import { Alert, Image as RNImage, ActivityIndicator } from "react-native";
import {
  analyzeWasteImage,
  type WasteAnalysis,
  type SmallWasteAnalysis,
  type LargeWasteAnalysis,
} from "@/services/geminiService";
import { submitWasteReport } from "@/services/s3Service";
import { saveWasteReport } from "@/services/storageService";
import {
  reverseGeocode,
  formatLocation,
  type LocationData,
} from "@/services/locationService";

type ScreenState = "picker" | "analyzing" | "result" | "submitting" | "success";

export default function ReportWasteScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [state, setState] = React.useState<ScreenState>("picker");
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [s3ImageUrl, setS3ImageUrl] = React.useState<string | null>(null);
  const [s3ReportId, setS3ReportId] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<WasteAnalysis | null>(null);
  const [error, setError] = React.useState<string>("");

  // Editable fields
  const [editedWasteType, setEditedWasteType] = React.useState<string>("");
  const [editedSegregation, setEditedSegregation] = React.useState<
    Array<{ label: string; count: number }>
  >([]);

  // Location with full details
  const [location, setLocation] = React.useState<LocationData>({
    latitude: 0,
    longitude: 0,
  });
  const [loadingLocation, setLoadingLocation] = React.useState(false);

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (
        cameraStatus !== "granted" ||
        mediaStatus !== "granted" ||
        locationStatus !== "granted"
      ) {
        Alert.alert(
          "Permissions Required",
          "Please grant camera, media library, and location permissions to report waste."
        );
      }
    })();
  }, []);

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      setError("Failed to capture image");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      setError("Failed to select image");
    }
  };

  const handleImageSelected = async (uri: string) => {
    setImageUri(uri);
    setError("");

    // Get current location with reverse geocoding
    setLoadingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Get address details from coordinates
      const geocoded = await reverseGeocode(latitude, longitude);

      setLocation({
        latitude,
        longitude,
        address: geocoded.address,
        city: geocoded.city,
        state: geocoded.state,
        country: geocoded.country,
      });

      console.log("📍 Location:", {
        city: geocoded.city,
        state: geocoded.state,
        address: geocoded.address,
      });
    } catch (err) {
      console.log("Location not available", err);
      setLocation({
        latitude: 0,
        longitude: 0,
        city: "Unknown",
        state: "Unknown",
        country: "India",
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri || !user) return;

    setState("analyzing");
    setError("");

    try {
      // Analyze with Gemini (no S3 upload yet)
      const result = await analyzeWasteImage(imageUri);
      setAnalysis(result);

      // Set editable fields
      setEditedWasteType(result.wasteType);
      if (result.category === "small") {
        setEditedSegregation([...result.segregation]);
      }

      setState("result");
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      setState("picker");
    }
  };

  const handleVerifyAndReport = async () => {
    if (!analysis || !imageUri || !user) return;

    setState("submitting");

    try {
      // Update analysis with edited values
      const finalAnalysis: WasteAnalysis = {
        ...analysis,
        wasteType: editedWasteType as any,
        ...(analysis.category === "small"
          ? { segregation: editedSegregation }
          : {}),
      } as WasteAnalysis;

      // Submit to backend (uploads to S3 and saves to database)
      const result = await submitWasteReport({
        imageUri,
        userId: user.id,
        analysis: finalAnalysis,
        location,
      });

      // Save to local storage as well
      await saveWasteReport({
        userId: user.id,
        imageUrl: result.imageUrl,
        s3ReportId: result.reportId,
        analysis: finalAnalysis,
        location,
      });

      setS3ImageUrl(result.imageUrl);
      setS3ReportId(result.reportId);

      setState("success");

      // Auto-reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save report");
      setState("result");
    }
  };

  const resetForm = () => {
    setImageUri(null);
    setS3ImageUrl(null);
    setS3ReportId(null);
    setAnalysis(null);
    setEditedWasteType("");
    setEditedSegregation([]);
    setLocation({
      latitude: 0,
      longitude: 0,
    });
    setLoadingLocation(false);
    setError("");
    setState("picker");
  };

  const updateSegregationItem = (
    index: number,
    field: "label" | "count",
    value: string | number
  ) => {
    const updated = [...editedSegregation];
    if (field === "label") {
      updated[index].label = value as string;
    } else {
      updated[index].count = Number(value);
    }
    setEditedSegregation(updated);
  };

  const addSegregationItem = () => {
    setEditedSegregation([...editedSegregation, { label: "", count: 1 }]);
  };

  const removeSegregationItem = (index: number) => {
    setEditedSegregation(editedSegregation.filter((_, i) => i !== index));
  };

  // Render different screens based on state
  if (state === "picker") {
    return (
      <Theme name="light">
        <ScrollView flex={1} backgroundColor="$background">
          <YStack backgroundColor="$green9" padding="$5" paddingTop="$10">
            <H2 color="white" fontWeight="bold">
              Report Waste
            </H2>
            <Paragraph color="white" opacity={0.9} marginTop="$1">
              AI-powered waste detection
            </Paragraph>
          </YStack>

          <YStack padding="$4" gap="$4">
            {error ? (
              <Card backgroundColor="$red2" padding="$3" borderRadius="$3">
                <Text color="$red10">{error}</Text>
              </Card>
            ) : null}

            {imageUri ? (
              <Card padding="$0" borderRadius="$4" overflow="hidden">
                <RNImage
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: 300 }}
                  resizeMode="cover"
                />
              </Card>
            ) : (
              <Card
                backgroundColor="$gray2"
                padding="$6"
                borderRadius="$4"
                borderWidth={2}
                borderColor="$gray5"
                borderStyle="dashed"
              >
                <YStack alignItems="center" gap="$3">
                  <Text fontSize="$8">📸</Text>
                  <H4 color="$gray11">No image selected</H4>
                  <Paragraph color="$gray10" textAlign="center">
                    Capture or upload an image of waste
                  </Paragraph>
                </YStack>
              </Card>
            )}

            <XStack gap="$3">
              <Button
                flex={1}
                backgroundColor="$blue9"
                onPress={pickImageFromCamera}
                icon={<Text fontSize="$5">📷</Text>}
              >
                <Text color="white" fontWeight="600">
                  Camera
                </Text>
              </Button>
              <Button
                flex={1}
                backgroundColor="$purple9"
                onPress={pickImageFromGallery}
                icon={<Text fontSize="$5">🖼️</Text>}
              >
                <Text color="white" fontWeight="600">
                  Gallery
                </Text>
              </Button>
            </XStack>

            {imageUri && (
              <>
                {/* Location Display */}
                {loadingLocation ? (
                  <Card backgroundColor="$gray2" padding="$3" borderRadius="$3">
                    <XStack gap="$2" alignItems="center">
                      <Spinner size="small" color="$gray10" />
                      <Text color="$gray10">Getting location...</Text>
                    </XStack>
                  </Card>
                ) : location.city && location.city !== "Unknown" ? (
                  <Card
                    backgroundColor="$green2"
                    padding="$3"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$green7"
                  >
                    <XStack gap="$2" alignItems="center">
                      <Text fontSize="$4">📍</Text>
                      <YStack flex={1}>
                        <Text color="$green11" fontWeight="600">
                          {location.city}, {location.state}
                        </Text>
                        <Text color="$green10" fontSize="$2" numberOfLines={1}>
                          {location.address}
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                ) : (
                  <Card
                    backgroundColor="$yellow2"
                    padding="$3"
                    borderRadius="$3"
                  >
                    <XStack gap="$2" alignItems="center">
                      <Text fontSize="$4">⚠️</Text>
                      <Text color="$yellow11" fontSize="$3">
                        Location unavailable
                      </Text>
                    </XStack>
                  </Card>
                )}

                <Button
                  backgroundColor="$green9"
                  size="$5"
                  onPress={analyzeImage}
                  marginTop="$4"
                >
                  <Text color="white" fontWeight="bold" fontSize="$4">
                    🔍 Analyze Waste
                  </Text>
                </Button>

                <Button chromeless color="$gray11" onPress={resetForm}>
                  Cancel
                </Button>
              </>
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
              💡 How it works
            </H4>
            <Paragraph color="$blue11">• Capture/upload waste image</Paragraph>
            <Paragraph color="$blue11">
              • AI analyzes waste type & details
            </Paragraph>
            <Paragraph color="$blue11">• Review and edit if needed</Paragraph>
            <Paragraph color="$blue11">
              • Submit report for collection
            </Paragraph>
          </YStack>
        </ScrollView>
      </Theme>
    );
  }

  if (state === "analyzing") {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Spinner size="large" color="$green9" />
          <H3 color="$gray12" marginTop="$4">
            Analyzing waste...
          </H3>
          <Paragraph color="$gray10" textAlign="center" marginTop="$2">
            AI is processing your image
          </Paragraph>
        </YStack>
      </Theme>
    );
  }

  if (state === "result" && analysis) {
    const isSmall = analysis.category === "small";
    const smallAnalysis = isSmall ? (analysis as SmallWasteAnalysis) : null;
    const largeAnalysis = !isSmall ? (analysis as LargeWasteAnalysis) : null;

    return (
      <Theme name="light">
        <ScrollView flex={1} backgroundColor="$background">
          <YStack backgroundColor="$green9" padding="$5" paddingTop="$10">
            <H2 color="white" fontWeight="bold">
              Analysis Results
            </H2>
            <Paragraph color="white" opacity={0.9} marginTop="$1">
              {isSmall ? "Small/Medium Waste" : "Large/Bulk Waste"}
            </Paragraph>
          </YStack>

          <YStack padding="$4" gap="$4">
            {/* Image Preview */}
            <Card padding="$0" borderRadius="$4" overflow="hidden">
              <RNImage
                source={{ uri: imageUri! }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
              />
            </Card>

            {/* Location Info */}
            {location.city && location.city !== "Unknown" && (
              <Card
                backgroundColor="$blue2"
                padding="$4"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$blue9"
              >
                <XStack gap="$2" alignItems="flex-start">
                  <Text fontSize="$5">📍</Text>
                  <YStack flex={1}>
                    <Text color="$blue11" fontWeight="600" fontSize="$4">
                      {location.city}, {location.state}
                    </Text>
                    <Text color="$blue10" fontSize="$2" marginTop="$1">
                      {location.address}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            )}

            {/* Confidence */}
            <Card backgroundColor="white" padding="$4" borderRadius="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray11">AI Confidence</Text>
                <Text color="$green10" fontWeight="bold" fontSize="$5">
                  {analysis.confidence}%
                </Text>
              </XStack>
            </Card>

            {/* Editable: Waste Type */}
            <YStack gap="$2">
              <Label color="$gray12" fontWeight="600">
                Waste Type (Editable)
              </Label>
              <XStack flexWrap="wrap" gap="$2">
                {[
                  "plastic",
                  "organic",
                  "metal",
                  "e-waste",
                  "hazardous",
                  "mixed",
                ].map((type) => (
                  <Button
                    key={type}
                    size="$3"
                    onPress={() => setEditedWasteType(type)}
                    backgroundColor={
                      editedWasteType === type ? "$green9" : "white"
                    }
                    borderColor={
                      editedWasteType === type ? "$green9" : "$gray5"
                    }
                    borderWidth={1}
                  >
                    <Text
                      color={editedWasteType === type ? "white" : "$gray10"}
                      textTransform="capitalize"
                    >
                      {type}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Small Waste Details */}
            {isSmall && smallAnalysis && (
              <>
                {/* Editable: Segregation */}
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Label color="$gray12" fontWeight="600">
                      Segregation (Editable)
                    </Label>
                    <Button
                      size="$2"
                      onPress={addSegregationItem}
                      backgroundColor="$green9"
                    >
                      <Text color="white" fontSize="$2">
                        + Add Item
                      </Text>
                    </Button>
                  </XStack>

                  {editedSegregation.map((item, index) => (
                    <Card
                      key={index}
                      backgroundColor="white"
                      padding="$3"
                      borderRadius="$3"
                    >
                      <XStack gap="$2" alignItems="center">
                        <Input
                          flex={2}
                          value={item.label}
                          onChangeText={(val) =>
                            updateSegregationItem(index, "label", val)
                          }
                          placeholder="Item name"
                          backgroundColor="$gray2"
                        />
                        <Input
                          flex={1}
                          value={String(item.count)}
                          onChangeText={(val) =>
                            updateSegregationItem(index, "count", val)
                          }
                          placeholder="Count"
                          keyboardType="number-pad"
                          backgroundColor="$gray2"
                        />
                        <Button
                          size="$2"
                          onPress={() => removeSegregationItem(index)}
                          backgroundColor="$red9"
                        >
                          <Text color="white">×</Text>
                        </Button>
                      </XStack>
                    </Card>
                  ))}
                </YStack>

                {/* Non-editable fields */}
                <Card backgroundColor="white" padding="$4" borderRadius="$4">
                  <YStack gap="$3">
                    <XStack justifyContent="space-between">
                      <Text color="$gray11">Estimated Weight</Text>
                      <Text fontWeight="bold">
                        {smallAnalysis.estimatedWeightKg} kg
                      </Text>
                    </XStack>
                    <Separator />
                    <XStack justifyContent="space-between">
                      <Text color="$gray11">Recyclability</Text>
                      <Text fontWeight="bold" color="$green10">
                        {smallAnalysis.recyclabilityPercent}%
                      </Text>
                    </XStack>
                    <Separator />
                    <XStack justifyContent="space-between">
                      <Text color="$gray11">Contamination</Text>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {smallAnalysis.contaminationLevel}
                      </Text>
                    </XStack>
                    <Separator />
                    <XStack justifyContent="space-between">
                      <Text color="$gray11">Hazardous</Text>
                      <Text
                        fontWeight="bold"
                        color={smallAnalysis.hazardous ? "$red10" : "$green10"}
                      >
                        {smallAnalysis.hazardous ? "Yes" : "No"}
                      </Text>
                    </XStack>
                  </YStack>
                </Card>
              </>
            )}

            {/* Large Waste Details */}
            {!isSmall && largeAnalysis && (
              <Card backgroundColor="white" padding="$4" borderRadius="$4">
                <YStack gap="$3">
                  <XStack justifyContent="space-between">
                    <Text color="$gray11">Estimated Weight</Text>
                    <Text fontWeight="bold">
                      {largeAnalysis.estimatedWeightKg} kg
                    </Text>
                  </XStack>
                  <Separator />
                  <XStack justifyContent="space-between">
                    <Text color="$gray11">Overflow Level</Text>
                    <Text fontWeight="bold" textTransform="capitalize">
                      {largeAnalysis.overflowLevel}
                    </Text>
                  </XStack>
                  <Separator />
                  <XStack justifyContent="space-between">
                    <Text color="$gray11">Urgency</Text>
                    <Text
                      fontWeight="bold"
                      textTransform="capitalize"
                      color={
                        largeAnalysis.urgencyLevel === "critical"
                          ? "$red10"
                          : largeAnalysis.urgencyLevel === "urgent"
                          ? "$orange10"
                          : "$green10"
                      }
                    >
                      {largeAnalysis.urgencyLevel}
                    </Text>
                  </XStack>
                  <Separator />
                  <XStack justifyContent="space-between">
                    <Text color="$gray11">Hazard Level</Text>
                    <Text fontWeight="bold" textTransform="capitalize">
                      {largeAnalysis.hazardLevel}
                    </Text>
                  </XStack>
                  <Separator />
                  <XStack justifyContent="space-between">
                    <Text color="$gray11">Illegal Dumping</Text>
                    <Text
                      fontWeight="bold"
                      color={
                        largeAnalysis.illegalDumping ? "$red10" : "$green10"
                      }
                    >
                      {largeAnalysis.illegalDumping ? "Yes" : "No"}
                    </Text>
                  </XStack>
                </YStack>
              </Card>
            )}

            {/* AI Notes */}
            {analysis.notes && (
              <Card
                backgroundColor="$yellow2"
                padding="$4"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$yellow9"
              >
                <Label color="$yellow11" fontWeight="bold" marginBottom="$2">
                  AI Notes
                </Label>
                <Paragraph color="$yellow11">{analysis.notes}</Paragraph>
              </Card>
            )}

            {/* Action Buttons */}
            <Button
              backgroundColor="$green9"
              size="$5"
              onPress={handleVerifyAndReport}
              marginTop="$2"
            >
              <Text color="white" fontWeight="bold" fontSize="$4">
                ✓ Verify & Report
              </Text>
            </Button>

            <Button chromeless color="$gray11" onPress={resetForm}>
              Cancel & Start Over
            </Button>
          </YStack>
        </ScrollView>
      </Theme>
    );
  }

  if (state === "submitting") {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Spinner size="large" color="$green9" />
          <H3 color="$gray12" marginTop="$4">
            Submitting report...
          </H3>
          <Paragraph color="$gray10" textAlign="center" marginTop="$2">
            Saving your waste report
          </Paragraph>
        </YStack>
      </Theme>
    );
  }

  if (state === "success" && analysis) {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text fontSize={80}>✅</Text>
          <H2 color="$green10" marginTop="$4" textAlign="center">
            Report Submitted!
          </H2>
          <Paragraph color="$gray10" textAlign="center" marginTop="$2">
            Your waste report has been saved locally
          </Paragraph>

          <Card
            backgroundColor="white"
            padding="$4"
            borderRadius="$4"
            marginTop="$6"
            width="100%"
          >
            <YStack gap="$2">
              <XStack justifyContent="space-between">
                <Text color="$gray11">Category</Text>
                <Text fontWeight="bold" textTransform="capitalize">
                  {analysis.category}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Type</Text>
                <Text fontWeight="bold" textTransform="capitalize">
                  {editedWasteType}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Weight</Text>
                <Text fontWeight="bold">{analysis.estimatedWeightKg} kg</Text>
              </XStack>
            </YStack>
          </Card>

          <Paragraph color="$gray9" fontSize="$2" marginTop="$4">
            Redirecting to home screen...
          </Paragraph>
        </YStack>
      </Theme>
    );
  }

  return null;
}
