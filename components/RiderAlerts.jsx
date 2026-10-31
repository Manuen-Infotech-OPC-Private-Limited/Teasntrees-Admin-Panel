import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

/**
 * Live alerts about riders that the team must not miss: a rider resetting
 * their own login PIN from the app, or deleting their rider account. The
 * backend records both on the rider too (pinResetAt / deletedAt), so an alert
 * missed while nobody had the panel open still shows on the rider's card.
 */
const RiderAlerts = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const onPinReset = (data = {}) => {
            toast(`${data.name || 'A rider'} (${data.mobile || 'no number'}) reset their login PIN from the app.`, {
                icon: '🔑',
                duration: 15000,
            });
            queryClient.invalidateQueries();
        };

        const onStatus = (data = {}) => {
            if (data.status !== 'deleted') return;
            toast(`${data.name || 'A rider'} deleted their rider account.`, {
                icon: '⚠️',
                duration: 15000,
            });
        };

        socket.on('rider:pin-reset', onPinReset);
        socket.on('rider:status-updated', onStatus);
        return () => {
            socket.off('rider:pin-reset', onPinReset);
            socket.off('rider:status-updated', onStatus);
        };
    }, [socket, queryClient]);

    return null;
};

export default RiderAlerts;
