import { Bike, Star, Phone, MapPin, Trash2, Power, Eye, XCircle } from 'lucide-react';
import RiderStatusBadge from './RiderStatusBadge';

export default function RiderCard({ rider, onViewDetails, onApprove, onReject, onToggleStatus, onDelete, isPending }) {
    const getVehicleIcon = (type) => {
        return <Bike className="w-4 h-4" />;
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            {/* Header Area */}
            <div className="p-6 pb-0 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                        <Bike className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight text-xs leading-snug break-words">{rider.name}</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{rider.mobile}</p>
                        {rider.pinResetAt && (
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-0.5" title={`Reset by the rider from the app${rider.pinResetCount > 1 ? ` (${rider.pinResetCount} times)` : ''}`}>
                                PIN reset {new Date(rider.pinResetAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>
                {!isPending && (
                    <div className="flex flex-col gap-1.5 items-end">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${rider.isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                            {rider.isOnline ? 'Active' : 'Offline'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${rider.isActive ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            {rider.isActive ? 'Live' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4">
                {/* Info Block */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg">
                            <MapPin className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{rider.vehicleNumber || 'NO PLATE'}</span>
                    </div>
                    <span className="bg-gray-50 text-gray-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">{rider.vehicleType || 'BIKE'}</span>
                </div>

                {/* Stats Grid */}
                {!isPending && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Jobs Done</p>
                            <p className="text-lg font-black text-gray-900">{rider.totalDeliveries || 0}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Rating</p>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-lg font-black text-gray-900">{rider.averageRating?.toFixed(1) || '0.0'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {isPending && (
                    <div className="pt-4 border-t border-gray-100">
                        <span className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase px-3 py-1 rounded-xl">Review Pending</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {isPending ? (
                        <>
                            <button onClick={() => onViewDetails(rider)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Details</button>
                            <button onClick={() => onApprove(rider)} className="flex-1 bg-green-50 text-green-600 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all">Approve</button>
                            <button onClick={() => onReject(rider)} className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><XCircle className="w-4 h-4" /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onViewDetails(rider)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">View</button>
                            <button onClick={() => onToggleStatus(rider)} className="px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Power className="w-4 h-4" /></button>
                            <button onClick={() => onDelete(rider)} className="px-4 py-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
