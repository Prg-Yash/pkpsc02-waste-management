import express from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { createNotification } from "../lib/notifications.js";
import {
    uploadToS3,
    generateWasteReportKey,
    generateWasteCollectionKey,
} from "../lib/s3Uploader.js";
import { REPORT_POINTS, COLLECT_POINTS } from "../lib/points.js";

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

/**
 * Middleware to authenticate user (works with multipart forms)
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Try to get userId from header first
        let userId = req.get("x-user-id");

        // If not in header, try to get from body (works with multer)
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
 * POST /api/waste/report
 * Create a new waste report with image upload
 * Accepts multipart/form-data with 'image' file field
 */
router.post(
    "/report",
    upload.single("image"),
    authenticateUser,
    async (req, res) => {
        try {
            // Validate user has address fields set
            if (!req.user.city || !req.user.state || !req.user.country) {
                return res.status(400).json({
                    error: "Please update your profile with city, state, and country before reporting or collecting waste."
                });
            }

            const {
                location,
                isLocationLatLng,
                latitude,
                longitude,
                city,
                state,
                country,
                aiAnalysis, // AI analysis JSON data (contains wasteType, estimatedWeightKg, notes)
            } = req.body;

            // Debug logging
            console.log("📝 Waste Report Request Body:", {
                location,
                isLocationLatLng,
                hasFile: !!req.file,
                aiAnalysisType: typeof aiAnalysis,
                aiAnalysisPreview: aiAnalysis ? aiAnalysis.substring(0, 100) : "null",
            });

            // Validate file upload
            if (!req.file) {
                return res.status(400).json({ error: "image file is required" });
            }

            // Validate required fields
            if (!location) {
                return res.status(400).json({ error: "location is required" });
            }

            if (!aiAnalysis) {
                return res.status(400).json({ error: "aiAnalysis is required" });
            }

            // Parse AI analysis if provided
            let parsedAiAnalysis = null;
            if (aiAnalysis) {
                try {
                    parsedAiAnalysis =
                        typeof aiAnalysis === "string"
                            ? JSON.parse(aiAnalysis)
                            : aiAnalysis;

                    console.log("✅ Parsed AI Analysis:", parsedAiAnalysis);

                    // Validate AI analysis has required fields
                    if (!parsedAiAnalysis.wasteType || !parsedAiAnalysis.category) {
                        console.error("❌ Missing required fields:", {
                            hasWasteType: !!parsedAiAnalysis.wasteType,
                            hasCategory: !!parsedAiAnalysis.category,
                            actualFields: Object.keys(parsedAiAnalysis),
                        });
                        return res.status(400).json({
                            error: "aiAnalysis must contain wasteType and category",
                            received: {
                                wasteType: parsedAiAnalysis.wasteType,
                                category: parsedAiAnalysis.category,
                                allFields: Object.keys(parsedAiAnalysis),
                            },
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse aiAnalysis:", e);
                    console.error("Raw aiAnalysis value:", aiAnalysis);
                    return res.status(400).json({
                        error: "Invalid aiAnalysis format",
                        details: e.message,
                    });
                }
            }

            // Step 1: Create waste report WITHOUT imageUrl to get the ID
            const wasteReport = await prisma.wasteReport.create({
                data: {
                    reporterId: req.user.id,
                    imageUrl: "", // Temporary empty string
                    locationRaw: location,
                    isLocationLatLng:
                        isLocationLatLng === "true" || isLocationLatLng === true,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    city: city || null,
                    state: state || null,
                    country: country || null,
                    aiAnalysis: parsedAiAnalysis,
                    status: "PENDING",
                },
            });

            // Step 2: Generate S3 key using the report ID
            const s3Key = generateWasteReportKey(
                wasteReport.id,
                req.file.originalname
            );

            // Step 3: Upload image to S3
            const imageUrl = await uploadToS3(
                req.file.buffer,
                s3Key,
                req.file.mimetype
            );

            // Step 4: Update waste report with actual imageUrl AND award reporter points
            const [updatedWasteReport, updatedUser] = await prisma.$transaction([
                prisma.wasteReport.update({
                    where: { id: wasteReport.id },
                    data: { imageUrl },
                    include: {
                        reporter: true,
                    },
                }),
                prisma.user.update({
                    where: { id: req.user.id },
                    data: {
                        reporterPoints: { increment: REPORT_POINTS },
                        globalPoints: { increment: REPORT_POINTS },
                    },
                }),
            ]);

            // Step 5: Create notification for the reporter
            await createNotification({
                userId: req.user.id,
                type: "WASTE_REPORTED",
                title: "Waste Report Created",
                body: `Your waste report for ${parsedAiAnalysis.wasteType.toUpperCase()} has been created successfully. +${REPORT_POINTS} points!`,
                data: {
                    wasteReportId: updatedWasteReport.id,
                    pointsEarned: REPORT_POINTS,
                },
            });

            // Step 6: Notify collectors in the same state
            // Find all collectors with enableCollector=true and matching state
            const collectorsInState = await prisma.user.findMany({
                where: {
                    enableCollector: true,
                    state: req.user.state, // Match reporter's state
                    id: { not: req.user.id }, // Exclude the reporter themselves
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            // Send notification to each collector in parallel
            const notificationPromises = collectorsInState.map((collector) =>
                createNotification({
                    userId: collector.id,
                    type: "WASTE_REPORTED",
                    title: "New Waste Available",
                    body: `Clear the Waste: ${parsedAiAnalysis.wasteType.toUpperCase()} waste reported in ${req.user.city || "your area"}, ${req.user.state}. Collect it to earn points!`,
                    data: {
                        wasteReportId: updatedWasteReport.id,
                        reporterState: req.user.state,
                        reporterCity: req.user.city,
                        wasteType: parsedAiAnalysis.wasteType,
                        location: location,
                    },
                })
            );

            await Promise.all(notificationPromises);

            console.log(
                `✅ Notified ${collectorsInState.length} collector(s) in ${req.user.state}`
            );

            res.status(201).json({ waste: updatedWasteReport });
        } catch (error) {
            console.error("Error creating waste report:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * GET /api/waste/report
 * Get waste reports with optional filters
 */
router.get("/report", async (req, res) => {
    try {
        const { status = "PENDING", city, mine } = req.query;

        // Build query filter
        const where = {
            status: status,
        };

        // Add city filter if provided
        if (city) {
            where.city = city;
        }

        // If "mine" is true, filter by user
        if (mine === "true") {
            // Authenticate user for "mine" filter
            let userId = req.get("x-user-id");
            if (!userId && req.body) {
                userId = req.body.userId;
            }

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized: userId is required for "mine" filter',
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return res.status(401).json({
                    error: "Unauthorized: User not found",
                });
            }

            where.reporterId = user.id;
        }

        // Fetch waste reports
        const wastes = await prisma.wasteReport.findMany({
            where,
            include: {
                reporter: true,
                collector: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json({ wastes });
    } catch (error) {
        console.error("Error fetching waste reports:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /api/waste/:id/collect
 * Collect a waste report with collector image upload
 * Accepts multipart/form-data with 'collectorImage' file field
 */
router.post(
    "/:id/collect",
    upload.single("collectorImage"),
    authenticateUser,
    async (req, res) => {
        try {
            const wasteId = req.params.id;
            const { collectorLocation, isLocationLatLng, latitude, longitude } =
                req.body;

            // Validate user has address fields set
            if (!req.user.city || !req.user.state || !req.user.country) {
                return res.status(400).json({
                    error: "Please update your profile with city, state, and country before reporting or collecting waste."
                });
            }

            // Validate user has collector enabled
            if (!req.user.enableCollector) {
                return res.status(403).json({
                    error: "User must have collector mode enabled to collect waste",
                });
            }

            // Fetch waste report
            const waste = await prisma.wasteReport.findUnique({
                where: { id: wasteId },
                include: {
                    reporter: true,
                },
            });

            // Validate waste exists
            if (!waste) {
                return res.status(404).json({ error: "Waste report not found" });
            }

            // Validate waste status - must be IN_PROGRESS to collect
            if (waste.status === "COLLECTED") {
                return res.status(400).json({
                    error: "Waste report has already been collected",
                });
            }

            if (waste.status === "PENDING") {
                return res.status(400).json({
                    error: "Waste must be added to route first (status must be IN_PROGRESS)",
                });
            }

            if (waste.status !== "IN_PROGRESS") {
                return res.status(400).json({
                    error: `Cannot collect waste with status: ${waste.status}`,
                });
            }

            // Upload collector image to S3 if provided
            let collectorImageUrl = null;
            if (req.file) {
                const s3Key = generateWasteCollectionKey(
                    wasteId,
                    req.file.originalname
                );
                collectorImageUrl = await uploadToS3(
                    req.file.buffer,
                    s3Key,
                    req.file.mimetype
                );
            }

            // Update waste report to collected AND award collector points (only if enableCollector is true)
            const [updatedWaste, updatedCollector] = await prisma.$transaction([
                prisma.wasteReport.update({
                    where: { id: wasteId },
                    data: {
                        status: "COLLECTED",
                        collectorId: req.user.id,
                        collectedAt: new Date(),
                        ...(collectorImageUrl && { collectorImageUrl }),
                    },
                    include: {
                        reporter: true,
                        collector: true,
                    },
                }),
                prisma.user.update({
                    where: { id: req.user.id },
                    data: {
                        collectorPoints: { increment: COLLECT_POINTS },
                        globalPoints: { increment: COLLECT_POINTS },
                    },
                }),
            ]);

            // Notify reporter that their waste was collected
            const wasteTypeFromAI = waste.aiAnalysis?.wasteType || "unknown";
            await createNotification({
                userId: waste.reporterId,
                type: "WASTE_COLLECTED",
                title: "Waste Collected",
                body: `Your ${wasteTypeFromAI.toUpperCase()} waste report has been collected by ${req.user.name || "a collector"
                    }.`,
                data: {
                    wasteReportId: wasteId,
                    collectorId: req.user.id,
                    collectorName: req.user.name,
                },
            });

            // Notify collector about successful collection
            await createNotification({
                userId: req.user.id,
                type: "WASTE_COLLECTED",
                title: "Collection Confirmed",
                body: `You have successfully collected ${wasteTypeFromAI.toUpperCase()} waste reported by ${waste.reporter.name || "a user"
                    }. +${COLLECT_POINTS} points!`,
                data: {
                    wasteReportId: wasteId,
                    reporterId: waste.reporterId,
                    reporterName: waste.reporter.name,
                    pointsEarned: COLLECT_POINTS,
                },
            });

            res.json({ waste: updatedWaste });
        } catch (error) {
            console.error("Error collecting waste:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * DELETE /api/waste/:id
 * Delete a waste report
 */
router.delete("/:id", async (req, res) => {
    try {
        const wasteId = req.params.id;
        console.log(`🗑️ DELETE request for waste report: ${wasteId}`);

        // Check if waste report exists
        const waste = await prisma.wasteReport.findUnique({
            where: { id: wasteId },
        });

        if (!waste) {
            console.log(`❌ Waste report not found: ${wasteId}`);
            return res.status(404).json({ error: "Waste report not found" });
        }

        console.log(`✅ Found waste report: ${wasteId}, status: ${waste.status}`);

        // Delete the waste report
        await prisma.wasteReport.delete({
            where: { id: wasteId },
        });

        console.log(`✅ Successfully deleted waste report: ${wasteId}`);

        res.json({ 
            success: true,
            message: "Waste report deleted successfully" 
        });
    } catch (error) {
        console.error("❌ Error deleting waste report:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
        });
    }
});

export default router;
