import React, { memo, useMemo } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { MoreVertical, Edit, Trash2, Power, RefreshCw } from 'lucide-react';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';

const formatBrokerName = (brokerId) => {
  const names = {
    tradovate: 'Tradovate',
    interactivebrokers: 'IBKR',
    binance: 'Binance',
    polymarket: 'Polymarket',
  };
  return names[brokerId] || brokerId;
};

const formatCurrency = (value) =>
  (value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pnlColor = (value) => ((value || 0) >= 0 ? 'green.400' : 'red.400');
const pnlPrefix = (value) => ((value || 0) >= 0 ? '+$' : '-$');
const pnlDisplay = (value) => `${pnlPrefix(value)}${formatCurrency(Math.abs(value || 0))}`;

/**
 * Compact account card that adapts to MANUAL or AUTO mode.
 *
 * Row 1: Status + Name + Broker + Mode badge + Actions
 * Row 2: Balance | Open P&L | Day P&L (always visible)
 * Row 3: Mode-specific (MANUAL: qty + status, AUTO: strategy + positions)
 */
const TradingAccountCard = ({
  account,
  mode, // 'manual' | 'auto'
  isActive, // only for manual mode
  quantity, // only for manual mode
  connectionStatus,
  strategies, // active strategies on this account (for auto mode)
  positions, // positions for this account (for auto mode)
  realtimeData, // from getAccountData()

  // Callbacks
  onToggle,
  onQuantityChange,
  onEditName,
  onDelete,
  onPowerToggle,
  onRestart,
}) => {
  const isAuto = mode === 'auto';
  const isIB = account.broker_id === 'interactivebrokers';

  // Real-time or fallback values
  const balance = realtimeData?.balance ?? account.balance ?? 0;
  const openPnL = realtimeData?.openPnL ?? account.openPnL ?? 0;
  const dayPnL = realtimeData?.realizedPnL ?? account.realizedPnL ?? 0;

  // For AUTO mode: show first strategy name + position summary
  const primaryStrategy = strategies?.[0];
  const openPositions = useMemo(
    () => (positions || []).filter((p) => !p.isClosed && p.side !== 'FLAT'),
    [positions]
  );

  const hasActiveStrategy = strategies?.length > 0;

  // Visual states
  const borderColor = isAuto
    ? 'rgba(159, 122, 234, 0.25)'
    : isActive
    ? 'rgba(0, 198, 224, 0.4)'
    : 'rgba(255, 255, 255, 0.06)';

  const bgColor = isActive && !isAuto
    ? 'rgba(0, 198, 224, 0.06)'
    : 'rgba(255, 255, 255, 0.02)';

  const accentStripeColor = isAuto
    ? isActive
      ? 'rgba(159, 122, 234, 0.8)'
      : hasActiveStrategy
      ? 'rgba(159, 122, 234, 0.6)'
      : 'rgba(159, 122, 234, 0.3)'
    : isActive
    ? 'rgba(0, 198, 224, 0.9)'
    : 'rgba(255, 255, 255, 0.12)';

  const hoverBg = isAuto
    ? 'rgba(159, 122, 234, 0.06)'
    : isActive
    ? 'rgba(0, 198, 224, 0.09)'
    : 'rgba(255, 255, 255, 0.06)';

  const cardOpacity = !isAuto && !isActive ? 0.7 : 1;

  return (
    <Box
      position="relative"
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      pl={5}
      pr={3}
      py={3}
      transition="all 0.2s ease"
      opacity={cardOpacity}
      cursor={isAuto ? 'default' : 'pointer'}
      onClick={isAuto ? undefined : onToggle}
      _hover={
        isAuto
          ? { bg: hoverBg }
          : {
              bg: hoverBg,
              opacity: 1,
              borderColor: isActive
                ? 'rgba(0, 198, 224, 0.5)'
                : 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-1px)',
            }
      }
      _active={
        isAuto
          ? {}
          : { transform: 'translateY(0px)', transition: 'transform 0.05s' }
      }
      boxShadow={
        isActive && !isAuto
          ? '0 0 12px rgba(0, 198, 224, 0.15)'
          : 'none'
      }
    >
      {/* Left accent stripe */}
      <Box
        position="absolute"
        left={0}
        top="8px"
        bottom="8px"
        w="3px"
        borderRadius="full"
        bg={accentStripeColor}
        transition="all 0.2s ease"
      />

      {/* Row 1: Status + Name + Broker + Mode badge + Actions */}
      <Flex align="center" justify="space-between" mb={2}>
        <HStack spacing={2} flex="1" minW={0}>
          <AccountStatusIndicator
            tokenValid={!account.is_token_expired}
            wsStatus={connectionStatus}
            account={account}
          />
          <Text fontWeight="bold" fontSize="sm" lineHeight="1.2" noOfLines={1}>
            {account.nickname || account.name || account.account_id}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.500" flexShrink={0}>
            {formatBrokerName(account.broker_id)}
          </Text>
          <Badge
            fontSize="8px"
            px={1.5}
            py={0.5}
            borderRadius="sm"
            variant="subtle"
            colorScheme={isAuto ? 'purple' : 'cyan'}
            textTransform="uppercase"
            letterSpacing="wider"
            flexShrink={0}
          >
            {isAuto ? 'AUTO' : 'MANUAL'}
          </Badge>
        </HStack>

        <AccountOptionsMenu
          account={account}
          isIB={isIB}
          onEditName={onEditName}
          onDelete={onDelete}
          onPowerToggle={onPowerToggle}
          onRestart={onRestart}
        />
      </Flex>

      {/* Row 2: Financial metrics — always visible */}
      <Flex
        justify="space-between"
        align="center"
        mb={2}
        py={1.5}
        px={2}
        bg="whiteAlpha.50"
        borderRadius="md"
      >
        <VStack spacing={0} align="center" flex="1">
          <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
            Balance
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color="white">
            ${formatCurrency(balance)}
          </Text>
        </VStack>

        <Box w="1px" h="24px" bg="whiteAlpha.100" />

        <VStack spacing={0} align="center" flex="1">
          <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
            Open P&L
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color={pnlColor(openPnL)}>
            {pnlDisplay(openPnL)}
          </Text>
        </VStack>

        <Box w="1px" h="24px" bg="whiteAlpha.100" />

        <VStack spacing={0} align="center" flex="1">
          <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
            Day P&L
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color={pnlColor(dayPnL)}>
            {pnlDisplay(dayPnL)}
          </Text>
        </VStack>
      </Flex>

      {/* Row 3: Mode-specific content */}
      {isAuto ? (
        <AutoModeContent
          strategies={strategies}
          primaryStrategy={primaryStrategy}
          openPositions={openPositions}
        />
      ) : (
        <ManualModeContent
          isActive={isActive}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          accountId={account.account_id}
        />
      )}
    </Box>
  );
};

