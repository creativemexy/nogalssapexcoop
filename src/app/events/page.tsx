'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  image: string | null;
  category: string | null;
  attendees: number | null;
  isPublished: boolean;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/events?published=true');
      const data = await response.json();
      
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Network error - unable to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.date));
  const pastEvents = events.filter(event => !isUpcoming(event.date));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5E42] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Events</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="bg-[#0D5E42] text-white px-4 py-2 rounded-lg hover:bg-[#0A4A35] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <Image src="/logo.png" alt="Nogalss Logo" width={56} height={56} priority />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link href="/events" className="text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                Events
              </Link>
              <Link href="/auth/signin">
                <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Events & Activities
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Join us for inspiring events, workshops, and conferences that strengthen the cooperative movement
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming Events
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'past'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Past Events
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(() => {
            const currentEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
            
            if (currentEvents.length === 0) {
              return (
                <div className="text-center py-20">
                  <div className="text-6xl mb-6">📅</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {activeTab === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {activeTab === 'upcoming' 
                      ? 'We\'re working on exciting new events. Check back soon for updates!'
                      : 'No past events to display at the moment.'
                    }
                  </p>
                  {activeTab === 'upcoming' && (
                    <div className="flex justify-center space-x-4">
                      <Link href="/about" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                        Learn More About Us
                      </Link>
                      <Link href="/contact" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                        Contact Us
                      </Link>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => handleEventClick(event)}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="relative h-48">
                  <Image
                    src={event.image || '/placeholder-event.jpg'}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  {event.category && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                  <div className="flex items-center text-gray-600 mb-3">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.date)}
                  </div>
                  {event.time && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {event.time}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {event.attendees && (
                      <span className="text-sm text-gray-500">
                        {event.attendees} attendees
                      </span>
                    )}
                    {activeTab === 'upcoming' && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
                        Register Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Our Events
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive updates about upcoming events, workshops, and cooperative activities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-md font-semibold transition">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-4">NOGALSS</h3>
              <p className="text-gray-300">
                Empowering cooperatives with modern management solutions.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-green-400">Features</a></li>
                <li><a href="#" className="hover:text-green-400">Pricing</a></li>
                <li><a href="#" className="hover:text-green-400">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-green-400">Help Center</a></li>
                <li><a href="#" className="hover:text-green-400">Contact Us</a></li>
                <li><a href="#" className="hover:text-green-400">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-green-400">About</a></li>
                <li><a href="#" className="hover:text-green-400">Blog</a></li>
                <li><a href="#" className="hover:text-green-400">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 NOGALSS National Apex Cooperative Society Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Social Media Floating Icons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 bg-white/90 rounded-xl shadow-lg p-3 border border-gray-200">
        {/* Facebook */}
        <span className="hover:scale-110 transition-transform cursor-pointer" title="Facebook">
          <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
        </span>
        {/* Twitter */}
        <span className="hover:scale-110 transition-transform cursor-pointer" title="Twitter">
          <svg className="w-7 h-7 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 01-2.828.775 4.932 4.932 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 00-8.384 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 01-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 010 21.543a13.94 13.94 0 007.548 2.209c9.142 0 14.307-7.721 13.995-14.646A9.936 9.936 0 0024 4.557z"/></svg>
        </span>
        {/* Instagram */}
        <span className="hover:scale-110 transition-transform cursor-pointer" title="Instagram">
          <svg className="w-7 h-7 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12c0 5.502.013 5.911.072 7.191.059 1.277.353 2.45 1.32 3.417.967.967 2.14 1.261 3.417 1.32C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.277-.059 2.45-.353 3.417-1.32.967-.967 1.261-2.14 1.32-3.417.059-1.28.072-1.689.072-7.191 0-5.502-.013-5.911-.072-7.191-.059-1.277-.353-2.45-1.32-3.417C19.398.425 18.225.131 16.948.072 15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z"/></svg>
        </span>
        {/* LinkedIn */}
        <span className="hover:scale-110 transition-transform cursor-pointer" title="LinkedIn">
          <svg className="w-7 h-7 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11.75 20h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.25 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595zm-12.25-10h-.029c-.967 0-1.75-.784-1.75-1.75s.783-1.75 1.75-1.75c.967 0 1.75.784 1.75 1.75s-.783 1.75-1.75 1.75zm15.25 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/></svg>
        </span>
        {/* WhatsApp */}
        <span className="hover:scale-110 transition-transform cursor-pointer" title="WhatsApp">
          <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.93 11.93 0 0012 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.26-1.64A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.26-1.44l-.38-.22-3.72.98.99-3.62-.25-.37A9.94 9.94 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-1 2.43 0 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z"/></svg>
        </span>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Event Image */}
              <div className="relative h-64 md:h-80">
                <Image
                  src={selectedEvent.image || '/placeholder-event.jpg'}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="bg-white bg-opacity-90 text-gray-600 hover:text-gray-800 p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {selectedEvent.category && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedEvent.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Event Content */}
              <div className="p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h1>
                
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p>{formatDate(selectedEvent.date)}</p>
                    </div>
                  </div>

                  {selectedEvent.time && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Time</p>
                        <p>{selectedEvent.time}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Location</p>
                        <p>{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.attendees && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Expected Attendees</p>
                        <p>{selectedEvent.attendees} people</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
                    <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Event Organizer */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Organizer</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 font-semibold">
                        {selectedEvent.creator.firstName.charAt(0)}{selectedEvent.creator.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedEvent.creator.firstName} {selectedEvent.creator.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedEvent.creator.email}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  {isUpcoming(selectedEvent.date) && (
                    <button className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                      Register for Event
                    </button>
                  )}
                  <button 
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 