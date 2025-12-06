"use client";

'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, MapPin, CheckCircle, Clock, Upload, Loader, Calendar, Weight, Search, X, Award, TrendingUp } from 'lucide-react';

// Mock data for demonstration
const mockTasks = [
  { id: 1, location: 'Park Avenue, Zone A', wasteType: 'Plastic Bottles', amount: '15 kg', status: 'pending', date: '2024-12-06', collectorId: null },
  { id: 2, location: 'Main Street Market', wasteType: 'Organic Waste', amount: '25 kg', status: 'in_progress', date: '2024-12-06', collectorId: 1 },
  { id: 3, location: 'Green Plaza', wasteType: 'Paper & Cardboard', amount: '12 kg', status: 'pending', date: '2024-12-06', collectorId: null },
  { id: 4, location: 'River Road Residential', wasteType: 'Glass Containers', amount: '8 kg', status: 'verified', date: '2024-12-05', collectorId: 1 },
  { id: 5, location: 'Tech Hub District', wasteType: 'E-Waste', amount: '5 kg', status: 'pending', date: '2024-12-06', collectorId: null },
  { id: 6, location: 'Market Square', wasteType: 'Metal Cans', amount: '18 kg', status: 'in_progress', date: '2024-12-06', collectorId: 2 },
  { id: 7, location: 'Central Park', wasteType: 'Mixed Recyclables', amount: '30 kg', status: 'pending', date: '2024-12-06', collectorId: null },
];

const ITEMS_PER_PAGE = 5;

const CollectPage = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [loading, setLoading] = useState(false);
  const [hoveredWasteType, setHoveredWasteType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState({ id: 1, email: 'user@example.com', name: 'John Doe' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [verificationImage, setVerificationImage] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [reward, setReward] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus, collectorId: user.id } : task
    ));
    
    console.log('Task status updated successfully');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage) return;

    setVerificationStatus('verifying');
    
    setTimeout(() => {
      const mockResult = {
        wasteTypeMatch: true,
        quantityMatch: true,
        confidence: 0.92
      };
      
      setVerificationResult(mockResult);
      setVerificationStatus('success');
      
      if (mockResult.wasteTypeMatch && mockResult.quantityMatch && mockResult.confidence > 0.7) {
        handleStatusChange(selectedTask.id, 'verified');
        const earnedReward = Math.floor(Math.random() * 50) + 10;
        setReward(earnedReward);
      }
    }, 2000);
  };

  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
      in_progress: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Trash2 },
      completed: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
      verified: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
    };

    const { color, icon: Icon } = statusConfig[status];

    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${color} flex items-center gap-1 transition-all duration-300`}>
        <Icon className="w-3.5 h-3.5" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  Waste Collection Tasks
                </h1>
                <p className="text-gray-600">Start collecting waste and earn rewards for verified collections</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8" />
                  <div>
                    <p className="text-sm opacity-90">Total Rewards</p>
                    <p className="text-2xl font-bold">{reward || 0} Tokens</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`mb-6 transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-12 w-12 text-emerald-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-6">
              {paginatedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-600" />
                          </div>
                          {task.location}
                        </h2>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                        <Trash2 className="w-5 h-5 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium mb-1">Waste Type</p>
                          <p 
                            className="text-sm font-semibold text-gray-800 truncate cursor-pointer"
                            onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                            onMouseLeave={() => setHoveredWasteType(null)}
                          >
                            {task.wasteType}
                          </p>
                        </div>
                        {hoveredWasteType === task.wasteType && (
                          <div className="absolute left-0 top-full mt-2 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-xl z-10 whitespace-nowrap">
                            {task.wasteType}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Weight className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Amount</p>
                          <p className="text-sm font-semibold text-gray-800">{task.amount}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Date</p>
                          <p className="text-sm font-semibold text-gray-800">{task.date}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      {task.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          Start Collection
                        </button>
                      )}
                      {task.status === 'in_progress' && task.collectorId === user?.id && (
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          Complete & Verify
                        </button>
                      )}
                      {task.status === 'in_progress' && task.collectorId !== user?.id && (
                        <span className="px-6 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          In progress by another collector
                        </span>
                      )}
                      {task.status === 'verified' && (
                        <span className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Reward Earned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Verification Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Verify Collection</h3>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                
                <p className="mb-6 text-sm text-gray-600 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  Upload a photo of the collected waste to verify and earn your reward.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Upload Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors duration-300 bg-gray-50">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-emerald-600 font-semibold hover:text-emerald-700">Upload a file</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>

                {verificationImage && (
                  <div className="mb-6">
                    <img 
                      src={verificationImage} 
                      alt="Verification" 
                      className="rounded-xl w-full shadow-lg border border-gray-200" 
                    />
                  </div>
                )}

                <button
                  onClick={handleVerify}
                  disabled={!verificationImage || verificationStatus === 'verifying'}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {verificationStatus === 'verifying' ? (
                    <>
                      <Loader className="animate-spin h-5 w-5" />
                      Verifying...
                    </>
                  ) : 'Verify Collection'}
                </button>

                {verificationStatus === 'success' && verificationResult && (
                  <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <h4 className="font-bold text-emerald-800">Verification Results</h4>
                    </div>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Waste Type Match:</span>
                        <span className={`font-bold ${verificationResult.wasteTypeMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                          {verificationResult.wasteTypeMatch ? 'Yes ✓' : 'No ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Quantity Match:</span>
                        <span className={`font-bold ${verificationResult.quantityMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                          {verificationResult.quantityMatch ? 'Yes ✓' : 'No ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Confidence:</span>
                        <span className="font-bold text-emerald-600">{(verificationResult.confidence * 100).toFixed(2)}%</span>
                      </div>
                      {reward && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg flex items-center justify-between">
                          <span className="font-semibold">Reward Earned:</span>
                          <span className="text-2xl font-bold flex items-center gap-2">
                            <Award className="w-6 h-6" />
                            {reward} Tokens
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {verificationStatus === 'failure' && (
                  <p className="mt-4 text-red-600 text-center text-sm font-medium bg-red-50 border border-red-200 rounded-lg p-3">
                    Verification failed. Please try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectPage;