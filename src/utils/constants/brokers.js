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

export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  TOKEN_VALID: 'token_valid',
  WS_CONNECTING: 'ws_connecting',
  VALIDATING_USER: 'validating_user',
  CHECKING_SUBSCRIPTION: 'checking_subscription',
  CHECKING_BROKER_ACCESS: 'checking_broker_access',
  CONNECTING_TO_BROKER: 'connecting_to_broker',
  FULLY_CONNECTED: 'fully_connected'
};

export const CONNECTION_STATE_MESSAGES = {
  [CONNECTION_STATE.DISCONNECTED]: "Account Disconnected",
  [CONNECTION_STATE.TOKEN_VALID]: "Account Connected - Token Valid",
  [CONNECTION_STATE.WS_CONNECTING]: "Connecting to WebSocket",
  [CONNECTION_STATE.VALIDATING_USER]: "Validating credentials...",
  [CONNECTION_STATE.CHECKING_SUBSCRIPTION]: "Checking subscription...",
  [CONNECTION_STATE.CHECKING_BROKER_ACCESS]: "Validating broker access...",
  [CONNECTION_STATE.CONNECTING_TO_BROKER]: "Connecting to broker...",
  [CONNECTION_STATE.FULLY_CONNECTED]: "Ready for Trading"
};

export const CONNECTION_STATE_COLORS = {
  [CONNECTION_STATE.DISCONNECTED]: "red.400",
  [CONNECTION_STATE.TOKEN_VALID]: "yellow.400",
  [CONNECTION_STATE.WS_CONNECTING]: "blue.400",
  [CONNECTION_STATE.VALIDATING_USER]: "blue.400",
  [CONNECTION_STATE.CHECKING_SUBSCRIPTION]: "blue.400",
  [CONNECTION_STATE.CHECKING_BROKER_ACCESS]: "blue.400",
  [CONNECTION_STATE.CONNECTING_TO_BROKER]: "blue.400",
  [CONNECTION_STATE.FULLY_CONNECTED]: "green.400"
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
      supportedAssets: ['ES', 'NQ', 'CL', 'GC', 'SI', 'ZB', 'RTY', 'YM', 'MBT']
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

  binance: {
    id: 'binance',
    name: 'Binance',
    description: 'Binance Global - Crypto',
    logo: '/logos/binancelogo.svg',
    connectionMethod: CONNECTION_METHODS.API_KEY,
    environments: [ENVIRONMENTS.LIVE],
    features: {
      supportsWebSocket: true,
      supportedOrderTypes: [
        BROKER_FEATURES.ORDER_TYPES.MARKET,
        BROKER_FEATURES.ORDER_TYPES.LIMIT,
        BROKER_FEATURES.ORDER_TYPES.STOP,
        BROKER_FEATURES.ORDER_TYPES.STOP_LIMIT
      ],
      realTimeData: true,
      multipleAccounts: false,
      supportedAssets: ['BTC', 'ETH', 'USDT', 'SPOT', 'FUTURES']
    },
    endpoints: {
      live: {
        base: 'https://api.binance.com',
        websocket: 'wss://stream.binance.com:9443'
      }
    },
    apiKeyConfig: {
      keyPlaceholder: 'Enter your Binance API Key',
      secretPlaceholder: 'Enter your Secret Key',
      helpUrl: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
    }
  },

  binanceus: {
    id: 'binanceus',
    name: 'Binance.US',
    description: 'Binance US - Crypto',
    logo: '/logos/binancelogo.svg',
    connectionMethod: CONNECTION_METHODS.API_KEY,
    environments: [ENVIRONMENTS.LIVE],
    features: {
      supportsWebSocket: true,
      supportedOrderTypes: [
        BROKER_FEATURES.ORDER_TYPES.MARKET,
        BROKER_FEATURES.ORDER_TYPES.LIMIT,
        BROKER_FEATURES.ORDER_TYPES.STOP
      ],
      realTimeData: true,
      multipleAccounts: false,
      supportedAssets: ['BTC', 'ETH', 'USDT', 'SPOT']
    },
    endpoints: {
      live: {
        base: 'https://api.binance.us',
        websocket: 'wss://stream.binance.us:9443'
      }
    },
    apiKeyConfig: {
      keyPlaceholder: 'Enter your Binance.US API Key',
      secretPlaceholder: 'Enter your Secret Key',
      helpUrl: 'https://support.binance.us/hc/en-us/articles/360046787034-How-to-Create-an-API-Key'
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