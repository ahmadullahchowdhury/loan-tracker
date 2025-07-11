import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Loans API
export const loansApi = {
  getAll: async () => {
    const response = await api.get('/loans');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/loans/${id}`);
    return response.data;
  },
  
  create: async (loanData) => {
    const response = await api.post('/loans', loanData);
    return response.data;
  },
  
  update: async (id, loanData) => {
    const response = await api.put(`/loans/${id}`, loanData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/loans/${id}`);
    return response.data;
  }
};

// Transactions API
export const transactionsApi = {
  getByLoanId: async (loanId) => {
    const response = await api.get(`/transactions/loan/${loanId}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  
  create: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },
  
  update: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  }
};

// Summary API
export const summaryApi = {
  getOverview: async () => {
    const response = await api.get('/summary/overview');
    return response.data;
  }
};

export default api;

