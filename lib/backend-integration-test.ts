// Comprehensive backend integration test
import { usersApi } from '@/services/api/users';
import { drugsApi } from '@/services/api/drugs';
import { healthApi } from '@/services/api/health';
import { prescriptionsApi } from '@/services/api/prescriptions';
import { medicationsApi } from '@/services/api/medications';
import { BACKEND_URL } from '@/lib/api';

export class BackendIntegrationTester {
  private results: { [key: string]: any } = {};

  async runAllTests() {
    console.log('🚀 Starting Backend Integration Tests...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    
    await this.testHealth();
    await this.testDrugsSearch();
    await this.testAuthEndpoints();
    
    return this.results;
  }

  private async testHealth() {
    console.log('\n1. Testing Health Endpoint...');
    try {
      const response = await healthApi.check();
      this.results.health = {
        success: true,
        status: response.status,
        data: response.data
      };
      console.log('✅ Health check passed:', response);
    } catch (error) {
      this.results.health = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.error('❌ Health check failed:', error);
    }
  }

  private async testDrugsSearch() {
    console.log('\n2. Testing Drugs Search...');
    try {
      const response = await drugsApi.search('paracetamol');
      this.results.drugsSearch = {
        success: true,
        status: response.status,
        data: response.data,
        resultsCount: Array.isArray(response.data?.results) ? response.data.results.length : 0
      };
      console.log('✅ Drugs search passed:', response);
    } catch (error) {
      this.results.drugsSearch = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.error('❌ Drugs search failed:', error);
    }
  }

  private async testAuthEndpoints() {
    console.log('\n3. Testing Auth Endpoints (Structure Only)...');
    try {
      // We'll test the endpoint structure without actual credentials
      // This should return a 400 or 422 (validation error), not 404
      await usersApi.login({ email: 'test@test.com', password: 'test' });
    } catch (error: any) {
      if (error?.status === 422 || error?.status === 400 || error?.status === 401) {
        this.results.authEndpoints = {
          success: true,
          message: 'Auth endpoints are responding (validation error as expected)',
          status: error.status
        };
        console.log('✅ Auth endpoints are properly configured');
      } else if (error?.status === 404) {
        this.results.authEndpoints = {
          success: false,
          error: 'Auth endpoints not found (404)',
          status: error.status
        };
        console.error('❌ Auth endpoints not found');
      } else {
        this.results.authEndpoints = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: error?.status
        };
        console.error('❌ Auth endpoint test failed:', error);
      }
    }
  }

  async testSpecificEndpoint(endpoint: string, method = 'GET', data?: any) {
    console.log(`\n🔍 Testing specific endpoint: ${method} ${endpoint}`);
    try {
      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'post':
          response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data ? JSON.stringify(data) : undefined
          });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      };

      console.log(response.ok ? '✅' : '❌', 'Response:', result);
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.error('❌ Request failed:', result);
      return result;
    }
  }
}

// Usage example:
export async function runIntegrationTests() {
  const tester = new BackendIntegrationTester();
  return await tester.runAllTests();
}

// Quick endpoint tests
export async function quickEndpointTests() {
  const tester = new BackendIntegrationTester();
  
  console.log('🧪 Running Quick Endpoint Tests...');
  
  const tests = [
    { endpoint: '/health', method: 'GET' },
    { endpoint: '/api/drugs/search?q=paracetamol', method: 'GET' },
    { endpoint: '/api/users/login', method: 'POST', data: { email: 'test', password: 'test' } },
  ];

  for (const test of tests) {
    await tester.testSpecificEndpoint(test.endpoint, test.method, test.data);
  }
}