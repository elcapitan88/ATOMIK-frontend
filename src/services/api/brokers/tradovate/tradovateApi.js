// services/api/brokers/tradovate/tradovateApi.js
import BaseApi from '../baseApi';
import axiosInstance from '@/services/axiosConfig';
import { TradovateEnvironment } from './tradovateTypes';

class TradovateApi extends BaseApi {
  constructor() {
    super('tradovate');
  }

  // Implement standard broker interface
  async fetchAccounts() {
    try {
        console.log('TradovateApi: Initiating account fetch');
        const response = await axiosInstance.get('/api/v1/brokers/accounts');
        
        if (!response || !response.data) {
            throw new Error('Invalid response from server');
        }

        console.log('TradovateApi: Raw response:', response);

        // Process accounts
        const accounts = Array.isArray(response.data) ? response.data : [];
        
        // Transform the response data - ADDED nickname field here
        const processedAccounts = accounts.map(acc => ({
            account_id: acc.account_id,
            broker_id: acc.broker_id || 'tradovate',
            name: acc.name || 'Unknown Account',
            nickname: acc.nickname, 
            environment: acc.environment || 'demo',
            status: acc.status || 'inactive',
            balance: parseFloat(acc.balance || 0).toFixed(2),
            active: Boolean(acc.active),
            is_token_expired: Boolean(acc.is_token_expired),
            last_connected: acc.last_connected || null,
            error_message: acc.error_message || null,
            has_credentials: Boolean(acc.has_credentials),
            token_expires_at: acc.token_expires_at || null
        }));

        console.log('TradovateApi: Processed accounts:', processedAccounts);
        return processedAccounts;

    } catch (error) {
        console.error('TradovateApi: Error fetching accounts:', error);
        throw error?.response?.data?.detail || 'Failed to fetch accounts';
    }
}

  async getAccountPositions(accountId) {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/positions/${accountId}/`)
    );
  }

  async getAccountOrders(accountId) {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/get-account-orders/${accountId}/`)
    );
  }

  async getAccountStatus(accountId) {
    try {
        const response = await axiosInstance.get(
            `/api/v1/brokers/accounts/${accountId}/status`
        );
        return response.data;
    } catch (error) {
        console.error('Error getting account status:', error);
        throw error?.response?.data?.detail || 'Failed to get account status';
    }
}

async removeAccount(accountId) {
  try {
      const response = await axiosInstance.delete(
          `/api/v1/brokers/accounts/${accountId}`
      );
      return response.data;
  } catch (error) {
      console.error('Error removing account:', error);
      throw error?.response?.data?.detail || 'Failed to remove account';
  }
}


  async toggleAccount(accountId) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/toggle-account/${accountId}/`)
    );
  }

  async refreshToken() {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/refresh-token/`)
    );
  }

  // Tradovate-specific methods
  async initiateOAuth(environment = TradovateEnvironment.DEMO) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/initiate-oauth/`, { environment })
    );
  }

  async handleOAuthCallback(code) {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/callback/?code=${code}`)
    );
  }

  // Additional Tradovate-specific methods can be added here
  async checkAccountCredentials(accountId) {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/check-credentials/${accountId}/`)
    );
  }

  async getMarketData(symbol) {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/market-data/${symbol}/`)
    );
  }
}

// Create and export a singleton instance
const tradovateApi = new TradovateApi();
export default tradovateApi;