export const BROKER_TYPES = {
    TRADOVATE: 'tradovate',
    // Add more brokers here as we expand
  };
  
  export const BROKER_FEATURES = {
    [BROKER_TYPES.TRADOVATE]: {
      supportsOAuth: true,
      supportsWebSocket: true,
      supportedOrderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
    }
  };
  