import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import {
    TrendingUp,
    ShoppingCart,
    Users,
    Package,
    Bike,
    DollarSign,
    Clock,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
    const navigate = useNavigate();
    const { brand: urlBrand } = useParams();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    const { data: stats, isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['dashboard-stats', urlBrand],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard/stats');
            const data = response.data.data;
            // Cache data in localStorage for instant load on refresh
            localStorage.setItem(`dashboard-stats-cache-${urlBrand || 'all'}`, JSON.stringify(data));
            return data;
        },
        // Use cached data immediately on mount for instant load
        initialData: () => {
            const cached = localStorage.getItem(`dashboard-stats-cache-${urlBrand || 'all'}`);
            return cached ? JSON.parse(cached) : undefined;
        },
        // Keep previous data visible during refetches - no loading states!
        placeholderData: (previousData) => previousData,
        // Refetch in background without showing loading
        refetchOnWindowFocus: false,
        staleTime: 0, // Always consider data stale so socket updates trigger refetch
        // Smooth background updates
        refetchOnMount: true,
        refetchOnReconnect: true
    });

    const isSyncing = isFetching;

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => { queryClient.invalidateQueries({ queryKey: ['dashboard-stats', urlBrand] }); };
        socket.on('user:registered', handleUpdate);
        socket.on('user:deleted', handleUpdate);
        socket.on('product:created', handleUpdate);
        socket.on('product:deleted', handleUpdate);
        socket.on('order:new', handleUpdate);
        socket.on('order:status-updated', handleUpdate);
        socket.on('delivery:status-updated', handleUpdate);
        socket.on('product:updated', handleUpdate);
        return () => {
            socket.off('user:registered', handleUpdate);
            socket.off('user:deleted', handleUpdate);
            socket.off('product:created', handleUpdate);
            socket.off('product:deleted', handleUpdate);
            socket.off('order:new', handleUpdate);
            socket.off('order:status-updated', handleUpdate);
            socket.off('delivery:status-updated', handleUpdate);
            socket.off('product:updated', handleUpdate);
        };
    }, [socket, queryClient]);

    const statCards = [
        { title: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, theme: 'green', desc: `₹${stats?.todayRevenue || 0} today`, path: `/${urlBrand}/orders` },
        { title: 'Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, theme: 'blue', desc: `${stats?.todayOrders || 0} new today`, path: `/${urlBrand}/orders` },
        { title: 'Customers', value: stats?.totalCustomers || 0, icon: Users, theme: 'purple', desc: 'Registered accounts', path: `/${urlBrand}/customers` },
        { title: 'Products', value: stats?.totalProducts || 0, icon: Package, theme: 'orange', desc: 'Total items', path: `/${urlBrand}/products` },
        { title: 'Delivery Riders', value: `${stats?.activeRiders || 0}/${stats?.totalRiders || 0}`, icon: Bike, theme: 'teal', desc: 'Online / Total', path: `/${urlBrand}/riders` },
        { title: 'Awaiting Action', value: stats?.pendingOrders || 0, icon: Clock, theme: 'red', desc: 'Pending orders', path: `/${urlBrand}/orders?status=pending` }
    ];

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Dashboard</h1>
                    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-0.5">Overview of your business</p>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        disabled={isSyncing}
                        className="p-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} onClick={() => navigate(stat.path)} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col min-h-[450px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight">Recent Activity</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Latest incoming orders</p>
                        </div>
                        <button onClick={() => navigate(`/${urlBrand}/orders`)} className="p-3 bg-gray-50 rounded-2xl hover:bg-[#56763D] hover:text-white transition-all"><ArrowRight className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4 flex-1">
                        {stats?.recentOrders?.length > 0 ? (
                            stats.recentOrders.map((order) => (
                                <div key={order._id} onClick={() => navigate(`/${urlBrand}/orders`)} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl cursor-pointer border border-transparent group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <ShoppingCart className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div className="min-w-0 flex flex-col items-start text-left">
                                            <p className="font-black text-gray-900 uppercase text-sm">#{order.orderNumber}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{order.customerId?.name || 'Customer'} • ₹{order.total}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${order.brand === 'littleh' ? 'text-pink-600' : 'text-emerald-600'}`}>
                                                {order.brand === 'littleh' ? 'LITTLEH' : 'TEAS N TREES'}
                                            </p>
                                        </div>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 font-black uppercase tracking-widest opacity-20"><ShoppingCart className="w-16 h-16 mb-4" /> No recent orders</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Best Sellers</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Top performing products</p>
                        </div>
                        <button onClick={() => navigate(`/${urlBrand}/products`)} className="p-3 bg-gray-50 rounded-2xl hover:bg-[#56763D] hover:text-white transition-all"><TrendingUp className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4 flex-1">
                        {stats?.topProducts?.length > 0 ? (
                            stats.topProducts.map((product) => (
                                <div key={product._id} onClick={() => navigate(`/${urlBrand}/products`)} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl cursor-pointer border border-transparent group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Package className="w-6 h-6 text-orange-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 uppercase text-sm break-words">{product.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{product.orderCount || 0} Successful sales</p>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 font-black uppercase tracking-widest opacity-20"><Package className="w-16 h-16 mb-4" /> No product data</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, icon: Icon, theme, desc, onClick }) => {
    const themes = {
        blue: 'from-blue-600 to-indigo-700 shadow-blue-100 text-blue-600 bg-blue-50',
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        purple: 'from-purple-600 to-indigo-700 shadow-purple-100 text-purple-600 bg-purple-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50',
        teal: 'from-teal-500 to-cyan-600 shadow-teal-100 text-teal-600 bg-teal-50',
        red: 'from-rose-500 to-red-600 shadow-red-100 text-red-600 bg-red-50'
    };
    const style = themes[theme] || themes.blue;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');
    return (
        <div onClick={onClick} className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{title}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
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
