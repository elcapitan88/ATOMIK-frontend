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
}

export default new AdminService(); 