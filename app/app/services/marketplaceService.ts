const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    name: string | null;
    city: string | null;
    state: string | null;
  };
  winnerId: string | null;
  winner: {
    id: string;
    name: string | null;
  } | null;
  wasteType: string;
  weightKg: number;
  description: string | null;
  basePrice: number;
  images: string[];
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  auctionDuration: number;
  auctionEndTime: string;
  status: "ACTIVE" | "ENDED" | "COMPLETED" | "CANCELLED";
  highestBid: number | null;
  verificationCode: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bids: number;
  };
  timeRemaining?: number;
  isExpired?: boolean;
  isUserListing?: boolean;
  userHasBid?: boolean;
}

export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  bidder: {
    id: string;
    name: string | null;
  };
  amount: number;
  createdAt: string;
}

export interface CreateListingData {
  wasteType: string;
  weightKg: number;
  description?: string;
  basePrice: number;
  auctionDuration: number; // in minutes
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  imageUris: string[]; // Local file URIs
}

/**
 * Create a new marketplace listing
 */
export async function createMarketplaceListing(
  userId: string,
  data: CreateListingData
): Promise<MarketplaceListing> {
  try {
    const formData = new FormData();
    formData.append("wasteType", data.wasteType);
    formData.append("weightKg", data.weightKg.toString());
    formData.append("basePrice", data.basePrice.toString());
    formData.append("auctionDuration", data.auctionDuration.toString());
    formData.append("latitude", data.latitude.toString());
    formData.append("longitude", data.longitude.toString());
    
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.city) {
      formData.append("city", data.city);
    }
    if (data.state) {
      formData.append("state", data.state);
    }

    // Append images
    for (let i = 0; i < data.imageUris.length; i++) {
      const uri = data.imageUris[i];
      const filename = uri.split("/").pop() || `image-${i}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("images", {
        uri,
        name: filename,
        type,
      } as any);
    }

    const response = await fetch(`${API_URL}/api/marketplace/create`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create listing");
    }

    const result = await response.json();
    return result.listing;
  } catch (error) {
    console.error("Error creating marketplace listing:", error);
    throw error;
  }
}

/**
 * Get all marketplace listings
 */
export async function getMarketplaceListings(
  userId: string,
  status?: string,
  sortBy?: string
): Promise<MarketplaceListing[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (sortBy) params.append("sortBy", sortBy);

    const response = await fetch(
      `${API_URL}/api/marketplace/listings?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.listings || [];
  } catch (error) {
    console.error("Error fetching marketplace listings:", error);
    throw error;
  }
}

/**
 * Get user's listings (as seller and winner)
 */
export async function getMyListings(userId: string): Promise<{
  sellerListings: MarketplaceListing[];
  wonListings: MarketplaceListing[];
}> {
  try {
    const response = await fetch(`${API_URL}/api/marketplace/my-listings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      sellerListings: data.sellerListings || [],
      wonListings: data.wonListings || [],
    };
  } catch (error) {
    console.error("Error fetching user listings:", error);
    throw error;
  }
}

/**
 * Get listing details
 */
export async function getListingDetails(
  userId: string,
  listingId: string
): Promise<{ listing: MarketplaceListing; bids: Bid[] }> {
  try {
    const response = await fetch(`${API_URL}/api/marketplace/${listingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch listing details");
    }

    const data = await response.json();
    return {
      listing: data.listing,
      bids: data.listing.bids || [],
    };
  } catch (error) {
    console.error("Error fetching listing details:", error);
    throw error;
  }
}

/**
 * Place a bid on a listing
 */
export async function placeBid(
  userId: string,
  listingId: string,
  amount: number
): Promise<{ bid: Bid; listing: MarketplaceListing }> {
  try {
    const response = await fetch(
      `${API_URL}/api/marketplace/${listingId}/bid`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ amount }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to place bid");
    }

    const data = await response.json();
    return { bid: data.bid, listing: data.listing };
  } catch (error) {
    console.error("Error placing bid:", error);
    throw error;
  }
}

/**
 * Verify QR code and complete transaction (seller only)
 */
export async function verifyQRCode(
  userId: string,
  listingId: string,
  verificationCode: string
): Promise<MarketplaceListing> {
  try {
    const response = await fetch(
      `${API_URL}/api/marketplace/${listingId}/verify-qr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ verificationCode }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to verify QR code");
    }

    const data = await response.json();
    return data.listing;
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw error;
  }
}

/**
 * Cancel a listing (seller only, no bids)
 */
export async function cancelListing(
  userId: string,
  listingId: string
): Promise<MarketplaceListing> {
  try {
    const response = await fetch(
      `${API_URL}/api/marketplace/${listingId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to cancel listing");
    }

    const data = await response.json();
    return data.listing;
  } catch (error) {
    console.error("Error cancelling listing:", error);
    throw error;
  }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes <= 0) return "Ended";
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Calculate time remaining in minutes from end time
 */
export function calculateTimeRemaining(auctionEndTime: string): number {
  const now = new Date().getTime();
  const endTime = new Date(auctionEndTime).getTime();
  const diff = endTime - now;
  
  return diff > 0 ? Math.floor(diff / 60000) : 0;
}
