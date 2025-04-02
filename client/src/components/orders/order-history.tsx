import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import { Loader2, Search, Filter, ArrowLeft, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useResponsive } from '@/contexts/responsive-context';
import { Button } from '@/components/ui/button';

// Status badge component
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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
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
  tax?: number;
  shipping?: number;
  total?: number;
  orderNumber?: string;
  createdAt?: string;
  trackingNumber?: string;
}

export function OrderHistory() {
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const pageSize = 10;

  // Fetch orders
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    queryFn: getQueryFn(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p>Error loading orders: {error.message}</p>
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

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 rounded-md">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No Orders Found</h3>
        <p className="text-gray-400 mb-4">You don't have any orders yet.</p>
        <Button asChild>
          <Link href="/">Browse Products</Link>
        </Button>
      </div>
    );
  }

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
        order.customerName.toLowerCase().includes(searchLower) || 
        order.customerEmail.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortField === 'total') {
        const totalA = a.total || 0;
        const totalB = b.total || 0;
        return sortDirection === 'asc' ? totalA - totalB : totalB - totalA;
      }
      
      // Default sort by ID
      return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
    });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Available status options based on data
  const statusOptions = ['All', ...new Set(orders.map(order => order.status || 'Unknown'))];

  // Render desktop view
  const renderDesktopView = () => (
    <div className="overflow-hidden shadow-md rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => toggleSort('id')}
            >
              <div className="flex items-center">
                Order ID {renderSortIcon('id')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => toggleSort('createdAt')}
            >
              <div className="flex items-center">
                Date {renderSortIcon('createdAt')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => toggleSort('total')}
            >
              <div className="flex items-center">
                Total {renderSortIcon('total')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tracking
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                <Link href={`/orders/${order.id}`}>
                  {order.orderNumber || `#${order.id}`}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.createdAt 
                  ? new Date(order.createdAt).toLocaleDateString() 
                  : 'Unknown date'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <OrderStatusBadge status={order.status || 'Unknown'} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${order.total?.toFixed(2) || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.trackingNumber 
                  ? <span className="text-blue-600">{order.trackingNumber}</span>
                  : <span className="text-gray-400">No tracking</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/orders/${order.id}`}>
                  <div className="text-blue-600 hover:text-blue-900 cursor-pointer">
                    View Details
                  </div>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render mobile view
  const renderMobileView = () => (
    <div className="space-y-4">
      {paginatedOrders.map((order) => (
        <div key={order.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-blue-600">
                <Link href={`/orders/${order.id}`}>
                  {order.orderNumber || `#${order.id}`}
                </Link>
              </p>
              <p className="text-xs text-gray-500">
                {order.createdAt 
                  ? new Date(order.createdAt).toLocaleDateString() 
                  : 'Unknown date'}
              </p>
            </div>
            <OrderStatusBadge status={order.status || 'Unknown'} />
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Customer:</span>
              <span className="text-sm font-medium">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total:</span>
              <span className="text-sm font-medium">${order.total?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tracking:</span>
              <span className="text-sm font-medium">
                {order.trackingNumber 
                  ? <span className="text-blue-600">{order.trackingNumber}</span>
                  : <span className="text-gray-400">No tracking</span>}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <Link href={`/orders/${order.id}`}>
              <div className="w-full block text-center text-blue-600 font-medium text-sm cursor-pointer">
                View Details
              </div>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              {statusOptions.filter(s => s !== 'All').map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Order list */}
      {isMobile ? renderMobileView() : renderDesktopView()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              size="sm"
              variant="outline"
              className="px-2 py-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show first page, last page, current page, and pages around current
              const totalPageButtons = Math.min(5, totalPages);
              let pageNumber;
              
              if (totalPageButtons <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  size="sm"
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  className={`px-3 py-1 ${currentPage === pageNumber ? 'bg-primary text-white' : ''}`}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              size="sm"
              variant="outline"
              className="px-2 py-1"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}