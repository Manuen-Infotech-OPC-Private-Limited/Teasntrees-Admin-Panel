import { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function RecordPaymentModal({ isOpen, onClose, onSave, purchase }) {
    const [amount, setAmount] = useState(purchase?.balanceAmount || '');
    const [method, setMethod] = useState('bank_transfer');
    const [transactionRef, setTransactionRef] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen || !purchase) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            return toast.error('Please enter a valid payment amount');
        }
        if (numAmount > purchase.balanceAmount) {
            return toast.error(`Payment cannot exceed outstanding balance of ₹${purchase.balanceAmount}`);
        }

        try {
            setSaving(true);
            await api.post(`/admin/purchases/${purchase._id}/payment`, {
                amount: numAmount,
                method,
                transactionRef,
                notes,
                paidAt: new Date()
            });
            toast.success(`Payment of ₹${numAmount} logged successfully`);
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-none border border-gray-200">
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Record Payment</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            Bill #{purchase.invoiceNumber} • {purchase.vendor?.companyName || 'Supplier'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60 flex justify-between items-center text-amber-900">
                        <span className="font-bold text-[10px] uppercase tracking-wider">Current Balance Due:</span>
                        <span className="text-base font-black text-rose-700">₹{(purchase.balanceAmount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Payment Amount (₹) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={purchase.balanceAmount}
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-sm font-black text-gray-900 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Payment Method</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-hidden"
                        >
                            <option value="bank_transfer">BANK TRANSFER / NEFT</option>
                            <option value="upi">UPI / QR CODE</option>
                            <option value="cash">CASH</option>
                            <option value="cheque">CHEQUE</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Transaction Ref / Cheque #</label>
                        <input
                            type="text"
                            placeholder="e.g. UTR871239120"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Settlement Notes</label>
                        <input
                            type="text"
                            placeholder="Optional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-[10px] font-black uppercase transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20 disabled:opacity-50"
                        >
                            {saving ? 'Recording...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

