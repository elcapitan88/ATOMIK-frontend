import React, { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { 
    Box, 
    Flex, 
    Spinner, 
    Text, 
    VStack,
    useToast, 
    Alert,
    AlertIcon,
    Button,
    useBreakpointValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import axiosInstance from '@/services/axiosConfig';
import useFeatureFlags from '@/hooks/useFeatureFlags';
import AdminService from '@/services/api/admin';
import Menu from '../layout/Sidebar/Menu';
import TradingViewWidget from '../features/trading/TradingViewWidget';
import MemberChatMenu from '../chat/MemberChatMenu';
import MemberChatComponent from '../chat/MemberChat';
import MaintenanceBanner from '@/components/common/MaintenanceBanner';
import PaymentStatusWarning from '@/components/subscription/PaymentStatusWarning';
import ARIAAssistant from '@/components/ARIA/ARIAAssistant';
import logger from '@/utils/logger';

// Lazy loaded components
const Management = lazy(() => import('../features/trading/Management'));
const OrderControl = lazy(() => import('../features/trading/OrderControl'));
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));
const TradesTable = lazy(() => import('../features/trading/TradesTable'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));
const EmergencyFlatten = lazy(() => import('../features/trading/EmergencyFlatten'));

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
    
    // Responsive breakpoints
    const isMobile = useBreakpointValue({ base: true, md: false });
    
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


    const handleAccountSelect = (accountId) => {
        setDashboardData(prev => ({
            ...prev,
            activeAccountId: accountId
        }));
    };

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

                            {/* Mobile Layout - Reordered for mobile UX */}
                            {isMobile ? (
                                <VStack spacing={4} p={4} align="stretch">
                                    {/* 1. Management Section (Top) */}
                                    <Box>
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <Management
                                                    accounts={dashboardData.accounts}
                                                    onAccountSelect={handleAccountSelect}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>

                                    {/* 2. Strategy Groups Section */}
                                    <Box>
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <StrategyGroups
                                                    strategies={dashboardData.strategies}
                                                    accounts={dashboardData.accounts}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>

                                    {/* 3. TradesTable */}
                                    <Box borderRadius="xl" overflow="hidden">
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <TradesTable
                                                    accounts={dashboardData.accounts}
                                                    activeAccountId={dashboardData.activeAccountId}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>

                                    {/* 4. Emergency Flatten Button (Bottom) */}
                                    <Box pt={2}>
                                        <ErrorBoundary>
                                            <Suspense fallback={null}>
                                                <EmergencyFlatten accounts={dashboardData.accounts} />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>
                                </VStack>
                            ) : (
                                /* Desktop Layout */
                                <Flex
                                    position="relative"
                                    h="full"
                                    p={4}
                                    zIndex={2}
                                    gap={4}
                                    direction="row"
                                >
                                    {/* Left Column */}
                                    <Flex
                                        flexDirection="column"
                                        flex={7}
                                        width="100%"
                                    >
                                        {/* Chart container */}
                                        <Box
                                            h="50%"
                                            maxH="50%"
                                            flex="0 0 50%"
                                            bg="whiteAlpha.100"
                                            borderRadius="xl"
                                            overflow="hidden"
                                        >
                                            <ErrorBoundary>
                                                <Suspense fallback={<LoadingSpinner />}>
                                                    <TradingViewWidget />
                                                </Suspense>
                                            </ErrorBoundary>
                                        </Box>

                                        {/* Bottom section */}
                                        <Flex
                                            mt={4}
                                            gap={4}
                                            flex="1"
                                            minH="0"
                                            direction={{ base: "column", xl: "row" }}
                                        >
                                            {/* TradesTable container */}
                                            <Box
                                                flex="1"
                                                borderRadius="xl"
                                                overflow="hidden"
                                            >
                                                <ErrorBoundary>
                                                    <Suspense fallback={<LoadingSpinner />}>
                                                        <TradesTable
                                                            accounts={dashboardData.accounts}
                                                            activeAccountId={dashboardData.activeAccountId}
                                                        />
                                                    </Suspense>
                                                </ErrorBoundary>
                                            </Box>

                                            {/* OrderControl container */}
                                            <Box
                                                flex="0 0 400px"
                                                bg="whiteAlpha.100"
                                                borderRadius="xl"
                                            >
                                                <ErrorBoundary>
                                                    <Suspense fallback={<LoadingSpinner />}>
                                                        <OrderControl
                                                            accounts={dashboardData.accounts}
                                                            activeAccountId={dashboardData.activeAccountId}
                                                        />
                                                    </Suspense>
                                                </ErrorBoundary>
                                            </Box>
                                        </Flex>
                                    </Flex>

                                    {/* Right Column */}
                                    <Flex
                                        flex={3}
                                        flexDirection="column"
                                        gap={4}
                                    >
                                        {/* Management Section */}
                                        <Box flex="0 0 auto">
                                            <ErrorBoundary>
                                                <Suspense fallback={<LoadingSpinner />}>
                                                    <Management
                                                        accounts={dashboardData.accounts}
                                                        onAccountSelect={handleAccountSelect}
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
                            )}
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
                flexGrow={1} 
                ml={{ base: 0, md: 16 }}
                mt={{ base: 0, md: 0 }}
                mb={{ base: "70px", md: 0 }} // Add bottom margin for mobile to account for bottom nav
            >
                <Box 
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
                        onUpdateChatSettings={() => {}} // TODO: Implement settings update
                    />
                </>
            )}
            
            {/* ARIA Assistant - Floating Chat (Only for Admin and Beta Testers) */}
            {hasAriaAssistant && <ARIAAssistant />}
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