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
  Separator,
} from "tamagui";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Pressable, RefreshControl } from "react-native";
import {
  getMyListings,
  cancelListing,
  MarketplaceListing,
  formatTimeRemaining,
  calculateTimeRemaining,
} from "../services/marketplaceService";

export default function MyListingsScreen() {
  const { user } = useUser();
  const [listings, setListings] = React.useState<MarketplaceListing[]>([]);
  const [wonListings, setWonListings] = React.useState<MarketplaceListing[]>(
    []
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadListings = React.useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMyListings(user.id);
      setListings(data.sellerListings);
      setWonListings(data.wonListings);
    } catch (error) {
      console.error("Error loading listings:", error);
      Alert.alert("Error", "Failed to load your listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleCancelListing = async (listingId: string) => {
    Alert.alert(
      "Cancel Listing",
      "Are you sure you want to cancel this listing? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              if (!user) return;
              await cancelListing(user.id, listingId);
              Alert.alert("Success", "Listing cancelled successfully");
              await loadListings();
            } catch (error) {
              console.error("Error cancelling listing:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to cancel listing"
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "$green9";
      case "ENDED":
        return "$orange9";
      case "COMPLETED":
        return "$blue9";
      case "CANCELLED":
        return "$gray9";
      default:
        return "$gray9";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "🟢";
      case "ENDED":
        return "🟡";
      case "COMPLETED":
        return "✅";
      case "CANCELLED":
        return "❌";
      default:
        return "⚪";
    }
  };

  if (loading) {
    return (
      <Theme name="light">
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
        >
          <Spinner size="large" color="$green9" />
          <Text color="$gray11" marginTop="$3">
            Loading your listings...
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
        <YStack padding="$4" gap="$4">
          {/* Header */}
          <YStack gap="$2">
            <H2 color="$gray12">My Listings</H2>
            <Text color="$gray11" fontSize="$3">
              Manage your marketplace listings
            </Text>
          </YStack>

          {/* Create New Button */}
          <Button
            onPress={() => router.push("/(marketplace)/create" as any)}
            backgroundColor="$green9"
            color="white"
            fontWeight="700"
            size="$5"
            icon={<Text fontSize={20}>➕</Text>}
          >
            Create New Listing
          </Button>

          {/* Stats Summary */}
          <XStack gap="$3">
            <YStack
              flex={1}
              backgroundColor="$green2"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$green5"
              alignItems="center"
            >
              <Text fontSize="$7" fontWeight="700" color="$green11">
                {listings.filter((l) => l.status === "ACTIVE").length}
              </Text>
              <Text fontSize="$2" color="$green10">
                Active
              </Text>
            </YStack>
            <YStack
              flex={1}
              backgroundColor="$orange2"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$orange5"
              alignItems="center"
            >
              <Text fontSize="$7" fontWeight="700" color="$orange11">
                {listings.filter((l) => l.status === "ENDED").length}
              </Text>
              <Text fontSize="$2" color="$orange10">
                Ended
              </Text>
            </YStack>
            <YStack
              flex={1}
              backgroundColor="$blue2"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$blue5"
              alignItems="center"
            >
              <Text fontSize="$7" fontWeight="700" color="$blue11">
                {listings.filter((l) => l.status === "COMPLETED").length}
              </Text>
              <Text fontSize="$2" color="$blue10">
                Completed
              </Text>
            </YStack>
          </XStack>

          {/* Listings */}
          {listings.length === 0 ? (
            <YStack
              padding="$6"
              alignItems="center"
              gap="$3"
              backgroundColor="$gray2"
              borderRadius="$4"
            >
              <Text fontSize={60}>📦</Text>
              <Text
                color="$gray11"
                fontSize="$5"
                fontWeight="600"
                textAlign="center"
              >
                No Listings Yet
              </Text>
              <Text color="$gray10" fontSize="$3" textAlign="center">
                Create your first marketplace listing to start selling
                recyclable waste
              </Text>
            </YStack>
          ) : (
            <YStack gap="$3">
              {listings.map((listing) => {
                const timeRemaining = calculateTimeRemaining(
                  listing.auctionEndTime
                );
                const isActive = listing.status === "ACTIVE";

                return (
                  <Pressable
                    key={listing.id}
                    onPress={() =>
                      router.push(`/(marketplace)/${listing.id}` as any)
                    }
                  >
                    <YStack
                      backgroundColor="white"
                      borderRadius="$4"
                      padding="$4"
                      gap="$3"
                      borderWidth={1}
                      borderColor="$gray5"
                    >
                      {/* Header with Status */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <XStack alignItems="center" gap="$2">
                          <Text fontSize={20}>
                            {getStatusIcon(listing.status)}
                          </Text>
                          <Text
                            color={getStatusColor(listing.status)}
                            fontWeight="700"
                            fontSize="$3"
                          >
                            {listing.status}
                          </Text>
                        </XStack>
                        {isActive && timeRemaining > 0 && (
                          <XStack
                            backgroundColor="$red2"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                            alignItems="center"
                            gap="$1"
                          >
                            <Text fontSize={14}>⏰</Text>
                            <Text color="$red11" fontSize="$2" fontWeight="600">
                              {formatTimeRemaining(timeRemaining)}
                            </Text>
                          </XStack>
                        )}
                      </XStack>

                      {/* Image and Details */}
                      <XStack gap="$3">
                        {listing.images && listing.images.length > 0 && (
                          <Image
                            source={{ uri: listing.images[0] }}
                            width={80}
                            height={80}
                            borderRadius="$3"
                          />
                        )}
                        <YStack flex={1} gap="$1">
                          <H4 color="$gray12">{listing.wasteType}</H4>
                          <Text color="$gray11" fontSize="$3">
                            {listing.weightKg} kg
                          </Text>
                          {listing.description && (
                            <Text
                              color="$gray10"
                              fontSize="$2"
                              numberOfLines={2}
                            >
                              {listing.description}
                            </Text>
                          )}
                        </YStack>
                      </XStack>

                      <Separator borderColor="$gray5" />

                      {/* Bidding Info */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <YStack>
                          <Text color="$gray10" fontSize="$2">
                            Starting Bid
                          </Text>
                          <Text color="$gray12" fontSize="$4" fontWeight="700">
                            ₹{listing.basePrice}
                          </Text>
                        </YStack>
                        {listing.highestBid && (
                          <YStack alignItems="flex-end">
                            <Text color="$gray10" fontSize="$2">
                              Highest Bid
                            </Text>
                            <Text
                              color="$green11"
                              fontSize="$5"
                              fontWeight="700"
                            >
                              ₹{listing.highestBid}
                            </Text>
                          </YStack>
                        )}
                      </XStack>

                      {/* Bid Count */}
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize={16}>💰</Text>
                        <Text color="$gray11" fontSize="$3">
                          {listing._count?.bids || 0} bid(s) received
                        </Text>
                      </XStack>

                      {/* Action Buttons */}
                      <XStack gap="$2">
                        <Button
                          flex={1}
                          onPress={() =>
                            router.push(`/(marketplace)/${listing.id}` as any)
                          }
                          backgroundColor="$blue9"
                          color="white"
                          size="$3"
                        >
                          View Details
                        </Button>
                        {isActive && (
                          <Button
                            onPress={() => handleCancelListing(listing.id)}
                            backgroundColor="$red9"
                            color="white"
                            size="$3"
                          >
                            Cancel
                          </Button>
                        )}
                      </XStack>

                      {/* Winner Info */}
                      {listing.winner && listing.status === "ENDED" && (
                        <YStack
                          backgroundColor="$green2"
                          padding="$3"
                          borderRadius="$3"
                          borderWidth={1}
                          borderColor="$green5"
                          gap="$1"
                        >
                          <Text color="$green11" fontSize="$3" fontWeight="600">
                            🏆 Winner: {listing.winner.name}
                          </Text>
                          <Text color="$green10" fontSize="$2">
                            Awaiting QR verification
                          </Text>
                        </YStack>
                      )}

                      {listing.status === "COMPLETED" && (
                        <YStack
                          backgroundColor="$blue2"
                          padding="$3"
                          borderRadius="$3"
                          borderWidth={1}
                          borderColor="$blue5"
                          alignItems="center"
                        >
                          <Text color="$blue11" fontSize="$4" fontWeight="700">
                            ✅ Transaction Completed
                          </Text>
                          <Text color="$blue10" fontSize="$2">
                            You earned 30 EcoPoints!
                          </Text>
                        </YStack>
                      )}
                    </YStack>
                  </Pressable>
                );
              })}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </Theme>
  );
}
