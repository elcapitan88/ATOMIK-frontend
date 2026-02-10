import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  VStack,
  Text,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useClipboard,
  Flex,
  useToast,
  useDisclosure,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import {
  Settings,
  Trash2,
  MoreVertical,
  Share,
  Users,
  Star,
  UserMinus,
  Inbox,
  Copy,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import EnhancedStrategyModal from '@/components/features/strategies/EnhancedStrategyModal';
import WebhookDetailsModal from '@/components/features/webhooks/WebhookDetailsModal';
import ShareStrategyModal from '@/components/common/Modal/ShareStrategyModal';
import DeleteWebhook from '@/components/common/Modal/DeleteWebhook';
import EnvironmentConfig, { envConfig } from '@/config/environment';



// URL Display Component
const WebhookUrl = ({ webhook }) => {
  const { hasCopied, onCopy } = useClipboard(
    webhook?.token && webhook?.secret_key 
      ? envConfig.getWebhookUrlWithSecret(webhook.token, webhook.secret_key)
      : ''
  );

  if (!webhook?.token) {
    return null;
  }

  return (
    <HStack spacing={2}>
      <Text
        color="whiteAlpha.900"
        fontSize="sm"
        fontFamily="mono"
        isTruncated
        maxW="300px"
      >
        {envConfig.getWebhookUrl(webhook.token)}
      </Text>
      <Tooltip
        label={hasCopied ? "Copied!" : "Copy URL with secret"}
        placement="top"
      >
        <IconButton
          icon={<Copy size={14} />}
          size="xs"
          variant="ghost"
          color={hasCopied ? "green.400" : "whiteAlpha.600"}
          _hover={{ color: "white" }}
          onClick={onCopy}
          aria-label="Copy webhook URL"
        />
      </Tooltip>
    </HStack>
  );
};

const WebhooksView = ({ onWebhooksChange }) => {
  // State Management
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Modal Controls
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose
  } = useDisclosure();

  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onClose: onShareClose
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();

  const toast = useToast();

  // Scroll fade effect component
  const ScrollFade = ({ position = 'bottom' }) => (
    <Box
      position="absolute"
      left={0}
      right={0}
      height="40px"
      pointerEvents="none"
      {...(position === 'bottom' ? {
        bottom: 0,
        background: "linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.2))"
      } : {
        top: 0,
        background: "linear-gradient(to top, transparent, rgba(0, 0, 0, 0.2))"
      })}
      opacity={0}
      transition="opacity 0.2s"
      sx={{
        '.scrolled-container:not([data-at-bottom="true"]) &[data-position="bottom"]': {
          opacity: 1
        },
        '.scrolled-container:not([data-at-top="true"]) &[data-position="top"]': {
          opacity: 1
        }
      }}
      data-position={position}
    />
  );

  // Scroll handler
  const handleScroll = (e) => {
    const target = e.target;
    const atTop = target.scrollTop === 0;
    const atBottom = Math.abs(
      target.scrollHeight - target.clientHeight - target.scrollTop
    ) < 1;

    setIsAtTop(atTop);
    setIsAtBottom(atBottom);
  };

  // Fetch Webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ownedWebhooks, subscribedWebhooks] = await Promise.all([
        webhookApi.listWebhooks(),
        webhookApi.getSubscribedStrategies()
      ]);

      const formattedSubscribed = subscribedWebhooks.map(webhook => ({
        ...webhook,
        isSubscribed: true
      }));

      setWebhooks([...ownedWebhooks, ...formattedSubscribed]);
      setError(null);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError('Failed to load webhooks');
      toast({
        title: "Error loading webhooks",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial Load and expose refresh function
  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  useEffect(() => {
    if (onWebhooksChange) {
      onWebhooksChange({ refreshData: fetchWebhooks });
    }
  }, [onWebhooksChange, fetchWebhooks]);

  // Action Handler
  const handleAction = async (webhook, action) => {
    try {
      setSelectedWebhook(webhook);
      
      switch (action) {
        case 'details':
          onDetailsOpen();
          break;
          
        case 'share':
          onShareOpen();
          break;
          
        case 'delete':
          onDeleteOpen();
          break;
          
        case 'unsubscribe':
          await handleUnsubscribe(webhook);
          break;
          
        default:
          console.warn(`Unhandled action: ${action}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Share Handler
  const handleShareUpdate = async (webhook, shareData) => {
    try {
      const updatedWebhook = await webhookApi.toggleSharing(webhook.token, shareData);
      setWebhooks(current =>
        current.map(w => w.token === webhook.token ? updatedWebhook : w)
      );
      onShareClose();
      setSelectedWebhook(null);
      
      toast({
        title: "Success",
        description: "Sharing settings updated",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  // Delete Handler
  const handleDeleteWebhook = async (webhookToken) => {
    try {
      // Remove the API call from here since it's already done in DeleteWebhook component
      setWebhooks(prevWebhooks => 
        prevWebhooks.filter(w => w.token !== webhookToken)
      );
      
      setSelectedWebhook(null);
      onDeleteClose();
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  // Unsubscribe Handler
  const handleUnsubscribe = async (webhook) => {
    try {
      await webhookApi.unsubscribeFromStrategy(webhook.token);
      setWebhooks(current => current.filter(w => w.token !== webhook.token));
      
      toast({
        title: "Unsubscribed",
        description: "Successfully unsubscribed from the strategy",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error unsubscribing",
        description: error.message || "Failed to unsubscribe from strategy",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box position="relative" h="full" overflow="hidden">
      {/* Loading State */}
      {isLoading && (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="blue.400" />
        </Flex>
      )}
  
      {/* Error State */}
      {error && (
        <Flex justify="center" align="center" h="200px" color="red.400">
          <VStack spacing={4}>
            <Icon as={Info} boxSize={8} />
            <Text>{error}</Text>
          </VStack>
        </Flex>
      )}
  
      {/* Empty State */}
      {!isLoading && !error && webhooks.length === 0 ? (
        <Flex 
          justify="center" 
          align="center" 
          h="full" 
          color="whiteAlpha.600"
          flexDirection="column"
          gap={4}
        >
          <Icon as={Inbox} size={40} />
          <Text>No webhooks created yet</Text>
        </Flex>
      ) : (
        <Box 
          h="full" 
          overflowY="auto" 
          px={4}
          onScroll={handleScroll}
          className="scrolled-container"
          data-at-top={isAtTop}
          data-at-bottom={isAtBottom}
          position="relative"
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
              borderRadius: '8px',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
          }}
        >
          <ScrollFade position="top" />
          <Table variant="unstyled" size="sm">
            <Thead>
              <Tr>
                <Th color="whiteAlpha.600">Name</Th>
                <Th color="whiteAlpha.600">URL</Th>
                <Th color="whiteAlpha.600">Status</Th>
                <Th color="whiteAlpha.600">Details</Th>
                <Th color="whiteAlpha.600" width="80px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              <AnimatePresence mode="wait">
                {webhooks.map((webhook) => (
                  <motion.tr
                    key={webhook.token}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: 'relative' }}
                  >
                    <Td position="relative">
                      <Box
                        position="absolute"
                        left={0}
                        top="6px"
                        bottom="6px"
                        width="2px"
                        bg={
                          webhook.isSubscribed 
                            ? "purple.400" 
                            : webhook.is_shared 
                              ? "cyan.400" 
                              : "transparent"
                        }
                      />
                      <VStack align="flex-start" spacing={1} pl={1}>
                        <Text color="white" fontWeight="medium">
                          {webhook.name || 'Unnamed Webhook'}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.600">
                          {webhook.isSubscribed 
                            ? `Subscribed from ${webhook.username}` 
                            : webhook.source_type}
                        </Text>
                      </VStack>
                    </Td>
  
                    <Td>
                      {!webhook.isSubscribed && <WebhookUrl webhook={webhook} />}
                    </Td>
  
                    <Td>
                      {webhook.is_shared && (
                        <HStack spacing={4} color="whiteAlpha.800">
                          <HStack spacing={1}>
                            <Icon as={Users} size={14} />
                            <Text fontSize="sm">{webhook.subscriber_count || 0}</Text>
                          </HStack>
                          {webhook.rating > 0 && (
                            <HStack spacing={1}>
                              <Icon as={Star} size={14} color="yellow.400" />
                              <Text fontSize="sm">{webhook.rating.toFixed(1)}</Text>
                            </HStack>
                          )}
                        </HStack>
                      )}
                    </Td>
  
                    <Td>
                      {webhook.details ? (
                        <Tooltip label={webhook.details}>
                          <Box cursor="help">
                            <Icon as={Info} color="whiteAlpha.600" size={14} />
                          </Box>
                        </Tooltip>
                      ) : (
                        <Text color="whiteAlpha.400" fontSize="xs">
                          No details
                        </Text>
                      )}
                    </Td>
  
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={16} />}
                          variant="ghost"
                          size="sm"
                          color="whiteAlpha.600"
                          _hover={{ bg: 'whiteAlpha.100' }}
                        />
                        <MenuList
                          bg="rgba(255, 255, 255, 0.1)"
                          backdropFilter="blur(10px)"
                          borderColor="rgba(255, 255, 255, 0.18)"
                          boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                          borderRadius="xl"
                        >
                          {webhook.isSubscribed ? (
                            <MenuItem
                              onClick={() => handleAction(webhook, 'unsubscribe')}
                              _hover={{ bg: "whiteAlpha.200" }}
                              bg="transparent"
                              color="red.400"
                              icon={<UserMinus size={14} />}
                            >
                              Unsubscribe
                            </MenuItem>
                          ) : (
                            <>
                              <MenuItem
                                onClick={() => handleAction(webhook, 'details')}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="white"
                                icon={<Settings size={14} />}
                              >
                                Setup
                              </MenuItem>
                              <MenuItem
                                onClick={() => handleAction(webhook, 'share')}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="white"
                                icon={<Share size={14} />}
                              >
                                Share Strategy
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  console.log('Delete clicked for webhook:', webhook); // Debug log
                                  handleAction(webhook, 'delete');
                                }}
                                _hover={{ bg: "whiteAlpha.200" }}
                                bg="transparent"
                                color="red.400"
                                icon={<Trash2 size={14} />}
                              >
                                Delete
                              </MenuItem>
                            </>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </Tbody>
          </Table>
          <ScrollFade position="bottom" />
        </Box>
      )}
  
      {/* Modals */}
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
  
          <ShareStrategyModal
            isOpen={isShareOpen}
            onClose={() => {
              onShareClose();
              setSelectedWebhook(null);
            }}
            webhook={selectedWebhook}
            onWebhookUpdate={handleShareUpdate}
          />
  
          <DeleteWebhook
            isOpen={isDeleteOpen}
            onClose={() => {
              onDeleteClose();
              setSelectedWebhook(null);
            }}
            webhookToken={selectedWebhook.token}
            onWebhookDeleted={handleDeleteWebhook}
          />
          
        </>
      )}
    </Box>
  );
};


export default WebhooksView;