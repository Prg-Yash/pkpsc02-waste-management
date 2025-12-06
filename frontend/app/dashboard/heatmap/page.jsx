'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { GoogleMap, HeatmapLayer, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/app/providers/GoogleMapsProvider';
import { 
  MapPin, Flame, TrendingUp, AlertTriangle, 
  Filter, Loader2, RefreshCw, Info, X, Calendar,
  Eye, EyeOff, Layers
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 19.0760, // Mumbai coordinates as default
  lng: 72.8777,
};

const WASTE_TYPE_COLORS = {
  ORGANIC: { gradient: ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 1)'], name: 'Organic' },
  PLASTIC: { gradient: ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 1)'], name: 'Plastic' },
  PAPER: { gradient: ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 1)'], name: 'Paper' },
  METAL: { gradient: ['rgba(156, 163, 175, 0)', 'rgba(156, 163, 175, 0.5)', 'rgba(156, 163, 175, 1)'], name: 'Metal' },
  GLASS: { gradient: ['rgba(6, 182, 212, 0)', 'rgba(6, 182, 212, 0.5)', 'rgba(6, 182, 212, 1)'], name: 'Glass' },
  'E-WASTE': { gradient: ['rgba(168, 85, 247, 0)', 'rgba(168, 85, 247, 0.5)', 'rgba(168, 85, 247, 1)'], name: 'E-Waste' },
  HAZARDOUS: { gradient: ['rgba(220, 38, 38, 0)', 'rgba(220, 38, 38, 0.5)', 'rgba(220, 38, 38, 1)'], name: 'Hazardous' },
  MIXED: { gradient: ['rgba(251, 146, 60, 0)', 'rgba(251, 146, 60, 0.5)', 'rgba(251, 146, 60, 1)'], name: 'Mixed' },
};

