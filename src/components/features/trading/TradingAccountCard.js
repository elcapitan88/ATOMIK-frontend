import React, { memo, useMemo } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { MoreVertical, Edit, Trash2, Power, RefreshCw } from 'lucide-react';
import AccountStatusIndicator from '@/components/common/AccountStatusIndicator';

/**
 * Compact account card that adapts to MANUAL or AUTO mode.
 *
 * MANUAL: qty input + active toggle (cyan accent when active)
 * AUTO: strategy name + live position/P&L (purple accent)
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

  // For AUTO mode: show first strategy name + position summary
  const primaryStrategy = strategies?.[0];
  const openPositions = useMemo(
    () => (positions || []).filter((p) => !p.isClosed && p.side !== 'FLAT'),
    [positions]
  );

  const accentColor = isAuto ? 'purple.400' : 'cyan.400';
  const borderColor = isAuto
    ? 'rgba(159, 122, 234, 0.4)'
    : isActive
    ? 'rgba(0, 198, 224, 0.5)'
    : 'transparent';
  const bgColor = isActive && !isAuto ? 'rgba(0, 198, 224, 0.06)' : 'whiteAlpha.50';

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={3}
      transition="all 0.2s"
      _hover={{ bg: isAuto ? 'rgba(159, 122, 234, 0.06)' : 'whiteAlpha.100' }}
    >
      {/* Row 1: Status + Name + Broker + Mode Badge + Actions */}
      <Flex align="center" justify="space-between" mb={isAuto ? 1 : 2}>
        <HStack spacing={2} flex="1" minW={0}>
          <AccountStatusIndicator
            tokenValid={!account.is_token_expired}
            wsStatus={connectionStatus}
            account={account}
          />
          <VStack spacing={0} align="flex-start" minW={0}>
            <Text fontWeight="bold" fontSize="sm" lineHeight="1.2" noOfLines={1}>
              {account.nickname || account.name || account.account_id}
            </Text>
            <HStack spacing={1}>
              <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.2">
                {account.broker_id}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.400">
                •
              </Text>
              <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.2">
                ${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        <HStack spacing={1}>
          <Badge
            fontSize="9px"
            px={1.5}
            py={0.5}
            borderRadius="sm"
            colorScheme={isAuto ? 'purple' : 'cyan'}
            variant="subtle"
          >
            {isAuto ? 'AUTO' : 'MANUAL'}
          </Badge>

          <AccountOptionsMenu
            account={account}
            isIB={isIB}
            onEditName={onEditName}
            onDelete={onDelete}
            onPowerToggle={onPowerToggle}
            onRestart={onRestart}
          />
        </HStack>
      </Flex>

      {/* Row 2: Mode-specific content */}
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
          onToggle={onToggle}
          onQuantityChange={onQuantityChange}
          accountId={account.account_id}
        />
      )}
    </Box>
  );
};

/** MANUAL mode: qty input + active toggle */
const ManualModeContent = memo(({ isActive, quantity, onToggle, onQuantityChange, accountId }) => (
  <Flex align="center" justify="space-between">
    <HStack spacing={2}>
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
        isDisabled={!isActive}
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

    <HStack spacing={2}>
      <Text fontSize="xs" color={isActive ? 'cyan.300' : 'whiteAlpha.500'}>
        {isActive ? 'ON' : 'OFF'}
      </Text>
      <Switch
        size="sm"
        isChecked={isActive}
        onChange={onToggle}
        colorScheme="cyan"
        sx={{
          '.chakra-switch__track': {
            bg: isActive ? 'rgba(0, 198, 224, 0.6)' : 'whiteAlpha.300',
          },
        }}
      />
    </HStack>
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
            onClick={() => onEditName(account)}
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
                onClick={() => onPowerToggle?.(account)}
                _hover={{ bg: 'whiteAlpha.100' }}
                bg="transparent"
                color="white"
              >
                {getPowerLabel()}
              </MenuItem>
              <MenuItem
                fontSize="sm"
                icon={<RefreshCw size={14} />}
                onClick={() => onRestart?.(account)}
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
            onClick={() => onDelete(account)}
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
