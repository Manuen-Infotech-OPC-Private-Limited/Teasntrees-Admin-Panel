import { useState, useEffect } from 'react';
import api from '../utils/api';
import ProductModal from '../components/ProductModal';
import {
    Edit,
    Search,
    Calendar,
    Package,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Plus,
    X,
    Trash2,
    Save,
    RefreshCw,
    ArrowRight
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

const ProductSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-80"></div>
        ))}
    </div>
);

export default function SeasonalProducts() {
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { brand: urlBrand } = useParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('seasonal');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [error, setError] = useState(null);



    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fetch Seasonal Products
    const { data: seasonalProducts = [], isLoading: seasonalLoading } = useQuery({
        queryKey: ['products-seasonal-all'],
        queryFn: async () => {
            const response = await api.get('/admin/products/seasonal/all');
            const data = response.data.data || [];
            localStorage.setItem('products-seasonal-all-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('products-seasonal-all-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Out-of-Season Products
    const { data: outOfSeasonProducts = [], isLoading: outOfSeasonLoading } = useQuery({
        queryKey: ['products-seasonal-out-of-season'],
        queryFn: async () => {
            const response = await api.get('/admin/products/seasonal/out-of-season');
            const data = response.data.data || [];
            localStorage.setItem('products-seasonal-out-of-season-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('products-seasonal-out-of-season-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] });
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-out-of-season'] });
        };
        socket.on('product:created', handleUpdate);
        socket.on('product:updated', handleUpdate);
        socket.on('product:deleted', handleUpdate);
        return () => {
            socket.off('product:created', handleUpdate);
            socket.off('product:updated', handleUpdate);
            socket.off('product:deleted', handleUpdate);
        };
    }, [socket, queryClient]);

    const deleteProduct = async (id) => {
        if (!window.confirm('Delete this seasonal item?')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] });
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-out-of-season'] });
        } catch (error) { setError(error.response?.data?.message || 'Failed to delete'); }
    };

    const displayProducts = activeTab === 'seasonal' ? seasonalProducts : outOfSeasonProducts;
    const filteredProducts = displayProducts.filter(p => p?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const loading = seasonalLoading || outOfSeasonLoading;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Seasonal Items</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage items available only at certain times</p>
                </div>
                <button
                    onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] });
                        queryClient.invalidateQueries({ queryKey: ['products-seasonal-out-of-season'] });
                    }}
                    disabled={loading}
                    className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard label="Active Now" value={seasonalProducts.length} icon={Calendar} theme="green" desc="Visible to customers" loading={seasonalLoading} />
                <StatCard label="Off Season" value={outOfSeasonProducts.length} icon={AlertCircle} theme="orange" desc="Hidden from public" loading={outOfSeasonLoading} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-12 text-sm font-bold" />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button onClick={() => setActiveTab('seasonal')} className={`flex-1 px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'seasonal' ? 'text-green-600 bg-white border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>Active Seasonal ({seasonalProducts.length})</button>
                    <button onClick={() => setActiveTab('out-of-season')} className={`flex-1 px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'out-of-season' ? 'text-orange-600 bg-white border-b-2 border-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>Inactive ({outOfSeasonProducts.length})</button>
                </div>

                <div className="p-8">
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredProducts.map((product) => {
                                const categoryName = typeof product.category === 'object' && product.category !== null
                                    ? product.category.name
                                    : 'Uncategorized';

                                 return (
                                <div key={product._id} className="bg-white rounded-[2rem] border-2 border-gray-50 overflow-hidden shadow-sm">
                                    <div className="h-44 flex items-center justify-center relative bg-gray-50">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-16 h-16 text-gray-200" />
                                        )}
                                        {activeTab === 'out-of-season' && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="text-[10px] font-black uppercase text-white bg-orange-600 px-4 py-2 rounded-xl shadow-lg">Not in season</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase break-words text-sm">{product.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold break-words">{product.description}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">{categoryName}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-black text-gray-900">₹{product.price}</span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{product.isAvailable ? 'Live' : 'Hidden'}</span>
                                        </div>
                                        {product.availableMonths && (
                                            <div className="flex flex-wrap gap-1">
                                                {product.availableMonths.map((month) => (
                                                    <span key={month} className="text-[8px] font-black uppercase px-2 py-1 bg-gray-100 text-gray-400 rounded-md">{monthNames[month - 1]}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-4">
                                            <button onClick={() => navigate(`/${urlBrand}/products/${product._id}`)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-[#56763D] hover:text-white transition-all">View</button>
                                            <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Edit</button>
                                            <button onClick={() => deleteProduct(product._id)} className="px-4 py-3 bg-red-50 text-red-300 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 text-gray-200 font-black uppercase tracking-widest">
                            <Calendar className="w-20 h-20 mx-auto mb-4 opacity-20" />
                            <h3>No matching items</h3>
                        </div>
                    )}
                </div>
            </div>

            <ProductModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProduct(null); }} product={editingProduct} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] })} />
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50'
    };
    const style = themes[theme] || themes.green;
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
