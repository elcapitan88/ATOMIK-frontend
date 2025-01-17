import { useState, useRef, useCallback, useEffect } from 'react';

const useWebSocket = (broker) => {
    const [status, setStatus] = useState('disconnected');
    const wsRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 3;
    const RECONNECT_DELAY = 3000;
    const lastAttemptRef = useRef(Date.now());

    const connect = useCallback(async (accountId) => {
        if (!accountId) return false;
        if (wsRef.current?.readyState === WebSocket.OPEN) return true;
        
        // Add cooldown for reconnection attempts
        const now = Date.now();
        if (now - lastAttemptRef.current < RECONNECT_DELAY) {
            return false;
        }
        lastAttemptRef.current = now;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = process.env.REACT_APP_WS_HOST || window.location.host;
            const wsUrl = `${protocol}//${host}/ws/${broker}/${accountId}?token=${token}`;

            return new Promise((resolve, reject) => {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                const timeout = setTimeout(() => {
                    ws.close();
                    setStatus('disconnected');
                    resolve(false);
                }, 10000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    setStatus('connected');
                    reconnectAttemptsRef.current = 0;
                    resolve(true);
                };

                ws.onclose = () => {
                    setStatus('disconnected');
                    resolve(false);
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('WebSocket connection error:', error);
                    setStatus('disconnected');
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('WebSocket connection error:', error);
            setStatus('disconnected');
            return false;
        }
    }, [broker]);

    const disconnect = useCallback(async (accountId) => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
            setStatus('disconnected');
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        status,
        connect,
        disconnect
    };
};

export default useWebSocket;