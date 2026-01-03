import api from './api';

// Founders API
export const foundersAPI = {
    getAll: () => api.get('/founders'),
    getOne: (id) => api.get(`/founders/${id}`),
    generateCredentials: (name, email) => api.post('/founders/generate', { name, email })
};
