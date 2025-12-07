"use client"

import React, { useEffect, useRef } from "react"
import { useUser } from "@clerk/clerk-expo"
import { ScrollView, YStack, XStack, Text, Button, H4, Paragraph, Spinner } from "tamagui"
import { Alert, RefreshControl, Animated, Dimensions, Easing } from "react-native"
import { router } from "expo-router"
import {
  fetchHomeStats,
  fetchRecentActivity,
  formatRelativeTime,
  type HomeStats,
  type RecentActivity,
} from "../services/homeService"

const { width, height } = Dimensions.get("window")

const NUM_PARTICLES = 12

const FloatingParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(height + 50)).current
  const translateX = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
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

const AnimatedStatCard = ({
  value,
  label,
  icon,
  iconBg,
  color,
  delay,
}: {
  value: number
  label: string
  icon: string
  iconBg: string
  color: string
  delay: number
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const countAnim = useRef(new Animated.Value(0)).current
  const [displayValue, setDisplayValue] = React.useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start()

      Animated.timing(countAnim, {
        toValue: value,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()

      countAnim.addListener(({ value: v }) => {
        setDisplayValue(Math.floor(v))
      })
    }, delay)

    return () => {
      clearTimeout(timeout)
      countAnim.removeAllListeners()
    }
  }, [value])

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <YStack alignItems="center">
        <YStack
          width={60}
          height={60}
          borderRadius={30}
          backgroundColor={iconBg}
          alignItems="center"
          justifyContent="center"
          marginBottom={8}
        >
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </YStack>
        <Text style={{ fontSize: 28, fontWeight: "bold", color }}>{displayValue}</Text>
        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</Text>
      </YStack>
    </Animated.View>
  )
}

const AnimatedActionButton = ({
  icon,
  label,
  color,
  onPress,
  delay,
}: {
  icon: string
  label: string
  color: string
  onPress: () => void
  delay: number
}) => {
  const slideAnim = useRef(new Animated.Value(60)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    }, delay)

    return () => clearTimeout(timeout)
  }, [])

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <Button
        flex={1}
        backgroundColor={color}
        height="$10"
        borderRadius={20}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        shadowColor={color}
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.4}
        shadowRadius={8}
        elevation={4}
      >
        <YStack alignItems="center" gap="$2">
          <Text fontSize="$6">{icon}</Text>
          <Text color="white" fontWeight="bold">
            {label}
          </Text>
        </YStack>
      </Button>
    </Animated.View>
  )
}

const AnimatedActivityCard = ({
  activity,
  index,
  getActivityIcon,
  getActivityColor,
}: {
  activity: RecentActivity
  index: number
  getActivityIcon: (type: string) => string
  getActivityColor: (type: string) => string
}) => {
  const slideAnim = useRef(new Animated.Value(40)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start()
      },
      600 + index * 100,
    )

    return () => clearTimeout(timeout)
  }, [])

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <XStack
        backgroundColor="white"
        padding="$4"
        borderRadius={20}
        alignItems="center"
        gap="$3"
        style={{
          shadowColor: "#22c55e",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <YStack
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor={getActivityColor(activity.type)}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={22}>{getActivityIcon(activity.type)}</Text>
        </YStack>
        <YStack flex={1}>
          <Text color="#1f2937" fontWeight="bold">
            {activity.action}
          </Text>
          <Text color="#6b7280" fontSize="$3">
            {activity.location || activity.amount}
            {activity.wasteType && ` • ${activity.wasteType}`}
          </Text>
        </YStack>
        <Text color="#9ca3af" fontSize="$2">
          {formatRelativeTime(activity.time)}
        </Text>
      </XStack>
    </Animated.View>
  )
}

