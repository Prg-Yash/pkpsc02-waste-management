import express from "express";
import { prisma } from "../lib/prisma.js";
import { sendBulkNewsletters, verifyEmailConfig } from "../lib/emailService.js";

const router = express.Router();

/**
 * GET /api/newsletter/generate/:userId
 * Generate personalized newsletter for a user based on their city and state
 * 
 * Returns:
 * - User's city waste statistics
 * - Recent waste reports in user's city
 * - State-wide statistics (all cities in the state)
 * - Top collectors in user's city
 * - Environmental impact metrics
 */
router.get("/generate/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        state: true,
        country: true,
        reporterPoints: true,
        collectorPoints: true,
        globalPoints: true,
        newsletterEnabled: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.newsletterEnabled) {
      return res.status(403).json({
        error: "Newsletter is disabled for this user. Please enable newsletter in profile settings."
      });
    }

    if (!user.city || !user.state) {
      return res.status(400).json({
        error: "User profile incomplete. City and state are required for newsletter generation."
      });
    }

    // Get current date and date 30 days ago for monthly stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. User's City Statistics
    const cityStats = await getCityStatistics(user.city, user.state, thirtyDaysAgo);

    // 2. Recent Waste Reports in User's City (last 10)
    const recentCityReports = await prisma.wasteReport.findMany({
      where: {
        city: user.city,
        state: user.state,
      },
      orderBy: {
        reportedAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        locationRaw: true,
        status: true,
        reportedAt: true,
        collectedAt: true,
        aiAnalysis: true,
        reporter: {
          select: {
            name: true,
          },
        },
        collector: {
          select: {
            name: true,
          },
        },
      },
    });

    // 3. State-wide Statistics (all cities in the state)
    const stateStats = await getStateStatistics(user.state, thirtyDaysAgo);

    // 4. Top Collectors in User's City
    const topCityCollectors = await getTopCollectors(user.city, user.state, 5);

    // 5. Environmental Impact Metrics for User's City
    const environmentalImpact = await getEnvironmentalImpact(user.city, user.state);

    // 6. User's Personal Stats
    const userPersonalStats = await getUserPersonalStats(userId, thirtyDaysAgo);

    // Generate newsletter object
    const newsletter = {
      generatedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        city: user.city,
        state: user.state,
        country: user.country,
      },
      cityReport: {
        city: user.city,
        state: user.state,
        statistics: cityStats,
        recentReports: recentCityReports.map(report => ({
          id: report.id,
          location: report.locationRaw,
          status: report.status,
          reportedAt: report.reportedAt,
          collectedAt: report.collectedAt,
          wasteType: report.aiAnalysis?.wasteType || "Unknown",
          estimatedWeight: report.aiAnalysis?.estimatedWeightKg || 0,
          reporterName: report.reporter?.name || "Anonymous",
          collectorName: report.collector?.name || null,
        })),
        topCollectors: topCityCollectors,
        environmentalImpact,
      },
      stateReport: {
        state: user.state,
        statistics: stateStats,
      },
      personalStats: userPersonalStats,
      insights: generateInsights(cityStats, stateStats, userPersonalStats),
    };

    res.json({
      success: true,
      newsletter,
    });

  } catch (error) {
    console.error("Newsletter generation error:", error);
    res.status(500).json({
      error: "Failed to generate newsletter",
      details: error.message
    });
  }
});

/**
 * GET /api/newsletter/preview/:userId
 * Get a preview/summary of what the newsletter would contain
 */
router.get("/preview/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        city: true,
        state: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.city || !user.state) {
      return res.status(400).json({
        error: "User profile incomplete. City and state are required."
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cityReportCount = await prisma.wasteReport.count({
      where: {
        city: user.city,
        state: user.state,
        reportedAt: { gte: thirtyDaysAgo },
      },
    });

    const stateReportCount = await prisma.wasteReport.count({
      where: {
        state: user.state,
        reportedAt: { gte: thirtyDaysAgo },
      },
    });

    res.json({
      success: true,
      preview: {
        user: {
          name: user.name,
          city: user.city,
          state: user.state,
        },
        cityReportsLast30Days: cityReportCount,
        stateReportsLast30Days: stateReportCount,
        newsletterAvailable: cityReportCount > 0 || stateReportCount > 0,
      },
    });

  } catch (error) {
    console.error("Newsletter preview error:", error);
    res.status(500).json({
      error: "Failed to generate preview",
      details: error.message
    });
  }
});

// Helper Functions

