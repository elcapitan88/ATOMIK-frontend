import BaseWebSocket from '../baseWebSocket';
import { 
    BROKER_CONFIG,
    getWebSocketUrl,
    MESSAGE_TYPES 
} from '@/services/Config/wsConfig';
import logger from '@/utils/logger';

class TradovateWebSocket extends BaseWebSocket {
    constructor(accountId, environment = 'demo') {
        super(accountId, {
            heartbeatThreshold: 2500, // Tradovate requires 2.5 seconds
            maxMissedHeartbeats: 3,
            connectionTimeout: 10000,
            environment
        });

        this.environment = environment;
        this.messageHandlers = new Map();
        this.subscriptions = new Set();
        
        // Initialize message handlers
        this.initializeMessageHandlers();
    }

    getWebSocketUrl() {
        const config = BROKER_CONFIG.tradovate.endpoints[this.environment];
        if (!config?.ws) {
            throw new Error(`Invalid environment: ${this.environment}`);
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        return `${config.ws}/${this.accountId}?token=${encodeURIComponent(token)}`;
    }

    initializeMessageHandlers() {
        this.messageHandlers.set(MESSAGE_TYPES.MARKET_DATA, this.handleMarketData.bind(this));
        this.messageHandlers.set(MESSAGE_TYPES.ORDER_UPDATE, this.handleOrderUpdate.bind(this));
        this.messageHandlers.set(MESSAGE_TYPES.POSITION_UPDATE, this.handlePositionUpdate.bind(this));
        this.messageHandlers.set(MESSAGE_TYPES.ACCOUNT_UPDATE, this.handleAccountUpdate.bind(this));
    }

    async processMessage(message) {
        try {
            // Try to parse message if it's a string
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            
            // Get handler for message type
            const handler = this.messageHandlers.get(data.type);
            if (handler) {
                await handler(data);
            } else {
                logger.debug(`No handler for message type: ${data.type}`);
            }
            
        } catch (error) {
            logger.error(`Error processing message: ${error.message}`);
            throw error;
        }
    }

    // Message Handlers
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

    async handlePositionUpdate(data) {
        this.emit('positionUpdate', {
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

    // Subscription Management
    async subscribe(symbol) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            await this.send({
                type: 'subscribe',
                symbol
            });
            this.subscriptions.add(symbol);
            logger.info(`Subscribed to ${symbol}`);
        } catch (error) {
            logger.error(`Subscription error for ${symbol}: ${error.message}`);
            throw error;
        }
    }

    async unsubscribe(symbol) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            await this.send({
                type: 'unsubscribe',
                symbol
            });
            this.subscriptions.delete(symbol);
            logger.info(`Unsubscribed from ${symbol}`);
        } catch (error) {
            logger.error(`Unsubscription error for ${symbol}: ${error.message}`);
            throw error;
        }
    }

    // Override connection handling methods
    async connect() {
        logger.info(`Connecting to Tradovate WebSocket for account ${this.accountId}`);
        const connected = await super.connect();
        
        if (connected) {
            // Resubscribe to previous subscriptions after reconnect
            for (const symbol of this.subscriptions) {
                await this.subscribe(symbol);
            }
        }
        
        return connected;
    }

    async disconnect() {
        logger.info(`Disconnecting Tradovate WebSocket for account ${this.accountId}`);
        return super.disconnect();
    }

    shouldReconnect(event) {
        // Don't reconnect on authentication failures
        if (event.code === 4001 || event.code === 4003) {
            logger.warn(`Not reconnecting due to authentication error: ${event.code}`);
            return false;
        }
        
        return super.shouldReconnect(event);
    }

    handleError(error) {
        logger.error(`Tradovate WebSocket error: ${error.message}`);
        this.emit('error', {
            accountId: this.accountId,
            error,
            timestamp: Date.now()
        });
    }

    // Utility methods
    emit(event, data) {
        // Override this method to integrate with your event system
        // For example, you might want to use RxJS subjects here
        logger.debug(`Event emitted: ${event}`, data);
    }

    getStatus() {
        return {
            ...super.getMetrics(),
            environment: this.environment,
            subscriptions: Array.from(this.subscriptions),
            broker: 'tradovate'
        };
    }
}

export default TradovateWebSocket;