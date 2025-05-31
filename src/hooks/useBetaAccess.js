// frontend/src/hooks/useBetaAccess.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatRoles } from './useChatRoles';
import { isBetaTester, isAdmin, isModerator } from '../utils/roleColors';
import axiosConfig from '../services/axiosConfig';

// Available beta features - this should match the backend BETA_FEATURES constant
export const BETA_FEATURES = {
  'advanced-analytics': 'Advanced Analytics Dashboard',
  'new-dashboard': 'Enhanced Dashboard Layout',
  'experimental-trading': 'Experimental Trading Tools',
  'ai-insights': 'AI-Powered Trading Insights',
  'advanced-charts': 'Advanced Chart Components',
  'beta-chat-features': 'Beta Chat Enhancements',
  'strategy-builder-v2': 'Strategy Builder V2',
  'market-predictions': 'AI Market Predictions'
};

export const useBetaAccess = () => {
  const [betaFeatures, setBetaFeatures] = useState([]);
  const [betaStatus, setBetaStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const { userRoles, fetchUserRoles } = useChatRoles();

  // Get current user's roles
  const currentUserRoles = user?.id ? (userRoles[user.id] || []) : [];

  // Check if user is a beta tester (includes admins and moderators)
  const isBetaUser = isBetaTester(currentUserRoles) || 
                     isAdmin(currentUserRoles) || 
                     isModerator(currentUserRoles);

  // Fetch user's beta status and available features
  const fetchBetaData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch beta status and features in parallel
      const [statusResponse, featuresResponse] = await Promise.all([
        axiosConfig.get('/api/v1/chat/users/me/beta-status'),
        axiosConfig.get('/api/v1/chat/users/me/beta-features')
      ]);

      setBetaStatus(statusResponse.data);
      setBetaFeatures(featuresResponse.data.features || []);

    } catch (err) {
      // If user doesn't have beta access, that's not necessarily an error
      if (err.response?.status === 403) {
        setBetaStatus({ is_beta_tester: false });
        setBetaFeatures([]);
      } else {
        console.warn('Error fetching beta data:', err);
        setError('Failed to fetch beta access information');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if user has access to a specific beta feature
  const hasFeatureAccess = useCallback((featureName) => {
    // If not a beta user, no access
    if (!isBetaUser) return false;
    
    // Check if feature exists in our available features
    return betaFeatures.includes(featureName);
  }, [isBetaUser, betaFeatures]);

  // Get all available beta features for current user
  const getAvailableFeatures = useCallback(() => {
    if (!isBetaUser) return [];
    
    return betaFeatures.map(featureName => ({
      key: featureName,
      name: BETA_FEATURES[featureName] || featureName,
      available: true
    }));
  }, [isBetaUser, betaFeatures]);

  // Get all beta features (available and unavailable)
  const getAllBetaFeatures = useCallback(() => {
    return Object.entries(BETA_FEATURES).map(([key, name]) => ({
      key,
      name,
      available: hasFeatureAccess(key)
    }));
  }, [hasFeatureAccess]);

  // Request access to a beta feature (placeholder for future implementation)
  const requestBetaAccess = useCallback(async (featureName) => {
    if (!user?.id) {
      throw new Error('Must be logged in to request beta access');
    }

    try {
      // This endpoint would be implemented in Phase 3
      const response = await axiosConfig.post('/api/v1/chat/users/me/beta-requests', {
        feature: featureName,
        reason: `User requested access to ${BETA_FEATURES[featureName] || featureName}`
      });
      
      return response.data;
    } catch (err) {
      console.error('Error requesting beta access:', err);
      throw err;
    }
  }, [user?.id]);

  // Assign beta tester role (admin only)
  const assignBetaTesterRole = useCallback(async (userId) => {
    try {
      await axiosConfig.post(`/api/v1/chat/admin/users/${userId}/roles/beta_tester`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error assigning beta tester role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Remove beta tester role (admin only)
  const removeBetaTesterRole = useCallback(async (userId) => {
    try {
      await axiosConfig.delete(`/api/v1/chat/admin/users/${userId}/roles/beta_tester`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error removing beta tester role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Get all beta testers (admin only)
  const getAllBetaTesters = useCallback(async () => {
    try {
      const response = await axiosConfig.get('/api/v1/chat/admin/roles/beta_testers');
      return response.data.beta_testers;
    } catch (err) {
      console.error('Error fetching beta testers:', err);
      throw err;
    }
  }, []);

  // Fetch beta data when user changes or roles change
  useEffect(() => {
    if (user?.id && currentUserRoles.length >= 0) {
      fetchBetaData();
    }
  }, [user?.id, currentUserRoles.length, fetchBetaData]);

  return {
    // Status
    isBetaTester: isBetaUser,
    betaStatus,
    loading,
    error,
    
    // Features
    betaFeatures,
    hasFeatureAccess,
    getAvailableFeatures,
    getAllBetaFeatures,
    
    // Actions
    fetchBetaData,
    requestBetaAccess,
    
    // Admin actions
    assignBetaTesterRole,
    removeBetaTesterRole,
    getAllBetaTesters,
    
    // Constants
    BETA_FEATURES
  };
};