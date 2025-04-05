/**
 * Pages Health Check Module
 * 
 * This module verifies that all configured application pages are available
 * and their associated API endpoints are working correctly.
 */
import { BootCheckResult } from './types';

import axios from 'axios';

interface PageCheckResult {
  page: string;
  apiEndpoint?: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface PageConfig {
  name: string;
  route: string;
  apiEndpoint?: string;
  authRequired?: boolean;
}

// Core pages that should be checked
const CORE_PAGES: PageConfig[] = [
  { name: 'Home', route: '/' },
  { name: 'Shop', route: '/shop', apiEndpoint: '/api/products' },
  { name: 'Products', route: '/products', apiEndpoint: '/api/products' },
  { name: 'Transactions', route: '/transactions', apiEndpoint: '/api/transactions' },
  { name: 'Reports', route: '/reports', apiEndpoint: '/api/reports' },
  { name: 'Rabbit Breeding', route: '/rabbit-breeding', apiEndpoint: '/api/animals' },
  { name: 'AI Assistant', route: '/ai-assistant', apiEndpoint: '/api/ai/chat' },
  { name: 'Settings', route: '/settings' },
  { name: 'Status', route: '/status', apiEndpoint: '/api/health' },
  { name: 'Auth', route: '/auth', apiEndpoint: '/api/login' },
  { name: 'Onboarding', route: '/onboarding' }
];

export async function checkPages(): Promise<BootCheckResult> {
  const results: PageCheckResult[] = [];
  const BASE_URL = 'http://localhost:5000';
  
  // Track critical page failures
  let criticalPagesFailed = false;
  let checkedCount = 0;
  let passedCount = 0;
  
  // For each page, check if the associated API endpoint works
  for (const page of CORE_PAGES) {
    try {
      // Skip pages without API endpoints
      if (!page.apiEndpoint) {
        results.push({
          page: page.route,
          status: 'success',
          message: `${page.name} page route is configured (no API to verify)`
        });
        checkedCount++;
        passedCount++;
        continue;
      }
      
      checkedCount++;
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}${page.apiEndpoint}`,
        // Don't fail on auth required responses - that means the endpoint exists
        validateStatus: status => 
          (page.authRequired && status === 401) || 
          (status >= 200 && status < 300)
      });
      
      results.push({
        page: page.route,
        apiEndpoint: page.apiEndpoint,
        status: 'success',
        message: `${page.name} page API endpoint is working (${response.status})`,
        details: { statusCode: response.status }
      });
      passedCount++;
    } catch (error) {
      criticalPagesFailed = true;
      results.push({
        page: page.route,
        apiEndpoint: page.apiEndpoint,
        status: 'error',
        message: `${page.name} page API endpoint check failed`,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }
  
  // Format overall message
  const message = criticalPagesFailed 
    ? `Pages check failed: ${passedCount}/${checkedCount} pages verified`
    : `Pages check passed: ${passedCount}/${checkedCount} pages verified`;
  
  return {
    status: criticalPagesFailed ? 'error' : 'success',
    message,
    details: { results }
  };
}