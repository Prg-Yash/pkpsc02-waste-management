import { prisma } from './prisma.js';

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
export async function createNotification({ userId, type, title, body, data = null }) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                body,
                data,
                read: false
            }
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}
