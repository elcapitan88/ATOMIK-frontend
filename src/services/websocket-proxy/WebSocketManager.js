// src/services/websocket-proxy/WebSocketManager.js

import WebSocketClient from './WebSocketClient';
import { EventEmitter } from 'events';
import logger from '@/utils/logger';
import { POSITION_MESSAGE_TYPES, isPositionUpdateEvent } from './constants/positionEvents';
import { envConfig } from '../../config/environment';

/**
 * Connection states enum
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
  // New validation states
  VALIDATING_USER: 'validating_user',
  CHECKING_SUBSCRIPTION: 'checking_subscription',
  CHECKING_BROKER_ACCESS: 'checking_broker_access',
  CONNECTING_TO_BROKER: 'connecting_to_broker',
  READY: 'ready'
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
    if (envConfig.debugConfig.websocket.enabled) {
      console.log(`[WebSocketManager] Getting WebSocket URL: broker=${brokerId}, account=${accountId}`);
    }
    const token = localStorage.getItem('access_token');
    
    // Debug token info without exposing the actual token
    if (envConfig.debugConfig.websocket.enabled) {
      console.log(`[WebSocketManager] Raw token length: ${token?.length || 0}`);
    }
    
    // Determine the base URL based on environment
    // REACT_APP_WS_PROXY_URL takes priority in any environment (allows dev → prod Tradesocket)
    let baseUrl;
    if (process.env.REACT_APP_WS_PROXY_URL) {
        baseUrl = process.env.REACT_APP_WS_PROXY_URL;
    } else if (process.env.NODE_ENV === 'production') {
        baseUrl = 'wss://tradesocket-production.up.railway.app';
    } else {
        baseUrl = 'ws://localhost:8001';
    }
    
    if (envConfig.debugConfig.websocket.enabled) {
      console.log(`[WebSocketManager] Using base URL: ${baseUrl}`);
    }
    
    // Construct the URL with properly encoded token (only once)
    const url = `${baseUrl}/ws/${brokerId}?broker_account_id=${accountId}&token=${encodeURIComponent(token)}`;
    
    return url;
}
  
  /**
   * Connect to a broker account with enhanced state tracking
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
    
    if (envConfig.debugConfig.websocket.enabled) {
      console.log(`[WebSocketManager] Connect called: broker=${brokerId}, account=${accountId}, options=`, options);
    }
    
    const connectionId = `${brokerId}:${accountId}`;
    
    // Check if we already have a pending connection promise
    if (this.pendingConnections?.has(connectionId)) {
      if (envConfig.debugConfig.websocket.enabled) {
        console.log(`[WebSocketManager] Connection already pending for ${connectionId}`);
      }
      return this.pendingConnections.get(connectionId);
    }
    
    // Check if already connected
    const existingClient = this.connections.get(connectionId);
    if (existingClient && existingClient.isConnected && existingClient.isConnected()) {
      if (envConfig.debugConfig.websocket.enabled) {
        console.log(`[WebSocketManager] Already connected to ${connectionId}`);
      }
      return connectionId;
    }
    
    // Create connection promise
    const connectionPromise = this._createConnection(brokerId, accountId, options);
    
    // Store the pending connection promise
    this.pendingConnections.set(connectionId, connectionPromise);
    
    // Clean up after completion
    connectionPromise.finally(() => {
      if (this.pendingConnections.get(connectionId) === connectionPromise) {
        this.pendingConnections.delete(connectionId);
      }
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
      // Create WebSocket client
      const wsUrl = this.getWebSocketUrl(brokerId, accountId);
      logger.info(`Creating new WebSocket connection to ${wsUrl}`);
      
      const client = new WebSocketClient(wsUrl, {
        reconnectInterval: options.reconnectInterval || this.config.reconnectInterval,
        maxReconnectAttempts: options.maxReconnectAttempts || this.config.maxConnectionRetries,
        heartbeatInterval: options.heartbeatInterval || this.config.heartbeatInterval,
        debug: options.debug || false
      });
      
      // Listen for state changes from server
      client.on('state_change', (data) => {
        // Map server states to our ConnectionState enum
        const stateMap = {
          'initializing': ConnectionState.CONNECTING,
          'authenticated': ConnectionState.VALIDATING_USER,
          'subscription_verified': ConnectionState.CHECKING_SUBSCRIPTION,
          'connecting_to_broker': ConnectionState.CONNECTING_TO_BROKER,
          'broker_connected': ConnectionState.CONNECTED,
          'ready': ConnectionState.READY,
          'disconnected': ConnectionState.DISCONNECTED,
          'error': ConnectionState.ERROR
        };
        
        const mappedState = stateMap[data.state] || ConnectionState.CONNECTING;
        this.connectionState.set(connectionId, mappedState);
        
        this.emit('connectionState', {
          brokerId,
          accountId,
          state: mappedState,
          serverState: data.state,
          message: data.message,
          error: data.error
        });
      });
      
      // Set up other event listeners
      client.on('disconnected', (reason) => {
        this.handleDisconnection(brokerId, accountId);
      });
      
      client.on('error', (error) => {
        this.handleError(brokerId, accountId, error);
      });
      
      client.on('message', (message) => {
        this.handleMessage(brokerId, accountId, message);
      });
      
      // Store the client BEFORE connecting
      this.connections.set(connectionId, client);
      
      // Connect and wait for ready state
      await client.connect(token);
      
      // If we get here, connection is ready
      logger.info(`Successfully connected to ${connectionId}`);
      
      return connectionId;
      
    } catch (error) {
      // Clean up on error
      this.connections.delete(connectionId);
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
    
    if (!client) {
        logger.warn(`No connection found for ${connectionId}`);
        return false;
    }
    
    try {
        // Fix: Check if it's a native WebSocket or a WebSocketClient
        if (client instanceof WebSocket) {
            // Native WebSocket uses close()
            if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
                client.close(1000, "Normal closure");
            }
        } else if (typeof client.disconnect === 'function') {
            // WebSocketClient wrapper has disconnect()
            client.disconnect();
        }
        
        // Clean up
        this.connections.delete(connectionId);
        this.connectionState.set(connectionId, ConnectionState.DISCONNECTED);
        
        // Clear any pending connections
        if (this.pendingConnections.has(connectionId)) {
            this.pendingConnections.delete(connectionId);
        }
        
        // Emit disconnection event
        this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.DISCONNECTED 
        });
        
        logger.info(`Disconnected from ${connectionId}`);
        return true;
        
    } catch (error) {
        logger.error(`Error disconnecting ${connectionId}:`, error);
        return false;
    }
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
    
    if (envConfig.debugConfig.websocket.enabled) {
      console.log('[WebSocketManager] sendMessage called:', { connectionId, message, hasClient: !!client });
    }
    
    if (!client) {
      logger.warn(`Cannot send message: No connection for ${connectionId}`);
      return false;
    }
    
    // Apply rate limiting
    await this.applyRateLimit(category);
    
    // Send message
    const result = client.send(message);
    if (envConfig.debugConfig.websocket.enabled) {
      console.log('[WebSocketManager] Message sent, result:', result);
    }
    return result;
  }
  
  /**
   * Alias for sendMessage for backward compatibility
   */
  send(brokerId, accountId, message, category = 'default') {
    return this.sendMessage(brokerId, accountId, message, category);
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
    const connectionId = `${brokerId}:${accountId}`;
    if (envConfig.debugConfig.websocket.enabled) {
      console.log('[WebSocketManager] handleMessage received:', { connectionId, messageType: message.type, message });
      
      // Extra debug for user_data messages
      if (message?.type === 'user_data') {
        console.log('[WebSocketManager] DEBUGGING: user_data message details:', {
          hasData: !!message.data,
          dataType: typeof message.data,
          dataKeys: message.data ? Object.keys(message.data) : null,
          fullMessage: JSON.stringify(message, null, 2)
        });
      }
      
      // Extra debug for position update messages
      if (message?.type === 'position_update' || message?.type === 'position_price_update') {
        console.log('[WebSocketManager] DEBUGGING: Position update message:', {
          type: message.type,
          hasData: !!message.data,
          data: message.data,
          willEmitPositionUpdate: true
        });
      }
    }
    
    // Handle connection state messages
    if (message.type) {
      switch (message.type) {
        case 'connecting':
        case 'keep_alive':
        case 'initialization_progress':
        case 'connecting_status':
          // Progress updates - log but don't change state
          logger.debug(`[WebSocketManager] Progress: ${message.type}`);
          break;
          
        case 'connection_established':
        case 'broker_websocket_connected':
        case 'broker_connection_status':
          // Connection is progressing
          logger.info(`[WebSocketManager] Connection progress: ${message.type}`);
          break;
          
        case 'user_data':
          // User data received - connection is ready
          console.log('[WebSocketManager] User data received, data available:', !!message.data);
          console.log('[WebSocketManager] User data keys:', message.data ? Object.keys(message.data) : 'NO DATA');
          if (message.data && message.data.positions) {
            console.log('[WebSocketManager] Positions in user_data:', message.data.positions.length);
          }
          logger.info(`[WebSocketManager] User data received - connection ready`);
          this.connectionState.set(connectionId, ConnectionState.READY);
          this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.READY,
            message: 'Ready for Trading'
          });
          break;
          
        case 'account_info':
        case 'broker_connected':
        case 'connection_ready':
        case 'ready':
          // Connection is fully ready
          logger.info(`[WebSocketManager] Connection fully ready: ${connectionId}`);
          this.connectionState.set(connectionId, ConnectionState.READY);
          this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.READY,
            message: 'Ready for Trading'
          });
          break;
          
        case 'error':
        case 'connection_error':
        case 'broker_connection_error':
          logger.error(`[WebSocketManager] Connection error: ${message.message}`);
          this.connectionState.set(connectionId, ConnectionState.ERROR);
          this.emit('connectionState', { 
            brokerId, 
            accountId, 
            state: ConnectionState.ERROR,
            error: message.message
          });
          break;
          
        default:
          // Log any unhandled message types
          logger.debug(`[WebSocketManager] Unhandled message type: ${message.type}`);
          break;
      }
    }
    
    // Continue with the existing message handling...
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
        if (envConfig.debugConfig.websocket.enabled) {
          console.log('[WebSocketManager] Processing position_update message:', message.data);
        }
        this.updatePositionData(brokerId, accountId, message.data);
      } else if (isPositionUpdateEvent(message.type) && message.data) {
        // Handle new position event types
        if (envConfig.debugConfig.websocket.enabled) {
          console.log('[WebSocketManager] Processing position event:', message.type, message.data);
        }
        this.handlePositionEvent(brokerId, accountId, message);
      } else if (message.type === 'order_update' && message.data) {
        this.updateOrderData(brokerId, accountId, message.data);
      } else if (message.type === 'position_price_update' && message.data) {
        // Handle real-time position price updates
        if (envConfig.debugConfig.websocket.enabled) {
          console.log('[WebSocketManager] Processing position_price_update message:', message.data);
        }
        this.handlePositionPriceUpdate(brokerId, accountId, message.data);
      } else if (message.type === 'user_data' && message.data) {
        // Handle initial sync data
        console.log('[WebSocketManager] About to call handleUserData with data:', !!message.data);
        this.handleUserData(brokerId, accountId, message.data);
      } else if (message.type === 'user_data') {
        console.log('[WebSocketManager] user_data message received but no data:', message);
      } else if (message.type === 'positions_snapshot' && message.data) {
        // Handle positions snapshot
        console.log('[WebSocketManager] positions_snapshot received:', message.data);
        this.handlePositionSnapshot(brokerId, accountId, message.data);
      } else if (message.type === 'positionUpdate') {
        // Handle positionUpdate messages from backend (camelCase)
        console.log('[WebSocketManager] positionUpdate message:', {
          type: message.type,
          type_detail: message.type_detail,
          hasPosition: !!message.position,
        });

        // Store position data in cache (was previously missing — only emitted event)
        if (message.position) {
          const pos = message.position;
          const transformed = (pos.id && !pos.positionId)
            ? this.transformTradovatePosition(pos, null)
            : pos;
          if (transformed) {
            this.updatePositionData(brokerId, accountId, transformed);
          }
        }

        // Emit the position update with the type_detail preserved
        this.emit('positionUpdate', {
          brokerId,
          accountId,
          type: message.type_detail || 'update',
          position: message.position,
          type_detail: message.type_detail
        });
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
    if (!data.contractId && !data.symbol && !data.positionId) return;
    
    // Use positionId if available, otherwise fall back to contractId or symbol
    const key = `${brokerId}:${accountId}:${data.positionId || data.contractId || data.symbol}`;
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
    
    // Emit position update event in the new format
    if (envConfig.debugConfig.websocket.enabled) {
      console.log('[WebSocketManager] 📤 Emitting positionUpdate event:', {
        brokerId,
        accountId,
        type: 'update',
        position: {
          positionId: updatedData.positionId,
          quantity: updatedData.quantity,
          netPos: updatedData.netPos,
          side: updatedData.side
        },
        timestamp: new Date().toISOString()
      });
    }
    this.emit('positionUpdate', {
      brokerId,
      accountId,
      type: 'update', // Legacy update type
      position: updatedData
    });
  }

  /**
   * Handle new position event types
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} message - Message object with type and data
   */
  handlePositionEvent(brokerId, accountId, message) {
    const { type, data } = message;
    console.log('[WebSocketManager] handlePositionEvent:', { brokerId, accountId, type, data });
    
    // Create position key
    const positionKey = `${brokerId}:${accountId}:${data.positionId || data.contractId || data.symbol}`;
    
    switch (type) {
      case POSITION_MESSAGE_TYPES.POSITION_OPENED:
        // New position opened — transform raw Tradovate data if needed
        const rawOpened = (data.id && !data.positionId)
          ? this.transformTradovatePosition(data, null)
          : data;
        const newPosition = {
          ...rawOpened,
          brokerId,
          accountId,
          timestamp: Date.now(),
          lastUpdate: Date.now(),
          isNew: true // Flag for UI animation
        };

        // Recompute key with transformed data (positionId may differ from raw id)
        const openedKey = `${brokerId}:${accountId}:${newPosition.positionId || newPosition.contractId || newPosition.symbol}`;
        this.dataCache.positions.set(openedKey, newPosition);

        // Emit specific event for new positions
        this.emit('positionOpened', newPosition);
        this.emit('positionUpdate', { brokerId, accountId, type: 'opened', position: newPosition });
        break;
        
      case POSITION_MESSAGE_TYPES.POSITION_CLOSED:
        // Position closed
        const closedPosition = this.dataCache.positions.get(positionKey);
        if (closedPosition) {
          // Mark as closed but keep in cache briefly for UI transition
          closedPosition.isClosed = true;
          closedPosition.closedAt = Date.now();
          closedPosition.closePrice = data.closePrice;
          closedPosition.realizedPnL = data.realizedPnL;
          
          this.emit('positionClosed', { ...closedPosition, ...data });
          this.emit('positionUpdate', { brokerId, accountId, type: 'closed', position: closedPosition });
          
          // Remove from cache after delay (for UI animation)
          setTimeout(() => {
            this.dataCache.positions.delete(positionKey);
          }, 5000);
        }
        break;
        
      case POSITION_MESSAGE_TYPES.POSITION_PRICE_UPDATE:
        // Real-time price update
        const positionForPrice = this.dataCache.positions.get(positionKey);
        if (positionForPrice) {
          const previousPrice = positionForPrice.currentPrice;
          const previousPnL = positionForPrice.unrealizedPnL;
          
          // Update position with new price data
          Object.assign(positionForPrice, {
            currentPrice: data.currentPrice,
            unrealizedPnL: data.unrealizedPnL,
            previousPrice,
            previousPnL,
            lastPriceUpdate: Date.now(),
            priceChange: data.currentPrice - previousPrice,
            priceChangePercent: ((data.currentPrice - previousPrice) / previousPrice) * 100
          });
          
          // Emit price update event
          this.emit('positionPriceUpdate', positionForPrice);
          this.emit('positionUpdate', { 
            brokerId, 
            accountId, 
            type: 'priceUpdate', 
            position: positionForPrice,
            previousValues: { price: previousPrice, pnl: previousPnL }
          });
        }
        break;
        
      case POSITION_MESSAGE_TYPES.POSITION_PNL_UPDATE:
        // P&L specific update
        const positionForPnL = this.dataCache.positions.get(positionKey);
        if (positionForPnL) {
          const previousPnL = positionForPnL.unrealizedPnL;
          
          Object.assign(positionForPnL, {
            unrealizedPnL: data.unrealizedPnL,
            previousPnL,
            lastPnLUpdate: Date.now()
          });
          
          this.emit('positionPnLUpdate', positionForPnL);
          this.emit('positionUpdate', { 
            brokerId, 
            accountId, 
            type: 'pnlUpdate', 
            position: positionForPnL,
            previousPnL
          });
        }
        break;
        
      case POSITION_MESSAGE_TYPES.POSITION_UPDATED:
        // General position update (quantity, stops, etc.)
        const positionToUpdate = this.dataCache.positions.get(positionKey);
        if (positionToUpdate) {
          Object.assign(positionToUpdate, data.updates, {
            lastUpdate: Date.now()
          });
          
          this.emit('positionModified', positionToUpdate);
          this.emit('positionUpdate', { 
            brokerId, 
            accountId, 
            type: 'modified', 
            position: positionToUpdate,
            updates: data.updates
          });
        }
        break;
        
      case POSITION_MESSAGE_TYPES.POSITIONS_SNAPSHOT:
        // Full position snapshot - replace all positions for this account
        const accountKey = `${brokerId}:${accountId}`;

        // Clear existing positions for this account
        for (const [key] of this.dataCache.positions.entries()) {
          if (key.startsWith(accountKey)) {
            this.dataCache.positions.delete(key);
          }
        }

        // Handle both formats: data IS the array OR data.positions is the array
        const snapshotPositions = Array.isArray(data) ? data
          : (data.positions && Array.isArray(data.positions)) ? data.positions : [];

        // Add all positions from snapshot (transform raw Tradovate if needed)
        snapshotPositions.forEach(position => {
          const transformed = (position.id && !position.positionId)
            ? this.transformTradovatePosition(position, null)
            : position;
          if (transformed) {
            this.updatePositionData(brokerId, accountId, transformed);
          }
        });

        this.emit('positionsSnapshot', { brokerId, accountId, positions: this.getPositions(brokerId, accountId) });
        this.emit('positionUpdate', { brokerId, accountId, type: 'snapshot' });
        break;
        
      default:
        // Fallback to standard update
        this.updatePositionData(brokerId, accountId, data);
        break;
    }
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
   * Transform Tradovate position to frontend format
   * @param {Object} rawPosition - Raw position from Tradovate
   * @param {Object} contractInfo - Contract information
   * @returns {Object} - Transformed position
   */
  transformTradovatePosition(rawPosition, contractInfo) {
    const netPos = Number(rawPosition.netPos || 0);
    const quantity = Math.abs(netPos);
    
    return {
      positionId: String(rawPosition.id),
      accountId: rawPosition.accountId,
      symbol: contractInfo?.name || rawPosition.symbol || `Contract-${rawPosition.contractId}`,
      side: netPos > 0 ? 'LONG' : netPos < 0 ? 'SHORT' : 'FLAT',
      quantity: quantity,
      avgPrice: rawPosition.netPrice || rawPosition.avgPrice || 0,
      currentPrice: rawPosition.currentPrice || rawPosition.netPrice || rawPosition.avgPrice || 0,
      unrealizedPnL: rawPosition.unrealizedPnL || 0,
      timeEntered: rawPosition.timestamp || rawPosition.timeEntered,
      contractId: rawPosition.contractId,
      netPos: netPos, // Keep original netPos for reference
      netPrice: rawPosition.netPrice,
      // Keep original fields for debugging
      _original: rawPosition
    };
  }

  /**
   * Handle position price update from market data
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - Price update data
   */
  handlePositionPriceUpdate(brokerId, accountId, data) {
    console.log('[WebSocketManager] handlePositionPriceUpdate:', { brokerId, accountId, data });
    
    const positionKey = `${brokerId}:${accountId}:${data.positionId || data.contractId}`;
    const position = this.dataCache.positions.get(positionKey);
    
    if (position) {
      // Update position with new price data
      const previousPrice = position.currentPrice;
      const previousPnL = position.unrealizedPnL;
      
      const updatedPosition = {
        ...position,
        currentPrice: data.currentPrice,
        unrealizedPnL: data.unrealizedPnL,
        lastPriceUpdate: Date.now()
      };
      
      // Update cache
      this.dataCache.positions.set(positionKey, updatedPosition);
      
      // Emit price update event
      if (envConfig.debugConfig.websocket.enabled) {
        console.log('[WebSocketManager] Emitting positionUpdate event (price update):', {
          brokerId,
          accountId,
          type: 'priceUpdate',
          position: updatedPosition,
          previousValues: { price: previousPrice, pnl: previousPnL }
        });
      }
      this.emit('positionUpdate', {
        brokerId,
        accountId,
        type: 'priceUpdate',
        position: updatedPosition,
        previousValues: { price: previousPrice, pnl: previousPnL }
      });
    }
  }

  /**
   * Handle positions snapshot
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Array} positions - Array of positions
   */
  handlePositionSnapshot(brokerId, accountId, positions) {
    console.log('[WebSocketManager] handlePositionSnapshot called:', { brokerId, accountId, positionsCount: positions?.length });
    
    if (!Array.isArray(positions)) {
      console.error('[WebSocketManager] Positions snapshot is not an array:', positions);
      return;
    }
    
    // Clear existing positions for this account
    const accountKey = `${brokerId}:${accountId}`;
    for (const [key] of this.dataCache.positions.entries()) {
      if (key.startsWith(accountKey)) {
        this.dataCache.positions.delete(key);
      }
    }
    
    // Add all positions from snapshot
    positions.forEach(position => {
      // Transform if needed
      const transformedPosition = position.id && !position.positionId 
        ? this.transformTradovatePosition(position, null)
        : position;
        
      if (transformedPosition) {
        this.updatePositionData(brokerId, accountId, transformedPosition);
      }
    });
    
    // Emit snapshot event
    this.emit('positionUpdate', {
      brokerId,
      accountId,
      type: 'snapshot',
      positions: this.getPositions(brokerId, accountId)
    });
  }

  /**
   * Handle initial user data sync
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} data - User data
   */
  handleUserData(brokerId, accountId, data) {
    console.log('[WebSocketManager] handleUserData called:', { brokerId, accountId, data });
    
    // Create a map of contractId to symbol from contracts data
    const contractSymbolMap = new Map();
    if (data.contracts && Array.isArray(data.contracts)) {
      console.log('[WebSocketManager] Processing contracts:', data.contracts.length);
      data.contracts.forEach(contract => {
        if (contract.id && contract.name) {
          contractSymbolMap.set(contract.id, contract.name);
          console.log(`[WebSocketManager] Contract mapping: ${contract.id} → ${contract.name}`);
        }
      });
    }
    
    // Process accounts
    if (data.accounts && Array.isArray(data.accounts)) {
      console.log('[WebSocketManager] Processing accounts:', data.accounts.length);
      data.accounts.forEach(account => {
        this.updateAccountData(brokerId, accountId, account);
      });
    }
    
    // Process positions
    if (data.positions && Array.isArray(data.positions)) {
      console.log('[WebSocketManager] Processing positions:', data.positions.length);
      data.positions.forEach(position => {
        // Get contract info for this position
        const contractInfo = position.contractId && contractSymbolMap.has(position.contractId) 
          ? { name: contractSymbolMap.get(position.contractId) }
          : null;
        
        // Transform position to frontend format
        const transformedPosition = this.transformTradovatePosition(position, contractInfo);
        
        console.log(`[WebSocketManager] Transformed position:`, {
          original: position,
          transformed: transformedPosition
        });
        
        this.updatePositionData(brokerId, accountId, transformedPosition);
      });
      
      // Emit a snapshot event for positions
      this.emit('positionUpdate', {
        brokerId,
        accountId,
        type: 'snapshot',
        positions: this.getPositions(brokerId, accountId)
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
   * Alias for sendMessage for backward compatibility
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} message - Message to send
   * @returns {Promise<boolean>} - Success status
   */
  send(brokerId, accountId, message) {
    console.log('[WebSocketManager] send() called (alias for sendMessage)');
    return this.sendMessage(brokerId, accountId, message);
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