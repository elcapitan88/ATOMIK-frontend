import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';
import { roundToTick, getTickSize, normalizeSymbol } from '@/hooks/useChartTrading';
import { getContractTicker } from '@/utils/formatting/tickerUtils';

const STORAGE_KEY = 'atomik_auto_bracket_config';

const DEFAULT_CONFIG = {
  enabled: false,
  tpOffset: 20,
  slOffset: 15,
  unit: 'ticks', // 'ticks' | 'dollars'
};

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (_) {}
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (_) {}
}

/**
 * useAutoBracket — manages auto-bracket settings and submission.
 *
 * When enabled, right-click "Stop + Brackets" menu items appear on the chart.
 * Clicking one sends an OSO bracket order (Stop entry + TP Limit + SL Stop)
 * to the existing backend bracket-order endpoint.
 */
const useAutoBracket = ({ chartSymbol, multiAccountTrading }) => {
  const [config, setConfig] = useState(loadConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const configRef = useRef(config);

  // Keep ref in sync for stale-closure access (TradingView context menu)
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Persist on change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const toggle = useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setEnabled = useCallback((val) => {
    setConfig((prev) => ({ ...prev, enabled: val }));
  }, []);

  const setTpOffset = useCallback((val) => {
    const n = Math.max(1, parseInt(val, 10) || 1);
    setConfig((prev) => ({ ...prev, tpOffset: n }));
  }, []);

  const setSlOffset = useCallback((val) => {
    const n = Math.max(1, parseInt(val, 10) || 1);
    setConfig((prev) => ({ ...prev, slOffset: n }));
  }, []);

  const setUnit = useCallback((u) => {
    setConfig((prev) => ({ ...prev, unit: u }));
  }, []);

  /**
   * Calculate TP and SL prices from an entry price + side + symbol.
   */
  const calculateBracketPrices = useCallback(
    (entryPrice, side, symbol) => {
      const sym = normalizeSymbol(symbol || chartSymbol);
      const tickSize = getTickSize(sym);
      const cfg = configRef.current;

      let tpDistance, slDistance;
      if (cfg.unit === 'dollars') {
        // Dollars → ticks: $amount / (tickSize * tickValue)
        // For simplicity, treat offset as raw price distance in dollars
        // (user enters dollar distance, we use it directly as price offset)
        tpDistance = cfg.tpOffset;
        slDistance = cfg.slOffset;
      } else {
        // Ticks → price distance
        tpDistance = cfg.tpOffset * tickSize;
        slDistance = cfg.slOffset * tickSize;
      }

      const isBuy = side.toUpperCase() === 'BUY';
      const tp = roundToTick(isBuy ? entryPrice + tpDistance : entryPrice - tpDistance, sym);
      const sl = roundToTick(isBuy ? entryPrice - slDistance : entryPrice + slDistance, sym);

      return { tp, sl };
    },
    [chartSymbol]
  );

  /**
   * Submit a stop + brackets order to all active accounts.
   */
  const submitStopBracket = useCallback(
    async (entryPrice, side) => {
      const activeAccounts = multiAccountTrading?.activeAccounts || [];
      if (activeAccounts.length === 0) {
        toast({
          title: 'No active accounts',
          description: 'Enable at least one account to place orders.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const sym = normalizeSymbol(chartSymbol);
      const snappedEntry = roundToTick(entryPrice, sym);
      const { tp, sl } = calculateBracketPrices(snappedEntry, side, sym);
      const contractSymbol = getContractTicker(sym);
      const tif = multiAccountTrading?.timeInForce || 'GTC';

      setIsSubmitting(true);

      const promises = activeAccounts.map((acct) => {
        const endpoint = `/api/v1/brokers/accounts/${acct.account_id}/discretionary/bracket-order`;
        return axiosInstance
          .post(endpoint, {
            symbol: contractSymbol,
            side: side.toLowerCase(),
            quantity: acct.quantity,
            entry_price: snappedEntry,
            tp_price: tp,
            sl_price: sl,
            entry_type: 'STOP',
            time_in_force: tif,
          })
          .catch((err) => ({ _error: true, acct: acct.account_id, err }));
      });

      try {
        const results = await Promise.all(promises);
        const failures = results.filter((r) => r && r._error);

        if (failures.length > 0) {
          const succeeded = results.length - failures.length;
          toast({
            title: 'Bracket partially placed',
            description: `${succeeded} of ${results.length} succeeded. ${failures.length} failed.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        } else {
          const cfg = configRef.current;
          toast({
            title: `${side.toUpperCase()} Stop + Brackets placed`,
            description: `${activeAccounts.length} acct${activeAccounts.length !== 1 ? 's' : ''} — TP: ${cfg.tpOffset} ${cfg.unit}, SL: ${cfg.slOffset} ${cfg.unit}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
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
    },
    [chartSymbol, multiAccountTrading, calculateBracketPrices, toast]
  );

  return {
    // Config state
    enabled: config.enabled,
    tpOffset: config.tpOffset,
    slOffset: config.slOffset,
    unit: config.unit,

    // Setters
    toggle,
    setEnabled,
    setTpOffset,
    setSlOffset,
    setUnit,

    // Ref for stale-closure access
    configRef,

    // Actions
    calculateBracketPrices,
    submitStopBracket,
    isSubmitting,
  };
};

export default useAutoBracket;