/** MANUAL mode: qty input + active/idle status */
const ManualModeContent = memo(({ isActive, quantity, onQuantityChange, accountId }) => (
  <Flex align="center" justify="space-between">
    <HStack spacing={2} onClick={(e) => e.stopPropagation()}>
      <Text fontSize="xs" color="whiteAlpha.600">
        Qty
      </Text>
      <NumberInput
        size="xs"
        value={quantity}
        min={1}
        max={999}
        w="60px"
        onChange={(_, val) => onQuantityChange(accountId, val)}
      >
        <NumberInputField
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          color="white"
          textAlign="center"
          px={1}
          _focus={{
            borderColor: 'rgba(0, 198, 224, 0.6)',
            boxShadow: '0 0 0 1px rgba(0, 198, 224, 0.6)',
          }}
        />
        <NumberInputStepper>
          <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
          <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
        </NumberInputStepper>
      </NumberInput>
    </HStack>

    <Badge
      fontSize="10px"
      px={2}
      py={0.5}
      borderRadius="full"
      variant={isActive ? 'solid' : 'outline'}
      bg={isActive ? 'rgba(0, 198, 224, 0.15)' : 'transparent'}
      color={isActive ? 'cyan.300' : 'whiteAlpha.400'}
      borderColor={isActive ? 'rgba(0, 198, 224, 0.3)' : 'whiteAlpha.200'}
      borderWidth="1px"
      letterSpacing="wide"
    >
      {isActive ? 'ACTIVE' : 'IDLE'}
    </Badge>
  </Flex>
));
ManualModeContent.displayName = 'ManualModeContent';

