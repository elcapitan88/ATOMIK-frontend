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
      THRESHOLD: 2500,      // Time to wait before sending next heartbeat
      MAX_MISSED: 3,        // Maximum missed heartbeats before reconnect
      MESSAGE: '[]'         // Empty array format for Tradovate
  },

  // Timeouts and Limits
  TIMEOUTS: {
      CONNECTION: 10000,    // Initial connection timeout
      RESPONSE: 5000,       // Message response timeout
      AUTHENTICATION: 15000 // Authentication timeout
  },

  // Rate Limiting
  RATE_LIMITS: {
      MAX_MESSAGES_PER_SECOND: 50,
      BURST_SIZE: 100,
      THROTTLE_INTERVAL: 1000
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
          threshold: 2500
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
      responseTimeout: 5000,
      maxReconnectAttempts: 5,
      features: {
          supportsHeartbeat: true,
          requiresAuthentication: true,
          supportsSubscriptions: true
      }
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
  HEARTBEAT: 'heartbeat',
  AUTH: 'auth',
  SUBSCRIPTION: 'subscription'
};

/**
* WebSocket connection states
*/
export const CONNECTION_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  AUTHENTICATED: 'authenticated'
};

/**
* WebSocket error codes
*/
export const ERROR_CODES = {
  // Connection Errors (4000-4099)
  CONNECTION_FAILED: 4000,
  CONNECTION_TIMEOUT: 4001,
  CONNECTION_LIMIT: 4002,
  
  // Authentication Errors (4100-4199)
  AUTH_FAILED: 4100,
  AUTH_EXPIRED: 4101,
  AUTH_INVALID: 4102,
  
  // Heartbeat Errors (4200-4299)
  HEARTBEAT_TIMEOUT: 4200,
  HEARTBEAT_MISSED: 4201,
  
  // Message Errors (4300-4399)
  MESSAGE_INVALID: 4300,
  MESSAGE_RATE_LIMIT: 4301,
  
  // Server Errors (4900-4999)
  SERVER_ERROR: 4900
};

/**
* Message formatters for different types of messages
*/
export const MESSAGE_FORMATTERS = {
  heartbeat: () => '[]',  // Tradovate specific

  marketData: (data) => ({
      type: MESSAGE_TYPES.MARKET_DATA,
      data,
      timestamp: Date.now()
  }),

  orderUpdate: (data) => ({
      type: MESSAGE_TYPES.ORDER_UPDATE,
      data,
      timestamp: Date.now()
  }),

  error: (code, message, details = {}) => ({
      type: MESSAGE_TYPES.ERROR,
      code,
      message,
      details,
      timestamp: Date.now()
  })
};

/**
* Get WebSocket URL based on configuration
*/
export const getWebSocketUrl = (accountId, broker = 'tradovate', environment = 'demo') => {
  // Get broker configuration
  const brokerConfig = BROKER_CONFIG[broker];
  if (!brokerConfig) {
      throw new Error(`Unknown broker: ${broker}`);
  }

  // Get environment-specific endpoint
  const endpoint = brokerConfig.endpoints[environment];
  if (!endpoint?.ws) {
      throw new Error(`Invalid environment: ${environment}`);
  }

  // Get authentication token
  const token = localStorage.getItem('access_token');
  if (!token) {
      throw new Error('No authentication token found');
  }

  // Build WebSocket URL
  return `${endpoint.ws}/${accountId}?token=${encodeURIComponent(token)}`;
};

/**
* Default WebSocket options
*/
export const DEFAULT_OPTIONS = {
  heartbeat: {
      enabled: true,
      interval: WS_CONFIG.HEARTBEAT.INTERVAL,
      threshold: WS_CONFIG.HEARTBEAT.THRESHOLD,
      maxMissed: WS_CONFIG.HEARTBEAT.MAX_MISSED
  },
  reconnect: {
      enabled: true,
      maxAttempts: WS_CONFIG.RECONNECT.MAX_ATTEMPTS,
      initialDelay: WS_CONFIG.RECONNECT.INITIAL_DELAY,
      maxDelay: WS_CONFIG.RECONNECT.MAX_DELAY,
      backoffFactor: WS_CONFIG.RECONNECT.BACKOFF_FACTOR
  },
  timeouts: {
      connection: WS_CONFIG.TIMEOUTS.CONNECTION,
      response: WS_CONFIG.TIMEOUTS.RESPONSE,
      authentication: WS_CONFIG.TIMEOUTS.AUTHENTICATION
  }
};

// Create configuration object
const wsConfig = {
  WS_CONFIG,
  BROKER_CONFIG,
  MESSAGE_TYPES,
  CONNECTION_STATE,
  ERROR_CODES,
  MESSAGE_FORMATTERS,
  getWebSocketUrl,
  DEFAULT_OPTIONS
};

// Export default configuration
export default wsConfig;