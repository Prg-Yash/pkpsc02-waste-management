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

    // If not in header, try to get from body or query
    if (!userId && req.body) {
      userId = req.body.userId;
    }
    if (!userId && req.query) {
      userId = req.query.userId;
    }

    // Validate userId is present
    if (!userId) {
      return res.status(401).json({
        error:
          'Unauthorized: userId is required in header "x-user-id", body, or query',
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
 * POST /api/route-planner/add
 * Add a waste to the collector's route planner
 */
router.post("/add", authenticateUser, async (req, res) => {
  try {
    const { wasteId } = req.body;

    // Validate wasteId
    if (!wasteId) {
      return res.status(400).json({ error: "wasteId is required" });
    }

    // Validate user has address fields set
    if (!req.user.city || !req.user.state || !req.user.country) {
      return res.status(400).json({
        error:
          "Please update your profile with city, state, and country before reporting or collecting waste.",
      });
    }

    // Validate user has collector enabled
    if (!req.user.enableCollector) {
      return res.status(403).json({
        error: "User must have collector mode enabled to add waste to route",
      });
    }

    // Fetch waste report
    const waste = await prisma.wasteReport.findUnique({
      where: { id: wasteId },
      include: {
        reporter: true,
        routeCollector: true,
      },
    });

    // Validate waste exists
    if (!waste) {
      return res.status(404).json({ error: "Waste report not found" });
    }

    // Validate waste is PENDING
    if (waste.status !== "PENDING") {
      return res.status(400).json({
        error: `Cannot add waste to route. Current status: ${waste.status}. Only PENDING waste can be added to route.`,
      });
    }

    // Update waste: status = IN_PROGRESS, routeCollectorId = user.id
    const updatedWaste = await prisma.wasteReport.update({
      where: { id: wasteId },
      data: {
        status: "IN_PROGRESS",
        routeCollectorId: req.user.id,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        routeCollector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Waste added to route successfully",
      waste: updatedWaste,
    });
  } catch (error) {
    console.error("Error adding waste to route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/route-planner/remove
 * Remove a waste from the collector's route planner
 */
router.post("/remove", authenticateUser, async (req, res) => {
  try {
    const { wasteId } = req.body;

    // Validate wasteId
    if (!wasteId) {
      return res.status(400).json({ error: "wasteId is required" });
    }

    // Fetch waste report
    const waste = await prisma.wasteReport.findUnique({
      where: { id: wasteId },
      include: {
        reporter: true,
        routeCollector: true,
      },
    });

    // Validate waste exists
    if (!waste) {
      return res.status(404).json({ error: "Waste report not found" });
    }

    // Validate waste is IN_PROGRESS
    if (waste.status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: `Cannot remove waste from route. Current status: ${waste.status}. Only IN_PROGRESS waste can be removed from route.`,
      });
    }

    // Validate routeCollectorId matches current user
    if (waste.routeCollectorId !== req.user.id) {
      return res.status(403).json({
        error: "You can only remove waste from your own route",
      });
    }

    // Update waste: status = PENDING, routeCollectorId = null
    const updatedWaste = await prisma.wasteReport.update({
      where: { id: wasteId },
      data: {
        status: "PENDING",
        routeCollectorId: null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        routeCollector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Waste removed from route successfully",
      waste: updatedWaste,
    });
  } catch (error) {
    console.error("Error removing waste from route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/route-planner
 * Get all wastes in the collector's route
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    // Fetch all wastes where routeCollectorId = user.id
    const wastes = await prisma.wasteReport.findMany({
      where: {
        routeCollectorId: req.user.id,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        routeCollector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Recommended for route ordering (first reported = first in route)
      },
    });

    res.json({
      success: true,
      count: wastes.length,
      route: wastes,
    });
  } catch (error) {
    console.error("Error fetching route planner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
