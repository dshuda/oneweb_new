'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAdminTokens } from '@/lib/adminAuth';
import Image from 'next/image';
import { asset } from "@/lib/assets";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/v1/auth/admin/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, userType, userId } = response.data;
        
        // Synchronously set tokens & cookies
        setAdminTokens(accessToken, refreshToken, userId, userType);
        
        // Full navigation ensures middleware receives the fresh cookies immediately
        window.location.href = '/admin';
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.message) {
        setError(`Connection error: ${err.message}`);
      } else {
        setError('Invalid credentials or server unreachable');
      }
    } finally {
      setLoading(false);
    }
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
            <p className="text-gray-500 mt-2">Admin Login</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Phone
              </label>
              <input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C] focus:border-transparent"
                placeholder="admin@oneweb.com or 01XXXXXXXXX"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#64399C] text-white py-3 rounded-lg font-medium hover:bg-gray-100 hover:text-[#64399C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Internal OneWeb administration access.
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#64399C] to-[#64399C] items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Admin Dashboard
          </h2>
          <p className="text-lg text-orange-100 mb-8">
            Access powerful tools to manage orders, services, users, and vendors all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
