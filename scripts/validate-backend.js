#!/usr/bin/env node
/**
 * Backend Validation Script
 * Tests the backend connectivity and endpoints
 * Run with: node scripts/validate-backend.js
 */

const BACKEND_URL = "https://olive-backend-bly2.onrender.com";

async function validateBackend() {
  console.log("🔍 Validating Backend Connectivity...");
  console.log(`📡 Target: ${BACKEND_URL}`);
  
  const tests = [
    {
      name: "Health Check",
      endpoint: "/health",
      method: "GET",
      expectedStatus: [200, 204]
    },
    {
      name: "Drugs Search",
      endpoint: "/api/drugs/search?q=paracetamol",
      method: "GET",
      expectedStatus: [200, 422] // 422 if validation fails, but endpoint exists
    },
    {
      name: "Auth Login Endpoint",
      endpoint: "/api/users/login",
      method: "POST",
      body: { email: "test", password: "test" },
      expectedStatus: [400, 401, 422] // Should reject invalid credentials, not 404
    },
    {
      name: "Users Endpoint",
      endpoint: "/api/users/",
      method: "POST",
      body: { phone_number: "test", password: "test" },
      expectedStatus: [400, 422] // Should validate, not 404
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(`${BACKEND_URL}${test.endpoint}`, options);
      
      const isExpectedStatus = test.expectedStatus.includes(response.status);
      const result = {
        test: test.name,
        success: isExpectedStatus,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      };

      if (isExpectedStatus) {
        console.log(`✅ ${test.name}: ${response.status} ${response.statusText}`);
      } else {
        console.log(`❌ ${test.name}: ${response.status} ${response.statusText} (expected: ${test.expectedStatus.join(' or ')})`);
        
        // Try to get error details
        try {
          const errorText = await response.text();
          if (errorText) {
            console.log(`   Error details: ${errorText.substring(0, 200)}...`);
            result.error = errorText.substring(0, 200);
          }
        } catch (e) {
          console.log(`   Could not read error details: ${e.message}`);
        }
      }

      results.push(result);

    } catch (error) {
      console.log(`❌ ${test.name}: Network error - ${error.message}`);
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
    }
  }

  console.log("\n📊 Summary:");
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log("\n🎉 All tests passed! Backend integration should work correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Check the backend URL and CORS configuration.");
  }

  return results;
}

// Check if running as script or being imported
if (typeof require !== 'undefined' && require.main === module) {
  validateBackend().catch(console.error);
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateBackend };
}