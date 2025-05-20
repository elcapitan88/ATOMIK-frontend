import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/services/axiosConfig';
import wsService from '@services/websocket/tradovateWS';

export const normalizePosition = (position, broker) => {
  try {
    switch (broker) {
      case 'tradovate':
        // Extract contract symbol from contractInfo if available
        const symbol = position.contractInfo?.name || 
                      position.contractInfo?.symbol || 
                      position.symbol || 
                      'Unknown';

        // Calculate P/L more accurately
        const quantity = Math.abs(parseFloat(position.quantity || 0));
        const entryPrice = parseFloat(position.avgPrice || 0);
        const currentPrice = parseFloat(position.lastPrice || position.currentPrice || 0);
        const tickValue = parseFloat(position.contractInfo?.tickValue || 1);
        const tickSize = parseFloat(position.contractInfo?.tickSize || 0.01);
        const isLong = position.side === 'LONG' || parseFloat(position.quantity) > 0;

        // Calculate P/L using tick values
        const priceDiff = (currentPrice - entryPrice) * (isLong ? 1 : -1);
        const ticks = priceDiff / tickSize;
        const unrealizedPnL = ticks * tickValue * quantity;

        const normalizedPosition = {
          id: position.id,
          contractId: position.contractId,
          symbol: symbol,
          quantity: quantity,
          entryPrice: entryPrice.toFixed(2),
          currentPrice: currentPrice.toFixed(2),
          unrealizedPnL: unrealizedPnL.toFixed(2),
          side: isLong ? 'LONG' : 'SHORT',
          broker: 'Tradovate',
          accountId: position.accountId,
          timestamp: position.timestamp,
          contractInfo: {
            tickValue: tickValue,
            tickSize: tickSize,
            name: position.contractInfo?.name,
            maturity: position.contractInfo?.maturity
          }
        };
        
        console.log('Normalized position:', normalizedPosition); // Debug log
        return normalizedPosition;
        
      default:
        return position;
    }
  } catch (error) {
    console.error('Error normalizing position:', error, position);
    return null;
  }
};

