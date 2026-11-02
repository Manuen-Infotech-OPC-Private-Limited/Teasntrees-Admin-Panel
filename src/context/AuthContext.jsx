import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('adminToken');
        return token ? { token } : null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            // Background verification
            api.get('/admin/dashboard/stats').catch(() => {
                localStorage.removeItem('adminToken');
                setUser(null);
            });
        }
    }, []);

    const verifyOTP = async (mobile, idToken) => {
        const response = await api.post('/admin/auth/firebase-login', { idToken });
        const data = response.data.data;

        // Check if profile is complete
        if (data.user.isProfileComplete === false) {
            // Return user data for profile completion
            return {
                needsProfile: true,
                mobile: mobile,
                isNewUser: data.user.isNewUser
            };
        }

        // Profile is complete, login directly
        const { token, refreshToken } = data;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminRefreshToken', refreshToken); // Store refresh token
        setUser({ ...data.user, token });
        return { needsProfile: false };
    };

    const completeProfile = async (mobile, profileData) => {
        const response = await api.post('/admin/auth/complete-profile', {
            ...profileData
        });
        const { token, refreshToken, user: userData } = response.data.data;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminRefreshToken', refreshToken);
        setUser({ ...userData, token });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, verifyOTP, completeProfile, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};