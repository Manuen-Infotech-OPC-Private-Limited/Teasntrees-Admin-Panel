import React, { useState, useEffect } from 'react';
import {
    History, Search, Filter, Calendar,
    ArrowRight, Eye, Shield, User,
    FileText, Download, RefreshCw,
    Terminal, MoreHorizontal
} from 'lucide-react';
import api from '../utils/api';
import LogDetailsModal from '../components/LogDetailsModal';
import { useSocket } from '../context/SocketContext';

const ActivityLogs = () => {
    const [logs, setLogs] = useState(() => {
        const cached = localStorage.getItem('activity_logs_cache_default');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('activity_logs_stats_cache');
        return cached ? JSON.parse(cached) : null;
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Filter Stats
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    const { socket, isConnected } = useSocket();
    const [debugInfo, setDebugInfo] = useState({
        lastEvent: null,
        lastEventTime: null,
        socketId: null
    });

    useEffect(() => {
        if (socket && isConnected) {
            setDebugInfo(prev => ({ ...prev, socketId: socket.id }));

            const handleNewLog = (newLog) => {
                setDebugInfo(prev => ({
                    ...prev,
                    lastEvent: newLog,
                    lastEventTime: new Date().toLocaleTimeString()
                }));

                // OPTIMISTIC UPDATE: Prepend new log immediately
                setLogs(prevLogs => {
                    // Only prepend if we are on page 1 and not filtering deeply
                    // (Simplification: Just prepend, user can refresh if order looks off,
                    // but usually new logs belong at top)
                    if (page === 1) {
                        // Keep list size reasonable, e.g., 20 items
                        const updated = [newLog, ...prevLogs].slice(0, 20);
                        // Cache default view if no filters are applied
                        if (!filters.action && !filters.resource && !filters.search && !filters.startDate && !filters.endDate) {
                            localStorage.setItem('activity_logs_cache_default', JSON.stringify(updated));
                        }
                        return updated;
                    }
                    return prevLogs;
                });

                // Update stats locally
                setStats(prevStats => {
                    if (!prevStats) return prevStats;
                    const updatedStats = {
                        ...prevStats,
                        totalLogs: prevStats.totalLogs + 1,
                        todayLogs: prevStats.todayLogs + 1
                    };
                    localStorage.setItem('activity_logs_stats_cache', JSON.stringify(updatedStats));
                    return updatedStats;
                });
            };

            socket.on('activity-log:new', handleNewLog);

            return () => {
                socket.off('activity-log:new', handleNewLog);
            };
        }
    }, [socket, isConnected, page, filters]);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [page, filters.action, filters.resource, filters.startDate, filters.endDate, filters.search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                ...filters
            };
            const response = await api.get('/admin/activity-logs', { params });
            if (response.data.success) {
                const newLogs = response.data.data;
                setLogs(newLogs);
                setTotalPages(response.data.pagination.totalPages);
                // Cache default view if no filters are applied and on the first page
                if (page === 1 && !filters.action && !filters.resource && !filters.search && !filters.startDate && !filters.endDate) {
                    localStorage.setItem('activity_logs_cache_default', JSON.stringify(newLogs));
                }
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/activity-logs/stats');
            if (response.data.success) {
                setStats(response.data.data);
                localStorage.setItem('activity_logs_stats_cache', JSON.stringify(response.data.data));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const getActionBadge = (action) => {
        const styles = {
            create: 'bg-green-50 text-green-700 border-green-100',
            update: 'bg-blue-50 text-blue-700 border-blue-100',
            delete: 'bg-red-50 text-red-700 border-red-100',
            login: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            activate: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            deactivate: 'bg-orange-50 text-orange-700 border-orange-100'
        };
        return styles[action] || 'bg-gray-50 text-gray-700 border-gray-100';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleExport = async () => {
        try {
            const params = { ...filters };
            const response = await api.get('/admin/activity-logs/export', { params });
            if (response.data.success) {
                const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export logs');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">System Logs</h1>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isConnected ? 'Live Stream' : 'Offline'}</span>
                        </div>
                    </div>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Record of all administrative actions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchLogs(); fetchStats(); }}
                        disabled={loading}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:-translate-y-1"
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <StatCard
                    label="Total Logs"
                    value={stats?.totalLogs || 0}
                    icon={Terminal}
                    theme="purple"
                    desc="Since inception"
                    loading={loading && !stats}
                />
                <StatCard
                    label="Logs Today"
                    value={stats?.todayLogs || 0}
                    icon={Calendar}
                    theme="green"
                    desc="Last 24 hours"
                    loading={loading && !stats}
                />
                <StatCard
                    label="Top Admin"
                    value={stats?.topAdmins?.[0]?.admin?.name || '---'}
                    icon={User}
                    theme="blue"
                    desc="Most active"
                    loading={loading && !stats}
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <select
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white focus:border-indigo-400 transition-all text-gray-600"
                        >
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="activate">Activate</option>
                            <option value="deactivate">Deactivate</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <select
                            name="resource"
                            value={filters.resource}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white focus:border-indigo-400 transition-all text-gray-600"
                        >
                            <option value="">All Resources</option>
                            <option value="user">User</option>
                            <option value="product">Product</option>
                            <option value="category">Category</option>
                            <option value="order">Order</option>
                            <option value="delivery">Delivery</option>
                            <option value="settings">Settings</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all text-gray-600"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                <th className="px-8 py-6">Admin</th>
                                <th className="px-8 py-6">Activity</th>
                                <th className="px-8 py-6">Time</th>
                                <th className="px-8 py-6 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && logs.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-6"><div className="h-10 w-10 bg-gray-50 rounded-full"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 w-32 bg-gray-50 rounded"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 w-24 bg-gray-50 rounded"></div></td>
                                        <td className="px-8 py-6"><div className="h-8 w-16 bg-gray-50 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-500 font-black text-xs shadow-sm shrink-0 uppercase border border-gray-200">
                                                {log.admin?.name?.charAt(0) || 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-gray-900 text-xs uppercase tracking-tight truncate">{log.admin?.name || 'Administrator'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.admin?.role || 'Staff'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getActionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-gray-300"><ArrowRight className="w-3 h-3" /></span>
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Shield className="w-3 h-3 text-gray-400" />
                                                    {log.resource}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                                {log.action === 'login' ? 'System Authentication' : `Modified ${log.resource} Entry`}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => { setSelectedLog(log); setShowModal(true); }}
                                            className="p-3 bg-white border border-gray-100 hover:bg-[#56763D] hover:text-white rounded-2xl text-gray-400 transition-all shadow-sm hover:shadow-lg group-hover:scale-105"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && logs.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                            <History className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No logs found</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Try changing your search filters</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-50 flex justify-center bg-gray-50/10">
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all shadow-sm ${page === p
                                        ? 'bg-[#56763D] text-white shadow-lg scale-110'
                                        : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 border border-gray-100'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <LogDetailsModal
                isOpen={showModal}
                log={selectedLog}
                onClose={() => { setShowModal(false); setSelectedLog(null); }}
            />
        </div>
    );
};

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

export default ActivityLogs;
