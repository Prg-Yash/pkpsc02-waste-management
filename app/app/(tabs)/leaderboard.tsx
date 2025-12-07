"use client"

import React, { useEffect, useRef } from "react"
import { useUser } from "@clerk/clerk-expo"
import { ScrollView, YStack, XStack, Text, Button, Theme, Spinner, View } from "tamagui"
import { Alert, RefreshControl, Animated, Dimensions, Easing } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import {
  fetchGlobalLeaderboard,
  fetchReportersLeaderboard,
  fetchCollectorsLeaderboard,
  type LeaderboardUser,
} from "../services/leaderboardService"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

type LeaderboardType = "global" | "reporters" | "collectors"

// Floating particle component
const FloatingParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      translateY.setValue(600)
      translateX.setValue(0)
      opacity.setValue(0)
      rotate.setValue(0)

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: Math.random() * 60 - 30,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 5000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate())
    }

    animate()
  }, [])

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  const particles = ["🏆", "⭐", "🌿", "♻️", "🎯", "💎"]
  const particle = particles[Math.floor(Math.random() * particles.length)]

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    >
      <Text fontSize={20}>{particle}</Text>
    </Animated.View>
  )
}

// Animated counter hook
const useAnimatedCounter = (targetValue: number, duration = 1500) => {
  const animatedValue = useRef(new Animated.Value(0)).current
  const [displayValue, setDisplayValue] = React.useState(0)

  useEffect(() => {
    animatedValue.setValue(0)
    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value))
    })

    return () => animatedValue.removeListener(listener)
  }, [targetValue])

  return displayValue
}

