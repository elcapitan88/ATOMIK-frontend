// src/hooks/useTradeData.js
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

export const useTradeData = () => {
  // States for positions and trades
  const [openPositions, setOpenPositions] = useState({});
  const [historicalTrades, setHistoricalTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccounts, setActiveAccounts] = useState([]);

  // Function to fetch account data
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/api/v1/brokers/accounts');
      
      if (!response.data || response.data.length === 0) {
        setActiveAccounts([]);
        return [];
      }

      // Filter active accounts
      const accounts = response.data.filter(account => 
        account.status === 'active' && !account.is_token_expired
      );
      
      setActiveAccounts(accounts);
      return accounts;
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      setError(error.message || 'Failed to fetch account data');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to fetch open positions
  const fetchOpenPositions = useCallback(async (accounts) => {
    const positions = {};
    
    for (const account of accounts) {
      try {
        const response = await axiosInstance.get(`/api/v1/brokers/accounts/${account.account_id}/positions`);
        
        if (response.data && response.data.positions) {
          positions[account.account_id] = response.data.positions.map(position => ({
            id: position.id || `pos-${Math.random()}`,
            symbol: position.symbol,
            side: position.side,
            quantity: position.quantity,
            entryPrice: position.entryPrice || position.entry_price,
            currentPrice: position.currentPrice || position.current_price,
            timeEntered: position.timeEntered || position.time_entered || new Date().toISOString(),
            accountId: account.account_id,
            accountName: account.nickname || account.name
          }));
        }
      } catch (err) {
        logger.error(`Error fetching positions for account ${account.account_id}:`, err);
      }
    }
    
    setOpenPositions(positions);
    return positions;
  }, []);

  // Function to fetch historical trades
  const fetchHistoricalTrades = useCallback(async (accounts) => {
    let allTrades = [];
    
    for (const account of accounts) {
      try {
        const response = await axiosInstance.get(`/api/v1/brokers/accounts/${account.account_id}/orders`);
        
        if (response.data && response.data.orders) {
          const trades = response.data.orders
            .filter(order => order.status === 'FILLED' || order.status === 'filled')
            .map(order => ({
              id: order.id || order.order_id,
              symbol: order.symbol,
              side: order.side,
              quantity: order.quantity,
              entryPrice: order.entryPrice || order.price,
              exitPrice: order.exitPrice || order.average_fill_price,
              pnl: order.pnl || order.realized_pnl || 0,
              date: order.filled_at || order.timestamp,
              accountId: account.account_id,
              accountName: account.nickname || account.name,
              duration: order.duration || 'N/A'
            }));
            
          allTrades = [...allTrades, ...trades];
        }
      } catch (err) {
        logger.error(`Error fetching trades for account ${account.account_id}:`, err);
      }
    }
    
    setHistoricalTrades(allTrades);
    return allTrades;
  }, []);

  // Initialize and set up polling
  // useEffect(() => {
  //   let positionsInterval;
  //   let tradesInterval;
  //   let mounted = true;

  //   const initialize = async () => {
  //     try {
  //       const accounts = await fetchAccounts();
        
  //       if (accounts.length > 0 && mounted) {
  //         await Promise.all([
  //           fetchOpenPositions(accounts),
  //           fetchHistoricalTrades(accounts)
  //         ]);
  //       }
  //     } catch (error) {
  //       logger.error('Error initializing trade data:', error);
  //     }
  //   };

  //   initialize();

  //   // Set up polling intervals
  //   positionsInterval = setInterval(() => {
  //     if (activeAccounts.length > 0) {
  //       fetchOpenPositions(activeAccounts);
  //     }
  //   }, 30000); // Poll positions every 30 seconds

  //   tradesInterval = setInterval(() => {
  //     if (activeAccounts.length > 0) {
  //       fetchHistoricalTrades(activeAccounts);
  //     }
  //   }, 10000); // Poll historical trades every 10 seconds

  //   return () => {
  //     mounted = false;
  //     clearInterval(positionsInterval);
  //     clearInterval(tradesInterval);
  //   };
  // }, [fetchAccounts, fetchOpenPositions, fetchHistoricalTrades, activeAccounts]);

  // Function to manually refresh data
  // const refreshData = useCallback(async () => {
  //   setIsLoading(true);
  //   try {
  //     const accounts = await fetchAccounts();
  //     if (accounts.length > 0) {
  //       await Promise.all([
  //         fetchOpenPositions(accounts),
  //         fetchHistoricalTrades(accounts)
  //       ]);
  //     }
  //   } catch (error) {
  //     logger.error('Error refreshing data:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [fetchAccounts, fetchOpenPositions, fetchHistoricalTrades]);

  return {
    openPositions,
    historicalTrades,
    isLoading,
    error,
    activeAccounts,
    //refreshData
  };
};