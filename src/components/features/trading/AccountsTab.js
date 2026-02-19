import { memo, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  HStack,
} from '@chakra-ui/react';

const formatBrokerName = (brokerId) => {
  const names = {
    tradovate: 'Tradovate',
    interactivebrokers: 'Interactive Brokers',
    binance: 'Binance',
    polymarket: 'Polymarket',
  };
  return names[brokerId] || brokerId;
};

const getStatusColor = (state) => {
  if (state === 'connected' || state === 'ready') return 'green.400';
  if (state === 'disconnected' || state === 'error') return 'red.400';
  return 'yellow.400';
};

const getStatusLabel = (state) => {
  if (state === 'connected' || state === 'ready') return 'Connected';
  if (state === 'disconnected') return 'Disconnected';
  if (state === 'error') return 'Error';
  return 'Connecting';
};

// Badge config per mode — grey bg, mode-colored text
const MODE_BADGE = {
  manual: { label: 'MANUAL', color: 'cyan.300' },
  auto: { label: 'AUTO', color: 'purple.300' },
  'copy-leader': { label: 'LEADER', color: 'green.300' },
  'copy-follower': { label: 'FOLLOWING', color: 'yellow.300' },
};

const AccountsTab = memo(({
  accounts = [],
  positions = [],
  accountConfigs,
  getAccountMode,
  getAccountStrategies,
  toggleAccount,
  setAccountQuantity,
  getConnectionState,
  getAccountData,
  getCopyInfo,
}) => {
  // Build a per-account open PnL map from positions
  const accountOpenPnL = useMemo(() => {
    const map = {};
    (positions || []).forEach(p => {
      const key = p._accountId || p.accountId;
      if (key) {
        map[key] = (map[key] || 0) + (p.unrealizedPnL || 0);
      }
    });
    return map;
  }, [positions]);

  // Sort: group copy accounts by group ID (leader then followers), then manual, then auto
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
      return (ORDER[modeA] ?? 2) - (ORDER[modeB] ?? 2)
        || (a.nickname || a.name || '').localeCompare(b.nickname || b.name || '');
    });
  }, [accounts, getAccountMode, getCopyInfo]);

  if (accounts.length === 0) {
    return (
      <Flex justify="center" align="center" h="100%" minH="80px">
        <Text fontSize="sm" color="whiteAlpha.400">
          No accounts connected
        </Text>
      </Flex>
    );
  }

  const fmtPnl = (v) => `${v >= 0 ? '+' : ''}$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtUsd = (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Table size="sm" variant="unstyled">
      <Thead>
        <Tr>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Status</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Account</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Broker</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>Balance</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>Open P&L</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100" isNumeric>Day P&L</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Mode</Th>
          <Th color="whiteAlpha.500" fontSize="xs" borderBottom="1px solid" borderColor="whiteAlpha.100">Active</Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortedAccounts.map((account, i) => {
          const accountId = String(account.account_id);
          const mode = getAccountMode(accountId);
          const cfg = accountConfigs?.get(accountId) || { quantity: 1, isActive: false };
          const connState = getConnectionState(account.broker_id, accountId);
          const rtData = getAccountData(account.broker_id, accountId);
          const balance = rtData?.balance ?? account.balance ?? 0;
          const openPnL = accountOpenPnL[accountId] || 0;
          const todaysPnL = rtData?.dayRealizedPnL ?? 0;
          const strategies = getAccountStrategies(accountId);

          return (
            <Tr
              key={accountId || i}
              _hover={{ bg: 'whiteAlpha.50' }}
            >
              <Td py={1.5}>
                <HStack spacing={1.5}>
                  <Box w="6px" h="6px" borderRadius="full" bg={getStatusColor(connState)} />
                  <Text fontSize="xs" color="whiteAlpha.600">
                    {getStatusLabel(connState)}
                  </Text>
                </HStack>
              </Td>
              <Td py={1.5}>
                <Text fontSize="xs" color="whiteAlpha.700" noOfLines={1}>
                  {account.nickname || account.name || accountId}
                </Text>
              </Td>
              <Td py={1.5}>
                <Text fontSize="xs" color="whiteAlpha.600">
                  {formatBrokerName(account.broker_id)}
                </Text>
              </Td>
              <Td py={1.5} isNumeric>
                <Text fontSize="xs" color="white">{fmtUsd(balance)}</Text>
              </Td>
              <Td py={1.5} isNumeric>
                <Text fontSize="xs" fontWeight="bold" color={openPnL >= 0 ? 'green.400' : 'red.400'}>
                  {fmtPnl(openPnL)}
                </Text>
              </Td>
              <Td py={1.5} isNumeric>
                <Text fontSize="xs" fontWeight="bold" color={todaysPnL >= 0 ? 'green.400' : 'red.400'}>
                  {fmtPnl(todaysPnL)}
                </Text>
              </Td>
              <Td py={1.5}>
                <Badge
                  fontSize="9px"
                  bg="whiteAlpha.200"
                  color={(MODE_BADGE[mode] || MODE_BADGE.manual).color}
                >
                  {(MODE_BADGE[mode] || MODE_BADGE.manual).label}
                </Badge>
              </Td>
              <Td py={1.5}>
                {mode === 'manual' ? (
                  <Switch
                    size="sm"
                    colorScheme="cyan"
                    isChecked={cfg.isActive}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleAccount(accountId)}
                  />
                ) : mode === 'auto' ? (
                  <Text fontSize="xs" color="purple.300" noOfLines={1}>
                    {strategies?.[0]?.name || 'Strategy'}
                  </Text>
                ) : mode === 'copy-leader' ? (
                  <Text fontSize="xs" color="green.300" noOfLines={1}>
                    {getCopyInfo?.(accountId)?.followerCount
                      ? `${getCopyInfo(accountId).followerCount} follower${getCopyInfo(accountId).followerCount !== 1 ? 's' : ''}`
                      : 'Leader'}
                  </Text>
                ) : mode === 'copy-follower' ? (
                  <Text fontSize="xs" color="yellow.300" noOfLines={1}>
                    {getCopyInfo?.(accountId)?.ratio
                      ? `${getCopyInfo(accountId).ratio}x`
                      : 'Following'}
                  </Text>
                ) : null}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
});

AccountsTab.displayName = 'AccountsTab';

export default AccountsTab;
