// src/services/websocket/webSocketManager.js

import { Subject } from 'rxjs';
import TradovateWebSocket from './brokers/tradovate/tradovateWebSocket';
import axiosInstance from '../axiosConfig';

export class WebSocketManager {
  constructor() {
    // Store active connections
    this.connections = new Map();
    
    // Message and status subjects for broadcasting
    this.messageSubject = new Subject();
    this.statusSubject = new Subject();
    
    // Connection tracking
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Base delay in ms
    
    // Heartbeat configuration
    this.heartbeatInterval = 15000; // 15 seconds
    this.heartbeatTimeouts = new Map();
    this.hasActiveAccounts = false;

    // Subscription tracking
    this.activeSubscriptions = new Set();
  }

  async checkActiveAccounts() {
    try {
      const response = await axiosInstance.get('/api/v1/brokers/accounts');
      const activeAccounts = response.data.filter(account => 
        account.active && account.status === 'active' && !account.is_token_expired
      );
      this.hasActiveAccounts = activeAccounts.length > 0;
      if (!this.hasActiveAccounts) {
        await this.disconnectAll();
      }
      return this.hasActiveAccounts;
    } catch (error) {
      console.error('Error checking active accounts:', error);
      this.hasActiveAccounts = false;
      return false;
    }
  }

  async getConnection(broker, accountId) {
    const hasActive = await this.checkActiveAccounts();
    if (!hasActive) {
      return null;
    }

    const connectionKey = `${broker}-${accountId}`;
    
    if (!this.connections.has(connectionKey)) {
      let connection;
      
      switch (broker) {
        case 'tradovate':
          connection = new TradovateWebSocket(accountId);
          break;
        default:
          throw new Error(`Unsupported broker: ${broker}`);
      }

      await this.setupConnection(connectionKey, connection);
      this.connections.set(connectionKey, connection);
    }

    return this.connections.get(connectionKey);
  }

  async setupConnection(connectionKey, connection) {
    if (!this.hasActiveAccounts) {
      return;
    }

    // Setup message handling
    connection.onMessage = (message) => {
      this.messageSubject.next({
        connectionKey,
        message
      });
    };

    // Setup status monitoring
    connection.onStatusChange = (status) => {
      this.statusSubject.next({
        connectionKey,
        status
      });

      if (status === 'disconnected') {
        this.handleDisconnect(connectionKey);
      }
    };

    // Connect the WebSocket
    await connection.connect();

    // Setup heartbeat monitoring
    await this.setupHeartbeat(connectionKey, connection);

    // Resubscribe to previous subscriptions
    for (const subscription of this.activeSubscriptions) {
      await this.subscribe(subscription);
    }
  }

  async handleDisconnect(connectionKey) {
    const hasActive = await this.checkActiveAccounts();
    if (!hasActive) {
      return;
    }

    const attempts = this.reconnectAttempts.get(connectionKey) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      
      setTimeout(async () => {
        console.log(`Attempting to reconnect ${connectionKey}, attempt ${attempts + 1}`);
        const connection = this.connections.get(connectionKey);
        
        if (connection) {
          try {
            await connection.connect();
            this.reconnectAttempts.set(connectionKey, attempts + 1);
          } catch (error) {
            console.error(`Reconnection attempt failed: ${error.message}`);
            this.handleDisconnect(connectionKey);
          }
        }
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${connectionKey}`);
      await this.removeConnection(connectionKey);
    }
  }

  async setupHeartbeat(connectionKey, connection) {
    if (!this.hasActiveAccounts) {
      return;
    }

    const heartbeatCheck = async () => {
      const hasActive = await this.checkActiveAccounts();
      if (!hasActive) {
        return;
      }

      if (connection.isConnected && !connection.lastHeartbeat) {
        console.warn(`No heartbeat received for ${connectionKey}, reconnecting...`);
        await connection.reconnect();
      }
    };

    const intervalId = setInterval(heartbeatCheck, this.heartbeatInterval);
    this.heartbeatTimeouts.set(connectionKey, intervalId);
  }

  async removeConnection(connectionKey) {
    const connection = this.connections.get(connectionKey);
    if (connection) {
      // Clear heartbeat interval
      const heartbeatInterval = this.heartbeatTimeouts.get(connectionKey);
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        this.heartbeatTimeouts.delete(connectionKey);
      }

      // Disconnect and cleanup
      await connection.disconnect();
      this.connections.delete(connectionKey);
      this.reconnectAttempts.delete(connectionKey);
      
      // Notify status change
      this.statusSubject.next({
        connectionKey,
        status: 'removed'
      });
    }
  }

  // New subscription methods
  async subscribe(channel, params = {}) {
    const subscription = { channel, params };
    this.activeSubscriptions.add(subscription);

    for (const connection of this.connections.values()) {
      if (connection.isConnected) {
        await connection.send({
          type: 'subscribe',
          channel,
          params
        });
      }
    }
  }

  async unsubscribe(channel) {
    this.activeSubscriptions = new Set(
      Array.from(this.activeSubscriptions).filter(sub => sub.channel !== channel)
    );

    for (const connection of this.connections.values()) {
      if (connection.isConnected) {
        await connection.send({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  // Position-specific methods
  async subscribeToPositions() {
    await this.subscribe('positions');
  }

  async unsubscribeFromPositions() {
    await this.unsubscribe('positions');
  }

  // Market data methods
  async subscribeToMarketData(symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }
    await this.subscribe('market_data', { symbols });
  }

  async unsubscribeFromMarketData(symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }
    await this.unsubscribe('market_data', { symbols });
  }

  // Message handling
  subscribeToMessages(callback) {
    return this.messageSubject.subscribe(callback);
  }

  subscribeToStatus(callback) {
    return this.statusSubject.subscribe(callback);
  }

  async sendMessage(broker, accountId, message) {
    const hasActive = await this.checkActiveAccounts();
    if (!hasActive) {
      return false;
    }

    const connection = await this.getConnection(broker, accountId);
    if (connection && connection.isConnected) {
      await connection.send(message);
      return true;
    }
    return false;
  }

  getConnectionStatus(broker, accountId) {
    const connectionKey = `${broker}-${accountId}`;
    const connection = this.connections.get(connectionKey);
    return connection ? connection.status : 'disconnected';
  }

  getActiveConnections() {
    const activeConnections = [];
    for (const [key, connection] of this.connections.entries()) {
      if (connection.isConnected) {
        const [broker, accountId] = key.split('-');
        activeConnections.push({ broker, accountId, status: connection.status });
      }
    }
    return activeConnections;
  }

  async disconnectAll() {
    const promises = Array.from(this.connections.keys()).map(key =>
      this.removeConnection(key)
    );
    await Promise.all(promises);
  }

  startAccountCheck() {
    setInterval(async () => {
      await this.checkActiveAccounts();
    }, 30000); // Check every 30 seconds
  }
}

// Create and export the singleton instance
export const webSocketManagerInstance = new WebSocketManager();
webSocketManagerInstance.startAccountCheck();

// Export both the class and instance
export default WebSocketManager;