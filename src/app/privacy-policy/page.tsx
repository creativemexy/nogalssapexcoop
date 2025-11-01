import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Privacy Policy - Nogalss National Apex Cooperative Society Ltd
              </h1>
              <Link href="/">
                <button className="group relative px-6 py-3 bg-gradient-to-r from-[#0D5E42] to-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2">
                  <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </button>
              </Link>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Nogalss National Apex Cooperative Society Ltd ("we," "our," or "us") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services, in compliance with the Nigeria Data Protection Act (NDPA) 2023.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Name, email address, phone number</li>
                <li>Date of birth and address</li>
                <li>National Identification Number (NIN)</li>
                <li>Bank account details</li>
                <li>Next of kin information</li>
                <li>Profile images and documents</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Financial Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Transaction history</li>
                <li>Contribution records</li>
                <li>Loan applications and repayments</li>
                <li>Investment details</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and preferences</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Legal Basis for Processing</h3>
              <p className="text-gray-700 mb-4">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Consent:</strong> When you have given clear consent for specific processing activities</li>
                <li><strong>Contract:</strong> To fulfill our contractual obligations to you</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                <li><strong>Legitimate Interests:</strong> For our legitimate business interests, balanced against your rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Purposes of Processing</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Account management and service delivery</li>
                <li>Financial transactions and record keeping</li>
                <li>Communication and customer support</li>
                <li>Compliance with regulatory requirements</li>
                <li>Security and fraud prevention</li>
                <li>Service improvement and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Service Providers:</strong> With trusted third parties who assist in service delivery</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Consent:</strong> When you have given explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Encryption of data at rest and in transit</li>
                <li>Access controls and authentication</li>
                <li>Regular security assessments</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal data for the following periods:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Financial Records:</strong> 7 years from the last transaction</li>
                <li><strong>Account Information:</strong> 3 years after account closure</li>
                <li><strong>Marketing Data:</strong> Until consent is withdrawn</li>
                <li><strong>Legal Requirements:</strong> As required by applicable laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Under the Nigeria Data Protection Act, you have the following rights:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Right to Information</h3>
                  <p className="text-gray-700 text-sm">You have the right to be informed about how your data is processed.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Right of Access</h3>
                  <p className="text-gray-700 text-sm">You can request access to your personal data.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Right to Rectification</h3>
                  <p className="text-gray-700 text-sm">You can request correction of inaccurate data.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Right to Erasure</h3>
                  <p className="text-gray-700 text-sm">You can request deletion of your data in certain circumstances.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Right to Portability</h3>
                  <p className="text-gray-700 text-sm">You can request your data in a structured format.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Right to Object</h3>
                  <p className="text-gray-700 text-sm">You can object to certain types of processing.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand website usage</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-700 mb-4">
                If we transfer your data outside Nigeria, we ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Adequacy decisions by the data protection authority</li>
                <li>Standard contractual clauses</li>
                <li>Binding corporate rules</li>
                <li>Your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not directed to children under 18. We do not knowingly collect personal information from children without parental consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Data Breach Notification</h2>
              <p className="text-gray-700 mb-4">
                In the event of a data breach that poses a high risk to your rights and freedoms, we will:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Notify the data protection authority within 72 hours</li>
                <li>Inform affected individuals without undue delay</li>
                <li>Provide details of the breach and measures taken</li>
                <li>Offer guidance on protective steps you can take</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  For any questions about this Privacy Policy or to exercise your rights, please contact us:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Data Protection Officer</h3>
                    <p className="text-gray-700">Email: privacy@nogalss.org</p>
                    <p className="text-gray-700">Phone: +234 706 380 7477</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">General Inquiries</h3>
                    <p className="text-gray-700">Email: info@nogalss.org</p>
                    <p className="text-gray-700">Address: 4th Floor, Jibril Aminu House, National Commission for Colleges of Education (NCCE), Plot 829 Ralph Shodeinde Street, Central Business District, FCT-Abuja</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Posting the updated policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a notice on our platform</li>
              </ul>
            </section>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Compliance Statement</h3>
              <p className="text-green-700">
                This Privacy Policy is designed to comply with the Nigeria Data Protection Act (NDPA) 2023 and other applicable data protection laws. We are committed to protecting your privacy and ensuring the security of your personal data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

