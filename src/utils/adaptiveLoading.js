// Adaptive loading utilities for performance optimization
import { useState, useEffect } from 'react';

/**
 * Get the current connection type and quality
 * @returns {Object} Connection information
 */
export const getConnectionInfo = () => {
  if (!navigator.connection) {
    return {
      effectiveType: '4g',
      saveData: false,
      rtt: 0,
      downlink: 10,
      supported: false
    };
  }

  return {
    effectiveType: navigator.connection.effectiveType || '4g',
    saveData: navigator.connection.saveData || false,
    rtt: navigator.connection.rtt || 0,
    downlink: navigator.connection.downlink || 10,
    supported: true
  };
};

/**
 * Check if the user has a slow connection
 * @returns {boolean} True if connection is slow
 */
export const isSlowConnection = () => {
  const connection = getConnectionInfo();
  
  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g' ||
    connection.rtt > 500 ||
    connection.downlink < 1.5
  );
};

/**
 * Get appropriate image quality based on connection
 * @returns {Object} Image configuration
 */
export const getAdaptiveImageConfig = () => {
  const connection = getConnectionInfo();
  const isSlow = isSlowConnection();

  if (connection.saveData) {
    return {
      quality: 'low',
      format: 'jpg',
      width: 'mobile',
      lazy: true
    };
  }

  if (isSlow) {
    return {
      quality: 'medium',
      format: 'jpg',
      width: 'tablet',
      lazy: true
    };
  }

  return {
    quality: 'high',
    format: 'webp',
    width: 'desktop',
    lazy: false
  };
};

/**
 * Get adaptive srcSet based on connection speed
 * @param {Object} images - Object with different size image URLs
 * @returns {string} Adaptive srcSet string
 */
export const getAdaptiveSrcSet = (images) => {
  const config = getAdaptiveImageConfig();
  
  if (config.quality === 'low') {
    return `${images.mobile} 768w`;
  }
  
  if (config.quality === 'medium') {
    return `${images.mobile} 768w, ${images.tablet} 1024w`;
  }
  
  return `${images.mobile} 768w, ${images.tablet} 1024w, ${images.desktop} 1745w`;
};

/**
 * Should defer non-critical resources
 * @returns {boolean} True if should defer
 */
export const shouldDeferResources = () => {
  const connection = getConnectionInfo();
  const isSlow = isSlowConnection();
  
  // Always defer on save data mode
  if (connection.saveData) return true;
  
  // Defer on slow connections
  if (isSlow) return true;
  
  // Also consider device memory if available
  if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
    return true;
  }
  
  return false;
};

/**
 * Adaptive loading hook for React components
 */
export const useAdaptiveLoading = () => {
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());
  
  useEffect(() => {
    if (!navigator.connection) return;
    
    const updateConnectionInfo = () => {
      setConnectionInfo(getConnectionInfo());
    };
    
    // Listen for connection changes
    navigator.connection.addEventListener('change', updateConnectionInfo);
    
    return () => {
      navigator.connection.removeEventListener('change', updateConnectionInfo);
    };
  }, []);
  
  return {
    connectionInfo,
    isSlowConnection: isSlowConnection(),
    shouldDeferResources: shouldDeferResources(),
    imageConfig: getAdaptiveImageConfig()
  };
};

// Export for immediate use in index.html
if (typeof window !== 'undefined') {
  window.adaptiveLoading = {
    getConnectionInfo,
    isSlowConnection,
    shouldDeferResources,
    getAdaptiveImageConfig
  };
}