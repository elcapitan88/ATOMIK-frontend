// src/components/features/trading/Management.js
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

// Add these imports
import axiosInstance from '@/services/axiosConfig';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';
import { brokerAuthService } from '@/services/api/auth/brokerAuth';
import useWebSocket from '@/hooks/useWebSocket';
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import tradovateApi from '@/services/api/brokers/tradovate/tradovateApi';

const Management = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [expandedAccounts, setExpandedAccounts] = useState(new Set());
    const toast = useToast();
    const { status: wsStatus } = useWebSocket('tradovate');

    const {
        isOpen: isBrokerSelectOpen,
        onOpen: onBrokerSelectOpen,
        onClose: onBrokerSelectClose
    } = useDisclosure();

    const {
        isOpen: isEnvironmentOpen,
        onOpen: onEnvironmentOpen,
        onClose: onEnvironmentClose
    } = useDisclosure();

    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose
    } = useDisclosure();

    const fetchAccounts = useCallback(async () => {
      try {
          setIsLoading(true);
          
          // Debug log
          console.log('Fetching accounts...');
          
          // Get accounts from API
          const response = await tradovateApi.fetchAccounts();
          console.log('Raw API Response:', response);
  
          // Ensure we handle both possible response formats
          const accountsData = response?.accounts || response || [];
          
          console.log('Processed accounts data:', accountsData);
  
          // Validate and set accounts
          if (Array.isArray(accountsData)) {
              const activeAccounts = accountsData.filter(acc => {
                  // Debug log
                  console.log('Account data:', acc);
                  return acc.is_active !== false;
              });
              
              // Debug log
              console.log('Setting active accounts:', activeAccounts);
              
              setAccounts(activeAccounts);
          } else {
              console.error('Invalid accounts data format:', accountsData);
              throw new Error('Invalid account data format received');
          }
      } catch (error) {
          console.error('Error fetching accounts:', error);
          toast({
              title: "Error fetching accounts",
              description: error.message || "Failed to fetch accounts",
              status: "error",
              duration: 5000,
              isClosable: true,
          });
      } finally {
          setIsLoading(false);
      }
  }, [toast]);
  
  // Initial fetch on component mount
  useEffect(() => {
      fetchAccounts();
  }, []); // Empty dependency array for initial fetch
  
  // Periodic refresh
  useEffect(() => {
      // Fetch immediately when component mounts
      fetchAccounts();
      
      // Set up interval for periodic refresh
      const interval = setInterval(() => {
          fetchAccounts();
      }, 10000); // Refresh every 10 seconds
      
      // Cleanup interval on component unmount
      return () => {
          clearInterval(interval);
      };
  }, [fetchAccounts]);

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

    const handleBrokerSelect = useCallback((broker) => {
        setSelectedBroker(broker);
        onBrokerSelectClose();
        onEnvironmentOpen();
    }, [onBrokerSelectClose, onEnvironmentOpen]);

    const handleEnvironmentSelect = useCallback(async (environment) => {
      try {
        if (!selectedBroker) {
          throw new Error('No broker selected');
        }
    
        const request = {
          environment,
          credentials: {
            type: 'oauth',
            environment
          }
        };
    
        const response = await brokerAuthService.initiateTradovateOAuth(selectedBroker.id, request);
        
        if (response?.auth_url) {
          window.location.href = response.auth_url;
        } else {
          throw new Error('No authentication URL received');
        }
      } catch (error) {
        console.error('OAuth initiation error:', error);
        
        // Handle specific error cases
        if (error.response?.status === 400 && error.response?.data?.detail?.includes('already connected')) {
          toast({
            title: "Account Already Connected",
            description: "This account is already connected and active.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: "Connection Error",
            description: error.message || "Failed to connect broker",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    }, [selectedBroker, toast]);
   
    const handleAccountConnected = useCallback((connectedAccounts) => {
        fetchAccounts();
        toast({
           title: "Success",
            description: "Account connected successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    }, [fetchAccounts, toast]);

    const handleDeleteAccount = async () => {
        try {
            await tradovateApi.removeAccount(selectedAccount.account_id);
            await fetchAccounts();
            toast({
                title: "Success",
                description: "Account removed successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onDeleteClose();
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
                        onClick={onBrokerSelectOpen}
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
                <AccountStatusIndicator 
                    tokenValid={!account.is_token_expired}
                    wsStatus={wsStatus}
                />
                <Text fontWeight="bold" fontSize="sm">
                    {account.name}
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
                        setSelectedAccount(account);
                        onDeleteOpen();
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
                                ${account.balance}
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
                                ${account.day_pnl}
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

            <BrokerSelectionModal
                isOpen={isBrokerSelectOpen}
                onClose={onBrokerSelectClose}
                onBrokerSelect={handleBrokerSelect}
            />

            {selectedBroker && (
                <BrokerEnvironmentModal
                    isOpen={isEnvironmentOpen}
                    onClose={onEnvironmentClose}
                    selectedBroker={selectedBroker}
                    onEnvironmentSelect={handleEnvironmentSelect}
                />
            )}

            <DeleteAccount
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}
                onConfirm={handleDeleteAccount}
                accountName={selectedAccount?.name}
                accountDetails={selectedAccount}
            />
        </Box>
    );
};

export default Management;