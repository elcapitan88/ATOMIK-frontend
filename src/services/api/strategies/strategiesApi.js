// src/services/api/strategies/strategiesApi.js
import axiosInstance from '@/services/axiosConfig';

class StrategiesApi {
  constructor() {
    this.baseUrl = '/api';
  }

  async listStrategies() {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/strategies/list/`)
    );
  }

  async activateStrategy(strategyData) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/strategies/activate/`, strategyData)
    );
  }

  async toggleStrategy(strategyId) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/strategies/toggle/${strategyId}/`)
    );
  }

  async deleteStrategy(strategyId) {
    return this.errorHandler(() => 
      axiosInstance.delete(`${this.baseUrl}/strategies/delete/${strategyId}/`)
    );
  }

  async errorHandler(apiCall) {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      console.error('Strategies API Error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const strategiesApi = new StrategiesApi();