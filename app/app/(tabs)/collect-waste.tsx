"use client"

import { useUser } from "@clerk/clerk-expo"
import * as Location from "expo-location"
import { router } from "expo-router"
import React, { useEffect, useRef } from "react"
import { Alert, Animated, Dimensions, Easing, RefreshControl } from "react-native"
import { Button, Image, ScrollView, Spinner, Text, Theme, XStack, YStack } from "tamagui"
import CollectorVerificationScreen from "../components/CollectorVerificationScreen"
import { addToRoutePlanner } from "../services/routePlannerService"
import {
  canCollectWaste,
  fetchUserProfile,
  getProfileCompletionMessage,
  isProfileComplete,
} from "../services/userService"
import { fetchPendingReports, type PendingWasteReport } from "../services/wasteCollectionService"
import { formatDistance, getDistanceToReport, sortByDistance } from "../utils/locationUtils"
import { validateUserLocation } from "../utils/locationValidation"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const PARTICLE_COUNT = 12

// Floating particle component
const FloatingParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 50)).current
  const translateX = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT + 50)
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

export default function CollectWasteScreen() {
  const { user } = useUser()
  const [reports, setReports] = React.useState<PendingWasteReport[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [selectedReport, setSelectedReport] = React.useState<PendingWasteReport | null>(null)
  const [stats, setStats] = React.useState({
    collectedToday: 0,
    pointsEarned: 0,
  })

  // Animation refs
  const headerSlide = useRef(new Animated.Value(-100)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const logoSpin = useRef(new Animated.Value(0)).current
  const logoPulse = useRef(new Animated.Value(1)).current
  const statsSlide = useRef(new Animated.Value(50)).current
  const statsOpacity = useRef(new Animated.Value(0)).current
  const tipsSlide = useRef(new Animated.Value(100)).current
  const tipsOpacity = useRef(new Animated.Value(0)).current
  const cardAnimations = useRef<Animated.Value[]>([]).current

  // Animated counters for stats
  const [animatedCollected, setAnimatedCollected] = React.useState(0)
  const [animatedPoints, setAnimatedPoints] = React.useState(0)

  useEffect(() => {
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

    // Logo spin animation
    Animated.timing(logoSpin, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start()

    // Logo pulse animation (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
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

    // Tips animation
    Animated.parallel([
      Animated.spring(tipsSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(tipsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Animate stats counters
  useEffect(() => {
    const duration = 1000
    const steps = 30
    const collectedStep = stats.collectedToday / steps
    const pointsStep = stats.pointsEarned / steps
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      setAnimatedCollected(Math.round(collectedStep * currentStep))
      setAnimatedPoints(Math.round(pointsStep * currentStep))
      if (currentStep >= steps) {
        clearInterval(interval)
        setAnimatedCollected(stats.collectedToday)
        setAnimatedPoints(stats.pointsEarned)
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [stats])

  // Animate cards when reports load
  useEffect(() => {
    if (reports.length > 0) {
      // Initialize card animations
      while (cardAnimations.length < reports.length) {
        cardAnimations.push(new Animated.Value(0))
      }

      // Stagger card animations
      reports.forEach((_, index) => {
        if (cardAnimations[index]) {
          Animated.spring(cardAnimations[index], {
            toValue: 1,
            tension: 50,
            friction: 8,
            delay: index * 100,
            useNativeDriver: true,
          }).start()
        }
      })
    }
  }, [reports])

  // Fetch user location on mount
  useEffect(() => {
    getUserLocation()
  }, [])

  // Fetch reports on mount
  useEffect(() => {
    if (user) {
      loadReports()
    }
  }, [user])

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.log("Location permission denied")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
    } catch (error) {
      console.error("Error getting location:", error)
    }
  }

  const loadReports = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const pendingReports = await fetchPendingReports(user.id)

      if (userLocation) {
        const sorted = sortByDistance(pendingReports, userLocation.latitude, userLocation.longitude)
        setReports(sorted)
      } else {
        setReports(pendingReports)
      }

      console.log(`Loaded ${pendingReports.length} pending reports`)
    } catch (error) {
      console.error("Error loading reports:", error)
      Alert.alert("Error", "Failed to load waste reports. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await getUserLocation()
    await loadReports()
    setRefreshing(false)
  }

  const handleCollect = async (report: PendingWasteReport) => {
    if (!user) return

    try {
      const profile = await fetchUserProfile(user.id)

      if (!isProfileComplete(profile)) {
        Alert.alert(
          "Profile Incomplete",
          getProfileCompletionMessage(profile) +
            "\n\nPlease go to the Profile tab to complete your information before collecting waste.",
          [
            {
              text: "Go to Profile",
              onPress: () => router.push("/(tabs)/profile"),
            },
          ],
        )
        return
      }

      if (!canCollectWaste(profile)) {
        Alert.alert(
          "Collector Mode Disabled",
          "You must enable Collector Mode in your profile to collect waste.\n\nGo to Profile → Enable Collector Mode",
          [
            {
              text: "Go to Profile",
              onPress: () => router.push("/(tabs)/profile"),
            },
          ],
        )
        return
      }

      if (userLocation && profile.state && profile.country) {
        const validation = validateUserLocation(
          profile.state,
          profile.country,
          userLocation.latitude,
          userLocation.longitude,
        )

        if (!validation.isValid && validation.message) {
          Alert.alert("Location Mismatch", validation.message, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Update Profile",
              onPress: () => router.push("/(tabs)/profile"),
            },
          ])
          return
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error)
      Alert.alert("Error", "Failed to verify profile. Please try again.")
      return
    }

    setSelectedReport(report)
  }

  const handleVerificationSuccess = () => {
    setSelectedReport(null)
    loadReports()
    setStats({
      collectedToday: stats.collectedToday + 1,
      pointsEarned: stats.pointsEarned + 20,
    })
    Alert.alert("Success!", "Collection verified successfully. Navigate to dumping grounds to complete the process.")
  }

  const handleVerificationCancel = () => {
    setSelectedReport(null)
  }

  const handleAddToRoute = async (report: PendingWasteReport) => {
    if (!user) return

    try {
      const profile = await fetchUserProfile(user.id)

      if (!isProfileComplete(profile)) {
        Alert.alert(
          "Profile Incomplete",
          getProfileCompletionMessage(profile) +
            "\n\nPlease go to the Profile tab to complete your information before adding to route.",
          [
            {
              text: "Go to Profile",
              onPress: () => router.push("/(tabs)/profile"),
            },
          ],
        )
        return
      }

      if (!canCollectWaste(profile)) {
        Alert.alert(
          "Collector Mode Disabled",
          "You must enable Collector Mode in your profile to add waste to your route.\n\nGo to Profile → Enable Collector Mode",
          [
            {
              text: "Go to Profile",
              onPress: () => router.push("/(tabs)/profile"),
            },
          ],
        )
        return
      }

      if (userLocation && profile.state && profile.country) {
        const validation = validateUserLocation(
          profile.state,
          profile.country,
          userLocation.latitude,
          userLocation.longitude,
        )

        if (!validation.isValid && validation.message) {
          Alert.alert("Location Mismatch", validation.message, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Update Profile",
              onPress: () => router.push("/(tabs)/profile"),
            },
          ])
          return
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error)
      Alert.alert("Error", "Failed to verify profile. Please try again.")
      return
    }

    try {
      await addToRoutePlanner(report.id, user.id)
      Alert.alert(
        "Added to Route!",
        "This report has been added to your route planner. Check the Route tab to view your collection route.",
        [{ text: "OK" }],
      )
      await loadReports()
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add to route planner")
    }
  }

  const getWasteTypeColor = (wasteType: string) => {
    const colors: { [key: string]: string } = {
      Plastic: "#3b82f6",
      Organic: "#22c55e",
      Metal: "#eab308",
      Glass: "#a855f7",
      Electronic: "#ef4444",
      Paper: "#14b8a6",
      Mixed: "#6b7280",
    }
    return colors[wasteType] || "#6b7280"
  }

  const getWasteTypeBgColor = (wasteType: string) => {
    const colors: { [key: string]: string } = {
      Plastic: "#dbeafe",
      Organic: "#dcfce7",
      Metal: "#fef3c7",
      Glass: "#f3e8ff",
      Electronic: "#fee2e2",
      Paper: "#ccfbf1",
      Mixed: "#f3f4f6",
    }
    return colors[wasteType] || "#f3f4f6"
  }

  const getDistanceText = (report: PendingWasteReport): string => {
    if (!userLocation || !report.latitude || !report.longitude) {
      return "Unknown"
    }
    const distance = getDistanceToReport(
      userLocation.latitude,
      userLocation.longitude,
      report.latitude,
      report.longitude,
    )
    return distance !== null ? formatDistance(distance) : "Unknown"
  }

  const getUrgencyBadge = (report: PendingWasteReport) => {
    if (report.aiAnalysis.category === "large" && report.aiAnalysis.urgency === "high") {
      return (
        <YStack backgroundColor="#fee2e2" paddingHorizontal={10} paddingVertical={4} borderRadius={12}>
          <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "600" }}>URGENT</Text>
        </YStack>
      )
    }
    return null
  }

  const spin = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  // If verification screen is open, show it
  if (selectedReport && user) {
    return (
      <CollectorVerificationScreen
        report={selectedReport}
        userId={user.id}
        onSuccess={handleVerificationSuccess}
        onCancel={handleVerificationCancel}
      />
    )
  }

  return (
    <Theme name="light">
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
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 600} startX={Math.random() * SCREEN_WIDTH} />
        ))}

        <ScrollView
          flex={1}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
          showsVerticalScrollIndicator={false}
        >
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
                  transform: [{ rotate: spin }, { scale: logoPulse }],
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
              Collect Waste
            </Text>
            <Text style={{ fontSize: 14, color: "#16a34a", marginTop: 4 }}>Help clean up your community</Text>
          </Animated.View>

          {/* Stats Card */}
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
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <XStack justifyContent="space-around" alignItems="center">
                <YStack alignItems="center">
                  <YStack
                    width={60}
                    height={60}
                    borderRadius={30}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={8}
                  >
                    <Text style={{ fontSize: 24 }}>📦</Text>
                  </YStack>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#15803d" }}>{animatedCollected}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Collected Today</Text>
                </YStack>

                <YStack width={1} height={60} backgroundColor="#e5e7eb" />

                <YStack alignItems="center">
                  <YStack
                    width={60}
                    height={60}
                    borderRadius={30}
                    backgroundColor="#fef3c7"
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={8}
                  >
                    <Text style={{ fontSize: 24 }}>⭐</Text>
                  </YStack>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#ca8a04" }}>{animatedPoints}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Points Earned</Text>
                </YStack>
              </XStack>
            </YStack>
          </Animated.View>

          {/* Reports Section */}
          <YStack paddingHorizontal={20}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}>Nearby Reports</Text>
              <YStack backgroundColor="#dcfce7" paddingHorizontal={12} paddingVertical={6} borderRadius={16}>
                <Text style={{ color: "#15803d", fontWeight: "600", fontSize: 13 }}>{reports.length} available</Text>
              </YStack>
            </XStack>

            {isLoading ? (
              <YStack
                padding={40}
                alignItems="center"
                justifyContent="center"
                backgroundColor="white"
                borderRadius={24}
              >
                <Spinner size="large" color="#22c55e" />
                <Text style={{ color: "#6b7280", marginTop: 16 }}>Loading waste reports...</Text>
              </YStack>
            ) : reports.length === 0 ? (
              <YStack
                padding={40}
                alignItems="center"
                justifyContent="center"
                backgroundColor="white"
                borderRadius={24}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 60, marginBottom: 16 }}>🗑️</Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  No Pending Reports
                </Text>
                <Text style={{ color: "#6b7280", textAlign: "center", lineHeight: 20 }}>
                  Check back later for new waste{"\n"}collection opportunities
                </Text>
              </YStack>
            ) : (
              reports.map((report, index) => {
                const cardAnim = cardAnimations[index] || new Animated.Value(1)
                return (
                  <Animated.View
                    key={report.id}
                    style={{
                      opacity: cardAnim,
                      transform: [
                        {
                          translateX: cardAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0],
                          }),
                        },
                        {
                          scale: cardAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                      marginBottom: 16,
                    }}
                  >
                    <YStack
                      backgroundColor="white"
                      borderRadius={24}
                      padding={16}
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 5,
                      }}
                    >
                      {/* Report Image */}
                      <YStack borderRadius={20} overflow="hidden" marginBottom={12}>
                        <Image source={{ uri: report.imageUrl }} width="100%" height={160} />
                        {/* Points badge overlay */}
                        <YStack
                          position="absolute"
                          top={12}
                          right={12}
                          backgroundColor="#fef3c7"
                          paddingHorizontal={12}
                          paddingVertical={8}
                          borderRadius={16}
                          style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#ca8a04",
                              fontSize: 16,
                              fontWeight: "bold",
                            }}
                          >
                            +20 pts
                          </Text>
                        </YStack>
                      </YStack>

                      {/* Location and tags */}
                      <YStack marginBottom={12}>
                        <Text
                          style={{
                            color: "#1f2937",
                            fontWeight: "600",
                            fontSize: 16,
                            marginBottom: 8,
                          }}
                        >
                          {report.city || report.locationRaw}
                        </Text>
                        <XStack alignItems="center" gap={8} flexWrap="wrap">
                          <YStack
                            paddingHorizontal={12}
                            paddingVertical={6}
                            borderRadius={16}
                            backgroundColor={getWasteTypeBgColor(report.aiAnalysis.wasteType)}
                          >
                            <Text
                              style={{
                                color: getWasteTypeColor(report.aiAnalysis.wasteType),
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              {report.aiAnalysis.wasteType}
                            </Text>
                          </YStack>
                          <YStack
                            paddingHorizontal={12}
                            paddingVertical={6}
                            borderRadius={16}
                            backgroundColor="#f3f4f6"
                          >
                            <Text
                              style={{
                                color: "#6b7280",
                                fontSize: 12,
                                fontWeight: "500",
                              }}
                            >
                              📍 {getDistanceText(report)}
                            </Text>
                          </YStack>
                          {getUrgencyBadge(report)}
                        </XStack>
                      </YStack>

                      {/* Additional Info */}
                      <XStack gap={12} marginBottom={12}>
                        {report.aiAnalysis.estimatedWeightKg && (
                          <YStack flex={1} backgroundColor="#f9fafb" padding={12} borderRadius={16}>
                            <Text
                              style={{
                                color: "#9ca3af",
                                fontSize: 11,
                                marginBottom: 4,
                              }}
                            >
                              Weight
                            </Text>
                            <Text
                              style={{
                                color: "#1f2937",
                                fontWeight: "600",
                                fontSize: 15,
                              }}
                            >
                              {report.aiAnalysis.estimatedWeightKg} kg
                            </Text>
                          </YStack>
                        )}
                        <YStack flex={1} backgroundColor="#f9fafb" padding={12} borderRadius={16}>
                          <Text
                            style={{
                              color: "#9ca3af",
                              fontSize: 11,
                              marginBottom: 4,
                            }}
                          >
                            Category
                          </Text>
                          <Text
                            style={{
                              color: "#1f2937",
                              fontWeight: "600",
                              fontSize: 15,
                              textTransform: "capitalize",
                            }}
                          >
                            {report.aiAnalysis.category}
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Divider */}
                      <YStack height={1} backgroundColor="#f3f4f6" marginVertical={12} />

                      {/* Footer with date and buttons */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                          {new Date(report.reportedAt).toLocaleDateString()}
                        </Text>
                        <XStack gap={8}>
                          <Button
                            onPress={() => handleAddToRoute(report)}
                            backgroundColor="#f3e8ff"
                            paddingHorizontal={14}
                            paddingVertical={10}
                            borderRadius={16}
                            height="unset"
                            pressStyle={{
                              scale: 0.95,
                              backgroundColor: "#e9d5ff",
                            }}
                            animation="quick"
                          >
                            <Text
                              style={{
                                color: "#9333ea",
                                fontWeight: "600",
                                fontSize: 13,
                              }}
                            >
                              Add to Route
                            </Text>
                          </Button>
                          <Button
                            onPress={() => handleCollect(report)}
                            backgroundColor="#22c55e"
                            paddingHorizontal={14}
                            paddingVertical={10}
                            borderRadius={16}
                            height="unset"
                            pressStyle={{
                              scale: 0.95,
                              backgroundColor: "#16a34a",
                            }}
                            animation="quick"
                            style={{
                              shadowColor: "#22c55e",
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "white",
                                fontWeight: "600",
                                fontSize: 13,
                              }}
                            >
                              Collect Now
                            </Text>
                          </Button>
                        </XStack>
                      </XStack>
                    </YStack>
                  </Animated.View>
                )
              })
            )}
          </YStack>

          {/* Tips Card */}
          <Animated.View
            style={{
              transform: [{ translateY: tipsSlide }],
              opacity: tipsOpacity,
              margin: 20,
              marginBottom: 40,
            }}
          >
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding={20}
              borderLeftWidth={4}
              borderLeftColor="#22c55e"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <XStack alignItems="center" marginBottom={12}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>🎯</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#15803d" }}>Collection Tips</Text>
              </XStack>
              <YStack gap={8}>
                <XStack alignItems="center" gap={8}>
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text style={{ fontSize: 12 }}>1</Text>
                  </YStack>
                  <Text style={{ color: "#374151", flex: 1 }}>Start with nearby locations</Text>
                </XStack>
                <XStack alignItems="center" gap={8}>
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text style={{ fontSize: 12 }}>2</Text>
                  </YStack>
                  <Text style={{ color: "#374151", flex: 1 }}>Bring appropriate collection bags</Text>
                </XStack>
                <XStack alignItems="center" gap={8}>
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text style={{ fontSize: 12 }}>3</Text>
                  </YStack>
                  <Text style={{ color: "#374151", flex: 1 }}>Take clear photo for verification</Text>
                </XStack>
                <XStack alignItems="center" gap={8}>
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text style={{ fontSize: 12 }}>4</Text>
                  </YStack>
                  <Text style={{ color: "#374151", flex: 1 }}>Must be within 500m of waste location</Text>
                </XStack>
              </YStack>
            </YStack>
          </Animated.View>
        </ScrollView>
      </YStack>
    </Theme>
  )
}
