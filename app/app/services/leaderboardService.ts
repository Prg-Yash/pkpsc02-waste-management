const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  rank: number;
  globalPoints?: number;
  reporterPoints?: number;
  collectorPoints?: number | null;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  me: LeaderboardUser;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalUsers: number;
  };
}

/**
 * Fetch global leaderboard
 */
export async function fetchGlobalLeaderboard(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(
      `${API_URL}/api/leaderboard/global?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching global leaderboard:", error);
    throw new Error(
      `Failed to fetch global leaderboard: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch reporters leaderboard
 */
export async function fetchReportersLeaderboard(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(
      `${API_URL}/api/leaderboard/reporters?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching reporters leaderboard:", error);
    throw new Error(
      `Failed to fetch reporters leaderboard: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch collectors leaderboard
 */
export async function fetchCollectorsLeaderboard(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(
      `${API_URL}/api/leaderboard/collectors?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching collectors leaderboard:", error);
    throw new Error(
      `Failed to fetch collectors leaderboard: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
