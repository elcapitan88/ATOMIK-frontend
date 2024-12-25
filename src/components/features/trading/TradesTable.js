// src/components/features/trading/TradesTable.js
import React, { useState, useCallback } from 'react';
import {
  Box, 
  Flex,
  Button,
  useDisclosure,
  Fade,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { 
  LineChart, 
  MessageSquare,
  PlusCircle
} from 'lucide-react';
import LiveTradesView from './LiveTradesView';
import WebhooksView from './WebhooksView';
import WebhookModal from '../webhooks/WebhookModal';
import WebhookDetailsModal from '../webhooks/WebhookDetailsModal';
import DeleteWebhook from '@components/common/Modal/DeleteWebhook';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';

const ViewButton = ({ isActive, icon: IconComponent, children, onClick }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    color="white"
    position="relative"
    p={2}
    leftIcon={<IconComponent size={16} />}
    _hover={{ bg: 'transparent' }}
    _active={{ bg: 'transparent' }}
    _after={{
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '2px',
      bg: isActive ? 'rgba(0, 198, 224, 1)' : 'transparent',
      transition: 'all 0.2s ease'
    }}
  >
    {children}
  </Button>
);

const TradesTable = () => {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('activeView') || 'trades';
  });
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [webhooksHandler, setWebhooksHandler] = useState(null);
  
  const { 
    isOpen: isWebhookModalOpen, 
    onOpen: onWebhookModalOpen, 
    onClose: onWebhookModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDetailsOpen, 
    onOpen: onDetailsOpen, 
    onClose: onDetailsClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();

  const toast = useToast();

  const handleViewChange = useCallback((view) => {
    if (view === activeView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveView(view);
      localStorage.setItem('activeView', view);
      setIsTransitioning(false);
    }, 150);
  }, [activeView]);

  const handleCreateWebhook = useCallback(async (webhookData) => {
    try {
      const response = await webhookApi.generateWebhook(webhookData);
      if (webhooksHandler?.addWebhook) {
        webhooksHandler.addWebhook(response);
      }
      toast({
        title: "Webhook Created",
        description: "Your webhook has been generated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return response;
    } catch (error) {
      toast({
        title: "Error Creating Webhook",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [webhooksHandler, toast]);

  return (
    <Box 
      h="full" 
      bg="whiteAlpha.100" 
      borderRadius="xl" 
      borderWidth="1px" 
      borderColor="whiteAlpha.200" 
      boxShadow="lg" 
      overflow="hidden"
    >
      <Flex direction="column" h="full">
        <Flex 
          justify="space-between" 
          align="center" 
          p={4} 
          borderBottomWidth="1px" 
          borderColor="whiteAlpha.200"
        >
          <Flex gap={4}>
            <ViewButton
              isActive={activeView === 'trades'}
              icon={LineChart}
              onClick={() => handleViewChange('trades')}
            >
              Open Positions
            </ViewButton>
            <ViewButton
              isActive={activeView === 'webhooks'}
              icon={MessageSquare}
              onClick={() => handleViewChange('webhooks')}
            >
              Webhooks
            </ViewButton>
          </Flex>

          <Fade in={activeView === 'webhooks'}>
            {activeView === 'webhooks' && (
              <Button
                bg="transparent"
                color="white"
                fontWeight="medium"
                borderWidth={1}
                borderColor="rgba(0, 198, 224, 1)"
                leftIcon={<PlusCircle size={16} />}
                onClick={onWebhookModalOpen}
                _hover={{
                  bg: 'whiteAlpha.100'
                }}
                _active={{
                  bg: 'whiteAlpha.200'
                }}
              >
                Generate Webhook
              </Button>
            )}
          </Fade>
        </Flex>

        <Box flex={1} position="relative" overflow="hidden">
          <Fade
            in={!isTransitioning}
            style={{
              height: '100%',
              position: 'absolute',
              width: '100%',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <VStack p={4} spacing={4} h="full">
              {activeView === 'trades' ? (
                <LiveTradesView />
              ) : (
                <WebhooksView 
                  onDetailsOpen={onDetailsOpen}
                  onDeleteOpen={onDeleteOpen}
                  setSelectedWebhook={setSelectedWebhook}
                  onWebhooksChange={setWebhooksHandler}
                />
              )}
            </VStack>
          </Fade>
        </Box>
      </Flex>

      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={onWebhookModalClose}
        onSubmit={handleCreateWebhook}
      />
      
      {selectedWebhook && (
        <>
          <WebhookDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => {
              onDetailsClose();
              setSelectedWebhook(null);
            }}
            webhook={selectedWebhook}
          />
          
          <DeleteWebhook
            isOpen={isDeleteOpen}
            onClose={() => {
              onDeleteClose();
              setSelectedWebhook(null);
            }}
            webhookUrl={selectedWebhook?.token ? 
              `${window.location.origin}/api/webhook/${selectedWebhook.token}` : 
              ''
            }
            onConfirm={async () => {
              try {
                await webhookApi.deleteWebhook(selectedWebhook.token);
                if (webhooksHandler?.refreshWebhooks) {
                  await webhooksHandler.refreshWebhooks(false);
                }
                toast({
                  title: "Webhook Deleted",
                  description: "The webhook has been successfully deleted",
                  status: "success",
                  duration: 3000,
                  isClosable: true,
                });
                onDeleteClose();
              } catch (error) {
                toast({
                  title: "Error Deleting Webhook",
                  description: error.message,
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }
            }}
          />
        </>
      )}
    </Box>
  );
};

export default React.memo(TradesTable);