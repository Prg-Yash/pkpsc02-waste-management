'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { User, Shield, Bell, Save, Loader, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { API_CONFIG } from '@/lib/api-config';

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    enableCollector: false,
    reportPoints: 0,
    collectionPoints: 0,
  });

  useEffect(() => {
    if (clerkUser?.id) {
      fetchUserData();
    }
  }, [clerkUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/me`, {
        headers: {
          'x-user-id': clerkUser.id,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();
      setUserData({
        name: data.user.name || clerkUser.fullName || '',
        email: data.user.email || clerkUser.primaryEmailAddress?.emailAddress || '',
        phone: data.user.phone || '',
        enableCollector: data.user.enableCollector || false,
        reportPoints: data.user.reportPoints || 0,
        collectionPoints: data.user.collectionPoints || 0,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': clerkUser.id,
        },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          enableCollector: userData.enableCollector,
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      const data = await response.json();
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Update local state with response
      setUserData(prev => ({
        ...prev,
        name: data.user.name || prev.name,
        phone: data.user.phone || prev.phone,
        enableCollector: data.user.enableCollector,
      }));

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and collector settings</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`font-medium ${
              message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Profile Settings</h2>
                  <p className="text-sm text-gray-600">Update your personal information</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
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
                <input
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Your Stats</h2>
                  <p className="text-sm text-gray-600">View your impact on the community</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Report Points</p>
                <p className="text-3xl font-bold text-blue-800">{userData.reportPoints}</p>
                <p className="text-xs text-blue-600 mt-1">Earned from reporting waste</p>
              </div>
              <div className="bg-linear-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-700 mb-1">Collection Points</p>
                <p className="text-3xl font-bold text-emerald-800">{userData.collectionPoints}</p>
                <p className="text-xs text-emerald-600 mt-1">Earned from collecting waste</p>
              </div>
              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-1">Total Points</p>
                <p className="text-3xl font-bold text-purple-800">
                  {userData.reportPoints + userData.collectionPoints}
                </p>
                <p className="text-xs text-purple-600 mt-1">Combined impact score</p>
              </div>
            </div>
          </div>

          {/* Collector Mode */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 lg:col-span-2">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Collector Mode</h2>
                  <p className="text-sm text-gray-600">Enable to start collecting waste from your area</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleInputChange('enableCollector', !userData.enableCollector)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                        userData.enableCollector ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          userData.enableCollector ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-gray-600">
                      {userData.enableCollector ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 lg:col-span-2">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Notification Preferences</h2>
                  <p className="text-sm text-gray-600">Manage how you receive notifications</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-1">Coming Soon</p>
                    <p className="text-xs text-blue-700">
                      Notification preferences will be available in a future update. You'll be able to customize email, push, and in-app notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
