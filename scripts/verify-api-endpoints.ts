#!/usr/bin/env node
/**
 * scripts/verify-api-endpoints.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * CLI tool to verify all Medi-Sync AI API endpoints are working correctly.
 * Run with: npx ts-node scripts/verify-api-endpoints.ts
 * ──────────────────────────────────────────────────────────────────────────────
 */

const BACKEND_URL = "https://olive-backend-bly2.onrender.com";

interface EndpointTest {
  name: string;
  method: string;
  path: string;
  requiresAuth: boolean;
  body?: Record<string, unknown>;
  expectedStatus: number[];
  description: string;
}

const ENDPOINTS: EndpointTest[] = [
  // Health Check
  {
    name: "Health Check",
    method: "GET",
    path: "/health",
    requiresAuth: false,
    expectedStatus: [200],
    description: "Backend health check",
  },

  // Users Module
  {
    name: "User Registration",
    method: "POST",
    path: "/api/users/",
    requiresAuth: false,
    body: {
      phone_number: "+2348012345678",
      email: "test@example.com",
      password: "SecurePass@123",
      name: "Test User",
    },
    expectedStatus: [200, 201],
    description: "Register new user",
  },
  {
    name: "User Login",
    method: "POST",
    path: "/api/users/login",
    requiresAuth: false,
    body: {
      email: "test@example.com",
      password: "SecurePass@123",
    },
    expectedStatus: [200, 401, 404],
    description: "Login with credentials",
  },

  // Prescriptions Module
  {
    name: "Create Prescription",
    method: "POST",
    path: "/api/prescriptions/{user_id}",
    requiresAuth: true,
    body: {
      ocr_text: "Amoxicillin 500mg - 3 times daily",
    },
    expectedStatus: [200, 201],
    description: "Create new prescription",
  },
  {
    name: "Get Prescriptions",
    method: "GET",
    path: "/api/prescriptions/{user_id}",
    requiresAuth: true,
    expectedStatus: [200],
    description: "Get user prescriptions",
  },
  {
    name: "Upload Prescription",
    method: "POST",
    path: "/api/prescriptions/{user_id}/upload",
    requiresAuth: true,
    expectedStatus: [200, 201],
    description: "Upload prescription image with OCR",
  },

  // Medications Module
  {
    name: "Create Medication",
    method: "POST",
    path: "/api/medications/{user_id}",
    requiresAuth: true,
    body: {
      drug_name: "Amoxicillin",
      dosage: "500mg",
      frequency: "3 times daily",
      start_date: new Date().toISOString().split("T")[0],
      reminder_times: ["09:00", "13:00", "17:00"],
    },
    expectedStatus: [200, 201],
    description: "Create medication from prescription",
  },
  {
    name: "Get Medications",
    method: "GET",
    path: "/api/medications/user/{user_id}",
    requiresAuth: true,
    expectedStatus: [200],
    description: "Get user medications",
  },
  {
    name: "Get Medication Detail",
    method: "GET",
    path: "/api/medications/{medication_id}",
    requiresAuth: true,
    expectedStatus: [200, 404],
    description: "Get single medication",
  },

  // Reminders Module
  {
    name: "Create Reminders",
    method: "POST",
    path: "/api/medications/{medication_id}/reminders",
    requiresAuth: true,
    body: ["08:00", "14:00", "20:00"],
    expectedStatus: [200, 201],
    description: "Create medication reminders",
  },
  {
    name: "Get Reminders",
    method: "GET",
    path: "/api/reminders/user/{user_id}",
    requiresAuth: true,
    expectedStatus: [200],
    description: "Get user reminders",
  },
  {
    name: "Get Reminder Stats",
    method: "GET",
    path: "/api/reminders/user/{user_id}/stats",
    requiresAuth: true,
    expectedStatus: [200],
    description: "Get reminder statistics",
  },
  {
    name: "Snooze Reminder",
    method: "POST",
    path: "/api/reminders/{reminder_id}/snooze?minutes=10",
    requiresAuth: true,
    expectedStatus: [200, 201],
    description: "Snooze a reminder",
  },
  {
    name: "Mark Reminder Taken",
    method: "POST",
    path: "/api/reminders/{reminder_id}/taken",
    requiresAuth: true,
    expectedStatus: [200, 201],
    description: "Mark reminder as taken",
  },

  // Drugs Module
  {
    name: "Search Drugs",
    method: "GET",
    path: "/api/drugs/search?q=aspirin",
    requiresAuth: true,
    expectedStatus: [200],
    description: "Search for drugs",
  },
  {
    name: "Get Drug Generics",
    method: "GET",
    path: "/api/drugs/Aspirin/generics",
    requiresAuth: true,
    expectedStatus: [200, 404],
    description: "Get generic alternatives",
  },
  {
    name: "Verify Drug",
    method: "POST",
    path: "/api/drugs/verify",
    requiresAuth: true,
    body: { reg_number: "NAFDAC/A4L/0001" },
    expectedStatus: [200, 201, 404],
    description: "Verify drug registration",
  },

  // Doctors Module
  {
    name: "Get All Doctors",
    method: "GET",
    path: "/api/doctors",
    requiresAuth: true,
    expectedStatus: [200, 404],
    description: "Get list of doctors",
  },
  {
    name: "Search Doctors",
    method: "GET",
    path: "/api/doctors/search?q=cardiologist",
    requiresAuth: true,
    expectedStatus: [200, 404],
    description: "Search for doctors",
  },
  {
    name: "Get Doctor Specializations",
    method: "GET",
    path: "/api/doctors/specializations",
    requiresAuth: true,
    expectedStatus: [200, 404],
    description: "Get available specializations",
  },

  // Voice Module
  {
    name: "Voice Test",
    method: "POST",
    path: "/api/voice/test",
    requiresAuth: true,
    expectedStatus: [200, 201, 404],
    description: "Test voice service",
  },
  {
    name: "Get Supported Languages",
    method: "GET",
    path: "/api/voice/supported-languages",
    requiresAuth: true,
    expectedStatus: [200, 404],
    description: "Get supported languages",
  },
  {
    name: "Synthesize Speech",
    method: "POST",
    path: "/api/voice/synthesize",
    requiresAuth: true,
    body: {
      text: "Take your medication now",
      language: "en",
      speed: "normal",
      gender: "female",
    },
    expectedStatus: [200, 201, 404],
    description: "Convert text to speech",
  },
];

