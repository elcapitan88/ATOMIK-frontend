# Notification Service Implementation Plan

## Overview
A dedicated microservice for handling all third-party notifications (Discord, Telegram, Slack, Email, SMS, Webhooks) triggered by trading signals from BOTH Strategy Engine strategies AND webhook-based strategies (TradingView alerts).

## Architecture Design

### Service Communication Flow
```
Strategy Engine → Signal Generated          Webhook Strategy (TradingView)
        ↓                                            ↓
   Redis Pub/Sub                            FastAPI Backend
   (signal.generated)                              ↓
        ↓                                    Redis Pub/Sub
        ↓                                   (webhook.signal)
        ↓                                           ↓
        └──────────> Notification Service <────────┘
                     (subscribes to both events)
                            ↓
                      Dispatcher (routes to channels)
                            ↓
                 Channel Handlers (Discord, etc.)
                            ↓
                    Third-Party Services
```

## Signal Sources

### 1. Strategy Engine Signals
- Real-time strategies running in Strategy Engine
- Direct market data processing
- Examples: break-and-enter, stddev_breakout

### 2. Webhook-Based Signals
- TradingView alerts via webhooks
- Third-party strategy providers
- Custom user strategies
- Processed through FastAPI Backend webhook endpoint

## Core Components

### 1. Project Structure
```
notification-service/
├── src/
│   ├── main.py                 # FastAPI app & startup
│   ├── config.py                # Service configuration
│   ├── models.py                # Data models
│   ├── redis_client.py          # Redis pub/sub handler
│   ├── dispatcher.py            # Core notification dispatcher
│   ├── channels/
│   │   ├── base.py             # Abstract channel class
│   │   ├── discord.py          # Discord implementation
│   │   ├── telegram.py         # Telegram implementation (future)
│   │   ├── slack.py            # Slack implementation (future)
│   │   ├── email.py            # Email implementation (future)
│   │   ├── sms.py              # SMS implementation (future)
│   │   └── webhook.py          # Generic webhook (future)
│   ├── formatters/
│   │   ├── signal_formatter.py # Format signal data for display
│   │   └── templates.py        # Message templates
│   └── api/
│       └── health.py           # Health check endpoints
├── tests/
├── requirements.txt
├── Dockerfile
├── railway.json                # Railway deployment config
└── .env.example
```

## Data Models

### Strategy Engine Signal Event
```python
{
    "event_type": "signal.generated",
    "source": "strategy_engine",
    "timestamp": "2025-09-04T13:32:00Z",
    "data": {
        "strategy_name": "break-and-enter",
        "action": "BUY",  # or "SELL", "EXIT_50", "EXIT_FINAL"
        "symbol": "MNQI",
        "price": 23488.75,
        "timestamp": "2025-09-04T13:32:00Z",
        "comment": "EXIT_50",  # Optional, for partial exits
        "metadata": {}
    }
}
```

### Webhook Strategy Signal Event
```python
{
    "event_type": "webhook.signal",
    "source": "webhook",
    "timestamp": "2025-09-04T13:32:00Z",
    "data": {
        "webhook_id": "uuid",
        "webhook_name": "My TradingView Strategy",
        "strategy_type": "tradingview",
        "action": "BUY",  # or "SELL", "EXIT", etc.
        "symbol": "MNQI",
        "price": 23488.75,
        "timestamp": "2025-09-04T13:32:00Z",
        "alert_message": "Original TradingView message",
        "user_id": "uuid",
        "metadata": {
            "source_ip": "1.2.3.4",
            "verified": true
        }
    }
}
```

## Configuration Management (No Database Required)

### Environment-Based Configuration
```python
# config.py - Simple configuration using environment variables
import os
from typing import Dict, List

class NotificationConfig:
    """Configuration for notification destinations"""

    # Strategy Engine strategies
    STRATEGY_CONFIGS = {
        "break-and-enter": {
            "discord": [
                os.getenv("BREAK_ENTER_DISCORD_WEBHOOK"),
                # Add more webhooks if needed
            ],
            "enabled": True
        },
        "stddev_breakout": {
            "discord": [
                os.getenv("STDDEV_DISCORD_WEBHOOK"),
            ],
            "enabled": os.getenv("ENABLE_STDDEV_NOTIFICATIONS", "false").lower() == "true"
        }
    }

    # Default webhook strategy configuration
    WEBHOOK_DEFAULT_CONFIG = {
        "discord": [
            os.getenv("WEBHOOK_DEFAULT_DISCORD"),
        ],
        "enabled": True
    }

    # Per webhook ID overrides (optional)
    WEBHOOK_SPECIFIC_CONFIGS = {
        # "webhook-uuid": {
        #     "discord": ["specific-discord-webhook-url"],
        #     "enabled": True
        # }
    }
```

