import api from './api';

// Attendance API
export const attendanceAPI = {
    getMine: () => api.get('/attendance/me'),
    getTeam: (days = 30) => api.get(`/attendance/team?days=${days}`),
    getStats: () => api.get('/attendance/stats'),
    submitReason: (date, reason, reasonText) => api.post('/attendance/reason', { date, reason, reasonText }),
    requestLeave: (date, reason, reasonText) => api.post('/attendance/leave', { date, reason, reasonText }),
    runManual: (date) => api.post('/attendance/run-manual', { date })
};
