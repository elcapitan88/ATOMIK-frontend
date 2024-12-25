// services/api/brokers/tradovate/tradovateTypes.js

/**
 * @typedef {Object} TradovateEnvironments
 * @property {string} DEMO - Demo environment
 * @property {string} LIVE - Live environment
 */
export const TradovateEnvironment = {
  DEMO: 'demo',
  LIVE: 'live'
};

/**
* @typedef {Object} AccountStatuses
* @property {string} ACTIVE - Active account status
* @property {string} INACTIVE - Inactive account status
* @property {string} SUSPENDED - Suspended account status
*/
export const AccountStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

/**
* @typedef {Object} AccountTypes
* @property {string} MARGIN - Margin account type
* @property {string} CASH - Cash account type
*/
export const AccountType = {
  MARGIN: 'margin',
  CASH: 'cash'
};

/**
* @typedef {Object} OrderTypes
* @property {string} MARKET - Market order type
* @property {string} LIMIT - Limit order type
* @property {string} STOP - Stop order type
* @property {string} STOP_LIMIT - Stop limit order type
*/
export const OrderType = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
  STOP_LIMIT: 'stop_limit'
};

/**
* @typedef {Object} PositionSides
* @property {string} LONG - Long position
* @property {string} SHORT - Short position
*/
export const PositionSide = {
  LONG: 'long',
  SHORT: 'short'
};

/**
* @typedef {Object} TradovateAccount
* @property {string} accountId - Unique account identifier
* @property {string} name - Account name
* @property {string} environment - Trading environment (demo/live)
* @property {string} status - Account status
* @property {string} type - Account type
* @property {number} balance - Account balance
* @property {number} availableMargin - Available margin
* @property {number} marginUsed - Used margin
* @property {boolean} active - Whether account is active
* @property {boolean} isTokenExpired - Whether access token is expired
*/

/**
* @typedef {Object} TradovatePosition
* @property {string} id - Position identifier
* @property {string} accountId - Account identifier
* @property {string} symbol - Trading symbol
* @property {string} side - Position side (long/short)
* @property {number} quantity - Position size
* @property {number} averagePrice - Average entry price
* @property {number} unrealizedPnL - Unrealized profit/loss
* @property {string} timestamp - Position timestamp
*/

/**
* @typedef {Object} TradovateOrder
* @property {string} id - Order identifier
* @property {string} accountId - Account identifier
* @property {string} symbol - Trading symbol
* @property {string} type - Order type
* @property {string} side - Order side
* @property {number} quantity - Order quantity
* @property {number} price - Order price
* @property {string} status - Order status
* @property {string} timestamp - Order timestamp
*/

/**
* @typedef {Object} TradovateWebSocketMessage
* @property {string} type - Message type
* @property {*} data - Message data
* @property {string} timestamp - Message timestamp
*/

/**
* @typedef {Object} MarketDataUpdate
* @property {string} symbol - Trading symbol
* @property {number} lastPrice - Last trade price
* @property {number} bidPrice - Best bid price
* @property {number} askPrice - Best ask price
* @property {number} volume - Trading volume
* @property {string} timestamp - Update timestamp
*/

/**
* @typedef {Object} PositionUpdate
* @property {string} accountId - Account identifier
* @property {Array<TradovatePosition>} positions - Updated positions
*/

// Export validation utilities
export const validators = {
  /**
   * Validate account data structure
   * @param {Object} account - Account to validate
   * @returns {boolean} - Validation result
   */
  isValidAccount: (account) => {
      return Boolean(
          account &&
          typeof account.accountId === 'string' &&
          typeof account.name === 'string' &&
          typeof account.environment === 'string' &&
          typeof account.status === 'string' &&
          typeof account.type === 'string' &&
          typeof account.balance === 'number' &&
          typeof account.availableMargin === 'number' &&
          typeof account.marginUsed === 'number' &&
          typeof account.active === 'boolean'
      );
  },

  /**
   * Validate position data structure
   * @param {Object} position - Position to validate
   * @returns {boolean} - Validation result
   */
  isValidPosition: (position) => {
      return Boolean(
          position &&
          typeof position.id === 'string' &&
          typeof position.accountId === 'string' &&
          typeof position.symbol === 'string' &&
          typeof position.side === 'string' &&
          typeof position.quantity === 'number' &&
          typeof position.averagePrice === 'number'
      );
  },

  /**
   * Validate order data structure
   * @param {Object} order - Order to validate
   * @returns {boolean} - Validation result
   */
  isValidOrder: (order) => {
      return Boolean(
          order &&
          typeof order.id === 'string' &&
          typeof order.accountId === 'string' &&
          typeof order.symbol === 'string' &&
          typeof order.type === 'string' &&
          typeof order.side === 'string' &&
          typeof order.quantity === 'number' &&
          typeof order.price === 'number'
      );
  }
};

export default {
  TradovateEnvironment,
  AccountStatus,
  AccountType,
  OrderType,
  PositionSide,
  validators
};