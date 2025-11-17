# PurpleReign Strategy Implementation Plan

## Overview
Migration of existing PurpleReign webhook-based strategies to Python engine strategies. Currently, Purple Reign exists as webhook strategies (NQ and ES variants) that receive signals from TradingView. This plan outlines the conversion to internal engine strategies for better performance, real-time execution, and elimination of TradingView dependency.

## Current State
- **Existing Implementation**: Webhook-based strategies receiving TradingView alerts
- **Variants**: Purple Reign NQ (NQ/MNQ) and Purple Reign ES (ES/MES)
- **Source**: TradingView Pine Script (`Purplereign.pine`)
- **Target**: Native Python engine strategies with Databento tick data

## Key Requirements
- **Timeframe**: 5-minute bars
- **Symbols**: NQ and ES futures
- **Trading Hours**: NYSE market hours (9:30 AM - 4:00 PM ET)
- **End-of-Day**: Close all positions at 3:59 PM ET
- **Real-time Execution**: Enter on tick without waiting for bar completion
- **Anti-Repaint**: One signal maximum per 5-minute bar
- **Logging**: All logs prefixed with "PurpleReign.{symbol}"

---

## Phase 1: Core Infrastructure ⏳

### 1.1 Create Base Strategy Class
- [ ] Create `purple_reign_strategy.py` in `strategy-engine/strategies/`
- [ ] Inherit from `BaseStrategy`
- [ ] Set up class metadata (name, version, symbols)

### 1.2 Logging System
- [ ] Initialize logger with `PurpleReign.{symbol}` prefix
- [ ] Create log levels for different events:
  - INFO: Entry/exit signals
  - DEBUG: Indicator calculations
  - WARNING: Stop adjustments

### 1.3 Bar Aggregation System
- [ ] Implement 5-minute bar aggregation from ticks
- [ ] Create bar storage structure (Dict[str, deque])
- [ ] Handle bar completion and rollover
- [ ] Track current forming bar separately

### 1.4 Trading Session Management
- [ ] Define NYSE trading hours (9:30 AM - 4:00 PM ET)
- [ ] Implement timezone handling (ET conversion)
- [ ] Create end-of-day exit timer (3:59 PM ET)
- [ ] Add session validation checks

### 1.5 Anti-Repaint Protection
- [ ] Create `last_signal_bar` tracking dictionary
- [ ] Implement bar timestamp rounding (5-min intervals)
- [ ] Add signal duplicate prevention logic

### 1.6 State Management Structure
```python
# Initialize dictionaries for multi-symbol tracking:
- bars: Dict[str, deque]  # Historical bars
- current_bar: Dict[str, dict]  # Forming bar
- positions: Dict[str, int]  # Position status
- entry_prices: Dict[str, float]  # Entry tracking
- stop_losses: Dict[str, float]  # Active stops
- using_psar: Dict[str, bool]  # Stop type flag
- last_signal_bar: Dict[str, datetime]  # Anti-repaint
```

---

## Phase 2: Indicator Calculations 📊

### 2.1 TTM Squeeze Components
- [ ] Implement Bollinger Bands calculation
  - Period: 18
  - Multiplier: 2.0
  - Calculate mean, upper, lower bands
- [ ] Implement Keltner Channels calculation
  - Period: 18
  - Multiplier: 1.5
  - ATR-based calculation
- [ ] Create squeeze detection logic
  ```python
  squeeze = (bb_upper < kc_upper) and (bb_lower > kc_lower)
  ```

### 2.2 TTM Momentum
- [ ] Implement momentum calculation using linear regression
- [ ] Calculate midpoint price
- [ ] Apply 18-period linear regression
- [ ] Track momentum history (current, 1-bar, 2-bar ago)

### 2.3 MACD Implementation
- [ ] Fast EMA: 8 periods
- [ ] Slow EMA: 17 periods
- [ ] Signal EMA: 9 periods
- [ ] Calculate histogram (MACD - Signal)
- [ ] Track histogram history (current, 1-bar, 2-bar ago)

### 2.4 Support Indicators
- [ ] Implement 18-period lowest low calculation
- [ ] Port PSAR calculation from `stddev_breakout.py`
  - Start: 0.02
  - Increment: 0.02
  - Maximum: 0.2
