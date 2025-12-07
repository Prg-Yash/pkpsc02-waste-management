"use client"

import * as React from "react"
import { useUser } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { ScrollView, YStack, XStack, Text, Button, Spinner } from "tamagui"
import { Alert, Image as RNImage, Animated, Easing, Dimensions } from "react-native"
import { analyzeWasteImage, type WasteAnalysis, type LargeWasteAnalysis } from "@/services/geminiService"
import { submitWasteReport } from "@/services/s3Service"
import { saveWasteReport } from "@/services/storageService"
import { reverseGeocode, type LocationData } from "@/services/locationService"
import { fetchUserProfile, isProfileComplete, getProfileCompletionMessage } from "../services/userService"
import { validateUserLocation } from "../utils/locationValidation"

type ScreenState = "picker" | "analyzing" | "result" | "submitting" | "success"

const { width, height } = Dimensions.get("window")
const NUM_PARTICLES = 12

const FloatingParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = React.useRef(new Animated.Value(height + 50)).current
  const translateX = React.useRef(new Animated.Value(0)).current
  const rotate = React.useRef(new Animated.Value(0)).current
  const opacity = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const animate = () => {
      translateY.setValue(height + 50)
      translateX.setValue(0)
      rotate.setValue(0)
      opacity.setValue(0)

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 8000 + Math.random() * 4000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 5000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateX, {
          toValue: Math.sin(delay) * 40,
          duration: 8000 + Math.random() * 4000,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 8000 + Math.random() * 4000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
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
      <Text style={{ fontSize: 16 + Math.random() * 10, color: "#22c55e" }}>
        {["♻️", "🌿", "🍃", "✦", "●"][Math.floor(Math.random() * 5)]}
      </Text>
    </Animated.View>
  )
}

