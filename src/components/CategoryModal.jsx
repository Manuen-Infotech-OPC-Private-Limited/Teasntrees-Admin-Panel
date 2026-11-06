import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

export default function CategoryModal({ isOpen, onClose, category, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '',
        displayOrder: '',
        brand: 'teasntrees'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (category) {
                // Edit mode
                setFormData({
                    name: category.name || '',
                    description: category.description || '',
                    icon: category.icon || '',
                    displayOrder: category.displayOrder || '',
                    brand: category.brand || 'teasntrees'
                });
            } else {
                // Add mode
                setFormData({
                    name: '',
                    description: '',
                    icon: '',
                    displayOrder: '',
                    brand: 'teasntrees'
                });
            }
            setError('');
        }
    }, [isOpen, category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                displayOrder: parseInt(formData.displayOrder) || 0
            };

            if (category) {
                // Update existing category
                await api.put(`/admin/categories/${category._id}`, payload);
            } else {
                // Create new category
                await api.post('/admin/categories', payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving category:', error.response?.data || error.message);
            setError(error.response?.data?.message || error.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100 my-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 p-4 sm:p-5 flex items-center justify-between z-10">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">
                        {category ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="E.G. HANDCRAFTED TEAS"
                            className="w-full bg-gray-50 border-none rounded-xl py-2.5 px-4 text-xs font-bold uppercase tracking-wider placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Short Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="BRIEF CLASSIFICATION SUMMARY..."
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white min-h-[100px] resize-none transition-all"
                            rows="3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Icon (Emoji)
                            </label>
                            <input
                                type="text"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="E.G. ☕"
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white text-center transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Display Order
                            </label>
                            <input
                                type="number"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                                placeholder="E.G. 1"
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Brand Selection *
                            </label>
                            <select
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white transition-all"
                                required
                            >
                                <option value="teasntrees">Teas N Trees</option>
                                <option value="littleh">Cream N Crust</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-transparent"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200"
                        >
                            {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
