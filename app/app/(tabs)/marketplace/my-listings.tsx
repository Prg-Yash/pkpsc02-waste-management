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
} from "tamagui";
import { Alert, RefreshControl } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import {
  getMyListings,
  MarketplaceListing,
  formatTimeRemaining,
  calculateTimeRemaining,
} from "../../services/marketplaceService";

export default function MyListingsScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<"sales" | "wins">("sales");
  const [sellerListings, setSellerListings] = React.useState<
    MarketplaceListing[]
  >([]);
  const [wonListings, setWonListings] = React.useState<MarketplaceListing[]>(
    []
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      loadMyListings();
    }
  }, [user]);

  const loadMyListings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMyListings(user.id);
      setSellerListings(data.sellerListings);
      setWonListings(data.wonListings);
    } catch (error) {
      console.error("Error loading my listings:", error);
      Alert.alert("Error", "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMyListings();
    setRefreshing(false);
  };

  const handleListingPress = (listingId: string) => {
    router.push(`/marketplace/${listingId}` as any);
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      ACTIVE: "$green9",
      ENDED: "$yellow9",
      COMPLETED: "$blue9",
      CANCELLED: "$red9",
    };
    return colorMap[status] || "$gray9";
  };

  const getStatusBgColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      ACTIVE: "$green2",
      ENDED: "$yellow2",
      COMPLETED: "$blue2",
      CANCELLED: "$red2",
    };
    return colorMap[status] || "$gray2";
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

  const renderListing = (listing: MarketplaceListing, isSeller: boolean) => {
    const timeRemaining = calculateTimeRemaining(listing.auctionEndTime);
    const currentPrice = listing.highestBid || listing.basePrice;

    return (
      <YStack
        key={listing.id}
        backgroundColor="white"
        borderRadius="$4"
        padding="$4"
        marginBottom="$3"
        borderWidth={1}
        borderColor="$gray6"
        pressStyle={{ opacity: 0.8, scale: 0.98 }}
        onPress={() => handleListingPress(listing.id)}
      >
        {/* Image */}
        {Array.isArray(listing.images) && listing.images.length > 0 && (
          <Image
            source={{ uri: listing.images[0] }}
            width="100%"
            height={150}
            borderRadius="$3"
            marginBottom="$3"
          />
        )}

        {/* Status Badge */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom="$2"
        >
          <YStack
            backgroundColor={getStatusBgColor(listing.status)}
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
          >
            <Text
              color={getStatusColor(listing.status)}
              fontSize="$2"
              fontWeight="600"
            >
              {listing.status}
            </Text>
          </YStack>
          {listing.status === "ACTIVE" && timeRemaining > 0 && (
            <XStack alignItems="center" gap="$1">
              <Text fontSize={14}>⏰</Text>
              <Text
                color={timeRemaining < 60 ? "$red10" : "$gray11"}
                fontWeight="600"
                fontSize="$3"
              >
                {formatTimeRemaining(timeRemaining)}
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Waste Type */}
        <Text
          color={getWasteTypeColor(listing.wasteType)}
          fontWeight="700"
          fontSize="$6"
          marginBottom="$2"
        >
          {listing.wasteType}
        </Text>

        {/* Weight & Location */}
        <XStack gap="$3" marginBottom="$3">
          <XStack alignItems="center" gap="$1">
            <Text fontSize={14}>⚖️</Text>
            <Text color="$gray11" fontSize="$3">
              {listing.weightKg} kg
            </Text>
          </XStack>
          <XStack alignItems="center" gap="$1">
            <Text fontSize={14}>📍</Text>
            <Text color="$gray11" fontSize="$3">
              {listing.city}, {listing.state}
            </Text>
          </XStack>
        </XStack>

        {/* Price & Bids */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom="$2"
        >
          <YStack>
            <Text color="$gray10" fontSize="$2">
              {listing.highestBid ? "Final Price" : "Starting Price"}
            </Text>
            <Text color="$green10" fontWeight="700" fontSize="$6">
              ₹{currentPrice}
            </Text>
          </YStack>
          <YStack alignItems="flex-end">
            <Text color="$gray10" fontSize="$2">
              {listing._count?.bids || 0} bids
            </Text>
          </YStack>
        </XStack>

        {/* Seller/Winner Info */}
        {isSeller && listing.winner && (
          <YStack
            backgroundColor="$blue2"
            padding="$3"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$blue5"
            marginTop="$2"
          >
            <Text color="$blue11" fontSize="$3" fontWeight="600">
              🏆 Winner: {listing.winner.name || "Anonymous"}
            </Text>
            {listing.status === "ENDED" && (
              <Text color="$blue11" fontSize="$2" marginTop="$1">
                Awaiting QR verification for pickup
              </Text>
            )}
            {listing.status === "COMPLETED" && (
              <Text color="$blue11" fontSize="$2" marginTop="$1">
                ✅ Transaction completed
              </Text>
            )}
          </YStack>
        )}

        {!isSeller && (
          <YStack
            backgroundColor="$green2"
            padding="$3"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$green5"
            marginTop="$2"
          >
            <Text color="$green11" fontSize="$3" fontWeight="600">
              👤 Seller: {listing.seller.name || "Anonymous"}
            </Text>
            {listing.status === "ENDED" && listing.verificationCode && (
              <YStack marginTop="$2">
                <Text color="$green11" fontSize="$2" marginBottom="$1">
                  Show this code to seller for pickup:
                </Text>
                <YStack
                  backgroundColor="white"
                  padding="$2"
                  borderRadius="$2"
                  alignItems="center"
                >
                  <Text
                    color="$green11"
                    fontSize="$6"
                    fontWeight="700"
                    letterSpacing={2}
                  >
                    {listing.verificationCode}
                  </Text>
                </YStack>
              </YStack>
            )}
            {listing.status === "COMPLETED" && (
              <Text color="$green11" fontSize="$2" marginTop="$1">
                ✅ Pickup completed - You earned 20 points!
              </Text>
            )}
          </YStack>
        )}

        {/* View Details Button */}
        <Button
          onPress={() => handleListingPress(listing.id)}
          backgroundColor="$blue9"
          color="white"
          fontWeight="600"
          size="$4"
          marginTop="$3"
        >
          View Details
        </Button>
      </YStack>
    );
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
            Loading your listings...
          </Text>
        </YStack>
      </Theme>
    );
  }

  const displayListings = activeTab === "sales" ? sellerListings : wonListings;

  return (
    <Theme name="light">
      <ScrollView
        flex={1}
        backgroundColor="$background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
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
            <H2 color="white" fontWeight="bold">
              My Listings
            </H2>
          </XStack>
          <Text color="white" opacity={0.9} fontSize="$3">
            Manage your marketplace activities
          </Text>
        </YStack>

        {/* Tabs */}
        <XStack padding="$4" gap="$3">
          <Button
            flex={1}
            onPress={() => setActiveTab("sales")}
            backgroundColor={activeTab === "sales" ? "$blue9" : "$gray5"}
            color={activeTab === "sales" ? "white" : "$gray11"}
            fontWeight="600"
            size="$4"
          >
            My Sales ({sellerListings.length})
          </Button>
          <Button
            flex={1}
            onPress={() => setActiveTab("wins")}
            backgroundColor={activeTab === "wins" ? "$green9" : "$gray5"}
            color={activeTab === "wins" ? "white" : "$gray11"}
            fontWeight="600"
            size="$4"
          >
            My Wins ({wonListings.length})
          </Button>
        </XStack>

        {/* Listings */}
        <YStack padding="$4" paddingTop="$2">
          {displayListings.length === 0 ? (
            <YStack
              backgroundColor="white"
              borderRadius="$4"
              padding="$6"
              alignItems="center"
            >
              <Text fontSize={50}>{activeTab === "sales" ? "📦" : "🏆"}</Text>
              <H4 color="$gray12" marginTop="$3" textAlign="center">
                {activeTab === "sales" ? "No Sales Yet" : "No Wins Yet"}
              </H4>
              <Text color="$gray10" textAlign="center" marginTop="$2">
                {activeTab === "sales"
                  ? "Create your first listing to start selling waste"
                  : "Start bidding on listings to win waste materials"}
              </Text>
              <Button
                onPress={() =>
                  activeTab === "sales"
                    ? router.push("/marketplace/create" as any)
                    : router.push("/marketplace" as any)
                }
                backgroundColor="$blue9"
                color="white"
                fontWeight="600"
                marginTop="$4"
                size="$4"
              >
                {activeTab === "sales"
                  ? "Create Listing"
                  : "Browse Marketplace"}
              </Button>
            </YStack>
          ) : (
            displayListings.map((listing) =>
              renderListing(listing, activeTab === "sales")
            )
          )}
        </YStack>
      </ScrollView>
    </Theme>
  );
}
