import express from "express";
import { prisma } from "../lib/prisma.js";
import { createNotification } from "../lib/notifications.js";

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
 * GET /api/user/all
 * Get all users with their statistics
 */
router.get("/all", async (req, res) => {
    try {
        // Fetch all users with related counts
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                phoneVerified: true,
                enableCollector: true,
                city: true,
                state: true,
                country: true,
                reporterPoints: true,
                collectorPoints: true,
                globalPoints: true,
                createdAt: true,
                _count: {
                    select: {
                        reportedWastes: true,
                        collectedWastes: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Format response with computed fields
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            phoneVerified: user.phoneVerified,
            reportCount: user._count.reportedWastes,
            collectionCount: user.enableCollector ? user._count.collectedWastes : null,
            enableCollector: user.enableCollector,
            address: user.enableCollector ? {
                city: user.city,
                state: user.state,
                country: user.country,
            } : null,
            reporterPoints: user.reporterPoints,
            collectorPoints: user.enableCollector ? user.collectorPoints : null,
            globalPoints: user.globalPoints,
            joinedAt: user.createdAt,
            status: user.phoneVerified && user.city && user.state && user.country ? 'active' : 'incomplete',
        }));

        res.json({
            users: formattedUsers,
            total: formattedUsers.length,
        });
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/user/me
 * Get current user profile with waste reports
 */
router.get("/me", authenticateUser, async (req, res) => {
    try {
        // Fetch user with related data
        const userWithData = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                reportedWastes: {
                    orderBy: { createdAt: "desc" },
                },
                collectedWastes: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        res.json({ user: userWithData });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * PATCH /api/user/me
 * Update current user profile
 */
router.patch('/me', authenticateUser, async (req, res) => {
    try {
        const { name, phone, city, state, country, enableCollector } = req.body;

        // Validate phone number format if provided
        if (phone !== undefined && phone !== null && phone !== '') {
            // Remove any whitespace
            const cleanedPhone = phone.trim();

            // Check format: should be digits only, starting with country code (2-3 digits) + 10 digit phone number
            // Example: 918097296453 (91 = country code, 8097296453 = 10 digit number)
            const phoneRegex = /^\d{12,13}$/;

            if (!phoneRegex.test(cleanedPhone)) {
                return res.status(400).json({
                    error: 'Invalid phone number format. Please enter phone number as: [country code][10 digit number] (e.g., 918097296453 for India)'
                });
            }

            // Additional validation: check if it has at least 2 digits for country code and 10 for phone
            if (cleanedPhone.length < 12) {
                return res.status(400).json({
                    error: 'Phone number too short. Format should be: [country code][10 digit number] (e.g., 918097296453)'
                });
            }
        }

        // Track if collector was just enabled
        const wasCollectorEnabled =
            !req.user.enableCollector && enableCollector === true;

        // Track if phone number is being changed
        const isPhoneChanged = phone !== undefined && phone !== req.user.phone;

        // Prepare update data
        const updateData = {
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone: phone ? phone.trim() : phone }),
            ...(enableCollector !== undefined && { enableCollector }),
            ...(city !== undefined && { city: city || null }),
            ...(state !== undefined && { state: state || null }),
            ...(country !== undefined && { country: country || null }),
        };

        // If phone number is changed, reset phoneVerified
        if (isPhoneChanged) {
            updateData.phoneVerified = false;
            console.log('📞 Phone number changed for user:', req.user.id, '- phoneVerified reset to false');
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            include: {
                reportedWastes: {
                    orderBy: { createdAt: "desc" },
                },
                collectedWastes: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        // If collector was just enabled, send notification
        if (wasCollectorEnabled) {
            await createNotification({
                userId: req.user.id,
                type: "COLLECTOR_ENABLED",
                title: "Collector Mode Enabled",
                body: "You can now collect waste reports from your area.",
                data: null,
            });
        }

        res.json({ user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
