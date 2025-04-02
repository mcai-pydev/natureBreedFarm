import React from 'react';
import { ProtectedRoute } from '@/lib/protected-route';
import { OrderHistory } from '@/components/orders/order-history';

// Simple component for Order History Content
function OrderHistoryContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      <OrderHistory />
    </div>
  );
}

// Protected route component
export function ProtectedOrderHistoryPage() {
  return (
    <ProtectedRoute 
      path="/orders" 
      component={OrderHistoryContent} 
      requiredRole={['admin', 'manager', 'customer']}
    />
  );
}