"use client"

import { useUser } from "@clerk/clerk-expo"
import { ChevronDown, ChevronUp, Navigation, Trash2 } from "@tamagui/lucide-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as Location from "expo-location"
import React, { useEffect, useRef } from "react"
import { Alert, Animated, Dimensions, Easing, Linking, RefreshControl, View } from "react-native"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"
import { Button, Image, ScrollView, Spinner, Text, Theme, XStack, YStack } from "tamagui"
import CollectorVerificationScreen from "../components/CollectorVerificationScreen"
import { fetchRoutePlannerReports, removeFromRoutePlanner, type RouteReport } from "../services/routePlannerService"
import { calculateDistance, formatDistance } from "../utils/locationUtils"

const { width, height } = Dimensions.get("window")
const SCREEN_HEIGHT = height

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
        {["🗺️", "📍", "🚗", "✦", "●"][Math.floor(Math.random() * 5)]}
      </Text>
    </Animated.View>
  )
}

export default function RoutePlannerScreen() {
  const { user } = useUser()
  const [reports, setReports] = React.useState<RouteReport[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [selectedReport, setSelectedReport] = React.useState<RouteReport | null>(null)
  const [currentLocation, setCurrentLocation] = React.useState<{ latitude: number; longitude: number } | null>(null)
  const [expandedCard, setExpandedCard] = React.useState<string | null>(null)
  const mapRef = useRef<MapView>(null)

  // Animation values
  const headerSlide = useRef(new Animated.Value(-50)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const statsSlide = useRef(new Animated.Value(50)).current
  const statsOpacity = useRef(new Animated.Value(0)).current
  const mapSlide = useRef(new Animated.Value(100)).current
  const mapOpacity = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const logoPulse = useRef(new Animated.Value(1)).current

  // Animated counters
  const [animatedStops, setAnimatedStops] = React.useState(0)
  const [animatedDistance, setAnimatedDistance] = React.useState("0.0")
  const [animatedPoints, setAnimatedPoints] = React.useState(0)

  useEffect(() => {
    // Entrance animations
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
      Animated.spring(statsSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(mapSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start()

    // Logo animations
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()

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
  }, [])

  // Animate counters when reports change
  useEffect(() => {
    const targetStops = reports.length
    const targetDistance = calculateTotalDistance()
    const targetPoints = reports.length * 50

    // Animate stops
    let currentStops = 0
    const stopsInterval = setInterval(() => {
      if (currentStops < targetStops) {
        currentStops++
        setAnimatedStops(currentStops)
      } else {
        clearInterval(stopsInterval)
      }
    }, 100)

    // Animate distance
    let currentDistance = 0
    const distanceInterval = setInterval(() => {
      if (currentDistance < targetDistance) {
        currentDistance += targetDistance / 20
        setAnimatedDistance(Math.min(currentDistance, targetDistance).toFixed(1))
      } else {
        clearInterval(distanceInterval)
      }
    }, 50)

    // Animate points
    let currentPoints = 0
    const pointsInterval = setInterval(() => {
      if (currentPoints < targetPoints) {
        currentPoints += Math.ceil(targetPoints / 20)
        setAnimatedPoints(Math.min(currentPoints, targetPoints))
      } else {
        clearInterval(pointsInterval)
      }
    }, 50)

    return () => {
      clearInterval(stopsInterval)
      clearInterval(distanceInterval)
      clearInterval(pointsInterval)
    }
  }, [reports])

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  useEffect(() => {
    loadData()
    getCurrentLocation()
  }, [user])

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to show your current location on the map.")
        return
      }
      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
    } catch (error) {
      console.error("Error getting location:", error)
    }
  }

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await fetchRoutePlannerReports(user.id)
      setReports(data)
    } catch (error) {
      console.error("Error loading route planner:", error)
      Alert.alert("Error", "Failed to load route planner data")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleRemoveFromRoute = async (reportId: string) => {
    if (!user) return

    Alert.alert("Remove from Route?", "This will change the report status back to PENDING.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeFromRoutePlanner(reportId, user.id)
            Alert.alert("Removed", "Report removed from route planner")
            await loadData()
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove from route")
          }
        },
      },
    ])
  }

  const movePriorityUp = (reportId: string) => {
    const index = reports.findIndex((r) => r.id === reportId)
    if (index === 0) return // Already at top

    const newReports = [...reports]
    ;[newReports[index - 1], newReports[index]] = [newReports[index], newReports[index - 1]]
    setReports(newReports)
  }

  const movePriorityDown = (reportId: string) => {
    const index = reports.findIndex((r) => r.id === reportId)
    if (index === reports.length - 1) return // Already at bottom

    const newReports = [...reports]
    ;[newReports[index], newReports[index + 1]] = [newReports[index + 1], newReports[index]]
    setReports(newReports)
  }

  const handleCollectNow = (report: RouteReport) => {
    setSelectedReport(report)
  }

  const handleVerificationSuccess = async () => {
    setSelectedReport(null)
    await loadData()
    Alert.alert("Success! 🎉", "Collection verified successfully. The report has been removed from your route.")
  }

  const handleVerificationCancel = () => {
    setSelectedReport(null)
  }

  const calculateTotalDistance = () => {
    if (reports.length < 2 || !currentLocation) return 0

    let totalDistance = 0
    const sortedReports = [...reports].sort((a, b) => a.priority - b.priority)

    // Distance from current location to first stop
    totalDistance += calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      sortedReports[0].latitude,
      sortedReports[0].longitude,
    )

    // Distance between stops
    for (let i = 0; i < sortedReports.length - 1; i++) {
      totalDistance += calculateDistance(
        sortedReports[i].latitude,
        sortedReports[i].longitude,
        sortedReports[i + 1].latitude,
        sortedReports[i + 1].longitude,
      )
    }

    return totalDistance
  }

  const openRouteInMaps = () => {
    if (reports.length === 0) {
      Alert.alert("No Stops", "Add some waste reports to your route first")
      return
    }

    const sortedReports = [...reports].sort((a, b) => a.priority - b.priority)
    const waypoints = sortedReports.map((r) => `${r.latitude},${r.longitude}`).join("|")
    const destination = sortedReports[sortedReports.length - 1]
    const origin = currentLocation
      ? `${currentLocation.latitude},${currentLocation.longitude}`
      : `${sortedReports[0].latitude},${sortedReports[0].longitude}`

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}&travelmode=driving`

    Linking.openURL(url)
  }

  const fitMapToMarkers = () => {
    if (mapRef.current && reports.length > 0) {
      const coordinates = reports.map((r) => ({
        latitude: r.latitude,
        longitude: r.longitude,
      }))
      if (currentLocation) {
        coordinates.push(currentLocation)
      }
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
    }
  }

  const getRouteCoordinates = () => {
    const sortedReports = [...reports].sort((a, b) => a.priority - b.priority)
    const coordinates = []

    if (currentLocation) {
      coordinates.push(currentLocation)
    }

    sortedReports.forEach((report) => {
      coordinates.push({
        latitude: report.latitude,
        longitude: report.longitude,
      })
    })

    return coordinates
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "#dc2626"
    if (priority === 2) return "#ea580c"
    if (priority === 3) return "#ca8a04"
    return "#16a34a"
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

  const getWasteTypeColor = (wasteType: string) => {
    const colors: { [key: string]: string } = {
      Plastic: "#2563eb",
      Organic: "#16a34a",
      Metal: "#ca8a04",
      Glass: "#9333ea",
      Electronic: "#dc2626",
      Paper: "#0d9488",
      Mixed: "#6b7280",
    }
    return colors[wasteType] || "#6b7280"
  }

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

  if (loading) {
    return (
      <Theme name="light">
        <YStack flex={1} backgroundColor="#f0fdf4" justifyContent="center" alignItems="center">
          <LinearGradient
            colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <Spinner size="large" color="#22c55e" />
          <Text style={{ color: "#166534", marginTop: 16, fontWeight: "600" }}>Loading route data...</Text>
        </YStack>
      </Theme>
    )
  }

  return (
    <Theme name="light">
      <YStack flex={1} backgroundColor="#f0fdf4">
        <LinearGradient
          colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 800} startX={Math.random() * width} />
        ))}

        <ScrollView
          flex={1}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            <YStack alignItems="center" marginBottom={8}>
              <YStack
                position="absolute"
                width={80}
                height={80}
                borderRadius={40}
                backgroundColor="#22c55e"
                opacity={0.2}
              />
              <Animated.View
                style={{
                  transform: [{ rotate: spin }, { scale: logoPulse }],
                }}
              >
                <Text style={{ fontSize: 56 }}>🗺️</Text>
              </Animated.View>
            </YStack>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#166534",
                marginTop: 8,
              }}
            >
              Collection Route
            </Text>
            <Text style={{ fontSize: 14, color: "#22c55e", marginTop: 4 }}>Plan your optimal route</Text>
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
                    <Text style={{ fontSize: 24 }}>📍</Text>
                  </YStack>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#166534" }}>{animatedStops}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Stops</Text>
                </YStack>

                <YStack width={1} height={60} backgroundColor="#e5e7eb" />

                <YStack alignItems="center">
                  <YStack
                    width={60}
                    height={60}
                    borderRadius={30}
                    backgroundColor="#dbeafe"
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={8}
                  >
                    <Text style={{ fontSize: 24 }}>🚗</Text>
                  </YStack>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#2563eb" }}>{animatedDistance}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>km Total</Text>
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
                    <Text style={{ fontSize: 24 }}>🏆</Text>
                  </YStack>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#ca8a04" }}>{animatedPoints}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Points</Text>
                </YStack>
              </XStack>
            </YStack>
          </Animated.View>

          {/* Open Maps Button */}
          <Animated.View
            style={{
              opacity: statsOpacity,
              marginHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <Button
              onPress={openRouteInMaps}
              backgroundColor="#22c55e"
              color="white"
              size="$4"
              borderRadius={20}
              disabled={reports.length === 0}
              pressStyle={{ scale: 0.95, backgroundColor: "#16a34a" }}
              animation="quick"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <XStack alignItems="center" gap={8}>
                <Navigation size={20} color="white" />
                <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Open in Google Maps</Text>
              </XStack>
            </Button>
          </Animated.View>

          {/* Map View */}
          {reports.length > 0 && (
            <Animated.View
              style={{
                transform: [{ translateY: mapSlide }],
                opacity: mapOpacity,
                marginHorizontal: 20,
                marginBottom: 20,
              }}
            >
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
                <MapView
                  ref={mapRef}
                  style={{ width: "100%", height: 250 }}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: reports[0]?.latitude || 0,
                    longitude: reports[0]?.longitude || 0,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }}
                  onMapReady={fitMapToMarkers}
                >
                  {currentLocation && (
                    <Marker coordinate={currentLocation} title="Your Location">
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "#22c55e",
                          borderWidth: 3,
                          borderColor: "white",
                        }}
                      />
                    </Marker>
                  )}

                  {reports.map((report, index) => (
                    <Marker
                      key={report.id}
                      coordinate={{
                        latitude: report.latitude,
                        longitude: report.longitude,
                      }}
                      title={`Stop ${report.priority}: ${report.wasteType}`}
                      description={report.location}
                    >
                      <View
                        style={{
                          backgroundColor: getPriorityColor(report.priority),
                          borderRadius: 20,
                          padding: 8,
                          borderWidth: 2,
                          borderColor: "white",
                        }}
                      >
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>{report.priority}</Text>
                      </View>
                    </Marker>
                  ))}

                  <Polyline coordinates={getRouteCoordinates()} strokeColor="#22c55e" strokeWidth={4} />
                </MapView>
              </YStack>
            </Animated.View>
          )}

          {/* Route Stops */}
          <YStack paddingHorizontal={20} paddingBottom={100}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#166534", marginBottom: 16 }}>
              Route Stops ({reports.length})
            </Text>

            {reports.length === 0 ? (
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
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺️</Text>
                <Text style={{ fontSize: 16, color: "#6b7280", textAlign: "center" }}>
                  No stops in your route yet.{"\n"}Add waste reports from the Reports tab.
                </Text>
              </YStack>
            ) : (
              [...reports]
                .sort((a, b) => a.priority - b.priority)
                .map((report, index) => (
                  <Animated.View
                    key={report.id}
                    style={{
                      marginBottom: 12,
                    }}
                  >
                    <YStack
                      backgroundColor="white"
                      borderRadius={24}
                      padding={16}
                      style={{
                        shadowColor: "#22c55e",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <XStack justifyContent="space-between" alignItems="flex-start">
                        <XStack flex={1} gap={12}>
                          <YStack
                            width={48}
                            height={48}
                            borderRadius={24}
                            backgroundColor={getPriorityColor(report.priority)}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>{report.priority}</Text>
                          </YStack>

                          <YStack flex={1}>
                            <XStack alignItems="center" gap={8} marginBottom={4}>
                              <YStack
                                backgroundColor={getWasteTypeBgColor(report.wasteType)}
                                paddingHorizontal={10}
                                paddingVertical={4}
                                borderRadius={12}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "600",
                                    color: getWasteTypeColor(report.wasteType),
                                  }}
                                >
                                  {report.wasteType}
                                </Text>
                              </YStack>
                              <Text style={{ fontSize: 12, color: "#6b7280" }}>{report.amount}</Text>
                            </XStack>

                            <Text
                              style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}
                              numberOfLines={expandedCard === report.id ? undefined : 1}
                            >
                              {report.location}
                            </Text>

                            {currentLocation && (
                              <Text style={{ fontSize: 12, color: "#22c55e", fontWeight: "500" }}>
                                {formatDistance(
                                  calculateDistance(
                                    currentLocation.latitude,
                                    currentLocation.longitude,
                                    report.latitude,
                                    report.longitude,
                                  ),
                                )}{" "}
                                away
                              </Text>
                            )}
                          </YStack>
                        </XStack>

                        <XStack gap={8}>
                          <Button
                            size="$3"
                            circular
                            backgroundColor="#dcfce7"
                            pressStyle={{ backgroundColor: "#bbf7d0" }}
                            onPress={() => movePriorityUp(report.id)}
                            disabled={index === 0}
                            opacity={index === 0 ? 0.3 : 1}
                          >
                            <ChevronUp size={16} color="#166534" />
                          </Button>

                          <Button
                            size="$3"
                            circular
                            backgroundColor="#dcfce7"
                            pressStyle={{ backgroundColor: "#bbf7d0" }}
                            onPress={() => movePriorityDown(report.id)}
                            disabled={index === reports.length - 1}
                            opacity={index === reports.length - 1 ? 0.3 : 1}
                          >
                            <ChevronDown size={16} color="#166534" />
                          </Button>

                          <Button
                            size="$3"
                            circular
                            backgroundColor="#fee2e2"
                            pressStyle={{ backgroundColor: "#fecaca" }}
                            onPress={() => handleRemoveFromRoute(report.id)}
                          >
                            <Trash2 size={16} color="#dc2626" />
                          </Button>
                        </XStack>
                      </XStack>

                      {expandedCard === report.id && (
                        <YStack marginTop={16} paddingTop={16} borderTopWidth={1} borderTopColor="#e5e7eb">
                          {report.imageUrl && (
                            <Image
                              source={{ uri: report.imageUrl }}
                              style={{
                                width: "100%",
                                height: 150,
                                borderRadius: 16,
                                marginBottom: 12,
                              }}
                              resizeMode="cover"
                            />
                          )}

                          <XStack justifyContent="space-between" marginBottom={8}>
                            <Text style={{ fontSize: 12, color: "#6b7280" }}>Reported:</Text>
                            <Text style={{ fontSize: 12, color: "#374151", fontWeight: "500" }}>
                              {new Date(report.createdAt).toLocaleDateString()}
                            </Text>
                          </XStack>

                          <XStack gap={8} marginTop={8}>
                            <Button
                              onPress={() => handleRemoveFromRoute(report.id)}
                              backgroundColor="#dc2626"
                              flex={1}
                              size="$3"
                              borderRadius={16}
                              pressStyle={{ scale: 0.98, backgroundColor: "#b91c1c" }}
                              animation="quick"
                            >
                              <XStack alignItems="center" gap={6}>
                                <Trash2 size={14} color="white" />
                                <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>Remove</Text>
                              </XStack>
                            </Button>

                            <Button
                              onPress={() => handleCollectNow(report)}
                              backgroundColor="#22c55e"
                              flex={1}
                              size="$3"
                              borderRadius={16}
                              pressStyle={{ scale: 0.98, backgroundColor: "#16a34a" }}
                              animation="quick"
                            >
                              <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>Collect Now</Text>
                            </Button>
                          </XStack>
                        </YStack>
                      )}
                    </YStack>
                  </Animated.View>
                ))
            )}

            {/* Tips Section */}
            {reports.length > 0 && (
              <YStack
                backgroundColor="white"
                borderRadius={24}
                padding={20}
                marginTop={20}
                borderLeftWidth={4}
                borderLeftColor="#22c55e"
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#166534", marginBottom: 12 }}>
                  🗺️ Route Planning Tips
                </Text>
                <YStack gap={8}>
                  <Text style={{ fontSize: 13, color: "#374151", lineHeight: 20 }}>
                    • Use ↑↓ arrows to reorder stops by priority
                  </Text>
                  <Text style={{ fontSize: 13, color: "#374151", lineHeight: 20 }}>
                    • Map shows your route with numbered stops
                  </Text>
                  <Text style={{ fontSize: 13, color: "#374151", lineHeight: 20 }}>
                    • Open in Google Maps for turn-by-turn navigation
                  </Text>
                  <Text style={{ fontSize: 13, color: "#374151", lineHeight: 20 }}>
                    • Collect reports in order for optimal route
                  </Text>
                </YStack>
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </Theme>
  )
}
