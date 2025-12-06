"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  IndianRupee,
  Clock,
  Users,
  QrCode,
  Phone,
  CheckCircle2,
  MapPin,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";

export default function MyListingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [sellerListings, setSellerListings] = useState([]);
  const [wonListings, setWonListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("selling");

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/marketplace/my-listings`, {
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSellerListings(data.sellerListings);
        setWonListings(data.wonListings);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "bg-emerald-100 text-emerald-700",
      ENDED: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/marketplace")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Listings
          </h1>
          <p className="text-gray-600">
            Manage your sales and won auctions
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("selling")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === "selling"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              <span>Selling ({sellerListings.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("won")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === "won"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Won ({wonListings.length})</span>
            </div>
          </button>
        </div>

        {/* Selling Tab */}
        {activeTab === "selling" && (
          <div>
            {sellerListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No listings yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first listing to start selling
                </p>
                <button
                  onClick={() => router.push("/dashboard/marketplace/create")}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Create Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() =>
                      router.push(`/dashboard/marketplace/${listing.id}`)
                    }
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.wasteType}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            listing.status
                          )}`}
                        >
                          {listing.status}
                        </span>
                      </div>
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

                      {/* Price */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">
                          {listing.highestBid ? "Current Bid" : "Base Price"}
                        </p>
                        <div className="flex items-center gap-1 text-2xl font-bold text-emerald-600">
                          <IndianRupee className="w-5 h-5" />
                          {listing.highestBid || listing.basePrice}
                        </div>
                      </div>

                      {/* Bids */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">
                          {listing._count.bids} bids
                        </span>
                      </div>

                      {/* Winner Info */}
                      {listing.winner && listing.status === "ENDED" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Winner: {listing.winner.name}
                          </p>
                          {listing.winner.phone && (
                            <p className="text-xs text-blue-700 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {listing.winner.phone}
                            </p>
                          )}
                          <div className="mt-2 p-2 bg-white rounded text-center">
                            <p className="text-xs text-gray-600">
                              Verification Code
                            </p>
                            <p className="text-lg font-bold text-purple-600">
                              {listing.verificationCode}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Completed */}
                      {listing.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-900">
                            Completed • +30 points
                          </span>
                        </div>
                      )}

                      {/* Created Date */}
                      <p className="text-xs text-gray-500 mt-4">
                        Listed {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Won Tab */}
        {activeTab === "won" && (
          <div>
            {wonListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No won auctions yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Place bids on active listings to win auctions
                </p>
                <button
                  onClick={() => router.push("/dashboard/marketplace")}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wonListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() =>
                      router.push(`/dashboard/marketplace/${listing.id}`)
                    }
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.wasteType}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            listing.status
                          )}`}
                        >
                          {listing.status}
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                          Won 🎉
                        </span>
                      </div>
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

                      {/* Seller Info */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Seller</p>
                        <p className="font-semibold">{listing.seller.name}</p>
                        {listing.seller.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {listing.seller.phone}
                          </p>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {listing.seller.city}, {listing.seller.state}
                        </span>
                      </div>

                      {/* Winning Bid */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">
                          Your Winning Bid
                        </p>
                        <div className="flex items-center gap-1 text-2xl font-bold text-emerald-600">
                          <IndianRupee className="w-5 h-5" />
                          {listing.highestBid}
                        </div>
                      </div>

                      {/* QR Code for Pickup */}
                      {listing.status === "ENDED" && (
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 text-purple-900 mb-2">
                            <QrCode className="w-4 h-4" />
                            <p className="text-sm font-semibold">
                              Show at Pickup
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 text-center py-2 bg-white rounded-lg">
                            {listing.verificationCode}
                          </p>
                        </div>
                      )}

                      {/* Completed */}
                      {listing.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-900">
                            Completed • +20 points
                          </span>
                        </div>
                      )}

                      {/* Won Date */}
                      <p className="text-xs text-gray-500 mt-4">
                        Won {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
