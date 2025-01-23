import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define WebSocket states
const WebSocketState = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR'
};

// Define action types
const ActionTypes = {
  SET_CONNECTION_STATE: 'SET_CONNECTION_STATE',
  UPDATE_MARKET_DATA: 'UPDATE_MARKET_DATA',
  UPDATE_ORDER: 'UPDATE_ORDER',
  UPDATE_POSITION: 'UPDATE_POSITION',
  UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  connectionState: WebSocketState.DISCONNECTED,
  marketData: {},
  orders: {},
  positions: {},
  accountData: null,
  error: null,
  lastUpdated: null
};

// Create context
const WebSocketContext = createContext(null);

// Reducer function
const webSocketReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_CONNECTION_STATE:
      return {
        ...state,
        connectionState: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ActionTypes.UPDATE_MARKET_DATA:
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.symbol]: {
            ...action.payload,
            timestamp: new Date().toISOString()
          }
        },
        lastUpdated: new Date().toISOString()
      };
    
    case ActionTypes.UPDATE_ORDER:
      return {
        ...state,
        orders: {
          ...state.orders,
          [action.payload.orderId]: {
            ...action.payload,
            timestamp: new Date().toISOString()
          }
        },
        lastUpdated: new Date().toISOString()
      };
    
    case ActionTypes.UPDATE_POSITION:
      return {
        ...state,
        positions: {
          ...state.positions,
          [action.payload.symbol]: {
            ...action.payload,
            timestamp: new Date().toISOString()
          }
        },
        lastUpdated: new Date().toISOString()
      };
    
    case ActionTypes.UPDATE_ACCOUNT:
      return {
        ...state,
        accountData: {
          ...action.payload,
          timestamp: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        lastUpdated: new Date().toISOString()
      };
    
    default:
      return state;
  }
};

// WebSocket Provider Component
const WebSocketProvider = ({ children, url }) => {
  const [state, dispatch] = useReducer(webSocketReducer, initialState);
  const [ws, setWs] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  const connect = useCallback(() => {
    try {
      dispatch({ type: ActionTypes.SET_CONNECTION_STATE, payload: WebSocketState.CONNECTING });
      
      const websocket = new WebSocket(url);
      
      websocket.onopen = () => {
        dispatch({ type: ActionTypes.SET_CONNECTION_STATE, payload: WebSocketState.CONNECTED });
        setReconnectAttempts(0);
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data, dispatch);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocket.onerror = (error) => {
        dispatch({
          type: ActionTypes.SET_ERROR,
          payload: 'WebSocket connection error'
        });
        dispatch({ type: ActionTypes.SET_CONNECTION_STATE, payload: WebSocketState.ERROR });
      };
      
      websocket.onclose = () => {
        dispatch({ type: ActionTypes.SET_CONNECTION_STATE, payload: WebSocketState.DISCONNECTED });
        attemptReconnect();
      };
      
      setWs(websocket);
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: 'Failed to establish WebSocket connection'
      });
    }
  }, [url]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts < maxReconnectAttempts) {
      dispatch({ type: ActionTypes.SET_CONNECTION_STATE, payload: WebSocketState.RECONNECTING });
      
      setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connect();
      }, reconnectDelay * Math.pow(2, reconnectAttempts)); // Exponential backoff
    } else {
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: 'Maximum reconnection attempts reached'
      });
    }
  }, [reconnectAttempts, connect]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  const sendMessage = useCallback((message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: 'WebSocket is not connected'
      });
    }
  }, [ws]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Provide the WebSocket context
  return (
    <WebSocketContext.Provider value={{ state, dispatch, sendMessage }}>
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
const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Helper function to handle different types of WebSocket messages
const handleWebSocketMessage = (data, dispatch) => {
  switch (data.type) {
    case 'MARKET_DATA':
      dispatch({
        type: ActionTypes.UPDATE_MARKET_DATA,
        payload: data.payload
      });
      break;
    
    case 'ORDER_UPDATE':
      dispatch({
        type: ActionTypes.UPDATE_ORDER,
        payload: data.payload
      });
      break;
    
    case 'POSITION_UPDATE':
      dispatch({
        type: ActionTypes.UPDATE_POSITION,
        payload: data.payload
      });
      break;
    
    case 'ACCOUNT_UPDATE':
      dispatch({
        type: ActionTypes.UPDATE_ACCOUNT,
        payload: data.payload
      });
      break;
    
    default:
      console.warn('Unknown message type:', data.type);
  }
};

export {
  WebSocketProvider,
  useWebSocket,
  WebSocketState,
  ActionTypes
};

// Example usage component
const WebSocketStatus = () => {
  const { state } = useWebSocket();
  
  const getStatusColor = () => {
    switch (state.connectionState) {
      case WebSocketState.CONNECTED:
        return 'text-green-500';
      case WebSocketState.CONNECTING:
      case WebSocketState.RECONNECTING:
        return 'text-yellow-500';
      case WebSocketState.ERROR:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className="p-4 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">WebSocket Status</h3>
      <div className={`flex items-center ${getStatusColor()}`}>
        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
        {state.connectionState}
      </div>
      {state.lastUpdated && (
        <div className="text-sm text-gray-500 mt-2">
          Last Updated: {new Date(state.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;