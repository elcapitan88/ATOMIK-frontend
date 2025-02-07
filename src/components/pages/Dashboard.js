// src/components/pages/Dashboard.js
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Box, Flex, Spinner, Text, keyframes } from '@chakra-ui/react';
import Menu from '../layout/Sidebar/Menu';
import TradingViewWidget from '../features/trading/TradingViewWidget';
import TradesTable from '../features/trading/TradesTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useWebSocket from '@/hooks/useWebSocket';
import logger from '@/utils/logger';

const Management = lazy(() => import('../features/trading/Management'));
const OrderControl = lazy(() => import('../features/trading/OrderControl')); 
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));

// Define pulse animation
const pulseKeyframe = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const Dashboard = () => {
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [activeAccountId, setActiveAccountId] = useState(null);
  const pulseAnimation = `${pulseKeyframe} 2s infinite`;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const wsConnection = useWebSocket(activeAccountId, {
    autoConnect: true,
    autoDisconnect: true,
    subscribeToMarketData: true,
    subscribeToAccountUpdates: true,
    onMarketData: (data) => {
      logger.debug('Market data received:', data);
    },
    onAccountUpdate: (update) => {
      logger.debug('Account update received:', update);
    },
    onError: (error) => {
      logger.error('WebSocket error:', error);
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const WebSocketErrorBoundary = ({ children, error }) => {
    if (error) {
      return (
        <Box 
          p={4} 
          bg="red.500" 
          color="white" 
          borderRadius="md"
          position="absolute"
          top={4}
          right={4}
          zIndex={1000}
        >
          WebSocket Error: {error.message}
        </Box>
      );
    }
    return children;
  };

  const renderContent = () => {
    switch (selectedItem) {
      case 'Dashboard':
        return (
          <WebSocketErrorBoundary>
            <Flex position="relative" h="full" p={4} zIndex={2} gap={4}>
              <Flex flexDirection="column" flex={7}>
                {/* Chart container */}
                <Box 
                  h="50%" 
                  maxH="50%" 
                  flex="0 0 50%" 
                  bg="whiteAlpha.100" 
                  borderRadius="xl" 
                  overflow="hidden"
                >
                  <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                    <TradingViewWidget />
                  </Suspense>
                </Box>
                
                {/* Bottom section */}
                <Flex 
                  mt={4} 
                  gap={4} 
                  flex="1"
                  minH="0"
                >
                  {/* TradesTable container */}
                  <Box 
                    flex={1} 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor="whiteAlpha.200" 
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                  >
                    <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                      <TradesTable wsConnection={wsConnection} />
                    </Suspense>
                  </Box>
                  
                  {/* OrderControl container */}
                  <Box 
                    flex="0 0 400px"
                    bg="whiteAlpha.100" 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor="whiteAlpha.200" 
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                  >
                    <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                      <OrderControl wsConnection={wsConnection} />
                    </Suspense>
                  </Box>
                </Flex>
              </Flex>
              
              <Flex flex={3} flexDirection="column" gap={4}>
                <Box flex="0 0 auto">
                  <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                    <Management 
                      wsConnection={wsConnection}
                      onAccountSelect={setActiveAccountId}
                    />
                  </Suspense>
                </Box>
                
                <Box flex={1}>
                  <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                    <StrategyGroups wsConnection={wsConnection} />
                  </Suspense>
                </Box>
              </Flex>
            </Flex>
          </WebSocketErrorBoundary>
        );

      case 'Strategy Builder':
        return (
          <Flex 
            position="relative" 
            h="full" 
            p={4} 
            zIndex={2}
            justify="center"
            align="center"
            direction="column"
            gap={4}
          >
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color="white"
              textShadow="0 0 10px rgba(0, 198, 224, 0.7),
                         0 0 20px rgba(0, 198, 224, 0.5),
                         0 0 30px rgba(0, 198, 224, 0.3)"
              textAlign="center"
              animation={pulseAnimation}
            >
              Coming Soon
            </Text>
            <Text
              fontSize="md"
              color="whiteAlpha.700"
              textAlign="center"
              maxW="400px"
            >
              Our strategy builder is currently under development. 
              Stay tuned for powerful trading strategy creation tools.
            </Text>
          </Flex>
        );

      case 'Marketplace':
        return (
          <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
            <MarketplacePage />
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      <Menu onSelectItem={setSelectedItem} />
      
      <Box flexGrow={1} ml={16}>
        <Box h="100vh" w="full" p={6} overflow="hidden" position="relative">
          <Box 
            position="absolute" 
            inset={0} 
            bgGradient="linear(to-br, blackAlpha.400, blackAlpha.200, blackAlpha.400)" 
            pointerEvents="none"
          />
          <Box 
            position="absolute" 
            inset={0} 
            backdropFilter="blur(16px)" 
            bg="blackAlpha.300"
          />
          <Box 
            position="absolute" 
            inset={0} 
            boxShadow="inset 0 0 15px rgba(0, 0, 0, 0.2)" 
            borderRadius="xl" 
            pointerEvents="none"
          />
          
          <Box position="relative" h="full" zIndex={1}>
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Dashboard;