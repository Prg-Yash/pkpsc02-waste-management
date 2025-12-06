'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award, TrendingUp, Users, Star, Crown, Zap, Target, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useUser();
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

  // Leaderboard data
  const leaderboardData = [
    { 
      rank: 1, 
      name: 'Alex Johnson', 
      points: 5420, 
      reports: 89, 
      trend: 'up',
      change: 12,
      initials: 'AJ',
      level: 'Diamond'
    },
    { 
      rank: 2, 
      name: 'Maria Garcia', 
      points: 4890, 
      reports: 76, 
      trend: 'up',
      change: 8,
      initials: 'MG',
      level: 'Platinum'
    },
    { 
      rank: 3, 
      name: 'David Chen', 
      points: 4560, 
      reports: 71, 
      trend: 'down',
      change: 3,
      initials: 'DC',
      level: 'Platinum'
    },
    { 
      rank: 4, 
      name: 'Sarah Williams', 
      points: 4120, 
      reports: 68, 
      trend: 'up',
      change: 15,
      initials: 'SW',
      level: 'Gold'
    },
    { 
      rank: 5, 
      name: 'James Brown', 
      points: 3890, 
      reports: 62, 
      trend: 'same',
      change: 0,
      initials: 'JB',
      level: 'Gold'
    },
    { 
      rank: 6, 
      name: 'Emma Davis', 
      points: 3540, 
      reports: 58, 
      trend: 'up',
      change: 5,
      initials: 'ED',
      level: 'Silver'
    },
    { 
      rank: 7, 
      name: 'Michael Lee', 
      points: 3210, 
      reports: 54, 
      trend: 'up',
      change: 7,
      initials: 'ML',
      level: 'Silver'
    },
    { 
      rank: 8, 
      name: 'Olivia Martin', 
      points: 2980, 
      reports: 49, 
      trend: 'down',
      change: 2,
      initials: 'OM',
      level: 'Bronze'
    },
    { 
      rank: 9, 
      name: 'Daniel Wilson', 
      points: 2750, 
      reports: 45, 
      trend: 'up',
      change: 11,
      initials: 'DW',
      level: 'Bronze'
    },
    { 
      rank: 10, 
      name: 'Sophia Anderson', 
      points: 2540, 
      reports: 42, 
      trend: 'same',
      change: 0,
      initials: 'SA',
      level: 'Member'
    },
  ];

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            icon={Users}
            title="Total Users"
            value={animatedStats.totalUsers}
            subtitle="Active contributors"
            gradient="bg-linear-to-br from-green-500 to-green-600"
            delay={100}
          />
          <StatCard 
            icon={Target}
            title="Your Rank"
            value={animatedStats.yourRank}
            subtitle="Keep climbing!"
            gradient="bg-linear-to-br from-emerald-500 to-emerald-600"
            delay={200}
          />
          <StatCard 
            icon={Star}
            title="Your Points"
            value={animatedStats.yourPoints}
            subtitle="+150 this week"
            gradient="bg-linear-to-br from-green-600 to-emerald-700"
            delay={300}
          />
          <StatCard 
            icon={Trophy}
            title="Top Score"
            value={animatedStats.topScore}
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
                <h2 className="text-2xl font-bold text-white">Top Contributors</h2>
                <p className="text-emerald-100 text-sm">Monthly performance rankings</p>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-center">Points</div>
            <div className="col-span-2 text-center">Reports</div>
            <div className="col-span-1 text-center">Trend</div>
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

                {/* Level */}
                <div className="md:col-span-2 flex md:justify-center items-center">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                    entry.level === 'Diamond' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    entry.level === 'Platinum' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                    entry.level === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    entry.level === 'Silver' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                    entry.level === 'Bronze' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {entry.level}
                  </span>
                </div>

                {/* Points */}
                <div className="md:col-span-2 flex md:justify-center items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-gray-900 text-lg">
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Reports */}
                <div className="md:col-span-2 flex md:justify-center items-center">
                  <span className="font-semibold text-gray-700">{entry.reports} reports</span>
                </div>

                {/* Trend */}
                <div className="md:col-span-1 flex md:justify-center items-center">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(entry.trend)}
                    {entry.change > 0 && (
                      <span className={`text-xs font-medium ${
                        entry.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.change}
                      </span>
                    )}
                  </div>
                </div>
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
