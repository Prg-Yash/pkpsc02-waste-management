import React from "react";
import {
  ScrollView,
  YStack,
  XStack,
  Text,
  Button,
  H2,
  H4,
  Avatar,
  Theme,
  Separator,
  Spinner,
  Input,
  Switch,
} from "tamagui";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { fetchUserStats, UserStats } from "../services/userStatsService";
import {
  fetchUserProfile,
  updateUserProfile,
  isProfileComplete,
  getProfileCompletionMessage,
  UserProfile,
} from "../services/userService";

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
];

// Major Indian cities by state
const CITIES_BY_STATE: { [key: string]: string[] } = {
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Aurangabad",
    "Solapur",
  ],
  Delhi: [
    "New Delhi",
    "Central Delhi",
    "South Delhi",
    "North Delhi",
    "East Delhi",
    "West Delhi",
  ],
  Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
  ],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Agra",
    "Varanasi",
    "Meerut",
    "Allahabad",
  ],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Tirupati",
  ],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Haryana: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Karnal"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Brahmapur"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
};

const COUNTRIES = ["India", "USA", "UK", "Canada", "Australia", "Other"];

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Edit form state
  const [editName, setEditName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editCity, setEditCity] = React.useState("");
  const [editState, setEditState] = React.useState("");
  const [editCountry, setEditCountry] = React.useState("");
  const [editCollectorMode, setEditCollectorMode] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [userStats, userProfile] = await Promise.all([
        fetchUserStats(user.id),
        fetchUserProfile(user.id),
      ]);
      setStats(userStats);
      setProfile(userProfile);

      // Initialize edit form
      setEditName(userProfile.name || "");
      setEditPhone(userProfile.phone || "");
      setEditCity(userProfile.city || "");
      setEditState(userProfile.state || "");
      setEditCountry(userProfile.country || "");
      setEditCollectorMode(userProfile.enableCollector);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    // Validate required fields
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }
    if (!editPhone.trim()) {
      Alert.alert("Validation Error", "Phone number is required");
      return;
    }
    if (!editCity.trim()) {
      Alert.alert("Validation Error", "City is required");
      return;
    }
    if (!editState.trim()) {
      Alert.alert("Validation Error", "State is required");
      return;
    }
    if (!editCountry.trim()) {
      Alert.alert("Validation Error", "Country is required");
      return;
    }

    try {
      setIsSaving(true);
      const updatedProfile = await updateUserProfile(user.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        country: editCountry.trim(),
        enableCollector: editCollectorMode,
      });

      setProfile(updatedProfile);
      setIsEditing(false);

      Alert.alert("Success! ✅", "Your profile has been updated successfully");

      // If collector mode was just enabled
      if (editCollectorMode && !profile.enableCollector) {
        Alert.alert(
          "Collector Mode Enabled! 🎉",
          "You can now collect waste from your area and earn points!"
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
      setEditCity(profile.city || "");
      setEditState(profile.state || "");
      setEditCountry(profile.country || "");
      setEditCollectorMode(profile.enableCollector);
    }
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Theme name="light">
      <ScrollView flex={1} backgroundColor="$background">
        {/* User Info */}
        <YStack
          margin="$4"
          padding="$4"
          backgroundColor="white"
          borderRadius="$4"
          elevation="$2"
        >
          <XStack alignItems="center" marginBottom="$3">
            <Avatar circular size="$8" marginRight="$3">
              <Avatar.Image src={user.imageUrl} />
              <Avatar.Fallback backgroundColor="$blue9" />
            </Avatar>

            <YStack flex={1}>
              <H4 color="$gray12" fontWeight="bold">
                {user.fullName || user.firstName || "User"}
              </H4>
              <Text color="$gray10" fontSize="$2" marginTop="$1">
                {user.primaryEmailAddress?.emailAddress}
              </Text>
            </YStack>
          </XStack>

          {/* Profile Completion Alert */}
          {profile && !isProfileComplete(profile) && (
            <YStack
              backgroundColor="$orange2"
              padding="$3"
              borderRadius="$3"
              borderLeftWidth={4}
              borderLeftColor="$orange9"
              marginBottom="$3"
            >
              <Text color="$orange11" fontWeight="600" fontSize="$3">
                ⚠️ Complete Your Profile
              </Text>
              <Text color="$orange10" fontSize="$2" marginTop="$1">
                {getProfileCompletionMessage(profile)}
              </Text>
              <Text color="$orange10" fontSize="$2" marginTop="$1">
                You cannot report or collect waste until your profile is
                complete.
              </Text>
            </YStack>
          )}

          {/* Marketplace Quick Actions */}
          <YStack gap="$2" marginTop="$3">
            <XStack gap="$3">
              <Button
                flex={1}
                onPress={() => router.push("/(marketplace)/create" as any)}
                backgroundColor="$green9"
                color="white"
                fontWeight="600"
                icon={<Text fontSize={18}>➕</Text>}
              >
                Create Listing
              </Button>
              <Button
                flex={1}
                onPress={() => router.push("/(tabs)/marketplace" as any)}
                backgroundColor="$blue9"
                color="white"
                fontWeight="600"
                icon={<Text fontSize={18}>🛒</Text>}
              >
                Browse Market
              </Button>
            </XStack>
            <Button
              onPress={() => router.push("/(marketplace)/my-listings" as any)}
              backgroundColor="$purple9"
              color="white"
              fontWeight="600"
              icon={<Text fontSize={18}>📋</Text>}
            >
              My Listings
            </Button>
          </YStack>

          {/* Edit Profile Section */}
          {isEditing ? (
            <YStack gap="$3">
              <Text color="$gray11" fontWeight="600" fontSize="$3">
                Edit Profile Information
              </Text>

              <YStack gap="$2">
                <Text color="$gray11" fontSize="$2">
                  Full Name *
                </Text>
                <Input
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your full name"
                  size="$4"
                  backgroundColor="$gray2"
                />
              </YStack>

              <YStack gap="$2">
                <Text color="$gray11" fontSize="$2">
                  Phone Number *
                </Text>
                <Input
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+1234567890"
                  size="$4"
                  backgroundColor="$gray2"
                  keyboardType="phone-pad"
                />
              </YStack>

              <YStack gap="$2">
                <Text color="$gray11" fontSize="$2">
                  City *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editCity}
                    onValueChange={(value) => setEditCity(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your city" value="" />
                    {editState && CITIES_BY_STATE[editState] ? (
                      CITIES_BY_STATE[editState].map((city) => (
                        <Picker.Item key={city} label={city} value={city} />
                      ))
                    ) : (
                      <Picker.Item
                        label="Please select state first"
                        value=""
                        enabled={false}
                      />
                    )}
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </YStack>

              <YStack gap="$2">
                <Text color="$gray11" fontSize="$2">
                  State *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editState}
                    onValueChange={(value) => {
                      setEditState(value);
                      // Reset city when state changes
                      if (editState !== value) {
                        setEditCity("");
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
                <Text color="$gray11" fontSize="$2">
                  Country *
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editCountry}
                    onValueChange={(value) => setEditCountry(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your country" value="" />
                    {COUNTRIES.map((country) => (
                      <Picker.Item
                        key={country}
                        label={country}
                        value={country}
                      />
                    ))}
                  </Picker>
                </View>
              </YStack>

              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text color="$gray11" fontWeight="600" fontSize="$3">
                      Enable Collector Mode
                    </Text>
                    <Text color="$gray10" fontSize="$2" marginTop="$1">
                      Collect waste from your area and earn points
                    </Text>
                  </YStack>
                  <Switch
                    checked={editCollectorMode}
                    onCheckedChange={setEditCollectorMode}
                    size="$4"
                  >
                    <Switch.Thumb animation="quick" backgroundColor="white" />
                  </Switch>
                </XStack>
              </YStack>

              <XStack gap="$2" marginTop="$2">
                <Button
                  flex={1}
                  onPress={handleCancelEdit}
                  backgroundColor="$gray5"
                  color="$gray11"
                  fontWeight="600"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  flex={1}
                  onPress={handleSaveProfile}
                  backgroundColor="$blue9"
                  color="white"
                  fontWeight="600"
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner color="white" /> : "Save Changes"}
                </Button>
              </XStack>
            </YStack>
          ) : (
            <>
              {/* Profile Display */}
              <YStack gap="$3">
                <YStack>
                  <Text color="$gray10" fontSize="$2">
                    Full Name
                  </Text>
                  <Text
                    color="$gray12"
                    fontSize="$4"
                    fontWeight="600"
                    marginTop="$1"
                  >
                    {profile?.name || "Not set"}
                  </Text>
                </YStack>

                <YStack>
                  <Text color="$gray10" fontSize="$2">
                    Phone Number
                  </Text>
                  <Text
                    color="$gray12"
                    fontSize="$4"
                    fontWeight="600"
                    marginTop="$1"
                  >
                    {profile?.phone || "Not set"}
                  </Text>
                </YStack>

                <YStack>
                  <Text color="$gray10" fontSize="$2">
                    City
                  </Text>
                  <Text
                    color="$gray12"
                    fontSize="$4"
                    fontWeight="600"
                    marginTop="$1"
                  >
                    {profile?.city || "Not set"}
                  </Text>
                </YStack>

                <YStack>
                  <Text color="$gray10" fontSize="$2">
                    State
                  </Text>
                  <Text
                    color="$gray12"
                    fontSize="$4"
                    fontWeight="600"
                    marginTop="$1"
                  >
                    {profile?.state || "Not set"}
                  </Text>
                </YStack>

                <YStack>
                  <Text color="$gray10" fontSize="$2">
                    Country
                  </Text>
                  <Text
                    color="$gray12"
                    fontSize="$4"
                    fontWeight="600"
                    marginTop="$1"
                  >
                    {profile?.country || "Not set"}
                  </Text>
                </YStack>

                <YStack>
                  <Text color="$gray10" fontSize="$2">
                    Collector Mode
                  </Text>
                  <XStack alignItems="center" marginTop="$1" gap="$2">
                    <Text
                      color={profile?.enableCollector ? "$green10" : "$gray10"}
                      fontSize="$4"
                      fontWeight="600"
                    >
                      {profile?.enableCollector ? "✅ Enabled" : "❌ Disabled"}
                    </Text>
                  </XStack>
                </YStack>
              </YStack>

              <Button
                onPress={() => setIsEditing(true)}
                backgroundColor="$blue9"
                color="white"
                fontWeight="600"
                marginTop="$3"
              >
                Edit Profile
              </Button>
            </>
          )}
        </YStack>

        {/* Stats */}
        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" color="$blue9" />
          </YStack>
        ) : stats && profile ? (
          <>
            <YStack paddingHorizontal="$4">
              <H4 color="$gray12" fontWeight="bold" marginBottom="$3">
                Your Statistics
              </H4>

              {/* Points Card */}
              <YStack
                backgroundColor="$yellow2"
                borderRadius="$4"
                padding="$4"
                marginBottom="$3"
                borderWidth={2}
                borderColor="$yellow9"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text color="$yellow10" fontSize="$2" fontWeight="600">
                      Total Points
                    </Text>
                    <H2 color="$yellow10" fontWeight="bold" marginTop="$1">
                      {profile.globalPoints}
                    </H2>
                    <XStack gap="$2" marginTop="$2">
                      <Text color="$yellow11" fontSize="$2">
                        📝 Reporter: {profile.reporterPoints}
                      </Text>
                      <Text color="$yellow11" fontSize="$2">
                        🗑️ Collector: {profile.collectorPoints}
                      </Text>
                    </XStack>
                  </YStack>
                  <Text fontSize={50}>🏆</Text>
                </XStack>
              </YStack>

              {/* Stats Grid */}
              <XStack gap="$3" marginBottom="$3">
                <YStack
                  flex={1}
                  backgroundColor="white"
                  borderRadius="$4"
                  padding="$4"
                  elevation="$1"
                  alignItems="center"
                >
                  <Text color="$gray11" fontSize="$2" marginBottom="$1">
                    Reported
                  </Text>
                  <H2 color="$blue9" fontWeight="bold">
                    {stats.totalReported}
                  </H2>
                  <Text color="$gray10" fontSize="$1" marginTop="$1">
                    waste items
                  </Text>
                </YStack>

                <YStack
                  flex={1}
                  backgroundColor="white"
                  borderRadius="$4"
                  padding="$4"
                  elevation="$1"
                  alignItems="center"
                >
                  <Text color="$gray11" fontSize="$2" marginBottom="$1">
                    Collected
                  </Text>
                  <H2 color="$green9" fontWeight="bold">
                    {stats.totalCollected}
                  </H2>
                  <Text color="$gray10" fontSize="$1" marginTop="$1">
                    waste items
                  </Text>
                </YStack>
              </XStack>

              <YStack
                backgroundColor="white"
                borderRadius="$4"
                padding="$4"
                elevation="$1"
                marginBottom="$4"
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text color="$gray11" fontSize="$2" marginBottom="$1">
                      Pending Reports
                    </Text>
                    <H4 color="$orange9" fontWeight="bold">
                      {stats.pendingReports}
                    </H4>
                  </YStack>
                  <Text fontSize={30}>⏳</Text>
                </XStack>
              </YStack>
            </YStack>

            {/* Impact Info */}
            <YStack
              margin="$4"
              marginTop="$0"
              padding="$4"
              backgroundColor="$green2"
              borderRadius="$4"
              borderLeftWidth={4}
              borderLeftColor="$green9"
            >
              <H4 color="$green11" fontWeight="bold" marginBottom="$2">
                🌍 Your Impact
              </H4>
              <Text color="$green11" fontSize="$3">
                You've helped make your community cleaner by reporting{" "}
                {stats.totalReported} waste items and collecting{" "}
                {stats.totalCollected} items!
              </Text>
            </YStack>
          </>
        ) : null}

        {/* Sign Out Button */}
        <YStack padding="$4" paddingTop="$2">
          <Button
            onPress={handleSignOut}
            backgroundColor="$red9"
            color="white"
            fontWeight="600"
            size="$5"
          >
            Sign Out
          </Button>
        </YStack>
      </ScrollView>
    </Theme>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
});
