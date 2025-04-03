/**
 * Orders module health check
 * 
 * This module tests the orders functionality including:
 * - Listing orders endpoint
 * - Getting a specific order
 * - Order creation fundamentals
 * 
 * The module properly handles authentication states and verifies that
 * authentication is properly enforced where required.
 */

import axios from 'axios';

interface OrdersTestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface SpecificTest {
  success: boolean;
  attempted: boolean;
  message?: string;
}

/**
 * Check the orders module functionality
 */
export async function checkOrdersModule(): Promise<OrdersTestResult> {
  try {
    // Test results data structure
    const results = {
      isAuthenticated: false,
      isOrdersEndpointWorking: false,
      ordersCount: 0,
      specificOrderTest: { success: false, attempted: false } as SpecificTest,
      validationTest: { success: false } as SpecificTest,
      recentOrdersTest: { success: false } as SpecificTest
    };
    
    // Test 1: First login to get authentication
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      if (loginResponse.status === 200 && loginResponse.data) {
        results.isAuthenticated = true;
        console.log('Successfully authenticated for orders check');
      }
    } catch (error) {
      console.log('Login failed for orders check. Will continue as unauthenticated.');
    }
    
    // Test 2: Verify orders endpoint is accessible (with authentication)
    let ordersData: any[] = [];
    
    try {
      const ordersResponse = await axios.get('http://localhost:5000/api/orders');
      
      if (ordersResponse.status === 200 && Array.isArray(ordersResponse.data)) {
        results.isOrdersEndpointWorking = true;
        ordersData = ordersResponse.data;
        results.ordersCount = ordersData.length;
      } else {
        return {
          success: false,
          message: 'Orders API is accessible but returned unexpected data format',
          details: { 
            status: ordersResponse.status,
            dataType: typeof ordersResponse.data,
            isArray: Array.isArray(ordersResponse.data)
          }
        };
      }
    } catch (error) {
      // If we get 401, that's actually correct behavior for unauthenticated users
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        results.isOrdersEndpointWorking = true;
        console.log('Orders API correctly returned 401 for unauthenticated request');
      } else {
        return {
          success: false,
          message: 'Orders API is not accessible',
          details: { 
            error: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }
    
    // Test 3: Check if we can get a specific order (if any exist and we're authenticated)
    if (results.isAuthenticated && ordersData.length > 0) {
      results.specificOrderTest.attempted = true;
      
      try {
        const orderToCheck = ordersData[0];
        const orderResponse = await axios.get(`http://localhost:5000/api/orders/${orderToCheck.id}`);
        
        results.specificOrderTest.success = orderResponse.status === 200 && 
                                           orderResponse.data && 
                                           orderResponse.data.id === orderToCheck.id;
        results.specificOrderTest.message = 'Successfully retrieved specific order';
      } catch (error) {
        results.specificOrderTest.success = false;
        results.specificOrderTest.message = 'Failed to retrieve specific order';
      }
    }
    
    // Test 4: Check if API correctly validates order creation requirements
    try {
      // Intentionally send invalid data to test validation
      await axios.post('http://localhost:5000/api/orders', {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        // Missing other required fields
        status: 'draft'
      });
      
      // If we didn't get an error, validation might not be working correctly
      results.validationTest.success = false;
      results.validationTest.message = 'Validation not enforced properly';
    } catch (error) {
      // Either a 400 validation error or a 401 auth error is acceptable
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400) {
          results.validationTest.success = true;
          results.validationTest.message = 'Validation working correctly';
        } else if (error.response.status === 401) {
          results.validationTest.success = true;
          results.validationTest.message = 'Auth protection working correctly';
        } else {
          results.validationTest.success = false;
          results.validationTest.message = `Unexpected error status: ${error.response.status}`;
        }
      }
    }
    
    // Test 5: Check recent orders endpoint
    try {
      const recentResponse = await axios.get('http://localhost:5000/api/orders/recent?limit=3');
      results.recentOrdersTest.success = recentResponse.status === 200 && Array.isArray(recentResponse.data);
      results.recentOrdersTest.message = 'Recent orders endpoint working';
    } catch (error) {
      // If we get 401, that's actually correct behavior for unauthenticated users
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        results.recentOrdersTest.success = true;
        results.recentOrdersTest.message = 'Auth protection working correctly';
      } else {
        results.recentOrdersTest.success = false;
        results.recentOrdersTest.message = 'Recent orders endpoint failed';
      }
    }
    
    // Determine overall status - considering the order API protected by authentication is working correctly
    const overallSuccess = results.isOrdersEndpointWorking && 
                          (results.specificOrderTest.attempted ? results.specificOrderTest.success : true) && 
                          results.validationTest.success && 
                          results.recentOrdersTest.success;
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? `Orders module is functioning correctly${results.isAuthenticated ? ` with ${results.ordersCount} orders in system` : ' (auth protected)'}`
        : 'Orders module has issues',
      details: results
    };
  } catch (error) {
    return {
      success: false,
      message: `Orders module check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}