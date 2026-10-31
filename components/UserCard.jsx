import React from 'react';
import {
    Mail, Phone, Shield, User, Bike, Briefcase,
    MoreVertical, Trash2, Eye, CheckCircle, XCircle
} from 'lucide-react';

const UserCard = ({ user, onToggleStatus, onDelete, onViewDetails }) => {
    // Helper for role badge config
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return { icon: Shield, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' };
            case 'manager': return { icon: Briefcase, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manager' };
            case 'rider': return { icon: Bike, bg: 'bg-orange-100', text: 'text-orange-700', label: 'Rider' };
            default: return { icon: User, bg: 'bg-green-100', text: 'text-green-700', label: 'Customer' };
        }
    };

    const roleStyle = getRoleBadge(user.role);
    const RoleIcon = roleStyle.icon;
    const isActive = user.isActive !== false;

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border-2 border-gray-50 overflow-hidden flex flex-col">
            {/* Header Area */}
            <div className="p-6 pb-0 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                        <RoleIcon className={`w-6 h-6 sm:w-7 sm:h-7 ${user.role === 'admin' ? 'text-purple-600' : user.role === 'manager' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight text-xs leading-snug break-words">{user.name}</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{roleStyle.label}</p>
                    </div>
                </div>
                <button
                    onClick={() => onToggleStatus(user)}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition-all shrink-0 ${isActive ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                >
                    {isActive ? 'Active' : 'Inactive'}
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-gray-50 rounded-lg shrink-0">
                            <Mail className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-[9px] font-black text-gray-500 lowercase tracking-widest break-all min-w-0 flex-1">{user.email || 'NO EMAIL'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-gray-50 rounded-lg shrink-0">
                            <Phone className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{user.mobile || 'NO PHONE'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => onViewDetails(user)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">View Profile</button>
                    <button onClick={() => onDelete(user._id)} className="px-4 py-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;
