'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '@/lib/hooks/useApi';
import Navbar from '@/components/Navbar';
import { Loader2, Package, Search, ChevronRight, Filter } from 'lucide-react';

export default function CustomerOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data: ordersData, isLoading, error } = useOrders({ 
    page, 
    status: statusFilter || undefined 
  });
 
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      assigned: 'bg-indigo-100 text-indigo-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-500 mt-1">Track and manage your service bookings</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by Tracking Code..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="sm:w-64 flex items-center gap-2">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="on_the_way">On the Way</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders List */}
            <div className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-[#64399C] w-10 h-10" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-600 mb-2">Failed to load orders.</p>
                  <button onClick={() => window.location.reload()} className="text-[#64399C] hover:underline">
                    Try Again
                  </button>
                </div>
              ) : !ordersData?.items || ordersData.items.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500 mb-6">You haven't booked any services yet.</p>
                  <Link href="/services" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-[#64399C] transition-colors">
                    Browse Services
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ordersData.items.map((order: any) => (
                    <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900 text-lg">
                            {order.service?.name || 'Unknown Service'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(order.deliveryStatus)}`}>
                            {order.deliveryStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-y-2 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-400">Tracking Code:</span>{' '}
                            <span className="font-medium text-gray-800">{order.trackingCode || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Date:</span>{' '}
                            <span className="font-medium text-gray-800">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Amount:</span>{' '}
                            <span className="font-medium text-[#64399C]">৳{order.grandTotal}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Vendor:</span>{' '}
                            <span className="font-medium text-[#64399C]">{order.vendor}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Vendor's Mobile:</span>{' '}
                            <span className="font-medium text-[#64399C]">{order.vendorContact}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Payment:</span>{' '}
                            <span className="font-medium uppercase">{order.paymentType == 'cod' ?  'Cash On Delivery' : order.paymentType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Link 
                          href={`/orders/${order.id}`}
                          className="flex items-center gap-2 text-[#64399C] hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-[#64399C] transition-colors"
                        >
                          View Details
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {ordersData?.pagination && ordersData.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing page {ordersData.pagination.currentPage} of {ordersData.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= ordersData.pagination.totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

  );
}
