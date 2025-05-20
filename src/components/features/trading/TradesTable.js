// src/components/features/trading/TradesTable.js
import React, { useState, lazy, Suspense, useCallback } from 'react';
import {
  Box, 
  Flex,
  useDisclosure,
  Button,
  HStack,
  Text,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
} from '@chakra-ui/react';
import WebhooksView from '@/components/features/trading/WebhooksView';
import WebhookModal from '../webhooks/WebhookModal';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { useTradeData } from '@/hooks/useTradeData';

// Use lazy loading to break circular dependencies
const LiveTradesView = lazy(() => import('./LiveTradesView'));
const HistoricalTradesView = lazy(() => import('./HistoricalTradesView'));

// Loading component
const LoadingFallback = () => (
  <Flex justify="center" align="center" h="100%" w="100%">
    <Spinner size="xl" color="#00C6E0" />
  </Flex>
);

const TradesTable = () => {
  const [webhooksHandler, setWebhooksHandler] = useState(null);
  const toast = useToast();
  
  // Tab states
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const [tradesTabIndex, setTradesTabIndex] = useState(0);
  
  // Get trade data from our custom hook - we'll only initialize it once
  // even though it's used in two components
  const { refreshData } = useTradeData();
  
  // Modal control - only for webhook creation
  const {
    isOpen: isWebhookModalOpen,
    onOpen: onWebhookModalOpen,
    onClose: onWebhookModalClose
  } = useDisclosure();

  // Function to refresh data manually
  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Handler for webhook creation
  const handleCreateWebhook = async (webhookData) => {
    try {
      console.log('Creating webhook...', webhookData);
      await webhookApi.generateWebhook(webhookData);
      
      console.log('Webhook created, handler:', webhooksHandler);
      if (webhooksHandler?.refreshData) {
        console.log('Refreshing webhooks...');
        await webhooksHandler.refreshData();
      } else {
        console.warn('No refresh handler available');
      }

      toast({
        title: "Webhook Created",
        description: "Your webhook has been generated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onWebhookModalClose();
    } catch (error) {
      console.error('Webhook creation error:', error);
      toast({
        title: "Error Creating Webhook",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle main tab change
  const handleMainTabChange = (index) => {
    setMainTabIndex(index);
  };

  // Handle trades tab change
  const handleTradesTabChange = (index) => {
    setTradesTabIndex(index);
    
    // Refresh data when switching tabs to ensure fresh data
    if (index === 0 || index === 1) {
      handleRefresh();
    }
  };

  return (
    <Box 
      h="full"
      bg="#121212" 
      borderRadius="xl" 
      borderWidth="1px" 
      borderColor="rgba(255, 255, 255, 0.1)" 
      boxShadow="lg"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Tabs 
        variant="unstyled" 
        w="100%" 
        index={mainTabIndex} 
        onChange={handleMainTabChange}
        display="flex"
        flexDirection="column"
        height="100%"
        colorScheme="teal"
      >
        <Flex p={4} borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.1)" justifyContent="space-between">
          <TabList 
            bg="rgba(0, 0, 0, 0.3)"
            borderRadius="md"
            p="2px"
          >
            <Tab 
              _selected={{ 
                color: "white", 
                bg: "rgba(255, 255, 255, 0.1)",
                fontWeight: "medium"
              }}
              color="rgba(255, 255, 255, 0.6)"
              borderRadius="md"
              px={4}
              py={1}
              fontSize="sm"
            >
              Trades
            </Tab>
            <Tab 
              _selected={{ 
                color: "white", 
                bg: "rgba(255, 255, 255, 0.1)",
                fontWeight: "medium"
              }}
              color="rgba(255, 255, 255, 0.6)"
              borderRadius="md"
              px={4}
              py={1}
              fontSize="sm"
            >
              Webhooks
            </Tab>
          </TabList>
          
          {/* Only show in Webhooks tab (index 1) */}
          <Box>
            {mainTabIndex === 1 && (
              <Button
                bg="transparent"
                color="white"
                fontWeight="medium"
                fontSize="sm"
                borderWidth={1}
                borderColor="#00C6E0"
                onClick={onWebhookModalOpen}
                _hover={{ bg: 'rgba(0, 198, 224, 0.1)' }}
                _active={{ bg: 'rgba(0, 198, 224, 0.2)' }}
                h="32px"
              >
                Generate Webhook
              </Button>
            )}
          </Box>
        </Flex>

        <TabPanels flex="1" overflow="hidden">
          {/* Trades Tab Panel */}
          <TabPanel h="100%" p={0}>
            <Tabs 
              variant="unstyled" 
              size="sm" 
              w="100%" 
              h="100%" 
              index={tradesTabIndex}
              onChange={handleTradesTabChange}
              display="flex"
              flexDirection="column"
            >
              <TabList px={4} pt={2}>
                <Tab 
                  _selected={{ 
                    color: "white",
                    borderBottom: "2px solid",
                    borderColor: "#00C6E0"
                  }}
                  color="rgba(255, 255, 255, 0.6)"
                  fontSize="sm"
                  fontWeight="medium"
                  px={3}
                  pb={2}
                >
                  Open Trades
                </Tab>
                <Tab 
                  _selected={{ 
                    color: "white",
                    borderBottom: "2px solid",
                    borderColor: "#00C6E0"
                  }}
                  color="rgba(255, 255, 255, 0.6)"
                  fontSize="sm"
                  fontWeight="medium"
                  px={3}
                  pb={2}
                >
                  Historical Trades
                </Tab>
              </TabList>
              
              <TabPanels flex="1" overflow="hidden">
                <TabPanel h="100%" p={0}>
                  <Suspense fallback={<LoadingFallback />}>
                    <LiveTradesView />
                  </Suspense>
                </TabPanel>
                <TabPanel h="100%" p={0}>
                  <Suspense fallback={<LoadingFallback />}>
                    <HistoricalTradesView />
                  </Suspense>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>
          
          {/* Webhooks Tab Panel */}
          <TabPanel h="100%" p={0} display="flex" flexDirection="column">
            {/* Content */}
            <Box flex="1" overflow="hidden">
              <WebhooksView 
                onWebhooksChange={setWebhooksHandler}
              />
            </Box>

            {/* Footer */}
            <Flex 
              justify="center" 
              borderTop="1px solid" 
              borderColor="rgba(255, 255, 255, 0.1)"
              p={4}
            >
              <HStack 
                spacing={6} 
                color="rgba(255, 255, 255, 0.6)"
                fontSize="sm"
              >
                <HStack spacing={2}>
                  <Box w="3px" h="16px" bg="purple.400" />
                  <Text>Subscribed Strategies</Text>
                </HStack>
                <HStack spacing={2}>
                  <Box w="3px" h="16px" bg="cyan.400" />
                  <Text>Shared Strategies</Text>
                </HStack>
                <HStack spacing={2}>
                  <Box w="3px" h="16px" bg="transparent" border="1px solid" borderColor="rgba(255, 255, 255, 0.4)" />
                  <Text>Regular Webhooks</Text>
                </HStack>
              </HStack>
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* WebhookModal remains here */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={onWebhookModalClose}
        onSubmit={handleCreateWebhook}
      />
    </Box>
  );
};

export default TradesTable;