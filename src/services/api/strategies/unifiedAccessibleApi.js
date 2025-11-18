// Unified API service for fetching all accessible strategies
// This replaces multiple separate API calls with a single unified endpoint

import axiosInstance from '@/services/axiosConfig';

class UnifiedAccessibleApi {
  constructor() {
    this.baseUrl = '/api/v1/strategies';
  }

  /**
   * Get all strategies accessible to the user for activation
   * Includes both webhook and engine strategies that are:
   * - Owned by the user
   * - Subscribed to (free or paid)
   * - Purchased
   *
   * @returns {Promise<Array>} List of accessible strategies
   */
  async getAccessibleStrategies() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/accessible`);

      console.log('[UnifiedAccessibleApi] Fetched accessible strategies:', {
        total: response.data.length,
        webhooks: response.data.filter(s => s.type === 'webhook').length,
        engines: response.data.filter(s => s.type === 'engine').length,
        owned: response.data.filter(s => s.access_type === 'owned').length,
        subscribed: response.data.filter(s => s.access_type === 'subscribed').length,
        purchased: response.data.filter(s => s.access_type === 'purchased').length
      });

      return response.data;
    } catch (error) {
      console.error('[UnifiedAccessibleApi] Error fetching accessible strategies:', error);
      throw error;
    }
  }

  /**
   * Helper to separate strategies by type
   *
   * @param {Array} strategies - List of strategies from getAccessibleStrategies
   * @returns {Object} Separated strategies { webhooks, engines }
   */
  separateByType(strategies) {
    return {
      webhooks: strategies.filter(s => s.type === 'webhook'),
      engines: strategies.filter(s => s.type === 'engine')
    };
  }

  /**
   * Helper to filter strategies by access type
   *
   * @param {Array} strategies - List of strategies
   * @param {String} accessType - 'owned', 'subscribed', or 'purchased'
   * @returns {Array} Filtered strategies
   */
  filterByAccess(strategies, accessType) {
    return strategies.filter(s => s.access_type === accessType);
  }
}

// Export singleton instance
export const unifiedAccessibleApi = new UnifiedAccessibleApi();
export default unifiedAccessibleApi;