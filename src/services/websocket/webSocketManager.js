import { Subject } from 'rxjs';
import logger from '@/utils/logger';

class WebSocketManager {
    constructor() {
        // Connection management
        this.connections = new Map();
        this.connectionStatuses = new Map();
        this.lastHeartbeats = new Map();
        
        // Message handling
        this.messageQueue = [];
        this.isProcessing = false;
        this.processingInterval = 50;

        // Observable subjects for different message types
        this.messageSubject = new Subject();
        this.statusSubject = new Subject();
        this.accountUpdateSubject = new Subject();
        this.marketDataSubject = new Subject();
        this.positionUpdateSubject = new Subject();

        // Debug mode for detailed logging
        this.debug = true;
    }

    async connect(accountId, token) {
        if (!accountId || !token) {
            logger.error('Missing required connection parameters');
            return false;
        }

        try {
            // Check for existing connection
            if (this.connections.get(accountId)?.readyState === WebSocket.OPEN) {
                logger.info(`WebSocket already connected for account ${accountId}`);
                return true;
            }

            // Construct WebSocket URL
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = process.env.REACT_APP_WS_HOST || window.location.host;
            const wsUrl = `${protocol}//${host}/api/v1/ws/tradovate/${accountId}?token=${token}`;

            const ws = new WebSocket(wsUrl);
            
            // Set up message handler
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(accountId, message, ws);
                } catch (error) {
                    logger.error('Failed to parse WebSocket message:', error);
                }
            };

            // Handle connection events
            ws.onopen = () => {
                logger.info(`WebSocket connected for account ${accountId}`);
                this.connections.set(accountId, ws);
                this.connectionStatuses.set(accountId, 'connected');
                this.statusSubject.next({ 
                    accountId, 
                    status: 'connected',
                    timestamp: Date.now()
                });
            };

            ws.onclose = () => {
                logger.info(`WebSocket closed for account ${accountId}`);
                this.handleDisconnect(accountId);
            };

            ws.onerror = (error) => {
                logger.error(`WebSocket error for account ${accountId}:`, error);
                this.statusSubject.next({ 
                    accountId, 
                    status: 'error', 
                    error: 'Connection error',
                    timestamp: Date.now()
                });
            };

            // Store the connection
            this.connections.set(accountId, ws);
            return true;

        } catch (error) {
            logger.error(`Failed to establish WebSocket connection:`, error);
            return false;
        }
    }

    async handleMessage(accountId, message, ws) {
        if (this.debug) {
            logger.info(`Received WebSocket message for ${accountId}:`, message);
        }

        try {
            if (message.type === 'heartbeat') {
                await this.sendHeartbeatAck(accountId, message, ws);
                return;
            }

            if (message.type === 'account_update') {
                logger.info('Processing account update:', message);
                this.accountUpdateSubject.next({
                    accountId,
                    data: message.data,
                    timestamp: Date.now()
                });
                return;
            }

            if (message.type === 'market_data') {
                this.marketDataSubject.next({
                    accountId,
                    ...message,
                    timestamp: Date.now()
                });
                return;
            }

            if (message.type === 'position_update') {
                this.positionUpdateSubject.next({
                    accountId,
                    ...message,
                    timestamp: Date.now()
                });
                return;
            }

            // Default message handling
            this.messageSubject.next({
                accountId,
                ...message,
                timestamp: Date.now()
            });

        } catch (error) {
            logger.error(`Error processing message for account ${accountId}:`, error);
        }
    }

    async sendHeartbeatAck(accountId, message, ws) {
        try {
            const sequence = message.sequence || 'unknown';
            
            if (this.debug) {
                logger.info('Raw heartbeat message:', message);
            }
            
            logger.info(`Received heartbeat ${sequence} for account ${accountId}`);

            // Store last heartbeat time
            this.lastHeartbeats.set(accountId, Date.now());

            // Send acknowledgment
            const ackMessage = {
                type: 'heartbeat_ack',
                sequence: sequence,
                original_timestamp: message.timestamp,
                timestamp: new Date().toISOString(),
                account_id: accountId
            };

            if (ws.readyState === WebSocket.OPEN) {
                await ws.send(JSON.stringify(ackMessage));
                logger.info(`Sent heartbeat acknowledgment ${sequence} for account ${accountId}`);
            }

        } catch (error) {
            logger.error(`Error handling heartbeat for account ${accountId}:`, error);
        }
    }

    handleDisconnect(accountId) {
        // Clean up connection state
        this.connections.delete(accountId);
        this.connectionStatuses.set(accountId, 'disconnected');
        this.lastHeartbeats.delete(accountId);
        
        // Notify subscribers
        this.statusSubject.next({
            accountId,
            status: 'disconnected',
            timestamp: Date.now()
        });
    }

    async disconnect(accountId) {
        const ws = this.connections.get(accountId);
        if (ws) {
            try {
                ws.close();
            } catch (error) {
                logger.error(`Error closing WebSocket for account ${accountId}:`, error);
            }
        }
        this.handleDisconnect(accountId);
    }

    onMessage() {
        return this.messageSubject.asObservable();
    }

    onStatus() {
        return this.statusSubject.asObservable();
    }

    onAccountUpdates() {
        return this.accountUpdateSubject.asObservable();
    }

    onMarketData() {
        return this.marketDataSubject.asObservable();
    }

    onPositionUpdates() {
        return this.positionUpdateSubject.asObservable();
    }

    getConnectionStatus(accountId) {
        return this.connectionStatuses.get(accountId) || 'disconnected';
    }

    getLastHeartbeat(accountId) {
        return this.lastHeartbeats.get(accountId);
    }
}

// Create and export singleton instance
export const webSocketManager = new WebSocketManager();
export default webSocketManager;