// src/components/features/trading/Management.js
import { useRef } from 'react';
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
    SlidersHorizontal,
    AlertCircle,
    Edit,
    Power,
    RefreshCw,
} from 'lucide-react';

import accountManager from '@/services/account/AccountManager';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';
import IBProvisioningStatus from '@/components/common/IBProvisioningStatus';
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import IBLoginModal from '@/components/common/Modal/IBLoginModal';
import AccountNicknameModal from '@/components/common/Modal/AccountNicknameModal';
import logger from '@/utils/logger';
import axiosInstance from '@/services/axiosConfig';
import { useFeatureFlag } from 'configcat-react';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';
import ibStatusService from '@/services/brokers/interactivebrokers/IBStatusService';
import PaymentStatusWarning from '@/components/subscription/PaymentStatusWarning';





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

const AccountOptions = ({ account, onEditName, onDelete, onPowerToggle, onRestart }) => {
    // Check if this is an Interactive Brokers account
    const isIBAccount = account.broker_id === 'interactivebrokers';
    
    // Determine power button text based on digital_ocean_status
    const getPowerButtonText = () => {
        if (!isIBAccount) return null;
        const status = account.digital_ocean_status || account.status;
        return status === 'running' ? 'Power Off' : 'Power On';
    };
    
    const getPowerButtonIcon = () => {
        const status = account.digital_ocean_status || account.status;
        return status === 'running' ? <Power size={14} /> : <Power size={14} />;
    };

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
                
                {/* Interactive Brokers specific options */}
                {isIBAccount && (
                    <>
                        <MenuItem
                            onClick={() => onPowerToggle(account)}
                            _hover={{ bg: "whiteAlpha.200" }}
                            bg="transparent"
                            color="white"
                            icon={getPowerButtonIcon()}
                        >
                            {getPowerButtonText()}
                        </MenuItem>
                        
                        <MenuItem
                            onClick={() => onRestart(account)}
                            _hover={{ bg: "whiteAlpha.200" }}
                            bg="transparent"
                            color="white"
                            icon={<RefreshCw size={14} />}
                        >
                            Restart
                        </MenuItem>
                    </>
                )}
                
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
    const [sortBy, setSortBy] = useState(null);
    const [accountUpdates, setAccountUpdates] = useState({});
    const [editingAccount, setEditingAccount] = useState(null);
    const { value: showPnL } = useFeatureFlag('show_pnl', false);
    const { value: enableExpansion } = useFeatureFlag('enable_expansion', true);
    const { connect: wsConnect, getConnectionState, isConnected, disconnect, getAccountData } = useWebSocketContext();

    // IB Status Polling - callback to update account status
    const handleIBStatusUpdate = useCallback((accountId, statusData) => {
        console.log('IB Status Update:', { accountId, statusData });
        
        // Update account with new status information
        setAccounts(prev => {
            const updatedAccounts = prev.map(account => {
                if (account.account_id === accountId) {
                    // Only update if status actually changed
                    if (account.digital_ocean_status !== statusData.status ||
                        account.ibeam_authenticated !== statusData.ibeamAuthenticated) {
                        
                        // Also update the account in AccountManager for persistence
                        accountManager.updateAccount(accountId, {
                            digital_ocean_status: statusData.status,
                            ibeam_authenticated: statusData.ibeamAuthenticated,
                            last_status_check: statusData.lastChecked
                        });
                        
                        return {
                            ...account,
                            digital_ocean_status: statusData.status,
                            ibeam_authenticated: statusData.ibeamAuthenticated,
                            last_status_check: statusData.lastChecked
                        };
                    }
                }
                return account;
            });
            return updatedAccounts;
        });
    }, []);

    // Subscribe to IB status updates
    useEffect(() => {
        const subscription = ibStatusService.getStatusUpdates().subscribe(({ accountId, statusData }) => {
            logger.info(`IB Status Update: ${JSON.stringify({ accountId, statusData })}`);
            handleIBStatusUpdate(accountId, statusData);
        });

        return () => subscription.unsubscribe();
    }, [handleIBStatusUpdate]);

    // Initialize IB accounts with the service
    useEffect(() => {
        const ibAccounts = accounts.filter(acc => acc.broker_id === 'interactivebrokers');
        if (ibAccounts.length > 0 && !ibStatusService.getStatus().isActive) {
            ibStatusService.start(accounts);
        }

        // Add any new IB accounts to the service
        ibAccounts.forEach(account => {
            ibStatusService.addAccount(account);
        });
    }, [accounts]);

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

    const {
        isOpen: isIBLoginOpen,
        onOpen: onIBLoginOpen,
        onClose: onIBLoginClose
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
          
          // Update accounts in component's local state
          setAccounts(prev => {
            const updatedAccounts = prev.map(acc => 
              acc.account_id === accountId ? { ...acc, nickname: nickname } : acc
            );
            console.log("Updated accounts state:", updatedAccounts);
            return updatedAccounts;
          });
          
          // Also update selected account if it matches
          if (selectedAccount && selectedAccount.account_id === accountId) {
            setSelectedAccount(prev => ({ ...prev, nickname: nickname }));
          }
          
          // Important: Update the central AccountManager service
          // This ensures the nickname change persists across the app and survives page refreshes
          await accountManager.updateAccount(accountId, { nickname: nickname });
          
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
          fetchAccounts(false);
        }
      }

    // Handle account deletion
    const handleAccountDeletion = useCallback(async () => {
        if (!selectedAccount) return;

        try {
            disconnect(selectedAccount.broker_id, selectedAccount.account_id);
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

    // Handle power toggle for IB accounts
    const handlePowerToggle = useCallback(async (account) => {
        const status = account.digital_ocean_status || account.status;
        const action = status === 'running' ? 'stop' : 'start';
        const actionText = status === 'running' ? 'stopping' : 'starting';
        
        try {
            const response = await axiosInstance.post(
                `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/${action}`
            );
            
            if (response.data.success) {
                toast({
                    title: "Server Action",
                    description: `Server is ${actionText}...`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                });
                
                // Refresh accounts to get updated status
                setTimeout(() => fetchAccounts(false), 2000);
                
                // IB status will be updated automatically by IBStatusService
            }
        } catch (error) {
            logger.error(`Error ${action}ing IB server:`, error);
            toast({
                title: "Server Error",
                description: error.response?.data?.detail || `Failed to ${action} server`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }, [toast, fetchAccounts]);

    // Handle restart for IB accounts
    const handleRestart = useCallback(async (account) => {
        try {
            const response = await axiosInstance.post(
                `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/restart`
            );
            
            if (response.data.success) {
                toast({
                    title: "Server Restarting",
                    description: "Server is restarting. This may take a few minutes.",
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                });
                
                // Refresh accounts to get updated status
                setTimeout(() => fetchAccounts(false), 3000);
                
                // IB status will be updated automatically by IBStatusService
            }
        } catch (error) {
            logger.error('Error restarting IB server:', error);
            toast({
                title: "Restart Error",
                description: error.response?.data?.detail || "Failed to restart server",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }, [toast, fetchAccounts]);

    // Handle broker selection
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

    const handleIBConnect = async (connectionData) => {
        try {
            setIsLoading(true);
            
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
                
                // Refresh accounts list
                await fetchAccounts();
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
        } finally {
            setIsLoading(false);
        }
    };

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

        const initializeSubscriptions = async () => {
            try {
                setIsLoading(true);
                
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
        };
    }, []);

    // Track if we've already attempted auto-connect to prevent duplicates
    const hasAutoConnectedRef = useRef(false);
    const lastConnectionAttemptRef = useRef({});
    
    useEffect(() => {
    // Add a ref to track connection attempts
    const connectionAttempts = new Set();
    
    const autoConnectAccounts = async () => {
        // Check if auto-connect is disabled
        const autoConnectDisabled = localStorage.getItem('disable_auto_connect') === 'true';
        if (autoConnectDisabled) {
            logger.info('Auto-connect is disabled by user preference');
            return;
        }
        
        // Check if user is authenticated
        const token = localStorage.getItem('access_token');
        if (!token) {
            logger.info('No auth token found, skipping auto-connect');
            return;
        }
        
        // Only proceed if we have accounts and not currently connecting
        if (accounts.length === 0) return;
        
        // Check if any connections are already active or pending
        let hasActiveConnections = false;
        for (const account of accounts) {
            const state = getConnectionState(account.broker_id, account.account_id);
            if (state && state !== 'disconnected' && state !== 'error') {
                hasActiveConnections = true;
                break;
            }
        }
        
        if (hasActiveConnections) {
            logger.info('Active connections found, skipping auto-connect');
            return;
        }
        
        for (const account of accounts) {
            // Create a unique key for this connection attempt
            const connectionKey = `${account.broker_id}:${account.account_id}`;
            
            // Skip if we're already attempting to connect to this account
            if (connectionAttempts.has(connectionKey)) {
                logger.info(`Skipping duplicate connection attempt for ${connectionKey}`);
                continue;
            }
            
            // Only connect to active accounts with valid tokens
            if (account.status === 'active' && account.broker_id && account.account_id) {
                // Double-check token validity
                const token = localStorage.getItem('access_token');
                if (!token) {
                    logger.warn(`No access token found for ${connectionKey}`);
                    continue;
                }
                try {
                    // Check if already connected
                    const currentState = getConnectionState(account.broker_id, account.account_id);
                    
                    // Skip if already connected, connecting, or in any validation state
                    if (currentState === 'connected' || 
                        currentState === 'ready' || 
                        currentState === 'connecting' ||
                        currentState === 'validating_user' ||
                        currentState === 'checking_subscription' ||
                        currentState === 'checking_broker_access' ||
                        currentState === 'connecting_to_broker') {
                        logger.info(`Skipping ${connectionKey} - already in state: ${currentState}`);
                        continue;
                    }
                    
                    // Check cooldown period (60 seconds between attempts for the same account)
                    const now = Date.now();
                    const lastAttempt = lastConnectionAttemptRef.current[connectionKey] || 0;
                    if (now - lastAttempt < 60000) {
                        logger.info(`Skipping ${connectionKey} - cooldown period active (${Math.round((60000 - (now - lastAttempt)) / 1000)}s remaining)`);
                        continue;
                    }
                    
                    // Mark this connection as being attempted
                    connectionAttempts.add(connectionKey);
                    lastConnectionAttemptRef.current[connectionKey] = now;
                    
                    logger.info(`Auto-connecting to ${account.broker_id}:${account.account_id}`);
                    
                    // Add a small delay between connection attempts to avoid overwhelming the server
                    if (connectionAttempts.size > 1) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                    
                    await wsConnect(account.broker_id, account.account_id);
                } catch (error) {
                    logger.error(`Failed to auto-connect to ${account.broker_id}:${account.account_id}:`, error);
                } finally {
                    // Remove from attempts set after completion
                    connectionAttempts.delete(connectionKey);
                }
            }
        }
    };
    
        // Add a delay before auto-connecting to ensure component is fully mounted
        // Increased delay to prevent rapid connection attempts on page load
        const timeoutId = setTimeout(() => {
            autoConnectAccounts();
        }, 1000);
        
        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            connectionAttempts.clear();
        };
    }, [accounts, wsConnect, getConnectionState]);
    

    // AccountItem Component
    const AccountItem = ({ 
        account, 
        isExpanded, 
        connectionStatus, 
        onToggleExpand, 
        onDelete,
        onEditName,
        getAccountData,
    }) => {
        // Get real-time account data from WebSocket context
        const realtimeData = getAccountData(account.broker_id, account.account_id);
        
        // Use real-time values if available, otherwise fall back to account values
        const displayValues = {
            balance: realtimeData?.balance ?? account.balance ?? 0,
            totalPnL: realtimeData?.totalPnL ?? account.totalPnL ?? 0,
            todaysPnL: realtimeData?.todaysPnL ?? account.todaysPnL ?? 0,
            openPnL: realtimeData?.openPnL ?? account.openPnL ?? 0,
            realizedPnL: realtimeData?.realizedPnL ?? account.realizedPnL ?? 0,
            weeklyPnL: realtimeData?.weeklyPnL ?? account.weeklyPnL ?? 0
        };

        // Check if this is an IB account that's provisioning
        const isIBProvisioning = account.broker_id === 'interactivebrokers' && 
            ['provisioning', 'initializing', 'starting'].includes(account.digital_ocean_status);
        
        // Show status for error states too
        const isIBError = account.broker_id === 'interactivebrokers' && 
            account.digital_ocean_status === 'error';

        return (
            <>
                {/* IB Provisioning Status - Shows above the account card */}
                {account.broker_id === 'interactivebrokers' && (
                    <IBProvisioningStatus 
                        account={account} 
                        isOpen={isIBProvisioning || isIBError}
                    />
                )}
                
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
                            account={account}
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
                    {showPnL&&(
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
                            onPowerToggle={handlePowerToggle}
                            onRestart={handleRestart}
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
            </>
        );
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
                connectionStatus={getConnectionState(account.broker_id, account.account_id)}
                onToggleExpand={(accountId) => toggleAccountExpansion(accountId)}
                onDelete={() => {
                    setSelectedAccount(account);
                    onDeleteOpen();
                }}
                onEditName={() => {
                    setEditingAccount(account);
                    openNicknameModal();
                }}
                getAccountData={getAccountData}
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
                {/* Payment Status Warning */}
                <PaymentStatusWarning showCompact={true} />
                
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

            {/* Modals */}
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
