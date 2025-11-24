# Market Hours Implementation Plan - ✅ COMPLETED

**Status**: COMPLETED on Sept 4, 2025  
**Duration**: ~4 hours (as estimated)  
**Result**: Successfully implemented market hours calculator with gap handling for continuous trading bars

## Objective
Implement a market hours utility in atomik-data-hub to ensure strategies receive exactly N continuous trading bars of historical data, accounting for weekends, holidays, and maintenance windows.

## Success Criteria
- [ ] Strategy requests 300 bars and receives exactly 300 continuous trading bars
- [ ] Bars span correct time periods (skip weekends/holidays)
- [ ] MA(200) and other indicators calculate correctly from initialization
- [ ] No warmup period required for strategies

---

## Phase 1: Core Utility Module (2 hours)

### 1.1 Create Market Hours Calculator
- [ ] Create `atomik-data-hub/src/mcp_financial_server/utils/market_hours.py`
- [ ] Implement `MarketHoursCalculator` class with CME exchange rules
- [ ] Add CME trading hours (Sun 6pm - Fri 5pm ET)
- [ ] Add daily maintenance window (5-6pm ET)

### 1.2 Add Holiday Calendar
- [ ] Add 2025 CME holidays list
- [ ] Add 2026 CME holidays list  
- [ ] Implement `is_holiday()` method
- [ ] Handle partial trading days

### 1.3 Core Calculation Logic
- [ ] Implement `calculate_trading_range(bars_needed, as_of)` method
- [ ] Add logic to skip weekends (Fri 5pm - Sun 6pm ET)
- [ ] Add logic to skip holidays
- [ ] Add logic to skip maintenance windows

---

## Phase 2: Integration (1 hour)

### 2.1 Update Data Bento Provider
- [ ] Import `MarketHoursCalculator` in `databento_enhanced.py`
- [ ] Replace fixed date logic with calculator
- [ ] Update `get_historical_bars()` to use calculated range
- [ ] Ensure exactly N bars are returned

### 2.2 Error Handling
- [ ] Handle edge cases (request during maintenance window)
- [ ] Add validation for returned bar count
- [ ] Add logging for debugging
- [ ] Handle insufficient data scenarios

---

## Phase 3: Testing & Validation (1 hour)

### 3.1 Unit Tests
- [ ] Test weekend calculation (Friday → Sunday request)
- [ ] Test holiday skipping (Labor Day example)
- [ ] Test maintenance window handling
- [ ] Test various bar counts (100, 300, 1000)

### 3.2 Integration Testing
- [ ] Test with live API - request 300 bars on Sunday night
- [ ] Verify continuous data (no gaps in sequence)
- [ ] Verify correct time stamps on bars
- [ ] Test stddev_breakout strategy initialization

### 3.3 Edge Cases
- [ ] Test request at market open
- [ ] Test request during maintenance window
- [ ] Test request on holiday
- [ ] Test request for more bars than available

---

## Phase 4: Deploy & Monitor (30 min)

### 4.1 Deployment
- [ ] Commit changes to atomik-data-hub
- [ ] Deploy to Railway (development)
- [ ] Monitor logs for errors

### 4.2 Verification
- [ ] Run strategy engine with stddev_breakout
- [ ] Verify strategy receives 300 bars
- [ ] Check indicator calculations are correct
- [ ] Confirm no warmup period needed

---

## Implementation Order

1. **Start with simplest case**: Weekday to weekday (no gaps)
2. **Add weekend handling**: Friday to Sunday logic
3. **Add holiday support**: Labor Day, Christmas, etc.
4. **Add maintenance windows**: Daily 5-6pm ET gap
5. **Test with real data**: Verify with actual API calls

## Code Structure

```
atomik-data-hub/
├── src/
│   └── mcp_financial_server/
│       ├── utils/
│       │   ├── __init__.py
│       │   └── market_hours.py       # New utility
│       └── providers/
│           └── databento_enhanced.py  # Updated to use utility
```

## Key Functions

```python
# Primary function strategies indirectly use
calculate_trading_range(bars_needed=300, interval='1m', as_of=None)
→ Returns: (start_datetime, end_datetime)

# Helper functions
is_trading_time(timestamp) → bool
get_previous_trading_minute(timestamp) → datetime
skip_to_previous_session(timestamp) → datetime
```

## Testing Checklist

- [ ] Monday morning → needs Friday data
- [ ] Sunday night → needs Friday + Sunday data  
- [ ] Tuesday after Labor Day → skips Monday
- [ ] Any day at 5:30pm ET → skips maintenance
- [ ] Request for 1440 bars → handles multiple days

## Notes

- Start with CME hours only (futures focus)
- Can extend to other exchanges later
- Keep holidays updatable (config file?)
- Log all gaps found for debugging

---

**Total Estimated Time: 4.5 hours**

**Priority: HIGH** - Blocking strategy initialization accuracy