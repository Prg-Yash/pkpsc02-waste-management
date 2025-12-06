'use client';

import { useUser, UserButton } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Trash2, Recycle, TrendingUp, MapPin, AlertCircle, CheckCircle, Clock, Users, Leaf, Package, Droplets, Zap } from 'lucide-react';

const EcoFlowDashboard = () => {
  const [animatedStats, setAnimatedStats] = useState({
    totalWaste: 0,
    recycled: 0,
    pending: 0,
    efficiency: 0
  });

  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        totalWaste: 12847,
        recycled: 8956,
        pending: 234,
        efficiency: 89.7
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Waste collection data over time
  const collectionData = [
    { day: 'Mon', collected: 1850, recycled: 1200, organic: 450, plastic: 200 },
    { day: 'Tue', collected: 2100, recycled: 1450, organic: 500, plastic: 150 },
    { day: 'Wed', collected: 1950, recycled: 1300, organic: 480, plastic: 170 },
    { day: 'Thu', collected: 2250, recycled: 1600, organic: 520, plastic: 130 },
    { day: 'Fri', collected: 2400, recycled: 1750, organic: 550, plastic: 100 },
    { day: 'Sat', collected: 1800, recycled: 1100, organic: 500, plastic: 200 },
    { day: 'Sun', collected: 1650, recycled: 950, organic: 480, plastic: 220 }
  ];

  // Waste segregation distribution
  const segregationData = [
    { name: 'Organic', value: 3480, color: '#10b981' },
    { name: 'Plastic', value: 1170, color: '#3b82f6' },
    { name: 'Paper', value: 2340, color: '#f59e0b' },
    { name: 'Metal', value: 980, color: '#8b5cf6' },
    { name: 'Glass', value: 1230, color: '#06b6d4' },
    { name: 'E-Waste', value: 450, color: '#ef4444' }
  ];

  // Bin capacity monitoring
  const binStatus = [
    { id: 'BIN-001', location: 'Park Avenue', capacity: 85, status: 'critical' },
    { id: 'BIN-002', location: 'Main Street', capacity: 45, status: 'normal' },
    { id: 'BIN-003', location: 'River Road', capacity: 72, status: 'warning' },
    { id: 'BIN-004', location: 'Green Plaza', capacity: 28, status: 'normal' },
    { id: 'BIN-005', location: 'Tech Hub', capacity: 91, status: 'critical' },
    { id: 'BIN-006', location: 'Market Square', capacity: 56, status: 'warning' }
  ];

  // Recycling efficiency trend
  const efficiencyData = [
    { month: 'Jan', efficiency: 82.5, target: 85 },
    { month: 'Feb', efficiency: 84.2, target: 85 },
    { month: 'Mar', efficiency: 86.8, target: 85 },
    { month: 'Apr', efficiency: 85.5, target: 85 },
    { month: 'May', efficiency: 88.3, target: 85 },
    { month: 'Jun', efficiency: 89.7, target: 85 }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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

        {/* Stats Cards - 4 Column Grid */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={Trash2}
            title="Total Waste"
            value={animatedStats.totalWaste}
            subtitle="+12% from last week"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={100}
          />
          <StatCard 
            icon={Recycle}
            title="Recycled"
            value={animatedStats.recycled}
            subtitle="+18% from last week"
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            delay={200}
          />
          <StatCard 
            icon={Clock}
            title="Pending"
            value={animatedStats.pending}
            subtitle="6 bins need attention"
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={300}
          />
          <StatCard 
            icon={TrendingUp}
            title="Efficiency"
            value={`${animatedStats.efficiency}%`}
            subtitle="+4.2% this month"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={400}
          />
        </div>

        {/* Weekly Collection Trend - 8 Columns */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart className="w-5 h-5 text-emerald-600" />
              </div>
              Weekly Collection Trend
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
              Waste Distribution
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

        {/* Efficiency Trend - 8 Columns */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              Recycling Efficiency Trend
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

        {/* Bin Status Monitoring - Full Width */}
        <div className="col-span-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="grid gap-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              Real-time Bin Capacity Monitoring
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {binStatus.map((bin, index) => (
                <div 
                  key={bin.id} 
                  className="border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="grid gap-3">
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <span className="font-bold text-gray-800 text-lg">{bin.id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(bin.status)}`}>
                        {bin.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {bin.location}
                    </p>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-600">Capacity</span>
                        <span className="font-bold text-gray-900 text-right">{bin.capacity}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            bin.capacity > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                            bin.capacity > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 
                            'bg-gradient-to-r from-emerald-500 to-teal-600'
                          }`}
                          style={{ width: `${bin.capacity}%` }}
                        ></div>
                      </div>
                    </div>
                    {bin.capacity > 70 && (
                      <div className="flex items-center text-xs text-orange-600 font-medium bg-orange-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Collection needed soon
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Stats - 3 Column Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="grid gap-3">
              <Users className="w-10 h-10 opacity-80" />
              <div className="grid gap-1">
                <p className="text-sm opacity-90 font-medium">Active Users</p>
                <p className="text-4xl font-bold">2,847</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="grid gap-3">
              <CheckCircle className="w-10 h-10 opacity-80" />
              <div className="grid gap-1">
                <p className="text-sm opacity-90 font-medium">Completed Collections</p>
                <p className="text-4xl font-bold">1,234</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="grid gap-3">
              <Leaf className="w-10 h-10 opacity-80" />
              <div className="grid gap-1">
                <p className="text-sm opacity-90 font-medium">CO₂ Saved</p>
                <p className="text-4xl font-bold">847 kg</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EcoFlowDashboard;