/**
 * Orders module health check
 * 
 * This module tests the orders functionality including:
 * - Listing orders endpoint
 * - Getting a specific order
 * - Order creation fundamentals
 */

import axios from 'axios';

/**
 * Check the orders module functionality
 */
export async function checkOrdersModule(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test 1: Verify orders endpoint is accessible
    let ordersResponse;
    
    try {
      ordersResponse = await axios.get('http://localhost:5000/api/orders');
      
      if (ordersResponse.status !== 200 || !Array.isArray(ordersResponse.data)) {
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
      return {
        success: false,
        message: 'Orders API is not accessible',
        details: { 
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
    
    // Test 2: Check if we can get a specific order (if any exist)
    let specificOrderTest = { success: false, attempted: false };
    
    if (ordersResponse.data.length > 0) {
      specificOrderTest.attempted = true;
      
      try {
        const orderToCheck = ordersResponse.data[0];
        const orderResponse = await axios.get(`http://localhost:5000/api/orders/${orderToCheck.id}`);
        
        specificOrderTest.success = orderResponse.status === 200 && 
                                   orderResponse.data && 
                                   orderResponse.data.id === orderToCheck.id;
      } catch (error) {
        specificOrderTest.success = false;
      }
    }
    
    // Test 3: Check if API correctly validates order creation requirements
    // We'll send an invalid order to check validation works, but not actually create anything
    let validationTest = { success: false };
    
    try {
      // Intentionally send invalid data to test validation
      await axios.post('http://localhost:5000/api/orders', {
        order: {
          // Missing required fields
          status: 'draft',
        },
        items: []
      });
      
      // If we didn't get an error, validation might not be working correctly
      validationTest.success = false;
    } catch (error) {
      // An error is actually expected here, so it's a good sign
      if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
        validationTest.success = true;
      }
    }
    
    // Test 4: Check recent orders endpoint
    let recentOrdersTest = { success: false };
    
    try {
      const recentResponse = await axios.get('http://localhost:5000/api/orders/recent?limit=3');
      recentOrdersTest.success = recentResponse.status === 200 && Array.isArray(recentResponse.data);
    } catch (error) {
      recentOrdersTest.success = false;
    }
    
    // Determine overall status
    const overallSuccess = 
      (specificOrderTest.attempted ? specificOrderTest.success : true) && 
      validationTest.success && 
      recentOrdersTest.success;
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? `Orders module is functioning correctly with ${ordersResponse.data.length} orders in system` 
        : 'Orders module has issues',
      details: {
        ordersCount: ordersResponse.data.length,
        specificOrderTest,
        validationTest,
        recentOrdersTest
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Orders module check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}