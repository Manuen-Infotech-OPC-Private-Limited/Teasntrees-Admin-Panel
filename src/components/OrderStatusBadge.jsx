export default function OrderStatusBadge({ status }) {
    const statusConfig = {
        pending: {
            label: 'Pending',
            className: 'bg-gray-50 text-gray-600 border border-gray-100'
        },
        confirmed: {
            label: 'Confirmed',
            className: 'bg-blue-50 text-blue-600 border border-blue-100'
        },
        preparing: {
            label: 'Preparing',
            className: 'bg-orange-50 text-orange-600 border border-orange-100'
        },
        ready: {
            label: 'Ready',
            className: 'bg-purple-50 text-purple-600 border border-purple-100'
        },

        // ✅ IMPORTANT FIX
        waiting_for_rider: {
            label: 'Waiting for Rider',
            className: 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        },

        assigned: {
            label: 'Assigned',
            className: 'bg-cyan-50 text-cyan-600 border border-cyan-100'
        },
        picked_up: {
            label: 'Picked Up',
            className: 'bg-indigo-50 text-indigo-600 border border-indigo-100'
        },
        'out-for-delivery': {
            label: 'Out for Delivery',
            className: 'bg-yellow-50 text-yellow-600 border border-yellow-100'
        },
        in_transit: {
            label: 'In Transit',
            className: 'bg-yellow-50 text-yellow-600 border border-yellow-100'
        },
        delivered: {
            label: 'Delivered',
            className: 'bg-green-50 text-green-600 border border-green-100'
        },
        cancelled: {
            label: 'Cancelled',
            className: 'bg-red-50 text-red-600 border border-red-100'
        }
    };

    const config = statusConfig[status] || {
        label: status?.replace(/_/g, ' ') || 'Unknown',
        className: 'bg-gray-50 text-gray-500 border border-gray-100'
    };

    return (
        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${config.className}`}>
            {config.label}
        </span>
    );
}
