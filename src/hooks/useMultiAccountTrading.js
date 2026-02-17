import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import axios from '@/services/axiosConfig';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';
import { getContractTicker } from '@/utils/formatting/tickerUtils';
import logger from '@/utils/logger';

const STORAGE_KEY = 'atomik_trading_account_configs';

/**
 * Load persisted account configs from localStorage.
 */
const loadPersistedConfigs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return new Map(Object.entries(parsed));
    }
  } catch (e) {
    logger.warn('Failed to load persisted account configs:', e);
  }
  return new Map();
};

/**
 * Save account configs to localStorage.
 */
const persistConfigs = (configs) => {
  try {
    const obj = {};
    for (const [id, cfg] of configs) {
      obj[id] = cfg;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    logger.warn('Failed to persist account configs:', e);
  }
};

/**
 * Core hook for multi-account trading.
 * Manages per-account quantity + active state, order parameters, and multi-account order dispatch.
 *
 * @param {Array} accounts - All connected broker accounts
 * @param {Array} strategies - All activated strategies (to determine auto vs manual mode)
 * @param {Object} copyTradingData - Copy trading state from useCopyTrading hook
 */
const useMultiAccountTrading = (accounts = [], strategies = [], copyTradingData = {}) => {
  const toast = useToast();
  const { getAccountData, getConnectionState } = useWebSocketContext();

  // Per-account configs: { quantity, isActive }
  const [accountConfigs, setAccountConfigs] = useState(() => loadPersistedConfigs());

  // Order parameters
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState('GTC');
  const [skipConfirmation, setSkipConfirmation] = useState(
    () => localStorage.getItem('atomik_skip_order_confirm') === 'true'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to avoid stale closures
  const accountConfigsRef = useRef(accountConfigs);
  useEffect(() => { accountConfigsRef.current = accountConfigs; }, [accountConfigs]);

  // Determine which accounts are strategy-bound (AUTO mode)
  const strategyBoundAccountIds = useMemo(() => {
    const ids = new Set();
    (strategies || []).forEach((s) => {
      if (!s.is_active) return;
      if (s.strategy_type === 'single' && s.account_id) {
        ids.add(String(s.account_id));
      } else if (s.strategy_type === 'multiple') {
        if (s.leader_account_id) ids.add(String(s.leader_account_id));
        (s.follower_accounts || []).forEach((f) => {
          if (f.account_id) ids.add(String(f.account_id));
        });
        // Also check follower_account_ids array
        (s.follower_account_ids || []).forEach((id) => ids.add(String(id)));
      }
    });
    return ids;
  }, [strategies]);

  // Get strategy info for an account (for AUTO mode display)
  const getAccountStrategies = useCallback((accountId) => {
    const id = String(accountId);
    return (strategies || []).filter((s) => {
      if (!s.is_active) return false;
      if (s.strategy_type === 'single' && String(s.account_id) === id) return true;
      if (s.strategy_type === 'multiple') {
        if (String(s.leader_account_id) === id) return true;
        if ((s.follower_accounts || []).some((f) => String(f.account_id) === id)) return true;
        if ((s.follower_account_ids || []).some((fId) => String(fId) === id)) return true;
      }
      return false;
    });
  }, [strategies]);

  // Destructure copy trading data
  const {
    copyLeaderAccountIds = new Set(),
    copyFollowerAccountIds = new Set(),
    getCopyInfo: getCopyInfoFn,
  } = copyTradingData;

  // Get account mode: AUTO > COPY-LEADER > COPY-FOLLOWER > MANUAL
  const getAccountMode = useCallback((accountId) => {
    const id = String(accountId);
    if (strategyBoundAccountIds.has(id)) return 'auto';
    if (copyLeaderAccountIds.has(id)) return 'copy-leader';
    if (copyFollowerAccountIds.has(id)) return 'copy-follower';
    return 'manual';
  }, [strategyBoundAccountIds, copyLeaderAccountIds, copyFollowerAccountIds]);

  // Initialize/sync configs when accounts change
  useEffect(() => {
    // Don't clean up configs before accounts have loaded — an empty array
    // means "still fetching", not "user deleted all accounts".
    if (accounts.length === 0) return;

    setAccountConfigs((prev) => {
      const next = new Map(prev);
      let changed = false;

      // Add new accounts
      accounts.forEach((acct) => {
        const id = String(acct.account_id);
        if (!next.has(id)) {
          next.set(id, { quantity: 1, isActive: false });
          changed = true;
        }
      });

      // Remove deleted accounts
      const currentIds = new Set(accounts.map((a) => String(a.account_id)));
      for (const [id] of next) {
        if (!currentIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }

      // Deactivate strategy-bound and copy-follower accounts
      for (const [id, cfg] of next) {
        if ((strategyBoundAccountIds.has(id) || copyFollowerAccountIds.has(id)) && cfg.isActive) {
          next.set(id, { ...cfg, isActive: false });
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [accounts, strategyBoundAccountIds, copyFollowerAccountIds]);

  // Persist on change
  useEffect(() => {
    persistConfigs(accountConfigs);
  }, [accountConfigs]);

  // Persist skip confirmation
  useEffect(() => {
    localStorage.setItem('atomik_skip_order_confirm', String(skipConfirmation));
  }, [skipConfirmation]);

  // Toggle account active state (only for manual and copy-leader accounts)
  const toggleAccount = useCallback((accountId) => {
    const id = String(accountId);
    if (strategyBoundAccountIds.has(id)) {
      toast({
        title: "Account Has Active Strategy",
        description: "Deactivate auto strategies on this account before enabling manual trading.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (copyFollowerAccountIds.has(id)) {
      toast({
        title: "Account Is Following a Leader",
        description: "Stop copy trading on this account before enabling manual trading.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setAccountConfigs((prev) => {
      const next = new Map(prev);
      const cfg = next.get(id) || { quantity: 1, isActive: false };
      next.set(id, { ...cfg, isActive: !cfg.isActive });
      return next;
    });
  }, [strategyBoundAccountIds, copyFollowerAccountIds, toast]);

  // Set account quantity
  const setAccountQuantity = useCallback((accountId, quantity) => {
    const id = String(accountId);
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    setAccountConfigs((prev) => {
      const next = new Map(prev);
      const cfg = next.get(id) || { quantity: 1, isActive: false };
      next.set(id, { ...cfg, quantity: qty });
      return next;
    });
  }, []);

  // Derived: active accounts (manual toggled on + copy-leaders always active)
  const activeAccounts = useMemo(() => {
    const result = [];
    for (const [accountId, config] of accountConfigs) {
      const mode = getAccountMode(accountId);
      // Exclude strategy-bound and copy-follower accounts
      if (mode === 'auto' || mode === 'copy-follower') continue;
      // Copy-leaders are always "active" for order dispatch
      if (mode === 'copy-leader') {
        const account = accounts.find((a) => String(a.account_id) === accountId);
        if (account) {
          result.push({ ...account, quantity: config.quantity, isActive: true });
        }
        continue;
      }
      // Manual accounts: only if toggled on
      if (!config.isActive) continue;
      const account = accounts.find((a) => String(a.account_id) === accountId);
      if (account) {
        result.push({ ...account, quantity: config.quantity, isActive: true });
      }
    }
    return result;
  }, [accountConfigs, accounts, getAccountMode]);

  const totalContracts = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + a.quantity, 0),
    [activeAccounts]
  );

  const activeCount = activeAccounts.length;

  // Place order to ALL active manual accounts in parallel
  const placeMultiAccountOrder = useCallback(
    async ({ side, type, price, stopPrice: sp, symbol, timeInForce: tif }) => {
      const accts = activeAccounts;
      if (accts.length === 0) {
        toast({
          title: 'No Active Accounts',
          description: 'Toggle at least one account ON before trading.',
          status: 'warning',
          duration: 3000,
        });
        return [];
      }

      setIsSubmitting(true);
      const oType = type || orderType;

      const promises = accts.map((acct) =>
        axios
          .post(`/api/v1/brokers/accounts/${acct.account_id}/discretionary/orders`, {
            symbol: getContractTicker(symbol),
            side,
            type: oType,
            quantity: acct.quantity,
            price: oType === 'LIMIT' || oType === 'STOP_LIMIT' ? (price || limitPrice || undefined) : undefined,
            stop_price: oType === 'STOP' || oType === 'STOP_LIMIT' ? (sp || stopPrice || undefined) : undefined,
            time_in_force: tif || timeInForce || 'GTC',
          })
          .then((res) => ({
            accountId: acct.account_id,
            nickname: acct.nickname || acct.name,
            success: true,
            data: res.data,
          }))
          .catch((err) => ({
            accountId: acct.account_id,
            nickname: acct.nickname || acct.name,
            success: false,
            error: err.response?.data?.detail || err.message,
          }))
      );

      const results = await Promise.all(promises);
      setIsSubmitting(false);

      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      if (failures.length === 0) {
        toast({
          title: `${side.toUpperCase()} ${oType} placed`,
          description: `${successes.length} account(s), ${totalContracts} contract(s)`,
          status: 'success',
          duration: 3000,
        });
      } else if (successes.length === 0) {
        toast({
          title: 'All orders failed',
          description: failures.map((f) => `${f.nickname}: ${f.error}`).join('; '),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: `${successes.length} placed, ${failures.length} failed`,
          description: failures.map((f) => `${f.nickname}: ${f.error}`).join('; '),
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }

      return results;
    },
    [activeAccounts, orderType, limitPrice, stopPrice, timeInForce, totalContracts, toast]
  );

  return {
    // Per-account configs
    accountConfigs,
    activeAccounts,
    totalContracts,
    activeCount,

    // Account mutations
    toggleAccount,
    setAccountQuantity,

    // Account mode helpers
    getAccountMode,
    getAccountStrategies,
    strategyBoundAccountIds,
    copyLeaderAccountIds,
    copyFollowerAccountIds,
    getCopyInfo: getCopyInfoFn,

    // Order params
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice,
    stopPrice,
    setStopPrice,
    timeInForce,
    setTimeInForce,
    skipConfirmation,
    setSkipConfirmation,
    isSubmitting,

    // Order dispatch
    placeMultiAccountOrder,
  };
};

export default useMultiAccountTrading;
