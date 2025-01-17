// hooks/useOAuth/index.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

export const useOAuth = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    const clearOAuthContext = useCallback(() => {
        sessionStorage.removeItem('oauth_context');
        sessionStorage.removeItem('oauth_return_path');
    }, []);

    const initiateBrokerAuth = useCallback(async (broker, environment) => {
        setIsProcessing(true);
        setError(null);

        try {
            console.log('Initiating OAuth for:', { broker, environment });

            const response = await fetch(`/api/v1/brokers/${broker}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    environment,
                    credentials: {
                        type: 'oauth',
                        environment
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to initiate OAuth');
            }

            console.log('OAuth initiation response:', data);

            if (data?.auth_url) {
                // Store OAuth context
                const oauthContext = {
                    broker,
                    environment,
                    timestamp: Date.now()
                };
                sessionStorage.setItem('oauth_context', JSON.stringify(oauthContext));
                sessionStorage.setItem('oauth_return_path', window.location.pathname);

                // Redirect to authorization URL
                window.location.href = data.auth_url;
            } else {
                throw new Error('No authentication URL received');
            }
        } catch (error) {
            console.error('OAuth initiation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            toast({
                title: "Connection Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsProcessing(false);
        }
    }, [toast]);

    const handleCallback = useCallback(async (code) => {
        setIsProcessing(true);
        setError(null);

        try {
            console.log('Processing OAuth callback:', { code });

            const contextStr = sessionStorage.getItem('oauth_context');
            if (!contextStr) {
                throw new Error('OAuth context not found');
            }

            const context = JSON.parse(contextStr);
            
            if (Date.now() - context.timestamp > 600000) {
                throw new Error('OAuth flow has expired. Please try again.');
            }

            const response = await fetch(`/api/v1/brokers/${context.broker}/callback?code=${code}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to process callback');
            }

            const data = await response.json();
            console.log('OAuth callback response:', data);

            toast({
                title: "Connection Successful",
                description: "Your trading account has been connected.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            clearOAuthContext();

            const returnPath = sessionStorage.getItem('oauth_return_path') || '/dashboard';
            
            const navigationState = {
                accountConnected: true,
                accounts: data?.accounts,
                environment: context.environment
            };

            setTimeout(() => {
                navigate(returnPath, { state: navigationState });
            }, 100);

            return data;

        } catch (error) {
            console.error('OAuth callback error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            
            toast({
                title: "Authentication Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });

            clearOAuthContext();
            navigate('/connect', { state: { error: errorMessage } });
            throw error;

        } finally {
            setIsProcessing(false);
        }
    }, [navigate, toast, clearOAuthContext]);

    return {
        isProcessing,
        error,
        initiateBrokerAuth,
        handleCallback,
        clearOAuthContext
    };
};

export default useOAuth;