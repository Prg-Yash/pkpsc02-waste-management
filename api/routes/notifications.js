import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

/**
 * Middleware to authenticate user
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Try to get userId from header first
    let userId = req.get("x-user-id");

    // If not in header, try to get from body
    if (!userId && req.body) {
      userId = req.body.userId;
    }

    // Validate userId is present
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: userId is required in header "x-user-id" or body',
      });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Validate user exists
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized: User not found",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authentication:", error);
    return res.status(500).json({
      error: "Internal server error during authentication",
    });
  }
};

/**
 * GET /api/notifications
 * Get user notifications (filtered by user's state)
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    // Build query filter
    const where = {
      userId: req.user.id,
    };

    if (unreadOnly === "true") {
      where.read = false;
    }

    // Fetch notifications with related waste report data to filter by state
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter notifications by state if waste-related
    const filteredNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // If notification has wasteReportId in data, check state
        if (notification.data && notification.data.wasteReportId) {
          const wasteReport = await prisma.wasteReport.findUnique({
            where: { id: notification.data.wasteReportId },
            select: { state: true },
          });

          // Only include if waste report is from user's state
          if (wasteReport && wasteReport.state === req.user.state) {
            return notification;
          }
          return null;
        }
        // Include non-waste notifications (system, leaderboard, etc.)
        return notification;
      })
    );

    // Remove null entries
    const validNotifications = filteredNotifications.filter((n) => n !== null);

    res.json({ notifications: validNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/:id/read", authenticateUser, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Fetch notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // Validate notification exists
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Validate notification belongs to user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        error: "Unauthorized: Notification does not belong to this user",
      });
    }

    // Update notification to read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
      },
    });

    res.json({ notification: updatedNotification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
