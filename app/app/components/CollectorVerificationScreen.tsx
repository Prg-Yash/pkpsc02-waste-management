"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import * as Location from "expo-location"
import React from "react"
import { Alert, Dimensions, Linking, StyleSheet } from "react-native"
import Animated, {
  Easing,
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { Button, H2, H4, Image, Paragraph, ScrollView, Text, Theme, XStack, YStack } from "tamagui"
import { findSuitableDumpingGrounds, type DumpingGroundWithDistance } from "../services/dumpingGroundService"
import { verifyAfterImage, verifyBeforeImage } from "../services/geminiService"
import type { PendingWasteReport } from "../services/wasteCollectionService"
import { submitCollectionVerification } from "../services/wasteCollectionService"
import { validateProximity } from "../utils/locationUtils"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

interface CollectorVerificationScreenProps {
  report: PendingWasteReport
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

type VerificationStep =
  | "capture-before"
  | "verifying-before"
  | "capture-after"
  | "verifying-after"
  | "success"
  | "failed"

// Floating particle component
const FloatingParticle = ({
  emoji,
  delay,
  startX,
}: {
  emoji: string
  delay: number
  startX: number
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const translateX = useSharedValue(startX)
  const opacity = useSharedValue(0)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(0.5)

  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-100, { duration: 8000 + Math.random() * 4000, easing: Easing.linear }), -1, false),
    )
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + 30, { duration: 2000 }),
          withTiming(startX - 30, { duration: 2000 }),
          withTiming(startX, { duration: 2000 }),
        ),
        -1,
        true,
      ),
    )
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 1000 }))
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false))
    scale.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0.7, { duration: 1500 })), -1, true),
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.particleText}>{emoji}</Text>
    </Animated.View>
  )
}

// Animated counter component
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    const startValue = 0
    const duration = 1500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(startValue + (value - startValue) * easeOut)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [value])

  return (
    <Text color="#166534" fontWeight="bold" fontSize={24}>
      {displayValue}
      {suffix}
    </Text>
  )
}

