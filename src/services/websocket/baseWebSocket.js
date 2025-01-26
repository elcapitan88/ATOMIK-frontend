// src/services/websocket/baseWebSocket.js

import { WebSocketConfig } from './websocket_config';
import logger from '@/utils/logger';

class BaseWebSocket {
    constructor(accountId, options = {}) {
        // Base properties
        this.accountId = accountId;
        this.ws = null;
        this.isConnected = false;
        this.status = 'DISCONNECTED';
        this.config = WebSocketConfig;
        
        // Connection settings
        this.options = {
            reconnectAttempts: this.config.CONNECTION.RECONNECT_ATTEMPTS,
            reconnectInterval: this.config.CONNECTION.RECONNECT_INTERVAL,
            connectionTimeout: this.config.CONNECTION.CONNECTION_TIMEOUT,
            maxQueueSize: this.config.CONNECTION.MAX_QUEUE_SIZE,
            ...options
        };

        // Message handling
        this.messageQueue = [];
        this.pendingMessages = new Map();
        this.messageTimeout = 5000;
        this.lastMessageId = 0;

        // Status tracking
        this.reconnectAttempts = 0;
        this.lastHeartbeat = null;
        this.error_count = 0;

        // Heartbeat specific properties
        this.HEARTBEAT_INTERVAL = this.config.HEARTBEAT.INTERVAL;
        this.lastMessageTime = Date.now();
        this.heartbeatFrameId = null;
        this.missedHeartbeats = 0;
        this.MAX_MISSED_HEARTBEATS = this.config.HEARTBEAT.MAX_MISSED;

        // Performance metrics
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            heartbeatsSent: 0,
            heartbeatsFailed: 0,
            reconnections: 0,
            errors: 0,
            lastLatency: 0
        };

        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.reconnect = this.reconnect.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.startHeartbeat = this.startHeartbeat.bind(this);
        this.stopHeartbeat = this.stopHeartbeat.bind(this);
        this.checkHeartbeat = this.checkHeartbeat.bind(this);
    }

    getWebSocketUrl() {
        throw new Error('getWebSocketUrl must be implemented by subclass');
    }

    async connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return true;
        }

        try {
            if (this.status === 'CONNECTING') {
                return false;
            }

            this.status = 'CONNECTING';
            logger.debug(`Connecting WebSocket for account ${this.accountId}`);
            
            // Create WebSocket connection
            const url = this.getWebSocketUrl();
            this.ws = new WebSocket(url);

            // Create connection promise
            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, this.options.connectionTimeout);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    this.handleConnectionOpen();
                    resolve(true);
                };

                this.ws.onclose = (event) => {
                    clearTimeout(timeout);
                    this.handleConnectionClose(event);
                    resolve(false);
                };

                this.ws.onerror = (error) => {
                    clearTimeout(timeout);
                    this.handleError(error);
                    reject(error);
                };
            });

            // Set up message handler
            this.ws.onmessage = this.handleMessage;

            const connected = await connectionPromise;
            if (connected) {
                this.startHeartbeat();
            }

            return connected;

        } catch (error) {
            logger.error(`Connection error: ${error.message}`);
            this.status = 'ERROR';
            return false;
        }
    }

    startHeartbeat() {
        if (this.heartbeatFrameId) {
            return; // Heartbeat already running
        }

        const heartbeatLoop = () => {
            this.checkHeartbeat();
            this.heartbeatFrameId = requestAnimationFrame(heartbeatLoop);
        };

        this.heartbeatFrameId = requestAnimationFrame(heartbeatLoop);
        logger.debug(`Started heartbeat monitoring for account ${this.accountId}`);
    }

    stopHeartbeat() {
        if (this.heartbeatFrameId) {
            cancelAnimationFrame(this.heartbeatFrameId);
            this.heartbeatFrameId = null;
            logger.debug(`Stopped heartbeat monitoring for account ${this.accountId}`);
        }
    }

    async checkHeartbeat() {
        const now = Date.now();
        const timeSinceLastMessage = now - this.lastMessageTime;

        if (timeSinceLastMessage >= this.HEARTBEAT_INTERVAL) {
            try {
                const startTime = Date.now();
                await this.sendHeartbeat();
                
                this.metrics.heartbeatsSent++;
                this.metrics.lastLatency = Date.now() - startTime;
                this.missedHeartbeats = 0;
                
            } catch (error) {
                this.metrics.heartbeatsFailed++;
                this.missedHeartbeats++;
                
                logger.error(`Heartbeat failed for account ${this.accountId}: ${error.message}`);
                
                if (this.missedHeartbeats >= this.MAX_MISSED_HEARTBEATS) {
                    await this.handleHeartbeatFailure();
                }
            }
        }
    }

    async sendHeartbeat() {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            await this.ws.send('[]');
            logger.debug(`Heartbeat sent for account ${this.accountId}`);
        } catch (error) {
            throw new Error(`Failed to send heartbeat: ${error.message}`);
        }
    }

    async handleHeartbeatFailure() {
        logger.warn(`Max missed heartbeats reached for account ${this.accountId}`);
        this.stopHeartbeat();
        await this.reconnect();
    }

    handleConnectionOpen() {
        this.isConnected = true;
        this.status = 'CONNECTED';
        this.lastMessageTime = Date.now();
        this.error_count = 0;
        this.reconnectAttempts = 0;
        logger.info(`WebSocket connected for account ${this.accountId}`);
    }

    handleConnectionClose(event) {
        this.isConnected = false;
        this.status = 'DISCONNECTED';
        this.stopHeartbeat();
        
        logger.info(`WebSocket disconnected for account ${this.accountId}: ${event.code} - ${event.reason}`);
        
        if (this.shouldReconnect()) {
            this.scheduleReconnection();
        }
    }

    async handleMessage(event) {
        try {
            // Update last message time for heartbeat tracking
            this.lastMessageTime = Date.now();
            this.metrics.messagesReceived++;
            
            // Process the message
            const message = JSON.parse(event.data);
            await this.processMessage(message);
            
        } catch (error) {
            logger.error(`Error processing message: ${error.message}`);
            this.metrics.errors++;
        }
    }

    async processMessage(message) {
        // To be implemented by subclass
        throw new Error('processMessage must be implemented by subclass');
    }

    handleError(error) {
        logger.error(`WebSocket error for account ${this.accountId}: ${error.message}`);
        this.error_count++;
        this.metrics.errors++;
        this.status = 'ERROR';
    }

    shouldReconnect() {
        return (
            this.reconnectAttempts < this.options.reconnectAttempts &&
            this.status !== 'CONNECTED'
        );
    }

    async scheduleReconnection() {
        const delay = this.calculateReconnectDelay();
        this.status = 'RECONNECTING';
        this.metrics.reconnections++;
        
        logger.info(`Scheduling reconnection for account ${this.accountId} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.reconnect();
    }

    calculateReconnectDelay() {
        const attempt = this.reconnectAttempts + 1;
        const backoffMs = Math.min(
            this.options.reconnectInterval * Math.pow(2, attempt),
            this.config.CONNECTION.MAX_RECONNECT_INTERVAL
        );
        return backoffMs;
    }

    async reconnect() {
        this.reconnectAttempts++;
        logger.info(`Attempting reconnection ${this.reconnectAttempts} for account ${this.accountId}`);
        return await this.connect();
    }

    async disconnect() {
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnected = false;
        this.status = 'DISCONNECTED';
        logger.info(`WebSocket disconnected for account ${this.accountId}`);
    }

    getStatus() {
        return {
            status: this.status,
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            lastMessageTime: this.lastMessageTime,
            metrics: this.metrics
        };
    }

    async send(data) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            const messageId = ++this.lastMessageId;
            const message = { id: messageId, ...data };
            
            await this.ws.send(JSON.stringify(message));
            this.metrics.messagesSent++;
            
            return true;
        } catch (error) {
            logger.error(`Failed to send message: ${error.message}`);
            throw error;
        }
    }

    async cleanup() {
        this.stopHeartbeat();
        await this.disconnect();
        
        this.messageQueue = [];
        this.pendingMessages.clear();
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            heartbeatsSent: 0,
            heartbeatsFailed: 0,
            reconnections: 0,
            errors: 0,
            lastLatency: 0
        };
    }
}

export default BaseWebSocket;