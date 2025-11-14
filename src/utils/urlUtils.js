// src/utils/urlUtils.js
import logger from '@/utils/logger';

/**
 * Determines if the application is running in a local development environment
 */
export const isLocalEnvironment = () => {
  // Multiple checks for more reliability
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  
  const isLocalhost = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    origin.includes('localhost');
  
  logger.debug(`Environment detection - hostname: ${hostname}, origin: ${origin}`);
  logger.debug(`Detected as ${isLocalhost ? 'local' : 'production'} environment`);
  
  return isLocalhost;
};

/**
 * Gets the base URL for the application based on environment
 */
export const getBaseUrl = () => {
  // First try environment variables (most reliable in production)
  if (process.env.NODE_ENV === 'production') {
    if (process.env.REACT_APP_FRONTEND_URL) {
      logger.debug(`Using production URL from env: ${process.env.REACT_APP_FRONTEND_URL}`);
      return process.env.REACT_APP_FRONTEND_URL;
    }
  }
  
  // Fallback to runtime detection
  const baseUrl = isLocalEnvironment()
    ? 'http://localhost:3000'
    : 'https://atomiktrading.io';
  
  logger.debug(`Using detected base URL: ${baseUrl}`);
  return baseUrl;
};

/**
 * Gets the API URL for the application based on environment
 */
export const getApiUrl = () => {
  // Always use environment variable if available
  let apiUrl = process.env.REACT_APP_API_URL;

  // Fallback to runtime detection if env var not available
  if (!apiUrl) {
    apiUrl = isLocalEnvironment()
      ? 'http://localhost:8000'
      : 'https://api.atomiktrading.io';
  }

  // Safety check: Force HTTPS for api.atomiktrading.io to prevent CSP violations
  if (apiUrl.includes('api.atomiktrading.io') && apiUrl.startsWith('http://')) {
    apiUrl = apiUrl.replace('http://', 'https://');
    logger.warn('Forced HTTPS for api.atomiktrading.io to comply with CSP');
  }

  return apiUrl;
};

/**
 * Generates the Stripe success URL with proper parameters
 */
export const getStripeSuccessUrl = (params = {}) => {
  // Make sure we're using HTTPS in production
  const baseUrl = getBaseUrl();
  const secureBaseUrl = baseUrl.replace('http://', 'https://');
  
  // Force https for production domains
  const secureUrl = 
    !isLocalEnvironment() && !secureBaseUrl.startsWith('https://')
      ? `https://${secureBaseUrl.split('://')[1]}`
      : secureBaseUrl;
  
  let url = `${secureUrl}/payment/success`;
  
  // Add session_id and any other params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  
  logger.info(`Generated Stripe success URL: ${url}`);
  return url;
};

/**
 * Generates the Stripe cancel URL
 */
export const getStripeCancelUrl = () => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/pricing`;
  
  logger.info(`Generated Stripe cancel URL: ${url}`);
  return url;
};

/**
 * Logs environment information for debugging
 */
export const logEnvironmentInfo = () => {
  const info = {
    nodeEnv: process.env.NODE_ENV,
    windowLocation: window.location.href,
    windowOrigin: window.location.origin,
    hostname: window.location.hostname,
    isLocalhost: isLocalEnvironment(),
    detectedBaseUrl: getBaseUrl(),
    frontendEnvUrl: process.env.REACT_APP_FRONTEND_URL,
    apiEnvUrl: process.env.REACT_APP_API_URL,
    stripeSuccessUrl: getStripeSuccessUrl({session_id: 'SAMPLE_SESSION_ID'})
  };
  
  logger.info('Environment info:', info);
  return info;
};