import { useState, useEffect } from 'react';
import { X, Image, Upload, Trash2, Sparkles, DollarSign } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function BannerModal({ isOpen, onClose, banner, brand, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: 'FEATURED',
        description: '',
        price: '',
        image: '',
        link: '/menu',
        accent: '#10b981',
        displayOrder: 0,
        isActive: true,
        brand: brand || 'teasntrees'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (banner) {
                setFormData({
                    title: banner.title || '',
                    subtitle: banner.subtitle || 'FEATURED',
                    description: banner.description || '',
                    price: banner.price ?? '',
                    image: banner.image || '',
                    link: banner.link || '/menu',
                    accent: banner.accent || (brand === 'littleh' ? '#B7410E' : '#10b981'),
                    displayOrder: banner.displayOrder ?? 0,
                    isActive: banner.isActive !== undefined ? banner.isActive : true,
                    brand: banner.brand || brand || 'teasntrees'
                });
                setImagePreview(banner.image || '');
            } else {
                setFormData({
                    title: '',
                    subtitle: 'FEATURED',
                    description: '',
                    price: '',
                    image: '',
                    link: '/menu',
                    accent: brand === 'littleh' ? '#B7410E' : '#10b981',
                    displayOrder: 0,
                    isActive: true,
                    brand: brand || 'teasntrees'
                });
                setImagePreview('');
            }
            setImageFile(null);
            setError('');
        }
    }, [isOpen, banner, brand]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return formData.image;
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);

        try {
            const response = await api.post('/admin/upload/image?folder=banners', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data.url;
        } catch (err) {
            console.error('Failed to upload image:', err);
            throw new Error('Failed to upload image to storage');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.title.trim()) {
            setError('Banner title is required');
            setLoading(false);
            return;
        }

        try {
            let finalImageUrl = formData.image;
            if (imageFile) {
                finalImageUrl = await uploadImage();
            }

            if (!finalImageUrl) {
                setError('Please upload an image or provide an image URL');
                setLoading(false);
                return;
            }

            const payload = {
                title: formData.title.trim(),
                subtitle: formData.subtitle.trim() || 'FEATURED',
                description: formData.description.trim(),
                price: formData.price !== '' && formData.price !== null ? Number(formData.price) : null,
                image: finalImageUrl,
                link: formData.link.trim() || '/menu',
                accent: formData.accent || (brand === 'littleh' ? '#B7410E' : '#10b981'),
                displayOrder: Number(formData.displayOrder) || 0,
                isActive: Boolean(formData.isActive),
                brand: formData.brand || brand || 'teasntrees'
            };

            if (banner) {
                await api.put(`/admin/banners/${banner._id}`, payload);
                toast.success('Banner updated successfully');
            } else {
                await api.post('/admin/banners', payload);
                toast.success('Banner created successfully');
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving banner:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save banner');
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
                            <Image className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {banner ? 'Edit Promotional Banner' : 'Add Promotional Banner'}
                            </h3>
                            <p className="text-xs text-gray-500">Carousel slide displayed on the customer home page</p>
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
                    {/* Image Preview & Upload */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Banner Background Image *
                        </label>
                        {imagePreview ? (
                            <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-200 group mb-3">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <label className="px-4 py-2 bg-white text-gray-800 text-xs font-bold rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                        Change Image
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview('');
                                            setFormData({ ...formData, image: '' });
                                        }}
                                        className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all p-4 mb-3">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-xs font-bold text-gray-600">Click to upload banner image</span>
                                <span className="text-[10px] text-gray-400 mt-1">Recommended: 1200x600 px (Landscape)</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        )}

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Or direct image URL:</span>
                            <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => {
                                    setFormData({ ...formData, image: e.target.value });
                                    if (!imageFile) setImagePreview(e.target.value);
                                }}
                                placeholder="https://example.com/banner.jpg"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Banner Heading / Product Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Special Masala Nachos"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Badge / Subtitle
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                placeholder="e.g. BEST SELLER, SIGNATURE"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase tracking-wider font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Price Tag (₹ Optional)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="e.g. 249"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Crispy nachos with special Indian masala toppings and warm melted cheese."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Display Order
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                                placeholder="1, 2, 3..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Button Link
                            </label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="/menu"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">Display this banner in live home carousel</span>
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
                            disabled={loading || uploading}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                        >
                            {uploading ? 'Uploading Image...' : loading ? 'Saving...' : banner ? 'Update Banner' : 'Create Banner'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

