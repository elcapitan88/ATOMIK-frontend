// src/services/api/auth/brokerAuth.js
import axiosInstance from '@/services/axiosConfig';

class BrokerAuthService {
    constructor() {
        this.baseUrl = '/api/v1/brokers';
    }

    /**
     * Initialize OAuth flow for Tradovate
     * @param {string} environment - 'demo' or 'live'
     * @returns {Promise<{auth_url: string, state: string}>}
     */
    async initiateTradovateOAuth(environment) {
        try {
            console.log('Initiating OAuth for:', environment);

            const response = await axiosInstance.post(`${this.baseUrl}/tradovate/connect`, {
                environment: environment.toLowerCase()
            });

            console.log('OAuth response:', response.data);

            if (!response.data?.auth_url) {
                throw new Error('Invalid response: Missing authentication URL');
            }

            // Store auth state for verification
            if (response.data.state) {
                localStorage.setItem('oauth_state', response.data.state);
                localStorage.setItem('oauth_environment', environment);
                localStorage.setItem('oauth_timestamp', Date.now().toString());
            }

            return response.data;

        } catch (error) {
            console.error('OAuth initiation error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Handle OAuth callback after successful authorization
     * @param {string} code - Authorization code from OAuth provider
     * @param {string} state - State parameter for CSRF protection
     * @returns {Promise<Object>}
     */
    async handleOAuthCallback(code, state) {
        try {
            console.log('Processing OAuth callback:', { code, state });

            // Verify state matches what we stored
            const storedState = localStorage.getItem('oauth_state');
            const storedTimestamp = parseInt(localStorage.getItem('oauth_timestamp'));
            const environment = localStorage.getItem('oauth_environment');

            // Verify state and check if the stored timestamp is not older than 10 minutes
            if (state !== storedState || !storedTimestamp || 
                Date.now() - storedTimestamp > 600000) {
                throw new Error('Invalid or expired OAuth state');
            }

            const response = await axiosInstance.get(`${this.baseUrl}/tradovate/callback`, {
                params: { 
                    code,
                    state,
                    environment 
                }
            });

            console.log('OAuth callback response:', response.data);

            // Clear stored OAuth state
            this.clearOAuthState();

            return response.data;

        } catch (error) {
            console.error('OAuth callback failed:', error);
            this.clearOAuthState();
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
     * Clear OAuth state from localStorage
     * @private
     */
    clearOAuthState() {
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_environment');
        localStorage.removeItem('oauth_timestamp');
    }

    /**
     * Standard error handler for broker auth operations
     * @private
     */
    handleError(error) {
        console.error('API Error details:', {
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });

        if (error.response) {
            // Handle specific error status codes
            switch (error.response.status) {
                case 400:
                    return new Error(error.response.data?.detail || 'Invalid request parameters');
                case 401:
                    return new Error('Authentication token expired or invalid');
                case 403:
                    return new Error('Insufficient permissions for this operation');
                case 404:
                    return new Error('Requested resource not found');
                case 422:
                    return new Error(error.response.data?.detail || 'Invalid request data');
                case 500:
                    return new Error('Server error. Please try again later');
                default:
                    return new Error(error.response.data?.detail || 'An unexpected error occurred');
            }
        }

        if (error.request) {
            return new Error('Network error. Please check your connection');
        }

        return error;
    }
}

// Export singleton instance
export const brokerAuthService = new BrokerAuthService();

// Export class for potential direct usage or testing
export default BrokerAuthService;