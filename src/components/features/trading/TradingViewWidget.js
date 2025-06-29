/* global TradingView */
import React, { useEffect, useRef, memo, useState } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

const TradingViewWidget = ({ 
  symbol = 'AMEX:SPY',
  interval = '5',
  theme = 'dark',
  autosize = true,
  height = '100%',
  width = '100%'
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerIdRef = useRef(`tradingview_widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    let initializationTimeout;

    const initializeWidget = () => {
      if (!containerRef.current || !isMounted) return;

      // Ensure container is in the DOM and visible
      if (!containerRef.current.offsetParent && containerRef.current.offsetHeight === 0) {
        // Container might not be visible yet, retry after a short delay
        initializationTimeout = setTimeout(() => {
          if (isMounted) initializeWidget();
        }, 100);
        return;
      }

      // Clear previous content and widget
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing previous widget:', e);
        }
        widgetRef.current = null;
      }
      containerRef.current.innerHTML = '';

      try {
        // Set the container ID
        containerRef.current.id = containerIdRef.current;

        widgetRef.current = new TradingView.widget({
          symbol,
          interval,
          autosize,
          height,
          width,
          timezone: "exchange",
          theme,
          style: "1",
          locale: "en",
          toolbar_bg: "#1C1C1C",
          enable_publishing: true,
          hide_top_toolbar: false,
          hide_side_toolbar: true,
          allow_symbol_change: true,
          save_image: true,
          container_id: containerIdRef.current,
          studies: [
            "MASimple@tv-basicstudies",
            
          ],
          disabled_features: [
            "header_symbol_search",
            "header_settings",
            "header_compare",
            "header_undo_redo",
            "header_screenshot",
            "header_fullscreen_button"
          ],
          enabled_features: [
            "hide_left_toolbar_by_default",
            "move_logo_to_main_pane",
            "create_volume_indicator_by_default"
          ],
          overrides: {
            "mainSeriesProperties.style": 1,
            "paneProperties.background": "#1C1C1C",
            "paneProperties.vertGridProperties.color": "#363c4e",
            "paneProperties.horzGridProperties.color": "#363c4e",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": "#AAA",
            "mainSeriesProperties.candleStyle.wickUpColor": '#26a69a',
            "mainSeriesProperties.candleStyle.wickDownColor": '#ef5350',
            "mainSeriesProperties.candleStyle.upColor": '#26a69a',
            "mainSeriesProperties.candleStyle.downColor": '#ef5350'
          },
          loading_screen: {
            backgroundColor: "#1C1C1C",
            foregroundColor: "#00C6E0"
          },
          onChartReady: () => {
            if (isMounted) {
              setIsLoading(false);
              setError(null);
            }
          }
        });

      } catch (err) {
        console.error('Error creating TradingView widget:', err);
        if (isMounted) {
          setError('Failed to initialize chart');
          setIsLoading(false);
        }
      }
    };

    const loadScript = async () => {
      try {
        if (!window.TradingView) {
          // Check if script is already being loaded
          const existingScript = document.getElementById('tradingview-widget-loading-script');
          if (existingScript) {
            // Script is already loading, wait for it
            const checkTradingViewReady = () => {
              if (window.TradingView && isMounted) {
                initializeWidget();
              } else if (isMounted) {
                setTimeout(checkTradingViewReady, 100);
              }
            };
            checkTradingViewReady();
            return;
          }

          const script = document.createElement('script');
          script.id = 'tradingview-widget-loading-script';
          script.src = 'https://s3.tradingview.com/tv.js';
          script.type = 'text/javascript';
          script.async = true;
          
          script.onload = () => {
            if (isMounted && window.TradingView) {
              // Small delay to ensure TradingView is fully ready
              setTimeout(() => {
                if (isMounted) initializeWidget();
              }, 50);
            }
          };

          script.onerror = () => {
            if (isMounted) {
              setError('Failed to load TradingView widget');
              setIsLoading(false);
            }
          };

          document.head.appendChild(script);
        } else {
          // TradingView is already loaded, initialize immediately
          initializeWidget();
        }
      } catch (err) {
        console.error('Error loading TradingView script:', err);
        if (isMounted) {
          setError('Failed to load TradingView script');
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      if (isMounted) loadScript();
    }, 10);

    return () => {
      isMounted = false;
      if (initializationTimeout) clearTimeout(initializationTimeout);
      if (initTimeout) clearTimeout(initTimeout);
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing widget on cleanup:', e);
        }
        widgetRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, autosize, height, width, theme]);

  return (
    <Box 
      position="relative" 
      height="100%" 
      width="100%"
      backgroundColor="#1C1C1C"
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
          zIndex={1}
        >
          <Spinner size="xl" color="blue.500" />
          <Text color="whiteAlpha.700">Loading chart...</Text>
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
          zIndex={1}
        >
          <Text color="red.400">{error}</Text>
        </VStack>
      )}

      <Box 
        ref={containerRef}
        id="tradingview_widget"
        style={{ 
          height: '100%', 
          width: '100%'
        }}
      />
    </Box>
  );
};

export default memo(TradingViewWidget);