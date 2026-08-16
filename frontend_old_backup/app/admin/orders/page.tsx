'use client';
import { Fragment, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Check, Eye, EyeIcon, Pencil, X } from 'lucide-react';

interface Order {
  id: number;
  trackingCode: string;
  customer: string;
  paymentType: string;
  paymentStatus: string;
  service: any;
  deliveryStatus: string;
  grandTotal: number;
  createdAt: string;
  priceId: number;
  pricing: [];
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  serviceDetails?: any;
  vendorId?: any
}

interface OrderForm {
  id: number;
  paymentType: string;
  paymentStatus: string;
  trackingCode: string;
  deliveryStatus: string;
  grandTotal: number;
  priceId: number;
  vendorId: any;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [vendors, setVendors] = useState([])

  const emptyFormdata = {
    grandTotal: 0,
    paymentStatus: '',
    deliveryStatus: '',
    paymentType: 'cod',
    trackingCode: '',
    priceId: 0,
    id: 0,
    vendorId: null
  }
  const [formData, setFormData] = useState<OrderForm>(emptyFormdata)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/api/v1/admin/orders');
        setOrders(response.data.data.items || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      assigned: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-purple-100 text-purple-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const updateOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    await FetchVendor(order.service.id)
    setFormData({
      id: order.id,
      trackingCode: order.trackingCode,
      deliveryStatus: order.deliveryStatus,
      priceId: order.priceId,
      paymentStatus: order.paymentStatus,
      paymentType: order.paymentType,
      grandTotal: order.grandTotal,
      vendorId: order.vendorId
    })
  }


  const FetchVendor = async (serviceId: number) => {
    const response = await api.get(`/api/v1/admin/vendors/dropdown?serviceId=${serviceId}`);

    setVendors(response.data.data || []);
  }


  const viewOrderDetails = (order: Order) => {
    setViewingOrder(order);
    setIsDetailsModalOpen(true);
  }

  const SubmitOrderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put(`/api/v1/admin/orders/${formData?.id}`, formData);
      // Update the order in the local state
      setOrders(orders.map(order =>
        order.id === formData.id
          ? { ...order, ...formData }
          : order
      ));
      setFormData(emptyFormdata);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      //@ts-ignore
      date: 'medium',
      time: 'medium'
    }).format(date);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Fragment>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold">Service Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">{order.id}</td>
                  <td className="px-6 py-4 font-medium">{order.trackingCode}</td>
                  <td className="px-6 py-4 text-sm">{order.customer}</td>
                  <td className="px-6 py-4 text-sm">{order.service?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.deliveryStatus)}`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    <strong className="ml-1">({order.paymentType})</strong>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">৳{order.grandTotal.toFixed(2)}</td>
                  <td className='px-6 py-4 text-sm font-bold'>
                    <button
                      className='btn btn-sm text-[#64399C] hover:scale-110 transition-transform'
                      onClick={() => updateOrder(order)}
                    >
                      <Pencil size={22} />
                    </button>
                    <button
                      className='btn btn-sm text-[#64399C] ml-3 hover:scale-110 transition-transform'
                      onClick={() => viewOrderDetails(order)}
                    >
                      <Eye size={22} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      {isModalOpen && (
  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Update Order</h3>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-500">
                tracking: {formData.trackingCode}
              </span>
            </div>

            <form className="space-y-5" onSubmit={SubmitOrderUpdate}>
              {selectedOrder && (
                <Fragment>
                  {vendors && vendors.length > 0 && (

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 ml-1">Vendor</label>
                      <select
                        value={formData.vendorId}
                        onChange={(e) => setFormData({ ...formData, vendorId: Number(e.target.value) })}
                        className='w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono'
                      >
                          <option key={678979879879} value="">--Select Vendor --</option>
                        {vendors.map((item: any) => (
                          <option key={item.id} value={item.id}> {item.text}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Pricing</label>
                    <select
                      value={formData.priceId}
                      onChange={(e) => setFormData({ ...formData, priceId: Number(e.target.value) })}
                      className='w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono'
                    >
                      {selectedOrder.pricing.map((item: any) => (
                        <option key={item.id} value={item.id}> {item.name} - {item.price}</option>
                      ))}
                    </select>
                  </div>
                </Fragment>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Payment Type</label>
                <select
                  value={formData.paymentType}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono"
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="sslcommerz">SSL Commerz</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Payment Status</label>
                <select
                  value={formData.paymentStatus}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono"
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Delivery Status</label>
                <select
                  value={formData.deliveryStatus}
                  onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Grand Total</label>
                <input
                  type="number"
                  value={formData.grandTotal}
                  onChange={(e) => setFormData({ ...formData, grandTotal: parseFloat(e.target.value) })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono"
                  placeholder="Amount"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-gray-600 transition-all font-bold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>


          </div>
        </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isDetailsModalOpen && viewingOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl my-8 shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-t-3xl border-b border-gray-100 px-8 py-2 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-500 mt-1">Tracking: {viewingOrder.trackingCode}</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-2">
              {/* Order Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                  Order Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold text-gray-900">#{viewingOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(viewingOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingOrder.deliveryStatus)}`}>
                      {viewingOrder.deliveryStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tracking Code</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{viewingOrder.trackingCode}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-semibold text-gray-900">{viewingOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-semibold text-gray-900">{viewingOrder.customerPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{viewingOrder.customerEmail || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-semibold text-gray-900">{viewingOrder.customerAddress || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                  Service Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Service Name</p>
                      <p className="font-semibold text-gray-900">{viewingOrder.service?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price ID</p>
                      <p className="font-semibold text-gray-900">#{viewingOrder.priceId}</p>
                    </div>
                  </div>
                  {viewingOrder.serviceDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Additional Details</p>
                      <p className="text-gray-700">{JSON.stringify(viewingOrder.serviceDetails)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-yellow-600 rounded-full"></span>
                  Payment Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold text-gray-900 uppercase">{viewingOrder.paymentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(viewingOrder.paymentStatus)}`}>
                      {viewingOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-purple-600">৳{viewingOrder.grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Details */}
              {viewingOrder.pricing && viewingOrder.pricing.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-red-600 rounded-full"></span>
                    Pricing Details
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="space-y-2">
                      {viewingOrder.pricing.map((price: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                         
                          <span className="text-gray-700 flex items-center">  {viewingOrder.priceId === price.id && (<Check size={19}></Check> )}  &nbsp;  {price.name}</span>
                          <span className="font-semibold text-gray-900">৳{price.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    updateOrder(viewingOrder);
                  }}
                  className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all shadow-lg font-bold"
                >
                  Edit Order
                </button>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-gray-600 transition-all font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}