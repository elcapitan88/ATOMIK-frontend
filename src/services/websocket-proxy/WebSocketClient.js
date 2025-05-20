// src/services/websocket-proxy/WebSocketClient.js

import { EventEmitter } from 'events';
import logger from '@/utils/logger';

/**
 * WebSocketClient - Core WebSocket connection handler
 * Manages connection lifecycle, authentication, and message handling
 */
class WebSocketClient extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this.url = url;
    this.options = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 20000,
      debug: false,
      ...options
    };
    
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.lastMessageTime = 0;
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.startHeartbeat = this.startHeartbeat.bind(this);
    this.stopHeartbeat = this.stopHeartbeat.bind(this);
    this.reconnect = this.reconnect.bind(this);
  }
  
  /**
   * Connect to the WebSocket server
   * @param {string} token - JWT authentication token
   * @returns {Promise} - Resolves when connected, rejects on error
   */
  connect(token) {
    if (this.connected || this.connecting) {
        return Promise.resolve();
    }
    
    this.connecting = true;
    
    return new Promise((resolve, reject) => {
        try {
            // Build connection URL with authentication token
            const connectionUrl = token 
                ? `${this.url}?token=${encodeURIComponent(token)}` 
                : this.url;
                
            logger.info(`Connecting to WebSocket: ${this.url}`);
            
            // Close any existing socket first
            if (this.socket) {
                this.socket.onclose = null; // Prevent reconnection attempts
                this.socket.close();
                this.socket = null;
            }
            
            // Create new WebSocket with explicit binary type
            this.socket = new WebSocket(connectionUrl);
            this.socket.binaryType = 'arraybuffer'; // Ensure correct binary handling
            
            // Set up event handlers
            this.socket.onopen = (event) => {
                this.handleOpen(event);
                
                // IMPORTANT: Delay the resolve to give backend time to initialize
                // This is crucial - resolving too quickly leads to premature client usage
                setTimeout(() => {
                    resolve();
                }, 2000); // Give backend 2 seconds to initialize the connection
            };
            
            this.socket.onmessage = this.handleMessage;
            this.socket.onclose = this.handleClose;
            this.socket.onerror = (event) => {
                this.handleError(event);
                if (!this.connected) {
                    reject(new Error('Connection failed'));
                }
            };
            
            // Set longer connection timeout - much longer than before
            const connectionTimeout = setTimeout(() => {
                if (!this.connected && this.connecting) {
                    this.connecting = false;
                    logger.error('WebSocket connection timeout');
                    reject(new Error('Connection timeout'));
                    
                    // Don't close the socket - let the onclose handler handle it
                    // This avoids double-closing
                }
            }, 30000); // 30 second timeout to match our backend changes
            
            // Clear timeout when connected
            this.once('connected', () => {
                clearTimeout(connectionTimeout);
            });
            
        } catch (error) {
            this.connecting = false;
            logger.error('WebSocket connection error:', error);
            reject(error);
        }
    });
  }
  
  /**
   * Check if the client is connected
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  
  // The rest of the WebSocketClient class implementation...
  
  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    this.connected = true;
    this.connecting = false;
    this.reconnectAttempts = 0;
    
    logger.info('WebSocket connected');
    this.emit('connected');
    
    // Start heartbeat to keep connection alive
    this.startHeartbeat();
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    this.lastMessageTime = Date.now();
    
    try {
      // Handle ping/pong messages
      if (event.data === '{"type":"ping"}') {
        this.send('{"type":"pong"}');
        return;
      }
      
      // Log all incoming messages for debugging when in debug mode
      if (this.options.debug) {
        const preview = typeof event.data === 'string' 
          ? event.data.substring(0, 100) 
          : 'Binary data';
        logger.debug(`WebSocket received: ${preview}${preview.length > 100 ? '...' : ''}`);
      }
      
      // Process string messages
      if (typeof event.data === 'string') {
        try {
          // Parse and emit message
          const message = JSON.parse(event.data);
          
          // Specifically look for connection status messages
          if (message.type === 'connecting_status' || message.type === 'connection_established') {
            logger.info(`Received connection status: ${message.type} - ${message.message || 'No status message'}`);
          }
          
          this.emit('message', message);
          
          // Also emit specific message type events
          if (message.type) {
            this.emit(message.type, message);
          }
        } catch (error) {
          logger.error('Error parsing message:', error, event.data.substring(0, 100));
        }
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  }
}

export default WebSocketClient;