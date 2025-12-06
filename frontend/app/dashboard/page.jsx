'use client';

import { useUser, UserButton } from '@clerk/nextjs';

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Waste Management Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Welcome, <span className="font-semibold">{user?.firstName || user?.username}</span>
            </span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Hello, {user?.firstName || user?.username}! 👋
            </h2>
            <p className="text-gray-600">Welcome to your dashboard</p>
          </div>

          {/* User Info Card */}
          <div className="max-w-2xl mx-auto bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Full Name:</span>
                <span className="text-gray-900">{user?.fullName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Username:</span>
                <span className="text-gray-900">{user?.username || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900">{user?.primaryEmailAddress?.emailAddress || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">User ID:</span>
                <span className="text-gray-900 text-sm font-mono">{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Reports</h4>
                <p className="text-3xl font-bold text-indigo-600">0</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Completed</h4>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Pending</h4>
                <p className="text-3xl font-bold text-yellow-600">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
