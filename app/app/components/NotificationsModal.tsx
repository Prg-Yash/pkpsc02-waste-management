import React from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  H4,
  ScrollView,
  Theme,
  Separator,
  Spinner,
} from "tamagui";
import { Modal, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import {
  fetchNotifications,
  markNotificationAsRead,
  Notification,
} from "../services/notificationService";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Callback when notifications are updated
}

export default function NotificationsModal({
  visible,
  onClose,
  onUpdate,
}: NotificationsModalProps) {
  const { user } = useUser();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && user) {
      loadNotifications();
    }
  }, [visible, user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const allNotifications = await fetchNotifications(user.id);
      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!user) return;

    try {
      // Mark as read if unread
      if (!notification.read) {
        await markNotificationAsRead(user.id, notification.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        onUpdate?.(); // Notify parent to update unread count
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "WASTE_REPORTED":
        return "📝";
      case "WASTE_COLLECTED":
        return "✅";
      case "LEADERBOARD_UPDATE":
        return "🏆";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "WASTE_REPORTED":
        return "$blue9";
      case "WASTE_COLLECTED":
        return "$green9";
      case "LEADERBOARD_UPDATE":
        return "$yellow9";
      default:
        return "$gray9";
    }
  };

  const reportNotifications = notifications.filter(
    (n) => n.type === "WASTE_REPORTED"
  );
  const collectNotifications = notifications.filter(
    (n) => n.type === "WASTE_COLLECTED"
  );
  const otherNotifications = notifications.filter(
    (n) => n.type !== "WASTE_REPORTED" && n.type !== "WASTE_COLLECTED"
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationSection = (
    title: string,
    notifs: Notification[],
    icon: string
  ) => {
    if (notifs.length === 0) return null;

    return (
      <YStack marginBottom="$4">
        <XStack alignItems="center" marginBottom="$3">
          <Text fontSize={20} marginRight="$2">
            {icon}
          </Text>
          <H4 color="$gray12" fontWeight="bold">
            {title}
          </H4>
          <Text color="$gray10" fontSize="$2" marginLeft="$2">
            ({notifs.length})
          </Text>
        </XStack>

        {notifs.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            onPress={() => handleNotificationPress(notification)}
          >
            <YStack
              backgroundColor={notification.read ? "$gray1" : "$blue1"}
              borderRadius="$3"
              padding="$3"
              marginBottom="$2"
              borderLeftWidth={4}
              borderLeftColor={getNotificationColor(notification.type)}
            >
              <XStack justifyContent="space-between" alignItems="flex-start">
                <YStack flex={1}>
                  <Text color="$gray12" fontWeight="600" fontSize="$3">
                    {notification.title}
                  </Text>
                  <Text color="$gray11" fontSize="$2" marginTop="$1">
                    {notification.body}
                  </Text>
                  <Text color="$gray10" fontSize="$1" marginTop="$2">
                    {formatDate(notification.createdAt)}
                  </Text>
                </YStack>
                {!notification.read && (
                  <YStack
                    backgroundColor="$blue9"
                    width={8}
                    height={8}
                    borderRadius="$10"
                    marginLeft="$2"
                  />
                )}
              </XStack>
            </YStack>
          </TouchableOpacity>
        ))}
      </YStack>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Theme name="light">
        <YStack flex={1} backgroundColor="$background">
          {/* Header */}
          <YStack
            backgroundColor="$blue9"
            paddingHorizontal="$4"
            paddingVertical="$3"
            paddingTop="$10"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <H4 color="white" fontWeight="bold">
                Notifications
              </H4>
              <Button
                unstyled
                onPress={onClose}
                paddingHorizontal="$3"
                paddingVertical="$1"
              >
                <Text color="white" fontSize="$4" fontWeight="600">
                  ✕
                </Text>
              </Button>
            </XStack>
          </YStack>

          {/* Content */}
          <ScrollView flex={1}>
            <YStack padding="$4">
              {isLoading ? (
                <YStack padding="$8" alignItems="center">
                  <Spinner size="large" color="$blue9" />
                  <Text color="$gray10" marginTop="$4">
                    Loading notifications...
                  </Text>
                </YStack>
              ) : notifications.length === 0 ? (
                <YStack padding="$8" alignItems="center">
                  <Text fontSize={60}>🔔</Text>
                  <H4 color="$gray11" marginTop="$3" textAlign="center">
                    No Notifications
                  </H4>
                  <Text color="$gray10" textAlign="center" marginTop="$2">
                    You're all caught up!
                  </Text>
                </YStack>
              ) : (
                <>
                  {renderNotificationSection(
                    "Waste Reports",
                    reportNotifications,
                    "📝"
                  )}
                  {renderNotificationSection(
                    "Collections",
                    collectNotifications,
                    "✅"
                  )}
                  {renderNotificationSection("Other", otherNotifications, "📢")}
                </>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </Theme>
    </Modal>
  );
}
