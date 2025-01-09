import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Text,
  IconButton,
  Tooltip,
  Box,
  Flex,
  useClipboard,
  Spinner,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast
} from '@chakra-ui/react';
import { 
  Settings, 
  Trash2, 
  MoreVertical,
  RefreshCw,
  Clock,
  Info
} from 'lucide-react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import useWebSocket from '@/hooks/useWebSocket';
import { formatDate } from '@/utils/formatting/date';

const CopyableUrl = ({ webhook }) => {
  const fullUrl = `${webhook.webhook_url}?secret=${webhook.secret_key}`;
  
  const abbreviateText = (text, startLength = 8, endLength = 6) => {
    if (!text) return '';
    if (text.length <= startLength + endLength) return text;
    return `${text.substring(0, startLength)}...${text.substring(text.length - endLength)}`;
  };

  const displayUrl = abbreviateText(webhook.webhook_url, 15, 8);
  const displaySecret = abbreviateText(webhook.secret_key, 6, 4);
  const displayText = `${displayUrl}?secret=${displaySecret}`;

  const { hasCopied, onCopy } = useClipboard(fullUrl);
  
  return (
    <Tooltip 
      label={hasCopied ? "Copied!" : "Click to copy URL"}
      placement="top"
      hasArrow
    >
      <Text
        fontSize="sm"
        cursor="pointer"
        onClick={onCopy}
        color="whiteAlpha.800"
        _hover={{ color: "white" }}
      >
        {displayText}
      </Text>
    </Tooltip>
  );
};

const WebhooksView = ({ onDetailsOpen, onDeleteOpen, setSelectedWebhook, onWebhooksChange }) => {
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const toast = useToast();
  const { status: wsStatus } = useWebSocket('tradovate');

  const fetchWebhooks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await webhookApi.listWebhooks();
      setWebhooks(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      setError(error.message);
      toast({
        title: "Error fetching webhooks",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWebhooks(false);
    setIsRefreshing(false);
  };

  const handleWebhookAction = async (webhook, action) => {
    try {
      switch (action) {
        case 'details':
          setSelectedWebhook(webhook);
          onDetailsOpen();
          break;
          
        case 'delete':
          setSelectedWebhook(webhook);
          try {
            await webhookApi.deleteWebhook(webhook.token);
            setWebhooks(prevWebhooks => 
              prevWebhooks.filter(w => w.token !== webhook.token)
            );
            toast({
              title: "Webhook Deleted",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } catch (error) {
            toast({
              title: "Error Deleting Webhook",
              description: error.message,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
          break;
          
        default:
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const addWebhook = useCallback((webhook) => {
    setWebhooks(prevWebhooks => [...prevWebhooks, webhook]);
  }, []);

  useEffect(() => {
    if (onWebhooksChange) {
      onWebhooksChange({
        addWebhook,
        refreshWebhooks: fetchWebhooks
      });
    }
  }, [onWebhooksChange, addWebhook, fetchWebhooks]);

  if (isLoading) {
    return (
      <Box h="full" w="full">
        <Flex justify="center" align="center" h="full">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box h="full" w="full">
        <Flex justify="center" align="center" h="full">
          <Text color="red.400">{error}</Text>
        </Flex>
      </Box>
    );
  }

  if (!webhooks || webhooks.length === 0) {
    return (
      <Box h="full" w="full">
        <Flex justify="center" align="center" h="full">
          <Text color="whiteAlpha.600">No webhooks configured</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box 
      h="full" 
      w="full"
      position="relative"
    >
      <Flex justify="space-between" align="center" mb={4} px={4}>
        <HStack spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            Active Webhooks
          </Text>
          <Badge colorScheme="blue">
            {webhooks.length} Webhook{webhooks.length !== 1 ? 's' : ''}
          </Badge>
          {wsStatus === 'connected' && (
            <Badge colorScheme="green">Live</Badge>
          )}
        </HStack>

        <IconButton
          icon={<RefreshCw size={16} />}
          variant="ghost"
          size="sm"
          isLoading={isRefreshing}
          onClick={handleRefresh}
          color="whiteAlpha.700"
          _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
        />
      </Flex>

      <Box
        overflowY="auto"
        h="calc(100% - 60px)"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          'scrollbarWidth': 'none',
          '-ms-overflow-style': 'none'
        }}
      >
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr>
              <Th color="whiteAlpha.600">Name</Th>
              <Th color="whiteAlpha.600" width="50%">URL</Th>
              <Th color="whiteAlpha.600">Last Triggered</Th>
              <Th color="whiteAlpha.600">Details</Th>
              <Th color="whiteAlpha.600" width="80px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {webhooks.map((webhook) => (
              <Tr 
                key={webhook.token}
                _hover={{ bg: 'whiteAlpha.100' }}
                transition="background 0.2s"
              >
                <Td color="white">
                  <Text fontWeight="medium">
                    {webhook.name || 'Unnamed Webhook'}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.600">
                    {webhook.source_type}
                  </Text>
                </Td>
                <Td>
                  <CopyableUrl webhook={webhook} />
                </Td>
                <Td color="whiteAlpha.800">
                  <HStack spacing={2}>
                    <Clock size={14} />
                    <Text>
                      {webhook.last_triggered ? formatDate(webhook.last_triggered) : 'Never'}
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  {webhook.details ? (
                    <Tooltip 
                      label={webhook.details}
                      placement="top"
                      hasArrow
                      bg="gray.800"
                      color="white"
                      maxW="300px"
                    >
                      <Box>
                        <Info size={14} color="white" />
                      </Box>
                    </Tooltip>
                  ) : (
                    <Text color="whiteAlpha.400" fontSize="xs">No details</Text>
                  )}
                </Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<MoreVertical size={16} color="white" />}
                      variant="ghost"
                      size="sm"
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                      _expanded={{ bg: 'transparent' }}
                    />
                    <MenuList 
                      bg="rgba(26, 32, 44, 0.9)"
                      borderColor="whiteAlpha.200"
                    >
                      <MenuItem
                        icon={<Settings size={14} />}
                        onClick={() => handleWebhookAction(webhook, 'details')}
                        _hover={{ bg: 'whiteAlpha.200' }}
                        bg="transparent"
                      >
                        Setup
                      </MenuItem>
                      <MenuItem
                        icon={<Trash2 size={14} />}
                        onClick={() => handleWebhookAction(webhook, 'delete')}
                        color="red.300"
                        _hover={{ bg: 'red.900' }}
                        bg="transparent"
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default WebhooksView;