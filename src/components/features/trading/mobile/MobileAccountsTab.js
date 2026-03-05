import React, { memo, useMemo } from 'react';
import { Box, VStack, Flex, Text, Button, Spinner } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import TradingAccountCard from '../TradingAccountCard';

/**
 * MobileAccountsTab — renders account cards inside the bottom sheet.
 * Simplified header (no legend), reuses TradingAccountCard as-is.
 */
const MobileAccountsTab = ({
  accounts = [],
  isLoading = false,
  multiAccountTrading,
  aggregatedPositions = [],
  copyTrading,
  getConnectionState,
  getAccountData,
  onConnectAccount,
  onEditName,
  onDelete,
  onPowerToggle,
  onRestart,
  onCopyMyTrades,
  onEditCopySettings,
  onStopCopying,
  onPauseCopying,
}) => {
  const {
    accountConfigs,
    activeCount,
    totalContracts,
    toggleAccount,
    setAccountQuantity,
    getAccountMode,
    getAccountStrategies,
    getCopyInfo,
  } = multiAccountTrading;

  // Sort: copy groups first, then manual, then auto
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const modeA = getAccountMode(a.account_id);
      const modeB = getAccountMode(b.account_id);
      const isCopyA = modeA === 'copy-leader' || modeA === 'copy-follower';
      const isCopyB = modeB === 'copy-leader' || modeB === 'copy-follower';

      if (isCopyA && !isCopyB) return -1;
      if (!isCopyA && isCopyB) return 1;

      if (isCopyA && isCopyB) {
        const groupA = getCopyInfo?.(a.account_id)?.groupId ?? 0;
        const groupB = getCopyInfo?.(b.account_id)?.groupId ?? 0;
        if (groupA !== groupB) return groupA - groupB;
        if (modeA === 'copy-leader' && modeB !== 'copy-leader') return -1;
        if (modeA !== 'copy-leader' && modeB === 'copy-leader') return 1;
        return (a.nickname || a.name || '').localeCompare(b.nickname || b.name || '');
      }

      const ORDER = { manual: 0, auto: 1 };
      const orderA = ORDER[modeA] ?? 2;
      const orderB = ORDER[modeB] ?? 2;
      if (orderA !== orderB) return orderA - orderB;
      return (a.nickname || a.name || '').localeCompare(b.nickname || b.name || '');
    });
  }, [accounts, getAccountMode, getCopyInfo]);

  if (isLoading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="md" color="cyan.400" />
      </Flex>
    );
  }

  if (accounts.length === 0) {
    return (
      <VStack spacing={3} py={8}>
        <Text fontSize="sm" color="whiteAlpha.500" textAlign="center">
          No accounts connected
        </Text>
        <Text fontSize="xs" color="whiteAlpha.400" textAlign="center">
          Connect a broker account to start trading
        </Text>
        <Button
          size="sm"
          variant="outline"
          borderColor="whiteAlpha.300"
          color="whiteAlpha.800"
          leftIcon={<Plus size={14} />}
          _hover={{ bg: 'whiteAlpha.100', borderColor: 'cyan.400', color: 'cyan.400' }}
          onClick={onConnectAccount}
          mt={2}
        >
          Connect Account
        </Button>
      </VStack>
    );
  }

  return (
    <VStack spacing={2} align="stretch">
      {/* Summary */}
      <Flex px={1} pb={1} align="center" justify="space-between">
        <Text fontSize="xs" color="whiteAlpha.500">
          {activeCount > 0
            ? `${activeCount} active / ${totalContracts} contract${totalContracts !== 1 ? 's' : ''}`
            : `${accounts.length} connected`}
        </Text>
      </Flex>

      {/* Account Cards */}
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
        const accountCopyInfo = getCopyInfo?.(aid) || null;

        return (
          <TradingAccountCard
            key={account.account_id}
            account={account}
            mode={mode}
            isActive={mode === 'copy-leader' ? true : cfg.isActive}
            quantity={cfg.quantity}
            connectionStatus={connState}
            strategies={accountStrategies}
            positions={accountPositions}
            realtimeData={rtData}
            onToggle={() => toggleAccount(aid)}
            onQuantityChange={setAccountQuantity}
            onEditName={onEditName}
            onDelete={onDelete}
            onPowerToggle={onPowerToggle}
            onRestart={onRestart}
            copyInfo={accountCopyInfo}
            onCopyMyTrades={onCopyMyTrades}
            onEditCopySettings={onEditCopySettings}
            onStopCopying={onStopCopying}
            onPauseCopying={onPauseCopying}
          />
        );
      })}

      {/* Connect button */}
      <Button
        w="100%"
        size="sm"
        variant="outline"
        borderColor="whiteAlpha.300"
        color="whiteAlpha.800"
        leftIcon={<Plus size={14} />}
        _hover={{ bg: 'whiteAlpha.100', borderColor: 'cyan.400', color: 'cyan.400' }}
        onClick={onConnectAccount}
        mt={1}
      >
        Connect Account
      </Button>
    </VStack>
  );
};

export default memo(MobileAccountsTab);
