// Test backend connectivity
import { api } from '@/lib/api';

export async function testBackendConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await api.get('/health');
    console.log('Health check:', healthResponse);
    
    // Test a simple API endpoint
    const drugsSearchResponse = await api.get('/api/drugs/search?q=paracetamol');
    console.log('Drugs search test:', drugsSearchResponse);
    
    return {
      success: true,
      health: healthResponse,
      search: drugsSearchResponse
    };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}