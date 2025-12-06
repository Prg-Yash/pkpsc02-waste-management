'use client';

import { useUser, UserButton } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Trash2, Recycle, TrendingUp, MapPin, AlertCircle, CheckCircle, Clock, Users, Leaf, Package, Droplets, Zap } from 'lucide-react';

const EcoFlowDashboard = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [allWastes, setAllWastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionData, setCollectionData] = useState([]);
  const [segregationData, setSegregationData] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isCollector, setIsCollector] = useState(false);

  // Fetch user data and user's waste reports only
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile with their waste reports
        const userResponse = await fetch('/api/user/me');
        if (userResponse.ok) {
          const data = await userResponse.json();
          const userProfile = data.user;
          setUserData(userProfile);
          setIsCollector(userProfile.enableCollector || false);
          
          // Combine user's reported and collected wastes
          const reportedWastes = userProfile.reportedWastes || [];
          const collectedWastes = userProfile.collectedWastes || [];
          
          // Merge and deduplicate wastes
          const userWastesMap = new Map();
          reportedWastes.forEach(w => userWastesMap.set(w.id, w));
          collectedWastes.forEach(w => {
            if (!userWastesMap.has(w.id)) {
              userWastesMap.set(w.id, w);
            }
          });
          
          const userWastes = Array.from(userWastesMap.values());
          setAllWastes(userWastes);
          
          // Process data for charts using only user's waste
          processCollectionData(userWastes);
          processSegregationData(userWastes);
          processEfficiencyData(userWastes);
        }

        // Fetch leaderboard to get total users count (for context)
        const leaderboardResponse = await fetch('/api/leaderboard-proxy');
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setTotalUsers(leaderboardData.users?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user]);

  // Process waste data for weekly collection trend
  const processCollectionData = (wastes) => {
    const last7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      const dayWastes = wastes.filter(w => {
        const wasteDate = new Date(w.reportedAt || w.createdAt).toISOString().split('T')[0];
        return wasteDate === dateStr;
      });
      
      const collected = dayWastes.filter(w => w.status === 'COLLECTED');
      const totalWeight = dayWastes.reduce((sum, w) => sum + (w.aiAnalysis?.estimatedWeightKg || 0), 0);
      const collectedWeight = collected.reduce((sum, w) => sum + (w.aiAnalysis?.estimatedWeightKg || 0), 0);
      
      last7Days.push({
        day: dayName,
        collected: totalWeight,
        recycled: collectedWeight
      });
    }
    
    setCollectionData(last7Days);
  };

  // Process waste data for segregation pie chart
  const processSegregationData = (wastes) => {
    const typeCount = {};
    const colors = {
      'ORGANIC': '#10b981',
      'PLASTIC': '#3b82f6',
      'PAPER': '#f59e0b',
      'METAL': '#8b5cf6',
      'GLASS': '#06b6d4',
      'E-WASTE': '#ef4444',
      'MIXED': '#6b7280'
    };
    
    wastes.forEach(w => {
      const type = w.aiAnalysis?.wasteType || w.wasteType || 'MIXED';
      const weight = w.aiAnalysis?.estimatedWeightKg || 1;
      typeCount[type] = (typeCount[type] || 0) + weight;
    });
    
    const chartData = Object.entries(typeCount).map(([name, value]) => ({
      name,
      value: Math.round(value * 10) / 10,
      color: colors[name] || '#6b7280'
    }));
    
    setSegregationData(chartData);
  };

  // Process efficiency trend for last 6 months
  const processEfficiencyData = (wastes) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = months[date.getMonth()];
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      const monthWastes = wastes.filter(w => {
        const wasteDate = new Date(w.reportedAt || w.createdAt);
        return wasteDate.getMonth() === monthIndex && wasteDate.getFullYear() === year;
      });
      
      const collected = monthWastes.filter(w => w.status === 'COLLECTED').length;
      const total = monthWastes.length;
      const efficiency = total > 0 ? ((collected / total) * 100).toFixed(1) : 0;
      
      last6Months.push({
        month: monthName,
        efficiency: parseFloat(efficiency),
        target: 85
      });
    }
    
    setEfficiencyData(last6Months);
  };



  const getStatusColor = (status) => {
    switch(status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, delay }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform transition-all duration-700 hover:scale-105 hover:shadow-2xl ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
          <div className={`p-4 rounded-xl ${gradient} shadow-md`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="grid gap-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Main Container with Grid */}
      <div className="grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
        
        {/* Header - Full Width */}
        <div className="col-span-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <Recycle className="w-12 h-12 text-white" />
              </div>
              <div className="grid gap-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  EcoFlow Dashboard
                </h1>
                <p className="text-gray-600">Smart Waste Management System</p>
              </div>
            </div>
            <div className="grid gap-1 text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">Just now</p>
              <div className="flex items-center justify-end gap-2 mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-600 font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Dynamic Grid based on collector status */}
        <div className={`col-span-12 grid grid-cols-1 sm:grid-cols-2 ${isCollector ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
          <StatCard 
            icon={Trash2}
            title="Reported Waste"
            value={userData?.reportedWastes?.length || 0}
            subtitle={`${userData?.reporterPoints || 0} points earned`}
            gradient="bg-linear-to-br from-blue-500 to-blue-600"
            delay={100}
          />
          {isCollector && (
            <StatCard 
              icon={Recycle}
              title="Collected Waste"
              value={userData?.collectedWastes?.length || 0}
              subtitle={`${userData?.collectorPoints || 0} points earned`}
              gradient="bg-linear-to-br from-emerald-500 to-emerald-600"
              delay={200}
            />
          )}
          <StatCard 
            icon={TrendingUp}
            title="Global Points"
            value={userData?.globalPoints || 0}
            subtitle="Total impact score"
            gradient="bg-linear-to-br from-purple-500 to-purple-600"
            delay={isCollector ? 300 : 200}
          />
          <StatCard 
            icon={MapPin}
            title="Location"
            value={userData?.city || 'Not Set'}
            subtitle={`${userData?.state || ''}, ${userData?.country || ''}`}
            gradient="bg-linear-to-br from-amber-500 to-amber-600"
            delay={isCollector ? 400 : 300}
          />
        </div>

        {/* Weekly Collection Trend - 8 Columns */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart className="w-5 h-5 text-emerald-600" />
              </div>
              {isCollector ? 'Your Weekly Activity' : 'Your Weekly Reports'}
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={collectionData}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorRecycled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="collected" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" name="Collected (kg)" />
                <Area type="monotone" dataKey="recycled" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRecycled)" name="Recycled (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Segregation - 4 Columns */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              Your Waste Distribution
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={segregationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {segregationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                  formatter={(value) => `${value} kg`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Trend - 8 Columns - Only for Collectors */}
        {isCollector && (
          <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="grid gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                Your Collection Efficiency
              </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis domain={[75, 95]} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Efficiency %"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Quick Actions - 4 Columns */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
            <div className="grid gap-3">
              <button className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                Schedule Collection
              </button>
              <button className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                Generate Report
              </button>
              <button className="w-full py-4 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                View Analytics
              </button>
              <button className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                Alert Management
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity - Full Width */}
        <div className="col-span-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              Your Recent Activity
            </h2>
            <div className="grid gap-3">
              {allWastes.slice(0, 6).map((waste, index) => (
                <div 
                  key={waste.id} 
                  className="border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 bg-linear-to-br from-white to-gray-50"
                >
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                    <div className={`p-3 rounded-lg ${
                      waste.status === 'COLLECTED' ? 'bg-emerald-100' :
                      waste.status === 'IN_PROGRESS' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <Trash2 className={`w-5 h-5 ${
                        waste.status === 'COLLECTED' ? 'text-emerald-600' :
                        waste.status === 'IN_PROGRESS' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="grid gap-1">
                      <p className="font-bold text-gray-800">{waste.aiAnalysis?.wasteType || waste.wasteType || 'Mixed Waste'}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {waste.city || waste.locationRaw || 'Unknown location'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(waste.reportedAt || waste.createdAt).toLocaleString('en-US', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        waste.status === 'COLLECTED' ? 'bg-emerald-500 text-white' :
                        waste.status === 'IN_PROGRESS' ? 'bg-yellow-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {waste.status}
                      </span>
                      {waste.aiAnalysis?.estimatedWeightKg && (
                        <p className="text-sm text-gray-600 mt-2">
                          {waste.aiAnalysis.estimatedWeightKg} kg
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {allWastes.length === 0 && (
                <p className="text-center text-gray-500 py-8">No waste reports yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Stats - Dynamic Grid based on collector status */}
        <div className={`col-span-12 grid grid-cols-1 ${isCollector ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
          <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="grid gap-3">
              <Trash2 className="w-10 h-10 opacity-80" />
              <div className="grid gap-1">
                <p className="text-sm opacity-90 font-medium">Your Total Reports</p>
                <p className="text-4xl font-bold">{allWastes.length.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {isCollector && (
            <div className="bg-linear-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="grid gap-3">
                <CheckCircle className="w-10 h-10 opacity-80" />
                <div className="grid gap-1">
                  <p className="text-sm opacity-90 font-medium">Your Completed Collections</p>
                  <p className="text-4xl font-bold">{allWastes.filter(w => w.status === 'COLLECTED').length.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="grid gap-3">
              <Leaf className="w-10 h-10 opacity-80" />
              <div className="grid gap-1">
                <p className="text-sm opacity-90 font-medium">{isCollector ? 'Your Total Weight Collected' : 'Your Total Weight Reported'}</p>
                <p className="text-4xl font-bold">
                  {isCollector
                    ? allWastes
                        .filter(w => w.status === 'COLLECTED')
                        .reduce((sum, w) => sum + (w.aiAnalysis?.estimatedWeightKg || 0), 0)
                        .toFixed(1)
                    : allWastes
                        .reduce((sum, w) => sum + (w.aiAnalysis?.estimatedWeightKg || 0), 0)
                        .toFixed(1)
                  } kg
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EcoFlowDashboard;