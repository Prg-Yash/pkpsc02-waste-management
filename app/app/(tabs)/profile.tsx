"use client"

import React from "react"
import { ScrollView, YStack, XStack, Text, Button, Avatar, Theme, Spinner, Input, Switch } from "tamagui"
import { useUser, useClerk } from "@clerk/clerk-expo"
import { router } from "expo-router"
import { Alert, View, StyleSheet, Dimensions } from "react-native"
import { Picker } from "@react-native-picker/picker"
import { fetchUserStats, type UserStats } from "../services/userStatsService"
import {
  fetchUserProfile,
  updateUserProfile,
  isProfileComplete,
  getProfileCompletionMessage,
  type UserProfile,
} from "../services/userService"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Indian states list
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
]

// Major Indian cities by state
const CITIES_BY_STATE: { [key: string]: string[] } = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur"],
  Delhi: ["New Delhi", "Central Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi"],
  Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Haryana: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Karnal"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Brahmapur"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
}

const COUNTRIES = ["India", "USA", "UK", "Canada", "Australia", "Other"]

// Floating particle component
const FloatingParticle = ({
  delay,
  startX,
  emoji,
}: {
  delay: number
  startX: number
  emoji: string
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const translateX = useSharedValue(startX)
  const opacity = useSharedValue(0)
  const rotate = useSharedValue(0)

  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-100, { duration: 8000, easing: Easing.linear }), -1, false),
    )
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.6, { duration: 6000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        false,
      ),
    )
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 6000 }), -1, false))
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + 30, { duration: 2000 }),
          withTiming(startX - 30, { duration: 2000 }),
          withTiming(startX, { duration: 2000 }),
        ),
        -1,
        false,
      ),
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.particleEmoji}>{emoji}</Text>
    </Animated.View>
  )
}

// Animated counter hook
const useAnimatedCounter = (targetValue: number, duration = 1500, startAnimation = true) => {
  const [displayValue, setDisplayValue] = React.useState(0)
  const animatedValue = useSharedValue(0)

  React.useEffect(() => {
    if (startAnimation && targetValue > 0) {
      animatedValue.value = 0
      animatedValue.value = withTiming(targetValue, {
        duration,
        easing: Easing.out(Easing.cubic),
      })

      const interval = setInterval(() => {
        const current = Math.round(animatedValue.value)
        runOnJS(setDisplayValue)(current)
        if (current >= targetValue) {
          clearInterval(interval)
        }
      }, 16)

      return () => clearInterval(interval)
    }
  }, [targetValue, startAnimation])

  return displayValue
}

