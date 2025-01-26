// src/components/pages/Dashboard.js
import React, { useState, lazy, Suspense } from 'react';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import Menu from '../layout/Sidebar/Menu';
import TradingViewWidget from '../features/trading/TradingViewWidget';
import TradesTable from '../features/trading/TradesTable';
import useWebSocket from '@/hooks/useWebSocket';
import logger from '@/utils/logger';

const Management = lazy(() => import('../features/trading/Management'));
const OrderControl = lazy(() => import('../features/trading/OrderControl')); 
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));

const Dashboard = () => {
 const [selectedItem, setSelectedItem] = useState('Dashboard');
 const [activeAccountId, setActiveAccountId] = useState(null);

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
               <Box h="60%" bg="whiteAlpha.100" borderRadius="xl" overflow="hidden">
                 <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                   <TradingViewWidget />
                 </Suspense>
               </Box>
               
               <Flex mt={4} gap={4} flex={1}>
                 <Box flex={1}>
                   <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
                     <TradesTable wsConnection={wsConnection} />
                   </Suspense>
                 </Box>
                 
                 <Box flex="0 0 400px">
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
         <Flex position="relative" h="full" p={4} zIndex={2}>
           <Box w="full" h="full" bg="whiteAlpha.100" borderRadius="xl" boxShadow="lg" overflow="hidden">
             <Suspense fallback={<Spinner size="xl" color="blue.500" />}>
               <StrategyGroups wsConnection={wsConnection} />
             </Suspense>
           </Box>
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