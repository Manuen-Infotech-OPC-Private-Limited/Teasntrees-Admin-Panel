import React from 'react';
import { X, ShoppingBag, User, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

const CartDetailsModal = ({ cart, onClose }) => {
    if (!cart) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] relative z-10">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border border-gray-100 shadow-sm">
                            <ShoppingBag className="w-7 h-7 text-gray-900" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Cart Details</h2>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Abandoned for {cart.daysAbandoned} Days</p>
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-50 relative overflow-hidden group">
                        <div className="space-y-3">
                            <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                CUSTOMER
                            </h3>
                            <div>
                                <p className="text-base font-black text-gray-900 uppercase tracking-tight">{cart.userName}</p>
                                <div className="flex items-center gap-2 text-gray-500 font-black mt-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span className="text-[9px] uppercase tracking-widest">{cart.userMobile}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end space-y-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl w-fit shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-gray-900" />
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">LAST ACTIVE: {new Date(cart.lastUpdated).toLocaleDateString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl w-fit shadow-sm">
                                <ShieldCheck className="w-3.5 h-3.5 text-gray-900" />
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">VERIFIED USER</span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cart Items ({cart.itemCount})</h3>
                            <span className="text-[10px] font-black px-4 py-1.5 bg-gray-900 text-white rounded-lg uppercase tracking-widest shadow-lg shadow-gray-200">TOTAL: ₹{cart.subtotal}</span>
                        </div>

                        <div className="space-y-4">
                            {cart.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-emerald-600 transition-all group shadow-sm">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-300 group-hover:bg-emerald-600 group-hover:text-white transition-all text-xs">
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">{item.name}</h4>
                                        <p className="text-[8px] text-gray-400 font-black mt-1 uppercase tracking-widest">Quantity: <span className="text-gray-900">{item.quantity}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 text-lg tracking-tight">₹{item.price * item.quantity}</p>
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest italic">₹{item.price} / UNIT</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex gap-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-5 border-2 border-gray-100 bg-white rounded-2xl text-[10px] font-black text-gray-400 hover:text-gray-900 hover:border-emerald-600 transition-all uppercase tracking-widest"
                    >
                        Close
                    </button>
                    <a
                        href={`https://wa.me/${cart.userMobile}?text=Hi ${cart.userName}, we noticed you left some items in your cart at TeasNTrees. Would you like to complete your order?`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-[2] px-8 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 hover:bg-emerald-700"
                    >
                        Send WhatsApp Reminder
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CartDetailsModal;
