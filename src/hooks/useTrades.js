// src/hooks/useTrades.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { TradesApi } from '@/services/api/trades/tradesApi';
import logger from '@/utils/logger';

/**
 * Custom hook for managing trade data using the new trades API
 * Provides live trades, historical trades, and performance data
 */
export const useTrades = () => {
  // States for different types of trade data
  const [liveTrades, setLiveTrades] = useState([]);
  const [historicalTrades, setHistoricalTrades] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [tradedSymbols, setTradedSymbols] = useState([]);
  const [tradeStrategies, setTradeStrategies] = useState([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state for historical trades
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    has_next: false,
    has_prev: false
  });

  // Filters for historical trades
  const [filters, setFilters] = useState({
    symbol: null,
    strategy_id: null,
    days_back: 30,
    profitable_only: null
  });

  // Refs for managing intervals and preventing memory leaks
  const liveTradesInterval = useRef(null);
  const mounted = useRef(true);

  /**
   * Fetch live trades from API
   */
  const fetchLiveTrades = useCallback(async () => {
    try {
      const trades = await TradesApi.getLiveTrades();
      if (mounted.current) {
        setLiveTrades(trades);
        setError(null);
      }
      return trades;
    } catch (error) {
      logger.error('Error fetching live trades:', error);
      if (mounted.current) {
        setError(error.message);
      }
      return [];
    }
  }, []);

  /**
   * Fetch historical trades with current filters and pagination
   */
  const fetchHistoricalTrades = useCallback(async (page = 1, newFilters = null) => {
    try {
      const queryFilters = { 
        ...filters, 
        ...(newFilters || {}), 
        page, 
        per_page: pagination.per_page 
      };

      const response = await TradesApi.getHistoricalTrades(queryFilters);
      
      if (mounted.current) {
        setHistoricalTrades(response.trades || []);
        setPagination({
          page: response.page || page,
          per_page: response.per_page || pagination.per_page,
          total: response.total || 0,
          has_next: response.has_next || false,
          has_prev: response.has_prev || false
        });
        setError(null);
      }
      
      return response;
    } catch (error) {
      logger.error('Error fetching historical trades:', error);
      if (mounted.current) {
        setError(error.message);
      }
      return { trades: [], total: 0 };
    }
  }, [filters, pagination.per_page]);

  /**
   * Fetch performance summary
   */
  const fetchPerformanceData = useCallback(async (days_back = 30) => {
    try {
      const performance = await TradesApi.getPerformanceSummary(days_back);
      if (mounted.current) {
        setPerformanceData(performance);
      }
      return performance;
    } catch (error) {
      logger.error('Error fetching performance data:', error);
      return null;
    }
  }, []);

  /**
   * Fetch available symbols and strategies for filtering
   */
  const fetchFilterOptions = useCallback(async (days_back = 30) => {
    try {
      const [symbols, strategies] = await Promise.all([
        TradesApi.getTradedSymbols(days_back),
        TradesApi.getTradeStrategies(days_back)
      ]);
      
      if (mounted.current) {
        setTradedSymbols(symbols);
        setTradeStrategies(strategies);
      }
      
      return { symbols, strategies };
    } catch (error) {
      logger.error('Error fetching filter options:', error);
      return { symbols: [], strategies: [] };
    }
  }, []);

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    mounted.current = true;
    
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchLiveTrades(),
          fetchHistoricalTrades(1),
          fetchPerformanceData(filters.days_back),
          fetchFilterOptions(filters.days_back)
        ]);
      } catch (error) {
        logger.error('Error initializing trade data:', error);
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    // Set up live trades polling (every 10 seconds)
    liveTradesInterval.current = setInterval(() => {
      if (mounted.current) {
        fetchLiveTrades();
      }
    }, 10000);

    // Cleanup on unmount
    return () => {
      mounted.current = false;
      if (liveTradesInterval.current) {
        clearInterval(liveTradesInterval.current);
      }
    };
  }, []); // Run only once on mount

  /**
   * Refresh all data manually
   */
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchLiveTrades(),
        fetchHistoricalTrades(pagination.page),
        fetchPerformanceData(filters.days_back),
        fetchFilterOptions(filters.days_back)
      ]);
    } catch (error) {
      logger.error('Error refreshing trade data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchLiveTrades, fetchHistoricalTrades, fetchPerformanceData, fetchFilterOptions, pagination.page, filters.days_back]);

  /**
   * Update filters and refetch historical trades
   */
  const updateFilters = useCallback(async (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Reset to page 1 when filters change
    await fetchHistoricalTrades(1, newFilters);
    
    // Also update filter options if days_back changed
    if (newFilters.days_back && newFilters.days_back !== filters.days_back) {
      await Promise.all([
        fetchPerformanceData(newFilters.days_back),
        fetchFilterOptions(newFilters.days_back)
      ]);
    }
  }, [filters, fetchHistoricalTrades, fetchPerformanceData, fetchFilterOptions]);

  /**
   * Load specific page of historical trades
   */
  const loadPage = useCallback(async (page) => {
    await fetchHistoricalTrades(page);
  }, [fetchHistoricalTrades]);

  /**
   * Close a specific trade
   */
  const closeTrade = useCallback(async (tradeId, options = {}) => {
    try {
      const closedTrade = await TradesApi.closeTrade(tradeId, options);
      
      // Refresh live trades to remove the closed position
      await fetchLiveTrades();
      
      // Optionally refresh historical trades to show the newly closed trade
      await fetchHistoricalTrades(pagination.page);
      
      return closedTrade;
    } catch (error) {
      logger.error(`Error closing trade ${tradeId}:`, error);
      throw error;
    }
  }, [fetchLiveTrades, fetchHistoricalTrades, pagination.page]);

  /**
   * Get detailed information about a specific trade
   */
  const getTradeDetail = useCallback(async (tradeId) => {
    try {
      return await TradesApi.getTradeDetail(tradeId);
    } catch (error) {
      logger.error(`Error fetching trade detail for ${tradeId}:`, error);
      throw error;
    }
  }, []);

  return {
    // Data
    liveTrades,
    historicalTrades,
    performanceData,
    tradedSymbols,
    tradeStrategies,
    
    // States
    isLoading,
    isRefreshing,
    error,
    pagination,
    filters,
    
    // Actions
    refreshData,
    updateFilters,
    loadPage,
    closeTrade,
    getTradeDetail,
    
    // Manual fetch functions
    fetchLiveTrades,
    fetchHistoricalTrades,
    fetchPerformanceData,
    fetchFilterOptions
  };
};

export default useTrades;