export default function ReportWasteScreen() {
  const { user } = useUser()
  const router = useRouter()

  const [state, setState] = React.useState<ScreenState>("picker")
  const [imageUri, setImageUri] = React.useState<string | null>(null)
  const [s3ImageUrl, setS3ImageUrl] = React.useState<string | null>(null)
  const [s3ReportId, setS3ReportId] = React.useState<string | null>(null)
  const [analysis, setAnalysis] = React.useState<WasteAnalysis | null>(null)
  const [error, setError] = React.useState<string>("")

  const [editedWasteType, setEditedWasteType] = React.useState<string>("")
  const [editedSegregation, setEditedSegregation] = React.useState<Array<{ label: string; count: number }>>([])

  const [location, setLocation] = React.useState<LocationData>({
    latitude: 0,
    longitude: 0,
  })
  const [loadingLocation, setLoadingLocation] = React.useState(false)

  // Animation refs
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(50)).current
  const headerSlide = React.useRef(new Animated.Value(-100)).current
  const headerOpacity = React.useRef(new Animated.Value(0)).current
  const logoSpin = React.useRef(new Animated.Value(0)).current
  const pulseAnim = React.useRef(new Animated.Value(1)).current
  const buttonScale = React.useRef(new Animated.Value(1)).current
  const successScale = React.useRef(new Animated.Value(0)).current
  const statsSlide = React.useRef(new Animated.Value(50)).current
  const statsOpacity = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    // Header animation
    Animated.parallel([
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Content fade in and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    // Logo spin entrance
    Animated.timing(logoSpin, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start()

    // Continuous pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Stats card animation
    Animated.parallel([
      Animated.spring(statsSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  React.useEffect(() => {
    if (state === "success") {
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }).start()
    } else {
      successScale.setValue(0)
    }
  }, [state])

  const spin = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  React.useEffect(() => {
    ;(async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync()

      if (cameraStatus !== "granted" || mediaStatus !== "granted" || locationStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Please grant camera, media library, and location permissions to report waste.",
        )
      }
    })()
  }, [])

  const pickImageFromCamera = async () => {
    if (user) {
      try {
        const profile = await fetchUserProfile(user.id)
        if (!isProfileComplete(profile)) {
          Alert.alert(
            "Profile Incomplete",
            getProfileCompletionMessage(profile) +
              "\n\nPlease go to the Profile tab to complete your information before reporting waste.",
            [{ text: "OK", onPress: () => router.push("/(tabs)/profile") }],
          )
          return
        }
      } catch (error) {
        console.error("Error checking profile:", error)
        Alert.alert("Error", "Failed to verify profile. Please try again.")
        return
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri)
      }
    } catch (error) {
      setError("Failed to capture image")
    }
  }

  const pickImageFromGallery = async () => {
    if (user) {
      try {
        const profile = await fetchUserProfile(user.id)
        if (!isProfileComplete(profile)) {
          Alert.alert(
            "Profile Incomplete",
            getProfileCompletionMessage(profile) +
              "\n\nPlease go to the Profile tab to complete your information before reporting waste.",
            [{ text: "OK", onPress: () => router.push("/(tabs)/profile") }],
          )
          return
        }
      } catch (error) {
        console.error("Error checking profile:", error)
        Alert.alert("Error", "Failed to verify profile. Please try again.")
        return
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri)
      }
    } catch (error) {
      setError("Failed to select image")
    }
  }

  const handleImageSelected = async (uri: string) => {
    setImageUri(uri)
    setError("")

    setLoadingLocation(true)
    try {
      const loc = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = loc.coords

      if (user) {
        try {
          const profile = await fetchUserProfile(user.id)
          if (profile.state && profile.country) {
            const validation = validateUserLocation(profile.state, profile.country, latitude, longitude)

            if (!validation.isValid && validation.message) {
              setLoadingLocation(false)
              Alert.alert("Location Mismatch", validation.message, [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => {
                    setImageUri(null)
                    setState("picker")
                  },
                },
                {
                  text: "Update Profile",
                  onPress: () => router.push("/(tabs)/profile"),
                },
              ])
              return
            }
          }
        } catch (error) {
          console.error("Error validating location:", error)
        }
      }

      const geocoded = await reverseGeocode(latitude, longitude)

      setLocation({
        latitude,
        longitude,
        address: geocoded.address,
        city: geocoded.city,
        state: geocoded.state,
        country: geocoded.country,
      })

      console.log("Location:", {
        city: geocoded.city,
        state: geocoded.state,
        address: geocoded.address,
      })
    } catch (err) {
      console.log("Location not available", err)
      setLocation({
        latitude: 0,
        longitude: 0,
        city: "Unknown",
        state: "Unknown",
        country: "India",
      })
    } finally {
      setLoadingLocation(false)
    }
  }

  const analyzeImage = async () => {
    if (!imageUri || !user) return

    setState("analyzing")
    setError("")

    try {
      const result = await analyzeWasteImage(imageUri)
      setAnalysis(result)

      setEditedWasteType(result.wasteType)
      if (result.category === "small") {
        setEditedSegregation([...result.segregation])
      }

      setState("result")
    } catch (err: any) {
      setError(err.message || "Analysis failed")
      setState("picker")
    }
  }

  const handleVerifyAndReport = async () => {
    if (!analysis || !imageUri || !user) return

    setState("submitting")

    try {
      const finalAnalysis: WasteAnalysis = {
        ...analysis,
        wasteType: editedWasteType as any,
        ...(analysis.category === "small" ? { segregation: editedSegregation } : {}),
      } as WasteAnalysis

      const result = await submitWasteReport({
        imageUri,
        userId: user.id,
        analysis: finalAnalysis,
        location,
      })

      await saveWasteReport({
        userId: user.id,
        imageUrl: result.imageUrl,
        s3ReportId: result.reportId,
        analysis: finalAnalysis,
        location,
      })

      setS3ImageUrl(result.imageUrl)
      setS3ReportId(result.reportId)

      setState("success")

      setTimeout(() => {
        resetForm()
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save report")
      setState("result")
    }
  }

  const resetForm = () => {
    setImageUri(null)
    setS3ImageUrl(null)
    setS3ReportId(null)
    setAnalysis(null)
    setEditedWasteType("")
    setEditedSegregation([])
    setLocation({
      latitude: 0,
      longitude: 0,
    })
    setLoadingLocation(false)
    setError("")
    setState("picker")
  }

  const updateSegregationItem = (index: number, field: "label" | "count", value: string | number) => {
    const updated = [...editedSegregation]
    if (field === "label") {
      updated[index].label = value as string
    } else {
      updated[index].count = Number(value)
    }
    setEditedSegregation(updated)
  }

  const addSegregationItem = () => {
    setEditedSegregation([...editedSegregation, { label: "", count: 1 }])
  }

  const removeSegregationItem = (index: number) => {
    setEditedSegregation(editedSegregation.filter((_, i) => i !== index))
  }

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  // Render picker state
  if (state === "picker") {
    return (
      <YStack flex={1} backgroundColor="#f0fdf4">
        {/* Gradient Background */}
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            background: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)",
          }}
        />

        {/* Floating Particles */}
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 600} startX={Math.random() * width} />
        ))}

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              transform: [{ translateY: headerSlide }],
              opacity: headerOpacity,
              paddingTop: 60,
              paddingBottom: 20,
              alignItems: "center",
            }}
          >
            {/* Logo with glow */}
            <YStack alignItems="center" marginBottom={8}>
              <YStack
                position="absolute"
                width={80}
                height={80}
                borderRadius={40}
                backgroundColor="#22c55e"
                opacity={0.2}
                style={{ filter: "blur(20px)" }}
              />
              <Animated.View
                style={{
                  transform: [{ rotate: spin }, { scale: pulseAnim }],
                }}
              >
                <Text style={{ fontSize: 56 }}>♻️</Text>
              </Animated.View>
            </YStack>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#15803d",
                marginTop: 8,
              }}
            >
              Report Waste
            </Text>
            <Text style={{ fontSize: 14, color: "#16a34a", marginTop: 4 }}>Help keep our planet clean</Text>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: statsSlide }],
              opacity: statsOpacity,
              marginHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding={20}
              gap={16}
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {error ? (
                <YStack backgroundColor="#fef2f2" padding={12} borderRadius={16} borderWidth={1} borderColor="#fecaca">
                  <Text color="#dc2626">{error}</Text>
                </YStack>
              ) : null}

              {imageUri ? (
                <YStack borderRadius={20} overflow="hidden">
                  <RNImage source={{ uri: imageUri }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
                </YStack>
              ) : (
                <YStack
                  backgroundColor="#f0fdf4"
                  padding={32}
                  borderRadius={20}
                  borderWidth={2}
                  borderColor="#86efac"
                  borderStyle="dashed"
                  alignItems="center"
                  gap={12}
                >
                  <YStack
                    width={60}
                    height={60}
                    borderRadius={30}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={30}>📸</Text>
                  </YStack>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#15803d" }}>No image selected</Text>
                  <Text style={{ fontSize: 14, color: "#16a34a", textAlign: "center" }}>
                    Capture or upload an image of waste
                  </Text>
                </YStack>
              )}

              <XStack gap={12}>
                <Animated.View style={{ flex: 1, transform: [{ scale: buttonScale }] }}>
                  <Button
                    flex={1}
                    height="$5"
                    backgroundColor="#3b82f6"
                    onPress={pickImageFromCamera}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    borderRadius={16}
                    shadowColor="#3b82f6"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.3}
                    shadowRadius={8}
                    pressStyle={{ scale: 0.95 }}
                  >
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={18}>📷</Text>
                      <Text color="white" fontWeight="bold">
                        Camera
                      </Text>
                    </XStack>
                  </Button>
                </Animated.View>
                <Animated.View style={{ flex: 1, transform: [{ scale: buttonScale }] }}>
                  <Button
                    flex={1}
                    height="$5"
                    backgroundColor="#8b5cf6"
                    onPress={pickImageFromGallery}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    borderRadius={16}
                    shadowColor="#8b5cf6"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.3}
                    shadowRadius={8}
                    pressStyle={{ scale: 0.95 }}
                  >
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={18}>🖼️</Text>
                      <Text color="white" fontWeight="bold">
                        Gallery
                      </Text>
                    </XStack>
                  </Button>
                </Animated.View>
              </XStack>

              {imageUri && (
                <>
                  {loadingLocation ? (
                    <YStack backgroundColor="#f0fdf4" padding={16} borderRadius={16} alignItems="center">
                      <XStack gap={12} alignItems="center">
                        <Spinner size="small" color="#22c55e" />
                        <Text color="#6b7280">Getting location...</Text>
                      </XStack>
                    </YStack>
                  ) : location.city && location.city !== "Unknown" ? (
                    <YStack backgroundColor="#f0fdf4" padding={16} borderRadius={16} gap={8}>
                      <XStack alignItems="center" gap={8}>
                        <YStack
                          width={36}
                          height={36}
                          borderRadius={18}
                          backgroundColor="#dcfce7"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize={16}>📍</Text>
                        </YStack>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#15803d" }}>Location Detected</Text>
                      </XStack>
                      <Text style={{ fontSize: 13, color: "#6b7280", marginLeft: 44 }}>
                        {location.city}, {location.state}
                      </Text>
                    </YStack>
                  ) : null}

                  <Button
                    backgroundColor="#22c55e"
                    height="$5"
                    borderRadius={16}
                    onPress={analyzeImage}
                    shadowColor="#22c55e"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.3}
                    shadowRadius={8}
                    pressStyle={{ scale: 0.95 }}
                  >
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={18}>🔍</Text>
                      <Text color="white" fontWeight="bold" fontSize="$4">
                        Analyze Image
                      </Text>
                    </XStack>
                  </Button>
                </>
              )}
            </YStack>
          </Animated.View>

          {/* Tips Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginHorizontal: 20,
              marginBottom: 40,
            }}
          >
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding={20}
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <XStack alignItems="center" gap={8} marginBottom={12}>
                <YStack
                  width={36}
                  height={36}
                  borderRadius={18}
                  backgroundColor="#fef3c7"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={16}>💡</Text>
                </YStack>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>Tips for Better Reports</Text>
              </XStack>
              <YStack gap={8}>
                <XStack alignItems="center" gap={8}>
                  <Text style={{ color: "#22c55e" }}>•</Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", flex: 1 }}>
                    Take clear, well-lit photos of the waste
                  </Text>
                </XStack>
                <XStack alignItems="center" gap={8}>
                  <Text style={{ color: "#22c55e" }}>•</Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", flex: 1 }}>Include the full pile in the frame</Text>
                </XStack>
                <XStack alignItems="center" gap={8}>
                  <Text style={{ color: "#22c55e" }}>•</Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", flex: 1 }}>Enable location for accurate mapping</Text>
                </XStack>
              </YStack>
            </YStack>
          </Animated.View>
        </ScrollView>
      </YStack>
    )
  }

  // Render analyzing state
  if (state === "analyzing") {
    return (
      <YStack flex={1} backgroundColor="#f0fdf4">
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            background: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)",
          }}
        />
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 600} startX={Math.random() * width} />
        ))}
        <YStack flex={1} alignItems="center" justifyContent="center" padding={20}>
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding={40}
            alignItems="center"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <YStack
                width={80}
                height={80}
                borderRadius={40}
                backgroundColor="#dcfce7"
                alignItems="center"
                justifyContent="center"
                marginBottom={20}
              >
                <Text style={{ fontSize: 40 }}>🔍</Text>
              </YStack>
            </Animated.View>
            <Spinner size="large" color="#22c55e" />
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#15803d", marginTop: 20 }}>Analyzing Image</Text>
            <Text style={{ fontSize: 14, color: "#16a34a", marginTop: 8, textAlign: "center" }}>
              Our AI is identifying the waste type...
            </Text>
          </YStack>
        </YStack>
      </YStack>
    )
  }

  // Render submitting state
  if (state === "submitting") {
    return (
      <YStack flex={1} backgroundColor="#f0fdf4">
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            background: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)",
          }}
        />
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 600} startX={Math.random() * width} />
        ))}
        <YStack flex={1} alignItems="center" justifyContent="center" padding={20}>
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding={40}
            alignItems="center"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <YStack
                width={80}
                height={80}
                borderRadius={40}
                backgroundColor="#dcfce7"
                alignItems="center"
                justifyContent="center"
                marginBottom={20}
              >
                <Text style={{ fontSize: 40 }}>📤</Text>
              </YStack>
            </Animated.View>
            <Spinner size="large" color="#22c55e" />
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#15803d", marginTop: 20 }}>Submitting Report</Text>
            <Text style={{ fontSize: 14, color: "#16a34a", marginTop: 8, textAlign: "center" }}>
              Uploading your report...
            </Text>
          </YStack>
        </YStack>
      </YStack>
    )
  }

  // Render success state
  if (state === "success") {
    return (
      <YStack flex={1} backgroundColor="#f0fdf4">
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            background: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)",
          }}
        />
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 600} startX={Math.random() * width} />
        ))}
        <YStack flex={1} alignItems="center" justifyContent="center" padding={20}>
          <Animated.View style={{ transform: [{ scale: successScale }] }}>
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding={40}
              alignItems="center"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <YStack
                width={80}
                height={80}
                borderRadius={40}
                backgroundColor="#dcfce7"
                alignItems="center"
                justifyContent="center"
                marginBottom={20}
              >
                <Text style={{ fontSize: 40 }}>✅</Text>
              </YStack>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "#15803d" }}>Report Submitted!</Text>
              <Text style={{ fontSize: 14, color: "#16a34a", marginTop: 8, textAlign: "center" }}>
                Thank you for helping keep our planet clean
              </Text>
              <YStack
                backgroundColor="#dcfce7"
                paddingHorizontal={16}
                paddingVertical={8}
                borderRadius={16}
                marginTop={16}
              >
                <Text style={{ color: "#15803d", fontWeight: "600" }}>+10 Points Earned!</Text>
              </YStack>
            </YStack>
          </Animated.View>
        </YStack>
      </YStack>
    )
  }

  // Render result state
  return (
    <YStack flex={1} backgroundColor="#f0fdf4">
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)",
        }}
      />
      {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
        <FloatingParticle key={i} delay={i * 600} startX={Math.random() * width} />
      ))}

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          style={{
            transform: [{ translateY: headerSlide }],
            opacity: headerOpacity,
            paddingTop: 60,
            paddingBottom: 20,
            alignItems: "center",
          }}
        >
          <YStack alignItems="center" marginBottom={8}>
            <YStack
              position="absolute"
              width={80}
              height={80}
              borderRadius={40}
              backgroundColor="#22c55e"
              opacity={0.2}
              style={{ filter: "blur(20px)" }}
            />
            <Animated.View
              style={{
                transform: [{ rotate: spin }, { scale: pulseAnim }],
              }}
            >
              <Text style={{ fontSize: 56 }}>♻️</Text>
            </Animated.View>
          </YStack>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#15803d",
              marginTop: 8,
            }}
          >
            Analysis Result
          </Text>
          <Text style={{ fontSize: 14, color: "#16a34a", marginTop: 4 }}>Review and confirm your report</Text>
        </Animated.View>

        {/* Results Card */}
        <YStack paddingHorizontal={20} gap={16} paddingBottom={40}>
          {/* Image Preview */}
          {imageUri && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              overflow="hidden"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <RNImage source={{ uri: imageUri }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
            </YStack>
          )}

          {/* Analysis Details */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding={20}
            gap={16}
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <XStack alignItems="center" gap={8}>
              <YStack
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor="#dcfce7"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={16}>📊</Text>
              </YStack>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>Analysis Details</Text>
            </XStack>

            {analysis && (
              <YStack gap={12}>
                <YStack gap={8}>
                  <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>Waste Type</Text>
                  <YStack backgroundColor="#f0fdf4" padding={12} borderRadius={12}>
                    <Text style={{ fontSize: 15, color: "#15803d", fontWeight: "600" }}>{editedWasteType}</Text>
                  </YStack>
                </YStack>

                <YStack gap={8}>
                  <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>Category</Text>
                  <YStack backgroundColor="#f0fdf4" padding={12} borderRadius={12}>
                    <Text style={{ fontSize: 15, color: "#15803d", fontWeight: "600" }}>
                      {analysis.category === "small" ? "Small Waste" : "Large Waste"}
                    </Text>
                  </YStack>
                </YStack>

                {analysis.category === "large" && (
                  <YStack gap={8}>
                    <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>Urgency</Text>
                    <YStack
                      backgroundColor={(analysis as LargeWasteAnalysis).urgency === "high" ? "#fef2f2" : "#f0fdf4"}
                      padding={12}
                      borderRadius={12}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          color: (analysis as LargeWasteAnalysis).urgency === "high" ? "#dc2626" : "#15803d",
                          fontWeight: "600",
                        }}
                      >
                        {(analysis as LargeWasteAnalysis).urgency.toUpperCase()}
                      </Text>
                    </YStack>
                  </YStack>
                )}

                {analysis.category === "small" && editedSegregation.length > 0 && (
                  <YStack gap={8}>
                    <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>Items Found</Text>
                    <YStack gap={8}>
                      {editedSegregation.map((item, index) => (
                        <XStack
                          key={index}
                          backgroundColor="#f0fdf4"
                          padding={12}
                          borderRadius={12}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text style={{ fontSize: 14, color: "#15803d" }}>{item.label}</Text>
                          <YStack backgroundColor="#dcfce7" paddingHorizontal={10} paddingVertical={4} borderRadius={8}>
                            <Text style={{ fontSize: 13, color: "#15803d", fontWeight: "600" }}>{item.count}</Text>
                          </YStack>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>

          {/* Location Card */}
          {location.city && location.city !== "Unknown" && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding={20}
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <XStack alignItems="center" gap={8}>
                <YStack
                  width={36}
                  height={36}
                  borderRadius={18}
                  backgroundColor="#dbeafe"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={16}>📍</Text>
                </YStack>
                <YStack flex={1}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1f2937" }}>Location</Text>
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>
                    {location.city}, {location.state}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          )}

          {/* Action Buttons */}
          <XStack gap={12}>
            <Button
              flex={1}
              height="$5"
              backgroundColor="#f3f4f6"
              borderRadius={16}
              onPress={resetForm}
              pressStyle={{ scale: 0.95 }}
            >
              <Text color="#6b7280" fontWeight="bold">
                Cancel
              </Text>
            </Button>
            <Button
              flex={1}
              height="$5"
              backgroundColor="#22c55e"
              borderRadius={16}
              onPress={handleVerifyAndReport}
              shadowColor="#22c55e"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.3}
              shadowRadius={8}
              pressStyle={{ scale: 0.95 }}
            >
              <XStack alignItems="center" gap="$2">
                <Text fontSize={16}>✓</Text>
                <Text color="white" fontWeight="bold">
                  Submit Report
                </Text>
              </XStack>
            </Button>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
