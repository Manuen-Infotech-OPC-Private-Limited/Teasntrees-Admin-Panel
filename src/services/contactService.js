import api from '../utils/api';

const contactService = {
    // Get all messages
    getMessages: async (params) => {
        const response = await api.get('/v1/admin/contact', { params });
        return response.data;
    },

    // Update message status
    updateMessageStatus: async (id, status) => {
        const response = await api.patch(`/v1/admin/contact/${id}/status`, { status });
        return response.data;
    },

    // Delete message
    deleteMessage: async (id) => {
        const response = await api.delete(`/v1/admin/contact/${id}`);
        return response.data;
    }
};

export default contactService;
