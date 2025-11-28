// services/api/ariaApi.js
import axiosInstance from '../axiosConfig';

/**
 * ARIA Assistant API Service
 * Handles all communication with the ARIA backend endpoints
 */

const ARIA_BASE_PATH = '/api/v1/aria';

export const ariaApi = {
  /**
   * Send a message to ARIA (text or voice)
   * @param {string} message - User's message or voice transcript
   * @param {string} inputType - 'text' or 'voice'
   * @param {Object} context - Additional context (optional)
   * @param {number} conversationId - Conversation ID (optional - creates new if not provided)
   * @returns {Promise} ARIA response with conversation_id
   */
  async sendMessage(message, inputType = 'text', context = null, conversationId = null) {
    console.log('[ARIA] API sendMessage called:', { message, inputType, context, conversationId });
    console.log('[ARIA] API endpoint:', `${ARIA_BASE_PATH}/chat`);
    try {
      const payload = {
        message,
        input_type: inputType,
        context
      };
      if (conversationId) {
        payload.conversation_id = conversationId;
      }
      const response = await axiosInstance.post(`${ARIA_BASE_PATH}/chat`, payload);
      console.log('[ARIA] API sendMessage success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API sendMessage error:', error);
      console.error('[ARIA] API error response:', error.response?.data);
      console.error('[ARIA] API error status:', error.response?.status);
      throw this.handleError(error);
    }
  },

  /**
   * Send voice command to ARIA (optimized endpoint)
   * @param {string} command - Voice command transcript
   * @returns {Promise} ARIA response
   */
  async sendVoiceCommand(command) {
    console.log('[ARIA] API sendVoiceCommand called:', command);
    try {
      const response = await axiosInstance.post(`${ARIA_BASE_PATH}/voice`, {
        message: command,
        input_type: 'voice'
      });
      console.log('[ARIA] API sendVoiceCommand success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API sendVoiceCommand error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Send confirmation response to ARIA
   * @param {number} interactionId - ID of the interaction requiring confirmation
   * @param {boolean} confirmed - Whether the user confirmed the action
   * @returns {Promise} ARIA response
   */
  async sendConfirmation(interactionId, confirmed) {
    console.log('[ARIA] API sendConfirmation called:', { interactionId, confirmed });
    try {
      const response = await axiosInstance.post(`${ARIA_BASE_PATH}/confirm`, {
        interaction_id: interactionId,
        confirmed
      });
      console.log('[ARIA] API sendConfirmation success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API sendConfirmation error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get user context for ARIA
   * @returns {Promise} User's trading context
   */
  async getUserContext() {
    console.log('[ARIA] API getUserContext called');
    try {
      const response = await axiosInstance.get(`${ARIA_BASE_PATH}/context`);
      console.log('[ARIA] API getUserContext success');
      return response.data;
    } catch (error) {
      console.error('[ARIA] API getUserContext error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get ARIA command examples and help
   * @returns {Promise} Examples and usage patterns
   */
  async getExamples() {
    try {
      const response = await axiosInstance.get(`${ARIA_BASE_PATH}/examples`);
      return response.data;
    } catch (error) {
      console.error('ARIA examples error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Check ARIA service health
   * @returns {Promise} Health status
   */
  async getHealthStatus() {
    try {
      const response = await axiosInstance.get(`${ARIA_BASE_PATH}/health`);
      return response.data;
    } catch (error) {
      console.error('ARIA health check error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get ARIA interaction analytics
   * @param {number} days - Number of days to look back (default 7)
   * @returns {Promise} Analytics data
   */
  async getAnalytics(days = 7) {
    try {
      const response = await axiosInstance.get(`${ARIA_BASE_PATH}/analytics/interactions`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('ARIA analytics error:', error);
      throw this.handleError(error);
    }
  },

  // ==================== Conversation Methods ====================

  /**
   * Get list of user's conversations (last 15 days)
   * @returns {Promise} Conversations list
   */
  async getConversations() {
    console.log('[ARIA] API getConversations called');
    try {
      const response = await axiosInstance.get(`${ARIA_BASE_PATH}/conversations`);
      console.log('[ARIA] API getConversations success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API getConversations error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get messages for a specific conversation with pagination
   * @param {number} conversationId - Conversation ID
   * @param {Object} options - Pagination options
   * @param {number} options.limit - Number of messages (default 30)
   * @param {number} options.before_id - Get messages before this ID
   * @returns {Promise} Messages and pagination info
   */
  async getMessages(conversationId, { limit = 30, before_id } = {}) {
    console.log('[ARIA] API getMessages called:', { conversationId, limit, before_id });
    try {
      const params = { limit };
      if (before_id) params.before_id = before_id;
      const response = await axiosInstance.get(
        `${ARIA_BASE_PATH}/conversations/${conversationId}/messages`,
        { params }
      );
      console.log('[ARIA] API getMessages success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API getMessages error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Create a new conversation
   * @returns {Promise} New conversation details
   */
  async createConversation() {
    console.log('[ARIA] API createConversation called');
    try {
      const response = await axiosInstance.post(`${ARIA_BASE_PATH}/conversations`);
      console.log('[ARIA] API createConversation success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API createConversation error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Rename a conversation
   * @param {number} conversationId - Conversation ID
   * @param {string} title - New title
   * @returns {Promise} Updated conversation
   */
  async renameConversation(conversationId, title) {
    console.log('[ARIA] API renameConversation called:', { conversationId, title });
    try {
      const response = await axiosInstance.patch(
        `${ARIA_BASE_PATH}/conversations/${conversationId}`,
        { title }
      );
      console.log('[ARIA] API renameConversation success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API renameConversation error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Delete (archive) a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise} Deletion confirmation
   */
  async deleteConversation(conversationId) {
    console.log('[ARIA] API deleteConversation called:', conversationId);
    try {
      const response = await axiosInstance.delete(
        `${ARIA_BASE_PATH}/conversations/${conversationId}`
      );
      console.log('[ARIA] API deleteConversation success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ARIA] API deleteConversation error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Start a voice session (future feature)
   * @returns {Promise} Session details
   */
  async startVoiceSession() {
    try {
      const response = await axiosInstance.post(`${ARIA_BASE_PATH}/voice/start-session`);
      return response.data;
    } catch (error) {
      console.error('ARIA voice session start error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * End a voice session (future feature)
   * @param {string} sessionId - Session ID to end
   * @returns {Promise} Session end confirmation
   */
  async endVoiceSession(sessionId) {
    try {
      const response = await axiosInstance.post(`${ARIA_BASE_PATH}/voice/end-session`, {
        session_id: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('ARIA voice session end error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Handle API errors and provide user-friendly messages
   * @param {Error} error - The error object
   * @returns {Error} Processed error with user-friendly message
   */
  handleError(error) {
    let message = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          message = data.detail || 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Authentication required. Please log in.';
          break;
        case 403:
          message = 'Access denied. You may need to upgrade your subscription.';
          break;
        case 404:
          message = 'ARIA service not found. Please try again later.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'ARIA service temporarily unavailable. Please try again.';
          break;
        case 503:
          message = 'ARIA service is currently down for maintenance.';
          break;
        default:
          message = data.detail || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      // Request made but no response received
      message = 'Unable to connect to ARIA. Please check your internet connection.';
    } else {
      // Something else happened
      message = error.message || 'An unexpected error occurred';
    }
    
    const processedError = new Error(message);
    processedError.originalError = error;
    processedError.isNetworkError = !error.response;
    processedError.status = error.response?.status;
    
    return processedError;
  }
};

/**
 * ARIA Command Helpers
 * Utility functions for common ARIA interactions
 */
export const ariaHelpers = {
  /**
   * Format strategy control commands
   * @param {string} strategyName - Name of the strategy
   * @param {string} action - 'activate' or 'deactivate'
   * @returns {string} Formatted command
   */
  formatStrategyCommand(strategyName, action) {
    const actionWord = action === 'activate' ? 'Turn on' : 'Turn off';
    return `${actionWord} my ${strategyName} strategy`;
  },

  /**
   * Format position query commands
   * @param {string} symbol - Stock/crypto symbol
   * @returns {string} Formatted command
   */
  formatPositionQuery(symbol) {
    return `What's my ${symbol.toUpperCase()} position?`;
  },

  /**
   * Format trade execution commands
   * @param {string} action - 'buy' or 'sell'
   * @param {number} quantity - Number of shares/contracts
   * @param {string} symbol - Stock/crypto symbol
   * @returns {string} Formatted command
   */
  formatTradeCommand(action, quantity, symbol) {
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${quantity} shares of ${symbol.toUpperCase()}`;
  },

  /**
   * Check if a response requires confirmation
   * @param {Object} response - ARIA API response
   * @returns {boolean} Whether confirmation is required
   */
  requiresConfirmation(response) {
    return response?.requires_confirmation === true && response?.interaction_id;
  },

  /**
   * Extract action result from response
   * @param {Object} response - ARIA API response
   * @returns {Object|null} Action result if available
   */
  getActionResult(response) {
    return response?.action_result || null;
  },

  /**
   * Check if response indicates success
   * @param {Object} response - ARIA API response
   * @returns {boolean} Whether the response indicates success
   */
  isSuccessResponse(response) {
    return response?.success === true;
  },

  /**
   * Get error message from response
   * @param {Object} response - ARIA API response
   * @returns {string|null} Error message if available
   */
  getErrorMessage(response) {
    return response?.error || response?.response?.error || null;
  }
};

/**
 * ARIA Event Emitter for real-time updates
 * Allows components to listen for ARIA events
 */
class ARIAEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

export const ariaEvents = new ARIAEventEmitter();

// Export default
export default ariaApi;