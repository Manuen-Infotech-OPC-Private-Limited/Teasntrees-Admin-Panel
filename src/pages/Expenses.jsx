import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    RefreshCw,
    Wallet,
    DollarSign,
    Calendar,
    Tag,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ExpenseModal from '../components/ExpenseModal';
import ExportButton from '../components/ExportButton';

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'rent', label: 'Rent & Lease' },
    { value: 'utilities', label: 'Electricity & Utilities' },
    { value: 'salaries', label: 'Staff Salaries & Wages' },
    { value: 'maintenance', label: 'Repairs & Maintenance' },
    { value: 'marketing', label: 'Marketing & Ads' },
    { value: 'packaging', label: 'Packaging & Supplies' },
    { value: 'logistics', label: 'Logistics & Fuel' },
    { value: 'petty_cash', label: 'Petty Cash & Daily Needs' },
    { value: 'licenses', label: 'Government & Licenses' },
    { value: 'miscellaneous', label: 'Miscellaneous' }
];

export default function Expenses() {
    const { brand } = useParams();
    const b = brand || 'teasntrees';
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [page, setPage] = useState(1);

    // Date filters
    const [datePreset, setDatePreset] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const toLocalDateStr = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDateRange = () => {
        if (datePreset === 'custom') {
            return { startDate: customStartDate, endDate: customEndDate };
        }
        if (datePreset === 'all') {
            return { startDate: '', endDate: '' };
        }

        const now = new Date();
        if (datePreset === 'today') {
            const todayStr = toLocalDateStr(now);
            return { startDate: todayStr, endDate: todayStr };
        }
        if (datePreset === 'yesterday') {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = toLocalDateStr(y);
            return { startDate: yStr, endDate: yStr };
        }
        if (datePreset === 'thisWeek') {
            const d = new Date(now);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            return { startDate: toLocalDateStr(monday), endDate: toLocalDateStr(now) };
        }
        if (datePreset === 'thisMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: toLocalDateStr(firstDay), endDate: toLocalDateStr(now) };
        }
        if (datePreset === 'lastMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            return { startDate: toLocalDateStr(firstDay), endDate: toLocalDateStr(lastDay) };
        }
        return { startDate: '', endDate: '' };
    };

    const { startDate: activeStartDate, endDate: activeEndDate } = getDateRange();

    // Fetch expense stats
    const { data: rawStats, refetch: refetchStats, isFetching: isSyncingStats } = useQuery({
        queryKey: ['expense-stats', b],
        queryFn: async () => {
            const res = await api.get('/admin/expenses/stats');
            return res.data?.data || {};
        }
    });

    // Fetch expenses list
    const { data: expensesData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['expenses', b, page, searchTerm, selectedCategory, selectedStatus, activeStartDate, activeEndDate],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 15,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedCategory !== 'all' && { category: selectedCategory }),
                ...(selectedStatus !== 'all' && { paymentStatus: selectedStatus }),
                ...(activeStartDate && { startDate: activeStartDate }),
                ...(activeEndDate && { endDate: activeEndDate })
            });
            const res = await api.get(`/admin/expenses?${params.toString()}`);
            return res.data;
        },
        keepPreviousData: true
    });

    const statsData = rawStats || {};
    const expenses = expensesData?.data || [];
    const pagination = expensesData?.pagination || { total: 0, totalPages: 1 };
    const isSyncing = isFetching || isSyncingStats;

    const handleOpenCreate = () => {
        setEditingExpense(null);
        setShowExpenseModal(true);
    };

    const handleOpenEdit = (exp) => {
        setEditingExpense(exp);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = async (exp) => {
        if (!window.confirm(`Are you sure you want to delete expense "${exp.title}" (${exp.expenseNumber})?`)) {
            return;
        }

        try {
            const res = await api.delete(`/admin/expenses/${exp._id}`);
            if (res.data?.success) {
                toast.success('Expense deleted successfully');
                queryClient.invalidateQueries(['expenses', b]);
                queryClient.invalidateQueries(['expense-stats', b]);
            }
        } catch (err) {
            console.error('Failed to delete expense', err);
            toast.error(err.response?.data?.message || 'Failed to delete expense');
        }
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={12} /> Paid
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700">
                        <Clock size={12} /> Pending
                    </span>
                );
            case 'cancelled':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700">
                        <AlertCircle size={12} /> Cancelled
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 relative">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Operating Expenses</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Track store overheads, rent, utility bills, staff salaries, and petty cash</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { refetch(); refetchStats(); }}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-[#56763D]' : 'text-gray-400'}`} />
                    </button>
                    <ExportButton
                        resource="expenses"
                        filters={{
                            search: searchTerm,
                            category: selectedCategory === 'all' ? '' : selectedCategory,
                            status: selectedStatus === 'all' ? '' : selectedStatus,
                            startDate: activeStartDate,
                            endDate: activeEndDate
                        }}
                    />
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20 hover:bg-[#466031]"
                    >
                        <Plus className="w-4 h-4" /> Record Expense
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Total Expenses</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                ₹{(statsData?.totalAmount || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">({statsData?.totalCount || 0} total expense entries)</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">This Month</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-700">
                                ₹{(statsData?.thisMonthAmount || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">{statsData?.thisMonthCount || 0} expenses recorded this month</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Today's Outflows</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600">
                                ₹{(statsData?.todayAmount || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 mt-2">{statsData?.todayCount || 0} recorded today</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Top Category</span>
                            <div className="text-lg sm:text-xl font-black tracking-tight text-gray-900 truncate capitalize">
                                {statsData?.categoryBreakdown?.[0]?.category?.replace(/_/g, ' ') || 'None'}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                            <Tag className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 mt-2">
                        {statsData?.categoryBreakdown?.[0]?.total ? `₹${statsData.categoryBreakdown[0].total.toLocaleString('en-IN')}` : 'No records'}
                    </span>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="SEARCH BY TITLE, EXPENSE #, OR REFERENCE..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-wider outline-none focus:bg-white focus:border-[#56763D] transition-all"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                            className="w-full sm:w-56 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-wider outline-none focus:bg-white focus:border-[#56763D] transition-all cursor-pointer"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                            className="w-full sm:w-44 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-wider outline-none focus:bg-white focus:border-[#56763D] transition-all cursor-pointer"
                        >
                            <option value="all">STATUS: ALL</option>
                            <option value="paid">PAID</option>
                            <option value="pending">PENDING</option>
                            <option value="cancelled">CANCELLED</option>
                        </select>
                    </div>

                    {/* Date Presets */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={datePreset}
                            onChange={(e) => {
                                setDatePreset(e.target.value);
                                setPage(1);
                                if (e.target.value !== 'custom') {
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                }
                            }}
                            className="w-full sm:w-48 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-wider outline-none focus:bg-white focus:border-[#56763D] transition-all cursor-pointer"
                        >
                            <option value="all">ALL TIME</option>
                            <option value="today">TODAY</option>
                            <option value="yesterday">YESTERDAY</option>
                            <option value="thisWeek">THIS WEEK</option>
                            <option value="thisMonth">THIS MONTH</option>
                            <option value="lastMonth">LAST MONTH</option>
                            <option value="custom">CUSTOM RANGE...</option>
                        </select>
                    </div>
                </div>

                {/* Custom Date Pickers */}
                {datePreset === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-[10px] font-black uppercase text-gray-400">From:</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => { setCustomStartDate(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-[#56763D]"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-[10px] font-black uppercase text-gray-400">To:</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => { setCustomEndDate(e.target.value); setPage(1); }}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-[#56763D]"
                            />
                        </div>
                        {(customStartDate || customEndDate) && (
                            <button
                                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                                className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                            >
                                Clear Dates
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Expenses List / Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#56763D]" />
                        <span className="text-xs font-black uppercase tracking-wider">Loading expenses...</span>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                            <Tag className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-black text-gray-900 uppercase">No Expenses Recorded</h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm font-bold uppercase tracking-wider">
                            No operating expenses match your current filters. Record overheads to maintain your store P&L.
                        </p>
                        <button
                            onClick={handleOpenCreate}
                            className="mt-6 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg hover:shadow-[#56763D]/20 hover:bg-[#466031] transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Record First Expense
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-5">Expense Info</th>
                                    <th className="px-6 py-5">Title & Notes</th>
                                    <th className="px-6 py-5">Category</th>
                                    <th className="px-6 py-5">Payment Method</th>
                                    <th className="px-6 py-5 text-right">Amount (₹)</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {expenses.map((exp) => (
                                    <tr key={exp._id} className="hover:bg-gray-50/50 transition-colors group">
                                        {/* Expense Info */}
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="font-black text-xs text-gray-900 tracking-tight">
                                                {exp.expenseNumber}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>

                                        {/* Title & Notes */}
                                        <td className="px-6 py-4.5 max-w-xs">
                                            <div className="font-black text-xs text-gray-900 truncate">
                                                {exp.title}
                                            </div>
                                            {exp.notes && (
                                                <div className="text-[10px] font-medium text-gray-400 truncate mt-0.5" title={exp.notes}>
                                                    {exp.notes}
                                                </div>
                                            )}
                                        </td>

                                        {/* Category */}
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700">
                                                {exp.category?.replace(/_/g, ' ')}
                                            </span>
                                        </td>

                                        {/* Payment */}
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-xs font-bold text-gray-900 uppercase">
                                                {exp.paymentMethod?.replace(/_/g, ' ')}
                                            </div>
                                            {exp.referenceNumber && (
                                                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                    Ref: {exp.referenceNumber}
                                                </div>
                                            )}
                                        </td>

                                        {/* Amount */}
                                        <td className="px-6 py-4.5 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-gray-900">
                                                ₹{Number(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4.5 whitespace-nowrap text-center">
                                            {renderStatusBadge(exp.paymentStatus)}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4.5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(exp)}
                                                    className="p-2 text-gray-400 hover:text-[#56763D] hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="Edit Expense"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExpense(exp)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete Expense"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-black uppercase text-gray-600 disabled:opacity-40 hover:bg-[#56763D] hover:text-white transition-all"
                            >
                                Prev
                            </button>
                            <span className="text-xs font-black text-gray-900 px-2">{page}</span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-black uppercase text-gray-600 disabled:opacity-40 hover:bg-[#56763D] hover:text-white transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ExpenseModal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                editingExpense={editingExpense}
                brand={b}
                onSave={() => {
                    refetch();
                    refetchStats();
                }}
            />
        </div>
    );
}
