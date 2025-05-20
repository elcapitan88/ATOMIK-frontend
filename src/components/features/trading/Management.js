import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import React from 'react';
import {
    Box, VStack, Text, Flex, HStack, Spinner, useToast,
    useDisclosure, IconButton, Menu, MenuButton, 
    MenuList, MenuItem, Button,
} from '@chakra-ui/react';
import {
    Trash2, ChevronDown, ChevronUp, MoreVertical,
    SlidersHorizontal, AlertCircle, Edit,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFeatureFlag } from 'configcat-react';
import { useAccounts } from '@/hooks/useAccounts';
import logger from '@/utils/logger';
import axiosInstance from '@/services/axiosConfig';
import accountManager from '@/services/account/AccountManager';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import IBLoginModal from '@/components/common/Modal/IBLoginModal';
import AccountNicknameModal from '@/components/common/Modal/AccountNicknameModal';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';
import webSocketManager, { ConnectionState } from '@/services/websocket-proxy/WebSocketManager';

// SortButton Component (unchanged)
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
                as={IconButton}
                icon={<SlidersHorizontal size={18} />}
                variant="ghost"
                color="white"
                aria-label="Sort strategies"
                size="sm"
                _hover={{
                    bg: 'whiteAlpha.100'
                }}
            />
            <MenuList
                bg="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
                borderColor="rgba(255, 255, 255, 0.18)"
                boxShadow="0 8px 32px 0 rgba(0, 0, 198, 224, 0.37)"
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

