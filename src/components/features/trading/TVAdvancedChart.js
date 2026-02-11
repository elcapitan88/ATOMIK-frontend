import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import CustomDatafeed from './CustomDatafeed';
import { chartStorage } from '@services/datafeed/chartStorage';

const EMPTY_OVERRIDES = {};

const TVAdvancedChart = ({
    symbol = 'NQ',
    interval = '5',
    theme = 'Dark',
    containerId = 'tv_chart_container',
    libraryPath = '/charting_library/',
    fullscreen = false,
    autosize = true,
    studiesOverrides = EMPTY_OVERRIDES,
    onWidgetReady,
    onSymbolChanged,
    onChartOrder,
    activeAccount,
    currentQuantity = 1,
    selectionMode = 'single',
    groupInfo = null,
    brokerFactory = null,
}) => {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Refs for stale closure prevention
    const activeAccountRef = useRef(activeAccount);
    const hasAccountRef = useRef(!!activeAccount);
    const currentQuantityRef = useRef(currentQuantity);
    const selectionModeRef = useRef(selectionMode);
    const groupInfoRef = useRef(groupInfo);
    const onChartOrderRef = useRef(onChartOrder);
    const onWidgetReadyRef = useRef(onWidgetReady);
    const onSymbolChangedRef = useRef(onSymbolChanged);

    useEffect(() => { activeAccountRef.current = activeAccount; hasAccountRef.current = !!activeAccount; }, [activeAccount]);
    useEffect(() => { currentQuantityRef.current = currentQuantity; }, [currentQuantity]);
    useEffect(() => { selectionModeRef.current = selectionMode; }, [selectionMode]);
    useEffect(() => { groupInfoRef.current = groupInfo; }, [groupInfo]);
    useEffect(() => { onChartOrderRef.current = onChartOrder; }, [onChartOrder]);
    useEffect(() => { onWidgetReadyRef.current = onWidgetReady; }, [onWidgetReady]);
    useEffect(() => { onSymbolChangedRef.current = onSymbolChanged; }, [onSymbolChanged]);

    // Memoize objects that should not trigger re-creation
    const datafeed = useMemo(() => new CustomDatafeed(), []);

    useEffect(() => {
        // Prevent duplicate initialization
        if (widgetRef.current) {
            try {
                widgetRef.current.remove();
            } catch (e) {
                // ignore
            }
            widgetRef.current = null;
        }

        const initWidget = () => {
            if (!window.TradingView) {
                setError('TradingView library not loaded');
                setIsLoading(false);
                return;
            }

            if (!containerRef.current) return;

            // Build enabled features list
            const enabledFeatures = [
                'study_templates',
                'create_volume_indicator_by_default',
                'save_chart_properties_to_local_storage',
                'side_toolbar_in_fullscreen_mode',
            ];

            // When broker is connected, enable trading terminal features
            if (brokerFactory) {
                enabledFeatures.push(
                    'trading_terminal',
                    'buy_sell_buttons',
                    'order_panel',
                );
            }

            const widgetOptions = {
                symbol: symbol,
                datafeed: datafeed,
                interval: interval,
                container: containerRef.current,
                library_path: libraryPath,
                locale: 'en',
                disabled_features: [
                    'header_compare',
                    'display_market_status',
                    'header_saveload',
                ],
                enabled_features: enabledFeatures,
                fullscreen: fullscreen,
                autosize: autosize,
                studies_overrides: studiesOverrides,
                theme: theme,
                timezone: 'America/Chicago',
                save_load_adapter: chartStorage,
                auto_save_delay: 5,
                overrides: {
                    'paneProperties.background': '#1C1C1C',
                    'paneProperties.backgroundType': 'solid',
                    'paneProperties.vertGridProperties.color': '#363c4e',
                    'paneProperties.horzGridProperties.color': '#363c4e',
                    'scalesProperties.backgroundColor': '#1C1C1C',
                    'scalesProperties.textColor': '#AAA',
                    'symbolWatermarkProperties.transparency': 90,
                    'mainSeriesProperties.candleStyle.upColor': '#26a69a',
                    'mainSeriesProperties.candleStyle.downColor': '#ef5350',
                    'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
                    'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
                },
                loading_screen: { backgroundColor: '#1C1C1C', foregroundColor: '#00C6E0' },
                toolbar_bg: '#1C1C1C',
            };

            // Add broker factory for TradingView trading terminal
            if (brokerFactory) {
                widgetOptions.broker_factory = brokerFactory;
                widgetOptions.broker_config = {
                    configFlags: {
                        supportOrderBrackets: true,
                        supportPositionBrackets: true,
                        supportClosePosition: true,
                        supportReversePosition: true,
                        supportModifyOrder: true,
                        supportCancelOrder: true,
                        supportMarketOrders: true,
                        supportLimitOrders: true,
                        supportStopOrders: true,
                        supportStopLimitOrders: true,
                        supportModifyDuration: false,
                        showQuantityInsteadOfAmount: true,
                    },
                };
            }

            try {
                const w = new window.TradingView.widget(widgetOptions);
                widgetRef.current = w;

                w.onChartReady(() => {
                    console.log('Chart has loaded!');
                    setIsLoading(false);

                    // Expose widget and chart to parent
                    if (onWidgetReadyRef.current) onWidgetReadyRef.current(w, w.activeChart());

                    // Track symbol changes
                    try {
                        w.activeChart().onSymbolChanged().subscribe(null, () => {
                            const info = w.activeChart().symbolExt();
                            if (onSymbolChangedRef.current) {
                                onSymbolChangedRef.current(info?.ticker || info?.symbol || '');
                            }
                        });
                    } catch (e) {
                        console.warn('Could not subscribe to symbol changes:', e);
                    }

                    // Right-click context menu for multi-account trading
                    // Only shown when broker_factory is NOT active (TV terminal has its own order UI)
                    if (!brokerFactory) {
                        try {
                            w.onContextMenu((unixTime, price) => {
                                const p = price.toFixed(2);
                                const qty = currentQuantityRef.current || 1;
                                const mode = selectionModeRef.current;
                                const group = groupInfoRef.current;
                                const hasAccount = hasAccountRef.current;
                                const label = (mode === 'group' || mode === 'multi') && group
                                    ? `(${group.groupName})`
                                    : `(${qty} ct)`;

                                const placeOrder = (side, type) => {
                                    onChartOrderRef.current?.({
                                        side,
                                        type,
                                        price,
                                        quantity: qty,
                                        isGroupOrder: mode === 'group',
                                        groupInfo: mode === 'group' ? group : null,
                                    });
                                };

                                // Always show menu — order handler will validate account selection
                                const noAcctSuffix = hasAccount ? '' : ' (select account first)';

                                return [
                                    { position: 'top', text: '-Trading-', click: () => {} },
                                    { position: 'top', text: `Buy Limit @ ${p} ${label}${noAcctSuffix}`, click: () => placeOrder('buy', 'LIMIT') },
                                    { position: 'top', text: `Sell Limit @ ${p} ${label}${noAcctSuffix}`, click: () => placeOrder('sell', 'LIMIT') },
                                    { position: 'top', text: '-', click: () => {} },
                                    { position: 'top', text: `Buy Stop @ ${p} ${label}${noAcctSuffix}`, click: () => placeOrder('buy', 'STOP') },
                                    { position: 'top', text: `Sell Stop @ ${p} ${label}${noAcctSuffix}`, click: () => placeOrder('sell', 'STOP') },
                                    { position: 'top', text: '-', click: () => {} },
                                    { position: 'top', text: `Buy Market ${label}${noAcctSuffix}`, click: () => placeOrder('buy', 'MARKET') },
                                    { position: 'top', text: `Sell Market ${label}${noAcctSuffix}`, click: () => placeOrder('sell', 'MARKET') },
                                ];
                            });
                        } catch (e) {
                            console.warn('Could not set up context menu:', e);
                        }
                    }
                });
            } catch (err) {
                console.error('Error initializing TradingView widget:', err);
                setError('Failed to initialize chart');
                setIsLoading(false);
            }
        };

        const loadChartingLibrary = () => {
            if (window.TradingView) {
                initWidget();
                return;
            }

            const script = document.createElement('script');
            script.src = `${libraryPath}charting_library.standalone.js`;
            script.async = true;
            script.onload = () => initWidget();
            script.onerror = () => {
                setError('Failed to load charting library script');
                setIsLoading(false);
            };
            document.head.appendChild(script);
        };

        loadChartingLibrary();

        return () => {
            if (widgetRef.current) {
                try {
                    widgetRef.current.remove();
                } catch (e) {
                    console.warn('Error removing widget:', e);
                }
                widgetRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, interval, theme]);

    return (
        <Box
            position="relative"
            height="100%"
            width="100%"
            bg="#1C1C1C"
            borderRadius="xl"
            overflow="hidden"
        >
            {isLoading && (
                <VStack
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    justify="center"
                    align="center"
                    bg="#1C1C1C"
                    zIndex={10}
                >
                    <Spinner size="xl" color="blue.500" />
                    <Text color="whiteAlpha.700">Loading Advanced Chart...</Text>
                </VStack>
            )}

            {error && (
                <VStack
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    justify="center"
                    align="center"
                    bg="#1C1C1C"
                    zIndex={10}
                >
                    <Text color="red.400">{error}</Text>
                </VStack>
            )}

            <div
                ref={containerRef}
                style={{ height: '100%', width: '100%' }}
            />
        </Box>
    );
};

export default TVAdvancedChart;
