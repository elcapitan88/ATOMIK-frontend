# Purple Reign Fix Deployment Guide

## Changes Made

### 1. Strategy Engine - Fixed Signal Validation Error
**File:** `strategy-engine/strategies/purple_reign.py`

**Lines Changed:**
- Line 681: Added `price=tick.price,` to BUY signal
- Line 752: Added `price=price,` to SELL signal

This fixes the validation error that was preventing Purple Reign signals from being sent to the notification service.

### 2. Notification Service - Added Purple Reign Webhook Support ✅ COMMITTED
**File:** `notification-service/src/config.py`
**Status:** Already committed and pushed to main branch

Added configuration to support Purple Reign Discord webhook:
- Lines 72-80: Added Purple Reign webhook configuration
- Supports environment variable: `PURPLE_REIGN_DISCORD_WEBHOOK`

**Commit:** c4a8e3d on main branch

## Deployment Steps

### 1. Deploy Strategy Engine Fix
Since the git repository has issues, manually deploy the fix:

```bash
# On the production server:
# 1. Navigate to strategy-engine directory
cd /path/to/strategy-engine

# 2. Edit the purple_reign.py file
# Add price field to line 681:
price=tick.price,

# Add price field to line 752:
price=price,

# 3. Restart the strategy engine
pm2 restart strategy-engine
# or
systemctl restart strategy-engine
```

### 2. Configure Purple Reign Webhook
```bash
# Add to notification service .env file:
PURPLE_REIGN_DISCORD_WEBHOOK=YOUR_DISCORD_WEBHOOK_URL_HERE

# Restart notification service
pm2 restart notification-service
```

## Verification

After deployment, check logs for:
1. Purple Reign entries without validation errors
2. Successful signal publishing to notification service
3. Discord messages appearing in configured channel

## Signal Format
Purple Reign signals will appear in Discord as:

**Entry:**
```
🟢 BUY Signal - Purple Reign
Symbol: ES
Price: $6837.75
Time: 2025-10-24 17:24:36 UTC
Comment: Entry: TTM Squeeze active, MACD=0.00>-0.02, Stop=6828.25
```

**Exit:**
```
🔴 SELL Signal - Purple Reign
Symbol: ES
Price: $6845.50
Time: 2025-10-24 17:45:00 UTC
Comment: Exit: PSAR crossover at 6844.25
```

## Current Status
- ✅ Notification service changes: COMMITTED and PUSHED
- ⏳ Strategy engine changes: FIXED LOCALLY, needs manual deployment
- ⏳ Discord webhook: Waiting for URL configuration