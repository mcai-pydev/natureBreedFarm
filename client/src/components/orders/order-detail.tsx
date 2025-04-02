import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, ArrowLeft, Truck, FileText, Download, Edit, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/contexts/responsive-context';

// Order status badge component
const OrderStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

// Order interface
interface Order {
  id: number;
  status: string | null;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  paymentMethod: string;
  subtotal: number;
  customerPhone?: string | null;
  billingAddress?: string | null;
  tax?: number;
  shipping?: number;
  total?: number;
  orderNumber?: string;
  createdAt?: string;
  trackingNumber?: string;
  notes?: string;
}

// Order items interface
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
}

// Combined interface for full order with items
interface FullOrder extends Order {
  items: OrderItem[];
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [newTracking, setNewTracking] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newNotes, setNewNotes] = useState<string>('');

  // Fetch order details
  const { 
    data: order, 
    isLoading, 
    error 
  } = useQuery<FullOrder>({
    queryKey: [`/api/orders/${id}`],
    queryFn: getQueryFn(),
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest(
        'PATCH',
        `/api/orders/${id}`,
        { status: newStatus }
      );
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      toast({
        title: 'Status Updated',
        description: `Order status has been updated to ${newStatus}`,
      });
      setIsEditingStatus(false);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update tracking number mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (trackingNumber: string) => {
      const response = await apiRequest(
        'PATCH',
        `/api/orders/${id}`,
        { trackingNumber }
      );
      if (!response.ok) {
        throw new Error('Failed to update tracking number');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      toast({
        title: 'Tracking Updated',
        description: 'Tracking number has been updated',
      });
      setIsEditingTracking(false);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiRequest(
        'PATCH',
        `/api/orders/${id}`,
        { notes }
      );
      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      toast({
        title: 'Notes Updated',
        description: 'Order notes have been updated',
      });
      setIsEditingNotes(false);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle status update
  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate(newStatus);
  };

  // Handle tracking update
  const handleTrackingUpdate = () => {
    updateTrackingMutation.mutate(newTracking);
  };

  // Handle notes update
  const handleNotesUpdate = () => {
    updateNotesMutation.mutate(newNotes);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p>Error loading order: {error.message}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="mt-2"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 rounded-md">
        <h3 className="text-lg font-medium text-gray-500 mb-2">Order Not Found</h3>
        <p className="text-gray-400 mb-4">The order you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  // Initialize form states with current values
  if (newStatus === '' && order.status) {
    setNewStatus(order.status);
  }

  if (newTracking === '' && order.trackingNumber) {
    setNewTracking(order.trackingNumber);
  }

  if (newNotes === '' && order.notes) {
    setNewNotes(order.notes);
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          asChild
          className="mb-6"
        >
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* Order header section */}
      <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex justify-between items-center'}`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Order {order.orderNumber || `#${order.id}`}
          </h1>
          <p className="text-gray-500">
            Placed on: {order.createdAt 
              ? new Date(order.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) 
              : 'Unknown date'}
          </p>
        </div>
        
        <div className={`${isMobile ? 'w-full' : 'flex items-center space-x-4'}`}>
          {isEditingStatus ? (
            <div className="flex space-x-2 items-center">
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button
                size="sm"
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsEditingStatus(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <OrderStatusBadge status={order.status || 'Unknown'} />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsEditingStatus(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button variant="outline" size="sm" className={isMobile ? 'mt-2 w-full' : ''}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-8'}`}>
        {/* Order details section */}
        <div className={`${isMobile ? '' : 'col-span-2'}`}>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="font-medium">Order Items</h2>
            </div>
            <div className="divide-y">
              {order.items && order.items.length > 0 ? (
                order.items.map(item => (
                  <div key={item.id} className="px-4 py-3 flex items-center space-x-4">
                    {item.productImage && (
                      <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={item.productImage} 
                          alt={item.productName} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.productName}</h3>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  No items in this order
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.shipping !== undefined && (
                <div className="flex justify-between py-1">
                  <span>Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
              )}
              {order.tax !== undefined && (
                <div className="flex justify-between py-1">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 font-bold">
                <span>Total</span>
                <span>${(order.total || order.subtotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer information section */}
        <div className="space-y-6">
          {/* Customer details */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="font-medium">Customer Information</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p>{order.customerName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{order.customerEmail}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p>{order.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping information */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="font-medium">Shipping Information</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Shipping Address</h3>
                <p className="whitespace-pre-line">{order.shippingAddress}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                <p>{order.paymentMethod}</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-500">Tracking Number</h3>
                  {!isEditingTracking && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingTracking(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingTracking ? (
                  <div className="flex mt-1 space-x-2">
                    <input
                      type="text"
                      value={newTracking}
                      onChange={(e) => setNewTracking(e.target.value)}
                      className="flex-grow px-2 py-1 border rounded-md text-sm"
                      placeholder="Enter tracking number"
                    />
                    <Button
                      size="sm"
                      onClick={handleTrackingUpdate}
                      disabled={updateTrackingMutation.isPending}
                    >
                      {updateTrackingMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingTracking(false)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p>{order.trackingNumber || 'Not available'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes section */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h2 className="font-medium">Order Notes</h2>
              {!isEditingNotes && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditingNotes(true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="p-4">
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={newNotes || ''}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                    placeholder="Add notes about this order"
                  ></textarea>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      onClick={handleNotesUpdate}
                      disabled={updateNotesMutation.isPending}
                    >
                      {updateNotesMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingNotes(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 whitespace-pre-line">
                  {order.notes || 'No notes for this order'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}