- [ ] Add helper functions for indicator caching

### 2.5 Continuous Calculation
- [ ] Update indicators on every tick (including partial bar)
- [ ] Implement efficient recalculation triggers
- [ ] Cache management for performance

---

## Phase 3: Signal Generation Logic 🎯

### 3.1 Entry Signal Detection
- [ ] MACD signal logic:
  ```python
  macd_signal = (macd_hist > 0) and
                (macd_hist > macd_hist_1 or macd_hist > macd_hist_2)
  ```
- [ ] TTM signal logic:
  ```python
  ttm_signal = (ttm_momentum > 0) and
               (ttm_momentum > ttm_mom_1 or ttm_momentum > ttm_mom_2)
  ```
- [ ] Combined entry condition:
  ```python
  entry = ttm_squeeze and (macd_signal or ttm_signal) and in_session
  ```

### 3.2 Signal Mode Selection
- [ ] Add configuration parameter for signal source
- [ ] Implement "MACD" mode
- [ ] Implement "TTM" mode
- [ ] Default to MACD mode

### 3.3 Signal Generation
- [ ] Create Signal objects with proper metadata
- [ ] Add entry price tracking
- [ ] Include indicator values in signal comments
- [ ] Implement position size calculation

### 3.4 Anti-Repaint Enforcement
- [ ] Check `last_signal_bar` before generating signal
- [ ] Update tracking after successful signal
- [ ] Log rejected duplicate attempts

---

## Phase 4: Risk Management & Stops 🛡️

### 4.1 Initial Stop Loss
- [ ] Calculate 18-bar lowest low on entry
- [ ] Store initial stop in `stop_losses` dict
- [ ] Set `using_psar` flag to False

### 4.2 PSAR Stop Transition
- [ ] Monitor position profitability
- [ ] Check PSAR position relative to price
- [ ] Transition conditions:
  ```python
  if psar < current_price and psar > entry_price:
      active_stop = psar
      using_psar = True
  ```

### 4.3 Exit Logic Implementation
- [ ] Stop loss monitoring (tick-by-tick)
- [ ] PSAR crossover detection:
  ```python
  psar_crossover = prev_psar_below and not curr_psar_below
  ```
- [ ] End-of-day forced exit (3:59 PM ET)
- [ ] Generate exit signals with reasons

### 4.4 Position Management
- [ ] Track entry prices per symbol
- [ ] Update position status on fills
- [ ] Reset state on position close
- [ ] Handle partial fills if needed

---

## Phase 5: Testing & Validation ✅

### 5.1 Unit Tests
- [ ] Test bar aggregation logic
- [ ] Test indicator calculations against Pine Script
- [ ] Test signal generation conditions
- [ ] Test anti-repaint protection
- [ ] Test session management

### 5.2 Integration Testing
- [ ] Test with historical data replay
- [ ] Verify indicator accuracy
- [ ] Validate entry/exit timing
- [ ] Check stop loss transitions
- [ ] Confirm end-of-day exits

### 5.3 Paper Trading Validation
- [ ] Run parallel with Pine Script version
- [ ] Compare entry/exit points
- [ ] Verify indicator values match
- [ ] Check for repainting issues
- [ ] Monitor performance metrics

### 5.4 Production Readiness
- [ ] Performance optimization
- [ ] Memory usage validation
- [ ] Error handling coverage
- [ ] Logging completeness
- [ ] Configuration documentation

---

## Phase 6: Deployment & Monitoring 🚀

### 6.1 Configuration
- [ ] Add to strategy loader configuration
- [ ] Set appropriate risk parameters
- [ ] Configure symbol-specific settings
- [ ] Enable for NQ and ES

### 6.2 Monitoring Setup
- [ ] Create PurpleReign-specific dashboards
- [ ] Set up alerting for errors
- [ ] Configure performance tracking
- [ ] Implement health checks

### 6.3 Documentation
- [ ] Create user documentation
- [ ] Document configuration options
- [ ] Add troubleshooting guide
- [ ] Include backtest results

---

## Implementation Notes

