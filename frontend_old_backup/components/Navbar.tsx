'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';

 const Navbar:React.FC=()=> {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const {isAuthenticated} = useAuth();
  const {clearToken} = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);



  const handleLogout = () => {
    clearToken();
    router.replace('/auth/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-orange-600">
            <Image src='/img/logo.svg' alt={'OneWeb Logo'} width={100} height={100}></Image>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-[#64399C] transition-colors">
              Home
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-[#64399C] transition-colors">
              Services
            </Link>


            {mounted && (
              isAuthenticated ? (
                <>
                
                    <Link href="/orders" className="text-gray-700 hover:text-[#64399C] transition-colors">
                     My Orders
                    </Link>
              
                  <button  onClick={handleLogout}
                    className="text-gray-700 hover:text-[#64399C] transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="bg-[#64399C] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#004CCA] transition-colors"
                >
                  Login
                </Link>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
          >
            <div className="w-6 h-0.5 bg-gray-800 mb-1"></div>
            <div className="w-6 h-0.5 bg-gray-800 mb-1"></div>
            <div className="w-6 h-0.5 bg-gray-800"></div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link href="/" className="block text-gray-700 hover:text-[#64399C]">
              Home
            </Link>
            <Link href="/services" className="block text-gray-700 hover:text-[#64399C]">
              Services
            </Link>
            {/* <Link href="/blogs" className="block text-gray-700 hover:text-[#64399C]">
              Blogs
            </Link> */}
            {mounted && (
              isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="block text-gray-700 hover:text-[#64399C]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="block bg-[#64399C] text-orange-600 font-medium">
                  Login
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
export default Navbar;