'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { User, Shield, Bell, Save, Loader, CheckCircle, AlertCircle, Trash2, TrendingUp, Award, MapPin, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    enableCollector: false,
    reporterPoints: 0,
    collectorPoints: 0,
    globalPoints: 0,
    reportedWastes: [],
    collectedWastes: [],
    createdAt: '',
  });

  useEffect(() => {
    if (clerkUser?.id) {
      fetchUserData();
      fetchNotifications();
    }
  }, [clerkUser]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('https://jeanene-unexposed-ingrid.ngrok-free.dev/api/notifications', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      console.log('=== NOTIFICATIONS DATA ===');
      console.log(data);
      console.log('========================');
      
      // Store notifications in state
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`https://jeanene-unexposed-ingrid.ngrok-free.dev/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'WASTE_COLLECTED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'WASTE_REPORTED':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'POINTS_EARNED':
        return <Award className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'WASTE_COLLECTED':
        return 'from-emerald-50 to-emerald-100 border-emerald-200';
      case 'WASTE_REPORTED':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'POINTS_EARNED':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Set default data from Clerk user immediately
      setUserData(prev => ({
        ...prev,
        name: clerkUser.fullName || '',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
      }));

      const response = await fetch('/api/user/me', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user data');
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      // Console log complete user data
      console.log('=== COMPLETE USER DATA ===');
      console.log('Clerk User:', clerkUser);
      console.log('Backend User Data:', data.user);
      console.log('========================');
      
      setUserData({
        name: data.user.name || clerkUser.fullName || '',
        email: data.user.email || clerkUser.primaryEmailAddress?.emailAddress || '',
        phone: data.user.phone || '',
        city: data.user.city || '',
        state: data.user.state || '',
        country: data.user.country || '',
        enableCollector: data.user.enableCollector || false,
        reporterPoints: data.user.reporterPoints || 0,
        collectorPoints: data.user.collectorPoints || 0,
        globalPoints: data.user.globalPoints || 0,
        reportedWastes: data.user.reportedWastes || [],
        collectedWastes: data.user.collectedWastes || [],
        createdAt: data.user.createdAt || '',
      });
      
      // Clear any previous error messages
      setMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Error fetching user data:', error);
      const errorMessage = error.message === 'Failed to fetch' 
        ? 'Cannot connect to backend server. Please ensure the API is running.'
        : `Failed to load user data: ${error.message}`;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          city: userData.city,
          state: userData.state,
          country: userData.country,
          enableCollector: userData.enableCollector,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update settings');
        }
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message || 'Settings saved successfully!' });
      
      // Update local state with response
      if (data.user) {
        setUserData(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          phone: data.user.phone || prev.phone,
          city: data.user.city || prev.city,
          state: data.user.state || prev.state,
          country: data.user.country || prev.country,
          enableCollector: data.user.enableCollector !== undefined ? data.user.enableCollector : prev.enableCollector,
        }));
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Cannot connect to backend server. Please ensure the API is running.'
        : `Failed to save settings: ${error.message}`;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const sendOtp = async () => {
    if (!userData.phone || userData.phone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }

    try {
      setSendingOtp(true);
      // Simulate OTP sending - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowOtpModal(true);
      setMessage({ type: 'success', text: 'OTP sent to your phone number' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send OTP' });
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter complete OTP' });
      return;
    }

    try {
      setVerifyingOtp(true);
      // Simulate OTP verification - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept any 6-digit OTP
      setPhoneVerified(true);
      setShowOtpModal(false);
      setMessage({ type: 'success', text: 'Phone number verified successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid OTP. Please try again.' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="relative bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{userData.name || 'Your Profile'}</h1>
                <div className="flex flex-wrap items-center gap-3 text-white/90">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {userData.city && userData.state ? `${userData.city}, ${userData.state}` : 'Set your location'}
                    </span>
                  </div>
                  <span className="text-white/50">•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {userData.createdAt ? `Joined ${new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
              {userData.enableCollector && (
                <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold text-white">Active Collector</span>
                </div>
              )}
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-300" />
                  <span className="text-xs text-white/80 font-medium">Global</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white">{userData.globalPoints}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-300" />
                  <span className="text-xs text-white/80 font-medium">Reporter</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white">{userData.reporterPoints}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-emerald-300" />
                  <span className="text-xs text-white/80 font-medium">Collector</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white">{userData.collectorPoints}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-xs text-white/80 font-medium">Collected</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white">{userData.collectedWastes?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 hover:shadow-xl hover:border-blue-400 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-800">{userData.reportedWastes?.length || 0}</p>
                <p className="text-xs font-medium text-gray-500">Total Reported</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
              <span className="text-gray-500">Points Earned</span>
              <span className="font-bold text-blue-600">+{userData.reporterPoints}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 hover:shadow-xl hover:border-emerald-400 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-800">{userData.collectedWastes?.length || 0}</p>
                <p className="text-xs font-medium text-gray-500">Total Collected</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
              <span className="text-gray-500">Points Earned</span>
              <span className="font-bold text-emerald-600">+{userData.collectorPoints}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 hover:shadow-xl hover:border-orange-400 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-800">
                  {userData.reportedWastes?.filter(w => w.status === 'PENDING').length || 0}
                </p>
                <p className="text-xs font-medium text-gray-500">Pending</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
              <span className="text-gray-500">In Progress</span>
              <span className="font-bold text-yellow-600">{userData.reportedWastes?.filter(w => w.status === 'IN_PROGRESS').length || 0}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 hover:shadow-xl hover:border-purple-400 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-800">{userData.reportedWastes?.filter(w => w.status === 'COLLECTED').length || 0}</p>
                <p className="text-xs font-medium text-gray-500">Completed</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
              <span className="text-gray-500">Success Rate</span>
              <span className="font-bold text-purple-600">
                {userData.reportedWastes?.length > 0 
                  ? Math.round((userData.reportedWastes.filter(w => w.status === 'COLLECTED').length / userData.reportedWastes.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Waste Activity Details */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Reported Waste Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-5 border-b border-gray-200 bg-linear-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Reported Waste</h2>
                  <p className="text-sm text-gray-600">{userData.reportedWastes?.length || 0} reports</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {userData.reportedWastes?.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {userData.reportedWastes.map((waste, index) => (
                    <div key={waste.id || index} className="bg-linear-to-br from-white to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden">
                      <div className="flex gap-3 p-3">
                        {/* Waste Image */}
                        {waste.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img 
                              src={waste.imageUrl} 
                              alt={waste.wasteType}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                        {/* Waste Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-800 truncate">{waste.wasteType || 'Mixed Waste'}</h3>
                              <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {waste.address || `${waste.city || 'Unknown'}, ${waste.state || ''}`}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                              waste.status === 'COLLECTED' ? 'bg-emerald-500 text-white' :
                              waste.status === 'IN_PROGRESS' ? 'bg-yellow-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {waste.status}
                            </span>
                          </div>
                          {/* Description */}
                          {waste.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {waste.description}
                            </p>
                          )}
                          {/* Additional Info */}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {waste.quantity && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold">Qty:</span> {waste.quantity}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {waste.reportedAt ? new Date(waste.reportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </span>
                            {waste.reporterPoints && (
                              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                                <Award className="w-3 h-3" />
                                +{waste.reporterPoints} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No waste reported yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start reporting waste to help your community</p>
                </div>
              )}
            </div>
          </div>

          {/* Collected Waste Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-5 border-b border-gray-200 bg-linear-to-r from-emerald-50 to-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Collected Waste</h2>
                  <p className="text-sm text-gray-600">{userData.collectedWastes?.length || 0} collections</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {userData.collectedWastes?.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {userData.collectedWastes.map((waste, index) => (
                    <div key={waste.id || index} className="bg-linear-to-br from-white to-emerald-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all overflow-hidden">
                      <div className="flex gap-3 p-3">
                        {/* Waste Image */}
                        {waste.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img 
                              src={waste.imageUrl} 
                              alt={waste.wasteType}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                        {/* Waste Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-800 truncate">{waste.wasteType || 'Mixed Waste'}</h3>
                              <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {waste.address || `${waste.city || 'Unknown'}, ${waste.state || ''}`}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap bg-emerald-500 text-white shadow-md">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              COLLECTED
                            </span>
                          </div>
                          {/* Description */}
                          {waste.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {waste.description}
                            </p>
                          )}
                          {/* Additional Info */}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {waste.quantity && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold">Qty:</span> {waste.quantity}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {waste.collectedAt ? new Date(waste.collectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </span>
                            {waste.collectorPoints && (
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <Award className="w-3 h-3" />
                                +{waste.collectorPoints} pts
                              </span>
                            )}
                          </div>
                          {/* Verification Info */}
                          {waste.verifiedAt && (
                            <div className="mt-2 pt-2 border-t border-emerald-200">
                              <p className="text-xs text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified on {new Date(waste.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No waste collected yet</p>
                  <p className="text-xs text-gray-400 mt-1">Enable collector mode to start earning</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 shadow-lg ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-2 border-emerald-300' 
              : 'bg-red-50 border-2 border-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <p className={`font-semibold ${
              message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-5 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Profile Settings</h2>
                  <p className="text-sm text-gray-600">Manage your information</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Email (managed by Clerk)"
                />
                <p className="text-xs text-gray-500 mt-1">Email is managed through your Clerk account</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    placeholder="+91 98765 43210"
                    disabled={phoneVerified}
                  />
                  {!phoneVerified ? (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={sendingOtp || !userData.phone}
                      className="px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                    >
                      {sendingOtp ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>
                {phoneVerified && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Phone number has been verified
                  </p>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Location Information</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your state"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your country"
                      required
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Required:</strong> Please update your location before reporting or collecting waste.
                  </p>
                </div>
              </div>
            </div>
        </div>

       
        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200 bg-linear-to-r from-amber-50 to-yellow-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                  <p className="text-sm text-gray-600">{notifications.length} total</p>
                </div>
              </div>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {notifications.filter(n => !n.isRead).length} new
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            {loadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-amber-600" />
                <span className="ml-2 text-sm text-gray-600">Loading notifications...</span>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    className={`bg-linear-to-br ${getNotificationColor(notification.type)} rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                      !notification.isRead ? 'border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-800">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : 'N/A'}
                          </span>
                          {notification.isRead && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">You'll be notified about waste reports and collections</p>
              </div>
            )}
          </div>
        </div>

        {/* Collector Mode */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200 bg-linear-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Collector Mode</h2>
                <p className="text-sm text-gray-600">Start collecting and earning rewards</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-emerald-800">Become a Waste Collector</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      userData.enableCollector 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {userData.enableCollector ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-700 mb-4">
                    {userData.enableCollector 
                      ? 'You are currently collecting waste reports. You can verify and collect reported waste to earn rewards!'
                      : 'Enable collector mode to start collecting waste from your area and earn collection points. You can help clean up your community while earning rewards!'
                    }
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Access to waste collection tasks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>AI-powered verification system</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Earn collection points and rewards</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Route planning and navigation</span>
                    </div>
                  </div>
                </div>
              </div>
              {!userData.enableCollector && (
                <div className="mt-6 pt-6 border-t border-emerald-200">
                  <button
                    onClick={() => handleInputChange('enableCollector', true)}
                    className="w-full px-6 py-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Become a Collector Now
                  </button>
                  <p className="text-xs text-center text-emerald-600 mt-3 font-medium">
                    ⚠️ Note: Once enabled, collector mode cannot be disabled
                  </p>
                </div>
              )}
              {userData.enableCollector && (
                <div className="mt-6 pt-6 border-t border-emerald-200">
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">You are an active collector!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Phone Number</h2>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to <span className="font-semibold">{userData.phone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                  />
                ))}
              </div>

              <button
                onClick={verifyOtp}
                disabled={verifyingOtp || otp.join('').length !== 6}
                className="w-full py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 mb-4"
              >
                {verifyingOtp ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify OTP
                  </>
                )}
              </button>

              <button
                onClick={sendOtp}
                disabled={sendingOtp}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {sendingOtp ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="sticky bottom-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-linear-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
