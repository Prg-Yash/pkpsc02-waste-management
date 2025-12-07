"use client"

import { useAuth } from "@clerk/clerk-expo"
import { Redirect, Tabs } from "expo-router"
import React from "react"
import { Platform, StyleSheet, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { HapticTab } from "@/components/haptic-tab"
import { Flame, Home, Navigation, Package, PlusCircle, ShoppingCart, Trophy } from "@tamagui/lucide-icons"
import AppHeader from "../components/AppHeader"
import NotificationsModal from "../components/NotificationsModal"

// Custom animated tab icon component
function AnimatedTabIcon({
  Icon,
  focused,
}: {
  Icon: any
  focused: boolean
}) {
  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.2, { damping: 12, stiffness: 200 })
      translateY.value = withSpring(-4, { damping: 12, stiffness: 200 })
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 })
      translateY.value = withSpring(0, { damping: 12, stiffness: 200 })
    }
  }, [focused])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }))

  const iconColor = focused ? "#16a34a" : "#6b7280"

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Icon size={24} color={iconColor} strokeWidth={2.5} />
      </View>
    </Animated.View>
  )
}

export default function TabLayout() {
  const { isSignedIn } = useAuth()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  const handleNotificationUpdate = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#16a34a",
          tabBarInactiveTintColor: "#6b7280",
          headerShown: true,
          header: () => <AppHeader key={refreshKey} onNotificationPress={() => setShowNotifications(true)} />,
          tabBarButton: HapticTab,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Home} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="report-waste"
          options={{
            title: "Report",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={PlusCircle} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="collect-waste"
          options={{
            title: "Collect",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Package} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="route-planner"
          options={{
            title: "Route",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Navigation} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="heatmap"
          options={{
            title: "Heatmap",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Flame} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: "Market",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={ShoppingCart} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Ranks",
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Trophy} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUpdate={handleNotificationUpdate}
      />
    </>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconContainerActive: {
    backgroundColor: "#dcfce7",
  },
})
