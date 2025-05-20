// src/services/api/support/supportApi.js
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

export const supportApi = {
  /**
   * Create a new support ticket
   * @param {Object} ticketData - The ticket data
   * @param {string} ticketData.issueType - The type of issue (bug, feature, question, account)
   * @param {string} ticketData.subject - The ticket subject/title
   * @param {string} ticketData.description - Detailed description of the issue
   * @param {string} ticketData.priority - Priority level (low, medium, high, critical)
   * @param {File} [ticketData.screenshot] - Optional screenshot file
   * @returns {Promise} - Promise resolving to ticket creation response
   */
  createTicket: async (ticketData) => {
    try {
      logger.info('Creating support ticket:', { 
        issueType: ticketData.issueType, 
        priority: ticketData.priority,
        hasScreenshot: !!ticketData.screenshot
      });

      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('issue_type', ticketData.issueType);
      formData.append('subject', ticketData.subject);
      formData.append('description', ticketData.description);
      formData.append('priority', ticketData.priority);
      
      if (ticketData.screenshot) {
        formData.append('file', ticketData.screenshot);
      }
      
      const response = await axiosInstance.post('/api/v1/support/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error creating support ticket:', error);
      throw error;
    }
  },
  
  /**
   * Get all support tickets for the current user
   * @returns {Promise} - Promise resolving to array of tickets
   */
  getUserTickets: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/support/tickets');
      return response.data;
    } catch (error) {
      logger.error('Error fetching user tickets:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific ticket by ID
   * @param {string} ticketId - The ticket ID
   * @returns {Promise} - Promise resolving to ticket details
   */
  getTicketById: async (ticketId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/support/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching ticket ${ticketId}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a comment to an existing ticket
   * @param {string} ticketId - The ticket ID
   * @param {string} comment - The comment text
   * @returns {Promise} - Promise resolving to updated ticket
   */
  addTicketComment: async (ticketId, comment) => {
    try {
      const response = await axiosInstance.post(`/api/v1/support/tickets/${ticketId}/comments`, {
        comment
      });
      return response.data;
    } catch (error) {
      logger.error(`Error adding comment to ticket ${ticketId}:`, error);
      throw error;
    }
  }
};

export default supportApi;