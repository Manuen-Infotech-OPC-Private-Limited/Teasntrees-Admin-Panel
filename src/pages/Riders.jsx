import { useState, useEffect } from 'react';
import { Bike, Users, Clock, TrendingUp, Search, Filter, ArrowRight, User, RefreshCw } from 'lucide-react';
import RiderCard from '../components/RiderCard';
import RiderDetailsModal from '../components/RiderDetailsModal';
import ExportButton from '../components/ExportButton';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-64"></div>
        ))}
    </div>
);

export default function Riders() {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRider, setSelectedRider] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [riderToReject, setRiderToReject] = useState(null);
    const [filters, setFilters] = useState({ status: '' });

    // Fetch All Riders
    const { data: ridersData, isLoading: ridersLoading, isFetching: ridersFetching, refetch: ridersRefetch } = useQuery({
        queryKey: ['riders', filters, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({ isApproved: 'true', limit: 100 });
            if (filters.status === 'active') params.append('isActive', 'true');
            if (filters.status === 'inactive') params.append('isActive', 'false');
            const response = await api.get(`/admin/riders?${params.toString()}`);
            let riders = response.data.data?.riders || [];
            if (filters.status === 'online') riders = riders.filter(r => r.isOnline);
            if (filters.status === 'onDelivery') riders = riders.filter(r => r.isOnDelivery);
            if (searchTerm) {
                riders = riders.filter(r =>
                    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.mobile?.includes(searchTerm) ||
                    r.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            const cacheKey = `riders-cache-${filters.status}`;
            localStorage.setItem(cacheKey, JSON.stringify(riders));
            return riders;
        },
        initialData: () => {
            const cacheKey = `riders-cache-${filters.status}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0,
        enabled: activeTab === 'all'
    });

    // Fetch Pending Riders
    const { data: pendingRiders = [], isLoading: pendingLoading, isFetching: pendingFetching, refetch: pendingRefetch } = useQuery({
        queryKey: ['riders-pending'],
        queryFn: async () => {
            const response = await api.get('/admin/riders/pending');
            const data = response.data.data || [];
            localStorage.setItem('riders-pending-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('riders-pending-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['riders-stats'],
        queryFn: async () => {
            const allResponse = await api.get('/admin/riders?limit=1000');
            const allRiders = allResponse.data.data?.riders || [];
            const data = {
                totalRiders: allRiders.length,
                activeRiders: allRiders.filter(r => r.isOnline).length,
                pendingApprovals: allRiders.filter(r => !r.isApproved).length,
                totalDeliveries: allRiders.reduce((sum, r) => sum + (r.totalDeliveries || 0), 0)
            };
            localStorage.setItem('riders-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('riders-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['riders'] });
            queryClient.invalidateQueries({ queryKey: ['riders-pending'] });
            queryClient.invalidateQueries({ queryKey: ['riders-stats'] });
        };
        socket.on('rider:status-updated', handleUpdate);
        socket.on('rider:new', handleUpdate);
        return () => {
            socket.off('rider:status-updated', handleUpdate);
            socket.off('rider:new', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleApprove = async (rider) => {
        if (!confirm(`Approve ${rider.name} as a rider?`)) return;
        try {
            await api.put(`/admin/riders/${rider._id}/approve`);
            queryClient.invalidateQueries({ queryKey: ['riders'] });
            queryClient.invalidateQueries({ queryKey: ['riders-pending'] });
            queryClient.invalidateQueries({ queryKey: ['riders-stats'] });
        } catch (error) { console.error('Failed to approve rider:', error); }
    };

    const handleReject = (rider) => { setRiderToReject(rider); setShowRejectModal(true); };

    const confirmReject = async () => {
        if (!rejectReason.trim()) return;
        try {
            await api.put(`/admin/riders/${riderToReject._id}/reject`, { reason: rejectReason });
            setShowRejectModal(false); setRejectReason(''); setRiderToReject(null);
            queryClient.invalidateQueries({ queryKey: ['riders-pending'] });
            queryClient.invalidateQueries({ queryKey: ['riders-stats'] });
        } catch (error) { console.error('Failed to reject rider:', error); }
    };

    const handleToggleStatus = async (rider) => {
        const action = rider.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${rider.name}?`)) return;
        try {
            await api.put(`/admin/riders/${rider._id}/status`, { isActive: !rider.isActive });
            queryClient.invalidateQueries({ queryKey: ['riders'] });
        } catch (error) { console.error('Failed to toggle status:', error); }
    };

    const handleDelete = async (rider) => {
        if (!confirm(`Are you sure you want to delete ${rider.name}?`)) return;
        try {
            await api.delete(`/admin/riders/${rider._id}`);
            queryClient.invalidateQueries({ queryKey: ['riders'] });
            queryClient.invalidateQueries({ queryKey: ['riders-stats'] });
        } catch (error) { console.error('Failed to delete rider:', error); }
    };

    const handleViewDetails = (rider) => { setSelectedRider(rider); setShowDetailsModal(true); };

    const clearFilters = () => { setFilters({ status: '' }); setSearchTerm(''); };

    const loading = activeTab === 'all' ? ridersLoading : pendingLoading;
    const displayRiders = activeTab === 'all' ? (ridersData || []) : pendingRiders;

    return (
        <div className="space-y-6 text-gray-900">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Riders</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage riders and applications</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton
                        resource="riders"
                        filters={{
                            status: filters.status
                        }}
                    />
                    <button
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['riders-stats'] });
                            ridersRefetch();
                            pendingRefetch();
                        }}
                        disabled={ridersFetching || pendingFetching}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${(ridersFetching || pendingFetching) ? 'animate-spin text-teal-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Total Riders" value={statsData?.totalRiders || 0} icon={Users} theme="teal" desc="All riders" loading={statsLoading} />
                <StatCard label="Online Now" value={statsData?.activeRiders || 0} icon={Bike} theme="emerald" desc="Currently online" loading={statsLoading} />
                <StatCard label="New Applications" value={statsData?.pendingApprovals || 0} icon={Clock} theme="orange" desc="Need approval" loading={statsLoading} />
                <StatCard label="Total Deliveries" value={statsData?.totalDeliveries || 0} icon={TrendingUp} theme="purple" desc="Jobs completed" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/30">
                    <button onClick={() => setActiveTab('all')} className={`flex-1 px-8 py-6 font-black uppercase text-[10px] tracking-[0.2em] transition-all ${activeTab === 'all' ? 'text-teal-600 bg-white border-b-2 border-teal-600' : 'text-gray-400 hover:text-teal-500'}`}>All Riders ({ridersData?.length || 0})</button>
                    <button onClick={() => setActiveTab('pending')} className={`flex-1 px-8 py-6 font-black uppercase text-[10px] tracking-[0.2em] transition-all relative ${activeTab === 'pending' ? 'text-orange-600 bg-white border-b-2 border-orange-600' : 'text-gray-400 hover:text-orange-500'}`}>Approvals {pendingRiders.length > 0 && <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px]">{pendingRiders.length}</span>}</button>
                </div>

                {activeTab === 'all' && (
                    <div className="p-8 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input type="text" placeholder="Search by name, mobile or vehicle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-teal-500/20" />
                            </div>
                            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="bg-gray-50 border-none rounded-2xl px-6 py-4 md:w-56 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-teal-500/20">
                                <option value="">Rider Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="online">Online</option>
                                <option value="onDelivery">On Job</option>
                            </select>
                            {(filters.status || searchTerm) && <button onClick={clearFilters} className="text-[10px] font-black uppercase text-teal-600 hover:text-teal-700 transition-colors">Clear</button>}
                        </div>
                    </div>
                )}
            </div>

            <div className="min-h-[400px]">
                {displayRiders.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayRiders.map((rider) => (
                            <RiderCard
                                key={rider._id}
                                rider={rider}
                                isPending={activeTab === 'pending'}
                                onViewDetails={handleViewDetails}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onToggleStatus={handleToggleStatus}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 font-black text-gray-200 uppercase tracking-widest">
                        <Bike className="w-20 h-20 mx-auto mb-4 opacity-20" />
                        <h3 className="text-2xl">{activeTab === 'pending' ? 'Clear Deck' : 'No riders found'}</h3>
                    </div>
                )}
            </div>

            <RiderDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} rider={selectedRider} onApprove={handleApprove} onReject={handleReject} onToggleStatus={handleToggleStatus} />

            {showRejectModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-black uppercase mb-2">Reject Application</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6">Provide a reason for the rider force rejection.</p>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Documentation missing, vehicle inspection failed..." className="input mb-6 h-32 resize-none pt-4" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 btn-secondary text-xs font-black uppercase py-4">Cancel</button>
                            <button onClick={confirmReject} className="flex-1 bg-red-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-red-700 transition-all font-black">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        teal: 'from-teal-600 to-teal-700 shadow-teal-100 text-teal-600 bg-teal-50',
        emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        orange: 'from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50',
        purple: 'from-purple-600 to-purple-700 shadow-purple-100 text-purple-600 bg-purple-50'
    };
    const style = themes[theme] || themes.teal;
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