export default function CollectorVerificationScreen({
  report,
  userId,
  onSuccess,
  onCancel,
}: CollectorVerificationScreenProps) {
  const [step, setStep] = React.useState<VerificationStep>("capture-before")
  const [beforeImageUri, setBeforeImageUri] = React.useState<string | null>(null)
  const [afterImageUri, setAfterImageUri] = React.useState<string | null>(null)
  const [verificationMessage, setVerificationMessage] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [nearestDumpingGrounds, setNearestDumpingGrounds] = React.useState<DumpingGroundWithDistance[]>([])
  const [collectorLocation, setCollectorLocation] = React.useState<{
    latitude: number
    longitude: number
  } | null>(null)

  // Animations
  const headerSlide = useSharedValue(-100)
  const contentSlide = useSharedValue(50)
  const logoRotate = useSharedValue(0)
  const logoScale = useSharedValue(0.8)
  const pulseScale = useSharedValue(1)
  const spinnerRotate = useSharedValue(0)

  React.useEffect(() => {
    headerSlide.value = withSpring(0, { damping: 15, stiffness: 80 })
    contentSlide.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 80 }))
    logoScale.value = withSpring(1, { damping: 10, stiffness: 100 })
    logoRotate.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1000 }),
        withTiming(-10, { duration: 1000 }),
        withTiming(0, { duration: 1000 }),
      ),
      -1,
      true,
    )
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true,
    )
    spinnerRotate.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1, false)
  }, [])

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerSlide.value }],
  }))

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentSlide.value }],
    opacity: withTiming(contentSlide.value === 0 ? 1 : 0.5),
  }))

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${logoRotate.value}deg` }, { scale: logoScale.value }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(2 - pulseScale.value),
  }))

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotate.value}deg` }],
  }))

  // Load previously captured before image if exists
  React.useEffect(() => {
    loadBeforeImage()
  }, [])

  const loadBeforeImage = async () => {
    try {
      const storedUri = await AsyncStorage.getItem(`before_image_${report.id}`)
      if (storedUri) {
        setBeforeImageUri(storedUri)
        setStep("capture-after")
      }
    } catch (error) {
      console.error("Error loading before image:", error)
    }
  }

  const saveBeforeImage = async (uri: string) => {
    try {
      await AsyncStorage.setItem(`before_image_${report.id}`, uri)
    } catch (error) {
      console.error("Error saving before image:", error)
    }
  }

  const clearBeforeImage = async () => {
    try {
      await AsyncStorage.removeItem(`before_image_${report.id}`)
    } catch (error) {
      console.error("Error clearing before image:", error)
    }
  }

  const pickImage = async (isBeforeImage = true) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled) {
        if (isBeforeImage) {
          setBeforeImageUri(result.assets[0].uri)
        } else {
          setAfterImageUri(result.assets[0].uri)
        }
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to capture image")
    }
  }

  const pickFromGallery = async (isBeforeImage = true) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled) {
        if (isBeforeImage) {
          setBeforeImageUri(result.assets[0].uri)
        } else {
          setAfterImageUri(result.assets[0].uri)
        }
      }
    } catch (error) {
      console.error("Error picking from gallery:", error)
      Alert.alert("Error", "Failed to select image")
    }
  }

  const handleVerifyBefore = async () => {
    if (!beforeImageUri) {
      Alert.alert("Error", "Please capture a before image first")
      return
    }

    setIsLoading(true)
    setStep("verifying-before")

    try {
      console.log("Getting current location...")
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        throw new Error("Location permission denied")
      }

      const location = await Location.getCurrentPositionAsync({})
      const collectorLat = location.coords.latitude
      const collectorLon = location.coords.longitude

      setCollectorLocation({
        latitude: collectorLat,
        longitude: collectorLon,
      })

      console.log("Validating proximity...")
      const proximityCheck = validateProximity(report.latitude, report.longitude, collectorLat, collectorLon, 500)

      if (!proximityCheck.isValid) {
        setStep("failed")
        setVerificationMessage(
          `Location verification failed: ${proximityCheck.message}\n\nYou must be within 500m of the waste location.`,
        )
        setIsLoading(false)
        return
      }

      console.log("Running AI similarity check (before image)...")
      const beforeVerification = await verifyBeforeImage(report.imageUrl, beforeImageUri)

      if (!beforeVerification.isValid) {
        setStep("failed")
        setVerificationMessage(
          `Before Image Verification Failed\n\n${beforeVerification.message}\n\nDetails:\n- Location Match: ${
            beforeVerification.details?.locationMatch ? "Yes" : "No"
          }\n- Waste Match: ${beforeVerification.details?.wasteMatch ? "Yes" : "No"}\n- Landmarks Match: ${
            beforeVerification.details?.landmarksMatch ? "Yes" : "No"
          }\n\nConfidence: ${(beforeVerification.confidence * 100).toFixed(1)}%`,
        )
        setIsLoading(false)
        return
      }

      await saveBeforeImage(beforeImageUri)
      setStep("capture-after")
      setVerificationMessage(
        `Before Image Verified\n\n${beforeVerification.message}\n\nConfidence: ${(
          beforeVerification.confidence * 100
        ).toFixed(1)}%\n\nNow capture the AFTER image showing the area is clean!`,
      )
      setIsLoading(false)

      Alert.alert(
        "Before Image Verified!",
        `${beforeVerification.message}\n\nConfidence: ${(beforeVerification.confidence * 100).toFixed(
          1,
        )}%\n\nNow please capture an AFTER image showing that the waste has been removed and the area is clean.`,
        [{ text: "Continue" }],
      )
    } catch (error) {
      console.error("Before verification error:", error)
      setStep("failed")
      setVerificationMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsLoading(false)
    }
  }

  const handleVerifyAfter = async () => {
    if (!afterImageUri || !beforeImageUri) {
      Alert.alert("Error", "Please capture an after image first")
      return
    }

    setIsLoading(true)
    setStep("verifying-after")

    try {
      console.log("Running AI removal verification (after image)...")
      const afterVerification = await verifyAfterImage(beforeImageUri, afterImageUri)

      if (!afterVerification.isValid) {
        setStep("failed")
        setVerificationMessage(
          `After Image Verification Failed\n\n${afterVerification.message}\n\nDetails:\n- Waste Removed: ${
            afterVerification.details?.wasteRemoved ? "Yes" : "No"
          }\n- Ground Clean: ${afterVerification.details?.groundClean ? "Yes" : "No"}\n- Landmarks Same: ${
            afterVerification.details?.landmarksSame ? "Yes" : "No"
          }\n- Same Location: ${afterVerification.details?.sameLocation ? "Yes" : "No"}\n- Image Fresh: ${
            afterVerification.details?.imageFresh ? "Yes" : "No"
          }\n- Lighting Consistent: ${
            afterVerification.details?.lightingConsistent ? "Yes" : "No"
          }\n\nConfidence: ${(afterVerification.confidence * 100).toFixed(1)}%`,
        )
        setIsLoading(false)
        return
      }

      console.log("Submitting collection verification...")
      if (!collectorLocation) {
        throw new Error("Collector location not found")
      }

      await submitCollectionVerification({
        reportId: report.id,
        collectorId: userId,
        afterImageUri: afterImageUri,
        collectorLatitude: collectorLocation.latitude,
        collectorLongitude: collectorLocation.longitude,
        verificationData: {
          sameWaste: afterVerification.isValid,
          matchConfidence: afterVerification.confidence,
          notes: afterVerification.message,
          ...afterVerification.details,
        },
      })

      await clearBeforeImage()

      setStep("success")
      setVerificationMessage(
        `Collection Verified!\n\n${
          afterVerification.message
        }\n\nConfidence: ${(afterVerification.confidence * 100).toFixed(1)}%`,
      )

      const grounds = findSuitableDumpingGrounds(
        report.aiAnalysis.wasteType,
        collectorLocation.latitude,
        collectorLocation.longitude,
        3,
      )
      setNearestDumpingGrounds(grounds)

      setIsLoading(false)
    } catch (error) {
      console.error("After verification error:", error)
      setStep("failed")
      setVerificationMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsLoading(false)
    }
  }

  const openInMaps = (ground: DumpingGroundWithDistance) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${ground.latitude},${ground.longitude}`
    Linking.openURL(url)
  }

  const getWasteTypeColor = (wasteType: string) => {
    const colorMap: { [key: string]: string } = {
      Plastic: "#3b82f6",
      Organic: "#22c55e",
      Metal: "#eab308",
      Glass: "#8b5cf6",
      Electronic: "#ef4444",
      Paper: "#14b8a6",
      Mixed: "#6b7280",
    }
    return colorMap[wasteType] || "#6b7280"
  }

  const particles = [
    { emoji: "🌿", delay: 0, startX: SCREEN_WIDTH * 0.1 },
    { emoji: "♻️", delay: 500, startX: SCREEN_WIDTH * 0.3 },
    { emoji: "📷", delay: 1000, startX: SCREEN_WIDTH * 0.5 },
    { emoji: "✅", delay: 1500, startX: SCREEN_WIDTH * 0.7 },
    { emoji: "🌍", delay: 2000, startX: SCREEN_WIDTH * 0.9 },
    { emoji: "🗑️", delay: 2500, startX: SCREEN_WIDTH * 0.2 },
    { emoji: "🌱", delay: 3000, startX: SCREEN_WIDTH * 0.8 },
  ]

  // Verifying screens
  if (step === "verifying-before" || step === "verifying-after") {
    const isBeforeStep = step === "verifying-before"
    return (
      <Theme name="light">
        <YStack flex={1}>
          <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={StyleSheet.absoluteFillObject} />
          {particles.map((p, i) => (
            <FloatingParticle key={i} {...p} />
          ))}
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Animated.View style={[styles.loadingContainer, pulseStyle]}>
              <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.loadingGradient}>
                <Animated.View style={spinnerStyle}>
                  <Text style={styles.loadingIcon}>{isBeforeStep ? "🔍" : "🧹"}</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300)}>
              <H4 color="#166534" marginTop="$6" textAlign="center" fontWeight="bold">
                {isBeforeStep ? "Verifying Before Image..." : "Verifying After Image..."}
              </H4>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(500)}>
              <YStack backgroundColor="white" borderRadius={24} padding="$4" marginTop="$4" style={styles.cardShadow}>
                <Paragraph color="#166534" textAlign="center" fontSize={14}>
                  {isBeforeStep ? (
                    <>
                      - Checking location proximity{"\n"}- Comparing with original report{"\n"}- Validating landmarks
                      and waste match
                    </>
                  ) : (
                    <>
                      - Checking if waste is removed{"\n"}- Verifying ground is clean{"\n"}- Validating same location
                      {"\n"}- Checking image freshness
                    </>
                  )}
                </Paragraph>
              </YStack>
            </Animated.View>
          </YStack>
        </YStack>
      </Theme>
    )
  }

  // Success screen
  if (step === "success") {
    return (
      <Theme name="light">
        <YStack flex={1}>
          <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={StyleSheet.absoluteFillObject} />
          {particles.map((p, i) => (
            <FloatingParticle key={i} {...p} />
          ))}
          <ScrollView flex={1}>
            {/* Success Header */}
            <Animated.View style={headerStyle}>
              <LinearGradient colors={["#22c55e", "#16a34a", "#15803d"]} style={styles.successHeader}>
                <Animated.View style={[styles.successIconContainer, pulseStyle]}>
                  <Text style={styles.successIcon}>✅</Text>
                </Animated.View>
                <H2 color="white" fontWeight="bold" textAlign="center">
                  Verification Successful!
                </H2>
                <Paragraph color="rgba(255,255,255,0.9)" textAlign="center" marginTop="$2">
                  {verificationMessage}
                </Paragraph>
              </LinearGradient>
            </Animated.View>

            {/* Nearest Dumping Grounds */}
            <Animated.View style={contentStyle}>
              <YStack padding="$4">
                <YStack backgroundColor="white" borderRadius={24} padding="$5" style={styles.cardShadow}>
                  <XStack alignItems="center" gap="$3" marginBottom="$4">
                    <YStack
                      width={48}
                      height={48}
                      borderRadius={24}
                      backgroundColor="#dcfce7"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize={24}>🗑️</Text>
                    </YStack>
                    <YStack>
                      <H4 color="#166534" fontWeight="bold">
                        Nearest Disposal Facilities
                      </H4>
                      <Text color="#6b7280" fontSize={12}>
                        Navigate to dispose the waste properly
                      </Text>
                    </YStack>
                  </XStack>

                  {nearestDumpingGrounds.map((ground, index) => (
                    <Animated.View key={ground.id} entering={SlideInUp.delay(index * 150).springify()}>
                      <YStack
                        backgroundColor="#f0fdf4"
                        borderRadius={20}
                        padding="$4"
                        marginBottom="$3"
                        borderWidth={1}
                        borderColor="#bbf7d0"
                      >
                        <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
                          <YStack flex={1}>
                            <Text color="#166534" fontWeight="600" fontSize={16}>
                              {index + 1}. {ground.name}
                            </Text>
                            <XStack alignItems="center" marginTop="$1" gap="$1">
                              <Text fontSize={12}>📍</Text>
                              <Text color="#6b7280" fontSize={12}>
                                {ground.formattedDistance} away
                              </Text>
                            </XStack>
                          </YStack>
                          <YStack
                            backgroundColor="#dcfce7"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius={12}
                          >
                            <Text color="#166534" fontSize={10} fontWeight="600">
                              {ground.type}
                            </Text>
                          </YStack>
                        </XStack>

                        <Text color="#6b7280" fontSize={12} marginBottom="$2">
                          {ground.address}
                        </Text>

                        <XStack gap="$2" marginBottom="$2" flexWrap="wrap">
                          {ground.acceptedWaste.slice(0, 3).map((waste, i) => (
                            <YStack
                              key={i}
                              backgroundColor="white"
                              paddingHorizontal="$2"
                              paddingVertical="$1"
                              borderRadius={8}
                            >
                              <Text color="#6b7280" fontSize={10}>
                                {waste}
                              </Text>
                            </YStack>
                          ))}
                        </XStack>

                        <Text color="#6b7280" fontSize={12} marginBottom="$3">
                          ⏰ {ground.openHours}
                        </Text>

                        <Button
                          onPress={() => openInMaps(ground)}
                          backgroundColor="#22c55e"
                          color="white"
                          fontWeight="600"
                          size="$3"
                          borderRadius={16}
                          pressStyle={{ scale: 0.97, opacity: 0.9 }}
                        >
                          <XStack alignItems="center" gap="$2">
                            <Text>🗺️</Text>
                            <Text color="white" fontWeight="600">
                              Navigate
                            </Text>
                          </XStack>
                        </Button>
                      </YStack>
                    </Animated.View>
                  ))}
                </YStack>

                {/* Complete Button */}
                <Button
                  onPress={onSuccess}
                  backgroundColor="#22c55e"
                  color="white"
                  fontWeight="bold"
                  size="$5"
                  borderRadius={24}
                  marginTop="$4"
                  pressStyle={{ scale: 0.97, opacity: 0.9 }}
                  style={styles.buttonShadow}
                >
                  Complete Collection
                </Button>
              </YStack>
            </Animated.View>
          </ScrollView>
        </YStack>
      </Theme>
    )
  }

  // Failed screen
  if (step === "failed") {
    return (
      <Theme name="light">
        <YStack flex={1}>
          <LinearGradient colors={["#fef2f2", "#fecaca", "#fca5a5"]} style={StyleSheet.absoluteFillObject} />
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Animated.View style={pulseStyle}>
              <YStack
                width={120}
                height={120}
                borderRadius={60}
                backgroundColor="white"
                alignItems="center"
                justifyContent="center"
                style={styles.failedIconShadow}
              >
                <Text fontSize={60}>❌</Text>
              </YStack>
            </Animated.View>
            <H2 color="#dc2626" marginTop="$6" textAlign="center" fontWeight="bold">
              Verification Failed
            </H2>
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$4"
              marginTop="$4"
              marginHorizontal="$4"
              style={styles.cardShadow}
            >
              <Paragraph color="#6b7280" textAlign="center" fontSize={14}>
                {verificationMessage}
              </Paragraph>
            </YStack>
            <YStack gap="$3" marginTop="$6" width="100%" paddingHorizontal="$4">
              <Button
                onPress={() => {
                  if (beforeImageUri && !afterImageUri) {
                    setStep("capture-after")
                    setAfterImageUri(null)
                  } else {
                    setStep("capture-before")
                    setBeforeImageUri(null)
                    clearBeforeImage()
                  }
                }}
                backgroundColor="#22c55e"
                color="white"
                fontWeight="bold"
                borderRadius={24}
                size="$5"
                pressStyle={{ scale: 0.97, opacity: 0.9 }}
              >
                Try Again
              </Button>
              <Button
                onPress={async () => {
                  await clearBeforeImage()
                  onCancel()
                }}
                backgroundColor="white"
                color="#6b7280"
                fontWeight="600"
                borderRadius={24}
                size="$5"
                borderWidth={1}
                borderColor="#e5e7eb"
                pressStyle={{ scale: 0.97, opacity: 0.9 }}
              >
                Cancel
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </Theme>
    )
  }

  // Capture screens (before or after)
  const isBeforeStep = step === "capture-before"
  const currentImageUri = isBeforeStep ? beforeImageUri : afterImageUri
  const stepTitle = isBeforeStep ? "Step 1: Before Collection" : "Step 2: After Collection"
  const stepDescription = isBeforeStep
    ? "Capture the waste BEFORE you start collecting"
    : "Capture the area AFTER collection (clean ground)"

  return (
    <Theme name="light">
      <YStack flex={1}>
        <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={StyleSheet.absoluteFillObject} />
        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}

        <ScrollView flex={1}>
          {/* Header */}
          <Animated.View style={headerStyle}>
            <LinearGradient colors={["#22c55e", "#16a34a", "#15803d"]} style={styles.header}>
              <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Text style={styles.logoText}>{isBeforeStep ? "📷" : "✅"}</Text>
              </Animated.View>
              <H2 color="white" fontWeight="bold" textAlign="center">
                {stepTitle}
              </H2>
              <Paragraph color="rgba(255,255,255,0.9)" textAlign="center" marginTop="$1">
                {stepDescription}
              </Paragraph>
              {!isBeforeStep && (
                <YStack backgroundColor="rgba(255,255,255,0.2)" padding="$3" borderRadius={16} marginTop="$3">
                  <Text color="white" fontWeight="600" fontSize={14} textAlign="center">
                    ✅ Before image verified! Now show the clean area.
                  </Text>
                </YStack>
              )}
            </LinearGradient>
          </Animated.View>

          <Animated.View style={contentStyle}>
            <YStack padding="$4" gap="$4">
              {/* Original Report Card */}
              <Animated.View entering={SlideInUp.delay(100).springify()}>
                <YStack backgroundColor="white" borderRadius={24} padding="$5" style={styles.cardShadow}>
                  <XStack alignItems="center" gap="$3" marginBottom="$4">
                    <YStack
                      width={48}
                      height={48}
                      borderRadius={24}
                      backgroundColor="#dcfce7"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize={24}>📋</Text>
                    </YStack>
                    <H4 color="#166534" fontWeight="bold">
                      Original Report
                    </H4>
                  </XStack>
                  <Image
                    source={{ uri: report.imageUrl }}
                    width="100%"
                    height={200}
                    borderRadius={16}
                    marginBottom="$4"
                  />
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack flex={1}>
                      <Text color="#6b7280" fontSize={12} marginBottom="$1">
                        Waste Type
                      </Text>
                      <Text color={getWasteTypeColor(report.aiAnalysis.wasteType)} fontWeight="bold" fontSize={18}>
                        {report.aiAnalysis.wasteType}
                      </Text>
                    </YStack>
                    <YStack flex={1} alignItems="flex-end">
                      <Text color="#6b7280" fontSize={12} marginBottom="$1">
                        Category
                      </Text>
                      <Text color="#166534" fontWeight="bold" fontSize={18}>
                        {report.aiAnalysis.category}
                      </Text>
                    </YStack>
                  </XStack>
                  {report.aiAnalysis.estimatedWeightKg && (
                    <XStack marginTop="$3" alignItems="center" gap="$2">
                      <Text fontSize={14}>⚖️</Text>
                      <Text color="#6b7280" fontSize={14}>
                        Est. Weight:{" "}
                        <Text fontWeight="bold" color="#166534">
                          {report.aiAnalysis.estimatedWeightKg} kg
                        </Text>
                      </Text>
                    </XStack>
                  )}
                  {report.city && (
                    <XStack marginTop="$2" alignItems="center" gap="$2">
                      <Text fontSize={14}>📍</Text>
                      <Text color="#6b7280" fontSize={14}>
                        {report.city}, {report.state}
                      </Text>
                    </XStack>
                  )}
                </YStack>
              </Animated.View>

              {/* Before Image (shown in after step) */}
              {!isBeforeStep && beforeImageUri && (
                <Animated.View entering={SlideInUp.delay(200).springify()}>
                  <YStack backgroundColor="white" borderRadius={24} padding="$5" style={styles.cardShadow}>
                    <XStack alignItems="center" gap="$3" marginBottom="$4">
                      <YStack
                        width={48}
                        height={48}
                        borderRadius={24}
                        backgroundColor="#dcfce7"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize={24}>✅</Text>
                      </YStack>
                      <H4 color="#166534" fontWeight="bold">
                        Your Before Image
                      </H4>
                    </XStack>
                    <Image source={{ uri: beforeImageUri }} width="100%" height={200} borderRadius={16} />
                  </YStack>
                </Animated.View>
              )}

              {/* Capture Image Card */}
              <Animated.View entering={SlideInUp.delay(300).springify()}>
                <YStack backgroundColor="white" borderRadius={24} padding="$5" style={styles.cardShadow}>
                  <XStack alignItems="center" gap="$3" marginBottom="$4">
                    <YStack
                      width={48}
                      height={48}
                      borderRadius={24}
                      backgroundColor="#dcfce7"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize={24}>📸</Text>
                    </YStack>
                    <H4 color="#166534" fontWeight="bold">
                      {isBeforeStep ? "Before Collection Image" : "After Collection Image"}
                    </H4>
                  </XStack>

                  {currentImageUri ? (
                    <>
                      <Image
                        source={{ uri: currentImageUri }}
                        width="100%"
                        height={200}
                        borderRadius={16}
                        marginBottom="$4"
                      />
                      <Button
                        onPress={() => (isBeforeStep ? setBeforeImageUri(null) : setAfterImageUri(null))}
                        backgroundColor="#f3f4f6"
                        color="#6b7280"
                        fontWeight="600"
                        borderRadius={16}
                        pressStyle={{ scale: 0.97, opacity: 0.9 }}
                      >
                        Retake Image
                      </Button>
                    </>
                  ) : (
                    <YStack gap="$3">
                      <Button
                        onPress={() => pickImage(isBeforeStep)}
                        backgroundColor="#22c55e"
                        color="white"
                        fontWeight="bold"
                        borderRadius={16}
                        size="$4"
                        pressStyle={{ scale: 0.97, opacity: 0.9 }}
                      >
                        <XStack alignItems="center" gap="$2">
                          <Text fontSize={18}>📷</Text>
                          <Text color="white" fontWeight="bold">
                            Take Photo
                          </Text>
                        </XStack>
                      </Button>
                      <Button
                        onPress={() => pickFromGallery(isBeforeStep)}
                        backgroundColor="#6b7280"
                        color="white"
                        fontWeight="600"
                        borderRadius={16}
                        size="$4"
                        pressStyle={{ scale: 0.97, opacity: 0.9 }}
                      >
                        <XStack alignItems="center" gap="$2">
                          <Text fontSize={18}>🖼️</Text>
                          <Text color="white" fontWeight="600">
                            Choose from Gallery
                          </Text>
                        </XStack>
                      </Button>
                    </YStack>
                  )}
                </YStack>
              </Animated.View>

              {/* Info Box */}
              <Animated.View entering={SlideInUp.delay(400).springify()}>
                <YStack
                  backgroundColor="#dcfce7"
                  borderRadius={24}
                  padding="$4"
                  borderLeftWidth={4}
                  borderLeftColor="#22c55e"
                >
                  <XStack alignItems="center" gap="$2" marginBottom="$2">
                    <Text fontSize={16}>ℹ️</Text>
                    <H4 color="#166534" fontWeight="bold" fontSize={14}>
                      {isBeforeStep ? "Before Image Requirements" : "After Image Requirements"}
                    </H4>
                  </XStack>
                  <Paragraph color="#166534" fontSize={12}>
                    {isBeforeStep ? (
                      <>
                        - Must be within 500m of location{"\n"}- Image must match original report{"\n"}- Landmarks and
                        waste must be visible{"\n"}- AI confidence must be 60% or higher
                      </>
                    ) : (
                      <>
                        - Waste must be completely removed{"\n"}- Ground must be clean{"\n"}- Landmarks must match
                        before image{"\n"}- Image must be fresh (not reused){"\n"}- AI confidence must be 60% or higher
                      </>
                    )}
                  </Paragraph>
                </YStack>
              </Animated.View>

              {/* Action Buttons */}
              <YStack gap="$3" marginTop="$2">
                <Button
                  onPress={isBeforeStep ? handleVerifyBefore : handleVerifyAfter}
                  backgroundColor="#22c55e"
                  color="white"
                  fontWeight="bold"
                  disabled={!currentImageUri || isLoading}
                  opacity={!currentImageUri || isLoading ? 0.5 : 1}
                  size="$5"
                  borderRadius={24}
                  pressStyle={{ scale: 0.97, opacity: 0.9 }}
                  style={styles.buttonShadow}
                >
                  {isLoading
                    ? "Verifying..."
                    : isBeforeStep
                      ? "Verify Before Image with AI"
                      : "Verify After Image & Complete"}
                </Button>
                <Button
                  onPress={async () => {
                    await clearBeforeImage()
                    onCancel()
                  }}
                  backgroundColor="white"
                  color="#6b7280"
                  fontWeight="600"
                  borderRadius={24}
                  size="$4"
                  borderWidth={1}
                  borderColor="#e5e7eb"
                  pressStyle={{ scale: 0.97, opacity: 0.9 }}
                >
                  Cancel
                </Button>
              </YStack>
            </YStack>
          </Animated.View>
        </ScrollView>
      </YStack>
    </Theme>
  )
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    zIndex: 1,
  },
  particleText: {
    fontSize: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
  },
  successHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 50,
  },
  loadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  loadingGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingIcon: {
    fontSize: 50,
  },
  cardShadow: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonShadow: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  failedIconShadow: {
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
})