async function getCityStatistics(city, state, since) {
  const [
    totalReports,
    pendingReports,
    collectedReports,
    totalWasteWeight,
    wasteByType
  ] = await Promise.all([
    // Total reports
    prisma.wasteReport.count({
      where: { city, state, reportedAt: { gte: since } },
    }),
    // Pending reports
    prisma.wasteReport.count({
      where: { city, state, status: "PENDING", reportedAt: { gte: since } },
    }),
    // Collected reports
    prisma.wasteReport.count({
      where: { city, state, status: "COLLECTED", reportedAt: { gte: since } },
    }),
    // Total waste weight
    prisma.wasteReport.findMany({
      where: { city, state, reportedAt: { gte: since } },
      select: { aiAnalysis: true },
    }),
    // Waste by type
    prisma.wasteReport.findMany({
      where: { city, state, reportedAt: { gte: since } },
      select: { aiAnalysis: true },
    }),
  ]);

  // Calculate total weight from AI analysis
  const totalWeight = totalWasteWeight.reduce((sum, report) => {
    const weight = report.aiAnalysis?.estimatedWeightKg || 0;
    return sum + weight;
  }, 0);

  // Group by waste type
  const wasteTypes = {};
  wasteByType.forEach(report => {
    const type = report.aiAnalysis?.wasteType || "Unknown";
    if (!wasteTypes[type]) {
      wasteTypes[type] = { count: 0, weight: 0 };
    }
    wasteTypes[type].count += 1;
    wasteTypes[type].weight += report.aiAnalysis?.estimatedWeightKg || 0;
  });

  const collectionRate = totalReports > 0
    ? ((collectedReports / totalReports) * 100).toFixed(1)
    : 0;

  return {
    totalReports,
    pendingReports,
    collectedReports,
    inProgressReports: totalReports - pendingReports - collectedReports,
    totalWasteWeight: parseFloat(totalWeight.toFixed(2)),
    collectionRate: parseFloat(collectionRate),
    wasteByType: Object.entries(wasteTypes).map(([type, data]) => ({
      type,
      count: data.count,
      weight: parseFloat(data.weight.toFixed(2)),
    })),
    period: "Last 30 days",
  };
}

async function getStateStatistics(state, since) {
  const [
    totalReports,
    collectedReports,
    citiesData
  ] = await Promise.all([
    // Total state reports
    prisma.wasteReport.count({
      where: { state, reportedAt: { gte: since } },
    }),
    // Collected state reports
    prisma.wasteReport.count({
      where: { state, status: "COLLECTED", reportedAt: { gte: since } },
    }),
    // Reports grouped by city
    prisma.wasteReport.groupBy({
      by: ['city'],
      where: { state, reportedAt: { gte: since } },
      _count: { id: true },
    }),
  ]);

  // Get detailed stats for each city
  const citiesWithStats = await Promise.all(
    citiesData.map(async (cityData) => {
      const [pending, collected, wasteData] = await Promise.all([
        prisma.wasteReport.count({
          where: { city: cityData.city, state, status: "PENDING", reportedAt: { gte: since } },
        }),
        prisma.wasteReport.count({
          where: { city: cityData.city, state, status: "COLLECTED", reportedAt: { gte: since } },
        }),
        prisma.wasteReport.findMany({
          where: { city: cityData.city, state, reportedAt: { gte: since } },
          select: { aiAnalysis: true },
        }),
      ]);

      const totalWeight = wasteData.reduce((sum, report) => {
        return sum + (report.aiAnalysis?.estimatedWeightKg || 0);
      }, 0);

      return {
        city: cityData.city,
        totalReports: cityData._count.id,
        pendingReports: pending,
        collectedReports: collected,
        totalWasteWeight: parseFloat(totalWeight.toFixed(2)),
        collectionRate: cityData._count.id > 0
          ? parseFloat(((collected / cityData._count.id) * 100).toFixed(1))
          : 0,
      };
    })
  );

  // Sort cities by total reports
  citiesWithStats.sort((a, b) => b.totalReports - a.totalReports);

  const stateCollectionRate = totalReports > 0
    ? parseFloat(((collectedReports / totalReports) * 100).toFixed(1))
    : 0;

  return {
    totalReports,
    collectedReports,
    collectionRate: stateCollectionRate,
    totalCities: citiesWithStats.length,
    cities: citiesWithStats,
    period: "Last 30 days",
  };
}

