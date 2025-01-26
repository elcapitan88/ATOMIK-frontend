import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  useRef,
  useMemo 
} from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logger from '@/utils/logger';

// WebSocket states
export const WebSocketState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

// Action types
const ActionTypes = {
  UPDATE_CONNECTION: 'UPDATE_CONNECTION',
  UPDATE_MARKET_DATA: 'UPDATE_MARKET_DATA',
  UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  INCREMENT_RECONNECT: 'INCREMENT_RECONNECT',
  RESET_RECONNECT: 'RESET_RECONNECT'
};

// Initial state
const initialState = {
  connections: new Map(),
  marketData: new Map(),
  accountData: new Map(),
  error: null,
  reconnectAttempts: 0,
  lastHeartbeat: null
};

// Create context
const WebSocketContext = createContext(null);

// Reducer function
const webSocketReducer = (state, action) => {
  switch (action.type) {
      case ActionTypes.UPDATE_CONNECTION: {
          const newConnections = new Map(state.connections);
          newConnections.set(action.payload.accountId, {
              status: action.payload.status,
              timestamp: Date.now()
          });
          return {
              ...state,
              connections: newConnections
          };
      }

      case ActionTypes.UPDATE_MARKET_DATA: {
          const newMarketData = new Map(state.marketData);
          newMarketData.set(action.payload.symbol, {
              ...action.payload,
              timestamp: Date.now()
          });
          return {
              ...state,
              marketData: newMarketData
          };
      }

      case ActionTypes.UPDATE_ACCOUNT: {
          const newAccountData = new Map(state.accountData);
          newAccountData.set(action.payload.accountId, {
              ...action.payload,
              timestamp: Date.now()
          });
          return {
              ...state,
              accountData: newAccountData
          };
      }

      case ActionTypes.SET_ERROR:
          return {
              ...state,
              error: action.payload
          };

      case ActionTypes.CLEAR_ERROR:
          return {
              ...state,
              error: null
          };

      case ActionTypes.INCREMENT_RECONNECT:
          return {
              ...state,
              reconnectAttempts: state.reconnectAttempts + 1
          };

      case ActionTypes.RESET_RECONNECT:
          return {
              ...state,
              reconnectAttempts: 0
          };

      default:
          return state;
  }
};

// WebSocket Provider Component
export const WebSocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(webSocketReducer, initialState);
  const wsConnections = useRef(new Map());
  const heartbeatIntervals = useRef(new Map());

  const validateConnection = useCallback(async (token) => {
      try {
          const response = await fetch(
              `${process.env.REACT_APP_API_URL}/api/v1/ws/test?token=${token}`
          );
          const data = await response.json();
          logger.info('Connection validation:', data);
          return data.valid;
      } catch (error) {
          logger.error('Validation error:', error);
          return false;
      }
  }, []);

  const handleWebSocketError = useCallback((accountId, error) => {
      logger.error(`WebSocket error for account ${accountId}:`, error);
      dispatch({
          type: ActionTypes.SET_ERROR,
          payload: 'Connection error occurred'
      });
      dispatch({
          type: ActionTypes.UPDATE_CONNECTION,
          payload: { accountId, status: WebSocketState.ERROR }
      });
  }, []);

  const setupHeartbeat = useCallback((ws, accountId) => {
      if (heartbeatIntervals.current.has(accountId)) {
          clearInterval(heartbeatIntervals.current.get(accountId));
      }

      const intervalId = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
              ws.send('[]');
          }
      }, 30000);

      heartbeatIntervals.current.set(accountId, intervalId);

      return () => {
          clearInterval(intervalId);
          heartbeatIntervals.current.delete(accountId);
      };
  }, []);

  const clearHeartbeat = useCallback((accountId) => {
      if (heartbeatIntervals.current.has(accountId)) {
          clearInterval(heartbeatIntervals.current.get(accountId));
          heartbeatIntervals.current.delete(accountId);
      }
  }, []);

  const createWebSocket = useCallback(async (accountId) => {
      try {
          const token = localStorage.getItem('access_token');
          if (!token) {
              dispatch({
                  type: ActionTypes.SET_ERROR,
                  payload: 'No authentication token found'
              });
              return null;
          }

          const wsUrl = `${process.env.REACT_APP_WS_HOST}/ws/tradovate/${accountId}?token=${token}`;
          console.log('Connecting to:', wsUrl);

          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
              console.log(`WebSocket connected for account ${accountId}`);
              dispatch({
                  type: ActionTypes.UPDATE_CONNECTION,
                  payload: { accountId, status: WebSocketState.CONNECTED }
              });
          };

          ws.onclose = (event) => {
              console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
              dispatch({
                  type: ActionTypes.UPDATE_CONNECTION,
                  payload: { accountId, status: WebSocketState.DISCONNECTED }
              });
          };

          ws.onerror = (error) => {
              console.error('WebSocket error:', error);
          };

          return ws;
      } catch (error) {
          console.error('WebSocket creation error:', error);
          return null;
      }
  }, []);

  const connect = useCallback(async (accountId) => {
      if (!accountId) {
          dispatch({
              type: ActionTypes.SET_ERROR,
              payload: 'Account ID is required'
          });
          return;
      }

      const existingWs = wsConnections.current.get(accountId);
      if (existingWs) {
          existingWs.close();
          wsConnections.current.delete(accountId);
      }

      const ws = await createWebSocket(accountId);
      if (ws) {
          wsConnections.current.set(accountId, ws);
          dispatch({
              type: ActionTypes.UPDATE_CONNECTION,
              payload: { accountId, status: WebSocketState.CONNECTING }
          });
      }
  }, [createWebSocket]);

  const disconnect = useCallback((accountId) => {
      const ws = wsConnections.current.get(accountId);
      if (ws) {
          clearHeartbeat(accountId);
          ws.close();
          wsConnections.current.delete(accountId);
          dispatch({
              type: ActionTypes.UPDATE_CONNECTION,
              payload: { accountId, status: WebSocketState.DISCONNECTED }
          });
      }
  }, [clearHeartbeat]);

  useEffect(() => {
      return () => {
          wsConnections.current.forEach((ws, accountId) => {
              clearHeartbeat(accountId);
              ws.close();
          });
          wsConnections.current.clear();
      };
  }, [clearHeartbeat]);

  const contextValue = useMemo(() => ({
      state,
      connect,
      disconnect,
      getConnectionStatus: (accountId) => 
          state.connections.get(accountId)?.status || WebSocketState.DISCONNECTED,
      getMarketData: (symbol) => state.marketData.get(symbol),
      getAccountData: (accountId) => state.accountData.get(accountId),
      clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR })
  }), [state, connect, disconnect]);

  return (
      <WebSocketContext.Provider value={contextValue}>
          {state.error && (
              <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{state.error}</AlertDescription>
              </Alert>
          )}
          {children}
      </WebSocketContext.Provider>
  );
};

// Custom hook for using WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
      throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;