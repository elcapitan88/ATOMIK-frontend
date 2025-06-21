import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Text, 
  Spinner, 
  Alert, 
  AlertIcon, 
  VStack,
  useToast 
} from '@chakra-ui/react';
import { useOAuth } from '@/hooks/useOAuth';
import useWebSocket from '@/hooks/useWebSocket';
import logger from '@/utils/logger';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { handleCallback } = useOAuth();
  const { connect, status: wsStatus } = useWebSocket('tradovate');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Handle OAuth error from broker
        if (error) {
          throw new Error(`OAuth Error: ${error}`);
        }

        // Validate required parameters
        if (!code) {
          throw new Error('No authorization code provided');
        }

        if (!state) {
          throw new Error('No state parameter provided');
        }

        logger.info('Processing OAuth callback:', { code: code.substring(0, 10), state });
        setStatus('authenticating');

        // Handle OAuth callback
        const response = await handleCallback(code, state);
        logger.info('OAuth callback successful:', response);

        // Validate response
        if (!response || !response.accounts) {
          throw new Error('Invalid response from server');
        }

        setStatus('connecting_websocket');

        // Initialize WebSocket connections for each account
        const wsConnections = await Promise.allSettled(
          response.accounts.map(async (account) => {
            try {
              logger.info(`Initializing WebSocket for account: ${account.account_id}`);
              const connected = await connect(account.account_id);
              
              if (!connected) {
                logger.warn(`Failed to establish WebSocket for account: ${account.account_id}`);
                return false;
              }

              return true;
            } catch (wsError) {
              logger.error(`WebSocket connection error for account ${account.account_id}:`, wsError);
              return false;
            }
          })
        );

        // Check WebSocket connections
        const failedConnections = wsConnections.filter(result => 
          result.status === 'rejected' || !result.value
        ).length;

        if (failedConnections > 0) {
          toast({
            title: "WebSocket Connection Warning",
            description: `Failed to establish WebSocket connection for ${failedConnections} account(s). Real-time updates may be delayed.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }

        setStatus('complete');

        // Check if this OAuth came from Trading Lab
        const tradingLabContext = sessionStorage.getItem('trading_lab_oauth_context');
        const satelliteContext = sessionStorage.getItem('trading_lab_satellite_context');
        
        if (tradingLabContext || satelliteContext) {
          // OAuth initiated from Trading Lab - check for account-first flow
          logger.info('OAuth from Trading Lab - checking flow type');
          
          let parsedContext = null;
          try {
            parsedContext = tradingLabContext ? JSON.parse(tradingLabContext) : null;
          } catch (error) {
            logger.warn('Failed to parse Trading Lab context:', error);
          }
          
          // Check if this is account-first flow that should redirect to strategy selection
          if (parsedContext && parsedContext.flow === 'account_first' && parsedContext.redirect_to === 'strategy_selection') {
            logger.info('OAuth from account-first flow - redirecting to strategy selection');
            
            // Clear the OAuth context since we're handling the redirect
            sessionStorage.removeItem('trading_lab_oauth_context');
            
            setTimeout(() => {
              navigate('/trading-lab', { 
                state: { 
                  oauthSuccess: true,
                  accountConnected: true,
                  accounts: response.accounts,
                  wsStatus: wsStatus,
                  connectionErrors: failedConnections,
                  context: 'core',
                  flow: 'account_first',
                  forceStep: 'strategy_selection' // Force Trading Lab to show strategy selection
                }
              });
            }, 1000);
          } else {
            // Regular Trading Lab OAuth - redirect back to Trading Lab
            logger.info('OAuth from Trading Lab - redirecting back to Trading Lab');
            
            setTimeout(() => {
              navigate('/trading-lab', { 
                state: { 
                  oauthSuccess: true,
                  accountConnected: true,
                  accounts: response.accounts,
                  wsStatus: wsStatus,
                  connectionErrors: failedConnections,
                  context: tradingLabContext ? 'core' : 'satellite'
                }
              });
            }, 1000);
          }
        } else {
          // Regular OAuth - navigate to dashboard
          setTimeout(() => {
            navigate('/dashboard', { 
              state: { 
                accountConnected: true,
                accounts: response.accounts,
                wsStatus: wsStatus,
                connectionErrors: failedConnections
              }
            });
          }, 1000);
        }

      } catch (error) {
        logger.error('OAuth callback processing failed:', error);
        setError(error.message || 'Failed to connect account');
        setStatus('error');

        // Show error toast
        toast({
          title: "Connection Error",
          description: error.message || "Failed to connect trading account",
          status: "error",
          duration: 5000,
          isClosable: true,
        });

        // Check if this OAuth came from Trading Lab for error handling too
        const tradingLabContext = sessionStorage.getItem('trading_lab_oauth_context');
        const satelliteContext = sessionStorage.getItem('trading_lab_satellite_context');
        
        if (tradingLabContext || satelliteContext) {
          // OAuth error from Trading Lab - check for account-first flow
          let parsedContext = null;
          try {
            parsedContext = tradingLabContext ? JSON.parse(tradingLabContext) : null;
          } catch (error) {
            logger.warn('Failed to parse Trading Lab context during error handling:', error);
          }
          
          // Clear OAuth context on error
          sessionStorage.removeItem('trading_lab_oauth_context');
          if (satelliteContext) {
            sessionStorage.removeItem('trading_lab_satellite_context');
          }
          
          // OAuth error from Trading Lab - redirect back to Trading Lab with error
          setTimeout(() => {
            navigate('/trading-lab', { 
              state: { 
                oauthError: true,
                error: error.message || 'Failed to connect account',
                context: tradingLabContext ? 'core' : 'satellite',
                flow: parsedContext?.flow || 'regular'
              }
            });
          }, 3000);
        } else {
          // Regular OAuth error - navigate to dashboard with error state
          setTimeout(() => {
            navigate('/dashboard', { 
              state: { 
                error: error.message || 'Failed to connect account'
              }
            });
          }, 3000);
        }
      }
    };

    processCallback();
  }, [location, navigate, handleCallback, connect, toast, wsStatus]);

  const renderStatus = () => {
    switch (status) {
      case 'processing':
        return 'Processing callback...';
      case 'authenticating':
        return 'Authenticating with broker...';
      case 'connecting_websocket':
        return 'Establishing real-time connection...';
      case 'complete':
        return 'Connection successful!';
      case 'error':
        return 'Connection failed';
      default:
        return 'Processing...';
    }
  };

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh" 
        bg="background"
      >
        <Alert status="error" variant="subtle">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      height="100vh" 
      bg="background"
    >
      <VStack spacing={6}>
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="xl" color="white">
          {renderStatus()}
        </Text>
        {status === 'connecting_websocket' && (
          <Text fontSize="sm" color="whiteAlpha.700">
            This may take a few moments...
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default OAuthCallback;