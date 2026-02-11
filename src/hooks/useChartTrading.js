import { useEffect, useRef, useCallback, useState } from 'react';
import { getDisplayTicker, getContractTicker } from '@/utils/formatting/tickerUtils';
import { SYMBOL_CONFIG } from '@services/datafeed/helpers';
import axiosInstance from '@/services/axiosConfig';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Normalize a symbol from position/order data to a base display ticker.
 * Tradovate returns symbols like "NQH6" or "ESH6" — we strip to "NQ", "ES".
 */
function normalizeSymbol(sym) {
  if (!sym) return '';
  const display = getDisplayTicker(sym);
  if (display !== sym) return display;
  return sym.replace(/[A-Z]\d{1,2}$/, '');
}

/**
 * Round a price to the nearest valid tick for a symbol.
 */
function roundToTick(price, symbol) {
  const base = normalizeSymbol(symbol);
  const cfg = SYMBOL_CONFIG[base];
  if (!cfg) return Math.round(price * 100) / 100;
  const tick = cfg.minmov / cfg.pricescale;
  return Math.round(price / tick) * tick;
}

/**
 * Get the tick size for a symbol.
 */
function getTickSize(symbol) {
  const base = normalizeSymbol(symbol);
  const cfg = SYMBOL_CONFIG[base];
  if (!cfg) return 0.25;
  return cfg.minmov / cfg.pricescale;
}

/**
 * Format price with appropriate decimals based on tick size.
 */
function formatPrice(price, symbol) {
  const tick = getTickSize(symbol);
  if (tick >= 1) return price.toFixed(0);
  const decimals = Math.max(0, Math.ceil(-Math.log10(tick)));
  return price.toFixed(decimals);
}

// ── Line Style Constants ────────────────────────────────────────────
const LINE_SOLID = 0;
const LINE_DASHED = 2;

const COLORS = {
  buyLine: '#26a69a',
  sellLine: '#ef5350',
  buyBody: 'rgba(38, 166, 154, 0.85)',
  sellBody: 'rgba(239, 83, 80, 0.85)',
  orderBody: '#2a2e39',
  orderText: '#d1d4dc',
  white: '#ffffff',
  tpLine: '#4caf50',
  tpBody: 'rgba(76, 175, 80, 0.85)',
  slLine: '#f44336',
  slBody: 'rgba(244, 67, 54, 0.85)',
  closeBtn: '#ef5350',
  reverseBtn: '#ff9800',
  protectBtn: '#9c27b0',
};

// ── Hook ────────────────────────────────────────────────────────────

/**
 * Manages position lines, order lines, and bracket (TP/SL) lines on a
 * TradingView chart using the Charting Library's Trading Primitives API.
 *
 * Returns confirmation state that Dashboard.js uses to render the
 * OrderConfirmationModal.
 */
