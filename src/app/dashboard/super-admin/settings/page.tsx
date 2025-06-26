'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SystemSettingsPage() {
    // Example state hooks for form fields (expand as needed)
    const [platformName, setPlatformName] = useState("Nogalss Platform");
    const [supportEmail, setSupportEmail] = useState("support@nogalss.com");
    const [primaryColor, setPrimaryColor] = useState("#0D5E42");
    const [secondaryColor, setSecondaryColor] = useState("#FFD600");
    const [paystackKey, setPaystackKey] = useState("");
    const [registrationFee, setRegistrationFee] = useState(1000);
    const [transactionFee, setTransactionFee] = useState(1.5);
    const [emailProvider, setEmailProvider] = useState("Resend");
    const [smsProvider, setSmsProvider] = useState("Twilio");
    const [passwordPolicy, setPasswordPolicy] = useState("Minimum 8 characters, 1 number");
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [twoFA, setTwoFA] = useState(false);

    // Placeholder for audit logs
    const auditLogs = [
        { action: "Changed registration fee", user: "admin@nogalss.com", date: "2024-06-24 10:00" },
        { action: "Updated logo", user: "admin@nogalss.com", date: "2024-06-23 15:22" },
        { action: "Added new admin", user: "super@nogalss.com", date: "2024-06-22 09:10" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <Link href="/dashboard/super-admin" className="text-[#0D5E42] hover:text-[#0A4A35]">
                    &larr; Back to Dashboard
                </Link>
            </div>
            <div className="space-y-10">
                {/* General Settings */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Platform Name</label>
                            <input type="text" value={platformName} onChange={e => setPlatformName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Support Email</label>
                            <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                    </div>
                    <button className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35]">Save General</button>
                </section>

                {/* Branding */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Logo</label>
                            <input type="file" className="mt-1 block w-full" />
                        </div>
                        <div className="flex space-x-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="mt-1 w-12 h-12 p-0 border-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="mt-1 w-12 h-12 p-0 border-none" />
                            </div>
                        </div>
                    </div>
                    <button className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35]">Save Branding</button>
                </section>

                {/* Payment Settings */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Paystack Public Key</label>
                            <input type="text" value={paystackKey} onChange={e => setPaystackKey(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Registration Fee (₦)</label>
                            <input type="number" value={registrationFee} onChange={e => setRegistrationFee(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Transaction Fee (%)</label>
                            <input type="number" value={transactionFee} onChange={e => setTransactionFee(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                    </div>
                    <button className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35]">Save Payment</button>
                </section>

                {/* Notification Settings */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Provider</label>
                            <select value={emailProvider} onChange={e => setEmailProvider(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="Resend">Resend</option>
                                <option value="SendGrid">SendGrid</option>
                                <option value="Mailgun">Mailgun</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMS Provider</label>
                            <select value={smsProvider} onChange={e => setSmsProvider(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="Twilio">Twilio</option>
                                <option value="Termii">Termii</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700">Notification Templates</label>
                        <textarea className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows={3} placeholder="Customize notification templates here..." />
                    </div>
                    <button className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35]">Save Notifications</button>
                </section>

                {/* User & Role Management */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">User & Role Management</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Default Role for New Users</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                            <option>Member</option>
                            <option>Cooperative</option>
                            <option>Leader</option>
                            <option>Apex</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Invite Link</label>
                        <input type="text" value="https://nogalss.com/invite/xyz" readOnly className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Role Permissions</label>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 border">Role</th>
                                        <th className="px-4 py-2 border">Can Create</th>
                                        <th className="px-4 py-2 border">Can Edit</th>
                                        <th className="px-4 py-2 border">Can Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { role: "Super Admin", create: true, edit: true, delete: true },
                                        { role: "Apex", create: true, edit: true, delete: false },
                                        { role: "Leader", create: true, edit: false, delete: false },
                                        { role: "Cooperative", create: false, edit: false, delete: false },
                                        { role: "Member", create: false, edit: false, delete: false },
                                    ].map((r) => (
                                        <tr key={r.role}>
                                            <td className="px-4 py-2 border font-medium">{r.role}</td>
                                            <td className="px-4 py-2 border text-center"><input type="checkbox" checked={r.create} readOnly /></td>
                                            <td className="px-4 py-2 border text-center"><input type="checkbox" checked={r.edit} readOnly /></td>
                                            <td className="px-4 py-2 border text-center"><input type="checkbox" checked={r.delete} readOnly /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <button className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35]">Save User & Role</button>
                </section>

                {/* Security Settings */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password Policy</label>
                            <input type="text" value={passwordPolicy} onChange={e => setPasswordPolicy(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                            <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4">
                        <input type="checkbox" checked={twoFA} onChange={e => setTwoFA(e.target.checked)} className="mr-2" />
                        <label className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication (2FA)</label>
                    </div>
                    <button className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35]">Save Security</button>
                </section>

                {/* Data & Privacy */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Export Data</label>
                        <button className="mt-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Export All Data</button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Delete Account</label>
                        <button className="mt-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete Platform Account</button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Privacy Policy</label>
                        <input type="text" value="https://nogalss.com/privacy" readOnly className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100" />
                    </div>
                </section>

                {/* Audit Logs */}
                <section className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2 border">Action</th>
                                    <th className="px-4 py-2 border">User</th>
                                    <th className="px-4 py-2 border">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 border">{log.action}</td>
                                        <td className="px-4 py-2 border">{log.user}</td>
                                        <td className="px-4 py-2 border">{log.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
} 