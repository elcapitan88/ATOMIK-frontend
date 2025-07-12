// services/api/brokers/binance/binanceApi.js
import BaseApi from '../baseApi';
import axiosInstance from '@/services/axiosConfig';
import { 
  BinanceEnvironment, 
  BinanceMarketType,
  BinanceErrorCodes 
} from './binanceTypes';

class BinanceApi extends BaseApi {
  constructor() {
    super('binance');
  }

  // Override base methods for Binance-specific implementation
  async fetchAccounts() {
    try {
      console.log('BinanceApi: Initiating account fetch');
      const response = await axiosInstance.get('/api/v1/brokers/accounts');
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      console.log('BinanceApi: Raw response:', response);

      // Filter for Binance accounts only
      const accounts = Array.isArray(response.data) ? response.data : [];
      const binanceAccounts = accounts.filter(acc => 
        acc.broker_id === 'binance' || acc.broker_id === 'binanceus'
      );
      
      // Transform the response data for Binance
      const processedAccounts = binanceAccounts.map(acc => ({
        account_id: acc.account_id,
        broker_id: acc.broker_id,
        name: acc.name || 'Binance Account',
        nickname: acc.nickname,
        environment: acc.environment || 'live',
        status: acc.status || 'inactive',
        balance: parseFloat(acc.balance || 0).toFixed(2),
        active: Boolean(acc.active),
        is_token_expired: Boolean(acc.is_token_expired),
        last_connected: acc.last_connected || null,
        error_message: acc.error_message || null,
        has_credentials: Boolean(acc.has_credentials),
        token_expires_at: acc.token_expires_at || null,
        market_type: acc.market_type || BinanceMarketType.SPOT
      }));

      console.log('BinanceApi: Processed Binance accounts:', processedAccounts);
      return processedAccounts;

    } catch (error) {
      console.error('BinanceApi: Error fetching accounts:', error);
      throw error?.response?.data?.detail || 'Failed to fetch Binance accounts';
    }
  }

