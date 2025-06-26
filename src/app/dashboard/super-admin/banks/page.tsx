'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { banks } from '@/lib/data';

interface Bank {
    id: string;
    name: string;
    code: string;
}

export default function BanksPage() {
    const [bankList, setBankList] = useState<Bank[]>(banks);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAdd = () => {
        setFormData({ name: '', code: '' });
        setIsAddModalOpen(true);
        setError(null);
        setSuccess(null);
    };

    const handleEdit = (bank: Bank) => {
        setEditingBank(bank);
        setFormData({ name: bank.name, code: bank.code });
        setIsEditModalOpen(true);
        setError(null);
        setSuccess(null);
    };

    const handleDelete = async (bankId: string) => {
        if (!confirm('Are you sure you want to delete this bank?')) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // In a real app, you'd make an API call here
            // For now, we'll just update the local state
            setBankList(prev => prev.filter(bank => bank.id !== bankId));
            setSuccess('Bank deleted successfully');
        } catch (err: any) {
            setError(err.message || 'Failed to delete bank');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isEditModalOpen && editingBank) {
                // Update existing bank
                setBankList(prev => prev.map(bank => 
                    bank.id === editingBank.id 
                        ? { ...bank, name: formData.name, code: formData.code }
                        : bank
                ));
                setSuccess('Bank updated successfully');
                setIsEditModalOpen(false);
            } else {
                // Add new bank
                const newBank: Bank = {
                    id: Date.now().toString(),
                    name: formData.name,
                    code: formData.code
                };
                setBankList(prev => [...prev, newBank]);
                setSuccess('Bank added successfully');
                setIsAddModalOpen(false);
            }
            setFormData({ name: '', code: '' });
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEditingBank(null);
        setFormData({ name: '', code: '' });
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Banks</h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleAdd}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Add Bank
                    </button>
                    <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bankList.map((bank) => (
                                <tr key={bank.id} className="hover:bg-green-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {bank.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {bank.code || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(bank)}
                                                className="text-yellow-600 hover:text-yellow-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bank.id)}
                                                className="text-red-600 hover:text-red-900"
                                                disabled={isLoading}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {isEditModalOpen ? 'Edit Bank' : 'Add New Bank'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : (isEditModalOpen ? 'Update' : 'Add')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 