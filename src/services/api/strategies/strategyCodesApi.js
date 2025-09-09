// src/services/api/strategies/strategyCodesApi.js

import axiosInstance from '@/services/axiosConfig';
import { handleApiError } from '@/utils/helpers/errorHandler';

class StrategyCodesApi {
  constructor() {
    this.baseUrl = '/api/v1/strategy-codes';
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async withRetry(apiCall) {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        if (error.response?.status === 401) {
          // Don't retry auth errors
          throw error;
        }
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
        );
      }
    }
    
    throw lastError;
  }

  // Strategy Code Management
  async createStrategyCode(strategyData) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(this.baseUrl, strategyData)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async listStrategyCodes() {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.get(`${this.baseUrl}/my-strategies`)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getStrategyCode(codeId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.get(`${this.baseUrl}/${codeId}`)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateStrategyCode(codeId, updateData) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.put(`${this.baseUrl}/${codeId}`, updateData)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteStrategyCode(codeId) {
    try {
      await this.withRetry(() =>
        axiosInstance.delete(`${this.baseUrl}/${codeId}`)
      );
      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async validateStrategyCode(codeData) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/validate`, codeData)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async activateStrategyCode(codeId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/${codeId}/activate`)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deactivateStrategyCode(codeId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/${codeId}/deactivate`)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// Export singleton instance
export const strategyCodesApi = new StrategyCodesApi();

// Export class for potential direct usage
export default StrategyCodesApi;