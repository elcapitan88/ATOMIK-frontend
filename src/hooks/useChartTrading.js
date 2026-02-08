import { useEffect, useRef, useCallback } from 'react';
import { getDisplayTicker } from '@/utils/formatting/tickerUtils';

/**
 * Hook to manage position and order lines on a TradingView chart.
 *
 * @param {Object} params
 * @param {Object|null} params.activeChart - TradingView IChartWidgetApi instance
 * @param {Array} params.positions - Positions from useWebSocketPositions
 * @param {Array} params.orders - Orders from useWebSocketOrders
 * @param {string} params.chartSymbol - Current chart symbol (display ticker, e.g. 'NQ')
 * @param {Object} params.callbacks
 * @param {Function} params.callbacks.onClosePosition - (positionId, accountId) => void
 * @param {Function} params.callbacks.onReversePosition - (positionId, accountId) => void
 * @param {Function} params.callbacks.onCancelOrder - (orderId, accountId) => void
 * @param {Function} params.callbacks.onModifyOrder - (orderId, accountId, { price }) => void
 */
const useChartTrading = ({
  activeChart,
  positions = [],
  orders = [],
  chartSymbol = '',
  callbacks = {},
}) => {
  const positionLinesRef = useRef(new Map());
  const orderLinesRef = useRef(new Map());
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref fresh
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  /**
   * Normalize a symbol from position/order data to a base display ticker.
   * Tradovate returns symbols like "NQH6" or "ESH6" — we strip to "NQ", "ES".
   */
  const normalizeSymbol = useCallback((sym) => {
    if (!sym) return '';
    // Try getDisplayTicker first (handles full contract → base)
    const display = getDisplayTicker(sym);
    if (display !== sym) return display;
    // Fallback: strip trailing month+year codes (e.g. NQH6 → NQ)
    return sym.replace(/[A-Z]\d{1,2}$/, '');
  }, []);

  /**
   * Check if a position/order symbol matches the current chart symbol.
   */
  const matchesChart = useCallback(
    (sym) => {
      if (!chartSymbol || !sym) return false;
      const normalized = normalizeSymbol(sym);
      return (
        normalized.toUpperCase() === chartSymbol.toUpperCase() ||
        sym.toUpperCase() === chartSymbol.toUpperCase()
      );
    },
    [chartSymbol, normalizeSymbol]
  );

  // ── Position Lines ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChart || typeof activeChart.createPositionLine !== 'function') {
      return;
    }

    const currentPositionIds = new Set();

    // Filter positions that match the chart symbol
    const matchingPositions = positions.filter(
      (p) => p && p.quantity > 0 && matchesChart(p.symbol)
    );

    // Create or update position lines
    matchingPositions.forEach(async (pos) => {
      const id = pos.positionId;
      currentPositionIds.add(id);

      const isLong = pos.side === 'LONG' || (pos.netPos && pos.netPos > 0);
      const color = isLong ? '#26a69a' : '#ef5350'; // green / red
      const sideLabel = isLong ? 'LONG' : 'SHORT';
      const qty = pos.quantity || Math.abs(pos.netPos || 0);
      const displaySym = normalizeSymbol(pos.symbol);
      const pnl = pos.unrealizedPnL || 0;
      const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;

      if (positionLinesRef.current.has(id)) {
        // Update existing line
        try {
          const line = positionLinesRef.current.get(id);
          line
            .setPrice(pos.avgPrice || 0)
            .setText(`${sideLabel} ${qty} ${displaySym}`)
            .setTooltip(`P&L: ${pnlStr}`)
            .setQuantity(String(qty));
        } catch (e) {
          // Line may have been invalidated
          positionLinesRef.current.delete(id);
        }
      } else {
        // Create new line
        try {
          const line = await activeChart.createPositionLine();
          line
            .setPrice(pos.avgPrice || 0)
            .setText(`${sideLabel} ${qty} ${displaySym}`)
            .setTooltip(`P&L: ${pnlStr}`)
            .setQuantity(String(qty))
            .setLineColor(color)
            .setBodyBackgroundColor(color)
            .setBodyBorderColor(color)
            .setBodyTextColor('#ffffff')
            .setQuantityBackgroundColor(color)
            .setQuantityBorderColor(color)
            .setQuantityTextColor('#ffffff')
            .setCloseTooltip('Close position')
            .setReverseTooltip('Reverse position')
            .onClose(id, (posId) => {
              callbacksRef.current.onClosePosition?.(posId, pos.accountId);
            })
            .onReverse(id, (posId) => {
              callbacksRef.current.onReversePosition?.(posId, pos.accountId);
            });

          positionLinesRef.current.set(id, line);
        } catch (e) {
          console.warn('Failed to create position line:', e);
        }
      }
    });

    // Remove lines for positions that no longer exist
    for (const [id, line] of positionLinesRef.current.entries()) {
      if (!currentPositionIds.has(id)) {
        try {
          line.remove();
        } catch (e) {
          // ignore
        }
        positionLinesRef.current.delete(id);
      }
    }
  }, [activeChart, positions, chartSymbol, matchesChart, normalizeSymbol]);

  // ── Order Lines ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChart || typeof activeChart.createOrderLine !== 'function') {
      return;
    }

    const currentOrderIds = new Set();

    // Filter working orders that match the chart symbol
    // Tradovate ordStatus values: Working, Filled, Cancelled, Expired, Rejected
    const matchingOrders = orders.filter((o) => {
      if (!o || !o.orderId) return false;
      const isWorking =
        o.ordStatus === 'Working' ||
        o.status === 'Working' ||
        o.ordStatus === 6; // TradingView numeric status for working
      return isWorking && matchesChart(o.symbol);
    });

    matchingOrders.forEach(async (ord) => {
      const id = ord.orderId;
      currentOrderIds.add(id);

      const isBuy =
        ord.action === 'Buy' ||
        ord.side === 'buy' ||
        ord.side === 1;
      const color = isBuy ? '#26a69a' : '#ef5350';
      const sideLabel = isBuy ? 'BUY' : 'SELL';

      // Determine order type label
      const typeLabel =
        ord.ordType || ord.orderType || ord.type || 'LIMIT';
      const typeMap = {
        Market: 'MKT',
        Limit: 'LMT',
        Stop: 'STP',
        StopLimit: 'STP LMT',
        MARKET: 'MKT',
        LIMIT: 'LMT',
        STOP: 'STP',
        STOP_LIMIT: 'STP LMT',
      };
      const shortType = typeMap[typeLabel] || typeLabel;

      const price = ord.price || ord.limitPrice || ord.stopPrice || 0;
      const qty = ord.qty || ord.quantity || ord.orderQty || 1;

      if (orderLinesRef.current.has(id)) {
        // Update existing line
        try {
          const line = orderLinesRef.current.get(id);
          line
            .setPrice(price)
            .setText(`${sideLabel} ${shortType}`)
            .setQuantity(String(qty));
        } catch (e) {
          orderLinesRef.current.delete(id);
        }
      } else {
        // Create new line
        try {
          const line = await activeChart.createOrderLine();
          line
            .setPrice(price)
            .setText(`${sideLabel} ${shortType}`)
            .setQuantity(String(qty))
            .setEditable(true)
            .setCancellable(true)
            .setLineColor(color)
            .setBodyBackgroundColor('#2a2e39')
            .setBodyBorderColor(color)
            .setBodyTextColor('#d1d4dc')
            .setQuantityBackgroundColor(color)
            .setQuantityBorderColor(color)
            .setQuantityTextColor('#ffffff')
            .setCancelTooltip('Cancel order')
            .setModifyTooltip('Modify order')
            .onCancel(id, (ordId) => {
              callbacksRef.current.onCancelOrder?.(ordId, ord.accountId);
            })
            .onMove(id, (ordId) => {
              // After drag, get the new price from the line
              const existingLine = orderLinesRef.current.get(ordId);
              if (existingLine) {
                const newPrice = existingLine.getPrice();
                callbacksRef.current.onModifyOrder?.(ordId, ord.accountId, {
                  price: newPrice,
                });
              }
            });

          orderLinesRef.current.set(id, line);
        } catch (e) {
          console.warn('Failed to create order line:', e);
        }
      }
    });

    // Remove lines for orders that no longer exist or are no longer working
    for (const [id, line] of orderLinesRef.current.entries()) {
      if (!currentOrderIds.has(id)) {
        try {
          line.remove();
        } catch (e) {
          // ignore
        }
        orderLinesRef.current.delete(id);
      }
    }
  }, [activeChart, orders, chartSymbol, matchesChart]);

  // ── Cleanup on unmount or chart change ────────────────────────────
  useEffect(() => {
    return () => {
      // Remove all position lines
      for (const [, line] of positionLinesRef.current.entries()) {
        try {
          line.remove();
        } catch (e) {
          // ignore
        }
      }
      positionLinesRef.current.clear();

      // Remove all order lines
      for (const [, line] of orderLinesRef.current.entries()) {
        try {
          line.remove();
        } catch (e) {
          // ignore
        }
      }
      orderLinesRef.current.clear();
    };
  }, [activeChart]);
};

export default useChartTrading;
