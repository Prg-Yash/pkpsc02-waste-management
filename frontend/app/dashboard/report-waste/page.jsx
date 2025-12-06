'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  MapPin, Camera, Trash2, Recycle, Package, Droplets, 
  Leaf, Zap, ArrowLeft, CheckCircle, AlertCircle, 
  Upload, X, Loader2, TrendingUp, Award, Target, ChevronDown
} from 'lucide-react';

export default function ReportWaste() {
  const { user } = useUser();
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [wasteType, setWasteType] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Animated stats
  const [animatedStats, setAnimatedStats] = useState({
    totalReports: 0,
    points: 0,
    impact: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        totalReports: 45,
        points: 1250,
        impact: 89
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Waste type options with icons and colors
  const wasteTypes = [
    { id: 'organic', name: 'Organic Waste', icon: Leaf, color: 'from-green-500 to-emerald-600', points: 10 },
    { id: 'plastic', name: 'Plastic', icon: Package, color: 'from-blue-500 to-cyan-600', points: 15 },
    { id: 'paper', name: 'Paper', icon: Recycle, color: 'from-amber-500 to-orange-600', points: 12 },
    { id: 'metal', name: 'Metal', icon: Zap, color: 'from-purple-500 to-pink-600', points: 20 },
    { id: 'glass', name: 'Glass', icon: Droplets, color: 'from-teal-500 to-cyan-600', points: 18 },
    { id: 'ewaste', name: 'E-Waste', icon: Target, color: 'from-red-500 to-pink-600', points: 25 }
  ];

  // Get current location
  const getCurrentLocation = () => {
    setLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please enable location services.');
        setLoadingLocation(false);
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Camera functions
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setIsCameraOpen(true);
      }
    } catch (error) {
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'waste-photo.jpg', { type: 'image/jpeg' });
        setPhoto({
          file,
          preview: URL.createObjectURL(blob),
        });
        closeCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const removePhoto = () => {
    if (photo?.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setPhoto(null);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location || !photo || !wasteType || !description.trim() || !weight) {
      alert('Please complete all fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setPhoto(null);
      setWasteType('');
      setDescription('');
      setWeight('');
      getCurrentLocation();
    }, 3000);
  };

  const selectedWasteInfo = wasteTypes.find(w => w.id === wasteType);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Report Waste
              </h1>
              <p className="text-gray-600 mt-1">Submit waste collection reports</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] border border-white/20">
            <div className="grid gap-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tracking-tight">
                    {animatedStats.totalReports}
                  </p>
                  <p className="text-sm font-medium opacity-90 mt-1">Total Reports</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-xs font-medium opacity-80">
                  +12 this week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] border border-white/20">
            <div className="grid gap-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tracking-tight">
                    {animatedStats.points}
                  </p>
                  <p className="text-sm font-medium opacity-90 mt-1">Points Earned</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-xs font-medium opacity-80">
                  +150 this week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] border border-white/20">
            <div className="grid gap-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tracking-tight">
                    {animatedStats.impact}%
                  </p>
                  <p className="text-sm font-medium opacity-90 mt-1">Impact Score</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-xs font-medium opacity-80">
                  Above average
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-emerald-500 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Report Submitted Successfully!</h3>
                <p className="text-gray-600">You earned {selectedWasteInfo?.points || 0} points! Thank you for helping keep our community clean.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            
            {/* Left Column - Waste Type Selection */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Waste Type Selection */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Waste Type</h2>
                    <p className="text-xs text-gray-600">Select category</p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="">Select waste type...</option>
                    {wasteTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} (+{type.points} points)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {selectedWasteInfo && (
                  <div className="mt-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-linear-to-br ${selectedWasteInfo.color} rounded-lg shrink-0`}>
                        <selectedWasteInfo.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{selectedWasteInfo.name}</p>
                        <p className="text-xs text-emerald-600 font-medium">+{selectedWasteInfo.points} points</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Capture */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Camera className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Photo</h2>
                    <p className="text-xs text-gray-600">Capture or upload image</p>
                  </div>
                </div>

                {!photo && !isCameraOpen && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={openCamera}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-gray-100 group-hover:bg-emerald-100 rounded-full transition-colors">
                          <Camera className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-600 font-semibold">Open Camera</p>
                      </div>
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-500">or</span>
                      </div>
                    </div>

                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhoto({
                              file,
                              preview: URL.createObjectURL(file),
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-5 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-gray-100 group-hover:bg-blue-100 rounded-full transition-colors">
                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <p className="text-sm text-gray-600 font-semibold">Upload from Device</p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {isCameraOpen && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={closeCamera}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {photo && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500">
                      <img
                        src={photo.preview}
                        alt="Waste"
                        className="w-full h-auto"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg text-sm"
                    >
                      Retake Photo
                    </button>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Weight Field */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Weight</h2>
                    <p className="text-xs text-gray-600">Approximate weight</p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 font-medium text-base"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                    kg
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Upload className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Description</h2>
                    <p className="text-xs text-gray-600">Additional details</p>
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the waste situation and any other details..."
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-sm text-gray-900 font-medium"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Right Column - Location & Summary */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Location */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-800">Location</h2>
                      <p className="text-xs text-gray-600">Auto-detected</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
                  >
                    {loadingLocation ? 'Fetching...' : 'Refresh'}
                  </button>
                </div>

                {location ? (
                  <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-green-900 text-sm mb-2">Location Captured</p>
                        <div className="space-y-1 text-xs">
                          <p className="text-green-700">
                            <span className="font-medium">Lat:</span> {location.latitude.toFixed(6)}
                          </p>
                          <p className="text-green-700">
                            <span className="font-medium">Lng:</span> {location.longitude.toFixed(6)}
                          </p>
                          <p className="text-green-600 text-xs mt-1">
                            ±{Math.round(location.accuracy)}m accuracy
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    </div>
                  </div>
                ) : locationError ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-red-900 text-sm">Location Error</p>
                        <p className="text-xs text-red-700 mt-1">{locationError}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <p className="text-xs text-blue-900 font-medium">Detecting location...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Report Summary */}
              <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white sticky top-4">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Report Summary
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <span className="text-xs opacity-90">Waste Type</span>
                    <span className="font-bold text-xs">
                      {selectedWasteInfo ? selectedWasteInfo.name : 'Not selected'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <span className="text-xs opacity-90">Photo</span>
                    <span className="font-bold text-xs">
                      {photo ? 'Captured ✓' : 'Not captured'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <span className="text-xs opacity-90">Weight</span>
                    <span className="font-bold text-xs">
                      {weight ? `${weight} kg ✓` : 'Not added'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <span className="text-xs opacity-90">Location</span>
                    <span className="font-bold text-xs">
                      {location ? 'Detected ✓' : 'Detecting...'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <span className="text-xs opacity-90">Description</span>
                    <span className="font-bold text-xs">
                      {description.trim() ? 'Added ✓' : 'Not added'}
                    </span>
                  </div>

                  {selectedWasteInfo && (
                    <div className="bg-white/20 backdrop-blur rounded-lg p-3 mt-4">
                      <p className="text-xs opacity-90 mb-1">Points to Earn</p>
                      <p className="text-2xl font-bold">+{selectedWasteInfo.points}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!location || !photo || !wasteType || !weight || !description.trim() || isSubmitting}
                  className="w-full mt-4 bg-white text-emerald-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

