import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Shield,
    User, Bike, Briefcase, ArrowRight, RefreshCw
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import UserCard from '../components/UserCard';
import UserDetailsModal from '../components/UserDetailsModal';

const UsersPage = () => {
    const [users, setUsers] = useState(() => {
        const cached = localStorage.getItem('users_cache_default');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('users_stats_cache');
        return cached ? JSON.parse(cached) : {
            totalUsers: 0,
            customers: 0,
            riders: 0,
            admins: 0,
            managers: 0
        };
    });

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const { socket } = useSocket();

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            fetchStats();
            fetchUsers();
        };
        socket.on('user:registered', handleUpdate);
        socket.on('user:deleted', handleUpdate);
        socket.on('user:updated', handleUpdate);
        return () => {
            socket.off('user:registered', handleUpdate);
            socket.off('user:deleted', handleUpdate);
            socket.off('user:updated', handleUpdate);
        };
    }, [socket, page, roleFilter, search]);

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter, search]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/users/stats');
            if (response.data.success) {
                setStats(response.data.data);
                localStorage.setItem('users_stats_cache', JSON.stringify(response.data.data));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12, // Increased for grid
                ...(roleFilter !== 'all' && { role: roleFilter }),
                ...(search && { search })
            };
            const response = await api.get('/admin/users', { params });
            if (response.data.success) {
                setUsers(response.data.data);
                if (page === 1 && roleFilter === 'all' && !search) {
                    localStorage.setItem('users_cache_default', JSON.stringify(response.data.data));
                }
                setTotalPages(response.data.pagination.totalPages);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (user) => {
        const currentStatus = user.isActive !== false;
        try {
            const endpoint = currentStatus
                ? `/admin/users/${user._id}/deactivate`
                : `/admin/users/${user._id}/activate`;

            const response = await api.put(endpoint);
            if (response.data.success) {
                setUsers(users.map(u =>
                    u._id === user._id ? { ...u, isActive: !currentStatus } : u
                ));
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Failed to update user status');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await api.delete(`/admin/users/${userId}`);
            if (response.data.success) {
                setUsers(users.filter(u => u._id !== userId));
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">User Management</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">View and manage all users, riders, and staff</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Accounts"
                    value={stats.totalUsers}
                    icon={Users}
                    theme="blue"
                    desc="Registered Users"
                    loading={loading && !stats.totalUsers}
                />
                <StatCard
                    label="Customers"
                    value={stats.customers}
                    icon={User}
                    theme="green"
                    desc="App Users"
                    loading={loading && !stats.totalUsers}
                />
                <StatCard
                    label="Riders"
                    value={stats.riders}
                    icon={Bike}
                    theme="orange"
                    desc="Delivery Fleet"
                    loading={loading && !stats.totalUsers}
                />
                <StatCard
                    label="Staff"
                    value={stats.admins + stats.managers}
                    icon={Shield}
                    theme="purple"
                    desc="Admins & Managers"
                    loading={loading && !stats.totalUsers}
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex overflow-x-auto w-full md:w-auto gap-2 bg-gray-50/50 p-1.5 rounded-2xl no-scrollbar border border-gray-100">
                    {['all', 'customer', 'rider', 'admin', 'manager'].map(role => (
                        <button
                            key={role}
                            onClick={() => { setRoleFilter(role); setPage(1); }}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all capitalize whitespace-nowrap uppercase tracking-wider ${roleFilter === role
                                ? 'bg-[#56763D] text-white shadow-lg'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 uppercase"
                    />
                </div>
            </div>

            {/* Content Area */}
            {loading && users.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-64"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="p-12 bg-red-50 border border-red-100 rounded-[2rem] text-center">
                    <p className="text-red-500 font-black uppercase text-sm">{error}</p>
                    <button onClick={fetchUsers} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase">Try again</button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <UserCard
                                key={user._id}
                                user={user}
                                onToggleStatus={toggleStatus}
                                onDelete={handleDelete}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                            <div className="p-6 bg-gray-50 rounded-full mb-6">
                                <Users className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No users found</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Try adjusting your filters</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12 mb-6">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-12 h-12 rounded-2xl text-xs font-black transition-all shadow-sm ${page === p
                                        ? 'bg-[#56763D] text-white shadow-xl scale-110'
                                        : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <UserDetailsModal
                isOpen={showDetailsModal}
                user={selectedUser}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                }}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-indigo-700 shadow-blue-100 text-blue-600 bg-blue-50',
        purple: 'from-purple-600 to-pink-700 shadow-purple-100 text-purple-600 bg-purple-50',
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50'
    };
    const style = themes[theme] || themes.blue;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');

    return (
        <div className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                    <h3 className={`text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none ${loading ? 'animate-pulse opacity-50' : ''}`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-md ${shadow} shrink-0`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
            </div>
            {desc && (
                <div className="mt-3">
                    <div className={`inline-flex items-center gap-1 py-0.5 px-2.5 ${bgColor} rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight ${textColor}`}>
                        <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                        <span className="leading-tight">{desc}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
