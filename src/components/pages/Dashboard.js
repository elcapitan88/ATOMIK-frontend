import React, { useState, useCallback, useMemo, lazy, Suspense, useEffect, useRef } from 'react';
import {
    Box,
    Flex,
    Spinner,
    Text,
    VStack,
    useToast,
    Alert,
    AlertIcon,
    Button
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import axiosInstance from '@/services/axiosConfig';
import useFeatureFlags from '@/hooks/useFeatureFlags';
import Menu from '../layout/Sidebar/Menu';
import TradingViewWidget from '../features/trading/TVAdvancedChart';
import MemberChatMenu from '../chat/MemberChatMenu';
import MemberChatComponent from '../chat/MemberChat';
import MaintenanceBanner from '@/components/common/MaintenanceBanner';
import PaymentStatusWarning from '@/components/subscription/PaymentStatusWarning';
import ARIAAssistant from '@/components/ARIA/ARIAAssistant';
import useChartTrading from '@/hooks/useChartTrading';
import OrderConfirmationModal from '../features/trading/OrderConfirmationModal';
import ChartTradingOverlay from '../features/trading/ChartTradingOverlay';
import logger from '@/utils/logger';
import useMultiAccountTrading from '@/hooks/useMultiAccountTrading';
import useAggregatedPositions from '@/hooks/useAggregatedPositions';
import { useUnifiedStrategies } from '@/hooks/useUnifiedStrategies';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';

// Lazy loaded components
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));
const TradingAccountsPanel = lazy(() => import('../features/trading/TradingAccountsPanel'));
const QuickOrderBar = lazy(() => import('../features/trading/QuickOrderBar'));
const TradingPanel = lazy(() => import('../features/trading/TradingPanel'));

// Loading Spinner Component
const LoadingSpinner = () => (
    <Flex justify="center" align="center" height="100vh" bg="background">
        <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color="whiteAlpha.900">Loading your dashboard...</Text>
        </VStack>
    </Flex>
);

// Error Display Component
const ErrorDisplay = ({ error, onRetry }) => (
    <Flex justify="center" align="center" height="100vh" bg="background">
        <VStack spacing={4} maxW="md" p={8}>
            <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="auto" bg="transparent" border="1px solid" borderColor="red.500">
                <AlertIcon boxSize={10} mr={0} mb={4} />
                <Text color="white" fontSize="xl" mb={2}>Unable to load dashboard</Text>
                <Text color="whiteAlpha.800">
                    {error?.response?.data?.detail || error?.message || 'An unexpected error occurred'}
                </Text>
                {onRetry && (
                    <Button onClick={onRetry} colorScheme="blue" mt={4}>
                        Retry
                    </Button>
                )}
            </Alert>
        </VStack>
    </Flex>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('Component Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorDisplay
                    error={this.state.error}
                    onRetry={() => {
                        this.setState({ hasError: false });
                        window.location.reload();
                    }}
                />
            );
        }
        return this.props.children;
    }
}

