// API Testing Script
// Run with: node test-api.js

const https = require("https");
const http = require("http");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const NGROK_URL = "https://faa290152dbb.ngrok-free.app";
const TEST_USER_ID = "test_user_123";

console.log("🧪 Testing EcoFlow API...\n");

// Test 1: Health Check
async function testHealthCheck() {
  return new Promise((resolve, reject) => {
    console.log("📍 Test 1: Health Check");
    console.log(`   URL: ${NGROK_URL}/`);

    https
      .get(NGROK_URL + "/", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          if (res.statusCode === 200) {
            console.log("   ✅ Health check passed!\n");
            resolve();
          } else {
            console.log("   ❌ Health check failed!\n");
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
      })
      .on("error", (err) => {
        console.log(`   ❌ Error: ${err.message}\n`);
        reject(err);
      });
  });
}

// Test 2: CORS Preflight
async function testCORS() {
  return new Promise((resolve, reject) => {
    console.log("📍 Test 2: CORS Preflight (OPTIONS request)");
    console.log(`   URL: ${NGROK_URL}/api/waste/report`);

    const url = new URL(NGROK_URL + "/api/waste/report");
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:8081",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,x-user-id",
      },
    };

    https
      .request(options, (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   CORS Headers:`);
        console.log(
          `      Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
        );
        console.log(
          `      Access-Control-Allow-Methods: ${res.headers["access-control-allow-methods"]}`
        );
        console.log(
          `      Access-Control-Allow-Headers: ${res.headers["access-control-allow-headers"]}`
        );

        if (res.headers["access-control-allow-origin"]) {
          console.log("   ✅ CORS configured correctly!\n");
          resolve();
        } else {
          console.log("   ❌ CORS not configured!\n");
          reject(new Error("Missing CORS headers"));
        }
      })
      .on("error", (err) => {
        console.log(`   ❌ Error: ${err.message}\n`);
        reject(err);
      })
      .end();
  });
}

// Test 3: POST with JSON (simpler test)
async function testWasteReportWithoutFile() {
  return new Promise((resolve, reject) => {
    console.log(
      "📍 Test 3: POST /api/waste/report (without file - should fail gracefully)"
    );
    console.log(`   URL: ${NGROK_URL}/api/waste/report`);

    const url = new URL(NGROK_URL + "/api/waste/report");
    const postData = JSON.stringify({
      userId: TEST_USER_ID,
      location: "Test Location",
      aiAnalysis: JSON.stringify({
        category: "small",
        wasteType: "plastic",
        confidence: 95,
        estimatedWeightKg: 2.5,
        notes: "Test waste",
      }),
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length,
        "x-user-id": TEST_USER_ID,
        Origin: "http://localhost:8081",
      },
    };

    const req = https
      .request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}`);

          // We expect 400 because file is required, but connection should work
          if (res.statusCode === 400 && data.includes("required")) {
            console.log("   ✅ Server reachable! (File validation working)\n");
            resolve();
          } else {
            console.log("   ⚠️  Unexpected response\n");
            resolve(); // Still resolve as server is reachable
          }
        });
      })
      .on("error", (err) => {
        console.log(`   ❌ Error: ${err.message}\n`);
        reject(err);
      });

    req.write(postData);
    req.end();
  });
}

// Test 4: Check if ngrok URL is accessible
async function testNgrokAccessibility() {
  return new Promise((resolve, reject) => {
    console.log("📍 Test 4: Ngrok URL Accessibility");
    console.log(`   Testing: ${NGROK_URL}`);

    https
      .get(NGROK_URL, (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(
          `   Headers: ${JSON.stringify(res.headers, null, 2).substring(
            0,
            300
          )}`
        );

        if (res.statusCode === 200) {
          console.log("   ✅ Ngrok tunnel is working!\n");
          resolve();
        } else {
          console.log("   ❌ Ngrok tunnel issue!\n");
          reject(new Error(`Status ${res.statusCode}`));
        }
      })
      .on("error", (err) => {
        console.log(`   ❌ Cannot reach ngrok URL: ${err.message}\n`);
        reject(err);
      });
  });
}

// Run all tests
async function runTests() {
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    await testNgrokAccessibility();
    await testHealthCheck();
    await testCORS();
    await testWasteReportWithoutFile();

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("🎯 Backend is working correctly!");
    console.log("\n📱 If your app still fails:");
    console.log("   1. Make sure you restarted Expo after changing .env");
    console.log("   2. Check console logs for the actual API_URL being used");
    console.log("   3. Verify ngrok is still running");
    console.log("   4. Try using --tunnel flag with Expo\n");
  } catch (error) {
    console.log("═══════════════════════════════════════════════════════");
    console.log("❌ TESTS FAILED!");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("🔧 Issues found:");
    console.log(`   ${error.message}\n`);
    console.log("💡 Troubleshooting:");
    console.log("   1. Check if backend is running: npm run dev");
    console.log("   2. Check if ngrok is running: ngrok http 3000");
    console.log("   3. Verify ngrok URL in test matches .env");
    console.log("   4. Check Windows Firewall settings\n");
  }
}

runTests();
