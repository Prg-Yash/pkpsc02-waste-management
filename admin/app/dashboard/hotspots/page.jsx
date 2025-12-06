"use client";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, TrendingUp, Trash2, Calendar, Eye, Zap, BarChart3, Loader2, RefreshCw, Flame, Layers, EyeOff, Info } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedContainer, StaggerContainer, StaggerItem, HoverScale } from "@/components/animated-container"
import { GoogleMap, HeatmapLayer, Marker, InfoWindow } from '@react-google-maps/api'
import { useGoogleMaps } from '@/app/providers/GoogleMapsProvider'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

function SeverityBadge({ severity }) {
  const config = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-destructive/80 text-destructive-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-primary text-primary-foreground",
  }

  return (
    <motion.div whileHover={{ scale: 1.1 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
      <Badge className={`${config[severity]}`}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Badge>
    </motion.div>
  )
}

function TrendIndicator({ trend }) {
  const config = {
    increasing: { icon: "↑", color: "text-destructive", label: "Increasing" },
    stable: { icon: "→", color: "text-warning-foreground", label: "Stable" },
    decreasing: { icon: "↓", color: "text-primary", label: "Decreasing" },
  }

  const { icon, color, label } = config[trend] || config.stable

  return (
    <motion.span
      className={`flex items-center gap-1 text-sm font-medium ${color}`}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <motion.span
        animate={{ y: trend === "increasing" ? [-2, 2, -2] : trend === "decreasing" ? [2, -2, 2] : [0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {icon}
      </motion.span>
      {label}
    </motion.span>
  )
}

export default function HotspotsPage() {
  const { isLoaded, loadError } = useGoogleMaps()
  
  const [timeRange, setTimeRange] = useState("7d")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [wasteData, setWasteData] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [center, setCenter] = useState(defaultCenter)
  const [heatmapData, setHeatmapData] = useState([])
  const [showMarkers, setShowMarkers] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [heatmapRadius, setHeatmapRadius] = useState(30)
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.6)
  const [zoom, setZoom] = useState(12)
  const [mapInstance, setMapInstance] = useState(null)

  // Fetch waste data
  useEffect(() => {
    fetchWasteData()
  }, [])

  // Update heatmap when data changes
  useEffect(() => {
    if (wasteData.length > 0 && window.google?.maps?.LatLng) {
      const timer = setTimeout(() => {
        updateHeatmap()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [wasteData, heatmapRadius, heatmapOpacity])

  const fetchWasteData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/waste-proxy')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch waste data: ${response.status}`)
      }

      const data = await response.json()
      const wastesArray = Array.isArray(data) ? data : (data.wastes || [])
      
      // Filter wastes with valid coordinates
      const validWastes = wastesArray.filter(w => {
        const lat = parseFloat(w.latitude)
        const lng = parseFloat(w.longitude)
        return !isNaN(lat) && !isNaN(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180
      })
      
      setWasteData(validWastes)
      
      // Generate hotspots from waste data
      const generatedHotspots = await generateHotspotsFromWaste(validWastes)
      setHotspots(generatedHotspots)
      
      // Set center to first waste location
      if (validWastes.length > 0) {
        setCenter({
          lat: validWastes[0].latitude,
          lng: validWastes[0].longitude
        })
      }
    } catch (error) {
      console.error('Error fetching waste data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateHotspotsFromWaste = async (wastes) => {
    if (!wastes || wastes.length === 0) return []

    // Group wastes by proximity (within 500m radius)
    const clusters = []
    const processed = new Set()

    wastes.forEach((waste, index) => {
      if (processed.has(index)) return

      const cluster = {
        wastes: [waste],
        indices: [index],
        lat: waste.latitude,
        lng: waste.longitude,
      }

      // Find nearby wastes
      for (let i = index + 1; i < wastes.length; i++) {
        if (processed.has(i)) continue

        const other = wastes[i]
        const distance = getDistance(
          waste.latitude, waste.longitude,
          other.latitude, other.longitude
        )

        if (distance <= 0.5) { // 500m radius
          cluster.wastes.push(other)
          cluster.indices.push(i)
          processed.add(i)
        }
      }

      processed.add(index)
      
      // Only create hotspot if there are 3+ wastes
      if (cluster.wastes.length >= 3) {
        // Calculate center of cluster
        const avgLat = cluster.wastes.reduce((sum, w) => sum + w.latitude, 0) / cluster.wastes.length
        const avgLng = cluster.wastes.reduce((sum, w) => sum + w.longitude, 0) / cluster.wastes.length
        cluster.lat = avgLat
        cluster.lng = avgLng
        clusters.push(cluster)
      }
    })

    // Convert clusters to hotspots with address lookup
    const hotspotsWithAddresses = await Promise.all(
      clusters.map(async (cluster, index) => {
        const address = await reverseGeocode(cluster.lat, cluster.lng)
        
        // Determine severity based on number of reports
        let severity = 'low'
        if (cluster.wastes.length >= 10) severity = 'critical'
        else if (cluster.wastes.length >= 7) severity = 'high'
        else if (cluster.wastes.length >= 5) severity = 'medium'

        // Determine most common waste type
        const wasteTypes = cluster.wastes.map(w => w.aiAnalysis?.wasteType || w.wasteType || 'Mixed')
        const wasteTypeCounts = {}
        wasteTypes.forEach(type => {
          wasteTypeCounts[type] = (wasteTypeCounts[type] || 0) + 1
        })
        const mostCommonType = Object.keys(wasteTypeCounts).reduce((a, b) => 
          wasteTypeCounts[a] > wasteTypeCounts[b] ? a : b
        )

        return {
          id: index + 1,
          location: address,
          coords: { lat: cluster.lat, lng: cluster.lng },
          severity,
          wasteType: mostCommonType,
          reports: cluster.wastes.length,
          trend: 'stable',
          lastUpdated: new Date(Math.max(...cluster.wastes.map(w => new Date(w.reportedAt)))).toISOString().split('T')[0],
          wastes: cluster.wastes,
        }
      })
    )

    return hotspotsWithAddresses
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      if (!window.google) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ location: { lat, lng } })
      
      if (result.results && result.results[0]) {
        // Try to get a short, meaningful address
        const addressComponents = result.results[0].address_components
        const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name
        const sublocality = addressComponents.find(c => c.types.includes('sublocality'))?.long_name
        const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'))?.long_name
        
        return sublocality || neighborhood || locality || result.results[0].formatted_address.split(',')[0]
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const updateHeatmap = () => {
    if (!window.google?.maps?.LatLng) return

    const points = wasteData.map(waste => {
      const weight = waste.aiAnalysis?.estimatedWeightKg || 1
      return {
        location: new window.google.maps.LatLng(waste.latitude, waste.longitude),
        weight: Math.min(weight * 3, 150)
      }
    })

    setHeatmapData(points)
  }

  const handleRefresh = () => {
    fetchWasteData()
  }

  const handleMarkerClick = (hotspot) => {
    setSelectedMarker(hotspot)
    if (mapInstance) {
      mapInstance.panTo({ lat: hotspot.coords.lat, lng: hotspot.coords.lng })
      if (zoom < 14) setZoom(15)
    }
  }

  const filteredHotspots = hotspots.filter((hotspot) => severityFilter === "all" || hotspot.severity === severityFilter)

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Error loading Google Maps</p>
        </div>
      </div>
    )
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading hotspot data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <AdminHeader
            title="Hotspots Map"
            subtitle="AI-powered waste accumulation hotspot detection and analysis"
            stats={{ label: "Active Hotspots", value: hotspots.length }}
          />
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </AnimatedContainer>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
        {[
          { 
            icon: AlertTriangle, 
            label: "Critical Zones", 
            value: hotspots.filter(h => h.severity === 'critical').length, 
            color: "bg-destructive/10 text-destructive" 
          },
          { 
            icon: MapPin, 
            label: "High Risk Areas", 
            value: hotspots.filter(h => h.severity === 'high').length, 
            color: "bg-warning/10 text-warning-foreground" 
          },
          { 
            icon: TrendingUp, 
            label: "Improving Areas", 
            value: hotspots.filter(h => h.trend === 'decreasing').length, 
            color: "bg-primary/10 text-primary" 
          },
          { 
            icon: Trash2, 
            label: "Total Waste Reports", 
            value: wasteData.length, 
            color: "bg-blue-500/10 text-blue-600" 
          },
        ].map((stat, index) => (
          <StaggerItem key={stat.label}>
            <HoverScale>
              <Card className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <motion.div
                    className={`rounded-lg p-3 ${stat.color.split(" ")[0]}`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color.split(" ")[1]}`} />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <motion.p
                      className="text-2xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </HoverScale>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-3">
        <AnimatedContainer delay={0.2} className="lg:col-span-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Hotspot Map</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: '500px' }} className="rounded-lg overflow-hidden">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={zoom}
                  onLoad={(map) => setMapInstance(map)}
                  onZoomChanged={() => {
                    if (mapInstance) {
                      const currentZoom = mapInstance.getZoom()
                      if (currentZoom && currentZoom !== zoom) {
                        setZoom(currentZoom)
                      }
                    }
                  }}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    zoomControl: true,
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
                  
                  {showMarkers && window.google && filteredHotspots.map((hotspot) => {
                    const fillColor = hotspot.severity === 'critical' ? '#ef4444' : 
                                     hotspot.severity === 'high' ? '#f59e0b' : 
                                     hotspot.severity === 'medium' ? '#3b82f6' : '#10b981'
                    
                    return (
                      <Marker
                        key={hotspot.id}
                        position={{ lat: hotspot.coords.lat, lng: hotspot.coords.lng }}
                        onClick={() => handleMarkerClick(hotspot)}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 12,
                          fillColor,
                          fillOpacity: 0.9,
                          strokeColor: '#ffffff',
                          strokeWeight: 3,
                        }}
                      />
                    )
                  })}

                  {selectedMarker && (
                    <InfoWindow
                      position={{ 
                        lat: selectedMarker.coords.lat, 
                        lng: selectedMarker.coords.lng 
                      }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-3 max-w-xs">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-800">
                            {selectedMarker.location}
                          </h3>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                            selectedMarker.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            selectedMarker.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            selectedMarker.severity === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {selectedMarker.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            {selectedMarker.wasteType}
                          </p>
                          <p className="font-medium text-gray-700">
                            {selectedMarker.reports} waste reports
                          </p>
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            Last updated: {selectedMarker.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
              
              {/* Map Controls */}
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Map Controls</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        showHeatmap
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Flame className="w-3 h-3 inline mr-1" />
                      Heatmap
                    </button>
                    <button
                      onClick={() => setShowMarkers(!showMarkers)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        showMarkers
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Markers
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Intensity</label>
                    <input
                      type="range"
                      min="20"
                      max="60"
                      value={heatmapRadius}
                      onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Opacity</label>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.1"
                      value={heatmapOpacity}
                      onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Critical</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-muted-foreground">High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Low</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.3}>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Hotspot List</CardTitle>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <StaggerContainer className="space-y-3" delay={0.4}>
                {filteredHotspots.map((hotspot) => (
                  <StaggerItem key={hotspot.id}>
                    <motion.div
                      className="rounded-lg border border-border bg-muted/30 p-3 transition-colors"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{hotspot.location}</span>
                        </div>
                        <SeverityBadge severity={hotspot.severity} />
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          {hotspot.wasteType}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {hotspot.reports} reports
                          </span>
                          <TrendIndicator trend={hotspot.trend} />
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Updated: {hotspot.lastUpdated}
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" size="sm" className="mt-2 w-full text-xs bg-transparent">
                          <Eye className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                      </motion.div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  )
}