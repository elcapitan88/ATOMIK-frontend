import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Flex,
    Badge,
    useToast,
    useDisclosure,
    Spinner,
    Icon,
    Divider,
    Alert,
    AlertIcon,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from '@chakra-ui/react';
import {
    Building2,
    Plus,
    RefreshCw,
    Trash2,
    Key,
    CheckCircle,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import accountManager from '@/services/account/AccountManager';
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import IBLoginModal from '@/components/common/Modal/IBLoginModal';
import BinanceApiKeyModal from '@/components/common/Modal/BinanceApiKeyModal';
import { getBrokerById } from '@/utils/constants/brokers';
import axiosInstance from '@/services/axiosConfig';

const AccountCard = ({ account, onUpdate, onDisconnect }) => {
    const broker = getBrokerById(account.broker_id);
    const isActive = account.status === 'active';
    const isExpired = account.is_token_expired;

    // Determine status
    let statusColor = 'green';
    let statusText = 'Active';
    if (isExpired) {
        statusColor = 'red';
        statusText = 'Expired';
    } else if (!isActive) {
        statusColor = 'gray';
        statusText = 'Inactive';
    }

    // Format last connected time
    const formatLastConnected = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Box
            p={4}
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="lg"
            _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
            transition="all 0.2s"
        >
            <Flex justify="space-between" align="flex-start">
                <HStack spacing={4}>
                    {/* Broker Logo */}
                    <Box
                        w="48px"
                        h="48px"
                        bg="rgba(255, 255, 255, 0.1)"
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        overflow="hidden"
                    >
                        {broker?.logo ? (
                            <img
                                src={broker.logo}
                                alt={broker.name}
                                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <Icon as={Building2} color="whiteAlpha.600" />
                        )}
                    </Box>

                    {/* Account Info */}
                    <VStack align="start" spacing={1}>
                        <HStack spacing={2}>
                            <Text fontWeight="semibold" color="white">
                                {account.nickname || account.name || broker?.name || account.broker_id}
                            </Text>
                            <Badge
                                colorScheme={statusColor}
                                fontSize="xs"
                                px={2}
                                borderRadius="full"
                            >
                                {statusText}
                            </Badge>
                        </HStack>
                        <Text fontSize="sm" color="whiteAlpha.700">
                            {account.broker_id} • {account.environment}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500">
                            Last connected: {formatLastConnected(account.updated_at || account.last_connected)}
                        </Text>
                    </VStack>
                </HStack>

                {/* Actions */}
                <HStack spacing={2}>
                    {/* Show update credentials for API key brokers */}
                    {(account.broker_id === 'binance' || account.broker_id === 'binanceus') && (
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="yellow"
                            leftIcon={<Key size={14} />}
                            onClick={() => onUpdate(account)}
                            _hover={{ bg: 'rgba(240, 185, 11, 0.1)' }}
                        >
                            Update Key
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => onDisconnect(account)}
                        _hover={{ bg: 'rgba(245, 101, 101, 0.1)' }}
                    >
                        Disconnect
                    </Button>
                </HStack>
            </Flex>
        </Box>
    );
};

const ConnectedAccountsSection = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const toast = useToast();
    const cancelRef = React.useRef();

    // Modal controls
    const { isOpen: isBrokerSelectOpen, onOpen: onBrokerSelectOpen, onClose: onBrokerSelectClose } = useDisclosure();
    const { isOpen: isEnvironmentOpen, onOpen: onEnvironmentOpen, onClose: onEnvironmentClose } = useDisclosure();
    const { isOpen: isIBLoginOpen, onOpen: onIBLoginOpen, onClose: onIBLoginClose } = useDisclosure();
    const { isOpen: isBinanceOpen, onOpen: onBinanceOpen, onClose: onBinanceClose } = useDisclosure();
    const { isOpen: isDisconnectOpen, onOpen: onDisconnectOpen, onClose: onDisconnectClose } = useDisclosure();

    // Fetch accounts
    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            await accountManager.fetchAccounts(true);
            const allAccounts = accountManager.getAccounts();
            setAccounts(allAccounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast({
                title: "Error",
                description: "Failed to fetch connected accounts",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();

        // Subscribe to account updates
        const subscription = accountManager.getAccountUpdates().subscribe({
            next: (update) => {
                if (update.type === 'bulk') {
                    setAccounts(update.accounts);
                } else {
                    fetchAccounts();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Handle broker selection for new connection
    const handleBrokerSelect = (broker) => {
        setSelectedBroker(broker);
        onBrokerSelectClose();

        if (broker.id === 'interactivebrokers') {
            setTimeout(() => onIBLoginOpen(), 0);
        } else if (broker.id === 'binance' || broker.id === 'binanceus') {
            setTimeout(() => onBinanceOpen(), 0);
        } else {
            setTimeout(() => onEnvironmentOpen(), 0);
        }
    };

    // Handle update credentials (for Binance)
    const handleUpdateCredentials = (account) => {
        setSelectedAccount(account);
        setSelectedBroker(getBrokerById(account.broker_id));
        onBinanceOpen();
    };

    // Handle disconnect
    const handleDisconnectClick = (account) => {
        setSelectedAccount(account);
        onDisconnectOpen();
    };

    const handleDisconnectConfirm = async () => {
        if (!selectedAccount) return;

        try {
            await accountManager.removeAccount(selectedAccount.account_id);
            toast({
                title: "Account Disconnected",
                description: "The account has been successfully disconnected",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onDisconnectClose();
            setSelectedAccount(null);
        } catch (error) {
            console.error('Error disconnecting account:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to disconnect account",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Handle IB connect
    const handleIBConnect = async (connectionData) => {
        try {
            await axiosInstance.post('/api/v1/brokers/interactivebrokers/connect', {
                environment: connectionData.environment,
                credentials: connectionData.credentials
            });

            toast({
                title: "Success",
                description: "Interactive Brokers account connected",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            onIBLoginClose();
            await fetchAccounts();
        } catch (error) {
            toast({
                title: "Connection Error",
                description: error.response?.data?.detail || error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Handle Binance connect success
    const handleBinanceSuccess = async () => {
        onBinanceClose();
        setSelectedAccount(null);
        await fetchAccounts();
    };

    return (
        <VStack spacing={6} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                    <HStack>
                        <Icon as={Building2} color="#00C6E0" />
                        <Text fontSize="lg" fontWeight="semibold" color="white">
                            Connected Accounts
                        </Text>
                    </HStack>
                    <Text fontSize="sm" color="whiteAlpha.600">
                        Manage your connected broker accounts
                    </Text>
                </VStack>

                <HStack spacing={3}>
                    <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RefreshCw size={14} />}
                        onClick={fetchAccounts}
                        isLoading={isLoading}
                        color="white"
                        borderColor="whiteAlpha.300"
                        _hover={{ borderColor: 'whiteAlpha.500' }}
                    >
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="cyan"
                        leftIcon={<Plus size={14} />}
                        onClick={onBrokerSelectOpen}
                    >
                        Connect Account
                    </Button>
                </HStack>
            </Flex>

            <Divider borderColor="whiteAlpha.200" />

            {/* Info Alert */}
            <Alert
                status="info"
                bg="rgba(66, 153, 225, 0.1)"
                border="1px solid rgba(66, 153, 225, 0.3)"
                borderRadius="md"
                color="white"
            >
                <AlertIcon color="blue.300" />
                <Text fontSize="sm">
                    Connected accounts can be used for automated trading with your strategies.
                    You can connect multiple accounts from different brokers.
                </Text>
            </Alert>

            {/* Accounts List */}
            {isLoading ? (
                <Flex justify="center" py={8}>
                    <Spinner size="lg" color="#00C6E0" />
                </Flex>
            ) : accounts.length === 0 ? (
                <Box
                    p={8}
                    bg="rgba(255, 255, 255, 0.03)"
                    borderRadius="lg"
                    textAlign="center"
                >
                    <VStack spacing={4}>
                        <Icon as={Building2} size={48} color="whiteAlpha.400" />
                        <Text color="whiteAlpha.600">No connected accounts</Text>
                        <Button
                            colorScheme="cyan"
                            leftIcon={<Plus size={16} />}
                            onClick={onBrokerSelectOpen}
                        >
                            Connect Your First Account
                        </Button>
                    </VStack>
                </Box>
            ) : (
                <VStack spacing={3} align="stretch">
                    {accounts.map((account) => (
                        <AccountCard
                            key={account.account_id}
                            account={account}
                            onUpdate={handleUpdateCredentials}
                            onDisconnect={handleDisconnectClick}
                        />
                    ))}
                </VStack>
            )}

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

            <BinanceApiKeyModal
                isOpen={isBinanceOpen}
                onClose={onBinanceClose}
                onSuccess={handleBinanceSuccess}
                brokerId={selectedBroker?.id || 'binance'}
            />

            {selectedBroker && (
                <BrokerEnvironmentModal
                    isOpen={isEnvironmentOpen}
                    onClose={onEnvironmentClose}
                    selectedBroker={selectedBroker}
                    onEnvironmentSelect={async () => {
                        onEnvironmentClose();
                        await fetchAccounts();
                    }}
                />
            )}

            {/* Disconnect Confirmation Dialog */}
            <AlertDialog
                isOpen={isDisconnectOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDisconnectClose}
                isCentered
            >
                <AlertDialogOverlay bg="blackAlpha.300" backdropFilter="blur(10px)">
                    <AlertDialogContent
                        bg="rgba(0, 0, 0, 0.85)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        borderRadius="xl"
                        color="white"
                    >
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Disconnect Account
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            <VStack spacing={4} align="start">
                                <Text>
                                    Are you sure you want to disconnect this account?
                                </Text>
                                {selectedAccount && (
                                    <Box
                                        w="full"
                                        p={3}
                                        bg="rgba(255, 255, 255, 0.05)"
                                        borderRadius="md"
                                    >
                                        <Text fontWeight="semibold">
                                            {selectedAccount.nickname || selectedAccount.name}
                                        </Text>
                                        <Text fontSize="sm" color="whiteAlpha.700">
                                            {selectedAccount.broker_id} • {selectedAccount.environment}
                                        </Text>
                                    </Box>
                                )}
                                <Alert status="warning" bg="rgba(237, 137, 54, 0.1)" borderRadius="md">
                                    <AlertIcon color="orange.300" />
                                    <Text fontSize="sm">
                                        Any active strategies using this account will be deactivated.
                                    </Text>
                                </Alert>
                            </VStack>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDisconnectClose} variant="ghost">
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDisconnectConfirm} ml={3}>
                                Disconnect
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </VStack>
    );
};

export default ConnectedAccountsSection;
