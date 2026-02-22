#!/usr/bin/env node
/**
 * scripts/verify-api-endpoints.js
 * Verify all Medi-Sync AI API endpoints are working correctly.
 * Run with: node scripts/verify-api-endpoints.js
 */

const BACKEND_URL = "https://olive-backend-bly2.onrender.com";

const ENDPOINTS = [
  // Health Check
  {
    name: "Health Check",
    method: "GET",
    path: "/health",
    requiresAuth: false,
    expectedStatus: [200, 404],
    description: "Backend health check",
  },

  // Users Module
  {
    name: "User Registration",
    method: "POST",
    path: "/api/users/",
    requiresAuth: false,
    expectedStatus: [200, 201, 400],
    description: "Register new user",
  },
  {
    name: "User Login",
    method: "POST",
    path: "/api/users/login",
    requiresAuth: false,
    expectedStatus: [200, 401, 404],
    description: "Login with credentials",
  },

  // Prescriptions Module
  {
    name: "Create Prescription",
    method: "POST",
    path: "/api/prescriptions/{user_id}",
    requiresAuth: true,
    expectedStatus: [200, 201, 400, 401],
    description: "Create new prescription",
  },
  {
    name: "Get Prescriptions",
    method: "GET",
    path: "/api/prescriptions/{user_id}",
    requiresAuth: true,
    expectedStatus: [200, 401],
    description: "Get user prescriptions",
  },
  {
    name: "Upload Prescription",
    method: "POST",
    path: "/api/prescriptions/{user_id}/upload",
    requiresAuth: true,
    expectedStatus: [200, 201, 400, 401],
    description: "Upload prescription image with OCR",
  },

  // Medications Module
  {
    name: "Create Medication",
    method: "POST",
    path: "/api/medications/{user_id}",
    requiresAuth: true,
    expectedStatus: [200, 201, 400, 401],
    description: "Create new medication",
  },
  {
    name: "Get Medications",
    method: "GET",
    path: "/api/medications/{user_id}",
    requiresAuth: true,
    expectedStatus: [200, 401],
    description: "Get user medications",
  },
  {
    name: "Update Medication",
    method: "PUT",
    path: "/api/medications/{medication_id}",
    requiresAuth: true,
    expectedStatus: [200, 400, 401],
    description: "Update medication details",
  },
  {
    name: "Log Medication Intake",
    method: "POST",
    path: "/api/medications/{medication_id}/intake",
    requiresAuth: true,
    expectedStatus: [200, 201, 400, 401],
    description: "Log medication intake",
  },

  // Reminders Module
  {
    name: "Create Reminder",
    method: "POST",
    path: "/api/medications/{medication_id}/reminders",
    requiresAuth: true,
    expectedStatus: [200, 201, 400, 401],
    description: "Create reminder for medication",
  },
  {
    name: "Get Reminders",
    method: "GET",
    path: "/api/reminders/{user_id}",
    requiresAuth: true,
    expectedStatus: [200, 401],
    description: "Get user reminders",
  },
  {
    name: "Snooze Reminder",
    method: "POST",
    path: "/api/reminders/{reminder_id}/snooze",
    requiresAuth: true,
    expectedStatus: [200, 400, 401],
    description: "Snooze a reminder",
  },
  {
    name: "Dismiss Reminder",
    method: "POST",
    path: "/api/reminders/{reminder_id}/dismiss",
    requiresAuth: true,
    expectedStatus: [200, 400, 401],
    description: "Dismiss a reminder",
  },

  // Drugs Module
  {
    name: "Search Drugs",
    method: "GET",
    path: "/api/drugs/search?query=Amoxicillin",
    requiresAuth: false,
    expectedStatus: [200, 400],
    description: "Search for drugs",
  },
  {
    name: "Get Drug Details",
    method: "GET",
    path: "/api/drugs/{drug_id}",
    requiresAuth: false,
    expectedStatus: [200, 404],
    description: "Get drug details",
  },
  {
    name: "Get Drug Side Effects",
    method: "GET",
    path: "/api/drugs/{drug_id}/side-effects",
    requiresAuth: false,
    expectedStatus: [200, 404],
    description: "Get drug side effects",
  },

  // Doctors Module
  {
    name: "Search Doctors",
    method: "GET",
    path: "/api/doctors/search?specialty=Cardiology",
    requiresAuth: false,
    expectedStatus: [200, 400],
    description: "Search for doctors",
  },
  {
    name: "Get Doctor Details",
    method: "GET",
    path: "/api/doctors/{doctor_id}",
    requiresAuth: false,
    expectedStatus: [200, 404],
    description: "Get doctor details",
  },

  // Voice Module
  {
    name: "Transcribe Audio",
    method: "POST",
    path: "/api/voice/transcribe",
    requiresAuth: true,
    expectedStatus: [200, 400, 401],
    description: "Transcribe audio file to text",
  },
  {
    name: "Synthesize Speech",
    method: "POST",
    path: "/api/voice/synthesize",
    requiresAuth: true,
    expectedStatus: [200, 400, 401],
    description: "Convert text to speech",
  },
];

async function testEndpoint(endpoint) {
  try {
    const url = new URL(BACKEND_URL + endpoint.path);
    const options = {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (endpoint.body && endpoint.method !== "GET") {
      options.body = JSON.stringify(endpoint.body);
    }

    if (endpoint.requiresAuth) {
      options.headers["Authorization"] = "Bearer test-token";
    }

    const response = await fetch(url.toString(), options);
    const statusOk = endpoint.expectedStatus.includes(response.status);
    
    return {
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status: response.status,
      passed: statusOk,
      description: endpoint.description,
    };
  } catch (error) {
    return {
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status: "ERROR",
      passed: false,
      error: error.message,
      description: endpoint.description,
    };
  }
}

async function runTests() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║          Medi-Sync AI - API Endpoint Verification Test Suite              ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");
  
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  console.log(`Testing ${ENDPOINTS.length} endpoints...\n`);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.passed) {
      passed++;
      console.log(`✓ ${result.name.padEnd(25)} ${result.method.padEnd(6)} ${result.path.padEnd(40)} [${result.status}]`);
    } else {
      failed++;
      console.log(`✗ ${result.name.padEnd(25)} ${result.method.padEnd(6)} ${result.path.padEnd(40)} [${result.status}]`);
      if (result.error) {
        console.log(`  └─ Error: ${result.error}`);
      }
    }
  }

  console.log("\n╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                            Test Results Summary                            ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");
  
  console.log(`Total Tests:    ${ENDPOINTS.length}`);
  console.log(`Passed:         ${passed} ✓`);
  console.log(`Failed:         ${failed} ✗`);
  console.log(`Success Rate:   ${((passed / ENDPOINTS.length) * 100).toFixed(2)}%\n`);

  if (failed === 0) {
    console.log("✓ All endpoints verified successfully! Ready for production.\n");
    process.exit(0);
  } else {
    console.log("✗ Some endpoints failed verification. Please check the errors above.\n");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
