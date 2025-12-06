// Local Storage Service for Waste Reports
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WasteAnalysis } from "./geminiService";

const STORAGE_KEY = "@waste_reports";

export interface WasteReport {
  id: string;
  userId: string;
  imageUrl: string;
  s3ReportId?: string;
  analysis: WasteAnalysis;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  timestamp: string;
  status: "pending" | "submitted";
}

export async function saveWasteReport(
  report: Omit<WasteReport, "id" | "timestamp" | "status">
): Promise<WasteReport> {
  try {
    const newReport: WasteReport = {
      ...report,
      id: `local_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    const existing = await getAllReports();
    const updated = [newReport, ...existing];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newReport;
  } catch (error) {
    console.error("Failed to save report:", error);
    throw error;
  }
}

export async function getAllReports(): Promise<WasteReport[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get reports:", error);
    return [];
  }
}

export async function getReportById(id: string): Promise<WasteReport | null> {
  try {
    const reports = await getAllReports();
    return reports.find((r) => r.id === id) || null;
  } catch (error) {
    console.error("Failed to get report:", error);
    return null;
  }
}

export async function deleteReport(id: string): Promise<void> {
  try {
    const reports = await getAllReports();
    const filtered = reports.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete report:", error);
    throw error;
  }
}

export async function clearAllReports(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear reports:", error);
    throw error;
  }
}
