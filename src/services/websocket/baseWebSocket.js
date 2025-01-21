// services/websocket/baseWebSocket.js

import logger from '@/utils/logger';
import { WS_CONFIG, WS_STATUS, parseWSMessage } from '@/utils/config/wsConfig';
import { WebSocketConfig } from '@/core/config/websocket_config';
import { HeartbeatMetrics } from './metrics';

export const WSConnectionStatus = {
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  RECONNECTING: "RECONNECTING",
  ERROR: "ERROR"
};

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
    this.config = WebSocketConfig.HEARTBEAT;
    this.metrics = new HeartbeatMetrics();
    this.heartbeatTimer = null;
    this.healthCheckTimer = null;

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
    if (this.websocket?.readyState === WebSocket.OPEN) {
        return true;
    }

    try {
        if (this.status === WSConnectionStatus.CONNECTING) {
            return false;
        }

        this.status = WSConnectionStatus.CONNECTING;
        
        const connected = await this.establishConnection();
        if (connected) {
            this.status = WSConnectionStatus.CONNECTED;
            this.lastHeartbeat = Date.now();
            this.error_count = 0;
            this.reconnect_attempts = 0;
            
            // Start monitoring
            this.startHeartbeat();
            this.startHealthCheck();
            
            logger.info(`WebSocket connected: ${this.connection_id}`);
            return true;
        }

        return false;

    } catch (error) {
        logger.error(`Connection error: ${error}`);
        this.status = WSConnectionStatus.ERROR;
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

  startHeartbeat() {
    if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(
        () => this.sendHeartbeat(),
        this.config.INTERVAL
    );
  }

  startHealthCheck() {
      if (this.healthCheckTimer) {
          clearInterval(this.healthCheckTimer);
      }

      this.healthCheckTimer = setInterval(
          () => this.checkConnectionHealth(),
          this.config.CLEANUP_INTERVAL
      );
  }

  async sendHeartbeat() {
      if (!this.isConnected()) return;

      const startTime = Date.now();
      try {
          await this.send({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
          });

          this.metrics.totalHeartbeats++;
          this.metrics.lastSuccessful = startTime;
          this.updateHeartbeatMetrics(Date.now() - startTime);

      } catch (error) {
          await this.handleHeartbeatFailure(error);
      }
  }

  async checkConnectionHealth() {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.metrics.lastSuccessful;

      if (timeSinceLastHeartbeat > this.config.INTERVAL * 1.5) {
          await this.handleHeartbeatFailure(
              new Error('Heartbeat timeout')
          );
      }
  }

  async handleHeartbeatFailure(error) {
      this.metrics.missedHeartbeats++;
      this.metrics.lastFailure = Date.now();

      logger.warn(`Heartbeat failure: ${error.message}`);

      if (this.metrics.missedHeartbeats >= this.config.MAX_MISSED) {
          await this.initiateReconnection();
      }
  }

  updateHeartbeatMetrics(latency) {
      // Simple moving average for latency
      this.metrics.averageLatency = 
          (this.metrics.averageLatency * 0.7) + (latency * 0.3);
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
    if (this.reconnect_attempts >= this.max_reconnect_attempts) {
        logger.error('Max reconnection attempts reached');
        return false;
    }

    try {
        this.status = WSConnectionStatus.RECONNECTING;
        this.reconnect_attempts++;
        this.metrics.reconnectionAttempts++;

        // Calculate backoff time
        const backoff = Math.min(
            this.config.RECONNECT_BACKOFF.MAX,
            this.config.RECONNECT_BACKOFF.INITIAL * 
            Math.pow(this.config.RECONNECT_BACKOFF.FACTOR, this.reconnect_attempts)
        );

        logger.info(`Attempting reconnection in ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));

        return await this.connect();

    } catch (error) {
        logger.error(`Reconnection error: ${error}`);
        return false;
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
    try {
        // Clear timers
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }

        // Close websocket
        if (this.websocket) {
            await this.websocket.close();
            this.websocket = null;
        }

        this.status = WSConnectionStatus.DISCONNECTED;
        this.lastHeartbeat = null;
        logger.info(`WebSocket disconnected: ${this.connection_id}`);
        return true;

    } catch (error) {
        logger.error(`Disconnect error: ${error}`);
        return false;
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
        healthScore: this.metrics.getHealthScore(),
        averageLatency: this.metrics.averageLatency,
        totalHeartbeats: this.metrics.totalHeartbeats,
        missedHeartbeats: this.metrics.missedHeartbeats,
        lastFailure: this.metrics.lastFailure,
        reconnectionAttempts: this.metrics.reconnectionAttempts,
        status: this.status,
        lastHeartbeat: this.lastHeartbeat
    };
}

  resetMetrics() {
      this.metrics = new HeartbeatMetrics();
  }
}

export default BaseWebSocket;