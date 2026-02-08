import { DATAHUB_URL, DATAHUB_API_KEY, getNextBarTime, resolutionToMs } from './helpers';

// Shared WebSocket instance
let socket = null;
let connectAttempt = 0;
let reconnectTimer = null;
let keepaliveTimer = null;

const MAX_RECONNECT_ATTEMPTS = 20;
const KEEPALIVE_INTERVAL_MS = 30000;
const FLUSH_INTERVAL_MS = 100;

// channelToSubscription: Map<string, { handlers: Map<string, Function>, lastBar: object, resolution: string, symbol: string }>
const channelToSubscription = new Map();

// Pending updates buffer: Map<channelKey, bar>
const pendingUpdates = new Map();
let flushTimer = null;

function getWsUrl() {
  const base = DATAHUB_URL.replace(/^http/, 'ws');
  const params = DATAHUB_API_KEY ? `?api_key=${DATAHUB_API_KEY}` : '';
  return `${base}/ws${params}`;
}

function startFlushLoop() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    for (const [channelKey, bar] of pendingUpdates) {
      const sub = channelToSubscription.get(channelKey);
      if (!sub) continue;
      for (const handler of sub.handlers.values()) {
        handler({ ...bar });
      }
    }
    pendingUpdates.clear();
  }, FLUSH_INTERVAL_MS);
}

function stopFlushLoop() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  pendingUpdates.clear();
}

function startKeepalive() {
  stopKeepalive();
  keepaliveTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
    }
  }, KEEPALIVE_INTERVAL_MS);
}

function stopKeepalive() {
  if (keepaliveTimer) {
    clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
}

function getBackoffDelay(attempt) {
  // 1s, 2s, 4s, 8s, 16s, 30s max
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

function handleTradeMessage(data) {
  const { symbol, price, size, timestamp } = data;
  const tradeTimeMs = new Date(timestamp).getTime();

  for (const [channelKey, sub] of channelToSubscription) {
    if (sub.symbol !== symbol) continue;
    if (!sub.lastBar) continue;

    const nextBarTime = getNextBarTime(sub.lastBar.time, sub.resolution);

    let updatedBar;
    if (tradeTimeMs >= nextBarTime) {
      // New bar
      const newBarTime = nextBarTime + Math.floor((tradeTimeMs - nextBarTime) / resolutionToMs(sub.resolution)) * resolutionToMs(sub.resolution);
      updatedBar = {
        time: newBarTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: size || 0,
      };
    } else {
      // Update current bar
      updatedBar = {
        ...sub.lastBar,
        high: Math.max(sub.lastBar.high, price),
        low: Math.min(sub.lastBar.low, price),
        close: price,
        volume: (sub.lastBar.volume || 0) + (size || 0),
      };
    }

    sub.lastBar = updatedBar;
    pendingUpdates.set(channelKey, updatedBar);
  }
}

function onMessage(event) {
  let msg;
  try {
    msg = JSON.parse(event.data);
  } catch {
    return;
  }

  if (msg.type === 'trade' && msg.data) {
    handleTradeMessage(msg.data);
  }
}

function onOpen() {
  console.log('[Streaming] WebSocket connected');
  connectAttempt = 0;
  startKeepalive();
  startFlushLoop();

  // Re-subscribe all active channels
  for (const [, sub] of channelToSubscription) {
    sendSubscribe(sub.symbol);
  }
}

function onClose() {
  console.log('[Streaming] WebSocket closed');
  stopKeepalive();
  scheduleReconnect();
}

function onError(err) {
  console.error('[Streaming] WebSocket error:', err);
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  if (channelToSubscription.size === 0) return;
  if (connectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[Streaming] Max reconnect attempts reached');
    return;
  }

  const delay = getBackoffDelay(connectAttempt);
  console.log(`[Streaming] Reconnecting in ${delay}ms (attempt ${connectAttempt + 1})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectAttempt++;
    createSocket();
  }, delay);
}

function createSocket() {
  if (socket) {
    socket.onopen = null;
    socket.onclose = null;
    socket.onmessage = null;
    socket.onerror = null;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    socket = null;
  }

  const url = getWsUrl();
  console.log('[Streaming] Connecting to DataHub WebSocket');
  socket = new WebSocket(url);
  socket.onopen = onOpen;
  socket.onclose = onClose;
  socket.onmessage = onMessage;
  socket.onerror = onError;
}

function ensureSocket() {
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
    connectAttempt = 0;
    createSocket();
  }
}

function sendSubscribe(symbol) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      symbols: [symbol],
    }));
  }
}

function sendUnsubscribe(symbol) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'unsubscribe',
      symbols: [symbol],
    }));
  }
}

function getChannelKey(symbol, resolution) {
  return `${symbol}_${resolution}`;
}

// Check if any subscription is still using this symbol
function isSymbolInUse(symbol) {
  for (const sub of channelToSubscription.values()) {
    if (sub.symbol === symbol) return true;
  }
  return false;
}

export function subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, lastBar) {
  const symbol = symbolInfo.ticker || symbolInfo.name;
  const channelKey = getChannelKey(symbol, resolution);

  let sub = channelToSubscription.get(channelKey);
  if (!sub) {
    sub = {
      handlers: new Map(),
      lastBar: lastBar ? { ...lastBar } : null,
      resolution,
      symbol,
    };
    channelToSubscription.set(channelKey, sub);
  }

  sub.handlers.set(subscriberUID, onRealtimeCallback);

  // Update lastBar if provided and we don't have one yet
  if (lastBar && !sub.lastBar) {
    sub.lastBar = { ...lastBar };
  }

  ensureSocket();
  sendSubscribe(symbol);
}

export function unsubscribeFromStream(subscriberUID) {
  for (const [channelKey, sub] of channelToSubscription) {
    if (!sub.handlers.has(subscriberUID)) continue;

    sub.handlers.delete(subscriberUID);

    if (sub.handlers.size === 0) {
      const symbol = sub.symbol;
      channelToSubscription.delete(channelKey);
      pendingUpdates.delete(channelKey);

      // Only unsubscribe from DataHub if no other channel uses this symbol
      if (!isSymbolInUse(symbol)) {
        sendUnsubscribe(symbol);
      }
    }

    break;
  }

  // Close socket if no subscriptions remain
  if (channelToSubscription.size === 0) {
    stopFlushLoop();
    stopKeepalive();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.onclose = null; // prevent reconnect on intentional close
      socket.close();
      socket = null;
    }
  }
}
