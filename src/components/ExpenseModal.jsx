import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const CATEGORIES = [
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

const PAYMENT_METHODS = [
    { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer (IMPS/NEFT)' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' }
];

export default function ExpenseModal({ isOpen, onClose, onSave, editingExpense, brand = 'teasntrees' }) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'rent',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        referenceNumber: '',
        notes: ''
    });

    useEffect(() => {
        if (editingExpense) {
            setFormData({
                title: editingExpense.title || '',
                category: editingExpense.category || 'rent',
                amount: editingExpense.amount || '',
                expenseDate: editingExpense.expenseDate ? new Date(editingExpense.expenseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                paymentMethod: editingExpense.paymentMethod || 'upi',
                paymentStatus: editingExpense.paymentStatus || 'paid',
                referenceNumber: editingExpense.referenceNumber || '',
                notes: editingExpense.notes || ''
            });
        } else {
            setFormData({
                title: '',
                category: 'rent',
                amount: '',
                expenseDate: new Date().toISOString().slice(0, 10),
                paymentMethod: 'upi',
                paymentStatus: 'paid',
                referenceNumber: '',
                notes: ''
            });
        }
    }, [editingExpense, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            return toast.error('Please enter an expense title');
        }

        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0) {
            return toast.error('Please enter a valid amount greater than ₹0');
        }

        setSaving(true);
        try {
            const payload = {
                brand,
                title: formData.title.trim(),
                category: formData.category,
                amount: amt,
                expenseDate: formData.expenseDate,
                paymentMethod: formData.paymentMethod,
                paymentStatus: formData.paymentStatus,
                referenceNumber: formData.referenceNumber.trim(),
                notes: formData.notes.trim()
            };

            let res;
            if (editingExpense) {
                res = await api.put(`/admin/expenses/${editingExpense._id}`, payload);
            } else {
                res = await api.post('/admin/expenses', payload);
            }

            if (res.data?.success) {
                toast.success(editingExpense ? 'Expense updated successfully' : 'Expense recorded successfully');
                if (onSave) onSave();
                onClose();
            }
        } catch (err) {
            console.error('Failed to save expense', err);
            toast.error(err.response?.data?.message || 'Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight flex items-center gap-2">
                            <Tag className="w-5 h-5 text-[#56763D]" />
                            {editingExpense ? 'Edit Expense Record' : 'Record Operating Expense'}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            {editingExpense ? `Update: ${editingExpense.expenseNumber}` : 'Overhead & Operating Outflows (OPEX)'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                            Expense Title / Description *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Shop Rent - November, Electric Bill, Staff Salary"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all"
                        />
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                                Amount (INR ₹) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                                Expense Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.expenseDate}
                                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Category & Payment Method */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                                Expense Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all cursor-pointer"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                                Payment Method
                            </label>
                            <select
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all cursor-pointer"
                            >
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status & Reference */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                                Payment Status
                            </label>
                            <select
                                value={formData.paymentStatus}
                                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all cursor-pointer"
                            >
                                <option value="paid">PAID (Settled)</option>
                                <option value="pending">PENDING (Payable)</option>
                                <option value="cancelled">CANCELLED</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                                Reference / Bill # (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="Txn ID, Bill #, Voucher #"
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                            Additional Notes / Remarks
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Add any extra notes or memo regarding this expense..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#56763D] outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 font-black text-xs uppercase hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 rounded-2xl bg-[#56763D] text-white font-black text-xs uppercase tracking-wider hover:bg-[#466031] transition-all shadow-lg shadow-[#56763D]/25 disabled:opacity-50 flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

