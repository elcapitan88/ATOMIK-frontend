/**
 * Debug utility functions for feature flags
 * 
 * Can be used in browser console to debug feature flag issues
 */

import { envConfig } from '../config/environment';

/**
 * Debug current user's feature access
 */
export const debugCurrentUserFeatures = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('[FeatureFlags Debug] No access token found');
      return;
    }

    console.log('[FeatureFlags Debug] Fetching current user debug info...');
    
    const response = await fetch(`${envConfig.apiBaseUrl}/api/v1/beta/admin/debug/current-user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FeatureFlags Debug] API error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('[FeatureFlags Debug] Current user data:', data);
    
    // Pretty print the important info
    console.group('[FeatureFlags Debug] Current User Analysis');
    console.log('User ID:', data.user_id);
    console.log('Email:', data.email);
    console.log('App Role:', data.app_role);
    console.log('App Role Checks:', data.app_role_checks);
    console.log('Chat Roles:', data.chat_roles);
    console.log('Strategy Builder Access:', data.strategy_builder_access);
    console.groupEnd();
    
    return data;
  } catch (error) {
    console.error('[FeatureFlags Debug] Error:', error);
  }
};

/**
 * Debug user features API call
 */
export const debugUserFeaturesAPI = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('[FeatureFlags Debug] No access token found');
      return;
    }

    console.log('[FeatureFlags Debug] Fetching user features via standard API...');
    
    const response = await fetch(`${envConfig.apiBaseUrl}/api/v1/beta/features/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[FeatureFlags Debug] Standard API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FeatureFlags Debug] Standard API error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('[FeatureFlags Debug] Standard API response:', data);
    
    // Pretty print the important info
    console.group('[FeatureFlags Debug] Standard API Analysis');
    console.log('Features:', data.features);
    console.log('Strategy Builder:', data.features?.['strategy-builder']);
    console.log('Member Chat:', data.features?.['member-chat']);
    console.log('Is Beta Tester:', data.is_beta_tester);
    console.log('Feature Count:', data.feature_count);
    console.groupEnd();
    
    return data;
  } catch (error) {
    console.error('[FeatureFlags Debug] Error:', error);
  }
};

/**
 * Test strategy builder feature specifically
 */
export const debugStrategyBuilderAccess = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('[FeatureFlags Debug] No access token found');
      return;
    }

    console.log('[FeatureFlags Debug] Testing strategy-builder feature access...');
    
    const response = await fetch(`${envConfig.apiBaseUrl}/api/v1/beta/features/strategy-builder/access`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[FeatureFlags Debug] Strategy builder access response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FeatureFlags Debug] Strategy builder access error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('[FeatureFlags Debug] Strategy builder access response:', data);
    
    return data;
  } catch (error) {
    console.error('[FeatureFlags Debug] Error:', error);
  }
};

/**
 * Run all debug functions
 */
export const runFullDebug = async () => {
  console.log('🔍 Starting Feature Flags Debug Session...');
  
  const results = {
    currentUser: await debugCurrentUserFeatures(),
    standardAPI: await debugUserFeaturesAPI(),
    strategyBuilder: await debugStrategyBuilderAccess()
  };
  
  console.log('🔍 Debug Session Complete:', results);
  return results;
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.debugFeatureFlags = {
    debugCurrentUserFeatures,
    debugUserFeaturesAPI,
    debugStrategyBuilderAccess,
    runFullDebug
  };
  
  console.log('🔧 Feature Flags debug utilities loaded. Use window.debugFeatureFlags in console.');
}