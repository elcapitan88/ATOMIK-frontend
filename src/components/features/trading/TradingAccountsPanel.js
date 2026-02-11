import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Spinner,
  Button,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import accountManager from '@/services/account/AccountManager';
import { useWebSocketContext } from '@/services/websocket-proxy/contexts/WebSocketContext';
import ibStatusService from '@/services/brokers/interactivebrokers/IBStatusService';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

// Modals
import BrokerSelectionModal from '@/components/common/Modal/BrokerSelectionModal';
import BrokerEnvironmentModal from '@/components/common/Modal/BrokerEnvironmentModal';
import DeleteAccount from '@/components/common/Modal/DeleteAccount';
import IBLoginModal from '@/components/common/Modal/IBLoginModal';
import AccountNicknameModal from '@/components/common/Modal/AccountNicknameModal';

import TradingAccountCard from './TradingAccountCard';

/**
 * TradingAccountsPanel
 *
 * Right-sidebar panel that replaces Management + OrderControl account selection.
 * Shows all connected accounts as compact cards in MANUAL or AUTO mode.
 *
 * Props:
 *   multiAccountTrading - return value from useMultiAccountTrading hook
 *   aggregatedPositions - positions array from useAggregatedPositions hook
 *   strategies          - activated strategies array
 */
const TradingAccountsPanel = ({ multiAccountTrading, aggregatedPositions = [], strategies = [] }) => {
  const toast = useToast();
  const {
    connect: wsConnect,
    getConnectionState,
    disconnect,
    getAccountData,
  } = useWebSocketContext();

  // Account list state (from AccountManager RxJS)
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  const { isOpen: isBrokerSelectOpen, onOpen: onBrokerSelectOpen, onClose: onBrokerSelectClose } = useDisclosure();
  const { isOpen: isEnvironmentOpen, onOpen: onEnvironmentOpen, onClose: onEnvironmentClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isIBLoginOpen, onOpen: onIBLoginOpen, onClose: onIBLoginClose } = useDisclosure();
  const { isOpen: isNicknameModalOpen, onOpen: openNicknameModal, onClose: closeNicknameModal } = useDisclosure();

  // Refs for auto-connect
  const lastConnectionAttemptRef = useRef({});

  // Destructure multi-account trading hook
  const {
    accountConfigs,
    activeAccounts,
    totalContracts,
    activeCount,
    toggleAccount,
    setAccountQuantity,
    getAccountMode,
    getAccountStrategies,
  } = multiAccountTrading;

  // ─── Account Fetching (RxJS) ──────────────────────────────────────
  const fetchAccounts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      await accountManager.fetchAccounts(true);
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch accounts',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let sub;
    const init = async () => {
      setIsLoading(true);
      sub = accountManager.getAccountUpdates().subscribe({
        next: (update) => {
          if (update.type === 'bulk') setAccounts(update.accounts);
          else if (update.type === 'update')
            setAccounts((prev) =>
              prev.map((a) => (a.account_id === update.accountId ? update.account : a))
            );
          else if (update.type === 'remove')
            setAccounts((prev) => prev.filter((a) => a.account_id !== update.accountId));
        },
        error: (err) => logger.error('Account subscription error:', err),
      });
      await fetchAccounts();
    };
    init();
    return () => sub?.unsubscribe();
  }, [fetchAccounts]);

  // ─── IB Status Service ─────────────────────────────────────────────
  useEffect(() => {
    const ibAccounts = accounts.filter((a) => a.broker_id === 'interactivebrokers');
    if (ibAccounts.length > 0 && !ibStatusService.getStatus().isActive) {
      ibStatusService.start(accounts);
    }
    ibAccounts.forEach((a) => ibStatusService.addAccount(a));
  }, [accounts]);

  useEffect(() => {
    const sub = ibStatusService.getStatusUpdates().subscribe(({ accountId, statusData }) => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.account_id === accountId
            ? { ...a, digital_ocean_status: statusData?.status || a.digital_ocean_status }
            : a
        )
      );
    });
    return () => sub.unsubscribe();
  }, []);

  // ─── WebSocket Auto-Connect ───────────────────────────────────────
  useEffect(() => {
    if (accounts.length === 0) return;
    const disabled = localStorage.getItem('disable_auto_connect') === 'true';
    if (disabled) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const connectionAttempts = new Set();

    const autoConnect = async () => {
      for (const account of accounts) {
        const key = `${account.broker_id}:${account.account_id}`;
        if (connectionAttempts.has(key)) continue;
        if (account.status !== 'active' || !account.broker_id || !account.account_id) continue;

        const state = getConnectionState(account.broker_id, account.account_id);
        if (
          state === 'connected' ||
          state === 'ready' ||
          state === 'connecting' ||
          state === 'validating_user' ||
          state === 'checking_subscription' ||
          state === 'checking_broker_access' ||
          state === 'connecting_to_broker'
        )
          continue;

        const now = Date.now();
        const last = lastConnectionAttemptRef.current[key] || 0;
        if (now - last < 60000) continue;

        connectionAttempts.add(key);
        lastConnectionAttemptRef.current[key] = now;

        try {
          if (connectionAttempts.size > 1) await new Promise((r) => setTimeout(r, 3000));
          await wsConnect(account.broker_id, account.account_id);
        } catch (err) {
          logger.error(`Auto-connect failed for ${key}:`, err);
        } finally {
          connectionAttempts.delete(key);
        }
      }
    };

    const timeout = setTimeout(autoConnect, 1000);
    return () => {
      clearTimeout(timeout);
      connectionAttempts.clear();
    };
  }, [accounts, wsConnect, getConnectionState]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleBrokerSelect = useCallback(
    (broker) => {
      if (!broker) return;
      setSelectedBroker(broker);
      onBrokerSelectClose();
      if (broker.id === 'interactivebrokers') {
        setTimeout(() => onIBLoginOpen(), 0);
      } else {
        setTimeout(() => onEnvironmentOpen(), 0);
      }
    },
    [onBrokerSelectClose, onEnvironmentOpen, onIBLoginOpen]
  );

  const handleIBConnect = useCallback(
    async (connectionData) => {
      try {
        setIsLoading(true);
        await axiosInstance.post('/api/v1/brokers/interactivebrokers/connect', {
          environment: connectionData.environment,
          credentials: connectionData.credentials,
        });
        toast({ title: 'Success', description: 'IB account connected', status: 'success', duration: 3000 });
        onIBLoginClose();
        await fetchAccounts();
      } catch (err) {
        toast({
          title: 'Connection Error',
          description: err.response?.data?.detail || err.message || 'Failed to connect',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, onIBLoginClose, fetchAccounts]
  );

  const handleDeleteAccount = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      disconnect(selectedAccount.broker_id, selectedAccount.account_id);
      await accountManager.removeAccount(selectedAccount.account_id);
      toast({ title: 'Account Removed', status: 'success', duration: 3000 });
      onDeleteClose();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to remove', status: 'error', duration: 5000, isClosable: true });
    }
  }, [selectedAccount, toast, onDeleteClose, disconnect]);

  const handleUpdateNickname = useCallback(
    async (accountId, nickname) => {
      try {
        await axiosInstance.patch(`/api/v1/brokers/accounts/${accountId}`, { nickname });
        setAccounts((prev) => prev.map((a) => (a.account_id === accountId ? { ...a, nickname } : a)));
        await accountManager.updateAccount(accountId, { nickname });
        toast({ title: 'Nickname updated', status: 'success', duration: 3000 });
        closeNicknameModal();
      } catch (err) {
        toast({ title: 'Error', description: err.message || 'Failed to update', status: 'error', duration: 5000, isClosable: true });
        fetchAccounts(false);
      }
    },
    [toast, closeNicknameModal, fetchAccounts]
  );

  const handlePowerToggle = useCallback(
    async (account) => {
      const status = account.digital_ocean_status || account.status;
      const action = status === 'running' ? 'stop' : 'start';
      try {
        const res = await axiosInstance.post(
          `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/${action}`
        );
        if (res.data.success) {
          toast({ title: 'Server Action', description: `Server is ${action === 'stop' ? 'stopping' : 'starting'}...`, status: 'info', duration: 3000 });
          setTimeout(() => fetchAccounts(false), 2000);
        }
      } catch (err) {
        toast({ title: 'Error', description: err.response?.data?.detail || `Failed to ${action}`, status: 'error', duration: 5000, isClosable: true });
      }
    },
    [toast, fetchAccounts]
  );

  const handleRestart = useCallback(
    async (account) => {
      try {
        const res = await axiosInstance.post(
          `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/restart`
        );
        if (res.data.success) {
          toast({ title: 'Server Restarting', description: 'This may take a few minutes.', status: 'info', duration: 5000 });
          setTimeout(() => fetchAccounts(false), 3000);
        }
      } catch (err) {
        toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to restart', status: 'error', duration: 5000, isClosable: true });
      }
    },
    [toast, fetchAccounts]
  );

  const openDelete = useCallback(
    (account) => {
      setSelectedAccount(account);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const openEdit = useCallback(
    (account) => {
      setEditingAccount(account);
      openNicknameModal();
    },
    [openNicknameModal]
  );

  // ─── Render ────────────────────────────────────────────────────────

  // Group accounts: manual first, then auto
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const modeA = getAccountMode(a.account_id);
      const modeB = getAccountMode(b.account_id);
      if (modeA === 'manual' && modeB === 'auto') return -1;
      if (modeA === 'auto' && modeB === 'manual') return 1;
      return (a.nickname || a.name || '').localeCompare(b.nickname || b.name || '');
    });
  }, [accounts, getAccountMode]);

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Summary Header */}
      <Flex
        px={3}
        py={2}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        flexShrink={0}
      >
        <VStack spacing={0} align="flex-start">
          <Text fontSize="sm" fontWeight="bold" color="white">
            Accounts
          </Text>
          <Text fontSize="xs" color="whiteAlpha.600">
            {activeCount > 0
              ? `${activeCount} active / ${totalContracts} contract${totalContracts !== 1 ? 's' : ''}`
              : `${accounts.length} connected`}
          </Text>
        </VStack>

        {/* Legend */}
        <HStack spacing={3}>
          <HStack spacing={1.5}>
            <Box w="8px" h="3px" borderRadius="full" bg="cyan.400" />
            <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
              Manual
            </Text>
          </HStack>
          <HStack spacing={1.5}>
            <Box w="8px" h="3px" borderRadius="full" bg="purple.400" />
            <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
              Auto
            </Text>
          </HStack>
        </HStack>
      </Flex>

      {/* Account Cards */}
      <Box flex="1" overflowY="auto" px={2} py={2}>
        {isLoading ? (
          <Flex justify="center" py={6}>
            <Spinner size="md" color="cyan.400" />
          </Flex>
        ) : accounts.length === 0 ? (
          <VStack spacing={3} py={8}>
            <Text fontSize="sm" color="whiteAlpha.500" textAlign="center">
              No accounts connected
            </Text>
            <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">
              Connect a broker account to start trading
            </Text>
          </VStack>
        ) : (
          <VStack spacing={2} align="stretch">
            {sortedAccounts.map((account) => {
              const aid = String(account.account_id);
              const mode = getAccountMode(aid);
              const cfg = accountConfigs.get(aid) || { quantity: 1, isActive: false };
              const connState = getConnectionState(account.broker_id, account.account_id);
              const rtData = getAccountData(account.broker_id, account.account_id);
              const accountStrategies = getAccountStrategies(aid);
              const accountPositions = aggregatedPositions.filter(
                (p) => String(p._accountId) === aid
              );

              return (
                <TradingAccountCard
                  key={account.account_id}
                  account={account}
                  mode={mode}
                  isActive={cfg.isActive}
                  quantity={cfg.quantity}
                  connectionStatus={connState}
                  strategies={accountStrategies}
                  positions={accountPositions}
                  realtimeData={rtData}
                  onToggle={() => toggleAccount(aid)}
                  onQuantityChange={setAccountQuantity}
                  onEditName={openEdit}
                  onDelete={openDelete}
                  onPowerToggle={handlePowerToggle}
                  onRestart={handleRestart}
                />
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Connect Account Button */}
      <Box px={2} py={2} borderTop="1px solid" borderColor="whiteAlpha.100" flexShrink={0}>
        <Button
          w="100%"
          size="sm"
          variant="outline"
          borderColor="whiteAlpha.300"
          color="whiteAlpha.800"
          leftIcon={<Plus size={14} />}
          _hover={{ bg: 'whiteAlpha.100', borderColor: 'cyan.400', color: 'cyan.400' }}
          onClick={onBrokerSelectOpen}
        >
          Connect Account
        </Button>
      </Box>

      {/* Modals */}
      <BrokerSelectionModal
        isOpen={isBrokerSelectOpen}
        onClose={onBrokerSelectClose}
        onBrokerSelect={handleBrokerSelect}
      />
      <IBLoginModal isOpen={isIBLoginOpen} onClose={onIBLoginClose} onConnect={handleIBConnect} />
      {selectedBroker && (
        <BrokerEnvironmentModal
          isOpen={isEnvironmentOpen}
          onClose={onEnvironmentClose}
          selectedBroker={selectedBroker}
          onEnvironmentSelect={async () => {
            onEnvironmentClose();
            await fetchAccounts();
          }}
        />
      )}
      <DeleteAccount
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteAccount}
        accountName={selectedAccount?.name}
        accountDetails={selectedAccount}
      />
      {editingAccount && (
        <AccountNicknameModal
          isOpen={isNicknameModalOpen}
          onClose={closeNicknameModal}
          account={editingAccount}
          onSave={handleUpdateNickname}
        />
      )}
    </Box>
  );
};

export default TradingAccountsPanel;
