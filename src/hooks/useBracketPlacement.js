import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';
import { roundToTick, getTickSize, normalizeSymbol } from '@/hooks/useChartTrading';
import { getContractTicker } from '@/utils/formatting/tickerUtils';

const DEFAULT_TICK_OFFSET = 20;

const useBracketPlacement = ({ chartSymbol, chartCurrentPrice, multiAccountTrading }) => {
  const [isActive, setIsActive] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);
  const [entryPrice, setEntryPrice] = useState(null);
  const [tpPrice, setTpPrice] = useState(null);
  const [slPrice, setSlPrice] = useState(null);
  const [side, setSide] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  // Track offsets so dragging entry preserves TP/SL distance
  const offsetsRef = useRef({ tp: 0, sl: 0 });

  const activate = useCallback(() => {
    setIsActive(true);
    setIsPlaced(false);
    setEntryPrice(null);
    setTpPrice(null);
    setSlPrice(null);
    setSide(null);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setIsPlaced(false);
    setEntryPrice(null);
    setTpPrice(null);
    setSlPrice(null);
    setSide(null);
  }, []);

  const placeEntry = useCallback((price, marketPrice) => {
    if (!isActive) return;

    // Use marketPrice (from useChartCoordinates) as fallback for chartCurrentPrice
    const currentMkt = chartCurrentPrice || marketPrice;
    if (!currentMkt) return;

    const sym = normalizeSymbol(chartSymbol);
    const snapped = roundToTick(price, sym);
    const tickSize = getTickSize(sym);
    const offset = tickSize * DEFAULT_TICK_OFFSET;

    // entry below market = BUY, entry above market = SELL
    const detectedSide = snapped < currentMkt ? 'BUY' : 'SELL';
    const isBuy = detectedSide === 'BUY';

    const tp = roundToTick(isBuy ? snapped + offset : snapped - offset, sym);
    const sl = roundToTick(isBuy ? snapped - offset : snapped + offset, sym);

    offsetsRef.current = { tp: tp - snapped, sl: sl - snapped };

    setEntryPrice(snapped);
    setTpPrice(tp);
    setSlPrice(sl);
    setSide(detectedSide);
    setIsPlaced(true);
  }, [isActive, chartCurrentPrice, chartSymbol]);

  const updateEntry = useCallback((price) => {
    const sym = normalizeSymbol(chartSymbol);
    const snapped = roundToTick(price, sym);
    const { tp: tpOff, sl: slOff } = offsetsRef.current;

    setEntryPrice(snapped);
    setTpPrice(roundToTick(snapped + tpOff, sym));
    setSlPrice(roundToTick(snapped + slOff, sym));
  }, [chartSymbol]);

  const updateTp = useCallback((price) => {
    const sym = normalizeSymbol(chartSymbol);
    const snapped = roundToTick(price, sym);
    setTpPrice(snapped);
    if (entryPrice != null) {
      offsetsRef.current.tp = snapped - entryPrice;
    }
  }, [chartSymbol, entryPrice]);

  const updateSl = useCallback((price) => {
    const sym = normalizeSymbol(chartSymbol);
    const snapped = roundToTick(price, sym);
    setSlPrice(snapped);
    if (entryPrice != null) {
      offsetsRef.current.sl = snapped - entryPrice;
    }
  }, [chartSymbol, entryPrice]);

  const toggleSide = useCallback(() => {
    if (!isPlaced || !entryPrice) return;
    const newSide = side === 'BUY' ? 'SELL' : 'BUY';

    // Swap TP and SL prices (and offsets)
    const currentTp = tpPrice;
    const currentSl = slPrice;
    setTpPrice(currentSl);
    setSlPrice(currentTp);
    setSide(newSide);

    // Swap offsets in ref
    const { tp: tpOff, sl: slOff } = offsetsRef.current;
    offsetsRef.current = { tp: slOff, sl: tpOff };
  }, [isPlaced, entryPrice, side, tpPrice, slPrice]);

  const submit = useCallback(async (submittedSide) => {
    const finalSide = submittedSide || side;
    if (!finalSide || entryPrice == null || tpPrice == null || slPrice == null) return;

    const activeAccounts = multiAccountTrading?.activeAccounts || [];
    if (activeAccounts.length === 0) {
      toast({
        title: 'No active accounts',
        description: 'Enable at least one account to place bracket orders.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    const contractSymbol = getContractTicker(normalizeSymbol(chartSymbol));
    const tif = multiAccountTrading?.timeInForce || 'GTC';

    // One bracket-order call per account (entry + TP + SL linked via OSO/OCO)
    const promises = activeAccounts.map((acct) => {
      const endpoint = `/api/v1/brokers/accounts/${acct.account_id}/discretionary/bracket-order`;
      return axiosInstance.post(endpoint, {
        symbol: contractSymbol,
        side: finalSide.toLowerCase(),
        quantity: acct.quantity,
        entry_price: entryPrice,
        tp_price: tpPrice,
        sl_price: slPrice,
        entry_type: 'LIMIT',
        time_in_force: tif,
      }).catch(err => ({ _error: true, acct: acct.account_id, err }));
    });

    try {
      const results = await Promise.all(promises);
      const failures = results.filter(r => r && r._error);

      if (failures.length > 0) {
        console.warn('[BracketPlacement] Some brackets failed:', failures);
        const succeeded = results.length - failures.length;
        toast({
          title: 'Bracket partially placed',
          description: `${succeeded} of ${results.length} brackets succeeded. ${failures.length} failed.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Bracket placed',
          description: `Bracket order placed on ${activeAccounts.length} account${activeAccounts.length > 1 ? 's' : ''}. TP/SL are auto-linked.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      deactivate();
    } catch (err) {
      console.error('[BracketPlacement] Submission error:', err);
      toast({
        title: 'Bracket order failed',
        description: err?.response?.data?.detail || err.message || 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [side, entryPrice, tpPrice, slPrice, chartSymbol, multiAccountTrading, toast, deactivate]);

  // Escape key to cancel bracket mode
  useEffect(() => {
    if (!isActive) return;
    const handler = (e) => {
      if (e.key === 'Escape') deactivate();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, deactivate]);

  return {
    isActive,
    isPlaced,
    entryPrice,
    tpPrice,
    slPrice,
    side,
    isSubmitting,
    symbol: normalizeSymbol(chartSymbol),
    activate,
    deactivate,
    placeEntry,
    updateEntry,
    updateTp,
    updateSl,
    toggleSide,
    submit,
  };
};

export default useBracketPlacement;
