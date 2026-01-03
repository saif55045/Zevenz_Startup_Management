import api from './api';

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getContributions: (id) => api.get(`/dashboard/contributions/${id}`)
};

