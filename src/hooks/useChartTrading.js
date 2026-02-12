import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { getDisplayTicker, getContractTicker } from '@/utils/formatting/tickerUtils';
import { SYMBOL_CONFIG } from '@services/datafeed/helpers';
import axiosInstance from '@/services/axiosConfig';

// ── Helpers ────────────────────────────────────────────────────────

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

// ── Style Constants (shared with overlay components) ─────────────────

export const COLORS = {
  // Green for long/buy, red for short/sell
  buyLine: '#26a69a',
  sellLine: '#ef5350',
  buyBody: 'rgba(38, 166, 154, 0.15)',
  sellBody: 'rgba(239, 83, 80, 0.15)',
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

/**
 * Get the dollar-per-point value for a symbol.
 */
function getPointValue(symbol) {
  const base = normalizeSymbol(symbol);
  const cfg = SYMBOL_CONFIG[base];
  return cfg?.pointvalue || 1;
}

export { normalizeSymbol, roundToTick, getTickSize, formatPrice };

// ── Hook ────────────────────────────────────────────────────────────

/**
 * Manages position/order data for the chart overlay and the
 * confirmation flow.
 *
 * v2: Returns line data arrays that ChartTradingOverlay renders as
 * HTML components — does NOT call createPositionLine/createOrderLine.
 */
const useChartTrading = ({
  activeChart,
  positions = [],
  orders = [],
  chartSymbol = '',
  callbacks = {},
  multiAccountTrading = null,
  chartCurrentPrice = null,
}) => {
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
          const type = String(details.type || 'LIMIT').toUpperCase();
          // Normalize short-form types to standard form for the backend
          const typeMap = {
            'STP': 'STOP', 'STP LMT': 'STOP_LIMIT',
            'LMT': 'LIMIT', 'MKT': 'MARKET',
            'STOP': 'STOP', 'STOP_LIMIT': 'STOP_LIMIT',
            'LIMIT': 'LIMIT', 'MARKET': 'MARKET',
          };
          const normalizedType = typeMap[type] || type;
          if (normalizedType === 'STOP' || normalizedType === 'STOP_LIMIT') {
            mods.stopPrice = details.newPrice;
          }
          if (normalizedType === 'LIMIT' || normalizedType === 'STOP_LIMIT') {
            mods.limitPrice = details.newPrice;
          }
          if (!mods.stopPrice && !mods.limitPrice) {
            mods.price = details.newPrice;
          }
          // Tradovate requires orderQty and orderType on every modifyOrder call
          mods.qty = details.quantity;
          mods.orderType = normalizedType;
          console.log(`[ChartTrading] Modifying order ${details.orderId} on account ${details.accountId}:`, mods);
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
      // Errors from callbacks (e.g. Dashboard.onModifyOrder) already show toasts,
      // so we only log here. If the error originated before the callback, it's a bug.
    }
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    setConfirmState(null);
  }, []);

  // ── Bracket order placement ───────────────────────────────────────

  const executeBracketOrders = useCallback(async (details) => {
    const { accountId, symbol, side, quantity, tpPrice, slPrice } = details;
    const isLong = side === 'LONG';
    const contractSymbol = getContractTicker(normalizeSymbol(symbol));
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const promises = [];

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
  }, []);

  // ── Build position line data ──────────────────────────────────────

  const positionLines = useMemo(() => {
    if (!chartSymbol) return [];

    return positions
      .filter((p) => p && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0) && matchesChart(p.symbol))
      .map((pos) => {
        const acctPrefix = pos._accountId || pos.accountId || '';
        const key = acctPrefix ? `${acctPrefix}-${pos.positionId}` : String(pos.positionId);
        const isLong = pos.side === 'LONG' || (pos.netPos && pos.netPos > 0);
        const qty = pos.quantity || Math.abs(pos.netPos || 0);
        const displaySym = normalizeSymbol(pos.symbol);
        const acctLabel = pos._accountNickname || '';
        const posAccountId = pos._accountId || pos.accountId;
        const avgPrice = pos.avgPrice || 0;

        // P&L calculation — prefer WebSocket server-computed P&L, fall back to client-side
        // WebSocket Proxy sends position_price_update with accurate unrealizedPnL on every tick
        const wsHasRecentPrice = pos.lastPriceUpdate && (Date.now() - pos.lastPriceUpdate < 10000);
        const wsCurrentPrice = wsHasRecentPrice ? pos.currentPrice : null;

        // Live price: WebSocket real-time > chart poll > position data > entry price
        const livePrice = wsCurrentPrice || chartCurrentPrice || pos.currentPrice || pos.lastPrice || avgPrice;
        const pointVal = getPointValue(pos.symbol);
        const priceDiff = isLong ? (livePrice - avgPrice) : (avgPrice - livePrice);

        // Use WebSocket's server-computed P&L when fresh, otherwise calculate client-side
        let pnl;
        if (wsHasRecentPrice && pos.unrealizedPnL != null && pos.unrealizedPnL !== 0) {
          pnl = pos.unrealizedPnL;
        } else if (avgPrice > 0 && livePrice > 0 && livePrice !== avgPrice) {
          pnl = priceDiff * qty * pointVal;
        } else {
          pnl = pos.unrealizedPnL || 0;
        }

        return {
          key,
          price: avgPrice,
          currentPrice: pos.currentPrice || pos.lastPrice || 0,
          isLong,
          side: isLong ? 'LONG' : 'SHORT',
          quantity: qty,
          symbol: displaySym,
          accountNickname: acctLabel,
          pnl,
          formattedPrice: formatPrice(avgPrice, pos.symbol),
          color: isLong ? COLORS.buyLine : COLORS.sellLine,
          bodyColor: isLong ? COLORS.buyBody : COLORS.sellBody,
          // Action handlers
          onClose: () => {
            requestConfirmation('close', {
              positionId: pos.positionId,
              accountId: posAccountId,
              symbol: displaySym,
              side: isLong ? 'LONG' : 'SHORT',
              quantity: qty,
              accountNickname: acctLabel,
              avgPrice,
              unrealizedPnL: pnl,
            });
          },
          onReverse: () => {
            requestConfirmation('reverse', {
              positionId: pos.positionId,
              accountId: posAccountId,
              symbol: displaySym,
              side: isLong ? 'LONG' : 'SHORT',
              quantity: qty,
              accountNickname: acctLabel,
              avgPrice,
            });
          },
          onProtect: () => {
            const currentPrice = pos.currentPrice || avgPrice;
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
              side: isLong ? 'LONG' : 'SHORT',
              quantity: qty,
              accountNickname: acctLabel,
              tpPrice,
              slPrice,
            });
          },
        };
      });
  }, [positions, chartSymbol, chartCurrentPrice, matchesChart, requestConfirmation]);

  // ── Build order line data ─────────────────────────────────────────

  const orderLines = useMemo(() => {
    if (!chartSymbol) return [];

    return orders
      .filter((o) => {
        if (!o || !o.orderId) return false;
        const isWorking =
          o.ordStatus === 'Working' ||
          o.status === 'Working' ||
          o.ordStatus === 6;
        return isWorking && matchesChart(o.symbol);
      })
      .map((ord) => {
        const ordAcctPrefix = ord._accountId || ord.accountId || '';
        const key = ordAcctPrefix ? `${ordAcctPrefix}-${ord.orderId}` : String(ord.orderId);
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

        const isStop = typeLabel === 'Stop' || typeLabel === 'STOP' ||
                       typeLabel === 'StopLimit' || typeLabel === 'STOP_LIMIT';

        return {
          key,
          price,
          isBuy,
          side: sideLabel,
          type: typeLabel,
          shortType,
          quantity: qty,
          symbol: normalizeSymbol(ord.symbol),
          accountNickname: ordAcctLabel,
          formattedPrice: formatPrice(price, ord.symbol),
          color,
          isStop,
          isDashed: isStop,
          // For drag-to-modify
          orderId: ord.orderId,
          accountId: ordAccountId,
          // Action handlers
          onCancel: () => {
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
          },
          onModify: (newPrice) => {
            const snapped = roundToTick(newPrice, ord.symbol);
            requestConfirmation('modify', {
              orderId: ord.orderId,
              accountId: ordAccountId,
              symbol: normalizeSymbol(ord.symbol),
              side: sideLabel,
              type: typeLabel,
              originalPrice: price,
              newPrice: snapped,
              quantity: qty,
              accountNickname: ordAcctLabel,
            });
          },
        };
      });
  }, [orders, chartSymbol, matchesChart, requestConfirmation]);

  // ── Return data for overlay + confirmation for modal ───────────────

  return {
    positionLines,
    orderLines,
    confirmState,
    handleConfirm,
    handleCancel,
    // Expose helpers for overlay drag math
    roundToTick,
    formatPrice,
  };
};

export default useChartTrading;
