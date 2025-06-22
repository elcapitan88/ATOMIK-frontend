// src/services/affiliateService.js
import axiosInstance from './axiosConfig';
import logger from '@/utils/logger';
import { storage } from '../utils/helpers/localStorage';

// Define base URL as a constant to avoid class property issues
const AFFILIATE_BASE_URL = '/api/v1/affiliate';

class AffiliateService {
  constructor() {
    // Explicitly set baseURL and ensure it's not undefined
    this.baseURL = AFFILIATE_BASE_URL;
    
    // Referral tracking constants
    this.REFERRAL_KEY = 'atomik_referral_code';
    this.REFERRAL_EXPIRY_KEY = 'atomik_referral_expiry';
    this.REFERRAL_EXPIRY_DAYS = 15;
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

  // ===== REFERRAL TRACKING METHODS =====

  /**
   * Capture referral code from URL parameters
   * @returns {string|null} Captured referral code or null
   */
  captureReferralFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      // Check for both 'via' (Rewardful standard) and 'ref' (legacy) parameters
      const referralCode = urlParams.get('via') || urlParams.get('ref');
      
      if (referralCode) {
        const parameterUsed = urlParams.get('via') ? 'via' : 'ref';
        logger.info(`Referral code captured from URL (${parameterUsed}):`, referralCode);
        this.storeReferralCode(referralCode);
        
        // Let Rewardful process the URL parameter first, then clean it
        const self = this;
        if (window.rewardful) {
          window.rewardful('ready', function() {
            if (window.Rewardful && window.Rewardful.referral) {
              logger.info('Rewardful detected referral:', window.Rewardful.referral);
            } else {
              logger.info('Rewardful loaded but no referral detected');
            }
            // Clean URL after Rewardful has processed it
            self.cleanURLParameter();
          });
        } else {
          // If Rewardful isn't available, clean URL immediately
          this.cleanURLParameter();
        }
        return referralCode;
      }
      
      return null;
    } catch (error) {
      logger.error('Error capturing referral from URL:', error);
      return null;
    }
  }

  /**
   * Store referral code with expiry
   * @param {string} referralCode - Referral code to store
   */
  storeReferralCode(referralCode) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.REFERRAL_EXPIRY_DAYS);
      
      storage.set(this.REFERRAL_KEY, referralCode);
      storage.set(this.REFERRAL_EXPIRY_KEY, expiryDate.getTime());
      
      logger.info(`Referral code stored: ${referralCode}, expires: ${expiryDate}`);
    } catch (error) {
      logger.error('Error storing referral code:', error);
    }
  }

  /**
   * Get stored referral code if not expired
   * @returns {string|null} Referral code or null if expired/not found
   */
  getReferralCode() {
    try {
      const expiryTime = storage.get(this.REFERRAL_EXPIRY_KEY);
      
      if (expiryTime && new Date().getTime() > expiryTime) {
        logger.info('Referral code expired, clearing storage');
        this.clearReferralCode();
        return null;
      }
      
      return storage.get(this.REFERRAL_KEY);
    } catch (error) {
      logger.error('Error getting referral code:', error);
      return null;
    }
  }

  /**
   * Clear stored referral code
   */
  clearReferralCode() {
    try {
      storage.remove(this.REFERRAL_KEY);
      storage.remove(this.REFERRAL_EXPIRY_KEY);
      logger.info('Referral code cleared from storage');
    } catch (error) {
      logger.error('Error clearing referral code:', error);
    }
  }

  /**
   * Remove referral parameter from URL
   */
  cleanURLParameter() {
    try {
      const url = new URL(window.location);
      // Clean both 'via' and 'ref' parameters
      url.searchParams.delete('via');
      url.searchParams.delete('ref');
      
      window.history.replaceState({}, document.title, url.pathname + url.search);
      logger.info('Referral parameters cleaned from URL');
    } catch (error) {
      logger.error('Error cleaning URL parameter:', error);
    }
  }

  /**
   * Track referral click with Rewardful and backend
   * @param {string} referralCode - Referral code to track
   */
  async trackReferralClick(referralCode) {
    try {
      // Rewardful tracks clicks automatically, just verify it's working
      if (window.rewardful) {
        window.rewardful('ready', function() {
          if (window.Rewardful && window.Rewardful.referral) {
            logger.info('Rewardful click tracking active for referral:', window.Rewardful.referral);
          }
        });
      }
      
      // Also track with our backend for analytics
      await this.trackClickInBackend(referralCode);
    } catch (error) {
      logger.error('Error tracking referral click:', error);
    }
  }

  /**
   * Track click in backend for analytics
   * @param {string} referralCode - Referral code to track
   */
  async trackClickInBackend(referralCode) {
    try {
      const clickData = {
        referral_code: referralCode,
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent
      };
      
      const response = await axiosInstance.post(`${AFFILIATE_BASE_URL}/track-click`, clickData);
      logger.info('Click tracked in backend:', response.data);
    } catch (error) {
      logger.error('Error tracking click in backend:', error);
      // Don't throw error - tracking failure shouldn't break user experience
    }
  }

  /**
   * Track conversion with Rewardful
   * @param {Object} conversionData - Conversion data
   * @param {number} conversionData.amount - Sale amount
   * @param {string} conversionData.email - Customer email
   * @param {string} conversionData.orderId - Order/subscription ID
   * @returns {boolean} True if conversion was tracked
   */
  trackConversion(conversionData) {
    try {
      const referralCode = this.getReferralCode();
      
      if (referralCode && window.rewardful) {
        const conversionPayload = {
          sale_amount: conversionData.amount,
          email: conversionData.email,
          order_id: conversionData.orderId,
          referral_code: referralCode,
          ...conversionData
        };
        
        window.rewardful('convert', conversionPayload);
        logger.info('Conversion tracked with referral:', { referralCode, ...conversionPayload });
        
        return true;
      }
      
      logger.info('No referral code found for conversion tracking');
      return false;
    } catch (error) {
      logger.error('Error tracking conversion:', error);
      return false;
    }
  }

  /**
   * Initialize referral tracking on page load
   * @returns {string|null} Active referral code
   */
  async initializeReferralTracking() {
    try {
      logger.info('Initializing referral tracking');
      
      const capturedReferral = this.captureReferralFromURL();
      
      if (capturedReferral) {
        await this.trackReferralClick(capturedReferral);
      } else {
        const existingReferral = this.getReferralCode();
        if (existingReferral) {
          logger.info('Existing referral code found:', existingReferral);
        }
      }
      
      return capturedReferral || this.getReferralCode();
    } catch (error) {
      logger.error('Error initializing referral tracking:', error);
      return null;
    }
  }

  /**
   * Update payout method
   * @param {string} payoutMethod - 'paypal' or 'wise'
   * @param {Object} payoutDetails - Method-specific details
   * @returns {Promise<Object>} Success response
   */
  async updatePayoutMethod(payoutMethod, payoutDetails) {
    try {
      logger.info('Updating payout method:', { payoutMethod });
      const response = await axiosInstance.put(`${AFFILIATE_BASE_URL}/payout-method`, {
        payout_method: payoutMethod,
        payout_details: payoutDetails
      });
      logger.info('Payout method updated successfully');
      return response.data;
    } catch (error) {
      logger.error('Error updating payout method:', error);
      throw error;
    }
  }

  /**
   * Get payout history
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Paginated payout history
   */
  async getPayoutHistory({ page = 1, limit = 12 } = {}) {
    try {
      const params = { page, limit };
      logger.info('Fetching payout history', params);
      const response = await axiosInstance.get(`${AFFILIATE_BASE_URL}/payout-history`, { params });
      logger.info('Payout history fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Error fetching payout history:', error);
      throw error;
    }
  }

  /**
   * Get debug information for referral tracking
   * @returns {Object} Debug information
   */
  getReferralDebugInfo() {
    return {
      referralCode: this.getReferralCode(),
      expiryTime: storage.get(this.REFERRAL_EXPIRY_KEY),
      isExpired: storage.get(this.REFERRAL_EXPIRY_KEY) ? new Date().getTime() > storage.get(this.REFERRAL_EXPIRY_KEY) : null,
      rewardfulLoaded: !!window.rewardful,
      expiryDays: this.REFERRAL_EXPIRY_DAYS
    };
  }

  // ===== FORMATTING METHODS =====

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