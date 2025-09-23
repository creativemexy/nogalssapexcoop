'use client';

import Link from 'next/link';
import Image from 'next/image';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SocialMediaIcons from '@/components/SocialMediaIcons';

export default function HomePage() {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1, spacing: 0 },
    mode: 'snap',
    drag: true,
    initial: 0,
  });
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      headline: 'Empowering Cooperatives Nationwide',
      cta: 'Get Started',
    },
    {
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80',
      headline: 'Seamless Member Management',
      cta: 'Join Now',
    },
    {
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80',
      headline: 'Track Savings & Loans Effortlessly',
      cta: 'Learn More',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative">
        <div ref={sliderRef} className="keen-slider h-[400px] md:h-[500px] rounded-b-3xl overflow-hidden">
          {slides.map((slide, idx) => (
            <div key={idx} className="keen-slider__slide relative flex items-center justify-center h-full w-full">
              <img src={slide.image} alt={slide.headline} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D5E42]/70 to-yellow-700/60" />
              <div className="relative z-10 text-center w-full flex flex-col items-center justify-center h-full px-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{slide.headline}</h1>
                <Link href="/auth/register">
                  <button className="mt-4 bg-yellow-400 text-[#0D5E42] font-bold px-8 py-3 rounded-md text-lg shadow hover:bg-yellow-500 transition">
                    {slide.cta}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button 
          onClick={() => instanceRef.current?.prev()}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 z-20 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={() => instanceRef.current?.next()}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 z-20 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Nogalss?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#0D5E42]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0D5E42]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">
                Bank-level security ensures your cooperative data is always protected.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Tracking</h3>
              <p className="text-gray-600">
                Comprehensive financial management with real-time reporting and analytics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#0D5E42]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0D5E42]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 04 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Member Management</h3>
              <p className="text-gray-600">
                Easy member registration, profile management, and communication tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join us for inspiring events that strengthen the cooperative movement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <img 
                  src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80" 
                  alt="Annual Summit" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#0D5E42] text-white px-3 py-1 rounded-full text-sm font-medium">
                    Summit
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Annual Cooperative Summit 2024</h3>
                <p className="text-gray-600 mb-4">July 15, 2024 • Lagos Convention Centre</p>
                <p className="text-gray-600 mb-4">Join us for our annual summit where we discuss the future of cooperatives in Nigeria.</p>
                <Link href="/events">
                  <button className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" 
                  alt="Digital Workshop" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Workshop
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Digital Transformation Workshop</h3>
                <p className="text-gray-600 mb-4">July 22, 2024 • Abuja Business Hub</p>
                <p className="text-gray-600 mb-4">Learn about the latest digital tools for cooperative management.</p>
                <Link href="/events">
                  <button className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <img 
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80" 
                  alt="Training" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#0D5E42] text-white px-3 py-1 rounded-full text-sm font-medium">
                    Training
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Financial Literacy Training</h3>
                <p className="text-gray-600 mb-4">August 5, 2024 • Port Harcourt</p>
                <p className="text-gray-600 mb-4">Empower your members with essential financial literacy skills.</p>
                <Link href="/events">
                  <button className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Partners
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Working together with leading organizations to strengthen the cooperative movement
            </p>
          </div>
          <div className="relative">
            <div className="flex space-x-8 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#0D5E42]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#0D5E42] font-bold text-lg">CBN</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Central Bank of Nigeria</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-600 font-bold text-lg">NCC</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Nigerian Cooperative Commission</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#0D5E42]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#0D5E42] font-bold text-lg">BOI</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Bank of Industry</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-600 font-bold text-lg">SMEDAN</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">SMEDAN</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#0D5E42]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-[#0D5E42] font-bold text-lg">NIRSAL</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">NIRSAL Microfinance Bank</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-600 font-bold text-lg">NDIC</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">NDIC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0D5E42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Cooperative?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of cooperatives already using Nogalss to streamline their operations.
          </p>
          <Link href="/auth/register">
            <button className="bg-white text-[#0D5E42] hover:bg-gray-100 text-lg px-8 py-4 rounded-md font-semibold">
              Start Your Free Trial
            </button>
          </Link>
        </div>
      </section>

      <Footer />
      <SocialMediaIcons />
    </div>
  );
} 