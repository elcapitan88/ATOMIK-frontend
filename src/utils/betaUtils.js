// frontend/src/utils/betaUtils.js
import axiosConfig from '../services/axiosConfig';

// Beta features configuration - should match backend BETA_FEATURES
export const BETA_FEATURES = {
  'advanced-analytics': {
    name: 'Advanced Analytics Dashboard',
    description: 'Enhanced analytics with predictive insights and advanced charts',
    category: 'Analytics',
    priority: 'high'
  },
  'new-dashboard': {
    name: 'Enhanced Dashboard Layout',
    description: 'Redesigned dashboard with improved performance and user experience',
    category: 'UI/UX',
    priority: 'medium'
  },
  'experimental-trading': {
    name: 'Experimental Trading Tools',
    description: 'Advanced trading algorithms and automation features',
    category: 'Trading',
    priority: 'high'
  },
  'ai-insights': {
    name: 'AI-Powered Trading Insights',
    description: 'Machine learning driven market predictions and recommendations',
    category: 'AI',
    priority: 'high'
  },
  'advanced-charts': {
    name: 'Advanced Chart Components',
    description: 'Interactive charts with advanced technical indicators',
    category: 'Charts',
    priority: 'medium'
  },
  'beta-chat-features': {
    name: 'Beta Chat Enhancements',
    description: 'Enhanced chat functionality with real-time collaboration features',
    category: 'Communication',
    priority: 'low'
  },
  'strategy-builder-v2': {
    name: 'Strategy Builder V2',
    description: 'Next generation strategy builder with visual programming interface',
    category: 'Strategy',
    priority: 'high'
  },
  'market-predictions': {
    name: 'AI Market Predictions',
    description: 'Advanced market prediction models and backtesting tools',
    category: 'AI',
    priority: 'medium'
  }
};

/**
 * Check if a specific beta feature is available
 * @param {string} featureName - The name of the beta feature
 * @param {Array} userBetaFeatures - Array of beta features available to user
 * @returns {boolean} - Whether the feature is available
 */
export const checkBetaFeature = (featureName, userBetaFeatures = []) => {
  if (!featureName || !Array.isArray(userBetaFeatures)) {
    return false;
  }
  
  return userBetaFeatures.includes(featureName);
};

/**
 * Get user's available beta features with metadata
 * @param {Array} userBetaFeatures - Array of beta features available to user
 * @returns {Array} - Array of feature objects with metadata
 */
export const getBetaFeatures = (userBetaFeatures = []) => {
  if (!Array.isArray(userBetaFeatures)) {
    return [];
  }
  
  return userBetaFeatures
    .filter(featureName => BETA_FEATURES[featureName])
    .map(featureName => ({
      key: featureName,
      ...BETA_FEATURES[featureName],
      available: true
    }));
};

/**
 * Get all beta features (available and unavailable) for display
 * @param {Array} userBetaFeatures - Array of beta features available to user
 * @returns {Array} - Array of all feature objects with availability status
 */
export const getAllBetaFeatures = (userBetaFeatures = []) => {
  return Object.entries(BETA_FEATURES).map(([key, feature]) => ({
    key,
    ...feature,
    available: checkBetaFeature(key, userBetaFeatures)
  }));
};

/**
 * Get beta features grouped by category
 * @param {Array} userBetaFeatures - Array of beta features available to user
 * @returns {Object} - Object with categories as keys and features as values
 */
export const getBetaFeaturesByCategory = (userBetaFeatures = []) => {
  const allFeatures = getAllBetaFeatures(userBetaFeatures);
  
  return allFeatures.reduce((categories, feature) => {
    const category = feature.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(feature);
    return categories;
  }, {});
};

/**
 * Request access to a beta feature
 * @param {string} featureName - The name of the beta feature
 * @param {string} reason - Reason for requesting access (optional)
 * @returns {Promise} - API response
 */
export const requestBetaAccess = async (featureName, reason = '') => {
  if (!featureName) {
    throw new Error('Feature name is required');
  }
  
  if (!BETA_FEATURES[featureName]) {
    throw new Error(`Unknown beta feature: ${featureName}`);
  }
  
  try {
    const response = await axiosConfig.post('/api/v1/chat/users/me/beta-requests', {
      feature: featureName,
      reason: reason || `User requested access to ${BETA_FEATURES[featureName].name}`
    });
    
    return response.data;
  } catch (error) {
    console.error('Error requesting beta access:', error);
    throw error;
  }
};

/**
 * Get user's beta status from API
 * @returns {Promise} - User's beta status
 */
export const fetchBetaStatus = async () => {
  try {
    const response = await axiosConfig.get('/api/v1/chat/users/me/beta-status');
    return response.data;
  } catch (error) {
    console.error('Error fetching beta status:', error);
    throw error;
  }
};

