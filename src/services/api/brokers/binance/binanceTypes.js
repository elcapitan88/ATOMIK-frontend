// services/api/brokers/binance/binanceTypes.js

export const BinanceEnvironment = {
  LIVE: 'live'
};

export const BinanceOrderType = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  STOP_LOSS: 'STOP_LOSS',
  STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
};

export const BinanceOrderSide = {
  BUY: 'BUY',
  SELL: 'SELL'
};

export const BinanceTimeInForce = {
  GTC: 'GTC', // Good Till Cancel
  IOC: 'IOC', // Immediate or Cancel
  FOK: 'FOK'  // Fill or Kill
};

export const BinanceOrderStatus = {
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELED: 'CANCELED',
  PENDING_CANCEL: 'PENDING_CANCEL',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

export const BinanceMarketType = {
  SPOT: 'spot',
  FUTURES: 'futures'
};

export const BinanceSymbolType = {
  SPOT: 'SPOT',
  FUTURES: 'FUTURES'
};

// Common Binance error codes
export const BinanceErrorCodes = {
  INVALID_API_KEY: -2014,
  INVALID_SIGNATURE: -1022,
  TIMESTAMP_OUT_OF_RECV_WINDOW: -1021,
  API_KEY_FORMAT_INVALID: -2013,
  TOO_MANY_REQUESTS: -1003,
  INSUFFICIENT_BALANCE: -2010
};

// Rate limit weights for different endpoints
export const BinanceEndpointWeights = {
  ACCOUNT: 10,
  ORDER: 1,
  CANCEL_ORDER: 1,
  OPEN_ORDERS: 3,
  ALL_ORDERS: 10,
  BALANCE: 10,
  EXCHANGE_INFO: 10
};

export default {
  BinanceEnvironment,
  BinanceOrderType,
  BinanceOrderSide,
  BinanceTimeInForce,
  BinanceOrderStatus,
  BinanceMarketType,
  BinanceSymbolType,
  BinanceErrorCodes,
  BinanceEndpointWeights
};