import React from 'react';
import { ProtectedRoute } from '@/lib/protected-route';
import { OrderDetail } from '@/components/orders/order-detail';

// Simple component for Order Detail Content
function OrderDetailContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OrderDetail />
    </div>
  );
}

// Protected route component
export function ProtectedOrderDetailPage() {
  return (
    <ProtectedRoute 
      path="/orders/:id" 
      component={OrderDetailContent} 
      requiredRole={['admin', 'manager', 'customer']}
    />
  );
}