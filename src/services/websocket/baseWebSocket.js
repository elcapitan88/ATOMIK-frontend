class BaseWebSocket {
    constructor(accountId, options = {}) {
        // Base properties
        this.accountId = accountId;
        this.ws = null;
        this.isConnected = false;
        this.status = 'DISCONNECTED';
        
        // Message and heartbeat tracking
        this.lastMessageTime = Date.now();
        this.missedHeartbeats = 0;
        this.frameId = null;
        
        // Configuration
        this.options = {
            heartbeatThreshold: 2500, // 2.5 seconds in milliseconds
            maxMissedHeartbeats: 3,
            connectionTimeout: 10000,
            ...options
        };

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
        this.checkHeartbeat = this.checkHeartbeat.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    startHeartbeatMonitoring() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }

        const monitorHeartbeat = () => {
            if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
                this.checkHeartbeat();
            }
            this.frameId = requestAnimationFrame(monitorHeartbeat);
        };

        this.frameId = requestAnimationFrame(monitorHeartbeat);
        console.debug(`Started heartbeat monitoring for account ${this.accountId}`);
    }

    stopHeartbeatMonitoring() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        console.debug(`Stopped heartbeat monitoring for account ${this.accountId}`);
    }

    checkHeartbeat() {
        const now = Date.now();
        const timeSinceLastMessage = now - this.lastMessageTime;

        if (timeSinceLastMessage >= this.options.heartbeatThreshold) {
            try {
                this.ws.send('[]');
                this.metrics.heartbeatsSent++;
                this.missedHeartbeats++;

                console.debug(`Sent heartbeat for account ${this.accountId}. Missed: ${this.missedHeartbeats}`);

                if (this.missedHeartbeats >= this.options.maxMissedHeartbeats) {
                    console.warn(`Max missed heartbeats (${this.missedHeartbeats}) reached for ${this.accountId}`);
                    this.handleHeartbeatFailure();
                }
            } catch (error) {
                console.error(`Failed to send heartbeat: ${error.message}`);
                this.metrics.heartbeatsFailed++;
                this.handleError(error);
            }
        }
    }

    async handleMessage(event) {
        try {
            // Update last message time for any message
            this.lastMessageTime = Date.now();
            this.metrics.messagesReceived++;

            // Handle heartbeat response
            if (event.data === '[]') {
                this.missedHeartbeats = 0;
                return;
            }

            // Process non-heartbeat messages
            const message = JSON.parse(event.data);
            await this.processMessage(message);

        } catch (error) {
            console.error(`Message handling error: ${error.message}`);
            this.metrics.errors++;
            this.handleError(error);
        }
    }

    async connect() {
        if (this.isConnected) {
            console.debug(`Already connected to account ${this.accountId}`);
            return true;
        }

        try {
            const url = this.getWebSocketUrl();
            this.ws = new WebSocket(url);

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                    this.handleError(new Error('Connection timeout'));
                }, this.options.connectionTimeout);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.status = 'CONNECTED';
                    this.lastMessageTime = Date.now();
                    this.missedHeartbeats = 0;
                    this.startHeartbeatMonitoring();
                    resolve(true);
                };

                this.ws.onclose = this.handleClose.bind(this);
                this.ws.onerror = this.handleError.bind(this);
                this.ws.onmessage = this.handleMessage.bind(this);
            });

        } catch (error) {
            console.error(`Connection error: ${error.message}`);
            this.handleError(error);
            return false;
        }
    }

    async disconnect() {
        this.stopHeartbeatMonitoring();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.status = 'DISCONNECTED';
        console.debug(`Disconnected from account ${this.accountId}`);
    }

    handleClose(event) {
        this.isConnected = false;
        this.stopHeartbeatMonitoring();
        console.debug(`WebSocket closed for account ${this.accountId}: ${event.code} - ${event.reason}`);
        
        if (this.shouldReconnect(event)) {
            this.reconnect();
        }
    }

    handleHeartbeatFailure() {
        console.warn(`Heartbeat failure for account ${this.accountId}`);
        this.disconnect();
        this.reconnect();
    }

    // Abstract methods to be implemented by subclasses
    getWebSocketUrl() {
        throw new Error('getWebSocketUrl must be implemented by subclass');
    }

    async processMessage(message) {
        throw new Error('processMessage must be implemented by subclass');
    }

    shouldReconnect(event) {
        // Default implementation - subclasses can override
        return event.code !== 1000 && event.code !== 1001;
    }

    getMetrics() {
        return {
            ...this.metrics,
            missedHeartbeats: this.missedHeartbeats,
            status: this.status,
            lastMessageTime: this.lastMessageTime
        };
    }
}

export default BaseWebSocket;