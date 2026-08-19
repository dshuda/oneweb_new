'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OtpInput from '@/components/OtpInput';
import api from '@/lib/api';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { asset } from "@/lib/assets";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const searchParams = useSearchParams();

  const { saveToken } = useAuth();
  const redirect = searchParams.get('redirect') || '/';


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate phone: 11 digits starting with 01
    if (!/^01\d{9}$/.test(phone)) {
      setError('Phone must be 11 digits starting with 01');
      return;
    }

    setLoading(true);
    try {
      // First, "send" OTP (optional but keeps backend flow consistent)
     var response = await api.post('/api/v1/auth/send-otp', { phone });
      if(response.data.success){
        setStep('otp');
      }
      // Automatically verify with a dummy OTP since it's bypassed in backend
      //await handleVerifyOtp('123456');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setError('');
    setLoading(true);
    
    try {
      const result = await api.post('/api/v1/auth/verify-otp', { phone, otp });
      
      if (result.data.success) {
        const { accessToken, refreshToken, userType, userId, nameRequired } = result.data;
        saveToken({accessToken: accessToken, refreshToken, userId, userType, nameRequired:nameRequired == true ? 1 : 0});
          // Customers and others stay on the main site/home page
          router.push(redirect == "/" ? userType == "vendor" ? "/vendor" : redirect : redirect);
        
      } else {
        setError(result.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
  //  await handleSendOtp(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">

            <Image
              src={asset("/img/logo.svg")}
              alt="OneWeb Logo"
              width={100}
              height={100}
              className="mx-auto mb-4"
            />
            <p className="text-gray-500 mt-2">
              {step === 'phone' ? 'Login to your account' : 'Enter verification code'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C] focus:border-transparent"
                  placeholder="01XXXXXXXXX"
                  pattern="01\d{9}"
                  maxLength={11}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be 11 digits starting with 01</p>
              </div>

              <button
                onClick={handleLogin}
                type="submit"
                disabled={loading}
                className="w-full bg-[#64399C] text-white py-3 rounded-lg font-medium hover:bg-white hover:text-[#64399C] hover:border hover:border-[#64399C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login / Secure Access'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <OtpInput
                length={6}
                onComplete={handleVerifyOtp}
                disabled={loading}
              />
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-orange-600 hover:text-[#64399C] font-medium"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500">
            Don't share your OTP to anyone
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#64399C] to-[#640F9C] items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Welcome Back
          </h2>
          <p className="text-lg text-orange-100 mb-8">
            Login to manage your bookings and explore our services.
          </p>
        </div>
      </div>
    </div>
  );
}
