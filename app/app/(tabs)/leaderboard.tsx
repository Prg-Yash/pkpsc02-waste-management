import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";

export default function LeaderboardScreen() {
  const { user } = useUser();

  const topUsers = [
    {
      rank: 1,
      name: "Sarah Johnson",
      points: 1250,
      reports: 45,
      collected: 38,
      badge: "🏆",
    },
    {
      rank: 2,
      name: "Mike Chen",
      points: 1180,
      reports: 42,
      collected: 35,
      badge: "🥈",
    },
    {
      rank: 3,
      name: "Emma Davis",
      points: 1050,
      reports: 38,
      collected: 32,
      badge: "🥉",
    },
    {
      rank: 4,
      name: "You",
      points: 450,
      reports: 15,
      collected: 12,
      badge: "",
    },
    {
      rank: 5,
      name: "Alex Kumar",
      points: 420,
      reports: 14,
      collected: 11,
      badge: "",
    },
    {
      rank: 6,
      name: "Lisa Wang",
      points: 390,
      reports: 13,
      collected: 10,
      badge: "",
    },
    {
      rank: 7,
      name: "Tom Brown",
      points: 360,
      reports: 12,
      collected: 9,
      badge: "",
    },
    {
      rank: 8,
      name: "Maria Garcia",
      points: 340,
      reports: 11,
      collected: 9,
      badge: "",
    },
  ];

  const achievements = [
    {
      icon: "🌟",
      title: "First Report",
      description: "Submit your first waste report",
    },
    {
      icon: "⚡",
      title: "Quick Collector",
      description: "Collect 10 reports in a day",
    },
    {
      icon: "🎯",
      title: "Accuracy Master",
      description: "100% collection rate",
    },
    { icon: "🌱", title: "Eco Warrior", description: "Earn 1000 points" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Compete and earn rewards</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>All Time</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>This Month</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.podium}>
        <View style={styles.podiumPlace}>
          <Text style={styles.podiumRank}>🥈</Text>
          <View style={styles.podiumCard}>
            <Text style={styles.podiumName}>{topUsers[1].name}</Text>
            <Text style={styles.podiumPoints}>{topUsers[1].points}</Text>
            <Text style={styles.podiumLabel}>points</Text>
          </View>
        </View>
        <View style={[styles.podiumPlace, styles.podiumFirst]}>
          <Text style={styles.podiumRank}>🏆</Text>
          <View style={[styles.podiumCard, styles.podiumCardFirst]}>
            <Text style={styles.podiumName}>{topUsers[0].name}</Text>
            <Text style={[styles.podiumPoints, styles.podiumPointsFirst]}>
              {topUsers[0].points}
            </Text>
            <Text style={styles.podiumLabel}>points</Text>
          </View>
        </View>
        <View style={styles.podiumPlace}>
          <Text style={styles.podiumRank}>🥉</Text>
          <View style={styles.podiumCard}>
            <Text style={styles.podiumName}>{topUsers[2].name}</Text>
            <Text style={styles.podiumPoints}>{topUsers[2].points}</Text>
            <Text style={styles.podiumLabel}>points</Text>
          </View>
        </View>
      </View>

      <View style={styles.listSection}>
        {topUsers.slice(3).map((user) => (
          <View
            key={user.rank}
            style={[
              styles.userCard,
              user.name === "You" && styles.userCardHighlight,
            ]}
          >
            <View style={styles.userRank}>
              <Text style={styles.rankNumber}>{user.rank}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text
                style={[
                  styles.userName,
                  user.name === "You" && styles.userNameHighlight,
                ]}
              >
                {user.name}
              </Text>
              <View style={styles.userStats}>
                <Text style={styles.userStat}>📍 {user.reports} reports</Text>
                <Text style={styles.userStat}>
                  🚛 {user.collected} collected
                </Text>
              </View>
            </View>
            <View style={styles.userPoints}>
              <Text
                style={[
                  styles.pointsValue,
                  user.name === "You" && styles.pointsValueHighlight,
                ]}
              >
                {user.points}
              </Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>🏅 Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
            </View>
          ))}
        </View>
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
    backgroundColor: "#f59e0b",
    padding: 30,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#f59e0b",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "white",
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  podiumPlace: {
    flex: 1,
    alignItems: "center",
  },
  podiumFirst: {
    marginBottom: 20,
  },
  podiumRank: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  podiumCardFirst: {
    backgroundColor: "#fef3c7",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  podiumPointsFirst: {
    fontSize: 28,
  },
  podiumLabel: {
    fontSize: 10,
    color: "#666",
  },
  listSection: {
    paddingHorizontal: 20,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userCardHighlight: {
    backgroundColor: "#dcfce7",
    borderWidth: 2,
    borderColor: "#22c55e",
  },
  userRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userNameHighlight: {
    color: "#22c55e",
  },
  userStats: {
    flexDirection: "row",
    gap: 12,
  },
  userStat: {
    fontSize: 12,
    color: "#666",
  },
  userPoints: {
    alignItems: "flex-end",
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  pointsValueHighlight: {
    color: "#22c55e",
  },
  pointsLabel: {
    fontSize: 10,
    color: "#666",
  },
  achievementsSection: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  achievementDescription: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
});
