// utils/constants/brokers.js

export const CONNECTION_METHODS = {
  OAUTH: 'oauth',
  API_KEY: 'api_key',
  CREDENTIALS: 'credentials'
};

export const ENVIRONMENTS = {
  DEMO: 'demo',
  LIVE: 'live',
  PAPER: 'paper'
};

export const BROKER_FEATURES = {
  REAL_TIME_DATA: 'real_time_data',
  MARKET_DATA: 'market_data',
  WEBSOCKET: 'websocket',
  MULTIPLE_ACCOUNTS: 'multiple_accounts',
  ORDER_TYPES: {
    MARKET: 'market',
    LIMIT: 'limit',
    STOP: 'stop',
    STOP_LIMIT: 'stop_limit'
  }
};

export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  TOKEN_VALID: 'token_valid'
};

// Update colors for new states
export const CONNECTION_STATE_COLORS = {
  [CONNECTION_STATE.DISCONNECTED]: 'red.500',
  [CONNECTION_STATE.CONNECTING]: 'yellow.500',
  [CONNECTION_STATE.CONNECTED]: 'green.500',
  [CONNECTION_STATE.RECONNECTING]: 'blue.500',
  [CONNECTION_STATE.ERROR]: 'red.500',
  [CONNECTION_STATE.TOKEN_VALID]: 'orange.500'
};

// Update messages for new states
export const CONNECTION_STATE_MESSAGES = {
  [CONNECTION_STATE.DISCONNECTED]: 'Disconnected from broker',
  [CONNECTION_STATE.CONNECTING]: 'Connecting to broker...',
  [CONNECTION_STATE.CONNECTED]: 'Connected to broker',
  [CONNECTION_STATE.RECONNECTING]: 'Reconnecting to broker...',
  [CONNECTION_STATE.ERROR]: 'Connection error',
  [CONNECTION_STATE.TOKEN_VALID]: 'Authenticated but not connected'
};

export const BROKERS = {
  
  tradovate: {
    id: 'tradovate',
    name: 'Tradovate',
    description: 'Tradovate Futures Trading',
    logo: '/logos/tradovate.svg',
    connectionMethod: CONNECTION_METHODS.OAUTH,
    environments: [ENVIRONMENTS.DEMO, ENVIRONMENTS.LIVE],
    features: {
      supportsWebSocket: true,
      supportedOrderTypes: [
        BROKER_FEATURES.ORDER_TYPES.MARKET,
        BROKER_FEATURES.ORDER_TYPES.LIMIT,
        BROKER_FEATURES.ORDER_TYPES.STOP,
        BROKER_FEATURES.ORDER_TYPES.STOP_LIMIT
      ],
      realTimeData: true,
      multipleAccounts: true,
      supportedAssets: ['ES', 'NQ', 'CL', 'GC', 'SI', 'ZB', 'RTY', 'YM']
    },
    endpoints: {
      demo: {
        base: 'https://demo.tradovateapi.com/v1',
        websocket: 'wss://demo.tradovateapi.com/v1/websocket'
      },
      live: {
        base: 'https://live.tradovateapi.com/v1',
        websocket: 'wss://live.tradovateapi.com/v1/websocket'
      }
    },
    oauth: {
      authUrl: 'https://trader.tradovate.com/oauth/authorize',
      tokenUrl: 'https://trader.tradovate.com/oauth/token',
      scope: 'trading'
    }
  },


  interactivebrokers: {
    id: 'interactivebrokers',
    name: 'IB',
    description: 'Interactive Brokers',
    logo: '/logos/ib.png',
    connectionMethod: CONNECTION_METHODS.OAUTH,
    environments: [ENVIRONMENTS.DEMO, ENVIRONMENTS.LIVE, ENVIRONMENTS.PAPER],
    features: {
      supportsWebSocket: true,
      supportedOrderTypes: [
        BROKER_FEATURES.ORDER_TYPES.MARKET,
        BROKER_FEATURES.ORDER_TYPES.LIMIT,
        BROKER_FEATURES.ORDER_TYPES.STOP,
        BROKER_FEATURES.ORDER_TYPES.STOP_LIMIT
      ],
      realTimeData: true,
      multipleAccounts: true,
      supportedAssets: ['STOCKS', 'OPTIONS', 'FUTURES', 'FOREX', 'BONDS', 'FUNDS']
    },
    endpoints: {
      demo: {
        base: 'https://api.demo.interactivebrokers.com/v1',
        websocket: 'wss://api.demo.interactivebrokers.com/v1/ws'
      },
      live: {
        base: 'https://api.interactivebrokers.com/v1',
        websocket: 'wss://api.interactivebrokers.com/v1/ws'
      },
      paper: {
        base: 'https://api.paper.interactivebrokers.com/v1',
        websocket: 'wss://api.paper.interactivebrokers.com/v1/ws'
      }
    },
    oauth: {
      authUrl: 'https://www.interactivebrokers.com/oauth/authorize',
      tokenUrl: 'https://www.interactivebrokers.com/oauth/token',
      scope: 'trading'
    }
  },
};

// Helper functions
export const getBrokerById = (brokerId) => {
  if (!brokerId) return null;
  return BROKERS[brokerId.toLowerCase()];
};

export const getAvailableBrokers = () => Object.values(BROKERS);

export const doesBrokerSupportEnvironment = (brokerId, environment) => {
  const broker = getBrokerById(brokerId);
  return broker?.environments.includes(environment) || false;
};

export const getBrokerEndpoints = (brokerId, environment) => {
  const broker = getBrokerById(brokerId);
  return broker?.endpoints[environment] || null;
};

export const getBrokerFeatures = (brokerId) => {
  const broker = getBrokerById(brokerId);
  return broker?.features || {};
};

export const getBrokerConnectionMethod = (brokerId) => {
  const broker = getBrokerById(brokerId);
  return broker?.connectionMethod || null;
};

export const getBrokerOAuthConfig = (brokerId) => {
  const broker = getBrokerById(brokerId);
  return broker?.oauth || null;
};

export const getConnectionState = (tokenValid, wsStatus) => {
  if (!tokenValid) return CONNECTION_STATE.DISCONNECTED;
  if (!wsStatus) return CONNECTION_STATE.TOKEN_VALID;
  if (wsStatus === 'connecting') return CONNECTION_STATE.WS_CONNECTING;
  if (wsStatus === 'connected') return CONNECTION_STATE.FULLY_CONNECTED;
  return CONNECTION_STATE.TOKEN_VALID;
};

export default {
  CONNECTION_METHODS,
  ENVIRONMENTS,
  CONNECTION_STATE,
  CONNECTION_STATE_MESSAGES,
  CONNECTION_STATE_COLORS,
  BROKER_FEATURES,
  BROKERS,
  getBrokerById,
  getAvailableBrokers,
  doesBrokerSupportEnvironment,
  getBrokerEndpoints,
  getBrokerFeatures,
  getBrokerConnectionMethod,
  getBrokerOAuthConfig,
  getConnectionState
};