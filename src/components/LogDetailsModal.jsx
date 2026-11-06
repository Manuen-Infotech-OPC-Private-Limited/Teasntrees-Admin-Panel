import React from 'react';
import { X, Info, Terminal, Globe, Monitor, Shield, Calendar, User } from 'lucide-react';

const LogDetailsModal = ({ log, isOpen, onClose }) => {
    if (!isOpen || !log) return null;

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return 'text-green-600 bg-green-100';
            case 'update': return 'text-blue-600 bg-blue-100';
            case 'delete': return 'text-red-600 bg-red-100';
            case 'login': return 'text-indigo-600 bg-indigo-100';
            case 'activate': return 'text-emerald-600 bg-emerald-100';
            case 'deactivate': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col relative z-10">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border border-gray-100 shadow-sm">
                            <Terminal className="w-7 h-7 text-gray-900" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Activity Log</h2>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Event ID: {log._id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 overflow-y-auto flex-1 space-y-10">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm space-y-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Account Info
                            </p>
                            <div>
                                <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{log.admin?.name || 'SYSTEM'}</p>
                                <p className="text-[10px] text-gray-400 font-black tracking-tight mt-1">{log.admin?.email}</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm space-y-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Date & Time
                            </p>
                            <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{formatDate(log.createdAt)}</p>
                        </div>
                    </div>

                    {/* Action & Resource */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">Action</label>
                            <div className={`p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border text-center ${getActionColor(log.action)}`}>
                                {log.action}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">Resource Type</label>
                            <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                <Shield className="w-4 h-4 text-gray-900" />
                                {log.resource}
                            </div>
                        </div>
                    </div>

                    {/* Details / Payload */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info className="w-4 h-4" /> Activity Details
                            </label>
                            <div className="px-3 py-1 bg-gray-900 text-white text-[8px] font-black uppercase rounded-md tracking-widest">DETAILS</div>
                        </div>
                        <div className="bg-gray-900 rounded-[2.5rem] p-8 overflow-x-auto max-h-80 shadow-2xl relative group">
                            <div className="absolute top-4 right-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">End</div>
                            <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed scrollbar-hide">
                                {(() => {
                                    const details = log.details || log.payload;
                                    if (!details || (typeof details === 'object' && Object.keys(details).length === 0)) {
                                        return '// No additional activity data recorded';
                                    }
                                    return JSON.stringify(details, null, 2);
                                })()}
                            </pre>
                        </div>
                    </div>

                    {/* Technical Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Globe className="w-3.5 h-3.5" /> IP Address
                            </p>
                            <p className="text-[11px] font-black text-gray-900 font-mono bg-gray-50 p-4 rounded-2xl border border-gray-100">{log.ipAddress || '127.0.0.1'}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Monitor className="w-3.5 h-3.5" /> Browser/Device
                            </p>
                            <p className="text-[11px] font-black text-gray-900 truncate bg-gray-50 p-4 rounded-2xl border border-gray-100" title={log.userAgent}>{log.userAgent || 'UNSET'}</p>
                        </div>
                    </div>

                    {/* Error Handling (If failed) */}
                    {!log.success && (
                        <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] space-y-2">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Error Details</p>
                            <p className="text-sm text-red-700 font-black uppercase italic">" {log.errorMessage || 'Unknown system failure'} "</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogDetailsModal;
