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
  MenuDivider,
  IconButton,
} from '@chakra-ui/react';
import { MoreVertical, Edit, Trash2, Power, RefreshCw, Copy, Pause, Play, Settings, X } from 'lucide-react';
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

// Badge config per mode
const MODE_BADGE = {
  manual: { label: 'MANUAL', colorScheme: 'cyan' },
  auto: { label: 'AUTO', colorScheme: 'purple' },
  'copy-leader': { label: 'LEADER', colorScheme: 'green' },
  'copy-follower': { label: 'FOLLOWING', colorScheme: 'yellow' },
};

// Visual style config per mode
const getModeStyles = (mode, isActive, hasActiveStrategy) => {
  switch (mode) {
    case 'auto':
      return {
        borderColor: 'rgba(159, 122, 234, 0.25)',
        bgColor: 'rgba(255, 255, 255, 0.02)',
        accentStripe: hasActiveStrategy ? 'rgba(159, 122, 234, 0.6)' : 'rgba(159, 122, 234, 0.3)',
        hoverBg: 'rgba(159, 122, 234, 0.06)',
        boxShadow: 'none',
        opacity: 1,
        cursor: 'default',
        clickable: false,
      };
    case 'copy-leader':
      return {
        borderColor: 'rgba(72, 187, 120, 0.4)',
        bgColor: 'rgba(72, 187, 120, 0.06)',
        accentStripe: 'rgba(72, 187, 120, 0.7)',
        hoverBg: 'rgba(72, 187, 120, 0.09)',
        boxShadow: '0 0 12px rgba(72, 187, 120, 0.15)',
        opacity: 1,
        cursor: 'default',
        clickable: false,
      };
    case 'copy-follower':
      return {
        borderColor: 'rgba(236, 201, 75, 0.3)',
        bgColor: 'rgba(236, 201, 75, 0.04)',
        accentStripe: 'rgba(236, 201, 75, 0.5)',
        hoverBg: 'rgba(236, 201, 75, 0.06)',
        boxShadow: 'none',
        opacity: 0.85,
        cursor: 'default',
        clickable: false,
      };
    default: // manual
      return {
        borderColor: isActive ? 'rgba(0, 198, 224, 0.4)' : 'rgba(255, 255, 255, 0.06)',
        bgColor: isActive ? 'rgba(0, 198, 224, 0.06)' : 'rgba(255, 255, 255, 0.02)',
        accentStripe: isActive ? 'rgba(0, 198, 224, 0.9)' : 'rgba(255, 255, 255, 0.12)',
        hoverBg: isActive ? 'rgba(0, 198, 224, 0.09)' : 'rgba(255, 255, 255, 0.06)',
        boxShadow: isActive ? '0 0 12px rgba(0, 198, 224, 0.15)' : 'none',
        opacity: isActive ? 1 : 0.7,
        cursor: 'pointer',
        clickable: true,
      };
  }
};

