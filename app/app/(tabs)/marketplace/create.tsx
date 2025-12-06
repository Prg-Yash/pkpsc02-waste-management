import React from "react";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Button,
  H2,
  Input,
  TextArea,
  Theme,
  Spinner,
  Image,
} from "tamagui";
import { Alert, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createMarketplaceListing } from "../../services/marketplaceService";
import { fetchUserProfile } from "../../services/userService";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string;

export default function CreateListingScreen() {
  const { user } = useUser();
  const [images, setImages] = React.useState<string[]>([]);
  const [wasteType, setWasteType] = React.useState("");
  const [weightKg, setWeightKg] = React.useState("");
  const [basePrice, setBasePrice] = React.useState("");
  const [auctionDuration, setAuctionDuration] = React.useState("24");
  const [description, setDescription] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [location, setLocation] = React.useState<{
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
  } | null>(null);

  // Get user location on mount
  React.useEffect(() => {
    getUserLocation();
  }, [user]);

  const getUserLocation = async () => {
    if (!user) return;

    try {
      // First try to get from user profile
      const profile = await fetchUserProfile(user.id);
      if (profile.city && profile.state) {
        // Use approximate coordinates for city (can be improved with geocoding)
        setLocation({
          latitude: 19.076, // Default Mumbai coordinates
          longitude: 72.8777,
          city: profile.city,
          state: profile.state,
        });
        return;
      }

      // Fall back to device location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Location is needed to create a listing"
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        city: geocode[0]?.city || undefined,
        state: geocode[0]?.region || undefined,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Failed to get location. Using default location."
      );
      // Use default Mumbai coordinates
      setLocation({
        latitude: 19.076,
        longitude: 72.8777,
      });
    }
  };

  const pickImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to upload images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const selectedUris = result.assets.map((asset) => asset.uri);
        const totalImages = images.length + selectedUris.length;

        if (totalImages > 5) {
          Alert.alert(
            "Too Many Images",
            `You can upload a maximum of 5 images. You have ${images.length} already selected.`
          );
          return;
        }

        setImages([...images, ...selectedUris]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const analyzeWithAI = async () => {
    if (images.length === 0) {
      Alert.alert("No Images", "Please select at least one image to analyze");
      return;
    }

    try {
      setAnalyzing(true);
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Convert first image to base64
      const response = await fetch(images[0]);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(",")[1];

        const prompt = `Analyze this image of recyclable waste and provide:
1. Waste type (choose from: Plastic, Organic, Metal, Glass, Electronic, Paper, Mixed)
2. Estimated weight in kilograms (provide a number)
3. Brief description of the waste items

Format your response as:
Type: [waste type]
Weight: [number] kg
Description: [brief description]`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg",
            },
          },
        ]);

        const text = result.response.text();
        console.log("AI Analysis:", text);

        // Parse the response
        const typeMatch = text.match(/Type:\s*([^\n]+)/i);
        const weightMatch = text.match(/Weight:\s*(\d+(?:\.\d+)?)/i);
        const descMatch = text.match(/Description:\s*([^\n]+)/i);

        if (typeMatch && typeMatch[1]) {
          const detectedType = typeMatch[1].trim();
          // Validate against allowed types
          const validTypes = [
            "Plastic",
            "Organic",
            "Metal",
            "Glass",
            "Electronic",
            "Paper",
            "Mixed",
          ];
          const matchedType = validTypes.find(
            (type) => type.toLowerCase() === detectedType.toLowerCase()
          );
          if (matchedType) {
            setWasteType(matchedType);
          }
        }

        if (weightMatch && weightMatch[1]) {
          setWeightKg(weightMatch[1]);
        }

        if (descMatch && descMatch[1]) {
          setDescription(descMatch[1].trim());
        }

        Alert.alert(
          "Analysis Complete",
          "Waste details have been auto-filled. Please review and adjust if needed."
        );
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error analyzing image:", error);
      Alert.alert("Analysis Failed", "Failed to analyze image with AI");
    } finally {
      setAnalyzing(false);
    }
  };

  const validateForm = () => {
    if (images.length === 0) {
      Alert.alert("Validation Error", "Please upload at least one image");
      return false;
    }

    if (!wasteType.trim()) {
      Alert.alert("Validation Error", "Please enter waste type");
      return false;
    }

    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Validation Error", "Please enter a valid weight");
      return false;
    }

    const price = parseFloat(basePrice);
    if (isNaN(price) || price < 10) {
      Alert.alert("Validation Error", "Minimum base price is ₹10");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    if (!location) {
      Alert.alert(
        "Location Required",
        "Please wait while we get your location"
      );
      return;
    }

    try {
      setSubmitting(true);

      const listingData = {
        wasteType,
        weightKg: parseFloat(weightKg),
        basePrice: parseFloat(basePrice),
        auctionDuration: parseInt(auctionDuration),
        description: description.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        state: location.state,
        imageUris: images,
      };

      await createMarketplaceListing(user.id, listingData);

      Alert.alert("Success", "Your listing has been created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating listing:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create listing"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack
          backgroundColor="$green9"
          padding="$5"
          paddingTop="$10"
          paddingBottom="$4"
        >
          <XStack alignItems="center" gap="$3">
            <Button
              onPress={() => router.back()}
              size="$3"
              circular
              backgroundColor="rgba(255,255,255,0.2)"
              color="white"
              fontWeight="600"
            >
              ←
            </Button>
            <H2 color="white" fontWeight="bold">
              ➕ Create Listing
            </H2>
          </XStack>
          <Text color="white" opacity={0.9} marginTop="$1" fontSize="$3">
            List your recyclable waste for auction
          </Text>
        </YStack>

        {/* Form */}
        <YStack padding="$4" gap="$4">
          {/* Image Upload */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Photos (Max 5) *
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {images.map((uri, index) => (
                <YStack key={index} position="relative">
                  <Image
                    source={{ uri }}
                    width={100}
                    height={100}
                    borderRadius="$3"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      backgroundColor: "#ef4444",
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text color="white" fontWeight="bold" fontSize={14}>
                      ×
                    </Text>
                  </TouchableOpacity>
                </YStack>
              ))}
              {images.length < 5 && (
                <TouchableOpacity onPress={pickImages}>
                  <YStack
                    width={100}
                    height={100}
                    borderRadius="$3"
                    borderWidth={2}
                    borderColor="$gray8"
                    borderStyle="dashed"
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="$gray3"
                  >
                    <Text fontSize={32}>📷</Text>
                    <Text color="$gray10" fontSize="$2">
                      Add Photo
                    </Text>
                  </YStack>
                </TouchableOpacity>
              )}
            </XStack>
            <Button
              onPress={analyzeWithAI}
              disabled={images.length === 0 || analyzing}
              backgroundColor="$purple9"
              color="white"
              fontWeight="600"
              size="$4"
              marginTop="$2"
              icon={analyzing ? <Spinner color="white" /> : <Text>🤖</Text>}
            >
              {analyzing ? "Analyzing..." : "Analyze with AI"}
            </Button>
          </YStack>

          {/* Waste Type */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Waste Type *
            </Text>
            <Input
              value={wasteType}
              onChangeText={setWasteType}
              placeholder="e.g., Plastic, Metal, Glass"
              size="$4"
              backgroundColor="white"
              borderWidth={1}
              borderColor="$gray8"
            />
          </YStack>

          {/* Weight */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Weight (kg) *
            </Text>
            <Input
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="Enter weight in kilograms"
              keyboardType="decimal-pad"
              size="$4"
              backgroundColor="white"
              borderWidth={1}
              borderColor="$gray8"
            />
          </YStack>

          {/* Base Price */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Starting Price (₹) *
            </Text>
            <Input
              value={basePrice}
              onChangeText={setBasePrice}
              placeholder="Minimum ₹10"
              keyboardType="decimal-pad"
              size="$4"
              backgroundColor="white"
              borderWidth={1}
              borderColor="$gray8"
            />
            <Text color="$gray10" fontSize="$2">
              Buyers will bid from this price upwards
            </Text>
          </YStack>

          {/* Auction Duration */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Auction Duration *
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {[
                { label: "30 min", value: "0.5" },
                { label: "1 hour", value: "1" },
                { label: "6 hours", value: "6" },
                { label: "24 hours", value: "24" },
                { label: "3 days", value: "72" },
              ].map((option) => (
                <Button
                  key={option.value}
                  onPress={() => setAuctionDuration(option.value)}
                  backgroundColor={
                    auctionDuration === option.value ? "$blue9" : "$gray5"
                  }
                  color={auctionDuration === option.value ? "white" : "$gray11"}
                  fontWeight="600"
                  size="$3"
                >
                  {option.label}
                </Button>
              ))}
            </XStack>
          </YStack>

          {/* Description */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Description (Optional)
            </Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional details about the waste..."
              size="$4"
              backgroundColor="white"
              borderWidth={1}
              borderColor="$gray8"
              minHeight={100}
            />
          </YStack>

          {/* Location Info */}
          {location && (
            <YStack
              backgroundColor="$blue2"
              padding="$3"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$blue5"
            >
              <Text color="$blue11" fontSize="$2" fontWeight="600">
                📍 Location: {location.city || "Unknown"},{" "}
                {location.state || "Unknown"}
              </Text>
            </YStack>
          )}

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            disabled={submitting || !location}
            backgroundColor="$green9"
            color="white"
            fontWeight="700"
            size="$5"
            marginTop="$2"
            icon={submitting ? <Spinner color="white" /> : undefined}
          >
            {submitting ? "Creating Listing..." : "Create Listing"}
          </Button>

          {/* Info Box */}
          <YStack
            backgroundColor="$blue2"
            padding="$3"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$blue5"
          >
            <Text color="$blue11" fontSize="$2" lineHeight={20}>
              💡 <Text fontWeight="600">Tip:</Text> Clear photos and accurate
              details help attract more bidders. You'll earn 30 points when the
              transaction completes!
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
