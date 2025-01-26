// src/services/Config/wsConfig.js

/**
 * WebSocket configuration constants
 */
export const WS_CONFIG = {
  // Connection settings
  RECONNECT: {
      MAX_ATTEMPTS: 5,
      INITIAL_DELAY: 1000,  // Initial delay in ms
      MAX_DELAY: 30000,     // Maximum delay between attempts
      BACKOFF_FACTOR: 2     // Exponential backoff multiplier
  },

  // Heartbeat settings (Tradovate specific)
  HEARTBEAT: {
      INTERVAL: 2500,       // 2.5 seconds required by Tradovate
      MAX_MISSED: 3         // Maximum missed heartbeats before reconnect
  },

  // Timeouts
  TIMEOUTS: {
      CONNECTION: 10000,    // Initial connection timeout
      RESPONSE: 5000        // Message response timeout
  }
};

/**
* Broker-specific configurations
*/
export const BROKER_CONFIG = {
  tradovate: {
      heartbeat: {
          message: '[]',
          interval: 2500,
          timeout: 5000
      },
      endpoints: {
          demo: {
              ws: process.env.REACT_APP_TRADOVATE_DEMO_WS_URL,
              rest: process.env.REACT_APP_TRADOVATE_DEMO_API_URL
          },
          live: {
              ws: process.env.REACT_APP_TRADOVATE_LIVE_WS_URL,
              rest: process.env.REACT_APP_TRADOVATE_LIVE_API_URL
          }
      },
      responseTimeout: 5000
  }
  // Add more brokers here as needed
};

/**
* WebSocket message types
*/
export const MESSAGE_TYPES = {
  MARKET_DATA: 'market_data',
  ORDER_UPDATE: 'order_update',
  POSITION_UPDATE: 'position_update',
  ACCOUNT_UPDATE: 'account_update',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat'
};

/**
* WebSocket connection states
*/
export const CONNECTION_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

/**
* Get WebSocket URL based on environment
* @param {string} accountId - Account identifier
* @param {string} broker - Broker identifier (default: 'tradovate')
* @param {string} environment - Trading environment (default: 'demo')
* @returns {string} WebSocket URL
*/
export const getWebSocketUrl = (accountId, broker = 'tradovate', environment = 'demo') => {
  if (BROKER_CONFIG[broker]?.endpoints[environment]?.ws) {
      return `${BROKER_CONFIG[broker].endpoints[environment].ws}/${accountId}`;
  }

  // Fallback to default construction
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.REACT_APP_WS_HOST || window.location.host;
  const token = localStorage.getItem('access_token');
  
  return `${protocol}//${host}/ws/${broker}/${accountId}?token=${token}`;
};

/**
* Message formatters
*/
export const MESSAGE_FORMATTERS = {
  heartbeat: () => '[]',  // Tradovate specific
  order: (data) => JSON.stringify({
      type: MESSAGE_TYPES.ORDER_UPDATE,
      data
  }),
  marketData: (data) => JSON.stringify({
      type: MESSAGE_TYPES.MARKET_DATA,
      data
  })
};

/**
* Default WebSocket options
*/
export const DEFAULT_OPTIONS = {
  reconnectAttempts: WS_CONFIG.RECONNECT.MAX_ATTEMPTS,
  reconnectDelay: WS_CONFIG.RECONNECT.INITIAL_DELAY,
  heartbeatInterval: WS_CONFIG.HEARTBEAT.INTERVAL,
  responseTimeout: WS_CONFIG.TIMEOUTS.RESPONSE
};

// Create configuration object
const wsConfig = {
  WS_CONFIG,
  BROKER_CONFIG,
  MESSAGE_TYPES,
  CONNECTION_STATE,
  getWebSocketUrl,
  MESSAGE_FORMATTERS,
  DEFAULT_OPTIONS
};

// Export default configuration
export default wsConfig;