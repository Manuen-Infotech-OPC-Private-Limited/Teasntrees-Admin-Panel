import React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    ShoppingBag, Search, Eye, Clock,
    User, MapPin, Package, ArrowRight, RefreshCw,
    CheckCircle2, PlayCircle, Loader2, CreditCard,
    ChevronDown, ChevronUp, AlertCircle, DollarSign,
    Filter, Image as ImageIcon, XCircle, Calendar, X
} from 'lucide-react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderDetailsModal from '../components/OrderDetailsModal';
import ExportButton from '../components/ExportButton';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function Orders() {
    const { brand: urlBrand } = useParams();
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [datePreset, setDatePreset] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        limit: 15
    });

    // Helper: format YYYY-MM-DD using local time
    const toLocalDateStr = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const handleDatePresetChange = (preset) => {
        setDatePreset(preset);
        setPagination(p => ({ ...p, currentPage: 1 }));

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
        queryKey: ['orders-stats', urlBrand],
        queryFn: async () => {
            const response = await api.get('/admin/orders/stats');
            return response.data.data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 30000
    });

    // Fetch Orders with status and date filters
    const { data: ordersData, isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['orders', pagination.currentPage, searchTerm, statusFilter, startDate, endDate, urlBrand],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit
            });
            if (searchTerm) params.append('search', searchTerm);
            // 'stale' is not a status: it lists orders the stale-order job has
            // flagged (no activity for 24h) that are still open.
            if (statusFilter === 'stale') params.append('stale', 'true');
            else if (statusFilter !== 'all') params.append('status', statusFilter);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const response = await api.get(`/admin/orders?${params.toString()}`);
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    const orders = ordersData?.data || [];
    const paginationInfo = ordersData?.pagination || { totalPages: 1, totalItems: 0 };

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
        };
        // The stale-order job flagged orders nobody has touched for 24 hours.
        const handleStale = (data = {}) => {
            const n = data.orders?.length || 0;
            toast(`${n === 1 ? `Order #${data.orders[0].orderNumber} has` : `${n} orders have`} had no activity for 24 hours and will be cancelled automatically unless someone acts. See "Needs attention".`, { icon: '⏰', duration: 15000 });
            handleUpdate();
        };
        socket.on('order:new', handleUpdate);
        socket.on('order:status-updated', handleUpdate);
        socket.on('order:stale', handleStale);
        return () => {
            socket.off('order:new', handleUpdate);
            socket.off('order:status-updated', handleUpdate);
            socket.off('order:stale', handleStale);
        };
    }, [socket, queryClient]);

    const handleQuickStatusUpdate = async (orderId, status) => {
        setUpdatingId(orderId);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status });
            toast.success(`Order marked as ${status}`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleQuickPaymentUpdate = async (orderId, paymentStatus) => {
        setUpdatingId(orderId);
        try {
            await api.put(`/admin/orders/${orderId}/payment-status`, { paymentStatus });
            toast.success('Payment updated');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const statCards = [
        { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, theme: 'blue', desc: 'All time' },
        { title: 'Pending', value: stats?.pendingOrders || 0, icon: Clock, theme: 'orange', desc: 'Needs confirmation' },
        { title: 'Preparing', value: stats?.inProgressOrders || 0, icon: PlayCircle, theme: 'purple', desc: 'Being prepared' },
        { title: "Today's Revenue", value: `₹${stats?.todayRevenue || 0}`, icon: DollarSign, theme: 'green', desc: 'Success orders today' }
    ];

    const filterOptions = [
        { label: 'All', value: 'all' },
        { label: 'Needs attention', value: 'stale' },
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Ready', value: 'ready' },
        { label: 'DELIVERED', value: 'delivered' },
        { label: 'CANCELLED', value: 'cancelled' }
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Orders Management</h1>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Management interface</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <ExportButton
                        resource="orders"
                        filters={{
                            status: statusFilter === 'stale' ? '' : (statusFilter === 'all' ? '' : statusFilter),
                            startDate,
                            endDate,
                            search: searchTerm
                        }}
                    />
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-5 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Gradient Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order #, customer name, mobile..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
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
                        <div className="relative min-w-[190px] w-full sm:w-auto">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination(p => ({ ...p, currentPage: 1 }));
                                }}
                                className="w-full bg-gray-50 border border-transparent focus:border-black rounded-2xl py-3.5 px-4 text-xs font-black uppercase text-gray-800 tracking-wider appearance-none focus:outline-hidden cursor-pointer pr-10 shadow-xs"
                            >
                                <option value="all">STATUS: ALL</option>
                                <option value="stale">NEEDS ATTENTION</option>
                                <option value="pending">PENDING</option>
                                <option value="confirmed">CONFIRMED</option>
                                <option value="preparing">PREPARING</option>
                                <option value="ready">READY</option>
                                <option value="delivered">DELIVERED</option>
                                <option value="cancelled">CANCELLED</option>
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

                {/* Date Picker Row (when custom range is selected or active dates exist) */}
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
                                    setPagination(p => ({ ...p, currentPage: 1 }));
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
                                    setPagination(p => ({ ...p, currentPage: 1 }));
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

            {/* High-Density Order Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-5">Order Info</th>
                                <th className="px-6 py-5">Customer & Size Specs</th>
                                <th className="px-6 py-5 text-center">Status Control</th>
                                <th className="px-6 py-5 text-center">Payment</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.length > 0 ? orders.map((order) => (
                                <React.Fragment key={order._id}>
                                    <tr className={`group hover:bg-gray-50/50 transition-colors ${expandedOrder === order._id ? 'bg-gray-50/80' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 text-sm">#{order.orderNumber}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1 italic">
                                                    {new Date(order.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col max-w-[450px]">
                                                <span className="font-black text-gray-800 text-xs uppercase leading-tight break-words mb-2">{order.customerId?.name || '---'}</span>
                                                <div className="flex flex-col gap-1.5">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-gray-400 shrink-0">{item.quantity}x</span>
                                                                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight truncate">{item.name}</span>
                                                            </div>
                                                            {/* Detailed Cake Customizations in List */}
                                                            {(item.customization || item.customizationDetails) && (
                                                                <div className="ml-6 mt-1 flex flex-wrap gap-1">
                                                                    {item.customization && (
                                                                        <span className="text-[8px] font-black text-bakery-primary uppercase bg-bakery-bg px-2 py-0.5 rounded-md border border-bakery-primary/5">
                                                                            {item.customization}
                                                                        </span>
                                                                    )}
                                                                    {item.customizationDetails?.colorTheme && (
                                                                        <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                                            Theme: {item.customizationDetails.colorTheme}
                                                                        </span>
                                                                    )}
                                                                    {item.customizationDetails?.cakeMessage && (
                                                                        <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                            " {item.customizationDetails.cakeMessage} "
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {item.selectedVariants?.length > 0 && (
                                                                <div className="ml-6 mt-1 flex flex-wrap gap-1">
                                                                    {item.selectedVariants.map((v, idx) => (
                                                                        <span key={idx} className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                            + {v.name} (₹{v.price})
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <StatusControl
                                                    currentStatus={order.status}
                                                    onUpdate={(status) => handleQuickStatusUpdate(order._id, status)}
                                                    isUpdating={updatingId === order._id}
                                                />
                                            </div>
                                            {order.staleFlaggedAt && !['delivered', 'cancelled'].includes(order.status) && (
                                                <p className="mt-2 text-center text-[8px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1" title="No change for 24 hours. Move it on, or it is cancelled automatically.">
                                                    No activity 24h · auto-cancels {new Date(new Date(order.staleFlaggedAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            )}
                                            {order.status === 'cancelled' && order.cancelReason?.startsWith('Closed automatically') && (
                                                <p className="mt-2 text-center text-[8px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2 py-1" title={order.cancelReason}>
                                                    Auto-cancelled: no activity
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {order.paymentStatus}
                                                </span>
                                                {order.paymentStatus !== 'paid' && (
                                                    <button
                                                        onClick={() => handleQuickPaymentUpdate(order._id, 'paid')}
                                                        className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="flex flex-col items-end mr-4">
                                                    <span className="font-black text-lg text-gray-900">₹{order.total}</span>
                                                    {order.discount > 0 && (
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                            -₹{order.discount} (COUPON)
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => toggleExpand(order._id)}
                                                    className={`p-2 rounded-xl transition-all ${expandedOrder === order._id ? 'bg-[#56763D] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                >
                                                    {expandedOrder === order._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                                                    className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-[#56763D] hover:text-white transition-all shadow-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrder === order._id && (
                                        <tr className="bg-white/50 border-t-0">
                                            <td colSpan="5" className="px-12 py-10 border-b border-gray-50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Full Cake Customization Breakdown</h4>
                                                        <div className="space-y-6">
                                                            {order.items.map((item, i) => (
                                                                <div key={i} className="flex flex-col p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-bakery-primary/20 transition-all">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="flex gap-4">
                                                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-sm text-gray-900 shrink-0">{item.quantity}x</div>
                                                                            <div className="space-y-1">
                                                                                <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{item.name}</p>
                                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.customization || 'Standard Specifications'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-black text-base text-gray-900">₹{item.price * item.quantity}</span>
                                                                    </div>

                                                                    {item.customizationDetails && (
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                                                                            {item.customizationDetails.cakeMessage && (
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">Written Message</p>
                                                                                    <p className="text-xs font-black text-gray-800 italic">"{item.customizationDetails.cakeMessage}"</p>
                                                                                </div>
                                                                            )}
                                                                            {item.customizationDetails.colorTheme && (
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Color Theme</p>
                                                                                    <p className="text-xs font-black text-gray-800 leading-tight uppercase">{item.customizationDetails.colorTheme}</p>
                                                                                </div>
                                                                            )}
                                                                            {item.customizationDetails.designDescription && (
                                                                                <div className="col-span-1 sm:col-span-2 space-y-1 pt-2 border-t border-gray-100">
                                                                                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Design Description</p>
                                                                                    <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{item.customizationDetails.designDescription}</p>
                                                                                </div>
                                                                            )}
                                                                            {item.customizationDetails.referenceImage && (
                                                                                <div className="col-span-1 sm:col-span-2 pt-2">
                                                                                    <a
                                                                                        href={item.customizationDetails.referenceImage}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase text-gray-500 hover:bg-[#56763D] hover:text-white transition-all shadow-sm"
                                                                                    >
                                                                                        <ImageIcon className="w-3 h-3" /> View Reference Design
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-8">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2"><MapPin className="w-3 h-3" /> Fulfillment Logistics</h4>
                                                            <div className="p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                                                                <div className="flex items-start gap-4 mb-4">
                                                                    <div className="p-3 bg-bakery-bg text-bakery-primary rounded-2xl"><User className="w-5 h-5" /></div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase">Customer Information</p>
                                                                        <p className="text-sm font-black text-gray-900 tracking-tight">{order.customerId?.name || '---'}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{order.customerId?.mobile || 'No Phone Number'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-4">
                                                                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><MapPin className="w-5 h-5" /></div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase">Drop-off Location</p>
                                                                        <p className="text-xs font-bold text-gray-600 italic leading-relaxed">"{order.deliveryAddress?.address || 'Self Pickup at Store'}"</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {order.specialInstructions && (
                                                            <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-[2rem] flex gap-4">
                                                                <AlertCircle className="w-6 h-6 text-orange-600 shrink-0" />
                                                                <div>
                                                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Customer Priority Note:</p>
                                                                    <p className="text-sm font-black text-orange-900 italic leading-snug">"{order.specialInstructions}"</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2"><CreditCard className="w-3 h-3" /> Payment Breakdown</h4>
                                                            <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[2rem] space-y-3">
                                                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                                                                    <span>Subtotal</span>
                                                                    <span className="text-gray-900">₹{order.subtotal}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                                                                    <span>Taxes (GST)</span>
                                                                    <span className="text-gray-900">₹{order.tax}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                                                                    <span>Delivery Fee</span>
                                                                    <span className="text-gray-900">₹{order.deliveryCharge}</span>
                                                                </div>
                                                                {order.discount > 0 && (
                                                                    <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase">
                                                                        <span>Discount ({order.couponCode || 'COUPON'})</span>
                                                                        <span>-₹{order.discount}</span>
                                                                    </div>
                                                                )}
                                                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total Amount</span>
                                                                    <span className="text-xl font-black text-emerald-700 tracking-tighter">₹{order.total}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <ShoppingBag className="w-16 h-16" />
                                            <p className="font-black text-xl uppercase tracking-widest">No matching orders found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-10">
                    <button onClick={() => setPagination(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))} disabled={pagination.currentPage === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm disabled:opacity-30 hover:border-bakery-primary/30 transition-all"><ArrowRight className="w-5 h-5 rotate-180" /></button>
                    <div className="px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Page <span className="text-gray-900">{pagination.currentPage}</span> of <span className="text-gray-900">{paginationInfo.totalPages}</span>
                    </div>
                    <button onClick={() => setPagination(p => ({ ...p, currentPage: Math.min(paginationInfo.totalPages, p.currentPage + 1) }))} disabled={pagination.currentPage === paginationInfo.totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#56763D] text-white shadow-lg disabled:opacity-30 hover:scale-105 active:scale-95 transition-all"><ArrowRight className="w-5 h-5" /></button>
                </div>
            )}

            <OrderDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} order={selectedOrder} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['orders'] }); setShowDetailsModal(false); }} />
        </div>
    );
}

const StatCard = ({ title, value, icon: Icon, theme, desc, onClick }) => {
    const themes = {
        blue: 'from-blue-600 to-indigo-700 shadow-blue-100 text-blue-600 bg-blue-50',
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        purple: 'from-purple-600 to-indigo-700 shadow-purple-100 text-purple-600 bg-purple-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50',
        teal: 'from-teal-500 to-cyan-600 shadow-teal-100 text-teal-600 bg-teal-50',
        red: 'from-rose-500 to-red-600 shadow-red-100 text-red-600 bg-red-50'
    };
    const style = themes[theme] || themes.blue;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');
    return (
        <div onClick={onClick} className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{title}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-md ${shadow} shrink-0`}>
                    <Icon className="w-5 h-5" />
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

const StatusControl = ({ currentStatus, onUpdate, isUpdating }) => {
    const steps = [
        { id: 'confirmed', label: 'Confirm', icon: CheckCircle2, next: 'preparing' },
        { id: 'preparing', label: 'Prepare', icon: PlayCircle, next: 'ready' },
        { id: 'ready', label: 'Set Ready', icon: Package, next: 'out-for-delivery' }
    ];

    if (isUpdating) return <Loader2 className="w-5 h-5 animate-spin text-gray-300" />;

    // Find the next active step based on current status
    const getNextStep = () => {
        if (currentStatus === 'pending') return steps[0];
        if (currentStatus === 'confirmed') return steps[1];
        if (currentStatus === 'preparing') return steps[2];
        return null;
    };

    const nextStep = getNextStep();

    if (!nextStep) {
        return <OrderStatusBadge status={currentStatus} />;
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onUpdate(nextStep.id)}
                className="flex items-center gap-2 px-4 py-2 bg-[#56763D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-[#56763D]/10"
            >
                <nextStep.icon className="w-3 h-3" />
                {nextStep.label}
            </button>
            <button
                onClick={() => { if (window.confirm('Cancel this order?')) onUpdate('cancelled'); }}
                className="p-2 bg-white border border-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                title="Cancel Order"
            >
                <XCircle className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};