export default function ProfileScreen() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [stats, setStats] = React.useState<UserStats | null>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Edit form state
  const [editName, setEditName] = React.useState("")
  const [editPhone, setEditPhone] = React.useState("")
  const [editCity, setEditCity] = React.useState("")
  const [editState, setEditState] = React.useState("")
  const [editCountry, setEditCountry] = React.useState("")
  const [editCollectorMode, setEditCollectorMode] = React.useState(false)

  // Animation values
  const headerSlide = useSharedValue(-100)
  const headerOpacity = useSharedValue(0)
  const profileCardSlide = useSharedValue(50)
  const profileCardOpacity = useSharedValue(0)
  const statsSlide = useSharedValue(50)
  const statsOpacity = useSharedValue(0)
  const avatarScale = useSharedValue(0.5)
  const avatarRotate = useSharedValue(0)
  const glowScale = useSharedValue(1)

  // Animated counters
  const animatedReported = useAnimatedCounter(stats?.totalReported || 0, 1500, !isLoading)
  const animatedCollected = useAnimatedCounter(stats?.totalCollected || 0, 1500, !isLoading)
  const animatedPoints = useAnimatedCounter(profile?.globalPoints || 0, 2000, !isLoading)

  React.useEffect(() => {
    // Start animations
    headerSlide.value = withSpring(0, { damping: 15, stiffness: 100 })
    headerOpacity.value = withTiming(1, { duration: 600 })

    profileCardSlide.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }))
    profileCardOpacity.value = withDelay(200, withTiming(1, { duration: 600 }))

    statsSlide.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }))
    statsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }))

    avatarScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 100 }))

    // Glow pulse animation
    glowScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true,
    )
  }, [])

  React.useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const [userStats, userProfile] = await Promise.all([fetchUserStats(user.id), fetchUserProfile(user.id)])
      setStats(userStats)
      setProfile(userProfile)

      // Initialize edit form
      setEditName(userProfile.name || "")
      setEditPhone(userProfile.phone || "")
      setEditCity(userProfile.city || "")
      setEditState(userProfile.state || "")
      setEditCountry(userProfile.country || "")
      setEditCollectorMode(userProfile.enableCollector)
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !profile) return

    // Validate required fields
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Name is required")
      return
    }
    if (!editPhone.trim()) {
      Alert.alert("Validation Error", "Phone number is required")
      return
    }
    if (!editCity.trim()) {
      Alert.alert("Validation Error", "City is required")
      return
    }
    if (!editState.trim()) {
      Alert.alert("Validation Error", "State is required")
      return
    }
    if (!editCountry.trim()) {
      Alert.alert("Validation Error", "Country is required")
      return
    }

    try {
      setIsSaving(true)
      const updatedProfile = await updateUserProfile(user.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        country: editCountry.trim(),
        enableCollector: editCollectorMode,
      })

      setProfile(updatedProfile)
      setIsEditing(false)

      Alert.alert("Success!", "Your profile has been updated successfully")

      if (editCollectorMode && !profile.enableCollector) {
        Alert.alert("Collector Mode Enabled!", "You can now collect waste from your area and earn points!")
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setEditName(profile.name || "")
      setEditPhone(profile.phone || "")
      setEditCity(profile.city || "")
      setEditState(profile.state || "")
      setEditCountry(profile.country || "")
      setEditCollectorMode(profile.enableCollector)
    }
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace("/(auth)/sign-in")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerSlide.value }],
    opacity: headerOpacity.value,
  }))

  const profileCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: profileCardSlide.value }],
    opacity: profileCardOpacity.value,
  }))

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsSlide.value }],
    opacity: statsOpacity.value,
  }))

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }))

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [1, 1.2], [0.3, 0.1]),
  }))

  if (!user) {
    return null
  }

  const particles = [
    { emoji: "👤", delay: 0, startX: SCREEN_WIDTH * 0.1 },
    { emoji: "🌿", delay: 1000, startX: SCREEN_WIDTH * 0.3 },
    { emoji: "🏆", delay: 2000, startX: SCREEN_WIDTH * 0.5 },
    { emoji: "⭐", delay: 3000, startX: SCREEN_WIDTH * 0.7 },
    { emoji: "🌍", delay: 4000, startX: SCREEN_WIDTH * 0.9 },
    { emoji: "♻️", delay: 5000, startX: SCREEN_WIDTH * 0.2 },
    { emoji: "💚", delay: 6000, startX: SCREEN_WIDTH * 0.8 },
  ]

  return (
    <Theme name="light">
      <View style={styles.container}>
        <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} style={StyleSheet.absoluteFill} />

        {/* Floating Particles */}
        {particles.map((particle, index) => (
          <FloatingParticle key={index} delay={particle.delay} startX={particle.startX} emoji={particle.emoji} />
        ))}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <View style={styles.avatarContainer}>
              <Animated.View style={[styles.avatarGlow, glowAnimatedStyle]} />
              <Animated.View style={avatarAnimatedStyle}>
                <Avatar circular size="$10" style={styles.avatar}>
                  <Avatar.Image src={user.imageUrl} />
                  <Avatar.Fallback backgroundColor="#22c55e" />
                </Avatar>
              </Animated.View>
            </View>
            <Text style={styles.headerTitle}>{user.fullName || user.firstName || "User"}</Text>
            <Text style={styles.headerSubtitle}>{user.primaryEmailAddress?.emailAddress}</Text>
          </Animated.View>

          {/* Profile Completion Alert */}
          {profile && !isProfileComplete(profile) && (
            <Animated.View style={[styles.alertCard, profileCardAnimatedStyle]}>
              <View style={styles.alertIconContainer}>
                <Text style={styles.alertIcon}>!</Text>
              </View>
              <YStack flex={1}>
                <Text style={styles.alertTitle}>Complete Your Profile</Text>
                <Text style={styles.alertText}>{getProfileCompletionMessage(profile)}</Text>
                <Text style={styles.alertText}>You cannot report or collect waste until your profile is complete.</Text>
              </YStack>
            </Animated.View>
          )}

          {/* Profile Card */}
          <Animated.View style={[styles.card, profileCardAnimatedStyle]}>
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <Text style={styles.cardTitle}>Profile Information</Text>
              {!isEditing && (
                <Button
                  size="$3"
                  backgroundColor="#22c55e"
                  color="white"
                  borderRadius={20}
                  onPress={() => setIsEditing(true)}
                  pressStyle={{ scale: 0.95, backgroundColor: "#16a34a" }}
                >
                  Edit
                </Button>
              )}
            </XStack>

            {isEditing ? (
              <YStack gap="$3">
                <YStack gap="$2">
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <Input
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your full name"
                    size="$4"
                    backgroundColor="#f0fdf4"
                    borderColor="#86efac"
                    borderWidth={1}
                    borderRadius={16}
                  />
                </YStack>

                <YStack gap="$2">
                  <Text style={styles.inputLabel}>Phone Number *</Text>
                  <Input
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="+1234567890"
                    size="$4"
                    backgroundColor="#f0fdf4"
                    borderColor="#86efac"
                    borderWidth={1}
                    borderRadius={16}
                    keyboardType="phone-pad"
                  />
                </YStack>

                <YStack gap="$2">
                  <Text style={styles.inputLabel}>State *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={editState}
                      onValueChange={(value) => {
                        setEditState(value)
                        if (editState !== value) {
                          setEditCity("")
                        }
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select your state" value="" />
                      {INDIAN_STATES.map((state) => (
                        <Picker.Item key={state} label={state} value={state} />
                      ))}
                    </Picker>
                  </View>
                </YStack>

                <YStack gap="$2">
                  <Text style={styles.inputLabel}>City *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={editCity}
                      onValueChange={(value) => setEditCity(value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select your city" value="" />
                      {editState && CITIES_BY_STATE[editState] ? (
                        CITIES_BY_STATE[editState].map((city) => <Picker.Item key={city} label={city} value={city} />)
                      ) : (
                        <Picker.Item label="Please select state first" value="" enabled={false} />
                      )}
                      <Picker.Item label="Other" value="Other" />
                    </Picker>
                  </View>
                </YStack>

                <YStack gap="$2">
                  <Text style={styles.inputLabel}>Country *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={editCountry}
                      onValueChange={(value) => setEditCountry(value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select your country" value="" />
                      {COUNTRIES.map((country) => (
                        <Picker.Item key={country} label={country} value={country} />
                      ))}
                    </Picker>
                  </View>
                </YStack>

                <View style={styles.switchContainer}>
                  <YStack flex={1}>
                    <Text style={styles.switchTitle}>Enable Collector Mode</Text>
                    <Text style={styles.switchSubtitle}>Collect waste from your area and earn points</Text>
                  </YStack>
                  <Switch
                    checked={editCollectorMode}
                    onCheckedChange={setEditCollectorMode}
                    size="$4"
                    backgroundColor={editCollectorMode ? "#22c55e" : "#e5e7eb"}
                  >
                    <Switch.Thumb animation="quick" backgroundColor="white" />
                  </Switch>
                </View>

                <XStack gap="$3" marginTop="$2">
                  <Button
                    flex={1}
                    onPress={handleCancelEdit}
                    backgroundColor="#f3f4f6"
                    color="#374151"
                    fontWeight="600"
                    borderRadius={20}
                    disabled={isSaving}
                    pressStyle={{ scale: 0.95 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex={1}
                    onPress={handleSaveProfile}
                    backgroundColor="#22c55e"
                    color="white"
                    fontWeight="600"
                    borderRadius={20}
                    disabled={isSaving}
                    pressStyle={{ scale: 0.95, backgroundColor: "#16a34a" }}
                  >
                    {isSaving ? <Spinner color="white" /> : "Save Changes"}
                  </Button>
                </XStack>
              </YStack>
            ) : (
              <YStack gap="$3">
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>N</Text>
                  </View>
                  <YStack flex={1}>
                    <Text style={styles.infoLabel}>Full Name</Text>
                    <Text style={styles.infoValue}>{profile?.name || "Not set"}</Text>
                  </YStack>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>P</Text>
                  </View>
                  <YStack flex={1}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={styles.infoValue}>{profile?.phone || "Not set"}</Text>
                  </YStack>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>C</Text>
                  </View>
                  <YStack flex={1}>
                    <Text style={styles.infoLabel}>City</Text>
                    <Text style={styles.infoValue}>{profile?.city || "Not set"}</Text>
                  </YStack>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>S</Text>
                  </View>
                  <YStack flex={1}>
                    <Text style={styles.infoLabel}>State</Text>
                    <Text style={styles.infoValue}>{profile?.state || "Not set"}</Text>
                  </YStack>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>G</Text>
                  </View>
                  <YStack flex={1}>
                    <Text style={styles.infoLabel}>Country</Text>
                    <Text style={styles.infoValue}>{profile?.country || "Not set"}</Text>
                  </YStack>
                </View>

                <View style={styles.collectorModeRow}>
                  <YStack flex={1}>
                    <Text style={styles.switchTitle}>Collector Mode</Text>
                    <Text
                      style={[
                        styles.collectorStatus,
                        {
                          color: profile?.enableCollector ? "#22c55e" : "#6b7280",
                        },
                      ]}
                    >
                      {profile?.enableCollector ? "Enabled" : "Disabled"}
                    </Text>
                  </YStack>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: profile?.enableCollector ? "#dcfce7" : "#f3f4f6",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: profile?.enableCollector ? "#22c55e" : "#6b7280",
                        fontWeight: "600",
                      }}
                    >
                      {profile?.enableCollector ? "ON" : "OFF"}
                    </Text>
                  </View>
                </View>
              </YStack>
            )}
          </Animated.View>

          {/* Stats Section */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Spinner size="large" color="#22c55e" />
            </View>
          ) : stats && profile ? (
            <>
              {/* Points Card */}
              <Animated.View style={[styles.pointsCard, statsAnimatedStyle]}>
                <LinearGradient
                  colors={["#22c55e", "#16a34a"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <XStack justifyContent="space-between" alignItems="center" style={{ zIndex: 1 }}>
                  <YStack flex={1}>
                    <Text style={styles.pointsLabel}>Total Points</Text>
                    <Text style={styles.pointsValue}>{animatedPoints}</Text>
                    <XStack gap="$3" marginTop="$2">
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsBadgeText}>Reporter: {profile.reporterPoints}</Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsBadgeText}>Collector: {profile.collectorPoints}</Text>
                      </View>
                    </XStack>
                  </YStack>
                  <View style={styles.trophyContainer}>
                    <Text style={styles.trophyEmoji}>T</Text>
                  </View>
                </XStack>
              </Animated.View>

              {/* Stats Grid */}
              <Animated.View style={statsAnimatedStyle}>
                <Text style={styles.sectionTitle}>Your Statistics</Text>
                <XStack gap="$3" marginBottom="$3">
                  <View style={[styles.statCard, { flex: 1 }]}>
                    <View style={styles.statIconContainer}>
                      <Text style={styles.statIcon}>R</Text>
                    </View>
                    <Text style={styles.statValue}>{animatedReported}</Text>
                    <Text style={styles.statLabel}>Reported</Text>
                    <Text style={styles.statSubLabel}>waste items</Text>
                  </View>

                  <View style={[styles.statCard, { flex: 1 }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#dcfce7" }]}>
                      <Text style={[styles.statIcon, { color: "#22c55e" }]}>C</Text>
                    </View>
                    <Text style={[styles.statValue, { color: "#22c55e" }]}>{animatedCollected}</Text>
                    <Text style={styles.statLabel}>Collected</Text>
                    <Text style={styles.statSubLabel}>waste items</Text>
                  </View>
                </XStack>

                <View style={styles.pendingCard}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text style={styles.pendingLabel}>Pending Reports</Text>
                      <Text style={styles.pendingValue}>{stats.pendingReports}</Text>
                    </YStack>
                    <View style={styles.pendingIconContainer}>
                      <Text style={styles.pendingIcon}>...</Text>
                    </View>
                  </XStack>
                </View>
              </Animated.View>

              {/* Impact Card */}
              <Animated.View style={[styles.impactCard, statsAnimatedStyle]}>
                <View style={styles.impactHeader}>
                  <View style={styles.impactIconContainer}>
                    <Text style={styles.impactIcon}>E</Text>
                  </View>
                  <Text style={styles.impactTitle}>Your Impact</Text>
                </View>
                <Text style={styles.impactText}>
                  You've helped make your community cleaner by reporting {stats.totalReported} waste items and
                  collecting {stats.totalCollected} items!
                </Text>
              </Animated.View>
            </>
          ) : null}

          {/* Sign Out Button */}
          <Animated.View style={statsAnimatedStyle}>
            <Button
              onPress={handleSignOut}
              backgroundColor="#fee2e2"
              color="#dc2626"
              fontWeight="600"
              size="$5"
              borderRadius={24}
              marginTop="$4"
              marginBottom="$6"
              pressStyle={{ scale: 0.95, backgroundColor: "#fecaca" }}
              style={styles.signOutButton}
            >
              Sign Out
            </Button>
          </Animated.View>
        </ScrollView>
      </View>
    </Theme>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  particle: {
    position: "absolute",
    zIndex: 0,
  },
  particleEmoji: {
    fontSize: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#22c55e",
    top: -10,
    left: -10,
  },
  avatar: {
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef3c7",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertIcon: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: "#a16207",
    marginTop: 4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
  },
  inputLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#86efac",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#166534",
  },
  switchSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0fdf4",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#22c55e",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
    marginTop: 2,
  },
  collectorModeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  collectorStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  pointsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  pointsBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  trophyContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  trophyEmoji: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  pendingCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  pendingLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  pendingValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f59e0b",
    marginTop: 4,
  },
  pendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingIcon: {
    fontSize: 24,
    color: "#f59e0b",
  },
  impactCard: {
    backgroundColor: "#dcfce7",
    borderRadius: 24,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  impactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  impactIcon: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
  },
  impactText: {
    fontSize: 15,
    color: "#166534",
    lineHeight: 22,
  },
  signOutButton: {
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
})
