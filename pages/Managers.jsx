import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Clock, Search, Filter, ShieldCheck, UserCog, ArrowRight, RefreshCw, Eye } from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UserDetailsModal from '../components/UserDetailsModal';
import ExportButton from '../components/ExportButton';

const CardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-64"></div>
        ))}
    </div>
);

export default function Managers() {
    const { brand: urlBrand } = useParams();
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [managerToReject, setManagerToReject] = useState(null);
    const [filters, setFilters] = useState({ status: '' });
    const [selectedManager, setSelectedManager] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Fetch Managers
    const { data: managersData, isLoading: managersLoading, isFetching: managersFetching, refetch: managersRefetch } = useQuery({
        queryKey: ['managers', filters, searchTerm, urlBrand],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: 100 });
            if (filters.status === 'active') params.append('isActive', 'true');
            if (filters.status === 'inactive') params.append('isActive', 'false');
            if (filters.status === 'approved') params.append('isApproved', 'true');
            if (filters.status === 'unapproved') params.append('isApproved', 'false');

            const response = await api.get(`/admin/managers?${params.toString()}`);
            let managers = response.data.data?.managers || [];
            if (searchTerm) {
                managers = managers.filter(m =>
                    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.mobile?.includes(searchTerm)
                );
            }
            const cacheKey = `managers-cache-${filters.status}`;
            localStorage.setItem(cacheKey, JSON.stringify(managers));
            return managers;
        },
        initialData: () => {
            const cacheKey = `managers-cache-${filters.status}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0,
        enabled: activeTab === 'all'
    });

    // Fetch Pending Managers
    const { data: pendingManagers = [], isLoading: pendingLoading, isFetching: pendingFetching, refetch: pendingRefetch } = useQuery({
        queryKey: ['managers-pending', urlBrand],
        queryFn: async () => {
            const response = await api.get('/admin/managers/pending');
            const data = response.data.data || [];
            localStorage.setItem('managers-pending-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('managers-pending-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['managers-stats', urlBrand],
        queryFn: async () => {
            const response = await api.get('/admin/managers?limit=1000');
            const all = response.data.data?.managers || [];
            const data = {
                total: all.length,
                pending: all.filter(m => !m.isApproved).length,
                active: all.filter(m => m.isActive).length
            };
            localStorage.setItem('managers-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('managers-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['managers', urlBrand] });
            queryClient.invalidateQueries({ queryKey: ['managers-pending', urlBrand] });
            queryClient.invalidateQueries({ queryKey: ['managers-stats', urlBrand] });
        };
        socket.on('manager:status-updated', handleUpdate);
        socket.on('manager:registered', handleUpdate);
        socket.on('manager:deleted', handleUpdate);
        return () => {
            socket.off('manager:status-updated', handleUpdate);
            socket.off('manager:registered', handleUpdate);
            socket.off('manager:deleted', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleApprove = async (manager) => {
        if (!confirm(`Approve ${manager.name}?`)) return;
        try {
            await api.put(`/admin/managers/${manager._id}/approve`);
            queryClient.invalidateQueries({ queryKey: ['managers'] });
            queryClient.invalidateQueries({ queryKey: ['managers-pending'] });
            queryClient.invalidateQueries({ queryKey: ['managers-stats'] });
        } catch (error) { console.error(error); }
    };

    const handleReject = (manager) => { setManagerToReject(manager); setShowRejectModal(true); };

    const confirmReject = async () => {
        try {
            await api.put(`/admin/managers/${managerToReject._id}/reject`, { reason: rejectReason });
            setShowRejectModal(false); setRejectReason(''); setManagerToReject(null);
            queryClient.invalidateQueries({ queryKey: ['managers'] });
            queryClient.invalidateQueries({ queryKey: ['managers-pending'] });
            queryClient.invalidateQueries({ queryKey: ['managers-stats'] });
        } catch (error) { console.error(error); }
    };

    const handleToggleStatus = async (manager) => {
        try {
            await api.put(`/admin/managers/${manager._id}/status`, { isActive: !manager.isActive });
            queryClient.invalidateQueries({ queryKey: ['managers'] });
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (manager) => {
        if (!confirm(`Delete ${manager.name}?`)) return;
        try {
            await api.delete(`/admin/managers/${manager._id}`);
            queryClient.invalidateQueries({ queryKey: ['managers'] });
            queryClient.invalidateQueries({ queryKey: ['managers-pending'] });
            queryClient.invalidateQueries({ queryKey: ['managers-stats'] });
        } catch (error) { console.error(error); }
    };

    const loading = activeTab === 'all' ? managersLoading : pendingLoading;
    const displayData = activeTab === 'all' ? (managersData || []) : pendingManagers;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Managers</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage team leads and admins</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton
                        resource="managers"
                        filters={{
                            search: searchTerm
                        }}
                    />
                    <button
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['managers-stats'] });
                            managersRefetch();
                            pendingRefetch();
                        }}
                        disabled={managersFetching || pendingFetching}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${(managersFetching || pendingFetching) ? 'animate-spin text-blue-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <StatCard label="Total Managers" value={stats?.total || 0} icon={Users} theme="blue" desc="All accounts" loading={statsLoading} />
                <StatCard label="Pending Approval" value={stats?.pending || 0} icon={Clock} theme="orange" desc="New requests" loading={statsLoading} />
                <StatCard label="Active Now" value={stats?.active || 0} icon={ShieldCheck} theme="green" desc="Managers with access" loading={statsLoading} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button onClick={() => setActiveTab('all')} className={`flex-1 px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'all' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-400 hover:text-blue-500'}`}>All Access</button>
                    <button onClick={() => setActiveTab('pending')} className={`flex-1 px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'pending' ? 'text-orange-600 bg-white border-b-2 border-orange-600' : 'text-gray-400 hover:text-orange-500'}`}>Pending Req ({pendingManagers.length})</button>
                </div>
                {activeTab === 'all' && (
                    <div className="p-8 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input type="text" placeholder="Search by name, email..." className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="bg-gray-50 border-none rounded-2xl px-6 py-4 md:w-56 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="">Filter Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                                <option value="approved">Approved</option>
                                <option value="unapproved">Rejected</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="min-h-[400px]">
                {displayData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                        {displayData.map(manager => (
                            <div key={manager._id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center"><UserCog className="w-6 h-6" /></div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-gray-900 uppercase break-words text-sm">{manager.name}</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{manager.role}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${manager.isApproved === true ? 'bg-green-100 text-green-700' : manager.isApproved === false ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {manager.isApproved === true ? 'Approved' : manager.isApproved === false ? 'Rejected' : 'Pending'}
                                    </span>
                                </div>
                                <div className="space-y-3 mb-8">
                                    <p className="flex items-center gap-2 text-xs font-bold text-gray-400 capitalize underline decoration-gray-100 underline-offset-4 decoration-2">📞 {manager.mobile}</p>
                                    <p className="flex items-center gap-2 text-xs font-bold text-gray-400 lowercase italic">📧 {manager.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    {manager.isApproved === null ? (
                                        <>
                                            <button
                                                onClick={() => { setSelectedManager(manager); setShowDetailsModal(true); }}
                                                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleApprove(manager)} className="flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-green-700">Approve</button>
                                            <button onClick={() => handleReject(manager)} className="flex-1 bg-red-50 text-red-600 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-100">Reject</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => { setSelectedManager(manager); setShowDetailsModal(true); }}
                                                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {manager.isApproved === true && (
                                                <button onClick={() => handleToggleStatus(manager)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${manager.isActive ? 'hover:bg-[#56763D] hover:text-white border-gray-100' : 'bg-green-600 text-white hover:bg-green-700'}`}>{manager.isActive ? 'Deactivate' : 'Activate'}</button>
                                            )}
                                            <button onClick={() => handleDelete(manager)} className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase hover:bg-red-100">Del</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 font-black text-gray-200 uppercase tracking-widest">
                        <Users className="w-20 h-20 mx-auto mb-4 opacity-20" />
                        <h3 className="text-2xl">No managers found</h3>
                    </div>
                )}
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="font-black text-xl uppercase mb-2">Reject Manager</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6">Reason for rejection.</p>
                        <textarea className="input w-full h-32 mb-6 pt-4 resize-none" placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}></textarea>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 btn-secondary text-[10px] font-black uppercase py-4">Cancel</button>
                            <button onClick={confirmReject} className="flex-1 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-red-700">Reject</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            <UserDetailsModal
                isOpen={showDetailsModal}
                user={selectedManager}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedManager(null);
                }}
            />
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-blue-700 shadow-blue-100 text-blue-600 bg-blue-50',
        green: 'from-emerald-600 to-emerald-700 shadow-emerald-100 text-emerald-600 bg-emerald-50',
        orange: 'from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50'
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
