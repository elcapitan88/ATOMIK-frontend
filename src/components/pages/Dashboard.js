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
import axiosInstance from '@/services/axiosConfig';
import Menu from '../layout/Sidebar/Menu';
import TradingViewWidget from '../features/trading/TradingViewWidget';
import logger from '@/utils/logger';

// Lazy loaded components
const Management = lazy(() => import('../features/trading/Management'));
const OrderControl = lazy(() => import('../features/trading/OrderControl')); 
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));
const TradesTable = lazy(() => import('../features/trading/TradesTable'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));

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

const Dashboard = () => {
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
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const toast = useToast();
    
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
                
                // Strategies endpoint
                if (url.includes('/api/v1/strategies/list') && dataCache.current.strategies) {
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
                    } else if (url.includes('/api/v1/strategies/list')) {
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

    // Initial data loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Use our regular API calls - the intercepted fetch will handle caching
                const [accountsResponse, strategiesResponse] = await Promise.all([
                    axiosInstance.get('/api/v1/brokers/accounts'),
                    axiosInstance.get('/api/v1/strategies/list')
                ]);

                // Store data both in component state and in our cache
                dataCache.current.accounts = accountsResponse.data;
                dataCache.current.strategies = strategiesResponse.data;
                
                setDashboardData({
                    accounts: accountsResponse.data,
                    strategies: strategiesResponse.data,
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
        switch (selectedItem) {
            case 'Dashboard':
                return (
                    <ErrorBoundary>
                        <Flex 
                            position="relative" 
                            h="full" 
                            p={4} 
                            zIndex={2} 
                            gap={4}
                            direction={{ base: "column", lg: "row" }}
                        >
                            {/* Left Column */}
                            <Flex 
                                flexDirection="column" 
                                flex={{ base: "1", lg: 7 }}
                                width="100%"
                            >
                                {/* Chart container */}
                                <Box 
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
                                        mb={{ base: 4, xl: 0 }}
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
                                        flex={{ base: "1", xl: "0 0 400px" }} 
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
                                flex={{ base: "1", lg: 3 }} 
                                flexDirection="column" 
                                gap={4}
                                mt={{ base: 4, lg: 0 }}
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
                    </ErrorBoundary>
                );

            case 'Strategy Builder':
                return (
                    <Flex 
                        position="relative" 
                        h="full" 
                        p={4} 
                        zIndex={2}
                        justify="center"
                        align="center"
                        direction="column"
                        gap={4}
                    >
                        <Text fontSize="3xl" fontWeight="bold" color="white">
                            Coming Soon
                        </Text>
                        <Text fontSize="md" color="whiteAlpha.700" textAlign="center" maxW="400px">
                            Our strategy builder is currently under development. 
                            Stay tuned for powerful trading strategy creation tools.
                        </Text>
                    </Flex>
                );

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
        </Flex>
    );
};

export default Dashboard;