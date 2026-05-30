'use client';

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send HttpOnly cookies on every request
});

// No request interceptor needed — the browser attaches the cookie automatically.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const { pathname } = window.location;
      // Don't redirect if already on an auth page — that would cause an infinite reload loop
      if (pathname !== '/login' && pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  },
};

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
  },
  sendSummary: async (id) => {
    const response = await api.post(`/loans/${id}/send-summary`);
    return response.data;
  },
};

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
  },
};

export const summaryApi = {
  getOverview: async () => {
    const response = await api.get('/summary/overview');
    return response.data;
  },
};

export default api;
