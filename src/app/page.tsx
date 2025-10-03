'use client';

import Link from 'next/link';
import Image from 'next/image';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SocialMediaIcons from '@/components/SocialMediaIcons';
import { useEffect, useState } from 'react';

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

  // Partners dynamic fetch
  const [partners, setPartners] = useState<any[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);
  useEffect(() => {
    setPartnersLoading(true);
    setPartnersError(null);
    fetch('/api/admin/partners')
      .then(res => res.json())
      .then(data => {
        if (data.partners) setPartners(data.partners);
        else setPartners([]);
      })
      .catch(err => setPartnersError('Failed to load partners'))
      .finally(() => setPartnersLoading(false));
  }, []);

  // Events dynamic fetch
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  useEffect(() => {
    setEventsLoading(true);
    setEventsError(null);
    fetch('/api/public/events?limit=3')
      .then(res => res.json())
      .then(data => {
        if (data.events) setEvents(data.events);
        else setEvents([]);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setEventsError('Failed to load events');
        setEvents([]);
      })
      .finally(() => setEventsLoading(false));
  }, []);

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
            Why Choose NOGALSS?
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
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg overflow-hidden shadow-lg animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : eventsError ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">{eventsError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No upcoming events at the moment.</p>
              <Link href="/events">
                <button className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition">
                  View All Events
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div className="relative h-48">
                    <img 
                      src={event.image || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80"} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#0D5E42] text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.category || 'Event'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                      {event.time && ` • ${event.time}`}
                      {event.location && ` • ${event.location}`}
                    </p>
                    <p className="text-gray-600 mb-4">
                      {event.description || 'Join us for this exciting event.'}
                    </p>
                    {event.attendees && event.attendees > 0 && (
                      <p className="text-sm text-gray-500 mb-4">
                        {event.attendees} attendees
                      </p>
                    )}
                    <Link href="/events">
                      <button className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition">
                        Learn More
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            {partnersLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">Loading partners...</div>
            ) : partnersError ? (
              <div className="flex items-center justify-center py-8 text-red-500">{partnersError}</div>
            ) : partners.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">No partners found.</div>
            ) : (
              <div className="flex space-x-8 overflow-x-auto pb-4 scrollbar-hide">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex-shrink-0 w-48 h-40 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-3">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100 bg-gray-50 overflow-hidden">
                      <img src={partner.logo} alt={partner.name} className="object-contain w-full h-full" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 mb-1">{partner.name}</p>
                      {partner.website && (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline block mb-1">{partner.website}</a>
                      )}
                      <p className="text-xs text-gray-500 truncate max-w-[12rem]">{partner.description || <span className="text-gray-300">—</span>}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            Join thousands of cooperatives already using NOGALSS to streamline their operations.
          </p>
          <Link href="/auth/register">
            <button className="bg-white text-[#0D5E42] hover:bg-gray-100 text-lg px-8 py-4 rounded-md font-semibold">
              Start Onboarding
            </button>
          </Link>
        </div>
      </section>

      <Footer />
      <SocialMediaIcons />
    </div>
  );
} 