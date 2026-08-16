// app/orders/[id]/page.tsx (updated)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api/client';
import { Loader2, ArrowLeft, MapPin, CreditCard, Clock, Package } from 'lucide-react';
import bKashClient from '@/lib/api/bKash';

interface Order {
  id: number;
  grandTotal: number;
  totalAmount: number;
  orderAmount: number;
  paidAmount: number;
  amountDue: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentType: string;
  deliveryStatus: string;
  createdAt: string;
  trackingCode: string;
  service: { name: string };
  additionalInfo: string;
  shippingAddress: string;
  couponDiscount: number;
  bkashAgreementId?: string;
  bkashPaymentId?: string;
}

interface BKashPaymentResponse {
  paymentId: string;
  bkashURL: string;
  agreementId?: string;
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('bkash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [amountDue, setAmountDue] = useState<number>(0);
  const [paymentAttempt, setPaymentAttempt] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentMessage, setPaymentMessage] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isCreatingAgreement, setIsCreatingAgreement] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.getOrder(parseInt(id as string));
        if (response && response.order) {
          setOrder(response.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  useEffect(() => {
    if (!order) return;

    const totalAmount = Number(order.grandTotal ?? order.totalAmount ?? order.orderAmount ?? 0);
    const paidAmount = Number(order.paidAmount ?? 0);
    const remaining = Number(order.amountDue ?? Math.max(totalAmount - paidAmount, 0));

    setSelectedPaymentMethod(order.paymentType ?? 'bkash');
    setAmountDue(remaining);
    setPaymentAmount(remaining);
    setPaymentAttempt(order.paymentStatus === 'pending' && paidAmount > 0 ? 1 : 0);
  }, [order]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const paymentMethods = [

    {
      id: 'rocket',
      label: 'Rocket',
      subtitle: 'Mobile Wallet',
      color: 'bg-[#F7931E]',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/95/Rocket_Logo.svg',
      providerUrl: 'https://www.dutchbanglabank.com/rocket',
    },
    {
      id: 'nagad',
      label: 'Nagad',
      subtitle: 'Mobile Wallet',
      color: 'bg-[#07B5F2]',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Nagad_Logo.svg',
      providerUrl: 'https://www.nagad.com.bd',
    },
  ];

  const isPaymentAllowed = order?.deliveryStatus === 'confirmed' && order?.paymentStatus !== 'paid';

  // Handle bKash payment initiation
  const handleBKashPayment = async () => {
    if (!order) return;
    
    setIsProcessingPayment(true);
    setPaymentMessage('');

    try {
      const effectiveAmount = paymentAttempt > 0 ? amountDue : paymentAmount;

      if (effectiveAmount <= 0) {
        setPaymentMessage('Please enter a valid amount.');
        setIsProcessingPayment(false);
        return;
      }

      // Determine if we have an existing agreement
      const hasAgreement = order.bkashAgreementId && order.bkashAgreementId.length > 0;

      let response: BKashPaymentResponse;

      if (hasAgreement) {
        // Use existing agreement for payment
        response = await bKashClient.createBKashPaymentWithAgreement({
          orderId: order.id,
          amount: effectiveAmount,
          agreementId: order.bkashAgreementId,
          payerReference: order.id.toString(),
          merchantInvoiceNumber: `INV-${order.id}-${Date.now()}`,
        });
      } else {
        // First time - create agreement and payment
        response = await bKashClient.createBKashPayment({
          orderId: order.id,
          amount: effectiveAmount,
          payerReference: order.id.toString(),
          merchantInvoiceNumber: `INV-${order.id}-${Date.now()}`,
        });
      }

      // Store payment ID for later use
      setOrder(prev => prev ? { ...prev, bkashPaymentId: response.paymentId } : null);

      // Redirect to bKash payment page
      setIsRedirecting(true);
      window.location.href = response.bkashURL;

    } catch (err: any) {
      setPaymentMessage(err.message || 'Failed to initiate bKash payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Handle bKash callback (this is called after redirect from bKash)
  useEffect(() => {
    const handleBKashCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('paymentId');
      const status = urlParams.get('status');
      const signature = urlParams.get('signature');
      const agreementId = urlParams.get('agreementId');

      if (paymentId && status) {
        try {
          setIsProcessingPayment(true);
          setPaymentMessage('Processing payment confirmation...');

          if (status === 'success') {
            // Execute the payment
            const result = await bKashClient.executeBKashPayment({
              paymentId,
              orderId: order?.id,
            });

            if (result.transactionStatus === 'Completed') {
              // Update order status
              await api.updateOrder(order!.id, {
                paymentStatus: 'paid',
                //@ts-ignore
                paymentType: 'bkash',
                bkashPaymentId: paymentId,
                bkashAgreementId: agreementId || order?.bkashAgreementId,
                paidAmount: Number(result.amount),
              });

              setPaymentMessage(`Payment successful! Transaction ID: ${result.trxId}`);
              setAmountDue(0);
              setPaymentAmount(0);
              setOrder(prev => prev ? { 
                ...prev, 
                paymentStatus: 'paid', 
                paymentType: 'bkash',
                bkashPaymentId: paymentId,
                bkashAgreementId: agreementId || prev?.bkashAgreementId,
                paidAmount: Number(result.amount) 
              } : null);

              // Clean URL
              window.history.replaceState({}, '', `/orders/${order?.id}`);
            } else {
              setPaymentMessage(`Payment status: ${result.transactionStatus}. Please check order status.`);
            }
          } else if (status === 'failure' || status === 'cancel') {
            setPaymentMessage(`Payment ${status} at bKash. Please try again.`);
          }

        } catch (err: any) {
          setPaymentMessage(err.message || 'Failed to confirm payment. Please check your order status.');
        } finally {
          setIsProcessingPayment(false);
          setIsRedirecting(false);
        }
      }
    };

    handleBKashCallback();
  }, [order?.id]);

  const handlePayNow = () => {
    if (selectedPaymentMethod === 'bkash') {
      handleBKashPayment();
    } else {
      // Handle other payment methods
      alert(`${selectedPaymentMethod} payment integration coming soon.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-xl text-gray-700 mb-4">{error || 'Order not found'}</p>
          <button onClick={() => router.push('/orders')} className="text-orange-600 hover:underline">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button 
          onClick={() => router.push('/orders')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Orders
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Order #{order.id}
              <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wider ${getStatusColor(order.deliveryStatus)}`}>
                {order.deliveryStatus}
              </span>
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Clock size={16} />
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          
          {order.trackingCode && (
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-center md:text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Tracking Code</p>
              <p className="font-bold text-lg text-gray-900">{order.trackingCode}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="text-orange-500" size={20} />
                Service Details
              </h2>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="text-[#64399C] w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-lg">{order.service?.name || 'Unknown Service'}</h3>
                  {order.additionalInfo && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                      <span className="font-semibold block mb-1">Instructions:</span>
                      {order.additionalInfo}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="text-orange-500" size={20} />
                Payment Summary
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency((order.grandTotal || 0) + (order.couponDiscount || 0))}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.couponDiscount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm mb-4">
                <span className="text-gray-600 font-medium uppercase">{order.paymentType || 'COD'}</span>
                <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                </span>
              </div>

              {isPaymentAllowed && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Choose Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                          key={'bkash'}
                          type="button"
                          onClick={() => setSelectedPaymentMethod('bkash')}
                          className={`relative rounded-2xl border p-4 text-left transition-all ${selectedPaymentMethod === 'bkash' ? 'border-[#64399C] bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="clearfix">
                                                        <img
                                src={'/img/bkash-logo.png'}
                                alt={`${'bKash Payment'}`}
                                className="w-full object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.src = '/img/logo.svg';
                                }}
                              />
                          </div>
                        </button>



                      {paymentMethods.map((method) => (
                        
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`relative rounded-2xl border p-4 text-left transition-all ${selectedPaymentMethod === method.id ? 'border-[#64399C] bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${method.color}`}>
                              <img
                                src={method.logoUrl}
                                alt={`${method.label} logo`}
                                className="h-6 w-auto object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.src = '/img/logo.svg';
                                }}
                              />
                            </div>
                            <div>
                              <span className="block text-sm font-semibold text-gray-900">{method.label}</span>
                              <span className="text-xs text-gray-500">{method.subtitle}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{paymentAttempt === 0 ? 'First payment amount' : 'Amount due for second payment'}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(amountDue)}</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={paymentAttempt === 0 ? paymentAmount : amountDue}
                      disabled={paymentAttempt > 0 || selectedPaymentMethod === 'bkash'}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white focus:border-[#64399C] focus:ring-2 focus:ring-[#64399C]/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter amount to pay"
                    />
                    {selectedPaymentMethod === 'bkash' && (
                      <p className="text-sm text-blue-600">
                        💳 bKash will redirect you to their payment page
                      </p>
                    )}
                    {paymentAttempt > 0 && (
                      <p className="text-sm text-gray-500">
                        Second payment will be automatically due for the remaining amount.
                      </p>
                    )}
                  </div>

                  {paymentMessage && (
                    <div className={`rounded-xl border p-3 text-sm ${
                      paymentMessage.includes('successful') 
                        ? 'border-green-100 bg-green-50 text-green-700'
                        : 'border-orange-100 bg-orange-50 text-orange-700'
                    }`}>
                      {paymentMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={isProcessingPayment || isRedirecting}
                    className="w-full rounded-2xl bg-[#64399C] px-4 py-3 text-white font-semibold shadow-sm transition hover:bg-[#4b2f7f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRedirecting ? 'Redirecting to bKash...' : 
                     isProcessingPayment ? 'Processing...' : 
                     'Pay Now'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-orange-500" size={20} />
                Service Location
              </h2>
              <p className="text-gray-700 whitespace-pre-line">{order.shippingAddress || 'No address provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}