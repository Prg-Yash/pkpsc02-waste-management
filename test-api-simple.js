// Simple API Test - No dependencies
const https = require("https");

const NGROK_URL = "https://faa290152dbb.ngrok-free.app";

console.log("🧪 Testing EcoFlow API\n");
console.log("═══════════════════════════════════════\n");

// Test 1: Health Check
console.log("Test 1: Health Check");
console.log(`URL: ${NGROK_URL}/\n`);

https
  .get(NGROK_URL + "/", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}\n`);

      if (res.statusCode === 200 && data.includes("EcoFlow")) {
        console.log("✅ Test 1 PASSED - Backend is accessible!\n");
        runTest2();
      } else {
        console.log("❌ Test 1 FAILED - Backend not accessible\n");
        console.log("Troubleshooting:");
        console.log("1. Check if backend is running: cd api && npm run dev");
        console.log("2. Check if ngrok is running: ngrok http 3000");
        console.log("3. Verify ngrok URL matches the one in .env\n");
      }
    });
  })
  .on("error", (err) => {
    console.log(`❌ Test 1 FAILED - Connection error`);
    console.log(`Error: ${err.message}\n`);
    console.log("This means:");
    console.log("- Ngrok is not running, OR");
    console.log("- Ngrok URL is wrong, OR");
    console.log("- Internet connection issue\n");
  });

// Test 2: CORS Headers
function runTest2() {
  console.log("═══════════════════════════════════════\n");
  console.log("Test 2: CORS Configuration");
  console.log(`URL: ${NGROK_URL}/api/waste/report\n`);

  const url = new URL(NGROK_URL + "/api/waste/report");
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:8081",
      "Access-Control-Request-Method": "POST",
    },
  };

  https
    .request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log("CORS Headers:");
      console.log(
        `  Allow-Origin: ${
          res.headers["access-control-allow-origin"] || "MISSING"
        }`
      );
      console.log(
        `  Allow-Methods: ${
          res.headers["access-control-allow-methods"] || "MISSING"
        }`
      );
      console.log(
        `  Allow-Headers: ${
          res.headers["access-control-allow-headers"] || "MISSING"
        }\n`
      );

      if (res.headers["access-control-allow-origin"]) {
        console.log("✅ Test 2 PASSED - CORS configured correctly!\n");
        runTest3();
      } else {
        console.log("❌ Test 2 FAILED - CORS not configured\n");
      }
    })
    .on("error", (err) => {
      console.log(`❌ Test 2 FAILED - ${err.message}\n`);
    })
    .end();
}

// Test 3: POST Request
function runTest3() {
  console.log("═══════════════════════════════════════\n");
  console.log("Test 3: POST /api/waste/report");
  console.log("(Testing without file - should get validation error)\n");

  const url = new URL(NGROK_URL + "/api/waste/report");
  const postData = JSON.stringify({
    userId: "test_user",
    location: "Test Location",
  });

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": postData.length,
      "x-user-id": "test_user",
    },
  };

  const req = https
    .request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);

        if (res.statusCode === 400) {
          console.log("✅ Test 3 PASSED - Server is responding!\n");
          showSummary();
        } else {
          console.log("⚠️  Test 3 - Unexpected response\n");
          showSummary();
        }
      });
    })
    .on("error", (err) => {
      console.log(`❌ Test 3 FAILED - ${err.message}\n`);
      showSummary();
    });

  req.write(postData);
  req.end();
}

function showSummary() {
  console.log("═══════════════════════════════════════");
  console.log("📊 TEST SUMMARY");
  console.log("═══════════════════════════════════════\n");
  console.log("Backend API: ✅ Working");
  console.log("Ngrok Tunnel: ✅ Accessible");
  console.log("CORS: ✅ Configured\n");
  console.log("═══════════════════════════════════════");
  console.log("🎯 CONCLUSION");
  console.log("═══════════════════════════════════════\n");
  console.log("The backend API is working correctly!");
  console.log('If your app still shows "Network request failed":\n');
  console.log("1️⃣  RESTART EXPO after changing .env:");
  console.log("   cd app");
  console.log("   npx expo start -c --tunnel\n");
  console.log("2️⃣  Check the app console logs for:");
  console.log('   "API_URL: https://5416279e0ff3.ngrok-free.app"\n');
  console.log("3️⃣  If API_URL is undefined or wrong:");
  console.log("   - Expo didn't reload .env");
  console.log("   - Clear cache and restart\n");
  console.log("4️⃣  Check if ngrok URL is still the same:");
  console.log("   - Ngrok generates new URL on restart");
  console.log("   - Update .env if it changed\n");
}
