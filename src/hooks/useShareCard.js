import { useState, useCallback, useRef, useEffect } from 'react';
import { TradesApi } from '@/services/api/trades/tradesApi';
import logger from '@/utils/logger';

export const useShareCard = () => {
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchCardData = useCallback(async (days_back = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TradesApi.getShareCardData(days_back);
      if (mounted.current) {
        setCardData(data);
        setSelectedPeriod(days_back);
      }
      return data;
    } catch (err) {
      logger.error('Error fetching share card data:', err);
      if (mounted.current) {
        setError(err.message);
      }
      return null;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return {
    cardData,
    isLoading,
    error,
    selectedPeriod,
    fetchCardData,
    setSelectedPeriod,
  };
};

export default useShareCard;
