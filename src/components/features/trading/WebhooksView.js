import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Badge,
  HStack,
  VStack,
  Text,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
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
import WebhookDetailsModal from '@/components/features/webhooks/WebhookDetailsModal';
import ShareStrategyModal from '@/components/common/Modal/ShareStrategyModal';
import DeleteWebhook from '@/components/common/Modal/DeleteWebhook';
import { envConfig } from '@/config/environment';



// URL Display Component (compact for card layout)
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
    <HStack spacing={1} flex={1} minW={0}>
      <Text
        color="whiteAlpha.500"
        fontSize="xs"
        fontFamily="mono"
        isTruncated
      >
        {envConfig.getWebhookUrl(webhook.token)}
      </Text>
      <Tooltip
        label={hasCopied ? "Copied!" : "Copy URL with secret"}
        placement="top"
      >
        <IconButton
          icon={<Copy size={12} />}
          size="xs"
          variant="ghost"
          color={hasCopied ? "green.400" : "whiteAlpha.500"}
          _hover={{ color: "white" }}
          onClick={onCopy}
          aria-label="Copy webhook URL"
          minW="auto"
          h="auto"
          p={1}
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

  // Get accent bar color based on webhook type
  const getAccentColor = (webhook) => {
    if (webhook.isSubscribed) return "purple.400";
    if (webhook.is_shared) return "cyan.400";
    return "whiteAlpha.300";
  };

  // Get source label
  const getSourceLabel = (webhook) => {
    if (webhook.isSubscribed) return `Subscribed from ${webhook.username}`;
    return webhook.source_type || 'Custom';
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
          px={3}
          py={2}
          onScroll={handleScroll}
          className="scrolled-container"
          data-at-top={isAtTop}
          data-at-bottom={isAtBottom}
          position="relative"
          sx={{
            '&::-webkit-scrollbar': {
              width: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
          }}
        >
          <ScrollFade position="top" />
          <VStack spacing={2} align="stretch">
            <AnimatePresence mode="wait">
              {webhooks.map((webhook) => (
                <motion.div
                  key={webhook.token}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    position="relative"
                    bg="whiteAlpha.50"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="whiteAlpha.100"
                    pl={4}
                    pr={2}
                    py={2.5}
                    _hover={{ bg: "whiteAlpha.100", borderColor: "whiteAlpha.200" }}
                    transition="all 0.15s"
                    overflow="hidden"
                  >
                    {/* Left accent bar */}
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      width="3px"
                      bg={getAccentColor(webhook)}
                      borderLeftRadius="lg"
                    />

                    {/* Row 1: Name + source badge + menu */}
                    <Flex align="center" justify="space-between" mb={1}>
                      <HStack spacing={2} flex={1} minW={0}>
                        <Tooltip label={webhook.name || 'Unnamed Webhook'} placement="top" openDelay={500}>
                          <Text
                            color="white"
                            fontWeight="semibold"
                            fontSize="sm"
                            isTruncated
                          >
                            {webhook.name || 'Unnamed Webhook'}
                          </Text>
                        </Tooltip>
                        <Badge
                          bg="whiteAlpha.200"
                          color="whiteAlpha.700"
                          fontSize="2xs"
                          fontWeight="medium"
                          px={1.5}
                          py={0.5}
                          borderRadius="md"
                          textTransform="none"
                          flexShrink={0}
                        >
                          {getSourceLabel(webhook)}
                        </Badge>
                      </HStack>

                      {/* 3-dot menu */}
                      <Menu strategy="fixed">
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={14} />}
                          variant="ghost"
                          size="xs"
                          color="whiteAlpha.500"
                          _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                          ml={1}
                        />
                        <Portal>
                          <MenuList
                            bg="rgba(0, 0, 0, 0.85)"
                            backdropFilter="blur(20px)"
                            borderColor="rgba(255, 255, 255, 0.1)"
                            boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.5)"
                            borderRadius="xl"
                            zIndex={1400}
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
                                  onClick={() => handleAction(webhook, 'delete')}
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
                        </Portal>
                      </Menu>
                    </Flex>

                    {/* Row 2: URL with copy (owned webhooks only) */}
                    {!webhook.isSubscribed && (
                      <Box mb={webhook.is_shared ? 1 : 0}>
                        <WebhookUrl webhook={webhook} />
                      </Box>
                    )}

                    {/* Row 3: Shared stats (if shared) */}
                    {webhook.is_shared && (
                      <HStack spacing={3} mt={0.5}>
                        <HStack spacing={1} color="whiteAlpha.600">
                          <Icon as={Users} size={12} />
                          <Text fontSize="xs">{webhook.subscriber_count || 0} subs</Text>
                        </HStack>
                        {webhook.rating > 0 && (
                          <HStack spacing={1} color="whiteAlpha.600">
                            <Icon as={Star} size={12} color="yellow.400" />
                            <Text fontSize="xs">{webhook.rating.toFixed(1)}</Text>
                          </HStack>
                        )}
                      </HStack>
                    )}
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </VStack>
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