import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // If no user/token, close existing socket and return
        if (!user || !user.token) {
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const token = user.token;
        console.log('Initializing socket with token...');

        // Dynamically extract brand from URL path
        // Expected path: /:brand/admin/...
        const pathSegments = window.location.pathname.split('/');
        const activeBrand = pathSegments[1] || 'teasntrees';

        const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://api.teasntrees.in';
        const newSocket = io(backendUrl, {
            auth: { token, brand: activeBrand },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('Connected to Real-time Server as', user.role || 'admin');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from Real-time Server');
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket Error:', error);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]); // Re-run when user state changes

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
