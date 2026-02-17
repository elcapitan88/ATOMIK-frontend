import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Tooltip,
  Badge,
  Collapse,
  useDisclosure,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp, Info, Copy } from 'lucide-react';

const formatBrokerName = (brokerId) => {
  const names = {
    tradovate: 'Tradovate',
    interactivebrokers: 'IBKR',
    binance: 'Binance',
    polymarket: 'Polymarket',
  };
  return names[brokerId] || brokerId;
};

/**
 * CopyTradingModal - Setup or edit a copy trading group.
 *
 * Props:
 *   isOpen              - modal visibility
 *   onClose             - close handler
 *   leaderAccount       - the account selected as leader
 *   accounts            - all connected broker accounts
 *   strategyBoundAccountIds - Set of account IDs bound to strategies (AUTO mode)
 *   copyFollowerAccountIds  - Set of account IDs already following in another group
 *   copyLeaderAccountIds    - Set of account IDs already leading a group
 *   copyTrading         - the useCopyTrading hook return value (for mutations)
 *   existingGroup       - if editing, the existing CopyGroup object
 */
const CopyTradingModal = ({
  isOpen,
  onClose,
  leaderAccount,
  accounts = [],
  strategyBoundAccountIds = new Set(),
  copyFollowerAccountIds = new Set(),
  copyLeaderAccountIds = new Set(),
  copyTrading,
  existingGroup = null,
}) => {
  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure();

  // Build initial follower state
  const availableAccounts = useMemo(() => {
    if (!leaderAccount) return [];
    return accounts.filter(
      (a) => String(a.account_id) !== String(leaderAccount.account_id)
    );
  }, [accounts, leaderAccount]);

  // Initialize selected followers from existing group or empty
  const [selectedFollowers, setSelectedFollowers] = useState(() => {
    const map = {};
    if (existingGroup) {
      existingGroup.followers.forEach((f) => {
        map[String(f.follower_account_id)] = { checked: f.is_active, ratio: f.ratio };
      });
    }
    return map;
  });

  // Advanced settings
  const [followerProtection, setFollowerProtection] = useState(
    existingGroup?.follower_protection ?? true
  );
  const [copyBrackets, setCopyBrackets] = useState(
    existingGroup?.copy_brackets ?? false
  );
  const [symbolInput, setSymbolInput] = useState('');
  const [allowedSymbols, setAllowedSymbols] = useState(
    existingGroup?.allowed_symbols || []
  );

  const isEditing = !!existingGroup;

  const handleCheckFollower = (accountId, checked) => {
    setSelectedFollowers((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], checked, ratio: prev[accountId]?.ratio || 1.0 },
    }));
  };

  const handleRatioChange = (accountId, ratio) => {
    setSelectedFollowers((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], ratio: parseFloat(ratio) || 1.0 },
    }));
  };

  const handleAddSymbol = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (sym && !allowedSymbols.includes(sym)) {
      setAllowedSymbols((prev) => [...prev, sym]);
    }
    setSymbolInput('');
  };

  const handleRemoveSymbol = (sym) => {
    setAllowedSymbols((prev) => prev.filter((s) => s !== sym));
  };

  const handleSymbolKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSymbol();
    }
  };

  const selectedCount = Object.values(selectedFollowers).filter((f) => f.checked).length;

  const handleSubmit = () => {
    const followers = Object.entries(selectedFollowers)
      .filter(([, val]) => val.checked)
      .map(([accountId, val]) => ({
        follower_account_id: accountId,
        ratio: val.ratio,
      }));

    if (followers.length === 0) return;

    const leaderName = leaderAccount.nickname || leaderAccount.name || leaderAccount.account_id;

    const payload = {
      leader_account_id: String(leaderAccount.account_id),
      name: `${leaderName} Copy Group`,
      copy_brackets: copyBrackets,
      follower_protection: followerProtection,
      allowed_symbols: allowedSymbols.length > 0 ? allowedSymbols : null,
      followers,
    };

    copyTrading.createGroup.mutate(payload, {
      onSuccess: () => onClose(),
    });
  };

  if (!leaderAccount) return null;

  const leaderName = leaderAccount.nickname || leaderAccount.name || leaderAccount.account_id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(10px)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
        mx={{ base: 4, md: 0 }}
        maxH={{ base: 'calc(100vh - 2rem)', md: '90vh' }}
        overflow="hidden"
      >
        {/* Header */}
        <ModalHeader
          bg="rgba(0, 0, 0, 0.3)"
          mx={-6}
          mt={-6}
          px={6}
          pt={6}
          pb={4}
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        >
          <HStack spacing={2}>
            <Copy size={18} />
            <Text fontSize="lg" fontWeight="bold">
              {isEditing ? 'Edit Copy Trading' : 'Copy My Trades'}
            </Text>
          </HStack>
          <Text fontSize="sm" color="whiteAlpha.600" mt={1}>
            Leader: {leaderName}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        {/* Body */}
        <ModalBody py={4} overflowY="auto">
          <VStack spacing={4} align="stretch">
            {/* Account Selection */}
            <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.800">
              Select accounts to copy to:
            </Text>

            <VStack spacing={2} align="stretch">
              {availableAccounts.map((account) => {
                const aid = String(account.account_id);
                const isStrategyBound = strategyBoundAccountIds.has(aid);
                const isAlreadyFollowing =
                  copyFollowerAccountIds.has(aid) &&
                  (!existingGroup || !existingGroup.followers.some(
                    (f) => String(f.follower_account_id) === aid
                  ));
                const isAlreadyLeader = copyLeaderAccountIds.has(aid);
                const isDisabled = isStrategyBound || isAlreadyFollowing || isAlreadyLeader;

                let disabledReason = '';
                if (isStrategyBound) disabledReason = 'Bound to auto strategy';
                else if (isAlreadyFollowing) disabledReason = 'Already following another leader';
                else if (isAlreadyLeader) disabledReason = 'Already a leader in another group';

                const isChecked = selectedFollowers[aid]?.checked || false;
                const ratio = selectedFollowers[aid]?.ratio || 1.0;

                return (
                  <Tooltip
                    key={aid}
                    label={disabledReason}
                    isDisabled={!isDisabled}
                    fontSize="xs"
                    hasArrow
                  >
                    <Flex
                      align="center"
                      justify="space-between"
                      bg={isChecked ? 'whiteAlpha.100' : 'whiteAlpha.50'}
                      borderRadius="md"
                      px={3}
                      py={2}
                      opacity={isDisabled ? 0.4 : 1}
                      cursor={isDisabled ? 'not-allowed' : 'pointer'}
                      _hover={isDisabled ? {} : { bg: 'whiteAlpha.100' }}
                      transition="all 0.15s ease"
                      onClick={() => {
                        if (!isDisabled) handleCheckFollower(aid, !isChecked);
                      }}
                    >
                      <HStack spacing={3} flex="1" minW={0}>
                        <Checkbox
                          isChecked={isChecked}
                          isDisabled={isDisabled}
                          colorScheme="green"
                          size="md"
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) handleCheckFollower(aid, e.target.checked);
                          }}
                        />
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {account.nickname || account.name || aid}
                          </Text>
                          <Text fontSize="xs" color="whiteAlpha.500">
                            {formatBrokerName(account.broker_id)}
                            {isDisabled && ` - ${disabledReason}`}
                          </Text>
                        </Box>
                      </HStack>

                      {/* Ratio input */}
                      {!isDisabled && (
                        <HStack spacing={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
                          <Text fontSize="xs" color="whiteAlpha.500">
                            Ratio
                          </Text>
                          <NumberInput
                            size="xs"
                            value={ratio}
                            min={0.5}
                            max={10}
                            step={0.5}
                            w="60px"
                            onChange={(_, val) => handleRatioChange(aid, val)}
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
                      )}
                    </Flex>
                  </Tooltip>
                );
              })}

              {availableAccounts.length === 0 && (
                <Flex justify="center" py={4}>
                  <Text fontSize="sm" color="whiteAlpha.400">
                    No other accounts available to follow.
                  </Text>
                </Flex>
              )}
            </VStack>

            {/* Info box */}
            <Flex
              bg="rgba(72, 187, 120, 0.1)"
              border="1px solid rgba(72, 187, 120, 0.2)"
              borderRadius="md"
              px={3}
              py={2.5}
              align="flex-start"
              gap={2}
            >
              <Info size={16} style={{ marginTop: 2, flexShrink: 0, color: 'rgba(72, 187, 120, 0.8)' }} />
              <Text fontSize="xs" color="whiteAlpha.700" lineHeight="tall">
                Trades you make on <Text as="span" fontWeight="bold" color="green.300">{leaderName}</Text> will
                be automatically placed on selected accounts. Works even when this dashboard is closed.
              </Text>
            </Flex>

            {/* Advanced Settings */}
            <Box>
              <Button
                variant="ghost"
                size="sm"
                color="whiteAlpha.600"
                fontWeight="normal"
                px={0}
                _hover={{ color: 'white', bg: 'transparent' }}
                onClick={onAdvancedToggle}
                rightIcon={isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              >
                Advanced Settings
              </Button>

              <Collapse in={isAdvancedOpen} animateOpacity>
                <VStack spacing={3} align="stretch" pt={2} pl={1}>
                  <Flex align="center" justify="space-between">
                    <VStack spacing={0} align="flex-start">
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Follower Protection
                      </Text>
                      <Text fontSize="xs" color="whiteAlpha.500">
                        Auto-flatten followers when leader goes flat
                      </Text>
                    </VStack>
                    <Switch
                      size="sm"
                      colorScheme="green"
                      isChecked={followerProtection}
                      onChange={(e) => setFollowerProtection(e.target.checked)}
                    />
                  </Flex>

                  <Flex align="center" justify="space-between">
                    <VStack spacing={0} align="flex-start">
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Copy Bracket Orders
                      </Text>
                      <Text fontSize="xs" color="whiteAlpha.500">
                        Copy TP/SL orders to followers
                      </Text>
                    </VStack>
                    <Switch
                      size="sm"
                      colorScheme="green"
                      isChecked={copyBrackets}
                      onChange={(e) => setCopyBrackets(e.target.checked)}
                    />
                  </Flex>

                  <Box>
                    <Text fontSize="sm" color="whiteAlpha.800" mb={1}>
                      Allowed Symbols
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.500" mb={2}>
                      Leave empty to copy all symbols
                    </Text>
                    <HStack>
                      <Input
                        size="xs"
                        placeholder="e.g. NQ, ES"
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value)}
                        onKeyDown={handleSymbolKeyDown}
                        bg="whiteAlpha.100"
                        borderColor="whiteAlpha.200"
                        _focus={{ borderColor: 'green.400' }}
                        w="120px"
                      />
                      <Button size="xs" colorScheme="green" variant="outline" onClick={handleAddSymbol}>
                        Add
                      </Button>
                    </HStack>
                    {allowedSymbols.length > 0 && (
                      <Wrap mt={2} spacing={1}>
                        {allowedSymbols.map((sym) => (
                          <WrapItem key={sym}>
                            <Tag size="sm" colorScheme="green" variant="subtle">
                              <TagLabel>{sym}</TagLabel>
                              <TagCloseButton onClick={() => handleRemoveSymbol(sym)} />
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    )}
                  </Box>
                </VStack>
              </Collapse>
            </Box>
          </VStack>
        </ModalBody>

        {/* Footer */}
        <ModalFooter borderTop="1px solid rgba(255, 255, 255, 0.1)" gap={2}>
          <Button
            variant="ghost"
            size="sm"
            color="whiteAlpha.600"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            bg="rgba(72, 187, 120, 0.8)"
            color="white"
            _hover={{ bg: 'rgba(72, 187, 120, 1)' }}
            _active={{ bg: 'rgba(72, 187, 120, 0.6)' }}
            isDisabled={selectedCount === 0}
            isLoading={copyTrading.createGroup.isPending}
            onClick={handleSubmit}
          >
            {isEditing ? 'Save Changes' : `Start Copying (${selectedCount})`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CopyTradingModal;