const useChartTrading = ({
  activeChart,
  positions = [],
  orders = [],
  chartSymbol = '',
  callbacks = {},
  multiAccountTrading = null,
}) => {
  // Refs for chart primitives
  const positionLinesRef = useRef(new Map());
  const orderLinesRef = useRef(new Map());
  const bracketLinesRef = useRef(new Map()); // posKey → { tp: IOrderLineAdapter, sl: IOrderLineAdapter }
  const callbacksRef = useRef(callbacks);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState(null);

  // Keep callbacks ref fresh
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // ── Symbol matching ───────────────────────────────────────────────

  const matchesChart = useCallback(
    (sym) => {
      if (!chartSymbol || !sym) return false;
      const normalized = normalizeSymbol(sym);
      return (
        normalized.toUpperCase() === chartSymbol.toUpperCase() ||
        sym.toUpperCase() === chartSymbol.toUpperCase()
      );
    },
    [chartSymbol]
  );

  // ── Confirmation flow ─────────────────────────────────────────────

  const requestConfirmation = useCallback((action, details) => {
    setConfirmState({ action, details });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmState) return;
    const { action, details } = confirmState;
    setConfirmState(null);

    try {
      switch (action) {
        case 'close':
          await callbacksRef.current.onClosePosition?.(details.positionId, details.accountId);
          break;
        case 'reverse':
          await callbacksRef.current.onReversePosition?.(details.positionId, details.accountId);
          break;
        case 'cancel':
          await callbacksRef.current.onCancelOrder?.(details.orderId, details.accountId);
          break;
        case 'modify': {
          const mods = {};
          const type = (details.type || '').toUpperCase();
          if (type === 'STOP' || type === 'STOP_LIMIT' || type === 'STP' || type === 'STP LMT') {
            mods.stopPrice = details.newPrice;
          }
          if (type === 'LIMIT' || type === 'STOP_LIMIT' || type === 'LMT' || type === 'STP LMT') {
            mods.limitPrice = details.newPrice;
          }
          // Fallback: if no type matched, send generic price
          if (!mods.stopPrice && !mods.limitPrice) {
            mods.price = details.newPrice;
          }
          await callbacksRef.current.onModifyOrder?.(details.orderId, details.accountId, mods);
          break;
        }
        case 'bracket':
          await executeBracketOrders(details);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`[ChartTrading] ${action} failed:`, err);
    }
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (!confirmState) return;
    const { action, details } = confirmState;
    setConfirmState(null);

    // Snap order line back to original price on modify cancel
    if (action === 'modify' && details.originalPrice != null) {
      const key = details._lineKey;
      const line = key && orderLinesRef.current.get(key);
      if (line) {
        try { line.setPrice(details.originalPrice); } catch (e) { /* stale ref */ }
      }
    }
  }, [confirmState]);

  // ── Bracket order placement ───────────────────────────────────────

  const executeBracketOrders = useCallback(async (details) => {
    const { accountId, symbol, side, quantity, tpPrice, slPrice } = details;
    const isLong = side === 'LONG';
    const contractSymbol = getContractTicker(normalizeSymbol(symbol));
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const promises = [];

    // Take Profit: LIMIT order on opposite side
    if (tpPrice != null) {
      promises.push(
        axiosInstance.post(
          `/api/v1/brokers/accounts/${accountId}/discretionary/orders`,
          {
            symbol: contractSymbol,
            side: isLong ? 'SELL' : 'BUY',
            type: 'LIMIT',
            quantity,
            price: tpPrice,
            time_in_force: 'GTC',
          },
          { headers }
        ).catch(err => ({ _error: true, leg: 'TP', err }))
      );
    }

    // Stop Loss: STOP order on opposite side
    if (slPrice != null) {
      promises.push(
        axiosInstance.post(
          `/api/v1/brokers/accounts/${accountId}/discretionary/orders`,
          {
            symbol: contractSymbol,
            side: isLong ? 'SELL' : 'BUY',
            type: 'STOP',
            quantity,
            stop_price: slPrice,
            time_in_force: 'GTC',
          },
          { headers }
        ).catch(err => ({ _error: true, leg: 'SL', err }))
      );
    }

    const results = await Promise.allSettled(promises);
    const failures = results.filter(r =>
      r.status === 'rejected' || (r.status === 'fulfilled' && r.value?._error)
    );
    if (failures.length > 0) {
      console.warn('[ChartTrading] Some bracket legs failed:', failures);
    }
    // Bracket order lines will appear automatically via WebSocket → orders array
  }, []);

  // ── Position Lines ────────────────────────────────────────────────

  useEffect(() => {
    if (!activeChart || typeof activeChart.createPositionLine !== 'function') return;

    const currentIds = new Set();

    const matchingPositions = positions.filter(
      (p) => p && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0) && matchesChart(p.symbol)
    );

    matchingPositions.forEach(async (pos) => {
      const acctPrefix = pos._accountId || pos.accountId || '';
      const key = acctPrefix ? `${acctPrefix}-${pos.positionId}` : pos.positionId;
      currentIds.add(key);

      const isLong = pos.side === 'LONG' || (pos.netPos && pos.netPos > 0);
      const color = isLong ? COLORS.buyLine : COLORS.sellLine;
      const sideLabel = isLong ? 'LONG' : 'SHORT';
      const qty = pos.quantity || Math.abs(pos.netPos || 0);
      const displaySym = normalizeSymbol(pos.symbol);
      const acctLabel = pos._accountNickname || '';
      const pnl = pos.unrealizedPnL || 0;
      const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
      const posAccountId = pos._accountId || pos.accountId;

      const lineText = acctLabel
        ? `${sideLabel} ${qty} ${displaySym} [${acctLabel}]`
        : `${sideLabel} ${qty} ${displaySym}`;
      const tooltipText = acctLabel
        ? `${acctLabel} | P&L: ${pnlStr}`
        : `P&L: ${pnlStr}`;

      if (positionLinesRef.current.has(key)) {
        try {
          const line = positionLinesRef.current.get(key);
          line
            .setPrice(pos.avgPrice || 0)
            .setText(lineText)
            .setTooltip(tooltipText)
            .setQuantity(String(qty));
        } catch (e) {
          positionLinesRef.current.delete(key);
        }
      } else {
        try {
          const line = activeChart.createPositionLine()
            .setPrice(pos.avgPrice || 0)
            .setText(lineText)
            .setTooltip(tooltipText)
            .setQuantity(String(qty))
            .setExtendLeft(false)
            .setLineLength(25)
            .setLineStyle(LINE_SOLID)
            .setLineColor(color)
            .setBodyBackgroundColor(color)
            .setBodyBorderColor(color)
            .setBodyTextColor(COLORS.white)
            .setQuantityBackgroundColor(color)
            .setQuantityBorderColor(color)
            .setQuantityTextColor(COLORS.white)
            .setCloseTooltip('Close position')
            .setReverseTooltip('Reverse position')
            .setProtectTooltip('Add TP/SL brackets')
            .onClose(key, () => {
              requestConfirmation('close', {
                positionId: pos.positionId,
                accountId: posAccountId,
                symbol: displaySym,
                side: sideLabel,
                quantity: qty,
                accountNickname: acctLabel,
                avgPrice: pos.avgPrice,
                unrealizedPnL: pnl,
              });
            })
            .onReverse(key, () => {
              requestConfirmation('reverse', {
                positionId: pos.positionId,
                accountId: posAccountId,
                symbol: displaySym,
                side: sideLabel,
                quantity: qty,
                accountNickname: acctLabel,
                avgPrice: pos.avgPrice,
              });
            })
            .onModify(key, () => {
              // Protect button — open bracket creation
              const currentPrice = pos.currentPrice || pos.avgPrice || 0;
              const offset = getTickSize(pos.symbol) * 20;
              const tpPrice = roundToTick(
                isLong ? currentPrice + offset : currentPrice - offset,
                pos.symbol
              );
              const slPrice = roundToTick(
                isLong ? currentPrice - offset : currentPrice + offset,
                pos.symbol
              );
              requestConfirmation('bracket', {
                positionId: pos.positionId,
                accountId: posAccountId,
                brokerId: pos._brokerId || 'tradovate',
                symbol: displaySym,
                side: sideLabel,
                quantity: qty,
                accountNickname: acctLabel,
                tpPrice,
                slPrice,
              });
            });

          positionLinesRef.current.set(key, line);
        } catch (e) {
          console.warn('[ChartTrading] Failed to create position line:', e);
        }
      }
    });

    // Remove lines for positions that no longer exist
    for (const [key, line] of positionLinesRef.current.entries()) {
      if (!currentIds.has(key)) {
        try { line.remove(); } catch (e) { /* ignore */ }
        positionLinesRef.current.delete(key);
        // Also clear any bracket association
        bracketLinesRef.current.delete(key);
      }
    }
  }, [activeChart, positions, chartSymbol, matchesChart, requestConfirmation]);

  // ── Order Lines ───────────────────────────────────────────────────

  useEffect(() => {
    if (!activeChart || typeof activeChart.createOrderLine !== 'function') return;

    const currentIds = new Set();

    const matchingOrders = orders.filter((o) => {
      if (!o || !o.orderId) return false;
      const isWorking =
        o.ordStatus === 'Working' ||
        o.status === 'Working' ||
        o.ordStatus === 6;
      return isWorking && matchesChart(o.symbol);
    });

    matchingOrders.forEach(async (ord) => {
      const ordAcctPrefix = ord._accountId || ord.accountId || '';
      const key = ordAcctPrefix ? `${ordAcctPrefix}-${ord.orderId}` : ord.orderId;
      currentIds.add(key);

      const isBuy =
        ord.action === 'Buy' || ord.side === 'buy' || ord.side === 'BUY' || ord.side === 1;
      const color = isBuy ? COLORS.buyLine : COLORS.sellLine;
      const sideLabel = isBuy ? 'BUY' : 'SELL';
      const ordAcctLabel = ord._accountNickname || '';

      const typeLabel = ord.ordType || ord.orderType || ord.type || 'LIMIT';
      const typeMap = {
        Market: 'MKT', Limit: 'LMT', Stop: 'STP', StopLimit: 'STP LMT',
        MARKET: 'MKT', LIMIT: 'LMT', STOP: 'STP', STOP_LIMIT: 'STP LMT',
      };
      const shortType = typeMap[typeLabel] || typeLabel;

      const price = ord.price || ord.limitPrice || ord.stopPrice || 0;
      const qty = ord.qty || ord.quantity || ord.orderQty || 1;
      const ordAccountId = ord._accountId || ord.accountId;

      // Determine line style: dashed for STOP, solid for LIMIT
      const isStop = typeLabel === 'Stop' || typeLabel === 'STOP' ||
                     typeLabel === 'StopLimit' || typeLabel === 'STOP_LIMIT';
      const lineStyle = isStop ? LINE_DASHED : LINE_SOLID;

      const orderText = ordAcctLabel
        ? `${sideLabel} ${shortType} [${ordAcctLabel}]`
        : `${sideLabel} ${shortType}`;

      if (orderLinesRef.current.has(key)) {
        try {
          const line = orderLinesRef.current.get(key);
          line
            .setPrice(price)
            .setText(orderText)
            .setQuantity(String(qty));
        } catch (e) {
          orderLinesRef.current.delete(key);
        }
      } else {
        try {
          const line = activeChart.createOrderLine()
            .setPrice(price)
            .setText(orderText)
            .setQuantity(String(qty))
            .setEditable(true)
            .setCancellable(true)
            .setExtendLeft(false)
            .setLineLength(25)
            .setLineStyle(lineStyle)
            .setLineColor(color)
            .setBodyBackgroundColor(COLORS.orderBody)
            .setBodyBorderColor(color)
            .setBodyTextColor(COLORS.orderText)
            .setQuantityBackgroundColor(color)
            .setQuantityBorderColor(color)
            .setQuantityTextColor(COLORS.white)
            .setCancelButtonBackgroundColor('rgba(239, 83, 80, 0.8)')
            .setCancelButtonBorderColor(COLORS.sellLine)
            .setCancelButtonIconColor(COLORS.white)
            .setCancelTooltip('Cancel order')
            .setModifyTooltip('Drag to modify price')
            .onCancel(key, () => {
              requestConfirmation('cancel', {
                orderId: ord.orderId,
                accountId: ordAccountId,
                symbol: normalizeSymbol(ord.symbol),
                side: sideLabel,
                type: shortType,
                price,
                quantity: qty,
                accountNickname: ordAcctLabel,
              });
            })
            .onMove(key, () => {
              const existingLine = orderLinesRef.current.get(key);
              if (!existingLine) return;
              const rawPrice = existingLine.getPrice();
              const newPrice = roundToTick(rawPrice, ord.symbol);
              // Snap to tick immediately
              if (rawPrice !== newPrice) {
                try { existingLine.setPrice(newPrice); } catch (e) { /* ignore */ }
              }
              requestConfirmation('modify', {
                orderId: ord.orderId,
                accountId: ordAccountId,
                symbol: normalizeSymbol(ord.symbol),
                side: sideLabel,
                type: typeLabel,
                originalPrice: price,
                newPrice,
                quantity: qty,
                accountNickname: ordAcctLabel,
                _lineKey: key,
              });
            });

          orderLinesRef.current.set(key, line);
        } catch (e) {
          console.warn('[ChartTrading] Failed to create order line:', e);
        }
      }
    });

    // Remove lines for orders that are no longer working
    for (const [key, line] of orderLinesRef.current.entries()) {
      if (!currentIds.has(key)) {
        try { line.remove(); } catch (e) { /* ignore */ }
        orderLinesRef.current.delete(key);
      }
    }
  }, [activeChart, orders, chartSymbol, matchesChart, requestConfirmation]);

  // ── Cleanup on unmount or chart change ────────────────────────────

  useEffect(() => {
    return () => {
      for (const [, line] of positionLinesRef.current.entries()) {
        try { line.remove(); } catch (e) { /* ignore */ }
      }
      positionLinesRef.current.clear();

      for (const [, line] of orderLinesRef.current.entries()) {
        try { line.remove(); } catch (e) { /* ignore */ }
      }
      orderLinesRef.current.clear();

      bracketLinesRef.current.clear();
    };
  }, [activeChart]);

  // ── Return confirmation state for modal rendering ─────────────────

  return {
    confirmState,
    handleConfirm,
    handleCancel,
  };
};

export default useChartTrading;
