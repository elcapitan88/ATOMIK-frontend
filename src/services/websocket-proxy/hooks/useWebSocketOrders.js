// src/services/websocket-proxy/hooks/useWebSocketOrders.js

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import webSocketManager from '../WebSocketManager';
import logger from '@/utils/logger';

/**
 * Hook for accessing order data from WebSocket
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @returns {Object} - Orders data and methods
 */
const useWebSocketOrders = (brokerId, accountId) => {
  const { isConnected } = useWebSocketContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get initial orders
  useEffect(() => {
    if (!brokerId || !accountId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    
    // Load from cache first
    const cachedOrders = webSocketManager.getOrders(brokerId, accountId);
    setOrders(cachedOrders);
    setLoading(false);
    
    // Subscribe to order updates
    const handleOrderUpdate = (update) => {
      if (update.brokerId === brokerId && update.accountId === accountId) {
        // Refresh the full order list
        const updatedOrders = webSocketManager.getOrders(brokerId, accountId);
        setOrders(updatedOrders);
      }
    };
    
    webSocketManager.on('orderUpdate', handleOrderUpdate);
    
    // Also subscribe to user data sync event
    const handleUserDataSync = (data) => {
      if (data.brokerId === brokerId && data.accountId === accountId) {
        // Refresh the full order list
        const updatedOrders = webSocketManager.getOrders(brokerId, accountId);
        setOrders(updatedOrders);
      }
    };
    
    webSocketManager.on('userDataSynced', handleUserDataSync);
    
    // Clean up
    return () => {
      webSocketManager.removeListener('orderUpdate', handleOrderUpdate);
      webSocketManager.removeListener('userDataSynced', handleUserDataSync);
    };
  }, [brokerId, accountId]);
  
  /**
   * Place a new order
   * @param {Object} orderData - Order data
   * @returns {Promise} - Promise resolving to order result
   */
  const placeOrder = useCallback(async (orderData) => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return null;
    }
    
    if (!isConnected(brokerId, accountId)) {
      setError('WebSocket is not connected');
      return null;
    }
    
    try {
      // Create order message
      const message = {
        type: 'order',
        orderData: {
          ...orderData,
          timestamp: Date.now()
        }
      };
      
      // Send order message
      const sent = webSocketManager.send(brokerId, accountId, message);
      
      if (!sent) {
        throw new Error('Failed to send order message');
      }
      
      // Return a promise that will resolve when the order is confirmed
      // This is a simplified approach - you might want to implement a more robust solution
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          webSocketManager.removeListener('orderUpdate', handleOrderUpdate);
          reject(new Error('Order placement timeout'));
        }, 10000);
        
        const handleOrderUpdate = (update) => {
          if (
            update.brokerId === brokerId && 
            update.accountId === accountId &&
            update.clientOrderId === orderData.clientOrderId
          ) {
            clearTimeout(timeout);
            webSocketManager.removeListener('orderUpdate', handleOrderUpdate);
            resolve(update);
          }
        };
        
        webSocketManager.on('orderUpdate', handleOrderUpdate);
      });
    } catch (err) {
      logger.error('Order placement error:', err);
      setError(err.message);
      return null;
    }
  }, [brokerId, accountId, isConnected]);
  
  /**
   * Cancel an existing order
   * @param {string} orderId - Order identifier
   * @returns {Promise} - Promise resolving to cancel result
   */
  const cancelOrder = useCallback(async (orderId) => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return null;
    }
    
    if (!isConnected(brokerId, accountId)) {
      setError('WebSocket is not connected');
      return null;
    }
    
    try {
      // Create cancel message
      const message = {
        type: 'cancel_order',
        orderId
      };
      
      // Send cancel message
      const sent = webSocketManager.send(brokerId, accountId, message);
      
      if (!sent) {
        throw new Error('Failed to send cancel message');
      }
      
      // Return a promise that will resolve when the cancel is confirmed
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          webSocketManager.removeListener('orderUpdate', handleOrderUpdate);
          reject(new Error('Order cancellation timeout'));
        }, 10000);
        
        const handleOrderUpdate = (update) => {
          if (
            update.brokerId === brokerId && 
            update.accountId === accountId &&
            update.orderId === orderId &&
            ['canceled', 'cancelled', 'rejected'].includes(update.status?.toLowerCase())
          ) {
            clearTimeout(timeout);
            webSocketManager.removeListener('orderUpdate', handleOrderUpdate);
            resolve(update);
          }
        };
        
        webSocketManager.on('orderUpdate', handleOrderUpdate);
      });
    } catch (err) {
      logger.error('Order cancellation error:', err);
      setError(err.message);
      return null;
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
    orders,
    loading,
    error,
    placeOrder,
    cancelOrder,
    clearError,
    
    // Helper methods
    getOrderById: useCallback((orderId) => {
      return orders.find(order => order.orderId === orderId);
    }, [orders]),
    
    getOpenOrders: useCallback(() => {
      return orders.filter(order => 
        ['new', 'open', 'partially_filled'].includes(order.status?.toLowerCase())
      );
    }, [orders])
  };
};

export default useWebSocketOrders;