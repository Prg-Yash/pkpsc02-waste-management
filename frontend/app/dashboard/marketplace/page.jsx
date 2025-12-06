"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Clock,
  IndianRupee,
  MapPin,
  Users,
  TrendingUp,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";

export default function MarketplacePage() {
  const { user } = useUser();
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("endTime");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user, sortBy, status]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/marketplace/listings?sortBy=${sortBy}&status=${status}`,
        {
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return "Ended";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getWasteTypeColor = (type) => {
    const colors = {
      Plastic: "bg-blue-100 text-blue-700",
      Metal: "bg-gray-100 text-gray-700",
      Glass: "bg-green-100 text-green-700",
      Organic: "bg-amber-100 text-amber-700",
      Electronic: "bg-purple-100 text-purple-700",
      Paper: "bg-orange-100 text-orange-700",
      Mixed: "bg-pink-100 text-pink-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ♻️ Recyclable Marketplace
            </h1>
            <p className="text-gray-600">
              Buy and sell recyclable waste through auctions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/marketplace/my-listings")}
              className="px-6 py-3 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              My Listings
            </button>
            <button
              onClick={() => router.push("/dashboard/marketplace/create")}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Listing
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-700">Filters:</span>
          </div>
          
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="ACTIVE">Active</option>
            <option value="ENDED">Ended</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="endTime">Ending Soon</option>
            <option value="price">Highest Price</option>
            <option value="newest">Newest First</option>
          </select>

          <button
            onClick={fetchListings}
            className="ml-auto px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a listing!
            </p>
            <button
              onClick={() => router.push("/dashboard/marketplace/create")}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() =>
                  router.push(`/dashboard/marketplace/${listing.id}`)
                }
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.wasteType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {listing.isExpired ? (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        Ended
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  {/* User's Listing Badge */}
                  {listing.isUserListing && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                        Your Listing
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getWasteTypeColor(
                        listing.wasteType
                      )}`}
                    >
                      {listing.wasteType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {listing.weightKg} kg
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {listing.city}, {listing.state}
                    </span>
                  </div>

                  {/* Seller */}
                  <div className="text-sm text-gray-600 mb-4">
                    by <span className="font-semibold">{listing.seller.name}</span>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {listing.highestBid ? "Current Bid" : "Base Price"}
                      </p>
                      <div className="flex items-center gap-1 text-2xl font-bold text-emerald-600">
                        <IndianRupee className="w-5 h-5" />
                        <span>
                          {listing.highestBid || listing.basePrice}
                        </span>
                      </div>
                    </div>
                    {listing.highestBid && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {Math.round(
                            ((listing.highestBid - listing.basePrice) /
                              listing.basePrice) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Time and Bids */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">
                        {formatTimeRemaining(listing.timeRemaining)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">
                        {listing._count.bids} bids
                      </span>
                    </div>
                  </div>

                  {/* User Bid Indicator */}
                  {listing.userHasBid && (
                    <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-semibold text-center">
                      You placed a bid
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
