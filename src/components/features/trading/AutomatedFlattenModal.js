import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Box,
  Flex,
  Text,
  Button,
  Checkbox,
  HStack,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

/**
 * AutomatedFlattenModal — appears after manual flatten when automated
 * positions remain open. Lets user select which to close & deactivate.
 *
 * Props:
 *   isOpen              - modal visibility
 *   onClose             - dismiss handler
 *   automatedPositions  - array of positions on strategy-bound accounts
 *   automatedOrders     - array of working orders on strategy-bound accounts
 *   getAccountStrategies - fn(accountId) => array of strategies on that account
 *   manualResults       - { flatOk, flatFail, cancelOk, cancelFail } from manual step
 *   flattenMode         - 'flattenAndCancel' | 'flattenOnly' | 'cancelOnly'
 *   onComplete          - callback after automated close finishes
 */
const AutomatedFlattenModal = ({
  isOpen,
  onClose,
  automatedPositions = [],
  automatedOrders = [],
  getAccountStrategies,
  manualResults,
  flattenMode = 'flattenAndCancel',
  onComplete,
}) => {
  const toast = useToast();
  const [selected, setSelected] = useState(() => new Set(automatedPositions.map((_, i) => i)));
  const [isClosing, setIsClosing] = useState(false);

  const allSelected = selected.size === automatedPositions.length && automatedPositions.length > 0;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(automatedPositions.map((_, i) => i)));
    }
  }, [allSelected, automatedPositions]);

  const toggleOne = useCallback((idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // Get strategy name for an account
  const getStrategyName = useCallback(
    (accountId) => {
      if (!getAccountStrategies) return 'Strategy';
      const strats = getAccountStrategies(accountId);
      if (strats.length === 0) return 'Strategy';
      if (strats.length === 1) return strats[0].ticker || strats[0].strategy_type || 'Strategy';
      return `${strats.length} strategies`;
    },
    [getAccountStrategies]
  );

  // Deduplicate accounts for display (one account may have multiple positions)
  const accountSummary = useMemo(() => {
    const map = new Map();
    automatedPositions.forEach((pos, idx) => {
      const aid = pos._accountId || pos.accountId;
      if (!map.has(aid)) {
        map.set(aid, {
          accountId: aid,
          nickname: pos._accountNickname || aid,
          positions: [],
          indices: [],
        });
      }
      map.get(aid).positions.push(pos);
      map.get(aid).indices.push(idx);
    });
    return Array.from(map.values());
  }, [automatedPositions]);

  const handleClose = useCallback(async () => {
    if (selected.size === 0) {
      onClose();
      return;
    }

    setIsClosing(true);
    try {
      const selectedPositions = automatedPositions.filter((_, i) => selected.has(i));

      // Close positions with force_close
      const positionResults = await Promise.all(
        selectedPositions.map(async (pos) => {
          const accountId = pos._accountId || pos.accountId;
          if (!accountId) return { success: false, error: 'Missing account info' };
          const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
          const qty = pos.quantity || Math.abs(pos.netPos || 0);
          try {
            await axiosInstance.post(
              `/api/v1/brokers/accounts/${accountId}/discretionary/orders`,
              { symbol: pos.symbol, side: closeSide, type: 'MARKET', quantity: qty, time_in_force: 'IOC', force_close: true }
            );
            return { success: true };
          } catch (err) {
            return { success: false, error: err.response?.data?.detail || err.message };
          }
        })
      );

      // Cancel automated orders if mode includes cancel
      let orderResults = [];
      if (flattenMode !== 'flattenOnly' && automatedOrders.length > 0) {
        // Cancel orders on accounts that were selected for flatten
        const selectedAccountIds = new Set(selectedPositions.map((p) => p._accountId || p.accountId));
        const ordersToCancel = automatedOrders.filter((o) => selectedAccountIds.has(o._accountId || o.accountId));

        orderResults = await Promise.all(
          ordersToCancel.map(async (ord) => {
            const accountId = ord._accountId || ord.accountId;
            try {
              await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}/orders/${ord.orderId}`);
              return { success: true };
            } catch (err) {
              return { success: false, error: err.response?.data?.detail || err.message };
            }
          })
        );
      }

      const autoFlatOk = positionResults.filter((r) => r.success).length;
      const autoFlatFail = positionResults.filter((r) => !r.success).length;
      const autoCancelOk = orderResults.filter((r) => r.success).length;

      // Build combined toast with manual + automated results
      const parts = [];
      const manualFlatOk = manualResults?.flatOk || 0;
      const manualCancelOk = manualResults?.cancelOk || 0;
      const totalFlat = manualFlatOk + autoFlatOk;
      const totalCancel = manualCancelOk + autoCancelOk;
      const totalFail = (manualResults?.flatFail || 0) + (manualResults?.cancelFail || 0) + autoFlatFail;

      if (totalFlat > 0) parts.push(`${totalFlat} position${totalFlat !== 1 ? 's' : ''} closed`);
      if (totalCancel > 0) parts.push(`${totalCancel} order${totalCancel !== 1 ? 's' : ''} cancelled`);
      if (autoFlatOk > 0) parts.push(`${autoFlatOk} strateg${autoFlatOk !== 1 ? 'ies' : 'y'} deactivated`);

      if (totalFail === 0) {
        toast({ title: parts.join(', ') || 'Done', status: 'success', duration: 4000 });
      } else {
        toast({ title: `${parts.join(', ')}. ${totalFail} failed.`, status: 'warning', duration: 5000, isClosable: true });
      }

      onComplete?.();
      onClose();
    } catch (err) {
      toast({ title: 'Failed to close automated positions', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsClosing(false);
    }
  }, [selected, automatedPositions, automatedOrders, flattenMode, manualResults, toast, onClose, onComplete]);

  const handleSkip = useCallback(() => {
    // Show toast for manual results only
    const parts = [];
    const flatOk = manualResults?.flatOk || 0;
    const cancelOk = manualResults?.cancelOk || 0;
    const failTotal = (manualResults?.flatFail || 0) + (manualResults?.cancelFail || 0);

    if (flatOk > 0) parts.push(`${flatOk} position${flatOk !== 1 ? 's' : ''} closed`);
    if (cancelOk > 0) parts.push(`${cancelOk} order${cancelOk !== 1 ? 's' : ''} cancelled`);

    const autoCount = automatedPositions.length;
    if (autoCount > 0) parts.push(`${autoCount} automated skipped`);

    if (failTotal === 0) {
      toast({ title: parts.join(', ') || 'Done', status: 'success', duration: 3000 });
    } else {
      toast({ title: `${parts.join(', ')}. ${failTotal} failed.`, status: 'warning', duration: 4000, isClosable: true });
    }

    onClose();
  }, [manualResults, automatedPositions, toast, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} isCentered size={{ base: 'full', md: 'md' }}>
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        bg="rgba(20, 20, 25, 0.95)"
        backdropFilter="blur(20px)"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius={{ base: 0, md: 'xl' }}
        maxH={{ base: '100vh', md: '80vh' }}
      >
        <ModalHeader
          bg="rgba(0, 0, 0, 0.3)"
          mx={-6}
          mt={-6}
          px={6}
          pt={6}
          pb={4}
          borderTopRadius={{ base: 0, md: 'xl' }}
        >
          <HStack spacing={2}>
            <AlertTriangle size={18} color="#F6AD55" />
            <Text fontSize="md" fontWeight="semibold" color="white">
              Automated Positions Still Open
            </Text>
          </HStack>
          <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
            Closing these will deactivate their associated strategies
          </Text>
        </ModalHeader>

        <ModalBody px={6} py={4} overflowY="auto">
          {/* Select All */}
          <Flex justify="space-between" align="center" mb={3}>
            <Checkbox
              size="sm"
              colorScheme="orange"
              isChecked={allSelected}
              isIndeterminate={selected.size > 0 && !allSelected}
              onChange={toggleAll}
            >
              <Text fontSize="xs" color="whiteAlpha.700">
                Select All ({automatedPositions.length})
              </Text>
            </Checkbox>
          </Flex>

          {/* Account groups */}
          {accountSummary.map((acct) => (
            <Box
              key={acct.accountId}
              bg="whiteAlpha.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              p={3}
              mb={2}
            >
              <Text fontSize="xs" color="whiteAlpha.500" mb={2}>
                {acct.nickname}
              </Text>
              {acct.positions.map((pos, posIdx) => {
                const globalIdx = acct.indices[posIdx];
                const isSelected = selected.has(globalIdx);
                const stratName = getStrategyName(acct.accountId);
                return (
                  <Flex
                    key={globalIdx}
                    align="center"
                    justify="space-between"
                    py={1.5}
                    borderTop={posIdx > 0 ? '1px solid' : 'none'}
                    borderColor="whiteAlpha.100"
                  >
                    <Checkbox
                      size="sm"
                      colorScheme="orange"
                      isChecked={isSelected}
                      onChange={() => toggleOne(globalIdx)}
                    >
                      <HStack spacing={2} ml={1}>
                        <Badge
                          bg={pos.side === 'LONG' ? 'rgba(38, 166, 154, 0.2)' : 'rgba(239, 83, 80, 0.2)'}
                          color={pos.side === 'LONG' ? 'green.300' : 'red.300'}
                          fontSize="xs"
                          px={1.5}
                          borderRadius="sm"
                        >
                          {pos.side === 'LONG' ? 'LONG' : 'SHORT'}
                        </Badge>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          {pos.symbol}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.600">
                          x{pos.quantity || Math.abs(pos.netPos || 0)}
                        </Text>
                      </HStack>
                    </Checkbox>
                    <Badge
                      bg="whiteAlpha.100"
                      color="whiteAlpha.600"
                      fontSize="2xs"
                      px={1.5}
                      borderRadius="sm"
                    >
                      {stratName}
                    </Badge>
                  </Flex>
                );
              })}
            </Box>
          ))}
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          px={6}
          py={3}
          gap={2}
        >
          <Button
            size="sm"
            variant="ghost"
            color="whiteAlpha.700"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={handleSkip}
            isDisabled={isClosing}
          >
            Skip
          </Button>
          <Button
            size="sm"
            bg="rgba(239, 83, 80, 0.8)"
            color="white"
            _hover={{ bg: 'rgba(239, 83, 80, 1)' }}
            _active={{ bg: 'rgba(239, 83, 80, 0.6)' }}
            onClick={handleClose}
            isLoading={isClosing}
            isDisabled={selected.size === 0}
          >
            Close & Deactivate ({selected.size})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default memo(AutomatedFlattenModal);
