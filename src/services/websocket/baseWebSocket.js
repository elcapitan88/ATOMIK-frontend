// services/websocket/baseWebSocket.js

import logger from '@/utils/logger';
import { WS_CONFIG, WS_STATUS, parseWSMessage } from '@/utils/config/wsConfig';

class BaseWebSocket {
  constructor(accountId, options = {}) {
    // Connection settings
    this.accountId = accountId;
    this.options = {
      reconnectAttempts: WS_CONFIG.RECONNECT_ATTEMPTS,
      reconnectInterval: WS_CONFIG.RECONNECT_INTERVAL,
      heartbeatInterval: WS_CONFIG.HEARTBEAT_INTERVAL,
      connectionTimeout: WS_CONFIG.CONNECTION_TIMEOUT,
      ...options
    };

    // Connection state
    this.ws = null;
    this.isConnected = false;
    this.status = WS_STATUS.DISCONNECTED;
    this.lastHeartbeat = null;
    this.connectionPromise = null;

    // Message handling
    this.messageQueue = [];
    this.pendingMessages = new Map();
    this.messageTimeout = 5000;
    this.lastMessageId = 0;

    // Subscriptions
    this.subscriptions = new Set();
    this.marketDataSubscriptions = new Map();
    
    // Performance tracking
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      lastReconnectTime: null
    };

    // Timers
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.connectionTimer = null;

