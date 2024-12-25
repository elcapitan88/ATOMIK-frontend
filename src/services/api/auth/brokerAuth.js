// services/api/brokerAuth.js
import axiosInstance from '@/services/axiosConfig';

export const brokerAuthService = {
  initiateTradovateOAuth: async (environment) => {
    const response = await axiosInstance.post('/api/tradovate/initiate-oauth/', { environment });
    return response.data;
  },

  handleOAuthCallback: async (code) => {
    const response = await axiosInstance.get('/api/tradovate/callback/', { params: { code } });
    return response.data;
  }
};