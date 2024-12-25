// services/websocket/brokers/tradovate/tradovateWebSocket.js
import BaseWebSocket from '../../baseWebSocket';
import { Subject } from 'rxjs';

class TradovateWebSocket extends BaseWebSocket {
  constructor(accountId) {
    super(process.env.REACT_APP_TRADOVATE_WS_URL, {
      reconnectAttempts: 5,
      heartbeatInterval: 15000,
      reconnectInterval: 1000
    });

    this.accountId = accountId;
    this.subscriptions = new Set();
    this.marketDataSubscriptions = new Map();
    this.positionCache = new Map();
    this.orderCache = new Map();
    this.messageSubject = new Subject();
  }

  // Core WebSocket Methods
  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      return;
    }

    try {
      await super.connect();
      this.authenticate();
      this.startHeartbeat();
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  authenticate() {
    const authMessage = {
      op: "authorize",
      data: {
        access_token: localStorage.getItem('access_token'),
        account_id: this.accountId
      }
    };
    this.send(authMessage);
  }

  // Market Data Subscriptions
  subscribeMarketData(symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    symbols.forEach(symbol => {
      if (!this.marketDataSubscriptions.has(symbol)) {
        const subscription = {
          op: "subscribe",
          args: ["md/subscribeQuote", { symbol }]
        };
        this.send(subscription);
        this.marketDataSubscriptions.set(symbol, Date.now());
      }
    });
  }

  unsubscribeMarketData(symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    symbols.forEach(symbol => {
      if (this.marketDataSubscriptions.has(symbol)) {
        const unsubscription = {
          op: "unsubscribe",
          args: ["md/unsubscribeQuote", { symbol }]
        };
        this.send(unsubscription);
        this.marketDataSubscriptions.delete(symbol);
      }
    });
  }

  // Account Updates Subscription
  subscribeAccountUpdates() {
    const subscription = {
      op: "subscribe",
      args: [
        "user/changes",
        {
          users: true,
          accounts: true,
          positions: true,
          orders: true,
          fills: true
        }
      ]
    };
    this.send(subscription);
    this.subscriptions.add('user/changes');
  }

  // Message Handling
  handleMessage(data) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      switch (message.e) {
        case 'heartbeat':
          this.handleHeartbeat(message);
          break;
        
        case 'position':
          this.handlePositionUpdate(message);
          break;
        
        case 'order':
          this.handleOrderUpdate(message);
          break;
        
        case 'fill':
          this.handleFillUpdate(message);
          break;
        
        case 'account':
          this.handleAccountUpdate(message);
          break;
          
        case 'md':
          this.handleMarketData(message);
          break;

        case 'error':
          this.handleError(message);
          break;

        default:
          console.log('Unhandled message type:', message.e);
      }

      this.messageSubject.next(message);
    } catch (error) {
      console.error('Error processing message:', error);
      this.handleError(error);
    }
  }

  // Specific Message Handlers
  handleHeartbeat(message) {
    this.lastHeartbeat = Date.now();
    this.send({ type: 'heartbeat_response' });
  }

  handlePositionUpdate(message) {
    const position = message.d;
    this.positionCache.set(position.contractId, position);
    
    if (this.onPositionUpdate) {
      this.onPositionUpdate(position);
    }
  }

  handleOrderUpdate(message) {
    const order = message.d;
    this.orderCache.set(order.orderId, order);
    
    if (this.onOrderUpdate) {
      this.onOrderUpdate(order);
    }
  }

  handleFillUpdate(message) {
    const fill = message.d;
    
    if (this.onFillUpdate) {
      this.onFillUpdate(fill);
    }
  }

  handleAccountUpdate(message) {
    const accountData = message.d;
    
    if (this.onAccountUpdate) {
      this.onAccountUpdate(accountData);
    }
  }

  handleMarketData(message) {
    const marketData = message.d;
    
    if (this.onMarketData) {
      this.onMarketData(marketData);
    }
  }

  handleError(error) {
    console.error('Tradovate WebSocket error:', error);
    
    if (this.onError) {
      this.onError(error);
    }

    if (error.type === 'auth_failed') {
      this.shouldReconnect = false;
      if (this.onAuthError) {
        this.onAuthError(error);
      }
    }
  }

  // Cleanup
  disconnect() {
    this.marketDataSubscriptions.clear();
    this.subscriptions.clear();
    this.positionCache.clear();
    this.orderCache.clear();
    this.messageSubject.complete();
    
    super.disconnect();
  }

  // Utility Methods
  isSubscribed(symbol) {
    return this.marketDataSubscriptions.has(symbol);
  }

  getPosition(contractId) {
    return this.positionCache.get(contractId);
  }

  getOrder(orderId) {
    return this.orderCache.get(orderId);
  }

  // Status Methods
  getSubscriptionStatus() {
    return {
      marketDataSubscriptions: Array.from(this.marketDataSubscriptions.keys()),
      accountUpdatesActive: this.subscriptions.has('user/changes')
    };
  }
}

export default TradovateWebSocket;