import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    Download,
    DollarSign,
    ShoppingCart,
    Calendar,
    ArrowRight,
    Search,
    CreditCard,
    CheckCircle2,
    RefreshCw,
    Percent,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';

const COLORS = ['#56763D', '#94B741', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Sales() {
    const { brand } = useParams();
    const b = brand || 'teasntrees';

    const [dateRange, setDateRange] = useState('30days');
    const [chartType, setChartType] = useState('bar');
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const getDateParams = () => {
        const now = new Date();
        let startDate = null;
        let endDate = now.toISOString();

        if (dateRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today.toISOString();
        } else if (dateRange === '7days') {
            const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            startDate = d.toISOString();
        } else if (dateRange === '30days') {
            const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            startDate = d.toISOString();
        } else if (dateRange === 'thisMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate = firstDay.toISOString();
        }

        return { startDate, endDate };
    };

    const { startDate, endDate } = getDateParams();

    // 1. Fetch Sales KPI Summary
    const { data: rawSummary, isLoading: loadingSummary, isFetching: isSyncingSummary, refetch: refetchSummary } = useQuery({
        queryKey: ['sales-summary', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/sales/summary?${params.toString()}`);
            return res.data?.data || {};
        }
    });

    // 2. Fetch Sales Trend timeline for Chart
    const { data: rawTrends, isLoading: loadingTrends, refetch: refetchTrends } = useQuery({
        queryKey: ['sales-trends', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/sales/trends?${params.toString()}`);
            return res.data?.data || [];
        }
    });

    // 3. Fetch Payment method breakdown
    const { data: rawBreakdown, isLoading: loadingBreakdown, refetch: refetchBreakdown } = useQuery({
        queryKey: ['sales-breakdown', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/sales/breakdown?${params.toString()}`);
            return res.data?.data?.paymentBreakdown || [];
        }
    });

    // 4. Fetch Top Products
    const { data: rawTopProducts, isLoading: loadingTopProducts, refetch: refetchTopProducts } = useQuery({
        queryKey: ['sales-top-products', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: 8 });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/sales/top-products?${params.toString()}`);
            return res.data?.data || [];
        }
    });

    // 5. Fetch Sales Transactions Table
    const { data: ordersData, isLoading: loadingOrders, isFetching: isSyncingOrders, refetch: refetchOrders } = useQuery({
        queryKey: ['sales-orders', b, page, searchTerm, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 12, search: searchTerm });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/sales/orders?${params.toString()}`);
            return res.data;
        },
        keepPreviousData: true
    });

    const summaryData = rawSummary || {};
    const trendsData = Array.isArray(rawTrends) ? rawTrends : [];
    const breakdownData = Array.isArray(rawBreakdown) ? rawBreakdown : [];
    const topProductsData = Array.isArray(rawTopProducts) ? rawTopProducts : [];
    const orders = ordersData?.data || [];
    const pagination = ordersData?.pagination || { total: 0, pages: 1 };
    const isSyncing = isSyncingSummary || isSyncingOrders;

    const refetchAll = () => {
        refetchSummary();
        refetchTrends();
        refetchBreakdown();
        refetchTopProducts();
        refetchOrders();
    };

    // Export Sales CSV
    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/sales/export?${params.toString()}`, { responseType: 'blob' });

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${b}-${dateRange}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Sales CSV downloaded successfully');
        } catch (err) {
            toast.error('Failed to export sales data');
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 relative">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Sales & Revenue</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Track customer sales, payment channels, and revenue trends</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                        className="bg-white border border-gray-100 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider text-gray-800 shadow-sm focus:border-black focus:outline-hidden"
                    >
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="thisMonth">This Month</option>
                        <option value="all">All Time</option>
                    </select>

                    <button
                        onClick={refetchAll}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-black' : 'text-gray-400'}`} />
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Gross Sales</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                {loadingSummary ? (
                                    <div className="h-8 w-28 bg-gray-100 animate-pulse rounded-lg mt-1" />
                                ) : (
                                    `₹${(summaryData?.grossSales || 0).toLocaleString('en-IN')}`
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">Before discounts & coupons</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Net Revenue</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600">
                                {loadingSummary ? (
                                    <div className="h-8 w-28 bg-gray-100 animate-pulse rounded-lg mt-1" />
                                ) : (
                                    `₹${(summaryData?.netSales || 0).toLocaleString('en-IN')}`
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">
                        Discounts: ₹{(summaryData?.totalDiscount || 0).toFixed(2)}
                    </span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Total Orders</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                {loadingSummary ? (
                                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg mt-1" />
                                ) : (
                                    summaryData?.totalOrders || 0
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 mt-2">
                        {summaryData?.totalDelivered || 0} Delivered ({summaryData?.totalCancelled || 0} Cancelled)
                    </span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Average Order (AOV)</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                {loadingSummary ? (
                                    <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg mt-1" />
                                ) : (
                                    `₹${(summaryData?.averageOrderValue || 0).toFixed(2)}`
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">
                        Tax Collected: ₹{(summaryData?.totalTax || 0).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Revenue Progression: Bar & Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col min-h-[420px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                            <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight">Revenue Progression</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Daily net revenue volume (INR)</p>
                        </div>
                        <div className="flex items-center bg-gray-50 border border-gray-100 p-1 rounded-2xl self-start sm:self-auto">
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                    chartType === 'bar'
                                        ? 'bg-[#56763D] text-white shadow-xs'
                                        : 'text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                Bar Chart
                            </button>
                            <button
                                onClick={() => setChartType('area')}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                    chartType === 'area'
                                        ? 'bg-[#56763D] text-white shadow-xs'
                                        : 'text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                Area Chart
                            </button>
                        </div>
                    </div>

                    <div className="h-64 sm:h-72 w-full flex-1">
                        {loadingTrends ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                                Loading trend data...
                            </div>
                        ) : trendsData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                                No sales data recorded in this period
                            </div>
                        ) : chartType === 'bar' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(val) => (val ? val.slice(5) : '')}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(val) => `₹${val}`}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        formatter={(value) => [`₹${Number(value || 0).toFixed(2)}`, 'Net Sales']}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        contentStyle={{ backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '16px', fontSize: '11px', border: 'none', padding: '8px 14px' }}
                                        itemStyle={{ color: '#FFFFFF', fontWeight: 800, fontSize: '12px' }}
                                        labelStyle={{ color: '#9CA3AF', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    />
                                    <Bar
                                        dataKey="netSales"
                                        fill="#56763D"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={48}
                                        name="Net Sales"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesNetGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#56763D" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#94B741" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(val) => (val ? val.slice(5) : '')}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(val) => `₹${val}`}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        formatter={(value) => [`₹${Number(value || 0).toFixed(2)}`, 'Net Sales']}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        contentStyle={{ backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '16px', fontSize: '11px', border: 'none', padding: '8px 14px' }}
                                        itemStyle={{ color: '#FFFFFF', fontWeight: 800, fontSize: '12px' }}
                                        labelStyle={{ color: '#9CA3AF', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="netSales"
                                        stroke="#56763D"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#salesNetGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Payment Breakdown */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col min-h-[420px]">
                    <div className="mb-4">
                        <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight">Payment Methods</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">COD vs Razorpay / Online</p>
                    </div>

                    <div className="h-60 w-full flex-1 flex items-center justify-center">
                        {loadingBreakdown ? (
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Loading payment split...</div>
                        ) : breakdownData.length === 0 ? (
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">No payments logged yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={breakdownData}
                                        dataKey="totalSales"
                                        nameKey="method"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={75}
                                        innerRadius={45}
                                        paddingAngle={4}
                                    >
                                        {breakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val, name) => [`₹${Number(val || 0).toFixed(2)}`, name || 'Sales']}
                                        contentStyle={{ backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '16px', fontSize: '11px', border: 'none', padding: '8px 14px' }}
                                        itemStyle={{ color: '#FFFFFF', fontWeight: 800, fontSize: '12px' }}
                                        labelStyle={{ color: '#9CA3AF', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Bestselling Menu Items */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="mb-6">
                    <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight">Bestselling Items</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Top revenue generating menu selections</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topProductsData.map((item, idx) => (
                        <div key={idx} className="p-5 rounded-3xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between hover:bg-gray-50 transition-all">
                            <div>
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    Rank #{idx + 1}
                                </span>
                                <h3 className="text-sm font-black text-gray-900 mt-3 truncate" title={item.name}>
                                    {item.name}
                                </h3>
                                <p className="text-[11px] font-bold text-gray-400 mt-0.5">{item.quantitySold} units sold</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-200/50 font-black text-base text-gray-900">
                                ₹{(item.revenue || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    ))}
                    {topProductsData.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                            No menu item sales recorded in this period
                        </div>
                    )}
                </div>
            </div>

            {/* Sales Transactions Register Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/20">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Sales Register</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pagination.total} transactions logged</span>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="SEARCH ORDER #, CUSTOMER..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold focus:outline-hidden"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/40">
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingOrders ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        Loading sales records...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        No sales records found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-black text-gray-900 font-mono text-xs">#{o.orderNumber}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                {new Date(o.createdAt).toLocaleDateString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-900 text-xs">{o.customer?.name || o.customerId?.name || 'Guest Customer'}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{o.customer?.phone || o.customer?.mobile || o.customerId?.mobile || 'N/A'}</div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-xs text-gray-600">
                                            {(o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)} items
                                        </td>
                                        <td className="py-4 px-6 font-bold text-xs text-gray-700">₹{(o.subtotal || 0).toFixed(2)}</td>
                                        <td className="py-4 px-6 font-bold text-xs text-rose-600">
                                            {o.discount > 0 ? `-₹${o.discount.toFixed(2)}` : '—'}
                                        </td>
                                        <td className="py-4 px-6 font-black text-xs text-gray-900">
                                            ₹{(o.total !== undefined ? o.total : (o.totalAmount || 0)).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-black text-xs text-gray-800">{o.paymentMethod || 'COD'}</span>
                                            <div className={`text-[9px] font-black uppercase tracking-wider ${o.paymentStatus === 'paid' ? 'text-emerald-600' : o.paymentStatus === 'refunded' ? 'text-purple-600' : 'text-amber-600'}`}>
                                                {o.paymentStatus || 'pending'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                o.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                                o.status === 'out-for-delivery' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                                {o.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/20">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-black uppercase text-gray-600 disabled:opacity-40 hover:bg-[#56763D] hover:text-white transition-all shadow-2xs"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-black uppercase text-gray-600 disabled:opacity-40 hover:bg-[#56763D] hover:text-white transition-all shadow-2xs"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
