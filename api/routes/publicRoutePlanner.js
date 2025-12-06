import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * Helper function to format location text for WhatsApp messages
 */
const formatLocationText = (waste) => {
    if (waste.locationRaw) {
        return waste.locationRaw;
    }

    const parts = [];
    if (waste.city) parts.push(waste.city);
    if (waste.state) parts.push(waste.state);
    if (waste.country) parts.push(waste.country);

    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
};

/**
 * Helper function to generate WhatsApp-compatible route planner message
 * This creates a structured text message (not a template) for session messages
 * JSON-safe and Meta WhatsApp compliant - returns single line with \n for newlines
 */
export const generateRoutePlannerMessage = (user, routePlanner) => {
    const count = routePlanner.length;

    if (count === 0) {
        return "*ROUTE PLANNER SUMMARY* (EcoFlow)\\n\\nYou currently have no waste locations scheduled for pickup.\\n\\nTo add waste to your route, browse available reports in the app.";
    }

    let message = "*ROUTE PLANNER SUMMARY* (EcoFlow)\\n\\n";
    message += `Hello ${user.name || 'Collector'}!\\n`;
    message += `You currently have *${count}* waste location${count > 1 ? 's' : ''} scheduled for pickup.\\n\\n`;
    message += "========================================\\n\\n";

    // Loop through each waste item
    routePlanner.forEach((waste, index) => {
        const wasteType = waste.aiAnalysis?.wasteType || 'Unknown';
        const reporterName = waste.reporter?.name || 'Unknown Reporter';
        const location = formatLocationText(waste);
        const status = waste.status;

        message += `*#${index + 1}* - ${wasteType} Waste\\n`;
        message += `Waste ID: ${waste.id}\\n`;
        message += `Status: ${status}\\n`;
        message += `Reported By: ${reporterName}\\n`;
        message += `Location: ${location}\\n`;

        // Add map link if coordinates available
        if (waste.latitude && waste.longitude) {
            message += `View on Map:\\n`;
            message += `https://www.google.com/maps/dir/?api=1&destination=${waste.latitude},${waste.longitude}\\n`;
        }

        message += "\\n========================================\\n\\n";
    });

    // Generate complete optimized route URL
    if (count > 1) {
        const waypointsWithCoords = routePlanner.filter(w => w.latitude && w.longitude);

        if (waypointsWithCoords.length > 1) {
            const waypoints = waypointsWithCoords
                .slice(0, -1) // All except last
                .map(w => `${w.latitude},${w.longitude}`)
                .join('|');

            const lastWaste = waypointsWithCoords[waypointsWithCoords.length - 1];
            const destination = `${lastWaste.latitude},${lastWaste.longitude}`;

            message += "*COMPLETE OPTIMIZED ROUTE*\\n";
            message += "Navigate through all locations in order:\\n";
            message += `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&destination=${destination}\\n\\n`;
        }
    }

    message += "========================================\\n";
    message += "*Need help?*\\n";
    message += "- Send 'Help' for all commands\\n";
    message += "- Send 'Remove {wasteId}' to remove from route\\n";
    message += "Thank you for keeping our city clean!";

    return message;
};

/**
 * POST /api/public/route-planner/remove
 * Public endpoint to remove a waste from collector's route planner
 * Used by WhatsApp AI agent for "Remove {wasteId}" commands
 * 
 * Body Parameters:
 * - phone (required): User's phone number (e.g., +91XXXXXXXXXX or 918097296453)
 * - wasteId (required): Waste report ID to remove from route
 * 
 * Returns:
 * - Success message with updated waste details
 */
router.post('/route-planner/remove', async (req, res) => {
    try {
        const { phone, wasteId } = req.body;

        // Validate required parameters
        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        if (!wasteId) {
            return res.status(400).json({
                success: false,
                error: 'Waste ID is required'
            });
        }

        // Normalize phone number (remove + if present)
        const normalizedPhone = phone.replace(/^\+/, '').trim();

        // Find user by phone
        const user = await prisma.user.findFirst({
            where: {
                phone: normalizedPhone
            },
            select: {
                id: true,
                name: true,
                phone: true,
                phoneVerified: true,
                whatsappMessagingEnabled: true,
                enableCollector: true
            }
        });

        // Validate user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found with this phone number'
            });
        }

        // Validate phone is verified
        if (!user.phoneVerified) {
            return res.status(403).json({
                success: false,
                error: 'Phone number is not verified. Please verify your phone number through the app first.'
            });
        }

        // Validate WhatsApp messaging is enabled
        if (!user.whatsappMessagingEnabled) {
            return res.status(403).json({
                success: false,
                error: 'WhatsApp messaging is not enabled for this account. Please enable it in your profile settings.'
            });
        }

        // Find the waste report
        const waste = await prisma.wasteReport.findUnique({
            where: { id: wasteId },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                routeCollector: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Validate waste exists
        if (!waste) {
            return res.status(404).json({
                success: false,
                error: 'Waste not found. Please check the waste ID and try again.'
            });
        }

        // Validate waste is in user's route
        if (waste.routeCollectorId !== user.id) {
            return res.status(403).json({
                success: false,
                error: 'This waste is not in your route planner. You can only remove waste that you have added to your route.'
            });
        }

        // Validate waste status is IN_PROGRESS
        if (waste.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                success: false,
                error: `Cannot remove waste from route. Current status: ${waste.status}. Only IN_PROGRESS waste can be removed from route.`
            });
        }

        // Remove waste from route: status = PENDING, routeCollectorId = null
        const updatedWaste = await prisma.wasteReport.update({
            where: { id: wasteId },
            data: {
                status: 'PENDING',
                routeCollectorId: null
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Return success response
        res.json({
            success: true,
            message: 'Waste removed from route planner successfully',
            waste: {
                id: updatedWaste.id,
                wasteType: updatedWaste.aiAnalysis?.wasteType || 'Unknown',
                status: updatedWaste.status,
                location: formatLocationText(updatedWaste),
                reporter: {
                    id: updatedWaste.reporter.id,
                    name: updatedWaste.reporter.name
                }
            }
        });

    } catch (error) {
        console.error('Error removing waste from route planner:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while removing waste from route planner'
        });
    }
});

