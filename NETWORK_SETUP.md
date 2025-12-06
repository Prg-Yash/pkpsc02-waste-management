# Network Setup Guide

## Current Issue

- Backend API running at: `http://localhost:3000`
- Your IP address: `192.168.31.216`
- Expo running with `--tunnel` flag (causes network issues)

## Solution 1: Use Local Network (RECOMMENDED)

### Step 1: Stop Expo

Press `Ctrl+C` in the Expo terminal

### Step 2: Restart Expo WITHOUT tunnel

```bash
cd app
npx expo start -c
```

### Step 3: Make sure .env is set to your IP

Your `.env` should have:

```
EXPO_PUBLIC_API_URL=http://192.168.31.216:3000
```

### Step 4: Connect your phone to the same WiFi

- Phone/emulator must be on the same WiFi network: **192.168.31.x**
- Open Expo Go app on your phone
- Scan the QR code from Expo terminal

## Solution 2: Use Tunnel (if local network doesn't work)

### Step 1: Keep Expo running with --tunnel

```bash
cd app
npx expo start -c --tunnel
```

### Step 2: Expose backend with ngrok

In a NEW terminal:

```bash
cd api
npx ngrok http 3000
```

### Step 3: Update .env with ngrok URL

After ngrok starts, it will show a URL like: `https://xxxx-yyyy-zzzz.ngrok-free.app`

Update your `.env`:

```
EXPO_PUBLIC_API_URL=https://xxxx-yyyy-zzzz.ngrok-free.app
```

### Step 4: Restart Expo

```bash
npx expo start -c --tunnel
```

## Troubleshooting

### "Network request failed"

- ✅ Backend is running (check for "🚀 EcoFlow API Server running on port 3000")
- ✅ Phone/emulator on same WiFi as computer
- ✅ Correct IP address in .env (192.168.31.216)
- ✅ Expo restarted after .env changes

### Check if backend is accessible

From your phone's browser, try visiting:

- Local: `http://192.168.31.216:3000`
- Should show: `{"status":"ok","message":"EcoFlow Waste Management API"}`

### Still not working?

1. Disable VPN if you have one
2. Check Windows Firewall - allow port 3000
3. Try using ngrok instead (Solution 2)
