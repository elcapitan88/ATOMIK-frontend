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
    Button,
    useBreakpointValue,
    Skeleton,
    HStack,
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
import { AnimatePresence, motion } from 'framer-motion';
import logger from '@/utils/logger';
import useMultiAccountTrading from '@/hooks/useMultiAccountTrading';
import useAggregatedPositions from '@/hooks/useAggregatedPositions';
import useBracketPlacement from '@/hooks/useBracketPlacement';
import { useUnifiedStrategies } from '@/hooks/useUnifiedStrategies';
import useCopyTrading from '@/hooks/useCopyTrading';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';
import webSocketManager from '@/services/websocket-proxy/WebSocketManager';

// Mobile components
import { MobileBottomSheet, MobileActionBar, MobileOrderTicket, PositionCard, OrderCard, MobileAccountsTab, MobileStrategiesTab } from '../features/trading/mobile';
import MobileBracketChartMode from '../features/trading/mobile/MobileBracketChartMode';

// Lazy loaded components
const StrategyGroups = lazy(() => import('../features/strategies/ActivateStrategies'));
const MarketplacePage = lazy(() => import('./MarketplacePage'));
const TradingAccountsPanel = lazy(() => import('../features/trading/TradingAccountsPanel'));
const QuickOrderBar = lazy(() => import('../features/trading/QuickOrderBar'));
const TradingPanel = lazy(() => import('../features/trading/TradingPanel'));
const PnLShareModal = lazy(() => import('../features/share-cards/PnLShareModal'));

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
    const [chartCurrentPrice, setChartCurrentPrice] = useState(null);

    // Trading panel collapse state
    const [isTradingPanelCollapsed, setIsTradingPanelCollapsed] = useState(false);

    // Mobile detection + mobile-specific state
    const isMobile = useBreakpointValue({ base: true, md: false });
    const [mobileActiveTab, setMobileActiveTab] = useState('positions');
    const [isOrderTicketOpen, setIsOrderTicketOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isBracketChartMode, setIsBracketChartMode] = useState(false);

    // Landscape detection for mobile
    const [isLandscape, setIsLandscape] = useState(false);
    useEffect(() => {
        if (!isMobile) return;
        const mql = window.matchMedia('(orientation: landscape)');
        setIsLandscape(mql.matches);
        const handler = (e) => setIsLandscape(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [isMobile]);

    // Poll chart's last bar close for live P&L calculation (~1s)
    useEffect(() => {
        if (!activeChart) return;
        let cancelled = false;
        const poll = async () => {
            if (cancelled) return;
            try {
                const exported = await activeChart.exportData({ includeSeries: true, includeStudies: false });
                if (cancelled || !exported?.data?.length || !exported?.schema) return;
                const closeIdx = exported.schema.indexOf('close');
                if (closeIdx === -1) return;
                const lastBar = exported.data[exported.data.length - 1];
                const price = lastBar?.[closeIdx];
                if (price != null) setChartCurrentPrice(price);
            } catch (_) {}
        };
        poll();
        const id = setInterval(poll, 1000);
        return () => { cancelled = true; clearInterval(id); };
    }, [activeChart]);

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
    const { connect: wsConnect, getConnectionState: wsGetConnectionState, sendMessage: wsSendMessage, getAccountData: wsGetAccountData } = useWebSocketContext();
    const { strategies: activatedStrategies } = useUnifiedStrategies();
    const copyTrading = useCopyTrading();
    const copyTradingData = {
      copyLeaderAccountIds: copyTrading.copyLeaderAccountIds,
      copyFollowerAccountIds: copyTrading.copyFollowerAccountIds,
      getCopyInfo: copyTrading.getCopyInfo,
    };
    const multiAccountTrading = useMultiAccountTrading(dashboardData.accounts, activatedStrategies, copyTradingData);
    const { positions: aggregatedPositions, orders: aggregatedOrders } = useAggregatedPositions(dashboardData.accounts, wsGetConnectionState);

    // Bracket placement hook
    const bracketPlacement = useBracketPlacement({
        chartSymbol,
        chartCurrentPrice,
        multiAccountTrading,
    });

    // ─── WebSocket Auto-Connect (shared by desktop + mobile) ─────────
    const lastConnectionAttemptRef = useRef({});
    useEffect(() => {
        const accounts = dashboardData.accounts;
        if (!accounts || accounts.length === 0) return;
        const disabled = localStorage.getItem('disable_auto_connect') === 'true';
        if (disabled) return;
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const connectionAttempts = new Set();

        const autoConnect = async () => {
            for (const account of accounts) {
                const key = `${account.broker_id}:${account.account_id}`;
                if (connectionAttempts.has(key)) continue;
                if (account.status !== 'active' || !account.broker_id || !account.account_id) continue;

                const state = wsGetConnectionState(account.broker_id, account.account_id);
                if (
                    state === 'connected' ||
                    state === 'ready' ||
                    state === 'connecting' ||
                    state === 'validating_user' ||
                    state === 'checking_subscription' ||
                    state === 'checking_broker_access' ||
                    state === 'connecting_to_broker'
                ) continue;

                const now = Date.now();
                const last = lastConnectionAttemptRef.current[key] || 0;
                if (now - last < 60000) continue;

                connectionAttempts.add(key);
                lastConnectionAttemptRef.current[key] = now;

                try {
                    if (connectionAttempts.size > 1) await new Promise((r) => setTimeout(r, 3000));
                    await wsConnect(account.broker_id, account.account_id);
                } catch (err) {
                    logger.error(`Auto-connect failed for ${key}:`, err);
                } finally {
                    connectionAttempts.delete(key);
                }
            }
        };

        const timeout = setTimeout(autoConnect, 1000);
        return () => {
            clearTimeout(timeout);
            connectionAttempts.clear();
        };
    }, [dashboardData.accounts, wsConnect, wsGetConnectionState]);

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

    // Shared data loader — used by initial load and pull-to-refresh
    const loadDashboardData = useCallback(async ({ showLoading = true } = {}) => {
        try {
            if (showLoading) {
                setIsLoading(true);
                setError(null);
            }

            const [accountsResponse, strategiesResponse] = await Promise.all([
                axiosInstance.get('/api/v1/brokers/accounts'),
                axiosInstance.get('/api/v1/marketplace/strategies/available')
            ]);

            dataCache.current.accounts = accountsResponse.data;
            const strategiesData = strategiesResponse.data?.strategies || strategiesResponse.data || [];
            dataCache.current.strategies = strategiesData;

            setDashboardData({
                accounts: accountsResponse.data,
                strategies: strategiesData,
                activeAccountId: accountsResponse.data[0]?.account_id || null
            });

        } catch (err) {
            logger.error('Error loading dashboard data:', err);
            if (showLoading) setError(err);
            toast({
                title: "Error loading dashboard",
                description: err.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [toast]);

    // Pull-to-refresh handler for mobile bottom sheet
    const handleMobileRefresh = useCallback(() => {
        return loadDashboardData({ showLoading: false });
    }, [loadDashboardData]);

    // Initial data loading
    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated, loadDashboardData]);

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
        onModifyOrder: async (orderId, accountId, modifications, brokerId) => {
            try {
                console.log(`[Dashboard] Modifying order ${orderId} on account ${accountId} (broker: ${brokerId}):`, modifications);
                const resp = await axiosInstance.put(`/api/v1/brokers/accounts/${accountId}/orders/${orderId}`, modifications);
                console.log('[Dashboard] Modify order response:', JSON.stringify(resp.data));
                // Validate response format — backend returns { status, order, timestamp }
                if (resp.data?.status !== 'success' || !resp.data?.order) {
                    console.error('[Dashboard] Unexpected modify response format:', resp.data);
                    toast({ title: 'Order modify failed', description: 'Unexpected response from server', status: 'error', duration: 4000 });
                    return;
                }
                const order = resp.data.order;
                const orderStatus = order?.status;
                if (orderStatus === 'ExecutionRejected' || orderStatus === 'OnHold') {
                    toast({ title: 'Order modification rejected', description: `Tradovate returned: ${orderStatus}`, status: 'warning', duration: 4000 });
                } else {
                    toast({ title: 'Order modified', status: 'success', duration: 2000 });
                    // Optimistic update: push new price into WebSocket cache so chart + panel update immediately
                    if (brokerId) {
                        const pricePatch = {};
                        if (modifications.limitPrice != null) pricePatch.price = modifications.limitPrice;
                        if (modifications.stopPrice != null) pricePatch.stopPrice = modifications.stopPrice;
                        if (modifications.qty != null) pricePatch.orderQty = modifications.qty;
                        webSocketManager.updateOrderData(brokerId, String(accountId), { orderId, ...pricePatch });
                        console.log(`[Dashboard] Optimistic update pushed to WS cache: broker=${brokerId}, account=${accountId}, orderId=${orderId}`, pricePatch);
                    }
                }
            } catch (err) {
                console.error('[Dashboard] Modify order failed:', err.response?.data || err.message);
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
        chartCurrentPrice,
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

    // Mobile: computed values for bottom sheet
    const mobileOpenPositions = useMemo(
        () => aggregatedPositions.filter(
            (p) => p && !p.isClosed && p.side !== 'FLAT' && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0)
        ),
        [aggregatedPositions]
    );
    const mobileWorkingOrders = useMemo(
        () => aggregatedOrders.filter((o) => {
            if (!o || !o.orderId) return false;
            return o.ordStatus === 'Working' || o.status === 'Working' || o.ordStatus === 6;
        }),
        [aggregatedOrders]
    );
    const mobileTotalOpenPnL = useMemo(
        () => mobileOpenPositions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0),
        [mobileOpenPositions]
    );

    // Mobile: close position handler (via WebSocket for speed)
    const handleMobileClosePosition = useCallback(async (pos) => {
        const accountId = pos._accountId || pos.accountId;
        const brokerId = pos._brokerId || pos.brokerId;
        if (!accountId || !brokerId) return;
        try {
            const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
            const qty = pos.quantity || Math.abs(pos.netPos || 0);
            await wsSendMessage(brokerId, accountId, {
                type: 'submit_order',
                data: { symbol: pos.symbol, side: closeSide, quantity: qty, orderType: 'MARKET', accountId },
            });
            toast({ title: 'Close order submitted', status: 'success', duration: 2000 });
        } catch (err) {
            toast({ title: 'Failed to close', description: err.message, status: 'error', duration: 4000 });
        }
    }, [wsSendMessage, toast]);

    // Mobile: partial close position handler (long-press quick action)
    const handleMobilePartialClose = useCallback(async (pos, fraction) => {
        const accountId = pos._accountId || pos.accountId;
        const brokerId = pos._brokerId || pos.brokerId;
        if (!accountId || !brokerId) return;
        try {
            const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
            const totalQty = pos.quantity || Math.abs(pos.netPos || 0);
            const closeQty = Math.max(1, Math.floor(totalQty * fraction));
            await wsSendMessage(brokerId, accountId, {
                type: 'submit_order',
                data: { symbol: pos.symbol, side: closeSide, quantity: closeQty, orderType: 'MARKET', accountId },
            });
            toast({ title: `Closing ${closeQty} of ${totalQty}`, status: 'success', duration: 2000 });
        } catch (err) {
            toast({ title: 'Failed to close', description: err.message, status: 'error', duration: 4000 });
        }
    }, [wsSendMessage, toast]);

    // Mobile: cancel order handler
    const handleMobileCancelOrder = useCallback(async (ord) => {
        const accountId = ord._accountId || ord.accountId;
        if (!accountId) return;
        try {
            await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}/orders/${ord.orderId}`);
            toast({ title: 'Order cancelled', status: 'success', duration: 2000 });
        } catch (err) {
            toast({ title: 'Failed to cancel', description: err.response?.data?.detail || err.message, status: 'error', duration: 4000 });
        }
    }, [toast]);

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

    // Mobile Dashboard renderer
    const renderMobileDashboard = () => (
        <ErrorBoundary>
            {/* Payment Status Warning */}
            <PaymentStatusWarning />

            {/* Full-screen chart — fills viewport above action bar + bottom nav + peek sheet */}
            <Box
                position="fixed"
                top="env(safe-area-inset-top, 0px)"
                left={0}
                right={0}
                bottom={isLandscape ? `calc(48px + env(safe-area-inset-bottom, 0px))` : `calc(216px + env(safe-area-inset-bottom, 0px))`}
                bg="whiteAlpha.100"
                overflow="hidden"
                zIndex={1}
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
                            isMobile
                        />
                    </Suspense>
                </ErrorBoundary>
                {/* Position/order lines on chart */}
                <ChartTradingOverlay
                    activeChart={activeChart}
                    positionLines={chartTrading.positionLines}
                    orderLines={chartTrading.orderLines}
                    bracketPlacement={bracketPlacement}
                    totalQuantity={multiAccountTrading.totalContracts}
                    isMobile
                />
            </Box>

            {/* Mobile Action Bar — floating BUY/SELL */}
            <MobileActionBar
                chartSymbol={chartSymbol}
                chartCurrentPrice={chartCurrentPrice}
                multiAccountTrading={multiAccountTrading}
                positions={aggregatedPositions}
                copyTrading={copyTrading}
                onExpandOrderTicket={() => setIsOrderTicketOpen(true)}
                isBracketChartMode={isBracketChartMode}
            />

            {/* Mobile Bracket Chart Mode — floating confirm/cancel bar */}
            <MobileBracketChartMode
                isActive={isBracketChartMode}
                bracketPlacement={bracketPlacement}
                onConfirm={() => {
                    bracketPlacement.submit();
                    setIsBracketChartMode(false);
                }}
                onCancel={() => {
                    bracketPlacement.deactivate();
                    setIsBracketChartMode(false);
                }}
            />

            {/* Mobile Order Ticket — expandable order entry */}
            <MobileOrderTicket
                isOpen={isOrderTicketOpen}
                onClose={() => setIsOrderTicketOpen(false)}
                chartSymbol={chartSymbol}
                chartCurrentPrice={chartCurrentPrice}
                multiAccountTrading={multiAccountTrading}
                positions={aggregatedPositions}
                orders={aggregatedOrders}
                copyTrading={copyTrading}
                onPlaceOnChart={() => {
                    setIsOrderTicketOpen(false);
                    bracketPlacement.activate();
                    setIsBracketChartMode(true);
                }}
            />

            {/* Mobile Bottom Sheet — hidden in landscape (too little vertical space) */}
            {!isLandscape && <MobileBottomSheet
                positionsCount={mobileOpenPositions.length}
                ordersCount={mobileWorkingOrders.length}
                accountsCount={dashboardData.accounts.length}
                totalOpenPnL={mobileTotalOpenPnL}
                activeTab={mobileActiveTab}
                onTabChange={setMobileActiveTab}
                positions={aggregatedPositions}
                orders={aggregatedOrders}
                onSharePnL={() => setIsShareModalOpen(true)}
                onRefresh={handleMobileRefresh}
                strategyBoundAccountIds={multiAccountTrading.strategyBoundAccountIds}
                getAccountStrategies={multiAccountTrading.getAccountStrategies}
            >
                <AnimatePresence mode="wait">
                  {mobileActiveTab === 'positions' && (
                    <motion.div
                      key="positions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isLoading ? (
                        <VStack spacing={2} align="stretch">
                          {[1, 2].map((i) => (
                            <Box key={i} bg="whiteAlpha.100" borderRadius="lg" borderWidth="1px" borderColor="whiteAlpha.100" p={3}>
                              <Flex justify="space-between" mb={2}>
                                <HStack spacing={2}>
                                  <Skeleton h="14px" w="40px" startColor="#333" endColor="#555" borderRadius="md" />
                                  <Skeleton h="14px" w="45px" startColor="#333" endColor="#555" borderRadius="md" />
                                </HStack>
                                <Skeleton h="12px" w="60px" startColor="#333" endColor="#555" borderRadius="md" />
                              </Flex>
                              <Flex justify="space-between">
                                <HStack spacing={3}>
                                  <Skeleton h="12px" w="50px" startColor="#333" endColor="#555" borderRadius="md" />
                                  <Skeleton h="12px" w="70px" startColor="#333" endColor="#555" borderRadius="md" />
                                </HStack>
                                <Skeleton h="12px" w="55px" startColor="#333" endColor="#555" borderRadius="md" />
                              </Flex>
                            </Box>
                          ))}
                        </VStack>
                      ) : mobileOpenPositions.length === 0 ? (
                        <Flex justify="center" align="center" minH="80px">
                            <Text fontSize="sm" color="whiteAlpha.400">No open positions</Text>
                        </Flex>
                      ) : (
                        <VStack spacing={2} align="stretch">
                            {mobileOpenPositions.map((pos, i) => (
                                <PositionCard
                                    key={`${pos._accountId}-${pos.positionId || i}`}
                                    position={pos}
                                    onClose={handleMobileClosePosition}
                                    onPartialClose={handleMobilePartialClose}
                                />
                            ))}
                        </VStack>
                      )}
                    </motion.div>
                  )}
                  {mobileActiveTab === 'orders' && (
                    <motion.div
                      key="orders"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isLoading ? (
                        <VStack spacing={2} align="stretch">
                          <Box bg="whiteAlpha.100" borderRadius="lg" borderWidth="1px" borderColor="whiteAlpha.100" p={3}>
                            <Flex justify="space-between" mb={2}>
                              <HStack spacing={2}>
                                <Skeleton h="14px" w="40px" startColor="#333" endColor="#555" borderRadius="md" />
                                <Skeleton h="14px" w="35px" startColor="#333" endColor="#555" borderRadius="md" />
                                <Skeleton h="14px" w="40px" startColor="#333" endColor="#555" borderRadius="md" />
                              </HStack>
                              <Skeleton h="12px" w="60px" startColor="#333" endColor="#555" borderRadius="md" />
                            </Flex>
                            <Flex justify="space-between">
                              <HStack spacing={3}>
                                <Skeleton h="12px" w="50px" startColor="#333" endColor="#555" borderRadius="md" />
                                <Skeleton h="12px" w="70px" startColor="#333" endColor="#555" borderRadius="md" />
                              </HStack>
                            </Flex>
                          </Box>
                        </VStack>
                      ) : mobileWorkingOrders.length === 0 ? (
                        <Flex justify="center" align="center" minH="80px">
                            <Text fontSize="sm" color="whiteAlpha.400">No working orders</Text>
                        </Flex>
                      ) : (
                        <VStack spacing={2} align="stretch">
                            {mobileWorkingOrders.map((ord, i) => (
                                <OrderCard
                                    key={`${ord._accountId}-${ord.orderId || i}`}
                                    order={ord}
                                    onCancel={handleMobileCancelOrder}
                                />
                            ))}
                        </VStack>
                      )}
                    </motion.div>
                  )}
                  {mobileActiveTab === 'accounts' && (
                    <motion.div
                      key="accounts"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <MobileAccountsTab
                        accounts={dashboardData.accounts}
                        multiAccountTrading={multiAccountTrading}
                        aggregatedPositions={aggregatedPositions}
                        copyTrading={copyTrading}
                        getConnectionState={wsGetConnectionState}
                        getAccountData={wsGetAccountData}
                        onConnectAccount={() => {}}
                        onEditName={() => {}}
                        onDelete={() => {}}
                        onPowerToggle={() => {}}
                        onRestart={() => {}}
                        onCopyMyTrades={() => {}}
                        onEditCopySettings={() => {}}
                        onStopCopying={() => {}}
                        onPauseCopying={() => {}}
                      />
                    </motion.div>
                  )}
                  {mobileActiveTab === 'strategies' && (
                    <motion.div
                      key="strategies"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <MobileStrategiesTab
                        strategies={dashboardData.strategies}
                        accounts={dashboardData.accounts}
                        accountConfigs={multiAccountTrading.accountConfigs}
                        strategyBoundAccountIds={multiAccountTrading.strategyBoundAccountIds}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
            </MobileBottomSheet>}

            {/* Share P&L Modal */}
            {isShareModalOpen && (
                <Suspense fallback={null}>
                    <PnLShareModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                    />
                </Suspense>
            )}
        </ErrorBoundary>
    );

    const renderContent = () => {
        console.log('Dashboard: Rendering content for selectedItem:', selectedItem);
        switch (selectedItem) {
            case 'Dashboard':
                // Mobile layout — full screen chart + floating action bar + bottom sheet
                if (isMobile) {
                    return renderMobileDashboard();
                }

                // Desktop layout — unchanged
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
                                        h={isTradingPanelCollapsed ? "auto" : { base: "300px", md: "50%" }}
                                        maxH={isTradingPanelCollapsed ? "none" : { base: "none", md: "50%" }}
                                        flex={isTradingPanelCollapsed ? "1" : { base: "0 0 auto", md: "0 0 50%" }}
                                        bg="whiteAlpha.100"
                                        borderRadius="xl"
                                        overflow="hidden"
                                        mb={{ base: 4, md: 0 }}
                                        transition="flex 0.2s ease"
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
                                            bracketPlacement={bracketPlacement}
                                            totalQuantity={multiAccountTrading.totalContracts}
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
                                                    bracketPlacement={bracketPlacement}
                                                    getCopyInfo={copyTrading.getCopyInfo}
                                                />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </Box>

                                    {/* Bottom section — TradingPanel (Positions, Orders, History) */}
                                    <Box mt={2} flex={isTradingPanelCollapsed ? "0 0 auto" : "1"} minH="0">
                                        <ErrorBoundary>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <TradingPanel
                                                    positions={aggregatedPositions}
                                                    orders={aggregatedOrders}
                                                    chartSymbol={chartSymbol}
                                                    isCollapsed={isTradingPanelCollapsed}
                                                    onToggleCollapse={() => setIsTradingPanelCollapsed(prev => !prev)}
                                                    multiAccountTrading={multiAccountTrading}
                                                    accounts={dashboardData.accounts}
                                                    getCopyInfo={copyTrading.getCopyInfo}
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
                                                    copyTrading={copyTrading}
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
                                                    accountConfigs={multiAccountTrading.accountConfigs}
                                                    strategyBoundAccountIds={multiAccountTrading.strategyBoundAccountIds}
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
                    mb={{ base: isMobile ? 0 : "70px", md: 0 }}
                    transition="margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                    <Box
                        className="dashboard-content-scroll"
                        h={{ base: isMobile ? "100vh" : "auto", md: "100vh" }}
                        w="full"
                        p={{ base: isMobile ? 0 : 3, md: 6 }}
                        overflow={isMobile ? "hidden" : "auto"}
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