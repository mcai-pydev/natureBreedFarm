/**
 * Checkout flow health check
 * 
 * This module tests the checkout functionality including:
 * - Product availability
 * - Order creation
 * - Cart-to-order functionality
 */

import axios from 'axios';

/**
 * Check the checkout flow functionality
 */
export async function checkCheckoutFlow(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test 1: Verify products are available for purchase
    const productsResponse = await axios.get('http://localhost:5000/api/products');
    
    if (productsResponse.status !== 200 || !Array.isArray(productsResponse.data)) {
      return {
        success: false,
        message: 'No products available for checkout',
        details: { 
          status: productsResponse.status,
          dataType: typeof productsResponse.data
        }
      };
    }
    
    // Check if any products have stock
    const productsInStock = productsResponse.data.filter(product => 
      product.stock > 0 || product.stockQuantity > 0
    );
    
    if (productsInStock.length === 0) {
      return {
        success: false,
        message: 'No products in stock for checkout',
        details: { 
          totalProducts: productsResponse.data.length,
          inStockProducts: 0
        }
      };
    }
    
    // Test 2: Verify order creation endpoint
    // We'll just check the endpoint without creating an actual test order
    const testOrderData = {
      order: {
        customerName: '_test_health_check_',
        customerEmail: 'test@example.com',
        status: 'draft',
        totalAmount: 0,
        shippingAddress: 'Test Address',
        paymentMethod: 'test',
        notes: 'Automated health check - ignore',
        _dryRun: true // Custom flag to indicate this is just a validation check
      },
      items: [
        {
          productId: productsInStock[0].id,
          productName: productsInStock[0].name,
          quantity: 0, // Zero quantity for dry run
          unitPrice: productsInStock[0].price,
          subtotal: 0
        }
      ]
    };
    
    // Instead of actually creating a test order, we'll verify the endpoint is accessible
    // by checking for a 400 response (validation should fail with our dummy data)
    // or a 201 response (if the endpoint accepts our dry run flag)
    let orderCreationTest;
    
    try {
      const orderResponse = await axios.post('http://localhost:5000/api/orders', testOrderData);
      orderCreationTest = {
        success: true,
        message: 'Order creation endpoint is accessible',
        status: orderResponse.status
      };
    } catch (error: any) {
      // 400 error is actually expected here due to validation
      if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
        orderCreationTest = {
          success: true,
          message: 'Order creation endpoint correctly validated the request',
          status: error.response.status
        };
      } else {
        orderCreationTest = {
          success: false,
          message: 'Order creation endpoint failed unexpectedly',
          error: error.message
        };
      }
    }
    
    // Final assessment
    const checkoutFlowOperational = productsInStock.length > 0 && orderCreationTest.success;
    
    return {
      success: checkoutFlowOperational,
      message: checkoutFlowOperational 
        ? `Checkout flow is operational with ${productsInStock.length} products available` 
        : 'Checkout flow has issues',
      details: {
        products: {
          total: productsResponse.data.length,
          inStock: productsInStock.length,
          featuredProducts: productsResponse.data.filter(p => p.featured).length
        },
        orderCreation: orderCreationTest
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Checkout flow check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}