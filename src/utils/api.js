import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token and brand to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Extract brand from URL path
    const path = window.location.pathname;
    const allowedBrands = ['littleh', 'teasntrees'];
    const pathSegments = path.split('/');
    // For admin, the path is expected to be /:brand/admin/...
    const pathBrand = pathSegments[1]?.toLowerCase();
    const brand = allowedBrands.includes(pathBrand) ? pathBrand : 'teasntrees';

    if (!config.url.startsWith(`/${brand}`)) {
        config.url = `/${brand}${config.url}`;
    }

    return config;
});

// Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;