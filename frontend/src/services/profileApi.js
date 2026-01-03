import api from './api';

// Profile API
export const profileAPI = {
    get: () => api.get('/profile'),
    update: (data) => api.put('/profile', data),
    changePassword: (data) => api.put('/profile/password', data),
    uploadAvatar: (avatar) => api.put('/profile/avatar', { avatar }),
    deleteAccount: (password) => api.delete('/profile', { data: { password } })
};
