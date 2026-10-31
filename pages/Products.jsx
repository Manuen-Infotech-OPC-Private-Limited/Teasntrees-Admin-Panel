import { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import ProductModal from '../components/ProductModal';
import ExportButton from '../components/ExportButton';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Calendar,
    Package,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square,
    ArrowRight,
    Filter,
    RefreshCw
} from 'lucide-react';

const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-96"></div>
        ))}
    </div>
);

export default function Products() {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    const [searchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [error, setError] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [bulkAction, setBulkAction] = useState(null);

    const { brand: urlBrand } = useParams();
    const [pagination, setPagination] = useState({ currentPage: 1, limit: 50 });
    const [filters, setFilters] = useState({ category: '', tag: '', availability: 'all' });

    // Fetch Categories for Filter
    const { data: categoriesData } = useQuery({
        queryKey: ['categories-list', urlBrand],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: 100 });
            const response = await api.get(`/admin/categories?${params.toString()}`);
            return response.data.data || [];
        },
        placeholderData: (previousData) => previousData,
        staleTime: 60000 // Cache categories for 1 minute
    });

    // Fetch Products
    const { data: productsData, isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['products', pagination.currentPage, searchTerm, filters, urlBrand],
        queryFn: async () => {
            const params = new URLSearchParams({ page: pagination.currentPage, limit: pagination.limit, search: searchTerm });
            if (filters.category) params.append('category', filters.category);
            if (filters.tag) params.append('tags', filters.tag);
            if (filters.availability !== 'all') {
                params.append('isAvailable', filters.availability === 'available' ? 'true' : 'false');
            }
            const response = await api.get(`/admin/products?${params.toString()}`);
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    // Fetch Global Stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['products-stats', urlBrand],
        queryFn: async () => {
            const response = await api.get(`/admin/products/stats`);
            return response.data.data;
        },
        staleTime: 30000 // Cache for 30 seconds
    });

    const isSyncing = isFetching;

    const products = productsData?.data || [];
    const paginationInfo = productsData?.pagination || { totalPages: 1, totalItems: 0 };
    const categories = categoriesData || [];
    const stats = statsData || { totalProducts: 0, categoriesCount: 0, newIntroProducts: 0, hiddenProducts: 0 };
    const categoryNameById = useMemo(
        () => new Map(categories.map((cat) => [cat._id, cat.name])),
        [categories]
    );

    useEffect(() => {
        if (!socket) return;
        const handleProductChange = () => { queryClient.invalidateQueries({ queryKey: ['products'] }); };
        socket.on('product:created', handleProductChange);
        socket.on('product:updated', handleProductChange);
        socket.on('product:deleted', handleProductChange);
        return () => {
            socket.off('product:created', handleProductChange);
            socket.off('product:updated', handleProductChange);
            socket.off('product:deleted', handleProductChange);
        };
    }, [socket, queryClient]);

    const toggleAvailability = async (id, currentStatus) => {
        try {
            await api.put(`/admin/products/${id}/availability`, { isAvailable: !currentStatus });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) { console.error('Failed to toggle availability:', error); }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) { console.error('Failed to delete product:', error); }
    };

    const toggleProductSelection = (productId) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) newSelected.delete(productId);
        else newSelected.add(productId);
        setSelectedProducts(newSelected);
    };

    const executeBulkAction = async () => {
        if (!bulkAction || selectedProducts.size === 0) return;
        try {
            const productIds = Array.from(selectedProducts);
            if (bulkAction === 'make-available') {
                await api.put('/admin/products/bulk-update', { productIds, updates: { isAvailable: true } });
            } else if (bulkAction === 'make-unavailable') {
                await api.put('/admin/products/bulk-update', { productIds, updates: { isAvailable: false } });
            } else if (bulkAction === 'delete') {
                if (!window.confirm(`Delete ${productIds.length} products?`)) return;
                for (const id of productIds) await api.delete(`/admin/products/${id}`);
            }
            setSelectedProducts(new Set());
            setBulkAction(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) { setError('Bulk action failed'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Product List</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage items and pricing</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        disabled={isSyncing}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                    <ExportButton resource="products" filters={{ search: searchTerm, category: filters.category }} />
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-[#56763D]/20">
                        <Plus className="w-5 h-5" />
                        New Item
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Total Items" value={stats.totalProducts} icon={Package} theme="blue" desc="All items listed" loading={statsLoading} />
                <StatCard label="Categories" value={stats.categoriesCount} icon={Filter} theme="purple" desc="Active groups" loading={!categoriesData} />
                <StatCard label="New Items" value={stats.newIntroProducts} icon={Calendar} theme="green" desc="Marked as New" loading={statsLoading} />
                <StatCard label="Hidden Items" value={stats.hiddenProducts} icon={EyeOff} theme="orange" desc="Not visible to site" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search by name, SKU, or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-12 text-sm font-bold" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="input text-xs font-black uppercase">
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                    <select value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })} className="input text-xs font-black uppercase">
                        <option value="">All Tags</option>
                        <option value="new-intro">New Intro</option>
                        <option value="must-try">Must Try</option>
                        <option value="best-seller">Best Seller</option>
                    </select>
                    <select value={filters.availability} onChange={(e) => setFilters({ ...filters, availability: e.target.value })} className="input text-xs font-black uppercase">
                        <option value="all">All Visibility</option>
                        <option value="available">Live</option>
                        <option value="unavailable">Hidden</option>
                    </select>
                </div>
            </div>

            {selectedProducts.size > 0 && (
                <div className="bg-indigo-600 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-xl">
                    <div className="flex items-center gap-4 font-black uppercase text-xs">
                        <CheckSquare className="w-5 h-5" />
                        <span>{selectedProducts.size} Items Targeted</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="text-[10px] font-black uppercase border-none rounded-xl px-3 py-2 bg-white/20 text-white placeholder:text-white/50">
                            <option value="" className="text-gray-900">Choose action...</option>
                            <option value="make-available" className="text-gray-900">Push to Live</option>
                            <option value="make-unavailable" className="text-gray-900">Hide from Store</option>
                            <option value="delete" className="text-gray-900">Delete Permanently</option>
                        </select>
                        <button onClick={executeBulkAction} disabled={!bulkAction} className="bg-white text-indigo-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Apply</button>
                    </div>
                </div>
            )}

            <div className="min-h-[400px]">
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {products.map((product) => {
                            const categoryName = typeof product.category === 'object' && product.category !== null
                                ? product.category.name
                                : categoryNameById.get(product.category) || 'Uncategorized';

                            return (
                                <div key={product._id} className={`bg-white rounded-[2rem] shadow-sm border-2 overflow-hidden ${selectedProducts.has(product._id) ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-gray-50'}`}>
                                    <div className="h-56 bg-gray-50 flex items-center justify-center relative">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-16 h-16 text-gray-200" />
                                        )}
                                        <button onClick={() => toggleProductSelection(product._id)} className="absolute top-4 left-4 p-2 bg-white/90 rounded-xl shadow-lg">
                                            {selectedProducts.has(product._id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-200" />}
                                        </button>
                                        <button onClick={() => toggleAvailability(product._id, product.isAvailable)} className={`absolute top-4 right-4 p-2 rounded-xl shadow-lg backdrop-blur-md ${product.isAvailable ? 'bg-green-100/80 text-green-600' : 'bg-red-100/80 text-red-600'}`}>
                                            {product.isAvailable ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-black text-gray-900 uppercase break-words text-sm flex-1">{product.name}</h3>
                                                {product.isSeasonal && <span className="bg-orange-50 text-orange-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0">Seasonal</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 font-bold break-words mb-2">{product.description}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{categoryName}</p>

                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-2xl font-black text-gray-900">₹{product.displayPrice}</span>
                                                <div className="flex gap-1">
                                                    {product.tags?.map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            {product.sizeOptions && product.sizeOptions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
                                                    {product.sizeOptions.map((opt, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">{opt.size}</span>
                                                            <span className="text-[10px] font-black text-indigo-600">₹{opt.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => navigate(`/${urlBrand}/products/${product._id}`)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-[#56763D] hover:text-white transition-all">View</button>
                                            <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Edit</button>
                                            <button onClick={() => deleteProduct(product._id)} className="px-4 py-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <Package className="w-24 h-24 text-gray-100 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">No matching products</h3>
                    </div>
                )}
            </div>

            {paginationInfo.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-12">
                    <button onClick={() => setPagination(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))} disabled={pagination.currentPage === 1} className="p-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase disabled:opacity-30">Prev</button>
                    <span className="font-black text-gray-400 uppercase text-xs px-4">Page {pagination.currentPage} of {paginationInfo.totalPages}</span>
                    <button onClick={() => setPagination(p => ({ ...p, currentPage: Math.min(paginationInfo.totalPages, p.currentPage + 1) }))} disabled={pagination.currentPage === paginationInfo.totalPages} className="p-4 bg-[#56763D] text-white rounded-2xl text-xs font-black uppercase disabled:opacity-30">Next</button>
                </div>
            )}

            <ProductModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingProduct(null); }}
                product={editingProduct}
                brand={urlBrand}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    queryClient.invalidateQueries({ queryKey: ['products-stats'] });
                }}
            />
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-indigo-700 shadow-blue-100 text-blue-600 bg-blue-50',
        purple: 'from-purple-600 to-pink-700 shadow-purple-100 text-purple-600 bg-purple-50',
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50'
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
