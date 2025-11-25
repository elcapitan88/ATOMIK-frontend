import React, { useEffect, useRef, useState } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import CustomDatafeed from './CustomDatafeed';

const TVAdvancedChart = ({
    symbol = 'AMEX:SPY',
    interval = '5',
    theme = 'Dark',
    containerId = 'tv_chart_container',
    libraryPath = '/charting_library/',
    chartsStorageUrl = 'https://saveload.tradingview.com',
    chartsStorageApiVersion = '1.1',
    clientId = 'tradingview.com',
    userId = 'public_user_id',
    fullscreen = false,
    autosize = true,
    studiesOverrides = {},
    useCustomDatafeed = true, // Toggle between custom and demo datafeed
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

            // Check if we need Datafeeds for demo feed
            if (!useCustomDatafeed && !window.Datafeeds) {
                setError('Datafeeds library not loaded');
                setIsLoading(false);
                return;
            }

            // Choose datafeed based on configuration
            let datafeed;
            if (useCustomDatafeed) {
                console.log('[TVAdvancedChart]: Using custom datafeed');
                datafeed = new CustomDatafeed();
            } else {
                console.log('[TVAdvancedChart]: Using TradingView demo datafeed');
                datafeed = new window.Datafeeds.UDFCompatibleDatafeed("https://demo-feed.tradingview.com", {
                    maxResponseLength: 1000000,
                    expectedOrder: 'latestFirst'
                });
            }

            const widgetOptions = {
                symbol: symbol,
                datafeed: datafeed,
                interval: interval,
                container: containerRef.current,
                library_path: libraryPath,
                locale: 'en',
                disabled_features: ['use_localstorage_for_settings'],
                enabled_features: ['study_templates'],
                charts_storage_url: chartsStorageUrl,
                charts_storage_api_version: chartsStorageApiVersion,
                client_id: clientId,
                user_id: userId,
                fullscreen: fullscreen,
                autosize: autosize,
                studies_overrides: studiesOverrides,
                theme: theme,
                // Add debug mode to see potential issues
                debug: true,
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

        const loadDatafeedScript = (callback) => {
            // Skip loading datafeed script if using custom datafeed
            if (useCustomDatafeed) {
                callback();
                return;
            }

            if (window.Datafeeds) {
                callback();
                return;
            }

            const datafeedScript = document.createElement('script');
            datafeedScript.src = '/datafeeds/udf/dist/bundle.js';
            datafeedScript.async = true;
            datafeedScript.onload = callback;
            datafeedScript.onerror = () => {
                setError('Failed to load datafeed script');
                setIsLoading(false);
            };
            document.head.appendChild(datafeedScript);
        };

        const loadChartingLibrary = () => {
            if (window.TradingView) {
                loadDatafeedScript(initWidget);
                return;
            }

            const script = document.createElement('script');
            script.src = `${libraryPath}charting_library.standalone.js`;
            script.async = true;
            script.onload = () => loadDatafeedScript(initWidget);
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
    }, [symbol, interval, theme, libraryPath, chartsStorageUrl, chartsStorageApiVersion, clientId, userId, fullscreen, autosize, studiesOverrides, useCustomDatafeed]);

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
