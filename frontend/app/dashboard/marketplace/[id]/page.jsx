"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Weight,
  Clock,
  IndianRupee,
  User,
  TrendingUp,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Package,
  QrCode,
  Phone,
  Mail,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { API_CONFIG } from "@/lib/api-config";

export default function ListingDetailPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [closing, setClosing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user && listingId) {
      fetchListing();
    }
  }, [user, listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/marketplace/${listingId}`,
        {
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setListing(data.listing);
        // Set initial bid amount to minimum bid
        if (data.listing.highestBid) {
          setBidAmount((data.listing.highestBid + 5).toString());
        } else {
          setBidAmount(data.listing.basePrice.toString());
        }
      } else {
        alert("Failed to load listing");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      alert("Failed to load listing");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(bidAmount);
    const minBid = listing.highestBid
      ? listing.highestBid + 5
      : listing.basePrice;

    if (amount < minBid) {
      alert(`Minimum bid is ₹${minBid}`);
      return;
    }

    setBidding(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/marketplace/${listingId}/bid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Bid placed successfully!");
        fetchListing();
      } else {
        alert(data.error || "Failed to place bid");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid");
    } finally {
      setBidding(false);
    }
  };

  const handleVerifyQR = async (e) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      alert("Please enter verification code");
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/marketplace/${listingId}/verify-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({ verificationCode: verificationCode.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          `Transaction completed! You earned ${data.pointsAwarded.seller} points!`
        );
        fetchListing();
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (error) {
      console.error("Error verifying:", error);
      alert("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleCloseBid = async () => {
    if (
      !confirm(
        "Close this auction early? The current highest bidder will be selected as the winner."
      )
    ) {
      return;
    }

    setClosing(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/marketplace/${listingId}/close-bid`,
        {
          method: "POST",
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Auction closed successfully! Winner has been notified.");
        fetchListing();
      } else {
        alert(data.error || "Failed to close auction");
      }
    } catch (error) {
      console.error("Error closing auction:", error);
      alert("Failed to close auction");
    } finally {
      setClosing(false);
    }
  };

  const handleCancelListing = async () => {
    if (
      !confirm(
        "Cancel this listing? This action cannot be undone."
      )
    ) {
      return;
    }

    setCancelling(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/marketplace/${listingId}/cancel`,
        {
          method: "POST",
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Listing cancelled successfully");
        fetchListing();
      } else {
        alert(data.error || "Failed to cancel listing");
      }
    } catch (error) {
      console.error("Error cancelling listing:", error);
      alert("Failed to cancel listing");
    } finally {
      setCancelling(false);
    }
  };

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return "Auction Ended";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const isSeller = listing.seller.id === user.id;
  const isWinner = listing.winner && listing.winner.id === user.id;
  const canBid =
    listing.status === "ACTIVE" && !listing.isExpired && !isSeller;
  const showVerification =
    isSeller && listing.status === "ENDED" && listing.winner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Main Image */}
              <div className="relative h-96 bg-gray-100">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[selectedImage]}
                    alt={`${listing.wasteType} waste`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                      listing.status
                    )}`}
                  >
                    {listing.status}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {listing.images && listing.images.length > 1 && (
                <div className="p-4 grid grid-cols-5 gap-2">
                  {listing.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index
                          ? "border-emerald-500"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {listing.wasteType} Waste
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Weight className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-semibold">{listing.weightKg} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">
                      {listing.city}, {listing.state}
                    </p>
                  </div>
                </div>
              </div>

              {listing.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600">{listing.description}</p>
                </div>
              )}

              {/* Seller Info */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{listing.seller.name}</p>
                    <p className="text-sm text-gray-500">
                      {listing.seller.city}, {listing.seller.state}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Bid History ({listing.bids.length})
              </h3>
              {listing.bids.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No bids yet. Be the first to bid!
                </p>
              ) : (
                <div className="space-y-3">
                  {listing.bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0
                          ? "bg-emerald-50 border-2 border-emerald-500"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{bid.bidder.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(bid.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xl font-bold text-emerald-600">
                        <IndianRupee className="w-5 h-5" />
                        {bid.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bidding/Verification */}
          <div className="space-y-6">
            {/* Auction Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Base Price</p>
                <div className="flex items-center gap-1 text-gray-600">
                  <IndianRupee className="w-4 h-4" />
                  <span className="text-lg">{listing.basePrice}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">
                  {listing.highestBid ? "Current Bid" : "Starting Bid"}
                </p>
                <div className="flex items-center gap-1 text-3xl font-bold text-emerald-600">
                  <IndianRupee className="w-7 h-7" />
                  {listing.highestBid || listing.basePrice}
                </div>
                {listing.highestBid && (
                  <div className="flex items-center gap-1 text-emerald-600 mt-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {Math.round(
                        ((listing.highestBid - listing.basePrice) /
                          listing.basePrice) *
                          100
                      )}
                      % increase
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">
                    {formatTimeRemaining(listing.timeRemaining)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Ends {new Date(listing.auctionEndTime).toLocaleString()}
                </p>
              </div>

              {/* Bid Form */}
              {canBid && (
                <form onSubmit={handleBid} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Bid Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="1"
                        min={
                          listing.highestBid
                            ? listing.highestBid + 5
                            : listing.basePrice
                        }
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum bid: ₹
                      {listing.highestBid
                        ? listing.highestBid + 5
                        : listing.basePrice}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={bidding}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bidding ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Placing Bid...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Place Bid
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Seller - Show Winner Info */}
              {showVerification && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Winner Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-600">Name:</span>{" "}
                        <span className="font-semibold">
                          {listing.winner.name}
                        </span>
                      </p>
                      {listing.winner.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="font-semibold">
                            {listing.winner.phone}
                          </span>
                        </p>
                      )}
                      <p>
                        <span className="text-gray-600">Winning Bid:</span>{" "}
                        <span className="font-semibold text-emerald-600">
                          ₹{listing.highestBid}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-900 mb-2">
                      <QrCode className="w-5 h-5" />
                      <h4 className="font-semibold">Verification Code</h4>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 text-center py-3 bg-white rounded-lg">
                      {listing.verificationCode}
                    </p>
                    <p className="text-xs text-purple-700 mt-2">
                      Ask buyer to show this code from their app
                    </p>
                  </div>

                  <form onSubmit={handleVerifyQR} className="space-y-3">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value)
                      }
                      placeholder="Enter buyer's code"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                      required
                    />
                    <button
                      type="submit"
                      disabled={verifying}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Verify & Complete
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Buyer - Show QR Code */}
              {isWinner && listing.status === "ENDED" && (
                <div className="space-y-4">
                  {/* Email Notification Banner */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          QR Code Sent to Email
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          We've sent this QR code to your email ({user?.primaryEmailAddress?.emailAddress || 'your registered email'}). You can show either the email or this screen to the seller.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 text-white rounded-full mb-3">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        You Won! 🎉
                      </h3>
                      <p className="text-sm text-gray-600">
                        Show this QR code to the seller at pickup
                      </p>
                    </div>

                    {/* QR Code Visual */}
                    <div className="bg-white p-6 rounded-xl mb-4 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg border-4 border-purple-500 mb-4">
                        <QRCodeSVG
                          value={listing.verificationCode}
                          size={200}
                          level="H"
                          includeMargin={true}
                          fgColor="#7c3aed"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-2 text-center font-semibold">
                        Verification Code
                      </p>
                      <p className="text-2xl font-bold text-purple-600 text-center tracking-wider">
                        {listing.verificationCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        (Backup text code if QR scan fails)
                      </p>
                    </div>

                    <div className="text-sm text-gray-600 space-y-2">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Pickup at: {listing.city}, {listing.state}
                      </p>
                      {listing.seller.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contact: {listing.seller.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Status */}
              {listing.status === "COMPLETED" && (
                <div className="p-6 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">
                    Transaction Completed!
                  </h3>
                  <p className="text-sm text-emerald-700">
                    {isSeller
                      ? "You earned 30 points!"
                      : isWinner
                      ? "You earned 20 points!"
                      : "This transaction has been completed"}
                  </p>
                </div>
              )}

              {/* Cancelled Status */}
              {listing.status === "CANCELLED" && (
                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl text-center">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-red-900 mb-2">
                    Listing Cancelled
                  </h3>
                  <p className="text-sm text-red-700">
                    This listing has been cancelled by the seller
                  </p>
                </div>
              )}

              {/* Seller Actions */}
              {isSeller && listing.status === "ACTIVE" && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-blue-900 font-semibold">
                      This is your listing
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {listing.bids.length} bids received
                    </p>
                  </div>

                  {/* Seller Action Buttons */}
                  <div className="space-y-3">
                    {/* Close Bid Early - Only if bids exist */}
                    {listing.bids.length > 0 && (
                      <button
                        onClick={handleCloseBid}
                        disabled={closing}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {closing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Closing Auction...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Close Auction Early
                          </>
                        )}
                      </button>
                    )}

                    {/* Cancel Listing - Only if no bids */}
                    {listing.bids.length === 0 && (
                      <button
                        onClick={handleCancelListing}
                        disabled={cancelling}
                        className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {cancelling ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Cancel Listing
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