/** AUTO mode: strategy name + position summary */
const AutoModeContent = memo(({ strategies, primaryStrategy, openPositions }) => (
  <VStack spacing={1} align="stretch">
    {primaryStrategy && (
      <HStack spacing={1}>
        <Text fontSize="xs" color="purple.300" fontWeight="medium" noOfLines={1}>
          {primaryStrategy.group_name || primaryStrategy.name || 'Strategy'}
        </Text>
        {strategies.length > 1 && (
          <Text fontSize="xs" color="whiteAlpha.500">
            +{strategies.length - 1}
          </Text>
        )}
      </HStack>
    )}

    {openPositions.length > 0 ? (
      openPositions.slice(0, 2).map((pos, i) => (
        <Flex key={pos.positionId || i} justify="space-between" align="center">
          <HStack spacing={1}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={pos.side === 'LONG' ? 'green.400' : 'red.400'}
            >
              {pos.symbol}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">
              {pos.side === 'LONG' ? '+' : '-'}
              {Math.abs(pos.quantity || pos.netPos || 0)}
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            fontWeight="medium"
            color={(pos.unrealizedPnL || 0) >= 0 ? 'green.400' : 'red.400'}
          >
            {(pos.unrealizedPnL || 0) >= 0 ? '+' : ''}$
            {(pos.unrealizedPnL || 0).toFixed(2)}
          </Text>
        </Flex>
      ))
    ) : (
      <Text fontSize="xs" color="whiteAlpha.400" fontStyle="italic">
        No open positions
      </Text>
    )}
  </VStack>
));
AutoModeContent.displayName = 'AutoModeContent';

/** Shared options menu (edit, delete, IB power/restart) */
const AccountOptionsMenu = memo(
  ({ account, isIB, onEditName, onDelete, onPowerToggle, onRestart }) => {
    const getPowerLabel = () => {
      const status = account.digital_ocean_status || account.status;
      return status === 'running' ? 'Power Off' : 'Power On';
    };

    return (
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<MoreVertical size={14} />}
          variant="ghost"
          size="xs"
          color="whiteAlpha.600"
          _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          aria-label="Account options"
          onClick={(e) => e.stopPropagation()}
        />
        <MenuList
          bg="rgba(30, 30, 30, 0.95)"
          backdropFilter="blur(10px)"
          borderColor="whiteAlpha.200"
          minW="140px"
        >
          <MenuItem
            fontSize="sm"
            icon={<Edit size={14} />}
            onClick={(e) => { e.stopPropagation(); onEditName(account); }}
            _hover={{ bg: 'whiteAlpha.100' }}
            bg="transparent"
            color="white"
          >
            Edit Name
          </MenuItem>
          {isIB && (
            <>
              <MenuItem
                fontSize="sm"
                icon={<Power size={14} />}
                onClick={(e) => { e.stopPropagation(); onPowerToggle?.(account); }}
                _hover={{ bg: 'whiteAlpha.100' }}
                bg="transparent"
                color="white"
              >
                {getPowerLabel()}
              </MenuItem>
              <MenuItem
                fontSize="sm"
                icon={<RefreshCw size={14} />}
                onClick={(e) => { e.stopPropagation(); onRestart?.(account); }}
                _hover={{ bg: 'whiteAlpha.100' }}
                bg="transparent"
                color="white"
              >
                Restart
              </MenuItem>
            </>
          )}
          <MenuItem
            fontSize="sm"
            icon={<Trash2 size={14} />}
            onClick={(e) => { e.stopPropagation(); onDelete(account); }}
            _hover={{ bg: 'whiteAlpha.100' }}
            bg="transparent"
            color="red.400"
          >
            Delete
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }
);
AccountOptionsMenu.displayName = 'AccountOptionsMenu';

export default memo(TradingAccountCard);
