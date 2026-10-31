import React from 'react';
import { User, Phone, Mail, Power, Trash2 } from 'lucide-react';

const CustomerCard = ({ customer, onViewDetails, onToggleStatus, onDelete }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-6">
            {/* Header Area */}
            <div className="flex items-start justify-between mb-6 gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight text-xs leading-snug break-words">{customer.name || 'Anonymous'}</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Joined {formatDate(customer.createdAt)}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${customer.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-gray-50 rounded-lg shrink-0">
                        <Phone className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{customer.mobile || 'NO PHONE'}</span>
                </div>
                {customer.email && (
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-gray-50 rounded-lg shrink-0">
                            <Mail className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-[9px] font-black text-gray-500 lowercase tracking-widest break-all min-w-0 flex-1">{customer.email}</span>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pb-5 border-b border-gray-100">
                <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Orders</p>
                    <p className="text-lg font-black text-gray-900">{customer.orderCount || 0}</p>
                </div>
                <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Spent</p>
                    <p className="text-lg font-black text-gray-900 leading-none">₹{Math.round(customer.totalSpent || 0)}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-6">
                <button onClick={() => onViewDetails(customer)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Details</button>
                <button
                    onClick={() => onToggleStatus(customer)}
                    className={`px-4 py-3 rounded-2xl transition-all ${customer.isActive ? 'bg-gray-50 text-gray-400 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                >
                    <Power className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(customer)} className="px-4 py-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CustomerCard;
