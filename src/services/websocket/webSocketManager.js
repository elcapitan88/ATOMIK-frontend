// src/services/websocket/webSocketManager.js
import { Subject } from 'rxjs';
import logger from '@/utils/logger';

class WebSocketManager {
    constructor() {
        // Message streams
        this.messageSubject = new Subject();
        this.statusSubject = new Subject();
        this.accountUpdateSubject = new Subject();
        this.marketDataSubject = new Subject();
        
        // Connection tracking
        this.connections = new Map();
        this.connectionStatus = new Map();
        this.lastMessageTimes = new Map();
        
        // Heartbeat configuration
        this.HEARTBEAT_INTERVAL = 2500;  // 2.5 seconds in milliseconds
        this.MAX_MISSED_HEARTBEATS = 3;
        this.frameIds = new Map();  // Track animation frames per connection
        
        // Performance tracking
        this.metrics = new Map();
    }

    async connect(accountId) {
        if (!accountId) {
            logger.error('Account ID is required for connection');
            return false;
        }

        // Check for existing connection
        const existingWs = this.connections.get(accountId);
        if (existingWs?.readyState === WebSocket.OPEN) {
            logger.debug(`Already connected to account ${accountId}`);
            return true;
        }

        try {
            const wsUrl = this._getWebSocketUrl(accountId);
            logger.info('Connecting to:', wsUrl);
            
            const ws = new WebSocket(wsUrl);

            // Set up connection promise
            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                    ws.close();
                }, 10000); // 10 second timeout

                ws.onopen = () => {
                    clearTimeout(timeout);
                    this.connections.set(accountId, ws);
                    this.connectionStatus.set(accountId, 'connected');
                    this.lastMessageTimes.set(accountId, Date.now());
                    this.startHeartbeatMonitoring(accountId);
                    
                    this._emitStatus(accountId, 'connected');
                    logger.info(`WebSocket connected for account ${accountId}`);
                    resolve(true);
                };

                ws.onclose = (event) => {
                    clearTimeout(timeout);
                    this._handleDisconnection(accountId, event);
                    resolve(false);
                };

                ws.onerror = (error) => {
                    logger.error(`WebSocket error for account ${accountId}:`, error);
                    this._emitStatus(accountId, 'error');
                };

                ws.onmessage = (event) => {
                    this._handleMessage(accountId, event);
                };
            });

            return await connectionPromise;

        } catch (error) {
            logger.error('Connection error:', error);
            return false;
        }
    }

    startHeartbeatMonitoring(accountId) {
        // Clear any existing monitoring
        this.stopHeartbeatMonitoring(accountId);

        const checkHeartbeat = () => {
            const ws = this.connections.get(accountId);
            const lastMessageTime = this.lastMessageTimes.get(accountId);
            
            if (ws?.readyState === WebSocket.OPEN) {
                const now = Date.now();
                const timeSinceLastMessage = now - lastMessageTime;

                if (timeSinceLastMessage >= this.HEARTBEAT_INTERVAL) {
                    try {
                        ws.send('[]');
                        this.lastMessageTimes.set(accountId, now);
                        logger.debug(`Heartbeat sent for account ${accountId}`);
                    } catch (error) {
                        logger.error(`Failed to send heartbeat for ${accountId}:`, error);
                        this._handleHeartbeatError(accountId);
                    }
                }
            }
            
            // Continue monitoring
            const frameId = requestAnimationFrame(() => checkHeartbeat());
            this.frameIds.set(accountId, frameId);
        };

        const frameId = requestAnimationFrame(checkHeartbeat);
        this.frameIds.set(accountId, frameId);
        logger.info(`Started heartbeat monitoring for account ${accountId}`);
    }

    stopHeartbeatMonitoring(accountId) {
        const frameId = this.frameIds.get(accountId);
        if (frameId) {
            cancelAnimationFrame(frameId);
            this.frameIds.delete(accountId);
            logger.debug(`Stopped heartbeat monitoring for account ${accountId}`);
        }
    }

    async disconnect(accountId) {
        const ws = this.connections.get(accountId);
        if (ws) {
            this.stopHeartbeatMonitoring(accountId);
            
            try {
                ws.close(1000, 'Normal closure');
            } catch (error) {
                logger.error(`Error closing connection for ${accountId}:`, error);
            }

            this._handleDisconnection(accountId);
        }
    }

    _handleMessage(accountId, event) {
        // Update last message time for ANY message
        this.lastMessageTimes.set(accountId, Date.now());

        // Don't process heartbeat responses
        if (event.data === '[]') {
            return;
        }

        try {
            const message = JSON.parse(event.data);
            logger.debug(`Received message for ${accountId}:`, message);
            
            // Route message to appropriate subject
            if (message.type === 'market_data') {
                this.marketDataSubject.next({ accountId, data: message });
            } else if (message.type === 'account_update') {
                this.accountUpdateSubject.next({ accountId, data: message });
            } else {
                this.messageSubject.next({ accountId, data: message });
            }
            
        } catch (error) {
            logger.error(`Message parsing error for ${accountId}:`, error);
        }
    }

    _handleDisconnection(accountId, event) {
        this.stopHeartbeatMonitoring(accountId);
        this.connections.delete(accountId);
        this.connectionStatus.set(accountId, 'disconnected');
        this.lastMessageTimes.delete(accountId);
        
        this._emitStatus(accountId, 'disconnected');
        logger.info(`WebSocket disconnected for account ${accountId}`);
    }

    _handleHeartbeatError(accountId) {
        const ws = this.connections.get(accountId);
        if (ws) {
            ws.close(4000, 'Heartbeat failure');
            this._handleDisconnection(accountId);
        }
    }

    _getWebSocketUrl(accountId) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const wsHost = process.env.REACT_APP_WS_HOST || 'localhost:8000';
        return `ws://${wsHost}/ws/tradovate/${accountId}?token=${encodeURIComponent(token)}`;
    }

    _emitStatus(accountId, status) {
        this.statusSubject.next({
            accountId,
            status,
            timestamp: Date.now()
        });
    }

    // Public methods for status and subscription
    getStatus(accountId) {
        return this.connectionStatus.get(accountId) || 'disconnected';
    }

    isConnected(accountId) {
        const ws = this.connections.get(accountId);
        return ws?.readyState === WebSocket.OPEN;
    }

    // Observable streams
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
}

// Create and export singleton instance
export const webSocketManager = new WebSocketManager();
export default webSocketManager;