async function getTopCollectors(city, state, limit) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const collectors = await prisma.user.findMany({
    where: {
      city,
      state,
      enableCollector: true,
      collectedWastes: {
        some: {
          collectedAt: { gte: thirtyDaysAgo },
        },
      },
    },
    select: {
      id: true,
      name: true,
      collectorPoints: true,
      _count: {
        select: {
          collectedWastes: {
            where: {
              collectedAt: { gte: thirtyDaysAgo },
            },
          },
        },
      },
    },
    orderBy: {
      collectorPoints: "desc",
    },
    take: limit,
  });

  return collectors.map((collector, index) => ({
    rank: index + 1,
    name: collector.name || "Anonymous",
    collectionsLast30Days: collector._count.collectedWastes,
    totalPoints: collector.collectorPoints,
  }));
}

async function getEnvironmentalImpact(city, state) {
  const allTimeData = await prisma.wasteReport.findMany({
    where: {
      city,
      state,
      status: "COLLECTED",
    },
    select: {
      aiAnalysis: true,
    },
  });

  const totalWasteCollected = allTimeData.reduce((sum, report) => {
    return sum + (report.aiAnalysis?.estimatedWeightKg || 0);
  }, 0);

  // Rough environmental impact calculations
  const co2Saved = totalWasteCollected * 0.5; // Rough estimate: 0.5 kg CO2 per kg waste
  const treesEquivalent = totalWasteCollected / 20; // Rough estimate: 1 tree per 20 kg waste
  const landfillSpaceSaved = totalWasteCollected * 0.001; // Cubic meters

  return {
    totalWasteCollected: parseFloat(totalWasteCollected.toFixed(2)),
    co2EmissionsSaved: parseFloat(co2Saved.toFixed(2)),
    treesEquivalent: Math.floor(treesEquivalent),
    landfillSpaceSaved: parseFloat(landfillSpaceSaved.toFixed(2)),
    unit: {
      weight: "kg",
      co2: "kg",
      landfill: "cubic meters",
    },
  };
}

async function getUserPersonalStats(userId, since) {
  const [reportsCount, collectionsCount, recentReports, recentCollections] = await Promise.all([
    // Reports made by user
    prisma.wasteReport.count({
      where: {
        reporterId: userId,
        reportedAt: { gte: since },
      },
    }),
    // Collections made by user
    prisma.wasteReport.count({
      where: {
        collectorId: userId,
        collectedAt: { gte: since },
      },
    }),
    // User's recent reports
    prisma.wasteReport.findMany({
      where: {
        reporterId: userId,
        reportedAt: { gte: since },
      },
      select: {
        status: true,
        aiAnalysis: true,
      },
    }),
    // User's recent collections
    prisma.wasteReport.findMany({
      where: {
        collectorId: userId,
        collectedAt: { gte: since },
      },
      select: {
        aiAnalysis: true,
      },
    }),
  ]);

  const totalWeightReported = recentReports.reduce((sum, report) => {
    return sum + (report.aiAnalysis?.estimatedWeightKg || 0);
  }, 0);

  const totalWeightCollected = recentCollections.reduce((sum, report) => {
    return sum + (report.aiAnalysis?.estimatedWeightKg || 0);
  }, 0);

  const reportedCollected = recentReports.filter(r => r.status === "COLLECTED").length;

  return {
    reportsSubmitted: reportsCount,
    collectionsCompleted: collectionsCount,
    totalWeightReported: parseFloat(totalWeightReported.toFixed(2)),
    totalWeightCollected: parseFloat(totalWeightCollected.toFixed(2)),
    reportsCollectedByOthers: reportedCollected,
    period: "Last 30 days",
  };
}

function generateInsights(cityStats, stateStats, userStats) {
  const insights = [];

  // City performance insight
  if (cityStats.collectionRate > 80) {
    insights.push({
      type: "positive",
      message: `Excellent! Your city has a ${cityStats.collectionRate}% collection rate, well above average.`,
    });
  } else if (cityStats.collectionRate < 50) {
    insights.push({
      type: "improvement",
      message: `Your city's collection rate is ${cityStats.collectionRate}%. Consider becoming a collector to help improve this!`,
    });
  }

  // User contribution insight
  if (userStats.reportsSubmitted > 0 || userStats.collectionsCompleted > 0) {
    insights.push({
      type: "achievement",
      message: `Great work! You've contributed ${userStats.reportsSubmitted} reports and ${userStats.collectionsCompleted} collections in the last 30 days.`,
    });
  }

  // State comparison
  const cityRank = stateStats.cities.findIndex(c => c.city === cityStats.statistics?.city) + 1;
  if (cityRank > 0 && cityRank <= 3) {
    insights.push({
      type: "ranking",
      message: `Your city ranks #${cityRank} out of ${stateStats.totalCities} cities in ${stateStats.state} for waste management activity!`,
    });
  }

  // Waste type insight
  if (cityStats.wasteByType && cityStats.wasteByType.length > 0) {
    const topWasteType = cityStats.wasteByType.reduce((prev, current) =>
      (prev.count > current.count) ? prev : current
    );
    insights.push({
      type: "info",
      message: `The most common waste type in your city is ${topWasteType.type}, accounting for ${topWasteType.count} reports.`,
    });
  }

  return insights;
}

