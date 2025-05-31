import { useState, useEffect, useRef, useCallback } from 'react';
import { POSITION_UPDATE_THROTTLE } from '../constants/positionEvents';

/**
 * Custom hook to throttle position updates for performance
 * @param {Array} positions - Array of positions
 * @param {Object} options - Throttle options
 * @returns {Array} Throttled positions array
 */
export const useThrottledPositions = (positions, options = {}) => {
  const {
    priceUpdateDelay = POSITION_UPDATE_THROTTLE.PRICE_UPDATE,
    pnlUpdateDelay = POSITION_UPDATE_THROTTLE.PNL_UPDATE,
    bulkUpdateDelay = POSITION_UPDATE_THROTTLE.BULK_UPDATE
  } = options;
  
  const [throttledPositions, setThrottledPositions] = useState(positions);
  const updateQueueRef = useRef(new Map());
  const timersRef = useRef(new Map());
  const lastUpdateRef = useRef(Date.now());
  
  // Process queued updates
  const processQueue = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;
    
    // Get all pending updates
    const updates = Array.from(updateQueueRef.current.values());
    updateQueueRef.current.clear();
    
    // Apply updates to positions
    setThrottledPositions(currentPositions => {
      const positionMap = new Map(
        currentPositions.map(pos => [
          pos.positionId || pos.contractId || pos.symbol,
          pos
        ])
      );
      
      // Apply each update
      updates.forEach(update => {
        const key = update.positionId || update.contractId || update.symbol;
        const existing = positionMap.get(key);
        
        if (existing) {
          // Merge update with existing position
          positionMap.set(key, {
            ...existing,
            ...update,
            lastThrottledUpdate: Date.now()
          });
        } else if (!update.isClosed) {
          // New position
          positionMap.set(key, {
            ...update,
            lastThrottledUpdate: Date.now()
          });
        }
      });
      
      // Convert back to array and filter out closed positions
      return Array.from(positionMap.values())
        .filter(pos => !pos.isClosed || Date.now() - pos.closedAt < 5000);
    });
    
    lastUpdateRef.current = Date.now();
  }, []);
  
  // Queue an update with throttling
  const queueUpdate = useCallback((position, updateType = 'general') => {
    const key = position.positionId || position.contractId || position.symbol;
    const timerId = `${key}_${updateType}`;
    
    // Determine delay based on update type
    let delay = bulkUpdateDelay;
    if (updateType === 'price') delay = priceUpdateDelay;
    else if (updateType === 'pnl') delay = pnlUpdateDelay;
    
    // Clear existing timer for this update
    if (timersRef.current.has(timerId)) {
      clearTimeout(timersRef.current.get(timerId));
    }
    
    // Queue the update
    updateQueueRef.current.set(key, position);
    
    // Set timer to process queue
    const timer = setTimeout(() => {
      processQueue();
      timersRef.current.delete(timerId);
    }, delay);
    
    timersRef.current.set(timerId, timer);
  }, [priceUpdateDelay, pnlUpdateDelay, bulkUpdateDelay, processQueue]);
  
  // Effect to handle position updates
  useEffect(() => {
    if (!positions || positions.length === 0) {
      setThrottledPositions([]);
      return;
    }
    
    // Check if this is a bulk update
    const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
    const isBulkUpdate = positions.length > 5 || timeSinceLastUpdate < 100;
    
    if (isBulkUpdate) {
      // For bulk updates, update immediately but throttle subsequent updates
      setThrottledPositions(positions);
      lastUpdateRef.current = Date.now();
    } else {
      // For individual updates, check each position
      positions.forEach(position => {
        const existing = throttledPositions.find(
          p => (p.positionId || p.contractId || p.symbol) === 
               (position.positionId || position.contractId || position.symbol)
        );
        
        if (!existing) {
          // New position - add immediately
          queueUpdate(position, 'new');
        } else {
          // Determine update type
          let updateType = 'general';
          
          if (position.isPriceUpdating) {
            updateType = 'price';
          } else if (position.isPnLUpdating) {
            updateType = 'pnl';
          }
          
          // Check if update is significant
          const isPriceChange = existing.currentPrice !== position.currentPrice;
          const isPnLChange = Math.abs(
            (existing.unrealizedPnL || 0) - (position.unrealizedPnL || 0)
          ) > 0.01;
          
          if (isPriceChange || isPnLChange || position.isModified) {
            queueUpdate(position, updateType);
          }
        }
      });
    }
  }, [positions]); // Intentionally not including all deps to prevent infinite loops
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      updateQueueRef.current.clear();
    };
  }, []);
  
  return throttledPositions;
};

/**
 * Custom hook to batch position updates
 * @param {Function} updateFn - Function to call with batched updates
 * @param {number} delay - Delay before processing batch
 * @returns {Function} Function to add update to batch
 */
export const useBatchedUpdates = (updateFn, delay = 100) => {
  const batchRef = useRef([]);
  const timerRef = useRef(null);
  
  const processBatch = useCallback(() => {
    if (batchRef.current.length > 0) {
      updateFn(batchRef.current);
      batchRef.current = [];
    }
  }, [updateFn]);
  
  const addToBatch = useCallback((item) => {
    batchRef.current.push(item);
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set new timer
    timerRef.current = setTimeout(processBatch, delay);
  }, [delay, processBatch]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        processBatch(); // Process any remaining items
      }
    };
  }, [processBatch]);
  
  return addToBatch;
};