/**
 * Compact 2-row account card with 4-mode rendering:
 *   MANUAL:    cyan badge, qty input, toggle on/off
 *   AUTO:      purple badge, strategy name (read-only)
 *   LEADER:    green badge, qty input, "Copying to N accts"
 *   FOLLOWING: yellow badge, "LeaderName (Nx)" (read-only)
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
  // Copy trading props
  copyInfo,
  onCopyMyTrades,
  onEditCopySettings,
  onStopCopying,
  onPauseCopying,
}) => {
  const isAuto = mode === 'auto';
  const isLeader = mode === 'copy-leader';
  const isFollower = mode === 'copy-follower';
  const isManual = mode === 'manual';
  const isIB = account.broker_id === 'interactivebrokers';

  const balance = realtimeData?.balance ?? account.balance ?? 0;
  const openPnL = useMemo(
    () => (positions || []).reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0),
    [positions]
  );
  const dayPnL = realtimeData?.dayRealizedPnL ?? 0;

  const primaryStrategy = strategies?.[0];
  const hasActiveStrategy = strategies?.length > 0;

  const styles = getModeStyles(mode, isActive, hasActiveStrategy);
  const badgeConfig = MODE_BADGE[mode] || MODE_BADGE.manual;

  return (
    <Box
      position="relative"
      bg={styles.bgColor}
      border="1px solid"
      borderColor={styles.borderColor}
      borderRadius="lg"
      pl={5}
      pr={2}
      py={2}
      transition="all 0.2s ease"
      opacity={styles.opacity}
      cursor={styles.cursor}
      onClick={styles.clickable ? onToggle : undefined}
      _hover={
        styles.clickable
          ? {
              bg: styles.hoverBg,
              opacity: 1,
              borderColor: isActive
                ? 'rgba(0, 198, 224, 0.5)'
                : 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-1px)',
            }
          : { bg: styles.hoverBg }
      }
      _active={
        styles.clickable
          ? { transform: 'translateY(0px)', transition: 'transform 0.05s' }
          : {}
      }
      boxShadow={styles.boxShadow}
    >
      {/* Left accent stripe */}
      <Box
        position="absolute"
        left={0}
        top="6px"
        bottom="6px"
        w="3px"
        borderRadius="full"
        bg={styles.accentStripe}
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
            colorScheme={badgeConfig.colorScheme}
            textTransform="uppercase"
            letterSpacing="wider"
            flexShrink={0}
          >
            {badgeConfig.label}
          </Badge>
        </HStack>

        <AccountOptionsMenu
          account={account}
          mode={mode}
          isIB={isIB}
          onEditName={onEditName}
          onDelete={onDelete}
          onPowerToggle={onPowerToggle}
          onRestart={onRestart}
          onCopyMyTrades={onCopyMyTrades}
          onEditCopySettings={onEditCopySettings}
          onStopCopying={onStopCopying}
          onPauseCopying={onPauseCopying}
        />
      </Flex>

      {/* Row 2: Metrics + mode-specific controls */}
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
        ) : isLeader ? (
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
                    borderColor: 'rgba(72, 187, 120, 0.6)',
                    boxShadow: '0 0 0 1px rgba(72, 187, 120, 0.6)',
                  }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                  <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                </NumberInputStepper>
              </NumberInput>
            </HStack>
            <Text fontSize="xs" color="green.300" fontWeight="medium" whiteSpace="nowrap">
              {copyInfo?.followerCount
                ? `Copying to ${copyInfo.followerCount} acct${copyInfo.followerCount !== 1 ? 's' : ''}`
                : 'Leader'}
            </Text>
          </HStack>
        ) : isFollower ? (
          <HStack spacing={1} minW={0} justify="flex-end">
            <Text fontSize="xs" color="yellow.300" fontWeight="medium" noOfLines={1}>
              &larr; {copyInfo?.leaderName || 'Leader'} ({copyInfo?.ratio || 1}x)
            </Text>
          </HStack>
        ) : (
          // Manual mode
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

/** Shared options menu with mode-aware items */
const AccountOptionsMenu = memo(
  ({
    account,
    mode,
    isIB,
    onEditName,
    onDelete,
    onPowerToggle,
    onRestart,
    onCopyMyTrades,
    onEditCopySettings,
    onStopCopying,
    onPauseCopying,
  }) => {
    const getPowerLabel = () => {
      const status = account.digital_ocean_status || account.status;
      return status === 'running' ? 'Power Off' : 'Power On';
    };

    const isManual = mode === 'manual';
    const isLeader = mode === 'copy-leader';
    const isFollower = mode === 'copy-follower';

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
          minW="160px"
        >
          {/* Common: Edit Name */}
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

          {/* Manual mode: Copy My Trades option */}
          {isManual && onCopyMyTrades && (
            <MenuItem
              fontSize="sm"
              icon={<Copy size={14} />}
              onClick={(e) => { e.stopPropagation(); onCopyMyTrades(account); }}
              _hover={{ bg: 'whiteAlpha.100' }}
              bg="transparent"
              color="green.300"
            >
              Copy My Trades
            </MenuItem>
          )}

          {/* Leader mode options */}
          {isLeader && (
            <>
              <MenuDivider borderColor="whiteAlpha.100" />
              {onEditCopySettings && (
                <MenuItem
                  fontSize="sm"
                  icon={<Settings size={14} />}
                  onClick={(e) => { e.stopPropagation(); onEditCopySettings(account); }}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  bg="transparent"
                  color="white"
                >
                  Edit Copy Settings
                </MenuItem>
              )}
              {onStopCopying && (
                <MenuItem
                  fontSize="sm"
                  icon={<X size={14} />}
                  onClick={(e) => { e.stopPropagation(); onStopCopying(account); }}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  bg="transparent"
                  color="red.300"
                >
                  Stop Copying
                </MenuItem>
              )}
            </>
          )}

          {/* Follower mode options */}
          {isFollower && onPauseCopying && (
            <>
              <MenuDivider borderColor="whiteAlpha.100" />
              <MenuItem
                fontSize="sm"
                icon={<Pause size={14} />}
                onClick={(e) => { e.stopPropagation(); onPauseCopying(account); }}
                _hover={{ bg: 'whiteAlpha.100' }}
                bg="transparent"
                color="yellow.300"
              >
                Pause Copying
              </MenuItem>
            </>
          )}

          {/* IB-specific options */}
          {isIB && (
            <>
              <MenuDivider borderColor="whiteAlpha.100" />
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

          {/* Common: Delete */}
          <MenuDivider borderColor="whiteAlpha.100" />
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
