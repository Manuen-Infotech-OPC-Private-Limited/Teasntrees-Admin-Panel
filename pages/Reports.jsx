import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3,
    Download,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Building2,
    Receipt,
    RefreshCw,
    Wallet
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Reports() {
    const { brand } = useParams();
    const b = brand || 'teasntrees';

    const [dateRange, setDateRange] = useState('thisMonth');

    const getDateParams = () => {
        const now = new Date();
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        let startDate = null;
        let endDate = endOfToday.toISOString();

        if (dateRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today.toISOString();
            endDate = endOfToday.toISOString();
        } else if (dateRange === '7days') {
            const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            startDate = d.toISOString();
        } else if (dateRange === 'thisMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate = firstDay.toISOString();
        } else if (dateRange === 'lastMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            startDate = firstDay.toISOString();
            endDate = lastDay.toISOString();
        } else if (dateRange === 'ytd') {
            const firstDay = new Date(now.getFullYear(), 0, 1);
            startDate = firstDay.toISOString();
        }

        return { startDate, endDate };
    };

    const { startDate, endDate } = getDateParams();

    // 1. Fetch P&L Report
    const { data: rawPnL, isLoading: loadingPnL, isFetching: isSyncingPnL, refetch: refetchPnL } = useQuery({
        queryKey: ['report-pnl', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/reports/pnl?${params.toString()}`);
            return res.data?.data || {};
        }
    });

    // 2. Fetch GST / Tax Report
    const { data: rawTax, isLoading: loadingTax, refetch: refetchTax } = useQuery({
        queryKey: ['report-tax', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/reports/tax?${params.toString()}`);
            return res.data?.data || {};
        }
    });

    // 3. Fetch Procurement Vendor Analysis
    const { data: rawProcurement, isLoading: loadingProcurement, refetch: refetchProcurement } = useQuery({
        queryKey: ['report-procurement', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/reports/procurement?${params.toString()}`);
            return res.data?.data || [];
        }
    });

    // 4. Fetch Periodic Trends (Sales vs Procurement vs Operating Expenses Bar Chart)
    const { data: rawTrends, isLoading: loadingTrends, refetch: refetchTrends } = useQuery({
        queryKey: ['report-trends', b, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/reports/trends?${params.toString()}`);
            return res.data?.data || [];
        }
    });

    const pnlData = rawPnL || {};
    const taxData = rawTax || {};
    const procurementData = Array.isArray(rawProcurement) ? rawProcurement : [];
    const trendsData = Array.isArray(rawTrends) ? rawTrends : [];
    const isSyncing = isSyncingPnL || loadingProcurement || loadingTrends;

    const refetchAll = () => {
        refetchPnL();
        refetchTax();
        refetchProcurement();
        refetchTrends();
    };

    // Export P&L CSV
    const handleExportPnL = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/admin/reports/export-pnl?${params.toString()}`, { responseType: 'blob' });

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pnl-report-${b}-${dateRange}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('P&L Report CSV downloaded');
        } catch (err) {
            toast.error('Failed to export P&L report');
        }
    };

    const rev = pnlData?.revenue || {};
    const exp = pnlData?.expenses || {};
    const prof = pnlData?.profitability || {};
    const taxes = pnlData?.taxes || {};

    // Top suppliers spend bar chart data
    const topVendorsBarData = procurementData.slice(0, 5).map((v) => ({
        name: v.vendorName && v.vendorName.length > 12 ? `${v.vendorName.substring(0, 10)}...` : (v.vendorName || 'Supplier'),
        fullName: v.vendorName || 'Supplier',
        spend: v.totalSpend || 0,
        paid: v.totalPaid || 0,
        due: v.balanceDue || 0
    }));

    // GST Breakdown bar chart data
    const gstBarData = [
        {
            name: 'Output GST',
            amount: taxes.outputGstCollected || 0,
            fill: '#8B5CF6',
            desc: 'Collected on Sales'
        },
        {
            name: 'Input ITC',
            amount: taxes.inputGstPaid || 0,
            fill: '#56763D',
            desc: 'Paid on Purchases'
        },
        {
            name: 'Net Liability',
            amount: Math.abs(taxes.netGstLiability || 0),
            fill: (taxes.netGstLiability || 0) >= 0 ? '#F59E0B' : '#3B82F6',
            desc: (taxes.netGstLiability || 0) >= 0 ? 'Payable Tax' : 'Eligible ITC'
        }
    ];

    return (
        <div className="space-y-6 sm:space-y-8 relative">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">P&L & Financial Reports</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Executive profitability statement, operating expenses, and GST liability</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border border-gray-100 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider text-gray-800 shadow-sm focus:border-[#56763D] focus:outline-hidden"
                    >
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="ytd">Year to Date (YTD)</option>
                        <option value="all">All Time</option>
                    </select>

                    <button
                        onClick={refetchAll}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-[#56763D]' : 'text-gray-400'}`} />
                    </button>

                    <button
                        onClick={handleExportPnL}
                        className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20"
                    >
                        <Download className="w-4 h-4" /> Export P&L
                    </button>
                </div>
            </div>

            {/* P&L Executive Statement Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-3">
                    <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight">Executive Profit & Loss Statement</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Sales revenue versus raw material procurement (COGS) and operating expenses (OPEX)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Margin:</span>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${prof.grossProfit >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {prof.grossMarginPercent || 0}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Margin:</span>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${prof.netProfit >= 0 ? 'bg-[#56763D]/10 text-[#56763D] border border-[#56763D]/20' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {prof.netMarginPercent || 0}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                    {/* Revenue Section */}
                    <div className="space-y-4 bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100/60">
                        <div className="flex items-center justify-between text-emerald-800 font-black text-[10px] uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><TrendingUp size={14} /> Revenue (Orders)</span>
                            <span>INR</span>
                        </div>
                        <div className="space-y-2 text-xs pt-1">
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Gross Sales:</span>
                                <span className="font-bold text-gray-900">₹{(rev.grossSales || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-rose-600 font-medium">
                                <span>Discounts Given:</span>
                                <span className="font-bold">-₹{(rev.totalDiscounts || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Delivery Collected:</span>
                                <span className="font-bold">₹{(rev.deliveryFees || 0).toFixed(2)}</span>
                            </div>
                            <div className="pt-3 border-t border-emerald-200/60 flex justify-between font-black text-sm text-emerald-900">
                                <span>Net Sales Revenue:</span>
                                <span>₹{(rev.netRevenue || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider pt-1">
                            {rev.ordersCount || 0} customer orders fulfilled
                        </div>
                    </div>

                    {/* Direct Costs (COGS) */}
                    <div className="space-y-4 bg-rose-50/40 p-6 rounded-3xl border border-rose-100/60">
                        <div className="flex items-center justify-between text-rose-800 font-black text-[10px] uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><TrendingDown size={14} /> Direct Costs (COGS)</span>
                            <span>INR</span>
                        </div>
                        <div className="space-y-2 text-xs pt-1">
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Raw Material Procurement:</span>
                                <span className="font-bold text-gray-900">₹{(exp.costOfGoodsPurchased || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Purchases (Excl. Tax):</span>
                                <span className="font-bold">₹{(exp.purchasesSubtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="pt-3 border-t border-rose-200/60 flex justify-between font-black text-sm text-rose-900">
                                <span>Total Procurement Cost:</span>
                                <span>₹{(exp.costOfGoodsPurchased || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-rose-700 uppercase tracking-wider pt-1">
                            {exp.purchasesCount || 0} vendor invoices recorded
                        </div>
                    </div>

                    {/* Operating Expenses (OPEX) */}
                    <div className="space-y-4 bg-amber-50/40 p-6 rounded-3xl border border-amber-100/60">
                        <div className="flex items-center justify-between text-amber-800 font-black text-[10px] uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Wallet size={14} /> Operating Expenses (OPEX)</span>
                            <span>INR</span>
                        </div>
                        <div className="space-y-2 text-xs pt-1">
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Operating Overhead:</span>
                                <span className="font-bold text-gray-900">₹{(exp.operatingExpenses || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Total Outflows (COGS+OPEX):</span>
                                <span className="font-bold text-amber-900">₹{(exp.totalExpenses || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pt-3 border-t border-amber-200/60 flex justify-between font-black text-sm text-amber-900">
                                <span>Total OPEX Incurred:</span>
                                <span>₹{(exp.operatingExpenses || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider pt-1">
                            {exp.operatingExpensesCount || 0} expense vouchers logged
                        </div>
                    </div>

                    {/* Net Profit / Operating Result */}
                    <div className="space-y-4 bg-white p-6 rounded-3xl border border-gray-100 flex flex-col justify-between shadow-xs">
                        <div>
                            <div className="flex items-center justify-between text-gray-700 font-black text-[10px] uppercase tracking-widest mb-3">
                                <span>Net Operating Result</span>
                                <DollarSign size={14} />
                            </div>
                            <div className="space-y-2 text-xs pt-1">
                                <div className="flex justify-between text-gray-600 font-medium">
                                    <span>Net Sales:</span>
                                    <span className="font-bold text-gray-900">₹{(rev.netRevenue || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 font-medium">
                                    <span>Less Procurement (COGS):</span>
                                    <span className="font-bold text-rose-600">-₹{(exp.costOfGoodsPurchased || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 font-medium">
                                    <span>Less Operating (OPEX):</span>
                                    <span className="font-bold text-amber-600">-₹{(exp.operatingExpenses || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Net Profit (Bottom Line)</span>
                            <div className={`text-2xl font-black tracking-tight mt-1 ${prof.netProfit >= 0 ? 'text-[#56763D]' : 'text-rose-700'}`}>
                                ₹{(prof.netProfit || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Bar Chart: Financial Trends */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col min-h-[420px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight flex items-center gap-2">
                            <BarChart accessibilityLayer={false} className="text-[#56763D]" size={18} /> Financial Trends: Sales vs Purchases vs Expenses (Bar Chart)
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Daily comparison of incoming sales, vendor procurement (COGS), and operating expenses (OPEX)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#56763D]" /> Sales
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> COGS (Purchases)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> OPEX (Expenses)
                        </span>
                    </div>
                </div>

                <div className="w-full h-80 min-h-[320px] pt-4">
                    {loadingTrends ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                            Loading financial trends data...
                        </div>
                    ) : trendsData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider gap-2">
                            <span>No sales, purchase, or expense transactions recorded in this period</span>
                            <span className="text-[10px] text-gray-400 font-normal">Try selecting "This Month" or "All Time" to view full timeline</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320} minHeight={300}>
                            <BarChart accessibilityLayer={false} data={trendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => (val ? val.slice(5) : '')}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    cursor={false}
                                    formatter={(value, name) => [`₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '16px', fontSize: '11px', border: 'none', padding: '8px 14px' }}
                                    itemStyle={{ color: '#FFFFFF', fontWeight: 800, fontSize: '12px' }}
                                    labelStyle={{ color: '#9CA3AF', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Bar
                                    dataKey="sales"
                                    name="Sales (Income)"
                                    fill="#56763D"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                                <Bar
                                    dataKey="procurement"
                                    name="Purchases (COGS)"
                                    fill="#EF4444"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                                <Bar
                                    dataKey="operatingExpenses"
                                    name="Expenses (OPEX)"
                                    fill="#F59E0B"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Top Suppliers Spend: Bar Chart */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col min-h-[420px]">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight flex items-center gap-2">
                            <Building2 className="text-gray-900" size={18} /> Top Supplier Spend (Bar Chart)
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Procurement spend & settled amounts by vendor
                        </p>
                    </div>
                </div>

                <div className="w-full h-80 min-h-[300px] pt-4">
                    {loadingProcurement ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                            Loading supplier data...
                        </div>
                    ) : topVendorsBarData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                            No supplier invoices recorded in this period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300} minHeight={280}>
                            <BarChart accessibilityLayer={false} data={topVendorsBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9CA3AF"
                                    fontSize={10}
                                    tickLine={false} axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    cursor={false}
                                    formatter={(value, name) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, name]}
                                    labelFormatter={(label, items) => {
                                        const full = items?.[0]?.payload?.fullName;
                                        return `Supplier: ${full || label}`;
                                    }}
                                    contentStyle={{ backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '16px', fontSize: '11px', border: 'none', padding: '8px 14px' }}
                                    itemStyle={{ color: '#FFFFFF', fontWeight: 800, fontSize: '12px' }}
                                    labelStyle={{ color: '#9CA3AF', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                <Bar
                                    dataKey="spend"
                                    name="Total Spend"
                                    fill="#56763D"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={24}
                                />
                                <Bar
                                    dataKey="paid"
                                    name="Settled"
                                    fill="#94B741"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={24}
                                />
                                <Bar
                                    dataKey="due"
                                    name="Balance Due"
                                    fill="#F59E0B"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* GST / Tax Reconciliation Section with Bar Chart & Cards */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="pb-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight flex items-center gap-2">
                            <Receipt className="text-[#56763D]" size={18} /> GST & Tax Reconciliation
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Output GST collected on food sales versus Input Tax Credit (ITC) paid on vendor supplies
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                    {/* Stat Cards */}
                    <div className="space-y-4">
                        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-xs">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Output GST (Sales)</span>
                            <div className="text-2xl font-black text-gray-900 mt-2">
                                ₹{(taxes.outputGstCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">Collected from customer orders</p>
                        </div>

                        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-xs">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Input GST (Purchases)</span>
                            <div className="text-2xl font-black text-gray-900 mt-2">
                                ₹{(taxes.inputGstPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">Paid on vendor raw material invoices</p>
                        </div>

                        <div className="p-6 rounded-3xl border border-[#56763D]/20 bg-[#56763D]/5">
                            <span className="text-[10px] font-black text-[#56763D] uppercase tracking-widest">Net GST Liability</span>
                            <div className="text-2xl font-black text-[#56763D] mt-2">
                                ₹{(taxes.netGstLiability || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#56763D] mt-1">
                                {(taxes.netGstLiability || 0) >= 0 ? 'Payable to Government' : 'Eligible ITC Carryforward'}
                            </p>
                        </div>
                    </div>

                    {/* GST Tax Comparison Bar Chart */}
                    <div className="lg:col-span-2 p-6 rounded-3xl border border-gray-100 bg-white shadow-xs flex flex-col justify-between min-h-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Tax Reconciliation Comparison (Bar Chart)</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Output Liability vs Input Tax Credit</p>
                            </div>
                        </div>

                        <div className="w-full h-64 min-h-[260px] pt-2">
                            <ResponsiveContainer width="100%" height={260} minHeight={240}>
                                <BarChart accessibilityLayer={false} data={gstBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickLine={false} axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `₹${val}`}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        formatter={(value, name, item) => [`₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, item.payload.desc || name]}
                                        contentStyle={{ backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '16px', fontSize: '11px', border: 'none', padding: '8px 14px' }}
                                        itemStyle={{ color: '#FFFFFF', fontWeight: 800, fontSize: '12px' }}
                                        labelStyle={{ color: '#9CA3AF', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={52}
                                        name="Amount"
                                    >
                                        {gstBarData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor Procurement Analysis Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Vendor Spend Analysis</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{procurementData.length} suppliers evaluated</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/40">
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier Name</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">GSTIN</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoices</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spend</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Settled</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingProcurement ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        Loading supplier procurement analysis...
                                    </td>
                                </tr>
                            ) : procurementData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        No vendor procurement bills in this period
                                    </td>
                                </tr>
                            ) : (
                                procurementData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-black text-gray-900 text-xs">{item.vendorName}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{item.contactPerson}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800">
                                                {(item.category || '').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-xs text-gray-700">{item.phone}</td>
                                        <td className="py-4 px-6 font-mono font-bold text-xs text-gray-800">{item.gstin || 'N/A'}</td>
                                        <td className="py-4 px-6 font-bold text-xs text-gray-600">{item.invoicesCount} bills</td>
                                        <td className="py-4 px-6 font-black text-xs text-gray-900">₹{item.totalSpend.toLocaleString('en-IN')}</td>
                                        <td className="py-4 px-6 font-bold text-xs text-emerald-600">₹{item.totalPaid.toLocaleString('en-IN')}</td>
                                        <td className="py-4 px-6 text-right font-black text-xs text-amber-600">
                                            {item.balanceDue > 0 ? `₹${item.balanceDue.toLocaleString('en-IN')}` : 'SETTLED'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
