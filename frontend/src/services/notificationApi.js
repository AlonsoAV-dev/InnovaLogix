import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const notificationApi = {
    // Get all notifications (optionally filter by read status)
    getAll: async (read = undefined, limit = 50) => {
        const params = {};
        if (read !== undefined) params.read = read;
        if (limit) params.limit = limit;
        
        const response = await axios.get(`${API_URL}/api/notifications`, { params });
        return response.data;
    },

    // Create a new notification
    create: async (notification) => {
        const response = await axios.post(`${API_URL}/api/notifications`, notification);
        return response.data;
    },

    // Mark notification as read
    markAsRead: async (id) => {
        const response = await axios.patch(`${API_URL}/api/notifications/${id}/read`);
        return response.data;
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        const response = await axios.patch(`${API_URL}/api/notifications/read-all`);
        return response.data;
    },

    // Delete old notifications (cleanup)
    cleanup: async () => {
        const response = await axios.delete(`${API_URL}/api/notifications/cleanup`);
        return response.data;
    }
};

export default notificationApi;
