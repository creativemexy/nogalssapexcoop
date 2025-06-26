'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SocialMediaIcons from '@/components/SocialMediaIcons';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            NOGALSS<br/>
            NATIONAL APEX COOPERATIVE SOCIETY LTD
          </h1>
          <p className="text-lg md:text-2xl text-green-100 max-w-3xl mx-auto mt-2">
            (National Umbrella Body For Skilled-Based, Artisans, NGOs, CSOs,<br/>
            Associations and Literacy-Focused Groups Cooperatives across Nigeria.)
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-4 text-center">INTRODUCTION</h2>
          <p className="text-gray-700 text-lg leading-relaxed text-center">
            NOGALSS National Apex Cooperative Society Ltd serves as the Central Coordinating Body for Skilled-Based, Artisans, NGOs, CSOs, Associations and Literacy-Focused Institutions Cooperatives across Nigeria. These operational guidelines are established to provide a structured framework for governance, management, member engagement, financial systems, and sustainable development. They align with the Nigerian Cooperative Societies Act and reflect global cooperative principles.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
              To be the leading national apex body uniting and empowering skill-based,
artisans, NGOs, Associations, and Literacy Communities Cooperatives
through inclusive development, sustainable economic growth, and social
transformation.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
              To empower and unify skill-based artisans, NGOs, and literacy stakeholders
cooperatives through coordinated support, inclusive development, financial
access, and capacity building.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive services and initiatives to empower cooperatives nationwide
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">a</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Facilitate Access to Cooperative Loans, Savings & Grants</h3>
                  <p className="text-gray-600">
                    We provide financial support through loans, savings programs, and grant opportunities to help cooperatives grow and thrive.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start">
                <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-sm">b</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Implement Government & Donor-Funded Empowerment Projects</h3>
                  <p className="text-gray-600">
                    We execute various empowerment initiatives funded by government agencies and international donors to support cooperative development.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">c</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Members to Markets & Shared Infrastructure</h3>
                  <p className="text-gray-600">
                    We create market access opportunities and provide shared infrastructure to help cooperatives reach wider markets and reduce costs.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start">
                <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-sm">d</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage a National Cooperative Development Fund (CDF)</h3>
                  <p className="text-gray-600">
                    We oversee and manage the Cooperative Development Fund to provide sustainable financial resources for cooperative growth and development.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">e</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Provide Skills Training & Capacity Building Nationwide</h3>
                  <p className="text-gray-600">
                    We offer comprehensive training programs and capacity building initiatives across Nigeria to enhance cooperative management skills.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start">
                <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-sm">f</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Cooperative Registration & Legal Compliance</h3>
                  <p className="text-gray-600">
                    We assist cooperatives with registration processes and ensure compliance with legal requirements and regulatory standards.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">g</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Offer Welfare, Insurance & Social Protection Services</h3>
                  <p className="text-gray-600">
                    We provide comprehensive welfare programs, insurance coverage, and social protection services to support cooperative members.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start">
                <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-sm">h</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Advocate for Cooperative-Friendly Policies & Funding</h3>
                  <p className="text-gray-600">
                    We actively advocate for policies that support cooperative development and secure funding opportunities for the sector.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">i</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Drive Digital Transformation for Cooperatives</h3>
                  <p className="text-gray-600">
                    We lead the digital transformation of cooperatives by implementing modern technologies and digital solutions to enhance efficiency and member engagement.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start">
                <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-sm">j</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Promote Inclusive Growth & Gender Equity</h3>
                  <p className="text-gray-600">
                    We champion inclusive development by ensuring equal opportunities for all members and promoting gender equity in cooperative leadership and participation.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">k</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Link Members to Global Partnerships & Opportunities</h3>
                  <p className="text-gray-600">
                    We connect our cooperative members with international partners, markets, and opportunities to expand their reach and access global resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide our operations and relationships
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrity</h3>
              <p className="text-gray-600">
                We conduct our business with honesty, transparency, and ethical practices
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">
                We prioritize the well-being and development of our communities
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We embrace new technologies and approaches to better serve our members
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600">
                We strive for the highest standards in all our services and operations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our History</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A journey of growth, innovation, and community service
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2010
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Foundation</h3>
              <p className="text-gray-600">
                Nogalss was established with the vision of empowering cooperatives across Nigeria
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="bg-yellow-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2015
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expansion</h3>
              <p className="text-gray-600">
                Expanded services to include digital management solutions and financial services
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2024
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                Launched comprehensive digital platform for cooperative management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive solutions for cooperative success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Management</h3>
              <p className="text-gray-600">
                Comprehensive financial tracking, savings management, and loan processing
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Member Management</h3>
              <p className="text-gray-600">
                Efficient member registration, profile management, and communication tools
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporting & Analytics</h3>
              <p className="text-gray-600">
                Real-time reports, analytics, and insights for informed decision-making
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the Nogalss Community
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Be part of a movement that's transforming cooperative management and community development
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <button className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-md font-semibold transition">
                Get Started Today
              </button>
            </Link>
            <Link href="/auth/signin">
              <button className="border-2 border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-4 rounded-md font-semibold transition">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <SocialMediaIcons />
    </div>
  );
} 