// AccountOptions Component (unchanged)
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
                boxShadow="0 8px 32px 0 rgba(0, 0, 198, 224, 0.37)"
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
    const toast = useToast();
    // Use the useAccounts hook to fetch and cache accounts data
    const { 
        data: accounts = [], 
        isLoading, 
        isError, 
        error, 
        refetch 
    } = useAccounts();

    // State for WebSocket connection tracking
    const [connectionStatuses, setConnectionStatuses] = useState(() => new Map());
    const connectingRef = useRef(false);
    
    // Keep other state variables
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [expandedAccounts, setExpandedAccounts] = useState(new Set());
    const [fetchError, setFetchError] = useState(null);
    const [sortBy, setSortBy] = useState(null);
    const [accountUpdates, setAccountUpdates] = useState({});
    const [editingAccount, setEditingAccount] = useState(null);
    const { value: showPnL } = useFeatureFlag('show_pnl', false);
    const { value: enableExpansion } = useFeatureFlag('enable_expansion', true);
    
    // Modal controls (unchanged)
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

    const {
        isOpen: isIBLoginOpen,
        onOpen: onIBLoginOpen,
        onClose: onIBLoginClose
    } = useDisclosure();

    // Handlers (unchanged)
    const handleSort = (sortKey) => {
        setSortBy(sortKey);
    };

    // Setup WebSocket connection status listeners
    useEffect(() => {
        // Listen for connection state changes
        const handleConnectionState = (update) => {
            const { brokerId, accountId, state } = update;
            
            // Map the connection state to a status for the indicator
            let status;
            switch (state) {
                case ConnectionState.CONNECTED:
                    status = 'connected';
                    break;
                case ConnectionState.CONNECTING:
                    status = 'connecting';
                    break;
                case ConnectionState.RECONNECTING:
                    status = 'reconnecting';
                    break;
                case ConnectionState.ERROR:
                    status = 'error';
                    break;
                case ConnectionState.DISCONNECTED:
                default:
                    status = 'disconnected';
                    break;
            }
            
            // Update the status map
            setConnectionStatuses(prev => {
                const newMap = new Map(prev);
                newMap.set(accountId, status);
                return newMap;
            });
        };
        
        // Set up event listener
        webSocketManager.on('connectionState', handleConnectionState);
        
        // Clean up on unmount
        return () => {
            webSocketManager.removeListener('connectionState', handleConnectionState);
        };
    }, []);
    
    // Listen for WebSocket data updates
    useEffect(() => {
        // Handle account updates
        const handleAccountUpdate = (data) => {
            setAccountUpdates(prev => ({
                ...prev,
                [data.accountId]: {
                    ...prev[data.accountId],
                    ...data,
                    timestamp: Date.now()
                }
            }));
        };
        
        // Handle position updates
        const handlePositionUpdate = (data) => {
            // Check if this update belongs to one of our accounts
            const accountId = data.accountId;
            const relevantAccount = accounts.find(acc => acc.account_id == accountId);
            if (!relevantAccount) return;
            
            setAccountUpdates(prev => {
                // Get existing account data or initialize
                const accountData = prev[accountId] || {};
                
                // Update positions array if it exists
                let positions = [...(accountData.positions || [])];
                const existingPosIndex = positions.findIndex(
                    p => p.contractId === data.contractId || p.symbol === data.symbol
                );
                
                if (existingPosIndex >= 0) {
                    // Update existing position
                    positions[existingPosIndex] = { ...positions[existingPosIndex], ...data };
                } else {
                    // Add new position
                    positions.push(data);
                }
                
                // Calculate total P&L
                const totalPnL = positions.reduce((sum, pos) => 
                    sum + (pos.pnl || pos.totalPl || pos.unrealizedPL || 0), 0);
                
                return {
                    ...prev,
                    [accountId]: {
                        ...accountData,
                        positions,
                        totalPnL,
                        timestamp: Date.now()
                    }
                };
            });
        };
        
        // Set up event listeners
        webSocketManager.on('accountUpdate', handleAccountUpdate);
        webSocketManager.on('positionUpdate', handlePositionUpdate);
        
        // Clean up on unmount
        return () => {
            webSocketManager.removeListener('accountUpdate', handleAccountUpdate);
            webSocketManager.removeListener('positionUpdate', handlePositionUpdate);
        };
    }, [accounts]);

    // Effect to establish WebSocket connections for active accounts when accounts load
    useEffect(() => {
        // Skip if there are no accounts or already connecting
        if (accounts.length === 0 || connectingRef.current) return;
        
        const connectAccounts = async () => {
            try {
                connectingRef.current = true;
                logger.info(`Accounts loaded: ${accounts.length}, establishing WebSocket connections`);
                
                // Connect to each active account
                for (const account of accounts) {
                    // Skip if account is not active
                    if (account.status !== 'active' || account.is_token_expired) {
                        continue;
                    }
                    
                    const brokerId = account.broker_id || 'tradovate';
                    const accountId = account.account_id;
                    
                    // Skip if already connected
                    if (webSocketManager.isConnected(brokerId, accountId)) {
                        continue;
                    }
                    
                    try {
                        // Use shared connection if possible
                        await webSocketManager.getOrCreateSharedConnection(
                            brokerId, 
                            account.environment || 'demo',
                            accountId
                        );
                        
                        logger.info(`Connected to ${brokerId}:${accountId}`);
                    } catch (error) {
                        logger.error(`Failed to connect to ${brokerId}:${accountId}:`, error);
                        
                        // Update connection status to error
                        setConnectionStatuses(prev => {
                            const newMap = new Map(prev);
                            newMap.set(accountId, 'error');
                            return newMap;
                        });
                    }
                }
            } catch (error) {
                logger.error('Error connecting WebSockets:', error);
            } finally {
                connectingRef.current = false;
            }
        };
        
        // Run connection attempt with a slight delay to avoid race conditions
        const timer = setTimeout(connectAccounts, 1000);
        
        // Clean up
        return () => clearTimeout(timer);
    }, [accounts]);

    // Effect for error handling (unchanged)
    useEffect(() => {
        if (isError && error) {
            toast({
                title: "Error Loading Accounts",
                description: error.message || "Failed to fetch account data",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            
            logger.error('React Query error fetching accounts:', error);
            setFetchError(error.message || 'Error loading accounts');
        }
    }, [isError, error, toast]);
    
    // Effect to refetch on mount and window focus (unchanged)
    useEffect(() => {
        refetch();
        
        const handleFocus = () => {
            console.log('Window focused, refreshing accounts data');
            refetch();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [refetch]);
    
    // Cleanup WebSocket connections on unmount
    useEffect(() => {
        return () => {
            // No need to disconnect all connections - let WebSocketManager handle this
            // Just clean up our local state
            setConnectionStatuses(new Map());
        };
    }, []);

    // Handle account deletion (unchanged)
    const handleAccountDeletion = useCallback(async () => {
        if (!selectedAccount) return;
    
        try {
            // Close WebSocket first
            const brokerId = selectedAccount.broker_id || 'tradovate';
            webSocketManager.disconnect(brokerId, selectedAccount.account_id);
            
            await accountManager.removeAccount(selectedAccount.account_id);
            
            // Trigger refetch to update the UI
            refetch();
            
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
    }, [selectedAccount, toast, onDeleteClose, refetch]);

    // Handle broker selection (unchanged - keeping IB implementation as is)
    const handleBrokerSelect = useCallback((broker) => {
        if (!broker) return;
        
        setSelectedBroker(broker);
        onBrokerSelectClose();
        
        if (broker.id === 'interactivebrokers') {
            // For Interactive Brokers, open the login modal
            setTimeout(() => {
                onIBLoginOpen();
            }, 0);
        } else {
            // For other brokers like Tradovate, continue with the existing flow
            setTimeout(() => {
                onEnvironmentOpen();
            }, 0);
        }
    }, [onBrokerSelectClose, onEnvironmentOpen, onIBLoginOpen]);

    // Toggle account expansion (unchanged)
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

    // Connect to WebSocket manually for an account
    const connectToWebSocket = useCallback((account) => {
        if (!account) return;
        
        const brokerId = account.broker_id || 'tradovate';
        const accountId = account.account_id;
        
        logger.info(`Manually connecting to WebSocket for account ${accountId}`);
        
        // Use WebSocketManager to connect
        webSocketManager.connect(brokerId, accountId, {
            environment: account.environment || 'demo'
        })
        .then(() => {
            toast({
                title: "Connected",
                description: `Connected to ${account.broker_id} account`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        })
        .catch(error => {
            toast({
                title: "Connection Failed",
                description: error.message || "Failed to connect to account",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        });
    }, [toast]);

    // Handle IB Connect (unchanged)
    const handleIBConnect = async (connectionData) => {
        try {
            // Make API call to connect IB account
            const response = await axiosInstance.post('/api/v1/brokers/interactivebrokers/connect', {
                environment: connectionData.environment,
                credentials: connectionData.credentials
            });
            
            if (response.data) {
                toast({
                    title: "Success",
                    description: "Interactive Brokers account connected successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                
                // Close the modal
                onIBLoginClose();
                
                // Refresh accounts list using refetch
                refetch();
            }
        } catch (error) {
            console.error('Error connecting IB account:', error);
            toast({
                title: "Connection Error",
                description: error.response?.data?.detail || error.message || "Failed to connect to Interactive Brokers",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Sorted accounts logic (unchanged)
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

    // Account item component with enhanced WebSocket status display
    const AccountItem = ({ 
        account, 
        isExpanded, 
        connectionStatus, 
        onToggleExpand, 
        onDelete,
        onEditName,
    }) => {
        const updates = accountUpdates[account.account_id];
        
        // Use real-time values if available, otherwise fall back to account values
        const displayValues = {
            balance: updates?.balance ?? account.balance ?? 0,
            totalPnL: updates?.totalPnL ?? account.totalPnL ?? 0,
            todaysPnL: updates?.todaysPnL ?? account.todaysPnL ?? 0,
            openPnL: updates?.openPnL ?? account.openPnL ?? 0,
            realizedPnL: updates?.realizedPnL ?? account.realizedPnL ?? 0,
            weeklyPnL: updates?.weeklyPnL ?? account.weeklyPnL ?? 0
        };

        return (
            <Box 
                bg="whiteAlpha.100" 
                borderRadius="lg"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{ bg: "whiteAlpha.200" }}
            >
                {/* Main Account Row - More Compact */}
                <Flex 
                    py={2}
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
                            {account.nickname ? account.nickname : account.name}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">
                                {account.broker_id} • {account.environment}
                            </Text>
                        </VStack>
                    </Flex>
        
                    {/* Balance Group - More Compact */}
                    {showPnL && (
                    <Flex align="center" gap={4} flex="3" px={3}> 
                        <VStack spacing={0} align="flex-start">  
                            <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">Balance</Text>
                            <Text fontSize="sm" fontWeight="bold" lineHeight="1.2">
                                ${displayValues.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </VStack>

                        <VStack spacing={0} align="flex-start">
                            <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">Total P&L</Text>
                            <Text 
                                fontSize="sm" 
                                fontWeight="bold"
                                lineHeight="1.2"
                                color={displayValues.totalPnL >= 0 ? 'green.400' : 'red.400'}
                            >
                                ${displayValues.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </VStack>

                        <VStack spacing={0} align="flex-start">
                            <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1.2">Open P&L</Text>
                            <Text 
                                fontSize="sm" 
                                fontWeight="bold"
                                lineHeight="1.2"
                                color={displayValues.openPnL >= 0 ? 'green.400' : 'red.400'}
                            >
                                ${displayValues.openPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </VStack>
                    </Flex>
                    )}
        
                    {/* Actions Group */}
                    <Flex align="center" gap={1} flex="0 0 auto"> 
                       <AccountOptions 
                            account={account}
                            onEditName={onEditName}
                            onDelete={onDelete}
                        />
                        {enableExpansion && (
                        <Box 
                            as="button"
                            onClick={() => onToggleExpand(account.account_id)}
                            opacity={0.6}
                            _hover={{ opacity: 1 }}
                            transition="opacity 0.2s"
                        >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
                        </Box>
                        )}
                    </Flex>
                </Flex>
        
                {/* Expanded Section */}
                {enableExpansion && isExpanded && showPnL && (
                    <Box 
                        p={3} 
                        borderTop="1px solid" 
                        borderColor="whiteAlpha.200"
                        bg="whiteAlpha.50"
                    >
                        <HStack spacing={6}>
                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.700">Today's P&L</Text>
                                <Text fontSize="sm" fontWeight="semibold" color={displayValues.todaysPnL >= 0 ? 'green.400' : 'red.400'}>
                                    ${displayValues.todaysPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.700">Realized P&L</Text>
                                <Text fontSize="sm" fontWeight="semibold" color={displayValues.realizedPnL >= 0 ? 'green.400' : 'red.400'}>
                                    ${displayValues.realizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="whiteAlpha.700">Weekly P&L</Text>
                                <Text fontSize="sm" fontWeight="semibold" color={displayValues.weeklyPnL >= 0 ? 'green.400' : 'red.400'}>
                                    ${displayValues.weeklyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </Box>
                        </HStack>
                    </Box>
                )}
            </Box>
        );
    };

    // Handle nickname update
    const handleUpdateNickname = async (accountId, nickname) => {
        console.log("Starting nickname update:", { accountId, nickname });
        
        // Track the loading toast ID to close it later
        let loadingToastId = null;
        
        try {
            // Show loading toast
            loadingToastId = toast({
                title: "Updating nickname",
                description: "Saving your changes...",
                status: "loading",
                duration: null,
                isClosable: false,
            });
            
            // Make the API call to update the nickname
            const response = await axiosInstance.patch(`/api/v1/brokers/accounts/${accountId}`, {
                nickname: nickname
            });
            
            // Log the successful response
            console.log("Nickname update response:", response.data);
            
            // Update selected account if it matches
            if (selectedAccount && selectedAccount.account_id === accountId) {
                setSelectedAccount(prev => ({ ...prev, nickname: nickname }));
            }
            
            // Important: Update the central AccountManager service
            await accountManager.updateAccount(accountId, { nickname: nickname });
            
            // Trigger a refetch to update the accounts data
            refetch();
            
            // Close loading toast
            if (loadingToastId) {
                toast.close(loadingToastId);
            }
            
            // Show success toast
            toast({
                title: "Nickname Updated",
                description: "Account nickname has been successfully updated",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            
        } catch (error) {
            // Close loading toast
            if (loadingToastId) {
                toast.close(loadingToastId);
            }
            
            console.error("Nickname update error:", error);
            
            toast({
                title: "Update Failed",
                description: error.response?.data?.detail || error.message || "Failed to update account nickname",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            
            // Reload accounts to ensure state is in sync
            refetch();
        }
    };
    
    // Render accounts list with loading and error states
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
            {/* Update this outer VStack */}
            <VStack p={3} color="white" spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="space-between" flex="0 0 auto">
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
                    <SortButton onSort={handleSort} />
                </HStack>

                {/* Update the Account List VStack */}
                <VStack 
                    spacing={1} 
                    overflowY="auto" 
                    align="stretch"
                    maxH="336px"
                    minH="0"
                    w="full"
                    css={{
                        '&::-webkit-scrollbar': {
                            width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                            width: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '24px',
                        },
                    }}
                >
                    {renderAccounts()}
                </VStack>
            </VStack>

            {/* Modals - Unchanged */}
            <BrokerSelectionModal
                isOpen={isBrokerSelectOpen}
                onClose={onBrokerSelectClose}
                onBrokerSelect={handleBrokerSelect}
            />
            <IBLoginModal
                isOpen={isIBLoginOpen}
                onClose={onIBLoginClose}
                onConnect={handleIBConnect}
            />

            {selectedBroker && (
                <BrokerEnvironmentModal
                    isOpen={isEnvironmentOpen}
                    onClose={onEnvironmentClose}
                    selectedBroker={selectedBroker}
                    onEnvironmentSelect={async (environment) => {
                        try {
                            onEnvironmentClose();
                            // Use refetch instead of fetchAccounts
                            refetch();
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