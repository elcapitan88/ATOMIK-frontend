// src/hooks/useWebSocket.js
import { useCallback, useEffect, useState, useRef } from 'react';
import { webSocketManager } from '@/services/websocket/webSocketManager';
import { CONNECTION_STATE } from '@/services/Config/wsConfig';
import logger from '@/utils/logger';

const HEARTBEAT_INTERVAL = 2500;

const useWebSocket = (accountId, options = {}) => {
    const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
    const [error, setError] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const heartbeatRef = useRef(null);
    const lastHeartbeatRef = useRef(Date.now());

    // Define stopHeartbeat first
    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            cancelAnimationFrame(heartbeatRef.current);
            heartbeatRef.current = null;
            logger.debug(`Stopped heartbeat monitoring for account ${accountId}`);
        }
    }, [accountId]);

    // Then define startHeartbeat
    const startHeartbeat = useCallback(() => {
        // Clear any existing heartbeat first
        if (heartbeatRef.current) {
            stopHeartbeat();
        }

        const sendHeartbeat = () => {
            try {
                if (connectionState === CONNECTION_STATE.CONNECTED) {
                    webSocketManager.send(accountId, 'heartbeat', '[]');
                    lastHeartbeatRef.current = Date.now();
                    logger.debug(`Heartbeat sent for account ${accountId}`);
                }
            } catch (err) {
                logger.error(`Failed to send heartbeat for ${accountId}:`, err);
            }
        };

        const heartbeatLoop = () => {
            const now = Date.now();
            const elapsed = now - lastHeartbeatRef.current;
            
            if (elapsed >= HEARTBEAT_INTERVAL) {
                sendHeartbeat();
            }
            
            heartbeatRef.current = requestAnimationFrame(heartbeatLoop);
        };

        // Send initial heartbeat
        sendHeartbeat();
        
        // Start the loop
        heartbeatRef.current = requestAnimationFrame(heartbeatLoop);
        logger.info(`Started heartbeat monitoring for account ${accountId}`);
    }, [accountId, connectionState, stopHeartbeat]);


    const connect = useCallback(async () => {
        if (!accountId) {
            setError('Account ID is required');
            return false;
        }

        try {
            logger.info(`Attempting to connect account ${accountId}`);
            const connected = await webSocketManager.connect(accountId);
            
            if (!connected) {
                setError('Failed to establish connection');
                return false;
            }
            
            startHeartbeat();
            logger.info(`Successfully connected account ${accountId}`);
            return true;
        } catch (err) {
            logger.error(`Connection error for account ${accountId}:`, err);
            setError(err.message);
            return false;
        }
    }, [accountId, startHeartbeat]);

    const disconnect = useCallback(() => {
        if (accountId) {
            logger.info(`Disconnecting account ${accountId}`);
            stopHeartbeat();
            webSocketManager.disconnect(accountId);
        }
    }, [accountId, stopHeartbeat]);

    useEffect(() => {
        if (!accountId) return;

        const statusSub = webSocketManager.onStatus()
            .subscribe({
                next: (update) => {
                    if (update.accountId === accountId) {
                        logger.debug(`Connection status update for ${accountId}:`, update.status);
                        setConnectionState(update.status);
                        
                        if (update.status === CONNECTION_STATE.CONNECTED) {
                            startHeartbeat();
                        } else {
                            stopHeartbeat();
                        }
                        
                        if (update.status === CONNECTION_STATE.ERROR) {
                            setError('Connection error occurred');
                        } else {
                            setError(null);
                        }
                    }
                },
                error: (err) => {
                    logger.error(`Status subscription error for ${accountId}:`, err);
                    setError(err.message);
                    stopHeartbeat();
                }
            });

        const messageSub = webSocketManager.onMessage()
            .subscribe({
                next: (message) => {
                    if (message.accountId === accountId) {
                        setLastMessage(message);
                        options.onMessage?.(message);
                    }
                },
                error: (err) => {
                    logger.error(`Message subscription error for ${accountId}:`, err);
                    setError(err.message);
                }
            });

        // Market data subscription
        let marketDataSub;
        if (options.subscribeToMarketData) {
            marketDataSub = webSocketManager.onMarketData()
                .subscribe({
                    next: (data) => {
                        if (data.accountId === accountId) {
                            options.onMarketData?.(data);
                        }
                    },
                    error: (err) => {
                        logger.error(`Market data subscription error for ${accountId}:`, err);
                        setError(err.message);
                    }
                });
        }

        // Account updates subscription
        let accountSub;
        if (options.subscribeToAccountUpdates) {
            accountSub = webSocketManager.onAccountUpdates()
                .subscribe({
                    next: (update) => {
                        if (update.accountId === accountId) {
                            options.onAccountUpdate?.(update);
                        }
                    },
                    error: (err) => {
                        logger.error(`Account subscription error for ${accountId}:`, err);
                        setError(err.message);
                    }
                });
        }

        // Auto-connect if specified
        if (options.autoConnect) {
            connect();
        }

        // Cleanup subscriptions and heartbeat
        return () => {
            logger.debug(`Cleaning up WebSocket resources for ${accountId}`);
            statusSub.unsubscribe();
            messageSub.unsubscribe();
            if (marketDataSub) marketDataSub.unsubscribe();
            if (accountSub) accountSub.unsubscribe();
            stopHeartbeat();
            
            if (options.autoDisconnect) {
                disconnect();
            }
        };
    }, [accountId, connect, disconnect, options, startHeartbeat, stopHeartbeat]);

    const sendMessage = useCallback((type, data) => {
        if (!accountId || connectionState !== CONNECTION_STATE.CONNECTED) {
            return false;
        }

        try {
            webSocketManager.send(accountId, type, data);
            return true;
        } catch (err) {
            logger.error(`Error sending message for ${accountId}:`, err);
            setError(err.message);
            return false;
        }
    }, [accountId, connectionState]);

    const getConnectionInfo = useCallback(() => {
        if (!accountId) return null;
        return webSocketManager.getConnectionInfo(accountId);
    }, [accountId]);

    return {
        connectionState,
        error,
        lastMessage,
        isConnected: connectionState === CONNECTION_STATE.CONNECTED,
        connect,
        disconnect,
        sendMessage,
        getConnectionInfo,
        clearError: () => setError(null)
    };
};

export default useWebSocket;