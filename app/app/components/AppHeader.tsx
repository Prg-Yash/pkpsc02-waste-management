"use client"

import React from "react"
import { YStack, XStack, Text, Button, Avatar, Circle } from "tamagui"
import { useUser } from "@clerk/clerk-expo"
import { router, usePathname } from "expo-router"
import * as Location from "expo-location"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { MapPin, Bell } from "@tamagui/lucide-icons"
import { getUnreadCount } from "../services/notificationService"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated"

interface AppHeaderProps {
  onNotificationPress: () => void
}

export default function AppHeader({ onNotificationPress }: AppHeaderProps) {
  const { user } = useUser()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const [location, setLocation] = React.useState<string>("Locating...")
  const [unreadCount, setUnreadCount] = React.useState(0)

  // Animations
  const bellScale = useSharedValue(1)
  const bellRotation = useSharedValue(0)
  const avatarScale = useSharedValue(1)
  const locationPulse = useSharedValue(1)

  React.useEffect(() => {
    getUserLocation()
    if (user) {
      loadUnreadCount()
    }

    // Bell wiggle animation when there are unread notifications
    if (unreadCount > 0) {
      bellRotation.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(0, { duration: 100 }),
        ),
        -1,
        false,
      )
    }

    // Location pulse animation
    locationPulse.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    )
  }, [user, unreadCount])

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setLocation("Permission denied")
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      })

      if (geocode.length > 0) {
        const { city, region } = geocode[0]
        setLocation(`${city || "Unknown"}, ${region || ""}`)
      }
    } catch (error) {
      console.error("Error getting location:", error)
      setLocation("Unavailable")
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return
    try {
      const count = await getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const handleProfilePress = () => {
    avatarScale.value = withSequence(withSpring(0.9), withSpring(1))
    router.push("/(tabs)/profile")
  }

  const handleNotificationPressWithAnimation = () => {
    bellScale.value = withSequence(withSpring(0.8), withSpring(1.2), withSpring(1))
    onNotificationPress()
  }

  const getPageTitle = () => {
    if (pathname.includes("report-waste")) return "Report Waste"
    if (pathname.includes("collect-waste")) return "Collect Waste"
    if (pathname.includes("route-planner")) return "Route Planner"
    if (pathname.includes("leaderboard")) return "Leaderboard"
    if (pathname.includes("profile")) return "Profile"
    if (pathname.includes("heatmap")) return "Heatmap"
    return "Home"
  }

  const pageTitle = getPageTitle()
  const isHome = pageTitle === "Home"

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }, { rotate: `${bellRotation.value}deg` }],
  }))

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }))

  const locationIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: locationPulse.value }],
  }))

  if (!user) return null

  const themeColors = Colors[colorScheme ?? "light"]
  const isDark = colorScheme === "dark"

  return (
    <LinearGradient
      colors={["#dcfce7", "#bbf7d0", "#86efac"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Animated.View entering={SlideInDown.duration(500).springify()}>
        <XStack justifyContent="space-between" alignItems="center">
          {/* Left: Location or Page Title */}
          {isHome ? (
            <XStack alignItems="center" gap="$3" flex={1}>
              <Animated.View style={locationIconStyle}>
                <YStack
                  backgroundColor="white"
                  padding="$2.5"
                  borderRadius={50}
                  shadowColor="#22c55e"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.3}
                  shadowRadius={4}
                  elevation={4}
                >
                  <MapPin size={22} color="#16a34a" />
                </YStack>
              </Animated.View>
              <YStack>
                <Text
                  color="#166534"
                  fontSize={11}
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  opacity={0.8}
                >
                  Current Location
                </Text>
                <Text color="#14532d" fontWeight="800" fontSize="$4" numberOfLines={1}>
                  {location}
                </Text>
              </YStack>
            </XStack>
          ) : (
            <Animated.View entering={FadeIn.duration(300)}>
              <XStack alignItems="center" gap="$2">
                <YStack
                  backgroundColor="white"
                  padding="$2"
                  borderRadius={50}
                  shadowColor="#22c55e"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.2}
                  shadowRadius={4}
                >
                  <Text fontSize={18}>
                    {pageTitle === "Report Waste" && "📝"}
                    {pageTitle === "Collect Waste" && "♻️"}
                    {pageTitle === "Route Planner" && "🗺️"}
                    {pageTitle === "Leaderboard" && "🏆"}
                    {pageTitle === "Profile" && "👤"}
                    {pageTitle === "Heatmap" && "🔥"}
                  </Text>
                </YStack>
                <Text color="#14532d" fontWeight="800" fontSize="$6">
                  {pageTitle}
                </Text>
              </XStack>
            </Animated.View>
          )}

          {/* Right: Actions */}
          <XStack alignItems="center" gap="$3">
            {/* Notification Bell */}
            <Animated.View style={bellAnimatedStyle}>
              <Button
                unstyled
                onPress={handleNotificationPressWithAnimation}
                backgroundColor="white"
                padding="$2.5"
                borderRadius={50}
                shadowColor="#22c55e"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.3}
                shadowRadius={4}
                elevation={4}
                position="relative"
              >
                <Bell size={22} color="#16a34a" />
                {unreadCount > 0 && (
                  <Circle
                    position="absolute"
                    top={-2}
                    right={-2}
                    size={18}
                    backgroundColor="#ef4444"
                    borderWidth={2}
                    borderColor="white"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="white" fontSize={10} fontWeight="bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </Circle>
                )}
              </Button>
            </Animated.View>

            {/* Profile Avatar */}
            <Animated.View style={avatarAnimatedStyle}>
              <Avatar
                circular
                size="$4"
                onPress={handleProfilePress}
                borderWidth={3}
                borderColor="white"
                shadowColor="#22c55e"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.3}
                shadowRadius={4}
                elevation={4}
              >
                <Avatar.Image src={user.imageUrl} />
                <Avatar.Fallback backgroundColor="#22c55e" alignItems="center" justifyContent="center">
                  <Text color="white" fontSize="$3" fontWeight="bold">
                    {user.firstName?.charAt(0) || user.emailAddresses[0].emailAddress.charAt(0)}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
            </Animated.View>
          </XStack>
        </XStack>
      </Animated.View>
    </LinearGradient>
  )
}
