import api from './api';

// Plans API
export const planAPI = {
    getAll: () => api.get('/plans'),
    getOne: (id) => api.get(`/plans/${id}`),
    create: (data) => api.post('/plans', data),
    addTask: (planId, title) => api.post(`/plans/${planId}/tasks`, { title }),
    updateTask: (planId, taskId, data) => api.patch(`/plans/${planId}/tasks/${taskId}`, data),
    deleteTask: (planId, taskId) => api.delete(`/plans/${planId}/tasks/${taskId}`)
};
