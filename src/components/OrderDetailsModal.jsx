import { useState, useEffect } from 'react';
import { X, User, MapPin, Package, DollarSign, Bike, Calendar, Phone, Mail } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import api from '../utils/api';

export default function OrderDetailsModal({ isOpen, onClose, order, onSuccess }) {
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [newPaymentStatus, setNewPaymentStatus] = useState('');
    const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
    const [showRiderAssignment, setShowRiderAssignment] = useState(false);
    const [riders, setRiders] = useState([]);
    const [selectedRider, setSelectedRider] = useState('');

    useEffect(() => {
        if (showRiderAssignment) {
            fetchRiders();
        }
    }, [showRiderAssignment]);

    const fetchRiders = async () => {
        try {
            const response = await api.get('/admin/riders?isApproved=true&isActive=true');
            // Response structure: { success: true, data: { riders: [...], pagination: {...} } }
            let ridersData = response.data.data?.riders || response.data.riders || [];

            // Filter to only show online riders
            ridersData = ridersData.filter(rider => rider.isOnline === true);

            setRiders(Array.isArray(ridersData) ? ridersData : []);
        } catch (error) {
            console.error('Failed to fetch riders:', error);
            setRiders([]);
        }
    };

    if (!isOpen || !order) return null;

    const statusOptions = [
        /*'pending'*/, 'confirmed', /*'accepted'*/, 'preparing', 'ready', /*'assigned'*/,
        /*'picked_up', 'out-for-delivery', 'in_transit', 'delivered'*/, 'cancelled'
    ];

    const handleUpdateStatus = async () => {
        if (!newStatus) return;

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/status`, { status: newStatus });
            onSuccess();
            setShowStatusUpdate(false);
            setNewStatus('');
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a cancellation reason');
            return;
        }

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/cancel`, { cancelReason });
            onSuccess();
            setShowCancelModal(false);
            setCancelReason('');
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePaymentStatus = async () => {
        if (!newPaymentStatus) return;

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/payment-status`, { paymentStatus: newPaymentStatus });
            onSuccess();
            setShowPaymentUpdate(false);
            setNewPaymentStatus('');
        } catch (error) {
            console.error('Failed to update payment status:', error);
            alert(error.response?.data?.message || 'Failed to update payment status');
        } finally {
            setUpdating(false);
        }
    };

    const handleManualAssignment = async () => {
        if (!selectedRider) {
            alert('Please select a rider');
            return;
        }

        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/assign-rider`, { riderId: selectedRider });
            onSuccess();
            setShowRiderAssignment(false);
            setSelectedRider('');
        } catch (error) {
            console.error('Failed to assign rider:', error);
            alert(error.response?.data?.message || 'Failed to assign rider');
        } finally {
            setUpdating(false);
        }
    };

    const handleAutoAssignment = async () => {
        setUpdating(true);
        try {
            await api.put(`/admin/orders/${order._id}/assign-rider`, { auto: true });
            onSuccess();
            setShowRiderAssignment(false);
        } catch (error) {
            console.error('Failed to auto-assign rider:', error);
            alert(error.response?.data?.message || 'Failed to auto-assign rider');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-100 my-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 p-4 sm:p-5 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">Order Details</h2>
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Order #{order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                    {/* Status and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-gray-50/50 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status:</span>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex gap-3">
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <>
                                    <button
                                        onClick={() => setShowStatusUpdate(true)}
                                        className="px-6 py-3 bg-white border border-gray-100 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        Update Status
                                    </button>
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        Cancel Order
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Customer Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <User className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Info</h3>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-4 shadow-sm hover:border-emerald-100 transition-colors">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                                        <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{order.customerId?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                        <p className="font-black text-gray-900 text-sm tracking-tight">{order.customerId?.mobile || 'N/A'}</p>
                                    </div>
                                    {order.customerId?.email && (
                                        <div className="col-span-2">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                                            <p className="font-black text-gray-900 text-sm tracking-tight lowercase">{order.customerId.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Delivery Address</h3>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-4 shadow-sm hover:border-emerald-100 transition-colors">
                                <p className="font-black text-gray-900 text-sm tracking-tight leading-relaxed">{order.deliveryAddress?.address || 'N/A'}</p>
                                <div className="text-[8px] font-black text-gray-400 tracking-widest mt-2 uppercase">
                                    GPS: {order.deliveryAddress?.location?.coordinates?.join(', ') || 'Not Available'}
                                </div>
                                {order.specialInstructions && (
                                    <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                                        <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-1">Special Instructions:</p>
                                        <p className="text-sm font-black text-orange-800 leading-snug">{order.specialInstructions}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Package className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Order Items</h3>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:border-emerald-100 transition-colors">
                            <div className="divide-y divide-gray-50">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-6 p-6 hover:bg-emerald-50/10 transition-colors group">
                                        {item.product?.image && (
                                            <img
                                                src={item.product.image}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-2xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{item.name}</p>
                                            {item.customization && (
                                                <p className="text-[10px] font-bold text-gray-400 mt-1">{item.customization}</p>
                                            )}
                                            {item.customizationDetails && (
                                                <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                                                    {item.customizationDetails.cakeMessage && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Message on Cake</span>
                                                            <p className="text-[11px] font-black text-gray-800 italic">"{item.customizationDetails.cakeMessage}"</p>
                                                        </div>
                                                    )}
                                                    {item.customizationDetails.colorTheme && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest">Color Theme</span>
                                                            <p className="text-[10px] font-black text-gray-700 uppercase">{item.customizationDetails.colorTheme}</p>
                                                        </div>
                                                    )}
                                                    {item.customizationDetails.designDescription && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-purple-600 uppercase tracking-widest">Design Notes</span>
                                                            <p className="text-[10px] font-bold text-gray-500 leading-tight italic">{item.customizationDetails.designDescription}</p>
                                                        </div>
                                                    )}
                                                    {item.selectedVariants?.length > 0 && (
                                                        <div className="flex flex-col pt-2 border-t border-gray-100/50">
                                                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-1">Add-ons</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.selectedVariants.map((v, idx) => (
                                                                    <span key={idx} className="text-[9px] font-black text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                                                                        {v.name} (+₹{v.price})
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-2 inline-flex items-center px-2 py-1 bg-gray-50 rounded-md text-[8px] font-black uppercase tracking-widest text-gray-400">
                                                Qty: {item.quantity}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Price</p>
                                            <p className="text-lg font-black text-gray-900">₹{item.price * item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Financials */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Details</h3>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-4 shadow-sm hover:border-emerald-100 transition-colors">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                                        <span className="font-black text-gray-900">₹{order.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Fee</span>
                                        <span className="font-black text-gray-900">₹{order.deliveryCharge || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax</span>
                                        <span className="font-black text-gray-900">₹{order.tax || 0}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Discount</span>
                                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Coupon: {order.couponCode}</span>
                                            </div>
                                            <span className="font-black text-emerald-600">-₹{order.discount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Total Amount</span>
                                        <span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{order.total}</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Method</span>
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{order.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Status</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'text-emerald-600' : order.paymentStatus === 'refunded' ? 'text-red-600' : 'text-orange-600'}`}>
                                                {order.paymentStatus}
                                            </span>
                                            {order.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => setShowPaymentUpdate(true)}
                                                    className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                                                >
                                                    Update
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fleet/Rider Check */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Bike className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Delivery Rider</h3>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-6 shadow-sm hover:border-emerald-100 transition-colors">
                                {order.riderId ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Name</p>
                                                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{order.riderId?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Phone</p>
                                                <p className="font-black text-gray-900 text-sm tracking-tight">{order.riderId?.mobile || 'N/A'}</p>
                                            </div>
                                            {order.riderEarning && (
                                                <div className="col-span-2">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Earning</p>
                                                    <p className="text-xl font-black text-emerald-900 tracking-tight">₹{order.riderEarning}</p>
                                                </div>
                                            )}
                                        </div>
                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                            <button
                                                onClick={() => setShowRiderAssignment(true)}
                                                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                                            >
                                                Change Rider
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No Rider Assigned</p>
                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                            <button
                                                onClick={() => setShowRiderAssignment(true)}
                                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                                            >
                                                Assign Rider
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Order Timeline</h3>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:border-emerald-100 transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Created At</p>
                                    <p className="font-black text-gray-900 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                {order.confirmedAt && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Confirmed At</p>
                                        <p className="font-black text-gray-900 text-xs">{new Date(order.confirmedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {order.outForDeliveryAt && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Out for Delivery</p>
                                        <p className="font-black text-gray-900 text-xs">{new Date(order.outForDeliveryAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {order.deliveredAt && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivered At</p>
                                        <p className="font-black text-gray-900 text-xs">{new Date(order.deliveredAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                {showStatusUpdate && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Update Order Status</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Change the order status</p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 mb-6 focus:bg-white"
                            >
                                <option value="">Select New Status</option>
                                {statusOptions
                                    .filter(status => ['confirmed', 'preparing', 'ready', 'cancelled'].includes(status))
                                    .map(status => (
                                        <option key={status} value={status}>
                                            {status.toUpperCase().replace('_', ' ')}
                                        </option>
                                    ))}
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowStatusUpdate(false)}
                                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={updating || !newStatus}
                                    className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200"
                                >
                                    {updating ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Order Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-100">
                            <h3 className="text-xl font-black text-red-600 uppercase tracking-tight mb-2">Cancel Order</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Please provide a reason for cancellation</p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Out of stock, customer request, delivery issue..."
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-red-500/10 mb-6 min-h-[120px] resize-none focus:bg-white"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={updating}
                                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all shadow-xl shadow-red-100"
                                >
                                    {updating ? 'Cancelling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Status Update Modal */}
                {showPaymentUpdate && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Update Payment Status</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Change the payment status</p>
                            <select
                                value={newPaymentStatus}
                                onChange={(e) => setNewPaymentStatus(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 mb-6 focus:bg-white"
                            >
                                <option value="">Select Payment Status</option>
                                <option value="pending">PENDING</option>
                                <option value="paid">PAID</option>
                                <option value="refunded">REFUNDED</option>
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPaymentUpdate(false)}
                                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePaymentStatus}
                                    disabled={updating || !newPaymentStatus}
                                    className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200"
                                >
                                    {updating ? 'Updating...' : 'Update Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rider Assignment Modal */}
                {showRiderAssignment && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Assign Rider</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Assign a delivery rider to this order</p>

                            {/* Auto Assignment Button */}
                            {(() => {
                                const coords = order?.deliveryAddress?.location?.coordinates;
                                const hasCoordinates = Array.isArray(coords) &&
                                    coords.length === 2 &&
                                    coords[0] !== 0 &&
                                    coords[1] !== 0;
                                return (
                                    <>
                                        <button
                                            onClick={handleAutoAssignment}
                                            disabled={updating || !hasCoordinates}
                                            className={`w-full mb-6 px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all ${!hasCoordinates
                                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                                                } disabled:opacity-50`}
                                        >
                                            <Bike className="w-5 h-5" />
                                            {updating ? 'Assigning...' : 'Auto Assign Rider'}
                                        </button>
                                        {!hasCoordinates && (
                                            <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-100 mb-6">
                                                <p className="text-[8px] font-black text-red-600 uppercase tracking-widest text-center italic">
                                                    GPS coordinates missing. Auto-assign unavailable.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]">
                                    <span className="px-4 bg-white text-gray-300">Manual Override</span>
                                </div>
                            </div>

                            {/* Manual Selection */}
                            <select
                                value={selectedRider}
                                onChange={(e) => setSelectedRider(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-600/20 mb-2 focus:bg-white"
                                disabled={riders.length === 0}
                            >
                                <option value="">
                                    {riders.length === 0 ? 'No Riders Online' : 'Select a Rider'}
                                </option>
                                {riders.map(rider => (
                                    <option key={rider._id} value={rider._id}>
                                        {rider.name.toUpperCase()} - {rider.mobile} (READY)
                                    </option>
                                ))}
                            </select>

                            {riders.length === 0 && (
                                <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-8 text-center mt-2">
                                    No riders are currently online
                                </p>
                            )}

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        setShowRiderAssignment(false);
                                        setSelectedRider('');
                                    }}
                                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleManualAssignment}
                                    disabled={updating || !selectedRider}
                                    className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200"
                                >
                                    {updating ? 'Assigning...' : 'Assign Rider'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
