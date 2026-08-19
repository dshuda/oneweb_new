'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api/client';
import { Loader2, MapPin, CreditCard, Tag, CheckCircle } from 'lucide-react';

interface props {
  params: {
    slug: string[]
  },
  searchParams: {
    date: string,
    time: string
  }
}

const CheckoutPage: React.FC<props> = ({ params, searchParams }) => {
  // Will have two params: [serviceId, priceId] - priceId is  and only used for services with multiple pricing options
  //@ts-ignore
  const Id = params?.Id;
  const router = useRouter();
  const { userId, isNameRequired, saveName } = useAuth();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');


  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState('cod');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);

  const suggestionTimer = useRef<number | null>(null);
  const hasRequestedGeo = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const [userName, setuserName] = useState<string>("");



  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/v1/services/detail?id=${Id[0]}`
        );

        if (response.ok) {
          const data = await response.json();
          setService(data);
        } else {
          setError('Service not found');
        }
      } catch {
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    if (Id) {
      fetchService();
    }
  }, [Id]);

  useEffect(() => {
    if (!hasRequestedGeo.current) {
      hasRequestedGeo.current = true;
      autofillAddress();
    }
  }, []);

  const fetchAddressFromLocation = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en`);
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      const data = await response.json();
      const feature = data?.features?.[0];
      if (!feature || !feature.properties) {
        throw new Error('No address found');
      }

      const props = feature.properties;
      const parts = [props.name, props.city, props.state, props.country];
      const filtered = parts.filter(Boolean).join(', ');
      setAddress(filtered || '');
      setSuggestions([]);
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : 'Reverse lookup failed');
    } finally {
      setIsGeoLoading(false);
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSuggestLoading(true);
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=en&limit=7&countrycode=bd&bbox=88.084987,20.739191,92.673881,26.623997`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch address suggestions');
      }
      const data = await response.json();
      const items = data?.features?.map((feature: any) => {
        const props = feature.properties || {};
        const parts = [props.name, props.street, props.housenumber, props.city, props.state, props.country];
        return {
          id: `${props.osm_id || feature.id}_${props.osm_type || 'unknown'}`,
          label: parts.filter(Boolean).join(', '),
        };
      }) || [];
      setSuggestions(items.filter((item: any) => item.label));
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : 'Address suggestions failed');
    } finally {
      setIsSuggestLoading(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setGeoError('');

    if (suggestionTimer.current) {
      clearTimeout(suggestionTimer.current);
    }
//@ts-ignore
    suggestionTimer.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 400);
  };

  const selectSuggestion = (value: string) => {
    setAddress(value);
    setSuggestions([]);
    setGeoError('');
  };

  useEffect(() => {
    return () => {
      if (suggestionTimer.current) {
        clearTimeout(suggestionTimer.current);
      }
    };
  }, []);

  const autofillAddress = async () => {
    setGeoError('');
    setIsGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await fetchAddressFromLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setGeoError(error.message || 'Unable to access your location');
        setIsGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setSubmitError('Service address is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await api.createOrder({
        userId: userId,
        serviceId: parseInt(Id[0] as string),
        serviceDate: searchParams.date || undefined,
        time: searchParams.time || '09:00',
        priceId: Id[1] ? parseInt(Id[1] as string) : undefined,
        shippingAddress: address,
        additionalInfo: additionalInfo || undefined,
        paymentType: paymentType,
        couponCode: couponCode || undefined,
        orderFrom: 'web',
      });


      setSuccessData(result);

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };


  const updateProfilName = async () => {
    if (userName.length > 3 && userName.length < 125) {
      var response = await api.UpdateName(userName);
      //@ts-ignore
      if (response && response.success) {
        saveName();
      }
    }
  }
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102';



  if (loading) {
    return (
      <Fragment>

        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#64399C] w-10 h-10" />
        </div>
      </Fragment>

    );
  }

  // if (error || !service) {
  //   return (
  //     <ProtectedRoute>
  //       <Navbar />
  //       <div className="min-h-[60vh] flex flex-col items-center justify-center">
  //         <p className="text-xl text-gray-700 mb-4">{error || 'Service not found'}</p>
  //         <button onClick={() => router.back()} className="text-[#64399C] hover:underline">
  //           Go Back
  //         </button>
  //       </div>
  //     </ProtectedRoute>
  //   );
  // }

  if (successData) {
    return (
      <Fragment>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 py-12">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your order has been successfully placed.</p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-semibold text-gray-900 mb-2">#{successData.orderId}</p>
              <p className="text-sm text-gray-500">Tracking Code</p>
              <p className="font-semibold text-gray-900">{successData.trackingCode || 'N/A'}</p>
            </div>

            <button
              onClick={() => router.push('/orders')}
              className="w-full bg-[#64399C] text-white py-3 rounded-lg hover:bg-[#64399C] transition-colors font-medium"
            >
              View My Orders
            </button>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Navbar />




      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {isNameRequired && (
            <Fragment>
              <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    <h4>Please Give us your name</h4>
                    <input type="text" placeholder='my name ' className='mb-6 w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none transition-all font-mono' value={userName} onChange={(event) => setuserName(event.target.value)}></input>

                    {userName.length > 3 && (
                      <button onClick={updateProfilName} className="w-full bg-[#64399C] text-white py-3 rounded-lg hover:bg-white hover:text-black transition-colors font-medium flex items-center justify-center gap-2 disabled:white">Update My Name</button>
                    )}
                  </div>
                </div>
              </div>
            </Fragment>
          )}


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="md:col-span-2 space-y-6">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" id="checkout-form">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="text-[#64399C] w-5 h-5" />
                   <strong> Service Area </strong>
                  </h2>
                   <ol style={{'listStyle': 'decimal'}} className='ms-5'>
                    <li>Dhaka</li>
                   </ol>


                  <div className="space-y-4 mt-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">You Prepared Date & Time</label>
                      <p className="font-medium text-gray-900">
                        {searchParams.date && searchParams.time
                          ? `${searchParams.date} at ${searchParams.time}`
                          : 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Service Address *</label>
                        <button
                          type="button"
                          onClick={autofillAddress}
                          disabled={isGeoLoading}
                          className="text-sm text-[#64399C] hover:text-[#4f2b87] transition-colors"
                        >
                          {isGeoLoading ? 'Autofilling…' : 'Retry device autofill'}
                        </button>
                      </div>
                      <textarea
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C]"
                        rows={3}
                        placeholder="House 123, Road 4, Block C, Dhaka"
                        required
                      />
                      {suggestions.length > 0 && (
                        <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-56 overflow-y-auto">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onClick={() => selectSuggestion(suggestion.label)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors text-sm"
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {geoError && (
                        <p className="text-sm text-red-600 mt-2">{geoError}</p>
                      )}
                      {isSuggestLoading && (
                        <p className="text-sm text-gray-500 mt-2">Loading suggestions...</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Any Instructions & Contact Person Details (Optional)</label>
                      <textarea
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C]"
                        rows={2}
                        placeholder="Any specific requests or directions?"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CreditCard className="text-[#64399C] w-5 h-5" />
                    Payment Method
                  </h2>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentType === 'cod' ? 'border-[#64399C] bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentType === 'cod'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-4 h-4 text-[#64399C] border-gray-300 focus:ring-orange-500"
                      />
                      <span className="ml-3 font-medium text-gray-900">Cash on Delivery</span>
                    </label>
                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentType === 'sslcommerz' ? 'border-[#64399C] bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="sslcommerz"
                        checked={paymentType === 'sslcommerz'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-4 h-4 text-[#64399C] border-gray-300 focus:ring-[#64399C]"
                      />
                      <span className="ml-3 font-medium text-gray-900">Pay Online (SSLCommerz)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Tag className="text-[#64399C] w-5 h-5" />
                    Coupon Code
                  </h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Discount will be calculated at backend.</p>
                </div>
              </form>
            </div>

            {/* Summary Section */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>

                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                  {service.bannerImage ? (
                    <img src={BASE_URL+service.bannerImage} alt={service.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Tag className="text-gray-400 w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-2">{service.name}</h3>
                    <p className="text-[#64399C] font-semibold mt-1">
                      ৳{service.initialPrice || (service.prices && service.prices.find((f: any) => f.id == Id[1])?.price) || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>৳{service.initialPrice || (service.prices && service.prices.find((f: any) => f.id == Id[1])?.price) || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span>BDT</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900 text-lg">
                    <span>Estimated Total</span>
                    <span>৳{service.initialPrice || (service.prices && service.prices.find((f: any) => f.id == Id[1])?.price) || 0}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-full bg-[#64399C] text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-orange-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
export default CheckoutPage;