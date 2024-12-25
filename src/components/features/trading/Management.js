import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  HStack,
  Spinner,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import useWebSocket from '@/hooks/useWebSocket';
import BrokerConnectionModal from '@/components/common/Modal/BrokerConnectionModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import axiosInstance from '@/services/axiosConfig';
import { formatCurrency } from '@/utils/formatting/currency';

const Management = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const toast = useToast();
  const { status: wsStatus } = useWebSocket('tradovate');

  // Modal controls
  const {
    isOpen: isBrokerModalOpen,
    onOpen: onBrokerModalOpen,
    onClose: onBrokerModalClose
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/api/tradovate/fetch-accounts/');
      setAccounts(response.data);
    } catch (error) {
      toast({
        title: "Error fetching accounts",
        description: error.response?.data?.message || "Failed to fetch accounts",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle account connection
  const handleAccountConnected = useCallback((newAccounts) => {
    setAccounts(prev => [...prev, ...newAccounts]);
    onBrokerModalClose();
  }, [onBrokerModalClose]);

  // Handle account removal
  const handleRemoveAccount = useCallback(async (accountId) => {
    const account = accounts.find(acc => acc.account_id === accountId);
    if (!account) return;

    setSelectedAccount(account);
    onDeleteOpen();
  }, [accounts, onDeleteOpen]);

  // Handle account expansion
  const toggleAccountExpansion = useCallback((accountId) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  }, []);

  // Confirm account deletion
  const confirmDelete = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      await axiosInstance.delete(`/api/tradovate/remove-account/${selectedAccount.account_id}/`);
      
      setAccounts(prev => 
        prev.filter(acc => acc.account_id !== selectedAccount.account_id)
      );
      
      toast({
        title: "Account Removed",
        description: "The account has been disconnected and removed.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
    } catch (error) {
      toast({
        title: "Error Removing Account",
        description: error.response?.data?.message || "Failed to remove account",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [selectedAccount, toast, onDeleteClose]);

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
      <VStack p={3} color="white" h="full" spacing={4} align="stretch">
        <HStack spacing={2}>
          <Box
            as="button"
            px={4}
            py={2}
            bg="transparent"
            color="white"
            borderWidth={1}
            borderColor="rgba(0, 198, 224, 1)"
            borderRadius="md"
            onClick={onBrokerModalOpen}
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            Connect Account
          </Box>
          <Box
            as="button"
            px={4}
            py={2}
            bg="transparent"
            color="white"
            borderWidth={1}
            borderColor="rgba(229, 62, 62, 1)"
            borderRadius="md"
            onClick={() => {/* Add close all trades logic */}}
            opacity={accounts.length === 0 ? 0.5 : 1}
            cursor={accounts.length === 0 ? 'not-allowed' : 'pointer'}
            _hover={{ bg: accounts.length === 0 ? 'transparent' : 'whiteAlpha.100' }}
          >
            Close all trades
          </Box>
        </HStack>

        <VStack 
          flex={1} 
          spacing={1} 
          overflowY="auto" 
          align="stretch"
          className="custom-scrollbar"
        >
          {accounts.map((account) => (
            <Box 
              key={`${account.account_id}-${account.environment}`}
              bg="whiteAlpha.100" 
              borderRadius="lg"
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              <Flex 
                alignItems="center" 
                p={2} 
                cursor="pointer" 
                onClick={() => toggleAccountExpansion(account.account_id)}
                justify="space-between"
              >
                <Flex align="center" gap={2}>
                  <Box 
                    w="10px" 
                    h="10px" 
                    borderRadius="full" 
                    bg={account.active && !account.is_token_expired ? "green.400" : "red.400"}
                    boxShadow={`0 0 10px ${account.active && !account.is_token_expired ? '#48BB78' : '#F56565'}`}
                  />
                  <Text fontWeight="bold" fontSize="sm">
                    {account.nickname || account.name || 'Unnamed Account'}
                    <Text as="span" color="whiteAlpha.700" ml={2}>
                      {account.account_id} ({account.environment})
                    </Text>
                  </Text>
                </Flex>
                
                <HStack spacing={2}>
                  <Box
                    as="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAccount(account.account_id);
                    }}
                    opacity={0.6}
                    _hover={{ opacity: 1 }}
                    transition="opacity 0.2s"
                  >
                    <Trash2 size={16} color="white" />
                  </Box>
                  {expandedAccounts.has(account.account_id) ? 
                    <ChevronUp size={16} /> : 
                    <ChevronDown size={16} />
                  }
                </HStack>
              </Flex>

              {expandedAccounts.has(account.account_id) && (
                <Box p={1}>
                  <HStack spacing={6} py={1}>
                    <HStack spacing={2}>
                      <DollarSign size={14} />
                      <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">Balance</Text>
                        <Text fontSize="sm" fontWeight="bold">
                          {formatCurrency(account.balance)}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack spacing={2}>
                      <TrendingUp size={14} color={account.day_pnl >= 0 ? "#48BB78" : "#F56565"} />
                      <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">Day P&L</Text>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold"
                          color={account.day_pnl >= 0 ? "green.400" : "red.400"}
                        >
                          {formatCurrency(account.day_pnl)}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack spacing={2}>
                      <DollarSign size={14} />
                      <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">Closed P&L</Text>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold"
                          color={account.closed_pnl >= 0 ? "green.400" : "red.400"}
                        >
                          {formatCurrency(account.closed_pnl)}
                        </Text>
                      </Box>
                    </HStack>
                  </HStack>
                </Box>
              )}
            </Box>
          ))}

          {isLoading && (
            <Flex justify="center" py={4}>
              <Spinner size="xl" color="blue.500" />
            </Flex>
          )}

          {!isLoading && accounts.length === 0 && (
            <Flex justify="center" align="center" height="100%">
              <Text color="whiteAlpha.600">No Connected Accounts</Text>
            </Flex>
          )}
        </VStack>

        <Text fontSize="xs" color="whiteAlpha.700" textAlign="right">
          WebSocket Status: {wsStatus === 'connected' ? 
            <Text as="span" color="green.400">Connected</Text> : 
            <Text as="span" color="red.400">Disconnected</Text>
          }
        </Text>
      </VStack>

      <BrokerConnectionModal
        isOpen={isBrokerModalOpen}
        onClose={onBrokerModalClose}
        onAccountConnected={handleAccountConnected}
      />

      <DeleteAccount
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
        accountName={selectedAccount ? 
          selectedAccount.nickname || selectedAccount.name || 'Unnamed Account' 
          : ''
        }
      />
    </Box>
  );
};

export default Management;