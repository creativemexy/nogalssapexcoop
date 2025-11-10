'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { states } from '@/lib/data';
import PasswordInput from '@/components/ui/PasswordInput';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    cooperative?: {
        name: string;
        registrationNumber: string;
    };
    phoneNumber?: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    usersByRole: { role: string; count: number }[];
}

export default function ManageUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [isCreatingMember, setIsCreatingMember] = useState(false);
    const [createMemberError, setCreateMemberError] = useState<string | null>(null);
    const [createMemberSuccess, setCreateMemberSuccess] = useState<string | null>(null);
    const [cooperatives, setCooperatives] = useState<{ id: string; name: string; registrationNumber: string }[]>([]);
    const [loadingCooperatives, setLoadingCooperatives] = useState(false);
    const [occupations, setOccupations] = useState<{ id: string; name: string }[]>([]);
    const [loadingOccupations, setLoadingOccupations] = useState(false);
    const [memberFormData, setMemberFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        cooperativeId: '',
        nin: '',
        dateOfBirth: '',
        occupation: '',
        address: '',
        city: '',
        lga: '',
        state: '',
        phoneNumber: '',
        nextOfKinName: '',
        nextOfKinPhone: '',
        emergencyContact: '',
        emergencyPhone: '',
        savingAmount: '',
        savingFrequency: 'MONTHLY',
    });
    const [selectedState, setSelectedState] = useState('');
    const [availableLgas, setAvailableLgas] = useState<string[]>([]);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

    useEffect(() => {
        if (showAddMemberModal) {
            fetchCooperatives();
            fetchOccupations();
        }
    }, [showAddMemberModal]);

    useEffect(() => {
        if (selectedState) {
            const stateData = states.find(s => s.name === selectedState);
            setAvailableLgas(stateData?.lgas || []);
            setMemberFormData(prev => ({ ...prev, lga: '' }));
        }
    }, [selectedState]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                search: searchTerm,
                role: roleFilter,
                status: statusFilter,
                sortBy,
                sortOrder
            });

            const response = await fetch(`/api/admin/users?${params}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/users/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleUserAction = async (userId: string, action: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/${action}`, {
                method: 'PATCH',
            });
            if (response.ok) {
                fetchUsers();
                fetchStats();
            }
        } catch (error) {
            console.error(`Error ${action} user:`, error);
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedUsers.length === 0) return;

        try {
            const response = await fetch('/api/admin/users/bulk-action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedUsers,
                    action: bulkAction
                }),
            });
            if (response.ok) {
                setSelectedUsers([]);
                setBulkAction('');
                fetchUsers();
                fetchStats();
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const response = await fetch(`/api/admin/users/${userToDelete}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setShowDeleteModal(false);
                setUserToDelete(null);
                fetchUsers();
                fetchStats();
            } else {
                alert(data.error || 'Failed to delete user');
                console.error('Delete user error:', data);
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(error.message || 'Failed to delete user. Please try again.');
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        setSelectedUsers(users.map(user => user.id));
    };

    const clearSelection = () => {
        setSelectedUsers([]);
    };

    const fetchCooperatives = async () => {
        try {
            setLoadingCooperatives(true);
            const response = await fetch('/api/public/cooperatives');
            if (response.ok) {
                const data = await response.json();
                setCooperatives((data.cooperatives || []).map((coop: any) => ({
                    id: coop.id,
                    name: coop.name,
                    registrationNumber: coop.registrationNumber || coop.code
                })));
            }
        } catch (error) {
            console.error('Error fetching cooperatives:', error);
        } finally {
            setLoadingCooperatives(false);
        }
    };

    const fetchOccupations = async () => {
        try {
            setLoadingOccupations(true);
            const response = await fetch('/api/occupations');
            if (response.ok) {
                const data = await response.json();
                setOccupations(data.occupations || []);
            }
        } catch (error) {
            console.error('Error fetching occupations:', error);
        } finally {
            setLoadingOccupations(false);
        }
    };

    const handleCreateMember = async () => {
        setCreateMemberError(null);
        setCreateMemberSuccess(null);

        // Validate required fields (NIN is optional)
        if (!memberFormData.firstName || !memberFormData.lastName || !memberFormData.password ||
            !memberFormData.cooperativeId || !memberFormData.dateOfBirth ||
            !memberFormData.occupation || !memberFormData.address || !memberFormData.city ||
            !memberFormData.lga || !memberFormData.state || !memberFormData.phoneNumber ||
            !memberFormData.nextOfKinName || !memberFormData.nextOfKinPhone ||
            !memberFormData.emergencyContact || !memberFormData.emergencyPhone ||
            !memberFormData.savingAmount || !memberFormData.savingFrequency) {
            setCreateMemberError('All required fields must be filled');
            return;
        }

        // Validate NIN format if provided
        if (memberFormData.nin && memberFormData.nin.trim() !== '' && !/^\d{11}$/.test(memberFormData.nin)) {
            setCreateMemberError('NIN must be exactly 11 digits if provided');
            return;
        }

        if (memberFormData.password !== memberFormData.confirmPassword) {
            setCreateMemberError('Passwords do not match');
            return;
        }

        try {
            setIsCreatingMember(true);
            const response = await fetch('/api/admin/users/create-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberFormData)
            });

            const data = await response.json();

            if (response.ok) {
                setCreateMemberSuccess('Member created successfully!');
                setMemberFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    cooperativeId: '',
                    nin: '',
                    dateOfBirth: '',
                    occupation: '',
                    address: '',
                    city: '',
                    lga: '',
                    state: '',
                    phoneNumber: '',
                    nextOfKinName: '',
                    nextOfKinPhone: '',
                    emergencyContact: '',
                    emergencyPhone: '',
                    savingAmount: '',
                    savingFrequency: 'MONTHLY',
                });
                setSelectedState('');
                fetchUsers();
                fetchStats();
                setTimeout(() => {
                    setShowAddMemberModal(false);
                    setCreateMemberSuccess(null);
                }, 2000);
            } else {
                setCreateMemberError(data.error || 'Failed to create member');
            }
        } catch (error) {
            setCreateMemberError('An error occurred while creating the member');
        } finally {
            setIsCreatingMember(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'bg-red-100 text-red-800';
            case 'APEX': return 'bg-purple-100 text-purple-800';
            case 'LEADER': return 'bg-blue-100 text-blue-800';
            case 'COOPERATIVE': return 'bg-green-100 text-green-800';
            case 'MEMBER': return 'bg-gray-100 text-gray-800';
            case 'BUSINESS': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading && !users.length) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5E42]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition-colors"
                    >
                        + Add Member
                    </button>
                    <Link href="/dashboard/super-admin" className="text-[#0D5E42] hover:text-[#0A4A35]">
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                            </div>
                            <div className="text-3xl">👥</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                            </div>
                            <div className="text-3xl">✅</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.verifiedUsers}</p>
                            </div>
                            <div className="text-3xl">🔒</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                                <p className="text-2xl font-bold text-red-600">{stats.totalUsers - stats.activeUsers}</p>
                            </div>
                            <div className="text-3xl">❌</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
                        >
                            <option value="all">All Roles</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="APEX">Apex</option>
                            <option value="FINANCE">Finance</option>
                            <option value="APEX_FUNDS">Apex Funds</option>
                            <option value="NOGALSS_FUNDS">Nogalss Funds</option>
                            <option value="PARENT_ORGANIZATION">Parent Organization</option>
                            <option value="LEADER">Leaders</option>
                            <option value="COOPERATIVE">Cooperatives</option>
                            <option value="MEMBER">Members</option>
                            <option value="BUSINESS">Business</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="firstName-asc">Name A-Z</option>
                            <option value="firstName-desc">Name Z-A</option>
                            <option value="email-asc">Email A-Z</option>
                            <option value="email-desc">Email Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-yellow-800">
                                {selectedUsers.length} user(s) selected
                            </span>
                            <select
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                                className="border border-yellow-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                <option value="">Select Action</option>
                                <option value="activate">Activate</option>
                                <option value="deactivate">Deactivate</option>
                                <option value="verify">Verify</option>
                                <option value="unverify">Unverify</option>
                            </select>
                            <button
                                onClick={handleBulkAction}
                                disabled={!bulkAction}
                                className="bg-yellow-600 text-white px-4 py-1 rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50"
                            >
                                Apply
                            </button>
                        </div>
                        <button
                            onClick={clearSelection}
                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        onChange={selectAllUsers}
                                        className="rounded border-gray-300 text-[#0D5E42] focus:ring-[#0D5E42]"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cooperative
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="rounded border-gray-300 text-[#0D5E42] focus:ring-[#0D5E42]"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-[#0D5E42] flex items-center justify-center text-white font-semibold">
                                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                {user.phoneNumber && (
                                                    <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.cooperative ? (
                                            <div>
                                                <div className="font-medium">{user.cooperative.name}</div>
                                                <div className="text-gray-500">{user.cooperative.registrationNumber}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {user.isVerified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                                                className={`px-3 py-1 rounded-md text-xs ${
                                                    user.isActive 
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleUserAction(user.id, user.isVerified ? 'unverify' : 'verify')}
                                                className={`px-3 py-1 rounded-md text-xs ${
                                                    user.isVerified 
                                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                }`}
                                            >
                                                {user.isVerified ? 'Unverify' : 'Verify'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setUserToDelete(user.id);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="px-3 py-1 rounded-md text-xs bg-red-100 text-red-700 hover:bg-red-200"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                page === currentPage
                                                    ? 'z-10 bg-[#0D5E42] border-[#0D5E42] text-white'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete this user? This action cannot be undone.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setUserToDelete(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Add New Member</h3>
                            <button
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setCreateMemberError(null);
                                    setCreateMemberSuccess(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {createMemberError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                                {createMemberError}
                            </div>
                        )}

                        {createMemberSuccess && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                                {createMemberSuccess}
                            </div>
                        )}

                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Personal Information */}
                                <div className="md:col-span-2">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h4>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        value={memberFormData.firstName}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        value={memberFormData.lastName}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={memberFormData.email}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        maxLength={11}
                                        value={memberFormData.phoneNumber}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="08012345678"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIN (Optional)</label>
                                    <input
                                        type="text"
                                        maxLength={11}
                                        value={memberFormData.nin}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, nin: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="11 digits (optional)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">NIN verification is optional when creating members as super admin</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                    <input
                                        type="date"
                                        value={memberFormData.dateOfBirth}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                                    <select
                                        value={memberFormData.occupation}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, occupation: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                        disabled={loadingOccupations}
                                    >
                                        <option value="">Select Occupation</option>
                                        {occupations.map(occ => (
                                            <option key={occ.id} value={occ.id}>{occ.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cooperative *</label>
                                    <select
                                        value={memberFormData.cooperativeId}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, cooperativeId: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                        disabled={loadingCooperatives}
                                    >
                                        <option value="">Select Cooperative</option>
                                        {cooperatives.map(coop => (
                                            <option key={coop.id} value={coop.id}>{coop.name} ({coop.registrationNumber})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Address Information */}
                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Address Information</h4>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                    <input
                                        type="text"
                                        value={memberFormData.address}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        value={memberFormData.city}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                    <select
                                        value={selectedState}
                                        onChange={(e) => {
                                            setSelectedState(e.target.value);
                                            setMemberFormData(prev => ({ ...prev, state: e.target.value }));
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {states.map(state => (
                                            <option key={state.name} value={state.name}>{state.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">LGA *</label>
                                    <select
                                        value={memberFormData.lga}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, lga: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                        disabled={!selectedState}
                                    >
                                        <option value="">Select LGA</option>
                                        {availableLgas.map(lga => (
                                            <option key={lga} value={lga}>{lga}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Next of Kin */}
                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Next of Kin</h4>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Next of Kin Name *</label>
                                    <input
                                        type="text"
                                        value={memberFormData.nextOfKinName}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, nextOfKinName: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Next of Kin Phone *</label>
                                    <input
                                        type="tel"
                                        maxLength={11}
                                        value={memberFormData.nextOfKinPhone}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, nextOfKinPhone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="08012345678"
                                        required
                                    />
                                </div>

                                {/* Emergency Contact */}
                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                                    <input
                                        type="text"
                                        value={memberFormData.emergencyContact}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                                    <input
                                        type="tel"
                                        maxLength={11}
                                        value={memberFormData.emergencyPhone}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, emergencyPhone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="08012345678"
                                        required
                                    />
                                </div>

                                {/* Saving Preferences */}
                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Saving Preferences</h4>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saving Amount (₦) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={memberFormData.savingAmount}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, savingAmount: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saving Frequency *</label>
                                    <select
                                        value={memberFormData.savingFrequency}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, savingFrequency: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>

                                {/* Password */}
                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Account Password</h4>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <PasswordInput
                                        value={memberFormData.password}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                    <PasswordInput
                                        value={memberFormData.confirmPassword}
                                        onChange={(e) => setMemberFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                            <button
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setCreateMemberError(null);
                                    setCreateMemberSuccess(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                disabled={isCreatingMember}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMember}
                                disabled={isCreatingMember}
                                className="px-4 py-2 bg-[#0D5E42] text-white rounded-md hover:bg-[#0A4A35] disabled:opacity-50"
                            >
                                {isCreatingMember ? 'Creating...' : 'Create Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 