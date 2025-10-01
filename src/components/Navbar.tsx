'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <Image src="/logo.png" alt="Nogalss Logo" width={56} height={56} priority />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-[#0D5E42]' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-[#0D5E42]'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about') 
                  ? 'text-[#0D5E42]' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-[#0D5E42]'
              }`}
            >
              About
            </Link>
            <Link 
              href="/events" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/events') 
                  ? 'text-[#0D5E42]' 
                  : 'text-gray-900 dark:text-gray-100 hover:text-[#0D5E42]'
              }`}
            >
              Events
            </Link>
            <Link href="/auth/signin">
              <button className="bg-[#0D5E42] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0A4A35] transition">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 