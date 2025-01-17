// src/components/features/trading/Management.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    VStack,
    Text,
    Flex,
    HStack,
    Spinner,
    useToast,
    useDisclosure,
    Tooltip,
    IconButton,
} from '@chakra-ui/react';
import {
    Trash2,
    ChevronDown,
    ChevronUp,
    DollarSign,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

// Import our new services
import accountManager from '@/services/account/AccountManager';
import webSocketManager from '@/services/websocket/webSocketManager';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import logger from '@/utils/logger';

const Management = () => {
    // State Management
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [expandedAccounts, setExpandedAccounts] = useState(new Set());
    const [fetchError, setFetchError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [connectionStatuses, setConnectionStatuses] = useState(new Map());

    // Hooks
    const toast = useToast();
    
    // Modal controls
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

    // Effect for initializing account subscriptions
    useEffect(() => {
        let accountSubscription;
        let wsStatusSubscription;
    
        const initializeSubscriptions = async () => {
            try {
                setIsLoading(true);
                
                // Initialize WebSocket status subscription
                console.log('Setting up WebSocket status subscription'); // Debug log
                wsStatusSubscription = webSocketManager.onStatus().subscribe({
                    next: (statusUpdate) => {
                        console.log('WebSocket status update received:', statusUpdate); // Debug log
                        setConnectionStatuses(prev => new Map(prev).set(
                            statusUpdate.accountId,
                            statusUpdate.status
                        ));
                    },
                    error: (error) => {
                        console.error('WebSocket status subscription error:', error);
                    }
                });
    
                // Initialize account subscription
                accountSubscription = accountManager.getAccountUpdates().subscribe({
                    next: (update) => {
                        console.log('Account update received:', update); // Debug log
                        if (update.type === 'bulk') {
                            setAccounts(update.accounts);
                        } else if (update.type === 'update') {
                            setAccounts(prev => prev.map(account => 
                                account.account_id === update.accountId ? update.account : account
                            ));
                        } else if (update.type === 'remove') {
                            setAccounts(prev => prev.filter(account => 
                                account.account_id !== update.accountId
                            ));
                        }
                    },
                    error: (error) => {
                        console.error('Account subscription error:', error);
                        setFetchError('Error receiving account updates');
                    }
                });
    
                // Initial account fetch
                await fetchAccounts();
    
            } catch (error) {
                console.error('Initialization error:', error);
                setFetchError('Failed to initialize account management');
            } finally {
                setIsLoading(false);
            }
        };
    
        initializeSubscriptions();
    
        // Cleanup subscriptions
        return () => {
            console.log('Cleaning up subscriptions'); // Debug log
            if (accountSubscription) accountSubscription.unsubscribe();
            if (wsStatusSubscription) wsStatusSubscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const connectAccounts = async () => {
            try {
                const activeAccounts = accounts.filter(acc => 
                    acc.status === 'active' && !acc.is_token_expired
                );
                
                for (const account of activeAccounts) {
                    const token = localStorage.getItem('access_token');
                    if (!token) continue;
    
                    const connected = await webSocketManager.connect(
                        account.account_id,
                        token
                    );
                    
                    if (!connected) {
                        logger.error(`Failed to connect WebSocket for account ${account.account_id}`);
                    }
                }
            } catch (error) {
                logger.error('Error connecting WebSockets:', error);
            }
        };
    
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                logger.info('Tab became visible, reconnecting WebSockets');
                connectAccounts();
            }
        };
    
        const handleFocus = () => {
            logger.info('Window focused, checking WebSocket connections');
            connectAccounts();
        };
    
        // Initial connection
        if (accounts.length > 0) {
            connectAccounts();
        }
    
        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
    
        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [accounts]);
    
    // Second useEffect for WebSocket connections
   useEffect(() => {
    const initializeWebSockets = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('No token found, skipping WebSocket initialization');
            return;
        }

        console.log('Accounts state:', accounts); // Debug log

        for (const account of accounts) {
            // Modified condition to check status instead of active flag
            if (account.status === 'active' && !account.is_token_expired) {
                console.log(`Initiating WebSocket connection for account ${account.account_id}`, {
                    status: account.status,
                    is_token_expired: account.is_token_expired,
                    has_credentials: account.has_credentials
                });

                try {
                    const connected = await webSocketManager.connect(
                        account.account_id,
                        token
                    );
                    console.log(`WebSocket connection attempt result for ${account.account_id}:`, connected);
                } catch (error) {
                    console.error(`WebSocket connection error for ${account.account_id}:`, error);
                }
            } else {
                console.log(`Skipping WebSocket connection for account ${account.account_id}`, {
                    status: account.status,
                    is_token_expired: account.is_token_expired,
                    has_credentials: account.has_credentials
                });
            }
        }
    };

    initializeWebSockets();

    return () => {
        accounts.forEach(account => {
            console.log(`Cleaning up WebSocket for account ${account.account_id}`);
            webSocketManager.disconnect(account.account_id);
        });
    };
}, [accounts]);

    // Fetch accounts
    const fetchAccounts = async (showLoadingState = true) => {
        try {
            if (showLoadingState) setIsLoading(true);
            setFetchError(null);

            await accountManager.fetchAccounts(true);
            setIsRefreshing(false);

        } catch (error) {
            logger.error('Error fetching accounts:', error);
            setFetchError(error.message || 'Failed to fetch accounts');
            toast({
                title: "Error",
                description: "Failed to fetch accounts",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            if (showLoadingState) setIsLoading(false);
        }
    };

    // Handle manual refresh
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        await fetchAccounts(false);
    }, [isRefreshing]);

    // Handle account deletion
    const handleAccountDeletion = useCallback(async () => {
        if (!selectedAccount) return;

        try {
            // Disconnect WebSocket first
            webSocketManager.disconnect(selectedAccount.account_id);
            
            // Remove account
            await accountManager.removeAccount(selectedAccount.account_id);
            
            toast({
                title: "Account Removed",
                description: "Trading account was successfully removed",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            
            onDeleteClose();
        } catch (error) {
            logger.error('Error removing account:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to remove account",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }, [selectedAccount, toast, onDeleteClose]);

    // Handle broker selection
    const handleBrokerSelect = useCallback((broker) => {
        if (!broker) return;
        
        setSelectedBroker(broker);
        onBrokerSelectClose();
        setTimeout(() => {
            onEnvironmentOpen();
        }, 0);
    }, [onBrokerSelectClose, onEnvironmentOpen]);

    // Toggle account expansion
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

    // Get connected accounts count
    const connectedAccountsCount = useMemo(() => 
        accounts.filter(acc => acc.active && !acc.is_token_expired).length,
    [accounts]);

    // Get WebSocket connection status
    const hasActiveWebSocket = useMemo(() => 
        Array.from(connectionStatuses.values()).some(status => status === 'connected'),
    [connectionStatuses]);

    // Render account list
    const renderAccounts = () => {
        if (isLoading) {
            return (
                <Flex justify="center" py={4}>
                    <Spinner size="xl" color="blue.500" />
                </Flex>
            );
        }

        if (fetchError) {
            return (
                <Flex direction="column" align="center" py={4}>
                    <AlertCircle size={24} color="red" />
                    <Text color="red.400" mt={2}>{fetchError}</Text>
                </Flex>
            );
        }

        if (accounts.length === 0) {
            return (
                <Flex justify="center" align="center" height="100%">
                    <Text color="whiteAlpha.600">No Connected Accounts</Text>
                </Flex>
            );
        }

        return accounts.map((account) => (
            <AccountItem
                key={account.account_id}
                account={account}
                isExpanded={expandedAccounts.has(account.account_id)}
                connectionStatus={connectionStatuses.get(account.account_id)}
                onToggleExpand={() => toggleAccountExpansion(account.account_id)}
                onDelete={() => {
                    setSelectedAccount(account);
                    onDeleteOpen();
                }}
            />
        ));
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
                {/* Header */}
                <HStack spacing={2} justify="space-between">
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
                    <IconButton
                        icon={<RefreshCw size={18} />}
                        variant="ghost"
                        isLoading={isRefreshing}
                        onClick={handleRefresh}
                        aria-label="Refresh accounts"
                        _hover={{ bg: 'whiteAlpha.100' }}
                    />
                </HStack>

                {/* Account List */}
                <VStack 
                    flex={1} 
                    spacing={1} 
                    overflowY="auto" 
                    align="stretch"
                    className="custom-scrollbar"
                >
                    {renderAccounts()}
                </VStack>

                {/* Footer */}
                <HStack justify="space-between" pt={2} borderTop="1px solid" borderColor="whiteAlpha.200">
                    <Text fontSize="xs" color="whiteAlpha.700">
                        Connected Accounts: {connectedAccountsCount}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.700">
                        WebSocket Status: {hasActiveWebSocket
                            ? <Text as="span" color="green.400">Connected</Text>
                            : <Text as="span" color="red.400">Disconnected</Text>
                        }
                    </Text>
                </HStack>
            </VStack>

            {/* Modals */}
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
                    onEnvironmentSelect={async (environment) => {
                        try {
                            onEnvironmentClose();
                            await fetchAccounts();
                        } catch (error) {
                            logger.error('Environment selection error:', error);
                            toast({
                                title: "Connection Error",
                                description: error.message || "Failed to connect to trading environment",
                                status: "error",
                                duration: 5000,
                                isClosable: true,
                            });
                        }
                    }}
                />
            )}

            <DeleteAccount
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}
                onConfirm={handleAccountDeletion}
                accountName={selectedAccount?.name}
                accountDetails={selectedAccount}
            />
        </Box>
    );
};

// Account list item component
// Continuation of Management.js - AccountItem component
const AccountItem = ({ 
    account, 
    isExpanded, 
    connectionStatus,
    onToggleExpand, 
    onDelete 
}) => (
    <Box 
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
            onClick={onToggleExpand}
            justify="space-between"
        >
            <Flex align="center" gap={2}>
                <AccountStatusIndicator 
                    tokenValid={!account.is_token_expired}
                    wsStatus={connectionStatus}
                />
                <Text fontWeight="bold" fontSize="sm">
                    {account.name}
                    <Text as="span" color="whiteAlpha.700" ml={2}>
                        {account.account_id} ({account.environment})
                    </Text>
                </Text>
            </Flex>
            
            <HStack spacing={2}>
                <Tooltip label="Remove Account">
                    <Box
                        as="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        opacity={0.6}
                        _hover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                    >
                        <Trash2 size={16} color="white" />
                    </Box>
                </Tooltip>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </HStack>
        </Flex>

        {isExpanded && (
            <Box p={2} pl={8}>
                <HStack spacing={6}>
                    <HStack spacing={2}>
                        <DollarSign size={14} />
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.700">Balance</Text>
                            <Text fontSize="sm" fontWeight="bold">
                                ${account.balance}
                            </Text>
                        </Box>
                    </HStack>
                    <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">Environment</Text>
                        <Text fontSize="sm" fontWeight="bold" textTransform="capitalize">
                            {account.environment}
                        </Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">Status</Text>
                        <Text fontSize="sm" fontWeight="bold" textTransform="capitalize">
                            {account.status}
                        </Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">Connection</Text>
                        <Text 
                            fontSize="sm" 
                            fontWeight="bold" 
                            color={connectionStatus === 'connected' ? 'green.400' : 'red.400'}
                        >
                            {connectionStatus || 'disconnected'}
                        </Text>
                    </Box>
                </HStack>
            </Box>
        )}
    </Box>
);

export default Management;