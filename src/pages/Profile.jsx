import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Calendar, Save, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user: authUser, updateUser } = useAuth(); // Assuming AuthContext has updateUser
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(() => {
        const cached = localStorage.getItem('profile_cache');
        return cached ? JSON.parse(cached) : {
            name: '',
            email: '',
            mobile: '',
            address: '',
            role: '',
            createdAt: '',
            isProfileComplete: false
        };
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/profile');
            if (response.data.success) {
                const userData = response.data.data.user;
                const newProfile = {
                    name: userData.name || '',
                    email: userData.email || '',
                    mobile: userData.mobile || '',
                    address: userData.address || '',
                    role: userData.role || '',
                    createdAt: userData.createdAt || '',
                    isProfileComplete: userData.isProfileComplete
                };
                setProfile(newProfile);
                localStorage.setItem('profile_cache', JSON.stringify(newProfile));
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear success message when user edits
        if (successMessage) setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const payload = {
                name: profile.name,
                email: profile.email,
                address: profile.address
            };

            const response = await api.put('/admin/profile', payload);

            if (response.data.success) {
                setSuccessMessage('Profile updated successfully');
                setIsEditing(false); // Switch back to read-only mode
                // Update local auth context if needed
                if (updateUser) {
                    updateUser(response.data.data.user);
                }
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !profile.name) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    <User className="w-8 h-8 text-black p-1.5 bg-gray-100 rounded-2xl" />
                    Admin Profile
                </h1>
                <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage your account and platform identity</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Summary Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-black text-2xl font-black border-4 border-white shadow-lg">
                            {profile.name?.charAt(0) || 'A'}
                        </div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{profile.name}</h2>
                        <div className="flex items-center justify-center gap-1 mt-1.5">
                            <span className="px-2.5 py-0.5 bg-[#56763D] text-white text-[9px] font-black uppercase rounded-lg tracking-widest">{profile.role}</span>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Account status</span>
                                <span className="text-green-600">Active</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Joined on</span>
                                <span className="text-gray-900">
                                    {new Date(profile.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Personal Profile</h3>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#56763D] text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                                >
                                    Edit Info
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4" />
                                    {successMessage}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <User className={`absolute left-3 top-2.5 w-5 h-5 ${isEditing ? 'text-gray-400' : 'text-gray-300'}`} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleChange}
                                            required
                                            disabled={!isEditing}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all ${isEditing
                                                ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                                : 'border-transparent bg-transparent text-gray-600 cursor-default px-0'
                                                }`}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className={`absolute left-3 top-2.5 w-5 h-5 ${isEditing ? 'text-gray-400' : 'text-gray-300'}`} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleChange}
                                            required
                                            disabled={!isEditing}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all ${isEditing
                                                ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                                : 'border-transparent bg-transparent text-gray-600 cursor-default px-0'
                                                }`}
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mobile Number
                                        <span className="ml-2 text-xs text-gray-400 font-normal">(Read-only)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-300" />
                                        <input
                                            type="text"
                                            value={profile.mobile}
                                            readOnly
                                            disabled
                                            className="w-full pl-10 pr-4 py-2 border border-transparent bg-transparent text-gray-500 rounded-lg cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                        <span className="ml-2 text-xs text-gray-400 font-normal">(Read-only)</span>
                                    </label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 w-5 h-5 text-gray-300" />
                                        <input
                                            type="text"
                                            value={profile.role}
                                            readOnly
                                            disabled
                                            className="w-full pl-10 pr-4 py-2 border border-transparent bg-transparent text-gray-500 rounded-lg cursor-not-allowed capitalize"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                    <div className="relative">
                                        <MapPin className={`absolute left-3 top-3 w-5 h-5 ${isEditing ? 'text-gray-400' : 'text-gray-300'}`} />
                                        <textarea
                                            name="address"
                                            value={profile.address}
                                            onChange={handleChange}
                                            required
                                            disabled={!isEditing}
                                            rows="3"
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all resize-none ${isEditing
                                                ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                                : 'border-transparent bg-transparent text-gray-600 cursor-default px-0'
                                                }`}
                                            placeholder="Enter your full address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
