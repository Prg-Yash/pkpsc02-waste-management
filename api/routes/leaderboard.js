import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * Helper function to get userId from request
 * Checks header and body params
 */
const getUserId = (req) => {
    return req.get('x-user-id') || req.body.userId;
};

/**
 * Helper function to validate user exists
 */
const validateUser = async (userId) => {
    if (!userId) {
        return { error: 'Unauthorized: userId is required in header "x-user-id" or body param', status: 401 };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        return { error: 'Unauthorized: User not found', status: 401 };
    }

    return { user };
};

/**
 * Helper function to calculate rank for a user
 * Rank = (number of users with better score) + 1
 */
const calculateRank = async (userId, orderBy) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            reporterPoints: true,
            collectorPoints: true,
            globalPoints: true,
            createdAt: true,
        }
    });

    if (!user) return null;

    // Build where clause based on ranking criteria
    let whereClause;

    if (orderBy.reporterPoints) {
        // Reporters leaderboard
        whereClause = {
            OR: [
                { reporterPoints: { gt: user.reporterPoints } },
                {
                    reporterPoints: user.reporterPoints,
                    globalPoints: { gt: user.globalPoints }
                },
                {
                    reporterPoints: user.reporterPoints,
                    globalPoints: user.globalPoints,
                    createdAt: { lt: user.createdAt }
                }
            ]
        };
    } else if (orderBy.collectorPoints) {
        // Collectors leaderboard
        whereClause = {
            OR: [
                { collectorPoints: { gt: user.collectorPoints } },
                {
                    collectorPoints: user.collectorPoints,
                    globalPoints: { gt: user.globalPoints }
                },
                {
                    collectorPoints: user.collectorPoints,
                    globalPoints: user.globalPoints,
                    createdAt: { lt: user.createdAt }
                }
            ]
        };
    } else {
        // Global leaderboard
        whereClause = {
            OR: [
                { globalPoints: { gt: user.globalPoints } },
                {
                    globalPoints: user.globalPoints,
                    reporterPoints: { gt: user.reporterPoints }
                },
                {
                    globalPoints: user.globalPoints,
                    reporterPoints: user.reporterPoints,
                    collectorPoints: { gt: user.collectorPoints }
                },
                {
                    globalPoints: user.globalPoints,
                    reporterPoints: user.reporterPoints,
                    collectorPoints: user.collectorPoints,
                    createdAt: { lt: user.createdAt }
                }
            ]
        };
    }

    const betterUsers = await prisma.user.count({ where: whereClause });
    return betterUsers + 1;
};

/**
 * GET /api/leaderboard/reporters
 * Reporters leaderboard - ranked by reporterPoints
 * Accepts userId in header (x-user-id) or query param
 */
