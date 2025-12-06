import React from "react";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Button,
  H2,
  H4,
  Theme,
  Spinner,
  Image,
  Input,
  Separator,
} from "tamagui";
import {
  Alert,
  Modal,
  Pressable,
  View,
  Linking,
  StyleSheet,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, CameraView } from "expo-camera";
import {
  getListingDetails,
  placeBid,
  closeBid,
  verifyQRCode,
  MarketplaceListing,
  Bid,
  formatTimeRemaining,
  calculateTimeRemaining,
} from "../services/marketplaceService";

export default function ListingDetailsScreen() {
  const { user } = useUser();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = React.useState<MarketplaceListing | null>(null);
  const [bids, setBids] = React.useState<Bid[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [bidModalVisible, setBidModalVisible] = React.useState(false);
  const [qrModalVisible, setQrModalVisible] = React.useState(false);
  const [bidAmount, setBidAmount] = React.useState("");
  const [qrCode, setQrCode] = React.useState("");
  const [submittingBid, setSubmittingBid] = React.useState(false);
  const [verifyingQR, setVerifyingQR] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(
    null
  );
  const [scanned, setScanned] = React.useState(false);

  React.useEffect(() => {
    if (user && id) {
      loadListingDetails();
      const interval = setInterval(() => {
        if (listing) {
          const remaining = calculateTimeRemaining(listing.auctionEndTime);
          setTimeRemaining(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user, id]);

  React.useEffect(() => {
    if (listing) {
      const remaining = calculateTimeRemaining(listing.auctionEndTime);
      setTimeRemaining(remaining);
    }
  }, [listing]);

  const loadListingDetails = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      const data = await getListingDetails(user.id, id);
      setListing(data.listing);
      setBids(data.bids || []);
    } catch (error) {
      console.error("Error loading listing details:", error);
      Alert.alert("Error", "Failed to load listing details");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user || !listing || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    const currentPrice = listing.highestBid || listing.basePrice;
    const minimumBid = currentPrice + 5;

    if (isNaN(amount)) {
      Alert.alert("Invalid Amount", "Please enter a valid bid amount");
      return;
    }

    if (amount < minimumBid) {
      Alert.alert(
        "Bid Too Low",
        `Minimum bid is ₹${minimumBid} (current price + ₹5)`
      );
      return;
    }

    try {
      setSubmittingBid(true);
      await placeBid(user.id, listing.id, amount);
      Alert.alert("Success", "Your bid has been placed successfully!");
      setBidModalVisible(false);
      setBidAmount("");
      await loadListingDetails();
    } catch (error) {
      console.error("Error placing bid:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to place bid"
      );
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleCloseBid = async () => {
    if (!user || !listing) return;

    Alert.alert(
      "Close Bid Early?",
      `This will end the auction now. The highest bidder (₹${listing.highestBid}) will win. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Auction",
          style: "destructive",
          onPress: async () => {
            try {
              await closeBid(user.id, listing.id);
              Alert.alert(
                "Auction Closed! 🎉",
                "The winner has been notified and will contact you for pickup."
              );
              await loadListingDetails();
            } catch (error) {
              console.error("Error closing bid:", error);
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to close bid"
              );
            }
          },
        },
      ]
    );
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
    return status === "granted";
  };

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || !user || !listing) return;

    setScanned(true);
    setQrCode(data);

    // Auto-verify the scanned QR code
    try {
      setVerifyingQR(true);
      await verifyQRCode(user.id, listing.id, data);
      Alert.alert(
        "Transaction Complete! 🎉",
        "You earned 30 points! The buyer earned 20 points.",
        [
          {
            text: "OK",
            onPress: () => {
              setQrModalVisible(false);
              setQrCode("");
              setScanned(false);
              loadListingDetails();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error verifying QR:", error);
      Alert.alert(
        "Verification Failed",
        error instanceof Error ? error.message : "Invalid QR code",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false),
          },
        ]
      );
    } finally {
      setVerifyingQR(false);
    }
  };

  const handleVerifyQR = async () => {
    if (!user || !listing || !qrCode.trim()) {
      Alert.alert("Error", "Please enter the QR code");
      return;
    }

    try {
      setVerifyingQR(true);
      await verifyQRCode(user.id, listing.id, qrCode.trim());
      Alert.alert(
        "Transaction Complete! 🎉",
        "You earned 30 points! The buyer earned 20 points."
      );
      setQrModalVisible(false);
      setQrCode("");
      await loadListingDetails();
    } catch (error) {
      console.error("Error verifying QR:", error);
      Alert.alert(
        "Verification Failed",
        error instanceof Error ? error.message : "Invalid QR code"
      );
    } finally {
      setVerifyingQR(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getWasteTypeColor = (wasteType: string) => {
    const colorMap: { [key: string]: string } = {
      Plastic: "$blue9",
      Organic: "$green9",
      Metal: "$yellow9",
      Glass: "$purple9",
      Electronic: "$red9",
      Paper: "$teal9",
      Mixed: "$gray9",
    };
    return colorMap[wasteType] || "$gray9";
  };

  const getStatusBadge = (status: string) => {
    const badges: {
      [key: string]: { bg: string; text: string; label: string };
    } = {
      ACTIVE: { bg: "$green2", text: "$green11", label: "🟢 Active" },
      ENDED: { bg: "$orange2", text: "$orange11", label: "⏸️ Ended" },
      COMPLETED: { bg: "$blue2", text: "$blue11", label: "✅ Completed" },
      CANCELLED: { bg: "$red2", text: "$red11", label: "❌ Cancelled" },
    };
    return badges[status] || badges.ACTIVE;
  };

  if (loading) {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="large" color="$blue9" />
          <Text color="$gray11" marginTop="$4" fontWeight="600">
            Loading listing...
          </Text>
        </YStack>
      </Theme>
    );
  }

  if (!listing) {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          backgroundColor="$background"
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text fontSize={50}>📦</Text>
          <H4 color="$gray12" marginTop="$3">
            Listing Not Found
          </H4>
          <Button
            onPress={() => router.back()}
            backgroundColor="$blue9"
            color="white"
            marginTop="$4"
          >
            Go Back
          </Button>
        </YStack>
      </Theme>
    );
  }

  const isOwner = listing.sellerId === user?.id;
  const isWinner = listing.winnerId === user?.id;
  const isExpired = timeRemaining <= 0;
  const canBid = !isOwner && listing.status === "ACTIVE" && !isExpired && user;
  const currentPrice = listing.highestBid || listing.basePrice;
  const minimumBid = currentPrice + 5;
  const statusBadge = getStatusBadge(listing.status);

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack backgroundColor="$green9" padding="$5" paddingTop="$10">
          <XStack alignItems="center" gap="$3" marginBottom="$3">
            <Button
              onPress={() => router.back()}
              size="$3"
              circular
              backgroundColor="rgba(255,255,255,0.2)"
              color="white"
              fontWeight="600"
            >
              ←
            </Button>
            <YStack flex={1}>
              <H2 color="white" fontWeight="bold">
                Listing Details
              </H2>
            </YStack>
          </XStack>

          {/* Status Badge */}
          <YStack
            backgroundColor={statusBadge.bg}
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            alignSelf="flex-start"
          >
            <Text color={statusBadge.text} fontSize="$4" fontWeight="600">
              {statusBadge.label}
            </Text>
          </YStack>
        </YStack>

        {/* Content */}
        <YStack padding="$4" gap="$4">
          {/* Image Carousel */}
          {listing.images && listing.images.length > 0 && (
            <YStack>
              <Image
                source={{ uri: listing.images[selectedImageIndex] }}
                width="100%"
                height={300}
                borderRadius="$4"
                backgroundColor="$gray3"
              />
              <XStack
                gap="$2"
                justifyContent="center"
                marginTop="$2"
                flexWrap="wrap"
              >
                {listing.images.map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                  >
                    <YStack
                      width={10}
                      height={10}
                      borderRadius={5}
                      backgroundColor={
                        index === selectedImageIndex ? "$green9" : "$gray6"
                      }
                    />
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          )}

          {/* Title & Owner Badge */}
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1}>
              <XStack alignItems="center" gap="$2">
                <YStack
                  backgroundColor={getWasteTypeColor(listing.wasteType)}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                >
                  <Text color="white" fontWeight="600" fontSize="$3">
                    {listing.wasteType}
                  </Text>
                </YStack>
              </XStack>
              <Text color="$gray10" fontSize="$2" marginTop="$2">
                Listed {new Date(listing.createdAt).toLocaleDateString()}
              </Text>
            </YStack>
            {isOwner && (
              <YStack
                backgroundColor="$blue2"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
              >
                <Text color="$blue10" fontSize="$3" fontWeight="600">
                  Your Listing
                </Text>
              </YStack>
            )}
            {isWinner && (
              <YStack
                backgroundColor="$green2"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
              >
                <Text color="$green10" fontSize="$3" fontWeight="600">
                  You Won! 🏆
                </Text>
              </YStack>
            )}
          </XStack>

          {/* Details */}
          <XStack gap="$4">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={18}>⚖️</Text>
              <Text color="$gray12" fontSize="$4" fontWeight="600">
                {listing.weightKg} kg
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={18}>📍</Text>
              <Text color="$gray12" fontSize="$4">
                {listing.city}, {listing.state}
              </Text>
            </XStack>
          </XStack>

          {/* Price Card */}
          <YStack
            backgroundColor="white"
            borderRadius="$4"
            padding="$4"
            borderWidth={2}
            borderColor="$green9"
          >
            <Text color="$gray10" fontSize="$3" marginBottom="$2">
              {listing.highestBid ? "Current Bid" : "Starting Price"}
            </Text>
            <Text color="$green10" fontWeight="700" fontSize="$9">
              ₹{currentPrice}
            </Text>
            {canBid && (
              <Text color="$gray10" fontSize="$2" marginTop="$1">
                Minimum next bid: ₹{minimumBid}
              </Text>
            )}
            {bids.length > 0 && (
              <Text color="$gray10" fontSize="$2" marginTop="$1">
                {bids.length} bid{bids.length !== 1 ? "s" : ""} placed
              </Text>
            )}
          </YStack>

          {/* Timer */}
          {listing.status === "ACTIVE" && (
            <YStack
              backgroundColor={isExpired ? "$red2" : "$blue2"}
              borderRadius="$4"
              padding="$4"
              borderWidth={1}
              borderColor={isExpired ? "$red5" : "$blue5"}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text
                    color={isExpired ? "$red11" : "$blue11"}
                    fontSize="$3"
                    fontWeight="600"
                  >
                    {isExpired ? "Auction Ended" : "Time Remaining"}
                  </Text>
                  <Text
                    color={isExpired ? "$red11" : "$blue11"}
                    fontSize="$6"
                    fontWeight="700"
                    marginTop="$1"
                  >
                    {isExpired ? "Ended" : formatTimeRemaining(timeRemaining)}
                  </Text>
                </YStack>
                <Text fontSize={40}>{isExpired ? "🔒" : "⏰"}</Text>
              </XStack>
            </YStack>
          )}

          {/* Description */}
          {listing.description && (
            <YStack gap="$2">
              <Text fontWeight="600" color="$gray12" fontSize="$5">
                Description
              </Text>
              <Text color="$gray11" fontSize="$4" lineHeight={22}>
                {listing.description}
              </Text>
            </YStack>
          )}

          {/* Seller Information */}
          <YStack
            backgroundColor="white"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$gray6"
            gap="$3"
          >
            <Text fontWeight="600" color="$gray12" fontSize="$4">
              Seller Information
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={20}>👤</Text>
              <Text color="$gray11" fontSize="$4">
                {listing.seller.name || "Anonymous"}
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={18}>📍</Text>
              <Text color="$gray11" fontSize="$3">
                {listing.seller.city}, {listing.seller.state}
              </Text>
            </XStack>

            {/* Contact Info for Winner */}
            {isWinner && listing.status !== "ACTIVE" && (
              <>
                <Separator marginVertical="$2" />
                <Text color="$green11" fontSize="$3" fontWeight="600">
                  Contact Seller for Pickup:
                </Text>
                {listing.seller.phone && (
                  <Button
                    onPress={() => handleCall(listing.seller.phone!)}
                    backgroundColor="$green9"
                    color="white"
                    icon={<Text>📞</Text>}
                  >
                    Call: {listing.seller.phone}
                  </Button>
                )}
                {listing.seller.email && (
                  <Button
                    onPress={() => handleEmail(listing.seller.email!)}
                    backgroundColor="$blue9"
                    color="white"
                    icon={<Text>✉️</Text>}
                  >
                    Email: {listing.seller.email}
                  </Button>
                )}
              </>
            )}
          </YStack>

          {/* Winner Information (for Seller) */}
          {isOwner && listing.winner && listing.status !== "ACTIVE" && (
            <YStack
              backgroundColor="$green2"
              borderRadius="$4"
              padding="$4"
              borderWidth={1}
              borderColor="$green5"
              gap="$3"
            >
              <Text fontWeight="600" color="$green11" fontSize="$4">
                Winner Information
              </Text>
              <XStack alignItems="center" gap="$2">
                <Text fontSize={20}>🏆</Text>
                <Text color="$green11" fontSize="$4" fontWeight="600">
                  {listing.winner.name || "Anonymous"}
                </Text>
              </XStack>
              <Text color="$green11" fontSize="$3">
                Winning Bid: ₹{listing.highestBid}
              </Text>

              {listing.winner.phone && (
                <Button
                  onPress={() => handleCall(listing.winner!.phone!)}
                  backgroundColor="$green9"
                  color="white"
                  size="$4"
                  icon={<Text>📞</Text>}
                >
                  Call: {listing.winner.phone}
                </Button>
              )}
              {listing.winner.email && (
                <Button
                  onPress={() => handleEmail(listing.winner!.email!)}
                  backgroundColor="$green9"
                  color="white"
                  size="$4"
                  icon={<Text>✉️</Text>}
                >
                  Email: {listing.winner.email}
                </Button>
              )}
            </YStack>
          )}

          {/* QR Code Display for Winner */}
          {isWinner &&
            listing.status === "ENDED" &&
            listing.verificationCode && (
              <YStack
                backgroundColor="$purple2"
                borderRadius="$4"
                padding="$4"
                borderWidth={2}
                borderColor="$purple9"
                gap="$2"
                alignItems="center"
              >
                <Text color="$purple11" fontSize="$5" fontWeight="700">
                  Your QR Code
                </Text>
                <Text
                  color="$purple11"
                  fontSize="$9"
                  fontWeight="900"
                  letterSpacing={4}
                >
                  {listing.verificationCode}
                </Text>
                <Text color="$purple10" fontSize="$3" textAlign="center">
                  Show this code to the seller during pickup
                </Text>
              </YStack>
            )}

          {/* Action Buttons */}
          <YStack gap="$3">
            {/* Place Bid */}
            {canBid && (
              <Button
                onPress={() => setBidModalVisible(true)}
                backgroundColor="$green9"
                color="white"
                fontWeight="700"
                size="$5"
                icon={<Text fontSize={20}>💰</Text>}
              >
                Place Bid
              </Button>
            )}

            {/* Close Bid Early */}
            {isOwner && listing.status === "ACTIVE" && bids.length > 0 && (
              <Button
                onPress={handleCloseBid}
                backgroundColor="$orange9"
                color="white"
                fontWeight="700"
                size="$5"
                icon={<Text fontSize={20}>🔒</Text>}
              >
                Close Auction Early
              </Button>
            )}

            {/* Verify QR Code */}
            {isOwner && listing.status === "ENDED" && listing.winner && (
              <Button
                onPress={async () => {
                  const granted = await requestCameraPermission();
                  if (granted) {
                    setQrModalVisible(true);
                  } else {
                    Alert.alert(
                      "Camera Permission Required",
                      "Please enable camera access to scan QR codes."
                    );
                  }
                }}
                backgroundColor="$purple9"
                color="white"
                fontWeight="700"
                size="$5"
                icon={<Text fontSize={20}>📱</Text>}
              >
                Verify Winner's QR Code
              </Button>
            )}

            {/* Completed Badge */}
            {listing.status === "COMPLETED" && (
              <YStack
                backgroundColor="$blue2"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$blue5"
                alignItems="center"
              >
                <Text fontSize={40}>🎉</Text>
                <Text color="$blue11" fontSize="$5" fontWeight="700">
                  Transaction Completed!
                </Text>
                {isOwner && (
                  <Text color="$blue10" fontSize="$3" marginTop="$2">
                    You earned 30 points
                  </Text>
                )}
                {isWinner && (
                  <Text color="$blue10" fontSize="$3" marginTop="$2">
                    You earned 20 points
                  </Text>
                )}
              </YStack>
            )}
          </YStack>

          {/* Bid History */}
          {bids.length > 0 && (
            <YStack gap="$3" marginTop="$2">
              <H4 color="$gray12">Bid History</H4>
              {bids.map((bid, index) => (
                <XStack
                  key={bid.id}
                  backgroundColor={index === 0 ? "$green2" : "white"}
                  borderRadius="$3"
                  padding="$3"
                  borderWidth={1}
                  borderColor={index === 0 ? "$green5" : "$gray6"}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <YStack>
                    <Text
                      color={index === 0 ? "$green11" : "$gray12"}
                      fontSize="$4"
                      fontWeight="600"
                    >
                      {bid.bidder.name || "Anonymous"}
                      {index === 0 && " 🏆"}
                    </Text>
                    <Text color="$gray10" fontSize="$2">
                      {new Date(bid.createdAt).toLocaleString()}
                    </Text>
                  </YStack>
                  <Text
                    color={index === 0 ? "$green11" : "$gray12"}
                    fontSize="$5"
                    fontWeight="700"
                  >
                    ₹{bid.amount}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
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
            <YStack
              backgroundColor="white"
              borderTopLeftRadius="$6"
              borderTopRightRadius="$6"
              padding="$5"
              gap="$4"
            >
              <H4 color="$gray12">Place Your Bid</H4>
              <YStack gap="$2">
                <Text color="$gray11" fontSize="$3">
                  Minimum Bid: ₹{minimumBid}
                </Text>
                <Input
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder="Enter bid amount"
                  keyboardType="decimal-pad"
                  size="$5"
                  fontSize="$6"
                  fontWeight="600"
                />
              </YStack>
              <XStack gap="$3">
                <Button
                  flex={1}
                  onPress={() => setBidModalVisible(false)}
                  backgroundColor="$gray5"
                  color="$gray11"
                >
                  Cancel
                </Button>
                <Button
                  flex={1}
                  onPress={handlePlaceBid}
                  backgroundColor="$green9"
                  color="white"
                  fontWeight="600"
                  disabled={submittingBid}
                  icon={submittingBid ? <Spinner color="white" /> : undefined}
                >
                  {submittingBid ? "Placing..." : "Place Bid"}
                </Button>
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
          setQrModalVisible(false);
          setScanned(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          {hasPermission === null ? (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              backgroundColor="black"
            >
              <Spinner size="large" color="white" />
              <Text color="white" marginTop="$4">
                Requesting camera permission...
              </Text>
            </YStack>
          ) : hasPermission === false ? (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              padding="$5"
              backgroundColor="black"
            >
              <Text
                color="white"
                fontSize="$6"
                fontWeight="600"
                textAlign="center"
                marginBottom="$4"
              >
                📷 Camera Permission Required
              </Text>
              <Text
                color="$gray10"
                fontSize="$4"
                textAlign="center"
                marginBottom="$6"
              >
                We need camera access to scan the winner's QR code. Please grant
                permission in your device settings.
              </Text>
              <Button
                onPress={async () => {
                  const granted = await requestCameraPermission();
                  if (!granted) {
                    Alert.alert(
                      "Permission Denied",
                      "Please enable camera access in your device settings to scan QR codes."
                    );
                  }
                }}
                backgroundColor="$green9"
                color="white"
                marginBottom="$3"
              >
                Grant Permission
              </Button>
              <Button
                onPress={() => {
                  setQrModalVisible(false);
                  setScanned(false);
                }}
                backgroundColor="$gray5"
                color="$gray11"
              >
                Cancel
              </Button>
            </YStack>
          ) : (
            <YStack flex={1}>
              {/* Camera View */}
              <View style={{ flex: 1 }}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                />

                {/* Overlay UI */}
                <YStack flex={1} justifyContent="space-between">
                  {/* Header */}
                  <YStack
                    backgroundColor="rgba(0,0,0,0.7)"
                    padding="$4"
                    gap="$2"
                  >
                    <Text color="white" fontSize="$6" fontWeight="600">
                      Scan Winner's QR Code
                    </Text>
                    <Text color="$gray10" fontSize="$3">
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
                        borderRadius: 20,
                        backgroundColor: "transparent",
                      }}
                    >
                      {scanned && (
                        <YStack
                          flex={1}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Text color="#22c55e" fontSize="$8" fontWeight="600">
                            ✓
                          </Text>
                          <Text color="white" fontSize="$4" marginTop="$2">
                            Verifying...
                          </Text>
                        </YStack>
                      )}
                    </View>
                  </YStack>

                  {/* Footer */}
                  <YStack
                    backgroundColor="rgba(0,0,0,0.7)"
                    padding="$5"
                    gap="$3"
                  >
                    <YStack
                      backgroundColor="rgba(59, 130, 246, 0.2)"
                      padding="$3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="rgba(59, 130, 246, 0.5)"
                    >
                      <Text color="white" fontSize="$2" textAlign="center">
                        💡 After verification, you'll earn 30 points and the
                        buyer will earn 20 points!
                      </Text>
                    </YStack>
                    <XStack gap="$3">
                      <Button
                        flex={1}
                        onPress={() => {
                          setQrModalVisible(false);
                          setScanned(false);
                        }}
                        backgroundColor="$gray5"
                        color="$gray11"
                        disabled={verifyingQR}
                      >
                        Cancel
                      </Button>
                      {scanned && (
                        <Button
                          flex={1}
                          onPress={() => setScanned(false)}
                          backgroundColor="$yellow9"
                          color="white"
                          disabled={verifyingQR}
                        >
                          Scan Again
                        </Button>
                      )}
                    </XStack>
                  </YStack>
                </YStack>
              </View>
            </YStack>
          )}
        </View>
      </Modal>
    </Theme>
  );
}
