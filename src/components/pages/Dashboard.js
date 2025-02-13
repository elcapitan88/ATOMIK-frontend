import React, { useState, lazy, Suspense, useEffect } from 'react';
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

    // Hooks
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    // Initial data loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [accountsResponse, strategiesResponse] = await Promise.all([
                    axiosInstance.get('/api/v1/brokers/accounts'),
                    axiosInstance.get('/api/v1/strategies/list')
                ]);

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

    // Loading state
    if (isLoading) {
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
                        <Flex position="relative" h="full" p={4} zIndex={2} gap={4}>
                            {/* Left Column */}
                            <Flex flexDirection="column" flex={7}>
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
                                <Flex mt={4} gap={4} flex="1" minH="0">
                                    {/* TradesTable container */}
                                    <Box flex={1} borderRadius="xl" overflow="hidden">
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
                                    <Box flex="0 0 400px" bg="whiteAlpha.100" borderRadius="xl">
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
                            <Flex flex={3} flexDirection="column" gap={4}>
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
                                <Box flex={1}>
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
        <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
            <ErrorBoundary>
                <Menu onSelectItem={setSelectedItem} />
            </ErrorBoundary>
            
            <Box flexGrow={1} ml={16}>
                <Box h="100vh" w="full" p={6} overflow="hidden" position="relative">
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