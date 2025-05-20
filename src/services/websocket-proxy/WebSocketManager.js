// src/services/websocket-proxy/WebSocketManager.js

import WebSocketClient from './WebSocketClient';
import { EventEmitter } from 'events';
import logger from '@/utils/logger';

/**
 * Connection states enum
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
};

/**
 * WebSocketManager
 * Manages multiple WebSocket connections to different broker accounts
 * Provides centralized connection management, caching, and event handling
 */
class WebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.connectionState = new Map();
    this.dataCache = {
      marketData: new Map(),
      accountData: new Map(),
      positions: new Map(),
      orders: new Map()
    };
    
    // For storing connection retry metadata
    this.connectionRetries = new Map();
    
    // For tracking message rate limits
    this.messageRateLimits = {
      default: { count: 0, lastReset: Date.now(), limit: 100, interval: 60000 },
      marketData: { count: 0, lastReset: Date.now(), limit: 200, interval: 60000 },
      orders: { count: 0, lastReset: Date.now(), limit: 30, interval: 60000 }
    };
    
    // Cache persistence interval
    this.persistInterval = null;
    
    // Shared broker connections for optimization - key is brokerId:environment
    this.sharedBrokerConnections = new Map();
    
    // Subscription management - key is symbol, value is set of connection IDs
    this.marketDataSubscriptions = new Map();
    
    // Keep track of pending connection promises
    this.pendingConnections = new Map();
    
    // Config properties
    this.config = {
      baseUrl: process.env.REACT_APP_WS_PROXY_URL || 'ws://localhost:8001',
      persistCacheInterval: 60000, // 1 minute
      maxConnectionRetries: 5,
      reconnectInterval: 2000,
      heartbeatInterval: 20000,
      defaultMessageTimeout: 10000, // 10 seconds
      rateLimitBackoff: 500, // 500ms backoff during rate limiting
      cacheTTL: {
        marketData: 30 * 60 * 1000, // 30 minutes
        positions: 5 * 60 * 1000,   // 5 minutes
        orders: 5 * 60 * 1000,      // 5 minutes
        accountData: 15 * 60 * 1000 // 15 minutes
      }
    };
    
    // Initialize cache from localStorage if available
    this.loadCacheFromStorage();
    
    // Start cache persistence
    this.startCachePersistence();
    
    // Start rate limit reset interval
    this.startRateLimitReset();
  }
  
  /**
 * Get the WebSocket URL for a broker account
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @returns {string} WebSocket URL
 */
  getWebSocketUrl(brokerId, accountId) {
    // Add debugging BEFORE retrieving the token
    console.log(`[WebSocketManager] Getting WebSocket URL: broker=${brokerId}, account=${accountId}`);
    
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    // Debug token info without exposing the actual token
    console.log(`[WebSocketManager] Raw token length: ${token?.length || 0}`);
    
    // Base URL construction
    const baseUrl = this.config.baseUrl || process.env.REACT_APP_WS_PROXY_URL || 'ws://localhost:8001';
    console.log(`[WebSocketManager] Using base URL: ${baseUrl}`);
    
    // Construct the URL with properly encoded token (only once)
    const url = `${baseUrl}/ws/${brokerId}?broker_account_id=${accountId}&token=${encodeURIComponent(token)}`;
    
    return url;
  }
  
  /**
 * Connect to a broker account
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @param {Object} options - Connection options
 * @returns {Promise<string>} - Resolves to connection ID when connected
 */
  async connect(brokerId, accountId, options = {}) {
    if (!brokerId || !accountId) {
      const errorMsg = 'Broker ID and Account ID are required';
      console.error(`[WebSocketManager] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Debug connection attempt with detailed parameters
    console.log(`[WebSocketManager] Connect called: broker=${brokerId}, account=${accountId}, options=`, options);
    
    const connectionId = `${brokerId}:${accountId}`;
    
    // Check if we already have a pending connection promise for this connection
    if (this.pendingConnections?.has(connectionId)) {
      console.log(`[WebSocketManager] Connection already pending for ${connectionId}`);
      return this.pendingConnections.get(connectionId);
    }
    
    // Create a new promise for this connection attempt
    const connectionPromise = new Promise((resolve, reject) => {
      try {
        // Update connection state
        this.connectionState?.set(connectionId, ConnectionState.CONNECTING);
        this.emit('connectionState', { 
          brokerId, 
          accountId, 
          state: ConnectionState.CONNECTING 
        });
        
        // Get the WebSocket URL
        const wsUrl = this.getWebSocketUrl(brokerId, accountId);
        
        // Create WebSocket connection with a much longer timeout
        console.log(`[WebSocketManager] Creating WebSocket connection to ${brokerId}:${accountId}`);
        
        const client = new WebSocket(wsUrl);
        
        // Track connection timeout with a longer value (30 seconds instead of default)
        const connectionTimeout = setTimeout(() => {
          console.error(`[WebSocketManager] Connection timeout for ${connectionId}`);
          client.close(4000, "Connection timeout");
          reject(new Error("Connection timeout"));
        }, 30000); // Increased from typical 10s to 30s
        
        // Set up WebSocket event handlers
        client.onopen = () => {
          console.log(`[WebSocketManager] WebSocket connection opened: ${connectionId}`);
          clearTimeout(connectionTimeout);
          
          // Update connection state
          this.connections?.set(connectionId, client);
          this.connectionState?.set(connectionId, ConnectionState.CONNECTED);
          this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.CONNECTED 
          });
          
          resolve(connectionId);
        };
        
        client.onclose = (event) => {
          console.log(`[WebSocketManager] WebSocket connection closed: ${connectionId} (Code: ${event.code})`);
          clearTimeout(connectionTimeout);
          
          // Only reject if this close happens during initial connection
          if (this.connectionState?.get(connectionId) === ConnectionState.CONNECTING) {
            reject(new Error(`Connection closed during initialization: ${event.reason || 'No reason provided'}`));
          }
          
          // Update connection state
          this.connectionState?.set(connectionId, ConnectionState.DISCONNECTED);
          this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.DISCONNECTED,
            code: event.code,
            reason: event.reason
          });
        };
        
        client.onerror = (error) => {
          console.error(`[WebSocketManager] WebSocket error for ${connectionId}:`, error);
          
          // Only reject if this happens during initial connection
          if (this.connectionState?.get(connectionId) === ConnectionState.CONNECTING) {
            reject(new Error("WebSocket connection error"));
          }
          
          // Update connection state
          this.connectionState?.set(connectionId, ConnectionState.ERROR);
          this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.ERROR,
            error: error.message
          });
        };
        
        // Add message handler to detect initial connection messages
        client.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Check for connection status messages
            if (data.type === 'connecting_status' || data.type === 'connection_established') {
              console.log(`[WebSocketManager] Received connection status: ${data.type}`, data);
            }
          } catch (e) {
            // Non-JSON messages can be ignored here
          }
        };
        
      } catch (error) {
        reject(error);
      }
    });
    
    // Store the pending connection promise
    this.pendingConnections.set(connectionId, connectionPromise);
    
    // Clean up the pending promise after it resolves or rejects
    connectionPromise.finally(() => {
      this.pendingConnections.delete(connectionId);
    });
    
    return connectionPromise;
  }
  
  /**
   * Internal method to create a new connection
   * @private
   */
  async _createConnection(brokerId, accountId, options = {}) {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Update connection state
    this.connectionState.set(connectionId, ConnectionState.CONNECTING);
    this.emit('connectionState', { 
      brokerId, 
      accountId, 
      state: ConnectionState.CONNECTING 
    });
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.connectionState.set(connectionId, ConnectionState.ERROR);
      this.emit('connectionState', { 
        brokerId, 
        accountId, 
        state: ConnectionState.ERROR,
        error: 'No authentication token found'
      });
      throw new Error('Authentication token is required');
    }
    
    try {
      // Check for an existing shared connection if sharing is enabled
      if (options.useSharedConnection) {
        const environment = options.environment || 'demo';
        const sharedKey = `${brokerId}:${environment}`;
        
        if (this.sharedBrokerConnections.has(sharedKey)) {
          const sharedClient = this.sharedBrokerConnections.get(sharedKey);
          
          // Check if the shared connection is still valid
          if (sharedClient.isConnected()) {
            // Use the shared connection
            this.connections.set(connectionId, sharedClient);
            this.connectionState.set(connectionId, ConnectionState.CONNECTED);
            this.emit('connectionState', { 
              brokerId, 
              accountId, 
              state: ConnectionState.CONNECTED 
            });
            
            logger.info(`Using shared connection for ${connectionId}`);
            return connectionId;
          } else {
            // Remove the invalid shared connection
            this.sharedBrokerConnections.delete(sharedKey);
          }
        }
      }
      
      // Create WebSocket client
      const wsUrl = this.getWebSocketUrl(brokerId, accountId);
      logger.info(`Creating new WebSocket connection to ${wsUrl}`);
      
      const client = new WebSocketClient(wsUrl, {
        reconnectInterval: options.reconnectInterval || this.config.reconnectInterval,
        maxReconnectAttempts: options.maxReconnectAttempts || this.config.maxConnectionRetries,
        heartbeatInterval: options.heartbeatInterval || this.config.heartbeatInterval,
        debug: options.debug || false
      });
      
      // Set up event listeners
      client.on('connected', () => {
        this.handleConnection(brokerId, accountId);
      });
      
      client.on('disconnected', () => {
        this.handleDisconnection(brokerId, accountId);
      });
      
      client.on('error', (error) => {
        this.handleError(brokerId, accountId, error);
      });
      
      client.on('reconnecting', () => {
        this.connectionState.set(connectionId, ConnectionState.RECONNECTING);
        this.emit('connectionState', { 
          brokerId, 
          accountId, 
          state: ConnectionState.RECONNECTING 
        });
      });
      
      client.on('reconnect_failed', () => {
        this.handleReconnectFailed(brokerId, accountId);
      });
      
      client.on('message', (message) => {
        this.handleMessage(brokerId, accountId, message);
      });
      
      // Store the client
      this.connections.set(connectionId, client);
      
      // Connect to the WebSocket
      await client.connect(token);
      
      // If successful and this is a shared connection, store it
      if (options.createSharedConnection) {
        const environment = options.environment || 'demo';
        const sharedKey = `${brokerId}:${environment}`;
        this.sharedBrokerConnections.set(sharedKey, client);
        logger.info(`Created shared connection for ${sharedKey}`);
      }
      
      return connectionId;
    } catch (error) {
      this.connectionState.set(connectionId, ConnectionState.ERROR);
      this.emit('connectionState', { 
        brokerId, 
        accountId, 
        state: ConnectionState.ERROR,
        error: error.message
      });
      
      logger.error(`Failed to connect to ${connectionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Disconnect from a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {boolean} - Success status
   */
  disconnect(brokerId, accountId) {
    const connectionId = `${brokerId}:${accountId}`;
    const client = this.connections.get(connectionId);
    
    if (client) {
      // Check if this is a shared connection
      const isShared = Array.from(this.sharedBrokerConnections.entries())
        .some(([_, sharedClient]) => sharedClient === client);
      
      // If it's a shared connection, don't actually close it
      // Just remove this specific connection tracking
      if (isShared) {
        logger.info(`Disconnecting from shared connection for ${connectionId}`);
        this.connections.delete(connectionId);
        this.connectionState.set(connectionId, ConnectionState.DISCONNECTED);
        
        this.emit('connectionState', { 
          brokerId, 
          accountId, 
          state: ConnectionState.DISCONNECTED 
        });
        
        return true;
      }
      
      // Regular connection - actually close it
      client.disconnect();
      this.connections.delete(connectionId);
      this.connectionState.set(connectionId, ConnectionState.DISCONNECTED);
      
      this.emit('connectionState', { 
        brokerId, 
        accountId, 
        state: ConnectionState.DISCONNECTED 
      });
      
      logger.info(`Disconnected from ${connectionId}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Disconnect all connections
   */
  disconnectAll() {
    // Keep track of shared connections to avoid disconnecting them multiple times
    const processedSharedClients = new Set();
    
    for (const [connectionId, client] of this.connections.entries()) {
      const [brokerId, accountId] = connectionId.split(':');
      
      // Check if this is a shared connection that we've already processed
      let isSharedAndProcessed = false;
      for (const [_, sharedClient] of this.sharedBrokerConnections.entries()) {
        if (sharedClient === client && processedSharedClients.has(sharedClient)) {
          isSharedAndProcessed = true;
          break;
        }
      }
      
      if (!isSharedAndProcessed) {
        // Check if client is a WebSocket object or a wrapper with disconnect method
        if (client instanceof WebSocket) {
          // Native WebSocket - use close()
          client.close();
        } else if (typeof client.disconnect === 'function') {
          // Custom client object with disconnect method
          client.disconnect();
        } else if (client.socket && typeof client.socket.close === 'function') {
          // Client might be a wrapper with a socket property
          client.socket.close();
        } else {
          // Fallback - log warning
          console.warn(`Unable to disconnect client for ${connectionId}: unknown client type`);
        }
        
        // If it's shared, mark it as processed
        for (const [sharedKey, sharedClient] of this.sharedBrokerConnections.entries()) {
          if (sharedClient === client) {
            processedSharedClients.add(sharedClient);
            break;
          }
        }
      }
      
      this.connectionState.set(connectionId, ConnectionState.DISCONNECTED);
      this.emit('connectionState', { 
        brokerId, 
        accountId, 
        state: ConnectionState.DISCONNECTED 
      });
    }
    
    this.connections.clear();
    this.sharedBrokerConnections.clear();
    logger.info('All connections disconnected');
  }
  
  /**
   * Send a message to a broker account with rate limiting
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} message - Message to send
   * @param {string} category - Rate limit category (default, marketData, orders)
   * @returns {Promise<boolean>} - Success status
   */
  async sendMessage(brokerId, accountId, message, category = 'default') {
    const connectionId = `${brokerId}:${accountId}`;
    const client = this.connections.get(connectionId);
    
    if (!client) {
      logger.warn(`Cannot send message: No connection for ${connectionId}`);
      return false;
    }
    
    // Apply rate limiting
    await this.applyRateLimit(category);
    
    // Send message
    return client.send(message);
  }
  
  /**
   * Apply rate limiting to message sending
   * @param {string} category - Rate limit category
   * @returns {Promise<void>}
   */
  async applyRateLimit(category) {
    const limiter = this.messageRateLimits[category] || this.messageRateLimits.default;
    
    // Check if we need to reset the counter
    if (Date.now() - limiter.lastReset > limiter.interval) {
      limiter.count = 0;
      limiter.lastReset = Date.now();
    }
    
    // Check if we've hit the limit
    if (limiter.count >= limiter.limit) {
      // Calculate how long to wait
      const timeToReset = limiter.interval - (Date.now() - limiter.lastReset);
      const waitTime = Math.max(timeToReset, this.config.rateLimitBackoff);
      
      logger.warn(`Rate limit hit for ${category}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Reset after waiting
      limiter.count = 0;
      limiter.lastReset = Date.now();
    }
    
    // Increment counter
    limiter.count++;
  }
  
  /**
   * Get connection state for a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {string} - Connection state
   */
  getConnectionState(brokerId, accountId) {
    const connectionId = `${brokerId}:${accountId}`;
    return this.connectionState.get(connectionId) || ConnectionState.DISCONNECTED;
  }
  
  /**
   * Check if connected to a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {boolean} - Connection status
   */
  isConnected(brokerId, accountId) {
    return this.getConnectionState(brokerId, accountId) === ConnectionState.CONNECTED;
  }
  
  /**
   * Handle successful connection
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   */
  handleConnection(brokerId, accountId) {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Reset connection retries
    this.connectionRetries.delete(connectionId);
    
    // Update connection state
    this.connectionState.set(connectionId, ConnectionState.CONNECTED);
    
    // Emit connection state event
    this.emit('connectionState', { 
      brokerId, 
      accountId, 
      state: ConnectionState.CONNECTED 
    });
    
    logger.info(`Connected to ${connectionId}`);
  }
  
  /**
   * Handle disconnection
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   */
  handleDisconnection(brokerId, accountId) {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Update connection state
    this.connectionState.set(connectionId, ConnectionState.DISCONNECTED);
    
    // Emit disconnection event
    this.emit('connectionState', { 
      brokerId, 
      accountId, 
      state: ConnectionState.DISCONNECTED 
    });
    
    logger.info(`Disconnected from ${connectionId}`);
  }
  
  /**
   * Handle connection error
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Error} error - Error object
   */
  handleError(brokerId, accountId, error) {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Update connection state
    this.connectionState.set(connectionId, ConnectionState.ERROR);
    
    // Emit error event
    this.emit('connectionState', { 
      brokerId, 
      accountId, 
      state: ConnectionState.ERROR,
      error: error.message
    });
    
    logger.error(`Connection error for ${connectionId}:`, error);
  }
  
  /**
   * Handle failed reconnection attempts
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   */
  handleReconnectFailed(brokerId, accountId) {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Update connection state
    this.connectionState.set(connectionId, ConnectionState.ERROR);
    
    // Emit error event
    this.emit('connectionState', { 
      brokerId, 
      accountId, 
      state: ConnectionState.ERROR,
      error: 'Maximum reconnection attempts reached'
    });
    
    logger.error(`Reconnection failed for ${connectionId}`);
  }
  
  /**
   * Handle incoming message
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} message - Message object
   */
  handleMessage(brokerId, accountId, message) {
    // Add metadata to message
    const enrichedMessage = {
      ...message,
      brokerId,
      accountId,
      timestamp: Date.now()
    };
    
    // Emit message event
    this.emit('message', enrichedMessage);
    
    // Process message based on type
    if (message.type) {
      this.emit(message.type, enrichedMessage);
      
      // Process different message types for caching
      if (message.type === 'market_data' && message.data) {
        this.updateMarketData(brokerId, accountId, message.data);
      } else if (message.type === 'account_update' && message.data) {
        this.updateAccountData(brokerId, accountId, message.data);
      } else if (message.type === 'position_update' && message.data) {
        this.updatePositionData(brokerId, accountId, message.data);
      } else if (message.type === 'order_update' && message.data) {
        this.updateOrderData(brokerId, accountId, message.data);
      } else if (message.type === 'user_data' && message.data) {
        // Handle initial sync data
        this.handleUserData(brokerId, accountId, message.data);
      }
    }
  }
  
  /**
   * Update market data cache
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - Market data
   */
  updateMarketData(brokerId, accountId, data) {
    if (!data.symbol) return;
    
    const key = `${data.symbol}`;
    const currentData = this.dataCache.marketData.get(key) || {};
    
    // Merge with existing data
    const updatedData = {
      ...currentData,
      ...data,
      brokerId,
      accountId,
      timestamp: Date.now()
    };
    
    // Update cache
    this.dataCache.marketData.set(key, updatedData);
    
    // Emit market data update event
    this.emit('marketDataUpdate', updatedData);
    
    // If multiple clients have subscribed to this symbol, broadcast
    if (this.marketDataSubscriptions.has(key)) {
      this.broadcastMarketData(key, updatedData);
    }
  }
  
  /**
   * Broadcast market data to all subscribed connections
   * @param {string} symbol - Market symbol
   * @param {Object} data - Market data
   */
  broadcastMarketData(symbol, data) {
    const subscribers = this.marketDataSubscriptions.get(symbol);
    if (!subscribers || subscribers.size === 0) return;
    
    // Broadcast to all subscribers
    for (const connectionId of subscribers) {
      // Parse the connection ID to get brokerId and accountId
      const [brokerId, accountId] = connectionId.split(':');
      
      // Emit a direct message event for this connection
      this.emit(`marketData:${connectionId}`, {
        type: 'market_data',
        symbol,
        data,
        brokerId,
        accountId,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Subscribe to market data
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {string} symbol - Market symbol
   * @param {string} subscriptionType - Subscription type (e.g., 'quote', 'chart')
   * @returns {Promise<boolean>} - Success status
   */
  async subscribeToMarketData(brokerId, accountId, symbol, subscriptionType = 'quote') {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Add to subscriptions tracking
    if (!this.marketDataSubscriptions.has(symbol)) {
      this.marketDataSubscriptions.set(symbol, new Set());
    }
    this.marketDataSubscriptions.get(symbol).add(connectionId);
    
    // If already have data, send it immediately
    const cachedData = this.dataCache.marketData.get(symbol);
    if (cachedData) {
      this.emit(`marketData:${connectionId}`, {
        type: 'market_data',
        symbol,
        data: cachedData,
        brokerId,
        accountId,
        timestamp: Date.now()
      });
    }
    
    // Forward the subscription request to the broker
    return this.sendMessage(brokerId, accountId, {
      type: 'subscribe',
      symbol,
      subscriptionType
    }, 'marketData');
  }
  
  /**
   * Unsubscribe from market data
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {string} symbol - Market symbol
   * @param {string} subscriptionType - Subscription type
   * @returns {Promise<boolean>} - Success status
   */
  async unsubscribeFromMarketData(brokerId, accountId, symbol, subscriptionType = 'quote') {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Remove from subscriptions tracking
    if (this.marketDataSubscriptions.has(symbol)) {
      this.marketDataSubscriptions.get(symbol).delete(connectionId);
      if (this.marketDataSubscriptions.get(symbol).size === 0) {
        this.marketDataSubscriptions.delete(symbol);
      }
    }
    
    // Only send unsubscribe if no other connections are subscribed
    if (!this.marketDataSubscriptions.has(symbol)) {
      return this.sendMessage(brokerId, accountId, {
        type: 'unsubscribe',
        symbol,
        subscriptionType
      }, 'marketData');
    }
    
    return true;
  }
  
  /**
   * Update account data cache
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - Account data
   */
  updateAccountData(brokerId, accountId, data) {
    const key = `${brokerId}:${accountId}`;
    const currentData = this.dataCache.accountData.get(key) || {};
    
    // Merge with existing data
    const updatedData = {
      ...currentData,
      ...data,
      brokerId,
      accountId,
      timestamp: Date.now()
    };
    
    // Update cache
    this.dataCache.accountData.set(key, updatedData);
    
    // Emit account update event
    this.emit('accountUpdate', updatedData);
  }
  
  /**
   * Update position data cache
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - Position data
   */
  updatePositionData(brokerId, accountId, data) {
    if (!data.contractId && !data.symbol) return;
    
    const key = `${brokerId}:${accountId}:${data.contractId || data.symbol}`;
    const currentData = this.dataCache.positions.get(key) || {};
    
    // Merge with existing data
    const updatedData = {
      ...currentData,
      ...data,
      brokerId,
      accountId,
      timestamp: Date.now()
    };
    
    // Update cache
    this.dataCache.positions.set(key, updatedData);
    
    // Emit position update event
    this.emit('positionUpdate', updatedData);
  }
  
  /**
   * Update order data cache
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - Order data
   */
  updateOrderData(brokerId, accountId, data) {
    if (!data.orderId) return;
    
    const key = `${brokerId}:${accountId}:${data.orderId}`;
    const currentData = this.dataCache.orders.get(key) || {};
    
    // Merge with existing data
    const updatedData = {
      ...currentData,
      ...data,
      brokerId,
      accountId,
      timestamp: Date.now()
    };
    
    // Update cache
    this.dataCache.orders.set(key, updatedData);
    
    // Emit order update event
    this.emit('orderUpdate', updatedData);
  }
  
  /**
   * Handle initial user data sync
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - User data
   */
  handleUserData(brokerId, accountId, data) {
    // Process accounts
    if (data.accounts && Array.isArray(data.accounts)) {
      data.accounts.forEach(account => {
        this.updateAccountData(brokerId, accountId, account);
      });
    }
    
    // Process positions
    if (data.positions && Array.isArray(data.positions)) {
      data.positions.forEach(position => {
        this.updatePositionData(brokerId, accountId, position);
      });
    }
    
    // Process orders
    if (data.orders && Array.isArray(data.orders)) {
      data.orders.forEach(order => {
        this.updateOrderData(brokerId, accountId, order);
      });
    }
    
    // Emit user data sync complete event
    this.emit('userDataSynced', { brokerId, accountId, timestamp: Date.now() });
  }
  
  /**
   * Get market data for a symbol
   * @param {string} symbol - Symbol
   * @returns {Object|null} - Market data
   */
  getMarketData(symbol) {
    return this.dataCache.marketData.get(symbol) || null;
  }
  
  /**
   * Get all market data
   * @returns {Array} - All market data
   */
  getAllMarketData() {
    return Array.from(this.dataCache.marketData.values());
  }
  
  /**
   * Get account data
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Object|null} - Account data
   */
  getAccountData(brokerId, accountId) {
    const key = `${brokerId}:${accountId}`;
    return this.dataCache.accountData.get(key) || null;
  }
  
  /**
   * Get all account data
   * @returns {Array} - All account data
   */
  getAllAccountData() {
    return Array.from(this.dataCache.accountData.values());
  }
  
  /**
   * Get positions for an account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Array} - Account positions
   */
  getPositions(brokerId, accountId) {
    const positions = [];
    const prefix = `${brokerId}:${accountId}:`;
    
    for (const [key, position] of this.dataCache.positions.entries()) {
      if (key.startsWith(prefix)) {
        positions.push(position);
      }
    }
    
    return positions;
  }
  
  /**
   * Get all positions
   * @returns {Array} - All positions
   */
  getAllPositions() {
    return Array.from(this.dataCache.positions.values());
  }
  
  /**
   * Get orders for an account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Array} - Account orders
   */
  getOrders(brokerId, accountId) {
    const orders = [];
    const prefix = `${brokerId}:${accountId}:`;
    
    for (const [key, order] of this.dataCache.orders.entries()) {
      if (key.startsWith(prefix)) {
        orders.push(order);
      }
    }
    
    return orders;
  }
  
  /**
   * Get all orders
   * @returns {Array} - All orders
   */
  getAllOrders() {
    return Array.from(this.dataCache.orders.values());
  }
  
  /**
   * Get a shared connection or create a new one
   * @param {string} brokerId - Broker identifier
   * @param {string} environment - Broker environment (demo/live)
   * @param {string} accountId - Account identifier for new connection
   * @returns {Promise<string>} - Connection ID
   */
  async getOrCreateSharedConnection(brokerId, environment, accountId) {
    const sharedKey = `${brokerId}:${environment}`;
    
    // Check if we already have a valid shared connection
    if (this.sharedBrokerConnections.has(sharedKey)) {
      const client = this.sharedBrokerConnections.get(sharedKey);
      
      // Find the connection ID for this client
      for (const [connId, conn] of this.connections.entries()) {
        if (conn === client) {
          // Check if the connection is still valid
          if (this.connectionState.get(connId) === ConnectionState.CONNECTED) {
            logger.info(`Using existing shared connection for ${sharedKey}`);
            return connId;
          }
          break;
        }
      }
      
      // If we got here, the shared connection is invalid, remove it
      this.sharedBrokerConnections.delete(sharedKey);
    }
    
    // Create a new shared connection
    return this.connect(brokerId, accountId, {
      environment,
      createSharedConnection: true
    });
  }
  
  /**
   * Load cache from localStorage
   */
  loadCacheFromStorage() {
    try {
      // Load market data
      const marketDataJson = localStorage.getItem('ws_market_data');
      if (marketDataJson) {
        const marketData = JSON.parse(marketDataJson);
        this.dataCache.marketData = new Map(Object.entries(marketData));
      }
      
      // Load account data
      const accountDataJson = localStorage.getItem('ws_account_data');
      if (accountDataJson) {
        const accountData = JSON.parse(accountDataJson);
        this.dataCache.accountData = new Map(Object.entries(accountData));
      }
      
      // Load positions
      const positionsJson = localStorage.getItem('ws_positions');
      if (positionsJson) {
        const positions = JSON.parse(positionsJson);
        this.dataCache.positions = new Map(Object.entries(positions));
      }
      
      // Load orders
      const ordersJson = localStorage.getItem('ws_orders');
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        this.dataCache.orders = new Map(Object.entries(orders));
      }
      
      logger.info('WebSocket cache loaded from storage');
    } catch (error) {
      logger.error('Error loading cache from storage:', error);
    }
  }
  
  /**
   * Save cache to localStorage
   */
  saveCacheToStorage() {
    try {
      const now = Date.now();
      
      // Save market data (only recent data, last 30 minutes)
      const marketData = {};
      for (const [key, value] of this.dataCache.marketData.entries()) {
        if (value.timestamp && now - value.timestamp < this.config.cacheTTL.marketData) {
          marketData[key] = value;
        }
      }
      localStorage.setItem('ws_market_data', JSON.stringify(marketData));
      
      // Save account data (only recent data)
      const accountData = {};
      for (const [key, value] of this.dataCache.accountData.entries()) {
        if (value.timestamp && now - value.timestamp < this.config.cacheTTL.accountData) {
          accountData[key] = value;
        }
      }
      localStorage.setItem('ws_account_data', JSON.stringify(accountData));
      
      // Save positions (only recent data)
      const positions = {};
      for (const [key, value] of this.dataCache.positions.entries()) {
        if (value.timestamp && now - value.timestamp < this.config.cacheTTL.positions) {
          positions[key] = value;
        }
      }
      localStorage.setItem('ws_positions', JSON.stringify(positions));
      
      // Save orders (only recent data)
      const orders = {};
      for (const [key, value] of this.dataCache.orders.entries()) {
        if (value.timestamp && now - value.timestamp < this.config.cacheTTL.orders) {
          orders[key] = value;
        }
      }
      localStorage.setItem('ws_orders', JSON.stringify(orders));
      
      logger.debug('WebSocket cache saved to storage');
    } catch (error) {
      logger.error('Error saving cache to storage:', error);
    }
  }
  
  /**
   * Start cache persistence interval
   */
  startCachePersistence() {
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
    }
    
    this.persistInterval = setInterval(() => {
      this.saveCacheToStorage();
    }, this.config.persistCacheInterval);
    
    // Also save on window unload
    window.addEventListener('beforeunload', () => {
      this.saveCacheToStorage();
    });
  }
  
  /**
   * Start rate limit reset interval
   */
  startRateLimitReset() {
    setInterval(() => {
      const now = Date.now();
      
      // Reset rate limits if interval has passed
      for (const category in this.messageRateLimits) {
        const limiter = this.messageRateLimits[category];
        if (now - limiter.lastReset > limiter.interval) {
          limiter.count = 0;
          limiter.lastReset = now;
        }
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Stop cache persistence interval
   */
  stopCachePersistence() {
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
      this.persistInterval = null;
    }
  }
  
  /**
   * Clear the data cache
   */
  clearCache() {
    this.dataCache.marketData.clear();
    this.dataCache.accountData.clear();
    this.dataCache.positions.clear();
    this.dataCache.orders.clear();
    
    // Also clear from localStorage
    localStorage.removeItem('ws_market_data');
    localStorage.removeItem('ws_account_data');
    localStorage.removeItem('ws_positions');
    localStorage.removeItem('ws_orders');
    
    logger.info('WebSocket cache cleared');
  }
}

// Create singleton instance
const webSocketManager = new WebSocketManager();

export default webSocketManager;