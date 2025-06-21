// src/services/affiliateService.js
import axiosInstance from './axiosConfig';
import logger from '@/utils/logger';

// Define base URL as a constant to avoid class property issues
const AFFILIATE_BASE_URL = '/api/v1/affiliate';

class AffiliateService {
  constructor() {
    // Explicitly set baseURL and ensure it's not undefined
    this.baseURL = AFFILIATE_BASE_URL;
  }

  /**
   * Make a user become an affiliate
   * @returns {Promise<Object>} Affiliate data including referral link
   */
  async becomeAffiliate() {
    try {
      logger.info('Creating affiliate account');
      // Use constant instead of this.baseURL to avoid undefined issues
      const response = await axiosInstance.post(`${AFFILIATE_BASE_URL}/become-affiliate`);
      logger.info('Affiliate account created successfully');
      return response.data;
    } catch (error) {
      logger.error('Error creating affiliate account:', error);
      throw error;
    }
  }

  /**
   * Get affiliate dashboard data
   * @returns {Promise<Object>} Dashboard data with stats and recent referrals
   */
  async getDashboard() {
    try {
      logger.info('Fetching affiliate dashboard');
      // Use constant instead of this.baseURL to avoid undefined issues
      const response = await axiosInstance.get(`${AFFILIATE_BASE_URL}/dashboard`);
      logger.info('Affiliate dashboard fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Error fetching affiliate dashboard:', error);
      throw error;
    }
  }

  /**
   * Get paginated referrals
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @returns {Promise<Object>} Paginated referrals data
   */
  async getReferrals({ page = 1, limit = 20, status = null } = {}) {
    try {
      const params = { page, limit };
      if (status) params.status_filter = status;

      logger.info('Fetching affiliate referrals', params);
      // Use constant instead of this.baseURL to avoid undefined issues
      const response = await axiosInstance.get(`${AFFILIATE_BASE_URL}/referrals`, { params });
      logger.info('Affiliate referrals fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Error fetching affiliate referrals:', error);
      throw error;
    }
  }

  /**
   * Get detailed affiliate statistics
   * @returns {Promise<Object>} Detailed stats
   */
  async getStats() {
    try {
      logger.info('Fetching affiliate stats');
      // Use constant instead of this.baseURL to avoid undefined issues
      const response = await axiosInstance.get(`${AFFILIATE_BASE_URL}/stats`);
      logger.info('Affiliate stats fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Error fetching affiliate stats:', error);
      throw error;
    }
  }

  /**
   * Deactivate affiliate account
   * @returns {Promise<Object>} Success message
   */
  async deactivateAffiliate() {
    try {
      logger.info('Deactivating affiliate account');
      // Use constant instead of this.baseURL to avoid undefined issues
      const response = await axiosInstance.delete(`${AFFILIATE_BASE_URL}/deactivate`);
      logger.info('Affiliate account deactivated successfully');
      return response.data;
    } catch (error) {
      logger.error('Error deactivating affiliate account:', error);
      throw error;
    }
  }

  /**
   * Copy referral link to clipboard
   * @param {string} referralLink - The referral link to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyReferralLink(referralLink) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralLink);
        logger.info('Referral link copied to clipboard');
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (result) {
          logger.info('Referral link copied to clipboard (fallback)');
          return true;
        } else {
          throw new Error('Failed to copy to clipboard');
        }
      }
    } catch (error) {
      logger.error('Error copying referral link:', error);
      throw error;
    }
  }

  /**
   * Format currency value
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: USD)
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    } catch (error) {
      logger.error('Error formatting currency:', error);
      return `$${(amount || 0).toFixed(2)}`;
    }
  }

  /**
   * Format percentage value
   * @param {number} value - Value to format as percentage
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage string
   */
  formatPercentage(value, decimals = 1) {
    return `${(value || 0).toFixed(decimals)}%`;
  }

  /**
   * Format date
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      logger.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Get status badge color for referral status
   * @param {string} status - Referral status
   * @returns {string} Color scheme for badge
   */
  getStatusColor(status) {
    const colorMap = {
      'pending': 'yellow',
      'confirmed': 'green',
      'paid': 'blue',
      'cancelled': 'red'
    };
    return colorMap[status] || 'gray';
  }

  /**
   * Get status display text
   * @param {string} status - Referral status
   * @returns {string} Human-readable status
   */
  getStatusText(status) {
    const textMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'paid': 'Paid',
      'cancelled': 'Cancelled'
    };
    return textMap[status] || 'Unknown';
  }
}

// Create and export singleton instance
const affiliateService = new AffiliateService();
export default affiliateService;