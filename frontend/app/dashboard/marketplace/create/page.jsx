"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  MapPin,
  IndianRupee,
  Clock,
  Weight,
  FileText,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";

const WASTE_TYPES = [
  "Plastic",
  "Metal",
  "Glass",
  "Organic",
  "Electronic",
  "Paper",
  "Mixed",
];

const AUCTION_DURATIONS = [
  { value: 0.5, label: "30 minutes" },
  { value: 1, label: "1 hour" },
  { value: 6, label: "6 hours" },
  { value: 24, label: "24 hours" },
  { value: 72, label: "3 days" },
];

export default function CreateListingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    wasteType: "Plastic",
    weightKg: "",
    basePrice: "",
    auctionDuration: 24,
    description: "",
    latitude: "",
    longitude: "",
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const newPreviews = [...imagePreviews];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          alert("Unable to get location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      alert("Please provide location");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append images
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      // Append other fields
      formDataToSend.append("wasteType", formData.wasteType);
      formDataToSend.append("weightKg", parseFloat(formData.weightKg));
      formDataToSend.append("basePrice", parseFloat(formData.basePrice));
      formDataToSend.append("auctionDuration", parseFloat(formData.auctionDuration));
      formDataToSend.append("latitude", parseFloat(formData.latitude));
      formDataToSend.append("longitude", parseFloat(formData.longitude));
      
      if (formData.description) {
        formDataToSend.append("description", formData.description);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/marketplace/create`, {
        method: "POST",
        headers: {
          "x-user-id": user.id,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Listing created successfully!");
        router.push(`/dashboard/marketplace/${data.listing.id}`);
      } else {
        alert(data.error || "Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Listing
          </h1>
          <p className="text-gray-600">
            List your recyclable waste for auction
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Upload Images (1-5) *
            </label>
            
            {/* Image Previews */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Upload Button */}
              {images.length < 5 && (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {images.length} / 5 images uploaded
            </p>
          </div>

          {/* Waste Type */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Waste Type *
            </label>
            <select
              value={formData.wasteType}
              onChange={(e) =>
                setFormData({ ...formData, wasteType: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              {WASTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Weight (kg) *
            </label>
            <div className="relative">
              <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.weightKg}
                onChange={(e) =>
                  setFormData({ ...formData, weightKg: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="15.5"
                required
              />
            </div>
          </div>

          {/* Base Price */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Base Price (₹) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="1"
                min="10"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Minimum ₹10"
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Minimum base price is ₹10
            </p>
          </div>

          {/* Auction Duration */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Auction Duration *
            </label>
            <select
              value={formData.auctionDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  auctionDuration: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              {AUCTION_DURATIONS.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Additional details about the waste..."
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Location *
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="w-full mb-4 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Get Current Location
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Latitude"
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Longitude"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Listing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Create Listing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
