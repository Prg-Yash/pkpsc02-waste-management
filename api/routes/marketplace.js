import express from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { uploadToS3, generateMarketplaceImageKey } from "../lib/s3Uploader.js";
import { createNotification } from "../lib/notifications.js";
import crypto from "crypto";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

const router = express.Router();

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", // Default to Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

// Marketplace points rewards
const LISTING_COMPLETION_POINTS = 30; // Seller gets points when transaction completes
const BUYER_COMPLETION_POINTS = 20; // Buyer gets points when transaction completes

/**
 * POST /api/marketplace/create
 * Create a new marketplace listing with AI-analyzed recyclable waste
 */
router.post("/create", upload.array("images", 5), async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const {
      wasteType,
      weightKg,
      description,
      basePrice,
      auctionDuration,
      latitude,
      longitude,
      city,
      state,
    } = req.body;

    // Validate user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.city || !user.state || !user.country) {
      return res.status(400).json({
        error:
          "Please complete your profile (city, state, country) before creating listings",
      });
    }

    // Validate required fields
    if (!wasteType || !weightKg || !basePrice || !auctionDuration) {
      return res.status(400).json({
        error:
          "Missing required fields: wasteType, weightKg, basePrice, auctionDuration",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Location (latitude, longitude) is required" });
    }

    // Upload images to S3
    const imageUrls = [];
    for (const file of req.files) {
      const key = generateMarketplaceImageKey(userId, file.originalname);
      const url = await uploadToS3(file.buffer, key, file.mimetype);
      imageUrls.push(url);
    }

    // Calculate auction end time
    const auctionEndTime = new Date(
      Date.now() + parseInt(auctionDuration) * 60 * 1000
    );

    // Create listing
    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: userId,
        wasteType,
        weightKg: parseFloat(weightKg),
        description,
        basePrice: parseFloat(basePrice),
        images: imageUrls,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city: city || user.city,
        state: state || user.state,
        auctionDuration: parseInt(auctionDuration),
        auctionEndTime,
        status: "ACTIVE",
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    console.error("Error creating marketplace listing:", error);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

/**
 * GET /api/marketplace/listings
 * Get all active marketplace listings
 */
router.get("/listings", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { status, sortBy = "endTime" } = req.query;

    // Build where clause
    const where = {};
    if (status) {
      where.status = status;
    } else {
      // Default to active listings
      where.status = "ACTIVE";
    }

    // Build order clause
    let orderBy = {};
    if (sortBy === "endTime") {
      orderBy = { auctionEndTime: "asc" };
    } else if (sortBy === "price") {
      orderBy = { highestBid: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else {
      orderBy = { auctionEndTime: "asc" };
    }

    const listings = await prisma.marketplaceListing.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy,
    });

    // Enhance listings with time remaining
    const enhancedListings = listings.map((listing) => {
      const now = new Date();
      const endTime = new Date(listing.auctionEndTime);
      const timeRemainingMs = endTime - now;
      const timeRemaining =
        timeRemainingMs > 0 ? Math.floor(timeRemainingMs / 60000) : 0; // minutes

      return {
        ...listing,
        timeRemaining,
        isExpired: timeRemainingMs <= 0,
        isUserListing: listing.sellerId === userId,
      };
    });

    res.json({ listings: enhancedListings });
  } catch (error) {
    console.error("Error fetching marketplace listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

/**
 * GET /api/marketplace/my-listings
 * Get current user's listings (both as seller and winner)
 */
router.get("/my-listings", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const [sellerListings, wonListings] = await Promise.all([
      // Listings where user is seller
      prisma.marketplaceListing.findMany({
        where: { sellerId: userId },
        include: {
          winner: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              bids: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Listings where user is winner
      prisma.marketplaceListing.findMany({
        where: { winnerId: userId },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              phone: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    res.json({ sellerListings, wonListings });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).json({ error: "Failed to fetch user listings" });
  }
});

/**
 * GET /api/marketplace/:id
 * Get detailed information about a specific listing
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            phone: true,
            email: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            amount: "desc",
          },
          take: 10, // Top 10 bids
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Calculate time remaining
    const now = new Date();
    const endTime = new Date(listing.auctionEndTime);
    const timeRemainingMs = endTime - now;
    const timeRemaining =
      timeRemainingMs > 0 ? Math.floor(timeRemainingMs / 60000) : 0;

    // Check if auction has ended and needs to be finalized
    if (listing.status === "ACTIVE" && timeRemainingMs <= 0) {
      await finalizeAuction(listing.id);
    }

    const enhancedListing = {
      ...listing,
      timeRemaining,
      isExpired: timeRemainingMs <= 0,
      isUserListing: listing.sellerId === userId,
      userHasBid: listing.bids.some((bid) => bid.bidderId === userId),
    };

    res.json({ listing: enhancedListing });
  } catch (error) {
    console.error("Error fetching listing details:", error);
    res.status(500).json({ error: "Failed to fetch listing details" });
  }
});

/**
 * POST /api/marketplace/:id/bid
 * Place a bid on a listing
 */
router.post("/:id/bid", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valid bid amount is required" });
    }

    const bidAmount = parseFloat(amount);

    // Fetch listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        seller: true,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Validations
    if (listing.sellerId === userId) {
      return res
        .status(400)
        .json({ error: "You cannot bid on your own listing" });
    }

    if (listing.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ error: "This listing is no longer active" });
    }

    const now = new Date();
    if (new Date(listing.auctionEndTime) <= now) {
      return res.status(400).json({ error: "Auction has ended" });
    }

    // Check minimum bid
    const minimumBid = listing.highestBid
      ? listing.highestBid + 5
      : listing.basePrice;
    if (bidAmount < minimumBid) {
      return res.status(400).json({
        error: `Bid must be at least ₹${minimumBid}`,
      });
    }

    // Create bid and update listing in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          listingId: id,
          bidderId: userId,
          amount: bidAmount,
        },
        include: {
          bidder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const updatedListing = await tx.marketplaceListing.update({
        where: { id },
        data: {
          highestBid: bidAmount,
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { bid, updatedListing };
    });

    // Notify seller
    await createNotification({
      userId: listing.sellerId,
      type: "BID_PLACED",
      title: "New Bid Received!",
      body: `Someone bid ₹${bidAmount} on your ${listing.wasteType} listing`,
      data: {
        listingId: listing.id,
        bidAmount,
      },
    });

    res.json({
      message: "Bid placed successfully",
      bid: result.bid,
      listing: result.updatedListing,
    });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ error: "Failed to place bid" });
  }
});

/**
 * Helper function to finalize auction when time expires or manually closed
 */
async function finalizeAuction(listingId, manualClose = false) {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
          include: {
            bidder: true,
          },
        },
        seller: true,
      },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return;
    }

    // Skip time check if manually closed by seller
    if (!manualClose) {
      const now = new Date();
      if (new Date(listing.auctionEndTime) > now) {
        return; // Auction hasn't ended yet
      }
    }

    // Find winner (highest bidder)
    const winningBid = listing.bids[0];

    if (winningBid) {
      // Generate verification code
      const verificationCode = crypto.randomBytes(16).toString("hex");
      console.log(`🎲 Generated verification code for listing ${listingId}`);

      // Generate QR code as buffer for email attachment
      let qrCodeBuffer = null;
      try {
        qrCodeBuffer = await QRCode.toBuffer(verificationCode, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          type: "png",
        });
        console.log(
          `✅ QR code generated successfully (${qrCodeBuffer.length} bytes)`
        );
      } catch (qrError) {
        console.error("❌ Error generating QR code:", qrError);
      }

      // Update listing with winner
      await prisma.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: "ENDED",
          winnerId: winningBid.bidderId,
          verificationCode,
        },
      });

      // Send email to winner with QR code
      if (process.env.EMAIL_USER && qrCodeBuffer) {
        console.log(
          `📧 Attempting to send email to: ${winningBid.bidder.email}`
        );
        console.log(
          `   Email config: ${process.env.EMAIL_USER} / Pass: ${
            process.env.EMAIL_PASS
              ? "***" + process.env.EMAIL_PASS.slice(-4)
              : "NOT SET"
          }`
        );
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a; text-align: center;">🎉 Congratulations! You Won the Auction! 🎉</h1>
              
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #15803d;">Auction Details</h2>
                <p><strong>Item:</strong> ${listing.wasteType}</p>
                <p><strong>Your Winning Bid:</strong> ₹${winningBid.amount}</p>
                <p><strong>Quantity:</strong> ${listing.quantity} ${
            listing.unit
          }</p>
                ${
                  listing.location
                    ? `<p><strong>Pickup Location:</strong> ${listing.location}</p>`
                    : ""
                }
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #1e40af;">Seller Contact Information</h2>
                <p><strong>Name:</strong> ${listing.seller.name}</p>
                ${
                  listing.seller.phone
                    ? `<p><strong>Phone:</strong> ${listing.seller.phone}</p>`
                    : ""
                }
                ${
                  listing.seller.email
                    ? `<p><strong>Email:</strong> ${listing.seller.email}</p>`
                    : ""
                }
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #d97706;">📱 Your QR Code for Pickup</h2>
                <p>Show this QR code to the seller during pickup. The seller will scan it to confirm the transaction and release the points.</p>
                <div style="text-align: center; margin: 20px 0;">
                  <img src="cid:qrcode" alt="Verification QR Code" style="max-width: 300px; border: 2px solid #d97706; border-radius: 8px;" />
                </div>
                <p style="font-size: 12px; color: #92400e; text-align: center;">Verification Code: ${verificationCode}</p>
              </div>

              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #991b1b;">⚠️ Important Instructions</h3>
                <ol>
                  <li>Contact the seller using the information above to arrange pickup</li>
                  <li>Bring this QR code (screenshot or show on phone) during pickup</li>
                  <li>The seller will scan your QR code to verify the transaction</li>
                  <li>You'll receive <strong>+${BUYER_COMPLETION_POINTS} EcoPoints</strong> after verification</li>
                  <li>The seller will receive <strong>+${LISTING_COMPLETION_POINTS} EcoPoints</strong></li>
                </ol>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">Thank you for participating in our marketplace!</p>
                <p style="color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
              </div>
            </div>
          `;

          await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: winningBid.bidder.email,
            subject: `🎉 You Won! ${listing.wasteType} Auction - Pickup QR Code Inside`,
            html: emailHtml,
            attachments: [
              {
                filename: "qr-code.png",
                content: qrCodeBuffer,
                contentType: "image/png",
                cid: "qrcode", // Content ID for embedding in HTML
              },
            ],
          });

          console.log(
            `✅ Email sent successfully to winner: ${winningBid.bidder.email}`
          );
        } catch (emailError) {
          console.error(
            "❌ Error sending email to winner:",
            emailError.message
          );
          console.error("   Full error:", emailError);
          // Continue execution even if email fails
        }
      } else {
        console.log(
          `⚠️ Email NOT sent - EMAIL_USER: ${!!process.env
            .EMAIL_USER}, QR Code: ${!!qrCodeDataUrl}`
        );
      }

      // Notify winner (in-app notification)
      await createNotification({
        userId: winningBid.bidderId,
        type: "AUCTION_WON",
        title: "Congratulations! You Won!",
        body: `You won the auction for ${listing.wasteType} at ₹${winningBid.amount}. Check your email for pickup details.`,
        data: {
          listingId: listing.id,
          verificationCode,
        },
      });

      // Notify seller
      await createNotification({
        userId: listing.sellerId,
        type: "AUCTION_ENDED",
        title: "Auction Ended",
        body: `Your ${listing.wasteType} auction ended. Winner: ${winningBid.bidder.name} (₹${winningBid.amount})`,
        data: {
          listingId: listing.id,
          winnerId: winningBid.bidderId,
          winningAmount: winningBid.amount,
        },
      });

      console.log(
        `✅ Auction finalized: ${listingId}, Winner: ${winningBid.bidderId}`
      );
    } else {
      // No bids - mark as ended
      await prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { status: "ENDED" },
      });

      // Notify seller
      await createNotification({
        userId: listing.sellerId,
        type: "AUCTION_ENDED",
        title: "Auction Ended",
        body: `Your ${listing.wasteType} auction ended with no bids.`,
        data: { listingId: listing.id },
      });

      console.log(`⏰ Auction ended with no bids: ${listingId}`);
    }
  } catch (error) {
    console.error("Error finalizing auction:", error);
  }
}

/**
 * POST /api/marketplace/:id/verify-qr
 * Verify QR code and complete transaction
 */
router.post("/:id/verify-qr", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];
    const { verificationCode } = req.body;

    if (!verificationCode) {
      return res.status(400).json({ error: "Verification code is required" });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        seller: true,
        winner: true,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Only seller can verify QR code
    if (listing.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the seller can verify the pickup" });
    }

    if (listing.status !== "ENDED") {
      return res
        .status(400)
        .json({ error: "Listing is not ready for verification" });
    }

    if (listing.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (listing.verifiedAt) {
      return res
        .status(400)
        .json({ error: "This listing has already been verified" });
    }

    // Complete transaction and award points
    const result = await prisma.$transaction(async (tx) => {
      // Update listing
      const updatedListing = await tx.marketplaceListing.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          verifiedAt: new Date(),
        },
      });

      // Award points to seller
      await tx.user.update({
        where: { id: listing.sellerId },
        data: {
          collectorPoints: { increment: LISTING_COMPLETION_POINTS },
          globalPoints: { increment: LISTING_COMPLETION_POINTS },
        },
      });

      // Award points to buyer
      await tx.user.update({
        where: { id: listing.winnerId },
        data: {
          collectorPoints: { increment: BUYER_COMPLETION_POINTS },
          globalPoints: { increment: BUYER_COMPLETION_POINTS },
        },
      });

      return updatedListing;
    });

    // Notify both parties
    await createNotification({
      userId: listing.sellerId,
      type: "AUCTION_ENDED",
      title: "Transaction Complete! 🎉",
      body: `You earned ${LISTING_COMPLETION_POINTS} points for completing the sale!`,
      data: { listingId: listing.id, points: LISTING_COMPLETION_POINTS },
    });

    await createNotification({
      userId: listing.winnerId,
      type: "AUCTION_WON",
      title: "Pickup Verified! 🎉",
      body: `You earned ${BUYER_COMPLETION_POINTS} points for completing the purchase!`,
      data: { listingId: listing.id, points: BUYER_COMPLETION_POINTS },
    });

    res.json({
      message: "Transaction completed successfully!",
      listing: result,
      sellerPoints: LISTING_COMPLETION_POINTS,
      buyerPoints: BUYER_COMPLETION_POINTS,
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    res.status(500).json({ error: "Failed to verify transaction" });
  }
});

/**
 * POST /api/marketplace/:id/close-bid
 * Close auction early and finalize with current highest bidder (seller only)
 */
router.post("/:id/close-bid", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
          include: {
            bidder: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.sellerId !== userId) {
      return res.status(403).json({ error: "Only seller can close the bid" });
    }

    if (listing.status !== "ACTIVE") {
      return res.status(400).json({ error: "Listing is not active" });
    }

    if (!listing.bids || listing.bids.length === 0) {
      return res.status(400).json({
        error: "Cannot close auction with no bids. Use cancel instead.",
      });
    }

    // Finalize auction manually (skip time check)
    await finalizeAuction(id, true);

    const updatedListing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Auction closed successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error closing bid:", error);
    res.status(500).json({ error: "Failed to close bid" });
  }
});

/**
 * POST /api/marketplace/:id/cancel
 * Cancel listing (seller only, no bids)
 */
router.post("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the seller can cancel this listing" });
    }

    if (listing.status !== "ACTIVE") {
      return res.status(400).json({ error: "Listing is not active" });
    }

    if (listing._count.bids > 0) {
      return res
        .status(400)
        .json({ error: "Cannot cancel listing with existing bids" });
    }

    const updatedListing = await prisma.marketplaceListing.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.json({
      message: "Listing cancelled successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error cancelling listing:", error);
    res.status(500).json({ error: "Failed to cancel listing" });
  }
});

export default router;