  async getAccountPositions(accountId) {
    this.validateAccountId(accountId);
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/positions/${accountId}/`)
    );
  }

  async getAccountOrders(accountId) {
    this.validateAccountId(accountId);
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/orders/${accountId}/`)
    );
  }

  async getAccountStatus(accountId) {
    try {
      this.validateAccountId(accountId);
      const response = await axiosInstance.get(
        `/api/v1/brokers/accounts/${accountId}/status`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting Binance account status:', error);
      throw error?.response?.data?.detail || 'Failed to get account status';
    }
  }

  async removeAccount(accountId) {
    try {
      this.validateAccountId(accountId);
      const response = await axiosInstance.delete(
        `/api/v1/brokers/accounts/${accountId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing Binance account:', error);
      throw error?.response?.data?.detail || 'Failed to remove account';
    }
  }

  // API Key methods (Binance uses API keys instead of OAuth)
  async saveApiKey(apiKey, marketType = BinanceMarketType.SPOT) {
    try {
      if (!apiKey || !apiKey.trim()) {
        throw new Error('API key is required');
      }

      // Validate API key format (should contain both key and secret)
      if (!apiKey.includes(':')) {
        throw new Error('API key must be in format: key:secret');
      }

      const response = await axiosInstance.post('/api/v1/brokers/binance/api-key', {
        apiKey: apiKey.trim(),
        marketType
      });

      return response.data;
    } catch (error) {
      console.error('Error saving Binance API key:', error);
      this.handleBinanceError(error);
    }
  }

  async testApiKey(apiKey, marketType = BinanceMarketType.SPOT) {
    try {
      if (!apiKey || !apiKey.trim()) {
        throw new Error('API key is required for testing');
      }

      if (!apiKey.includes(':')) {
        throw new Error('API key must be in format: key:secret');
      }

      const response = await axiosInstance.post('/api/v1/brokers/binance/test-api-key', {
        apiKey: apiKey.trim(),
        marketType
      });

      return response.data;
    } catch (error) {
      console.error('Error testing Binance API key:', error);
      this.handleBinanceError(error);
    }
  }

  // Binance-specific methods
  async getAccountInfo(accountId) {
    this.validateAccountId(accountId);
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/account/${accountId}/info`)
    );
  }

  async getExchangeInfo(accountId) {
    this.validateAccountId(accountId);
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/exchange-info/${accountId}`)
    );
  }

  async getBalance(accountId, asset = null) {
    this.validateAccountId(accountId);
    const params = asset ? { asset } : {};
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/balance/${accountId}`, { params })
    );
  }

  async getSymbols(accountId, marketType = BinanceMarketType.SPOT) {
    this.validateAccountId(accountId);
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/symbols/${accountId}`, {
        params: { marketType }
      })
    );
  }

  async placeOrder(accountId, orderData) {
    this.validateAccountId(accountId);
    
    if (!orderData || !orderData.symbol || !orderData.side || !orderData.type) {
      throw new Error('Missing required order parameters');
    }

    return this.errorHandler(() => 
      axiosInstance.post(`/api/v1/brokers/binance/order/${accountId}`, orderData)
    );
  }

  async cancelOrder(accountId, symbol, orderId) {
    this.validateAccountId(accountId);
    
    if (!symbol || !orderId) {
      throw new Error('Symbol and order ID are required to cancel order');
    }

    return this.errorHandler(() => 
      axiosInstance.delete(`/api/v1/brokers/binance/order/${accountId}`, {
        data: { symbol, orderId }
      })
    );
  }

  async getOrderHistory(accountId, symbol = null, limit = 100) {
    this.validateAccountId(accountId);
    const params = { limit };
    if (symbol) params.symbol = symbol;

    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/order-history/${accountId}`, { params })
    );
  }

  async getMarketData(symbol, marketType = BinanceMarketType.SPOT) {
    if (!symbol) {
      throw new Error('Symbol is required for market data');
    }

    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/market-data/${symbol}`, {
        params: { marketType }
      })
    );
  }

  // Futures-specific methods
  async getFuturesPositions(accountId) {
    this.validateAccountId(accountId);
    return this.errorHandler(() => 
      axiosInstance.get(`/api/v1/brokers/binance/futures/positions/${accountId}`)
    );
  }

  async changeLeverage(accountId, symbol, leverage) {
    this.validateAccountId(accountId);
    
    if (!symbol || !leverage) {
      throw new Error('Symbol and leverage are required');
    }

    return this.errorHandler(() => 
      axiosInstance.post(`/api/v1/brokers/binance/futures/leverage/${accountId}`, {
        symbol,
        leverage
      })
    );
  }

  // Error handling specific to Binance
  handleBinanceError(error) {
    if (error.response?.data?.code) {
      const binanceCode = error.response.data.code;
      
      switch (binanceCode) {
        case BinanceErrorCodes.INVALID_API_KEY:
          throw new Error('Invalid API key provided');
        case BinanceErrorCodes.INVALID_SIGNATURE:
          throw new Error('Invalid API signature - check your secret key');
        case BinanceErrorCodes.TIMESTAMP_OUT_OF_RECV_WINDOW:
          throw new Error('Request timestamp is outside the receive window');
        case BinanceErrorCodes.API_KEY_FORMAT_INVALID:
          throw new Error('API key format is invalid');
        case BinanceErrorCodes.TOO_MANY_REQUESTS:
          throw new Error('Too many requests - rate limit exceeded');
        case BinanceErrorCodes.INSUFFICIENT_BALANCE:
          throw new Error('Insufficient balance for this operation');
        default:
          throw new Error(error.response.data.msg || 'Unknown Binance error');
      }
    }

    throw error?.response?.data?.detail || error.message || 'Unknown error occurred';
  }

  // Override rate limiting for Binance-specific limits
  async withBinanceRateLimit(apiCall, weight = 1) {
    // Binance has different rate limits, implement custom logic if needed
    return this.withRateLimit(apiCall, 3, 1000);
  }

  // Health check specific to Binance
  async checkHealth() {
    return this.errorHandler(() => 
      axiosInstance.get('/api/v1/brokers/binance/health/')
    );
  }
}

// Create and export singleton instances for both Binance Global and Binance US
const binanceApi = new BinanceApi();

// Also create a Binance US specific instance
class BinanceUSApi extends BinanceApi {
  constructor() {
    super();
    this.brokerConfig = this.getBrokerById('binanceus');
    this.brokerName = 'binanceus';
    this.baseUrl = '/api/binanceus';
  }
}

const binanceUSApi = new BinanceUSApi();

export { binanceApi, binanceUSApi };
export default binanceApi;