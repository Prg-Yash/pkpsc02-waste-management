import React from "react";
import { YStack, XStack, Text, Button, Avatar, Circle } from "tamagui";
import { useUser } from "@clerk/clerk-expo";
import { router, usePathname } from "expo-router";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Bell } from "@tamagui/lucide-icons";
import { getUnreadCount } from "../services/notificationService";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface AppHeaderProps {
  onNotificationPress: () => void;
}

export default function AppHeader({ onNotificationPress }: AppHeaderProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [location, setLocation] = React.useState<string>("Locating...");
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    getUserLocation();
    if (user) {
      loadUnreadCount();
      // Don't auto-poll - only reload when user opens notifications modal
    }
  }, [user]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation("Permission denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (geocode.length > 0) {
        const { city, region } = geocode[0];
        // Keep it short: City, State code or just City
        setLocation(`${city || "Unknown"}, ${region || ""}`);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocation("Unavailable");
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleProfilePress = () => {
    router.push("/(tabs)/profile");
  };

  const getPageTitle = () => {
    if (pathname.includes("report-waste")) return "Report Waste";
    if (pathname.includes("collect-waste")) return "Collect Waste";
    if (pathname.includes("route-planner")) return "Route Planner";
    if (pathname.includes("leaderboard")) return "Leaderboard";
    if (pathname.includes("profile")) return "Profile";
    return "Home";
  };

  const pageTitle = getPageTitle();
  const isHome = pageTitle === "Home";

  if (!user) return null;

  const themeColors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  return (
    <YStack
      backgroundColor={isDark ? "$background" : "$background"}
      paddingTop={insets.top + 10}
      paddingBottom="$3"
      paddingHorizontal="$4"
      borderBottomWidth={1}
      borderBottomColor={isDark ? "$gray4" : "$gray2"}
      elevation={isDark ? 0 : 2}
      shadowColor="$black"
      shadowOpacity={0.05}
      shadowRadius={10}
      shadowOffset={{ width: 0, height: 4 }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        {/* Left: Location or Page Title */}
        {isHome ? (
          <XStack alignItems="center" gap="$2" flex={1}>
            <YStack
              backgroundColor={isDark ? "$gray4" : "$gray2"}
              padding="$2"
              borderRadius="$10"
            >
              <MapPin size={20} color={themeColors.tint} />
            </YStack>
            <YStack>
              <Text
                color="$gray10"
                fontSize={11}
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Current Location
              </Text>
              <Text
                color="$color"
                fontWeight="700"
                fontSize="$4"
                numberOfLines={1}
              >
                {location}
              </Text>
            </YStack>
          </XStack>
        ) : (
          <Text color="$color" fontWeight="800" fontSize="$6">
            {pageTitle}
          </Text>
        )}

        {/* Right: Actions */}
        <XStack alignItems="center" gap="$3">
          {/* Notification Bell */}
          <Button
            unstyled
            onPress={onNotificationPress}
            position="relative"
            padding="$2"
          >
            <Bell size={24} color={isDark ? "$gray11" : "$gray11"} />
            {unreadCount > 0 && (
              <Circle
                position="absolute"
                top={4}
                right={4}
                size={10}
                backgroundColor="$red10"
                borderWidth={1.5}
                borderColor="$background"
              />
            )}
          </Button>

          {/* Profile Avatar */}
          <Avatar circular size="$3.5" onPress={handleProfilePress}>
            <Avatar.Image src={user.imageUrl} />
            <Avatar.Fallback
              backgroundColor="$gray5"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="$color" fontSize="$3" fontWeight="bold">
                {user.firstName?.charAt(0) ||
                  user.emailAddresses[0].emailAddress.charAt(0)}
              </Text>
            </Avatar.Fallback>
          </Avatar>
        </XStack>
      </XStack>
    </YStack>
  );
}
