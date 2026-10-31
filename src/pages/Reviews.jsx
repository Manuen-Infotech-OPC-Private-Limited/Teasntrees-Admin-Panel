import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Star, Check, X, Trash2, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import ReviewDetailsModal from '../components/ReviewDetailsModal';
import { useSocket } from '../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CardSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-[2rem] h-48"></div>
        ))}
    </div>
);

const Reviews = () => {
    const { brand: urlBrand } = useParams();
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [reviewType, setReviewType] = useState('food');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedReviewId, setSelectedReviewId] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);



    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['reviews-stats', urlBrand],
        queryFn: async () => {
            const response = await api.get('/admin/reviews/stats');
            const data = response.data.data;
            localStorage.setItem('reviews-stats-cache', JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem('reviews-stats-cache');
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Reviews
    const { data: reviewsData, isLoading: loading } = useQuery({
        queryKey: ['reviews', reviewType, activeTab, page, urlBrand],
        queryFn: async () => {
            const params = { page, limit: 10, type: reviewType };
            if (activeTab !== 'all') params.status = activeTab;
            const response = await api.get('/admin/reviews', { params });
            const data = response.data.data;
            const cacheKey = `reviews-cache-${reviewType}-${activeTab}-${page}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cacheKey = `reviews-cache-${reviewType}-${activeTab}-${page}`;
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        staleTime: 0
    });

    const reviews = reviewsData?.reviews || [];
    const paginationInfo = reviewsData?.pagination || { totalPages: 1 };

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', urlBrand] });
            queryClient.invalidateQueries({ queryKey: ['reviews-stats', urlBrand] });
        };
        socket.on('review:new', handleUpdate);
        socket.on('review:updated', handleUpdate);
        socket.on('review:deleted', handleUpdate);
        return () => {
            socket.off('review:new', handleUpdate);
            socket.off('review:updated', handleUpdate);
            socket.off('review:deleted', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleApprove = async (id) => {
        try {
            await api.patch(`/admin/reviews/${id}/approve`);
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviews-stats'] });
        } catch (error) { console.error('Error approving review:', error); }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this review?')) return;
        try {
            await api.patch(`/admin/reviews/${id}/reject`);
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviews-stats'] });
        } catch (error) { console.error('Error rejecting review:', error); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete review permanently?')) return;
        try {
            await api.delete(`/admin/reviews/${id}`);
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviews-stats'] });
        } catch (error) { console.error('Error deleting review:', error); }
    };

    const handleViewDetails = (id) => {
        setSelectedReviewId(id);
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Customer Reviews</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage customer and rider feedback</p>
                </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <StatCard label="Total Reviews" value={stats?.totalReviews || 0} icon={MessageSquare} theme="blue" desc="All time reviews" loading={statsLoading} />
                <StatCard label="Pending" value={stats?.pendingReviews || 0} icon={Star} theme="orange" desc="Need approval" loading={statsLoading} />
                <StatCard label="Food Rating" value={stats?.averageFoodRating || '0.0'} icon={Star} theme="green" desc="Average score" loading={statsLoading} />
                <StatCard label="Cafe Rating" value={stats?.averageSiteRating || '0.0'} icon={Star} theme="purple" desc="General experience" loading={statsLoading} />
                <StatCard label="Rider Rating" value={stats?.averageRiderRating || '0.0'} icon={Star} theme="blue" desc="Average score" loading={statsLoading} />
            </div>

            <div className="flex gap-4 p-1.5 bg-gray-50 rounded-2xl w-fit">
                <button onClick={() => { setReviewType('food'); setPage(1); }} className={`px-8 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${reviewType === 'food' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}>Food Items</button>
                <button onClick={() => { setReviewType('site'); setPage(1); }} className={`px-8 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${reviewType === 'site' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}>Cafe Experience</button>
                <button onClick={() => { setReviewType('rider'); setPage(1); }} className={`px-8 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${reviewType === 'rider' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}>Rider Service</button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    {['all', 'pending', 'approved'].map((tab) => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>{tab}</button>
                    ))}
                </div>

                <div className="p-8 flex-1">
                    {reviews.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-200 font-black uppercase tracking-widest opacity-20 py-20"><MessageSquare className="w-20 h-20 mb-4" /> No reviews found</div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review._id} className="group border-2 border-gray-50 rounded-[2rem] p-6 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all flex flex-col md:flex-row gap-6">
                                    <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-white transition-all shadow-sm shrink-0">
                                        <span className="text-xl font-black text-indigo-600 uppercase">{review.customerId?.name?.charAt(0) || 'U'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-black text-gray-900 uppercase text-sm">{review.customerId?.name || 'Unknown User'}</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {review.type === 'site' || !review.orderId ? (
                                                        <span className="text-indigo-600">STAY & DINE • SITE REVIEW</span>
                                                    ) : (
                                                        `Order #${review.orderId?.orderNumber || '---'}`
                                                    )}
                                                    {' • '}{new Date(review.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{review.isApproved ? 'Approved' : 'Pending'}</span>
                                        </div>
                                        <div className="flex gap-4 mb-4">
                                            {reviewType === 'rider' ? (
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">Rider: <span className="text-gray-900">{review.riderId?.name || '---'}</span></span>
                                                    {review.riderRating && <StarRating rating={review.riderRating} />}
                                                </div>
                                            ) : (
                                                <div className="flex gap-4 items-center">
                                                    {review.foodRating && <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase text-gray-400">{review.type === 'site' || !review.orderId ? 'Cafe' : 'Food'}</span><StarRating rating={review.foodRating} /></div>}
                                                    {review.productRating && <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase text-gray-400">Item</span><StarRating rating={review.productRating} /></div>}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 font-bold leading-relaxed italic border-l-4 border-gray-100 pl-4 py-1 mb-6">"{review.review}"</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleViewDetails(review._id)} className="px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase hover:bg-[#56763D] hover:text-white transition-all">View</button>
                                            {!review.isApproved ? (
                                                <button onClick={() => handleApprove(review._id)} className="px-5 py-2.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all">Approve</button>
                                            ) : (
                                                <button onClick={() => handleReject(review._id)} className="px-5 py-2.5 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white transition-all">Reject</button>
                                            )}
                                            <button onClick={() => handleDelete(review._id)} className="px-4 py-2.5 bg-red-50 text-red-200 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all ml-auto">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {paginationInfo.totalPages > 1 && (
                    <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex justify-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 disabled:opacity-30"><ArrowRight className="w-5 h-5 rotate-180" /></button>
                        <span className="bg-white px-6 py-3 rounded-2xl border border-gray-100 font-black text-xs text-gray-400 flex items-center">PAGE {page} / {paginationInfo.totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(paginationInfo.totalPages, p + 1))} disabled={page === paginationInfo.totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#56763D] text-white disabled:opacity-30"><ArrowRight className="w-5 h-5" /></button>
                    </div>
                )}
            </div>

            <ReviewDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} reviewId={selectedReviewId} />
        </div>
    );
};

const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-3 h-3 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
        ))}
    </div>
);

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        blue: 'from-blue-600 to-indigo-700 shadow-blue-100 text-blue-600 bg-blue-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50',
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        purple: 'from-purple-600 to-indigo-700 shadow-purple-100 text-purple-600 bg-purple-50'
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

export default Reviews;
