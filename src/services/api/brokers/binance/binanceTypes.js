// Binance Types and Constants
// Type definitions and constants for Binance integration

/**
 * Binance order types
 */
export const BINANCE_ORDER_TYPES = {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
    STOP_LOSS: 'STOP_LOSS',
    STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
    TAKE_PROFIT: 'TAKE_PROFIT',
    TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
};

/**
 * Binance order sides
 */
export const BINANCE_ORDER_SIDES = {
    BUY: 'BUY',
    SELL: 'SELL'
};

/**
 * Binance time in force options
 */
export const BINANCE_TIME_IN_FORCE = {
    GTC: 'GTC', // Good Till Cancel
    IOC: 'IOC', // Immediate or Cancel
    FOK: 'FOK'  // Fill or Kill
};

/**
 * Binance market types
 */
export const BINANCE_MARKET_TYPES = {
    SPOT: 'spot',
    FUTURES: 'futures'
};

/**
 * Binance account status
 */
export const BINANCE_ACCOUNT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ERROR: 'error'
};

/**
 * Binance connection states
 */
export const BINANCE_CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

/**
 * Common Binance trading pairs
 */
export const COMMON_BINANCE_PAIRS = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'ADAUSDT',
    'DOGEUSDT',
    'MATICUSDT',
    'DOTUSDT',
    'LINKUSDT'
];

/**
 * Binance API error codes
 */
export const BINANCE_ERROR_CODES = {
    INVALID_API_KEY: -2015,
    INVALID_SIGNATURE: -1022,
    INSUFFICIENT_BALANCE: -2010,
    ORDER_NOT_FOUND: -2011,
    RATE_LIMIT_EXCEEDED: -1015
};

/**
 * Get human-readable error message for Binance error code
 * @param {number} errorCode - Binance API error code
 * @returns {string} Human-readable error message
 */
export const getBinanceErrorMessage = (errorCode) => {
    const messages = {
        [-2015]: 'Invalid API key. Please check your credentials.',
        [-1022]: 'Invalid signature. Your secret key may be incorrect.',
        [-2010]: 'Insufficient balance for this trade.',
        [-2011]: 'Order not found.',
        [-1015]: 'Rate limit exceeded. Please wait and try again.'
    };
    return messages[errorCode] || 'An unknown error occurred.';
};

export default {
    BINANCE_ORDER_TYPES,
    BINANCE_ORDER_SIDES,
    BINANCE_TIME_IN_FORCE,
    BINANCE_MARKET_TYPES,
    BINANCE_ACCOUNT_STATUS,
    BINANCE_CONNECTION_STATES,
    COMMON_BINANCE_PAIRS,
    BINANCE_ERROR_CODES,
    getBinanceErrorMessage
};
