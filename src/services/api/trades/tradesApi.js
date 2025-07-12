// src/services/api/trades/tradesApi.js
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

/**
 * Trades API service for accessing trade data from the new trades endpoints
 */
export class TradesApi {
  
  /**
   * Get all currently open trades for the authenticated user
   * @returns {Promise<Array>} Array of live trade objects
   */
  static async getLiveTrades() {
    try {
      const response = await axiosInstance.get('/api/v1/trades/live');
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching live trades:', error);
      throw new Error('Failed to fetch live trades');
    }
  }

  /**
   * Get historical (closed) trades with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {string} filters.symbol - Symbol filter
   * @param {number} filters.strategy_id - Strategy ID filter
   * @param {number} filters.days_back - Number of days to look back
   * @param {boolean} filters.profitable_only - Show only profitable trades
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.per_page - Items per page (default: 50)
   * @returns {Promise<Object>} Paginated historical trades response
   */
  static async getHistoricalTrades(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      if (filters.symbol) params.append('symbol', filters.symbol);
      if (filters.strategy_id) params.append('strategy_id', filters.strategy_id);
      if (filters.days_back) params.append('days_back', filters.days_back);
      // Only add profitable_only if it's explicitly true or false, not null
      if (filters.profitable_only !== null && filters.profitable_only !== undefined) {
        params.append('profitable_only', filters.profitable_only);
      }
      if (filters.page) params.append('page', filters.page);
      if (filters.per_page) params.append('per_page', filters.per_page);

      const response = await axiosInstance.get(`/api/v1/trades/historical?${params.toString()}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching historical trades:', error);
      throw new Error('Failed to fetch historical trades');
    }
  }

  /**
   * Get detailed information about a specific trade
   * @param {number} tradeId - Trade ID
   * @returns {Promise<Object>} Trade detail object with executions
   */
  static async getTradeDetail(tradeId) {
    try {
      const response = await axiosInstance.get(`/api/v1/trades/${tradeId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching trade detail for ${tradeId}:`, error);
      throw new Error('Failed to fetch trade details');
    }
  }

  /**
   * Manually close a trade
   * @param {number} tradeId - Trade ID to close
   * @param {Object} options - Close options
   * @param {number} options.exit_price - Optional exit price override
   * @param {string} options.notes - Optional closing notes
   * @returns {Promise<Object>} Closed trade object
   */
  static async closeTrade(tradeId, options = {}) {
    try {
      const response = await axiosInstance.post(`/api/v1/trades/${tradeId}/close`, options);
      return response.data;
    } catch (error) {
      logger.error(`Error closing trade ${tradeId}:`, error);
      throw new Error('Failed to close trade');
    }
  }

  /**
   * Get trading performance summary
   * @param {number} days_back - Number of days to analyze (default: 30)
   * @returns {Promise<Object>} Performance metrics object
   */
  static async getPerformanceSummary(days_back = 30) {
    try {
      const response = await axiosInstance.get(`/api/v1/trades/performance/summary?days_back=${days_back}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching performance summary:', error);
      throw new Error('Failed to fetch performance summary');
    }
  }

  /**
   * Get list of symbols that the user has traded
   * @param {number} days_back - Number of days to look back (default: 30)
   * @returns {Promise<Array>} Array of symbol strings
   */
  static async getTradedSymbols(days_back = 30) {
    try {
      const response = await axiosInstance.get(`/api/v1/trades/symbols/list?days_back=${days_back}`);
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching traded symbols:', error);
      throw new Error('Failed to fetch traded symbols');
    }
  }

  /**
   * Get list of strategies that have generated trades
   * @param {number} days_back - Number of days to look back (default: 30)
   * @returns {Promise<Array>} Array of strategy objects
   */
  static async getTradeStrategies(days_back = 30) {
    try {
      const response = await axiosInstance.get(`/api/v1/trades/strategies/list?days_back=${days_back}`);
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching trade strategies:', error);
      throw new Error('Failed to fetch trade strategies');
    }
  }
}

// Export individual functions for convenience
export const {
  getLiveTrades,
  getHistoricalTrades,
  getTradeDetail,
  closeTrade,
  getPerformanceSummary,
  getTradedSymbols,
  getTradeStrategies
} = TradesApi;

export default TradesApi;