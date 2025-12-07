"use client"

import { useUser } from "@clerk/clerk-expo"
import { Camera, CameraView } from "expo-camera"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import React from "react"
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { Image, Input, ScrollView, Separator, Spinner, Text, XStack, YStack } from "tamagui"
import {
  calculateTimeRemaining,
  closeBid,
  formatTimeRemaining,
  getListingDetails,
  placeBid,
  verifyQRCode,
  type Bid,
  type MarketplaceListing,
} from "../services/marketplaceService"

const { width } = Dimensions.get("window")

// Floating particle component
const FloatingParticle = ({ delay, startX, emoji }: { delay: number; startX: number; emoji: string }) => {
  const translateY = React.useRef(new Animated.Value(0)).current
  const translateX = React.useRef(new Animated.Value(0)).current
  const opacity = React.useRef(new Animated.Value(0)).current
  const rotate = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
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
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: 30,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: -30,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]),
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
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  )
}

export default function ListingDetailsScreen() {
  const { user } = useUser()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [listing, setListing] = React.useState<MarketplaceListing | null>(null)
  const [bids, setBids] = React.useState<Bid[]>([])
  const [loading, setLoading] = React.useState(true)
  const [bidModalVisible, setBidModalVisible] = React.useState(false)
  const [qrModalVisible, setQrModalVisible] = React.useState(false)
  const [bidAmount, setBidAmount] = React.useState("")
  const [qrCode, setQrCode] = React.useState("")
  const [submittingBid, setSubmittingBid] = React.useState(false)
  const [verifyingQR, setVerifyingQR] = React.useState(false)
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0)
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null)
  const [scanned, setScanned] = React.useState(false)

  // Animations
  const headerAnim = React.useRef(new Animated.Value(-100)).current
  const contentAnim = React.useRef(new Animated.Value(50)).current
  const contentOpacity = React.useRef(new Animated.Value(0)).current
  const logoScale = React.useRef(new Animated.Value(0.5)).current
  const pulseAnim = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    // Animate header sliding down
    Animated.spring(headerAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()

    // Animate content sliding up
    Animated.parallel([
      Animated.spring(contentAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start()

    // Logo scale animation
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start()

    // Pulse animation for price
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    if (user && id) {
      loadListingDetails()
      const interval = setInterval(() => {
        if (listing) {
          const remaining = calculateTimeRemaining(listing.auctionEndTime)
          setTimeRemaining(remaining)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [user, id])

  React.useEffect(() => {
    if (listing) {
      const remaining = calculateTimeRemaining(listing.auctionEndTime)
      setTimeRemaining(remaining)
    }
  }, [listing])

  const loadListingDetails = async () => {
    if (!user || !id) return

    try {
      setLoading(true)
      const data = await getListingDetails(user.id, id)
      setListing(data.listing)
      setBids(data.bids || [])
    } catch (error) {
      console.error("Error loading listing details:", error)
      Alert.alert("Error", "Failed to load listing details")
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceBid = async () => {
    if (!user || !listing || !bidAmount) return

    const amount = Number.parseFloat(bidAmount)
    const currentPrice = listing.highestBid || listing.basePrice
    const minimumBid = currentPrice + 5

    if (isNaN(amount)) {
      Alert.alert("Invalid Amount", "Please enter a valid bid amount")
      return
    }

    if (amount < minimumBid) {
      Alert.alert("Bid Too Low", `Minimum bid is Rs.${minimumBid} (current price + Rs.5)`)
      return
    }

    try {
      setSubmittingBid(true)
      await placeBid(user.id, listing.id, amount)
      Alert.alert("Success", "Your bid has been placed successfully!")
      setBidModalVisible(false)
      setBidAmount("")
      await loadListingDetails()
    } catch (error) {
      console.error("Error placing bid:", error)
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to place bid")
    } finally {
      setSubmittingBid(false)
    }
  }

  const handleCloseBid = async () => {
    if (!user || !listing) return

    Alert.alert(
      "Close Bid Early?",
      `This will end the auction now. The highest bidder (Rs.${listing.highestBid}) will win. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Auction",
          style: "destructive",
          onPress: async () => {
            try {
              await closeBid(user.id, listing.id)
              Alert.alert("Auction Closed!", "The winner has been notified and will contact you for pickup.")
              await loadListingDetails()
            } catch (error) {
              console.error("Error closing bid:", error)
              Alert.alert("Error", error instanceof Error ? error.message : "Failed to close bid")
            }
          },
        },
      ],
    )
  }

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync()
    setHasPermission(status === "granted")
    return status === "granted"
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || !user || !listing) return

    setScanned(true)
    setQrCode(data)

    try {
      setVerifyingQR(true)
      await verifyQRCode(user.id, listing.id, data)
      Alert.alert("Transaction Complete!", "You earned 30 points! The buyer earned 20 points.", [
        {
          text: "OK",
          onPress: () => {
            setQrModalVisible(false)
            setQrCode("")
            setScanned(false)
            loadListingDetails()
          },
        },
      ])
    } catch (error) {
      console.error("Error verifying QR:", error)
      Alert.alert("Verification Failed", error instanceof Error ? error.message : "Invalid QR code", [
        {
          text: "Try Again",
          onPress: () => setScanned(false),
        },
      ])
    } finally {
      setVerifyingQR(false)
    }
  }

  const handleVerifyQR = async () => {
    if (!user || !listing || !qrCode.trim()) {
      Alert.alert("Error", "Please enter the QR code")
      return
    }

    try {
      setVerifyingQR(true)
      await verifyQRCode(user.id, listing.id, qrCode.trim())
      Alert.alert("Transaction Complete!", "You earned 30 points! The buyer earned 20 points.")
      setQrModalVisible(false)
      setQrCode("")
      await loadListingDetails()
    } catch (error) {
      console.error("Error verifying QR:", error)
      Alert.alert("Verification Failed", error instanceof Error ? error.message : "Invalid QR code")
    } finally {
      setVerifyingQR(false)
    }
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`)
  }

  const getWasteTypeColor = (wasteType: string) => {
    const colorMap: { [key: string]: string } = {
      Plastic: "#3b82f6",
      Organic: "#22c55e",
      Metal: "#eab308",
      Glass: "#8b5cf6",
      Electronic: "#ef4444",
      Paper: "#14b8a6",
      Mixed: "#6b7280",
    }
    return colorMap[wasteType] || "#6b7280"
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      ACTIVE: { bg: "#f0fdf4", text: "#166534", label: "🟢 Active" },
      ENDED: { bg: "#fef3c7", text: "#92400e", label: "⏸️ Ended" },
      COMPLETED: { bg: "#dbeafe", text: "#1d4ed8", label: "✅ Completed" },
      CANCELLED: { bg: "#f3f4f6", text: "#374151", label: "❌ Cancelled" },
    }
    return badges[status] || badges.ACTIVE
  }

  const particles = [
    { emoji: "💰", x: width * 0.1 },
    { emoji: "♻️", x: width * 0.3 },
    { emoji: "🏷️", x: width * 0.5 },
    { emoji: "📦", x: width * 0.7 },
    { emoji: "🌱", x: width * 0.9 },
  ]

  if (loading) {
    return (
      <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <YStack
            width={80}
            height={80}
            borderRadius={40}
            backgroundColor="white"
            justifyContent="center"
            alignItems="center"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Spinner size="large" color="#22c55e" />
          </YStack>
          <Text color="#166534" marginTop="$4" fontWeight="600" fontSize={16}>
            Loading listing...
          </Text>
        </YStack>
      </LinearGradient>
    )
  }

  if (!listing) {
    return (
      <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text fontSize={50}>📦</Text>
          <Text color="#166534" fontSize={20} fontWeight="700" marginTop="$3">
            Listing Not Found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: "#22c55e",
              borderRadius: 16,
              padding: 14,
              paddingHorizontal: 28,
              marginTop: 16,
            }}
          >
            <Text color="white" fontWeight="700">
              Go Back
            </Text>
          </TouchableOpacity>
        </YStack>
      </LinearGradient>
    )
  }

  const isOwner = listing.sellerId === user?.id
  const isWinner = listing.winnerId === user?.id
  const isExpired = timeRemaining <= 0
  const canBid = !isOwner && listing.status === "ACTIVE" && !isExpired && user
  const currentPrice = listing.highestBid || listing.basePrice
  const minimumBid = currentPrice + 5
  const statusBadge = getStatusBadge(listing.status)

  return (
    <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={{ flex: 1 }}>
      {/* Floating Particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} delay={i * 1500} startX={p.x} emoji={p.emoji} />
      ))}

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={{ transform: [{ translateY: headerAnim }] }}>
          <YStack paddingHorizontal="$5" paddingTop="$12" paddingBottom="$4">
            <XStack alignItems="center" gap="$3" marginBottom="$3">
              <TouchableOpacity onPress={() => router.back()}>
                <YStack
                  width={44}
                  height={44}
                  borderRadius={22}
                  backgroundColor="white"
                  justifyContent="center"
                  alignItems="center"
                  style={{
                    shadowColor: "#22c55e",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text fontSize={20} color="#166534">
                    ←
                  </Text>
                </YStack>
              </TouchableOpacity>
              <YStack flex={1}>
                <Text fontSize={24} fontWeight="800" color="#166534">
                  Listing Details
                </Text>
              </YStack>
              {isOwner && (
                <YStack
                  backgroundColor="white"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius={16}
                  borderWidth={2}
                  borderColor="#22c55e"
                >
                  <Text color="#22c55e" fontSize={12} fontWeight="700">
                    Your Listing
                  </Text>
                </YStack>
              )}
              {isWinner && (
                <YStack backgroundColor="#22c55e" paddingHorizontal="$3" paddingVertical="$2" borderRadius={16}>
                  <Text color="white" fontSize={12} fontWeight="700">
                    You Won! 🏆
                  </Text>
                </YStack>
              )}
            </XStack>

            {/* Status Badge */}
            <YStack
              backgroundColor={statusBadge.bg}
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderRadius={16}
              alignSelf="flex-start"
            >
              <Text color={statusBadge.text} fontSize={14} fontWeight="700">
                {statusBadge.label}
              </Text>
            </YStack>
          </YStack>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={{
            transform: [{ translateY: contentAnim }],
            opacity: contentOpacity,
            paddingHorizontal: 16,
            paddingBottom: 32,
          }}
        >
          {/* Image Carousel */}
          {listing.images && listing.images.length > 0 && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$4"
              marginBottom="$4"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Image
                source={{ uri: listing.images[selectedImageIndex] }}
                width="100%"
                height={280}
                borderRadius={20}
                backgroundColor="#f0fdf4"
              />
              <XStack gap="$2" justifyContent="center" marginTop="$3" flexWrap="wrap">
                {listing.images.map((_, index) => (
                  <Pressable key={index} onPress={() => setSelectedImageIndex(index)}>
                    <YStack
                      width={12}
                      height={12}
                      borderRadius={6}
                      backgroundColor={index === selectedImageIndex ? "#22c55e" : "#d1d5db"}
                    />
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          )}

          {/* Waste Type & Details */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$4"
            marginBottom="$4"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <XStack alignItems="center" gap="$2" marginBottom="$3">
              <YStack
                backgroundColor={getWasteTypeColor(listing.wasteType)}
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius={16}
              >
                <Text color="white" fontWeight="700" fontSize={16}>
                  {listing.wasteType}
                </Text>
              </YStack>
            </XStack>
            <Text color="#9ca3af" fontSize={12}>
              Listed {new Date(listing.createdAt).toLocaleDateString()}
            </Text>

            <XStack gap="$4" marginTop="$3">
              <XStack alignItems="center" gap="$2">
                <Text fontSize={18}>⚖️</Text>
                <Text color="#166534" fontSize={16} fontWeight="700">
                  {listing.weightKg} kg
                </Text>
              </XStack>
              <XStack alignItems="center" gap="$2">
                <Text fontSize={18}>📍</Text>
                <Text color="#166534" fontSize={16}>
                  {listing.city}, {listing.state}
                </Text>
              </XStack>
            </XStack>
          </YStack>

          {/* Price Card */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$5"
              marginBottom="$4"
              borderWidth={3}
              borderColor="#22c55e"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text color="#6b7280" fontSize={14} marginBottom="$1">
                {listing.highestBid ? "Current Bid" : "Starting Price"}
              </Text>
              <Text color="#22c55e" fontWeight="900" fontSize={42}>
                Rs.{currentPrice}
              </Text>
              {canBid && (
                <Text color="#9ca3af" fontSize={12} marginTop="$1">
                  Minimum next bid: Rs.{minimumBid}
                </Text>
              )}
              {bids.length > 0 && (
                <Text color="#9ca3af" fontSize={12} marginTop="$1">
                  {bids.length} bid{bids.length !== 1 ? "s" : ""} placed
                </Text>
              )}
            </YStack>
          </Animated.View>

          {/* Timer */}
          {listing.status === "ACTIVE" && (
            <YStack
              backgroundColor={isExpired ? "#fef2f2" : "white"}
              borderRadius={24}
              padding="$4"
              marginBottom="$4"
              borderWidth={2}
              borderColor={isExpired ? "#ef4444" : "#22c55e"}
              style={{
                shadowColor: isExpired ? "#ef4444" : "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text color={isExpired ? "#dc2626" : "#166534"} fontSize={14} fontWeight="600">
                    {isExpired ? "Auction Ended" : "Time Remaining"}
                  </Text>
                  <Text color={isExpired ? "#dc2626" : "#166534"} fontSize={28} fontWeight="800" marginTop="$1">
                    {isExpired ? "Ended" : formatTimeRemaining(timeRemaining)}
                  </Text>
                </YStack>
                <Text fontSize={40}>{isExpired ? "🔒" : "⏰"}</Text>
              </XStack>
            </YStack>
          )}

          {/* Description */}
          {listing.description && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$4"
              marginBottom="$4"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$2">
                Description
              </Text>
              <Text color="#6b7280" fontSize={15} lineHeight={24}>
                {listing.description}
              </Text>
            </YStack>
          )}

          {/* Seller Information */}
          <YStack
            backgroundColor="white"
            borderRadius={24}
            padding="$4"
            marginBottom="$4"
            style={{
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$3">
              Seller Information
            </Text>
            <XStack alignItems="center" gap="$2" marginBottom="$2">
              <Text fontSize={20}>👤</Text>
              <Text color="#374151" fontSize={16}>
                {listing.seller.name || "Anonymous"}
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={18}>📍</Text>
              <Text color="#6b7280" fontSize={14}>
                {listing.seller.city}, {listing.seller.state}
              </Text>
            </XStack>

            {/* Contact Info for Winner */}
            {isWinner && listing.status !== "ACTIVE" && (
              <>
                <Separator marginVertical="$3" borderColor="#e5e7eb" />
                <Text color="#22c55e" fontSize={14} fontWeight="700" marginBottom="$2">
                  Contact Seller for Pickup:
                </Text>
                {listing.seller.phone && (
                  <TouchableOpacity
                    onPress={() => handleCall(listing.seller.phone!)}
                    style={{
                      backgroundColor: "#22c55e",
                      borderRadius: 16,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text fontSize={16}>📞</Text>
                    <Text color="white" fontWeight="700">
                      Call: {listing.seller.phone}
                    </Text>
                  </TouchableOpacity>
                )}
                {listing.seller.email && (
                  <TouchableOpacity
                    onPress={() => handleEmail(listing.seller.email!)}
                    style={{
                      backgroundColor: "#3b82f6",
                      borderRadius: 16,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Text fontSize={16}>✉️</Text>
                    <Text color="white" fontWeight="700">
                      Email: {listing.seller.email}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </YStack>

          {/* Winner Information (for Seller) */}
          {isOwner && listing.winner && listing.status !== "ACTIVE" && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$4"
              marginBottom="$4"
              borderWidth={2}
              borderColor="#22c55e"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$3">
                Winner Information
              </Text>
              <XStack alignItems="center" gap="$2" marginBottom="$2">
                <Text fontSize={20}>🏆</Text>
                <Text color="#166534" fontSize={16} fontWeight="700">
                  {listing.winner.name || "Anonymous"}
                </Text>
              </XStack>
              <Text color="#22c55e" fontSize={14} marginBottom="$3">
                Winning Bid: Rs.{listing.highestBid}
              </Text>

              {listing.winner.phone && (
                <TouchableOpacity
                  onPress={() => handleCall(listing.winner!.phone!)}
                  style={{
                    backgroundColor: "#22c55e",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text fontSize={16}>📞</Text>
                  <Text color="white" fontWeight="700">
                    Call: {listing.winner.phone}
                  </Text>
                </TouchableOpacity>
              )}
              {listing.winner.email && (
                <TouchableOpacity
                  onPress={() => handleEmail(listing.winner!.email!)}
                  style={{
                    backgroundColor: "#22c55e",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Text fontSize={16}>✉️</Text>
                  <Text color="white" fontWeight="700">
                    Email: {listing.winner.email}
                  </Text>
                </TouchableOpacity>
              )}
            </YStack>
          )}

          {/* QR Code Display for Winner */}
          {isWinner && listing.status === "ENDED" && listing.verificationCode && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$5"
              marginBottom="$4"
              borderWidth={3}
              borderColor="#22c55e"
              alignItems="center"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text color="#166534" fontSize={20} fontWeight="800" marginBottom="$2">
                Your QR Code
              </Text>
              <YStack backgroundColor="#f0fdf4" padding="$4" borderRadius={16} marginBottom="$2">
                <Text color="#166534" fontSize={36} fontWeight="900" letterSpacing={4}>
                  {listing.verificationCode}
                </Text>
              </YStack>
              <Text color="#6b7280" fontSize={14} textAlign="center">
                Show this code to the seller during pickup
              </Text>
            </YStack>
          )}

          {/* Action Buttons */}
          <YStack gap="$3">
            {/* Place Bid */}
            {canBid && (
              <TouchableOpacity
                onPress={() => setBidModalVisible(true)}
                style={{
                  backgroundColor: "#22c55e",
                  borderRadius: 24,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text fontSize={20}>💰</Text>
                <Text color="white" fontWeight="800" fontSize={18}>
                  Place Bid
                </Text>
              </TouchableOpacity>
            )}

            {/* Close Bid Early */}
            {isOwner && listing.status === "ACTIVE" && bids.length > 0 && (
              <TouchableOpacity
                onPress={handleCloseBid}
                style={{
                  backgroundColor: "#f59e0b",
                  borderRadius: 24,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#f59e0b",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text fontSize={20}>🔒</Text>
                <Text color="white" fontWeight="800" fontSize={18}>
                  Close Auction Early
                </Text>
              </TouchableOpacity>
            )}

            {/* Verify QR Code */}
            {isOwner && listing.status === "ENDED" && listing.winner && (
              <TouchableOpacity
                onPress={async () => {
                  const granted = await requestCameraPermission()
                  if (granted) {
                    setQrModalVisible(true)
                  } else {
                    Alert.alert("Camera Permission Required", "Please enable camera access to scan QR codes.")
                  }
                }}
                style={{
                  backgroundColor: "#8b5cf6",
                  borderRadius: 24,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#8b5cf6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text fontSize={20}>📱</Text>
                <Text color="white" fontWeight="800" fontSize={18}>
                  Verify Winner's QR Code
                </Text>
              </TouchableOpacity>
            )}

            {/* Completed Badge */}
            {listing.status === "COMPLETED" && (
              <YStack
                backgroundColor="white"
                padding="$5"
                borderRadius={24}
                borderWidth={2}
                borderColor="#22c55e"
                alignItems="center"
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text fontSize={40}>🎉</Text>
                <Text color="#166534" fontSize={20} fontWeight="800" marginTop="$2">
                  Transaction Completed!
                </Text>
                {isOwner && (
                  <Text color="#22c55e" fontSize={14} marginTop="$2">
                    You earned 30 points
                  </Text>
                )}
                {isWinner && (
                  <Text color="#22c55e" fontSize={14} marginTop="$2">
                    You earned 20 points
                  </Text>
                )}
              </YStack>
            )}
          </YStack>

          {/* Bid History */}
          {bids.length > 0 && (
            <YStack
              backgroundColor="white"
              borderRadius={24}
              padding="$4"
              marginTop="$4"
              style={{
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text fontWeight="700" color="#166534" fontSize={18} marginBottom="$3">
                Bid History
              </Text>
              {bids.map((bid, index) => (
                <XStack
                  key={bid.id}
                  backgroundColor={index === 0 ? "#f0fdf4" : "#f9fafb"}
                  borderRadius={16}
                  padding="$3"
                  marginBottom="$2"
                  borderLeftWidth={4}
                  borderLeftColor={index === 0 ? "#22c55e" : "#d1d5db"}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <YStack>
                    <Text color={index === 0 ? "#166534" : "#374151"} fontSize={14} fontWeight="700">
                      {bid.bidder.name || "Anonymous"}
                      {index === 0 && " 🏆"}
                    </Text>
                    <Text color="#9ca3af" fontSize={12}>
                      {new Date(bid.createdAt).toLocaleString()}
                    </Text>
                  </YStack>
                  <Text color={index === 0 ? "#22c55e" : "#374151"} fontSize={18} fontWeight="800">
                    Rs.{bid.amount}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
        </Animated.View>
      </ScrollView>

      {/* Place Bid Modal */}
      <Modal
        visible={bidModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBidModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setBidModalVisible(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <YStack backgroundColor="white" borderTopLeftRadius={32} borderTopRightRadius={32} padding="$5" gap="$4">
              <YStack
                width={40}
                height={4}
                backgroundColor="#d1d5db"
                borderRadius={2}
                alignSelf="center"
                marginBottom="$2"
              />
              <Text fontSize={22} fontWeight="800" color="#166534">
                Place Your Bid
              </Text>
              <YStack gap="$2">
                <Text color="#6b7280" fontSize={14}>
                  Minimum Bid: Rs.{minimumBid}
                </Text>
                <Input
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder="Enter bid amount"
                  keyboardType="decimal-pad"
                  size="$5"
                  fontSize={24}
                  fontWeight="700"
                  backgroundColor="#f0fdf4"
                  borderWidth={2}
                  borderColor="#22c55e"
                  borderRadius={16}
                  color="#166534"
                />
              </YStack>
              <XStack gap="$3">
                <TouchableOpacity
                  onPress={() => setBidModalVisible(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#f3f4f6",
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text color="#6b7280" fontWeight="700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePlaceBid}
                  disabled={submittingBid}
                  style={{
                    flex: 1,
                    backgroundColor: submittingBid ? "#d1d5db" : "#22c55e",
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {submittingBid && <Spinner color="white" size="small" />}
                  <Text color="white" fontWeight="700">
                    {submittingBid ? "Placing..." : "Place Bid"}
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>

      {/* QR Verification Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setQrModalVisible(false)
          setScanned(false)
        }}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          {hasPermission === null ? (
            <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="black">
              <Spinner size="large" color="white" />
              <Text color="white" marginTop="$4">
                Requesting camera permission...
              </Text>
            </YStack>
          ) : hasPermission === false ? (
            <YStack flex={1} justifyContent="center" alignItems="center" padding="$5" backgroundColor="black">
              <Text color="white" fontSize={24} fontWeight="700" textAlign="center" marginBottom="$4">
                📷 Camera Permission Required
              </Text>
              <Text color="#9ca3af" fontSize={16} textAlign="center" marginBottom="$6">
                We need camera access to scan the winner's QR code. Please grant permission in your device settings.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  const granted = await requestCameraPermission()
                  if (!granted) {
                    Alert.alert(
                      "Permission Denied",
                      "Please enable camera access in your device settings to scan QR codes.",
                    )
                  }
                }}
                style={{
                  backgroundColor: "#22c55e",
                  borderRadius: 16,
                  padding: 16,
                  paddingHorizontal: 32,
                  marginBottom: 12,
                }}
              >
                <Text color="white" fontWeight="700">
                  Grant Permission
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setQrModalVisible(false)
                  setScanned(false)
                }}
                style={{
                  backgroundColor: "#374151",
                  borderRadius: 16,
                  padding: 16,
                  paddingHorizontal: 32,
                }}
              >
                <Text color="white" fontWeight="700">
                  Cancel
                </Text>
              </TouchableOpacity>
            </YStack>
          ) : (
            <YStack flex={1}>
              <View style={{ flex: 1 }}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                />

                <YStack flex={1} justifyContent="space-between">
                  {/* Header */}
                  <YStack backgroundColor="rgba(0,0,0,0.7)" padding="$4" gap="$2">
                    <Text color="white" fontSize={20} fontWeight="700">
                      Scan Winner's QR Code
                    </Text>
                    <Text color="#9ca3af" fontSize={14}>
                      Position the QR code within the frame
                    </Text>
                  </YStack>

                  {/* Center Frame */}
                  <YStack flex={1} justifyContent="center" alignItems="center">
                    <View
                      style={{
                        width: 250,
                        height: 250,
                        borderWidth: 3,
                        borderColor: scanned ? "#22c55e" : "white",
                        borderRadius: 24,
                        backgroundColor: "transparent",
                      }}
                    >
                      {scanned && (
                        <YStack flex={1} justifyContent="center" alignItems="center">
                          <Text color="#22c55e" fontSize={48} fontWeight="700">
                            ✓
                          </Text>
                          <Text color="white" fontSize={16} marginTop="$2">
                            Verifying...
                          </Text>
                        </YStack>
                      )}
                    </View>
                  </YStack>

                  {/* Footer */}
                  <YStack backgroundColor="rgba(0,0,0,0.7)" padding="$5" gap="$3">
                    <YStack
                      backgroundColor="rgba(34, 197, 94, 0.2)"
                      padding="$3"
                      borderRadius={16}
                      borderWidth={1}
                      borderColor="rgba(34, 197, 94, 0.5)"
                    >
                      <Text color="white" fontSize={12} textAlign="center">
                        💡 After verification, you'll earn 30 points and the buyer will earn 20 points!
                      </Text>
                    </YStack>
                    <XStack gap="$3">
                      <TouchableOpacity
                        onPress={() => {
                          setQrModalVisible(false)
                          setScanned(false)
                        }}
                        disabled={verifyingQR}
                        style={{
                          flex: 1,
                          backgroundColor: "#374151",
                          borderRadius: 16,
                          padding: 16,
                          alignItems: "center",
                        }}
                      >
                        <Text color="white" fontWeight="700">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      {scanned && (
                        <TouchableOpacity
                          onPress={() => setScanned(false)}
                          disabled={verifyingQR}
                          style={{
                            flex: 1,
                            backgroundColor: "#f59e0b",
                            borderRadius: 16,
                            padding: 16,
                            alignItems: "center",
                          }}
                        >
                          <Text color="white" fontWeight="700">
                            Scan Again
                          </Text>
                        </TouchableOpacity>
                      )}
                    </XStack>
                  </YStack>
                </YStack>
              </View>
            </YStack>
          )}
        </View>
      </Modal>
    </LinearGradient>
  )
}
