// services/websocket/brokers/tradovate/tradovateWebSocket.js

import BaseWebSocket from '../../baseWebSocket';
import { getWebSocketUrl } from '@/utils/config/wsConfig';
import logger from '@/utils/logger';
import { 
  TradovateEnvironment, 
  OrderType, 
  PositionSide 
} from '@/services/api/brokers/tradovate/tradovateTypes';

class TradovateWebSocket extends BaseWebSocket {
  constructor(accountId, environment = TradovateEnvironment.DEMO) {
    super(accountId, {
      reconnectAttempts: 5,
      reconnectInterval: 1000,
      heartbeatInterval: 15000,
      connectionTimeout: 10000,
      maxQueueSize: 1000
    });

    this.environment = environment;
    this.positionCache = new Map();
    this.orderCache = new Map();
    this.symbolData = new Map();
    
    // Tradovate-specific subscriptions
    this.subscriptions = {
      marketData: new Set(),
      userSync: false,
      positions: false,
      orders: false
    };

    // Event handlers
    this.onMarketData = null;
    this.onOrderUpdate = null;
    this.onPositionUpdate = null;
    this.onAccountUpdate = null;
    this.onFillUpdate = null;
  }

  getWebSocketUrl() {
    return getWebSocketUrl(this.accountId, 'tradovate', this.environment);
  }

  async initialize() {
    try {
      await this.connect();
      await this.authenticate();
      await this.subscribeToUserData();
      this.startHeartbeat();
      return true;
    } catch (error) {
      logger.error('Failed to initialize Tradovate WebSocket:', error);
      return false;
    }
  }

  async authenticate() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const authMessage = {
        type: 'authorize',
        token,
        timestamp: Date.now()
      };

      const response = await this.send(authMessage);
      