/**
 * GET /api/public/route-planner
 * Public endpoint to fetch route planner data by phone number
 * Used by WhatsApp AI agent for "Show Route Planner" commands
 * 
 * Query Parameters:
 * - phone (required): User's phone number (e.g., +91XXXXXXXXXX or 918097296453)
 * 
 * Returns:
 * - User info (id, name, phone, verification status)
 * - Route planner waste items with details
 * - WhatsApp-formatted message (optional, can be generated on demand)
 */
router.get('/route-planner', async (req, res) => {
    try {
        const { phone } = req.query;

        // Validate phone parameter
        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required. Use ?phone=+91XXXXXXXXXX'
            });
        }

        // Normalize phone number (remove + if present, handle both formats)
        const normalizedPhone = phone.replace(/^\+/, '').trim();

        // Look up user by phone
        const user = await prisma.user.findFirst({
            where: {
                phone: normalizedPhone
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                phoneVerified: true,
                whatsappMessagingEnabled: true,
                enableCollector: true,
                city: true,
                state: true,
                country: true
            }
        });

        // Validate user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found with this phone number. Please check the number and try again.'
            });
        }

        // Validate phone is verified
        if (!user.phoneVerified) {
            return res.status(403).json({
                success: false,
                error: 'Phone number is not verified. Please verify your phone number through the app first.',
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    phoneVerified: false
                }
            });
        }

        // Validate WhatsApp messaging is enabled
        if (!user.whatsappMessagingEnabled) {
            return res.status(403).json({
                success: false,
                error: 'WhatsApp messaging is not enabled for this account. Please enable it in your profile settings.',
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    phoneVerified: true,
                    whatsappMessagingEnabled: false
                }
            });
        }

        // Validate user has collector mode enabled
        if (!user.enableCollector) {
            return res.status(403).json({
                success: false,
                error: 'Collector mode is not enabled. Please enable collector mode to use route planner.',
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    phoneVerified: true,
                    whatsappMessagingEnabled: true,
                    enableCollector: false
                }
            });
        }

        // Fetch all wastes where routeCollectorId = user.id
        // Limit to 200 items to avoid overwhelming WhatsApp messages
        const routePlanner = await prisma.wasteReport.findMany({
            where: {
                routeCollectorId: user.id
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                routeCollector: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc' // First added = first in route
            },
            take: 200 // Limit to prevent message overflow
        });

        // Format response with clean waste data
        const formattedRoute = routePlanner.map(waste => ({
            id: waste.id,
            wasteType: waste.aiAnalysis?.wasteType || 'Unknown',
            status: waste.status,
            location: formatLocationText(waste),
            latitude: waste.latitude,
            longitude: waste.longitude,
            imageUrl: waste.imageUrl,
            reporter: {
                id: waste.reporter.id,
                name: waste.reporter.name
            },
            estimatedWeight: waste.aiAnalysis?.estimatedWeightKg || null,
            createdAt: waste.createdAt,
            reportedAt: waste.reportedAt
        }));

        // Generate WhatsApp message
        const whatsappMessage = generateRoutePlannerMessage(user, routePlanner);

        // Return successful response
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                phoneVerified: user.phoneVerified,
                whatsappMessagingEnabled: user.whatsappMessagingEnabled,
                enableCollector: user.enableCollector,
                address: `${user.city || ''}, ${user.state || ''}, ${user.country || ''}`.trim()
            },
            routePlanner: formattedRoute,
            count: formattedRoute.length,
            whatsappMessage: whatsappMessage, // Pre-formatted message for WhatsApp
            message: `Successfully retrieved ${formattedRoute.length} waste location${formattedRoute.length !== 1 ? 's' : ''} from route planner`
        });

    } catch (error) {
        console.error('Error fetching public route planner:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while fetching route planner data'
        });
    }
});

/**
 * GET /api/public/route-planner/message
 * Returns only the WhatsApp-formatted message (no JSON data)
 * Useful for direct message sending without parsing full response
 */
router.get('/route-planner/message', async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const normalizedPhone = phone.replace(/^\+/, '').trim();

        // Fetch user
        const user = await prisma.user.findFirst({
            where: { phone: normalizedPhone },
            select: {
                id: true,
                name: true,
                phoneVerified: true,
                whatsappMessagingEnabled: true,
                enableCollector: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.phoneVerified || !user.whatsappMessagingEnabled) {
            return res.status(403).json({
                success: false,
                error: 'User not authorized for WhatsApp messaging'
            });
        }

        // Fetch route planner
        const routePlanner = await prisma.wasteReport.findMany({
            where: { routeCollectorId: user.id },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: 200
        });

        // Generate message
        const message = generateRoutePlannerMessage(user, routePlanner);

        // Return plain text message
        res.type('text/plain').send(message);

    } catch (error) {
        console.error('Error generating route planner message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate route planner message'
        });
    }
});

export default router;
