// src/services/api/StrategyBuilder/strategyBuilderApi.js

import axiosInstance from '@/services/axiosConfig';
import { handleApiError } from '@/utils/errorHandler';
import logger from '@/utils/logger';

export const strategyBuilderApi = {
  /**
   * Fetch all strategy components for the authenticated user
   */
  async getComponents() {
    try {
      const response = await axiosInstance.get('/api/v1/strategy-builder/components');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch strategy builder components', error);
      throw handleApiError(error);
    }
  },

  /**
   * Create a new strategy component
   * @param {Object} componentData - The component data to create
   */
  async createComponent(componentData) {
    try {
      const response = await axiosInstance.post('/api/v1/strategy-builder/components', componentData);
      return response.data;
    } catch (error) {
      logger.error('Failed to create strategy builder component', error);
      throw handleApiError(error);
    }
  },

  /**
   * Update an existing strategy component
   * @param {string} componentId - The ID of the component to update
   * @param {Object} updates - The updates to apply
   */
  async updateComponent(componentId, updates) {
    try {
      const response = await axiosInstance.patch(`/api/v1/strategy-builder/components/${componentId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update strategy builder component ${componentId}`, error);
      throw handleApiError(error);
    }
  },

  /**
   * Delete a strategy component
   * @param {string} componentId - The ID of the component to delete
   */
  async deleteComponent(componentId) {
    try {
      const response = await axiosInstance.delete(`/api/v1/strategy-builder/components/${componentId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete strategy builder component ${componentId}`, error);
      throw handleApiError(error);
    }
  },

  /**
   * Save the entire strategy configuration
   * @param {Object} strategyData - Complete strategy data with components
   */
  async saveStrategy(strategyData) {
    try {
      const response = await axiosInstance.post('/api/v1/strategy-builder/strategies', strategyData);
      return response.data;
    } catch (error) {
      logger.error('Failed to save strategy', error);
      throw handleApiError(error);
    }
  },

  /**
   * Activate a strategy for live trading
   * @param {string} strategyId - The ID of the strategy to activate
   * @param {boolean} isActive - Whether to activate or deactivate
   */
  async setStrategyActive(strategyId, isActive) {
    try {
      const response = await axiosInstance.post(`/api/v1/strategy-builder/strategies/${strategyId}/activate`, {
        is_active: isActive
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to ${isActive ? 'activate' : 'deactivate'} strategy ${strategyId}`, error);
      throw handleApiError(error);
    }
  }
};

export default strategyBuilderApi;