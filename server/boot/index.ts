/**
 * Smart Boot System for Nature Breed Farm
 * 
 * This module orchestrates the startup of application components,
 * verifies their functionality, and provides status reporting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import axios from 'axios';

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Boot status tracking
export interface ComponentStatus {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  timestamp: string;
  details?: any;
}

export interface BootStatus {
  components: ComponentStatus[];
  lastBootTimestamp: string;
  overallStatus: 'success' | 'warning' | 'error' | 'pending';
  environment: string;
}

// Initialize or get current boot status
const STATUS_FILE_PATH = path.join(__dirname, '../../boot-status.json');

function getCurrentStatus(): BootStatus {
  try {
    if (fs.existsSync(STATUS_FILE_PATH)) {
      const statusData = fs.readFileSync(STATUS_FILE_PATH, 'utf-8');
      return JSON.parse(statusData);
    }
  } catch (error) {
    console.error('Error reading status file:', error);
  }

  // Return a fresh status object if file doesn't exist or is corrupted
  return {
    components: [],
    lastBootTimestamp: new Date().toISOString(),
    overallStatus: 'pending',
    environment: process.env.NODE_ENV || 'development'
  };
}

function updateStatus(status: BootStatus): void {
  try {
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error writing status file:', error);
  }
}

function updateComponentStatus(
  status: BootStatus,
  name: string,
  newStatus: 'success' | 'warning' | 'error' | 'pending',
  message: string,
  details?: any
): BootStatus {
  const component = status.components.find(c => c.name === name);
  
  if (component) {
    component.status = newStatus;
    component.message = message;
    component.timestamp = new Date().toISOString();
    if (details) component.details = details;
  } else {
    status.components.push({
      name,
      status: newStatus,
      message,
      timestamp: new Date().toISOString(),
      details
    });
  }

  // Update overall status based on component statuses
  if (status.components.some(c => c.status === 'error')) {
    status.overallStatus = 'error';
  } else if (status.components.some(c => c.status === 'warning')) {
    status.overallStatus = 'warning';
  } else if (status.components.every(c => c.status === 'success')) {
    status.overallStatus = 'success';
  } else {
    status.overallStatus = 'pending';
  }
  
  status.lastBootTimestamp = new Date().toISOString();
  
  return status;
}

// Function to check and log the status of a module
async function checkModuleStatus(
  moduleName: string,
  checkFn: () => Promise<{ success: boolean; message: string; details?: any }>
): Promise<ComponentStatus> {
  console.log(`🔍 Checking ${moduleName} module...`);
  
  try {
    const result = await checkFn();
    const status = result.success ? 'success' : 'error';
    
    console.log(`${status === 'success' ? '✅' : '❌'} ${moduleName}: ${result.message}`);
    
    return {
      name: moduleName,
      status,
      message: result.message,
      timestamp: new Date().toISOString(),
      details: result.details
    };
  } catch (error) {
    console.error(`❌ ${moduleName} check failed with error:`, error);
    
    return {
      name: moduleName,
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

// Import our new check modules
import { checkOrdersModule } from './orders-check';
import { checkCheckoutFlow } from './checkout-check';
import { exportHealthSnapshot } from './health-snapshot';
import { checkBreedingSystem } from './breeding-check';
import { checkPages } from './pages-check';

// Main boot function
export async function bootSystem(): Promise<BootStatus> {
  console.log('🚀 Booting Nature Breed Farm Application...');
  
  // Get current status
  let status = getCurrentStatus();
  
  // Reset pending statuses
  status.components = status.components.filter(c => c.status !== 'pending');
  status.overallStatus = 'pending';
  updateStatus(status);
  
  // Check database connection
  const dbStatus = await checkModuleStatus('database', async () => {
    try {
      // Test query to check database connection
      await db.execute(sql`SELECT 1 AS result`);
      return {
        success: true,
        message: 'Database connection successful'
      };
    } catch (error) {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  status = updateComponentStatus(
    status,
    dbStatus.name,
    dbStatus.status as any,
    dbStatus.message,
    dbStatus.details
  );
  updateStatus(status);
  
  // Check API endpoints health
  const apiStatus = await checkModuleStatus('api-endpoints', async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      return {
        success: response.status === 200,
        message: 'API endpoints are accessible',
        details: response.data
      };
    } catch (error) {
      // If health endpoint doesn't exist, try another common endpoint
      try {
        const fallbackResponse = await axios.get('http://localhost:5000/api/products');
        return {
          success: true,
          message: 'API products endpoint is accessible',
          details: { note: 'Health endpoint not found but products endpoint works' }
        };
      } catch (fallbackError) {
        throw new Error(`API endpoints check failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  
  status = updateComponentStatus(
    status,
    apiStatus.name,
    apiStatus.status as any,
    apiStatus.message,
    apiStatus.details
  );
  updateStatus(status);
  
  // Check Auth module specifically
  const authStatus = await checkModuleStatus('auth', async () => {
    try {
      // Try a test login with admin credentials
      const response = await axios.post('http://localhost:5000/api/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      return {
        success: response.status === 200,
        message: 'Auth system is working properly',
        details: { userId: response.data?.id }
      };
    } catch (error) {
      // If unauthorized or invalid credentials, auth is still working
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return {
          success: true,
          message: 'Auth system correctly handled authentication attempt',
        };
      }
      throw new Error(`Auth system check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  status = updateComponentStatus(
    status,
    authStatus.name,
    authStatus.status as any,
    authStatus.message,
    authStatus.details
  );
  updateStatus(status);
  
  // Check Shop module
  const shopStatus = await checkModuleStatus('shop', async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      const products = response.data;
      
      return {
        success: Array.isArray(products) && products.length > 0,
        message: `Shop API is working with ${products.length} products available`,
        details: { productCount: products.length }
      };
    } catch (error) {
      throw new Error(`Shop API check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  status = updateComponentStatus(
    status,
    shopStatus.name,
    shopStatus.status as any,
    shopStatus.message,
    shopStatus.details
  );
  updateStatus(status);
  
  // Check Orders module
  const ordersStatus = await checkModuleStatus('orders', async () => {
    return await checkOrdersModule();
  });
  
  status = updateComponentStatus(
    status,
    ordersStatus.name,
    ordersStatus.status as any,
    ordersStatus.message,
    ordersStatus.details
  );
  updateStatus(status);
  
  // Check Checkout flow
  const checkoutStatus = await checkModuleStatus('checkout', async () => {
    return await checkCheckoutFlow();
  });
  
  status = updateComponentStatus(
    status,
    checkoutStatus.name,
    checkoutStatus.status as any,
    checkoutStatus.message,
    checkoutStatus.details
  );
  updateStatus(status);
  
  // Check Animal Breeding module
  const breedingStatus = await checkModuleStatus('breeding', async () => {
    const result = await checkBreedingSystem();
    return {
      success: result.status === 'success',
      message: result.message,
      details: result.details
    };
  });
  
  status = updateComponentStatus(
    status,
    breedingStatus.name,
    breedingStatus.status as any,
    breedingStatus.message,
    breedingStatus.details
  );
  updateStatus(status);
  
  // Check Application Pages and their API endpoints
  const pagesStatus = await checkModuleStatus('pages', async () => {
    return await checkPages();
  });
  
  status = updateComponentStatus(
    status,
    pagesStatus.name,
    pagesStatus.status as any,
    pagesStatus.message,
    pagesStatus.details
  );
  updateStatus(status);
  
  // Final status report
  console.log('\n📊 Boot Status Report:');
  console.log(`Overall: ${status.overallStatus === 'success' ? '✅' : status.overallStatus === 'warning' ? '⚠️' : '❌'} ${status.overallStatus.toUpperCase()}`);
  
  status.components.forEach(component => {
    const icon = component.status === 'success' ? '✅' : component.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${component.name}: ${component.message}`);
  });
  
  // If boot is successful, export a health snapshot
  if (status.overallStatus === 'success') {
    const snapshotResult = exportHealthSnapshot(status);
    if (snapshotResult.success) {
      console.log(`📸 Health snapshot exported: ${snapshotResult.timestamp}`);
    }
  }
  
  return status;
}

// Function to expose boot status via API
export function getBootStatus(): BootStatus {
  return getCurrentStatus();
}

// Direct execution isn't available in ES modules in the same way as CommonJS
// We'll use the CLI script (cli.ts) for direct execution instead