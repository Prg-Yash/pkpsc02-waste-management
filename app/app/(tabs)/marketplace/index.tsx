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
import { RefreshControl, Alert } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import {
  getMarketplaceListings,
  MarketplaceListing,
  formatTimeRemaining,
  calculateTimeRemaining,
} from "../../services/marketplaceService";

export default function MarketplaceScreen() {
  const { user } = useUser();
  const [listings, setListings] = React.useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("endTime");

  React.useEffect(() => {
    if (user) {
      loadListings();
    }
  }, [user, sortBy]);

  const loadListings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMarketplaceListings(user.id, "ACTIVE", sortBy);
      setListings(data);
    } catch (error) {
      console.error("Error loading listings:", error);
      Alert.alert("Error", "Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  const handleListingPress = (listingId: string) => {
    router.push(`/marketplace/${listingId}` as any);
  };

  const handleCreateListing = () => {
    router.push("/marketplace/create" as any);
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
            Loading marketplace...
          </Text>
        </YStack>
      </Theme>
    );
  }

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
          <H2 color="white" fontWeight="bold">
            ♻️ Marketplace
          </H2>
          <Text color="white" opacity={0.9} marginTop="$1" fontSize="$3">
            Buy and sell recyclable waste
          </Text>
        </YStack>

        {/* Create Listing Button */}
        <YStack padding="$4">
          <Button
            onPress={handleCreateListing}
            backgroundColor="$green9"
            color="white"
            fontWeight="600"
            size="$5"
            icon={<Text fontSize={20}>➕</Text>}
          >
            Create New Listing
          </Button>
        </YStack>

        {/* Sort Options */}
        <XStack padding="$4" paddingTop="$0" gap="$2" flexWrap="wrap">
          <Button
            onPress={() => setSortBy("endTime")}
            backgroundColor={sortBy === "endTime" ? "$blue9" : "$gray5"}
            color={sortBy === "endTime" ? "white" : "$gray11"}
            fontWeight="600"
            size="$3"
          >
            Ending Soon
          </Button>
          <Button
            onPress={() => setSortBy("price")}
            backgroundColor={sortBy === "price" ? "$blue9" : "$gray5"}
            color={sortBy === "price" ? "white" : "$gray11"}
            fontWeight="600"
            size="$3"
          >
            Highest Price
          </Button>
          <Button
            onPress={() => setSortBy("newest")}
            backgroundColor={sortBy === "newest" ? "$blue9" : "$gray5"}
            color={sortBy === "newest" ? "white" : "$gray11"}
            fontWeight="600"
            size="$3"
          >
            Newest
          </Button>
        </XStack>

        {/* Listings */}
        <YStack padding="$4" paddingTop="$2">
          {listings.length === 0 ? (
            <YStack
              backgroundColor="white"
              borderRadius="$4"
              padding="$6"
              alignItems="center"
              elevation="$2"
            >
              <Text fontSize={50}>📦</Text>
              <H4 color="$gray12" marginTop="$3" textAlign="center">
                No Active Listings
              </H4>
              <Text color="$gray10" textAlign="center" marginTop="$2">
                Be the first to list recyclable waste!
              </Text>
              <Button
                onPress={handleCreateListing}
                backgroundColor="$blue9"
                color="white"
                fontWeight="600"
                marginTop="$4"
                size="$4"
              >
                Create Listing
              </Button>
            </YStack>
          ) : (
            listings.map((listing) => {
              const timeRemaining = calculateTimeRemaining(
                listing.auctionEndTime
              );
              const currentPrice = listing.highestBid || listing.basePrice;

              return (
                <YStack
                  key={listing.id}
                  backgroundColor="white"
                  borderRadius="$4"
                  padding="$4"
                  marginBottom="$3"
                  elevation="$2"
                  pressStyle={{ opacity: 0.8, scale: 0.98 }}
                  onPress={() => handleListingPress(listing.id)}
                >
                  {/* Image */}
                  {Array.isArray(listing.images) &&
                    listing.images.length > 0 && (
                      <Image
                        source={{ uri: listing.images[0] }}
                        width="100%"
                        height={180}
                        borderRadius="$3"
                        marginBottom="$3"
                      />
                    )}

                  {/* Waste Type & Status */}
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom="$2"
                  >
                    <Text
                      color={getWasteTypeColor(listing.wasteType)}
                      fontWeight="700"
                      fontSize="$6"
                    >
                      {listing.wasteType}
                    </Text>
                    {listing.isUserListing && (
                      <YStack
                        backgroundColor="$blue2"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        <Text color="$blue10" fontSize="$1" fontWeight="600">
                          Your Listing
                        </Text>
                      </YStack>
                    )}
                  </XStack>

                  {/* Weight & Location */}
                  <XStack gap="$3" marginBottom="$3">
                    <XStack alignItems="center" gap="$1">
                      <Text fontSize={14}>⚖️</Text>
                      <Text color="$gray11" fontSize="$2">
                        {listing.weightKg} kg
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap="$1">
                      <Text fontSize={14}>📍</Text>
                      <Text color="$gray11" fontSize="$2">
                        {listing.city}, {listing.state}
                      </Text>
                    </XStack>
                  </XStack>

                  {/* Price */}
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom="$2"
                  >
                    <YStack>
                      <Text color="$gray10" fontSize="$1">
                        {listing.highestBid ? "Current Bid" : "Starting Price"}
                      </Text>
                      <Text color="$green10" fontWeight="700" fontSize="$7">
                        ₹{currentPrice}
                      </Text>
                    </YStack>
                    <YStack alignItems="flex-end">
                      <Text color="$gray10" fontSize="$1">
                        {listing._count?.bids || 0} bids
                      </Text>
                      <XStack alignItems="center" gap="$1" marginTop="$1">
                        <Text fontSize={12}>⏰</Text>
                        <Text
                          color={timeRemaining < 60 ? "$red10" : "$gray11"}
                          fontWeight="600"
                          fontSize="$3"
                        >
                          {formatTimeRemaining(timeRemaining)}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>

                  {/* Seller Info */}
                  <XStack
                    backgroundColor="$gray2"
                    padding="$2"
                    borderRadius="$2"
                    alignItems="center"
                    gap="$2"
                  >
                    <Text fontSize={14}>👤</Text>
                    <Text color="$gray11" fontSize="$2">
                      Seller: {listing.seller.name || "Anonymous"}
                    </Text>
                  </XStack>
                </YStack>
              );
            })
          )}
        </YStack>

        {/* My Listings Link */}
        <YStack padding="$4" paddingTop="$0">
          <Button
            onPress={() => router.push("/marketplace/my-listings" as any)}
            backgroundColor="$gray5"
            color="$gray12"
            fontWeight="600"
            size="$4"
          >
            View My Listings
          </Button>
        </YStack>
      </ScrollView>
    </Theme>
  );
}
