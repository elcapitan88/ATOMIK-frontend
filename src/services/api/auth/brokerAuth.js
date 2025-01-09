// src/services/api/auth/brokerAuth.js
import axiosInstance from '@/services/axiosConfig';

class BrokerAuthService {
    constructor() {
        this.baseUrl = '/api/v1/brokers';
    }

    /**
     * Initialize OAuth flow for Tradovate
     * @param {string} environment - 'demo' or 'live'
     * @returns {Promise<{auth_url: string}>}
     */
    async initiateTradovateOAuth(environment) {
        try {
            const response = await axiosInstance.post(`${this.baseUrl}/tradovate/connect`, {
                environment,
                credentials: {
                    type: 'oauth'
                }
            });

            if (!response.data?.auth_url) {
                throw new Error('Invalid response: Missing authentication URL');
            }

            return response.data;
        } catch (error) {
            console.error('OAuth initialization failed:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Handle OAuth callback after successful authorization
     * @param {string} code - Authorization code from OAuth provider
     * @returns {Promise<Object>}
     */
    async handleOAuthCallback(code) {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/tradovate/callback`, {
                params: { code }
            });
            return response.data;
        } catch (error) {
            console.error('OAuth callback failed:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Validate broker connection status
     * @param {string} accountId 
     * @returns {Promise<Object>}
     */
    async validateConnection(accountId) {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/accounts/${accountId}/validate`);
            return response.data;
        } catch (error) {
            console.error('Connection validation failed:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Disconnect a broker account
     * @param {string} accountId 
     * @returns {Promise<Object>}
     */
    async disconnectAccount(accountId) {
        try {
            const response = await axiosInstance.delete(`${this.baseUrl}/accounts/${accountId}`);
            return response.data;
        } catch (error) {
            console.error('Account disconnection failed:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Refresh broker access tokens
     * @param {string} accountId 
     * @returns {Promise<Object>}
     */
    async refreshTokens(accountId) {
        try {
            const response = await axiosInstance.post(`${this.baseUrl}/accounts/${accountId}/refresh`);
            return response.data;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get broker account status
     * @param {string} accountId 
     * @returns {Promise<Object>}
     */
    async getAccountStatus(accountId) {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/accounts/${accountId}/status`);
            return response.data;
        } catch (error) {
            console.error('Failed to get account status:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Standard error handler for broker auth operations
     * @private
     * @param {Error} error 
     * @returns {Error}
     */
    handleError(error) {
        if (error.response) {
            // Handle specific HTTP error codes
            switch (error.response.status) {
                case 401:
                    return new Error('Authentication failed. Please try again.');
                case 403:
                    return new Error('Access denied. Please check your permissions.');
                case 404:
                    return new Error('Requested resource not found.');
                case 422:
                    return new Error(error.response.data.detail || 'Invalid request data.');
                case 429:
                    return new Error('Too many requests. Please try again later.');
                case 500:
                    return new Error('Server error. Please try again later.');
                default:
                    return new Error(error.response.data?.detail || 'An unexpected error occurred.');
            }
        }

        if (error.request) {
            // Network error
            return new Error('Network error. Please check your connection.');
        }

        // Default error
        return new Error(error.message || 'An unexpected error occurred.');
    }

    /**
     * Check if environment is supported by broker
     * @param {string} brokerId 
     * @param {string} environment 
     * @returns {Promise<boolean>}
     */
    async isEnvironmentSupported(brokerId, environment) {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/${brokerId}/environments`);
            return response.data.supported_environments.includes(environment);
        } catch (error) {
            console.error('Environment check failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const brokerAuthService = {
  initiateTradovateOAuth: async (brokerId, request) => {
    try {
      const response = await axiosInstance.post(`/api/v1/brokers/${brokerId}/connect`, request);
      return response.data;
    } catch (error) {
      console.error('OAuth initialization failed:', error);
      throw error;
    }
  },

  validateConnection: async (accountId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/brokers/accounts/${accountId}/validate`);
      return response.data;
    } catch (error) {
      console.error('Connection validation failed:', error);
      throw error;
    }
  }
};

// Export class for potential direct usage
export default BrokerAuthService;