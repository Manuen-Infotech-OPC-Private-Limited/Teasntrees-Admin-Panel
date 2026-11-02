import React, { useEffect, useState } from 'react';
import { X, Star, Calendar, MessageSquare, ShoppingBag, User, Bike } from 'lucide-react';
import api from '../utils/api';

export default function ReviewDetailsModal({ isOpen, onClose, reviewId }) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && reviewId) {
            fetchReviewDetails();
        }
    }, [isOpen, reviewId]);

    const fetchReviewDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/reviews/${reviewId}`);
            if (response.data.success) {
                setReview(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch review details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const StarRating = ({ rating }) => (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3 h-3 ${star <= rating ? 'fill-black text-gray-900' : 'text-gray-200'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col relative z-10">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border border-gray-100 shadow-sm">
                            <MessageSquare className="w-7 h-7 text-gray-900" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Review Details</h2>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Feedback Entry</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-50">
                            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">Loading Details...</p>
                        </div>
                    ) : review ? (
                        <div className="space-y-10">
                            {/* Order Info */}
                            <div className="flex items-center justify-between bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-50">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Order Reference</p>
                                    <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                        {review.type === 'site' || !review.orderId ? (
                                            <span className="text-emerald-700">GENERAL CAFE REVIEW</span>
                                        ) : (
                                            `ID: #${review.orderId?.orderNumber || '---'}`
                                        )}
                                    </p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Review Date
                                    </p>
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                        {new Date(review.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Ratings Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: (review.type === 'site' || !review.orderId) ? 'Cafe Experience' : 'Food Quality', rating: review.foodRating, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50/50' },
                                    { label: 'Rider Service', rating: review.riderRating, icon: Bike, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                                    { label: 'Product Rating', rating: review.productRating, icon: Star, color: 'text-purple-600', bg: 'bg-purple-50/50' }
                                ].filter(r => r.rating).map((r, i) => (
                                    <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex flex-col items-center text-center space-y-3">
                                        <div className={`w-12 h-12 ${r.bg} rounded-2xl flex items-center justify-center border border-white shadow-sm`}>
                                            <r.icon className={`w-6 h-6 ${r.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">{r.label}</p>
                                            <StarRating rating={r.rating} />
                                            <p className="font-black text-2xl text-gray-900 tracking-tight mt-2">{r.rating}.0</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Review Content */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Customer Feedback
                                </h3>
                                <div className="bg-emerald-950 rounded-[2.5rem] p-10 relative overflow-hidden group">
                                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                                    <p className="text-white text-lg font-black italic relative z-10 leading-relaxed uppercase tracking-tight">
                                        " {review.review} "
                                    </p>
                                    <div className="absolute bottom-6 right-10 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Final Review</div>
                                </div>
                            </div>

                            {/* Product Details */}
                            {review.productId && (
                                <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] flex items-center gap-8 shadow-sm">
                                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                                        {review.productId.image ? (
                                            <img
                                                src={review.productId.image}
                                                alt={review.productId.name}
                                                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
                                            />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[8px] font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-md uppercase tracking-[0.2em]">
                                            Product Information
                                        </span>
                                        <h4 className="font-black text-gray-900 text-xl uppercase tracking-tight">{review.productId.name}</h4>
                                        {review.productId.price && (
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Unit Price: ₹{review.productId.price}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Entities Involved */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                                {/* Customer */}
                                <div className="flex items-center gap-4 p-4 bg-gray-50/30 rounded-2xl border border-gray-50">
                                    <div className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center text-gray-900 font-black text-xl border border-gray-100 shadow-sm">
                                        {review.customerId?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{review.customerId?.name || 'GENERIC_USER'}</p>
                                    </div>
                                </div>

                                {/* Rider (if applicable) */}
                                {review.riderId && (
                                    <div className="flex items-center gap-4 p-4 bg-gray-50/30 rounded-2xl border border-gray-50">
                                        <div className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center text-gray-900 border border-gray-100 shadow-sm">
                                            <Bike className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivery Partner</p>
                                            <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{review.riderId?.name || 'PERSONNEL_UNASSIGNED'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Signal Lost - Data Not Found</p>
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
}
