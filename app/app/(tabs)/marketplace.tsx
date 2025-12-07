"use client"

import { useUser } from "@clerk/clerk-expo"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useEffect, useRef } from "react"
import { Alert, Animated, Dimensions, Easing, RefreshControl, StyleSheet } from "react-native"
import { Button, H2, Image, ScrollView, Spinner, Text, Theme, XStack, YStack } from "tamagui"
import {
  calculateTimeRemaining,
  formatTimeRemaining,
  getMarketplaceListings,
  type MarketplaceListing,
} from "../services/marketplaceService"

const { width, height } = Dimensions.get("window")

// Floating particle component
const FloatingParticle = ({ delay, startX, emoji }: { delay: number; startX: number; emoji: string }) => {
  const translateY = useRef(new Animated.Value(height)).current
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height)
      opacity.setValue(0)
      rotate.setValue(0)

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 15000 + Math.random() * 10000,
          easing: Easing.linear,
          useNativeDriver: true,
          delay,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 12000,
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
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
          delay,
        }),
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 30,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(translateX, {
            toValue: -30,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
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
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
        ],
      }}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  )
}

export default function MarketplaceScreen() {
  const { user } = useUser()
  const [listings, setListings] = React.useState<MarketplaceListing[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<string>("endTime")

  // Animations
  const headerSlide = useRef(new Animated.Value(-100)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const logoSpin = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const buttonSlide = useRef(new Animated.Value(50)).current
  const buttonOpacity = useRef(new Animated.Value(0)).current
  const filtersSlide = useRef(new Animated.Value(50)).current
  const filtersOpacity = useRef(new Animated.Value(0)).current
  const cardAnimations = useRef<Animated.Value[]>([]).current
  const cardOpacities = useRef<Animated.Value[]>([]).current

  useEffect(() => {
    if (user) {
      loadListings()
    }
  }, [user, sortBy])

  useEffect(() => {
    // Animate header
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

    // Animate logo
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
        delay: 200,
      }),
      Animated.loop(
        Animated.timing(logoSpin, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ]).start()

    // Animate button
    Animated.parallel([
      Animated.spring(buttonSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
        delay: 300,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start()

    // Animate filters
    Animated.parallel([
      Animated.spring(filtersSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
        delay: 400,
      }),
      Animated.timing(filtersOpacity, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    // Reset card animations when listings change
    listings.forEach((_, index) => {
      if (!cardAnimations[index]) {
        cardAnimations[index] = new Animated.Value(80)
        cardOpacities[index] = new Animated.Value(0)
      }
    })

    // Animate cards
    listings.forEach((_, index) => {
      Animated.parallel([
        Animated.spring(cardAnimations[index], {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
          delay: 500 + index * 100,
        }),
        Animated.timing(cardOpacities[index], {
          toValue: 1,
          duration: 400,
          delay: 500 + index * 100,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }, [listings])

  const loadListings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getMarketplaceListings(user.id, "ACTIVE", sortBy)
      setListings(data)
    } catch (error) {
      console.error("Error loading listings:", error)
      Alert.alert("Error", "Failed to load marketplace listings")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadListings()
    setRefreshing(false)
  }

  const handleListingPress = (listingId: string) => {
    router.push(`/(marketplace)/${listingId}` as any)
  }

  const handleCreateListing = () => {
    router.push("/(marketplace)/create" as any)
  }

  const getWasteTypeColor = (wasteType: string) => {
    const colorMap: { [key: string]: string } = {
      Plastic: "#3b82f6",
      Organic: "#22c55e",
      Metal: "#eab308",
      Glass: "#a855f7",
      Electronic: "#ef4444",
      Paper: "#14b8a6",
      Mixed: "#6b7280",
    }
    return colorMap[wasteType] || "#6b7280"
  }

  const getWasteTypeBgColor = (wasteType: string) => {
    const colorMap: { [key: string]: string } = {
      Plastic: "#dbeafe",
      Organic: "#dcfce7",
      Metal: "#fef9c3",
      Glass: "#f3e8ff",
      Electronic: "#fee2e2",
      Paper: "#ccfbf1",
      Mixed: "#f3f4f6",
    }
    return colorMap[wasteType] || "#f3f4f6"
  }

  const particles = [
    { emoji: "♻️", x: width * 0.1 },
    { emoji: "🛒", x: width * 0.3 },
    { emoji: "📦", x: width * 0.5 },
    { emoji: "💰", x: width * 0.7 },
    { emoji: "🌿", x: width * 0.9 },
    { emoji: "✨", x: width * 0.2 },
    { emoji: "🏷️", x: width * 0.6 },
    { emoji: "🌍", x: width * 0.8 },
  ]

  const logoRotation = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  if (loading) {
    return (
      <Theme name="light">
        <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={styles.container}>
          {particles.map((particle, index) => (
            <FloatingParticle key={index} delay={index * 800} startX={particle.x} emoji={particle.emoji} />
          ))}
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Animated.View
              style={{
                transform: [{ rotate: logoRotation }, { scale: logoScale }],
              }}
            >
              <YStack
                width={100}
                height={100}
                borderRadius={50}
                backgroundColor="white"
                justifyContent="center"
                alignItems="center"
                style={styles.logoShadow}
              >
                <Text style={{ fontSize: 50 }}>🛒</Text>
              </YStack>
            </Animated.View>
            <Spinner size="large" color="#22c55e" marginTop="$6" />
            <Text color="#166534" marginTop="$4" fontWeight="600" fontSize="$5">
              Loading marketplace...
            </Text>
          </YStack>
        </LinearGradient>
      </Theme>
    )
  }

  return (
    <Theme name="light">
      <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={styles.container}>
        {particles.map((particle, index) => (
          <FloatingParticle key={index} delay={index * 800} startX={particle.x} emoji={particle.emoji} />
        ))}

        <ScrollView
          flex={1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#22c55e"
              colors={["#22c55e"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={{
              transform: [{ translateY: headerSlide }],
              opacity: headerOpacity,
            }}
          >
            <LinearGradient
              colors={["#22c55e", "#16a34a", "#166534"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <YStack alignItems="center" paddingTop={60} paddingBottom={30}>
                <Animated.View
                  style={{
                    transform: [{ rotate: logoRotation }, { scale: logoScale }],
                  }}
                >
                  <YStack
                    width={80}
                    height={80}
                    borderRadius={40}
                    backgroundColor="rgba(255,255,255,0.2)"
                    justifyContent="center"
                    alignItems="center"
                    marginBottom="$3"
                  >
                    <Text style={{ fontSize: 40 }}>🛒</Text>
                  </YStack>
                </Animated.View>
                <H2 color="white" fontWeight="bold" textAlign="center">
                  Marketplace
                </H2>
                <Text color="rgba(255,255,255,0.9)" marginTop="$2" fontSize="$4" textAlign="center">
                  Buy and sell recyclable waste
                </Text>
              </YStack>
            </LinearGradient>
          </Animated.View>

          {/* Create Listing Button */}
          <Animated.View
            style={{
              transform: [{ translateY: buttonSlide }],
              opacity: buttonOpacity,
              paddingHorizontal: 20,
              marginTop: -20,
            }}
          >
            <Button
              onPress={handleCreateListing}
              backgroundColor="white"
              height={60}
              borderRadius={24}
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              style={styles.createButton}
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  width={40}
                  height={40}
                  borderRadius={20}
                  backgroundColor="#dcfce7"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text style={{ fontSize: 20 }}>➕</Text>
                </YStack>
                <Text color="#166534" fontWeight="700" fontSize="$5">
                  Create New Listing
                </Text>
              </XStack>
            </Button>
          </Animated.View>

          {/* Sort Options */}
          <Animated.View
            style={{
              transform: [{ translateY: filtersSlide }],
              opacity: filtersOpacity,
            }}
          >
            <XStack paddingHorizontal={20} paddingTop={20} gap="$2" flexWrap="wrap">
              {[
                { key: "endTime", label: "Ending Soon", icon: "⏰" },
                { key: "price", label: "Highest Price", icon: "💰" },
                { key: "newest", label: "Newest", icon: "✨" },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  onPress={() => setSortBy(filter.key)}
                  backgroundColor={sortBy === filter.key ? "#22c55e" : "white"}
                  borderRadius={20}
                  paddingHorizontal="$4"
                  height={40}
                  pressStyle={{ scale: 0.95 }}
                  style={sortBy === filter.key ? styles.activeFilter : styles.inactiveFilter}
                >
                  <XStack alignItems="center" gap="$2">
                    <Text style={{ fontSize: 14 }}>{filter.icon}</Text>
                    <Text color={sortBy === filter.key ? "white" : "#166534"} fontWeight="600" fontSize="$3">
                      {filter.label}
                    </Text>
                  </XStack>
                </Button>
              ))}
            </XStack>
          </Animated.View>

          {/* Listings */}
          <YStack padding={20} paddingTop={16}>
            {listings.length === 0 ? (
              <Animated.View
                style={{
                  opacity: buttonOpacity,
                  transform: [{ translateY: buttonSlide }],
                }}
              >
                <YStack
                  backgroundColor="white"
                  borderRadius={24}
                  padding="$6"
                  alignItems="center"
                  style={styles.emptyCard}
                >
                  <YStack
                    width={100}
                    height={100}
                    borderRadius={50}
                    backgroundColor="#dcfce7"
                    justifyContent="center"
                    alignItems="center"
                    marginBottom="$4"
                  >
                    <Text style={{ fontSize: 50 }}>📦</Text>
                  </YStack>
                  <Text color="#166534" fontWeight="700" fontSize="$6" textAlign="center">
                    No Active Listings
                  </Text>
                  <Text color="#6b7280" textAlign="center" marginTop="$2" fontSize="$4">
                    Be the first to list recyclable waste!
                  </Text>
                  <Button
                    onPress={handleCreateListing}
                    backgroundColor="#22c55e"
                    borderRadius={20}
                    marginTop="$5"
                    height={50}
                    paddingHorizontal="$6"
                    pressStyle={{ scale: 0.95 }}
                  >
                    <XStack alignItems="center" gap="$2">
                      <Text style={{ fontSize: 16 }}>➕</Text>
                      <Text color="white" fontWeight="600" fontSize="$4">
                        Create Listing
                      </Text>
                    </XStack>
                  </Button>
                </YStack>
              </Animated.View>
            ) : (
              listings.map((listing, index) => {
                const timeRemaining = calculateTimeRemaining(listing.auctionEndTime)
                const currentPrice = listing.highestBid || listing.basePrice

                return (
                  <Animated.View
                    key={listing.id}
                    style={{
                      transform: [{ translateY: cardAnimations[index] || new Animated.Value(0) }],
                      opacity: cardOpacities[index] || new Animated.Value(1),
                      marginBottom: 16,
                    }}
                  >
                    <YStack
                      backgroundColor="white"
                      borderRadius={24}
                      padding="$4"
                      style={styles.listingCard}
                      pressStyle={{ opacity: 0.9, scale: 0.98 }}
                      onPress={() => handleListingPress(listing.id)}
                    >
                      {/* Image */}
                      {Array.isArray(listing.images) && listing.images.length > 0 && (
                        <YStack borderRadius={20} overflow="hidden" marginBottom="$3">
                          <Image source={{ uri: listing.images[0] }} width="100%" height={180} />
                          {/* Timer Badge */}
                          <YStack
                            position="absolute"
                            top={12}
                            right={12}
                            backgroundColor={timeRemaining < 60 ? "#ef4444" : "#22c55e"}
                            paddingHorizontal="$3"
                            paddingVertical="$2"
                            borderRadius={16}
                          >
                            <XStack alignItems="center" gap="$1">
                              <Text style={{ fontSize: 12 }}>⏰</Text>
                              <Text color="white" fontWeight="700" fontSize="$2">
                                {formatTimeRemaining(timeRemaining)}
                              </Text>
                            </XStack>
                          </YStack>
                          {/* Your Listing Badge */}
                          {listing.isUserListing && (
                            <YStack
                              position="absolute"
                              top={12}
                              left={12}
                              backgroundColor="#3b82f6"
                              paddingHorizontal="$3"
                              paddingVertical="$2"
                              borderRadius={16}
                            >
                              <Text color="white" fontSize="$2" fontWeight="700">
                                Your Listing
                              </Text>
                            </YStack>
                          )}
                        </YStack>
                      )}

                      {/* Waste Type Badge */}
                      <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                        <YStack
                          backgroundColor={getWasteTypeBgColor(listing.wasteType)}
                          paddingHorizontal="$4"
                          paddingVertical="$2"
                          borderRadius={20}
                        >
                          <Text color={getWasteTypeColor(listing.wasteType)} fontWeight="700" fontSize="$4">
                            {listing.wasteType}
                          </Text>
                        </YStack>
                        <YStack backgroundColor="#dcfce7" paddingHorizontal="$3" paddingVertical="$2" borderRadius={16}>
                          <Text color="#166534" fontSize="$2" fontWeight="600">
                            {listing._count?.bids || 0} bids
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Weight & Location */}
                      <XStack gap="$4" marginBottom="$4">
                        <XStack
                          alignItems="center"
                          gap="$2"
                          backgroundColor="#f0fdf4"
                          paddingHorizontal="$3"
                          paddingVertical="$2"
                          borderRadius={12}
                        >
                          <Text style={{ fontSize: 16 }}>⚖️</Text>
                          <Text color="#166534" fontSize="$3" fontWeight="600">
                            {listing.weightKg} kg
                          </Text>
                        </XStack>
                        <XStack
                          alignItems="center"
                          gap="$2"
                          backgroundColor="#f0fdf4"
                          paddingHorizontal="$3"
                          paddingVertical="$2"
                          borderRadius={12}
                          flex={1}
                        >
                          <Text style={{ fontSize: 16 }}>📍</Text>
                          <Text color="#166534" fontSize="$3" fontWeight="600" numberOfLines={1}>
                            {listing.city}, {listing.state}
                          </Text>
                        </XStack>
                      </XStack>

                      {/* Price Section */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                        backgroundColor="#f0fdf4"
                        padding="$4"
                        borderRadius={20}
                        marginBottom="$3"
                      >
                        <YStack>
                          <Text color="#6b7280" fontSize="$2" fontWeight="500">
                            {listing.highestBid ? "Current Bid" : "Starting Price"}
                          </Text>
                          <Text color="#166534" fontWeight="800" fontSize="$8">
                            ₹{currentPrice}
                          </Text>
                        </YStack>
                        <YStack backgroundColor="#22c55e" paddingHorizontal="$4" paddingVertical="$3" borderRadius={16}>
                          <Text color="white" fontWeight="700" fontSize="$3">
                            View Details
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Seller Info */}
                      <XStack backgroundColor="#f9fafb" padding="$3" borderRadius={16} alignItems="center" gap="$3">
                        <YStack
                          width={36}
                          height={36}
                          borderRadius={18}
                          backgroundColor="#dcfce7"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Text style={{ fontSize: 18 }}>👤</Text>
                        </YStack>
                        <Text color="#6b7280" fontSize="$3" fontWeight="500">
                          Seller:{" "}
                          <Text color="#166534" fontWeight="600">
                            {listing.seller.name || "Anonymous"}
                          </Text>
                        </Text>
                      </XStack>
                    </YStack>
                  </Animated.View>
                )
              })
            )}
          </YStack>

          <YStack height={100} />
        </ScrollView>
      </LinearGradient>
    </Theme>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoShadow: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  createButton: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  activeFilter: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inactiveFilter: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCard: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  listingCard: {
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
})