export default function HeatmapPage() {
  const { user } = useUser();
  const { isLoaded, loadError } = useGoogleMaps();
  
  const [wasteData, setWasteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(defaultCenter);
  const [heatmapData, setHeatmapData] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [heatmapRadius, setHeatmapRadius] = useState(30);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.6);
  const [zoom, setZoom] = useState(12);
  const [mapInstance, setMapInstance] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    collected: 0,
    hotspots: 0
  });

  // Fetch waste data
  useEffect(() => {
    fetchWasteData();
  }, []);

  // Update heatmap when data or controls change
  useEffect(() => {
    if (wasteData.length > 0 && window.google?.maps?.LatLng) {
      // Small delay to ensure Google Maps is ready
      const timer = setTimeout(() => {
        updateHeatmap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [wasteData, heatmapRadius, heatmapOpacity]);

  const fetchWasteData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/waste-proxy');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch waste data: ${response.status}`);
      }

      const data = await response.json();
      const wastesArray = Array.isArray(data) ? data : (data.wastes || []);
      
      // Filter wastes with valid coordinates
      const validWastes = wastesArray.filter(w => {
        const lat = parseFloat(w.latitude);
        const lng = parseFloat(w.longitude);
        return !isNaN(lat) && !isNaN(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180;
      });
      
      if (validWastes.length === 0) {
        console.warn('No valid waste data with coordinates found');
      }
      
      setWasteData(validWastes);
      
      // Calculate stats
      calculateStats(validWastes);
      
      // Set center to first waste location with fallback
      if (validWastes.length > 0) {
        setCenter({
          lat: validWastes[0].latitude,
          lng: validWastes[0].longitude
        });
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
      setStats({ total: 0, pending: 0, collected: 0, hotspots: 0 });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (wastes) => {
    if (!wastes || wastes.length === 0) {
      setStats({ total: 0, pending: 0, collected: 0, hotspots: 0 });
      return;
    }

    let pending = 0;
    let collected = 0;
    
    // Single pass for status counts
    wastes.forEach(w => {
      if (w.status === 'PENDING') pending++;
      else if (w.status === 'COLLECTED') collected++;
    });
    
    // Calculate hotspots (areas with 3+ wastes within 500m radius)
    let hotspots = 0;
    const processed = new Set();
    
    wastes.forEach((waste, index) => {
      if (processed.has(index)) return;
      
      let nearby = 0;
      for (let otherIndex = index + 1; otherIndex < wastes.length; otherIndex++) {
        if (processed.has(otherIndex)) continue;
        
        const other = wastes[otherIndex];
        const distance = getDistance(
          waste.latitude, waste.longitude,
          other.latitude, other.longitude
        );
        
        if (distance <= 0.5) { // 500m
          nearby++;
          processed.add(otherIndex);
        }
      }
      
      if (nearby >= 2) {
        hotspots++;
      }
    });
    
    setStats({ total: wastes.length, pending, collected, hotspots });
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateHeatmap = () => {
    if (!window.google?.maps?.LatLng) return;

    const filteredWastes = getFilteredWastes();

    // Create heatmap data points
    const points = filteredWastes.map(waste => {
      const weight = waste.aiAnalysis?.estimatedWeightKg || 1;
      return {
        location: new window.google.maps.LatLng(waste.latitude, waste.longitude),
        weight: Math.min(weight * 3, 150) // Scale weight for better visualization
      };
    });

    setHeatmapData(points);
    
    // Update stats for filtered data
    calculateStats(filteredWastes);
  };

  const getFilteredWastes = () => {
    return wasteData;
  };

  const handleRefresh = () => {
    fetchWasteData();
  };

  const handleMarkerClick = (waste) => {
    if (selectedMarker?.id === waste.id) return;
    
    setSelectedMarker(waste);
    
    // Only pan if marker is not already in view
    if (mapInstance) {
      mapInstance.panTo({ lat: waste.latitude, lng: waste.longitude });
      if (zoom < 14) {
        setZoom(15);
      }
    } else {
      setCenter({ lat: waste.latitude, lng: waste.longitude });
      setZoom(15);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Error loading Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading heatmap data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-linear-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Waste Heatmap
                </h1>
                <p className="text-gray-600 mt-1">Visualize waste distribution and hotspots</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setHeatmapRadius(30);
                  setHeatmapOpacity(0.6);
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reset Controls
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Waste</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Collected</p>
                <p className="text-2xl font-bold text-gray-800">{stats.collected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Flame className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Hotspots</p>
                <p className="text-2xl font-bold text-gray-800">{stats.hotspots}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-800">Controls</h3>
              </div>
              
              {/* Heatmap Controls */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Heatmap Intensity
                </label>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={heatmapRadius}
                  onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Opacity Control */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.1"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Transparent</span>
                  <span>Opaque</span>
                </div>
              </div>

              {/* Layer Toggles */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Map Layers
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-between ${
                      showHeatmap
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4" />
                      Heatmap
                    </span>
                    {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setShowMarkers(!showMarkers)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-between ${
                      showMarkers
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Markers
                    </span>
                    {showMarkers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-800">Legend</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-2">Heat Intensity</p>
                  <div className="h-8 rounded-lg bg-linear-to-r from-cyan-400 via-yellow-400 to-red-600"></div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Higher concentration = warmer colors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden" style={{ height: '700px' }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={zoom}
                onLoad={(map) => setMapInstance(map)}
                onZoomChanged={() => {
                  if (mapInstance) {
                    const currentZoom = mapInstance.getZoom();
                    if (currentZoom && currentZoom !== zoom) {
                      setZoom(currentZoom);
                    }
                  }
                }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  zoomControl: true,
                  mapTypeControlOptions: {
                    style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR,
                    position: window.google?.maps?.ControlPosition?.TOP_RIGHT,
                  },
                }}
              >
                {showHeatmap && heatmapData.length > 0 && (
                  <HeatmapLayer
                    key={`heatmap-${heatmapRadius}-${heatmapOpacity}`}
                    data={heatmapData}
                    options={{
                      radius: heatmapRadius,
                      opacity: heatmapOpacity,
                      maxIntensity: 50,
                      dissipating: true,
                      gradient: [
                        'rgba(0, 255, 255, 0)',
                        'rgba(0, 255, 255, 0.7)',
                        'rgba(0, 191, 255, 0.8)',
                        'rgba(0, 127, 255, 0.9)',
                        'rgba(0, 191, 0, 1)',
                        'rgba(255, 255, 0, 1)',
                        'rgba(255, 191, 0, 1)',
                        'rgba(255, 127, 0, 1)',
                        'rgba(255, 63, 0, 1)',
                        'rgba(255, 0, 0, 1)'
                      ]
                    }}
                  />
                )}
                
                {showMarkers && window.google && getFilteredWastes().map((waste) => {
                  const fillColor = waste.status === 'COLLECTED' ? '#10b981' : 
                                   waste.status === 'IN_PROGRESS' ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <Marker
                      key={waste.id}
                      position={{ lat: waste.latitude, lng: waste.longitude }}
                      onClick={() => handleMarkerClick(waste)}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor,
                        fillOpacity: 0.9,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                      }}
                    />
                  );
                })}

                {selectedMarker && (
                  <InfoWindow
                    position={{ 
                      lat: selectedMarker.latitude, 
                      lng: selectedMarker.longitude 
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-3 max-w-xs">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-800">
                          {selectedMarker.aiAnalysis?.wasteType || selectedMarker.wasteType || 'Mixed Waste'}
                        </h3>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                          selectedMarker.status === 'COLLECTED' ? 'bg-emerald-100 text-emerald-700' :
                          selectedMarker.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedMarker.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedMarker.city}, {selectedMarker.state}
                        </p>
                        {selectedMarker.aiAnalysis?.estimatedWeightKg && (
                          <p className="font-medium text-gray-700">
                            Weight: {selectedMarker.aiAnalysis.estimatedWeightKg} kg
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(selectedMarker.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
