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
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
} from '@chakra-ui/react';
import {
    Trash2,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    DollarSign,
    AlertCircle,
    Edit,
} from 'lucide-react';

import accountManager from '@/services/account/AccountManager';
import webSocketManager from '@/services/websocket/webSocketManager';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import AccountNicknameModal from '@/components/common/Modal/AccountNicknameModal';
import logger from '@/utils/logger';
import axiosInstance from '@/services/axiosConfig';

// SortButton Component
const SortButton = ({ onSort }) => {
    const sortOptions = [
        { label: 'Name', value: 'name' },
        { label: 'Broker', value: 'broker' },
        { label: 'Environment', value: 'environment' },
        { label: 'Balance', value: 'balance' }
    ];

    return (
        <Menu>
            <MenuButton
                as={Button}
                rightIcon={<ChevronDown />}
                bg="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
                borderWidth="1px"
                borderColor="rgba(255, 255, 255, 0.18)"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                _active={{ bg: "whiteAlpha.300" }}
            >
                Sort By
            </MenuButton>
            <MenuList
                bg="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
                borderColor="rgba(255, 255, 255, 0.18)"
                boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                borderRadius="xl"
            >
                {sortOptions.map((option) => (
                    <MenuItem
                        key={option.value}
                        onClick={() => onSort(option.value)}
                        _hover={{ bg: "whiteAlpha.200" }}
                        bg="transparent"
                        color="white"
                    >
                        {option.label}
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
};

const AccountOptions = ({ account, onEditName, onDelete }) => {
    return (
        <Menu>
            <MenuButton
                as={IconButton}
                icon={<MoreVertical size={16} />}
                variant="ghost"
                size="sm"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
            />
            <MenuList
                bg="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
                borderColor="rgba(255, 255, 255, 0.18)"
                boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                borderRadius="xl"
            >
                <MenuItem
                    onClick={() => onEditName(account)}
                    _hover={{ bg: "whiteAlpha.200" }}
                    bg="transparent"
                    color="white"
                    icon={<Edit size={14} />}
                >
                    Edit Nickname
                </MenuItem>
                <MenuItem
                    onClick={() => onDelete(account)}
                    _hover={{ bg: "whiteAlpha.200" }}
                    bg="transparent"
                    color="white"
                    icon={<Trash2 size={14} />}
                >
                    Delete Account
                </MenuItem>
            </MenuList>
        </Menu>
    );
};

const Management = () => {
    // State Management
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [expandedAccounts, setExpandedAccounts] = useState(new Set());
    const [fetchError, setFetchError] = useState(null);
    const [connectionStatuses, setConnectionStatuses] = useState(new Map());
    const [sortBy, setSortBy] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);

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

    const {
        isOpen: isNicknameModalOpen,
        onOpen: openNicknameModal,
        onClose: closeNicknameModal
    } = useDisclosure();

    // Handlers
    const handleSort = (sortKey) => {
        setSortBy(sortKey);
    };

    const fetchAccounts = async (showLoadingState = true) => {
        try {
            if (showLoadingState) setIsLoading(true);
            setFetchError(null);

            await accountManager.fetchAccounts(true);

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

    const handleUpdateNickname = async (accountId, nickname) => {
        try {
            await axiosInstance.patch(`/api/v1/brokers/accounts/${accountId}`, {
                name: nickname
            });

            setAccounts(prev => prev.map(acc => 
                acc.account_id === accountId ? { ...acc, name: nickname } : acc
            ));

        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update account name",
                status: "error",
                duration: 3000,
            });
        }
    };

    // Handle account deletion
    const handleAccountDeletion = useCallback(async () => {
        if (!selectedAccount) return;

        try {
            webSocketManager.disconnect(selectedAccount.account_id);
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

    // Sort accounts based on current sortBy value
    const sortedAccounts = useMemo(() => {
        if (!sortBy) return accounts;

        return [...accounts].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'broker':
                    return a.broker_id.localeCompare(b.broker_id);
                case 'environment':
                    return a.environment.localeCompare(b.environment);
                case 'balance':
                    return (b.balance || 0) - (a.balance || 0);
                default:
                    return 0;
            }
        });
    }, [accounts, sortBy]);

    // Effect for initializing account subscriptions
    useEffect(() => {
        let accountSubscription;
        let wsStatusSubscription;
    
        const initializeSubscriptions = async () => {
            try {
                setIsLoading(true);
                
                // Initialize WebSocket status subscription
                wsStatusSubscription = webSocketManager.onStatus().subscribe({
                    next: (statusUpdate) => {
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
            if (accountSubscription) accountSubscription.unsubscribe();
            if (wsStatusSubscription) wsStatusSubscription.unsubscribe();
        };
    }, []);

    // Effect for WebSocket connections
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

    // AccountItem Component
    const AccountItem = ({ 
        account, 
        isExpanded, 
        connectionStatus, 
        onToggleExpand, 
        onDelete,
        onEditName,
    }) => (
        <Box 
            bg="whiteAlpha.100" 
            borderRadius="lg"
            overflow="hidden"
            transition="all 0.3s"
            _hover={{ bg: "whiteAlpha.200" }}
        >
            {/* Main Account Row - More Compact */}
            <Flex 
                py={2}  // Reduced from p={3}
                px={3}
                align="center"
                justify="space-between"
            >
                {/* Account Info Group - More Compact */}
                <Flex align="center" gap={2} flex="2">  
                    <AccountStatusIndicator 
                        tokenValid={!account.is_token_expired}
                        wsStatus={connectionStatus}
                    />
                    <VStack spacing={0} align="flex-start"> 
                        <Text fontWeight="bold" fontSize="sm" lineHeight="1.2">
                            {account.name}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">
                            {account.broker_id} • {account.environment}
                        </Text>
                    </VStack>
                </Flex>
    
                {/* Balance Group - More Compact */}
                <Flex align="center" gap={4} flex="3" px={3}> 
                    <VStack spacing={0} align="flex-start">  
                        <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">Balance</Text>
                        <Text fontSize="sm" fontWeight="bold" lineHeight="1.2">
                            ${account.balance}
                        </Text>
                    </VStack>
    
                    <VStack spacing={0} align="flex-start">
                        <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">Total P&L</Text>
                        <Text 
                            fontSize="sm" 
                            fontWeight="bold"
                            lineHeight="1.2"
                            color={account.totalPnL >= 0 ? 'green.400' : 'red.400'}
                        >
                            ${account.totalPnL || '0.00'}
                        </Text>
                    </VStack>
    
                    <VStack spacing={0} align="flex-start">
                        <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">Today's P&L</Text>
                        <Text 
                            fontSize="sm" 
                            fontWeight="bold"
                            lineHeight="1.2"
                            color={account.openPnL >= 0 ? 'green.400' : 'red.400'}
                        >
                            ${account.openPnL || '0.00'}
                        </Text>
                    </VStack>
                </Flex>
    
                {/* Actions Group */}
                <Flex align="center" gap={1} flex="0 0 auto"> 
                    <AccountOptions 
                        account={account}
                        onEditName={onEditName}
                        onDelete={onDelete}
                    />
                    <Box 
                        as="button"
                        onClick={() => onToggleExpand(account.account_id)}
                        opacity={0.6}
                        _hover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
                    </Box>
                </Flex>
            </Flex>
    
            {/* Expanded Section */}
            {isExpanded && (
                <Box 
                    p={3} 
                    borderTop="1px solid" 
                    borderColor="whiteAlpha.200"
                    bg="whiteAlpha.50"
                >
                    <HStack spacing={6}>
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.700">Open P&L</Text>
                            <Text fontSize="sm" fontWeight="semibold" color={account.openPnL >= 0 ? 'green.400' : 'red.400'}>
                                ${account.openPnL || '0.00'}
                            </Text>
                        </Box>
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.700">Realized P&L</Text>
                            <Text fontSize="sm" fontWeight="semibold" color={account.realizedPnL >= 0 ? 'green.400' : 'red.400'}>
                                ${account.realizedPnL || '0.00'}
                            </Text>
                        </Box>
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.700">Weekly P&L</Text>
                            <Text fontSize="sm" fontWeight="semibold" color={account.weeklyPnL >= 0 ? 'green.400' : 'red.400'}>
                                ${account.weeklyPnL || '0.00'}
                            </Text>
                        </Box>
                    </HStack>
                </Box>
            )}
        </Box>
    );
    
    // Render accounts list
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
    
        if (sortedAccounts.length === 0) {
            return (
                <Flex justify="center" align="center" height="100%">
                    <Text color="whiteAlpha.600">No Connected Accounts</Text>
                </Flex>
            );
        }
    
        return sortedAccounts.map((account) => (
            <AccountItem
                key={account.account_id}
                account={account}
                isExpanded={expandedAccounts.has(account.account_id)}
                connectionStatus={connectionStatuses.get(account.account_id)}
                onToggleExpand={(accountId) => toggleAccountExpansion(accountId)}
                onDelete={() => {
                    setSelectedAccount(account);
                    onDeleteOpen();
                }}
                onEditName={() => {
                    setEditingAccount(account);
                    openNicknameModal();
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
                <HStack justify="space-between">
                    <SortButton onSort={handleSort} />
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

            {editingAccount && (
                <AccountNicknameModal
                    isOpen={isNicknameModalOpen}
                    onClose={closeNicknameModal}
                    account={editingAccount}
                    onSave={handleUpdateNickname}
                />
            )}
        </Box>
    );
};

export default Management;