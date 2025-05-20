// src/services/websocket-proxy/hooks/useWebSocketMarketData.js

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import webSocketManager from '../WebSocketManager';
import logger from '@/utils/logger';

/**
 * Hook for accessing market data from WebSocket
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @param {string|string[]} symbols - Symbol or array of symbols to subscribe to
 * @returns {Object} - Market data and methods
 */
const useWebSocketMarketData = (brokerId, accountId, symbols = []) => {
  const { isConnected } = useWebSocketContext();
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  
  // Normalize symbols input to array
  const symbolsArray = Array.isArray(symbols) ? symbols : [symbols].filter(Boolean);
  
  // Subscribe to market data for symbols
  useEffect(() => {
    if (!brokerId || !accountId || symbolsArray.length === 0) {
      setMarketData({});
      setLoading(false);
      return;
    }
    
    // Load initial data from cache
    const initialData = {};
    symbolsArray.forEach(symbol => {
      const data = webSocketManager.getMarketData(symbol);
      if (data) {
        initialData[symbol] = data;
      }
    });
    
    setMarketData(initialData);
    setLoading(false);
    
    // Subscribe to market data updates
    const handleMarketDataUpdate = (update) => {
      if (update.symbol && symbolsArray.includes(update.symbol)) {
        setMarketData(prev => ({
          ...prev,
          [update.symbol]: update
        }));
      }
    };
    
    webSocketManager.on('marketDataUpdate', handleMarketDataUpdate);
    
    // Subscribe to symbols if connected
    const subscribeToSymbols = async () => {
      if (isConnected(brokerId, accountId)) {
        const newSubscriptions = [];
        
        for (const symbol of symbolsArray) {
          try {
            const message = {
              type: 'subscribe',
              symbol,
              subscriptionType: 'quote'
            };
            
            const sent = webSocketManager.send(brokerId, accountId, message);
            
            if (sent) {
              newSubscriptions.push(symbol);
              logger.info(`Subscribed to ${symbol}`);
            }
          } catch (err) {
            logger.error(`Failed to subscribe to ${symbol}:`, err);
          }
        }
        
        setSubscriptions(newSubscriptions);
      }
    };
    
    subscribeToSymbols();
    
    // Clean up
    return () => {
      webSocketManager.removeListener('marketDataUpdate', handleMarketDataUpdate);
      
      // Unsubscribe from symbols
      const unsubscribeFromSymbols = async () => {
        if (isConnected(brokerId, accountId)) {
          for (const symbol of subscriptions) {
            try {
              const message = {
                type: 'unsubscribe',
                symbol,
                subscriptionType: 'quote'
              };
              
              webSocketManager.send(brokerId, accountId, message);
              logger.info(`Unsubscribed from ${symbol}`);
            } catch (err) {
              logger.error(`Failed to unsubscribe from ${symbol}:`, err);
            }
          }
        }
      };
      
      unsubscribeFromSymbols();
    };
  }, [brokerId, accountId, symbolsArray, isConnected]);
  
  /**
   * Manually subscribe to a symbol
   * @param {string} symbol - Symbol to subscribe to
   * @param {string} [subscriptionType='quote'] - Subscription type
   * @returns {Promise<boolean>} - Success status
   */
  const subscribeToSymbol = useCallback(async (symbol, subscriptionType = 'quote') => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return false;
    }
    
    if (!isConnected(brokerId, accountId)) {
      setError('WebSocket is not connected');
      return false;
    }
    
    try {
      const message = {
        type: 'subscribe',
        symbol,
        subscriptionType
      };
      
      const sent = webSocketManager.send(brokerId, accountId, message);
      
      if (sent) {
        setSubscriptions(prev => {
          if (!prev.includes(symbol)) {
            return [...prev, symbol];
          }
          return prev;
        });
        
        logger.info(`Subscribed to ${symbol}`);
        return true;
      }
      
      return false;
    } catch (err) {
      logger.error(`Failed to subscribe to ${symbol}:`, err);
      setError(err.message);
      return false;
    }
  }, [brokerId, accountId, isConnected]);
  
  /**
   * Manually unsubscribe from a symbol
   * @param {string} symbol - Symbol to unsubscribe from
   * @param {string} [subscriptionType='quote'] - Subscription type
   * @returns {Promise<boolean>} - Success status
   */
  const unsubscribeFromSymbol = useCallback(async (symbol, subscriptionType = 'quote') => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return false;
    }
    
    if (!isConnected(brokerId, accountId)) {
      setError('WebSocket is not connected');
      return false;
    }
    
    try {
      const message = {
        type: 'unsubscribe',
        symbol,
        subscriptionType
      };
      
      const sent = webSocketManager.send(brokerId, accountId, message);
      
      if (sent) {
        setSubscriptions(prev => prev.filter(s => s !== symbol));
        logger.info(`Unsubscribed from ${symbol}`);
        return true;
      }
      
      return false;
    } catch (err) {
      logger.error(`Failed to unsubscribe from ${symbol}:`, err);
      setError(err.message);
      return false;
    }
  }, [brokerId, accountId, isConnected]);
  
  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Return data and methods
  return {
    marketData,
    loading,
    error,
    subscriptions,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    clearError,
    
    // Helper methods
    getDataForSymbol: useCallback((symbol) => {
      return marketData[symbol] || null;
    }, [marketData]),
    
    getAllSymbols: useCallback(() => {
      return Object.keys(marketData);
    }, [marketData])
  };
};

export default useWebSocketMarketData;