export const useTradeData = () => {
  const [openPositions, setOpenPositions] = useState({});
  const [historicalTrades, setHistoricalTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [hasNoAccounts, setHasNoAccounts] = useState(false);
  const [marketDataCache, setMarketDataCache] = useState(new Map());

  const handleFetchError = useCallback((error) => {
    if (error.response?.status === 404) {
      setHasNoAccounts(true);
      setConnectedAccounts([]);
    }
    console.error('Error fetching accounts:', error);
    setErrors(prev => ({
      ...prev,
      accounts: error.response?.data?.error || 'Failed to fetch accounts'
    }));
  }, []);

  const calculatePnL = useCallback((position, marketData) => {
    try {
      const quantity = Math.abs(parseFloat(position.quantity));
      const entryPrice = parseFloat(position.entryPrice);
      const currentPrice = parseFloat(marketData.lastPrice || position.currentPrice);
      const tickValue = parseFloat(position.contractInfo?.tickValue || 1);
      const tickSize = parseFloat(position.contractInfo?.tickSize || 0.01);
      const isLong = position.side === 'LONG';

      const priceDiff = (currentPrice - entryPrice) * (isLong ? 1 : -1);
      const ticks = priceDiff / tickSize;
      const unrealizedPnL = ticks * tickValue * quantity;

      return {
        ...position,
        currentPrice: currentPrice.toFixed(2),
        unrealizedPnL: unrealizedPnL.toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating P&L:', error);
      return position;
    }
  }, []);

  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts...');
      const response = await axiosInstance.get('/api/tradovate/fetch-accounts/');
      
      if (response.status === 404 || !response.data.length) {
        setHasNoAccounts(true);
        setConnectedAccounts([]);
        return [];
      }

      const activeAccounts = response.data.filter(account => 
        account.active && account.status === 'active' && !account.is_token_expired
      );
      
      setHasNoAccounts(activeAccounts.length === 0);
      setConnectedAccounts(activeAccounts);

      if (activeAccounts.length > 0) {
        const { positions, errors: posErrors } = await fetchOpenPositions(activeAccounts);
        const { trades, errors: tradeErrors } = await fetchHistoricalTrades(activeAccounts);
        
        setOpenPositions(positions || {});
        setHistoricalTrades(trades || []);
        setErrors({ ...posErrors, ...tradeErrors });
      }
      
      return activeAccounts;
    } catch (error) {
      handleFetchError(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOpenPositions = async (accounts) => {
    const newPositions = {};
    const newErrors = {};

    for (const account of accounts) {
      try {
        const response = await axiosInstance.get(
          `/api/tradovate/get-account-positions/${account.account_id}/`
        );
        
        const normalizedPositions = response.data.positions
          .map(pos => normalizePosition(pos, 'tradovate'))
          .filter(Boolean)
          .map(position => {
            const marketData = marketDataCache.get(position.contractId);
            return marketData ? calculatePnL(position, marketData) : position;
          });
        
        newPositions[account.account_id] = normalizedPositions;
      } catch (error) {
        console.error(`Error fetching positions for account ${account.account_id}:`, error);
        newErrors[account.account_id] = error.message;
      }
    }

    return { positions: newPositions, errors: newErrors };
  };

  const fetchHistoricalTrades = async (accounts) => {
    const allTrades = [];
    const newErrors = {};

    for (const account of accounts) {
      try {
        const response = await axiosInstance.get(
          `/api/tradovate/get-account-orders/${account.account_id}/`
        );
        
        const normalizedTrades = response.data.orders
          .filter(order => order.status === 'filled')
          .map(order => ({
            id: order.id,
            orderId: order.orderId,
            symbol: order.symbol,
            quantity: order.quantity,
            price: order.price,
            side: order.side,
            timestamp: order.timestamp,
            accountId: account.account_id,
            accountName: account.nickname || account.name || account.account_id,
            broker: 'Tradovate'
          }));

        allTrades.push(...normalizedTrades);
      } catch (error) {
        console.error(`Error fetching trades for account ${account.account_id}:`, error);
        newErrors[account.account_id] = error.message;
      }
    }

    return { trades: allTrades, errors: newErrors };
  };

  const handlePositionUpdate = useCallback((data) => {
    setOpenPositions(prev => ({
      ...prev,
      [data.account_id]: data.positions
        .map(pos => {
          const marketData = marketDataCache.get(pos.contractId);
          return marketData ? calculatePnL(pos, marketData) : pos;
        })
    }));
  }, [calculatePnL, marketDataCache]);

  const handleMarketDataUpdate = useCallback((data) => {
    setMarketDataCache(prev => {
      const newCache = new Map(prev);
      newCache.set(data.contractId, {
        lastPrice: data.last,
        timestamp: Date.now()
      });
      return newCache;
    });

    setOpenPositions(prev => {
      const newPositions = { ...prev };
      Object.entries(newPositions).forEach(([accountId, positions]) => {
        newPositions[accountId] = positions.map(position => {
          if (position.contractId === data.contractId) {
            return calculatePnL(position, { lastPrice: data.last });
          }
          return position;
        });
      });
      return newPositions;
    });
  }, [calculatePnL]);

  useEffect(() => {
    const messageSubscription = wsService.subscribeToMessages(message => {
      switch (message.type) {
        case 'position_update':
          handlePositionUpdate(message);
          break;
        case 'market_data':
          handleMarketDataUpdate(message);
          break;
      }
    });

    const statusSubscription = wsService.subscribeToStatus(status => {
      console.log('WebSocket status:', status);
    });

    wsService.connect();

    return () => {
      messageSubscription.unsubscribe();
      statusSubscription.unsubscribe();
      wsService.disconnect();
    };
  }, [handlePositionUpdate, handleMarketDataUpdate]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const resetAccountState = useCallback(() => {
    setHasNoAccounts(false);
    return fetchAccounts();
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchAccounts();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    openPositions,
    historicalTrades,
    isLoading,
    errors,
    connectedAccounts,
    hasNoAccounts,
    fetchAccounts,
    refreshData,
    resetAccountState
  };
};