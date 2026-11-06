import { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, FileText, CreditCard, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function VendorModal({ isOpen, onClose, onSave, editingVendor, brand = 'teasntrees' }) {
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [saving, setSaving] = useState(false);

    const initialFormState = {
        companyName: '',
        name: '',
        category: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        paymentTerms: 'immediate',
        bankDetails: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            ifsc: '',
            upiId: ''
        },
        notes: '',
        isActive: true
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch brand-specific categories
    useEffect(() => {
        if (!isOpen) return;
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await api.get('/admin/vendors/categories');
                if (res.data?.success && res.data.data) {
                    setCategories(res.data.data);
                    if (!editingVendor && res.data.data.length > 0) {
                        setFormData(prev => ({ ...prev, category: res.data.data[0].value }));
                    }
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [isOpen, editingVendor]);

    // Populate editing vendor data
    useEffect(() => {
        if (editingVendor) {
            setFormData({
                companyName: editingVendor.companyName || '',
                name: editingVendor.name || '',
                category: editingVendor.category || '',
                phone: editingVendor.phone || '',
                email: editingVendor.email || '',
                gstin: editingVendor.gstin || '',
                address: editingVendor.address || '',
                city: editingVendor.city || '',
                state: editingVendor.state || '',
                pincode: editingVendor.pincode || '',
                paymentTerms: editingVendor.paymentTerms || 'immediate',
                bankDetails: {
                    accountName: editingVendor.bankDetails?.accountName || '',
                    accountNumber: editingVendor.bankDetails?.accountNumber || '',
                    bankName: editingVendor.bankDetails?.bankName || '',
                    ifsc: editingVendor.bankDetails?.ifsc || '',
                    upiId: editingVendor.bankDetails?.upiId || ''
                },
                notes: editingVendor.notes || '',
                isActive: editingVendor.isActive !== undefined ? editingVendor.isActive : true
            });
        } else {
            setFormData(initialFormState);
        }
    }, [editingVendor, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.companyName.trim()) {
            return toast.error('Please enter the vendor company name');
        }
        if (!formData.name.trim()) {
            return toast.error('Please enter the contact person name');
        }
        if (!formData.category) {
            return toast.error('Please select a vendor category');
        }
        if (!formData.phone.trim()) {
            return toast.error('Please enter a contact phone number');
        }

        try {
            setSaving(true);
            if (editingVendor?._id) {
                await api.put(`/admin/vendors/${editingVendor._id}`, formData);
                toast.success('Vendor updated successfully');
            } else {
                await api.post('/admin/vendors', formData);
                toast.success('Vendor added successfully');
            }
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save vendor');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-none border border-gray-200 max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {editingVendor ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            {brand === 'littleh' ? 'Bakery Ingredients & Supplies Partner' : 'Cafe Supplies & Inventory Partner'}
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
                    {/* Basic Info */}
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                            Company & Contact Information
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Company / Trade Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Assam Tea Estates Ltd"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Contact Person *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rajesh Sharma"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                                    Domain Category * ({brand === 'littleh' ? 'Bakery' : 'Cafe'})
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    disabled={loadingCategories}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-hidden"
                                >
                                    {loadingCategories ? (
                                        <option value="">Loading categories...</option>
                                    ) : (
                                        categories.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label.toUpperCase()}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="vendor@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">GSTIN Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 29ABCDE1234F1Z5"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden uppercase font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address & Terms */}
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                            Billing Address & Payment Terms
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Office / Warehouse Address</label>
                                <input
                                    type="text"
                                    placeholder="Street / Area / Landmark"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">City</label>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">State</label>
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Payment Terms</label>
                                <select
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-hidden"
                                >
                                    <option value="immediate">IMMEDIATE / ON DELIVERY</option>
                                    <option value="net15">NET 15 DAYS</option>
                                    <option value="net30">NET 30 DAYS</option>
                                    <option value="net60">NET 60 DAYS</option>
                                    <option value="cash_on_delivery">CASH ON DELIVERY</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                            Bank Account & UPI Settlement
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC Bank"
                                    value={formData.bankDetails.bankName}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Account Number</label>
                                <input
                                    type="text"
                                    placeholder="Account Number"
                                    value={formData.bankDetails.accountNumber}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">IFSC Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC0001234"
                                    value={formData.bankDetails.ifsc}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, ifsc: e.target.value.toUpperCase() }
                                    })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">UPI ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. vendor@okaxis"
                                    value={formData.bankDetails.upiId}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                                    })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Special Notes / Remarks</label>
                            <input
                                type="text"
                                placeholder="Discounts, minimum orders..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-gray-50 border border-transparent focus:border-[#56763D] rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-hidden"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-4 sm:pt-4">
                            <input
                                type="checkbox"
                                id="vendorIsActiveCustom"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded-lg text-black focus:ring-black border-gray-300"
                            />
                            <label htmlFor="vendorIsActiveCustom" className="text-xs font-black uppercase text-gray-800 cursor-pointer">
                                Active Supplier Partner
                            </label>
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
                            {saving ? 'Saving...' : editingVendor ? 'Update Supplier' : 'Save Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
