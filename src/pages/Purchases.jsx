import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Receipt,
    RefreshCw,
    Wallet,
    DollarSign,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PurchaseModal from '../components/PurchaseModal';
import RecordPaymentModal from '../components/RecordPaymentModal';
import ExportButton from '../components/ExportButton';

export default function Purchases() {
    const { brand } = useParams();
    const b = brand || 'teasntrees';
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
    const [page, setPage] = useState(1);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState(null);

    // Fetch vendor options for filter
    const { data: rawVendors } = useQuery({
        queryKey: ['vendors-dropdown', b],
        queryFn: async () => {
            const res = await api.get('/admin/vendors?limit=100');
            return res.data?.data || [];
        }
    });

    // Fetch purchase stats
    const { data: rawStats, refetch: refetchStats, isFetching: isSyncingStats } = useQuery({
        queryKey: ['purchase-stats', b],
        queryFn: async () => {
            const res = await api.get('/admin/purchases/stats');
            return res.data?.data || {};
        }
    });

    // Fetch purchases list
    const { data: purchasesData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['purchases', b, page, searchTerm, selectedVendor, selectedPaymentStatus],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 15,
                search: searchTerm,
                vendor: selectedVendor,
                paymentStatus: selectedPaymentStatus
            });
            const res = await api.get(`/admin/purchases?${params.toString()}`);
            return res.data;
        },
        keepPreviousData: true
    });

    const vendorsList = Array.isArray(rawVendors) ? rawVendors : [];
    const statsData = rawStats || {};
    const purchases = purchasesData?.data || [];
    const pagination = purchasesData?.pagination || { total: 0, pages: 1 };
    const isSyncing = isFetching || isSyncingStats;

    const handleOpenCreate = () => {
        setEditingPurchase(null);
        setShowPurchaseModal(true);
    };

    const handleOpenEdit = (purchase) => {
        setEditingPurchase(purchase);
        setShowPurchaseModal(true);
    };

    const handleOpenRecordPayment = (purchase) => {
        setSelectedPurchaseForPayment(purchase);
        setShowPaymentModal(true);
    };

    const handleDeletePurchase = async (purchase) => {
        if (!window.confirm(`Are you sure you want to cancel purchase "${purchase.purchaseNumber}"?`)) {
            return;
        }

        try {
            const res = await api.delete(`/admin/purchases/${purchase._id}`);
            toast.success(res.data?.message || 'Purchase updated');
            queryClient.invalidateQueries(['purchases', b]);
            refetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete purchase');
        }
    };

    const getPaymentBadge = (status) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={12} /> Paid
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700">
                        <Clock size={12} /> Partial
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700">
                        <AlertCircle size={12} /> Pending
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 relative">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Purchases & Invoices</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Track ingredient procurement bills, supplier settlements, and input GST</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { refetch(); refetchStats(); }}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-black' : 'text-gray-400'}`} />
                    </button>
                    <ExportButton
                        resource="purchases"
                        filters={{
                            search: searchTerm,
                            vendor: selectedVendor === 'all' ? '' : selectedVendor,
                            paymentStatus: selectedPaymentStatus === 'all' ? '' : selectedPaymentStatus
                        }}
                    />
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20"
                    >
                        <Plus className="w-4 h-4" /> New Purchase Bill
                    </button>
                </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Total Purchases</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                ₹{(statsData?.totalSpend || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">({statsData?.totalPurchasesCount || 0} total invoices recorded)</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Settled / Paid</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
                                ₹{(statsData?.totalPaid || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">Cleared procurement payments</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Outstanding Dues</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600">
                                ₹{(statsData?.totalBalance || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 mt-2">({statsData?.pendingInvoicesCount || 0} pending payment bills)</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Input GST Paid</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                ₹{(statsData?.totalTax || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">Eligible Input Tax Credit (ITC)</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-[2rem] p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH INVOICE #, PURCHASE #, ITEM..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold focus:outline-hidden"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={selectedVendor}
                        onChange={(e) => { setSelectedVendor(e.target.value); setPage(1); }}
                        className="w-full md:w-60 bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-700 focus:outline-hidden"
                    >
                        <option value="all">ALL SUPPLIERS</option>
                        {vendorsList.map(v => (
                            <option key={v._id} value={v._id}>{v.companyName.toUpperCase()}</option>
                        ))}
                    </select>

                    <select
                        value={selectedPaymentStatus}
                        onChange={(e) => { setSelectedPaymentStatus(e.target.value); setPage(1); }}
                        className="w-full md:w-40 bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-700 focus:outline-hidden"
                    >
                        <option value="all">PAYMENT: ALL</option>
                        <option value="paid">PAID ONLY</option>
                        <option value="partial">PARTIAL</option>
                        <option value="pending">PENDING</option>
                    </select>
                </div>
            </div>

            {/* Purchases Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Purchases Journal</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pagination.total} invoices tracked</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/40">
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill # & Date</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items Summary</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status & Due</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Receipt</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        Loading purchase invoices...
                                    </td>
                                </tr>
                            ) : purchases.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        No purchase records found
                                    </td>
                                </tr>
                            ) : (
                                purchases.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-mono font-black text-gray-900 text-xs">{p.purchaseNumber}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                Bill #{p.invoiceNumber} • {new Date(p.invoiceDate).toLocaleDateString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-black text-gray-900 text-xs">{p.vendor?.companyName || 'Supplier'}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{p.vendor?.phone || 'No phone'}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-xs text-gray-800 line-clamp-1 max-w-[200px]" title={p.items?.map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ')}>
                                                {p.items?.map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ')}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                {p.items?.length || 0} line item{p.items?.length !== 1 ? 's' : ''}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-black text-gray-900 text-xs">
                                                ₹{(p.totalAmount || 0).toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                Tax: ₹{(p.taxAmount || 0).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {getPaymentBadge(p.paymentStatus)}
                                            </div>
                                            {p.balanceAmount > 0 && (
                                                <div className="text-[10px] font-black text-amber-600 mt-1">
                                                    DUE: ₹{p.balanceAmount.toLocaleString('en-IN')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {p.invoiceDocument ? (
                                                <a
                                                    href={p.invoiceDocument}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-black bg-gray-100 hover:bg-gray-200 transition-all"
                                                    title="View Bill"
                                                >
                                                    <Eye size={12} /> View
                                                </a>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {p.balanceAmount > 0 && (
                                                    <button
                                                        onClick={() => handleOpenRecordPayment(p)}
                                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#56763D] text-white hover:bg-[#466031] transition-all shadow-xs"
                                                        title="Log Payment"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenEdit(p)}
                                                    className="p-2 text-gray-400 hover:text-[#56763D] hover:bg-gray-100 rounded-xl transition-all"
                                                    title="Edit Purchase"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePurchase(p)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete Purchase"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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

            {/* Modals */}
            <PurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                onSave={() => {
                    queryClient.invalidateQueries(['purchases', b]);
                    refetchStats();
                }}
                editingPurchase={editingPurchase}
                brand={b}
            />

            <RecordPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSave={() => {
                    queryClient.invalidateQueries(['purchases', b]);
                    refetchStats();
                }}
                purchase={selectedPurchaseForPayment}
            />
        </div>
    );
}
