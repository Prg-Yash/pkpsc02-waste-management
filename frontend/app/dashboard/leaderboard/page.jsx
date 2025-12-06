'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award, TrendingUp, Users, Star, Crown, Zap, Target, ArrowLeft, ChevronUp, ChevronDown, Trash2, FileText } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('global'); // global, collectors, reporters
  const [animatedStats, setAnimatedStats] = useState({
    totalUsers: 0,
    yourRank: 0,
    yourPoints: 0,
    topScore: 0
  });

  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        totalUsers: 1247,
        yourRank: 23,
        yourPoints: 1850,
        topScore: 5420
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Collectors leaderboard data
  const collectorsData = [
    { 
      rank: 1, 
      name: 'Alex Johnson', 
      collectionPoints: 5420, 
      collections: 89,
      wasteCollected: 445,
      trend: 'up',
      change: 12,
      initials: 'AJ',
      level: 'Diamond'
    },
    { 
      rank: 2, 
      name: 'Maria Garcia', 
      collectionPoints: 4890, 
      collections: 76,
      wasteCollected: 380,
      trend: 'up',
      change: 8,
      initials: 'MG',
      level: 'Platinum'
    },
    { 
      rank: 3, 
      name: 'David Chen', 
      collectionPoints: 4320, 
      collections: 68,
      wasteCollected: 340,
      trend: 'down',
      change: 3,
      initials: 'DC',
      level: 'Platinum'
    },
    { 
      rank: 4, 
      name: 'Sarah Williams', 
      collectionPoints: 4120, 
      collections: 68,
      wasteCollected: 340,
      trend: 'up',
      change: 15,
      initials: 'SW',
      level: 'Gold'
    },
    { 
      rank: 5, 
      name: 'James Brown', 
      collectionPoints: 3890, 
      collections: 62,
      wasteCollected: 310,
      trend: 'same',
      change: 0,
      initials: 'JB',
      level: 'Gold'
    },
  ];

  // Reporters leaderboard data
  const reportersData = [
    { 
      rank: 1, 
      name: 'Emily Wilson', 
      reportPoints: 4850, 
      reports: 97,
      wasteReported: 485,
      trend: 'up',
      change: 15,
      initials: 'EW',
      level: 'Diamond'
    },
    { 
      rank: 2, 
      name: 'Michael Chen', 
      reportPoints: 4320, 
      reports: 86,
      wasteReported: 430,
      trend: 'up',
      change: 10,
      initials: 'MC',
      level: 'Platinum'
    },
    { 
      rank: 3, 
      name: 'Lisa Anderson', 
      reportPoints: 3980, 
      reports: 79,
      wasteReported: 395,
      trend: 'same',
      change: 0,
      initials: 'LA',
      level: 'Platinum'
    },
    { 
      rank: 4, 
      name: 'Robert Taylor', 
      reportPoints: 3650, 
      reports: 73,
      wasteReported: 365,
      trend: 'up',
      change: 8,
      initials: 'RT',
      level: 'Gold'
    },
    { 
      rank: 5, 
      name: 'Jennifer Lee', 
      reportPoints: 3420, 
      reports: 68,
      wasteReported: 340,
      trend: 'down',
      change: 5,
      initials: 'JL',
      level: 'Gold'
    },
  ];

  // Global leaderboard data (combined)
  const globalData = [
    { 
      rank: 1, 
      name: 'Alex Johnson', 
      points: 5420, 
      reports: 45,
      collections: 89, 
      trend: 'up',
      change: 12,
      initials: 'AJ',
      level: 'Diamond'
    },
    { 
      rank: 2, 
      name: 'Emily Wilson', 
      points: 4850, 
      reports: 97,
      collections: 38,
      trend: 'up',
      change: 15,
      initials: 'EW',
      level: 'Platinum'
    },
    { 
      rank: 3, 
      name: 'Maria Garcia', 
      points: 4890, 
      reports: 42,
      collections: 76,
      trend: 'up',
      change: 8,
      initials: 'MG',
      level: 'Platinum'
    },
    { 
      rank: 4, 
      name: 'David Chen', 
      points: 4560, 
      reports: 35,
      collections: 71,
      trend: 'down',
      change: 3,
      initials: 'DC',
      level: 'Gold'
    },
    { 
      rank: 5, 
      name: 'Michael Chen', 
      points: 4320, 
      reports: 86,
      collections: 34,
      trend: 'up',
      change: 10,
      initials: 'MC',
      level: 'Gold'
    },
    { 
      rank: 6, 
      name: 'Sarah Williams', 
      points: 4120, 
      reports: 40,
      collections: 68,
      trend: 'up',
      change: 15,
      initials: 'SW',
      level: 'Silver'
    },
    { 
      rank: 7, 
      name: 'Lisa Anderson', 
      points: 3980, 
      reports: 79,
      collections: 32,
      trend: 'same',
      change: 0,
      initials: 'LA',
      level: 'Silver'
    },
    { 
      rank: 8, 
      name: 'James Brown', 
      points: 3890, 
      reports: 30,
      collections: 62,
      trend: 'same',
      change: 0,
      initials: 'JB',
      level: 'Bronze'
    },
    { 
      rank: 9, 
      name: 'Robert Taylor', 
      points: 3650, 
      reports: 73,
      collections: 29,
      trend: 'up',
      change: 8,
      initials: 'RT',
      level: 'Bronze'
    },
    { 
      rank: 10, 
      name: 'Jennifer Lee', 
      points: 3420, 
      reports: 68,
      collections: 27,
      trend: 'down',
      change: 5,
      initials: 'JL',
      level: 'Member'
    },
  ];

  // Get current leaderboard data based on active tab
  const getCurrentLeaderboard = () => {
    switch (activeTab) {
      case 'collectors':
        return collectorsData;
      case 'reporters':
        return reportersData;
      default:
        return globalData;
    }
  };

  const leaderboardData = getCurrentLeaderboard();

  // Calculate dynamic stats based on active tab
  const getStats = () => {
    const data = getCurrentLeaderboard();
    
    if (activeTab === 'collectors') {
      const totalCollections = data.reduce((sum, user) => sum + (user.collections || 0), 0);
      const totalWaste = data.reduce((sum, user) => sum + (user.wasteCollected || 0), 0);
      const topCollector = data[0]?.name || 'N/A';
      
      return {
        totalUsers: data.length,
        yourRank: '#12',
        yourPoints: 2450,
        topScore: data[0]?.collectionPoints || 0,
        customStats: [
          { title: 'Total Collections', value: totalCollections, subtitle: 'Wastes collected', icon: Trash2 },
          { title: 'Total Waste', value: `${totalWaste}kg`, subtitle: 'Collected', icon: TrendingUp },
          { title: 'Top Collector', value: topCollector, subtitle: data[0]?.collections + ' collections', icon: Award }
        ]
      };
    } else if (activeTab === 'reporters') {
      const totalReports = data.reduce((sum, user) => sum + (user.reports || 0), 0);
      const totalWaste = data.reduce((sum, user) => sum + (user.wasteReported || 0), 0);
      const topReporter = data[0]?.name || 'N/A';
      
      return {
        totalUsers: data.length,
        yourRank: '#8',
        yourPoints: 3200,
        topScore: data[0]?.reportPoints || 0,
        customStats: [
          { title: 'Total Reports', value: totalReports, subtitle: 'Waste reported', icon: FileText },
          { title: 'Total Waste', value: `${totalWaste}kg`, subtitle: 'Reported', icon: TrendingUp },
          { title: 'Top Reporter', value: topReporter, subtitle: data[0]?.reports + ' reports', icon: Award }
        ]
      };
    } else {
      const totalReports = data.reduce((sum, user) => sum + (user.reports || 0), 0);
      const totalCollections = data.reduce((sum, user) => sum + (user.collections || 0), 0);
      const topContributor = data[0]?.name || 'N/A';
      
      return {
        totalUsers: data.length,
        yourRank: '#10',
        yourPoints: 2850,
        topScore: data[0]?.points || 0,
        customStats: [
          { title: 'Total Reports', value: totalReports, subtitle: 'Waste reported', icon: FileText },
          { title: 'Total Collections', value: totalCollections, subtitle: 'Wastes collected', icon: Trash2 },
          { title: 'Top Contributor', value: topContributor, subtitle: data[0]?.points + ' points', icon: Award }
        ]
      };
    }
  };

  const currentStats = getStats();

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, delay }) => {
    return (
      <div 
        className={`${gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] border border-white/20`}
        style={{ 
          animation: `fadeInUp 0.6s ease-out ${delay}ms both`
        }}
      >
        <div className="grid gap-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tracking-tight">
                {value.toLocaleString()}
              </p>
              <p className="text-sm font-medium opacity-90 mt-1">{title}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs font-medium opacity-80">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-700" />;
    }
    return null;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') {
      return <ChevronUp className="w-4 h-4 text-green-500" />;
    } else if (trend === 'down') {
      return <ChevronDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-gray-600 mt-1">Top Contributors & Rankings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-6 border border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'global'
                  ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Global</span>
              <span className="text-xs opacity-75">(Combined)</span>
            </button>
            <button
              onClick={() => setActiveTab('collectors')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'collectors'
                  ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span>Collectors</span>
            </button>
            <button
              onClick={() => setActiveTab('reporters')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'reporters'
                  ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Reporters</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            icon={Users}
            title="Total Users"
            value={currentStats.totalUsers}
            subtitle={activeTab === 'collectors' ? 'Active collectors' : activeTab === 'reporters' ? 'Active reporters' : 'Active contributors'}
            gradient="bg-linear-to-br from-green-500 to-green-600"
            delay={100}
          />
          <StatCard 
            icon={Target}
            title="Your Rank"
            value={currentStats.yourRank}
            subtitle="Keep climbing!"
            gradient="bg-linear-to-br from-emerald-500 to-emerald-600"
            delay={200}
          />
          <StatCard 
            icon={Star}
            title="Your Points"
            value={currentStats.yourPoints}
            subtitle="+150 this week"
            gradient="bg-linear-to-br from-green-600 to-emerald-700"
            delay={300}
          />
          <StatCard 
            icon={Trophy}
            title={activeTab === 'collectors' ? 'Top Collection Points' : activeTab === 'reporters' ? 'Top Report Points' : 'Top Score'}
            value={currentStats.topScore}
            subtitle="Current leader"
            gradient="bg-linear-to-br from-green-700 to-emerald-800"
            delay={400}
          />
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 bg-linear-to-r from-green-500 to-emerald-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeTab === 'collectors' ? 'Top Collectors' : activeTab === 'reporters' ? 'Top Reporters' : 'Top Contributors'}
                </h2>
                <p className="text-emerald-100 text-sm">
                  {activeTab === 'collectors' ? 'Ranked by waste collected' : activeTab === 'reporters' ? 'Ranked by waste reported' : 'Monthly performance rankings'}
                </p>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-3 text-center">{activeTab === 'collectors' ? 'Collection Points' : activeTab === 'reporters' ? 'Report Points' : 'Points'}</div>
            {activeTab === 'collectors' && (
              <>
                <div className="col-span-2 text-center">Collections</div>
                <div className="col-span-2 text-center">Waste (kg)</div>
              </>
            )}
            {activeTab === 'reporters' && (
              <>
                <div className="col-span-2 text-center">Reports</div>
                <div className="col-span-2 text-center">Waste (kg)</div>
              </>
            )}
            {activeTab === 'global' && (
              <>
                <div className="col-span-2 text-center">Reports</div>
                <div className="col-span-2 text-center">Collections</div>
              </>
            )}
          </div>

          {/* Leaderboard Items */}
          <div className="divide-y divide-gray-100">
            {leaderboardData.map((entry, index) => (
              <div
                key={entry.rank}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-6 hover:bg-linear-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 ${
                  entry.rank <= 3 ? 'bg-linear-to-r from-green-50 to-emerald-50' : ''
                }`}
                style={{ 
                  animation: `fadeInUp 0.4s ease-out ${index * 50}ms both`
                }}
              >
                {/* Rank */}
                <div className="md:col-span-1 flex md:justify-center items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold ${
                    entry.rank === 1 ? 'bg-linear-to-br from-green-400 to-green-600 text-white' :
                    entry.rank === 2 ? 'bg-linear-to-br from-gray-300 to-gray-500 text-white' :
                    entry.rank === 3 ? 'bg-linear-to-br from-amber-600 to-amber-800 text-white' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {entry.rank}
                  </div>
                  {getRankBadge(entry.rank)}
                  <span className="md:hidden font-semibold text-gray-900">{entry.name}</span>
                </div>

                {/* User Info */}
                <div className="md:col-span-4 flex items-center gap-3 md:ml-0 ml-13">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    entry.rank === 1 ? 'bg-linear-to-br from-green-500 to-emerald-600' :
                    entry.rank === 2 ? 'bg-linear-to-br from-emerald-500 to-green-600' :
                    entry.rank === 3 ? 'bg-linear-to-br from-green-600 to-emerald-700' :
                    'bg-linear-to-br from-gray-400 to-gray-500'
                  }`}>
                    {entry.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 hidden md:block">{entry.name}</p>
                    <p className="text-sm text-gray-500">Member since 2024</p>
                  </div>
                </div>

                {/* Points */}
                <div className="md:col-span-3 flex md:justify-center items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-gray-900 text-lg">
                      {activeTab === 'collectors' ? entry.collectionPoints?.toLocaleString() : activeTab === 'reporters' ? entry.reportPoints?.toLocaleString() : entry.points?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Dynamic Metrics */}
                {activeTab === 'collectors' && (
                  <>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-gray-700">{entry.collections || 0}</span>
                    </div>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-emerald-600">{entry.wasteCollected || 0} kg</span>
                    </div>
                  </>
                )}
                {activeTab === 'reporters' && (
                  <>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-gray-700">{entry.reports || 0}</span>
                    </div>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-emerald-600">{entry.wasteReported || 0} kg</span>
                    </div>
                  </>
                )}
                {activeTab === 'global' && (
                  <>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-gray-700">{entry.reports || 0}</span>
                    </div>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-gray-700">{entry.collections || 0}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p>Rankings updated in real-time based on waste collection reports</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardPage;
