import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

const SocketGlobalRefresh = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            queryClient.invalidateQueries();
        };

        socket.on('system:data-updated', handleUpdate);

        return () => {
            socket.off('system:data-updated', handleUpdate);
        };
    }, [socket, queryClient]);

    return null;
};

export default SocketGlobalRefresh;
