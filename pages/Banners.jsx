import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import BannerModal from '../components/BannerModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Plus,
    Edit,
    Trash2,
    Image as ImageIcon,
    Sparkles,
    CheckCircle,
    Eye,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

export default function Banners() {
    const { brand: urlBrand } = useParams();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);

    const activeBrand = urlBrand || 'teasntrees';

    const { data: banners = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['banners', activeBrand],
        queryFn: async () => {
            const res = await api.get('/admin/banners');
            return res.data?.data || [];
        }
    });

    const handleToggle = async (banner) => {
        try {
            await api.patch(`/admin/banners/${banner._id}/toggle`);
            toast.success(`Banner ${banner.isActive ? 'deactivated' : 'activated'}`);
            queryClient.invalidateQueries(['banners', activeBrand]);
        } catch (err) {
            toast.error('Failed to toggle banner status');
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return;
        try {
            await api.delete(`/admin/banners/${id}`);
            toast.success('Banner deleted successfully');
            queryClient.invalidateQueries(['banners', activeBrand]);
        } catch (err) {
            toast.error('Failed to delete banner');
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-emerald-600" />
                        Promotional Banners
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Manage slides, promotional highlights, and hero images displayed on the customer home page
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
                            setEditingBanner(null);
                            setShowModal(true);
                        }}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        Add Banner
                    </button>
                </div>
            </div>

            {/* Banners Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 h-64"></div>
                    ))}
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Banners Found</h3>
                    <p className="text-xs text-gray-500 mb-6">Create promotional banner slides to showcase your top items</p>
                    <button
                        onClick={() => {
                            setEditingBanner(null);
                            setShowModal(true);
                        }}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                    >
                        Add First Banner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {banners.map((banner) => (
                        <div
                            key={banner._id}
                            className={`bg-white rounded-3xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                                banner.isActive
                                    ? 'border-emerald-100 hover:border-emerald-300'
                                    : 'border-gray-200 opacity-70'
                            }`}
                        >
                            {/* Visual Preview */}
                            <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-900 group">
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200';
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

                                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        {banner.subtitle || 'FEATURED'}
                                    </span>

                                    <button
                                        onClick={() => handleToggle(banner)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${
                                            banner.isActive
                                                ? 'bg-emerald-500 text-white shadow-md'
                                                : 'bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        {banner.isActive ? 'Active Live' : 'Hidden'}
                                    </button>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight mb-1 drop-shadow-md">
                                        {banner.title}
                                    </h3>
                                    {banner.description && (
                                        <p className="text-white/80 text-xs font-medium line-clamp-1 max-w-sm drop-shadow-sm">
                                            {banner.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Details & Controls */}
                            <div className="p-5 flex items-center justify-between border-t border-gray-100">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    {banner.price != null && (
                                        <span className="font-black text-gray-900 text-sm">
                                            ₹{banner.price}
                                        </span>
                                    )}
                                    <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-600 font-semibold">
                                        Order: #{banner.displayOrder || 0}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingBanner(banner);
                                            setShowModal(true);
                                        }}
                                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner._id, banner.title)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <BannerModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                banner={editingBanner}
                brand={activeBrand}
                onSuccess={() => queryClient.invalidateQueries(['banners', activeBrand])}
            />
        </div>
    );
}