### Multiple Webhook Support
Each strategy can have multiple Discord webhooks (or other channels in the future) configured via environment variables without needing database storage.

## Railway Deployment

### Railway Configuration
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Environment Variables (Railway)
```env
# Service Configuration
SERVICE_NAME=notification-service
ENVIRONMENT=production
LOG_LEVEL=INFO
PORT=8000

# Redis Connection (Railway Redis)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_STRATEGY_CHANNEL=signals
REDIS_WEBHOOK_CHANNEL=webhook_signals

# Discord Webhooks - Strategy Engine
BREAK_ENTER_DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
STDDEV_DISCORD_WEBHOOK=https://discord.com/api/webhooks/...

# Discord Webhooks - Webhook Strategies
WEBHOOK_DEFAULT_DISCORD=https://discord.com/api/webhooks/...

# Feature Flags
ENABLE_WEBHOOK_STRATEGIES=true
ENABLE_ENGINE_STRATEGIES=true
ENABLE_STDDEV_NOTIFICATIONS=false  # Enable when ready

# Discord Configuration
DISCORD_RATE_LIMIT=5  # messages per second
DISCORD_USERNAME=Atomik Trading Bot
DISCORD_AVATAR_URL=https://example.com/avatar.png  # Optional

# Future Channels (placeholders - not implemented yet)
TELEGRAM_BOT_TOKEN=
SLACK_BOT_TOKEN=
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=
SMS_PROVIDER=

# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY_SECONDS=1
RETRY_BACKOFF_MULTIPLIER=2
```

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Implementation Phases

### Phase 1: Core Infrastructure + Discord (Immediate - NO DATABASE)
1. **Service Setup**
   - FastAPI application structure
   - Redis pub/sub for BOTH channels:
     - `signals` channel for Strategy Engine
     - `webhook_signals` channel for webhook strategies
   - Environment-based configuration
   - Railway deployment setup

2. **Discord Integration**
   - Rich embed formatting matching your example
   - Different formatting for strategy vs webhook signals
   - Color coding:
     - Green for BUY
     - Red for SELL
     - Orange for partial exits (EXIT_50, EXIT_FINAL)
     - Blue for webhook signals
   - Support for multiple Discord webhooks per strategy
   - Error handling and retry logic

3. **Signal Processing**
   - Subscribe to both Redis channels
   - Parse signals from both sources
   - Look up configuration from environment variables
   - Route to appropriate Discord webhooks
   - Send formatted notifications

4. **Railway Deployment**
   - Deploy to Railway
   - Configure environment variables
   - Set up Redis connection
   - Monitor logs and health

### Phase 2: Additional Channels (Future - Still NO DATABASE)
1. **Telegram Integration**
   - Bot setup with environment variable for token
   - Chat ID configuration via environment

2. **Slack Integration**
   - Webhook URLs in environment variables
   - Rich message formatting

3. **Email/SMS**
   - SMTP configuration via environment
   - SMS provider credentials

### Phase 3: Advanced Features (Future - Consider Database)
This is when you might want to add database support:
- User self-service configuration via UI
- Dynamic webhook management
- Notification history/audit logs
- User-specific filtering rules
- Analytics dashboard

**Note**: Database is completely optional and only needed when you want users to manage their own notification settings through the UI.

## Integration Points