    // Circuit breaker
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      threshold: 5,
      resetTimeout: 60000,
      status: 'closed' // closed, open, half-open
    };

    // Event handlers
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
    this.onReconnect = null;
    this.onStatusChange = null;
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return true;

    try {
        const token = localStorage.getItem('access_token');
        const url = new URL(this.getWebSocketUrl());
        url.searchParams.append('token', token);

        this.ws = new WebSocket(url.toString());
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, this.options.connectionTimeout);

            this.ws.onopen = () => {
                clearTimeout(timeout);
                this.startHeartbeat();
                resolve(true);
            };

            this.ws.onerror = (error) => {
                clearTimeout(timeout);
                reject(error);
            };
        });

    } catch (error) {
        this.handleError(error);
        return false;
    }
}


  setupEventHandlers(resolve, reject) {
    if (!this.ws) return;

    this.ws.onopen = () => {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
      this.handleConnectionOpen();
      resolve(true);
    };

    this.ws.onclose = (event) => {
      this.handleConnectionClose(event);
    };

    this.ws.onerror = (error) => {
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
        reject(error);
      }
      this.handleError(error);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  handleConnectionOpen() {
    this.isConnected = true;
    this.status = WS_STATUS.CONNECTED;
    this.lastHeartbeat = Date.now();
    this.circuitBreaker.failures = 0;
    this.updateStatus();

    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.processMessageQueue();
    
    if (this.onConnect) {
      this.onConnect();
    }

    logger.info(`WebSocket connected for account ${this.accountId}`);
  }

  handleConnectionClose(event) {
    this.isConnected = false;
    this.status = WS_STATUS.DISCONNECTED;
    this.updateStatus();
    this.cleanup();

    if (this.onDisconnect) {
      this.onDisconnect(event);
    }

    // Attempt reconnection if appropriate
    if (this.shouldReconnect()) {
      this.scheduleReconnection();
    }

    logger.info(`WebSocket disconnected for account ${this.accountId}: ${event.code} - ${event.reason}`);
  }

  async handleMessage(event) {
    try {
      const message = parseWSMessage(event.data);
      if (!message) return;

      this.metrics.messagesReceived++;
      this.lastHeartbeat = Date.now();

      // Handle system messages
      if (message.type === 'heartbeat') {
        await this.handleHeartbeat(message);
        return;
      }

      // Check for message response
      if (message.id && this.pendingMessages.has(message.id)) {
        const { resolve } = this.pendingMessages.get(message.id);
        this.pendingMessages.delete(message.id);
        resolve(message);
        return;
      }

      // Process message through handler
      if (this.onMessage) {
        await this.onMessage(message);
      }

    } catch (error) {
      logger.error('Error processing message:', error);
      this.handleError(error);
    }
  }

  async handleError(error) {
    this.metrics.errors++;
    
    // Update circuit breaker
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      await this.openCircuitBreaker();
    }

    if (this.onError) {
      this.onError(error);
    }

    logger.error(`WebSocket error for account ${this.accountId}:`, error);
  }

  async handleHeartbeat(message) {
    this.lastHeartbeat = Date.now();
    await this.send({ type: 'heartbeat_response' });
  }

  async send(data) {
    if (!this.isConnected) {
      this.queueMessage(data);
      return false;
    }

    try {
      const messageId = ++this.lastMessageId;
      const message = { id: messageId, ...data };
      
      return await this.sendWithTimeout(message);
      
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  async sendWithTimeout(message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(message.id);
        reject(new Error('Message timeout'));
      }, this.messageTimeout);

      this.pendingMessages.set(message.id, { resolve, timeout });

      try {
        this.ws.send(JSON.stringify(message));
        this.metrics.messagesSent++;
        return true;
      } catch (error) {
        clearTimeout(timeout);
        this.pendingMessages.delete(message.id);
        throw error;
      }
    });
  }

  queueMessage(message) {
    if (this.messageQueue.length >= WS_CONFIG.MAX_QUEUE_SIZE) {
      this.messageQueue.shift();
    }
    this.messageQueue.push({ message, timestamp: Date.now() });
  }

  async processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const { message } = this.messageQueue.shift();
      try {
        await this.send(message);
      } catch (error) {
        this.queueMessage(message);
        break;
      }
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'heartbeat' }).catch(this.handleError.bind(this));
      }
    }, this.options.heartbeatInterval);
  }

  shouldReconnect() {
    // Don't reconnect if circuit breaker is open
    if (this.circuitBreaker.status === 'open') {
      return false;
    }

    // Don't reconnect if explicitly disconnected
    if (this.status === WS_STATUS.DISCONNECTED && !this.autoReconnect) {
      return false;
    }

    return this.metrics.reconnections < this.options.reconnectAttempts;
  }

  async scheduleReconnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.calculateReconnectDelay();
    this.metrics.lastReconnectTime = Date.now();

    this.reconnectTimer = setTimeout(async () => {
      try {
        this.metrics.reconnections++;
        await this.reconnect();
      } catch (error) {
        logger.error('Reconnection failed:', error);
      }
    }, delay);
  }

  calculateReconnectDelay() {
    const attempt = this.metrics.reconnections + 1;
    return Math.min(
      1000 * Math.pow(2, attempt),
      this.options.maxReconnectInterval
    );
  }

  async reconnect() {
    this.status = WS_STATUS.RECONNECTING;
    this.updateStatus();

    try {
      await this.connect();
      if (this.isConnected) {
        await this.resubscribeAll();
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async resubscribeAll() {
    for (const subscription of this.subscriptions) {
      try {
        await this.send(subscription);
      } catch (error) {
        logger.error(`Failed to resubscribe to ${subscription}:`, error);
      }
    }
  }

  async openCircuitBreaker() {
    this.circuitBreaker.status = 'open';
    logger.warn(`Circuit breaker opened for account ${this.accountId}`);

    setTimeout(() => {
      this.circuitBreaker.status = 'half-open';
      this.circuitBreaker.failures = 0;
      logger.info(`Circuit breaker half-open for account ${this.accountId}`);
    }, this.circuitBreaker.resetTimeout);
  }

  updateStatus() {
    if (this.onStatusChange) {
      this.onStatusChange(this.status);
    }
  }

  async disconnect() {
    this.autoReconnect = false;
    this.cleanup();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        logger.error('Error closing WebSocket:', error);
      }
      this.ws = null;
    }
  }

  cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    // Clear pending message timeouts
    for (const { timeout } of this.pendingMessages.values()) {
      clearTimeout(timeout);
    }
    this.pendingMessages.clear();
  }

  getWebSocketUrl() {
    throw new Error('getWebSocketUrl must be implemented by subclass');
  }

  getMetrics() {
    return {
      ...this.metrics,
      queuedMessages: this.messageQueue.length,
      pendingMessages: this.pendingMessages.size,
      circuitBreakerStatus: this.circuitBreaker.status,
      lastHeartbeat: this.lastHeartbeat,
      status: this.status
    };
  }
}

export default BaseWebSocket;