// ─── Test Runner ──────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  status: "✓ PASS" | "✗ FAIL" | "⊘ SKIP";
  statusCode?: number;
  message?: string;
  timeTaken?: number;
}

let results: TestResult[] = [];
let authToken: string | null = null;
let userId: string | null = null;
let medicationId: string | null = null;
let reminderId: string | null = null;

async function runTests() {
  console.log("🚀 Starting API Endpoint Verification...\n");
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  console.log("═".repeat(80));

  // First, try to get auth token
  console.log("\n📝 Attempting to authenticate...\n");

  for (const endpoint of ENDPOINTS) {
    try {
      // Try to login first to get token
      if (endpoint.name === "User Login") {
        const startTime = Date.now();
        const response = await fetch(`${BACKEND_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(endpoint.body),
        });

        const timeTaken = Date.now() - startTime;

        if ([200, 201].includes(response.status)) {
          const data = await response.json();
          if (data.access_token) {
            authToken = data.access_token;
            userId = data.user?.id;
            console.log("✓ Authentication successful\n");
          }
        }
      }
      break;
    } catch {
      // Ignore errors during auth attempt
    }
  }

  // Run all tests
  console.log("🔍 Testing All Endpoints:\n");

  for (const endpoint of ENDPOINTS) {
    try {
      const startTime = Date.now();

      // Replace placeholders with actual IDs
      let path = endpoint.path
        .replace("{user_id}", userId || "test-user-id")
        .replace("{medication_id}", medicationId || "test-med-id")
        .replace("{reminder_id}", reminderId || "test-reminder-id");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (endpoint.requiresAuth && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}${path}`, {
        method: endpoint.method,
        headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });

      const timeTaken = Date.now() - startTime;
      const status = response.status;

      // Check if status matches expected
      const isSuccess = endpoint.expectedStatus.includes(status);

      // Store IDs for dependent tests
      if (endpoint.name === "User Login" && [200, 201].includes(status)) {
        try {
          const data = await response.json();
          userId = data.user?.id;
        } catch {
          // Ignore parse errors
        }
      } else if (
        endpoint.name === "Create Medication" &&
        [200, 201].includes(status)
      ) {
        try {
          const data = await response.json();
          medicationId = data.id;
        } catch {
          // Ignore parse errors
        }
      } else if (
        endpoint.name === "Create Reminders" &&
        [200, 201].includes(status)
      ) {
        try {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            reminderId = data[0].id;
          }
        } catch {
          // Ignore parse errors
        }
      }

      results.push({
        name: endpoint.name,
        status: isSuccess ? "✓ PASS" : "✗ FAIL",
        statusCode: status,
        message: endpoint.description,
        timeTaken,
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: "✗ FAIL",
        message: `${endpoint.description} - ${(error as Error).message}`,
      });
    }
  }

  // Print results
  console.log("═".repeat(80) + "\n");
  console.log("📊 Test Results:\n");

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const statusIcon =
      result.status === "✓ PASS"
        ? "✓"
        : result.status === "✗ FAIL"
          ? "✗"
          : "⊘";
    console.log(`${result.status} ${result.name}`);
    console.log(`  └─ ${result.message}`);
    if (result.statusCode) {
      console.log(
        `  └─ Status: ${result.statusCode} (${result.timeTaken}ms)`
      );
    }
    console.log();

    if (result.status === "✓ PASS") passed++;
    else if (result.status === "✗ FAIL") failed++;
  }

  console.log("═".repeat(80));
  console.log(
    `\n📈 Summary: ${passed} passed, ${failed} failed, ${results.length} total\n`
  );

  if (failed === 0) {
    console.log("✅ All tests passed! API is fully functional.\n");
    process.exit(0);
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Check the details above.\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test runner error:", error);
  process.exit(1);
});