### Strategy Engine Modification
```python
# In strategy_engine.py, after signal generation:
async def send_signal(self, signal: Signal) -> bool:
    # Existing execution code...

    # Publish to Redis for notifications
    try:
        event = {
            "event_type": "signal.generated",
            "source": "strategy_engine",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "strategy_name": signal.strategy_name,
                "action": signal.action.value,
                "symbol": signal.symbol,
                "price": signal.price,
                "comment": signal.comment,  # For EXIT_50, EXIT_FINAL
                "timestamp": signal.timestamp.isoformat()
            }
        }
        await redis_client.publish("signals", json.dumps(event))
        logger.info(f"Published signal to notification service: {signal.strategy_name} {signal.action.value}")
    except Exception as e:
        logger.error(f"Failed to publish signal to notifications: {e}")
        # Don't fail the trade execution if notification fails
```

### FastAPI Backend Modification
```python
# In webhooks.py endpoint, after processing webhook:
async def process_webhook_signal(webhook_data):
    # Existing webhook processing...

    # Publish to Redis for notifications
    try:
        event = {
            "event_type": "webhook.signal",
            "source": "webhook",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "webhook_id": webhook.id,
                "webhook_name": webhook.name,
                "strategy_type": webhook.strategy_type,
                "action": parsed_action,
                "symbol": parsed_symbol,
                "price": parsed_price,
                "user_id": webhook.user_id,
                "alert_message": original_message
            }
        }
        await redis_client.publish("webhook_signals", json.dumps(event))
        logger.info(f"Published webhook signal to notification service: {webhook.name}")
    except Exception as e:
        logger.error(f"Failed to publish webhook signal to notifications: {e}")
        # Don't fail the webhook processing if notification fails
```

## Discord Message Formats

### Strategy Engine Signal
```python
embed = {
    "title": f"🚨 {strategy_name.upper()} SIGNAL 🚨",
    "description": f"{strategy_name} Strategy",
    "color": get_color_for_action(action),  # Green/Red/Orange
    "fields": [
        {"name": "🎯 Action", "value": f"{action_emoji} {action}", "inline": True},
        {"name": "📊 Ticker", "value": symbol, "inline": True},
        {"name": "💰 Price", "value": f"${price:,.2f}", "inline": True},
        {"name": "🕐 Time", "value": timestamp, "inline": False}
    ],
    "footer": {"text": f"{strategy_name} Strategy • {timestamp}"},
    "timestamp": timestamp
}
```

### Webhook Strategy Signal
```python
embed = {
    "title": f"📡 WEBHOOK SIGNAL 📡",
    "description": f"{webhook_name}",
    "color": 0x3498db,  # Blue for webhook signals
    "fields": [
        {"name": "🎯 Action", "value": f"{action_emoji} {action}", "inline": True},
        {"name": "📊 Ticker", "value": symbol, "inline": True},
        {"name": "💰 Price", "value": f"${price:,.2f}", "inline": True},
        {"name": "📝 Source", "value": strategy_type, "inline": True},
        {"name": "🕐 Time", "value": timestamp, "inline": False}
    ],
    "footer": {"text": f"Webhook Strategy • {webhook_name} • {timestamp}"},
    "timestamp": timestamp
}
```

### Action Emoji Mapping
```python
ACTION_EMOJIS = {
    "BUY": "🟢",
    "SELL": "🔴",
    "EXIT_50": "🟠",
    "EXIT_FINAL": "🟠",
    "EXIT": "🟠"
}

COLOR_MAPPING = {
    "BUY": 0x00ff00,      # Green
    "SELL": 0xff0000,     # Red
    "EXIT_50": 0xffa500,  # Orange
    "EXIT_FINAL": 0xffa500,  # Orange
    "EXIT": 0xffa500      # Orange
}
```

## API Endpoints

### Health & Status (Minimal API)
```
GET  /health                    # Railway health check
GET  /status                    # Service status & metrics
GET  /ready                     # Readiness probe
```

### Testing (Development Only)
```
POST /test-notification         # Send test notification (dev only)
```

**Note**: No configuration endpoints needed since we're using environment variables instead of database.

## Error Handling & Monitoring

### Railway-Specific Monitoring
- Use Railway's built-in logging
- Structured JSON logging
- Health endpoint for Railway health checks
- Metrics in status endpoint

### Retry Strategy
```python
async def send_with_retry(channel, message, max_retries=3):
    delays = [1, 2, 4]  # Exponential backoff

    for attempt in range(max_retries):
        try:
            await channel.send(message)
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(delays[attempt])
                logger.warning(f"Retry {attempt + 1}/{max_retries} for {channel}")
            else:
                logger.error(f"Failed after {max_retries} attempts: {e}")
                # Continue with other webhooks/channels
    return False
```