/**
 * Get user's available beta features from API
 * @returns {Promise} - User's available beta features
 */
export const fetchUserBetaFeatures = async () => {
  try {
    const response = await axiosConfig.get('/api/v1/chat/users/me/beta-features');
    return response.data.features || [];
  } catch (error) {
    console.error('Error fetching user beta features:', error);
    throw error;
  }
};

/**
 * Check if user has any beta access
 * @param {Array} userRoles - User's roles array
 * @returns {boolean} - Whether user has beta access
 */
export const hasBetaAccess = (userRoles = []) => {
  if (!Array.isArray(userRoles)) {
    return false;
  }
  
  return userRoles.some(role => 
    role.role_name === 'Beta Tester' || 
    role.role_name === 'Admin' || 
    role.role_name === 'Moderator'
  );
};

/**
 * Filter features by priority
 * @param {Array} features - Array of feature objects
 * @param {string} priority - Priority level ('high', 'medium', 'low')
 * @returns {Array} - Filtered features
 */
export const filterFeaturesByPriority = (features, priority) => {
  if (!Array.isArray(features) || !priority) {
    return features;
  }
  
  return features.filter(feature => feature.priority === priority);
};

/**
 * Get feature by key
 * @param {string} featureKey - The feature key
 * @returns {Object|null} - Feature object or null if not found
 */
export const getFeatureByKey = (featureKey) => {
  if (!featureKey || !BETA_FEATURES[featureKey]) {
    return null;
  }
  
  return {
    key: featureKey,
    ...BETA_FEATURES[featureKey]
  };
};

/**
 * Validate if a feature name is valid
 * @param {string} featureName - The feature name to validate
 * @returns {boolean} - Whether the feature name is valid
 */
export const isValidFeatureName = (featureName) => {
  return featureName && BETA_FEATURES.hasOwnProperty(featureName);
};

/**
 * Get feature display name
 * @param {string} featureName - The feature name
 * @returns {string} - Display name or feature name if not found
 */
export const getFeatureDisplayName = (featureName) => {
  if (!featureName) return '';
  
  const feature = BETA_FEATURES[featureName];
  return feature ? feature.name : featureName;
};

/**
 * Get feature description
 * @param {string} featureName - The feature name
 * @returns {string} - Description or empty string if not found
 */
export const getFeatureDescription = (featureName) => {
  if (!featureName) return '';
  
  const feature = BETA_FEATURES[featureName];
  return feature ? feature.description : '';
};

/**
 * Admin utility: Assign beta tester role to user
 * @param {string} userId - User ID
 * @returns {Promise} - API response
 */
export const assignBetaTesterRole = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const response = await axiosConfig.post(`/api/v1/chat/admin/users/${userId}/roles/beta_tester`);
    return response.data;
  } catch (error) {
    console.error('Error assigning beta tester role:', error);
    throw error;
  }
};

/**
 * Admin utility: Remove beta tester role from user
 * @param {string} userId - User ID
 * @returns {Promise} - API response
 */
export const removeBetaTesterRole = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const response = await axiosConfig.delete(`/api/v1/chat/admin/users/${userId}/roles/beta_tester`);
    return response.data;
  } catch (error) {
    console.error('Error removing beta tester role:', error);
    throw error;
  }
};

/**
 * Admin utility: Get all beta testers
 * @returns {Promise} - Array of beta testers
 */
export const fetchAllBetaTesters = async () => {
  try {
    const response = await axiosConfig.get('/api/v1/chat/admin/roles/beta_testers');
    return response.data.beta_testers || [];
  } catch (error) {
    console.error('Error fetching beta testers:', error);
    throw error;
  }
};

/**
 * Create a beta feature configuration object
 * @param {string} name - Feature name
 * @param {string} description - Feature description
 * @param {string} category - Feature category
 * @param {string} priority - Feature priority
 * @returns {Object} - Feature configuration
 */
export const createFeatureConfig = (name, description, category = 'Other', priority = 'medium') => {
  return {
    name,
    description,
    category,
    priority
  };
};

export default {
  BETA_FEATURES,
  checkBetaFeature,
  getBetaFeatures,
  getAllBetaFeatures,
  getBetaFeaturesByCategory,
  requestBetaAccess,
  fetchBetaStatus,
  fetchUserBetaFeatures,
  hasBetaAccess,
  filterFeaturesByPriority,
  getFeatureByKey,
  isValidFeatureName,
  getFeatureDisplayName,
  getFeatureDescription,
  assignBetaTesterRole,
  removeBetaTesterRole,
  fetchAllBetaTesters,
  createFeatureConfig
};