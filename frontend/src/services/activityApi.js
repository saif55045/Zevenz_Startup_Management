import api from './api';

// Activity API
export const activityAPI = {
    getToday: () => api.get('/activities/today'),
    getMine: () => api.get('/activities'),
    getAll: (date) => api.get(`/activities/all${date ? `?date=${date}` : ''}`),
    create: (content) => api.post('/activities', { content })
};
