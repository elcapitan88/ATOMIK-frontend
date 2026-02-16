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

  // Compute totals across all accounts
  const totals = useMemo(() => {
    let totalBalance = 0;
    let totalOpenPnL = 0;
    let totalDayPnL = 0;
    accounts.forEach(account => {
      const accountId = String(account.account_id);
      const rtData = getAccountData(account.broker_id, accountId);
      totalBalance += rtData?.balance ?? account.balance ?? 0;
      totalOpenPnL += accountOpenPnL[accountId] || 0;
      totalDayPnL += rtData?.dayRealizedPnL ?? 0;
    });
    return { totalBalance, totalOpenPnL, totalDayPnL };
  }, [accounts, accountOpenPnL, getAccountData]);

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
    <Flex direction="column" h="100%">
      {/* Scrollable table */}
      <Box flex="1" overflowY="auto" minH={0}>
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
            {accounts.map((account, i) => {
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
                      colorScheme={mode === 'manual' ? 'cyan' : 'purple'}
                      variant="subtle"
                    >
                      {mode === 'manual' ? 'MANUAL' : 'AUTO'}
                    </Badge>
                  </Td>
                  <Td py={1.5}>
                    {mode === 'manual' ? (
                      <Switch
                        size="sm"
                        colorScheme="cyan"
                        isChecked={cfg.isActive && mode === 'manual'}
                        isDisabled={mode === 'auto'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleAccount(accountId)}
                      />
                    ) : (
                      <Text fontSize="xs" color="purple.300" noOfLines={1}>
                        {strategies?.[0]?.name || 'Strategy'}
                      </Text>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {/* Pinned totals footer */}
      <HStack
        px={4}
        py={2}
        borderTop="1px solid"
        borderColor="whiteAlpha.200"
        bg="whiteAlpha.50"
        justify="flex-end"
        spacing={8}
        flexShrink={0}
      >
        <HStack spacing={2}>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight="semibold">Total Value</Text>
          <Text fontSize="xs" fontWeight="bold" color="white">{fmtUsd(totals.totalBalance)}</Text>
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight="semibold">Open P&L</Text>
          <Text fontSize="xs" fontWeight="bold" color={totals.totalOpenPnL >= 0 ? 'green.400' : 'red.400'}>
            {fmtPnl(totals.totalOpenPnL)}
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight="semibold">Day P&L</Text>
          <Text fontSize="xs" fontWeight="bold" color={totals.totalDayPnL >= 0 ? 'green.400' : 'red.400'}>
            {fmtPnl(totals.totalDayPnL)}
          </Text>
        </HStack>
      </HStack>
    </Flex>
  );
});

AccountsTab.displayName = 'AccountsTab';

export default AccountsTab;