export default function LeaderboardScreen() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = React.useState<LeaderboardType>("global")
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardUser[]>([])
  const [myData, setMyData] = React.useState<LeaderboardUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  // Animations
  const headerAnim = useRef(new Animated.Value(-100)).current
  const logoScale = useRef(new Animated.Value(0)).current
  const logoRotate = useRef(new Animated.Value(0)).current
  const tabsAnim = useRef(new Animated.Value(50)).current
  const podiumAnim = useRef(new Animated.Value(100)).current
  const myRankAnim = useRef(new Animated.Value(100)).current
  const listAnim = useRef(new Animated.Value(100)).current

  useEffect(() => {
    // Entry animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(tabsAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    // Continuous logo animation
    const spinAnimation = Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    spinAnimation.start()

    return () => spinAnimation.stop()
  }, [])

  useEffect(() => {
    if (!isLoading && leaderboardData.length > 0) {
      podiumAnim.setValue(100)
      myRankAnim.setValue(100)
      listAnim.setValue(100)

      Animated.stagger(150, [
        Animated.spring(podiumAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(myRankAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(listAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isLoading, leaderboardData])

  React.useEffect(() => {
    if (user) {
      loadLeaderboard()
    }
  }, [user, activeTab])

  const loadLeaderboard = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      let response

      switch (activeTab) {
        case "reporters":
          response = await fetchReportersLeaderboard(user.id)
          break
        case "collectors":
          response = await fetchCollectorsLeaderboard(user.id)
          break
        default:
          response = await fetchGlobalLeaderboard(user.id)
      }

      setLeaderboardData(response.leaderboard)
      setMyData(response.me)
      console.log(`Loaded ${activeTab} leaderboard:`, response.leaderboard.length, "users")
    } catch (error) {
      console.error("Error loading leaderboard:", error)
      Alert.alert("Error", "Failed to load leaderboard. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadLeaderboard()
    setRefreshing(false)
  }

  const getPointsForUser = (user: LeaderboardUser): number => {
    if (activeTab === "reporters") return user.reporterPoints || 0
    if (activeTab === "collectors") return user.collectorPoints || 0
    return user.globalPoints || 0
  }

  const getPointsLabel = (): string => {
    if (activeTab === "reporters") return "Reporter Points"
    if (activeTab === "collectors") return "Collector Points"
    return "Total Points"
  }

  const topThree = leaderboardData.slice(0, 3)
  const restOfUsers = leaderboardData.slice(3)

  const achievements = [
    {
      icon: "🌟",
      title: "First Report",
      description: "Submit your first waste report",
    },
    {
      icon: "⚡",
      title: "Quick Collector",
      description: "Collect 10 reports in a day",
    },
    {
      icon: "🎯",
      title: "Accuracy Master",
      description: "100% collection rate",
    },
    { icon: "🌱", title: "Eco Warrior", description: "Earn 1000 points" },
  ]

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Theme name="light">
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Floating Particles */}
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, overflow: "hidden" }}>
          {[...Array(8)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 1000} startX={Math.random() * SCREEN_WIDTH} />
          ))}
        </View>

        <ScrollView
          flex={1}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />}
        >
          {/* Header */}
          <Animated.View
            style={{
              transform: [{ translateY: headerAnim }],
              alignItems: "center",
              paddingTop: 60,
              paddingBottom: 20,
            }}
          >
            {/* Animated Logo */}
            <Animated.View
              style={{
                transform: [{ scale: logoScale }, { rotate: logoSpin }],
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text fontSize={40}>🏆</Text>
              </View>
            </Animated.View>

            <Text fontSize={28} fontWeight="bold" color="#166534">
              Leaderboard
            </Text>
            <Text fontSize={14} color="#16a34a" marginTop={4}>
              Top eco warriors in your community
            </Text>
          </Animated.View>

          {/* Tab Buttons */}
          <Animated.View
            style={{
              transform: [{ translateY: tabsAnim }],
              paddingHorizontal: 16,
              marginBottom: 20,
            }}
          >
            <XStack
              backgroundColor="white"
              borderRadius={24}
              padding={6}
              gap={6}
              shadowColor="#22c55e"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.15}
              shadowRadius={12}
              elevation={4}
            >
              {(["global", "reporters", "collectors"] as LeaderboardType[]).map((tab) => (
                <Button
                  key={tab}
                  flex={1}
                  backgroundColor={activeTab === tab ? "#22c55e" : "transparent"}
                  borderRadius={20}
                  height={44}
                  pressStyle={{ scale: 0.96 }}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    color={activeTab === tab ? "white" : "#6b7280"}
                    fontWeight="600"
                    fontSize={13}
                    textTransform="capitalize"
                  >
                    {tab}
                  </Text>
                </Button>
              ))}
            </XStack>
          </Animated.View>

          {isLoading ? (
            <YStack padding={60} alignItems="center" justifyContent="center">
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                }}
              >
                <Spinner size="large" color="#22c55e" />
              </View>
              <Text color="#166534" marginTop={16} fontWeight="500">
                Loading leaderboard...
              </Text>
            </YStack>
          ) : (
            <>
              {/* Top 3 Podium */}
              {topThree.length >= 3 && (
                <Animated.View
                  style={{
                    transform: [{ translateY: podiumAnim }],
                    opacity: podiumAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: [1, 0],
                    }),
                    paddingHorizontal: 16,
                    marginBottom: 20,
                  }}
                >
                  <XStack justifyContent="center" alignItems="flex-end" gap={12}>
                    {/* Second Place */}
                    <YStack flex={1} alignItems="center">
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text fontSize={24}>🥈</Text>
                      </View>
                      <YStack
                        backgroundColor="white"
                        borderRadius={24}
                        padding={16}
                        width="100%"
                        alignItems="center"
                        shadowColor="#22c55e"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.15}
                        shadowRadius={12}
                        elevation={4}
                      >
                        <Text color="#1f2937" fontWeight="600" marginBottom={4} numberOfLines={1} fontSize={13}>
                          {topThree[1]?.name || "N/A"}
                        </Text>
                        <Text color="#22c55e" fontWeight="bold" fontSize={24}>
                          {getPointsForUser(topThree[1])}
                        </Text>
                        <Text color="#9ca3af" fontSize={11}>
                          points
                        </Text>
                      </YStack>
                    </YStack>

                    {/* First Place */}
                    <YStack flex={1} alignItems="center" marginBottom={20}>
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "#fef3c7",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                          shadowColor: "#f59e0b",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        }}
                      >
                        <Text fontSize={32}>🏆</Text>
                      </View>
                      <YStack
                        backgroundColor="white"
                        borderColor="#22c55e"
                        borderWidth={2}
                        borderRadius={24}
                        padding={16}
                        width="100%"
                        alignItems="center"
                        shadowColor="#22c55e"
                        shadowOffset={{ width: 0, height: 6 }}
                        shadowOpacity={0.25}
                        shadowRadius={16}
                        elevation={6}
                      >
                        <Text color="#1f2937" fontWeight="600" marginBottom={4} numberOfLines={1} fontSize={14}>
                          {topThree[0]?.name || "N/A"}
                        </Text>
                        <Text color="#22c55e" fontWeight="bold" fontSize={32}>
                          {getPointsForUser(topThree[0])}
                        </Text>
                        <Text color="#9ca3af" fontSize={11}>
                          points
                        </Text>
                      </YStack>
                    </YStack>

                    {/* Third Place */}
                    <YStack flex={1} alignItems="center">
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: "#fed7aa",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text fontSize={24}>🥉</Text>
                      </View>
                      <YStack
                        backgroundColor="white"
                        borderRadius={24}
                        padding={16}
                        width="100%"
                        alignItems="center"
                        shadowColor="#22c55e"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.15}
                        shadowRadius={12}
                        elevation={4}
                      >
                        <Text color="#1f2937" fontWeight="600" marginBottom={4} numberOfLines={1} fontSize={13}>
                          {topThree[2]?.name || "N/A"}
                        </Text>
                        <Text color="#22c55e" fontWeight="bold" fontSize={24}>
                          {getPointsForUser(topThree[2])}
                        </Text>
                        <Text color="#9ca3af" fontSize={11}>
                          points
                        </Text>
                      </YStack>
                    </YStack>
                  </XStack>
                </Animated.View>
              )}

              {/* My Rank Card */}
              {myData && (
                <Animated.View
                  style={{
                    transform: [{ translateY: myRankAnim }],
                    opacity: myRankAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: [1, 0],
                    }),
                    paddingHorizontal: 16,
                    marginBottom: 20,
                  }}
                >
                  <XStack
                    backgroundColor="white"
                    borderColor="#22c55e"
                    borderWidth={2}
                    borderRadius={24}
                    padding={16}
                    alignItems="center"
                    shadowColor="#22c55e"
                    shadowOffset={{ width: 0, height: 6 }}
                    shadowOpacity={0.2}
                    shadowRadius={16}
                    elevation={6}
                  >
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#dcfce7",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text color="#166534" fontWeight="bold" fontSize={18}>
                        {myData.rank}
                      </Text>
                    </View>
                    <YStack flex={1}>
                      <Text color="#166534" fontWeight="bold" marginBottom={2} fontSize={16}>
                        You - {myData.name}
                      </Text>
                      <Text color="#6b7280" fontSize={12}>
                        {getPointsLabel()}
                      </Text>
                    </YStack>
                    <YStack alignItems="flex-end">
                      <Text color="#22c55e" fontWeight="bold" fontSize={24}>
                        {getPointsForUser(myData)}
                      </Text>
                      <Text color="#9ca3af" fontSize={11}>
                        pts
                      </Text>
                    </YStack>
                  </XStack>
                </Animated.View>
              )}

              {/* Rest of Leaderboard */}
              <Animated.View
                style={{
                  transform: [{ translateY: listAnim }],
                  opacity: listAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 0],
                  }),
                  paddingHorizontal: 16,
                }}
              >
                <YStack gap={12}>
                  {restOfUsers.length === 0 ? (
                    <YStack
                      padding={40}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="white"
                      borderRadius={24}
                      shadowColor="#22c55e"
                      shadowOffset={{ width: 0, height: 4 }}
                      shadowOpacity={0.15}
                      shadowRadius={12}
                      elevation={4}
                    >
                      <Text fontSize={60}>🏆</Text>
                      <Text color="#1f2937" fontWeight="bold" marginTop={12} textAlign="center" fontSize={18}>
                        No More Users
                      </Text>
                      <Text color="#6b7280" textAlign="center" marginTop={8}>
                        You're viewing the top users
                      </Text>
                    </YStack>
                  ) : (
                    restOfUsers.map((userData, index) => {
                      const isCurrentUser = userData.id === myData?.id
                      return (
                        <XStack
                          key={userData.id}
                          backgroundColor={isCurrentUser ? "#dcfce7" : "white"}
                          borderColor={isCurrentUser ? "#22c55e" : "transparent"}
                          borderWidth={isCurrentUser ? 2 : 0}
                          borderRadius={24}
                          padding={16}
                          alignItems="center"
                          shadowColor="#22c55e"
                          shadowOffset={{ width: 0, height: 4 }}
                          shadowOpacity={0.1}
                          shadowRadius={12}
                          elevation={3}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: isCurrentUser ? "#bbf7d0" : "#f3f4f6",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <Text color={isCurrentUser ? "#166534" : "#6b7280"} fontWeight="bold">
                              {userData.rank}
                            </Text>
                          </View>
                          <YStack flex={1}>
                            <Text
                              color={isCurrentUser ? "#166534" : "#1f2937"}
                              fontWeight="600"
                              marginBottom={2}
                              numberOfLines={1}
                            >
                              {userData.name}
                            </Text>
                            <Text color="#9ca3af" fontSize={11}>
                              {activeTab === "global" && (
                                <>
                                  {userData.reporterPoints || 0} reported • {userData.collectorPoints || 0} collected
                                </>
                              )}
                              {activeTab === "reporters" && <>{userData.reporterPoints || 0} reporter points</>}
                              {activeTab === "collectors" && (
                                <>
                                  {userData.collectorPoints === null
                                    ? "Not a collector"
                                    : `${userData.collectorPoints} collector points`}
                                </>
                              )}
                            </Text>
                          </YStack>
                          <YStack alignItems="flex-end">
                            <Text color={isCurrentUser ? "#166534" : "#22c55e"} fontWeight="bold" fontSize={20}>
                              {getPointsForUser(userData)}
                            </Text>
                            <Text color="#9ca3af" fontSize={10}>
                              pts
                            </Text>
                          </YStack>
                        </XStack>
                      )
                    })
                  )}
                </YStack>
              </Animated.View>

              {/* Achievements Section */}
              <YStack padding={16} marginTop={8} marginBottom={40}>
                <XStack alignItems="center" marginBottom={16}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#dcfce7",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Text fontSize={18}>🏅</Text>
                  </View>
                  <Text color="#166534" fontWeight="bold" fontSize={20}>
                    Achievements
                  </Text>
                </XStack>
                <XStack flexWrap="wrap" gap={12}>
                  {achievements.map((achievement, index) => (
                    <YStack
                      key={index}
                      width="47%"
                      backgroundColor="white"
                      borderRadius={24}
                      padding={20}
                      alignItems="center"
                      shadowColor="#22c55e"
                      shadowOffset={{ width: 0, height: 4 }}
                      shadowOpacity={0.12}
                      shadowRadius={12}
                      elevation={3}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: "#dcfce7",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text fontSize={28}>{achievement.icon}</Text>
                      </View>
                      <Text color="#1f2937" fontWeight="bold" textAlign="center" marginBottom={4} fontSize={14}>
                        {achievement.title}
                      </Text>
                      <Text color="#9ca3af" fontSize={11} textAlign="center">
                        {achievement.description}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              </YStack>
            </>
          )}
        </ScrollView>
      </View>
    </Theme>
  )
}
