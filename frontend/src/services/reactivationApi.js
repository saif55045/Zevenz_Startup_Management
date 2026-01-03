import api from './api';

// Reactivation API
export const reactivationAPI = {
    getAll: () => api.get('/reactivation'),
    getMine: () => api.get('/reactivation/me'),
    create: () => api.post('/reactivation'),
    vote: (id, vote) => api.post(`/reactivation/${id}/vote`, { vote })
};
