import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

export default function ReportWasteScreen() {
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [wasteType, setWasteType] = useState("");

  const wasteTypes = [
    "Plastic",
    "Organic",
    "Electronic",
    "Metal",
    "Glass",
    "Paper",
  ];

  const handleSubmit = () => {
    // Handle report submission
    alert("Waste reported successfully! +10 points earned");
    setLocation("");
    setDescription("");
    setWasteType("");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report Waste</Text>
        <Text style={styles.headerSubtitle}>Help keep our community clean</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter location or address"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity style={styles.locationButton}>
            <Text style={styles.locationButtonText}>
              📍 Use Current Location
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Waste Type</Text>
          <View style={styles.wasteTypeContainer}>
            {wasteTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.wasteTypeButton,
                  wasteType === type && styles.wasteTypeButtonActive,
                ]}
                onPress={() => setWasteType(type)}
              >
                <Text
                  style={[
                    styles.wasteTypeText,
                    wasteType === type && styles.wasteTypeTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the waste issue..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.photoButton}>
          <Text style={styles.photoButtonText}>📷 Add Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!location || !wasteType) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!location || !wasteType}
        >
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Reporting Tips</Text>
        <Text style={styles.infoText}>• Be specific about the location</Text>
        <Text style={styles.infoText}>• Include photos if possible</Text>
        <Text style={styles.infoText}>• Earn points for each report</Text>
        <Text style={styles.infoText}>• Help your community stay clean</Text>
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  locationButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e",
    borderStyle: "dashed",
    alignItems: "center",
  },
  locationButtonText: {
    color: "#22c55e",
    fontWeight: "600",
    fontSize: 14,
  },
  wasteTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  wasteTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  wasteTypeButtonActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  wasteTypeText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  wasteTypeTextActive: {
    color: "white",
  },
  photoButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  photoButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    margin: 20,
    padding: 20,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#92400e",
    marginBottom: 6,
  },
});
