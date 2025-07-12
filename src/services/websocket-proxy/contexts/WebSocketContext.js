// src/services/websocket-proxy/contexts/WebSocketContext.js

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import logger from '@/utils/logger';

// Import WebSocketManager with fallback support for different module formats
import * as WebSocketManagerModule from '../WebSocketManager';
const webSocketManager = WebSocketManagerModule.default || WebSocketManagerModule;
const ConnectionState = WebSocketManagerModule.ConnectionState;

// Create context
const WebSocketContext = createContext(null);

/**
 * WebSocketProvider component
 * Provides WebSocket functionality to the application
 */
export const WebSocketProvider = ({ children }) => {
  // Track connected broker accounts
  const [connections, setConnections] = useState(new Map());
  // Track any connection errors
  const [error, setError] = useState(null);
  // Track if any account is currently connecting
  const [isConnecting, setIsConnecting] = useState(false);
  // Track pending connections with promises
  const [pendingConnections, setPendingConnections] = useState(new Map());
  
  // Use refs to track current values for cleanup
  const connectionsRef = useRef(connections);
  const pendingConnectionsRef = useRef(pendingConnections);
  
  // Update refs when state changes
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);
  
  useEffect(() => {
    pendingConnectionsRef.current = pendingConnections;
  }, [pendingConnections]);
  
  // Setup event listeners on mount
  useEffect(() => {
    // Connection state change handler
    const handleConnectionState = (update) => {
      const { brokerId, accountId, state, error: connectionError, message } = update;
      const connectionId = `${brokerId}:${accountId}`;
      
      console.log('[WebSocketContext] Connection state update:', { connectionId, state, message, error: connectionError });
      
      // Update connections map with enhanced state information
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(connectionId, { 
          brokerId, 
          accountId, 
          state, 
          message,
          timestamp: Date.now() 
        });
        return newConnections;
      });
      
      // Handle connection states
      switch (state) {
        case ConnectionState.CONNECTED:
        case ConnectionState.READY:
          setError(null);
          setIsConnecting(false);
          // Resolve pending connection promise if it exists
          if (pendingConnections.has(connectionId)) {
            const { resolve, timeoutId } = pendingConnections.get(connectionId);
            if (resolve) resolve(true);
            
            // Clear timeout
            if (timeoutId) clearTimeout(timeoutId);
            
            // Remove from pending connections
            setPendingConnections(prev => {
              const newPending = new Map(prev);
              newPending.delete(connectionId);
              return newPending;
            });
          }
          logger.info(`Connected to ${brokerId}:${accountId} - State: ${state}`);
          break;
          
        case ConnectionState.CONNECTING:
        case ConnectionState.VALIDATING_USER:
        case ConnectionState.CHECKING_SUBSCRIPTION:
        case ConnectionState.CHECKING_BROKER_ACCESS:
        case ConnectionState.CONNECTING_TO_BROKER:
          setIsConnecting(true);
          logger.info(`Connection progress for ${brokerId}:${accountId} - State: ${state}`);
          break;
          
        case ConnectionState.ERROR:
          setError(connectionError || 'Connection error occurred');
          setIsConnecting(false);
          
          // Reject pending connection promise if it exists
          if (pendingConnections.has(connectionId)) {
            const { reject, timeoutId } = pendingConnections.get(connectionId);
            if (reject) reject(new Error(connectionError || 'Connection error'));
            
            // Clear timeout
            if (timeoutId) clearTimeout(timeoutId);
            
            // Remove from pending connections
            setPendingConnections(prev => {
              const newPending = new Map(prev);
              newPending.delete(connectionId);
              return newPending;
            });
          }
          
          logger.error(`Connection error for ${brokerId}:${accountId}: ${connectionError}`);
          break;
          
        case ConnectionState.DISCONNECTED:
          setIsConnecting(false);
          
          // Reject pending connection promise if it exists
          if (pendingConnections.has(connectionId)) {
            const { reject, timeoutId } = pendingConnections.get(connectionId);
            if (reject) reject(new Error('Connection was disconnected'));
            
            // Clear timeout
            if (timeoutId) clearTimeout(timeoutId);
            
            // Remove from pending connections
            setPendingConnections(prev => {
              const newPending = new Map(prev);
              newPending.delete(connectionId);
              return newPending;
            });
          }
          break;
          
        default:
          logger.debug(`Unhandled connection state: ${state}`);
      }
    };
    
    // Add event listeners
    webSocketManager.on('connectionState', handleConnectionState);
    
    // Remove event listeners on cleanup
    return () => {
      webSocketManager.removeListener('connectionState', handleConnectionState);
    };
  }, [pendingConnections]);
  
  // Handle clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts
      pendingConnectionsRef.current.forEach(({ timeoutId }) => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      
      // Close all active connections manually
      Array.from(connectionsRef.current.entries()).forEach(([connectionId, conn]) => {
        if (connectionId.includes(':')) {
          const [brokerId, accountId] = connectionId.split(':');
          if (brokerId && accountId) {
            try {
              // Use individual disconnect method which should be more reliable
              webSocketManager.disconnect(brokerId, accountId);
            } catch (err) {
              console.error(`Error disconnecting ${connectionId}:`, err);
            }
          }
        }
      });
    };
  }, []); // Empty dependency array - only run cleanup on unmount
  
  /**
   * Connect to a broker account with improved connection handling
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Promise} - Connection promise
   */
  const connect = useCallback(async (brokerId, accountId) => {
    try {
        setIsConnecting(true);
        setError(null);
        
        const connectionId = `${brokerId}:${accountId}`;
        
        // Check if already connected or ready
        if (connections.has(connectionId)) {
            const currentState = connections.get(connectionId).state;
            if (currentState === ConnectionState.CONNECTED || currentState === ConnectionState.READY) {
                logger.info(`Already connected to ${brokerId}:${accountId}`);
                setIsConnecting(false);
                return true;
            }
        }
        
        // Check if already connecting
        if (pendingConnections.has(connectionId)) {
            logger.info(`Connection to ${brokerId}:${accountId} already in progress`);
            return pendingConnections.get(connectionId).promise;
        }
        
        // Create a new promise that will be resolved/rejected when the connection completes
        let resolvePromise, rejectPromise;
        const connectionPromise = new Promise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
        });
        
        // Set a longer timeout to allow for the full initialization sequence
        const timeoutId = setTimeout(() => {
            logger.error(`Connection timeout for ${connectionId} after 60 seconds`);
            rejectPromise(new Error('Connection timeout'));
            
            // Remove from pending connections
            setPendingConnections(prev => {
                const newPending = new Map(prev);
                newPending.delete(connectionId);
                return newPending;
            });
            
            setIsConnecting(false);
        }, 60000); // Increased from 30s to 60s to allow for full initialization
        
        // Store the connection promise info
        setPendingConnections(prev => {
            const newPending = new Map(prev);
            newPending.set(connectionId, { 
                promise: connectionPromise, 
                resolve: resolvePromise, 
                reject: rejectPromise,
                timeoutId,
                startTime: Date.now()
            });
            return newPending;
        });
        
        // Start the connection process
        console.log(`[WebSocketContext] Attempting to connect: broker=${brokerId}, account=${accountId}`);
        const tokenLength = localStorage.getItem('access_token')?.length || 0;
        console.log(`[WebSocketContext] Access token length: ${tokenLength}`);
        logger.info(`Connecting to ${brokerId}:${accountId}`);
        
        // IMPORTANT: Don't await the connect call - let it run asynchronously
        // The connection will be managed through event handlers
        webSocketManager.connect(brokerId, accountId).catch(error => {
            // Only log the error, don't reject here - let the event handlers manage the promise
            logger.error(`WebSocketManager.connect error for ${connectionId}:`, error);
        });
        
        // Return the promise that will be resolved by the event handlers
        return connectionPromise;
    } catch (err) {
        setError(err.message);
        setIsConnecting(false);
        logger.error(`Failed to connect to ${brokerId}:${accountId}:`, err);
        throw err;
    }
}, [connections, pendingConnections]);
  
  /**
   * Disconnect from a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   */
  const disconnect = useCallback((brokerId, accountId) => {
    const connectionId = `${brokerId}:${accountId}`;
    
    // Clean up any pending connection promise
    if (pendingConnections.has(connectionId)) {
      const { reject, timeoutId } = pendingConnections.get(connectionId);
      if (reject) reject(new Error('Connection was manually disconnected'));
      
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Remove from pending connections
      setPendingConnections(prev => {
        const newPending = new Map(prev);
        newPending.delete(connectionId);
        return newPending;
      });
    }
    
    try {
      webSocketManager.disconnect(brokerId, accountId);
      
      // Update our local state right away
      setConnections(prev => {
        const newConnections = new Map(prev);
        if (newConnections.has(connectionId)) {
          const connInfo = newConnections.get(connectionId);
          newConnections.set(connectionId, {
            ...connInfo,
            state: ConnectionState.DISCONNECTED
          });
        }
        return newConnections;
      });
      
    } catch (err) {
      console.error(`Error in disconnect method for ${connectionId}:`, err);
    }
  }, [pendingConnections]);
  
  /**
   * Get connection state for a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {string} - Connection state
   */
  const getConnectionState = useCallback((brokerId, accountId) => {
    try {
      const connectionId = `${brokerId}:${accountId}`;
      const connectionInfo = connections.get(connectionId);
      
      // Return the actual connection state from our tracking
      if (connectionInfo) {
        return connectionInfo.state;
      }
      
      // Fallback to webSocketManager
      return webSocketManager.getConnectionState(brokerId, accountId);
    } catch (err) {
      console.error(`Error getting connection state for ${brokerId}:${accountId}:`, err);
      return ConnectionState.ERROR;
    }
  }, [connections]);
  
  /**
   * Check if connected to a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {boolean} - Connection status
   */
  const isConnected = useCallback((brokerId, accountId) => {
    try {
      const state = getConnectionState(brokerId, accountId);
      // Consider both CONNECTED and READY states as connected
      const connected = state === ConnectionState.CONNECTED || state === ConnectionState.READY;
      console.log('[WebSocketContext] isConnected check:', { brokerId, accountId, state, connected });
      return connected;
    } catch (err) {
      console.error(`Error checking connection status for ${brokerId}:${accountId}:`, err);
      return false;
    }
  }, [getConnectionState]);
  
  /**
   * Get connection info for display
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Object} - Connection info with state and message
   */
  const getConnectionInfo = useCallback((brokerId, accountId) => {
    const connectionId = `${brokerId}:${accountId}`;
    return connections.get(connectionId) || { state: ConnectionState.DISCONNECTED };
  }, [connections]);
  
  /**
   * Send a message to a broker account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @param {Object} message - Message to send
   * @returns {boolean} - Success status
   */
  const sendMessage = useCallback((brokerId, accountId, message) => {
    try {
      return webSocketManager.sendMessage(brokerId, accountId, message);
    } catch (err) {
      console.error(`Error sending message to ${brokerId}:${accountId}:`, err);
      return false;
    }
  }, []);
  
  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Get market data for a symbol
   * @param {string} symbol - Symbol
   * @returns {Object|null} - Market data
   */
  const getMarketData = useCallback((symbol) => {
    try {
      return webSocketManager.getMarketData(symbol);
    } catch (err) {
      console.error(`Error getting market data for ${symbol}:`, err);
      return null;
    }
  }, []);
  
  /**
   * Get account data
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Object|null} - Account data
   */
  const getAccountData = useCallback((brokerId, accountId) => {
    try {
      return webSocketManager.getAccountData(brokerId, accountId);
    } catch (err) {
      console.error(`Error getting account data for ${brokerId}:${accountId}:`, err);
      return null;
    }
  }, []);
  
  /**
   * Get positions for an account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Array} - Account positions
   */
  const getPositions = useCallback((brokerId, accountId) => {
    try {
      return webSocketManager.getPositions(brokerId, accountId) || [];
    } catch (err) {
      console.error(`Error getting positions for ${brokerId}:${accountId}:`, err);
      return [];
    }
  }, []);
  
  /**
   * Get orders for an account
   * @param {string} brokerId - Broker identifier
   * @param {string} accountId - Account identifier
   * @returns {Array} - Account orders
   */
  const getOrders = useCallback((brokerId, accountId) => {
    try {
      return webSocketManager.getOrders(brokerId, accountId) || [];
    } catch (err) {
      console.error(`Error getting orders for ${brokerId}:${accountId}:`, err);
      return [];
    }
  }, []);
  
  
  // Create context value with memoization
  const contextValue = useMemo(() => ({
    // Connection state
    connections: Array.from(connections.values()),
    error,
    isConnecting,
    
    // Connection methods
    connect,
    disconnect,
    getConnectionState,
    getConnectionInfo, // New method to get detailed connection info
    isConnected,
    sendMessage,
    clearError,
    
    // Data methods
    getMarketData,
    getAccountData,
    getPositions,
    getOrders,
    
    // Data accessors (for direct use)
    getAllMarketData: () => {
      try {
        return webSocketManager.getAllMarketData();
      } catch (err) {
        console.error("Error getting all market data:", err);
        return [];
      }
    },
    getAllAccountData: () => {
      try {
        return webSocketManager.getAllAccountData();
      } catch (err) {
        console.error("Error getting all account data:", err);
        return [];
      }
    },
    getAllPositions: () => {
      try {
        return webSocketManager.getAllPositions();
      } catch (err) {
        console.error("Error getting all positions:", err);
        return [];
      }
    },
    getAllOrders: () => {
      try {
        return webSocketManager.getAllOrders();
      } catch (err) {
        console.error("Error getting all orders:", err);
        return [];
      }
    }
  }), [
    connections, 
    error, 
    isConnecting, 
    connect, 
    disconnect, 
    getConnectionState,
    getConnectionInfo,
    isConnected,
    sendMessage,
    clearError,
    getMarketData,
    getAccountData,
    getPositions,
    getOrders,
  ]);
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context
 * @returns {Object} - WebSocket context
 */
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === null) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;