'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [colorScheme, setColorScheme] = useState<'green' | 'gold'>('green');

  useEffect(() => {
    const interval = setInterval(() => {
      setColorScheme(prev => prev === 'green' ? 'gold' : 'green');
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="Nogalss Logo" width={120} height={120} priority />
        </div>

        {/* 404 Image with Color Overlay */}
        <div className="relative mb-8">
          <div className="relative w-full max-w-2xl mx-auto">
            <Image 
              src="/404.jpg" 
              alt="404 Error" 
              width={800} 
              height={600} 
              className="rounded-lg shadow-2xl"
              priority
            />
            <div 
              className={`absolute inset-0 rounded-lg transition-all duration-1000 ${
                colorScheme === 'green' 
                  ? 'bg-gradient-to-br from-green-600/20 to-green-800/30' 
                  : 'bg-gradient-to-br from-yellow-500/20 to-yellow-700/30'
              }`}
            />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className={`text-6xl md:text-8xl font-bold mb-4 transition-all duration-1000 ${
            colorScheme === 'green' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            404
          </h1>
          <h2 className={`text-2xl md:text-3xl font-semibold mb-4 transition-all duration-1000 ${
            colorScheme === 'green' ? 'text-green-700' : 'text-yellow-700'
          }`}>
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <button 
            onClick={handleGoBack}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
              colorScheme === 'green' 
                ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' 
                : 'bg-yellow-500 hover:bg-yellow-600 shadow-lg hover:shadow-xl'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
          <Link href="/">
            <button className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 ${
              colorScheme === 'green' 
                ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' 
                : 'bg-yellow-500 hover:bg-yellow-600 shadow-lg hover:shadow-xl'
            }`}>
              Back to Home
            </button>
          </Link>
        </div>

        {/* Secondary Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Link href="/auth/signin" className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border-2 ${
            colorScheme === 'green' 
              ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
          }`}>
            Sign In
          </Link>
          <Link href="/auth/register" className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border-2 ${
            colorScheme === 'green' 
              ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
          }`}>
            Register
          </Link>
          <Link href="/about" className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border-2 ${
            colorScheme === 'green' 
              ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
          }`}>
            About Us
          </Link>
          <Link href="/contact" className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border-2 ${
            colorScheme === 'green' 
              ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
          }`}>
            Contact
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
          <h3 className={`text-xl font-semibold mb-4 ${
            colorScheme === 'green' ? 'text-green-700' : 'text-yellow-700'
          }`}>
            Need Help?
          </h3>
          <p className="text-gray-600 mb-4">
            If you believe this is an error or need assistance, please contact our support team:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@nogalss.com" 
              className={`text-center px-4 py-2 rounded transition-all duration-300 ${
                colorScheme === 'green' 
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                  : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
              }`}
            >
              Email Support
            </a>
            <Link href="/contact" className={`text-center px-4 py-2 rounded transition-all duration-300 ${
              colorScheme === 'green' 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
            }`}>
              Contact Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 