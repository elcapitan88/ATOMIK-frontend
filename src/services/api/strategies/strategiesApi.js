// src/services/api/strategies/strategiesApi.js

import axiosInstance from '@/services/axiosConfig';
import { storage } from '@/utils/helpers/localStorage';
import { handleApiError } from '@/utils/helpers/errorHandler';

const CACHE_KEY = 'strategies';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class StrategiesApi {
  constructor() {
    this.baseUrl = '/api/v1/strategies';
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

  // Cache management
  getCachedStrategies() {
    const cached = storage.get(CACHE_KEY);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  setCachedStrategies(data) {
    storage.set(CACHE_KEY, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    storage.remove(CACHE_KEY);
  }

  // API Methods
  async listStrategies(useCache = true) {
    try {
      if (useCache) {
        const cached = this.getCachedStrategies();
        if (cached) return cached;
      }
  
      // Use unified marketplace endpoint that works without auth and shows all strategies
      const response = await this.withRetry(() =>
        axiosInstance.get('/api/v1/marketplace/strategies/available')
      );
  
      // Extract strategies from unified response format
      const strategies = response.data?.strategies || response.data || [];
      this.setCachedStrategies(strategies);
      return strategies;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async activateStrategy(strategyData) {
    try {
      console.log('Activating strategy with data:', JSON.stringify(strategyData, null, 2));

        // Normalize the data before sending
        const normalizedData = strategyData.strategy_type === 'single' 
            ? {
                strategy_type: 'single',
                webhook_id: strategyData.webhook_id,
                ticker: strategyData.ticker,
                account_id: strategyData.account_id,
                quantity: Number(strategyData.quantity)
            }
            : {
                strategy_type: 'multiple',
                webhook_id: strategyData.webhook_id,
                ticker: strategyData.ticker,
                leader_account_id: strategyData.leader_account_id,
                leader_quantity: Number(strategyData.leader_quantity),
                follower_account_ids: strategyData.follower_account_ids,
                follower_quantities: strategyData.follower_quantities.map(Number),
                group_name: strategyData.group_name
            };

        const response = await this.withRetry(() =>
            axiosInstance.post(`${this.baseUrl}/activate`, normalizedData)
        );

        // Invalidate cache after creating new strategy
        this.clearCache();
        
        console.log('Strategy activation response:', response.data);
        return response.data;

    } catch (error) {
        console.error('Strategy activation error:', error);
        throw handleApiError(error);
    }
  }

  async updateStrategy(strategyId, updateData) {
    try {
      console.log('Updating strategy with data:', JSON.stringify(updateData, null, 2));
      
      const response = await this.withRetry(() =>
        axiosInstance.put(`${this.baseUrl}/${strategyId}`, updateData)
      );

      this.clearCache();
      console.log('Strategy update response:', response.data);
      return response.data;

    } catch (error) {
      console.error('Strategy update error:', error);
      throw handleApiError(error);
    }
  }

  async toggleStrategy(strategyId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/${strategyId}/toggle`)
      );
  
      this.clearCache();
      return response.data;  // Make sure the backend returns the updated strategy
  
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteStrategy(strategyId) {
    try {
      await this.withRetry(() =>
        axiosInstance.delete(`${this.baseUrl}/${strategyId}`)
      );

      this.clearCache();
      return true;

    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getStrategyStats(strategyId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.get(`${this.baseUrl}/${strategyId}/stats`)
      );

      return response.data;

    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Batch operations
  async batchToggleStrategies(strategyIds) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/batch/toggle`, { strategyIds })
      );

      this.clearCache();
      return response.data;

    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Helper method to force refresh data
  async refreshStrategies() {
    this.clearCache();
    return this.listStrategies(false);
  }

  // Strategy Engine API Methods
  async configureEngineStrategy(strategyData) {
    try {
      console.log('Configuring Engine strategy:', JSON.stringify(strategyData, null, 2));

      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/engine/configure`, strategyData)
      );

      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Engine strategy configuration error:', error);
      throw handleApiError(error);
    }
  }

  async listEngineStrategies() {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.get(`${this.baseUrl}/engine/list`)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateEngineStrategy(strategyId, updateData) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.put(`${this.baseUrl}/engine/${strategyId}`, updateData)
      );

      this.clearCache();
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteEngineStrategy(strategyId) {
    try {
      await this.withRetry(() =>
        axiosInstance.delete(`${this.baseUrl}/engine/${strategyId}`)
      );

      this.clearCache();
      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Validate strategy data before sending to API
  validateStrategyData(data) {
    const requiredFields = {
      single: ['strategy_type', 'webhook_id', 'ticker', 'account_id', 'quantity'],
      multiple: [
        'strategy_type', 
        'webhook_id', 
        'ticker', 
        'leader_account_id', 
        'follower_account_ids',
        'leader_quantity',
        'follower_quantity',
        'group_name'
      ]
    };

    const fields = requiredFields[data.strategy_type];
    if (!fields) {
      throw new Error('Invalid strategy type');
    }

    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Additional validation
    if (data.quantity && data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (data.strategy_type === 'multiple') {
      if (data.follower_account_ids.length === 0) {
        throw new Error('At least one follower account is required');
      }
      if (data.follower_account_ids.includes(data.leader_account_id)) {
        throw new Error('Leader account cannot be in follower accounts');
      }
    }

    return true;
  }
}

// Export singleton instance
export const strategiesApi = new StrategiesApi();

// Export class for potential direct usage
export default StrategiesApi;