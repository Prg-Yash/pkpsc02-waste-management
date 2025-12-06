import { useUser } from "@clerk/clerk-expo";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SignOutButton } from "@/app/components/SignOutButton";

export default function HomeScreen() {
  const { user } = useUser();

  const stats = [
    { label: "Total Reports", value: "156", color: "#22c55e" },
    { label: "Collected", value: "124", color: "#3b82f6" },
    { label: "Your Points", value: "450", color: "#f59e0b" },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Waste reported",
      location: "Main Street",
      time: "2 hours ago",
    },
    {
      id: 2,
      action: "Waste collected",
      location: "Park Avenue",
      time: "5 hours ago",
    },
    { id: 3, action: "Points earned", amount: "+50 pts", time: "1 day ago" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user?.firstName || user?.emailAddresses[0].emailAddress}
          </Text>
        </View>
        <SignOutButton />
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { borderLeftColor: stat.color }]}
          >
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#22c55e" }]}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Report Waste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}
          >
            <Text style={styles.actionIcon}>🚛</Text>
            <Text style={styles.actionText}>Collect Waste</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityDetail}>
                {activity.location || activity.amount}
              </Text>
            </View>
            <Text style={styles.activityTime}>{activity.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#22c55e",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  activityCard: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  activityDetail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#999",
  },
});
