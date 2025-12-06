import { Tabs } from "expo-router";
import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AppHeader from "../components/AppHeader";
import NotificationsModal from "../components/NotificationsModal";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isSignedIn } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleNotificationUpdate = () => {
    // Trigger header refresh to update unread count
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: true,
          header: () => (
            <AppHeader
              key={refreshKey}
              onNotificationPress={() => setShowNotifications(true)}
            />
          ),
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
            borderTopWidth: 1,
            borderTopColor: colorScheme === "dark" ? "#333" : "#e5e7eb",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="report-waste"
          options={{
            title: "Report",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="plus.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="collect-waste"
          options={{
            title: "Collect",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="shippingbox.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="route-planner"
          options={{
            title: "Route",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="map.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="heatmap"
          options={{
            title: "Heatmap",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="flame.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Leaderboard",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="trophy.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide from tabs
          }}
        />
      </Tabs>

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUpdate={handleNotificationUpdate}
      />
    </>
  );
}
