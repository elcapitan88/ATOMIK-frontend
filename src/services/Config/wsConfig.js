// services/config/wsConfig.js

/**
 * WebSocket configuration and constants
 */
export const WS_CONFIG = {
  // Reconnection settings
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 1000, // Base interval in ms
  MAX_RECONNECT_INTERVAL: 30000, // Maximum interval between attempts

  // Heartbeat settings
  HEARTBEAT_INTERVAL: 15000, // 15 seconds
  HEARTBEAT_TIMEOUT: 5000, // Time to wait for heartbeat response

  // Connection timeouts
  CONNECTION_TIMEOUT: 10000, // Time to wait for initial connection
  RESPONSE_TIMEOUT: 5000, // Time to wait for message responses

  // Message types
  MESSAGE_TYPES: {
      HEARTBEAT: 'heartbeat',
      AUTH: 'auth',
      SUBSCRIBE: 'subscribe',
      UNSUBSCRIBE: 'unsubscribe',
      ERROR: 'error',
      MARKET_DATA: 'market_data',
      ORDER_UPDATE: 'order_update',
      POSITION_UPDATE: 'position_update',
      ACCOUNT_UPDATE: 'account_update'
  },

  // Subscription channels
  CHANNELS: {
      MARKET_DATA: 'market_data',
      ORDERS: 'orders',
      POSITIONS: 'positions',
      ACCOUNT: 'account'
  }
};

/**
* WebSocket status constants
*/
export const WS_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  AUTHENTICATED: 'authenticated'
};

/**
* Get WebSocket URL based on environment and configuration
* @param {string} accountId 
* @param {string} broker 
* @returns {string}
*/
export const getWebSocketUrl = (accountId, broker = 'tradovate') => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.REACT_APP_WS_HOST || window.location.host;
  return `${protocol}//${host}/ws/${broker}/${accountId}/`;
};

/**
* Generate a heartbeat message
* @returns {Object}
*/
export const createHeartbeatMessage = () => ({
  type: WS_CONFIG.MESSAGE_TYPES.HEARTBEAT,
  timestamp: new Date().toISOString()
});

/**
* Create an authentication message
* @param {string} token 
* @returns {Object}
*/
export const createAuthMessage = (token) => ({
  type: WS_CONFIG.MESSAGE_TYPES.AUTH,
  token
});

/**
* Create a subscription message
* @param {string} channel 
* @param {Object} params 
* @returns {Object}
*/
export const createSubscribeMessage = (channel, params = {}) => ({
  type: WS_CONFIG.MESSAGE_TYPES.SUBSCRIBE,
  channel,
  params
});

/**
* Create an unsubscribe message
* @param {string} channel 
* @returns {Object}
*/
export const createUnsubscribeMessage = (channel) => ({
  type: WS_CONFIG.MESSAGE_TYPES.UNSUBSCRIBE,
  channel
});

/**
* Parse WebSocket message
* @param {string|Object} message 
* @returns {Object}
*/
export const parseWSMessage = (message) => {
  try {
      return typeof message === 'string' ? JSON.parse(message) : message;
  } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      return null;
  }
};

/**
* Default WebSocket options
*/
export const DEFAULT_WS_OPTIONS = {
  reconnectAttempts: WS_CONFIG.RECONNECT_ATTEMPTS,
  reconnectInterval: WS_CONFIG.RECONNECT_INTERVAL,
  heartbeatInterval: WS_CONFIG.HEARTBEAT_INTERVAL,
  connectionTimeout: WS_CONFIG.CONNECTION_TIMEOUT
};

export default {
  WS_CONFIG,
  WS_STATUS,
  getWebSocketUrl,
  createHeartbeatMessage,
  createAuthMessage,
  createSubscribeMessage,
  createUnsubscribeMessage,
  parseWSMessage,
  DEFAULT_WS_OPTIONS
};