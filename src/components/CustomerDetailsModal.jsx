import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, ShoppingBag, IndianRupee, Calendar, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import CustomerStatusBadge from './CustomerStatusBadge';
import OrderStatusBadge from './OrderStatusBadge';

const CustomerDetailsModal = ({ customer, onClose, onUpdate }) => {
    const [customerDetails, setCustomerDetails] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'orders'

    useEffect(() => {
        if (customer) {
            fetchCustomerDetails();
            fetchCustomerOrders();
        }
    }, [customer]);

    const fetchCustomerDetails = async () => {
        try {
            const response = await api.get(`/admin/customers/${customer._id}`);
            setCustomerDetails(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customer details:', error);
        }
    };

    const fetchCustomerOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/customers/${customer._id}/orders?limit=10`);
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch customer orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!customer || !customerDetails) {
        return null;
    }

    const stats = customerDetails.stats || {};

    return (
        <div className="fixed inset-0 bg-emerald-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col my-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-50 p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border border-gray-100 flex-shrink-0">
                            <User className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">{customerDetails.name || 'N/A'}</h2>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Customer Record</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex-shrink-0"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-50 px-6 bg-gray-50/30">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-3 py-4 text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'info'
                                ? 'text-gray-900'
                                : 'text-gray-400 hover:text-gray-900'
                                }`}
                        >
                            General Info
                            {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-3 py-4 text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'orders'
                                ? 'text-gray-900'
                                : 'text-gray-400 hover:text-gray-900'
                                }`}
                        >
                            Order History ({stats.orderCount || 0})
                            {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 space-y-8">
                    {activeTab === 'info' ? (
                        <div className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Orders', value: stats.orderCount || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                                    { label: 'Completed', value: stats.completedOrders || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                                    { label: 'Pending', value: stats.pendingOrders || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50/50' },
                                    { label: 'Net Value', value: formatCurrency(stats.totalSpent || 0), icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50/50' }
                                ].map((stat, i) => (
                                    <div key={i} className={`${stat.bg} rounded-[2rem] p-6 border border-white`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 bg-white rounded-xl ${stat.color} shadow-sm`}>
                                                <stat.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Profile</h3>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                                                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{customerDetails.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                                <CustomerStatusBadge isActive={customerDetails.isActive} />
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Number</p>
                                                <p className="font-black text-gray-900 text-sm tracking-tight flex items-center gap-2">
                                                    {customerDetails.mobile || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                                <p className="font-black text-gray-900 text-sm tracking-tight lowercase">{customerDetails.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Joined Date</p>
                                                <p className="font-black text-gray-900 text-[10px]">{formatDate(customerDetails.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Updated</p>
                                                <p className="font-black text-gray-900 text-[10px]">{formatDate(customerDetails.updatedAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Addresses */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Saved Addresses ({customerDetails.addresses?.length || 0})</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {customerDetails.addresses?.map((address, index) => (
                                            <div key={index} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:border-emerald-600 transition-colors group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{address.label || 'SITE'}</p>
                                                    {address.isDefault && (
                                                        <span className="px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md bg-emerald-600 text-white">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-black text-gray-900 leading-relaxed uppercase tracking-tight">
                                                    {address.street}, {address.area}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                                                    {address.city}, {address.state} - {address.pincode}
                                                </p>
                                                {address.landmark && (
                                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Landmark:</p>
                                                        <p className="text-xs font-black text-gray-700 uppercase">{address.landmark}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">Loading Order History...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-50">
                                    <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Orders Found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {orders.map((order) => (
                                        <div key={order._id} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:border-emerald-600 transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <p className="text-lg font-black text-gray-900 uppercase tracking-tight">#{order.orderNumber}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{formatDate(order.createdAt)}</p>
                                                </div>
                                                <OrderStatusBadge status={order.status} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-8">
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Items</p>
                                                    <p className="font-black text-gray-900">{order.items?.length || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                                    <p className="font-black text-gray-900">{formatCurrency(order.total)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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

export default CustomerDetailsModal;
