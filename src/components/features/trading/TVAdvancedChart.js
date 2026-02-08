import React, { useEffect, useRef, useState } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import CustomDatafeed from './CustomDatafeed';
import { chartStorage } from '@services/datafeed/chartStorage';
import { createMockBrokerFactory } from '@services/datafeed/mockBroker';

const TVAdvancedChart = ({
    symbol = 'NQ',
    interval = '5',
    theme = 'Dark',
    containerId = 'tv_chart_container',
    libraryPath = '/charting_library/',
    fullscreen = false,
    autosize = true,
    studiesOverrides = {},
}) => {
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let widget = null;

        const initWidget = () => {
            if (!window.TradingView) {
                setError('TradingView library not loaded');
                setIsLoading(false);
                return;
            }

            const datafeed = new CustomDatafeed();

            const brokerFactory = createMockBrokerFactory();

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
                enabled_features: [
                    'study_templates',
                    'create_volume_indicator_by_default',
                    'save_chart_properties_to_local_storage',
                    'side_toolbar_in_fullscreen_mode',
                    'trading_account_manager',
                    'order_panel',
                    'buy_sell_buttons',
                    'show_order_panel_on_start',
                ],
                broker_factory: brokerFactory,
                broker_config: {
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
                        supportPartialClosePosition: false,
                        showQuantityInsteadOfAmount: true,
                    },
                },
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

            try {
                widget = new window.TradingView.widget(widgetOptions);

                widget.onChartReady(() => {
                    console.log('Chart has loaded!');
                    setIsLoading(false);
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
            if (widget) {
                try {
                    widget.remove();
                } catch (e) {
                    console.warn('Error removing widget:', e);
                }
            }
        };
    }, [symbol, interval, theme, libraryPath, fullscreen, autosize, studiesOverrides]);

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
