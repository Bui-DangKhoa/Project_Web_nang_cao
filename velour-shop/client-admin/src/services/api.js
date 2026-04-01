import axios from "axios";

const defaultApiBaseUrl = import.meta.env.DEV
  ? "/api"
  : "https://velour-shop-server.onrender.com/api";

const configuredApiBaseUrl =
  import.meta.env.VITE_API_URL || defaultApiBaseUrl;

const api = axios.create({
  baseURL: configuredApiBaseUrl.replace(/\/$/, ""),
});

// Tự động gắn token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refresh: (data) => api.post("/auth/refresh", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  oauth: (data) => api.post("/auth/oauth", data),
};

export const productAPI = {
  getAll: (params) => api.get("/products", { params }),
  suggest: (q) => api.get("/products/search/suggest", { params: { q } }),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  review: (id, data) => api.post(`/products/${id}/reviews`, data),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  getMeta: () => api.get("/products/meta"),
};

export const orderAPI = {
  create: (data) => api.post("/orders", data),
  myOrders: () => api.get("/orders/myorders"),
  getById: (id) => api.get(`/orders/${id}`),
};

export const couponAPI = {
  validate: (data) => api.post("/coupons/validate", data),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  getWishlist: () => api.get("/users/wishlist"),
  addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
  getCart: () => api.get("/users/cart"),
  syncCart: (cart) => api.put("/users/cart", { cart }),
  addAddress: (data) => api.post("/users/addresses", data),
  updateAddress: (addressId, data) =>
    api.put(`/users/addresses/${addressId}`, data),
  deleteAddress: (addressId) => api.delete(`/users/addresses/${addressId}`),
  listUsers: () => api.get("/users"),
  updateUserRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateUserStatus: (id, status) =>
    api.patch(`/users/${id}/status`, { status }),
};

export const adminAPI = {
  dashboard: (range = "month") =>
    api.get("/admin/dashboard", { params: { range } }),
  orders: () => api.get("/admin/orders"),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  inventory: () => api.get("/admin/inventory"),
  getSeoSettings: () => api.get("/admin/seo"),
  updateSeoSettings: (data) => api.put("/admin/seo", data),
};

export const seoAPI = {
  getSettings: () => api.get("/seo/settings"),
};

export default api;
