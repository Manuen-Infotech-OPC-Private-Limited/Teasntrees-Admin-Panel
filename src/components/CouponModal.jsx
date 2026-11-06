import { useState, useEffect } from 'react';
import { X, Ticket, Calendar, DollarSign, Percent, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CouponModal({ isOpen, onClose, coupon, brand, onSuccess }) {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountAmount: '',
        maxDiscount: '',
        minOrderValue: '0',
        usageLimit: '',
        perUserLimit: '1',
        firstOrderOnly: false,
        expiryDate: '',
        isActive: true,
        brand: brand || 'teasntrees'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (coupon) {
                // Edit mode
                const expDate = coupon.expiryDate 
                    ? new Date(coupon.expiryDate).toISOString().split('T')[0]
                    : '';
                setFormData({
                    code: coupon.code || '',
                    description: coupon.description || '',
                    discountType: coupon.discountType || 'percentage',
                    discountAmount: coupon.discountAmount ?? '',
                    maxDiscount: coupon.maxDiscount ?? '',
                    minOrderValue: coupon.minOrderValue ?? 0,
                    usageLimit: coupon.usageLimit ?? '',
                    perUserLimit: coupon.perUserLimit ?? 1,
                    firstOrderOnly: Boolean(coupon.firstOrderOnly),
                    expiryDate: expDate,
                    isActive: coupon.isActive !== undefined ? coupon.isActive : true,
                    brand: coupon.brand || brand || 'teasntrees'
                });
            } else {
                // Default 30 days ahead for new coupon
                const defaultExp = new Date();
                defaultExp.setDate(defaultExp.getDate() + 30);
                const expDate = defaultExp.toISOString().split('T')[0];

                setFormData({
                    code: '',
                    description: '',
                    discountType: 'percentage',
                    discountAmount: '',
                    maxDiscount: '',
                    minOrderValue: '0',
                    usageLimit: '',
                    perUserLimit: '1',
                    firstOrderOnly: false,
                    expiryDate: expDate,
                    isActive: true,
                    brand: brand || 'teasntrees'
                });
            }
            setError('');
        }
    }, [isOpen, coupon, brand]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.code.trim()) {
            setError('Coupon code is required');
            setLoading(false);
            return;
        }

        if (!formData.discountAmount || Number(formData.discountAmount) <= 0) {
            setError('Please enter a valid discount amount greater than 0');
            setLoading(false);
            return;
        }

        if (formData.discountType === 'percentage' && Number(formData.discountAmount) > 100) {
            setError('Percentage discount cannot exceed 100%');
            setLoading(false);
            return;
        }

        if (!formData.expiryDate) {
            setError('Expiry date is required');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                code: formData.code.trim().toUpperCase(),
                description: formData.description.trim(),
                discountType: formData.discountType,
                discountAmount: Number(formData.discountAmount),
                maxDiscount: formData.maxDiscount !== '' ? Number(formData.maxDiscount) : null,
                minOrderValue: Number(formData.minOrderValue) || 0,
                usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null,
                perUserLimit: formData.perUserLimit !== '' ? Number(formData.perUserLimit) : 1,
                firstOrderOnly: Boolean(formData.firstOrderOnly),
                expiryDate: new Date(formData.expiryDate).toISOString(),
                isActive: Boolean(formData.isActive),
                brand: formData.brand || brand || null
            };

            if (coupon) {
                await api.put(`/admin/coupons/${coupon._id}`, payload);
                toast.success('Offer updated successfully');
            } else {
                await api.post('/admin/coupons', payload);
                toast.success('Offer created successfully');
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving coupon:', err);
            setError(err.response?.data?.message || 'Failed to save offer. Please check details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {coupon ? 'Edit Offer / Coupon' : 'Create New Offer'}
                            </h3>
                            <p className="text-xs text-gray-500">Configure discounts, limits, and rules</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Coupon Code *
                        </label>
                        <input
                            type="text"
                            required
                            disabled={Boolean(coupon)}
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. SUMMER50"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black tracking-wider uppercase disabled:bg-gray-100 disabled:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Description / Customer Note
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g. 20% off on orders above ₹299"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Discount Type
                            </label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Discount Value *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                    {formData.discountType === 'percentage' ? '%' : '₹'}
                                </span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={formData.discountType === 'percentage' ? 100 : 10000}
                                    value={formData.discountAmount}
                                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Min Order Value (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.minOrderValue}
                                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                placeholder="0"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Max Cap (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                disabled={formData.discountType === 'flat'}
                                value={formData.maxDiscount}
                                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                placeholder={formData.discountType === 'flat' ? 'N/A' : 'e.g. 150'}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Expiry Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Total Usage Cap
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                placeholder="Unlimited"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.firstOrderOnly}
                                onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">First-time customers only</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">Active and available for checkout</span>
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Saving...' : coupon ? 'Update Offer' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

