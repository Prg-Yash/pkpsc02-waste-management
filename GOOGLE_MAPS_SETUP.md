# Google Maps API Setup Guide

## Get Your API Key

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/

2. **Create/Select a Project**

   - Click on the project dropdown at the top
   - Click "New Project" or select existing one

3. **Enable Geocoding API**

   - Go to "APIs & Services" → "Library"
   - Search for "Geocoding API"
   - Click "Enable"

4. **Create API Key**

   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

5. **Restrict the API Key (Recommended)**
   - Click on the newly created API key
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose "Geocoding API"
   - Under "Application restrictions" (optional):
     - Select "HTTP referrers" or "IP addresses" based on your needs
   - Click "Save"

## Add to Your App

1. **Update `.env` file:**

   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```

2. **Restart Expo:**
   ```bash
   cd app
   npx expo start -c --tunnel
   ```

## How It Works

When a user captures/uploads an image:

1. ✅ App gets GPS coordinates (latitude, longitude)
2. ✅ Calls Google Maps Geocoding API with coordinates
3. ✅ Receives full address details including:
   - City (locality)
   - State (administrative_area_level_1)
   - Country
   - Full formatted address
4. ✅ Displays location to user: "Mumbai, Maharashtra"
5. ✅ Sends to backend API with waste report

## What You'll See

**In the app:**

- 📍 Green card showing: "Mumbai, Maharashtra"
- Full address below in smaller text

**In the database:**

- `city`: "Mumbai"
- `state`: "Maharashtra"
- `country`: "India"
- `locationRaw`: Full address string
- `latitude`: 19.0760
- `longitude`: 72.8777

## Testing

1. Capture/upload an image
2. Wait for "Getting location..." spinner
3. Should show green card with city and state
4. Click "Analyze Waste"
5. Result screen shows location card
6. Submit report
7. Check backend - city and state should be populated!

## Fallback Behavior

If Google Maps API fails or is not configured:

- Shows: "Unknown" for city and state
- Still sends coordinates to backend
- App continues to work normally

## Free Tier

Google Maps provides:

- **$200 free credit per month**
- Geocoding API: $5 per 1000 requests
- = **40,000 free requests per month**
- More than enough for testing and small production!

## Troubleshooting

**"Location unavailable" shows:**

- Check location permissions are granted
- Make sure GPS is enabled on device

**"Unknown, Unknown" shows:**

- Google Maps API key not configured
- API key is invalid
- Geocoding API not enabled
- Check console for error messages
