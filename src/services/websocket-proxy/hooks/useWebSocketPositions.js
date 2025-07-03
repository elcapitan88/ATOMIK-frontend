// src/services/websocket-proxy/hooks/useWebSocketPositions.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import webSocketManager, { ConnectionState } from '../WebSocketManager';
import logger from '@/utils/logger';
import { POSITION_MESSAGE_TYPES, POSITION_UPDATE_THROTTLE } from '../constants/positionEvents';
import { envConfig } from '../../../config/environment';

/**
 * Hook for accessing position data from WebSocket
 * @param {string} brokerId - Broker identifier
 * @param {string} accountId - Account identifier
 * @returns {Object} - Positions data and methods
 */
const useWebSocketPositions = (brokerId, accountId) => {
  const { isConnected, getConnectionState } = useWebSocketContext();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionHealth, setConnectionHealth] = useState({
    isHealthy: true,
    lastError: null,
    reconnectAttempts: 0,
    lastSuccessfulUpdate: null
  });
  
  // Market data health monitoring
  const [marketDataHealth, setMarketDataHealth] = useState({
    subscriptionsActive: 0,
    lastPriceUpdate: null,
    healthStatus: 'unknown'
  });
  
  // Use refs for efficient position management
  const positionsMapRef = useRef(new Map());
  const updateTimersRef = useRef(new Map());
  const previousPnLRef = useRef(new Map());
  const reconnectTimerRef = useRef(null);
  const healthCheckTimerRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const retryAttemptsRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  
  /**
   * Normalize position data to handle both old and new formats
   * @param {Object} position - Raw position data
   * @returns {Object} - Normalized position
   */
  const normalizePosition = useCallback((position) => {
    // Safety check
    if (!position) {
      console.error('[normalizePosition] Position is null or undefined');
      return null;
    }
    
    // Ensure we have some form of ID
    const positionId = position.positionId || (position.id ? String(position.id) : null);
    if (!positionId) {
      console.error('[normalizePosition] No valid position ID found:', position);
      return null;
    }
    
    return {
      // Use positionId or fall back to id
      positionId: positionId,
      
      // Account ID
      accountId: position.accountId,
      
      // Symbol - prefer symbol field, then check contractId
      symbol: position.symbol || position.contractId || 'Unknown',
      
      // Side - calculate from netPos if not provided
      side: position.side || (position.netPos > 0 ? 'LONG' : position.netPos < 0 ? 'SHORT' : 'FLAT'),
      
      // Quantity - use quantity or absolute value of netPos, ensure it's a number
      quantity: position.quantity !== undefined ? 
                Math.abs(Number(position.quantity)) : 
                Math.abs(Number(position.netPos || 0)),
      
      // Average price - use avgPrice or netPrice
      avgPrice: position.avgPrice || position.netPrice || 0,
      
      // Current price - will be updated with market data
      currentPrice: position.currentPrice || position.avgPrice || position.netPrice || 0,
      
      // P&L - default to 0, will be calculated with market prices
      unrealizedPnL: position.unrealizedPnL || position.pnl || 0,
      
      // Time entered - use timeEntered or timestamp
      timeEntered: position.timeEntered || position.timestamp,
      
      // Keep original fields for reference
      contractId: position.contractId,
      netPos: position.netPos,
      netPrice: position.netPrice,
      
      // Status fields
      lastUpdate: position.lastUpdate || Date.now(),
      isClosed: position.isClosed || false,
      isPriceUpdating: position.isPriceUpdating || false,
      isPnLUpdating: position.isPnLUpdating || false,
      isModified: position.isModified || false,
      
      // Keep original data for debugging
      _original: position._original || position
    };
  }, []);
  
  // Helper function to throttle updates
  const throttleUpdate = useCallback((positionId, updateFn, delay = POSITION_UPDATE_THROTTLE.PRICE_UPDATE) => {
    const timerId = `${positionId}_update`;
    
    // Clear existing timer
    if (updateTimersRef.current.has(timerId)) {
      clearTimeout(updateTimersRef.current.get(timerId));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      updateFn();
      updateTimersRef.current.delete(timerId);
    }, delay);
    
    updateTimersRef.current.set(timerId, timer);
  }, []);
  
  // Helper to update positions state from map
  const updatePositionsFromMap = useCallback(() => {
    const positionsArray = Array.from(positionsMapRef.current.values())
      .filter(pos => {
        // Filter out closed positions and positions with 0 quantity
        if (pos.isClosed) return false;
        
        // Check for zero quantity in multiple ways (different broker formats)
        const hasQuantity = pos.quantity > 0 || 
                           Math.abs(pos.netPos || 0) > 0 || 
                           (pos.side && pos.side !== 'FLAT');
        
        if (envConfig.debugConfig.websocket.positions) {
          console.log(`[updatePositionsFromMap] Position ${pos.positionId}: quantity=${pos.quantity}, netPos=${pos.netPos}, side=${pos.side}, hasQuantity=${hasQuantity}`);
        }
        
        return hasQuantity;
      })
      .sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0)); // Sort by last update
    
    if (envConfig.debugConfig.websocket.positions) {
      console.log(`[updatePositionsFromMap] Filtered positions: ${positionsArray.length} out of ${positionsMapRef.current.size} total`);
    }
    
    setPositions(positionsArray);
    
    // Calculate total PnL
    const totalPnL = positionsArray.reduce((sum, pos) => sum + (pos.unrealizedPnL || pos.pnl || 0), 0);
    setTotalPnl(totalPnL);
    
    // Update connection health
    setConnectionHealth(prev => ({
      ...prev,
      lastSuccessfulUpdate: Date.now(),
      isHealthy: true
    }));
  }, []);
  
  /**
   * Request position refresh from the server with retry logic
   * @param {boolean} isRetry - Whether this is a retry attempt
   * @returns {Promise<boolean>} - Success status
   */
  const refreshPositions = useCallback(async (isRetry = false) => {
    if (!brokerId || !accountId) {
      setError('Broker ID and Account ID are required');
      return false;
    }
    
    const connectionState = getConnectionState(brokerId, accountId);
    if (connectionState !== ConnectionState.READY) {
      setError(`WebSocket is not ready (current state: ${connectionState})`);
      return false;
    }
    
    try {
      // Send refresh request
      const message = {
        type: 'get_positions'
      };
      
      const sent = webSocketManager.send(brokerId, accountId, message);
      
      if (sent) {
        // Reset retry attempts on successful send
        retryAttemptsRef.current = 0;
        
        // Set timeout for response - if no response in 5 seconds, retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          const maxRetries = 3;
          if (retryAttemptsRef.current < maxRetries) {
            retryAttemptsRef.current++;
            const retryDelay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current - 1), 5000); // 1s, 2s, 4s max
            
            console.log(`[useWebSocketPositions] No response received, retrying in ${retryDelay}ms (attempt ${retryAttemptsRef.current}/${maxRetries})`);
            
            setTimeout(() => {
              refreshPositions(true);
            }, retryDelay);
          } else {
            setError('Failed to load positions after multiple attempts');
            setLoading(false);
            requestInFlightRef.current = false;
          }
        }, 5000);
      }
      
      return sent;
    } catch (err) {
      logger.error('Position refresh error:', err);
      setError(err.message);
      return false;
    }
  }, [brokerId, accountId, getConnectionState]);
  
  // Market data health check
  const checkMarketDataHealth = useCallback(() => {
    const now = Date.now();
    const lastUpdate = marketDataHealth.lastPriceUpdate;
    
    if (!lastUpdate) {
      setMarketDataHealth(prev => ({ ...prev, healthStatus: 'no_data' }));
    } else if (now - lastUpdate > 30000) {
      setMarketDataHealth(prev => ({ ...prev, healthStatus: 'stale' }));
    } else {
      setMarketDataHealth(prev => ({ ...prev, healthStatus: 'healthy' }));
    }
  }, [marketDataHealth.lastPriceUpdate]);

  // Connection health check
  const checkConnectionHealth = useCallback(() => {
    if (!connectionHealth.lastSuccessfulUpdate) return;
    
    const timeSinceLastUpdate = Date.now() - connectionHealth.lastSuccessfulUpdate;
    const isStale = timeSinceLastUpdate > 30000; // 30 seconds
    
    if (isStale && connectionHealth.isHealthy) {
      setConnectionHealth(prev => ({
        ...prev,
        isHealthy: false,
        lastError: 'No updates received for 30 seconds'
      }));
      
      // Attempt to refresh positions
      if (getConnectionState(brokerId, accountId) === ConnectionState.READY) {
        refreshPositions();
      }
    }
    
    // Also check market data health
    checkMarketDataHealth();
  }, [connectionHealth.lastSuccessfulUpdate, connectionHealth.isHealthy, brokerId, accountId, isConnected, refreshPositions, checkMarketDataHealth]);
  
  // Auto-reconnect logic
  const attemptReconnect = useCallback(async () => {
    if (!brokerId || !accountId) return;
    
    setConnectionHealth(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    try {
      const success = await refreshPositions();
      if (success) {
        setConnectionHealth({
          isHealthy: true,
          lastError: null,
          reconnectAttempts: 0,
          lastSuccessfulUpdate: Date.now()
        });
        setError(null);
      }
    } catch (err) {
      const maxAttempts = 5;
      if (connectionHealth.reconnectAttempts < maxAttempts) {
        // Schedule next attempt with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, connectionHealth.reconnectAttempts), 30000);
        reconnectTimerRef.current = setTimeout(attemptReconnect, delay);
      } else {
        setError(`Failed to reconnect after ${maxAttempts} attempts`);
      }
    }
  }, [brokerId, accountId, connectionHealth.reconnectAttempts, refreshPositions]);
  
  // Get initial positions and subscribe to updates
  useEffect(() => {
    if (envConfig.debugConfig.websocket.positions) {
      console.log('[useWebSocketPositions] useEffect triggered - brokerId:', brokerId, 'accountId:', accountId);
    }
    
    // Reset the request in flight flag when useEffect runs
    requestInFlightRef.current = false;
    
    if (!brokerId || !accountId) {
      if (envConfig.debugConfig.websocket.positions) {
        console.log('[useWebSocketPositions] Missing brokerId or accountId, setting empty positions');
      }
      setPositions([]);
      setLoading(false);
      return;
    }
    
    // Load from cache first
    const cachedPositions = webSocketManager.getPositions(brokerId, accountId);
    if (envConfig.debugConfig.websocket.positions) {
      console.log('[useWebSocketPositions] Cached positions:', cachedPositions);
    }
    
    // Initialize positions map with normalized data
    positionsMapRef.current.clear();
    cachedPositions.forEach(pos => {
      const normalizedPos = normalizePosition(pos);
      if (normalizedPos) {
        const key = normalizedPos.positionId;
        positionsMapRef.current.set(key, { ...normalizedPos, lastUpdate: Date.now() });
        previousPnLRef.current.set(key, normalizedPos.unrealizedPnL);
      }
    });
    
    updatePositionsFromMap();
    
    // Don't set loading to false yet if we have no cached positions
    // We'll set it to false after we get a response or timeout
    if (cachedPositions.length > 0) {
      if (envConfig.debugConfig.websocket.positions) {
        console.log('[useWebSocketPositions] Have cached positions, setting loading to false');
      }
      setLoading(false);
    } else {
      if (envConfig.debugConfig.websocket.positions) {
        console.log('[useWebSocketPositions] No cached positions, keeping loading state');
      }
    }
    
    // Enhanced position update handler with error handling
    const handlePositionUpdate = (update) => {
      if (envConfig.debugConfig.websocket.positions) {
        console.log('[useWebSocketPositions] 🔄 handlePositionUpdate received:', {
          type: update.type,
          brokerId: update.brokerId,
          accountId: update.accountId,
          hasPosition: !!update.position,
          hasPositions: !!update.positions,
          positionId: update.position?.positionId || update.position?.id,
          quantity: update.position?.quantity,
          netPos: update.position?.netPos,
          timestamp: new Date().toISOString()
        });
      }
      try {
        if (update.brokerId !== brokerId || update.accountId !== accountId) {
          if (envConfig.debugConfig.websocket.positions) {
            console.log('[useWebSocketPositions] ❌ Update for different broker/account, ignoring');
          }
          return;
        }
        
        const { type, position, positions, previousValues } = update;
        
        // Handle different update types
        if (type === 'snapshot' || type === 'positions_snapshot') {
          // For snapshots, only clear and rebuild if we don't have positions or this is initial load
          const updatedPositions = positions || update.data || webSocketManager.getPositions(brokerId, accountId);
          const hasExistingPositions = positionsMapRef.current.size > 0;
          
          if (envConfig.debugConfig.websocket.positions) {
            console.log('[useWebSocketPositions] Processing snapshot with', updatedPositions?.length || 0, 'positions');
            console.log('[useWebSocketPositions] Has existing positions:', hasExistingPositions);
          }
          
          // Only clear if this is initial load or we have no existing positions
          if (!hasExistingPositions || loading) {
            positionsMapRef.current.clear();
            previousPnLRef.current.clear();
          }
          
          if (updatedPositions && Array.isArray(updatedPositions)) {
            updatedPositions.forEach(pos => {
              const normalizedPos = normalizePosition(pos);
              if (normalizedPos) {
                const key = normalizedPos.positionId;
                // Preserve existing PnL if we have it to avoid flickering
                const existingPos = positionsMapRef.current.get(key);
                const preservedPnL = existingPos ? existingPos.unrealizedPnL : normalizedPos.unrealizedPnL;
                
                positionsMapRef.current.set(key, { 
                  ...normalizedPos, 
                  lastUpdate: Date.now(),
                  unrealizedPnL: preservedPnL 
                });
                previousPnLRef.current.set(key, preservedPnL);
              }
            });
          }
          
          updatePositionsFromMap();
          setLoading(false);
          
          // Clear retry timeout since we received data
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          retryAttemptsRef.current = 0; // Reset retry attempts
          requestInFlightRef.current = false; // Clear request in flight flag
          
          return;
        }
        
        // Handle timestamp-only updates (connection status updates)
        if (update.timestamp && !position && !positions) {
          // This is just a status update, ignore it
          return;
        }
        
        // For other update types, check if position data exists
        if (!position) {
          console.error('[useWebSocketPositions] Position data is undefined in update:', update);
          return;
        }
        
        // Normalize the position data
        const normalizedPosition = normalizePosition(position);
        const positionKey = normalizedPosition.positionId;
        
        if (!positionKey) {
          console.error('[useWebSocketPositions] Position key is undefined after normalization:', normalizedPosition);
          return;
        }
      
      switch (type) {
        case 'opened':
          // New position - add immediately
          positionsMapRef.current.set(positionKey, normalizedPosition);
          previousPnLRef.current.set(positionKey, normalizedPosition.unrealizedPnL);
          updatePositionsFromMap();
          break;
          
        case 'closed':
          // Remove closed position immediately
          positionsMapRef.current.delete(positionKey);
          previousPnLRef.current.delete(positionKey);
          updatePositionsFromMap();
          break;
          
        case 'priceUpdate':
        case 'position_price_update':
          // Update market data health on price updates
          setMarketDataHealth(prev => ({
            ...prev,
            lastPriceUpdate: Date.now(),
            healthStatus: 'healthy'
          }));
          
          // Throttle price updates
          throttleUpdate(positionKey, () => {
            const existingPos = positionsMapRef.current.get(positionKey);
            if (existingPos) {
              if (envConfig.debugConfig.websocket.positions) {
                console.log('[useWebSocketPositions] Price update - old:', existingPos, 'new:', normalizedPosition);
              }
              positionsMapRef.current.set(positionKey, {
                ...existingPos,
                ...normalizedPosition,
                previousPrice: previousValues?.price,
                previousPnL: previousValues?.pnl,
                isPriceUpdating: true,
                lastUpdate: Date.now()
              });
              updatePositionsFromMap();
              
              // Remove update flag after animation
              setTimeout(() => {
                const pos = positionsMapRef.current.get(positionKey);
                if (pos) {
                  pos.isPriceUpdating = false;
                  updatePositionsFromMap();
                }
              }, 500);
            }
          });
          break;
          
        case 'pnlUpdate':
          // Immediate P&L updates
          const posForPnL = positionsMapRef.current.get(positionKey);
          if (posForPnL) {
            const prevPnL = previousPnLRef.current.get(positionKey) || 0;
            positionsMapRef.current.set(positionKey, {
              ...posForPnL,
              ...position,
              previousPnL: prevPnL,
              isPnLUpdating: true
            });
            previousPnLRef.current.set(positionKey, position.unrealizedPnL);
            updatePositionsFromMap();
            
            // Remove update flag
            setTimeout(() => {
              const pos = positionsMapRef.current.get(positionKey);
              if (pos) {
                pos.isPnLUpdating = false;
                updatePositionsFromMap();
              }
            }, 1000);
          }
          break;
          
        case 'modified':
        case 'position_update':
          // General modifications and position updates (quantity changes, etc.)
          const posToModify = positionsMapRef.current.get(positionKey);
          if (posToModify) {
            if (envConfig.debugConfig.websocket.positions) {
              console.log('[useWebSocketPositions] Position update - old:', posToModify, 'new:', normalizedPosition);
            }
            
            const updatedPosition = {
              ...posToModify,
              ...normalizedPosition,
              isModified: true,
              lastUpdate: Date.now()
            };
            
            // Check if position is now closed (quantity is 0)
            const isNowClosed = updatedPosition.quantity === 0 || 
                               Math.abs(updatedPosition.netPos || 0) === 0 ||
                               updatedPosition.side === 'FLAT';
            
            if (isNowClosed) {
              if (envConfig.debugConfig.websocket.positions) {
                console.log('[useWebSocketPositions] Position closed by quantity update:', updatedPosition);
              }
              // Remove closed position immediately instead of marking
              positionsMapRef.current.delete(positionKey);
              previousPnLRef.current.delete(positionKey);
            } else {
              positionsMapRef.current.set(positionKey, updatedPosition);
            }
            
            updatePositionsFromMap();
          }
          break;
          
        // 'snapshot' case is handled earlier, so this case is removed
          
        default:
          // Legacy position update
          const legacyPositions = webSocketManager.getPositions(brokerId, accountId);
          positionsMapRef.current.clear();
          legacyPositions.forEach(pos => {
            const normalizedPos = normalizePosition(pos);
            if (normalizedPos) {
              const key = normalizedPos.positionId;
              positionsMapRef.current.set(key, normalizedPos);
            }
          });
          updatePositionsFromMap();
          setLoading(false); // Data received, stop loading
          requestInFlightRef.current = false; // Clear request in flight flag
          
          // Clear retry timeout since we received data
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          retryAttemptsRef.current = 0; // Reset retry attempts
      }
      
      setLastUpdate(Date.now());
      } catch (err) {
        logger.error('Error handling position update:', err);
        setConnectionHealth(prev => ({
          ...prev,
          lastError: err.message,
          isHealthy: false
        }));
        
        // Attempt recovery
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(attemptReconnect, 5000);
        }
      }
    };
    
    // Subscribe to all position events
    webSocketManager.on('positionUpdate', handlePositionUpdate);
    webSocketManager.on('userDataSynced', handlePositionUpdate);
    
    // Add connection state listener to trigger position requests when ready
    const handleConnectionStateChange = (update) => {
      if (update.brokerId === brokerId && 
          update.accountId === accountId && 
          update.state === ConnectionState.READY) {
        console.log('[useWebSocketPositions] Connection is now ready, requesting positions');
        
        // Reset loading state and request positions
        setLoading(true);
        setError(null);
        
        // Small delay to ensure connection is fully stabilized
        setTimeout(() => {
          refreshPositions();
        }, 500);
      }
    };
    
    webSocketManager.on('connectionState', handleConnectionStateChange);
    
    // Request initial positions if ready with deduplication
    const connectionState = getConnectionState(brokerId, accountId);
    const isReady = connectionState === ConnectionState.READY;
    console.log('[useWebSocketPositions] Connection state:', connectionState, 'isReady:', isReady);
    
    let loadingTimeout;
    if (isReady) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;
      
      // Rate limiting: only send request if at least 2 seconds have passed since last request
      if (!requestInFlightRef.current && timeSinceLastRequest > 2000) {
        console.log('[useWebSocketPositions] Sending get_positions request');
        requestInFlightRef.current = true;
        lastRequestTimeRef.current = now;
        
        const sendResult = webSocketManager.send(brokerId, accountId, { type: 'get_positions' });
        console.log('[useWebSocketPositions] get_positions send result:', sendResult);
        
        // Set a timeout to stop loading if no response
        loadingTimeout = setTimeout(() => {
          requestInFlightRef.current = false;
          if (loading) {
            console.log('[useWebSocketPositions] Loading timeout - no response received');
            setLoading(false);
            setError('Failed to load positions - no response from server');
          }
        }, 10000); // 10 second timeout
      } else {
        console.log('[useWebSocketPositions] Skipping get_positions request - rate limited or request in flight');
        if (requestInFlightRef.current) {
          console.log('[useWebSocketPositions] Request already in flight');
        } else {
          console.log('[useWebSocketPositions] Rate limited - last request', timeSinceLastRequest, 'ms ago');
        }
        setLoading(false); // Don't show loading if we're not making a request
      }
    } else {
      console.log('[useWebSocketPositions] Not ready, skipping get_positions request. State:', connectionState);
      // Keep loading if we're in transition states, stop if disconnected or error
      if (connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR) {
        setLoading(false);
      }
    }
    
    // Start health check timer
    healthCheckTimerRef.current = setInterval(checkConnectionHealth, 10000); // Check every 10 seconds
    
    // Clean up
    return () => {
      webSocketManager.removeListener('positionUpdate', handlePositionUpdate);
      webSocketManager.removeListener('userDataSynced', handlePositionUpdate);
      webSocketManager.removeListener('connectionState', handleConnectionStateChange);
      
      // Clear all timers
      updateTimersRef.current.forEach(timer => clearTimeout(timer));
      updateTimersRef.current.clear();
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (healthCheckTimerRef.current) {
        clearInterval(healthCheckTimerRef.current);
        healthCheckTimerRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [brokerId, accountId]);
  
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
    lastUpdate,
    connectionHealth,
    marketDataHealth,
    
    // Helper methods
    getPositionBySymbol: useCallback((symbol) => {
      return positions.find(position => position.symbol === symbol);
    }, [positions]),
    
    getPositionById: useCallback((contractId) => {
      return positions.find(position => position.contractId === contractId);
    }, [positions]),
    
    hasOpenPositions: useCallback(() => {
      return positions.some(position => position.netPos !== 0 || position.quantity !== 0);
    }, [positions]),
    
    // New helper methods for real-time features
    getPositionState: useCallback((position) => {
      if (!position.lastUpdate) return 'unknown';
      const timeSinceUpdate = Date.now() - position.lastUpdate;
      if (timeSinceUpdate < 5000) return 'live';
      if (timeSinceUpdate < 30000) return 'delayed';
      return 'stale';
    }, []),
    
    isPositionUpdating: useCallback((position) => {
      return position.isPriceUpdating || position.isPnLUpdating || position.isModified;
    }, []),
    
    // Recovery methods
    retryConnection: attemptReconnect
  };
};

export default useWebSocketPositions;