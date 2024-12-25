// services/api/brokers/tradovate/tradovateApi.js
import { BaseBrokerApi } from '../baseApi';
import axiosInstance from '@/services/axiosConfig';
import { TradovateEnvironment } from './tradovateTypes';

class TradovateApi extends BaseBrokerApi {
  constructor() {
    super('tradovate');
  }

  // Implement standard broker interface
  async fetchAccounts() {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/fetch-accounts/`)
    );
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

  async removeAccount(accountId) {
    return this.errorHandler(() => 
      axiosInstance.delete(`${this.baseUrl}/remove-account/${accountId}/`)
    );
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
export default new TradovateApi();