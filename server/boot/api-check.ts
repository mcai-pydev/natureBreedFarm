/**
 * API endpoints health check
 */

import axios from 'axios';

interface EndpointCheckResult {
  endpoint: string;
  status: 'success' | 'error';
  response?: any;
  error?: string;
}

interface EndpointConfig {
  method: string;
  url: string;
  name: string;
  data: any;
}

// Critical endpoints that should be checked
const CRITICAL_ENDPOINTS: EndpointConfig[] = [
  { method: 'GET', url: '/api/products', name: 'products', data: undefined },
  { method: 'POST', url: '/api/login', name: 'auth', data: { username: 'test', password: 'test123' } }
];

// Optional endpoints that are checked but don't cause overall failure
const OPTIONAL_ENDPOINTS: EndpointConfig[] = [
  { method: 'GET', url: '/api/health', name: 'health', data: undefined },
  { method: 'GET', url: '/api/orders', name: 'orders', data: undefined }
];

export async function checkApiEndpoints() {
  const results: EndpointCheckResult[] = [];
  const BASE_URL = 'http://localhost:5000';
  let criticalEndpointsFailed = false;
  
  // Check critical endpoints
  for (const endpoint of CRITICAL_ENDPOINTS) {
    try {
      const response = await axios({
        method: endpoint.method.toLowerCase() as any,
        url: `${BASE_URL}${endpoint.url}`,
        data: endpoint.data,
        // Don't throw on 401 for auth endpoints - that's actually a success
        // if we're testing with invalid credentials
        validateStatus: status => 
          (endpoint.name === 'auth' && status === 401) || 
          (status >= 200 && status < 300)
      });
      
      results.push({
        endpoint: endpoint.url,
        status: 'success',
        response: response.status
      });
    } catch (error) {
      criticalEndpointsFailed = true;
      results.push({
        endpoint: endpoint.url,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Check optional endpoints
  for (const endpoint of OPTIONAL_ENDPOINTS) {
    try {
      const response = await axios({
        method: endpoint.method.toLowerCase() as any,
        url: `${BASE_URL}${endpoint.url}`,
        data: endpoint.data,
        // We don't want to fail the whole check if optional endpoints fail
        validateStatus: () => true
      });
      
      results.push({
        endpoint: endpoint.url,
        status: response.status >= 200 && response.status < 300 ? 'success' : 'error',
        response: response.status
      });
    } catch (error) {
      results.push({
        endpoint: endpoint.url,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Format a message about the API status
  const criticalCount = CRITICAL_ENDPOINTS.length;
  const successfulCritical = results
    .filter(r => CRITICAL_ENDPOINTS.some(e => e.url === r.endpoint) && r.status === 'success')
    .length;
  
  const message = criticalEndpointsFailed 
    ? `API check failed: ${successfulCritical}/${criticalCount} critical endpoints working`
    : `API check passed: ${successfulCritical}/${criticalCount} critical endpoints working`;
  
  return {
    success: !criticalEndpointsFailed,
    message,
    details: { results }
  };
}