      if (response?.success) {
        logger.info('Successfully authenticated with Tradovate WebSocket');
        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      logger.error('Tradovate WebSocket authentication failed:', error);
      throw error;
    }
  }

  async subscribeToUserData() {
    if (this.subscriptions.userSync) return;

    try {
      const message = {
        type: 'subscribe',
        channels: ['user/changes'],
        params: {
          users: true,
          accounts: true,
          positions: true,
          orders: true,
          fills: true
        }
      };

      const response = await this.send(message);
      if (response?.success) {
        this.subscriptions.userSync = true;
        logger.info('Successfully subscribed to user data');
      }
    } catch (error) {
      logger.error('Failed to subscribe to user data:', error);
      throw error;
    }
  }

  async subscribeToMarketData(symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    const newSymbols = symbols.filter(symbol => !this.subscriptions.marketData.has(symbol));
    if (newSymbols.length === 0) return;

    try {
      const message = {
        type: 'subscribe',
        channels: ['md/subscribeQuote'],
        params: { symbols: newSymbols }
      };

      const response = await this.send(message);
      if (response?.success) {
        newSymbols.forEach(symbol => this.subscriptions.marketData.add(symbol));
        logger.info(`Successfully subscribed to market data for: ${newSymbols.join(', ')}`);
      }
    } catch (error) {
      logger.error('Failed to subscribe to market data:', error);
      throw error;
    }
  }

  async unsubscribeFromMarketData(symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    const subscribedSymbols = symbols.filter(symbol => this.subscriptions.marketData.has(symbol));
    if (subscribedSymbols.length === 0) return;

    try {
      const message = {
        type: 'unsubscribe',
        channels: ['md/unsubscribeQuote'],
        params: { symbols: subscribedSymbols }
      };

      const response = await this.send(message);
      if (response?.success) {
        subscribedSymbols.forEach(symbol => this.subscriptions.marketData.delete(symbol));
        logger.info(`Successfully unsubscribed from market data for: ${subscribedSymbols.join(', ')}`);
      }
    } catch (error) {
      logger.error('Failed to unsubscribe from market data:', error);
      throw error;
    }
  }

  async handleMessage(message) {
    this.lastHeartbeat = Date.now();

    try {
      switch (message.e) {
        case 'heartbeat':
          await this.handleHeartbeat(message);
          break;

        case 'position':
          await this.handlePositionUpdate(message.d);
          break;

        case 'order':
          await this.handleOrderUpdate(message.d);
          break;

        case 'fill':
          await this.handleFillUpdate(message.d);
          break;

        case 'account':
          await this.handleAccountUpdate(message.d);
          break;

        case 'md':
          await this.handleMarketData(message.d);
          break;

        case 'error':
          await this.handleError(new Error(message.d?.message || 'Unknown error'));
          break;

        default:
          logger.debug('Unhandled message type:', message.e);
      }

      if (this.onMessage) {
        this.onMessage(message);
      }

    } catch (error) {
      logger.error('Error processing message:', error);
      await this.handleError(error);
    }
  }

  async handlePositionUpdate(position) {
    try {
      this.positionCache.set(position.contractId, position);

      const normalizedPosition = {
        symbol: position.symbol,
        side: position.quantity > 0 ? PositionSide.LONG : PositionSide.SHORT,
        quantity: Math.abs(position.quantity),
        averagePrice: position.averagePrice,
        unrealizedPnL: position.unrealizedPnL,
        realizedPnL: position.realizedPnL,
        timestamp: Date.now()
      };

      if (this.onPositionUpdate) {
        this.onPositionUpdate(normalizedPosition);
      }
    } catch (error) {
      logger.error('Error handling position update:', error);
    }
  }

  async handleOrderUpdate(order) {
    try {
      this.orderCache.set(order.orderId, order);

      const normalizedOrder = {
        orderId: order.orderId,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        quantity: order.quantity,
        filledQuantity: order.filledQuantity,
        remainingQuantity: order.remainingQuantity,
        price: order.price,
        status: order.status,
        timestamp: Date.now()
      };

      if (this.onOrderUpdate) {
        this.onOrderUpdate(normalizedOrder);
      }
    } catch (error) {
      logger.error('Error handling order update:', error);
    }
  }

  async handleFillUpdate(fill) {
    try {
      const normalizedFill = {
        orderId: fill.orderId,
        symbol: fill.symbol,
        quantity: fill.quantity,
        price: fill.price,
        side: fill.side,
        timestamp: fill.timestamp
      };

      if (this.onFillUpdate) {
        this.onFillUpdate(normalizedFill);
      }
    } catch (error) {
      logger.error('Error handling fill update:', error);
    }
  }

  async handleAccountUpdate(accountData) {
    try {
      const normalizedAccount = {
        accountId: accountData.accountId,
        balance: accountData.balance,
        marginUsed: accountData.marginUsed,
        availableMargin: accountData.availableMargin,
        timestamp: Date.now()
      };

      if (this.onAccountUpdate) {
        this.onAccountUpdate(normalizedAccount);
      }
    } catch (error) {
      logger.error('Error handling account update:', error);
    }
  }

  async handleMarketData(marketData) {
    try {
      this.symbolData.set(marketData.symbol, marketData);

      const normalizedMarketData = {
        symbol: marketData.symbol,
        price: marketData.price,
        bid: marketData.bid,
        ask: marketData.ask,
        volume: marketData.volume,
        timestamp: Date.now()
      };

      if (this.onMarketData) {
        this.onMarketData(normalizedMarketData);
      }
    } catch (error) {
      logger.error('Error handling market data:', error);
    }
  }

  async resubscribeAll() {
    try {
      // Resubscribe to user data
      if (this.subscriptions.userSync) {
        await this.subscribeToUserData();
      }

      // Resubscribe to market data
      const symbols = Array.from(this.subscriptions.marketData);
      if (symbols.length > 0) {
        await this.subscribeToMarketData(symbols);
      }
    } catch (error) {
      logger.error('Error resubscribing to data:', error);
      throw error;
    }
  }

  getPosition(symbol) {
    return this.positionCache.get(symbol);
  }

  getOrder(orderId) {
    return this.orderCache.get(orderId);
  }

  getMarketData(symbol) {
    return this.symbolData.get(symbol);
  }

  async cleanup() {
    try {
      // Unsubscribe from all market data
      const symbols = Array.from(this.subscriptions.marketData);
      if (symbols.length > 0) {
        await this.unsubscribeFromMarketData(symbols);
      }

      // Clear caches
      this.positionCache.clear();
      this.orderCache.clear();
      this.symbolData.clear();

      // Reset subscriptions
      this.subscriptions.marketData.clear();
      this.subscriptions.userSync = false;
      this.subscriptions.positions = false;
      this.subscriptions.orders = false;

      // Call parent cleanup
      await super.cleanup();
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

export default TradovateWebSocket;