/**
 * POST /api/newsletter/send-all
 * Send newsletters to all users who have enabled newsletter subscription
 * This endpoint returns immediately and processes emails in the background
 */
router.post("/send-all", async (req, res) => {
  try {
    console.log("📧 Starting bulk newsletter send...");

    // Get all users with newsletter enabled and required location data
    const subscribedUsers = await prisma.user.findMany({
      where: {
        newsletterEnabled: true,
        city: { not: null },
        state: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        state: true,
      },
    });

    if (subscribedUsers.length === 0) {
      return res.status(200).json({
        message: "No subscribed users found",
        sent: 0,
        failed: 0,
        total: 0,
        status: "completed",
      });
    }

    console.log(`📋 Found ${subscribedUsers.length} subscribed users`);

    // Return immediately with accepted status
    res.status(202).json({
      message: "Newsletter sending started in background",
      total: subscribedUsers.length,
      status: "processing",
      note: "Newsletters are being sent. Check server logs for progress.",
    });

    // Process emails in the background (don't await)
    processNewslettersInBackground(subscribedUsers).catch(error => {
      console.error("❌ Background newsletter processing failed:", error);
    });

  } catch (error) {
    console.error("Error initiating newsletter send:", error);
    res.status(500).json({
      error: "Failed to initiate newsletter sending",
      message: error.message,
    });
  }
});

/**
 * Process newsletters in the background
 * This function runs asynchronously after the HTTP response is sent
 */
async function processNewslettersInBackground(subscribedUsers) {
  console.log(`🔄 Background processing started for ${subscribedUsers.length} users`);

  const results = {
    total: subscribedUsers.length,
    sent: 0,
    failed: 0,
    details: [],
  };

  // Helper function to generate newsletter for a user
  const generateNewsletterForUser = async (userId) => {
    try {
      const user = subscribedUsers.find((u) => u.id === userId);
      if (!user) return null;

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [cityStats, stateStats, userStats] = await Promise.all([
        getCityStatistics(user.city, user.state, since),
        getStateStatistics(user.state, since),
        getUserPersonalStats(userId, since),
      ]);

      const topCollectors = await getTopCollectors(user.city, user.state, 5);
      const environmentalImpact = await getEnvironmentalImpact(
        user.city,
        user.state
      );

      const cityReport = {
        city: user.city,
        state: user.state,
        statistics: cityStats,
        topCollectors,
        environmentalImpact,
      };

      const stateReport = {
        state: user.state,
        statistics: stateStats,
      };

      const insights = generateInsights(cityStats, stateStats, userStats);

      return {
        cityReport,
        stateReport,
        personalStats: userStats,
        insights,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error generating newsletter for user ${userId}:`, error);
      return null;
    }
  };

  // Send newsletters to all subscribed users
  try {
    const sendResults = await sendBulkNewsletters(
      subscribedUsers,
      generateNewsletterForUser
    );

    console.log(`✅ Bulk send complete: ${sendResults.sent} sent, ${sendResults.failed} failed`);
    console.log(`📊 Success rate: ${((sendResults.sent / sendResults.total) * 100).toFixed(1)}%`);

    return sendResults;
  } catch (error) {
    console.error("❌ Fatal error in background processing:", error);
    throw error;
  }
}

/**
 * GET /api/newsletter/verify-config
 * Verify email configuration
 */
router.get("/verify-config", async (req, res) => {
  try {
    const result = await verifyEmailConfig();

    if (result.success) {
      res.status(200).json({
        message: "Email configuration is valid",
        status: "ready",
      });
    } else {
      res.status(500).json({
        message: "Email configuration is invalid",
        status: "error",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to verify email configuration",
      message: error.message,
    });
  }
});

export default router;
