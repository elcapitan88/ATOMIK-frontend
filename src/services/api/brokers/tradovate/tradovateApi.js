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
        // Use the correct endpoint from our API router
        const response = await axiosInstance.get('/api/v1/brokers/accounts');
        
        // Debug the response
        console.log('Raw API Response:', response.data);

        // Handle the case where response.data is directly the accounts array
        // or when it's wrapped in an 'accounts' property
        const accountsData = response.data.accounts || response.data || [];

        // Map and normalize the account data
        return accountsData.map(account => ({
            account_id: account.account_id,
            broker_id: account.broker_id || 'tradovate',
            name: account.name || 'Unknown Account',
            environment: account.environment || 'demo',
            status: account.status || 'inactive',
            balance: parseFloat(account.balance || 0),
            day_pnl: parseFloat(account.day_pnl || 0),
            active: Boolean(account.active),
            is_token_expired: Boolean(account.is_token_expired),
            last_connected: account.last_connected || null
        }));
    } catch (error) {
        console.error('Error in fetchAccounts:', error.response || error);
        throw error;
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
    return this.errorHandler(async () => 
        this.axiosInstance.get(`/api/v1/brokers/accounts/${accountId}/status`)
    );
}

async removeAccount(accountId) {
  try {
      const response = await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}`);
      
      // Log the response for debugging
      console.log('Delete account response:', response);
      
      // Return the response data
      return response.data;
  } catch (error) {
      // Log the error for debugging
      console.error('Error removing account:', error);
      
      // Throw error to be handled by the UI
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