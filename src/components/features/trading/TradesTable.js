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
} from '@chakra-ui/react';
import { Activity, Zap, Clock, Plus } from 'lucide-react';
import WebhooksView from '@/components/features/trading/WebhooksView';  // or whatever the correct path is
import LiveTradesView from './LiveTradesView';
import HistoricalTradesView from './HistoricalTradesView';
import WebhookModal from '../webhooks/WebhookModal';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';

const TradesTable = () => {
  const [webhooksHandler, setWebhooksHandler] = useState(null);
  const [activeView, setActiveView] = useState('webhooks'); // 'positions' or 'webhooks'
  const [positionView, setPositionView] = useState('open'); // 'open' or 'historical'
  const toast = useToast();
  
  // Modal control - only for webhook creation
  const {
    isOpen: isWebhookModalOpen,
    onOpen: onWebhookModalOpen,
    onClose: onWebhookModalClose
  } = useDisclosure();

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
            Generate Webhook
          </Button>
        )}
      </Flex>

      {/* Sub-navigation for Positions */}
      {activeView === 'positions' && (
        <Flex px={4} pb={3} justify="flex-start" align="center">
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
          <LiveTradesView />
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

      {/* Only WebhookModal remains here */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={onWebhookModalClose}
        onSubmit={handleCreateWebhook}
      />
    </Box>
  );
};

export default TradesTable;