export default function HomeScreen() {
  const { user } = useUser()
  const [stats, setStats] = React.useState<HomeStats | null>(null)
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const headerSlide = useRef(new Animated.Value(-100)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const statsSlide = useRef(new Animated.Value(50)).current
  const statsOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
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

    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

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

  useEffect(() => {
    if (user) {
      loadHomeData()
    }
  }, [user])

  const loadHomeData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const [statsData, activityData] = await Promise.all([fetchHomeStats(user.id), fetchRecentActivity(user.id)])
      setStats(statsData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error("Error loading home data:", error)
      Alert.alert("Error", "Failed to load dashboard data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadHomeData()
    setRefreshing(false)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "report":
        return "📝"
      case "collect":
        return "✅"
      case "points":
        return "🏆"
      default:
        return "📍"
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "report":
        return "#dbeafe"
      case "collect":
        return "#dcfce7"
      case "points":
        return "#fef3c7"
      default:
        return "#f3f4f6"
    }
  }

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

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

      <ScrollView
        flex={1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        showsVerticalScrollIndicator={false}
      >
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
              fontSize: 14,
              color: "#16a34a",
              marginTop: 4,
            }}
          >
            Welcome back,
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#15803d",
              marginTop: 4,
            }}
          >
            {user?.firstName || "Eco Warrior"}
          </Text>
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
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {isLoading ? (
              <YStack padding="$4" alignItems="center" justifyContent="center">
                <Spinner size="large" color="#22c55e" />
                <Text color="#6b7280" marginTop="$2">
                  Loading stats...
                </Text>
              </YStack>
            ) : (
              <XStack justifyContent="space-around" alignItems="center">
                <AnimatedStatCard
                  value={stats?.totalReports || 0}
                  label="Total Reports"
                  icon="📝"
                  iconBg="#dcfce7"
                  color="#15803d"
                  delay={200}
                />
                <YStack width={1} height={60} backgroundColor="#e5e7eb" />
                <AnimatedStatCard
                  value={stats?.totalCollected || 0}
                  label="Collected"
                  icon="📦"
                  iconBg="#dbeafe"
                  color="#1d4ed8"
                  delay={350}
                />
                <YStack width={1} height={60} backgroundColor="#e5e7eb" />
                <AnimatedStatCard
                  value={stats?.yourPoints || 0}
                  label="Points"
                  icon="⭐"
                  iconBg="#fef3c7"
                  color="#ca8a04"
                  delay={500}
                />
              </XStack>
            )}
          </YStack>
        </Animated.View>

        {/* Quick Actions */}
        <YStack paddingHorizontal={20} gap={16} marginBottom={20}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}>Quick Actions</Text>
          <XStack gap={12}>
            <AnimatedActionButton
              icon="📍"
              label="Report Waste"
              color="#22c55e"
              onPress={() => router.push("/(tabs)/report-waste")}
              delay={400}
            />
            <AnimatedActionButton
              icon="🚛"
              label="Collect Waste"
              color="#3b82f6"
              onPress={() => router.push("/(tabs)/collect-waste")}
              delay={500}
            />
          </XStack>
        </YStack>

        {/* Recent Activity */}
        <YStack paddingHorizontal={20} gap={16} paddingBottom={40}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}>Recent Activity</Text>
          {isLoading ? (
            <YStack
              backgroundColor="white"
              padding="$6"
              borderRadius={24}
              alignItems="center"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Spinner size="small" color="#22c55e" />
            </YStack>
          ) : recentActivity.length === 0 ? (
            <YStack
              backgroundColor="white"
              padding="$8"
              borderRadius={24}
              alignItems="center"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text fontSize={60}>🌱</Text>
              <H4 color="#15803d" marginTop="$3" textAlign="center">
                No Activity Yet
              </H4>
              <Paragraph color="#16a34a" textAlign="center" marginTop="$2">
                Start reporting or collecting e-waste to make an impact!
              </Paragraph>
            </YStack>
          ) : (
            <YStack gap={12}>
              {recentActivity.map((activity, index) => (
                <AnimatedActivityCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  getActivityIcon={getActivityIcon}
                  getActivityColor={getActivityColor}
                />
              ))}
            </YStack>
          )}
        </YStack>

        {/* Points Breakdown */}
        {stats && (stats.reporterPoints > 0 || stats.collectorPoints > 0) && (
          <YStack paddingHorizontal={20} paddingBottom={40} gap={16}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}>Points Breakdown</Text>
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding={20}
              gap={16}
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap={12}>
                  <YStack
                    width={44}
                    height={44}
                    borderRadius={22}
                    backgroundColor="#dcfce7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={20}>📝</Text>
                  </YStack>
                  <Text color="#6b7280" fontWeight="600">
                    Reporter Points
                  </Text>
                </XStack>
                <Text color="#22c55e" fontSize="$5" fontWeight="bold">
                  {stats.reporterPoints}
                </Text>
              </XStack>
              <YStack height={1} backgroundColor="#e5e7eb" />
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap={12}>
                  <YStack
                    width={44}
                    height={44}
                    borderRadius={22}
                    backgroundColor="#dbeafe"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={20}>🚛</Text>
                  </YStack>
                  <Text color="#6b7280" fontWeight="600">
                    Collector Points
                  </Text>
                </XStack>
                <Text color="#3b82f6" fontSize="$5" fontWeight="bold">
                  {stats.collectorPoints}
                </Text>
              </XStack>
            </YStack>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  )
}
