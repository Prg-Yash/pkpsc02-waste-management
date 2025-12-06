import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

/**
 * Calculate date range based on time range filter
 */
function getDateRange(timeRange) {
  const now = new Date();
  const ranges = {
    '1m': { months: 1 },
    '3m': { months: 3 },
    '6m': { months: 6 },
    '1y': { months: 12 },
  };
  
  const range = ranges[timeRange] || ranges['6m'];
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - range.months);
  
  return { startDate, endDate: now };
}

/**
 * Get previous period for comparison
 */
function getPreviousPeriod(startDate, endDate) {
  const periodLength = endDate - startDate;
  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(prevEndDate.getTime() - periodLength);
  
  return { startDate: prevStartDate, endDate: prevEndDate };
}

/**
 * Group data by month
 */
function groupByMonth(data, dateField) {
  const grouped = {};
  data.forEach(item => {
    const dateValue = item[dateField] || item.createdAt || item.reportedAt;
    if (!dateValue) return;
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return;
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(item);
  });
  return grouped;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '6m';
    const selectedCity = searchParams.get('city') || 'all';
    
    // Get date ranges
    const { startDate, endDate } = getDateRange(timeRange);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(startDate, endDate);
    
    // Fetch all waste reports
    const wasteResponse = await fetch(`${API_BASE_URL}/api/waste/report`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!wasteResponse.ok) {
      throw new Error('Failed to fetch waste reports');
    }
    
    const wasteData = await wasteResponse.json();
    const allWastes = wasteData.wastes || [];
    
    // Fetch all users
    const usersResponse = await fetch(`${API_BASE_URL}/api/user/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!usersResponse.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const usersData = await usersResponse.json();
    const allUsers = usersData.users || [];
    
    // Filter data by date range
    const currentPeriodWastes = allWastes.filter(waste => {
      const wasteDate = new Date(waste.reportedAt || waste.createdAt);
      return wasteDate >= startDate && wasteDate <= endDate;
    });
    
    const previousPeriodWastes = allWastes.filter(waste => {
      const wasteDate = new Date(waste.reportedAt || waste.createdAt);
      return wasteDate >= prevStartDate && wasteDate < prevEndDate;
    });
    
    // Group wastes by city
    const cityWasteMap = {};
    const cityWasteMapPrev = {};
    
    currentPeriodWastes.forEach(waste => {
      if (!waste.city) return;
      const city = waste.city;
      if (!cityWasteMap[city]) {
        cityWasteMap[city] = {
          totalWaste: 0,
          recycled: 0,
          totalTokens: 0,
          wastes: [],
        };
      }
      
      const weight = waste.aiAnalysis?.estimatedWeightKg || 0;
      cityWasteMap[city].totalWaste += weight;
      cityWasteMap[city].wastes.push(waste);
      
      // Recycled = collected waste
      if (waste.status === 'COLLECTED') {
        cityWasteMap[city].recycled += weight;
      }
    });
    
    previousPeriodWastes.forEach(waste => {
      if (!waste.city) return;
      const city = waste.city;
      if (!cityWasteMapPrev[city]) {
        cityWasteMapPrev[city] = {
          totalWaste: 0,
          recycled: 0,
        };
      }
      
      const weight = waste.aiAnalysis?.estimatedWeightKg || 0;
      cityWasteMapPrev[city].totalWaste += weight;
      
      if (waste.status === 'COLLECTED') {
        cityWasteMapPrev[city].recycled += weight;
      }
    });
    
    // Group users by city and calculate tokens
    const cityUserMap = {};
    allUsers.forEach(user => {
      if (!user.address?.city && !user.city) return;
      const city = user.address?.city || user.city;
      if (!cityUserMap[city]) {
        cityUserMap[city] = {
          users: [],
          totalTokens: 0,
        };
      }
      cityUserMap[city].users.push(user);
      cityUserMap[city].totalTokens += user.globalPoints || 0;
    });
    
    // Combine data and calculate statistics
    const allCities = new Set([
      ...Object.keys(cityWasteMap),
      ...Object.keys(cityUserMap),
    ]);
    
    const cityStats = Array.from(allCities).map(city => {
      const wasteData = cityWasteMap[city] || { totalWaste: 0, recycled: 0, wastes: [] };
      const wasteDataPrev = cityWasteMapPrev[city] || { totalWaste: 0, recycled: 0 };
      const userData = cityUserMap[city] || { users: [], totalTokens: 0 };
      
      // Calculate trends
      const wasteChange = wasteDataPrev.totalWaste > 0
        ? ((wasteData.totalWaste - wasteDataPrev.totalWaste) / wasteDataPrev.totalWaste) * 100
        : wasteData.totalWaste > 0 ? 100 : 0;
      
      const trend = wasteChange >= 0 ? 'up' : 'down';
      const change = Math.abs(Math.round(wasteChange));
      
      return {
        city,
        totalWaste: Math.round(wasteData.totalWaste),
        recycled: Math.round(wasteData.recycled),
        users: userData.users.length,
        tokens: userData.totalTokens,
        trend,
        change,
      };
    }).sort((a, b) => b.totalWaste - a.totalWaste);
    
    // Calculate monthly data
    const monthlyGrouped = groupByMonth(currentPeriodWastes, 'reportedAt');
    const monthlyData = Object.keys(monthlyGrouped)
      .sort()
      .map(monthKey => {
        const wastes = monthlyGrouped[monthKey];
        const totalWaste = wastes.reduce((sum, w) => {
          return sum + (w.aiAnalysis?.estimatedWeightKg || 0);
        }, 0);
        const recycled = wastes
          .filter(w => w.status === 'COLLECTED')
          .reduce((sum, w) => {
            return sum + (w.aiAnalysis?.estimatedWeightKg || 0);
          }, 0);
        
        // Calculate tokens: 10 points per report + 20 points per collection
        const reportTokens = wastes.length * 10;
        const collectionTokens = wastes.filter(w => w.status === 'COLLECTED').length * 20;
        const tokens = reportTokens + collectionTokens;
        
        const date = new Date(monthKey + '-01');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
          month: monthNames[date.getMonth()],
          waste: Math.round(totalWaste),
          recycled: Math.round(recycled),
          tokens,
        };
      });
    
    // Calculate totals
    const totals = {
      totalWaste: cityStats.reduce((sum, city) => sum + city.totalWaste, 0),
      totalRecycled: cityStats.reduce((sum, city) => sum + city.recycled, 0),
      totalUsers: cityStats.reduce((sum, city) => sum + city.users, 0),
      totalTokens: cityStats.reduce((sum, city) => sum + city.tokens, 0),
    };
    
    // Filter by selected city if needed
    let filteredCityStats = cityStats;
    if (selectedCity !== 'all') {
      filteredCityStats = cityStats.filter(city => 
        city.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }
    
    return NextResponse.json({
      cityStats: filteredCityStats,
      monthlyData,
      totals,
      timeRange,
      selectedCity,
    });
    
  } catch (error) {
    console.error('Error fetching city reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch city reports', details: error.message },
      { status: 500 }
    );
  }
}

