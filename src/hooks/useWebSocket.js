// src/hooks/useWebSocket.js
import { useCallback, useEffect, useState } from 'react';
import { webSocketManager } from '@/services/websocket/webSocketManager';
import { CONNECTION_STATE } from '@/services/Config/wsConfig';
import logger from '@/utils/logger';

const useWebSocket = (accountId, options = {}) => {
    const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
    const [error, setError] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);

    // Connection handling
    const connect = useCallback(async () => {
        if (!accountId) {
            setError('Account ID is required');
            return false;
        }

        try {
            const connected = await webSocketManager.connect(accountId);
            if (!connected) {
                setError('Failed to establish connection');
                return false;
            }
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    }, [accountId]);

    const disconnect = useCallback(() => {
        if (accountId) {
            webSocketManager.disconnect(accountId);
        }
    }, [accountId]);

    // Set up subscriptions
    useEffect(() => {
        if (!accountId) return;

        const statusSub = webSocketManager.onStatus()
            .subscribe({
                next: (update) => {
                    if (update.accountId === accountId) {
                        setConnectionState(update.status);
                        if (update.status === CONNECTION_STATE.ERROR) {
                            setError('Connection error occurred');
                        } else {
                            setError(null);
                        }
                    }
                },
                error: (err) => {
                    logger.error('Status subscription error:', err);
                    setError(err.message);
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
                    logger.error('Message subscription error:', err);
                    setError(err.message);
                }
            });

        // Optional market data subscription
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
                        logger.error('Market data subscription error:', err);
                        setError(err.message);
                    }
                });
        }

        // Optional account updates subscription
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
                        logger.error('Account subscription error:', err);
                        setError(err.message);
                    }
                });
        }

        // Auto-connect if specified
        if (options.autoConnect) {
            connect();
        }

        // Cleanup subscriptions
        return () => {
            statusSub.unsubscribe();
            messageSub.unsubscribe();
            if (marketDataSub) marketDataSub.unsubscribe();
            if (accountSub) accountSub.unsubscribe();
            
            // Disconnect if autoDisconnect is true
            if (options.autoDisconnect) {
                disconnect();
            }
        };
    }, [accountId, connect, disconnect, options]);

    // Additional utility methods
    const sendMessage = useCallback((type, data) => {
        if (!accountId || connectionState !== CONNECTION_STATE.CONNECTED) {
            return false;
        }

        try {
            webSocketManager.send(accountId, type, data);
            return true;
        } catch (err) {
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

