import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const offline = localStorage.getItem('offlineMode') === 'true';
    const token = localStorage.getItem('token');
    if (token && !offline && !token.startsWith('firebase-offline-')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (localStorage.getItem('offlineMode') === 'true') {
        return Promise.reject(error);
      }
      // Clear session only — avoid window.location.reload loops during dev
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('offlineMode');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: Record<string, string>) => api.post('/auth/register', data),
  firebaseLogin: (idToken: string) => api.post('/auth/firebase', { idToken }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  logout: () => api.post('/auth/logout'),
};

export const analyticsAPI = {
  getDashboard: (params?: Record<string, string>) => api.get('/analytics/dashboard', { params }),
  getAIInsights: () => api.get('/analytics/ai-insights', { timeout: 120000 }),
  getSalesChart: (days?: number) => api.get('/analytics/sales-chart', { params: { days } }),
};

export const aiAPI = {
  getStatus: () => api.get('/ai/status', { timeout: 20000 }),
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, history: history ?? [] }, { timeout: 120000 }),
};

export const productAPI = {
  getAll: (params?: Record<string, string>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/products/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  seed: () => api.get('/categories/seed'),
};

export const saleAPI = {
  getAll: (params?: Record<string, string>) => api.get('/sales', { params }),
  create: (data: Record<string, unknown>) => api.post('/sales', data),
  getById: (id: string) => api.get(`/sales/${id}`),
  getByInvoice: (invoiceNumber: string) => api.get(`/sales/invoice/${encodeURIComponent(invoiceNumber)}`),
};

export const inventoryAPI = {
  getAll: (params?: Record<string, string>) => api.get('/inventory', { params }),
  getAlerts: () => api.get('/inventory/alerts'),
  updateStock: (data: Record<string, unknown>) => api.post('/inventory/update', data),
  transfer: (data: Record<string, unknown>) => api.post('/inventory/transfer', data),
};

export const customerAPI = {
  getAll: (params?: Record<string, string>) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/customers', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/customers/${id}`, data),
};

export const employeeAPI = {
  getAll: (params?: Record<string, string>) => api.get('/employees', { params }),
};

export const supplierAPI = {
  getAll: (params?: Record<string, string>) => api.get('/suppliers', { params }),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
};

export const branchAPI = {
  getAll: () => api.get('/branches'),
};

export const reportAPI = {
  getSales: (params?: Record<string, string>) => api.get('/reports/sales', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getTax: (params?: Record<string, string>) => api.get('/reports/tax', { params }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: unknown) => api.put(`/settings/${key}`, { value }),
  seed: () => api.get('/settings/seed'),
};
