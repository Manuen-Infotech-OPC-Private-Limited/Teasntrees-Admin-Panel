import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import CategoryModal from '../components/CategoryModal';
import ExportButton from '../components/ExportButton';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    Folder,
    Eye,
    ArrowRight,
    LayoutGrid,
    RefreshCw
} from 'lucide-react';

const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-64"></div>
        ))}
    </div>
);

export default function Categories() {
    const navigate = useNavigate();
    const { brand: urlBrand } = useParams();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [error, setError] = useState(null);

    const [pagination, setPagination] = useState({ currentPage: 1, limit: 12 });

    const { data, isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['categories', pagination.currentPage, searchTerm, urlBrand],
        queryFn: async () => {
            const params = new URLSearchParams({ page: pagination.currentPage, limit: pagination.limit, sortBy: 'displayOrder', order: 'asc' });
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/admin/categories?${params.toString()}`);
            const data = response.data;
            const cacheKey = `categories-cache-${urlBrand || 'all'}-${pagination.currentPage}-${searchTerm || 'all'}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cacheKey = `categories-cache-${urlBrand || 'all'}-${pagination.currentPage}-${searchTerm || 'all'}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    const isSyncing = isFetching;

    const categories = data?.data || [];
    const totalCount = data?.pagination?.totalItems || categories.length;
    const totalPages = data?.pagination?.totalPages || 1;

    useEffect(() => {
        if (!socket) return;
        const handleCategoryChange = () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); };
        socket.on('category:created', handleCategoryChange);
        socket.on('category:updated', handleCategoryChange);
        socket.on('category:deleted', handleCategoryChange);
        return () => {
            socket.off('category:created', handleCategoryChange);
            socket.off('category:updated', handleCategoryChange);
            socket.off('category:deleted', handleCategoryChange);
        };
    }, [socket, queryClient]);

    const deleteCategory = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        } catch (error) { setError(error.response?.data?.message || 'Failed to delete category'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Categories</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage product categories and structure</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                    <ExportButton resource="categories" filters={{ search: searchTerm }} />
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20">
                        <Plus className="w-5 h-5" />
                        New Group
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Total Categories" value={totalCount} icon={LayoutGrid} theme="blue" desc="Groups in use" loading={loading && !data} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-12 text-sm font-bold" />
                </div>
            </div>

            {error && <div className="bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-2xl font-black text-xs uppercase">{error}</div>}

            <div className="min-h-[400px]">
                {categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                        {categories.map((category) => (
                            <div key={category._id} className="bg-white rounded-[2rem] shadow-sm border-2 border-gray-50 overflow-hidden flex flex-col">
                                <div className="h-40 bg-gray-50/50 flex items-center justify-center relative">
                                    <span className="text-7xl drop-shadow-sm">{category.icon || '📦'}</span>
                                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg border border-gray-100"><span className="text-[8px] font-black uppercase text-gray-400 select-none">Order: {category.displayOrder || 0}</span></div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-900 uppercase break-words text-sm mb-1">{category.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold break-words leading-relaxed">{category.description || 'Global classification group'}</p>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${category.brand === 'littleh' ? 'text-pink-600' : 'text-emerald-600'}`}>
                                            {category.brand === 'littleh' ? 'LITTLEH BAKERY' : 'TEAS N TREES'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 mt-6">
                                        <button onClick={() => navigate(`/${urlBrand}/categories/${category._id}`)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-[#56763D] hover:text-white transition-all">View Products</button>
                                        <button onClick={() => { setEditingCategory(category); setShowModal(true); }} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Edit</button>
                                        <button onClick={() => deleteCategory(category._id)} className="px-4 py-3 bg-red-50 text-red-300 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <Folder className="w-24 h-24 text-gray-100 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">No matching groups</h3>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-10">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                        disabled={pagination.currentPage === 1}
                        className="p-4 bg-white border border-gray-100 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: i + 1 }))}
                                className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${pagination.currentPage === i + 1
                                    ? 'bg-[#56763D] text-white shadow-xl scale-110'
                                    : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                        disabled={pagination.currentPage === totalPages}
                        className="p-4 bg-white border border-gray-100 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            <CategoryModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingCategory(null); }} category={editingCategory} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['categories'] })} />
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-indigo-700 shadow-blue-100 text-blue-600 bg-blue-50',
        purple: 'from-purple-600 to-pink-700 shadow-purple-100 text-purple-600 bg-purple-50'
    };
    const style = themes[theme] || themes.blue;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');
    return (
        <div className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                    <h3 className={`text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none ${loading ? 'animate-pulse opacity-50' : ''}`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-md ${shadow} shrink-0`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
            </div>
            {desc && (
                <div className="mt-3">
                    <div className={`inline-flex items-center gap-1 py-0.5 px-2.5 ${bgColor} rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight ${textColor}`}>
                        <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                        <span className="leading-tight">{desc}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
