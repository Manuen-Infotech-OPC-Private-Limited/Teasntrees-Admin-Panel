import { useState, useEffect } from 'react';
import { X, User, Bike, FileText, CreditCard, Phone, Star, TrendingUp, MapPin, Calendar, MessageSquare, Clock } from 'lucide-react';
import RiderStatusBadge from './RiderStatusBadge';
import api from '../utils/api';

const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ))}
    </div>
);

export default function RiderDetailsModal({ isOpen, onClose, rider, onApprove, onReject, onToggleStatus }) {
    const [activeTab, setActiveTab] = useState('details'); // details, reviews
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && rider && activeTab === 'reviews') {
            fetchRiderReviews();
        }
    }, [isOpen, rider, activeTab]);

    const fetchRiderReviews = async () => {
        setLoadingReviews(true);
        try {
            const response = await api.get(`/admin/reviews/rider/${rider._id}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews || []);
            }
        } catch (error) {
            console.error('Failed to fetch rider reviews:', error);
            setError('Failed to load feedback matrix.');
        } finally {
            setLoadingReviews(false);
        }
    };

    if (!isOpen || !rider) return null;

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-[2.5rem] p-8 text-center max-w-sm w-full">
                    <p className="text-red-600 font-bold mb-4">System Error</p>
                    <p className="text-sm text-gray-600 mb-6">{error}</p>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Close</button>
                </div>
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    const isLicenseExpired = rider.licenseExpiryDate && new Date(rider.licenseExpiryDate) < new Date();

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-50 p-5 sm:p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center border border-emerald-100">
                            <Bike className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{rider.name}</h2>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Rider Profile</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-50 px-6 bg-gray-50/30">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-3 py-4 text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'details'
                                ? 'text-emerald-700'
                                : 'text-gray-400 hover:text-emerald-700'
                                }`}
                        >
                            Rider Details
                            {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'reviews'
                                ? 'text-emerald-700'
                                : 'text-gray-400 hover:text-emerald-700'
                                }`}
                        >
                            Customer Reviews
                            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1">
                    {activeTab === 'details' ? (
                        <div className="space-y-8">
                            {/* Status Indicators */}
                            <div className="flex flex-wrap gap-3 px-2">
                                <RiderStatusBadge type="approval" status={rider.isApproved ? 'approved' : 'pending'} />
                                <RiderStatusBadge type="active" status={rider.isActive} />
                                <RiderStatusBadge type="online" status={rider.isOnline} />
                                <RiderStatusBadge type="delivery" status={rider.isOnDelivery} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Performance Stats */}
                                <div className="space-y-4 col-span-1 md:col-span-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Deliveries', value: rider.totalDeliveries || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                                            { label: 'Rating', value: (rider.averageRating || 0).toFixed(1), icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50/50' },
                                            { label: 'Net Earnings', value: `₹${rider.totalEarnings || 0}`, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                                            { label: 'Float Value', value: `₹${rider.pendingEarnings || 0}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50/50' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} rounded-[2rem] p-6 border border-white hover:scale-[1.02] transition-transform`}>
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
                                </div>

                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <User className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Information</h3>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:border-emerald-100 transition-colors">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                                                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{rider.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                                <p className="font-black text-gray-900 text-sm tracking-tight">{rider.mobile}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">Verification PIN</p>
                                                <p className="font-black text-emerald-700 text-lg tracking-[0.2em]">{rider.verificationPin || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                                <p className="font-black text-gray-900 text-sm tracking-tight">{rider.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Activation Date</p>
                                                <p className="font-black text-gray-900 text-[10px]">{formatDate(rider.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <Bike className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vehicle Details</h3>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:border-emerald-100 transition-colors">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Class</p>
                                                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{rider.vehicleType || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle Number</p>
                                                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{rider.vehicleNumber || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle Model</p>
                                                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{rider.vehicleModel || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="space-y-4 col-span-1 md:col-span-2">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <FileText className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Documents</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* License */}
                                        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Driving Permit</p>
                                                {isLicenseExpired && (
                                                    <span className="px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded-md">EXPIRED</span>
                                                )}
                                            </div>
                                            <div className="space-y-3 mb-6">
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Permit No</p>
                                                    <p className="font-black text-gray-900 text-[10px]">{rider.licenseNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry</p>
                                                    <p className={`font-black text-[10px] ${isLicenseExpired ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(rider.licenseExpiryDate)}</p>
                                                </div>
                                            </div>
                                            {rider.licensePhoto && (
                                                <a href={rider.licensePhoto} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 bg-emerald-50 text-[10px] font-black text-emerald-700 uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all">VIEW PHOTO</a>
                                            )}
                                        </div>

                                        {/* Aadhar */}
                                        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Aadhar Identity</p>
                                            <div className="space-y-3 mb-6">
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">UID No</p>
                                                    <p className="font-black text-gray-900 text-[10px]">{rider.aadharNumber || 'N/A'}</p>
                                                </div>
                                            </div>
                                            {rider.aadharPhoto && (
                                                <a href={rider.aadharPhoto} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 bg-emerald-50 text-[10px] font-black text-emerald-700 uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all">VIEW PHOTO</a>
                                            )}
                                        </div>

                                        {/* PAN */}
                                        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Tax Identity</p>
                                            <div className="space-y-3 mb-6">
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">PAN No</p>
                                                    <p className="font-black text-gray-900 text-[10px]">{rider.panNumber || 'N/A'}</p>
                                                </div>
                                            </div>
                                            {rider.panPhoto && (
                                                <a href={rider.panPhoto} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 bg-emerald-50 text-[10px] font-black text-emerald-700 uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all">VIEW PHOTO</a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bank & Emergency */}
                                <div className="space-y-8 col-span-1 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 px-2">
                                                <div className="p-2 bg-emerald-50 rounded-lg">
                                                    <CreditCard className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Bank Details</h3>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:border-emerald-100 transition-colors">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="col-span-2">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Account</p>
                                                        <p className="font-black text-gray-900 text-sm tracking-tight">{rider.bankAccountNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IFSC Code</p>
                                                        <p className="font-black text-gray-900 uppercase text-[10px]">{rider.ifscCode || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</p>
                                                        <p className="font-black text-gray-900 uppercase text-[10px]">MAIN</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 px-2">
                                                <div className="p-2 bg-emerald-50 rounded-lg">
                                                    <Phone className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Emergency Contact</h3>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:border-emerald-100 transition-colors">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Subject Name</p>
                                                        <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{rider.emergencyContact?.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Subject Contact</p>
                                                        <p className="font-black text-gray-900 text-sm tracking-tight">{rider.emergencyContact?.mobile || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Relationship</p>
                                                        <p className="font-black text-gray-900 uppercase text-[10px]">{rider.emergencyContact?.relation || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                {!rider.isApproved && (
                                    <>
                                        <button
                                            onClick={() => { onApprove(rider); onClose(); }}
                                            className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                                        >
                                            Approve Rider
                                        </button>
                                        <button
                                            onClick={() => { onReject(rider); onClose(); }}
                                            className="flex-1 py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100"
                                        >
                                            Reject Rider
                                        </button>
                                    </>
                                )}
                                {rider.isApproved && (
                                    <button
                                        onClick={() => { onToggleStatus(rider); onClose(); }}
                                        className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${rider.isActive ? 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
                                    >
                                        {rider.isActive ? 'Deactivate Rider' : 'Activate Rider'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {loadingReviews ? (
                                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">Loading reviews...</p>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-gray-50">
                                    <MessageSquare className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No reviews yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:border-emerald-200 transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg">
                                                        {review.customerId?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{review.customerId?.name || 'GENERIC_USER'}</h4>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                            LOG #{review.orderId?.orderNumber} • {new Date(review.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                                                    <span className="text-[10px] font-black text-yellow-700">{review.riderRating}</span>
                                                    <Star className="w-3 h-3 fill-yellow-700 text-yellow-700" />
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                                <p className="text-gray-900 text-[11px] font-black uppercase tracking-wider leading-relaxed italic">
                                                    "{review.review}"
                                                </p>
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
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
