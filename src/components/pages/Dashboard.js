// src/components/pages/Dashboard.js
import React, { useState, lazy, Suspense } from 'react';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import Menu from '../layout/Sidebar/Menu';
import TradingViewWidget from '../features/trading/TradingViewWidget';
import TradesTable from '../features/trading/TradesTable';

// Lazy loaded components
const Management = lazy(() => import('../features/trading/Management'));
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));


const Dashboard = () => {
  const [selectedItem, setSelectedItem] = useState('Dashboard');

  const renderContent = () => {
    switch (selectedItem) {
      case 'Dashboard':
        return (
          <Flex position="relative" h="full" p={4} zIndex={2} gap={4}>
            <Flex flexDirection="column" flex={7}>
              {/* Trading chart */}
              <Box h="60%" bg="whiteAlpha.100" borderRadius="xl" overflow="hidden">
                <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                  <TradingViewWidget />
                </Suspense>
              </Box>
              
              {/* Trades table */}
              <Box mt={4} flex={1}>
                <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                  <TradesTable />
                </Suspense>
              </Box>
            </Flex>
            
            {/* Right sidebar */}
            <Flex flex={3} flexDirection="column" gap={4}>
              {/* Account management */}
              <Box flex="0 0 auto">
                <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                  <Management />
                </Suspense>
              </Box>
              
              {/* Strategy groups */}
              <Box flex={1}>
                <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                  <StrategyGroups />
                </Suspense>
              </Box>
            </Flex>
          </Flex>
        );

      case 'Strategies':
        return (
          <Flex position="relative" h="full" p={4} zIndex={2}>
            <Box 
              w="full" 
              h="full" 
              bg="whiteAlpha.100" 
              borderRadius="xl" 
              boxShadow="lg" 
              overflow="hidden"
            >
              <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                <StrategyGroups />
              </Suspense>
            </Box>
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      {/* Left sidebar menu */}
      <Menu onSelectItem={setSelectedItem} />
      
      {/* Main content area */}
      <Box flexGrow={1} ml={16}>
        <Box h="100vh" w="full" p={6} overflow="hidden" position="relative">
          {/* Background effects */}
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
          
          {/* Main content */}
          <Box position="relative" h="full" zIndex={1}>
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Dashboard;