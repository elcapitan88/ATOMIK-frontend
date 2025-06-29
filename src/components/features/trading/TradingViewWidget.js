/* global TradingView */
import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
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
  const scriptLoadedRef = useRef(false);
  const initAttemptRef = useRef(0);
  const loadingTimeoutRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Generate unique container ID that stays consistent for this component instance
  const containerIdRef = useRef(`tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Reset loading state function
  const resetLoadingState = useCallback(() => {
    setIsLoading(true);
    setError(null);
    initAttemptRef.current = 0;
  }, []);

  // Reliable container visibility check
  const isContainerReady = useCallback(() => {
    if (!containerRef.current) return false;
    
    const rect = containerRef.current.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(containerRef.current);
    
    return (
      rect.width > 0 && 
      rect.height > 0 && 
      computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden'
    );
  }, []);

  // Widget initialization with robust error handling
  const initializeWidget = useCallback(() => {
    if (!containerRef.current) {
      console.warn('TradingView: Container ref not available');
      return false;
    }

    if (!window.TradingView) {
      console.warn('TradingView: Library not loaded');
      return false;
    }

    if (!isContainerReady()) {
      console.warn('TradingView: Container not ready');
      return false;
    }

    initAttemptRef.current += 1;
    console.log(`TradingView: Initializing widget (attempt ${initAttemptRef.current})`);

    try {
      // Clear any existing widget
      if (widgetRef.current) {
        try {
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (e) {
          console.warn('TradingView: Error removing previous widget:', e);
        }
        widgetRef.current = null;
      }

      // Clear container content
      containerRef.current.innerHTML = '';
      containerRef.current.id = containerIdRef.current;

      // Create widget with comprehensive error handling
      widgetRef.current = new TradingView.widget({
        symbol,
        interval,
        autosize,
        height: autosize ? undefined : height,
        width: autosize ? undefined : width,
        timezone: "exchange",
        theme,
        style: "1",
        locale: "en",
        toolbar_bg: "#1C1C1C",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_side_toolbar: true,
        allow_symbol_change: true,
        save_image: false,
        container_id: containerIdRef.current,
        studies: [
          "MASimple@tv-basicstudies"
        ],
        disabled_features: [
          "header_symbol_search",
          "header_settings", 
          "header_compare",
          "header_undo_redo",
          "header_screenshot",
          "header_fullscreen_button",
          "use_localstorage_for_settings"
        ],
        enabled_features: [
          "hide_left_toolbar_by_default",
          "move_logo_to_main_pane"
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
        // Multiple success indicators
        onChartReady: () => {
          console.log('TradingView: Chart ready callback fired');
          setIsLoading(false);
          setError(null);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      });

      // Fallback timeout for when onChartReady doesn't fire
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('TradingView: Fallback timeout - assuming widget loaded');
        setIsLoading(false);
        setError(null);
        loadingTimeoutRef.current = null;
      }, 8000);

      return true;

    } catch (err) {
      console.error('TradingView: Widget creation failed:', err);
      setError(`Failed to initialize chart (attempt ${initAttemptRef.current})`);
      
      // Retry logic for transient errors
      if (initAttemptRef.current < 3) {
        setTimeout(() => {
          initializeWidget();
        }, 1000 * initAttemptRef.current);
      } else {
        setIsLoading(false);
      }
      return false;
    }
  }, [symbol, interval, theme, autosize, height, width, isContainerReady]);

  // Script loading with enhanced reliability
  const loadTradingViewScript = useCallback(() => {
    if (scriptLoadedRef.current && window.TradingView) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.getElementById('tradingview-widget-loading-script');
      
      if (existingScript) {
        // Script tag exists, check if TradingView is available
        const checkReady = () => {
          if (window.TradingView) {
            scriptLoadedRef.current = true;
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
        return;
      }

      console.log('TradingView: Loading script...');
      const script = document.createElement('script');
      script.id = 'tradingview-widget-loading-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('TradingView: Script loaded successfully');
        scriptLoadedRef.current = true;
        
        // Additional check to ensure TradingView is actually available
        const verifyLoaded = () => {
          if (window.TradingView) {
            resolve();
          } else {
            setTimeout(verifyLoaded, 50);
          }
        };
        verifyLoaded();
      };

      script.onerror = (err) => {
        console.error('TradingView: Script loading failed:', err);
        reject(new Error('Failed to load TradingView script'));
      };

      document.head.appendChild(script);
      
      // Fallback timeout
      setTimeout(() => {
        if (!scriptLoadedRef.current) {
          reject(new Error('Script loading timeout'));
        }
      }, 10000);
    });
  }, []);

  // Main initialization effect
  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const initialize = async () => {
      if (!isMounted) return;

      resetLoadingState();

      try {
        // Step 1: Ensure script is loaded
        await loadTradingViewScript();
        
        if (!isMounted) return;

        // Step 2: Wait for container to be ready
        const waitForContainer = () => {
          if (!isMounted) return;
          
          if (isContainerReady()) {
            // Step 3: Initialize widget
            const success = initializeWidget();
            if (!success && isMounted && initAttemptRef.current < 3) {
              retryTimeout = setTimeout(waitForContainer, 1000);
            }
          } else {
            retryTimeout = setTimeout(waitForContainer, 100);
          }
        };

        waitForContainer();

      } catch (err) {
        console.error('TradingView: Initialization failed:', err);
        if (isMounted) {
          setError('Failed to load TradingView library');
          setIsLoading(false);
        }
      }
    };

    // Start initialization after a small delay
    const initDelay = setTimeout(initialize, 50);

    return () => {
      isMounted = false;
      clearTimeout(initDelay);
      clearTimeout(retryTimeout);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Cleanup widget
      if (widgetRef.current) {
        try {
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (e) {
          console.warn('TradingView: Cleanup error:', e);
        }
        widgetRef.current = null;
      }

      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, autosize, height, width, loadTradingViewScript, initializeWidget, isContainerReady, resetLoadingState]);

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
        style={{ 
          height: '100%', 
          width: '100%'
        }}
      />
    </Box>
  );
};

export default memo(TradingViewWidget);