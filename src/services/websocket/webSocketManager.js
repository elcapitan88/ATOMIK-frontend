// src/services/websocket/webSocketManager.js

import { Subject } from 'rxjs';
import logger from '@/utils/logger';
import { WS_CONFIG } from '@/services/Config/wsConfig';

class WebSocketManager {
    constructor() {
        // Connection management
        this.connections = new Map();
        this.connectionStatuses = new Map();
        this.heartbeatIntervals = new Map();
        this.reconnectTimers = new Map();
        this.pendingMessages = new Map();
        
        // Observable for messages and status updates
        this.messageSubject = new Subject();
        this.statusSubject = new Subject();

        // Connection tracking
        this.reconnectAttempts = new Map();
        this.MAX_RECONNECT_ATTEMPTS = 5;
        this.HEARTBEAT_INTERVAL = 30000;
        this.CONNECTION_TIMEOUT = 10000;

        // Circuit breaker pattern
        this.circuitBreaker = {
            failures: 0,
            lastFailure: null,
            status: 'closed', // closed, open, half-open
            threshold: 5,
            resetTimeout: 60000
        };

        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);
        this.handleConnectionError = this.handleConnectionError.bind(this);
        this.handleConnectionClose = this.handleConnectionClose.bind(this);
    }

    async connect(accountId, token) {
        if (!accountId) {
            logger.error('No account ID provided for WebSocket connection');
            return false;
        }
    
        if (!token) {
            logger.error('No token provided for WebSocket connection');
            return false;
        }
    
        logger.info(`Attempting to connect WebSocket for account ${accountId}`);
    
        try {
            // Check for existing connection
            if (this.connections.get(accountId)?.readyState === WebSocket.OPEN) {
                logger.info(`WebSocket already connected for account ${accountId}`);
                return true;
            }
    
            // Clean up any existing connection
            await this.disconnect(accountId);
    
            // Construct WebSocket URL
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = process.env.REACT_APP_WS_HOST || window.location.host;
            const wsUrl = `${protocol}//${host}/api/v1/ws/tradovate/${accountId}?token=${token}`;
            
            logger.info(`Connecting to WebSocket URL: ${wsUrl}`);
    
            return new Promise((resolve, reject) => {
                const ws = new WebSocket(wsUrl);
                
                // Set up connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        ws.close();
                        logger.error('WebSocket connection timeout');
                        this.statusSubject.next({
                            accountId,
                            status: 'error',
                            error: 'Connection timeout',
                            timestamp: Date.now()
                        });
                        resolve(false);
                    }
                }, 10000); // 10 second timeout
    
                // Connection opening
                ws.onopen = async () => {
                    clearTimeout(connectionTimeout);
                    logger.info(`WebSocket open event received for account ${accountId}`);
                    
                    try {
                        // Send initial setup message
                        const setupMessage = {
                            type: 'setup',
                            accountId: accountId,
                            timestamp: new Date().toISOString()
                        };
                        
                        ws.send(JSON.stringify(setupMessage));
                        
                        // Store connection
                        this.connections.set(accountId, ws);
                        this.connectionStatuses.set(accountId, 'connected');
                        
                        // Emit connected status
                        this.statusSubject.next({
                            accountId,
                            status: 'connected',
                            timestamp: Date.now()
                        });
                        
                        // Setup handlers
                        this.setupHeartbeat(accountId, ws);
                        this.resetReconnectAttempts(accountId);
                        
                        logger.info(`WebSocket fully initialized for account ${accountId}`);
                        resolve(true);
                    } catch (error) {
                        logger.error(`Error during WebSocket setup for account ${accountId}:`, error);
                        this.statusSubject.next({
                            accountId,
                            status: 'error',
                            error: error.message,
                            timestamp: Date.now()
                        });
                        ws.close();
                        resolve(false);
                    }
                };
    
                // Add detailed close event logging
                ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    logger.info(`WebSocket closed for account ${accountId}. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
                    this.handleConnectionClose(accountId);
                    this.statusSubject.next({
                        accountId,
                        status: 'disconnected',
                        timestamp: Date.now()
                    });
                    resolve(false);
                };
    
                // Add detailed error logging
                ws.onerror = (error) => {
                    clearTimeout(connectionTimeout);
                    logger.error(`WebSocket error for account ${accountId}:`, {
                        error: error,
                        readyState: ws.readyState,
                        bufferedAmount: ws.bufferedAmount
                    });
                    this.handleConnectionError(accountId, error);
                    this.statusSubject.next({
                        accountId,
                        status: 'error',
                        error: error.message || 'Connection error',
                        timestamp: Date.now()
                    });
                    resolve(false);
                };
    
                // Set up message handler with logging
                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        logger.debug(`Message received for account ${accountId}:`, message);
                        
                        // Update connection status based on message type
                        if (message.type === 'status') {
                            this.statusSubject.next({
                                accountId,
                                status: message.status,
                                timestamp: Date.now()
                            });
                        }
                        
                        this.handleMessage(accountId, event);
                    } catch (error) {
                        logger.error(`Error processing message for account ${accountId}:`, error);
                    }
                };
            });
    
        } catch (error) {
            logger.error(`Error establishing WebSocket connection for account ${accountId}:`, error);
            this.statusSubject.next({
                accountId,
                status: 'error',
                error: error.message,
                timestamp: Date.now()
            });
            return false;
        }
    }

    setupHeartbeat(accountId, ws) {
        // Clear any existing heartbeat
        if (this.heartbeatIntervals.has(accountId)) {
            clearInterval(this.heartbeatIntervals.get(accountId));
        }

        // Set up new heartbeat
        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                    type: 'heartbeat',
                    timestamp: new Date().toISOString()
                }));
            } else {
                clearInterval(interval);
                this.heartbeatIntervals.delete(accountId);
            }
        }, this.HEARTBEAT_INTERVAL);

        this.heartbeatIntervals.set(accountId, interval);
    }

    handleMessage(accountId, event) {
        try {
            const message = JSON.parse(event.data);
            logger.debug(`Message received for account ${accountId}:`, message);

            // Emit message to subscribers
            this.messageSubject.next({
                accountId,
                message,
                timestamp: Date.now()
            });

            // Handle different message types
            switch (message.type) {
                case 'heartbeat':
                    this.connectionStatuses.set(accountId, 'connected');
                    break;
                case 'error':
                    logger.error(`Error message from server for account ${accountId}:`, message);
                    this.handleError(accountId, new Error(message.error));
                    break;
            }

        } catch (error) {
            logger.error('Error processing message:', error);
            this.handleError(accountId, error);
        }
    }

    handleConnectionError(accountId, error) {
        logger.error(`WebSocket error for account ${accountId}:`, error);
        this.connectionStatuses.set(accountId, 'error');
        this.updateCircuitBreaker('failure');
        this.scheduleReconnection(accountId);
    }

    handleConnectionClose(accountId) {
        this.connectionStatuses.set(accountId, 'disconnected');
        this.connections.delete(accountId);
        
        // Clear intervals
        if (this.heartbeatIntervals.has(accountId)) {
            clearInterval(this.heartbeatIntervals.get(accountId));
            this.heartbeatIntervals.delete(accountId);
        }

        // Schedule reconnection if appropriate
        this.scheduleReconnection(accountId);
    }

    async scheduleReconnection(accountId) {
        const attempts = this.reconnectAttempts.get(accountId) || 0;
        
        if (attempts < this.MAX_RECONNECT_ATTEMPTS && this.circuitBreaker.status !== 'open') {
            this.reconnectAttempts.set(accountId, attempts + 1);
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
            
            logger.info(`Scheduling reconnection attempt ${attempts + 1} in ${delay}ms`);
            
            const timer = setTimeout(async () => {
                await this.connect(accountId, localStorage.getItem('access_token'));
            }, delay);

            this.reconnectTimers.set(accountId, timer);
        } else {
            logger.warn(`Max reconnection attempts reached for account ${accountId}`);
            this.emitStatus(accountId, 'max_retries_reached');
        }
    }

    updateCircuitBreaker(result) {
        if (result === 'success') {
            this.circuitBreaker.failures = 0;
            this.circuitBreaker.status = 'closed';
        } else {
            this.circuitBreaker.failures++;
            this.circuitBreaker.lastFailure = Date.now();
            
            if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
                this.circuitBreaker.status = 'open';
                setTimeout(() => {
                    this.circuitBreaker.status = 'half-open';
                    this.circuitBreaker.failures = 0;
                }, this.circuitBreaker.resetTimeout);
            }
        }
    }

    resetReconnectAttempts(accountId) {
        this.reconnectAttempts.set(accountId, 0);
    }

    async disconnect(accountId) {
        const ws = this.connections.get(accountId);
        if (ws) {
            // Clear all timers and intervals
            clearInterval(this.heartbeatIntervals.get(accountId));
            clearTimeout(this.reconnectTimers.get(accountId));
            
            // Clean up state
            this.heartbeatIntervals.delete(accountId);
            this.reconnectTimers.delete(accountId);
            this.connections.delete(accountId);
            this.connectionStatuses.delete(accountId);
            this.reconnectAttempts.delete(accountId);
            
            // Close connection if open
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
    }

    emitStatus(accountId, status) {
        this.statusSubject.next({
            accountId,
            status,
            timestamp: Date.now()
        });
    }

    getConnectionStatus(accountId) {
        return this.connectionStatuses.get(accountId) || 'disconnected';
    }

    onMessage() {
        return this.messageSubject.asObservable();
    }

    onStatus() {
        return this.statusSubject.asObservable();
    }

    async disconnectAll() {
        for (const accountId of this.connections.keys()) {
            await this.disconnect(accountId);
        }
    }
}

// Create and export singleton instance
export const webSocketManager = new WebSocketManager();
export default webSocketManager;