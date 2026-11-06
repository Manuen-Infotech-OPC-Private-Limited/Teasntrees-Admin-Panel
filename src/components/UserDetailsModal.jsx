import React, { useState, useEffect } from 'react';
import {
    X, User, Mail, Phone, Calendar,
    Shield, Bike, Briefcase, CheckCircle,
    XCircle, Clock, ShoppingBag, MapPin,
    TrendingUp, Heart, History
} from 'lucide-react';
import api from '../utils/api';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchDetails();
        }
    }, [isOpen, user]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/users/${user._id}`);
            if (response.data.success) {
                setDetails(response.data.data);
            }

            // Fetch activity if user is admin/manager
            if (user.role === 'admin' || user.role === 'manager') {
                fetchLogs();
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const response = await api.get(`/admin/activity-logs/admin/${user._id}`);
            if (response.data.success) {
                setActivityLogs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching admin logs:', error);
        } finally {
            setLogsLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const isActive = user.isActive !== false;

    const roleBadge = (role) => {
        switch (role) {
            case 'admin': return { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' };
            case 'rider': return { icon: Bike, color: 'text-orange-600', bg: 'bg-orange-100' };
            case 'manager': return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };
            default: return { icon: User, color: 'text-green-600', bg: 'bg-green-100' };
        }
    };

    const RoleIcon = roleBadge(user.role).icon;

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return 'text-green-600 bg-green-100';
            case 'update': return 'text-blue-600 bg-blue-100';
            case 'delete': return 'text-red-600 bg-red-100';
            default: return 'text-indigo-600 bg-indigo-100';
        }
    };

    const formatRelativeTime = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
                {/* Header */}
                <div className={`p-5 sm:p-6 flex items-center justify-between border-b border-gray-50 z-10 ${user.role === 'admin' ? 'bg-purple-50' :
                    user.role === 'rider' ? 'bg-orange-50' :
                        user.role === 'manager' ? 'bg-blue-50' :
                            'bg-emerald-50'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-xl uppercase border shadow-sm ${user.role === 'admin' ? 'bg-white text-purple-600 border-purple-100' :
                            user.role === 'rider' ? 'bg-white text-orange-600 border-orange-100' :
                                user.role === 'manager' ? 'bg-white text-blue-600 border-blue-100' :
                                    'bg-white text-emerald-600 border-emerald-100'
                            }`}>
                            {user.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <RoleIcon className={`w-3 h-3 ${user.role === 'admin' ? 'text-purple-600' :
                                    user.role === 'rider' ? 'text-orange-600' :
                                        user.role === 'manager' ? 'text-blue-600' :
                                            'text-emerald-600'
                                    }`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Account Role: {user.role}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-black/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 overflow-y-auto flex-1 space-y-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-50">
                            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">Loading Profile...</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Summary Stats / Status */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className={`p-6 rounded-[2rem] flex items-center gap-4 border ${isActive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                                    <div className={`p-3 rounded-xl shadow-sm bg-white ${isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">State</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-700' : 'text-red-700'}`}>{isActive ? 'ACTIVE' : 'INACTIVE'}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                                    <div className="p-3 bg-white text-gray-900 shadow-sm rounded-xl">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Created On</p>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-[2rem]">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Email Address</p>
                                            <p className="text-xs font-black text-gray-900">{user.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-[2rem]">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Phone Number</p>
                                            <p className="text-xs font-black text-gray-900">{user.mobile || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Specific Section (For Customer) */}
                            {user.role === 'customer' && details?.wishlist?.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-red-50 rounded-lg text-red-400">
                                            <Heart className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Wishlist Items ({details.wishlist.length})</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {details.wishlist.slice(0, 4).map(item => (
                                            <div key={item._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-[1.5rem] bg-white hover:border-emerald-600 transition-all group">
                                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all" />
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] font-black uppercase text-gray-900 truncate tracking-tight">{item.name}</p>
                                                    <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest mt-1 italic">₹{item.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Role Specific Section (For Riders) */}
                            {user.role === 'rider' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-400">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rider Performance</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Deliveries', value: details?.totalDeliveries || 0 },
                                            { label: 'Rating', value: (details?.averageRating || 0).toFixed(1) },
                                            { label: 'State', value: details?.isOnline ? 'ONLINE' : 'OFFLINE', color: details?.isOnline ? 'text-emerald-600' : 'text-gray-400' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] text-center shadow-sm">
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">{stat.label}</p>
                                                <p className={`font-black text-xl tracking-tight ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Staff Activity History */}
                            {(user.role === 'admin' || user.role === 'manager') && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-400">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">History (Recent)</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {logsLoading ? (
                                            <div className="flex items-center gap-4 animate-pulse p-6 bg-gray-50/50 rounded-[2rem]">
                                                <div className="w-10 h-10 bg-white rounded-xl"></div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="h-2 bg-white rounded w-1/2"></div>
                                                    <div className="h-1.5 bg-white rounded w-1/4"></div>
                                                </div>
                                            </div>
                                        ) : activityLogs.length === 0 ? (
                                            <div className="text-center py-10 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No Logs Found</p>
                                            </div>
                                        ) : (
                                            activityLogs.slice(0, 5).map((log) => (
                                                <div key={log._id} className="flex items-start gap-4 p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-emerald-600 transition-all group">
                                                    <div className={`p-3 rounded-xl shadow-sm bg-gray-50 ${getActionColor(log.action)}`}>
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">
                                                                {log.action}_{log.resource}
                                                            </span>
                                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                                                                {formatRelativeTime(log.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mt-1 truncate italic">
                                                            ID: {log.resourceId || 'SYSTEM'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
