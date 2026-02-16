import React, { memo, useMemo } from 'react';
import {
  Box,
  Flex,
  HStack,
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

const fmtCur = (v) =>
  (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pnlColor = (v) => ((v || 0) >= 0 ? 'green.400' : 'red.400');

const pnlText = (v) => {
  const val = v || 0;
  const prefix = val >= 0 ? '+' : '-';
  return `${prefix}$${fmtCur(Math.abs(val))}`;
};

/**
 * Compact 2-row account card.
 *
 * Row 1: Status dot + Name + Broker + Mode badge + Menu
 * Row 2: $bal · open P&L · day P&L · (Manual: Qty + ACTIVE | Auto: strategy name)
 */
const TradingAccountCard = ({
  account,
  mode,
  isActive,
  quantity,
  connectionStatus,
  strategies,
  positions,
  realtimeData,
  onToggle,
  onQuantityChange,
  onEditName,
  onDelete,
  onPowerToggle,
  onRestart,
}) => {
  const isAuto = mode === 'auto';
  const isIB = account.broker_id === 'interactivebrokers';

  const balance = realtimeData?.balance ?? account.balance ?? 0;
  const openPnL = useMemo(
    () => (positions || []).reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0),
    [positions]
  );
  const dayPnL = realtimeData?.dayRealizedPnL ?? 0;

  const primaryStrategy = strategies?.[0];
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
    ? hasActiveStrategy
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
      pr={2}
      py={2}
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
        top="6px"
        bottom="6px"
        w="3px"
        borderRadius="full"
        bg={accentStripeColor}
        transition="all 0.2s ease"
      />

      {/* Row 1: Status + Name + Broker + Mode badge + Menu */}
      <Flex align="center" justify="space-between" mb={1}>
        <HStack spacing={2} flex="1" minW={0}>
          <AccountStatusIndicator
            tokenValid={!account.is_token_expired}
            wsStatus={connectionStatus}
            account={account}
          />
          <Text fontWeight="bold" fontSize="sm" lineHeight="1" noOfLines={1}>
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

      {/* Row 2: Metrics + mode-specific controls, all inline */}
      <Flex align="center" justify="space-between" flexWrap="nowrap">
        {/* Financial metrics */}
        <HStack spacing={2} flexShrink={0}>
          <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">
            ${fmtCur(balance)}
          </Text>
          <Text fontSize="9px" color="whiteAlpha.300">&bull;</Text>
          <Text fontSize="xs" fontWeight="medium" color={pnlColor(openPnL)}>
            {pnlText(openPnL)}
          </Text>
          <Text fontSize="9px" color="whiteAlpha.300">&bull;</Text>
          <Text fontSize="xs" fontWeight="medium" color={pnlColor(dayPnL)}>
            {pnlText(dayPnL)}
          </Text>
        </HStack>

        {/* Mode-specific right side */}
        {isAuto ? (
          <HStack spacing={1} minW={0} justify="flex-end">
            {primaryStrategy ? (
              <>
                <Text fontSize="xs" color="purple.300" fontWeight="medium" noOfLines={1}>
                  {primaryStrategy.group_name || primaryStrategy.name || 'Strategy'}
                </Text>
                {strategies.length > 1 && (
                  <Text fontSize="xs" color="whiteAlpha.500">
                    +{strategies.length - 1}
                  </Text>
                )}
              </>
            ) : (
              <Text fontSize="xs" color="whiteAlpha.400" fontStyle="italic">
                No strategy
              </Text>
            )}
          </HStack>
        ) : (
          <HStack spacing={2} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            <HStack spacing={1}>
              <Text fontSize="xs" color="whiteAlpha.600">
                Qty
              </Text>
              <NumberInput
                size="xs"
                value={quantity}
                min={1}
                max={999}
                w="52px"
                onChange={(_, val) => onQuantityChange(account.account_id, val)}
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
              fontSize="9px"
              px={1.5}
              py={0.5}
              borderRadius="full"
              bg={isActive ? 'rgba(0, 198, 224, 0.15)' : 'transparent'}
              color={isActive ? 'cyan.300' : 'whiteAlpha.400'}
              borderColor={isActive ? 'rgba(0, 198, 224, 0.3)' : 'whiteAlpha.200'}
              borderWidth="1px"
              letterSpacing="wide"
            >
              {isActive ? 'ACTIVE' : 'IDLE'}
            </Badge>
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

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
