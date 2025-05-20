// src/constants/strategyTypes.js

export const STRATEGY_TYPES = {
    MOMENTUM: 'momentum',
    MEAN_REVERSION: 'mean_reversion',
    BREAKOUT: 'breakout',
    ARBITRAGE: 'arbitrage',
    SCALPING: 'scalping'
  };
  
  export const STRATEGY_TYPE_LABELS = {
    [STRATEGY_TYPES.MOMENTUM]: 'Momentum',
    [STRATEGY_TYPES.MEAN_REVERSION]: 'Mean Reversion',
    [STRATEGY_TYPES.BREAKOUT]: 'Break Out',
    [STRATEGY_TYPES.ARBITRAGE]: 'Arbitrage',
    [STRATEGY_TYPES.SCALPING]: 'Scalping'
  };
  
  export const STRATEGY_TYPE_OPTIONS = Object.entries(STRATEGY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));