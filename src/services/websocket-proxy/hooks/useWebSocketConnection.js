// src/services/websocket-proxy/hooks/useWebSocketConnection.js

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { ConnectionState } from '../WebSocketManager';
import logger from '@/utils/logger';

/**
 * Hook for managing a WebSocket connection to a broker account
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @param {Object} options - Connection options
 * @returns {Object} - Connection state and methods
 */
export const useWebSocketConnection = (brokerId, accountId, options = {}) => {
  const {
    autoConnect = false,
    autoDisconnect = true
  } = options;
  
  const {
    connect: contextConnect,
    disconnect: contextDisconnect,
    getConnectionState,
    isConnected,
    sendMessage: contextSendMessage,
    error: contextError
  } = useWebSocketContext();
  
  // Local state for this connection
  const [connectionState, setConnectionState] = useState(
    getConnectionState(brokerId, accountId)
  );
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  
  // Watch for connection state changes
  useEffect(() => {
    const checkConnectionState = () => {
      const state = getConnectionState(brokerId, accountId);
      setConnectionState(state);
      
      // Also update error state
      if (state === ConnectionState.ERROR) {
        setError(contextError);
      } else if (state === ConnectionState.CONNECTED) {
        setError(null);
      }
      
      // Update connecting state
      setConnecting(state === ConnectionState.CONNECTING);
    };
    
    // Initial check
    checkConnectionState();
    
    // Set up polling interval to check connection state
    const interval = setInterval(checkConnectionState, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [brokerId, accountId, getConnectionState, contextError]);
  
  // Connect method
  const connect = useCallback(async () => {
    if (!brokerId || !accountId) {
      const error = 'Broker ID and Account ID are required';
      setError(error);
      return false;
    }
    
    try {
      setConnecting(true);
      logger.info(`Connecting to ${brokerId}:${accountId}`);
      
      const result = await contextConnect(brokerId, accountId);
      return result;
    } catch (err) {
      logger.error(`Failed to connect to ${brokerId}:${accountId}:`, err);
      setError(err.message);
      return false;
    } finally {
      setConnecting(false);
    }
  }, [brokerId, accountId, contextConnect]);
  
  // Disconnect method
  const disconnect = useCallback(() => {
    if (!brokerId || !accountId) return;
    
    logger.info(`Disconnecting from ${brokerId}:${accountId}`);
    contextDisconnect(brokerId, accountId);
  }, [brokerId, accountId, contextDisconnect]);
  
  // Send message method
  const sendMessage = useCallback((message) => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return false;
    }
    
    return contextSendMessage(brokerId, accountId, message);
  }, [brokerId, accountId, contextSendMessage]);
  
  // Clear error method
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Auto-connect on mount if specified
  useEffect(() => {
    if (autoConnect && brokerId && accountId) {
      connect();
    }
    
    // Auto-disconnect on unmount if specified
    return () => {
      if (autoDisconnect && brokerId && accountId) {
        contextDisconnect(brokerId, accountId);
      }
    };
  }, [autoConnect, autoDisconnect, brokerId, accountId, connect, contextDisconnect]);
  
  // Return state and methods
  return {
    connectionState,
    error,
    connecting,
    isConnected: connectionState === ConnectionState.CONNECTED,
    connect,
    disconnect,
    sendMessage,
    clearError
  };
};

export default useWebSocketConnection;