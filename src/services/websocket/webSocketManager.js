// src/services/websocket/webSocketManager.js
import { Subject } from 'rxjs';
import axiosInstance from '../axiosConfig';

class WebSocketManager {
    constructor() {
        // Message streams
        this.messageSubject = new Subject();
        this.statusSubject = new Subject();
        this.accountUpdateSubject = new Subject();
        this.marketDataSubject = new Subject();
        
        // Connection tracking
        this.connections = new Map(); // accountId -> WebSocket
        this.connectionStatus = new Map(); // accountId -> status
        this.connectionStates = new Map();
        this.heartbeatIntervals = new Map(); // accountId -> interval
        this.handleMessage = this.handleMessage.bind(this);
        this.handleDisconnection = this.handleDisconnection.bind(this);
        this.reconnectAttempts = new Map();
        
        // Configuration
        this.RECONNECT_ATTEMPTS = 5;
        this.RECONNECT_DELAY = 1000;
        this.HEARTBEAT_INTERVAL = 2500; // Tradovate requirement
        this.CONNECTION_TIMEOUT = 10000;
        this.MAX_MISSED_HEARTBEATS = 3;

    }

    async validateToken() {
        try {
            const response = await axiosInstance.post('/api/v1/auth/verify');
            return response.data.valid;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    async connect(accountId) {
        if (this.connections.has(accountId)) {
            const existingWs = this.connections.get(accountId);
            if (existingWs && existingWs.readyState === WebSocket.OPEN) {
                console.log(`Already connected to account ${accountId}`);
                return true;
            }
            await this.disconnect(accountId);
        }

        try {
            console.log(`Connecting to WebSocket for account ${accountId}`);
            const wsUrl = this.getWebSocketUrl(accountId);
            console.log('WebSocket URL:', wsUrl);

            const ws = new WebSocket(wsUrl);

            return new Promise((resolve, reject) => {
                const connectionTimeout = setTimeout(() => {
                    ws.close();
                    reject(new Error('Connection timeout'));
                }, 10000);

                // Use arrow functions to preserve 'this' context
                ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    this.connections.set(accountId, ws);
                    this.connectionStates.set(accountId, 'connected');
                    this.reconnectAttempts.set(accountId, 0); // Now this will work
                    this.updateStatus(accountId, 'connected'); // Add this to ensure status updates are propagated
                    console.log(`WebSocket connected for account ${accountId}`);
                    resolve(true);
                };

                ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    console.log(`WebSocket closed for account ${accountId}:`, event.code, event.reason);
                    this.handleDisconnection(accountId, event);
                    resolve(false);
                };

                ws.onerror = (error) => {
                    console.error(`WebSocket error for account ${accountId}:`, error);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log(`Received message for account ${accountId}:`, data);
                        this.handleMessage(accountId, data);
                    } catch (e) {
                        console.error('Error processing message:', e);
                    }
                };
            });

        } catch (error) {
            console.error('Connection error:', error);
            return false;
        }
    }
    
    clearHeartbeat(accountId) {
        const intervalId = this.heartbeatIntervals.get(accountId);
        if (intervalId) {
            clearInterval(intervalId);
            this.heartbeatIntervals.delete(accountId);
            console.debug(`Heartbeat cleared for account ${accountId}`);
        }
    }


    getWebSocketUrl(accountId) {
        if (!accountId) {
            throw new Error('Account ID is required');
        }

        const wsHost = process.env.REACT_APP_WS_HOST || 'localhost:8000';
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const cleanHost = wsHost.replace(/^(http|https|ws|wss):\/\//, '');
        return `ws://${cleanHost}/ws/tradovate/${accountId}?token=${encodeURIComponent(token)}`;
    }


    async handleTokenInvalid() {
        // Implement token refresh logic here
        console.warn('Token invalid, refreshing...');
        // You might want to trigger a token refresh here
    }

    async disconnect(accountId) {
        console.log(`Disconnecting account ${accountId}`);
        const ws = this.connections.get(accountId);
        if (ws) {
            ws.close(1000, 'Normal closure');
            this.connections.delete(accountId);
            this.connectionStates.set(accountId, 'disconnected');
        }
    }

    startHeartbeat(accountId, ws) {
        this.clearHeartbeat(accountId);
    
        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send('[]');
                    console.debug(`Heartbeat sent for account ${accountId}`);
                } catch (error) {
                    console.error(`Heartbeat error for account ${accountId}:`, error);
                    this.clearHeartbeat(accountId);
                }
            }
        }, this.HEARTBEAT_INTERVAL);
    
        this.heartbeatIntervals.set(accountId, intervalId);
        console.debug(`Heartbeat started for account ${accountId}`);
    }

    handleMessage(accountId, event) {
        try {
            // Handle heartbeat response
            if (event.data === '[]') {
                console.debug(`Heartbeat response received for account ${accountId}`);
                return;
            }

            const data = JSON.parse(event.data);
            console.debug(`Message received for account ${accountId}:`, data);

            switch (data.type) {
                case 'market_data':
                    this.marketDataSubject.next({
                        accountId,
                        data: data.data,
                        timestamp: Date.now()
                    });
                    break;

                case 'account_update':
                    this.accountUpdateSubject.next({
                        accountId,
                        data: data.data,
                        timestamp: Date.now()
                    });
                    break;

                default:
                    this.messageSubject.next({
                        accountId,
                        type: data.type,
                        data: data.data,
                        timestamp: Date.now()
                    });
            }
        } catch (error) {
            console.error(`Error processing message for account ${accountId}:`, error);
        }
    }

    async handleDisconnection(accountId, event) {
        this.connectionStates.set(accountId, 'disconnected');
        this.connections.delete(accountId);

        if (event.code !== 1000 && event.code !== 1001) {
            const attempts = (this.reconnectAttempts.get(accountId) || 0) + 1;
            if (attempts <= this.MAX_RECONNECT_ATTEMPTS) {
                console.log(`Attempting reconnection ${attempts}/${this.MAX_RECONNECT_ATTEMPTS}`);
                this.reconnectAttempts.set(accountId, attempts);
                setTimeout(() => this.connect(accountId), this.RECONNECT_DELAY * attempts);
            }
        }
    }

    async attemptReconnection(accountId, attempt = 0) {
        if (attempt >= this.RECONNECT_ATTEMPTS) {
            console.error(`Max reconnection attempts reached for account ${accountId}`);
            this.updateStatus(accountId, 'error');
            return;
        }

        const delay = this.RECONNECT_DELAY * Math.pow(2, attempt);
        console.info(`Attempting reconnection ${attempt + 1}/${this.RECONNECT_ATTEMPTS} for ${accountId} in ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            const connected = await this.connect(accountId);
            if (!connected) {
                await this.attemptReconnection(accountId, attempt + 1);
            }
        } catch (error) {
            console.error(`Reconnection attempt failed for ${accountId}:`, error);
            await this.attemptReconnection(accountId, attempt + 1);
        }
    }

    updateStatus(accountId, status) {
        this.connectionStatus.set(accountId, status);
        this.statusSubject.next({
            accountId,
            status,
            timestamp: Date.now()
        });
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

    getStatus(accountId) {
        return this.connectionStatus.get(accountId) || 'disconnected';
    }

    isConnected(accountId) {
        const ws = this.connections.get(accountId);
        return ws && ws.readyState === WebSocket.OPEN;
    }
}

// Create and export singleton instance
export const webSocketManager = new WebSocketManager();
export default webSocketManager;