"use client"

import React from "react"
import { YStack, XStack, Text, Button, H4, ScrollView, Theme, Spinner } from "tamagui"
import { Modal, TouchableOpacity, Dimensions } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { fetchNotifications, markNotificationAsRead, type Notification } from "../services/notificationService"
import { LinearGradient } from "expo-linear-gradient"
import { X, FileText, CheckCircle, Trophy, Bell } from "@tamagui/lucide-icons"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from "react-native-reanimated"

const { width, height } = Dimensions.get("window")

interface NotificationsModalProps {
  visible: boolean
  onClose: () => void
  onUpdate?: () => void
}

// Floating particle component
const FloatingParticle = ({ delay, emoji, startX }: { delay: number; emoji: string; startX: number }) => {
  const translateY = useSharedValue(height)
  const translateX = useSharedValue(startX)
  const opacity = useSharedValue(0)
  const rotate = useSharedValue(0)

  React.useEffect(() => {
    translateY.value = withDelay(delay, withTiming(-100, { duration: 8000 }))
    opacity.value = withDelay(delay, withTiming(0.3, { duration: 1000 }))
    rotate.value = withDelay(delay, withTiming(360, { duration: 8000 }))
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 0,
        },
        animatedStyle,
      ]}
    >
      <Text fontSize={24}>{emoji}</Text>
    </Animated.View>
  )
}

