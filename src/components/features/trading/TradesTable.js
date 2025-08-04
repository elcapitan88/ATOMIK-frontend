import React, { useState } from 'react';
import {
  Box, 
  Flex,
  useDisclosure,
  Button,
  ButtonGroup,
  HStack,
  Text,
  useToast,
  Icon,
  Select,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { Activity, Zap, Clock, Plus, Search, RefreshCw } from 'lucide-react';
import WebhooksView from '@/components/features/trading/WebhooksView';  // or whatever the correct path is
import LiveTradesView from './LiveTradesView';
import HistoricalTradesView from './HistoricalTradesView';
import EnhancedStrategyModal from '../strategies/EnhancedStrategyModal';
import WebhookDetailsModal from '../webhooks/WebhookDetailsModal';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { useStrategyTerminology } from '@/hooks/useStrategyEnhancements';

const TradesTable = () => {
  const [webhooksHandler, setWebhooksHandler] = useState(null);
  const [activeView, setActiveView] = useState('webhooks'); // 'positions' or 'webhooks'
  const [positionView, setPositionView] = useState('open'); // 'open' or 'historical'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [liveFilters, setLiveFilters] = useState({ side: 'all', symbol: 'all' });
  const [newlyCreatedWebhook, setNewlyCreatedWebhook] = useState(null); // Store newly created webhook
  const toast = useToast();
  const terminology = useStrategyTerminology();
  
  // Modal control - only for webhook creation
  const {
    isOpen: isWebhookModalOpen,
    onOpen: onWebhookModalOpen,
    onClose: onWebhookModalClose
  } = useDisclosure();

  // Modal control for webhook details
  const {
    isOpen: isDetailsModalOpen,
    onOpen: onDetailsModalOpen,
    onClose: onDetailsModalClose
  } = useDisclosure();

  // Handler for webhook creation
  const handleCreateWebhook = async (webhookData) => {
    console.log('Creating webhook...', webhookData);
    const createdWebhook = await webhookApi.generateWebhook(webhookData);
    
    // Store the newly created webhook with all its data including secret
    setNewlyCreatedWebhook(createdWebhook);
    
    console.log('Webhook created, handler:', webhooksHandler);
    if (webhooksHandler?.refreshData) {
      console.log('Refreshing webhooks...');
      await webhooksHandler.refreshData();
    } else {
      console.warn('No refresh handler available');
    }

    // Close the creation modal
    onWebhookModalClose();
    
    // Open the details modal to show the webhook with secret
    onDetailsModalOpen();
  };

  return (
    <Box 
      h="full"
      bg="whiteAlpha.100" 
      borderRadius="xl" 
      borderWidth="1px" 
      borderColor="whiteAlpha.200" 
      boxShadow="lg"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Flex p={4} borderBottomWidth="1px" borderColor="whiteAlpha.200" justify="space-between" align="center">
        <HStack spacing={4}>
          {/* Main Toggle */}
          <ButtonGroup size="sm" isAttached variant="solid">
            <Button
              onClick={() => setActiveView('positions')}
              bg={activeView === 'positions' ? 'whiteAlpha.200' : 'whiteAlpha.50'}
              color={activeView === 'positions' ? 'rgba(0, 198, 224, 1)' : 'gray.500'}
              borderWidth="0"
              _hover={{
                bg: activeView === 'positions' ? 'whiteAlpha.300' : 'whiteAlpha.100',
                color: activeView === 'positions' ? 'rgba(0, 198, 224, 1)' : 'gray.300'
              }}
              _active={{
                bg: 'whiteAlpha.300'
              }}
              leftIcon={<Icon as={Activity} boxSize={4} />}
              transition="all 0.2s"
              fontWeight={activeView === 'positions' ? 'medium' : 'normal'}
            >
              Positions
            </Button>
            <Button
              onClick={() => setActiveView('webhooks')}
              bg={activeView === 'webhooks' ? 'whiteAlpha.200' : 'whiteAlpha.50'}
              color={activeView === 'webhooks' ? 'rgba(0, 198, 224, 1)' : 'gray.500'}
              borderWidth="0"
              _hover={{
                bg: activeView === 'webhooks' ? 'whiteAlpha.300' : 'whiteAlpha.100',
                color: activeView === 'webhooks' ? 'rgba(0, 198, 224, 1)' : 'gray.300'
              }}
              _active={{
                bg: 'whiteAlpha.300'
              }}
              leftIcon={<Icon as={Zap} boxSize={4} />}
              transition="all 0.2s"
              fontWeight={activeView === 'webhooks' ? 'medium' : 'normal'}
            >
              Webhooks
            </Button>
          </ButtonGroup>
        </HStack>
        
        {/* Generate Webhook Button - Only visible in webhooks view */}
        {activeView === 'webhooks' && (
          <Button
            leftIcon={<Icon as={Plus} />}
            bg="transparent"
            color="white"
            fontWeight="medium"
            borderWidth={1}
            borderColor="rgba(0, 198, 224, 1)"
            onClick={onWebhookModalOpen}
            size="sm"
            _hover={{ 
              bg: 'rgba(0, 198, 224, 0.1)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 198, 224, 0.3)'
            }}
            _active={{ bg: 'rgba(0, 198, 224, 0.2)' }}
            transition="all 0.2s"
          >
            {terminology.createAction}
          </Button>
        )}
      </Flex>

      {/* Sub-navigation for Positions */}
      {activeView === 'positions' && (
        <Flex px={4} pb={3} justify="space-between" align="center">
          <ButtonGroup size="sm" variant="ghost" spacing={0}>
            <Button
              onClick={() => setPositionView('open')}
              color={positionView === 'open' ? 'rgba(0, 198, 224, 1)' : 'gray.400'}
              borderBottom={positionView === 'open' ? '2px solid' : 'none'}
              borderColor="rgba(0, 198, 224, 1)"
              borderRadius="0"
              _hover={{
                color: 'rgba(0, 198, 224, 0.8)',
                bg: 'transparent'
              }}
              leftIcon={<Icon as={Activity} />}
              px={4}
              transition="all 0.2s"
            >
              Live Trades
            </Button>
            <Button
              onClick={() => setPositionView('historical')}
              color={positionView === 'historical' ? 'rgba(0, 198, 224, 1)' : 'gray.400'}
              borderBottom={positionView === 'historical' ? '2px solid' : 'none'}
              borderColor="rgba(0, 198, 224, 1)"
              borderRadius="0"
              _hover={{
                color: 'rgba(0, 198, 224, 0.8)',
                bg: 'transparent'
              }}
              leftIcon={<Icon as={Clock} />}
              px={4}
              transition="all 0.2s"
            >
              Historical Trades
            </Button>
          </ButtonGroup>
          
          {/* Filters for Live Trades */}
          {positionView === 'open' && (
            <HStack spacing={2}>
              <Select
                size="sm"
                value={selectedAccount || ''}
                onChange={(e) => {
                  const accountId = e.target.value;
                  if (accountId) {
                    setSelectedAccount(accountId);
                  }
                }}
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                width="120px"
                h="32px"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
                placeholder="Select Account"
              >
                <option value="">All Accounts</option>
              </Select>
              
              <Select
                size="sm"
                value={liveFilters.side}
                onChange={(e) => setLiveFilters(prev => ({ ...prev, side: e.target.value }))}
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                width="100px"
                h="32px"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
              >
                <option value="all">All Sides</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </Select>
            </HStack>
          )}
          
          {/* Filters for Historical Trades */}
          {positionView === 'historical' && (
            <HStack spacing={2} flexWrap="wrap">
              <Select
                size="sm"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                width="120px"
                h="32px"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
              >
                <option value="1">Today</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">All Time</option>
              </Select>
              
              <Select
                size="sm"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                width="110px"
                h="32px"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
              >
                <option value="all">All Symbols</option>
              </Select>
              
              <Select
                size="sm"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                width="120px"
                h="32px"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
              >
                <option value="all">All Strategies</option>
              </Select>
              
              <Select
                size="sm"
                bg="rgba(0, 0, 0, 0.3)"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                width="110px"
                h="32px"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
              >
                <option value="all">All Trades</option>
                <option value="true">Profitable Only</option>
                <option value="false">Losing Only</option>
              </Select>
              
              <InputGroup size="sm" width="180px" h="32px">
                <Input
                  placeholder="Search trades..."
                  bg="rgba(0, 0, 0, 0.3)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="white"
                  fontSize="xs"
                  _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                  _focus={{ borderColor: "#00C6E0", boxShadow: "0 0 0 1px #00C6E0" }}
                />
                <InputRightElement h="32px">
                  <Search size={14} color="rgba(255, 255, 255, 0.4)" />
                </InputRightElement>
              </InputGroup>
              
              <Tooltip label="Refresh">
                <IconButton
                  icon={<RefreshCw size={16} />}
                  variant="ghost"
                  size="sm"
                  aria-label="Refresh trades"
                  color="rgba(255, 255, 255, 0.6)"
                  _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                  h="32px"
                  w="32px"
                  minW="32px"
                />
              </Tooltip>
            </HStack>
          )}
        </Flex>
      )}


      {/* Content */}
      <Box flex="1" overflow="hidden">
        {activeView === 'webhooks' && (
          <WebhooksView 
            onWebhooksChange={setWebhooksHandler}
          />
        )}
        {activeView === 'positions' && positionView === 'open' && (
          <LiveTradesView 
            selectedAccount={selectedAccount}
            selectedBroker={selectedBroker}
            onAccountChange={(accountId, brokerId) => {
              setSelectedAccount(accountId);
              setSelectedBroker(brokerId);
            }}
            filters={liveFilters}
          />
        )}
        {activeView === 'positions' && positionView === 'historical' && (
          <HistoricalTradesView />
        )}
      </Box>

      {/* Footer - Only show for webhooks */}
      {activeView === 'webhooks' && (
        <Flex 
          justify="center" 
          borderTop="1px solid" 
          borderColor="whiteAlpha.200"
          p={4}
        >
          <HStack 
            spacing={6} 
            color="whiteAlpha.600"
            fontSize="sm"
          >
            <HStack spacing={2}>
              <Box w="3px" h="16px" bg="purple.400" borderRadius="full" />
              <Text>Subscribed Strategies</Text>
            </HStack>
            <HStack spacing={2}>
              <Box w="3px" h="16px" bg="rgba(0, 198, 224, 1)" borderRadius="full" />
              <Text>Shared Strategies</Text>
            </HStack>
            <HStack spacing={2}>
              <Box w="3px" h="16px" bg="transparent" border="1px solid" borderColor="whiteAlpha.400" borderRadius="full" />
              <Text>Regular Webhooks</Text>
            </HStack>
          </HStack>
        </Flex>
      )}

      {/* Enhanced Strategy Modal with intent discovery */}
      <EnhancedStrategyModal
        isOpen={isWebhookModalOpen}
        onClose={onWebhookModalClose}
        onSubmit={handleCreateWebhook}
      />
      
      {/* Webhook Details Modal for showing newly created webhook */}
      {newlyCreatedWebhook && (
        <WebhookDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            onDetailsModalClose();
            setNewlyCreatedWebhook(null); // Clear the webhook data after closing
            
            // Show success toast after user has seen the webhook details
            toast({
              title: "Webhook Created Successfully",
              description: "Your webhook URL has been generated. Please save it securely.",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
          }}
          webhook={newlyCreatedWebhook}
          isNewlyCreated={true} // Flag to show special warning
        />
      )}
    </Box>
  );
};

export default TradesTable;