import { useState, useEffect } from 'react';
import { Users, Search, Filter, UserPlus, TrendingUp, UserCheck, UserX, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import CustomerCard from '../components/CustomerCard';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import ExportButton from '../components/ExportButton';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-64"></div>
        ))}
    </div>
);

const Customers = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 20;

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['customers-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/customers/stats');
            const data = response.data.data;
            localStorage.setItem('customers-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('customers-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Customers
    const { data: customersData, isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['customers', page, searchTerm, filterStatus],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit });
            if (searchTerm) params.append('search', searchTerm);
            if (filterStatus !== 'all') {
                params.append('isActive', filterStatus === 'active' ? 'true' : 'false');
            }
            const response = await api.get(`/admin/customers?${params.toString()}`);
            const data = response.data;
            const cacheKey = `customers-cache-${page}-${filterStatus}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cacheKey = `customers-cache-${page}-${filterStatus}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    const isSyncing = isFetching;

    const customers = customersData?.data || [];
    const paginationInfo = customersData?.pagination || { totalPages: 1, totalItems: 0 };

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
        };
        socket.on('user:registered', handleUpdate);
        socket.on('user:deleted', handleUpdate);
        socket.on('user:activated', handleUpdate);
        socket.on('user:deactivated', handleUpdate);
        return () => {
            socket.off('user:registered', handleUpdate);
            socket.off('user:deleted', handleUpdate);
            socket.off('user:activated', handleUpdate);
            socket.off('user:deactivated', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleViewDetails = (customer) => {
        setSelectedCustomer(customer);
        setShowDetailsModal(true);
    };

    const handleToggleStatus = async (customer) => {
        const action = customer.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${customer.name}?`)) return;
        try {
            await api.put(`/admin/customers/${customer._id}/status`);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
        } catch (error) { console.error('Failed to update status:', error); }
    };

    const handleDelete = async (customer) => {
        if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return;
        try {
            await api.delete(`/admin/customers/${customer._id}`);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
        } catch (error) { console.error('Failed to delete customer:', error); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Customers</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage customer accounts</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <ExportButton
                        resource="customers"
                        filters={{
                            search: searchTerm,
                            status: filterStatus === 'all' ? '' : filterStatus
                        }}
                    />
                    <button
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
                            refetch();
                        }}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Total Customers" value={stats?.totalCustomers || 0} icon={Users} theme="blue" desc="All customers" loading={statsLoading} />
                <StatCard label="Active Accounts" value={stats?.activeCustomers || 0} icon={UserCheck} theme="green" desc="Can order" loading={statsLoading} />
                <StatCard label="With Orders" value={stats?.customersWithOrders || 0} icon={TrendingUp} theme="purple" desc="Ordered at least once" loading={statsLoading} />
                <StatCard label="Joined Today" value={stats?.newCustomersToday || 0} icon={UserPlus} theme="orange" desc="New users today" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 p-4 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Search by name, mobile, email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-xs sm:text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-50 rounded-[1.5rem]">
                        {['all', 'active', 'inactive'].map((status) => (
                            <button key={status} onClick={() => { setFilterStatus(status); setPage(1); }} className={`px-4 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-blue-500'}`}>{status}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="min-h-[400px]">
                {customers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {customers.map((customer) => (
                            <CustomerCard key={customer._id} customer={customer} onViewDetails={handleViewDetails} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 font-black text-gray-200 uppercase tracking-widest tracking-widest">
                        <Users className="w-20 h-20 mx-auto mb-4 opacity-20" />
                        <h3 className="text-2xl">No users found</h3>
                    </div>
                )}
            </div>

            {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase disabled:opacity-30">Prev</button>
                    <span className="font-black text-gray-400 uppercase tracking-tighter">Page {page} / {paginationInfo.totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(paginationInfo.totalPages, p + 1))} disabled={page === paginationInfo.totalPages} className="px-6 py-3 bg-[#56763D] text-white rounded-2xl text-xs font-black uppercase disabled:opacity-30">Next</button>
                </div>
            )}

            {showDetailsModal && selectedCustomer && (
                <CustomerDetailsModal customer={selectedCustomer} onClose={() => { setShowDetailsModal(false); setSelectedCustomer(null); }} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['customers'] })} />
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-blue-700 shadow-blue-100 text-blue-600 bg-blue-50',
        green: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        purple: 'from-purple-600 to-purple-700 shadow-purple-100 text-purple-600 bg-purple-50',
        orange: 'from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50'
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

export default Customers;
