const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface Notification {
  id: string;
  userId: string;
  type: "WASTE_REPORTED" | "WASTE_COLLECTED" | "LEADERBOARD_UPDATE" | "SYSTEM";
  title: string;
  body: string;
  data: any;
  read: boolean;
  createdAt: string;
}

/**
 * Fetches all notifications for a user
 * @param userId - User ID
 * @param unreadOnly - Only fetch unread notifications
 * @returns Array of notifications
 */
export async function fetchNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    console.log("📡 Fetching notifications...");
    
    const params = new URLSearchParams();
    if (unreadOnly) {
      params.append("unreadOnly", "true");
    }

    const response = await fetch(
      `${API_URL}/api/notifications?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.notifications.length} notifications`);
    return data.notifications;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    throw new Error(
      `Failed to fetch notifications: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Marks a notification as read
 * @param userId - User ID
 * @param notificationId - Notification ID
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    console.log(`📡 Marking notification ${notificationId} as read...`);

    const response = await fetch(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("✅ Notification marked as read");
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw new Error(
      `Failed to mark notification as read: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Gets the count of unread notifications
 * @param userId - User ID
 * @returns Count of unread notifications
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const notifications = await fetchNotifications(userId, true);
    return notifications.length;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
}
