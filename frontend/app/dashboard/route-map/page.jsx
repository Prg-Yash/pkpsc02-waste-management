'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  MapPin, Navigation, Trash2, CheckCircle, Clock,
  ArrowUp, ArrowDown, Route, Loader2, Target, TrendingUp,
  Shield, ArrowRight, Upload, X, Award
} from 'lucide-react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { API_CONFIG } from '@/lib/api-config';
import { useGoogleMaps } from '@/app/providers/GoogleMapsProvider';

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
  const router = useRouter();
  const { isLoaded, loadError } = useGoogleMaps();
  const [isCollector, setIsCollector] = useState(null);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState(null);
  const [totalDistance, setTotalDistance] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingUserLocation, setLoadingUserLocation] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationSavings, setOptimizationSavings] = useState(null);
  const [removingWasteId, setRemovingWasteId] = useState(null);

  // Verification modal states
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [verificationImage, setVerificationImage] = useState(null);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [collectionStep, setCollectionStep] = useState('before');
  const [beforeVerified, setBeforeVerified] = useState(false);
  const [beforeVerificationData, setBeforeVerificationData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [reward, setReward] = useState(0);
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);

  // Check if user is a collector
  useEffect(() => {
    const checkCollectorStatus = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          const collectorStatus = data.user?.enableCollector || false;
          setIsCollector(collectorStatus);

          if (!collectorStatus) {
            // Redirect non-collectors to dashboard
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking collector status:', error);
        router.push('/dashboard');
      }
    };

    if (user?.id) {
      checkCollectorStatus();
    }
  }, [user, router]);

  // Get user's current location
  useEffect(() => {
    if (isCollector) {
      getUserLocation();
    }
  }, [isCollector]);

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

  // Optimize route using Google Maps waypoint optimization
  const optimizeRoute = useCallback(() => {
    if (locations.length < 2) {
      alert('Need at least 2 locations to optimize route');
      return;
    }

    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) {
      alert('Google Maps API not yet loaded. Please try again.');
      return;
    }

    setIsOptimizing(true);
    setOptimizationSavings(null);

    const currentLocations = [...locations].sort((a, b) => a.priority - b.priority);

    // Use user location as origin if available, otherwise first collection point
    const origin = userLocation || currentLocations[0].position;
    const destination = userLocation
      ? currentLocations[currentLocations.length - 1].position
      : currentLocations[currentLocations.length - 1].position;

    // Prepare waypoints for optimization
    const waypoints = userLocation
      ? currentLocations.map(loc => ({
        location: loc.position,
        stopover: true,
      }))
      : currentLocations.slice(0, -1).map(loc => ({
        location: loc.position,
        stopover: true,
      }));

    const directionsService = new window.google.maps.DirectionsService();

    // First, get current route distance
    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (currentResult, currentStatus) => {
        if (currentStatus !== window.google.maps.DirectionsStatus.OK) {
          console.error('Failed to get current route:', currentStatus);
          setIsOptimizing(false);
          alert('Failed to calculate current route. Please try again.');
          return;
        }

        // Calculate current total distance
        let currentTotalDistance = 0;
        currentResult.routes[0].legs.forEach(leg => {
          currentTotalDistance += leg.distance.value;
        });

        // Now get optimized route
        directionsService.route(
          {
            origin,
            destination,
            waypoints: waypoints,
            optimizeWaypoints: true, // Enable optimization
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (optimizedResult, optimizedStatus) => {
            if (optimizedStatus === window.google.maps.DirectionsStatus.OK) {
              // Calculate optimized total distance
              let optimizedTotalDistance = 0;
              let optimizedTotalDuration = 0;

              optimizedResult.routes[0].legs.forEach(leg => {
                optimizedTotalDistance += leg.distance.value;
                optimizedTotalDuration += leg.duration.value;
              });

              // Check if optimization actually improved the route
              const distanceSaved = currentTotalDistance - optimizedTotalDistance;
              const percentSaved = (distanceSaved / currentTotalDistance) * 100;

              if (distanceSaved > 100) { // Only update if saved more than 100 meters
                // Get the optimized waypoint order
                const waypointOrder = optimizedResult.routes[0].waypoint_order;

                // Reorder locations based on optimization
                const optimizedLocations = [];

                if (userLocation) {
                  // All locations are waypoints
                  waypointOrder.forEach((waypointIndex, newIndex) => {
                    const location = currentLocations[waypointIndex];
                    optimizedLocations.push({
                      ...location,
                      priority: newIndex + 1,
                    });
                  });
                } else {
                  // First location stays first, reorder the rest
                  optimizedLocations.push({
                    ...currentLocations[0],
                    priority: 1,
                  });

                  waypointOrder.forEach((waypointIndex, newIndex) => {
                    const location = currentLocations[waypointIndex + 1]; // +1 because first is origin
                    optimizedLocations.push({
                      ...location,
                      priority: newIndex + 2,
                    });
                  });
                }

                // Update locations with optimized order
                setLocations(optimizedLocations);
                setDirections(optimizedResult);

                setTotalDistance((optimizedTotalDistance / 1000).toFixed(2) + ' km');
                setTotalDuration(Math.round(optimizedTotalDuration / 60) + ' mins');

                // Show savings
                setOptimizationSavings({
                  distanceSaved: (distanceSaved / 1000).toFixed(2),
                  percentSaved: percentSaved.toFixed(1),
                  timeSaved: Math.round((currentResult.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0) - optimizedTotalDuration) / 60),
                });

                // Auto-hide savings message after 5 seconds
                setTimeout(() => setOptimizationSavings(null), 5000);
              } else {
                // Route is already optimal
                alert(`Route is already optimized! Current route is the most efficient path (only ${Math.abs(distanceSaved).toFixed(0)}m difference).`);
              }
            } else {
              console.error('Optimized directions request failed:', optimizedStatus);
              alert('Failed to optimize route. Please try again.');
            }
            setIsOptimizing(false);
          }
        );
      }
    );
  }, [locations, userLocation]);

  // Auto-calculate route when locations change and map is loaded
  useEffect(() => {
    if (locations.length >= 1 && isLoaded) {
      calculateRoute();
    }
  }, [locations, isLoaded, calculateRoute]);

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

  // Remove waste from route
  const removeWasteFromRoute = async (wasteId) => {
    if (!confirm('Are you sure you want to remove this waste from your route?')) {
      return;
    }

    setRemovingWasteId(wasteId);

    try {
      const response = await fetch('/api/route-planner-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wasteId,
          action: 'remove'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove waste from route');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove waste from route');
      }

      // Remove the waste from locations list
      const updatedLocations = locations
        .filter(loc => loc.id !== wasteId)
        .map((loc, index) => ({
          ...loc,
          priority: index + 1,
        }));

      setLocations(updatedLocations);

      // Clear directions to trigger recalculation
      setDirections(null);

      // Show success message
      alert('Waste removed from route successfully!');

      // Recalculate route if there are still locations
      if (updatedLocations.length > 0) {
        setTimeout(() => calculateRoute(), 300);
      } else {
        // Reset route stats if no locations left
        setTotalDistance('');
        setTotalDuration('');
      }
    } catch (error) {
      console.error('Error removing waste from route:', error);
      alert(`Failed to remove waste: ${error.message}`);
    } finally {
      setRemovingWasteId(null);
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

  const handleImageUpload = (e, imageType = 'legacy') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageType === 'before') {
          setBeforeImage(reader.result);
        } else if (imageType === 'after') {
          setAfterImage(reader.result);
        } else {
          setVerificationImage(reader.result);
        }
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

  // Step 1: Verify before image only
  const handleVerifyBeforeImage = async () => {
    if (!selectedWaste || !beforeImage) return;

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

      // Call Gemini API for before-only verification
      const response = await fetch('/api/verify-waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedImage: selectedWaste.imageUrl,
          beforeImage: beforeImage,
          verificationType: 'before',
          reportedLocation: selectedWaste.reportedLocation,
          collectorLocation: currentLocation
        }),
      });

      const data = await response.json();
      console.log('Step 1 - Before Image Verification Result:', data);

      setVerificationResult(data);

      // Check if before image is valid
      const beforeValid = data.beforeVerification?.isValid === true &&
        data.beforeVerification?.confidence >= 0.6;
      const locationValid = !data.locationVerification ||
        data.locationVerification?.isValid === true;
      const step1Pass = beforeValid && locationValid && (data.success === true);

      if (step1Pass) {
        // Step 1 passed - store data and move to step 2
        setBeforeVerified(true);
        setBeforeVerificationData(data);
        setCollectionStep('after');
        setVerificationStatus('step1-complete');
        alert('✅ Step 1 Complete! Before image verified successfully. Now upload the after collection photo.');
      } else {
        // Step 1 failed
        setVerificationStatus('verified-failed');
        const failureReasons = [];
        if (!beforeValid) {
          if (data.beforeVerification?.confidence < 0.6) {
            failureReasons.push(`Before image confidence too low: ${(data.beforeVerification?.confidence * 100).toFixed(0)}%`);
          } else {
            failureReasons.push('Before image does not match reported waste');
          }
        }
        if (!locationValid) {
          failureReasons.push('Location verification failed');
        }

        data.failureReason = failureReasons.join('; ');
        data.allChecksPass = false;
        setVerificationResult(data);
        alert(`❌ Step 1 Failed: ${data.failureReason}\n\nPlease take a clear photo at the exact reported location showing the same waste.`);
      }
    } catch (error) {
      console.error('Step 1 verification error:', error);
      setVerificationStatus('error');
      alert(`Error during step 1 verification: ${error.message}`);
    }
  };

  // Step 2: Verify after image and complete collection
  const handleVerifyAfterImage = async () => {
    if (!selectedWaste || !beforeImage || !afterImage || !beforeVerificationData) return;

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

      // Call Gemini API for complete before-after verification
      const response = await fetch('/api/verify-waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationType: 'before-after',
          reportedImage: selectedWaste.imageUrl,
          beforeImage: beforeImage,
          afterImage: afterImage,
          location: currentLocation,
          reportedLocation: selectedWaste.reportedLocation,
          aiAnalysis: selectedWaste.aiAnalysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Verification failed';
        throw new Error(errorMsg);
      }

      setVerificationResult(data);

      // STRICT VALIDATION: Both before and after verification must pass with AI approval
      const beforeValid = data.beforeVerification?.isValid === true && data.beforeVerification?.confidence >= 0.6;
      const afterValid = data.afterVerification?.isValid === true && data.afterVerification?.confidence >= 0.6;
      const locationValid = !data.locationVerification || data.locationVerification?.isValid === true;

      const allChecksPass = beforeValid && afterValid && locationValid && (data.success === true);

      // Only proceed if ALL checks pass
      if (allChecksPass) {
        // Convert base64 to blob for API submission (use after image)
        const base64Response = await fetch(afterImage);
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
            ...data,
            backendError: errorData.error || 'Failed to submit collection',
            showBackendError: true
          });
          return;
        }

        setVerificationStatus('success');

        // Calculate reward based on both confidences
        const baseReward = parseInt(selectedWaste.amount) * 2;
        const avgConfidence = (data.beforeVerification.confidence + data.afterVerification.confidence) / 2;
        const earnedReward = Math.floor(baseReward * avgConfidence);
        setReward(earnedReward);

        // Refresh the locations list
        await fetchCollectionLocations();

        // Close modal after short delay
        setTimeout(() => {
          setSelectedWaste(null);
          setBeforeImage(null);
          setAfterImage(null);
          setVerificationImage(null);
          setVerificationResult(null);
          setCollectionStep('before');
          setBeforeVerified(false);
          setBeforeVerificationData(null);
        }, 3000);
      } else {
        // Verification failed - show detailed failure reasons
        setVerificationStatus('verified-failed');
        const failureReasons = [];
        if (!beforeValid) failureReasons.push('Before image verification failed');
        if (!afterValid) failureReasons.push('After image verification failed');
        if (!locationValid) failureReasons.push('Location verification failed');

        data.failureReason = failureReasons.join('; ');
        data.allChecksPass = false;
        setVerificationResult(data);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failure');
      setVerificationResult({
        error: error.message || 'Verification failed. Please try again.'
      });
    }
  };

  // Show loading while checking collector status
  if (isCollector === null) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not a collector (will redirect)
  if (!isCollector) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">        {/* Header */}
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
            <div className="h-full relative">
              {loadError ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Google Maps API Error</h3>
                  <p className="text-gray-600 mb-4 max-w-md">{loadError?.message || 'Failed to load Google Maps'}</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl text-left">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">🔧 Setup Required:</p>
                    <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Google Cloud Console → Credentials</a></li>
                      <li>Click on your API key to edit it</li>
                      <li><strong>Application restrictions</strong>: Select "None" (for development)<br />
                        <span className="text-xs italic">Or add HTTP referrers: http://localhost:3000/*, http://127.0.0.1:3000/*</span>
                      </li>
                      <li><strong>API restrictions</strong>: Select "Restrict key"<br />
                        <span className="text-xs">→ Enable: Maps JavaScript API, Directions API, Geocoding API</span>
                      </li>
                      <li>Click <strong>"Save"</strong> and wait 1-2 minutes for changes to propagate</li>
                      <li>Add the key to <code className="bg-yellow-100 px-1 rounded">.env.local</code>:<br />
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
              ) : !isLoaded || loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                </div>
              ) : (
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
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${location.priority === 1
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

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => removeWasteFromRoute(location.id)}
                            disabled={removingWasteId === location.id}
                            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            title="Remove from route"
                          >
                            {removingWasteId === location.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedWaste(location)}
                            className="flex-1 py-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Collect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {locations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={calculateRoute}
                  disabled={isCalculatingRoute || isOptimizing}
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

                <button
                  onClick={optimizeRoute}
                  disabled={isOptimizing || isCalculatingRoute || locations.length < 2}
                  className="w-full py-3 bg-linear-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  title="Automatically reorder stops for shortest route"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Optimize Route
                    </>
                  )}
                </button>

                {/* Optimization Savings Alert */}
                {optimizationSavings && (
                  <div className="mt-3 p-4 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold text-sm">Route Optimized!</span>
                    </div>
                    <div className="text-xs space-y-1 opacity-95">
                      <p>✓ Distance saved: {optimizationSavings.distanceSaved} km ({optimizationSavings.percentSaved}%)</p>
                      <p>✓ Time saved: ~{optimizationSavings.timeSaved} mins</p>
                    </div>
                  </div>
                )}
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
                      setBeforeImage(null);
                      setAfterImage(null);
                      setVerificationImage(null);
                      setVerificationResult(null);
                      setVerificationStatus('idle');
                      setCollectionStep('before');
                      setBeforeVerified(false);
                      setBeforeVerificationData(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
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

                {/* Two-Step Verification Process Header */}
                <div className="p-5 bg-linear-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Secure Two-Step Verification</h3>
                  </div>
                  <p className="text-sm opacity-95 mb-4">
                    Complete both steps to verify waste collection and earn points
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${collectionStep === 'before' && !beforeVerified ? 'bg-white/30 border-2 border-white' : 'bg-white/10'
                      }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${beforeVerified ? 'bg-emerald-400 text-emerald-900' : 'bg-white text-blue-600'
                        }`}>
                        {beforeVerified ? '✓' : '1'}
                      </div>
                      <span className="text-sm font-semibold">Before Collection</span>
                    </div>
                    <ArrowRight className="w-5 h-5" />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${collectionStep === 'after' ? 'bg-white/30 border-2 border-white' : 'bg-white/10'
                      }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${beforeVerified ? 'bg-white text-emerald-600' : 'bg-white/50 text-gray-300'
                        }`}>
                        2
                      </div>
                      <span className={`text-sm font-semibold ${!beforeVerified ? 'opacity-50' : ''}`}>After Collection</span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Before Image Upload */}
                {collectionStep === 'before' && (
                  <>
                    <div className="border-2 border-blue-400 rounded-xl p-5 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          <span className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">1</span>
                          BEFORE Collection Image
                        </label>
                        {beforeImage && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">Take a photo of the waste BEFORE you start collecting</p>

                      {!beforeImage ? (
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-white">
                          <Upload className="mx-auto h-10 w-10 text-blue-400 mb-2" />
                          <label className="cursor-pointer">
                            <span className="text-blue-600 font-semibold hover:text-blue-700">Upload Before Image</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'before')}
                              accept="image/*"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={beforeImage}
                            alt="Before collection"
                            className="rounded-lg w-full shadow-md border-2 border-blue-300"
                          />
                          <button
                            onClick={() => setBeforeImage(null)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step 1 Button */}
                    <button
                      onClick={handleVerifyBeforeImage}
                      disabled={!beforeImage || verificationStatus === 'verifying'}
                      className="w-full py-4 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {verificationStatus === 'verifying' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying Step 1...
                        </>
                      ) : !beforeImage ? (
                        'Upload Before Image First'
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Verify Step 1 - Before Image
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Step 2: After Image Upload */}
                {collectionStep === 'after' && beforeVerified && (
                  <>
                    <div className="p-4 bg-emerald-100 border-l-4 border-emerald-500 rounded">
                      <p className="text-sm text-emerald-800 font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Step 1 Completed - Before image verified successfully!
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Now upload the after collection photo to complete verification
                      </p>
                    </div>

                    <div className="border-2 border-emerald-400 rounded-xl p-5 bg-emerald-50">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">2</span>
                          AFTER Collection Image
                        </label>
                        {afterImage && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">Take a photo AFTER collecting - area must be clean and waste removed</p>

                      {!afterImage ? (
                        <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors bg-white">
                          <Upload className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                          <label className="cursor-pointer">
                            <span className="text-emerald-600 font-semibold hover:text-emerald-700">Upload After Image</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'after')}
                              accept="image/*"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={afterImage}
                            alt="After collection"
                            className="rounded-lg w-full shadow-md border-2 border-emerald-300"
                          />
                          <button
                            onClick={() => setAfterImage(null)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step 2 Button */}
                    <button
                      onClick={handleVerifyAfterImage}
                      disabled={!afterImage || verificationStatus === 'verifying'}
                      className="w-full py-5 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {verificationStatus === 'verifying' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying Step 2 & Completing...
                        </>
                      ) : !afterImage ? (
                        'Upload After Image to Complete'
                      ) : (
                        <>
                          <Award className="w-5 h-5" />
                          Verify Step 2 & Complete Collection
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Verification Results */}
                {verificationResult && (
                  <div className={`rounded-xl p-4 ${verificationStatus === 'success'
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-red-50 border-2 border-red-500'
                    }`}>
                    <h3 className={`font-bold mb-3 ${verificationStatus === 'success' ? 'text-green-800' : 'text-red-800'
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
