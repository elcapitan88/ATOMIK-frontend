// src/services/api/strategies/unifiedStrategiesApi.js
/**
 * Unified Strategy API Service
 *
 * This replaces the separate webhook/engine strategy APIs with a single unified interface.
 * All strategies now use the execution_type field to differentiate between webhook and engine strategies.
 *
 * Migration from legacy:
 * - activateStrategy() -> createStrategy() with execution_type field
 * - configureEngineStrategy() -> createStrategy() with execution_type: 'engine'
 * - listStrategies() + listEngineStrategies() -> listStrategies() with optional filter
 * - updateStrategy() + updateEngineStrategy() -> updateStrategy()
 * - deleteStrategy() + deleteEngineStrategy() -> deleteStrategy()
 */

import axiosInstance from '@/services/axiosConfig';
import { storage } from '@/utils/helpers/localStorage';
import { handleApiError } from '@/utils/helpers/errorHandler';

const CACHE_KEY = 'unified_strategies';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class UnifiedStrategiesApi {
  constructor() {
    this.baseUrl = '/api/v1/strategies/unified';
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

  /**
   * Create a new strategy (webhook or engine)
   * @param {Object} strategyData - Strategy configuration
   * @param {string} strategyData.strategy_type - 'single' or 'multiple'
   * @param {string} strategyData.execution_type - 'webhook' or 'engine'
   * @param {string} strategyData.ticker - Trading symbol
   * @param {string} [strategyData.webhook_id] - For webhook strategies
   * @param {number} [strategyData.strategy_code_id] - For engine strategies
   * @param {string} [strategyData.account_id] - For single strategies
   * @param {number} [strategyData.quantity] - For single strategies
   * @param {string} [strategyData.leader_account_id] - For multiple strategies
   * @param {number} [strategyData.leader_quantity] - For multiple strategies
   * @param {Array} [strategyData.follower_accounts] - For multiple strategies
   */
  async createStrategy(strategyData) {
    try {
      // Ensure execution_type is set
      if (!strategyData.execution_type) {
        throw new Error('execution_type is required (webhook or engine)');
      }

      const response = await this.withRetry(() =>
        axiosInstance.post(this.baseUrl, strategyData)
      );

      this.clearCache();
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * List all strategies with optional filters
   * @param {Object} filters - Optional filters
   * @param {string} [filters.execution_type] - 'webhook' or 'engine'
   * @param {string} [filters.strategy_type] - 'single' or 'multiple'
   * @param {boolean} [filters.is_active] - Filter by active status
   * @param {string} [filters.ticker] - Filter by ticker
   * @param {boolean} useCache - Whether to use cached data
   */
  async listStrategies(filters = {}, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedStrategies();
        if (cached) {
          // Apply client-side filters if using cache
          return this.applyFilters(cached, filters);
        }
      }

      // Build query params
      const params = new URLSearchParams();
      if (filters.execution_type) params.append('execution_type', filters.execution_type);
      if (filters.strategy_type) params.append('strategy_type', filters.strategy_type);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      if (filters.ticker) params.append('ticker', filters.ticker);
      if (filters.account_id) params.append('account_id', filters.account_id);

      const response = await this.withRetry(() =>
        axiosInstance.get(`${this.baseUrl}?${params.toString()}`)
      );

      // Cache the unfiltered results
      if (!Object.keys(filters).length) {
        this.setCachedStrategies(response.data);
      }

      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Get a single strategy by ID
   * @param {number} strategyId - Strategy ID
   */
  async getStrategy(strategyId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.get(`${this.baseUrl}/${strategyId}`)
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Update a strategy (only updatable fields)
   * @param {number} strategyId - Strategy ID
   * @param {Object} updateData - Fields to update
   * @param {boolean} [updateData.is_active] - Active status
   * @param {number} [updateData.quantity] - For single strategies
   * @param {number} [updateData.leader_quantity] - For multiple strategies
   * @param {Array<number>} [updateData.follower_quantities] - For multiple strategies
   * @param {Array<string>} [updateData.market_schedule] - Market hours
   * @param {string} [updateData.description] - Strategy description
   */
  async updateStrategy(strategyId, updateData) {
    try {
      // Remove any fields that shouldn't be updated
      const allowedFields = [
        'is_active', 'quantity', 'leader_quantity',
        'follower_quantities', 'market_schedule', 'description', 'group_name'
      ];

      const cleanData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      const response = await this.withRetry(() =>
        axiosInstance.put(`${this.baseUrl}/${strategyId}`, cleanData)
      );

      this.clearCache();
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Delete a strategy
   * @param {number} strategyId - Strategy ID
   */
  async deleteStrategy(strategyId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.delete(`${this.baseUrl}/${strategyId}`)
      );

      this.clearCache();
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Toggle strategy active status
   * @param {number} strategyId - Strategy ID
   */
  async toggleStrategy(strategyId) {
    try {
      const response = await this.withRetry(() =>
        axiosInstance.post(`${this.baseUrl}/${strategyId}/toggle`)
      );

      this.clearCache();
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Validate strategy data before creation
   * @param {Object} strategyData - Strategy data to validate
   */
  async validateStrategy(strategyData) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/validate`, {
        strategy_data: strategyData
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Batch operations on multiple strategies
   * @param {Array<number>} strategyIds - List of strategy IDs
   * @param {string} operation - 'activate', 'deactivate', or 'delete'
   */
  async batchOperation(strategyIds, operation) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/batch`, {
        strategy_ids: strategyIds,
        operation
      });

      this.clearCache();
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Helper: Apply filters to cached data
   */
  applyFilters(strategies, filters) {
    let filtered = strategies;

    if (filters.execution_type) {
      filtered = filtered.filter(s => s.execution_type === filters.execution_type);
    }
    if (filters.strategy_type) {
      filtered = filtered.filter(s => s.strategy_type === filters.strategy_type);
    }
    if (filters.is_active !== undefined) {
      filtered = filtered.filter(s => s.is_active === filters.is_active);
    }
    if (filters.ticker) {
      filtered = filtered.filter(s => s.ticker === filters.ticker);
    }
    if (filters.account_id) {
      filtered = filtered.filter(s =>
        s.account_id === filters.account_id ||
        s.leader_account_id === filters.account_id ||
        s.follower_account_ids?.includes(filters.account_id)
      );
    }

    return filtered;
  }

  /**
   * Refresh strategies cache
   */
  async refreshStrategies() {
    this.clearCache();
    return this.listStrategies({}, false);
  }

  // Legacy compatibility methods (will be removed after migration)

  /**
   * @deprecated Use createStrategy with execution_type: 'webhook'
   */
  async activateStrategy(strategyData) {
    console.warn('activateStrategy is deprecated. Use createStrategy with execution_type: "webhook"');
    return this.createStrategy({
      ...strategyData,
      execution_type: 'webhook'
    });
  }

  /**
   * @deprecated Use createStrategy with execution_type: 'engine'
   */
  async configureEngineStrategy(strategyData) {
    console.warn('configureEngineStrategy is deprecated. Use createStrategy with execution_type: "engine"');
    return this.createStrategy({
      ...strategyData,
      execution_type: 'engine'
    });
  }

  /**
   * @deprecated Use listStrategies with execution_type filter
   */
  async listEngineStrategies() {
    console.warn('listEngineStrategies is deprecated. Use listStrategies with execution_type: "engine"');
    return this.listStrategies({ execution_type: 'engine' });
  }
}

export default new UnifiedStrategiesApi();