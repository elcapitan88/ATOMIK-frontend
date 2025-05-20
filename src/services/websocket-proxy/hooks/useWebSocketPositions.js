// src/services/websocket-proxy/hooks/useWebSocketPositions.js

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import webSocketManager from '../WebSocketManager';
import logger from '@/utils/logger';

/**
 * Hook for accessing position data from WebSocket
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @returns {Object} - Positions data and methods
 */
const useWebSocketPositions = (brokerId, accountId) => {
  const { isConnected } = useWebSocketContext();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPnl, setTotalPnl] = useState(0);
  
  // Get initial positions and subscribe to updates
  useEffect(() => {
    if (!brokerId || !accountId) {
      setPositions([]);
      setLoading(false);
      return;
    }
    
    // Load from cache first
    const cachedPositions = webSocketManager.getPositions(brokerId, accountId);
    setPositions(cachedPositions);
    
    // Calculate total PnL
    const pnl = cachedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    setTotalPnl(pnl);
    
    setLoading(false);
    
    // Subscribe to position updates
    const handlePositionUpdate = (update) => {
      if (update.brokerId === brokerId && update.accountId === accountId) {
        // Refresh the full position list
        const updatedPositions = webSocketManager.getPositions(brokerId, accountId);
        setPositions(updatedPositions);
        
        // Update total PnL
        const pnl = updatedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
        setTotalPnl(pnl);
      }
    };
    
    webSocketManager.on('positionUpdate', handlePositionUpdate);
    
    // Also subscribe to user data sync event
    const handleUserDataSync = (data) => {
      if (data.brokerId === brokerId && data.accountId === accountId) {
        // Refresh the full position list
        const updatedPositions = webSocketManager.getPositions(brokerId, accountId);
        setPositions(updatedPositions);
        
        // Update total PnL
        const pnl = updatedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
        setTotalPnl(pnl);
      }
    };
    
    webSocketManager.on('userDataSynced', handleUserDataSync);
    
    // Clean up
    return () => {
      webSocketManager.removeListener('positionUpdate', handlePositionUpdate);
      webSocketManager.removeListener('userDataSynced', handleUserDataSync);
    };
  }, [brokerId, accountId]);
  
  /**
   * Request position refresh from the server
   * @returns {Promise<boolean>} - Success status
   */
  const refreshPositions = useCallback(async () => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return false;
    }
    
    if (!isConnected(brokerId, accountId)) {
      setError('WebSocket is not connected');
      return false;
    }
    
    try {
      // Send refresh request
      const message = {
        type: 'get_positions'
      };
      
      const sent = webSocketManager.send(brokerId, accountId, message);
      return sent;
    } catch (err) {
      logger.error('Position refresh error:', err);
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
    positions,
    loading,
    error,
    totalPnl,
    refreshPositions,
    clearError,
    
    // Helper methods
    getPositionBySymbol: useCallback((symbol) => {
      return positions.find(position => position.symbol === symbol);
    }, [positions]),
    
    getPositionById: useCallback((contractId) => {
      return positions.find(position => position.contractId === contractId);
    }, [positions]),
    
    hasOpenPositions: useCallback(() => {
      return positions.some(position => position.netPos !== 0);
    }, [positions])
  };
};

export default useWebSocketPositions;