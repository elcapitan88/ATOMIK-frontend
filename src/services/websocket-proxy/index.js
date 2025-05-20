// src/services/websocket-proxy/index.js

// WebSocket core
import WebSocketClient from './WebSocketClient';
import webSocketManager, { ConnectionState } from './WebSocketManager';

// Context
import WebSocketContext, { WebSocketProvider, useWebSocketContext } from './contexts/WebSocketContext';

// Hooks
import useWebSocketConnection from './hooks/useWebSocketConnection';
import useWebSocketOrders from './hooks/useWebSocketOrders';
import useWebSocketPositions from './hooks/useWebSocketPositions';
import useWebSocketMarketData from './hooks/useWebSocketMarketData';

export {
  // WebSocket core
  WebSocketClient,
  webSocketManager,
  ConnectionState,
  
  // Context
  WebSocketContext,
  WebSocketProvider,
  useWebSocketContext,
  
  // Hooks
  useWebSocketConnection,
  useWebSocketOrders,
  useWebSocketPositions,
  useWebSocketMarketData
};

// Default export for convenience
export default webSocketManager;