### Logging Structure
```python
logger.info({
    "event": "notification_sent",
    "source": source_type,
    "strategy": strategy_name,
    "channel": "discord",
    "webhook_index": webhook_index,  # Which webhook in the list
    "status": "success",
    "latency_ms": 150
})
```

## Testing Strategy

### Local Development
```bash
# Run Redis locally
docker run -d -p 6379:6379 redis:alpine

# Run the service
cd notification-service
python -m uvicorn src.main:app --reload
```

### Test Commands
```bash
# Test strategy engine signal
redis-cli PUBLISH signals '{"event_type":"signal.generated","source":"strategy_engine","data":{"strategy_name":"break-and-enter","action":"BUY","symbol":"MNQI","price":23000,"timestamp":"2025-01-20T10:30:00Z"}}'

# Test webhook signal
redis-cli PUBLISH webhook_signals '{"event_type":"webhook.signal","source":"webhook","data":{"webhook_name":"Test Alert","action":"SELL","symbol":"ES","price":4500,"timestamp":"2025-01-20T10:30:00Z"}}'

# Test EXIT signals
redis-cli PUBLISH signals '{"event_type":"signal.generated","source":"strategy_engine","data":{"strategy_name":"break-and-enter","action":"EXIT_50","symbol":"MNQI","price":23100,"comment":"EXIT_50","timestamp":"2025-01-20T10:31:00Z"}}'
```

## Security Considerations

### Phase 1 (Current)
- No external API exposure (internal only)
- Validate all Redis messages
- Sanitize data before sending to Discord
- Rate limiting per channel
- No authentication needed (internal service)

### Future Considerations
- If adding external API: implement authentication
- Encrypt sensitive webhook URLs in environment
- Use secrets management for production
- Audit logging when database is added

## Performance Targets

- Notification latency < 2 seconds
- Support 100+ concurrent notifications
- Handle multiple webhooks per signal
- Graceful degradation if one webhook fails
- 99.9% delivery success rate

## Migration Path

### No Database Migration Needed
Since we're using environment variables:
1. Add new strategies → Add new env variables
2. Add new webhooks → Update env variables
3. Add new channels → Deploy new version with channel support

### When to Consider Database (Future)
- When you have 50+ users wanting custom notifications
- When users need UI to manage notifications
- When you need notification history/analytics
- When configuration changes need to be instant (no redeploy)

## Success Metrics

- All break-and-enter signals reach Discord < 2s
- Support both strategy types seamlessly
- Zero impact on trading execution
- Easy to add new webhooks via environment variables
- 100% Railway uptime

## Simplified Deployment Steps

### Day 1: Build Core Service
1. Create notification-service directory
2. Implement Redis subscriber for both channels
3. Implement Discord channel handler
4. Test locally with Redis

### Day 2: Deploy to Railway
1. Create Railway service
2. Add environment variables for Discord webhooks
3. Connect to existing Redis instance
4. Deploy and monitor

### Day 3: Integrate with Existing Services
1. Add Redis publish to Strategy Engine
2. Add Redis publish to FastAPI webhook handler
3. End-to-end testing in production
4. Monitor and adjust

## Key Advantages of This Approach

1. **No Database Complexity**: Simple environment variables
2. **Easy Configuration**: Just update Railway env vars
3. **Fast Implementation**: 2-3 days to production
4. **Future Flexible**: Can add database later if needed
5. **Cost Effective**: No additional database costs
6. **Maintainable**: Clear separation of concerns

## Environment Variable Example for Railway

```env
# Just these few variables to start!
REDIS_URL=${{Redis.REDIS_URL}}
BREAK_ENTER_DISCORD_WEBHOOK=https://discord.com/api/webhooks/123/abc
WEBHOOK_DEFAULT_DISCORD=https://discord.com/api/webhooks/456/def
LOG_LEVEL=INFO
```

That's it! No database tables, no complex schemas, just simple configuration that can be managed directly in Railway's environment variables panel.

---

**Timeline:**
- Phase 1: 2-3 days (Core + Discord + Railway)
- Integration: 1 day
- Testing & Refinement: 1-2 days
- **Total: Less than 1 week to production**