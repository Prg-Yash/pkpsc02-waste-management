'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Trash2, MapPin, CheckCircle, Clock, Upload, Loader, Calendar, Weight, Search, X, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '@/lib/api-config';



const ITEMS_PER_PAGE = 5;

const CollectPage = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [verificationImage, setVerificationImage] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [reward, setReward] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filterCity, setFilterCity] = useState('');

  // Fetch waste reports from API
  useEffect(() => {
    fetchWasteReports();
    setIsVisible(true);
  }, [filterStatus, filterCity]);

  const fetchWasteReports = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCity) params.append('city', filterCity);
      
      // Use local proxy to avoid ngrok CORS and browser warning issues
      const apiUrl = `/api/waste-proxy?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch waste reports: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      // Handle both array and object with wastes property
      const wastesArray = Array.isArray(data) ? data : (data.wastes || []);
      
      if (!Array.isArray(wastesArray)) {
        console.error('Invalid data format:', data);
        throw new Error('API returned invalid data format');
      }
      
      // Transform API data to component format
      const transformedTasks = wastesArray.map(waste => {
        // Extract weight from AI analysis or fallback
        const estimatedWeight = waste.aiAnalysis?.estimatedWeightKg || waste.estimatedAmountKg || 0;
        const wasteTypeFromAI = waste.aiAnalysis?.wasteType || waste.wasteType || 'MIXED';
        
        return {
          id: waste.id,
          location: waste.locationRaw || `${waste.city || ''}, ${waste.state || ''}`.trim() || 'Location not specified',
          wasteType: wasteTypeFromAI.toUpperCase(),
          amount: `${estimatedWeight} kg`,
          status: waste.status.toLowerCase(),
          date: new Date(waste.reportedAt || waste.createdAt).toISOString().split('T')[0],
          collectorId: waste.collector?.id || null,
          routeCollectorId: waste.routeCollector?.id || null,
          reportedImage: waste.imageUrl,
          collectorImageUrl: waste.collectorImageUrl,
          reportedLocation: {
            latitude: waste.latitude,
            longitude: waste.longitude
          },
          reporter: waste.reporter,
          city: waste.city,
          state: waste.state,
          country: waste.country,
          aiAnalysis: waste.aiAnalysis,
          estimatedAmountKg: estimatedWeight,
          reportedAt: waste.reportedAt,
          collectedAt: waste.collectedAt
        };
      });
      
      console.log('Transformed tasks:', transformedTasks); // Debug log
      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error fetching waste reports:', error);
      
      // Show user-friendly error message
      alert(`Failed to load waste reports. Please check:\n1. Backend API is running\n2. Network connection is active\n3. ngrok URL is correct\n\nError: ${error.message}`);
      
      // Set empty array to show "No Waste Reports Found" UI
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRoute = async (taskId) => {
    try {
      // Get user profile to check location
      const userResponse = await fetch('/api/user/me');
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const userData = await userResponse.json();
      const userProfile = userData.user || userData;

      // Find the task to check its location
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Waste not found');
      }

      // Check if user's state and country match waste location
      if (userProfile.state && task.state && userProfile.state.toLowerCase() !== task.state.toLowerCase()) {
        alert(`❌ Cannot add to route: This waste is in ${task.state}, but your profile location is ${userProfile.state}. You can only collect waste from your registered state.`);
        return;
      }

      if (userProfile.country && task.country && userProfile.country.toLowerCase() !== task.country.toLowerCase()) {
        alert(`❌ Cannot add to route: This waste is in ${task.country}, but your profile location is ${userProfile.country}. You can only collect waste from your registered country.`);
        return;
      }

      const response = await fetch('/api/route-planner-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wasteId: taskId,
          action: 'add'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add waste to route');
      }

      // Update local state to reflect the change
      console.log('Adding to route - User ID:', user?.id);
      console.log('Backend response:', data);
      
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { 
            ...task, 
            status: 'in_progress', 
            collectorId: user?.id,
            routeCollectorId: user?.id
          };
          console.log('Updated task:', updatedTask);
          return updatedTask;
        }
        return task;
      }));

      alert('✅ Waste added to your route successfully!');
      
      // Note: We don't refresh here to preserve the local state update
      // The backend relations might not be populated immediately
    } catch (error) {
      console.error('Error adding to route:', error);
      alert(`❌ Failed to add to route: ${error.message}`);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the complete data URL for preview
        setVerificationImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        console.error('Location error:', error);
      }
    );
  };

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage) return;

    setVerificationStatus('verifying');
    setGeminiAnalysis(null);
    
    try {
      // Get current location
      if (!currentLocation) {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setCurrentLocation(location);
              resolve(location);
            },
            (error) => {
              setLocationError('Location required for verification');
              reject(error);
            }
          );
        });
      }

      // Call Gemini API for verification
      const response = await fetch('/api/verify-waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectedImage: verificationImage,
          reportedImage: selectedTask.reportedImage,
          location: currentLocation,
          reportedLocation: selectedTask.reportedLocation,
          wasteType: selectedTask.wasteType,
          amount: selectedTask.amount,
          aiAnalysis: selectedTask.aiAnalysis, // Pass AI analysis for category detection
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Verification failed';
        throw new Error(errorMsg);
      }

      // Use the data directly (new API format doesn't have parsedResult wrapper)
      const result = data.parsedResult || data;
      
      setVerificationResult(result);
      setGeminiAnalysis(result.notes || data.analysis);
      
      // Check if verification passed (both image and location)
      if (result.overallMatch || result.success) {
        // Convert base64 to blob for API submission
        const base64Response = await fetch(verificationImage);
        const blob = await base64Response.blob();
        const file = new File([blob], 'collection-proof.jpg', { type: 'image/jpeg' });

        // Submit collection to backend API via proxy
        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('collectorImage', file);
        formData.append('latitude', currentLocation.latitude.toString());
        formData.append('longitude', currentLocation.longitude.toString());

        const collectResponse = await fetch(`${API_CONFIG.BASE_URL}/api/waste/${selectedTask.id}/collect`, {
          method: 'POST',
          headers: {
            'x-user-id': user.id,
          },
          body: formData,
        });

        if (!collectResponse.ok) {
          const errorData = await collectResponse.json();
          
          // Show verification results but indicate backend submission failed
          setVerificationStatus('verified-failed');
          setVerificationResult({
            ...result,
            backendError: errorData.error || 'Failed to submit collection',
            showBackendError: true
          });
          return;
        }

        const collectData = await collectResponse.json();
        console.log('Collection submitted:', collectData);
        
        setVerificationStatus('success');
        
        // Calculate reward based on confidence and amount
        const baseReward = parseInt(selectedTask.amount) * 2;
        const confidence = result.confidence || (result.matchConfidence / 100) || 0.8;
        const earnedReward = Math.floor(baseReward * confidence);
        setReward(earnedReward);

        // Refresh the tasks list
        await fetchWasteReports();
        
        // Close modal after short delay
        setTimeout(() => {
          setSelectedTask(null);
          setVerificationImage(null);
          setVerificationResult(null);
        }, 3000);
      } else {
        // Verification failed but we have results to show
        setVerificationStatus('verified-failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failure');
      setVerificationResult({
        error: error.message || 'Verification failed. Please try again.'
      });
    }
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
      collected: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
      verified: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${color} flex items-center gap-1 transition-all duration-300`}>
        <Icon className="w-3.5 h-3.5" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-6 items-center">
              <div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  Waste Collection Tasks
                </h1>
                <p className="text-gray-600">Start collecting waste and earn rewards for verified collections</p>
              </div>
              <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-8 h-8" />
                  <div>
                    <p className="text-sm opacity-90">Available Tasks</p>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
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

        {/* Filters and Search Bar */}
        <div className={`mb-6 transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-[200px_200px_1fr_auto] gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COLLECTED">Collected</option>
              </select>

              {/* City Filter */}
              <input
                type="text"
                placeholder="Filter by city..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
              />

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Refresh Button */}
              <button 
                onClick={fetchWasteReports}
                className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-12 w-12 text-emerald-600" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Waste Reports Found</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus === 'PENDING' 
                ? 'All pending waste has been collected! Check back later for new reports.'
                : `No ${filterStatus.toLowerCase()} waste reports found.`}
            </p>
            <button 
              onClick={() => {
                setFilterStatus('PENDING');
                setFilterCity('');
                setSearchTerm('');
              }}
              className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
            >
              Reset Filters
            </button>
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
                        {task.reporter && (
                          <p className="text-sm text-gray-600 ml-11">
                            Reported by: <span className="font-semibold text-gray-800">{task.reporter.name || task.reporter.id}</span>
                          </p>
                        )}
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
                          onClick={() => handleAddToRoute(task.id)}
                          className="px-6 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          Add to Map Route
                        </button>
                      )}
                      {task.status === 'in_progress' && (() => {
                        const isMyTask = task.routeCollectorId === user?.id || task.collectorId === user?.id;
                        console.log(`Task ${task.id}: status=${task.status}, routeCollectorId=${task.routeCollectorId}, collectorId=${task.collectorId}, userId=${user?.id}, isMyTask=${isMyTask}`);
                        return isMyTask;
                      })() && (
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="px-6 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          Complete & Verify
                        </button>
                      )}
                      {task.status === 'in_progress' && !(task.routeCollectorId === user?.id || task.collectorId === user?.id) && (
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
                
                {/* Reported Waste Information */}
                <div className="mb-6 bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Reported Waste - What You Need to Collect
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Reported Image */}
                    <div>
                      <p className="text-xs font-semibold text-purple-800 mb-2">📸 Reported Image:</p>
                      {selectedTask.reportedImage ? (
                        <img 
                          src={selectedTask.reportedImage} 
                          alt="Reported waste" 
                          className="w-full rounded-lg shadow-md border-2 border-purple-300 object-cover h-48"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-purple-300">
                          <p className="text-xs text-gray-500">No image available</p>
                        </div>
                      )}
                    </div>

                    {/* Reported Details */}
                    <div className="space-y-3">
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-2">📍 Reported Location:</p>
                        <p className="text-xs text-purple-900 font-mono bg-purple-100 p-2 rounded">
                          Lat: {selectedTask.reportedLocation.latitude.toFixed(6)}<br/>
                          Lng: {selectedTask.reportedLocation.longitude.toFixed(6)}
                        </p>
                        {selectedTask.location && (
                          <p className="text-xs text-purple-700 mt-2">
                            {selectedTask.location}
                          </p>
                        )}
                      </div>

                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-2">🗑️ Waste Details:</p>
                        <div className="text-xs text-purple-900 space-y-1">
                          <p><strong>Type:</strong> {selectedTask.wasteType}</p>
                          <p><strong>Amount:</strong> {selectedTask.amount}</p>
                          {selectedTask.aiAnalysis?.notes && (
                            <p className="text-xs text-purple-700 mt-2 italic">
                              "{selectedTask.aiAnalysis.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Location Verification</p>
                      <p className="text-xs text-blue-700 mb-3">
                        Your current location will be compared with the reported location to ensure accuracy.
                      </p>
                      {currentLocation ? (
                        <div className="text-xs text-blue-600 bg-white rounded p-2">
                          <p><strong>Current:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</p>
                          <p><strong>Reported:</strong> {selectedTask.reportedLocation.latitude.toFixed(6)}, {selectedTask.reportedLocation.longitude.toFixed(6)}</p>
                        </div>
                      ) : (
                        <button
                          onClick={getCurrentLocation}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Get Current Location
                        </button>
                      )}
                      {locationError && (
                        <p className="text-xs text-red-600 mt-2">{locationError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Upload className="w-5 h-5 text-gray-600" />
                    Upload Your Collection Image (will be compared with reported image above)
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
                  className="w-full py-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {verificationStatus === 'verifying' ? (
                    <>
                      <Loader className="animate-spin h-5 w-5" />
                      Verifying...
                    </>
                  ) : 'Verify Collection'}
                </button>

                {(verificationStatus === 'success' || verificationStatus === 'verified-failed') && verificationResult && (
                  <div className="mt-6 space-y-4">
                    <div className={`p-6 rounded-xl border ${
                      verificationStatus === 'success' 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className={`w-6 h-6 ${
                          verificationStatus === 'success' ? 'text-emerald-600' : 'text-orange-600'
                        }`} />
                        <h4 className={`font-bold ${
                          verificationStatus === 'success' ? 'text-emerald-800' : 'text-orange-800'
                        }`}>AI Verification Results</h4>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Same Waste:</span>
                          <span className={`font-bold ${verificationResult.sameWaste ? 'text-emerald-600' : 'text-red-600'}`}>
                            {verificationResult.sameWaste ? 'Yes ✓' : 'No ✗'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Match Confidence:</span>
                          <span className="font-bold text-emerald-600">{verificationResult.matchConfidence}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Category:</span>
                          <span className="font-semibold text-blue-600 capitalize">{verificationResult.wasteCategory}</span>
                        </div>
                        {verificationResult.wasteCategory === 'small' && verificationResult.segregationMatch !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Segregation Match:</span>
                            <span className={`font-bold ${verificationResult.segregationMatch ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {verificationResult.segregationMatch ? 'Yes ✓' : 'No ✗'}
                            </span>
                          </div>
                        )}
                        {verificationResult.wasteCategory === 'large' && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">Bin Shape Match:</span>
                              <span className={`font-bold ${verificationResult.binShapeMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                                {verificationResult.binShapeMatch ? 'Yes ✓' : 'No ✗'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">Overflow Match:</span>
                              <span className={`font-bold ${verificationResult.overflowMatch ? 'text-emerald-600' : 'text-orange-600'}`}>
                                {verificationResult.overflowMatch ? 'Yes ✓' : 'Changed'}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Location Match:</span>
                          <span className={`font-bold ${verificationResult.locationMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                            {verificationResult.locationMatch ? `Yes ✓` : 'No ✗'}
                            {verificationResult.locationDistance !== null && (
                              <span className="text-xs ml-2">({(verificationResult.locationDistance * 1000).toFixed(0)}m away)</span>
                            )}
                          </span>
                        </div>
                        {verificationResult.notes && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-1">AI Notes:</p>
                            <p className="text-xs text-blue-700">{verificationResult.notes}</p>
                          </div>
                        )}
                        {verificationResult.validation && !verificationResult.validation.isValid && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-semibold text-red-800 mb-1">❌ Verification Failed:</p>
                            <p className="text-xs text-red-700 mb-2">{verificationResult.validation.reason}</p>
                            
                            {/* Show detailed checks */}
                            {verificationResult.validation.imageCheck && (
                              <div className="mt-2 text-xs">
                                <span className={verificationResult.validation.imageCheck.isValid ? 'text-emerald-700' : 'text-red-700'}>
                                  {verificationResult.validation.imageCheck.isValid ? '✓' : '✗'} Image: {verificationResult.validation.imageCheck.reason}
                                </span>
                              </div>
                            )}
                            {verificationResult.validation.locationCheck && (
                              <div className="mt-1 text-xs">
                                <span className={verificationResult.validation.locationCheck.isValid ? 'text-emerald-700' : 'text-red-700'}>
                                  {verificationResult.validation.locationCheck.isValid ? '✓' : '✗'} Location: {verificationResult.validation.locationCheck.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {reward && verificationResult.overallMatch && (
                      <div className="p-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-between shadow-lg">
                        <span className="font-semibold">🎉 Reward Earned:</span>
                        <span className="text-2xl font-bold flex items-center gap-2">
                          <Award className="w-6 h-6" />
                          {reward} Tokens
                        </span>
                      </div>
                    )}

                    {verificationResult.showBackendError && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-amber-800 mb-2">⚠️ Collection Not Submitted</p>
                            <p className="text-sm text-amber-700 mb-3">
                              Your waste verification was successful, but the collection could not be saved to the database:
                            </p>
                            <div className="bg-amber-100 border border-amber-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-mono text-amber-900">{verificationResult.backendError}</p>
                            </div>
                            <p className="text-xs text-amber-700">
                              <strong>What this means:</strong> The AI verified your collection images match, but you need collector mode enabled in your account to submit collections.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!verificationResult.overallMatch && verificationStatus === 'verified-failed' && !verificationResult.showBackendError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-semibold text-red-800 mb-3">
                          ❌ Collection Cannot Be Verified
                        </p>
                        
                        {/* Show main reason */}
                        <div className="mb-3 p-3 bg-white rounded-lg border border-red-200">
                          <p className="text-sm font-semibold text-red-700">
                            {verificationResult.validation?.reason || 'Verification requirements not met'}
                          </p>
                        </div>

                        {/* Show what needs to be fixed */}
                        <p className="text-xs font-semibold text-red-800 mb-2">Required Actions:</p>
                        <ul className="text-xs text-red-700 ml-4 list-disc space-y-1">
                          {!verificationResult.sameWaste && (
                            <li>Upload image of the exact same waste shown in the report</li>
                          )}
                          {verificationResult.sameWaste && verificationResult.matchConfidence < 60 && (
                            <li>Take a clearer photo with better lighting (current confidence: {verificationResult.matchConfidence}%)</li>
                          )}
                          {!verificationResult.locationMatch && verificationResult.locationDistance && (
                            <li>Go to the reported location (you are {(verificationResult.locationDistance * 1000).toFixed(0)}m away, maximum 10000m allowed)</li>
                          )}
                          {!verificationResult.locationMatch && !verificationResult.locationDistance && (
                            <li>Enable location services and ensure GPS is accurate</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {verificationStatus === 'failure' && (
                  <div className="mt-4 p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-sm mb-2">❌ Verification Failed</p>
                    <p className="text-xs">
                      {verificationResult?.error || 'Unable to verify the collection. Please ensure you have a clear image and proper location access, then try again.'}
                    </p>
                  </div>
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