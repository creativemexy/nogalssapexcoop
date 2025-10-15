'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';

interface SystemSettings {
  [category: string]: {
    [key: string]: {
      value: string;
      description?: string;
      updatedAt: string;
      updatedBy: string;
    };
  };
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  date: string;
  details?: any;
}

export default function SystemSettingsPage() {
    const { data: session } = useSession();
    const socket = useSocket();
    
    // State management
    const [settings, setSettings] = useState<SystemSettings>({});
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [platformName, setPlatformName] = useState("");
    const [supportEmail, setSupportEmail] = useState("");
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
    const [global2FAEnabled, setGlobal2FAEnabled] = useState<boolean | null>(null);

    // Allocation percentage state
    const [allocations, setAllocations] = useState({
        apexFunds: 40,
        nogalssFunds: 20,
        cooperativeShare: 20,
        leaderShare: 15,
        parentOrganizationShare: 5
    });
    const [allocationTotal, setAllocationTotal] = useState(100);

    // Calculate total allocation percentage whenever allocations change
    useEffect(() => {
        const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
        setAllocationTotal(total);
    }, [allocations]);

    // Load settings and audit logs
    useEffect(() => {
        fetchSettings();
        fetchAuditLogs();
        fetchAllocationPercentages();
        
        // Set up real-time updates
        if (socket) {
            const handleUpdate = () => {
                fetchSettings();
                fetchAuditLogs();
            };
            socket.on('dashboard:update', handleUpdate);
            return () => {
                socket.off('dashboard:update', handleUpdate);
            };
        }
    }, [socket]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();
            setSettings(data.settings);
            
            // Update form state with fetched settings
            if (data.settings.general) {
                setPlatformName(data.settings.general.platformName?.value || "");
                setSupportEmail(data.settings.general.supportEmail?.value || "");
            }
            if (data.settings.branding) {
                setPrimaryColor(data.settings.branding.primaryColor?.value || "#0D5E42");
                setSecondaryColor(data.settings.branding.secondaryColor?.value || "#FFD600");
            }
            if (data.settings.payment) {
                setPaystackKey(data.settings.payment.paystackKey?.value || "");
                setRegistrationFee(parseInt(data.settings.payment.registrationFee?.value || "1000"));
                setTransactionFee(parseFloat(data.settings.payment.transactionFee?.value || "1.5"));
            }
            if (data.settings.notification) {
                setEmailProvider(data.settings.notification.emailProvider?.value || "Resend");
                setSmsProvider(data.settings.notification.smsProvider?.value || "Twilio");
            }
            if (data.settings.security) {
                setPasswordPolicy(data.settings.security.passwordPolicy?.value || "Minimum 8 characters, 1 number");
                setSessionTimeout(parseInt(data.settings.security.sessionTimeout?.value || "30"));
                setTwoFA(data.settings.security.twoFA?.value === "true");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await fetch('/api/admin/security/audit');
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const data = await response.json();
            setAuditLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        }
    };

    const fetchAllocationPercentages = async () => {
        try {
            const response = await fetch('/api/admin/allocation-percentages');
            if (!response.ok) throw new Error('Failed to fetch allocation percentages');
            const data = await response.json();
            setAllocations(data.allocations);
            setAllocationTotal(data.totalPercentage);
        } catch (err) {
            console.error('Failed to fetch allocation percentages:', err);
        }
    };

    const saveAllocationPercentages = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/admin/allocation-percentages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allocations }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save allocation percentages');
            }

            const data = await response.json();
            setSuccess(data.message || 'Allocation percentages saved successfully');
            setAllocationTotal(data.totalPercentage);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save allocation percentages');
        } finally {
            setSaving(false);
        }
    };

    const saveSettings = async (category: string, settingsData: Record<string, string>) => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const settingsArray = Object.entries(settingsData).map(([key, value]) => ({
                category,
                key,
                value: String(value),
            }));

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: settingsArray }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }

            setSuccess(`${category} settings saved successfully`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGeneral = () => {
        saveSettings('general', {
            platformName,
            supportEmail,
        });
    };

    const handleSaveBranding = () => {
        saveSettings('branding', {
            primaryColor,
            secondaryColor,
        });
    };

    const handleSavePayment = () => {
        saveSettings('payment', {
            paystackKey,
            registrationFee: registrationFee.toString(),
            transactionFee: transactionFee.toString(),
        });
    };

    const handleSaveNotification = () => {
        saveSettings('notification', {
            emailProvider,
            smsProvider,
        });
    };

    const handleSaveSecurity = () => {
        saveSettings('security', {
            passwordPolicy,
            sessionTimeout: sessionTimeout.toString(),
            twoFA: twoFA.toString(),
        });
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
                <Link href="/dashboard/super-admin" className="text-[#0D5E42] hover:text-[#0A4A35] dark:text-green-400 dark:hover:text-green-300">
                    &larr; Back to Dashboard
                </Link>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}

            <div className="space-y-10">
                {/* General Settings */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">General Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platform Name</label>
                            <input 
                                type="text" 
                                value={platformName} 
                                onChange={e => setPlatformName(e.target.value)} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Support Email</label>
                            <input 
                                type="email" 
                                value={supportEmail} 
                                onChange={e => setSupportEmail(e.target.value)} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveGeneral}
                        disabled={saving}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save General'}
                    </button>
                </section>

                {/* Branding */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                            <input type="file" className="mt-1 block w-full text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex space-x-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Color</label>
                                <input 
                                    type="color" 
                                    value={primaryColor} 
                                    onChange={e => setPrimaryColor(e.target.value)} 
                                    className="mt-1 w-12 h-12 p-0 border-none rounded" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Color</label>
                                <input 
                                    type="color" 
                                    value={secondaryColor} 
                                    onChange={e => setSecondaryColor(e.target.value)} 
                                    className="mt-1 w-12 h-12 p-0 border-none rounded" 
                                />
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveBranding}
                        disabled={saving}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Branding'}
                    </button>
                </section>

                {/* Payment Settings */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Payment Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paystack Public Key</label>
                            <input 
                                type="text" 
                                value={paystackKey} 
                                onChange={e => setPaystackKey(e.target.value)} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Fee (₦)</label>
                            <input 
                                type="number" 
                                value={registrationFee} 
                                onChange={e => setRegistrationFee(Number(e.target.value))} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Fee (%)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={transactionFee} 
                                onChange={e => setTransactionFee(Number(e.target.value))} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleSavePayment}
                        disabled={saving}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Payment'}
                    </button>
                </section>

                {/* Notification Settings */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Notification Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Provider</label>
                            <select 
                                value={emailProvider} 
                                onChange={e => setEmailProvider(e.target.value)} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                <option value="Resend">Resend</option>
                                <option value="SendGrid">SendGrid</option>
                                <option value="Mailgun">Mailgun</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMS Provider</label>
                            <select 
                                value={smsProvider} 
                                onChange={e => setSmsProvider(e.target.value)} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                <option value="Twilio">Twilio</option>
                                <option value="Termii">Termii</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Templates</label>
                        <textarea 
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            rows={3} 
                            placeholder="Customize notification templates here..." 
                        />
                    </div>
                    <button 
                        onClick={handleSaveNotification}
                        disabled={saving}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Notifications'}
                    </button>
                </section>

                {/* User & Role Management */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">User & Role Management</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Role for New Users</label>
                        <select className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                            <option>Member</option>
                            <option>Cooperative</option>
                            <option>Leader</option>
                            <option>Apex</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invite Link</label>
                        <input 
                            type="text" 
                            value="https://nogalss.com/invite/xyz" 
                            readOnly 
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Permissions</label>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">Role</th>
                                        <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">Can Create</th>
                                        <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">Can Edit</th>
                                        <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">Can Delete</th>
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
                                            <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-900 dark:text-gray-100">{r.role}</td>
                                            <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-center"><input type="checkbox" checked={r.create} readOnly /></td>
                                            <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-center"><input type="checkbox" checked={r.edit} readOnly /></td>
                                            <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-center"><input type="checkbox" checked={r.delete} readOnly /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <button 
                        disabled={saving}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save User & Role'}
                    </button>
                </section>

                {/* Security Settings */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Security Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password Policy</label>
                            <input 
                                type="text" 
                                value={passwordPolicy} 
                                onChange={e => setPasswordPolicy(e.target.value)} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Timeout (minutes)</label>
                            <input 
                                type="number" 
                                value={sessionTimeout} 
                                onChange={e => setSessionTimeout(Number(e.target.value))} 
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                    </div>
                    <div className="flex items-center mt-4">
                        <input 
                            type="checkbox" 
                            checked={twoFA} 
                            onChange={e => setTwoFA(e.target.checked)} 
                            className="mr-2" 
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Two-Factor Authentication (2FA)</label>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button 
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" 
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || 'Failed to initiate 2FA');
                                    // eslint-disable-next-line no-alert
                                    alert('Scan the QR code from the setup modal in a future iteration.');
                                    console.log('2FA setup response', data);
                                } catch (e:any) {
                                    alert(e.message || 'Failed to start 2FA setup');
                                }
                            }}
                        >
                            Start 2FA Setup
                        </button>
                        <button 
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" 
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/admin/2fa/setup', { method: 'DELETE' });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');
                                    alert('2FA disabled');
                                } catch (e:any) {
                                    alert(e.message || 'Failed to disable 2FA');
                                }
                            }}
                        >
                            Disable 2FA
                        </button>
                    </div>
                    <button 
                        onClick={handleSaveSecurity}
                        disabled={saving}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Security'}
                    </button>
                </section>

                {/* Allocation Percentages */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Registration Fee Allocation</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Configure how registration fees are distributed among different stakeholders. 
                        Total must equal 100%.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Apex Funds (%)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={allocations.apexFunds} 
                                onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => ({ ...prev, apexFunds: value }));
                                }}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nogalss Funds (%)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={allocations.nogalssFunds} 
                                onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => ({ ...prev, nogalssFunds: value }));
                                }}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cooperative Share (%)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={allocations.cooperativeShare} 
                                onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => ({ ...prev, cooperativeShare: value }));
                                }}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Leader Share (%)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={allocations.leaderShare} 
                                onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => ({ ...prev, leaderShare: value }));
                                }}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Parent Organization Share (%)
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={allocations.parentOrganizationShare} 
                                onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => ({ ...prev, parentOrganizationShare: value }));
                                }}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Total Allocation:
                            </span>
                            <span className={`text-lg font-bold ${Math.abs(allocationTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                {allocationTotal.toFixed(1)}%
                            </span>
                        </div>
                        {Math.abs(allocationTotal - 100) > 0.01 && (
                            <p className="text-sm text-red-600 mt-2">
                                Total must equal exactly 100%
                            </p>
                        )}
                    </div>
                    
                    <button 
                        onClick={saveAllocationPercentages}
                        disabled={saving || Math.abs(allocationTotal - 100) > 0.01}
                        className="mt-6 bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Allocation Percentages'}
                    </button>
                </section>

                {/* Data & Privacy */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Data & Privacy</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Export Data</label>
                        <button className="mt-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Export All Data</button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delete Account</label>
                        <button className="mt-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete Platform Account</button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Privacy Policy</label>
                        <input 
                            type="text" 
                            value="https://nogalss.com/privacy" 
                            readOnly 
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                        />
                    </div>
                </section>

                {/* Audit Logs */}
                <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Audit Logs</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">Action</th>
                                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">User</th>
                                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">{log.action}</td>
                                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">{log.user}</td>
                                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">{log.date}</td>
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