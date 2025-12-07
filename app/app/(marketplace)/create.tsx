"use client"

import { useUser } from "@clerk/clerk-expo"
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import * as Location from "expo-location"
import { router } from "expo-router"
import React from "react"
import { Alert, Animated, Dimensions, TouchableOpacity } from "react-native"
import { Image, Input, ScrollView, Spinner, Text, TextArea, XStack, YStack } from "tamagui"
import { createMarketplaceListing } from "../services/marketplaceService"
import { fetchUserProfile } from "../services/userService"

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string
const { width } = Dimensions.get("window")

// Floating particle component
const FloatingParticle = ({ delay, startX, emoji }: { delay: number; startX: number; emoji: string }) => {
  const translateY = React.useRef(new Animated.Value(0)).current
  const translateX = React.useRef(new Animated.Value(0)).current
  const opacity = React.useRef(new Animated.Value(0)).current
  const rotate = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const animate = () => {
      translateY.setValue(600)
      translateX.setValue(0)
      opacity.setValue(0)
      rotate.setValue(0)

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: 30,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: -30,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate())
    }
    animate()
  }, [])

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  )
}

export default function CreateListingScreen() {
  const { user } = useUser()
  const [images, setImages] = React.useState<string[]>([])
  const [wasteType, setWasteType] = React.useState("")
  const [weightKg, setWeightKg] = React.useState("")
  const [basePrice, setBasePrice] = React.useState("")
  const [auctionDuration, setAuctionDuration] = React.useState("24")
  const [description, setDescription] = React.useState("")
  const [analyzing, setAnalyzing] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [location, setLocation] = React.useState<{
    latitude: number
    longitude: number
    city?: string
    state?: string
  } | null>(null)

  // Animations
  const headerAnim = React.useRef(new Animated.Value(-100)).current
  const contentAnim = React.useRef(new Animated.Value(50)).current
  const contentOpacity = React.useRef(new Animated.Value(0)).current
  const logoRotate = React.useRef(new Animated.Value(0)).current
  const logoScale = React.useRef(new Animated.Value(0.5)).current

  React.useEffect(() => {
    // Animate header sliding down
    Animated.spring(headerAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()

    // Animate content sliding up
    Animated.parallel([
      Animated.spring(contentAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start()

    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start()

    getUserLocation()
  }, [user])

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-10deg", "10deg"],
  })

  const getUserLocation = async () => {
    if (!user) return

    try {
      const profile = await fetchUserProfile(user.id)
      if (profile.city && profile.state) {
        setLocation({
          latitude: 19.076,
          longitude: 72.8777,
          city: profile.city,
          state: profile.state,
        })
        return
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Location Required", "Location is needed to create a listing")
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      })

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        city: geocode[0]?.city || undefined,
        state: geocode[0]?.region || undefined,
      })
    } catch (error) {
      console.error("Error getting location:", error)
      Alert.alert("Location Error", "Failed to get location. Using default location.")
      setLocation({
        latitude: 19.076,
        longitude: 72.8777,
      })
    }
  }

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant photo library access to upload images")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      })

      if (!result.canceled && result.assets) {
        const selectedUris = result.assets.map((asset) => asset.uri)
        const totalImages = images.length + selectedUris.length

        if (totalImages > 5) {
          Alert.alert(
            "Too Many Images",
            `You can upload a maximum of 5 images. You have ${images.length} already selected.`,
          )
          return
        }

        setImages([...images, ...selectedUris])
      }
    } catch (error) {
      console.error("Error picking images:", error)
      Alert.alert("Error", "Failed to pick images")
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const analyzeWithAI = async () => {
    if (images.length === 0) {
      Alert.alert("No Images", "Please select at least one image to analyze")
      return
    }

    try {
      setAnalyzing(true)
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const response = await fetch(images[0])
      const blob = await response.blob()
      const reader = new FileReader()

      reader.onloadend = async () => {
        const base64data = reader.result as string
        const base64Image = base64data.split(",")[1]

        const prompt = `Analyze this image of recyclable waste and provide:
1. Waste type (choose from: Plastic, Organic, Metal, Glass, Electronic, Paper, Mixed)
2. Estimated weight in kilograms (provide a number)
3. Brief description of the waste items

Format your response as:
Type: [waste type]
Weight: [number] kg
Description: [brief description]`

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg",
            },
          },
        ])

        const text = result.response.text()
        console.log("AI Analysis:", text)

        const typeMatch = text.match(/Type:\s*([^\n]+)/i)
        const weightMatch = text.match(/Weight:\s*(\d+(?:\.\d+)?)/i)
        const descMatch = text.match(/Description:\s*([^\n]+)/i)

        if (typeMatch && typeMatch[1]) {
          const detectedType = typeMatch[1].trim()
          const validTypes = ["Plastic", "Organic", "Metal", "Glass", "Electronic", "Paper", "Mixed"]
          const matchedType = validTypes.find((type) => type.toLowerCase() === detectedType.toLowerCase())
          if (matchedType) {
            setWasteType(matchedType)
          }
        }

        if (weightMatch && weightMatch[1]) {
          setWeightKg(weightMatch[1])
        }

        if (descMatch && descMatch[1]) {
          setDescription(descMatch[1].trim())
        }

        Alert.alert("Analysis Complete", "Waste details have been auto-filled. Please review and adjust if needed.")
      }

      reader.readAsDataURL(blob)
    } catch (error) {
      console.error("Error analyzing image:", error)
      Alert.alert("Analysis Failed", "Failed to analyze image with AI")
    } finally {
      setAnalyzing(false)
    }
  }

  const validateForm = () => {
    if (images.length === 0) {
      Alert.alert("Validation Error", "Please upload at least one image")
      return false
    }

    if (!wasteType.trim()) {
      Alert.alert("Validation Error", "Please enter waste type")
      return false
    }

    const weight = Number.parseFloat(weightKg)
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Validation Error", "Please enter a valid weight")
      return false
    }

    const price = Number.parseFloat(basePrice)
    if (isNaN(price) || price < 10) {
      Alert.alert("Validation Error", "Minimum base price is Rs.10")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !user) return

    if (!location) {
      Alert.alert("Location Required", "Please wait while we get your location")
      return
    }

    try {
      setSubmitting(true)

      const listingData = {
        wasteType,
        weightKg: Number.parseFloat(weightKg),
        basePrice: Number.parseFloat(basePrice),
        auctionDuration: Number.parseFloat(auctionDuration) * 60,
        description: description.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        state: location.state,
        imageUris: images,
      }

      await createMarketplaceListing(user.id, listingData)

      Alert.alert("Success", "Your listing has been created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      console.error("Error creating listing:", error)
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create listing")
    } finally {
      setSubmitting(false)
    }
  }

  const particles = [
    { emoji: "📦", x: width * 0.1 },
    { emoji: "♻️", x: width * 0.3 },
    { emoji: "🏷️", x: width * 0.5 },
    { emoji: "💰", x: width * 0.7 },
    { emoji: "🌱", x: width * 0.9 },
  ]

  return (
    <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={{ flex: 1 }}>
      {/* Floating Particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} delay={i * 1500} startX={p.x} emoji={p.emoji} />
      ))}

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={{ transform: [{ translateY: headerAnim }] }}>
          <YStack paddingHorizontal="$5" paddingTop="$12" paddingBottom="$6" alignItems="center">
            {/* Animated Logo */}
            <Animated.View
              style={{
                transform: [{ scale: logoScale }, { rotate: logoSpin }],
                marginBottom: 16,
              }}
            >
              <YStack
                width={80}
                height={80}
                borderRadius={40}
                backgroundColor="white"
                justifyContent="center"
                alignItems="center"
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text fontSize={40}>📦</Text>
              </YStack>
            </Animated.View>

            {/* Back Button and Title */}
            <XStack alignItems="center" gap="$3" width="100%">
              <TouchableOpacity onPress={() => router.back()}>
                <YStack
                  width={44}
                  height={44}
                  borderRadius={22}
                  backgroundColor="white"
                  justifyContent="center"
                  alignItems="center"
                  style={{
                    shadowColor: "#22c55e",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text fontSize={20} color="#166534">
                    ←
                  </Text>
                </YStack>
              </TouchableOpacity>
              <YStack flex={1}>
                <Text fontSize={28} fontWeight="800" color="#166534">
                  Create Listing
                </Text>
                <Text fontSize={14} color="#15803d" opacity={0.8}>
                  List your recyclable waste for auction
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Animated.View>

        {/* Form Content */}
        <Animated.View
          style={{
            transform: [{ translateY: contentAnim }],
            opacity: contentOpacity,
            paddingHorizontal: 16,
            paddingBottom: 32,
          }}
        >
          {/* Image Upload Card */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$5"
            marginBottom="$4"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$3">
              Photos (Max 5) *
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {images.map((uri, index) => (
                <YStack key={index} position="relative">
                  <Image source={{ uri }} width={90} height={90} borderRadius={16} />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      backgroundColor: "#ef4444",
                      borderRadius: 14,
                      width: 28,
                      height: 28,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text color="white" fontWeight="bold" fontSize={16}>
                      x
                    </Text>
                  </TouchableOpacity>
                </YStack>
              ))}
              {images.length < 5 && (
                <TouchableOpacity onPress={pickImages}>
                  <YStack
                    width={90}
                    height={90}
                    borderRadius={16}
                    borderWidth={2}
                    borderColor="#22c55e"
                    borderStyle="dashed"
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="#f0fdf4"
                  >
                    <Text fontSize={28}>📷</Text>
                    <Text color="#22c55e" fontSize={12} fontWeight="600">
                      Add Photo
                    </Text>
                  </YStack>
                </TouchableOpacity>
              )}
            </XStack>
            <TouchableOpacity
              onPress={analyzeWithAI}
              disabled={images.length === 0 || analyzing}
              style={{
                backgroundColor: images.length === 0 || analyzing ? "#d1d5db" : "#22c55e",
                borderRadius: 16,
                padding: 14,
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {analyzing ? <Spinner color="white" size="small" /> : <Text fontSize={20}>🤖</Text>}
              <Text color="white" fontWeight="700" fontSize={16}>
                {analyzing ? "Analyzing..." : "Analyze with AI"}
              </Text>
            </TouchableOpacity>
          </YStack>

          {/* Waste Details Card */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$5"
            marginBottom="$4"
            gap="$4"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text fontWeight="700" color="#166534" fontSize={18}>
              Waste Details
            </Text>

            {/* Waste Type */}
            <YStack gap="$2">
              <Text fontWeight="600" color="#374151" fontSize={14}>
                Waste Type *
              </Text>
              <Input
                value={wasteType}
                onChangeText={setWasteType}
                placeholder="e.g., Plastic, Metal, Glass"
                size="$4"
                backgroundColor="#f0fdf4"
                borderWidth={2}
                borderColor="#22c55e"
                borderRadius={16}
                color="#166534"
                placeholderTextColor="#9ca3af"
              />
            </YStack>

            {/* Weight */}
            <YStack gap="$2">
              <Text fontWeight="600" color="#374151" fontSize={14}>
                Weight (kg) *
              </Text>
              <Input
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="Enter weight in kilograms"
                keyboardType="decimal-pad"
                size="$4"
                backgroundColor="#f0fdf4"
                borderWidth={2}
                borderColor="#22c55e"
                borderRadius={16}
                color="#166534"
                placeholderTextColor="#9ca3af"
              />
            </YStack>

            {/* Base Price */}
            <YStack gap="$2">
              <Text fontWeight="600" color="#374151" fontSize={14}>
                Starting Price (Rs.) *
              </Text>
              <Input
                value={basePrice}
                onChangeText={setBasePrice}
                placeholder="Minimum Rs.10"
                keyboardType="decimal-pad"
                size="$4"
                backgroundColor="#f0fdf4"
                borderWidth={2}
                borderColor="#22c55e"
                borderRadius={16}
                color="#166534"
                placeholderTextColor="#9ca3af"
              />
              <Text color="#6b7280" fontSize={12}>
                Buyers will bid from this price upwards
              </Text>
            </YStack>
          </YStack>

          {/* Auction Duration Card */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$5"
            marginBottom="$4"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$3">
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
                <TouchableOpacity key={option.value} onPress={() => setAuctionDuration(option.value)}>
                  <YStack
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderRadius={16}
                    backgroundColor={auctionDuration === option.value ? "#22c55e" : "#f0fdf4"}
                    borderWidth={2}
                    borderColor="#22c55e"
                  >
                    <Text color={auctionDuration === option.value ? "white" : "#22c55e"} fontWeight="700" fontSize={14}>
                      {option.label}
                    </Text>
                  </YStack>
                </TouchableOpacity>
              ))}
            </XStack>
          </YStack>

          {/* Description Card */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$5"
            marginBottom="$4"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$3">
              Description (Optional)
            </Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional details about the waste..."
              size="$4"
              backgroundColor="#f0fdf4"
              borderWidth={2}
              borderColor="#22c55e"
              borderRadius={16}
              minHeight={100}
              color="#166534"
              placeholderTextColor="#9ca3af"
            />
          </YStack>

          {/* Location Info */}
          {location && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$4"
              marginBottom="$4"
              borderWidth={2}
              borderColor="#22c55e"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <XStack alignItems="center" gap="$2">
                <Text fontSize={20}>📍</Text>
                <Text color="#166534" fontSize={14} fontWeight="600">
                  Location: {location.city || "Unknown"}, {location.state || "Unknown"}
                </Text>
              </XStack>
            </YStack>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !location}
            style={{
              backgroundColor: submitting || !location ? "#d1d5db" : "#22c55e",
              borderRadius: 24,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {submitting && <Spinner color="white" size="small" />}
            <Text color="white" fontWeight="800" fontSize={18}>
              {submitting ? "Creating Listing..." : "Create Listing"}
            </Text>
          </TouchableOpacity>

          {/* Tip Card */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$4"
            marginTop="$4"
            borderLeftWidth={4}
            borderLeftColor="#22c55e"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <XStack alignItems="flex-start" gap="$2">
              <Text fontSize={20}>💡</Text>
              <Text color="#374151" fontSize={14} lineHeight={22} flex={1}>
                <Text fontWeight="700">Tip:</Text> Clear photos and accurate details help attract more bidders. You'll
                earn 30 points when the transaction completes!
              </Text>
            </XStack>
          </YStack>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  )
}
