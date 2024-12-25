class BaseWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectAttempts: 5,
      reconnectInterval: 1000,
      heartbeatInterval: 15000,
      connectionTimeout: 10000,
      ...options
    };

    // Connection state
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    this.lastHeartbeat = null;
    this.heartbeatTimer = null;
    this.connectionTimer = null;

    // Callback handlers
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
    this.onReconnect = null;
    this.onStatusChange = null;

    // Message queue for buffering during reconnection
    this.messageQueue = [];
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      return;
    }

    try {
      console.log(`Connecting to ${this.url}`);
      await new Promise((resolve, reject) => {
        this.ws = new WebSocket(this.url);
        
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.options.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      this.setupEventHandlers();
      await this.authenticate();
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(error);
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      clearTimeout(this.connectionTimer);
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
      if (this.onConnect) {
        this.onConnect();
      }
      
      if (this.onStatusChange) {
        this.onStatusChange('connected');
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.handleDisconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError(error);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      // Handle heartbeat messages
      if (message.type === 'heartbeat') {
        this.lastHeartbeat = Date.now();
        this.send({ type: 'heartbeat_response' });
        return;
      }

      // Process other messages
      if (this.onMessage) {
        this.onMessage(message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  handleDisconnect() {
    this.isConnected = false;
    this.stopHeartbeat();
    clearTimeout(this.connectionTimer);

    if (this.onDisconnect) {
      this.onDisconnect();
    }

    if (this.onStatusChange) {
      this.onStatusChange('disconnected');
    }

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  handleError(error) {
    console.error('WebSocket error:', error);
    if (this.onError) {
      this.onError(error);
    }

    if (this.onStatusChange) {
      this.onStatusChange('error');
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.reconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.shouldReconnect = false;
      return;
    }

    const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms, attempt ${this.reconnectAttempts + 1}`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.reconnectAttempts++;
        this.connect();
        
        if (this.onReconnect) {
          this.onReconnect(this.reconnectAttempts);
        }
      }
    }, delay);
  }

  send(data) {
    if (!this.isConnected) {
      console.log('Not connected, queueing message');
      this.messageQueue.push(data);
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      this.send(data);
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'heartbeat' });
        
        // Check if we've received a heartbeat recently
        const now = Date.now();
        if (this.lastHeartbeat && (now - this.lastHeartbeat > this.options.heartbeatInterval * 2)) {
          console.log('No heartbeat received, reconnecting');
          this.reconnect();
        }
      }
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  reconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.connect();
  }

  async disconnect() {
    console.log('Disconnecting WebSocket');
    this.shouldReconnect = false;
    this.stopHeartbeat();
    clearTimeout(this.connectionTimer);
    
    if (this.ws) {
      this.ws.close();
    }
  }

  // Methods to be implemented by specific broker classes
  async authenticate() {
    throw new Error('authenticate() must be implemented by broker-specific class');
  }

  subscribe(channel, params) {
    throw new Error('subscribe() must be implemented by broker-specific class');
  }

  unsubscribe(channel) {
    throw new Error('unsubscribe() must be implemented by broker-specific class');
  }
}

export default BaseWebSocket;