import { prisma } from "./prisma.js";

/**
 * Create a notification for a user
 *
 * @param {Object} params
 * @param {string} params.userId - User ID to send notification to
 * @param {string} params.type - Notification type (WASTE_REPORTED, WASTE_COLLECTED, COLLECTOR_ENABLED)
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body text
 * @param {Object} [params.data] - Optional additional data as JSON
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  data = null,
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
        read: false,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Notify all collectors in the same state when waste is reported
 *
 * @param {Object} params
 * @param {string} params.state - State where waste was reported
 * @param {string} params.reporterId - ID of the user who reported the waste
 * @param {string} params.wasteReportId - Waste report ID
 * @param {string} params.wasteType - Type of waste
 * @param {string} params.city - City name
 * @returns {Promise<void>}
 */
export async function notifyCollectorsInState({
  state,
  reporterId,
  wasteReportId,
  wasteType,
  city,
}) {
  try {
    // Find all collectors in the same state (excluding the reporter)
    const collectors = await prisma.user.findMany({
      where: {
        state: state,
        enableCollector: true,
        id: { not: reporterId },
      },
      select: { id: true },
    });

    console.log(`📢 Notifying ${collectors.length} collectors in ${state}`);

    // Create notification for each collector
    const notifications = collectors.map((collector) =>
      prisma.notification.create({
        data: {
          userId: collector.id,
          type: "WASTE_REPORTED",
          title: "New Waste Reported in Your Area",
          body: `${wasteType.toUpperCase()} waste has been reported in ${city}, ${state}. Collect it to earn points!`,
          data: {
            wasteReportId,
            wasteType,
            city,
            state,
          },
          read: false,
        },
      })
    );

    await Promise.all(notifications);
    console.log(`✅ Sent ${notifications.length} notifications to collectors`);
  } catch (error) {
    console.error("Error notifying collectors:", error);
    // Don't throw - notification failures shouldn't break waste reporting
  }
}
