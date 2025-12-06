import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

export default function CollectWasteScreen() {
  const pendingReports = [
    {
      id: 1,
      location: "123 Main Street",
      type: "Plastic",
      distance: "0.5 km",
      points: 20,
      time: "2 hours ago",
    },
    {
      id: 2,
      location: "Park Avenue",
      type: "Organic",
      distance: "1.2 km",
      points: 15,
      time: "5 hours ago",
    },
    {
      id: 3,
      location: "Downtown Plaza",
      type: "Metal",
      distance: "2.0 km",
      points: 25,
      time: "1 day ago",
    },
    {
      id: 4,
      location: "River Road",
      type: "Glass",
      distance: "3.5 km",
      points: 30,
      time: "1 day ago",
    },
  ];

  const handleCollect = (id: number, points: number) => {
    alert(`Collection started! You'll earn ${points} points upon completion.`);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Plastic: "#3b82f6",
      Organic: "#22c55e",
      Metal: "#f59e0b",
      Glass: "#8b5cf6",
      Electronic: "#ef4444",
      Paper: "#14b8a6",
    };
    return colors[type] || "#666";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collect Waste</Text>
        <Text style={styles.headerSubtitle}>
          Find and collect reported waste
        </Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Collected Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>240</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Reports</Text>
          <TouchableOpacity>
            <Text style={styles.filterText}>🗺️ Map View</Text>
          </TouchableOpacity>
        </View>

        {pendingReports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportInfo}>
                <Text style={styles.reportLocation}>{report.location}</Text>
                <View style={styles.reportMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeColor(report.type) + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        { color: getTypeColor(report.type) },
                      ]}
                    >
                      {report.type}
                    </Text>
                  </View>
                  <Text style={styles.distance}>📍 {report.distance}</Text>
                </View>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+{report.points}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>
            <View style={styles.reportFooter}>
              <Text style={styles.timeText}>Reported {report.time}</Text>
              <TouchableOpacity
                style={styles.collectButton}
                onPress={() => handleCollect(report.id, report.points)}
              >
                <Text style={styles.collectButtonText}>Collect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>🎯 Collection Tips</Text>
        <Text style={styles.tipText}>• Start with nearby locations</Text>
        <Text style={styles.tipText}>• Bring appropriate collection bags</Text>
        <Text style={styles.tipText}>• Mark as collected when done</Text>
        <Text style={styles.tipText}>
          • Earn bonus points for quick collection
        </Text>
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
    backgroundColor: "#3b82f6",
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
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filterText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  reportCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportLocation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  distance: {
    fontSize: 12,
    color: "#666",
  },
  pointsBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  pointsLabel: {
    fontSize: 10,
    color: "#f59e0b",
  },
  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  timeText: {
    fontSize: 12,
    color: "#999",
  },
  collectButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  collectButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  tipSection: {
    margin: 20,
    padding: 20,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#1e40af",
    marginBottom: 6,
  },
});
