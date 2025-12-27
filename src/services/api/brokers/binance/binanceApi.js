// Binance API Service
// Frontend API service for interacting with Binance broker endpoints

import axiosInstance from '@/services/axiosConfig';

const BINANCE_BASE = '/api/v1/brokers/binance';

/**
 * Binance API Service
 * Handles all frontend API calls to the Binance broker backend
 */
export const binanceApi = {
    /**
     * Test API key validity before saving
     * @param {string} apiKey - Binance API key
     * @param {string} secretKey - Binance secret key
     * @param {string} marketType - 'spot' or 'futures'
     * @returns {Promise<Object>} Test result with account type
     */
    testApiKey: async (apiKey, secretKey, marketType = 'spot') => {
        const response = await axiosInstance.post(`${BINANCE_BASE}/test-api-key`, {
            apiKey: `${apiKey}:${secretKey}`,
            marketType
        });
        return response.data;
    },

    /**
     * Save API key and connect account
     * @param {string} apiKey - Binance API key
     * @param {string} secretKey - Binance secret key
     * @param {string} marketType - 'spot' or 'futures'
     * @returns {Promise<Object>} Connection result with account_id
     */
    saveApiKey: async (apiKey, secretKey, marketType = 'spot') => {
        const response = await axiosInstance.post(`${BINANCE_BASE}/api-key`, {
            apiKey: `${apiKey}:${secretKey}`,
            marketType
        });
        return response.data;
    },

    /**
     * Get account information
     * @param {string} accountId - Binance account ID
     * @returns {Promise<Object>} Account info including balance, permissions
     */
    getAccountInfo: async (accountId) => {
        const response = await axiosInstance.get(`${BINANCE_BASE}/account/${accountId}/info`);
        return response.data;
    },

    /**
     * Get current positions/balances
     * @param {string} accountId - Binance account ID
     * @returns {Promise<Object>} Positions with count
     */
    getPositions: async (accountId) => {
        const response = await axiosInstance.get(`${BINANCE_BASE}/positions/${accountId}`);
        return response.data;
    },

    /**
     * Get open orders
     * @param {string} accountId - Binance account ID
     * @returns {Promise<Object>} Orders with count
     */
    getOrders: async (accountId) => {
        const response = await axiosInstance.get(`${BINANCE_BASE}/orders/${accountId}`);
        return response.data;
    },

    /**
     * Get account balances
     * @param {string} accountId - Binance account ID
     * @param {string|null} asset - Optional specific asset filter
     * @returns {Promise<Object>} Balances
     */
    getBalance: async (accountId, asset = null) => {
        const params = asset ? { asset } : {};
        const response = await axiosInstance.get(`${BINANCE_BASE}/balance/${accountId}`, { params });
        return response.data;
    },

    /**
     * Get exchange information
     * @param {string} accountId - Binance account ID
     * @returns {Promise<Object>} Exchange info including rate limits
     */
    getExchangeInfo: async (accountId) => {
        const response = await axiosInstance.get(`${BINANCE_BASE}/exchange-info/${accountId}`);
        return response.data;
    },

    /**
     * Place an order
     * @param {string} accountId - Binance account ID
     * @param {Object} orderData - Order parameters
     * @returns {Promise<Object>} Order result
     */
    placeOrder: async (accountId, orderData) => {
        const response = await axiosInstance.post(`${BINANCE_BASE}/order/${accountId}`, orderData);
        return response.data;
    },

    /**
     * Cancel an order
     * @param {string} accountId - Binance account ID
     * @param {string} symbol - Trading pair symbol
     * @param {string} orderId - Order ID to cancel
     * @returns {Promise<Object>} Cancellation result
     */
    cancelOrder: async (accountId, symbol, orderId) => {
        const response = await axiosInstance.delete(`${BINANCE_BASE}/order/${accountId}`, {
            params: { symbol, orderId }
        });
        return response.data;
    },

    /**
     * Health check for Binance integration
     * @returns {Promise<Object>} Health status
     */
    healthCheck: async () => {
        const response = await axiosInstance.get(`${BINANCE_BASE}/health`);
        return response.data;
    }
};

export default binanceApi;
