'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  MapPin, Navigation, Trash2, CheckCircle, Clock, 
  ArrowUp, ArrowDown, Route, Loader2, Target, TrendingUp
} from 'lucide-react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { API_CONFIG } from '@/lib/api-config';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 19.0760, // Mumbai coordinates as default
  lng: 72.8777,
};

export default function RouteMapPage() {
  const { user } = useUser();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState(null);
  const [totalDistance, setTotalDistance] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingUserLocation, setLoadingUserLocation] = useState(false);
  
  // Verification modal states
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [verificationImage, setVerificationImage] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [reward, setReward] = useState(0);
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);

  // Get user's current location
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLoadingUserLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setCenter(location);
          setLoadingUserLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoadingUserLocation(false);
        }
      );
    } else {
      setLoadingUserLocation(false);
    }
  };

  // Fetch pending waste collection locations
  useEffect(() => {
    fetchCollectionLocations();
  }, []);

  const fetchCollectionLocations = async () => {
    try {
      setLoading(true);
      
      // Fetch only the user's route (in-progress collections assigned to them)
      const response = await fetch('/api/route-planner-proxy', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      const wastesArray = data.route || [];
      
      // Transform to location format with priority - only show IN_PROGRESS waste
      const transformedLocations = wastesArray
        .filter(waste => waste.latitude && waste.longitude && waste.status === 'IN_PROGRESS')
        .map((waste, index) => ({
          id: waste.id,
          position: {
            lat: waste.latitude,
            lng: waste.longitude,
          },
          address: waste.locationRaw || `${waste.city || ''}, ${waste.state || ''}`.trim(),
          wasteType: waste.aiAnalysis?.wasteType || waste.wasteType || 'MIXED',
          amount: waste.aiAnalysis?.estimatedWeightKg || 0,
          priority: index + 1,
          city: waste.city,
          imageUrl: waste.imageUrl,
          reportedAt: waste.reportedAt,
          reportedLocation: {
            latitude: waste.latitude,
            longitude: waste.longitude,
          },
          aiAnalysis: waste.aiAnalysis,
          status: waste.status?.toLowerCase() || 'in_progress',
        }));

      setLocations(transformedLocations);

      // Set center to first location or user's current position
      if (transformedLocations.length > 0) {
        setCenter(transformedLocations[0].position);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      alert('Failed to load collection locations');
    } finally {
      setLoading(false);
    }
  };

  // Calculate route based on priority order
  const calculateRoute = useCallback(() => {
    if (locations.length === 0) return;
    
    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) {
      console.log('Google Maps API not yet loaded, retrying...');
      setTimeout(calculateRoute, 500);
      return;
    }

    setIsCalculatingRoute(true);
    
    const sortedLocations = [...locations].sort((a, b) => a.priority - b.priority);
    
    // Use user location as origin if available, otherwise first collection point
    const origin = userLocation || sortedLocations[0].position;
    const destination = sortedLocations[sortedLocations.length - 1].position;
    
    // If using user location as origin, include all collection points as waypoints
    // Otherwise, include all except first and last
    const waypoints = userLocation 
      ? sortedLocations.slice(0, -1).map(loc => ({
          location: loc.position,
          stopover: true,
        }))
      : sortedLocations.slice(1, -1).map(loc => ({
          location: loc.position,
          stopover: true,
        }));

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: false, // Keep priority order
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          
          // Calculate totals
          let totalDistanceMeters = 0;
          let totalDurationSeconds = 0;
          
          result.routes[0].legs.forEach(leg => {
            totalDistanceMeters += leg.distance.value;
            totalDurationSeconds += leg.duration.value;
          });
          
          setTotalDistance((totalDistanceMeters / 1000).toFixed(2) + ' km');
          setTotalDuration(Math.round(totalDurationSeconds / 60) + ' mins');
        } else {
          console.error('Directions request failed:', status);
          alert('Failed to calculate route. Please try again.');
        }
        setIsCalculatingRoute(false);
      }
    );
  }, [locations, userLocation]);

  // Auto-calculate route when locations change and map is loaded
  useEffect(() => {
    if (locations.length >= 1 && isMapLoaded) {
      calculateRoute();
    }
  }, [locations, isMapLoaded, calculateRoute]);

  // Move location up in priority
  const movePriorityUp = (id) => {
    const index = locations.findIndex(loc => loc.id === id);
    if (index > 0) {
      const newLocations = [...locations];
      [newLocations[index - 1], newLocations[index]] = [newLocations[index], newLocations[index - 1]];
      
      // Update priorities
      newLocations.forEach((loc, idx) => {
        loc.priority = idx + 1;
      });
      
      setLocations(newLocations);
    }
  };

  // Move location down in priority
  const movePriorityDown = (id) => {
    const index = locations.findIndex(loc => loc.id === id);
    if (index < locations.length - 1) {
      const newLocations = [...locations];
      [newLocations[index], newLocations[index + 1]] = [newLocations[index + 1], newLocations[index]];
      
      // Update priorities
      newLocations.forEach((loc, idx) => {
        loc.priority = idx + 1;
      });
      
      setLocations(newLocations);
    }
  };

  // Open route in Google Maps app
  const openInGoogleMaps = () => {
    if (locations.length === 0) return;

    const sortedLocations = [...locations].sort((a, b) => a.priority - b.priority);
    
    // Start from user's location if available, otherwise first waste location
    const origin = userLocation 
      ? `${userLocation.lat},${userLocation.lng}`
      : `${sortedLocations[0].position.lat},${sortedLocations[0].position.lng}`;
    
    const destination = `${sortedLocations[sortedLocations.length - 1].position.lat},${sortedLocations[sortedLocations.length - 1].position.lng}`;
    
    // Create waypoints (skip first if using user location, otherwise skip first and last)
    const waypointsStart = userLocation ? 0 : 1;
    const waypoints = sortedLocations
      .slice(waypointsStart, -1)
      .map(loc => `${loc.position.lat},${loc.position.lng}`)
      .join('|');
    
    // Build Google Maps URL with directions
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    if (waypoints) {
      mapsUrl += `&waypoints=${waypoints}`;
    }
    
    // Open in new tab
    window.open(mapsUrl, '_blank');
  };

  const getPriorityColor = (priority) => {
    if (priority === 1) return 'from-red-500 to-red-600';
    if (priority === 2) return 'from-orange-500 to-orange-600';
    if (priority === 3) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-emerald-600';
  };

  const getPriorityLabel = (priority) => {
    if (priority === 1) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
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
    if (!selectedWaste || !verificationImage) return;

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
          reportedImage: selectedWaste.imageUrl,
          location: currentLocation,
          reportedLocation: selectedWaste.reportedLocation,
          wasteType: selectedWaste.wasteType,
          amount: `${selectedWaste.amount} kg`,
          aiAnalysis: selectedWaste.aiAnalysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Verification failed';
        throw new Error(errorMsg);
      }

      const result = data.parsedResult || data;
      setVerificationResult(result);
      setGeminiAnalysis(result.notes || data.analysis);
      
      // Check if verification passed
      if (result.overallMatch || result.success) {
        // Convert base64 to blob for API submission
        const base64Response = await fetch(verificationImage);
        const blob = await base64Response.blob();
        const file = new File([blob], 'collection-proof.jpg', { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('collectorImage', file);
        formData.append('latitude', currentLocation.latitude.toString());
        formData.append('longitude', currentLocation.longitude.toString());

        const collectResponse = await fetch(`${API_CONFIG.BASE_URL}/api/waste/${selectedWaste.id}/collect`, {
          method: 'POST',
          headers: {
            'x-user-id': user.id,
          },
          body: formData,
        });

        if (!collectResponse.ok) {
          const errorData = await collectResponse.json();
          setVerificationStatus('verified-failed');
          setVerificationResult({
            ...result,
            backendError: errorData.error || 'Failed to submit collection',
            showBackendError: true
          });
          return;
        }

        setVerificationStatus('success');
        
        const baseReward = parseInt(selectedWaste.amount) * 2;
        const confidence = result.confidence || (result.matchConfidence / 100) || 0.8;
        const earnedReward = Math.floor(baseReward * confidence);
        setReward(earnedReward);

        // Refresh the locations list
        await fetchCollectionLocations();
        
        // Close modal after short delay
        setTimeout(() => {
          setSelectedWaste(null);
          setVerificationImage(null);
          setVerificationResult(null);
        }, 3000);
      } else {
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Route className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Collection Route Map
                </h1>
                <p className="text-gray-600 mt-1">Plan your optimal collection route</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={getUserLocation}
                disabled={loadingUserLocation}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Get my location"
              >
                {loadingUserLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Target className="w-5 h-5" />
                )}
                My Location
              </button>

              <button
                onClick={openInGoogleMaps}
                disabled={locations.length === 0}
                className="px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Open route in Google Maps app"
              >
                <Navigation className="w-5 h-5" />
                Open in Maps
              </button>

              <button
                onClick={fetchCollectionLocations}
                className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Route className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* User Location Info */}
        {userLocation && (
          <div className="bg-linear-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Your Current Location</p>
                <p className="text-xs text-blue-700 font-mono">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
              <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-semibold">
                📍 You are here
              </span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Stops</p>
                <p className="text-3xl font-bold">{locations.length}</p>
              </div>
              <MapPin className="w-10 h-10 opacity-80" />
            </div>
          </div>

          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Distance</p>
                <p className="text-3xl font-bold">{totalDistance || '-- km'}</p>
              </div>
              <Target className="w-10 h-10 opacity-80" />
            </div>
          </div>

          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Est. Duration</p>
                <p className="text-3xl font-bold">{totalDuration || '-- mins'}</p>
              </div>
              <Clock className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="h-[600px] relative">
              {mapError ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Google Maps API Error</h3>
                  <p className="text-gray-600 mb-4 max-w-md">{mapError}</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl text-left">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">🔧 Setup Required:</p>
                    <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Google Cloud Console → Credentials</a></li>
                      <li>Click on your API key to edit it</li>
                      <li><strong>Application restrictions</strong>: Select "None" (for development)<br/>
                        <span className="text-xs italic">Or add HTTP referrers: http://localhost:3000/*, http://127.0.0.1:3000/*</span>
                      </li>
                      <li><strong>API restrictions</strong>: Select "Restrict key"<br/>
                        <span className="text-xs">→ Enable: Maps JavaScript API, Directions API, Geocoding API</span>
                      </li>
                      <li>Click <strong>"Save"</strong> and wait 1-2 minutes for changes to propagate</li>
                      <li>Add the key to <code className="bg-yellow-100 px-1 rounded">.env.local</code>:<br/>
                        <code className="block mt-1 bg-yellow-100 p-2 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...</code>
                      </li>
                      <li>Restart your dev server</li>
                    </ol>
                    <div className="mt-3 pt-3 border-t border-yellow-300">
                      <p className="text-xs text-yellow-700">
                        <strong>⚠️ ApiTargetBlockedMapError?</strong> Your API key has HTTP referrer restrictions blocking localhost. 
                        Set "Application restrictions" to "None" for development.
                      </p>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                </div>
              ) : (
                <LoadScript 
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'}
                  onLoad={() => {
                    setIsMapLoaded(true);
                    setMapError(null);
                  }}
                  onError={(error) => {
                    console.error('Error loading Google Maps:', error);
                    setMapError('Failed to load Google Maps. Please check your API key and ensure Maps JavaScript API is enabled in Google Cloud Console.');
                  }}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={12}
                  >
                    {/* Show user's current location */}
                    {userLocation && (
                      <Marker
                        position={userLocation}
                        icon={{
                          path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                          scale: 8,
                          fillColor: '#3B82F6',
                          fillOpacity: 1,
                          strokeColor: '#FFFFFF',
                          strokeWeight: 3,
                        }}
                        title="Your Location"
                      />
                    )}

                    {/* Show markers if no route, otherwise route will show them */}
                    {!directions && locations.map((location) => (
                      <Marker
                        key={location.id}
                        position={location.position}
                        label={{
                          text: location.priority.toString(),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                        title={`${location.priority}. ${location.address}`}
                      />
                    ))}

                    {/* Show route */}
                    {directions && (
                      <DirectionsRenderer
                        directions={directions}
                        options={{
                          suppressMarkers: false,
                          polylineOptions: {
                            strokeColor: '#10b981',
                            strokeWeight: 5,
                          },
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              )}

              {isCalculatingRoute && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span className="text-sm font-semibold text-gray-800">Calculating route...</span>
                </div>
              )}
            </div>
          </div>

          {/* Locations List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-emerald-600" />
                Collection Points
              </h2>
              {locations.length > 0 && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                  {locations.length} stops
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No waste in your route</p>
                <p className="text-sm text-gray-500 mt-2">Add waste to your route from the Collect Waste page to see them here!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {locations.map((location, index) => (
                  <div
                    key={location.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority Badge */}
                      <div className={`shrink-0 w-10 h-10 bg-linear-to-br ${getPriorityColor(location.priority)} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                        {location.priority}
                      </div>

                      {/* Location Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {location.address}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {location.wasteType} • {location.amount} kg
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            location.priority === 1 
                              ? 'bg-red-100 text-red-700'
                              : location.priority === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {getPriorityLabel(location.priority)}
                          </span>
                        </div>

                        {/* Priority Controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => movePriorityUp(location.id)}
                            disabled={index === 0}
                            className="p-1.5 bg-gray-100 hover:bg-emerald-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => movePriorityDown(location.id)}
                            disabled={index === locations.length - 1}
                            className="p-1.5 bg-gray-100 hover:bg-emerald-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4 text-gray-700" />
                          </button>
                          <span className="text-xs text-gray-500 ml-auto">
                            {location.city}
                          </span>
                        </div>

                        {/* Complete & Verify Button */}
                        <button
                          onClick={() => setSelectedWaste(location)}
                          className="w-full mt-3 py-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete & Verify
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {locations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={calculateRoute}
                  disabled={isCalculatingRoute}
                  className="w-full py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isCalculatingRoute ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Route className="w-5 h-5" />
                      Recalculate Route
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Verification Modal */}
        {selectedWaste && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Complete Collection</h2>
                  <button
                    onClick={() => {
                      setSelectedWaste(null);
                      setVerificationImage(null);
                      setVerificationResult(null);
                      setVerificationStatus('idle');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Waste Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Waste Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Location:</span> {selectedWaste.address}</p>
                    <p><span className="font-medium">Type:</span> {selectedWaste.wasteType}</p>
                    <p><span className="font-medium">Amount:</span> {selectedWaste.amount} kg</p>
                  </div>
                  {selectedWaste.imageUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Reported Image:</p>
                      <img 
                        src={selectedWaste.imageUrl} 
                        alt="Reported waste" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Upload Collection Proof */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Collection Proof
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {verificationImage && (
                    <div className="mt-3">
                      <img 
                        src={verificationImage} 
                        alt="Collection proof" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Location Status */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <button
                    onClick={getCurrentLocation}
                    className="flex items-center gap-2 text-blue-700 font-medium"
                  >
                    <MapPin className="w-5 h-5" />
                    {currentLocation ? '✓ Location Captured' : 'Get Current Location'}
                  </button>
                  {locationError && <p className="text-red-600 text-sm mt-2">{locationError}</p>}
                </div>

                {/* Verification Results */}
                {verificationResult && (
                  <div className={`rounded-xl p-4 ${
                    verificationStatus === 'success' 
                      ? 'bg-green-50 border-2 border-green-500' 
                      : 'bg-red-50 border-2 border-red-500'
                  }`}>
                    <h3 className={`font-bold mb-3 ${
                      verificationStatus === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationStatus === 'success' ? '✓ Verification Successful!' : '✗ Verification Failed'}
                    </h3>
                    
                    {verificationResult.error ? (
                      <p className="text-red-700">{verificationResult.error}</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {verificationResult.imageMatch !== undefined && (
                          <p>
                            <span className="font-medium">Image Match:</span>{' '}
                            <span className={verificationResult.imageMatch ? 'text-green-700' : 'text-red-700'}>
                              {verificationResult.imageMatch ? '✓ Passed' : '✗ Failed'}
                            </span>
                            {verificationResult.matchConfidence && ` (${verificationResult.matchConfidence}% confidence)`}
                          </p>
                        )}
                        {verificationResult.locationMatch !== undefined && (
                          <p>
                            <span className="font-medium">Location Match:</span>{' '}
                            <span className={verificationResult.locationMatch ? 'text-green-700' : 'text-red-700'}>
                              {verificationResult.locationMatch ? '✓ Passed' : '✗ Failed'}
                            </span>
                            {verificationResult.distance && ` (${verificationResult.distance.toFixed(2)} km away)`}
                          </p>
                        )}
                        {geminiAnalysis && (
                          <div className="mt-3 p-3 bg-white rounded-lg">
                            <p className="font-medium mb-1">AI Analysis:</p>
                            <p className="text-gray-700">{geminiAnalysis}</p>
                          </div>
                        )}
                        {verificationStatus === 'success' && reward > 0 && (
                          <p className="text-lg font-bold text-green-700 mt-3">
                            🎉 Earned: {reward} points!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedWaste(null);
                      setVerificationImage(null);
                      setVerificationResult(null);
                      setVerificationStatus('idle');
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={!verificationImage || verificationStatus === 'verifying' || verificationStatus === 'success'}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {verificationStatus === 'verifying' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : verificationStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Completed!
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Verify & Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