export default function NotificationsModal({ visible, onClose, onUpdate }: NotificationsModalProps) {
  const { user } = useUser()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const headerScale = useSharedValue(0.8)
  const headerOpacity = useSharedValue(0)

  React.useEffect(() => {
    if (visible && user) {
      loadNotifications()
      headerScale.value = withSpring(1)
      headerOpacity.value = withTiming(1, { duration: 300 })
    }
  }, [visible, user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const allNotifications = await fetchNotifications(user.id)
      setNotifications(allNotifications)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationPress = async (notification: Notification) => {
    if (!user) return

    try {
      if (!notification.read) {
        await markNotificationAsRead(user.id, notification.id)
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
        onUpdate?.()
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "WASTE_REPORTED":
        return <FileText size={20} color="#16a34a" />
      case "WASTE_COLLECTED":
        return <CheckCircle size={20} color="#16a34a" />
      case "LEADERBOARD_UPDATE":
        return <Trophy size={20} color="#16a34a" />
      default:
        return <Bell size={20} color="#16a34a" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "WASTE_REPORTED":
        return "#22c55e"
      case "WASTE_COLLECTED":
        return "#16a34a"
      case "LEADERBOARD_UPDATE":
        return "#15803d"
      default:
        return "#166534"
    }
  }

  const reportNotifications = notifications.filter((n) => n.type === "WASTE_REPORTED")
  const collectNotifications = notifications.filter((n) => n.type === "WASTE_COLLECTED")
  const otherNotifications = notifications.filter((n) => n.type !== "WASTE_REPORTED" && n.type !== "WASTE_COLLECTED")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }))

  const renderNotificationSection = (title: string, notifs: Notification[], icon: React.ReactNode, index: number) => {
    if (notifs.length === 0) return null

    return (
      <Animated.View entering={FadeInDown.delay(200 + index * 100).springify()}>
        <YStack marginBottom="$4">
          <XStack alignItems="center" marginBottom="$3" gap="$2">
            <YStack backgroundColor="#dcfce7" padding="$2" borderRadius={50}>
              {icon}
            </YStack>
            <H4 color="#14532d" fontWeight="bold">
              {title}
            </H4>
            <YStack backgroundColor="#22c55e" paddingHorizontal="$2" paddingVertical="$1" borderRadius={12}>
              <Text color="white" fontSize="$2" fontWeight="bold">
                {notifs.length}
              </Text>
            </YStack>
          </XStack>

          {notifs.map((notification, notifIndex) => (
            <Animated.View key={notification.id} entering={SlideInRight.delay(300 + notifIndex * 50).springify()}>
              <TouchableOpacity onPress={() => handleNotificationPress(notification)} activeOpacity={0.7}>
                <YStack
                  backgroundColor={notification.read ? "white" : "#f0fdf4"}
                  borderRadius={20}
                  padding="$4"
                  marginBottom="$2"
                  borderLeftWidth={4}
                  borderLeftColor={getNotificationColor(notification.type)}
                  shadowColor="#22c55e"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.1}
                  shadowRadius={8}
                  elevation={3}
                >
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1}>
                      <Text color="#14532d" fontWeight="700" fontSize="$4">
                        {notification.title}
                      </Text>
                      <Text color="#166534" fontSize="$3" marginTop="$1" opacity={0.8}>
                        {notification.body}
                      </Text>
                      <XStack alignItems="center" marginTop="$2" gap="$1">
                        <YStack width={6} height={6} borderRadius={3} backgroundColor="#22c55e" opacity={0.5} />
                        <Text color="#15803d" fontSize="$2" opacity={0.7}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </XStack>
                    </YStack>
                    {!notification.read && (
                      <YStack
                        backgroundColor="#22c55e"
                        width={12}
                        height={12}
                        borderRadius={6}
                        marginLeft="$2"
                        shadowColor="#22c55e"
                        shadowOffset={{ width: 0, height: 0 }}
                        shadowOpacity={0.5}
                        shadowRadius={4}
                      />
                    )}
                  </XStack>
                </YStack>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </YStack>
      </Animated.View>
    )
  }

  const particles = [
    { emoji: "🔔", delay: 0, startX: width * 0.1 },
    { emoji: "📬", delay: 500, startX: width * 0.3 },
    { emoji: "✨", delay: 1000, startX: width * 0.5 },
    { emoji: "🌿", delay: 1500, startX: width * 0.7 },
    { emoji: "♻️", delay: 2000, startX: width * 0.9 },
  ]

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Theme name="light">
        <YStack flex={1} backgroundColor="#f0fdf4">
          {/* Floating particles */}
          {particles.map((particle, index) => (
            <FloatingParticle key={index} delay={particle.delay} emoji={particle.emoji} startX={particle.startX} />
          ))}

          {/* Header */}
          <LinearGradient
            colors={["#22c55e", "#16a34a", "#15803d"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              paddingTop: 56,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <Animated.View style={headerAnimatedStyle}>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap="$3">
                  <YStack backgroundColor="rgba(255,255,255,0.2)" padding="$3" borderRadius={50}>
                    <Bell size={28} color="white" />
                  </YStack>
                  <YStack>
                    <H4 color="white" fontWeight="800" fontSize="$6">
                      Notifications
                    </H4>
                    <Text color="rgba(255,255,255,0.8)" fontSize="$2">
                      {notifications.length} total
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  unstyled
                  onPress={onClose}
                  backgroundColor="rgba(255,255,255,0.2)"
                  padding="$3"
                  borderRadius={50}
                >
                  <X size={24} color="white" />
                </Button>
              </XStack>
            </Animated.View>
          </LinearGradient>

          {/* Content */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack padding="$4">
              {isLoading ? (
                <Animated.View entering={FadeIn.duration(300)}>
                  <YStack
                    padding="$8"
                    alignItems="center"
                    backgroundColor="white"
                    borderRadius={24}
                    shadowColor="#22c55e"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.1}
                    shadowRadius={12}
                    elevation={4}
                  >
                    <Spinner size="large" color="#22c55e" />
                    <Text color="#166534" marginTop="$4" fontWeight="600">
                      Loading notifications...
                    </Text>
                  </YStack>
                </Animated.View>
              ) : notifications.length === 0 ? (
                <Animated.View entering={FadeInDown.springify()}>
                  <YStack
                    padding="$8"
                    alignItems="center"
                    backgroundColor="white"
                    borderRadius={24}
                    shadowColor="#22c55e"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.1}
                    shadowRadius={12}
                    elevation={4}
                  >
                    <YStack backgroundColor="#dcfce7" padding="$6" borderRadius={100} marginBottom="$4">
                      <Text fontSize={48}>🔔</Text>
                    </YStack>
                    <H4 color="#14532d" marginTop="$3" textAlign="center" fontWeight="800">
                      No Notifications
                    </H4>
                    <Text color="#166534" textAlign="center" marginTop="$2" opacity={0.7}>
                      You're all caught up!
                    </Text>
                  </YStack>
                </Animated.View>
              ) : (
                <>
                  {renderNotificationSection(
                    "Waste Reports",
                    reportNotifications,
                    <FileText size={20} color="#16a34a" />,
                    0,
                  )}
                  {renderNotificationSection(
                    "Collections",
                    collectNotifications,
                    <CheckCircle size={20} color="#16a34a" />,
                    1,
                  )}
                  {renderNotificationSection("Other", otherNotifications, <Bell size={20} color="#16a34a" />, 2)}
                </>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </Theme>
    </Modal>
  )
}
