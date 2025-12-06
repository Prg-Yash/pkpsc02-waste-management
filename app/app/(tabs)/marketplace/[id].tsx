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
} from "tamagui";
import { Alert, Modal, Pressable, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import {
  getListingDetails,
  placeBid,
  MarketplaceListing,
  Bid,
  formatTimeRemaining,
  calculateTimeRemaining,
} from "../../services/marketplaceService";

export default function ListingDetailsScreen() {
  const { user } = useUser();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = React.useState<MarketplaceListing | null>(null);
  const [bids, setBids] = React.useState<Bid[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [bidModalVisible, setBidModalVisible] = React.useState(false);
  const [bidAmount, setBidAmount] = React.useState("");
  const [submittingBid, setSubmittingBid] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

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

  const currentPrice = listing.highestBid || listing.basePrice;
  const minimumBid = currentPrice + 5;
  const isExpired = timeRemaining <= 0;
  const isOwner = listing.sellerId === user?.id;
  const canBid = !isExpired && !isOwner && listing.status === "ACTIVE";

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        <YStack
          backgroundColor="$blue9"
          padding="$5"
          paddingTop="$10"
          paddingBottom="$4"
        >
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
            <H2 color="white" fontWeight="bold" flex={1}>
              Listing Details
            </H2>
          </XStack>
        </YStack>

        {Array.isArray(listing.images) && listing.images.length > 0 && (
          <YStack>
            <Image
              source={{ uri: listing.images[selectedImageIndex] }}
              width="100%"
              height={300}
            />
            {listing.images.length > 1 && (
              <XStack
                position="absolute"
                bottom={10}
                left={0}
                right={0}
                justifyContent="center"
                gap="$2"
              >
                {listing.images.map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor:
                          index === selectedImageIndex
                            ? "#fff"
                            : "rgba(255,255,255,0.5)",
                      }}
                    />
                  </Pressable>
                ))}
              </XStack>
            )}
          </YStack>
        )}

        <YStack padding="$4" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              color={getWasteTypeColor(listing.wasteType)}
              fontWeight="700"
              fontSize="$8"
            >
              {listing.wasteType}
            </Text>
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
          </XStack>

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
          </YStack>

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

          <XStack
            backgroundColor="$gray2"
            padding="$3"
            borderRadius="$3"
            alignItems="center"
            gap="$2"
          >
            <Text fontSize={20}>📊</Text>
            <Text color="$gray12" fontSize="$4" fontWeight="600">
              {bids.length} bid{bids.length !== 1 ? "s" : ""} placed
            </Text>
          </XStack>

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

          <YStack
            backgroundColor="white"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$gray6"
          >
            <Text
              fontWeight="600"
              color="$gray12"
              fontSize="$4"
              marginBottom="$2"
            >
              Seller Information
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={20}>👤</Text>
              <Text color="$gray11" fontSize="$4">
                {listing.seller.name || "Anonymous"}
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$2" marginTop="$2">
              <Text fontSize={18}>📍</Text>
              <Text color="$gray11" fontSize="$3">
                {listing.seller.city}, {listing.seller.state}
              </Text>
            </XStack>
          </YStack>

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

          {isOwner && listing.status === "ACTIVE" && (
            <YStack
              backgroundColor="$yellow2"
              padding="$3"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$yellow5"
            >
              <Text color="$yellow11" fontSize="$3" textAlign="center">
                💡 This is your listing. You cannot bid on it.
              </Text>
            </YStack>
          )}

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
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={16}>👤</Text>
                      <Text
                        color="$gray12"
                        fontSize="$4"
                        fontWeight={index === 0 ? "700" : "600"}
                      >
                        {bid.bidder.name || "Anonymous"}
                      </Text>
                      {index === 0 && (
                        <YStack
                          backgroundColor="$green9"
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Text color="white" fontSize="$1" fontWeight="600">
                            HIGHEST
                          </Text>
                        </YStack>
                      )}
                    </XStack>
                    <Text color="$gray10" fontSize="$2" marginTop="$1">
                      {new Date(bid.createdAt).toLocaleString()}
                    </Text>
                  </YStack>
                  <Text
                    color={index === 0 ? "$green10" : "$gray11"}
                    fontSize="$6"
                    fontWeight="700"
                  >
                    ₹{bid.amount}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>

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
                <XStack justifyContent="space-between" alignItems="center">
                  <H4 color="$gray12">Place Your Bid</H4>
                  <Button
                    size="$3"
                    circular
                    onPress={() => setBidModalVisible(false)}
                    backgroundColor="$gray5"
                  >
                    ✕
                  </Button>
                </XStack>

                <YStack backgroundColor="$blue2" padding="$3" borderRadius="$3">
                  <Text color="$blue11" fontSize="$3">
                    Current Price: ₹{currentPrice}
                  </Text>
                  <Text color="$blue11" fontSize="$2" marginTop="$1">
                    Minimum Bid: ₹{minimumBid}
                  </Text>
                </YStack>

                <YStack gap="$2">
                  <Text fontWeight="600" color="$gray12" fontSize="$4">
                    Your Bid Amount (₹)
                  </Text>
                  <Input
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    placeholder={`Enter amount (min ₹${minimumBid})`}
                    keyboardType="decimal-pad"
                    size="$5"
                    backgroundColor="$gray2"
                    borderWidth={1}
                    borderColor="$gray8"
                  />
                </YStack>

                <Button
                  onPress={handlePlaceBid}
                  disabled={submittingBid || !bidAmount}
                  backgroundColor="$green9"
                  color="white"
                  fontWeight="700"
                  size="$5"
                  icon={submittingBid ? <Spinner color="white" /> : undefined}
                >
                  {submittingBid ? "Placing Bid..." : "Confirm Bid"}
                </Button>
              </YStack>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </Theme>
  );
}
