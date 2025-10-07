'use client';

import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isBlinking, setIsBlinking] = useState(true);

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 transition-all duration-300 ${
      isBlinking ? 'opacity-100' : 'opacity-80'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            🔔 New Feature: 2FA Security Setup Available! Click "2FA Security" in your dashboard to enable two-factor authentication.
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