### Critical Success Factors
1. **Real-time Execution**: Must enter positions immediately when conditions are met
2. **Anti-Repaint**: Strictly one signal per 5-minute bar
3. **Accurate Indicators**: Match Pine Script calculations exactly
4. **Stop Management**: Smooth transition from initial stop to PSAR
5. **Session Control**: Reliable end-of-day position closing

### Performance Considerations
- Cache indicator values when possible
- Use deque for efficient bar management
- Minimize calculations in hot path
- Batch database operations

### Risk Controls
- Maximum position limits per symbol
- Stop loss always active
- End-of-day exit mandatory
- Session time validation

### Logging Strategy
```python
# Entry
[PurpleReign.NQ] Entry signal: TTM=True, MACD_hist=0.5>0.3, Price=15250.50

# Stop Management
[PurpleReign.NQ] Stop transitioned to PSAR: 15245.25 (entry: 15230.00)

# Exit
[PurpleReign.NQ] Exit signal: PSAR crossover detected at 15255.75
```

---

## Phase 7: Frontend & Marketplace Migration 🔄

### 7.1 Migration Strategy
- [ ] Identify current Purple Reign webhook users
- [ ] Document performance metrics of webhook version
- [ ] Create migration timeline and communication plan
- [ ] Set parallel running period (webhook + engine)

### 7.2 Database Updates
- [ ] Create new engine strategy entries:
  - [ ] purple_reign_nq (replaces webhook NQ variant)
  - [ ] purple_reign_es (replaces webhook ES variant)
- [ ] Maintain webhook versions during transition
- [ ] Link engine strategies to same marketplace listings

### 7.3 User Migration Flow
- [ ] Auto-detection of webhook Purple Reign users
- [ ] In-app notification about engine version availability
- [ ] One-click migration option:
  - [ ] Preserve user settings
  - [ ] Transfer position limits
  - [ ] Maintain subscription status
- [ ] Rollback option during transition period

### 7.4 Marketplace Updates
- [ ] Update strategy descriptions to highlight improvements:
  - [ ] "Now with real-time execution!"
  - [ ] "No TradingView subscription required"
  - [ ] "Lower latency with direct market data"
- [ ] Show performance comparison (webhook vs engine)
- [ ] Maintain user ratings and reviews

### 7.5 Webhook Sunset Plan
- [ ] 30-day parallel running period
- [ ] Performance comparison dashboard
- [ ] Gradual migration encouragement:
  - Week 1-2: Soft launch to select users
  - Week 3-4: Open migration to all users
  - Week 5+: Deprecation notices for webhook version
- [ ] Final webhook shutdown date (60 days)

### 7.6 ARIA Assistant Updates
- [ ] Update commands to reference engine version
- [ ] Add migration assistance commands:
  - [ ] "Migrate my Purple Reign to engine version"
  - [ ] "Compare Purple Reign webhook vs engine performance"
  - [ ] "Show Purple Reign migration status"
- [ ] Update help documentation

---

## Progress Tracking

- [ ] Phase 1: Core Infrastructure
- [ ] Phase 2: Indicator Calculations
- [ ] Phase 3: Signal Generation Logic
- [ ] Phase 4: Risk Management & Stops
- [ ] Phase 5: Testing & Validation
- [ ] Phase 6: Deployment & Monitoring
- [ ] Phase 7: Frontend & Marketplace Migration

**Target Completion Date**: _TBD_

**Current Status**: Planning Complete ✅

## Migration Benefits

### For Users
1. **Lower Latency**: Direct tick processing vs webhook delays
2. **No TradingView Costs**: Eliminates need for TradingView subscription
3. **Better Fills**: Real-time execution on tick data
4. **Enhanced Features**: More sophisticated stop management
5. **Improved Reliability**: No webhook/alert failures

### For Platform
1. **Full Control**: All logic in-house
2. **Better Monitoring**: Native performance tracking
3. **Cost Reduction**: No external dependencies
4. **Feature Velocity**: Faster iteration and improvements
5. **Data Advantage**: Leverages Databento's superior data quality

---

## References
- Original Pine Script: `/PRJCT/Purplereign.pine`
- Base Strategy: `/strategy-engine/strategies/base_strategy.py`
- PSAR Reference: `/strategy-engine/strategies/examples/stddev_breakout.py`
- Strategy Engine: `/strategy-engine/src/strategy_engine.py`