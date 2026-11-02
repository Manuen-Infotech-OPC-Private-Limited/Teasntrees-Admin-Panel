import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import CouponModal from '../components/CouponModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Ticket,
    Percent,
    Sparkles,
    CheckCircle,
    XCircle,
    Users,
    Copy,
    RefreshCw
} from 'lucide-react';

export default function Offers() {
    const { brand: urlBrand } = useParams();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const activeBrand = urlBrand || 'teasntrees';

    const { data: coupons = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['coupons', activeBrand],
        queryFn: async () => {
            const res = await api.get('/admin/coupons');
            return res.data?.data || [];
        }
    });

    const filteredCoupons = coupons.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return c.code?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term);
    });

    const totalOffers = coupons.length;
    const activeOffers = coupons.filter(c => c.isActive).length;
    const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

    const handleToggle = async (coupon) => {
        try {
            await api.patch(`/admin/coupons/${coupon._id}/toggle`);
            toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
            queryClient.invalidateQueries(['coupons', activeBrand]);
        } catch (err) {
            toast.error('Failed to toggle coupon status');
        }
    };

    const handleDelete = async (id, code) => {
        if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;
        try {
            await api.delete(`/admin/coupons/${id}`);
            toast.success('Coupon deleted successfully');
            queryClient.invalidateQueries(['coupons', activeBrand]);
        } catch (err) {
            toast.error('Failed to delete coupon');
        }
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`Copied ${code} to clipboard`);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-emerald-600" />
                        Offers & Coupons
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Create promotional codes, welcome discounts, and percentage vouchers for customers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-emerald-600 hover:border-emerald-200 shadow-xs transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            setShowModal(true);
                        }}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        Create Offer
                    </button>
                </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Offers</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalOffers}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-black">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Live</p>
                        <h3 className="text-2xl font-black text-gray-900">{activeOffers}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Redeemed</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalRedeemed} times</h3>
                    </div>
                </div>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search offers by code or description..."
                    className="w-full bg-transparent border-none text-sm focus:outline-none text-gray-800 placeholder-gray-400 font-medium"
                />
            </div>

            {/* Coupons List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 h-52"></div>
                    ))}
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Offers Found</h3>
                    <p className="text-xs text-gray-500 mb-6">Create promotional discount codes for your customers</p>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            setShowModal(true);
                        }}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                    >
                        Create First Offer
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCoupons.map((coupon) => {
                        const isExpired = new Date(coupon.expiryDate) < new Date();
                        return (
                            <div
                                key={coupon._id}
                                className={`bg-white rounded-3xl border transition-all p-6 relative overflow-hidden flex flex-col justify-between ${
                                    coupon.isActive && !isExpired
                                        ? 'border-emerald-100 shadow-xs hover:border-emerald-300'
                                        : 'border-gray-200 bg-gray-50/50 opacity-75'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                onClick={() => copyCode(coupon.code)}
                                                className="px-4 py-2 rounded-xl bg-emerald-50 border border-dashed border-emerald-300 flex items-center gap-2 cursor-pointer group hover:bg-emerald-100 transition-colors"
                                            >
                                                <span className="font-black tracking-wider text-emerald-800 text-base font-mono">
                                                    {coupon.code}
                                                </span>
                                                <Copy className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                            </div>
                                            {coupon.firstOrderOnly && (
                                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                                                    First Order
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleToggle(coupon)}
                                            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors ${
                                                coupon.isActive && !isExpired
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            }`}
                                        >
                                            {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-xl font-black text-gray-900 mb-1">
                                            {coupon.discountType === 'percentage'
                                                ? `${coupon.discountAmount}% OFF`
                                                : `₹${coupon.discountAmount} FLAT OFF`}
                                            {coupon.maxDiscount && (
                                                <span className="text-xs font-semibold text-gray-500 ml-2">
                                                    (Up to ₹{coupon.maxDiscount})
                                                </span>
                                            )}
                                        </div>
                                        {coupon.description && (
                                            <p className="text-xs text-gray-500 font-medium line-clamp-2">
                                                {coupon.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3 mb-6">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Min Order:</span>
                                            <span className="font-bold">₹{coupon.minOrderValue || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Times Used:</span>
                                            <span className="font-bold">
                                                {coupon.usedCount || 0}
                                                {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (Unlimited)'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Expires:</span>
                                            <span className={`font-bold ${isExpired ? 'text-red-500' : ''}`}>
                                                {new Date(coupon.expiryDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setEditingCoupon(coupon);
                                            setShowModal(true);
                                        }}
                                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon._id, coupon.code)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <CouponModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                coupon={editingCoupon}
                brand={activeBrand}
                onSuccess={() => queryClient.invalidateQueries(['coupons', activeBrand])}
            />
        </div>
    );
}

