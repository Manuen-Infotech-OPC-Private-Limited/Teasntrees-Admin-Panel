import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Building2,
    Phone,
    Mail,
    RefreshCw,
    Wallet,
    DollarSign,
    PackageCheck,
    CheckCircle2,
    XCircle,
    Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import VendorModal from '../components/VendorModal';
import ExportButton from '../components/ExportButton';

export default function Vendors() {
    const { brand } = useParams();
    const b = brand || 'teasntrees';
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    // Fetch vendor categories
    const { data: rawCategories } = useQuery({
        queryKey: ['vendor-categories', b],
        queryFn: async () => {
            const res = await api.get('/admin/vendors/categories');
            return res.data?.data || [];
        }
    });

    // Fetch vendor KPI stats
    const { data: rawStats, refetch: refetchStats, isFetching: isSyncingStats } = useQuery({
        queryKey: ['vendor-stats', b],
        queryFn: async () => {
            const res = await api.get('/admin/vendors/stats');
            return res.data?.data || {};
        }
    });

    // Fetch vendors list
    const { data: vendorsData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['vendors', b, page, searchTerm, selectedCategory, selectedStatus],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 15,
                search: searchTerm,
                category: selectedCategory,
                isActive: selectedStatus
            });
            const res = await api.get(`/admin/vendors?${params.toString()}`);
            return res.data;
        },
        keepPreviousData: true
    });

    const categoriesData = Array.isArray(rawCategories) ? rawCategories : [];
    const statsData = rawStats || {};
    const vendors = vendorsData?.data || [];
    const pagination = vendorsData?.pagination || { total: 0, pages: 1 };
    const isSyncing = isFetching || isSyncingStats;

    const handleOpenCreate = () => {
        setEditingVendor(null);
        setShowModal(true);
    };

    const handleOpenEdit = (vendor) => {
        setEditingVendor(vendor);
        setShowModal(true);
    };

    const handleDeleteVendor = async (vendor) => {
        if (!window.confirm(`Are you sure you want to remove or deactivate "${vendor.companyName}"?`)) {
            return;
        }

        try {
            const res = await api.delete(`/admin/vendors/${vendor._id}`);
            toast.success(res.data?.message || 'Vendor removed');
            queryClient.invalidateQueries(['vendors', b]);
            refetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove vendor');
        }
    };

    const formatCategoryLabel = (val) => {
        const found = (categoriesData || []).find(c => c.value === val);
        return found ? found.label : (val || '').replace(/_/g, ' ').toUpperCase();
    };

    return (
        <div className="space-y-6 sm:space-y-8 relative">
            {/* Top Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Vendor Management</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage suppliers, procurement dues, and ingredients partners</p>
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
                        resource="vendors"
                        filters={{
                            search: searchTerm,
                            category: selectedCategory === 'all' ? '' : selectedCategory,
                            status: selectedStatus === 'all' ? '' : selectedStatus
                        }}
                    />
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20"
                    >
                        <Plus className="w-4 h-4" /> Add Vendor
                    </button>
                </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Total Vendors</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                {statsData?.totalVendors || 0}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                            <Building2 className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 mt-2">({statsData?.activeVendors || 0} Active Partners)</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Total Procurement</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                ₹{(statsData?.totalProcurement || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                            <PackageCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">Historical procurement volume</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Outstanding Dues</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600">
                                ₹{(statsData?.totalOutstanding || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 mt-2">Pending payment liabilities</span>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Category Types</span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                                {categoriesData.length}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2">
                        {b === 'littleh' ? 'Bakery Supply Domains' : 'Cafe Supply Domains'}
                    </span>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-[2rem] p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH VENDOR, PHONE, GSTIN..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold focus:outline-hidden"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                        className="w-full md:w-60 bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-700 focus:outline-hidden"
                    >
                        <option value="all">ALL CATEGORIES</option>
                        {categoriesData.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label.toUpperCase()}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                        className="w-full md:w-36 bg-gray-50 border border-transparent focus:border-black rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-700 focus:outline-hidden"
                    >
                        <option value="all">STATUS: ALL</option>
                        <option value="true">ACTIVE ONLY</option>
                        <option value="false">INACTIVE</option>
                    </select>
                </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Suppliers Directory</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pagination.total} partners listed</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/40">
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company & Contact</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone & Email</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">GSTIN & Terms</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Purchases & Balance</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        Loading vendors directory...
                                    </td>
                                </tr>
                            ) : vendors.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                                        No vendors found matching your filter
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-black text-gray-900 text-xs">{vendor.companyName}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">Contact: {vendor.name}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800">
                                                {formatCategoryLabel(vendor.category)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                                                <Phone size={12} className="text-gray-400" /> {vendor.phone}
                                            </div>
                                            {vendor.email && (
                                                <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                                                    <Mail size={12} className="text-gray-400" /> {vendor.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-mono font-bold text-xs text-gray-800">
                                                {vendor.gstin || 'NO GSTIN'}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                                {(vendor.paymentTerms || 'immediate').replace(/_/g, ' ')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-black text-xs text-gray-900">
                                                ₹{(vendor.stats?.totalAmount || 0).toLocaleString('en-IN')}
                                                <span className="text-gray-400 font-normal ml-1 text-[10px]">({vendor.stats?.totalPurchases || 0} bills)</span>
                                            </div>
                                            {vendor.stats?.totalBalance > 0 ? (
                                                <div className="text-[10px] font-black text-amber-600 mt-0.5">
                                                    DUE: ₹{vendor.stats.totalBalance.toLocaleString('en-IN')}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-black text-emerald-600 mt-0.5">ALL SETTLED</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {vendor.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                                                    <CheckCircle2 size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600">
                                                    <XCircle size={12} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(vendor)}
                                                    className="p-2 text-gray-400 hover:text-[#56763D] hover:bg-gray-100 rounded-xl transition-all"
                                                    title="Edit Vendor"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVendor(vendor)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete / Deactivate"
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

            {/* Vendor Modal */}
            <VendorModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={() => {
                    queryClient.invalidateQueries(['vendors', b]);
                    refetchStats();
                }}
                editingVendor={editingVendor}
                brand={b}
            />
        </div>
    );
}
