import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketManager from '@/services/websocket-proxy/WebSocketManager';
import logger from '@/utils/logger';

/**
 * Hook that aggregates positions and orders from ALL connected accounts.
 * Subscribes to WebSocketManager events directly (not per-account hooks)
 * so we can dynamically track multiple accounts.
 *
 * @param {Array} accounts - Array of { broker_id, account_id, nickname, ... }
 * @param {Function} getConnectionState - From WebSocketContext
 * @returns {{ positions, orders, totalUnrealizedPnl, refreshAll }}
 */
const useAggregatedPositions = (accounts = [], getConnectionState) => {
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const accountsRef = useRef(accounts);

  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  // Track previous position count to detect 0→>0 transitions
  const prevPositionCountRef = useRef(0);

  // Build full snapshot from all accounts
  const buildSnapshot = useCallback(() => {
    const accts = accountsRef.current;
    const allPositions = [];
    const allOrders = [];

    for (const acct of accts) {
      const bid = acct.broker_id;
      const aid = String(acct.account_id);

      const pos = webSocketManager.getPositions(bid, aid);
      pos.forEach((p) => {
        // Only include positions with non-zero quantity
        if (p.quantity > 0 || Math.abs(p.netPos || 0) > 0) {
          allPositions.push({
            ...p,
            _brokerId: bid,
            _accountId: aid,
            _accountNickname: acct.nickname || acct.name || aid,
          });
        }
      });

      const ord = webSocketManager.getOrders(bid, aid);
      ord.forEach((o) => {
        allOrders.push({
          ...o,
          _brokerId: bid,
          _accountId: aid,
          _accountNickname: acct.nickname || acct.name || aid,
        });
      });
    }

    // Log 0→>0 transitions (new position opened from flat)
    if (allPositions.length > 0 && prevPositionCountRef.current === 0) {
      console.log('[useAggregatedPositions] ⚡ New position detected (0→>0):', allPositions.map(p => ({
        symbol: p.symbol, side: p.side, qty: p.quantity, price: p.avgPrice,
      })));
    }
    prevPositionCountRef.current = allPositions.length;

    setPositions(allPositions);
    setOrders(allOrders);
  }, []);

  // Subscribe to position + order + sync events
  useEffect(() => {
    const handlePositionUpdate = () => buildSnapshot();
    const handleOrderUpdate = () => buildSnapshot();
    const handleSync = () => buildSnapshot();

    webSocketManager.on('positionUpdate', handlePositionUpdate);
    webSocketManager.on('positionOpened', handlePositionUpdate);
    webSocketManager.on('positionClosed', handlePositionUpdate);
    webSocketManager.on('positionPriceUpdate', handlePositionUpdate);
    webSocketManager.on('positionsSnapshot', handlePositionUpdate);
    webSocketManager.on('orderUpdate', handleOrderUpdate);
    webSocketManager.on('userDataSynced', handleSync);

    // Initial snapshot
    buildSnapshot();

    // Periodic polling fallback (catches missed events, e.g. new positions after order fill)
    const pollId = setInterval(buildSnapshot, 2000);

    return () => {
      clearInterval(pollId);
      webSocketManager.removeListener('positionUpdate', handlePositionUpdate);
      webSocketManager.removeListener('positionOpened', handlePositionUpdate);
      webSocketManager.removeListener('positionClosed', handlePositionUpdate);
      webSocketManager.removeListener('positionPriceUpdate', handlePositionUpdate);
      webSocketManager.removeListener('positionsSnapshot', handlePositionUpdate);
      webSocketManager.removeListener('orderUpdate', handleOrderUpdate);
      webSocketManager.removeListener('userDataSynced', handleSync);
    };
  }, [buildSnapshot]);

  // Rebuild when accounts list changes (new account connected/disconnected)
  useEffect(() => {
    buildSnapshot();
  }, [accounts, buildSnapshot]);

  const totalUnrealizedPnl = positions.reduce(
    (sum, p) => sum + (p.unrealizedPnL || 0),
    0
  );

  const refreshAll = useCallback(() => {
    buildSnapshot();
  }, [buildSnapshot]);

  return {
    positions,
    orders,
    totalUnrealizedPnl,
    refreshAll,
  };
};

export default useAggregatedPositions;
