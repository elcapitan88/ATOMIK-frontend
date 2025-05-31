// src/services/websocket-proxy/WebSocketClient.js

import { EventEmitter } from 'events';
import logger from '@/utils/logger';

/**
 * WebSocketClient - Simplified WebSocket client that follows server state
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
    
    // Connection state
    this.socket = null;
    this.state = 'disconnected';
    this.manualClose = false;
    this.reconnectAttempts = 0;
    
    // Session management
    this.sessionId = null;
    this.lastPingTime = null;
    this.lastPongTime = null;
    this.pingTimer = null;
    this.pongTimeoutTimer = null;
    
    // Timers
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    
    // Message queue for messages sent before connection is ready
    this.messageQueue = [];
    this.maxQueueSize = 100;
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.sendJson = this.sendJson.bind(this);
    this.isConnected = this.isConnected.bind(this);
  }
  
  /**
   * Connect to WebSocket server
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        logger.debug('Already connected');
        return resolve();
      }
      
      try {
        // Check for existing session
        const savedSessionId = localStorage.getItem(`ws_session_${this.getBaseUrl()}`);
        let connectUrl = this.url;
        
        if (savedSessionId) {
          this.sessionId = savedSessionId;
          const separator = this.url.includes('?') ? '&' : '?';
          connectUrl = `${this.url}${separator}session_id=${savedSessionId}`;
          logger.info(`Reconnecting with session: ${savedSessionId}`);
        }
        
        logger.info(`Connecting to WebSocket: ${connectUrl}`);
        
        // Reset state
        this.manualClose = false;
        this.reconnectAttempts = 0;
        
        // Create WebSocket
        this.socket = new WebSocket(connectUrl);
        
        // Track if we've resolved the promise
        let resolved = false;
        let receivedTestMessage = false;
        
        // Set connection timeout
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.socket.close();
            reject(new Error('Connection timeout'));
          }
        }, 120000); // 120 second timeout - increased for slower connections
        
        this.socket.onopen = () => {
          logger.info('WebSocket opened, waiting for server initialization...');
          // Don't change state yet - wait for server messages
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Log all incoming messages for debugging
            logger.debug(`Received message type: ${data.type}`, data);
            
            // Handle different message types from the new server
            if (data.type === 'connection_test') {
              // Server is testing the connection
              receivedTestMessage = true;
              logger.info('Received connection test from server');
              // Send response back to server to maintain connection
              this.send({ type: 'connection_test_response', timestamp: Date.now() });
              // Don't close the connection!
              return;
            }
            
            if (data.type === 'connection_established') {
              // Initial connection acknowledgment
              logger.info(`Connection established with ID: ${data.connection_id}`);
              // Still wait for the full initialization
              return;
            }
            
            if (data.type === 'connecting_status' || data.type === 'initialization_progress') {
              // Progress updates during initialization
              logger.info(`Initialization progress: ${data.message || data.phase}`);
              return;
            }
            
            if (data.type === 'validation_progress') {
              // Validation progress updates
              logger.info(`Validation progress: ${data.status} - ${data.message || ''}`);
              return;
            }
            
            if (data.type === 'validation_complete') {
              // Validation complete
              logger.info('Validation complete, waiting for broker connection');
              return;
            }
            
            if (data.type === 'broker_connecting' || data.type === 'broker_connected') {
              // Broker connection status
              logger.info(`Broker connection status: ${data.status || data.type}`);
              return;
            }
            
            if (data.type === 'keep_alive') {
              // Keep-alive message during initialization
              logger.debug('Received keep-alive');
              return;
            }
            
            // Handle connection state messages from server
            if (data.type === 'connection_state') {
              this.state = data.state;
              logger.info(`Connection state: ${data.state} - ${data.message || ''}`);
              
              // Emit state change for UI updates
              this.emit('state_change', data);
              
              // Handle specific states
              if (data.state === 'ready') {
                // Connection is fully ready
                if (!resolved) {
                  resolved = true;
                  this.startHeartbeat();
                  this.processQueuedMessages();
                  this.emit('connected');
                  resolve();
                }
                // IMPORTANT: Clear the connection timeout when ready
                clearTimeout(timeout);
              } else if (data.state === 'error' && !resolved) {
                // Connection error
                resolved = true;
                clearTimeout(timeout);
                reject(new Error(data.error || 'Connection failed'));
              }
            }
            
            // Handle connection_ready message from server
            if (data.type === 'connection_ready') {
              this.state = 'ready';
              logger.info(`Connection ready: ${data.message || 'Ready for trading'}`);
              
              // Emit state change for UI updates
              this.emit('state_change', { state: 'ready', message: data.message });
              
              // Connection is fully ready
              if (!resolved) {
                resolved = true;
                this.startHeartbeat();
                this.processQueuedMessages();
                this.emit('connected');
                resolve();
              }
              // IMPORTANT: Clear the connection timeout when ready
              clearTimeout(timeout);
              
              return;
            }
            
            // Handle validation progress messages
            if (data.type === 'validation_progress') {
              logger.info(`Validation progress: ${data.status} - ${data.message}`);
              this.emit('validation_progress', data);
              return;
            }
            
            if (data.type === 'validation_complete') {
              logger.info('Validation complete, waiting for broker connection');
              return;
            }
            
            if (data.type === 'broker_connecting' || data.type === 'broker_connected') {
              logger.info(`Broker connection status: ${data.status || data.type}`);
              return;
            }
            
            // If we get a broker_connected or ready message without connection_state wrapper
            if ((data.type === 'broker_connected' || data.type === 'ready') && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              this.state = 'ready';
              this.startHeartbeat();
              this.startPingMonitoring();
              this.processQueuedMessages();
              this.emit('connected');
              resolve();
              return;
            }
            
            // Handle session info
            if (data.type === 'session_info' && data.session_id) {
              this.sessionId = data.session_id;
              localStorage.setItem(`ws_session_${this.getBaseUrl()}`, this.sessionId);
              logger.info(`Session ID stored: ${this.sessionId}`);
            }
            
            // Handle ping/pong
            if (data.type === 'ping') {
              if (this.options.debug) {
                logger.debug('Received ping from server', data);
              }
              this.send({ type: 'pong', timestamp: data.timestamp || Date.now() });
              return;
            }
            
            if (data.type === 'pong') {
              this.handlePongResponse(data);
              return;
            }
            
            // Emit all other messages for application handling
            console.log('[WebSocketClient] Emitting message:', data.type);
            
            // Extra debug for user_data messages
            if (data.type === 'user_data') {
              console.log('[WebSocketClient] DEBUGGING: user_data emission details:', {
                hasData: !!data.data,
                dataType: typeof data.data,
                dataKeys: data.data ? Object.keys(data.data) : null,
                messageStructure: JSON.stringify(data, null, 2)
              });
            }
            
            this.emit('message', data);
            if (data.type) {
              this.emit(data.type, data);
            }
            
          } catch (e) {
            logger.error('Error parsing message:', e);
          }
        };
        
        this.socket.onclose = (event) => {
          logger.info(`WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`);
          
          clearTimeout(timeout);
          this.stopHeartbeat();
          this.stopPingMonitoring();
          this.state = 'disconnected';
          
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.emit('state_change', { 
            state: 'disconnected', 
            message: event.reason || 'Connection closed' 
          });
          
          if (!resolved) {
            resolved = true;
            reject(new Error(`Connection closed: ${event.reason || 'Unknown reason'}`));
          }
          
          // Attempt reconnection if not manual close
          if (!this.manualClose && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          logger.error('WebSocket error:', error);
          
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error('WebSocket error'));
          }
        };
        
      } catch (error) {
        logger.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.manualClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || 
            this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close(1000, 'Client disconnect');
        }
      } catch (e) {
        logger.error('Error closing socket:', e);
      }
    }
    
    this.socket = null;
    this.state = 'disconnected';
  }
  
  /**
   * Send message to server
   */
  send(message) {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    
    console.log('[WebSocketClient] send() called:', { 
      message, 
      socketState: this.socket?.readyState,
      clientState: this.state,
      isOpen: this.socket?.readyState === WebSocket.OPEN
    });
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      if (this.state === 'ready') {
        // Connection is ready, send immediately
        console.log('[WebSocketClient] Sending message immediately');
        this.socket.send(data);
        return true;
      } else {
        // Connection not ready, queue the message
        console.log('[WebSocketClient] Queueing message until connection ready');
        logger.debug('Queueing message until connection ready');
        this.messageQueue.push(data);
        return true;
      }
    } else {
      console.log('[WebSocketClient] Cannot send - WebSocket not open');
      logger.warn('Cannot send message: WebSocket not open');
      return false;
    }
  }
  
  /**
   * Send JSON message
   */
  sendJson(data) {
    return this.send(JSON.stringify(data));
  }
  
  /**
   * Get base URL without query parameters
   */
  getBaseUrl() {
    try {
      const url = new URL(this.url);
      return `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
      return this.url;
    }
  }
  
  /**
   * Start ping monitoring for connection health
   */
  startPingMonitoring() {
    this.stopPingMonitoring();
    
    // Send ping every 30 seconds to detect connection issues early
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      }
    }, 30000);
  }
  
  /**
   * Stop ping monitoring
   */
  stopPingMonitoring() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }
  
  /**
   * Send ping to server
   */
  sendPing() {
    const pingData = {
      type: 'ping',
      timestamp: new Date().toISOString(),
      sequence: Date.now()
    };
    
    this.lastPingTime = Date.now();
    this.sendJson(pingData);
    
    // Set timeout for pong response
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
    }
    
    this.pongTimeoutTimer = setTimeout(() => {
      logger.warn('Pong timeout - connection may be dead');
      this.emit('pong_timeout');
      // Force reconnection
      if (this.socket) {
        this.socket.close(4000, 'Pong timeout');
      }
    }, 60000); // 60 second timeout
  }
  
  /**
   * Handle pong response
   */
  handlePongResponse(data) {
    this.lastPongTime = Date.now();
    
    // Clear timeout
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
    
    // Calculate RTT
    if (this.lastPingTime) {
      const rtt = Date.now() - this.lastPingTime;
      logger.debug(`Pong received - RTT: ${rtt}ms`);
      this.emit('pong', { rtt, timestamp: data.timestamp });
    }
  }
  
  /**
   * Check if connected and ready
   */
  isConnected() {
    return this.socket && 
           this.socket.readyState === WebSocket.OPEN && 
           this.state === 'ready';
  }
  
  /**
   * Process queued messages
   */
  processQueuedMessages() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(message);
    }
  }
  
  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendJson({ type: 'ping', timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }
  
  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );
    
    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => {
        logger.error('Reconnection failed:', err);
      });
    }, delay);
  }
}

export default WebSocketClient;