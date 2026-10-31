import React from 'react';
import {
    X, Package, User, Bike, MapPin,
    Clock, Phone, CheckCircle2, AlertCircle,
    Navigation, ShieldCheck, Mail, IndianRupee,
    Navigation2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../context/SocketContext';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const riderIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/713/713438.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

const storeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606363.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

const customerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

// Internal Truck Icon
const Truck = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
    </svg>
);

const isValidCoord = (coords) => {
    return Array.isArray(coords) &&
        coords.length >= 2 &&
        typeof coords[0] === 'number' &&
        typeof coords[1] === 'number' &&
        !isNaN(coords[0]) &&
        !isNaN(coords[1]);
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    React.useEffect(() => {
        if (isValidCoord(center)) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const DeliveryDetailsModal = ({ isOpen, onClose, delivery }) => {
    const { socket } = useSocket();
    const [riderPos, setRiderPos] = React.useState(null);

    React.useEffect(() => {
        const coords = delivery?.currentLocation?.coordinates;
        if (isValidCoord(coords)) {
            setRiderPos([coords[1], coords[0]]); // Leaflet uses [lat, lng]
        }
    }, [delivery]);

    React.useEffect(() => {
        if (!socket || !delivery) return;

        socket.on('rider:location-update', (data) => {
            const currentOrderId = delivery.orderId?._id || delivery.orderId;
            if (data.orderId === currentOrderId && data.location) {
                const newPos = [data.location.latitude, data.location.longitude];
                if (isValidCoord(newPos)) {
                    console.log('📍 Live Location Update:', newPos);
                    setRiderPos(newPos);
                }
            }
        });

        return () => socket.off('rider:location-update');
    }, [socket, delivery]);

    if (!isOpen || !delivery) return null;

    const timeline = [
        { status: 'pending_acceptance', label: 'Pending Rider Acceptance', time: delivery.assignedAt || delivery.createdAt, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
        { status: 'picked_up', label: 'Order Picked Up', time: delivery.pickedUpAt, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { status: 'in_transit', label: 'Out for Delivery', time: delivery.pickedUpAt, icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50' },
        { status: 'delivered', label: 'Delivered', time: delivery.deliveredAt, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
        { status: 'cancelled', label: 'Cancelled', time: delivery.cancelledAt, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
    ].filter(step => {
        // Show step if it has a timestamp
        if (step.time) {
            // Special case: don't show "Out for Delivery" (in_transit) if the current status is just "picked_up"
            // even though they share the same timestamp source.
            if (step.status === 'in_transit' && delivery.status === 'picked_up') return false;
            return true;
        }
        // Always show the current status step
        return step.status === delivery.status;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-emerald-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-50 bg-white flex items-center justify-between z-10 gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-50 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center border border-gray-100 shrink-0">
                            <Truck className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                                <h2 className="text-base sm:text-2xl font-black text-gray-900 uppercase tracking-tight break-words">Delivery Details</h2>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${delivery.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                    }`}>
                                    {delivery.status}
                                </span>
                                {delivery.orderId?.brand && (
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${delivery.orderId.brand === 'littleh' ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                        {delivery.orderId.brand === 'littleh' ? 'LITTLEH' : 'TEAS N TREES'}
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 break-all">Order ID: #{delivery.orderId?._number || delivery.orderId?.orderNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 no-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">

                        {/* Left Column: Entities & Details */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* Live Tracking Map */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <Navigation2 className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Tracking</h3>
                                </div>
                                <div className="h-80 bg-gray-50 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner relative z-0">
                                    <MapContainer
                                        center={[16.3090716, 80.4308257]}
                                        zoom={14}
                                        style={{ height: '100%', width: '100%' }}
                                        zoomControl={false}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                        {/* Store Marker */}
                                        <Marker position={[16.3090716, 80.4308257]} icon={storeIcon}>
                                            <Popup>
                                                <div className="text-[10px] font-black text-gray-900 uppercase">Outlet Location</div>
                                            </Popup>
                                        </Marker>

                                        {/* Customer Marker */}
                                        {isValidCoord([delivery.deliveryLocation?.coordinates?.[1], delivery.deliveryLocation?.coordinates?.[0]]) && (
                                            <Marker
                                                position={[delivery.deliveryLocation.coordinates[1], delivery.deliveryLocation.coordinates[0]]}
                                                icon={customerIcon}
                                            >
                                                <Popup>
                                                    <div className="text-[10px] font-black text-gray-900 uppercase">Customer Location</div>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* Rider Marker */}
                                        {isValidCoord(riderPos) && (
                                            <>
                                                <Marker position={riderPos} icon={riderIcon}>
                                                    <Popup>
                                                        <div className="text-[10px] font-black text-gray-900 uppercase text-indigo-600">Rider Location</div>
                                                    </Popup>
                                                </Marker>
                                                <MapUpdater center={riderPos} />
                                            </>
                                        )}

                                        {/* Route Line */}
                                        {isValidCoord([delivery.deliveryLocation?.coordinates?.[1], delivery.deliveryLocation?.coordinates?.[0]]) && (
                                            <Polyline
                                                positions={[
                                                    [16.3090716, 80.4308257],
                                                    isValidCoord(riderPos) ? riderPos : [16.3090716, 80.4308257],
                                                    [delivery.deliveryLocation.coordinates[1], delivery.deliveryLocation.coordinates[0]]
                                                ]}
                                                color="#000"
                                                weight={3}
                                                dashArray="8, 12"
                                            />
                                        )}
                                    </MapContainer>

                                    {!riderPos && (
                                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-gray-400 shadow-xl">
                                                <Navigation className="w-8 h-8 animate-bounce" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Waiting for Location</p>
                                                <p className="text-[8px] text-gray-400 font-black uppercase mt-1 tracking-widest">Finding rider...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <User className="w-4 h-4" /> Customer Details
                                        </h3>
                                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Name</p>
                                            <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{delivery.customerId?.name || 'GENERIC_USER'}</p>
                                        </div>
                                        {delivery.deliveryOtp && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery OTP</p>
                                                <p className="text-lg font-black text-emerald-600 tracking-wider bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">{delivery.deliveryOtp}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-6 border-t border-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Address</p>
                                        <p className="text-[11px] text-gray-900 font-black leading-relaxed uppercase italic">{delivery.customerId?.address || delivery.deliveryLocation?.address || 'NO ADDRESS'}</p>
                                    </div>
                                </div>

                                {/* Rider Info */}
                                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Bike className="w-4 h-4" /> Rider Details
                                        </h3>
                                        <div className="p-3 bg-emerald-600 text-white rounded-xl">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Name</p>
                                            <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{delivery.riderId?.name || 'Waiting for Rider'}</p>
                                        </div>
                                        {delivery.pickupOtp && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup OTP</p>
                                                <p className="text-lg font-black text-amber-600 tracking-wider bg-amber-50 px-3 py-1 rounded-xl border border-amber-100">{delivery.pickupOtp}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Earning</p>
                                            <p className="text-xl font-black text-gray-900 tracking-tight">₹{delivery.totalEarning || 0}</p>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest">ACTIVE</div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-50 space-y-6">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Order Summary
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center border border-gray-100 shadow-sm">
                                            <IndianRupee className="w-8 h-8 text-gray-900" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-gray-900 tracking-tight">₹{delivery.orderId?.total}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Order Total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{delivery.orderId?.paymentMethod || 'COD'}</p>
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Payment Mode</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Timeline */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Delivery Timeline</h3>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 relative overflow-hidden">
                                    {/* Timeline Line */}
                                    <div className="absolute left-[59px] top-12 bottom-12 w-1 bg-gray-50"></div>

                                    <div className="space-y-10 relative">
                                        {timeline.map((event, index) => (
                                            <div key={index} className="flex gap-6 items-start relative group">
                                                <div className="bg-white z-10 mt-1">
                                                    <div className={`w-8 h-8 rounded-xl border-4 border-white flex items-center justify-center shadow-sm transition-all ${index === timeline.length - 1 ? 'bg-emerald-600 ring-8 ring-emerald-50 scale-110' : 'bg-gray-100'
                                                        }`}>
                                                        {index === timeline.length - 1 && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5 pt-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${index === timeline.length - 1 ? 'text-gray-900' : 'text-gray-300'
                                                        }`}>
                                                        {event.label}
                                                    </p>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${index === timeline.length - 1 ? 'text-gray-400' : 'text-gray-200'}`}>
                                                        {event.time ? new Date(event.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Waiting'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Efficiency Info */}
                            <div className="bg-emerald-950 rounded-[2.5rem] p-10 space-y-6 shadow-2xl shadow-emerald-200/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Clock className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Time Tracking</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Time Elapsed</p>
                                    <p className="text-4xl font-black text-white tracking-tight">42<span className="text-sm font-black text-white/40 ml-2 uppercase">Mins</span></p>
                                </div>
                                <div className="pt-6 border-t border-white/10 space-y-1">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Delivery Status</p>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ON_TIME</p>
                                </div>
                            </div>
                        </div>
                    </div>
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
        </div >
    );
};


export default DeliveryDetailsModal;
