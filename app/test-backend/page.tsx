'use client';

import { useState } from 'react';
import { runIntegrationTests, quickEndpointTests } from '@/lib/backend-integration-test';
import { BACKEND_URL } from '@/lib/api';

export default function BackendTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      const results = await runIntegrationTests();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Test execution failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTests = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      await quickEndpointTests();
      setTestResults({ message: 'Quick tests completed. Check browser console for details.' });
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Quick test execution failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Backend Integration Testing
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Backend URL
              </label>
              <p className="text-sm bg-gray-100 dark:bg-gray-700 rounded p-2 font-mono">
                {BACKEND_URL}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Environment
              </label>
              <p className="text-sm bg-gray-100 dark:bg-gray-700 rounded p-2">
                {process.env.NODE_ENV || 'development'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Running...' : 'Run Full Integration Tests'}
            </button>
            <button
              onClick={runQuickTests}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Running...' : 'Run Quick Endpoint Tests'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Open browser DevTools Console to see detailed test output
          </p>
        </div>

        {testResults && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}