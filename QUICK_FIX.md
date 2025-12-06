# QUICK FIX - Use Tunnel Mode (Since it works for you!)

You mentioned **tunnel mode connects but normal mode doesn't**. That's perfect - let's use tunnel with ngrok!

## Step-by-Step Solution:

### 1. Get your ngrok URL

Ngrok should already be running. Check the terminal where you ran `ngrok http 3000`.

Look for this line:

```
Forwarding    https://xxxx-yyyy-zzzz.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (the `https://xxxx-yyyy-zzzz.ngrok-free.app` part)

### 2. Update app/.env

Replace the current API_URL with your ngrok URL:

```env
EXPO_PUBLIC_API_URL=https://YOUR-NGROK-URL-HERE
```

**Example:**

```env
EXPO_PUBLIC_API_URL=https://abcd-1234-5678.ngrok-free.app
```

⚠️ **Important:**

- Use HTTPS (not http)
- No trailing slash at the end
- Copy the exact URL from ngrok terminal

### 3. Restart Expo with tunnel

```bash
cd app
npx expo start -c --tunnel
```

### 4. Scan QR code and test

- Wait for QR code to appear
- Scan with Expo Go on your phone
- Try submitting a waste report

### 5. Check console logs

You should see:

```
🔵 Starting waste submission...
API_URL: https://your-ngrok-url.ngrok-free.app
📤 Sending request to: https://your-ngrok-url.ngrok-free.app/api/waste/report
```

## Why This Works

- ✅ Tunnel bypasses local network issues
- ✅ Ngrok makes backend publicly accessible
- ✅ No firewall/WiFi problems
- ✅ Works from anywhere

## If it still fails

1. Check ngrok is still running (terminal should show live connections)
2. Test ngrok URL in browser: `https://your-ngrok-url.ngrok-free.app` should show `{"status":"ok"...}`
3. Share the console logs with detailed error

---

**The key**: Since tunnel works for Expo, we just need ngrok to make the backend work with tunnel too!