const DashboardContent = () => {
    const chat = useChat();
    // State Management
    const [selectedItem, setSelectedItem] = useState('Dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        accounts: [],
        strategies: [],
        activeAccountId: null
    });

    // Chart trading state
    const [activeChart, setActiveChart] = useState(null);
    const [chartSymbol, setChartSymbol] = useState('NQ');

    // Cache reference
    const dataCache = useRef({
        accounts: null,
        strategies: null,
        webhooks: null,
        subscribedWebhooks: null
    });

    // Hooks
    const navigate = useNavigate();
    const { isAuthenticated, user, isLoading: authLoading, refreshAuthState } = useAuth();
    const toast = useToast();
    const { hasMemberChat, hasAriaAssistant } = useFeatureFlags();

    // Multi-account trading hooks
    const { getConnectionState: wsGetConnectionState } = useWebSocketContext();
    const { strategies: activatedStrategies } = useUnifiedStrategies();
    const multiAccountTrading = useMultiAccountTrading(dashboardData.accounts, activatedStrategies);
    const { positions: aggregatedPositions, orders: aggregatedOrders } = useAggregatedPositions(dashboardData.accounts, wsGetConnectionState);

    // Skip confirmation preference (persisted in localStorage)
    const [skipOrderConfirmation, setSkipOrderConfirmation] = useState(
        () => localStorage.getItem('atomik_skip_order_confirm') === 'true'
    );
    const handleToggleSkip = useCallback((val) => {
        const next = typeof val === 'boolean' ? val : !skipOrderConfirmation;
        setSkipOrderConfirmation(next);
        localStorage.setItem('atomik_skip_order_confirm', String(next));
    }, [skipOrderConfirmation]);

    // Set up API request interception for caching
    useEffect(() => {
        // Store original fetch
        const originalFetch = window.fetch;

        // Replace fetch with our caching version
        window.fetch = async (...args) => {
            const [resource, config] = args;
            let url = resource;

            // Handle Request objects
            if (resource instanceof Request) {
                url = resource.url;
            }

            // Check if this is one of our API endpoints with cached data
            if (typeof url === 'string') {
                // Accounts endpoint
                if (url.includes('/api/v1/brokers/accounts') && dataCache.current.accounts) {
                    logger.debug('Using cached accounts data');
                    return new Response(JSON.stringify(dataCache.current.accounts), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 200
                    });
                }

                // Strategies endpoint - now using unified marketplace endpoint
                if ((url.includes('/api/v1/strategies/list') || url.includes('/api/v1/marketplace/strategies/available')) && dataCache.current.strategies) {
                    logger.debug('Using cached strategies data');
                    return new Response(JSON.stringify(dataCache.current.strategies), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 200
                    });
                }

                // Webhooks endpoint
                if (url.includes('/api/v1/webhooks/list') && dataCache.current.webhooks) {
                    logger.debug('Using cached webhooks data');
                    return new Response(JSON.stringify(dataCache.current.webhooks), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 200
                    });
                }

                // Subscribed webhooks endpoint
                if (url.includes('/api/v1/webhooks/subscribed') && dataCache.current.subscribedWebhooks) {
                    logger.debug('Using cached subscribed webhooks data');
                    return new Response(JSON.stringify(dataCache.current.subscribedWebhooks), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 200
                    });
                }
            }

            // For all other requests, use original fetch
            const response = await originalFetch(...args);

            // Cache the response if it's one of our dashboard endpoints
            if (response.ok && typeof url === 'string') {
                try {
                    const responseClone = response.clone();
                    const data = await responseClone.json();

                    if (url.includes('/api/v1/brokers/accounts')) {
                        dataCache.current.accounts = data;
                    } else if (url.includes('/api/v1/strategies/list') || url.includes('/api/v1/marketplace/strategies/available')) {
                        dataCache.current.strategies = data;
                    } else if (url.includes('/api/v1/webhooks/list')) {
                        dataCache.current.webhooks = data;
                    } else if (url.includes('/api/v1/webhooks/subscribed')) {
                        dataCache.current.subscribedWebhooks = data;
                    }
                } catch (e) {
                    logger.error('Error caching response:', e);
                }
            }

            return response;
        };

        // Cleanup function to restore original fetch
        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    // Refresh auth state when dashboard mounts
    useEffect(() => {
        const refreshAuth = async () => {
            try {
                await refreshAuthState();
                logger.info('Auth state refreshed on dashboard mount');
            } catch (error) {
                logger.error('Failed to refresh auth state:', error);
            }
        };

        if (isAuthenticated && refreshAuthState) {
            refreshAuth();
        }
    }, [isAuthenticated, refreshAuthState]);

    // Initial data loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Use our regular API calls - the intercepted fetch will handle caching
                const [accountsResponse, strategiesResponse] = await Promise.all([
                    axiosInstance.get('/api/v1/brokers/accounts'),
                    axiosInstance.get('/api/v1/marketplace/strategies/available')
                ]);

                // Store data both in component state and in our cache
                dataCache.current.accounts = accountsResponse.data;
                // Extract strategies from unified response format
                const strategiesData = strategiesResponse.data?.strategies || strategiesResponse.data || [];
                dataCache.current.strategies = strategiesData;

                setDashboardData({
                    accounts: accountsResponse.data,
                    strategies: strategiesData,
                    activeAccountId: accountsResponse.data[0]?.account_id || null
                });

            } catch (err) {
                logger.error('Error loading dashboard data:', err);
                setError(err);
                toast({
                    title: "Error loading dashboard",
                    description: err.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            loadInitialData();
        }
    }, [isAuthenticated, toast]);

    // Auth check
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth', { replace: true });
        }
    }, [isAuthenticated, navigate]);


    // Chart line callbacks
    const chartCallbacks = useMemo(() => ({
        onClosePosition: async (positionId, accountId) => {
            try {
                await axiosInstance.post(`/api/v1/brokers/accounts/${accountId}/positions/${positionId}/close`);
                toast({ title: 'Position closed', status: 'success', duration: 2000 });
            } catch (err) {
                toast({ title: 'Failed to close position', description: err.response?.data?.detail || err.message, status: 'error', duration: 4000 });
            }
        },
        onReversePosition: async (positionId, accountId) => {
            try {
                await axiosInstance.post(`/api/v1/brokers/accounts/${accountId}/positions/${positionId}/reverse`);
                toast({ title: 'Position reversed', status: 'success', duration: 2000 });
            } catch (err) {
                toast({ title: 'Failed to reverse position', description: err.response?.data?.detail || err.message, status: 'error', duration: 4000 });
            }
        },
        onCancelOrder: async (orderId, accountId) => {
            try {
                await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}/orders/${orderId}`);
                toast({ title: 'Order cancelled', status: 'success', duration: 2000 });
            } catch (err) {
                toast({ title: 'Failed to cancel order', description: err.response?.data?.detail || err.message, status: 'error', duration: 4000 });
            }
        },
        onModifyOrder: async (orderId, accountId, modifications) => {
            try {
                await axiosInstance.put(`/api/v1/brokers/accounts/${accountId}/orders/${orderId}`, modifications);
                toast({ title: 'Order modified', status: 'success', duration: 2000 });
            } catch (err) {
                toast({ title: 'Failed to modify order', description: err.response?.data?.detail || err.message, status: 'error', duration: 4000 });
            }
        },
    }), [toast]);

    // Position/order lines on chart — use aggregated data from all accounts
    const chartTrading = useChartTrading({
        activeChart,
        positions: aggregatedPositions,
        orders: aggregatedOrders,
        chartSymbol,
        callbacks: chartCallbacks,
        multiAccountTrading,
    });

    // Handle chart right-click order placement
    // Dispatches to all active manual accounts via multi-account trading
    const handleChartOrder = useCallback(async (order) => {
        try {
            const { activeAccounts, placeMultiAccountOrder } = multiAccountTrading;

            if (activeAccounts.length === 0) {
                toast({
                    title: 'No Active Accounts',
                    description: 'Toggle at least one account ON in the Accounts panel.',
                    status: 'warning',
                    duration: 4000,
                    isClosable: true,
                });
                return;
            }

            const symbol = chartSymbol || 'NQ';
            await placeMultiAccountOrder({
                side: order.side,
                type: order.type,
                price: (order.type === 'LIMIT' || order.type === 'STOP_LIMIT') ? order.price : undefined,
                stopPrice: (order.type === 'STOP' || order.type === 'STOP_LIMIT') ? order.price : undefined,
                symbol,
            });
        } catch (err) {
            toast({
                title: 'Order failed',
                description: err.response?.data?.detail || err.message,
                status: 'error',
                duration: 4000,
            });
        }
    }, [multiAccountTrading, chartSymbol, toast]);

    // Loading state - wait for both auth and dashboard data
    if (isLoading || authLoading || !user) {
        return <LoadingSpinner />;
    }

    // Error state
    if (error) {
        return (
            <ErrorDisplay
                error={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    const renderContent = () => {
        console.log('🔍 Dashboard: Rendering content for selectedItem:', selectedItem);
        switch (selectedItem) {
            case 'Dashboard':
                return (
                    <ErrorBoundary>
                        <VStack spacing={4} align="stretch" h="full">
                            {/* Payment Status Warning - Global Dashboard Warning */}
                            <PaymentStatusWarning />

                            <Flex
                                className="dashboard-columns"
                                position="relative"
                                h="full"
                                p={4}
                                zIndex={2}
                                gap={4}
                                direction={{ base: "column", lg: "row" }}
                            >
                                {/* Left Column */}
                                <Flex
                                    className="dashboard-left-column"
                                    flexDirection="column"
                                    flex={{ base: "1", lg: 7 }}
                                    width="100%"
                                    minW="0"
                                >
                                    {/* Chart container */}
                                    <Box
                                        position="relative"
                                        h={{ base: "300px", md: "50%" }}
                                        maxH={{ base: "none", md: "50%" }}
                                        flex={{ base: "0 0 auto", md: "0 0 50%" }}
                                        bg="whiteAlpha.100"
                                        borderRadius="xl"
                                        overflow="hidden"
                                        mb={{ base: 4, md: 0 }}
                                    >
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <TradingViewWidget
                                                    onWidgetReady={(w, c) => setActiveChart(c)}
                                                    onSymbolChanged={setChartSymbol}
                                                    onChartOrder={handleChartOrder}
                                                    activeAccount={multiAccountTrading.activeCount > 0 ? { accountId: 'multi' } : null}
                                                    currentQuantity={multiAccountTrading.totalContracts}
                                                    selectionMode={multiAccountTrading.activeCount > 0 ? 'multi' : 'single'}
                                                    groupInfo={multiAccountTrading.activeCount > 0 ? { groupName: `${multiAccountTrading.totalContracts} cts / ${multiAccountTrading.activeCount} acct${multiAccountTrading.activeCount !== 1 ? 's' : ''}` } : null}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                        {/* Trading lines overlay (positions + orders on chart) */}
                                        <ChartTradingOverlay
                                            activeChart={activeChart}
                                            positionLines={chartTrading.positionLines}
                                            orderLines={chartTrading.orderLines}
                                        />
                                    </Box>

                                    {/* Quick Order Bar */}
                                    <Box mt={2} borderRadius="lg" overflow="hidden">
                                        <ErrorBoundary>
                                            <Suspense fallback={null}>
                                                <QuickOrderBar
                                                    chartSymbol={chartSymbol}
                                                    multiAccountTrading={multiAccountTrading}
                                                    positions={aggregatedPositions}
                                                    orders={aggregatedOrders}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>

                                    {/* Bottom section — TradingPanel (Positions, Orders, History) */}
                                    <Box mt={2} flex="1" minH="0">
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <TradingPanel
                                                    positions={aggregatedPositions}
                                                    orders={aggregatedOrders}
                                                    chartSymbol={chartSymbol}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>
                                </Flex>

                                {/* Right Column */}
                                <Flex
                                    className="dashboard-right-column"
                                    flex={{ base: "1", lg: 3 }}
                                    flexDirection="column"
                                    gap={4}
                                    mt={{ base: 4, lg: 0 }}
                                    flexShrink={0.3}
                                    minW={{ base: "auto", lg: "280px" }}
                                >
                                    {/* Trading Accounts Panel (replaces Management) */}
                                    <Box
                                        flex="1"
                                        bg="whiteAlpha.50"
                                        borderRadius="xl"
                                        overflow="hidden"
                                        minH="200px"
                                        maxH={{ base: "400px", lg: "50%" }}
                                    >
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <TradingAccountsPanel
                                                    multiAccountTrading={multiAccountTrading}
                                                    aggregatedPositions={aggregatedPositions}
                                                    strategies={activatedStrategies}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>

                                    {/* Strategy Groups Section */}
                                    <Box flex="1">
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <StrategyGroups
                                                    strategies={dashboardData.strategies}
                                                    accounts={dashboardData.accounts}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>
                                </Flex>
                            </Flex>
                        </VStack>
                    </ErrorBoundary>
                );

            case 'Strategy Builder':
                // Redirect to the dedicated Strategy Builder page
                navigate('/strategy-builder');
                return null;

            case 'Marketplace':
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingSpinner />}>
                            <MarketplacePage />
                        </Suspense>
                    </ErrorBoundary>
                );


            default:
                return null;
        }
    };

    return (
        <>
            <MaintenanceBanner />
            <Flex
                minH="100vh"
                bg="background"
                color="text.primary"
                fontFamily="body"
                flexDirection="column"
            >
                <ErrorBoundary>
                    <Menu onSelectItem={setSelectedItem} />
                </ErrorBoundary>

                <Box
                    id="dashboard-main-content"
                    className="dashboard-main-content"
                    flexGrow={1}
                    ml={{ base: 0, md: 16 }}
                    mt={{ base: 0, md: 0 }}
                    mb={{ base: "70px", md: 0 }} // Add bottom margin for mobile to account for bottom nav
                    transition="margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                    <Box
                        className="dashboard-content-scroll"
                        h={{ base: "auto", md: "100vh" }}
                        w="full"
                        p={{ base: 3, md: 6 }}
                        overflow="auto"
                        position="relative"
                    >
                        {/* Background Effects */}
                        <Box
                            position="absolute"
                            inset={0}
                            bgGradient="linear(to-br, blackAlpha.400, blackAlpha.200, blackAlpha.400)"
                            pointerEvents="none"
                        />
                        <Box
                            position="absolute"
                            inset={0}
                            backdropFilter="blur(16px)"
                            bg="blackAlpha.300"
                        />
                        <Box
                            position="absolute"
                            inset={0}
                            boxShadow="inset 0 0 15px rgba(0, 0, 0, 0.2)"
                            borderRadius="xl"
                            pointerEvents="none"
                        />

                        {/* Content */}
                        <Box position="relative" h="full" zIndex={1}>
                            {renderContent()}
                        </Box>
                    </Box>
                </Box>

                {/* Chat Components - Feature Gated */}
                {hasMemberChat && (
                    <>
                        <MemberChatMenu
                            isOpen={chat.isOpen}
                            onToggle={chat.toggleChat}
                            unreadCount={chat.getTotalUnreadCount()}
                            channels={chat.channels}
                            onChannelSelect={chat.selectChannel}
                            activeChannelId={chat.activeChannelId}
                        />

                        <MemberChatComponent
                            isOpen={chat.isOpen}
                            onClose={() => chat.toggleChat()}
                            channels={chat.channels}
                            activeChannelId={chat.activeChannelId}
                            onChannelSelect={chat.selectChannel}
                            messages={chat.messages}
                            userRoles={{}} // TODO: Implement role fetching
                            isLoading={chat.isLoading}
                            error={chat.error}
                            onSendMessage={chat.sendMessage}
                            onEditMessage={chat.editMessage}
                            onDeleteMessage={chat.deleteMessage}
                            onAddReaction={chat.addReaction}
                            onRemoveReaction={chat.removeReaction}
                            currentUser={chat.currentUser}
                            chatSettings={chat.settings}
                            onUpdateChatSettings={() => { }} // TODO: Implement settings update
                        />
                    </>
                )}

                {/* ARIA Assistant - Floating Chat (Only for Admin and Beta Testers) */}
                {hasAriaAssistant && <ARIAAssistant />}

                {/* Chart Trading Confirmation Modal */}
                <OrderConfirmationModal
                    isOpen={!!chartTrading.confirmState}
                    action={chartTrading.confirmState?.action}
                    details={chartTrading.confirmState?.details}
                    onConfirm={chartTrading.handleConfirm}
                    onCancel={chartTrading.handleCancel}
                    skipConfirmation={skipOrderConfirmation}
                    onToggleSkip={handleToggleSkip}
                />
            </Flex>
        </>
    );
};

// Main Dashboard component wrapped with ChatProvider
const Dashboard = () => {
    return (
        <ChatProvider>
            <DashboardContent />
        </ChatProvider>
    );
};

export default Dashboard;