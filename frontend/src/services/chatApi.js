import api from './api';

// Chat API
export const chatAPI = {
    getMessages: (limit = 50) => api.get(`/chat/messages?limit=${limit}`),
    sendMessage: (content) => api.post('/chat/messages', { content })
};
