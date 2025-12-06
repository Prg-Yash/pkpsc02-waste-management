import express from 'express';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../lib/notifications.js';

const router = express.Router();

/**
 * Middleware to authenticate user
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Try to get userId from header first
        let userId = req.get('x-user-id');

        // If not in header, try to get from body
        if (!userId && req.body) {
            userId = req.body.userId;
        }

        // Validate userId is present
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized: userId is required in header "x-user-id" or body'
            });
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // Validate user exists
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized: User not found'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in authentication:', error);
        return res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

/**
 * GET /api/user/me
 * Get current user profile with waste reports
 */
router.get('/me', authenticateUser, async (req, res) => {
    try {
        // Fetch user with related data
        const userWithData = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                reportedWastes: {
                    orderBy: { createdAt: 'desc' }
                },
                collectedWastes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        res.json({ user: userWithData });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/user/all
 * Get all users (for admin dashboard)
 */
router.get('/all', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        reportedWastes: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Map users to include report count and remove _count field
        const usersWithCounts = users.map(({ _count, ...user }) => ({
            ...user,
            reportsCount: _count.reportedWastes
        }));

        res.json({ users: usersWithCounts });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/user/me
 * Update current user profile
 */
router.patch('/me', authenticateUser, async (req, res) => {
    try {
        const { name, phone, enableCollector, city, state, country } = req.body;

        // Track if collector was just enabled
        const wasCollectorEnabled = !req.user.enableCollector && enableCollector === true;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(enableCollector !== undefined && { enableCollector }),
                ...(city !== undefined && { city: city || null }),
                ...(state !== undefined && { state: state || null }),
                ...(country !== undefined && { country: country || null }),
            },
            include: {
                reportedWastes: {
                    orderBy: { createdAt: 'desc' }
                },
                collectedWastes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // If collector was just enabled, send notification
        if (wasCollectorEnabled) {
            await createNotification({
                userId: req.user.id,
                type: 'COLLECTOR_ENABLED',
                title: 'Collector Mode Enabled',
                body: 'You can now collect waste reports from your area.',
                data: null
            });
        }

        res.json({ user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
