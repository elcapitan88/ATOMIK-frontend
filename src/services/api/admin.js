import axiosInstance from '../axiosConfig';

/**
 * Admin API service for admin dashboard operations
 */
class AdminService {
  /**
   * Get overview statistics for admin dashboard
   * @returns {Promise} Overview statistics including users, signups, trades, etc.
   */
  async getOverviewStats() {
    try {
      const response = await axiosInstance.get('/api/v1/admin/overview/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed user metrics
   * @returns {Promise} User metrics including growth rate, tier distribution
   */
  async getUserMetrics() {
    try {
      const response = await axiosInstance.get('/api/v1/admin/metrics/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      throw error;
    }
  }

  /**
   * Get system status
   * @returns {Promise} System health status for various services
   */
  async getSystemStatus() {
    try {
      const response = await axiosInstance.get('/api/v1/admin/system/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching system status:', error);
      throw error;
    }
  }

  /**
   * Get feature flag statistics
   * @returns {Promise} Feature flag stats including total, enabled, beta features
   */
  async getFeatureFlagStats() {
    try {
      const response = await axiosInstance.get('/api/v1/beta/admin/features/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching feature flag stats:', error);
      // Return default stats if API fails (auth issues, server down, etc.)
      if (error.response?.status === 403 || error.response?.status === 401) {
        // User doesn't have admin access, return minimal stats
        return {
          total_features: 8,
          enabled_features: 1,
          beta_features: 6,
          disabled_features: 1
        };
      }
      // Other errors, return empty stats
      return {
        total_features: 0,
        enabled_features: 0,
        beta_features: 0,
        disabled_features: 0
      };
    }
  }

  /**
   * Get recent activity (placeholder - would need backend implementation)
   * @returns {Promise} Recent system activity
   */
  async getRecentActivity() {
    // This would need a backend endpoint to be implemented
    // For now, return mock data
    return [
      { type: "signup", message: "New user registered", time: "2 min ago" },
      { type: "webhook", message: "Webhook processing delay detected", time: "15 min ago", status: "warning" },
      { type: "trade", message: "Large trade executed ($25,000)", time: "32 min ago" },
      { type: "user", message: "User password reset requested", time: "1 hour ago" },
      { type: "webhook", message: "TradingView webhook integration updated", time: "3 hours ago" },
      { type: "signup", message: "5 new users from marketing campaign", time: "5 hours ago" }
    ];
  }

  /**
   * Get complete user data with roles, subscriptions, and account info
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} Complete user data
   */
  async getUsersComplete(params = {}) {
    try {
      const response = await axiosInstance.get('/api/v1/admin/users/complete', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching complete users data:', error);
      throw error;
    }
  }

  /**
   * Assign a role to a user
   * @param {number} userId - User ID
   * @param {Object} roleData - Role assignment data
   * @returns {Promise} Success response
   */
  async assignUserRole(userId, roleData) {
    try {
      const response = await axiosInstance.post(`/api/v1/admin/users/${userId}/role`, roleData);
      return response.data;
    } catch (error) {
      console.error('Error assigning user role:', error);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   * @param {number} userId - User ID
   * @param {string} roleName - Role name to remove
   * @returns {Promise} Success response
   */
  async removeUserRole(userId, roleName) {
    try {
      const response = await axiosInstance.delete(`/api/v1/admin/users/${userId}/role/${roleName}`);
      return response.data;
    } catch (error) {
      console.error('Error removing user role:', error);
      throw error;
    }
  }

  /**
   * Toggle beta tester access for a user
   * @param {number} userId - User ID
   * @param {boolean} isBeta - Beta access status
   * @returns {Promise} Success response
   */
  async toggleBetaAccess(userId, isBeta) {
    try {
      const response = await axiosInstance.post(`/api/v1/admin/users/${userId}/beta`, { is_beta: isBeta });
      return response.data;
    } catch (error) {
      console.error('Error toggling beta access:', error);
      throw error;
    }
  }

  /**
   * Perform bulk operations on multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {string} operation - Operation type
   * @param {Object} operationData - Additional operation data
   * @returns {Promise} Success response
   */
  async bulkUserOperations(userIds, operation, operationData = null) {
    try {
      const response = await axiosInstance.post('/api/v1/admin/users/bulk', {
        user_ids: userIds,
        operation,
        operation_data: operationData
      });
      return response.data;
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      throw error;
    }
  }

  /**
   * Get current maintenance mode settings
   * @returns {Promise} Maintenance settings
   */
  async getMaintenanceSettings() {
    try {
      const response = await axiosInstance.get('/api/v1/admin/maintenance');
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
      throw error;
    }
  }

  /**
   * Update maintenance mode settings
   * @param {Object} settings - Maintenance settings
   * @param {boolean} settings.is_enabled - Whether maintenance mode is enabled
   * @param {string} settings.message - Maintenance message for users
   * @returns {Promise} Updated maintenance settings
   */
  async updateMaintenanceSettings(settings) {
    try {
      const response = await axiosInstance.put('/api/v1/admin/maintenance', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance settings:', error);
      throw error;
    }
  }

  /**
   * Check maintenance status (public endpoint, no auth required)
   * @returns {Promise} Maintenance status
   */
  async checkMaintenanceStatus() {
    try {
      const response = await axiosInstance.get('/api/v1/admin/maintenance/status');
      return response.data;
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      // Return default status if check fails
      return { is_enabled: false, message: null };
    }
  }
}

export default new AdminService(); 