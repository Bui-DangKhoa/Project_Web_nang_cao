import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Tự động gắn token
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
});

export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
};

export const productAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    review: (id, data) => api.post(`/products/${id}/reviews`, data),
};

export const orderAPI = {
    create: (data) => api.post('/orders', data),
    myOrders: () => api.get('/orders/myorders'),
    getById: (id) => api.get(`/orders/${id}`),
};

export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
};

export default api;
