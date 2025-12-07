"use client"

import { useUser } from "@clerk/clerk-expo"
import { ChevronDown, ChevronUp, Filter, Layers, MapPin, RefreshCw } from "@tamagui/lucide-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as Location from "expo-location"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Alert, Animated, Dimensions, Easing, PanResponder, StyleSheet, View } from "react-native"
import MapView, { Callout, Heatmap, Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { Button, Slider, Spinner, Switch, Text, Theme, XStack, YStack } from "tamagui"
import { fetchAllReportsForHeatmap, type HeatmapReport } from "../services/wasteService"

const { width, height } = Dimensions.get("window")
const SCREEN_HEIGHT = height
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.65
const BOTTOM_SHEET_MIN_HEIGHT = 120
const BOTTOM_SHEET_MID_HEIGHT = SCREEN_HEIGHT * 0.4

// Floating particle component for bottom sheet
const FloatingParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      translateY.setValue(100)
      opacity.setValue(0)

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 4000 + Math.random() * 2000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate())
    }
    animate()
  }, [])

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: 0,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ fontSize: 12, color: "#22c55e" }}>{["✦", "●", "○"][Math.floor(Math.random() * 3)]}</Text>
    </Animated.View>
  )
}

export default function HeatmapScreen() {
  const { user } = useUser()
  const [reports, setReports] = useState<HeatmapReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [heatmapRadius, setHeatmapRadius] = useState(50)
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const mapRef = useRef<MapView>(null)

  // Bottom sheet animation
  const bottomSheetY = useRef(new Animated.Value(SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT)).current
  const [sheetPosition, setSheetPosition] = useState<"min" | "mid" | "max">("mid")

  // Animated counters
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [animatedPending, setAnimatedPending] = useState(0)
  const [animatedCollected, setAnimatedCollected] = useState(0)
  const [animatedHotspots, setAnimatedHotspots] = useState(0)

  // Card animations
  const cardScale = useRef(new Animated.Value(0.9)).current
  const cardOpacity = useRef(new Animated.Value(0)).current

  // Pan responder for bottom sheet drag
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY =
          gestureState.dy +
          (sheetPosition === "min"
            ? SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT
            : sheetPosition === "mid"
              ? SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT
              : SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT)

        const clampedY = Math.max(
          SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT,
          Math.min(SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT, newY),
        )
        bottomSheetY.setValue(clampedY)
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY =
          gestureState.dy +
          (sheetPosition === "min"
            ? SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT
            : sheetPosition === "mid"
              ? SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT
              : SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT)

        let targetY: number
        let newPosition: "min" | "mid" | "max"

        if (gestureState.vy > 0.5) {
          // Fast swipe down
          if (sheetPosition === "max") {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT
            newPosition = "mid"
          } else {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT
            newPosition = "min"
          }
        } else if (gestureState.vy < -0.5) {
          // Fast swipe up
          if (sheetPosition === "min") {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT
            newPosition = "mid"
          } else {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT
            newPosition = "max"
          }
        } else {
          // Snap to nearest position
          const minDist = Math.abs(currentY - (SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT))
          const midDist = Math.abs(currentY - (SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT))
          const maxDist = Math.abs(currentY - (SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT))

          if (minDist < midDist && minDist < maxDist) {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT
            newPosition = "min"
          } else if (midDist < maxDist) {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT
            newPosition = "mid"
          } else {
            targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT
            newPosition = "max"
          }
        }

        Animated.spring(bottomSheetY, {
          toValue: targetY,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }).start()

        setSheetPosition(newPosition)
      },
    }),
  ).current

  const toggleSheet = () => {
    let targetY: number
    let newPosition: "min" | "mid" | "max"

    if (sheetPosition === "min") {
      targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MID_HEIGHT
      newPosition = "mid"
    } else if (sheetPosition === "mid") {
      targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT
      newPosition = "max"
    } else {
      targetY = SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT
      newPosition = "min"
    }

    Animated.spring(bottomSheetY, {
      toValue: targetY,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start()

    setSheetPosition(newPosition)
  }

  useEffect(() => {
    loadData()
    getUserLocation()
  }, [])

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

  useEffect(() => {
    // Card entrance animation
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Animate counters when reports change
  useEffect(() => {
    const pendingCount = reports.filter((r) => r.status === "PENDING" || r.status === "VERIFIED").length
    const collectedCount = reports.filter((r) => r.status === "COLLECTED").length
    const hotspotsCount = getHotspots().length

    const animateCounter = (target: number, setter: React.Dispatch<React.SetStateAction<number>>, duration = 1000) => {
      let current = 0
      const increment = target / (duration / 50)
      const interval = setInterval(() => {
        current += increment
        if (current >= target) {
          setter(target)
          clearInterval(interval)
        } else {
          setter(Math.floor(current))
        }
      }, 50)
    }

    animateCounter(reports.length, setAnimatedTotal)
    animateCounter(pendingCount, setAnimatedPending)
    animateCounter(collectedCount, setAnimatedCollected)
    animateCounter(hotspotsCount, setAnimatedHotspots)
  }, [reports])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await fetchAllReportsForHeatmap(user.id)
      setReports(data)

      if (data.length > 0 && mapRef.current) {
        fitMapToMarkers()
      }
    } catch (error) {
      console.error("Error loading heatmap data:", error)
      Alert.alert("Error", "Failed to load heatmap data")
    } finally {
      setLoading(false)
    }
  }

  const fitMapToMarkers = () => {
    if (mapRef.current && reports.length > 0) {
      const coordinates = reports.map((r) => ({
        latitude: r.latitude,
        longitude: r.longitude,
      }))
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: BOTTOM_SHEET_MID_HEIGHT + 50, left: 50 },
          animated: true,
        })
      }, 500)
    }
  }

  const handleResetControls = () => {
    setHeatmapRadius(50)
    setHeatmapOpacity(0.7)
    setShowHeatmap(true)
    setShowMarkers(true)
    setSelectedFilter(null)
  }

  const getHeatmapPoints = () => {
    return reports
      .filter((r) => r.status === "PENDING" || r.status === "VERIFIED")
      .filter((r) => !selectedFilter || r.wasteType === selectedFilter)
      .map((report) => ({
        latitude: report.latitude,
        longitude: report.longitude,
        weight: report.wasteType === "Electronic" ? 3 : report.wasteType === "Plastic" ? 2 : 1,
      }))
  }

  const getHotspots = () => {
    const gridSize = 0.01
    const grid: { [key: string]: HeatmapReport[] } = {}

    reports
      .filter((r) => r.status === "PENDING" || r.status === "VERIFIED")
      .forEach((report) => {
        const gridKey = `${Math.floor(report.latitude / gridSize)},${Math.floor(report.longitude / gridSize)}`
        if (!grid[gridKey]) grid[gridKey] = []
        grid[gridKey].push(report)
      })

    return Object.entries(grid)
      .filter(([_, reports]) => reports.length >= 3)
      .map(([key, reports]) => ({
        key,
        count: reports.length,
        latitude: reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length,
        longitude: reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length,
      }))
  }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "COLLECTED":
        return "#10b981"
      case "IN_PROGRESS":
        return "#f59e0b"
      default:
        return "#ef4444"
    }
  }

  const wasteTypes = ["Plastic", "Organic", "Metal", "Glass", "Electronic", "Paper", "Mixed"]

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
          <Text style={{ color: "#166534", marginTop: 16, fontWeight: "600" }}>Loading heatmap data...</Text>
        </YStack>
      </Theme>
    )
  }

  return (
    <Theme name="light">
      <View style={{ flex: 1 }}>
        {/* Full screen map behind */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: reports[0]?.latitude || 20.5937,
            longitude: reports[0]?.longitude || 78.9629,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {showHeatmap && getHeatmapPoints().length > 0 && (
            <Heatmap
              points={getHeatmapPoints()}
              radius={heatmapRadius}
              opacity={heatmapOpacity}
              gradient={{
                colors: [
                  "rgba(0, 255, 255, 0.7)",
                  "rgba(0, 191, 255, 0.8)",
                  "rgba(0, 127, 255, 0.9)",
                  "rgba(0, 191, 0, 1)",
                  "rgba(255, 255, 0, 1)",
                  "rgba(255, 191, 0, 1)",
                  "rgba(255, 127, 0, 1)",
                  "rgba(255, 63, 0, 1)",
                  "rgba(255, 0, 0, 1)",
                ],
                startPoints: [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 1.0],
                colorMapSize: 256,
              }}
            />
          )}

          {showMarkers &&
            reports
              .filter((r) => !selectedFilter || r.wasteType === selectedFilter)
              .map((report) => (
                <Marker
                  key={report.id}
                  coordinate={{
                    latitude: report.latitude,
                    longitude: report.longitude,
                  }}
                  pinColor={getMarkerColor(report.status)}
                >
                  <Callout>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>{report.wasteType}</Text>
                      <Text style={styles.calloutStatus}>Status: {report.status}</Text>
                      <Text style={styles.calloutLocation} numberOfLines={2}>
                        {report.location}
                      </Text>
                      <Text style={styles.calloutWeight}>Amount: {report.amount}</Text>
                      <Text style={styles.calloutDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </Callout>
                </Marker>
              ))}

          {/* Hotspot markers */}
          {getHotspots().map((hotspot) => (
            <Marker
              key={hotspot.key}
              coordinate={{
                latitude: hotspot.latitude,
                longitude: hotspot.longitude,
              }}
            >
              <View
                style={{
                  backgroundColor: "#dc2626",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderWidth: 2,
                  borderColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>{hotspot.count}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Top floating controls */}
        <View style={styles.topControls}>
          <Button
            size="$4"
            circular
            backgroundColor="white"
            pressStyle={{ scale: 0.95, backgroundColor: "#f0fdf4" }}
            onPress={loadData}
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <RefreshCw size={20} color="#22c55e" />
          </Button>

          <Button
            size="$4"
            circular
            backgroundColor="white"
            pressStyle={{ scale: 0.95, backgroundColor: "#f0fdf4" }}
            onPress={fitMapToMarkers}
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <MapPin size={20} color="#22c55e" />
          </Button>
        </View>

        {/* Bottom Sheet - Swiggy style */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: bottomSheetY }],
            },
          ]}
        >
          {/* Floating particles inside sheet */}
          {[...Array(5)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 600} startX={Math.random() * width} />
          ))}

          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
            <Button
              size="$3"
              circular
              backgroundColor="#dcfce7"
              pressStyle={{ scale: 0.95 }}
              onPress={toggleSheet}
              style={{ position: "absolute", right: 20 }}
            >
              {sheetPosition === "max" ? (
                <ChevronDown size={18} color="#166534" />
              ) : (
                <ChevronUp size={18} color="#166534" />
              )}
            </Button>
          </View>

          {/* Sheet header */}
          <YStack paddingHorizontal={20} paddingBottom={16}>
            <XStack alignItems="center" gap={12}>
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor="#dcfce7"
                alignItems="center"
                justifyContent="center"
              >
                <Text style={{ fontSize: 24 }}>🔥</Text>
              </YStack>
              <YStack>
                <Text style={{ fontSize: 22, fontWeight: "bold", color: "#166534" }}>Waste Heatmap</Text>
                <Text style={{ fontSize: 13, color: "#22c55e" }}>{reports.length} reports in your area</Text>
              </YStack>
            </XStack>
          </YStack>

          {/* Stats cards - horizontal scroll */}
          <Animated.View
            style={{
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
            }}
          >
            <XStack paddingHorizontal={20} gap={12} marginBottom={20}>
              {[
                { label: "Total", value: animatedTotal, icon: "📊", color: "#166534", bg: "#dcfce7" },
                { label: "Pending", value: animatedPending, icon: "⏳", color: "#ca8a04", bg: "#fef3c7" },
                { label: "Collected", value: animatedCollected, icon: "✅", color: "#22c55e", bg: "#bbf7d0" },
                { label: "Hotspots", value: animatedHotspots, icon: "🔥", color: "#dc2626", bg: "#fee2e2" },
              ].map((stat, index) => (
                <YStack
                  key={index}
                  backgroundColor="white"
                  borderRadius={20}
                  padding={14}
                  flex={1}
                  alignItems="center"
                  style={{
                    shadowColor: "#22c55e",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <YStack
                    width={36}
                    height={36}
                    borderRadius={18}
                    backgroundColor={stat.bg}
                    alignItems="center"
                    justifyContent="center"
                    marginBottom={6}
                  >
                    <Text style={{ fontSize: 16 }}>{stat.icon}</Text>
                  </YStack>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: stat.color }}>{stat.value}</Text>
                  <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{stat.label}</Text>
                </YStack>
              ))}
            </XStack>
          </Animated.View>

          {/* Map controls card */}
          <YStack
            marginHorizontal={20}
            backgroundColor="white"
            borderRadius={24}
            padding={20}
            marginBottom={16}
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <XStack alignItems="center" gap={8} marginBottom={16}>
              <Layers size={18} color="#166534" />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#166534" }}>Map Controls</Text>
            </XStack>

            {/* Reset Button */}
            <Button
              onPress={handleResetControls}
              backgroundColor="#f3f4f6"
              color="#374151"
              size="$3"
              borderRadius={16}
              marginBottom={16}
              pressStyle={{ scale: 0.95, backgroundColor: "#e5e7eb" }}
            >
              <XStack alignItems="center" gap={6}>
                <Text style={{ fontSize: 14 }}>✖️</Text>
                <Text style={{ color: "#374151", fontWeight: "600", fontSize: 13 }}>Reset Controls</Text>
              </XStack>
            </Button>

            <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
              <XStack alignItems="center" gap={10}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#dcfce7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>🌡️</Text>
                </View>
                <Text style={{ fontSize: 14, color: "#374151" }}>Show Heatmap</Text>
              </XStack>
              <Switch
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
                backgroundColor={showHeatmap ? "#22c55e" : "#e5e7eb"}
              >
                <Switch.Thumb animation="quick" backgroundColor="white" />
              </Switch>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
              <XStack alignItems="center" gap={10}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#dbeafe",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📍</Text>
                </View>
                <Text style={{ fontSize: 14, color: "#374151" }}>Show Markers</Text>
              </XStack>
              <Switch
                checked={showMarkers}
                onCheckedChange={setShowMarkers}
                backgroundColor={showMarkers ? "#22c55e" : "#e5e7eb"}
              >
                <Switch.Thumb animation="quick" backgroundColor="white" />
              </Switch>
            </XStack>

            {/* Heatmap Intensity Slider */}
            <YStack gap={8} marginBottom={16}>
              <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>Heatmap Intensity</Text>
              <Slider
                value={[heatmapRadius]}
                onValueChange={(value) => setHeatmapRadius(value[0])}
                min={20}
                max={80}
                step={5}
                size="$3"
              >
                <Slider.Track backgroundColor="#e5e7eb">
                  <Slider.TrackActive backgroundColor="#22c55e" />
                </Slider.Track>
                <Slider.Thumb circular index={0} backgroundColor="#22c55e" />
              </Slider>
              <XStack justifyContent="space-between">
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>Low</Text>
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>High</Text>
              </XStack>
            </YStack>

            {/* Opacity Slider */}
            <YStack gap={8}>
              <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>Opacity</Text>
              <Slider
                value={[heatmapOpacity]}
                onValueChange={(value) => setHeatmapOpacity(value[0])}
                min={0.2}
                max={1}
                step={0.1}
                size="$3"
              >
                <Slider.Track backgroundColor="#e5e7eb">
                  <Slider.TrackActive backgroundColor="#22c55e" />
                </Slider.Track>
                <Slider.Thumb circular index={0} backgroundColor="#22c55e" />
              </Slider>
              <XStack justifyContent="space-between">
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>Transparent</Text>
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>Opaque</Text>
              </XStack>
            </YStack>
          </YStack>

          {/* Filter card */}
          <YStack
            marginHorizontal={20}
            backgroundColor="white"
            borderRadius={24}
            padding={20}
            marginBottom={16}
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <XStack alignItems="center" gap={8} marginBottom={16}>
              <Filter size={18} color="#166534" />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#166534" }}>Filter by Type</Text>
            </XStack>

            <XStack flexWrap="wrap" gap={8}>
              <Button
                size="$3"
                backgroundColor={selectedFilter === null ? "#22c55e" : "#f3f4f6"}
                pressStyle={{ scale: 0.95 }}
                borderRadius={16}
                onPress={() => setSelectedFilter(null)}
              >
                <Text
                  style={{
                    color: selectedFilter === null ? "white" : "#6b7280",
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  All
                </Text>
              </Button>
              {wasteTypes.map((type) => (
                <Button
                  key={type}
                  size="$3"
                  backgroundColor={selectedFilter === type ? "#22c55e" : "#f3f4f6"}
                  pressStyle={{ scale: 0.95 }}
                  borderRadius={16}
                  onPress={() => setSelectedFilter(selectedFilter === type ? null : type)}
                >
                  <Text
                    style={{
                      color: selectedFilter === type ? "white" : "#6b7280",
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {type}
                  </Text>
                </Button>
              ))}
            </XStack>
          </YStack>

          {/* Legend card */}
          <YStack
            marginHorizontal={20}
            backgroundColor="white"
            borderRadius={24}
            padding={20}
            marginBottom={100}
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#166534", marginBottom: 16 }}>Heat Intensity</Text>

            <View style={styles.gradientLegendContainer}>
              <LinearGradient
                colors={["#00ffff", "#00bfff", "#007fff", "#00bf00", "#ffff00", "#ffbf00", "#ff7f00", "#ff3f00", "#ff0000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientLegend}
              />
            </View>

            <XStack justifyContent="space-between" marginTop={8}>
              <Text style={{ fontSize: 11, color: "#6b7280" }}>Low</Text>
              <Text style={{ fontSize: 11, color: "#6b7280" }}>Medium</Text>
              <Text style={{ fontSize: 11, color: "#6b7280" }}>High</Text>
            </XStack>

            <YStack marginTop={16} gap={10}>
              <XStack alignItems="center" gap={10}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#dc2626",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>3+</Text>
                </View>
                <Text style={{ fontSize: 13, color: "#374151" }}>Hotspot (3+ reports)</Text>
              </XStack>

              <XStack alignItems="center" gap={10}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#ef4444",
                  }}
                />
                <Text style={{ fontSize: 13, color: "#374151" }}>Pending Report</Text>
              </XStack>

              <XStack alignItems="center" gap={10}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#10b981",
                  }}
                />
                <Text style={{ fontSize: 13, color: "#374151" }}>Collected</Text>
              </XStack>
            </YStack>
          </YStack>
        </Animated.View>
      </View>
    </Theme>
  )
}

const styles = StyleSheet.create({
  topControls: {
    position: "absolute",
    top: 60,
    right: 16,
    gap: 12,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_MAX_HEIGHT + 100,
    backgroundColor: "#f0fdf4",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
    overflow: "hidden",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#22c55e",
    borderRadius: 2,
    opacity: 0.5,
  },
  callout: {
    padding: 10,
    maxWidth: 200,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: "#166534",
  },
  calloutStatus: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  calloutLocation: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  calloutWeight: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  calloutDate: {
    fontSize: 10,
    color: "#9ca3af",
  },
  gradientLegendContainer: {
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  gradientLegend: {
    flex: 1,
    height: "100%",
  },
})
