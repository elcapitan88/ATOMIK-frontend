// src/services/websocket/brokers/tradovate/tradovateWebSocket.js
import BaseWebSocket from '../../baseWebSocket';
import { 
    WS_CONFIG,
    BROKER_CONFIG,
    MESSAGE_TYPES,
    getWebSocketUrl,
    MESSAGE_FORMATTERS
} from '@/services/Config/wsConfig';
import logger from '@/utils/logger';

class TradovateWebSocket extends BaseWebSocket {
    constructor(accountId, environment = 'demo') {
        super(accountId, {
            broker: 'tradovate',
            environment,
            heartbeatInterval: BROKER_CONFIG.tradovate.heartbeat.interval,
            reconnectAttempts: WS_CONFIG.RECONNECT.MAX_ATTEMPTS,
            reconnectDelay: WS_CONFIG.RECONNECT.INITIAL_DELAY
        });

        // Tradovate-specific properties
        this.missedHeartbeats = 0;
        this.lastHeartbeatTime = 0;
    }

    // Override BaseWebSocket methods as needed
    getWebSocketUrl() {
        return getWebSocketUrl(this.accountId, 'tradovate', this.environment);
    }

    // Tradovate-specific heartbeat implementation
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected()) {
                this.ws.send(MESSAGE_FORMATTERS.heartbeat());
                this.missedHeartbeats++;

                if (this.missedHeartbeats > WS_CONFIG.HEARTBEAT.MAX_MISSED) {
                    logger.warn('Too many missed heartbeats, reconnecting...');
                    this.reconnect();
                }
            }
        }, BROKER_CONFIG.tradovate.heartbeat.interval);

        this.lastHeartbeatTime = Date.now();
        this.missedHeartbeats = 0;
    }

    // Override message handling for Tradovate-specific messages
    async handleMessage(event) {
        try {
            // Reset missed heartbeats on any message
            this.missedHeartbeats = 0;
            this.lastHeartbeatTime = Date.now();

            // Handle Tradovate heartbeat response
            if (event.data === '[]') {
                return;
            }

            const message = JSON.parse(event.data);
            
            // Handle different message types
            switch (message.type) {
                case MESSAGE_TYPES.MARKET_DATA:
                    await this.handleMarketData(message.data);
                    break;

                case MESSAGE_TYPES.ORDER_UPDATE:
                    await this.handleOrderUpdate(message.data);
                    break;

                case MESSAGE_TYPES.ACCOUNT_UPDATE:
                    await this.handleAccountUpdate(message.data);
                    break;

                default:
                    // Pass unhandled messages to base class
                    await super.handleMessage(event);
            }
        } catch (error) {
            logger.error('Error handling message:', error);
            this.handleError(error);
        }
    }

    // Tradovate-specific message handlers
    async handleMarketData(data) {
        this.emit('marketData', {
            accountId: this.accountId,
            data,
            timestamp: Date.now()
        });
    }

    async handleOrderUpdate(data) {
        this.emit('orderUpdate', {
            accountId: this.accountId,
            data,
            timestamp: Date.now()
        });
    }

    async handleAccountUpdate(data) {
        this.emit('accountUpdate', {
            accountId: this.accountId,
            data,
            timestamp: Date.now()
        });
    }

    // Override cleanup to handle Tradovate-specific cleanup
    cleanup() {
        super.cleanup();
        this.missedHeartbeats = 0;
        this.lastHeartbeatTime = 0;
    }

    // Override connection methods if needed
    async connect() {
        logger.info(`Connecting to Tradovate WebSocket for account ${this.accountId}`);
        return super.connect();
    }

    disconnect() {
        logger.info(`Disconnecting Tradovate WebSocket for account ${this.accountId}`);
        super.disconnect();
    }

    // Helper methods
    formatOrderMessage(order) {
        return MESSAGE_FORMATTERS.order(order);
    }

    getConnectionInfo() {
        return {
            ...super.getConnectionInfo(),
            broker: 'tradovate',
            environment: this.environment,
            lastHeartbeat: this.lastHeartbeatTime,
            missedHeartbeats: this.missedHeartbeats
        };
    }
}

export default TradovateWebSocket;