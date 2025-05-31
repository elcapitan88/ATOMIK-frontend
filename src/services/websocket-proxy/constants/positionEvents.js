// Position WebSocket Event Types
export const POSITION_MESSAGE_TYPES = {
  // Position lifecycle events
  POSITION_OPENED: 'position_opened',
  POSITION_CLOSED: 'position_closed',
  POSITION_UPDATED: 'position_updated',
  POSITION_PARTIAL_FILL: 'position_partial_fill',
  
  // Price and P&L updates
  POSITION_PRICE_UPDATE: 'position_price_update',
  POSITION_PNL_UPDATE: 'position_pnl_update',
  
  // Bulk updates
  POSITIONS_SNAPSHOT: 'positions_snapshot',
  POSITIONS_REFRESH: 'positions_refresh',
  
  // Error events
  POSITION_ERROR: 'position_error',
  
  // Legacy support
  POSITION_UPDATE: 'position_update' // Current implementation
};

// Position update priorities
export const POSITION_UPDATE_PRIORITY = {
  CRITICAL: 'critical', // Position opened/closed
  HIGH: 'high',        // P&L changes
  NORMAL: 'normal',    // Price updates
  LOW: 'low'           // Metadata updates
};

// Position data structure templates
export const POSITION_DATA_TEMPLATES = {
  // New position opened
  opened: {
    type: POSITION_MESSAGE_TYPES.POSITION_OPENED,
    data: {
      positionId: null,
      accountId: null,
      symbol: null,
      side: null, // 'LONG' or 'SHORT'
      quantity: null,
      avgPrice: null,
      currentPrice: null,
      unrealizedPnL: 0,
      realizedPnL: 0,
      timeEntered: null,
      lastUpdate: null,
      contractInfo: {
        name: null,
        tickSize: null,
        tickValue: null,
        exchange: null
      }
    }
  },
  
  // Position closed
  closed: {
    type: POSITION_MESSAGE_TYPES.POSITION_CLOSED,
    data: {
      positionId: null,
      accountId: null,
      symbol: null,
      closedQuantity: null,
      closePrice: null,
      realizedPnL: null,
      timeClosed: null,
      reason: null // 'manual', 'stop_loss', 'take_profit', 'margin_call'
    }
  },
  
  // Real-time price/P&L update
  priceUpdate: {
    type: POSITION_MESSAGE_TYPES.POSITION_PRICE_UPDATE,
    data: {
      positionId: null,
      accountId: null,
      currentPrice: null,
      previousPrice: null,
      unrealizedPnL: null,
      previousPnL: null,
      priceChange: null,
      priceChangePercent: null,
      timestamp: null
    }
  },
  
  // Position modification
  updated: {
    type: POSITION_MESSAGE_TYPES.POSITION_UPDATED,
    data: {
      positionId: null,
      accountId: null,
      updates: {
        // Only include changed fields
        quantity: null,
        avgPrice: null,
        stopLoss: null,
        takeProfit: null
      },
      timestamp: null
    }
  }
};

// Animation timing constants
export const POSITION_ANIMATION_DURATION = {
  FLASH: 300,      // Quick flash for updates
  FADE: 500,       // Fade in/out
  SLIDE: 400,      // Slide animations
  PULSE: 1000      // Pulse for important updates
};

// Update frequency limits
export const POSITION_UPDATE_THROTTLE = {
  PRICE_UPDATE: 1000,    // Max 1 price update per second per position
  PNL_UPDATE: 500,       // Max 2 P&L updates per second
  BULK_UPDATE: 2000      // Max 1 bulk update per 2 seconds
};

// Position state indicators
export const POSITION_STATE = {
  LIVE: 'live',          // Receiving real-time updates
  STALE: 'stale',        // No updates for > 5 seconds
  DELAYED: 'delayed',    // Updates are delayed
  ERROR: 'error',        // Error state
  CLOSED: 'closed'       // Position closed
};

// Helper functions
export const isPositionUpdateEvent = (type) => {
  return Object.values(POSITION_MESSAGE_TYPES).includes(type);
};

export const getPriorityForEventType = (type) => {
  switch (type) {
    case POSITION_MESSAGE_TYPES.POSITION_OPENED:
    case POSITION_MESSAGE_TYPES.POSITION_CLOSED:
      return POSITION_UPDATE_PRIORITY.CRITICAL;
    case POSITION_MESSAGE_TYPES.POSITION_PNL_UPDATE:
      return POSITION_UPDATE_PRIORITY.HIGH;
    case POSITION_MESSAGE_TYPES.POSITION_PRICE_UPDATE:
      return POSITION_UPDATE_PRIORITY.NORMAL;
    default:
      return POSITION_UPDATE_PRIORITY.LOW;
  }
};

export const shouldAnimateUpdate = (type, previousValue, newValue) => {
  // Determine if an update should trigger animation
  if (type === POSITION_MESSAGE_TYPES.POSITION_OPENED) return true;
  if (type === POSITION_MESSAGE_TYPES.POSITION_CLOSED) return true;
  
  if (type === POSITION_MESSAGE_TYPES.POSITION_PNL_UPDATE) {
    // Animate if P&L change is significant (> $10 or > 5%)
    const change = Math.abs(newValue - previousValue);
    const percentChange = Math.abs((newValue - previousValue) / previousValue) * 100;
    return change > 10 || percentChange > 5;
  }
  
  return false;
};