router.get('/reporters', async (req, res) => {
    try {
        const userId = getUserId(req);
        const validation = await validateUser(userId);

        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
        }

        // Parse pagination
        const page = Math.max(1, parseInt(req.body.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.body.pageSize) || 20));
        const skip = (page - 1) * pageSize;

        // Get total count
        const totalUsers = await prisma.user.count();
        const totalPages = Math.ceil(totalUsers / pageSize);

        // Fetch leaderboard with efficient select
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                reporterPoints: true,
                createdAt: true,
            },
            orderBy: [
                { reporterPoints: 'desc' },
                { globalPoints: 'desc' },
                { createdAt: 'asc' }
            ],
            skip,
            take: pageSize,
        });

        // Calculate ranks for the page
        const usersWithRank = await Promise.all(
            users.map(async (user, index) => {
                const rank = await calculateRank(user.id, { reporterPoints: 'desc' });
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    reporterPoints: user.reporterPoints,
                    rank,
                };
            })
        );

        // Get current user's rank and points
        const myRank = await calculateRank(userId, { reporterPoints: 'desc' });
        const myData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                reporterPoints: true,
            }
        });

        res.json({
            leaderboard: usersWithRank,
            me: {
                id: myData.id,
                name: myData.name,
                email: myData.email,
                reporterPoints: myData.reporterPoints,
                rank: myRank,
            },
            pagination: {
                currentPage: page,
                pageSize,
                totalPages,
                totalUsers,
            }
        });
    } catch (error) {
        console.error('Error fetching reporters leaderboard:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/leaderboard/collectors
 * Collectors leaderboard - ranked by collectorPoints
 * Shows collectorPoints as null when enableCollector === false AND collectorPoints === 0
 * Accepts userId in header (x-user-id) or query param
 */
router.get('/collectors', async (req, res) => {
    try {
        const userId = getUserId(req);
        const validation = await validateUser(userId);

        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
        }

        // Parse pagination
        const page = Math.max(1, parseInt(req.body.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.body.pageSize) || 20));
        const skip = (page - 1) * pageSize;

        // Get total count
        const totalUsers = await prisma.user.count();
        const totalPages = Math.ceil(totalUsers / pageSize);

        // Fetch leaderboard with efficient select
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                collectorPoints: true,
                enableCollector: true,
                createdAt: true,
            },
            orderBy: [
                { collectorPoints: 'desc' },
                { globalPoints: 'desc' },
                { createdAt: 'asc' }
            ],
            skip,
            take: pageSize,
        });

        // Calculate ranks for the page
        const usersWithRank = await Promise.all(
            users.map(async (user, index) => {
                const rank = await calculateRank(user.id, { collectorPoints: 'desc' });
                // Show collectorPoints as null when enableCollector === false AND collectorPoints === 0
                const displayPoints = (!user.enableCollector && user.collectorPoints === 0)
                    ? null
                    : user.collectorPoints;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    collectorPoints: displayPoints,
                    rank,
                };
            })
        );

        // Get current user's rank and points
        const myRank = await calculateRank(userId, { collectorPoints: 'desc' });
        const myData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                collectorPoints: true,
                enableCollector: true,
            }
        });

        const myDisplayPoints = (!myData.enableCollector && myData.collectorPoints === 0)
            ? null
            : myData.collectorPoints;

        res.json({
            leaderboard: usersWithRank,
            me: {
                id: myData.id,
                name: myData.name,
                email: myData.email,
                collectorPoints: myDisplayPoints,
                rank: myRank,
            },
            pagination: {
                currentPage: page,
                pageSize,
                totalPages,
                totalUsers,
            }
        });
    } catch (error) {
        console.error('Error fetching collectors leaderboard:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/leaderboard/global
 * Global leaderboard - ranked by globalPoints
 * Accepts userId in header (x-user-id) or query param
 */
router.get('/global', async (req, res) => {
    try {
        const userId = getUserId(req);
        const validation = await validateUser(userId);

        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
        }

        // Parse pagination
        const page = Math.max(1, parseInt(req.body.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.body.pageSize) || 20));
        const skip = (page - 1) * pageSize;

        // Get total count
        const totalUsers = await prisma.user.count();
        const totalPages = Math.ceil(totalUsers / pageSize);

        // Fetch leaderboard with efficient select
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                globalPoints: true,
                reporterPoints: true,
                collectorPoints: true,
                enableCollector: true,
                createdAt: true,
            },
            orderBy: [
                { globalPoints: 'desc' },
                { reporterPoints: 'desc' },
                { collectorPoints: 'desc' },
                { createdAt: 'asc' }
            ],
            skip,
            take: pageSize,
        });

        // Calculate ranks for the page
        const usersWithRank = await Promise.all(
            users.map(async (user, index) => {
                const rank = await calculateRank(user.id, { globalPoints: 'desc' });
                const displayCollectorPoints = (!user.enableCollector && user.collectorPoints === 0)
                    ? null
                    : user.collectorPoints;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    globalPoints: user.globalPoints,
                    reporterPoints: user.reporterPoints,
                    collectorPoints: displayCollectorPoints,
                    rank,
                };
            })
        );

        // Get current user's rank and points
        const myRank = await calculateRank(userId, { globalPoints: 'desc' });
        const myData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                globalPoints: true,
                reporterPoints: true,
                collectorPoints: true,
                enableCollector: true,
            }
        });

        const myDisplayCollectorPoints = (!myData.enableCollector && myData.collectorPoints === 0)
            ? null
            : myData.collectorPoints;

        res.json({
            leaderboard: usersWithRank,
            me: {
                id: myData.id,
                name: myData.name,
                email: myData.email,
                globalPoints: myData.globalPoints,
                reporterPoints: myData.reporterPoints,
                collectorPoints: myDisplayCollectorPoints,
                rank: myRank,
            },
            pagination: {
                currentPage: page,
                pageSize,
                totalPages,
                totalUsers,
            }
        });
    } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
