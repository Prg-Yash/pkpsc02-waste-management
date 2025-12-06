'use client';

import { useUser } from '@clerk/nextjs';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Star, Crown, Zap, Target, ChevronUp, ChevronDown, Trash2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '@/lib/api-config';

const LeaderboardPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('global'); // global, collectors, reporters
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [myData, setMyData] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (type) => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use proxy route to avoid ngrok CORS and browser warning issues (similar to collect-waste)
      const proxyUrl = '/api/leaderboard-proxy';
      console.log("user.id", user.id, "type", type);
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,  // Use the type parameter passed to the function
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      // Map API response to UI format
      const mappedLeaderboard = data.leaderboard.map((entry) => ({
        id: entry.id,
        rank: entry.rank,
        name: entry.name || 'Anonymous',
        email: entry.email,
        initials: getInitials(entry.name),
        // Points based on type
        points: entry.globalPoints || 0,
        collectionPoints: entry.collectorPoints,
        reportPoints: entry.reporterPoints,
      }));

      setLeaderboardData(mappedLeaderboard);
      setMyData(data.me);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch data when tab changes or user changes
  useEffect(() => {
    if (user?.id) {
      fetchLeaderboard(activeTab);
    }
  }, [activeTab, fetchLeaderboard, user?.id]);

  // Old hardcoded data removed - now fetching from API

  // Calculate dynamic stats based on active tab
  const getStats = () => {
    if (!myData || !pagination) {
      return {
        totalUsers: 0,
        yourRank: '#--',
        yourPoints: 0,
        topScore: 0
      };
    }

    let yourPoints = 0;
    let topScore = 0;

    if (activeTab === 'collectors') {
      yourPoints = myData.collectorPoints || 0;
      topScore = leaderboardData[0]?.collectionPoints || 0;
    } else if (activeTab === 'reporters') {
      yourPoints = myData.reporterPoints || 0;
      topScore = leaderboardData[0]?.reportPoints || 0;
    } else {
      yourPoints = myData.globalPoints || 0;
      topScore = leaderboardData[0]?.points || 0;
    }

    return {
      totalUsers: pagination.totalUsers || 0,
      yourRank: myData.rank ? `#${myData.rank}` : '#--',
      yourPoints,
      topScore
    };
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
                {typeof value === 'string' ? value : value.toLocaleString()}
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
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'global'
                  ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trophy className="w-5 h-5" />
              <span>Global</span>
              <span className="text-xs opacity-75">(Combined)</span>
            </button>
            <button
              onClick={() => setActiveTab('collectors')}
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'collectors'
                  ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trash2 className="w-5 h-5" />
              <span>Collectors</span>
            </button>
            <button
              onClick={() => setActiveTab('reporters')}
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'reporters'
                  ? 'bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileText className="w-5 h-5" />
              <span>Reporters</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">Error Loading Leaderboard</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => fetchLeaderboard(activeTab)}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!error && (
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
              subtitle="Your current score"
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
        )}

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
                  {activeTab === 'collectors' ? 'Ranked by collection points' : activeTab === 'reporters' ? 'Ranked by report points' : 'Ranked by global points'}
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading leaderboard...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && leaderboardData.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center">
              <Trophy className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">No leaderboard data available</p>
            </div>
          )}

          {/* Table Header */}
          {!loading && !error && leaderboardData.length > 0 && (
            <>
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-4">User</div>
                <div className="col-span-3 text-center">{activeTab === 'collectors' ? 'Collection Points' : activeTab === 'reporters' ? 'Report Points' : 'Global Points'}</div>
                {activeTab === 'global' && (
                  <>
                    <div className="col-span-2 text-center">Reporter Points</div>
                    <div className="col-span-2 text-center">Collector Points</div>
                  </>
                )}
              </div>

              {/* Leaderboard Items */}
              <div className="divide-y divide-gray-100">
                {leaderboardData.map((entry, index) => (
                  <div
                    key={entry.id || entry.rank}
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
                    <p className="text-sm text-gray-500">{entry.email || 'No email'}</p>
                  </div>
                </div>

                {/* Points */}
                <div className="md:col-span-3 flex md:justify-center items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-gray-900 text-lg">
                      {activeTab === 'collectors' 
                        ? (entry.collectionPoints !== null && entry.collectionPoints !== undefined ? entry.collectionPoints.toLocaleString() : 'N/A')
                        : activeTab === 'reporters' 
                        ? (entry.reportPoints?.toLocaleString() || '0')
                        : (entry.points?.toLocaleString() || '0')}
                    </span>
                  </div>
                </div>

                {/* Global tab shows both reporter and collector points */}
                {activeTab === 'global' && (
                  <>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-gray-700">{entry.reportPoints?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="md:col-span-2 flex md:justify-center items-center">
                      <span className="font-semibold text-gray-700">
                        {entry.collectionPoints !== null && entry.collectionPoints !== undefined 
                          ? entry.collectionPoints.toLocaleString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
              </div>
            </>
          )}

          {/* Footer */}
          {!loading && !error && leaderboardData.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <p>Rankings updated in real-time based on waste collection reports</p>
                {pagination && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Page {pagination.currentPage} of {pagination.totalPages})
                  </span>
                )}
              </div>
            </div>
          )}
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
