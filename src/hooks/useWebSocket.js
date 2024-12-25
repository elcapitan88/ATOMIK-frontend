// src/hooks/useWebSocket.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { Subject } from 'rxjs';
import axiosInstance from '@/services/axiosConfig';

const useWebSocket = (broker, accountId) => {
    // State management
    const [status, setStatus] = useState('disconnected');
    const [hasActiveAccounts, setHasActiveAccounts] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState(null);
    const [positions, setPositions] = useState([]);
    const [accountInfo, setAccountInfo] = useState(null);
    
    // References
    const ws = useRef(null);
    const messageSubject = useRef(new Subject());
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef(null);
    const heartbeatInterval = useRef(null);
    const connectionTimeout = useRef(null);

    // Constants
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 1000;
    const HEARTBEAT_INTERVAL = 15000;
    const CONNECTION_TIMEOUT = 5000;

    const toast = useToast();

    const checkAccountAccess = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/api/tradovate/fetch-accounts/');
            const activeAccounts = response.data.filter(account => 
                account.active && account.status === 'active' && !account.is_token_expired
            );
            setHasActiveAccounts(activeAccounts.length > 0);
            if (activeAccounts.length > 0) {
                setAccountInfo(activeAccounts);
            }
            return activeAccounts.length > 0;
        } catch (error) {
            console.error('Error checking account access:', error);
            return false;
        } finally {
            setIsChecking(false);
        }
    }, []);

    const handleError = useCallback((message) => {
        console.error('WebSocket error:', message);
        setError(message);
        setStatus('error');
        toast({
            title: "Connection Error",
            description: message,
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    }, [toast]);

    const startHeartbeat = useCallback(() => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
        }

        heartbeatInterval.current = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, HEARTBEAT_INTERVAL);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    }, []);

    const cleanupConnection = useCallback(() => {
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }
        stopHeartbeat();
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
    }, [stopHeartbeat]);

    const setupWebSocket = useCallback(() => {
        if (!ws.current) return;

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setStatus('connected');
            reconnectAttempts.current = 0;
            startHeartbeat();

            if (connectionTimeout.current) {
                clearTimeout(connectionTimeout.current);
                connectionTimeout.current = null;
            }

            // Send initial authentication message
            ws.current.send(JSON.stringify({
                type: 'authenticate',
                accountId: accountId || 'all'
            }));
        };

        ws.current.onclose = () => {
            console.log('WebSocket closed');
            setStatus('disconnected');
            stopHeartbeat();
            handleReconnect();
        };

        ws.current.onerror = (event) => {
            console.error('WebSocket error:', event);
            handleError('Connection error occurred');
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }, [accountId, startHeartbeat, stopHeartbeat, handleError]);

    const handleMessage = useCallback((message) => {
        switch (message.type) {
            case 'position_update':
                setPositions(message.data);
                break;
                
            case 'account_update':
                setAccountInfo(message.data);
                break;
                
            case 'error':
                handleError(message.message);
                break;
                
            case 'heartbeat_response':
                // Handle heartbeat response
                break;
                
            default:
                messageSubject.current.next(message);
        }
    }, [handleError]);

    const handleReconnect = useCallback(() => {
        if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            handleError('Maximum reconnection attempts reached');
            return;
        }

        const delay = RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts.current);
        console.log(`Reconnecting in ${delay}ms, attempt ${reconnectAttempts.current + 1}`);

        reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
        }, delay);
    }, []);

    const connect = useCallback(async () => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        try {
            const hasAccess = await checkAccountAccess();
            if (!hasAccess) {
                handleError('No active trading accounts found');
                return;
            }

            cleanupConnection();

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const accountPath = accountId || 'all';
            const wsUrl = `${protocol}//${host}/ws/${broker}/${accountPath}/`;

            console.log('Connecting to WebSocket:', wsUrl);
            ws.current = new WebSocket(wsUrl);
            
            connectionTimeout.current = setTimeout(() => {
                if (ws.current?.readyState !== WebSocket.OPEN) {
                    cleanupConnection();
                    handleError('Connection timeout');
                }
            }, CONNECTION_TIMEOUT);

            setupWebSocket();
        } catch (error) {
            console.error('Connection error:', error);
            handleError('Failed to establish connection');
        }
    }, [broker, accountId, checkAccountAccess, cleanupConnection, setupWebSocket, handleError]);

    const sendMessage = useCallback((message) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
            return true;
        }
        return false;
    }, []);

    const subscribeToMarketData = useCallback((symbols) => {
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }
        return sendMessage({
            type: 'subscribe_market_data',
            symbols: symbols
        });
    }, [sendMessage]);

    const unsubscribeFromMarketData = useCallback((symbols) => {
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }
        return sendMessage({
            type: 'unsubscribe_market_data',
            symbols: symbols
        });
    }, [sendMessage]);

    useEffect(() => {
        connect();

        return () => {
            cleanupConnection();
        };
    }, [connect, cleanupConnection]);

    return {
        status,
        hasActiveAccounts,
        isChecking,
        error,
        positions,
        accountInfo,
        sendMessage,
        subscribeToMarketData,
        unsubscribeFromMarketData,
        connect
    };
};

export default useWebSocket;