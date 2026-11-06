import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, FileText, DollarSign, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function PurchaseModal({ isOpen, onClose, onSave, editingPurchase, brand = 'teasntrees' }) {
    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const initialItem = {
        name: '',
        category: '',
        quantity: 1,
        unit: 'kg',
        unitPrice: 0,
        taxRate: 5,
        taxAmount: 0,
        totalPrice: 0
    };

    const [formData, setFormData] = useState({
        vendor: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        deliveryDate: '',
        items: [{ ...initialItem }],
        paidAmount: 0,
        paymentMethod: 'bank_transfer',
        status: 'received',
        invoiceDocument: '',
        notes: ''
    });

    // Fetch vendors list
    useEffect(() => {
        if (!isOpen) return;
        const fetchVendors = async () => {
            setLoadingVendors(true);
            try {
                const res = await api.get('/admin/vendors?limit=100&isActive=true');
                if (res.data?.success && res.data.data) {
                    setVendors(res.data.data);
                    if (!editingPurchase && res.data.data.length > 0 && !formData.vendor) {
                        setFormData(prev => ({ ...prev, vendor: res.data.data[0]._id }));
                    }
                }
            } catch (err) {
                console.error('Failed to load vendors', err);
            } finally {
                setLoadingVendors(false);
            }
        };
        fetchVendors();
    }, [isOpen, editingPurchase]);

    // Populate editing data if editing
    useEffect(() => {
        if (editingPurchase) {
            setFormData({
                vendor: editingPurchase.vendor?._id || editingPurchase.vendor || '',
                invoiceNumber: editingPurchase.invoiceNumber || '',
                invoiceDate: editingPurchase.invoiceDate ? new Date(editingPurchase.invoiceDate).toISOString().slice(0, 10) : '',
                deliveryDate: editingPurchase.deliveryDate ? new Date(editingPurchase.deliveryDate).toISOString().slice(0, 10) : '',
                items: editingPurchase.items && editingPurchase.items.length > 0 ? editingPurchase.items : [{ ...initialItem }],
                paidAmount: editingPurchase.paidAmount || 0,
                paymentMethod: editingPurchase.paymentMethod || 'bank_transfer',
                status: editingPurchase.status || 'received',
                invoiceDocument: editingPurchase.invoiceDocument || '',
                notes: editingPurchase.notes || ''
            });
        } else {
            setFormData({
                vendor: '',
                invoiceNumber: '',
                invoiceDate: new Date().toISOString().slice(0, 10),
                deliveryDate: '',
                items: [{ ...initialItem }],
                paidAmount: 0,
                paymentMethod: 'bank_transfer',
                status: 'received',
                invoiceDocument: '',
                notes: ''
            });
        }
    }, [editingPurchase, isOpen]);

    if (!isOpen) return null;

    // Handle Item Field Changes
    const handleItemChange = (index, field, value) => {
        const updated = [...formData.items];
        updated[index] = { ...updated[index], [field]: value };

        const qty = Number(updated[index].quantity) || 0;
        const price = Number(updated[index].unitPrice) || 0;
        const base = qty * price;
        const rate = Number(updated[index].taxRate) || 0;
        const tax = (base * rate) / 100;
        updated[index].taxAmount = Number(tax.toFixed(2));
        updated[index].totalPrice = Number((base + tax).toFixed(2));

        setFormData(prev => ({ ...prev, items: updated }));
    };

    const addItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...initialItem }]
        }));
    };

    const removeItemRow = (index) => {
        if (formData.items.length <= 1) {
            return toast.error('Purchase must have at least one line item');
        }
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    // Calculate Summary Totals
    const subtotal = formData.items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);
    const taxTotal = formData.items.reduce((acc, it) => acc + Number(it.taxAmount || 0), 0);
    const grandTotal = subtotal + taxTotal;
    const balance = Math.max(0, grandTotal - Number(formData.paidAmount || 0));

    // Handle Document Upload
    const handleDocUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            setUploadingDoc(true);
            const res = await api.post('/admin/upload/image', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success && res.data.data?.url) {
                setFormData(prev => ({ ...prev, invoiceDocument: res.data.data.url }));
                toast.success('Invoice document attached');
            }
        } catch (err) {
            toast.error('Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vendor) return toast.error('Please select a vendor');
        if (!formData.invoiceNumber.trim()) return toast.error('Please enter the vendor bill/invoice number');
        if (formData.items.some(it => !it.name.trim() || Number(it.quantity) <= 0 || Number(it.unitPrice) <= 0)) {
            return toast.error('Please complete all line items with valid name, quantity, and price');
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                vendor: formData.vendor,
                invoiceNumber: (formData.invoiceNumber || '').trim(),
                deliveryDate: formData.deliveryDate || null,
                invoiceDocument: formData.invoiceDocument || null,
                subtotal: Number(subtotal.toFixed(2)),
                taxAmount: Number(taxTotal.toFixed(2)),
                totalAmount: Number(grandTotal.toFixed(2)),
                paidAmount: Number(formData.paidAmount || 0)
            };

            if (editingPurchase?._id) {
                await api.put(`/admin/purchases/${editingPurchase._id}`, payload);
                toast.success('Purchase updated successfully');
            } else {
                await api.post('/admin/purchases', payload);
                toast.success('Purchase bill recorded successfully');
            }
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record purchase');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-6 sm:p-8 shadow-none border border-gray-200 max-h-[92vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {editingPurchase ? 'Edit Purchase Invoice' : 'New Purchase / Procurement Bill'}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            Record inventory supplies & vendor billing for {brand === 'littleh' ? 'Bakery' : 'Cafe'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/60 p-5 rounded-3xl border border-gray-100">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Select Supplier *</label>
                            <select
                                required
                                value={formData.vendor}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                disabled={loadingVendors}
                                className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:border-[#56763D] focus:outline-hidden"
                            >
                                <option value="">CHOOSE A SUPPLIER</option>
                                {vendors.map(v => (
                                    <option key={v._id} value={v._id}>
                                        {v.companyName.toUpperCase()} ({v.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Invoice / Bill # *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. INV-2026-904"
                                value={formData.invoiceNumber}
                                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-900 focus:border-[#56763D] focus:outline-hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Invoice Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-900 focus:border-[#56763D] focus:outline-hidden"
                            />
                        </div>
                    </div>

                    {/* Dynamic Line Items Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={14} /> Itemized Raw Materials / Supplies
                            </span>
                            <button
                                type="button"
                                onClick={addItemRow}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#56763D] text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                            >
                                <Plus size={12} /> Add Item Row
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-3xl border border-gray-200 bg-white shadow-2xs grid grid-cols-12 gap-2 sm:gap-3 items-center">
                                    <div className="col-span-12 sm:col-span-4">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Item Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Arabica Roast Beans"
                                            value={item.name}
                                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-xl py-2 px-3 text-xs font-bold focus:outline-hidden"
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Quantity *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-xl py-2 px-3 text-xs font-bold focus:outline-hidden"
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Unit</label>
                                        <select
                                            value={item.unit}
                                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-xl py-2 px-2 text-xs font-bold text-gray-800 focus:outline-hidden"
                                        >
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                            <option value="litre">litre</option>
                                            <option value="ml">ml</option>
                                            <option value="packet">packet</option>
                                            <option value="box">box</option>
                                            <option value="piece">piece</option>
                                            <option value="can">can</option>
                                        </select>
                                    </div>

                                    <div className="col-span-5 sm:col-span-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Price/Unit (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-xl py-2 px-3 text-xs font-bold focus:outline-hidden"
                                        />
                                    </div>

                                    <div className="col-span-4 sm:col-span-1">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">GST %</label>
                                        <select
                                            value={item.taxRate}
                                            onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent rounded-xl py-2 px-1 text-xs font-bold text-gray-800"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>

                                    <div className="col-span-3 sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                                        <button
                                            type="button"
                                            onClick={() => removeItemRow(idx)}
                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete row"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invoice Document & Financials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Invoice / Receipt Document</label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors">
                                        <Upload size={14} />
                                        <span>{uploadingDoc ? 'Uploading...' : 'Upload Image / PDF'}</span>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={handleDocUpload}
                                            disabled={uploadingDoc}
                                            className="hidden"
                                        />
                                    </label>
                                    {formData.invoiceDocument && (
                                        <a
                                            href={formData.invoiceDocument}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-black hover:underline font-black truncate max-w-[180px]"
                                        >
                                            View Attached ↗
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Description / Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Batch numbers, quality verification, delivery notes..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Financial Totals Breakdown */}
                        <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-100 space-y-2.5 text-xs">
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Subtotal (Ex-Tax):</span>
                                <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Input GST Amount:</span>
                                <span className="font-bold text-gray-900">₹{taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-gray-900 pt-3 border-t border-gray-200">
                                <span>Total Bill Amount:</span>
                                <span className="text-emerald-700">₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Paid Now (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={grandTotal}
                                        value={formData.paidAmount}
                                        onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-black text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-2 px-2 text-xs font-bold text-gray-800"
                                    >
                                        <option value="bank_transfer">BANK TRANSFER / NEFT</option>
                                        <option value="upi">UPI / GPAY</option>
                                        <option value="cash">CASH</option>
                                        <option value="cheque">CHEQUE</option>
                                        <option value="credit">CREDIT</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between text-xs font-black pt-2 text-amber-700">
                                <span>Balance Payable:</span>
                                <span>₹{balance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
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
                            className="flex items-center gap-2 px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-none hover:bg-[#466031] disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : editingPurchase ? 'Update Purchase' : 'Save Purchase Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
