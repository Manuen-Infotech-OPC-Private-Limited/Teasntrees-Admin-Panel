import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Truck, Package, Bike, Clock,
    CheckCircle2, XCircle, Search,
    RefreshCw, Eye, MapPin, ArrowRight, IndianRupee,
    ChevronDown, Calendar, X
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import DeliveryDetailsModal from '../components/DeliveryDetailsModal';
import ExportButton from '../components/ExportButton';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TableSkeleton = () => (
    <div className="space-y-4 animate-pulse p-8">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>
        ))}
    </div>
);

const Deliveries = () => {
    const { brand: urlBrand } = useParams();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [datePreset, setDatePreset] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Helper: format YYYY-MM-DD using local time
    const toLocalDateStr = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const handleDatePresetChange = (preset) => {
        setDatePreset(preset);
        setPage(1);

        const now = new Date();
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'today') {
            const todayStr = toLocalDateStr(now);
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === 'yesterday') {
            const yest = new Date(now);
            yest.setDate(yest.getDate() - 1);
            const yestStr = toLocalDateStr(yest);
            setStartDate(yestStr);
            setEndDate(yestStr);
        } else if (preset === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now);
            monday.setDate(diff);
            setStartDate(toLocalDateStr(monday));
            setEndDate(toLocalDateStr(now));
        } else if (preset === 'this_month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(toLocalDateStr(start));
            setEndDate(toLocalDateStr(end));
        } else if (preset === 'last_month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            setStartDate(toLocalDateStr(start));
            setEndDate(toLocalDateStr(end));
        }
    };

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['deliveries-stats', urlBrand],
        queryFn: async () => {
            const response = await api.get('/admin/deliveries/stats');
            const data = response.data.data;
            localStorage.setItem('deliveries-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('deliveries-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Deliveries
    const { data: deliveryData, isLoading: loading, isFetching: deliveriesFetching, refetch: refetchDeliveries } = useQuery({
        queryKey: ['deliveries', page, statusFilter, startDate, endDate, urlBrand],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 10, sortBy: 'createdAt', order: 'desc' });
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const response = await api.get(`/admin/deliveries?${params.toString()}`);
            const data = response.data;
            return data;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    const isSyncing = deliveriesFetching;

    const handleSync = () => {
        queryClient.invalidateQueries({ queryKey: ['deliveries-stats'] });
        refetchDeliveries();
    };

    const deliveries = deliveryData?.data || [];
    const totalPages = deliveryData?.pagination?.totalPages || 1;

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['deliveries-stats', urlBrand] });
            queryClient.invalidateQueries({ queryKey: ['deliveries', urlBrand] });
        };
        socket.on('delivery:status-updated', handleUpdate);
        socket.on('order:status-updated', handleUpdate);
        return () => {
            socket.off('delivery:status-updated', handleUpdate);
            socket.off('order:status-updated', handleUpdate);
        };
    }, [socket, queryClient]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending_acceptance': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'picked_up': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'in_transit': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'failed': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending_acceptance': return <Clock className="w-3 h-3" />;
            case 'picked_up': return <Package className="w-3 h-3" />;
            case 'in_transit': return <Truck className="w-3 h-3" />;
            case 'delivered': return <CheckCircle2 className="w-3 h-3" />;
            case 'failed': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    const handleViewDetails = (delivery) => {
        setSelectedDelivery(delivery);
        setShowModal(true);
    };

    const filteredDeliveries = deliveries.filter(d =>
        d.orderId?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.riderId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Delivery Tracking</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Track deliveries and riders in real-time</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton
                        resource="deliveries"
                        filters={{
                            status: statusFilter === 'all' ? '' : statusFilter,
                            startDate,
                            endDate,
                            search: searchTerm
                        }}
                    />
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20 disabled:opacity-50 h-[48px]"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Refreshing...' : 'Refresh List'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Active" value={stats?.activeDeliveries || 0} icon={Truck} theme="indigo" desc="On the way" loading={statsLoading} />
                <StatCard label="Completed" value={stats?.completedDeliveries || 0} icon={CheckCircle2} theme="emerald" desc="Landed today" loading={statsLoading} />
                <StatCard label="Earnings" value={`₹${stats?.totalEarnings || 0}`} icon={IndianRupee} theme="amber" desc="Total payouts" loading={statsLoading} />
                <StatCard label="Failed" value={stats?.failedDeliveries || 0} icon={XCircle} theme="rose" desc="Failed/Returned" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-6 sm:p-8 border-b border-gray-100 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Rider, or Customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent focus:border-black rounded-2xl text-xs font-bold focus:outline-hidden transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#56763D] p-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            {/* Status Dropdown */}
                            <div className="relative min-w-[210px] w-full sm:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full bg-gray-50 border border-transparent focus:border-black rounded-2xl py-3.5 px-4 text-xs font-black uppercase text-gray-800 tracking-wider appearance-none focus:outline-hidden cursor-pointer pr-10 shadow-xs"
                                >
                                    <option value="all">STATUS: ALL</option>
                                    <option value="pending_acceptance">PENDING ACCEPTANCE</option>
                                    <option value="picked_up">PICKED UP</option>
                                    <option value="in_transit">IN TRANSIT</option>
                                    <option value="delivered">DELIVERED</option>
                                    <option value="failed">FAILED</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Date Range Preset Dropdown */}
                            <div className="relative min-w-[200px] w-full sm:w-auto">
                                <select
                                    value={datePreset}
                                    onChange={(e) => handleDatePresetChange(e.target.value)}
                                    className="w-full bg-gray-50 border border-transparent focus:border-black rounded-2xl py-3.5 px-4 text-xs font-black uppercase text-gray-800 tracking-wider appearance-none focus:outline-hidden cursor-pointer pr-10 shadow-xs"
                                >
                                    <option value="all">DATE: ALL TIME</option>
                                    <option value="today">TODAY</option>
                                    <option value="yesterday">YESTERDAY</option>
                                    <option value="this_week">THIS WEEK</option>
                                    <option value="this_month">THIS MONTH</option>
                                    <option value="last_month">LAST MONTH</option>
                                    <option value="custom">CUSTOM RANGE...</option>
                                </select>
                                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Custom Date Range Row */}
                    {(datePreset === 'custom' || startDate || endDate) && (
                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 bg-gray-50/50 p-4 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-gray-500" /> Date Filter:
                            </span>
                            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setDatePreset('custom');
                                        setPage(1);
                                    }}
                                    className="bg-white border border-gray-200 focus:border-black rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-hidden"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setDatePreset('custom');
                                        setPage(1);
                                    }}
                                    className="bg-white border border-gray-200 focus:border-black rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-hidden"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => handleDatePresetChange('all')}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase transition-all shadow-xs ml-auto"
                                >
                                    <X className="w-3 h-3" /> Clear Dates
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/30">
                                    <th className="px-8 py-6">Order ID</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">Rider</th>
                                    <th className="px-8 py-6">Location</th>
                                    <th className="px-8 py-6 text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDeliveries.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center text-gray-200 font-black uppercase tracking-[0.2em]">No deliveries found</td>
                                    </tr>
                                ) : (
                                    filteredDeliveries.map((delivery) => (
                                        <tr key={delivery._id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform">#{delivery.orderId?.orderNumber?.slice(-4)}</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-gray-900 uppercase mb-0.5">{delivery.customerId?.name || '---'}</p>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Started {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${getStatusColor(delivery.status)}`}>
                                                    {getStatusIcon(delivery.status)} {delivery.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center"><Bike className="w-3 h-3 text-gray-400" /></div>
                                                    <span className="text-xs font-black text-gray-700 uppercase">{delivery.riderId?.name || 'WAITING'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black uppercase text-[10px] text-gray-400 tracking-widest">
                                                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> ON THE WAY</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => handleViewDetails(delivery)} className="p-3 bg-gray-50 text-gray-400 hover:bg-[#56763D] hover:text-white rounded-2xl transition-all shadow-sm">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {totalPages > 1 && (
                    <div className="p-6 bg-gray-50/20 border-t border-gray-50 flex justify-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 disabled:opacity-30"><ArrowRight className="w-5 h-5 rotate-180 text-gray-400" /></button>
                        <span className="bg-white px-6 py-3 rounded-2xl border border-gray-100 font-black text-[10px] text-gray-400 flex items-center tracking-widest uppercase">PAGE {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#56763D] text-white disabled:opacity-30"><ArrowRight className="w-5 h-5 text-white" /></button>
                    </div>
                )}
            </div>

            <DeliveryDetailsModal isOpen={showModal} onClose={() => setShowModal(false)} delivery={selectedDelivery} />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-100 text-indigo-600 bg-indigo-50',
        emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        amber: 'from-amber-500 to-amber-600 shadow-amber-100 text-amber-600 bg-amber-50',
        rose: 'from-rose-600 to-rose-700 shadow-rose-100 text-rose-600 bg-rose-50'
    };
    const style = themes[theme] || themes.indigo;
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

export default Deliveries;
